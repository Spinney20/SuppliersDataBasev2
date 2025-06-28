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
import ReplyIcon           from '@mui/icons-material/Reply';
import ConstructionIcon from '@mui/icons-material/Construction';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AddIcon from '@mui/icons-material/Add';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useCategories } from '../api/queries';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Componente personalizate
import { ButtonContainer, ActionButton, scrollbarStyles } from './agency_components/styles';
import CategoryBlock from './agency_components/CategoryBlock';
import AddSupplierDialog from './agency_components/AddSupplierDialog';
import AddCategoryDialog from './agency_components/AddCategoryDialog';
import SupplierDetailsDialog from './agency_components/SupplierDetailsDialog';
import SearchIcon from '@mui/icons-material/Search';

/* ────────────────────────────────────────────────────────── */
export default function Agency() {
  const { id }   = useParams();
  const agencyId = Number(id);

  /* -------------- state -------------- */
  const [type, setType]         = useState('material');
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState([]);

  /* dialogs */
  const [openAddCat,  setOpenAddCat]  = useState(false);
  const [openAddSupp, setOpenAddSupp] = useState(false);
  const [openSupplierDetails, setOpenSupplierDetails] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

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
      // Validate email format function
      const isValidEmail = (email) => {
        if (!email) return true; // Empty emails are allowed
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
      
      // Filter out completely empty contacts (where all fields are empty)
      const validContacts = supplierForm.contacts
        .filter(c => c.full_name.trim() || c.email?.trim() || c.phone?.trim())
        .map(c => {
          console.log('Validating contact:', c);
          
          // Check for incomplete email formats like "sebienachescu@gn" without proper domain
          if (c.email && c.email.includes('@') && !c.email.includes('.')) {
            console.error('Email missing domain part:', c.email);
            throw new Error(`Email-ul "${c.email}" nu are un format valid (lipsește domeniul)`);
          }
          
          // Email validation
          if (c.email && !isValidEmail(c.email)) {
            throw new Error(`Email invalid pentru contactul "${c.full_name}"`);
          }
          return c;
        });
      
      console.log('Valid contacts:', validContacts);
      
      // Validate office email
      if (supplierForm.email && !isValidEmail(supplierForm.email)) {
        throw new Error('Email-ul de birou este invalid');
      }

      const data = {
        name: supplierForm.name,
        office_email: supplierForm.email ? supplierForm.email : null,
        office_phone: supplierForm.phone ? supplierForm.phone : null,
        category_ids: supplierForm.categories.map(c => c.id),
        contacts: validContacts.map(contact => ({
          full_name: contact.full_name,
          email: contact.email || null,
          phone: contact.phone || null
        })),
        offerings: supplierForm.offerings.map(offering => ({ name: offering }))
      };
      
      console.log('Offerings before mapping:', supplierForm.offerings);
      console.log('Offerings after mapping:', data.offerings);
      console.log('Sending supplier data:', JSON.stringify(data, null, 2));
      try {
        const res = await api.post(`/agencies/${agencyId}/suppliers`, data);
        return res.data;
      } catch (error) {
        console.error('Error response:', error.response);
        
        if (error.response) {
          console.error('Error data:', error.response.data);
          console.error('Error status:', error.response.status);
          
          // Log detailed error information
          if (error.response.data && error.response.data.detail && Array.isArray(error.response.data.detail)) {
            console.error('Validation errors:', JSON.stringify(error.response.data.detail, null, 2));
            error.response.data.detail.forEach((err, index) => {
              console.error(`Error ${index + 1}:`, err);
              if (err.loc) console.error(`- Location: ${err.loc.join('.')}`);
              if (err.msg) console.error(`- Message: ${err.msg}`);
              if (err.type) console.error(`- Type: ${err.type}`);
            });
          }
          
          // Try to extract a meaningful error message
          let errorMessage = 'Eroare la adăugarea furnizorului';
          
          if (error.response.data && typeof error.response.data === 'object') {
            if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else {
              // Try to stringify the error object
              try {
                errorMessage = JSON.stringify(error.response.data);
              } catch (e) {
                errorMessage = `Eroare ${error.response.status}: Verificați consola pentru detalii`;
              }
            }
          }
          
          // Add a special handler for 422 errors
          if (error.response.status === 422) {
            console.error('Validation error details:', error.response.data);
            
            // Try to extract validation error details
            if (error.response.data && error.response.data.detail) {
              if (Array.isArray(error.response.data.detail)) {
                const details = error.response.data.detail.map(err => 
                  `${err.loc.join('.')} - ${err.msg}`
                ).join('\n');
                errorMessage = `Erori de validare:\n${details}`;
              } else {
                errorMessage = `Eroare de validare: ${error.response.data.detail}`;
              }
            }
          }
          
          throw new Error(errorMessage);
        } else {
          throw new Error(`Eroare de rețea: ${error.message}`);
        }
      }
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
    onError: (error) => {
      console.error('Mutation error:', error);
      alert(`Eroare: ${error.message}`);
    }
  });

  const BackButton = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(2),          // 16 px
    left: theme.spacing(2),
    color: '#fff',                  // icon alb
    backgroundColor: 'transparent', // fără fundal
    transition: 'transform .25s ease-in-out',
    '&:hover': {
      transform: 'scale(1.15)',     // se mărește ușor
      backgroundColor: 'transparent'
    }
  }));

  const navigate = useNavigate();

  const updateSupplier = useMutation({
    mutationFn: async (updatedSupplier) => {
      const data = {
        name: updatedSupplier.name,
        office_email: updatedSupplier.email ? updatedSupplier.email : null,
        office_phone: updatedSupplier.phone ? updatedSupplier.phone : null,
        category_ids: updatedSupplier.categories.map(c => c.id),
        contacts: updatedSupplier.contacts
          .filter(c => c.full_name.trim() || c.email?.trim() || c.phone?.trim())
          .map(contact => ({
            full_name: contact.full_name,
            email: contact.email || null,
            phone: contact.phone || null
          })),
        offerings: updatedSupplier.offerings.map(offering => ({ name: offering }))
      };
      const res = await api.put(`/suppliers/${selectedSupplier.id}`, data);
      return res.data;
    },
    onSuccess: data => {
      // Invalidează query-urile pentru a actualiza datele
      qc.invalidateQueries(['categories', agencyId, type]);
      cats.forEach(c => qc.invalidateQueries(['suppliers', agencyId, c.id]));
      setOpenSupplierDetails(false);
    },
  });

  /* ---------- efect background ---------- */
  useEffect(() => {
    document.body.classList.add('agency-bg');
    return () => document.body.classList.remove('agency-bg');
  }, []);

  /* ---------- referință pentru lista cu scroll ---------- */
  const listRef = useRef(null);

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

  const handleSupplierClick = (supplier) => {
    console.log('Supplier selected:', supplier);
    setSelectedSupplier(supplier);
    setOpenSupplierDetails(true);
  };

  const handleUpdateSupplier = (updatedSupplier) => {
    updateSupplier.mutate(updatedSupplier);
  };

  /* ───────────────────────── render ───────────────────────── */
  return (
    <div className="AppContainer">
      {/* ─── BACK BUTTON ─── */}
    <Tooltip title="Inapoi pe pagina Home" placement="right" arrow>
      <BackButton onClick={() => navigate('/') /* sau navigate(-1) */}>
        <ReplyIcon />
      </BackButton>
    </Tooltip>
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

          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
    {/* Câmpul de căutare existent */}
    <TextField
      size="small"
      variant="outlined"
      label="Caută..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      InputLabelProps={{
        shrink: !!search,
        sx: { color: '#fff', '&.Mui‑focused': { color: '#fff' } },
      }}
      sx={{
        flex: 1.2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 1,
        '& .MuiOutlinedInput-root fieldset': { borderColor: '#fff' },
        '&:hover .MuiOutlinedInput-root fieldset': { borderColor: '#fff' },
        '& .MuiOutlinedInput-root.Mui‑focused fieldset': { borderColor: 'primary.main' },
        '& .MuiInputBase-input': { color: '#fff' },
      }}
    />

    {/* Buton “Caută după material” */}
    <ActionButton
    variant="contained"
    color="primary"
    startIcon={<SearchIcon />}
    onClick={() => {/* aici deschizi popup‐ul */}}
    sx={{
      // elimină orice modificare de flex: folosește la fel ca butoanele de jos
      width: '80%',
      textTransform: 'none'
    }}
  >
    Caută după material
  </ActionButton>
  </Box>

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
          sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            pr: 1, 
            backgroundColor: 'transparent',
            ...scrollbarStyles
          }}
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
                onSupplierClick={handleSupplierClick}
              />
            ))}
        </Box>
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

      {/* ───────────────── SUPPLIER DETAILS DIALOG ───────────────── */}
      {selectedSupplier && (
        <SupplierDetailsDialog
          open={openSupplierDetails}
          onClose={() => setOpenSupplierDetails(false)}
          supplier={selectedSupplier}
          cats={cats}
          type={type}
          isLoading={updateSupplier.isLoading}
          onSave={handleUpdateSupplier}
        />
      )}
    </div>
  );
}
