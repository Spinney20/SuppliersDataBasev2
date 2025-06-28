// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useAgencies } from '../api/queries';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SettingsIcon from '@mui/icons-material/Settings';
import { motion, AnimatePresence } from 'framer-motion';

const images = import.meta.glob('../assets/*.png', { eager: true, import: 'default' });
// rezultatul e: { "../assets/brasov.png":"/assets/brasov.xxx.png", … }

const cityImg = {};
for (const path in images) {
  // extrage numele fără extensie
  const key = path.split('/').pop().replace('.png', '');
  cityImg[key] = images[path];
}
// ─────────────────────────────────────────
//  Helpers
const MotionPaper = motion(Paper);

const gridVariants = {
  hidden: { opacity: 0, y: -60, perspective: 800 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { when: 'beforeChildren', staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateY: -15, scale: 0.9 },
  visible: { opacity: 1, y: 0, rotateY: 0, scale: 1 },
  exitLeft: { opacity: 0, x: -300, rotateY: 30, transition: { duration: 0.4 } },
  exitRight: {
    opacity: 0,
    x: 300,
    rotateY: -30,
    transition: { duration: 0.4 },
  },
};

// Check if we're running in Electron
const isElectron = window.electronAPI !== undefined;

export default function Home() {
  const { data: agencies = [] } = useAgencies();
  const nav = useNavigate();
  const [clickedId, setClickedId] = useState(null);
  const [dbConfigOpen, setDbConfigOpen] = useState(false);
  const [dbConfig, setDbConfig] = useState({
    type: 'local',
    url: 'postgresql://user:pass@localhost:5432/furnizori_dev',
    host: 'localhost',
    port: 5432,
    database: 'furnizori_dev',
    username: 'user',
    password: 'pass'
  });

  // Load database config from Electron store if available
  useEffect(() => {
    if (isElectron) {
      window.electronAPI.getDbConfig()
        .then(config => {
          setDbConfig(config);
        })
        .catch(err => {
          console.error('Failed to get database config:', err);
        });
    }
  }, []);

  const handleClick = id => {
    setClickedId(id);
    // aşteptăm animaţia de exit, apoi navigăm
    setTimeout(() => nav(`/agency/${id}`), 500);
  };

  const handleDbConfigOpen = () => {
    setDbConfigOpen(true);
  };

  const handleDbConfigClose = () => {
    setDbConfigOpen(false);
  };

  const handleDbConfigSave = () => {
    if (isElectron) {
      window.electronAPI.saveDbConfig(dbConfig)
        .then(() => {
          console.log('Database config saved');
          setDbConfigOpen(false);
          // Reload the page to apply new config
          window.location.reload();
        })
        .catch(err => {
          console.error('Failed to save database config:', err);
        });
    } else {
      setDbConfigOpen(false);
    }
  };

  const handleDbConfigChange = (field, value) => {
    setDbConfig(prev => ({
      ...prev,
      [field]: value,
      // Update URL when other fields change
      ...(field !== 'url' && field !== 'type' ? {
        url: `postgresql://${field === 'username' ? value : prev.username}:${field === 'password' ? value : prev.password}@${field === 'host' ? value : prev.host}:${field === 'port' ? value : prev.port}/${field === 'database' ? value : prev.database}`
      } : {})
    }));
  };

  return (
    <Box
      component="main"
      sx={{
        height: '100vh',          /* ocupă tot ecranul fără scroll vertical */
        width:  '100%',           /* la fel pe orizontală */
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pt: { xs: 8, md: 12 },
      }}
    >
      {/* Database config button (only in Electron) */}
      {isElectron && (
        <IconButton
          onClick={handleDbConfigOpen}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'rgba(255,255,255,0.15)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
            backdropFilter: 'blur(6px)',
          }}
        >
          <SettingsIcon sx={{ color: '#fff' }} />
        </IconButton>
      )}

      <AnimatePresence mode="wait">
        <Grid
          key="grid" // for proper exit if we ever need
          container
          spacing={{ xs: 3, md: 6 }}
          justifyContent="center"
          component={motion.div}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {agencies.map((a, idx) => {
            // direcţia de exit – jumătate stânga, jumătate dreapta
            console.log('id:', a.id);
            const exitVariant =
              clickedId && a.id !== clickedId
                ? idx % 2 === 0
                  ? 'exitLeft'
                  : 'exitRight'
                : undefined;

            return (
              <Grid
                item
                key={a.id}
                component={motion.div}
                variants={cardVariants}
                exit={exitVariant}
              >
                <MotionPaper
                  whileHover={{
                    scale: 1.06,
                    rotateY: 5,
                    boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleClick(a.id)}
                  sx={{
                    width: { xs: '95vw', sm: 400, md: 450},
                    height: { xs: '55vh', md: '70vh' },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderRadius: 6,
                    p: 4,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    userSelect: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  elevation={0}
                >
                  {/* ACCENT DECORATIV – un gradient pe colţ */}
                  {/* FOTO ORAȘ – blend cu gradient */}
                <Box
                component="img"
                src={cityImg[a.name.toLowerCase()]}
                alt={a.name}
                sx={{
                    position: 'absolute',
                    inset: a.id == 3 ? '23% 0 0 0' : '25% 0 0 0',
                    objectFit: 'contain',        // 'cover' sau 'contain' depinde de poză
                    filter: 'grayscale(1) contrast(1.25)',
                    mixBlendMode: 'luminosity',
                    opacity: 0.82,
                    pointerEvents: 'none',
                }}
                />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(circle at top left, rgba(255,255,255,0.4) 0%, transparent 60%)',
                      pointerEvents: 'none',
                    }}
                  />

                  <Stack spacing={3}>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      sx={{
                        color: '#fff',
                        textShadow: '0 2px 6px rgba(0,0,0,.5)',
                      }}
                    >
                      Agentia {a.name}
                    </Typography>
                  </Stack>

                  {/* BUTTON STYLE ICON */}
                  <IconButton
                    sx={{
                      alignSelf: 'flex-end',
                      mt: 2,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <ArrowForwardIosIcon sx={{ color: '#fff' }} />
                  </IconButton>
                </MotionPaper>
              </Grid>
            );
          })}
        </Grid>
      </AnimatePresence>

      {/* Database Configuration Dialog */}
      <Dialog open={dbConfigOpen} onClose={handleDbConfigClose} maxWidth="md" fullWidth>
        <DialogTitle>Configurare Bază de Date</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tip Conexiune</InputLabel>
              <Select
                value={dbConfig.type}
                label="Tip Conexiune"
                onChange={(e) => handleDbConfigChange('type', e.target.value)}
              >
                <MenuItem value="local">PostgreSQL Local</MenuItem>
                <MenuItem value="neon">Neon Cloud</MenuItem>
                <MenuItem value="server">Server PostgreSQL</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="URL Conexiune"
              fullWidth
              value={dbConfig.url}
              onChange={(e) => handleDbConfigChange('url', e.target.value)}
              helperText="Format: postgresql://user:pass@host:port/database"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Host"
                value={dbConfig.host}
                onChange={(e) => handleDbConfigChange('host', e.target.value)}
              />
              <TextField
                label="Port"
                type="number"
                value={dbConfig.port}
                onChange={(e) => handleDbConfigChange('port', parseInt(e.target.value, 10))}
              />
              <TextField
                label="Database"
                value={dbConfig.database}
                onChange={(e) => handleDbConfigChange('database', e.target.value)}
              />
              <TextField
                label="Username"
                value={dbConfig.username}
                onChange={(e) => handleDbConfigChange('username', e.target.value)}
              />
              <TextField
                label="Password"
                type="password"
                value={dbConfig.password}
                onChange={(e) => handleDbConfigChange('password', e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDbConfigClose}>Anulează</Button>
          <Button onClick={handleDbConfigSave} variant="contained">Salvează</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
