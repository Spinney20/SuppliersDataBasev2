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
} from '@mui/material';
import AddIcon             from '@mui/icons-material/Add';
import ExpandMoreIcon      from '@mui/icons-material/ExpandMore';
import ChevronRightIcon    from '@mui/icons-material/ChevronRight';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { motion }          from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';
import { useCategories, useSuppliersByCat } from '../api/queries';

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
      const payload = {
        name: supName,
        office_email: supEmail || null,
        office_phone: supPhone  || null,
        category_ids: supCats.map(c => c.id),
        contacts:     [],                 // poți adăuga ulterior
        offerings:    [],
      };
      const res = await api.post(`/agencies/${agencyId}/suppliers`, payload);
      return res.data;
    },
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
            display: 'flex', flexDirection: 'column', gap: 1,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={type === 'service'}
                onChange={() => setType(p => (p === 'material' ? 'service' : 'material'))}
                color="primary"
              />
            }
            label={type === 'material' ? 'Materiale' : 'Servicii'}
          />

          <TextField
            fullWidth size="small"
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Caută..."
            sx={{
              backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1,
              input: { color: '#fff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
            }}
          />

          {/* ── LINIE cu cele două BUTOANE ── */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />} variant="outlined"
              onClick={() => setOpenAddCat(true)}
              sx={{
                color: '#fff', borderColor: 'rgba(255,255,255,0.6)', textTransform: 'none',
                backdropFilter: 'blur(4px)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: '#fff' },
              }}
            >
              Adaugă categorie
            </Button>

            <Button
              startIcon={<AddIcon />} variant="contained"
              onClick={() => setOpenAddSupp(true)}
              sx={{
                textTransform: 'none',
                backgroundColor: 'rgba(255,255,255,0.25)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.35)' },
              }}
            >
              Adaugă furnizor
            </Button>
          </Box>
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

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nume furnizor *"
            value={supName} onChange={e => setSupName(e.target.value)}
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            label="Email"
            value={supEmail} onChange={e => setSupEmail(e.target.value)}
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            label="Telefon"
            value={supPhone} onChange={e => setSupPhone(e.target.value)}
            sx={{ input: { color: '#fff' } }}
          />
          <Autocomplete
            multiple
            options={cats}
            getOptionLabel={o => o.name}
            value={supCats}
            onChange={(_, v) => setSupCats(v)}
            filterSelectedOptions
            renderInput={params => (
              <TextField
                {...params}
                label="Categorii *"
                sx={{ input: { color: '#fff' } }}
              />
            )}
            sx={{
              '.MuiChip-root': {
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: '#fff',
              },
            }}
          />
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
