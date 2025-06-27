// src/pages/Agency.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  ButtonGroup,
  Button,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ConstructionIcon from '@mui/icons-material/Construction';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AddIcon from '@mui/icons-material/Add';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useCategories } from '../api/queries';

// Componente personalizate
import { ButtonContainer, ActionButton } from './agency_components/styles';
import CategoryBlock from './agency_components/CategoryBlock';
import AddSupplierDialog from './agency_components/AddSupplierDialog';
import AddCategoryDialog from './agency_components/AddCategoryDialog';

/* ────────────────────────────────────────────────────────── */
export default function Agency() {
  const { id }   = useParams();
  const agencyId = Number(id);

  /* -------------- state -------------- */
  const [type, setType]         = useState('material');
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState([]);
  const [showBack, setShowBack] = useState(false);

  /* dialogs */
  const [openAddCat,  setOpenAddCat]  = useState(false);
  const [openAddSupp, setOpenAddSupp] = useState(false);

  /* form Add Category */
  const [catName, setCatName] = useState('');

  /* form Add Supplier */
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    categories: [],
    contacts: [{ full_name: '', email: '', phone: '' }],
    offerings: []
  });

  // Funcții pentru actualizarea formularului de furnizor
  const updateSupplierField = useCallback((field, value) => {
    setSupplierForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateSupplierContact = useCallback((idx, key, val) => {
    setSupplierForm(prev => {
      const newContacts = [...prev.contacts];
      newContacts[idx] = {
        ...newContacts[idx],
        [key]: val
      };
      return {
        ...prev,
        contacts: newContacts
      };
    });
  }, []);

  const addSupplierContactRow = useCallback(() => {
    setSupplierForm(prev => ({
      ...prev,
      contacts: [...prev.contacts, { full_name: '', email: '', phone: '' }]
    }));
  }, []);

  const removeSupplierContactRow = useCallback((idx) => {
    setSupplierForm(prev => {
      if (prev.contacts.length === 1) return prev;
      return {
        ...prev,
        contacts: prev.contacts.filter((_, i) => i !== idx)
      };
    });
  }, []);

  const resetSupplierForm = useCallback(() => {
    setSupplierForm({
      name: '',
      email: '',
      phone: '',
      categories: [],
      contacts: [{ full_name: '', email: '', phone: '' }],
      offerings: []
    });
  }, []);

  const qc = useQueryClient();

  /* ---------- queries ---------- */
  const { data: cats = [] } = useCategories(agencyId, type);

  /* ---------- mutations ---------- */
  const addCategory = useMutation({
    mutationFn: async name => {
      const res = await api.post('/categories', { name, type });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries(['categories', agencyId, type]);
      setCatName('');
      setOpenAddCat(false);
    },
  });

  const addSupplier = useMutation({
    mutationFn: async () => {
      const data = {
        name: supplierForm.name,
        email: supplierForm.email,
        phone: supplierForm.phone,
        categories: supplierForm.categories.map(c => c.id),
        contacts: supplierForm.contacts.filter(c => c.full_name.trim()),
        offerings: supplierForm.offerings
      };
      const res = await api.post('/suppliers', data);
      return res.data;
    },
    onSuccess: data => {
      // 1) dacă am adăugat categorie nouă, lista de categorii e deja invalidată
      qc.invalidateQueries(['categories', agencyId, type]);
      // 2) invalidează toate listele de furnizori pt. categoriile selectate
      supplierForm.categories.forEach(c =>
        qc.invalidateQueries(['suppliers', agencyId, c.id])
      );
      // reset formular
      resetSupplierForm();
      setOpenAddSupp(false);
    },
  });

  /* ---------- efect background ---------- */
  useEffect(() => {
    document.body.classList.add('agency-bg');
    return () => document.body.classList.remove('agency-bg');
  }, []);

  /* ---------- efect scroll ↑ ---------- */
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => setShowBack(el.scrollTop > 80);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------- helpers ---------- */
  const isCatExpanded = id => expanded.includes(id);
  const toggleExpand = id =>
    setExpanded(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));

  const handleSaveCategory = () => {
    if (catName.trim()) {
      addCategory.mutate(catName);
    }
  };

  const handleSaveSupplier = () => {
    addSupplier.mutate();
  };

  /* ───────────────────────── render ───────────────────────── */
  return (
    <div className="AppContainer">
      <Stack
        spacing={2}
        sx={{
          width: 450, minWidth: 450,
          flexShrink: 0, height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
          color: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── HEADER ── */}
        <Box
          sx={{
            position: 'sticky', top: 4, zIndex: 1,
            pr: 2, pt: 1, pb: 1,
            display: 'flex', flexDirection: 'column', gap: 0.5,
          }}
        >
          <ButtonGroup 
            variant="contained" 
            fullWidth
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 1,
              '& .MuiButtonGroup-grouped': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                py: 0.75,
                transition: 'all 0.3s ease-in-out',
              }
            }}
          >
            <Button 
              onClick={() => setType('material')}
              sx={{
                flex: type === 'material' ? 1.2 : 0.8,
                backgroundColor: type === 'material' ? 'primary.main' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                py: type === 'material' ? '0.8rem' : '0.6rem',
                position: 'relative',
                overflow: 'hidden',
                zIndex: type === 'material' ? 2 : 1,
                boxShadow: type === 'material' ? '0px 4px 8px rgba(0,0,0,0.25)' : 'none',
                transform: type === 'material' ? 'scale(1.05)' : 'scale(1)',
                '&:hover': { 
                  backgroundColor: type === 'material' ? 'primary.dark' : 'rgba(255,255,255,0.2)',
                  transform: type === 'material' ? 'scale(1.05)' : 'scale(1.02)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
                  opacity: type === 'material' ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ConstructionIcon sx={{ 
                  fontSize: type === 'material' ? 28 : 20,
                  transition: 'all 0.3s ease-in-out',
                }} />
                <Typography 
                  sx={{ 
                    fontSize: type === 'material' ? 18 : 14,
                    fontWeight: type === 'material' ? 700 : 400,
                    letterSpacing: type === 'material' ? 0.5 : 0,
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  Materiale
                </Typography>
              </Box>
            </Button>
            <Button 
              onClick={() => setType('service')}
              sx={{
                flex: type === 'service' ? 1.2 : 0.8,
                backgroundColor: type === 'service' ? 'primary.main' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                py: type === 'service' ? '0.8rem' : '0.6rem',
                position: 'relative',
                overflow: 'hidden',
                zIndex: type === 'service' ? 2 : 1,
                boxShadow: type === 'service' ? '0px 4px 8px rgba(0,0,0,0.25)' : 'none',
                transform: type === 'service' ? 'scale(1.05)' : 'scale(1)',
                '&:hover': { 
                  backgroundColor: type === 'service' ? 'primary.dark' : 'rgba(255,255,255,0.2)',
                  transform: type === 'service' ? 'scale(1.05)' : 'scale(1.02)',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
                  opacity: type === 'service' ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EngineeringIcon sx={{ 
                  fontSize: type === 'service' ? 28 : 20,
                  transition: 'all 0.3s ease-in-out',
                }} />
                <Typography 
                  sx={{ 
                    fontSize: type === 'service' ? 18 : 14,
                    fontWeight: type === 'service' ? 700 : 400,
                    letterSpacing: type === 'service' ? 0.5 : 0,
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  Servicii
                </Typography>
              </Box>
            </Button>
          </ButtonGroup>

          <TextField
            fullWidth
            size="small"
            variant="outlined"              // folosește variant‑ul outlined cu floating label
            label="Caută..."               // mutăm textul în label
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputLabelProps={{
              shrink: !!search,            // dacă există text, forțează label sus
              sx: {
                color: '#fff',
                '&.Mui-focused': {
                  color: '#fff',   // culoarea label‑ului la focus
                },
              },
            }}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 1,
              mt: 1,

              // contur outline
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#fff',
                },
                '&:hover fieldset': {
                  borderColor: '#fff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },

              // textul din interior
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />

          {/* ── LINIE cu cele două BUTOANE PROFESIONISTE ── */}
        <ButtonContainer>
          <ActionButton
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddSupp(true)}
          >
            Adaugă furnizor
          </ActionButton>

          <ActionButton
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddCat(true)}
            sx={{
              color: '#fff',                // text alb
              borderColor: '#fff',          // bordură albă
              '&:hover': {
                borderColor: '#fff',        // rămâne albă la hover
                backgroundColor: 'rgba(255,255,255,0.1)', // ușoară umbră albă
              },
              '&:focus': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            Adaugă categorie
          </ActionButton>
        </ButtonContainer>


        </Box>

        {/*  LISTA cu scroll  */}
        <Box
          ref={listRef}
          sx={{ flex: 1, overflowY: 'auto', pr: 1, backgroundColor: 'transparent' }}
        >
          {cats
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .map(c => (
              <CategoryBlock
                key={c.id}
                cat={c}
                expanded={isCatExpanded(c.id)}
                toggle={() => toggleExpand(c.id)}
                agencyId={agencyId}
                search={search}
              />
            ))}
        </Box>

        {/*  ÎNAPOI SUS  */}
        {showBack && (
          <Tooltip title="Înapoi sus" arrow>
            <IconButton
              size="small"
              onClick={() => listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              sx={{
                alignSelf: 'flex-end',
                color: '#fff',
                backgroundColor: 'rgba(255,255,255,0.15)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
              }}
            >
              <ArrowBackIosNewIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* ───────────────── ADD CATEGORY DIALOG ───────────────── */}
      <AddCategoryDialog 
        open={openAddCat}
        onClose={() => !addCategory.isLoading && setOpenAddCat(false)}
        catName={catName}
        setCatName={setCatName}
        type={type}
        isLoading={addCategory.isLoading}
        onSave={handleSaveCategory}
      />

      {/* ───────────────── ADD SUPPLIER DIALOG ───────────────── */}
      <AddSupplierDialog 
        open={openAddSupp}
        onClose={() => !addSupplier.isLoading && setOpenAddSupp(false)}
        supplierForm={supplierForm}
        updateSupplierField={updateSupplierField}
        updateSupplierContact={updateSupplierContact}
        addSupplierContactRow={addSupplierContactRow}
        removeSupplierContactRow={removeSupplierContactRow}
        cats={cats}
        type={type}
        isLoading={addSupplier.isLoading}
        onSave={handleSaveSupplier}
      />
    </div>
  );
}
