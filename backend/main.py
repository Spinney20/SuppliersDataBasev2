# main.py  – rulează cu:  python -m uvicorn main:app --reload
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from pydantic_settings import BaseSettings
from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session

# --------------------------------------------------------------------
# 1) Config
# --------------------------------------------------------------------
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/furnizori_dev"

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

# --------------------------------------------------------------------
# 3) Modele BD (agencies, suppliers, contacts)
# --------------------------------------------------------------------
class Agency(Base):
    __tablename__ = "agencies"
    id   = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)

    suppliers = relationship("Supplier", back_populates="agency")

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

class ContactIn(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class SupplierIn(BaseModel):
    name: str
    office_email: Optional[EmailStr] = None
    office_phone: Optional[str] = None
    contacts: List[ContactIn] = []

class SupplierOut(SupplierIn):
    id: int
    agency_id: int
    contacts: List[ContactIn]

    model_config = {"from_attributes": True}

# --------------------------------------------------------------------
# 5) FastAPI
# --------------------------------------------------------------------
app = FastAPI(title="Furnizori API – single file")

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
        agency_id=agency_id,
        name=s.name,
        office_email=s.office_email,
        office_phone=s.office_phone,
    )
    db.add(sp)
    db.commit()
    db.refresh(sp)

    for c in s.contacts:
        db.add(Contact(**c.dict(), supplier_id=sp.id))
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

    for key, val in s.dict(exclude={"contacts"}).items():
        setattr(sp, key, val)

    db.query(Contact).filter_by(supplier_id=sp.id).delete()
    for c in s.contacts:
        db.add(Contact(**c.dict(), supplier_id=sp.id))
    db.commit()
    db.refresh(sp)
    return sp

@app.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    if not db.query(Supplier).filter_by(id=supplier_id).delete():
        raise HTTPException(404, "Supplier not found")
    db.commit()
