# main.py  – rulează cu:  python -m uvicorn main:app --reload
from typing import List, Optional
from enum import Enum as PyEnum
from sqlalchemy import Enum as SAEnum
from sqlalchemy import or_
from sqlalchemy import and_

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from pydantic_settings import BaseSettings
from sqlalchemy import Column, Integer, String, ForeignKey, create_engine, UniqueConstraint, Table
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from fastapi.middleware.cors import CORSMiddleware

# --------------------------------------------------------------------
# 1) Config
# --------------------------------------------------------------------
class Settings(BaseSettings):
    DATABASE_URL: str
    vite_api_url: Optional[str] = None  # Adăugat pentru a rezolva eroarea

    class Config:
        env_file = ".env"

settings = Settings()

# --------------------------------------------------------------------
# 2) SQLAlchemy set‑up
# --------------------------------------------------------------------
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

supplier_category = Table(                   # table punte
    "supplier_category",
    Base.metadata,
    Column("supplier_id", ForeignKey("suppliers.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("categories.id"), primary_key=True),
)

# --------------------------------------------------------------------
# 3) Modele BD (agencies, suppliers, contacts)
# --------------------------------------------------------------------

class SupplierType(PyEnum):
    MATERIAL = "material"
    SERVICE  = "service"

class Offering(Base):
     __tablename__ = "offerings"
     id          = Column(Integer, primary_key=True)
     supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
     name        = Column(String(150), nullable=False)

     supplier = relationship("Supplier", back_populates="offerings")

class Agency(Base):
    __tablename__ = "agencies"
    id   = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)

    suppliers = relationship("Supplier", back_populates="agency")

class Category(Base):              # ② MODEL cu 'type'
    __tablename__ = "categories"
    id   = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    type = Column(SAEnum(SupplierType), nullable=False)   # ← NEW

    __table_args__ = (
        UniqueConstraint("name", "type"),                 # unic pe (nume, tip)
    )

    suppliers = relationship(
        "Supplier",
        secondary=supplier_category,
        back_populates="categories",
    )

class Supplier(Base):
    __tablename__ = "suppliers"
    id           = Column(Integer, primary_key=True)
    agency_id    = Column(Integer, ForeignKey("agencies.id"), nullable=False)
    name         = Column(String(150), nullable=False)
    office_email = Column(String(150))
    office_phone = Column(String(50))

    agency   = relationship("Agency", back_populates="suppliers")
    contacts = relationship("Contact", back_populates="supplier",
                            cascade="all, delete-orphan")

    categories = relationship(
        "Category",
        secondary=supplier_category,
        passive_deletes=True,
    )

    @property
    def category_ids(self) -> list[int]:
        """Lista id‑urilor de categorii asociate – folosită de SupplierOut."""
        return [c.id for c in self.categories]

    offerings = relationship(
        "Offering",
        back_populates="supplier",
        cascade="all, delete-orphan",
    )

class Contact(Base):
    __tablename__ = "contacts"
    id          = Column(Integer, primary_key=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    full_name   = Column(String(100), nullable=False)
    email       = Column(String(150))
    phone       = Column(String(50))

    supplier = relationship("Supplier", back_populates="contacts")

# --------------------------------------------------------------------
# 4) Pydantic schemă
# --------------------------------------------------------------------
class AgencyIn(BaseModel):
    name: str

class AgencyOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}

class OfferingIn(BaseModel):
    name: str

class OfferingOut(OfferingIn):
    id: int
    model_config = {"from_attributes": True}

class CategoryIn(BaseModel):
    name: str
    type: SupplierType

class CategoryOut(CategoryIn):
    id: int
    model_config = {"from_attributes": True}

class ContactIn(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class SupplierIn(BaseModel):
    name: str
    category_ids: List[int]
    office_email: Optional[EmailStr] = None
    office_phone: Optional[str] = None
    contacts: List[ContactIn] = []
    offerings: List[OfferingIn] = []

class SupplierOut(SupplierIn):
    id: int
    agency_id: int
    contacts: List[ContactIn]
    offerings: List[OfferingOut]
    model_config = {"from_attributes": True}

# --------------------------------------------------------------------
# 5) FastAPI
# --------------------------------------------------------------------
app = FastAPI(title="Furnizori API – single file")

# ­­­­­­­­­­­­­­­­­ CORS ­­­­­­­­­­­­­­­­­
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)

# ---------------- Agenții (card‑uri UI) -----------------------------
@app.get("/agencies", response_model=list[AgencyOut])
def list_agencies(db: Session = Depends(get_db)):
    return db.query(Agency).order_by(Agency.name).all()

@app.post("/agencies", response_model=AgencyOut, status_code=201)
def create_agency(a: AgencyIn, db: Session = Depends(get_db)):
    # nu permitem duplicate după nume
    if db.query(Agency).filter_by(name=a.name).first():
        raise HTTPException(400, "Agency already exists")
    ag = Agency(name=a.name)
    db.add(ag)
    db.commit()
    db.refresh(ag)
    return ag

# ------------ categorii disponibile într-o agenție -----------------
@app.get("/agencies/{agency_id}/{sup_type}/categories", response_model=list[CategoryOut])
def cats_by_type(agency_id: int, sup_type: SupplierType, db: Session = Depends(get_db)):
    return (
        db.query(Category)
          # 1) legăm puntea
          .outerjoin(
             supplier_category,
             Category.id == supplier_category.c.category_id
          )
          # 2) legăm doar furnizorii din agenția curentă
          .outerjoin(
             Supplier,
             and_(
               Supplier.id == supplier_category.c.supplier_id,
               Supplier.agency_id == agency_id
             )
          )
          # 3) filtrăm doar după tip – fără WHERE pe agency_id!
          .filter(Category.type == sup_type)
          .distinct()
          .order_by(Category.name)
          .all()
    )

@app.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(c: CategoryIn, db: Session = Depends(get_db)):
    if db.query(Category).filter_by(name=c.name, type=c.type).first():
        raise HTTPException(400, "Category exists")
    cat = Category(name=c.name, type=c.type)
    db.add(cat); db.commit(); db.refresh(cat)
    return cat

# ----------- furnizorii dintr-o categorie & agenție -----------------
@app.get(
    "/agencies/{agency_id}/categories/{cat_id}/suppliers",
    response_model=list[SupplierOut],
)
def suppliers_by_category(
    agency_id: int,
    cat_id: int,
    db: Session = Depends(get_db)
):
    return (
        db.query(Supplier)
           .join(                             # JOIN pe tabela punte
              supplier_category,
              Supplier.id == supplier_category.c.supplier_id
          ).filter(
              Supplier.agency_id == agency_id,
              supplier_category.c.category_id == cat_id
          )
          .order_by(Supplier.name)
          .all()
    )

# --------------- Furnizori pe agenție -------------------------------
@app.get("/agencies/{agency_id}/suppliers", response_model=list[SupplierOut])
def suppliers_by_agency(agency_id: int, db: Session = Depends(get_db)):
    return (db.query(Supplier)
              .filter(Supplier.agency_id == agency_id)
              .order_by(Supplier.name)
              .all())

@app.post("/agencies/{agency_id}/suppliers", response_model=SupplierOut)
def add_supplier_for_agency(
    agency_id: int,
    s: SupplierIn,
    db: Session = Depends(get_db)
):
    if not db.get(Agency, agency_id):
        raise HTTPException(404, "Agency not found")

    sp = Supplier(
        agency_id = agency_id,
        name      = s.name,
        office_email = s.office_email,
        office_phone = s.office_phone,
    )
    # mapăm categoriile
    cats = db.query(Category).filter(Category.id.in_(s.category_ids)).all()
    if len(cats) != len(s.category_ids):
        raise HTTPException(400, "One or more category_ids are invalid")
    sp.categories = cats
    db.add(sp); db.commit(); db.refresh(sp)

    for c in s.contacts:
        # Use model_dump() for Pydantic v2 compatibility
        contact_data = c.dict() if hasattr(c, 'dict') else c.__dict__
        db.add(Contact(**contact_data, supplier_id=sp.id))
    
    for off in s.offerings:
        # Use model_dump() for Pydantic v2 compatibility
        offering_data = off.dict() if hasattr(off, 'dict') else off.__dict__
        db.add(Offering(**offering_data, supplier=sp))
    
    db.commit()
    db.refresh(sp)
    return sp

# ----------- editare / ștergere furnizor ----------------------------
@app.put("/suppliers/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    s: SupplierIn,
    db: Session = Depends(get_db)
):
    sp = db.get(Supplier, supplier_id)
    if not sp:
        raise HTTPException(404, "Supplier not found")

    for key, val in s.dict(exclude={"contacts", "category_ids", "offerings"}).items():
         setattr(sp, key, val)

    # rescriem categoriile
    cats = db.query(Category).filter(Category.id.in_(s.category_ids)).all()
    if len(cats) != len(s.category_ids):
        raise HTTPException(400, "One or more category_ids are invalid")
    sp.categories = cats

    # rescriem contactele
    db.query(Contact).filter_by(supplier_id=sp.id).delete()
    for c in s.contacts:
        contact_data = c.dict() if hasattr(c, 'dict') else c.__dict__
        db.add(Contact(**contact_data, supplier_id=sp.id))
    
    # rescriem offerings
    db.query(Offering).filter_by(supplier_id=sp.id).delete()
    for off in s.offerings:
        offering_data = off.dict() if hasattr(off, 'dict') else off.__dict__
        db.add(Offering(**offering_data, supplier=sp))
    
    db.commit()
    db.refresh(sp)
    return sp

@app.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
     sp = db.get(Supplier, supplier_id)
     if not sp:
         raise HTTPException(404, "Supplier not found")

     # 1) Golește legăturile many-to-many
     sp.categories = []
     db.commit()

     # 2) Șterge obiectul Supplier
     db.delete(sp)
     db.commit()

@app.get("/suppliers/{supplier_id}/offerings", response_model=list[OfferingOut])
def list_offerings(supplier_id: int, db: Session = Depends(get_db)):
    return db.query(Offering).filter_by(supplier_id=supplier_id).all()
