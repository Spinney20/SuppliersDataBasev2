// src/pages/Agency.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  Box,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
  ButtonGroup,
} from '@mui/material';
import AddIcon             from '@mui/icons-material/Add';
import ExpandMoreIcon      from '@mui/icons-material/ExpandMore';
import ChevronRightIcon    from '@mui/icons-material/ChevronRight';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { motion }          from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useCategories, useSuppliersByCat } from '../api/queries';
import RemoveIcon from '@mui/icons-material/Remove';
import ConstructionIcon from '@mui/icons-material/Construction';
import EngineeringIcon from '@mui/icons-material/Engineering';
import { styled, alpha } from '@mui/material/styles';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import React from 'react';

// Containerul cu cele două butoane
const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

// Buton reutilizabil, variantă profesională
const ActionButton = styled(Button)(({ theme }) => ({
  flex: 1,
  minHeight: 38,
  borderRadius: theme.shape.borderRadius,       // puțin rotunjit
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.pxToRem(14),
  letterSpacing: '0.25px',
  transition: theme.transitions.create(
    ['background-color', 'transform', 'box-shadow'],
    { duration: theme.transitions.duration.shortest }
  ),
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',        // umbră fină
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.16)',
  },
  '&:focus': {
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

// Adaugă un stil pentru scrollbar modern
const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
  },
  maxHeight: 'calc(100vh - 200px)',
  overflowY: 'auto',
}));

// Stiluri pentru scrollbar-ul din lista de categorii
const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
  },
};

// Componentă separată pentru câmpurile de input cu icon
const IconTextField = memo(({ icon, textInputSX, ...props }) => (
  <TextField
    {...props}
    autoComplete="off"
    InputProps={{
      startAdornment: (
        <Box sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, display: 'flex' }}>
          {icon}
        </Box>
      ),
      sx: { color: '#fff' }
    }}
    InputLabelProps={{
      shrink: true,
      sx: {
        color: '#fff',
        '&.Mui-focused': {
          color: 'primary.main',
        },
      }
    }}
    sx={{
      ...textInputSX,
      ...props.sx
    }}
    variant="outlined"
  />
));

