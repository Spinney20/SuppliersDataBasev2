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
  const { id }   = useParams();           // /agency/:id
  const agencyId = Number(id);

  /* -------- state -------- */
  const [type, setType]         = useState('material'); // material | service
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState([]);         // categoryId[]
  const [showBack, setShowBack] = useState(false);

  /* ---- dialog Add Category ---- */
  const [openAdd, setOpenAdd]   = useState(false);
  const [catName, setCatName]   = useState('');

  const qc = useQueryClient();
  const addCategory = useMutation({
    mutationFn: async name => {
      const res = await api.post('/categories', { name, type });
      return res.data;
    },
    onSuccess: () => {
      // Re‑fă simetric query‑ul de categorie curentă
      qc.invalidateQueries(['categories', agencyId, type]);
      setCatName('');
      setOpenAdd(false);
    },
  });

  const { data: cats = [] } = useCategories(agencyId, type);

  useEffect(() => {
    // când intri pe pagină → aplică background‑ul special
    document.body.classList.add('agency-bg');

    // când părăseşti pagina Agency → revino la background-ul implicit
    return () => document.body.classList.remove('agency-bg');
    }, []);

  /* -------- scroll “înapoi sus” -------- */
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => setShowBack(el.scrollTop > 80);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* -------- helper ­funcţii -------- */
  const isCatExpanded = catId => expanded.includes(catId);
  const toggleExpand  = catId =>
    setExpanded(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );

  /* ───────────────── render ───────────────── */
  return (
    <div className="AppContainer">
      <Stack
        spacing={2}
        sx={{
          width: 450,
          minWidth: 450,
          flexShrink: 0,
          flexGrow: 0,
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(6px)',
          color: '#fff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER – switch + search + ADD BTN */}
        <Box
          sx={{
            position: 'sticky',
            top: 4,
            zIndex: 1,
            pr: 2,
            pt: 1,
            pb: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={type === 'service'}
                onChange={() =>
                  setType(prev => (prev === 'material' ? 'service' : 'material'))
                }
                color="primary"
              />
            }
            label={type === 'material' ? 'Materiale' : 'Servicii'}
          />

          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Caută..."
            sx={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 1,
              input: { color: '#fff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
            }}
          />

          {/* === NEW BUTTON “Adaugă categorie” === */}
          <Button
            startIcon={<AddIcon />}
            onClick={() => setOpenAdd(true)}
            variant="outlined"
            sx={{
              alignSelf: 'flex-start',
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.6)',
              textTransform: 'none',
              backdropFilter: 'blur(4px)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderColor: '#fff',
              },
            }}
          >
            Adaugă categorie
          </Button>
        </Box>

        {/* LISTA cu scroll propriu */}
        <Box
          ref={listRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            pr: 1,
            backgroundColor: 'transparent',
            overflowX: 'hidden',
          }}
        >
          {cats
            .filter(cat =>
              cat.name.toLowerCase().includes(search.toLowerCase())
            )
            .map(cat => (
              <CategoryBlock
                key={cat.id}
                cat={cat}
                expanded={isCatExpanded(cat.id)}
                toggle={() => toggleExpand(cat.id)}
                agencyId={agencyId}
                search={search}
              />
            ))}
        </Box>

        {/* BUTON „ÎNAPOI SUS” */}
        {showBack && (
          <Tooltip title="Înapoi sus" arrow>
            <IconButton
              size="small"
              onClick={() =>
                listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }
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

      {/* === ADD CATEGORY DIALOG === */}
      <Dialog
        open={openAdd}
        onClose={() => !addCategory.isLoading && setOpenAdd(false)}
        PaperComponent={motion.div}
        PaperProps={{
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit:    { opacity: 0, scale: 0.9 },
          transition: { duration: 0.25 },
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(10,10,10,0.85)',
            px: 2, pb: 2,
            borderRadius: 3,
            width: 320,
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff', pb: 1 }}>
          Adaugă categorie ({type})
        </DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nume categorie"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            sx={{
              mt: 1,
              input: { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#fff' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
            }}
            disabled={addCategory.isLoading}
          />
        </DialogContent>

        <DialogActions sx={{ pr: 2 }}>
          <Button
            onClick={() => setOpenAdd(false)}
            disabled={addCategory.isLoading}
          >
            Anulează
          </Button>
          <Button
            variant="contained"
            onClick={() => catName && addCategory.mutate(catName)}
            disabled={addCategory.isLoading || !catName.trim()}
            startIcon={
              addCategory.isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <AddIcon />
              )
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
    <Box
      sx={{
        mb: 2,
        p: 1,
        border: '1px solid #888',
        borderRadius: 1,
        backgroundColor: 'transparent',
      }}
    >
      {/* header categorie */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          onClick={toggle}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            flex: 1,
            minWidth: 0,
          }}
        >
          <IconButton size="small" sx={{ color: '#fff', flexShrink: 0 }}>
            {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>

          <Typography
            sx={{
              ml: 1,
              pr: 1,
              fontWeight: 600,
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
            }}
          >
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
                mt: 0.5,
                p: 0.5,
                cursor: 'pointer',
                borderRadius: 1,
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
