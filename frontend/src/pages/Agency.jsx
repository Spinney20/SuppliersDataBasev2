// src/pages/Agency.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
  const [supName,   setSupName]   = useState('');
  const [supEmail,  setSupEmail]  = useState('');
  const [supPhone,  setSupPhone]  = useState('');
  const [supCats,   setSupCats]   = useState([]);    // [{id, name}, …]
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
    };
    /* --------------- form Add Supplier --------------- */
  const [supContacts, setSupContacts] = useState([
    { full_name: '', email: '', phone: '' }
  ]);
  const [supOfferings, setSupOfferings] = useState([]); // ['balast', 'nisip', ...]

  const updateContact = (idx, key, val) =>
    setSupContacts(arr =>
      arr.map((c, i) => (i === idx ? { ...c, [key]: val } : c))
    );
  
  const addContactRow    = () => setSupContacts(arr => [...arr, { full_name:'', email:'', phone:'' }]);
  const removeContactRow = idx =>
    setSupContacts(arr => arr.length === 1 ? arr : arr.filter((_, i) => i !== idx));
  


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
    onSuccess: data => {
      // 1) dacă am adăugat categorie nouă, lista de categorii e deja invalidată
      qc.invalidateQueries(['categories', agencyId, type]);
      // 2) invalidează toate listele de furnizori pt. categoriile selectate
      supCats.forEach(c =>
        qc.invalidateQueries(['suppliers', agencyId, c.id])
      );
      // reset formular
      setSupName('');
      setSupEmail('');
      setSupPhone('');
      setSupCats([]);
      setSupContacts([{ full_name:'', email:'', phone:'' }]);
      setSupOfferings([]);
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
        fullWidth maxWidth="sm"
        PaperComponent={motion.div}
        PaperProps={{
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit:    { opacity: 0, scale: 0.9 },
          transition: { duration: 0.25 },
          sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(10,10,10,0.85)', p: 3, borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Adaugă furnizor</DialogTitle>

        <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, mt:1 }}>
        {/* --- date generale furnizor --- */}
        <TextField label="Nume furnizor *" value={supName}
                  onChange={e=>setSupName(e.target.value)}
                  placeholder="Nume furnizor *" sx={textInputSX} />
        <TextField label="Email" value={supEmail}
                  onChange={e=>setSupEmail(e.target.value)}
                  placeholder="Email" sx={textInputSX} />
        <TextField label="Telefon" value={supPhone}
                  onChange={e=>setSupPhone(e.target.value)}
                  placeholder="Telefon" sx={textInputSX} />

        <Autocomplete  /* categorii */
          multiple options={cats} value={supCats}
          getOptionLabel={o=>o.name} filterSelectedOptions
          onChange={(_,v)=>setSupCats(v)}
          renderInput={params=>(
            <TextField {...params} label="Categorii *" placeholder="Categorii *" sx={textInputSX}/>
          )}
          sx={{ '.MuiChip-root':{ backgroundColor:'rgba(255,255,255,0.25)', color:'#fff' }}} />

        {/* ---------- Contacte ---------- */}
        <Typography sx={{mt:1,fontWeight:600}}>Contacte</Typography>
        {supContacts.map((c,idx)=>(
          <Box key={idx} sx={{display:'flex',gap:1}}>
            <TextField fullWidth label="Nume *"
                      value={c.full_name}
                      onChange={e=>updateContact(idx,'full_name',e.target.value)}
                      sx={{...textInputSX, flex:1}} />
            <TextField label="Email"
                      value={c.email}
                      onChange={e=>updateContact(idx,'email',e.target.value)}
                      sx={{...textInputSX, width:170}} />
            <TextField label="Telefon"
                      value={c.phone}
                      onChange={e=>updateContact(idx,'phone',e.target.value)}
                      sx={{...textInputSX, width:120}} />
            <IconButton size="small" onClick={()=>removeContactRow(idx)}
                        sx={{color:'#fff',alignSelf:'center'}}>
              <RemoveIcon fontSize="inherit" />
            </IconButton>
          </Box>
        ))}
        <Button onClick={addContactRow} startIcon={<AddIcon/>}
                sx={{alignSelf:'flex-start', color:'#fff', textTransform:'none'}}>
          Adaugă contact
        </Button>

        {/* ---------- Offerings ---------- */}
        <Typography sx={{mt:1,fontWeight:600}}>Offerings ({type})</Typography>
        <Autocomplete
          multiple freeSolo
          options={[]} value={supOfferings}
          onChange={(_,v)=>setSupOfferings(v)}
          renderInput={params=>(
            <TextField {...params} label="Materiale / Servicii"
                      placeholder="Tastează şi Enter"
                      sx={textInputSX}/>
          )}
          sx={{ '.MuiChip-root':{ backgroundColor:'rgba(255,255,255,0.25)', color:'#fff' }}} />
      </DialogContent>


        <DialogActions sx={{ pr: 2, pt: 1 }}>
          <Button onClick={() => setOpenAddSupp(false)} disabled={addSupplier.isLoading}>
            Anulează
          </Button>
          <Button
            variant="contained"
            onClick={() => addSupplier.mutate()}
            disabled={
              addSupplier.isLoading ||
              !supName.trim() ||
              supCats.length === 0
            }
            startIcon={
              addSupplier.isLoading
                ? <CircularProgress size={16} color="inherit" />
                : <AddIcon />
            }
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