/* ────────────────────────────────────────────────────────── */
// Componentă separată pentru formularul de furnizor
const SupplierForm = memo(({ 
  supplierForm, 
  updateSupplierField, 
  updateSupplierContact,
  addSupplierContactRow,
  removeSupplierContactRow,
  cats,
  textInputSX,
  type
}) => {
  return (
    <>
      {/* --- date generale furnizor --- */}
      <Box sx={{ 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        p: 2, 
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.05)',
        mb: 1
      }}>
        <Typography variant="subtitle2" sx={{ 
          mb: 2, 
          opacity: 0.9, 
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          <BusinessIcon fontSize="small" color="primary" /> Informații generale
        </Typography>
        
        <IconTextField 
          icon={<BusinessIcon />}
          label="Nume furnizor *" 
          value={supplierForm.name}
          onChange={e => updateSupplierField('name', e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          placeholder=""
          textInputSX={textInputSX}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <IconTextField 
            icon={<EmailIcon />}
            label="Email" 
            value={supplierForm.email}
            onChange={e => updateSupplierField('email', e.target.value)}
            fullWidth
            placeholder=""
            textInputSX={textInputSX}
          />
          
          <IconTextField 
            icon={<PhoneIcon />}
            label="Telefon" 
            value={supplierForm.phone}
            onChange={e => updateSupplierField('phone', e.target.value)}
            fullWidth
            placeholder=""
            textInputSX={textInputSX}
          />
        </Box>

        <Autocomplete  /* categorii */
          multiple 
          options={cats} 
          value={supplierForm.categories}
          getOptionLabel={o=>o.name} 
          filterSelectedOptions
          onChange={(_,v)=>updateSupplierField('categories', v)}
          disableCloseOnSelect
          limitTags={5}
          ListboxProps={{
            style: {
              maxHeight: '200px',
            }
          }}
          renderInput={params=>(
            <TextField 
              {...params} 
              label="Categorii *" 
              placeholder=""
              sx={textInputSX}
              variant="outlined"
              autoComplete="off"
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: '#fff',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <Box sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, display: 'flex' }}>
                      <CategoryIcon />
                    </Box>
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
          sx={{ 
            '.MuiChip-root': { 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              color: '#fff',
              borderRadius: '16px',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#fff'
                }
              }
            },
            '.MuiAutocomplete-listbox': scrollbarStyles,
            '.MuiAutocomplete-endAdornment': {
              top: 'calc(50% - 14px)'
            }
          }} 
        />
      </Box>

      {/* ---------- Contacte ---------- */}
      <Box sx={{ 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        p: 2, 
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.05)',
        mb: 1
      }}>
        <Typography sx={{
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          <PersonIcon fontSize="small" color="primary" /> Contacte
        </Typography>
        
        {supplierForm.contacts.map((c,idx)=>(
          <Box key={idx} sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            p: 2,
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.03)',
          }}>
            <IconTextField 
              icon={<PersonIcon />}
              fullWidth 
              label="Nume *"
              value={c.full_name}
              onChange={e=>updateSupplierContact(idx,'full_name',e.target.value)}
              sx={{flex:1}}
              placeholder=""
              textInputSX={textInputSX}
            />
            <IconTextField 
              icon={<EmailIcon />}
              label="Email"
              value={c.email}
              onChange={e=>updateSupplierContact(idx,'email',e.target.value)}
              sx={{width:200}}
              placeholder=""
              textInputSX={textInputSX}
            />
            <IconTextField 
              icon={<PhoneIcon />}
              label="Telefon"
              value={c.phone}
              onChange={e=>updateSupplierContact(idx,'phone',e.target.value)}
              sx={{width:150}}
              placeholder=""
              textInputSX={textInputSX}
            />
            <IconButton 
              size="small" 
              onClick={()=>removeSupplierContactRow(idx)}
              sx={{
                color:'#fff',
                alignSelf:'center',
                backgroundColor: 'rgba(255,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,0,0,0.2)',
                }
              }}
            >
              <RemoveIcon fontSize="inherit" />
            </IconButton>
          </Box>
        ))}
        
        <Button 
          onClick={addSupplierContactRow} 
          startIcon={<AddIcon/>}
          variant="outlined"
          size="small"
          sx={{
            alignSelf:'flex-start', 
            color:'#fff', 
            textTransform:'none',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: '#fff',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          Adaugă contact
        </Button>
      </Box>

      {/* ---------- Offerings ---------- */}
      <Box sx={{ 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        p: 2, 
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Typography sx={{
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          <InventoryIcon fontSize="small" color="primary" /> Offerings ({type})
        </Typography>
        
        <Autocomplete
          multiple 
          freeSolo
          options={[]} 
          value={supplierForm.offerings}
          onChange={(_,v)=>updateSupplierField('offerings', v)}
          disableCloseOnSelect
          limitTags={5}
          ListboxProps={{
            style: {
              maxHeight: '200px',
            }
          }}
          renderInput={params=>(
            <TextField 
              {...params} 
              label="Materiale / Servicii"
              placeholder="Tastează şi Enter"
              sx={textInputSX}
              variant="outlined"
              autoComplete="off"
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: '#fff',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <Box sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, display: 'flex' }}>
                      <InventoryIcon />
                    </Box>
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
          sx={{ 
            '.MuiChip-root': { 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              color: '#fff',
              borderRadius: '16px',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#fff'
                }
              }
            },
            '.MuiAutocomplete-listbox': scrollbarStyles,
            '.MuiAutocomplete-endAdornment': {
              top: 'calc(50% - 14px)'
            }
          }} 
        />
      </Box>
    </>
  );
}, (prevProps, nextProps) => {
  // Comparăm doar proprietățile care ar trebui să declanșeze o rerenederizare
  return (
    prevProps.supplierForm === nextProps.supplierForm &&
    prevProps.cats === nextProps.cats &&
    prevProps.type === nextProps.type
  );
});

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

  const textInputSX = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    '& .MuiInputLabel-root':            { color: '#fff' },
    '& .MuiInputLabel-root.Mui-focused':{ color: 'primary.main' },
    '& .MuiInputBase-input':            { color: '#fff' },
    '& .MuiInputBase-input::placeholder': { color: '#fff', opacity: 1 },
    '& .MuiOutlinedInput-root': {
        '& fieldset':              { borderColor: '#fff' },
        '&:hover fieldset':        { borderColor: '#fff' },
        '&.Mui-focused fieldset':  { borderColor: 'primary.main' },
    },
    '& .MuiInputLabel-shrink': {
        transform: 'translate(14px, -9px) scale(0.75)',
    }
  };
  
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
      <Dialog
        open={openAddCat}
        onClose={() => !addCategory.isLoading && setOpenAddCat(false)}
        PaperComponent={motion.div}
        PaperProps={{
          initial:  { opacity: 0, scale: 0.9 },
          animate:  { opacity: 1, scale: 1 },
          exit:     { opacity: 0, scale: 0.9 },
          transition: { duration: 0.25 },
          sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(10,10,10,0.85)',
                px: 2, pb: 2, borderRadius: 3, width: 320 },
        }}
      >
        <DialogTitle sx={{ color: '#fff', pb: 1 }}>Adaugă categorie ({type})</DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nume categorie"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            disabled={addCategory.isLoading}
            InputLabelProps={{
            sx: { color: '#fff' }
            }}
            InputProps={{
            sx: { color: '#fff' }
            }}
            sx={{
            mt: 1,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
            }}
        />
        </DialogContent>

        <DialogActions sx={{ pr: 6}}>
          <Button
            variant="outlined"
            onClick={() => setOpenAddCat(false)}
            disabled={addCategory.isLoading}
            sx={{
                color: 'red',
                borderColor: 'red',
                textTransform: 'none',
                '&:hover': {
                borderColor: '#ff4444',
                backgroundColor: 'rgba(255, 0, 0, 0.08)',
                },
            }}
            >
            Anulează
            </Button>
          <Button
            variant="contained"
            onClick={() => catName && addCategory.mutate(catName)}
            disabled={addCategory.isLoading || !catName.trim()}
            startIcon={
              addCategory.isLoading
                ? <CircularProgress size={16} color="inherit" />
                : <AddIcon />
            }
          >
            Salvează
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───────────────── ADD SUPPLIER DIALOG ───────────────── */}
      <Dialog
        open={openAddSupp}
        onClose={() => !addSupplier.isLoading && setOpenAddSupp(false)}
        fullWidth maxWidth="md"
        PaperComponent={motion.div}
        PaperProps={{
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit:    { opacity: 0, scale: 0.9 },
          transition: { duration: 0.25 },
          sx: { 
            backdropFilter: 'blur(8px)', 
            backgroundColor: 'rgba(10,10,10,0.85)', 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            width: '800px',
            maxWidth: '90vw'
          },
        }}
      >
        <DialogTitle sx={{ 
          color: '#fff', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1
        }}>
          <BusinessIcon sx={{ mr: 1 }} /> Adaugă furnizor
        </DialogTitle>

        <StyledDialogContent sx={{ display:'flex', flexDirection:'column', gap:2, px: 3 }}>
          <SupplierForm
            supplierForm={supplierForm}
            updateSupplierField={updateSupplierField}
            updateSupplierContact={updateSupplierContact}
            addSupplierContactRow={addSupplierContactRow}
            removeSupplierContactRow={removeSupplierContactRow}
            cats={cats}
            textInputSX={textInputSX}
            type={type}
          />
        </StyledDialogContent>

        <DialogActions sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          justifyContent: 'space-between'
        }}>
          <Button 
            onClick={() => setOpenAddSupp(false)} 
            disabled={addSupplier.isLoading}
            startIcon={<CancelIcon />}
            variant="outlined"
            sx={{
              color: 'rgba(255,100,100,0.9)',
              borderColor: 'rgba(255,100,100,0.5)',
              '&:hover': {
                borderColor: 'rgba(255,100,100,0.9)',
                backgroundColor: 'rgba(255,100,100,0.1)'
              }
            }}
          >
            Anulează
          </Button>
          <Button
            variant="contained"
            onClick={() => addSupplier.mutate()}
            disabled={
              addSupplier.isLoading ||
              !supplierForm.name.trim() ||
              supplierForm.categories.length === 0
            }
            startIcon={
              addSupplier.isLoading
                ? <CircularProgress size={16} color="inherit" />
                : <SaveIcon />
            }
            sx={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              }
            }}
          >
            Salvează
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Bloc categorie + furnizori (neschimbat) */
function CategoryBlock({ cat, expanded, toggle, agencyId, search }) {
  const { data: supp = [] } = useSuppliersByCat(agencyId, cat.id);
  const filteredSup = supp.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ mb: 2, p: 1, border: '1px solid #888', borderRadius: 1 }}>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          onClick={toggle}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <IconButton size="small" sx={{ color: '#fff', flexShrink: 0 }}>
            {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>

          <Typography sx={{ ml: 1, pr: 1, fontWeight: 600, overflowWrap: 'anywhere' }}>
            {cat.name}
          </Typography>
        </Box>
      </Box>

      {/* furnizori */}
      {expanded && (
        <Box sx={{ ml: 4, mt: 1 }}>
          {filteredSup.length === 0 && (
            <Typography sx={{ fontStyle: 'italic', opacity: 0.6, pb: 0.5 }}>
              (niciun furnizor găsit)
            </Typography>
          )}
          {filteredSup.map(s => (
            <Box
              key={s.id}
              sx={{
                mt: 0.5, p: 0.5,
                cursor: 'pointer', borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              {s.name}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
