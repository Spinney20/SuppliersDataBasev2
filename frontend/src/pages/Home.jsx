// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useAgencies } from '../api/queries';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
import LoginDialog from '../components/LoginDialog';
import { useUser } from '../context/UserContext';

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
const isElectron = window.api !== undefined;

export default function Home() {
  const { data: agencies = [] } = useAgencies();
  const nav = useNavigate();
  const [clickedId, setClickedId] = useState(null);
  const [dbConfigOpen, setDbConfigOpen] = useState(false);
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const { isLoggedIn } = useUser();
  const [dbConfig, setDbConfig] = useState({
    type: 'local',
    url: 'postgresql://user:pass@localhost:5432/furnizori_dev',
    host: 'localhost',
    port: 5432,
    database: 'furnizori_dev',
    username: 'user',
    password: 'pass',
    apiUrl: 'http://localhost:8000'
  });

  // Load database config from Electron store if available
  useEffect(() => {
    if (isElectron) {
      window.api.getDbConfig()
        .then(config => {
          setDbConfig(config);
        })
        .catch(err => {
          console.error('Failed to get database config:', err);
        });
    } else {
      // În versiunea web, încărcăm configurația din localStorage
      const savedConfig = localStorage.getItem('dbConfig');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          // Ne asigurăm că avem și câmpul apiUrl
          if (!parsedConfig.apiUrl) {
            parsedConfig.apiUrl = 'http://localhost:8000';
          }
          setDbConfig(parsedConfig);
        } catch (error) {
          console.error('Failed to parse database config from localStorage:', error);
        }
      }
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
      window.api.saveDbConfig(dbConfig)
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
      // În versiunea web, salvăm configurația în localStorage
      localStorage.setItem('dbConfig', JSON.stringify(dbConfig));
      console.log('Database config saved to localStorage');
      setDbConfigOpen(false);
      // Reload the page to apply new config
      window.location.reload();
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
        alignItems: 'center',
      }}
    >
      {/* Database config button (pentru toate versiunile) */}
      <IconButton
        onClick={handleDbConfigOpen}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: (theme) => theme.zIndex.appBar + 1,
          bgcolor: 'rgba(255,255,255,0.15)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          backdropFilter: 'blur(6px)',
        }}
      >
        <SettingsIcon sx={{ color: '#fff' }} />
      </IconButton>

      <AnimatePresence mode="wait">
        <Box
          key="grid"
          component={motion.div}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            px: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: '2%', // Percentage-based gap scales with container
              width: '100%',
              maxWidth: '1800px', // Prevent excessive stretching on ultra-wide screens
            }}
          >
            {agencies.map((a, idx) => {
              const exitVariant =
                clickedId && a.id !== clickedId
                  ? idx % 2 === 0
                    ? 'exitLeft'
                    : 'exitRight'
                  : undefined;

              return (
                <Box
                  key={a.id}
                  component={motion.div}
                  variants={cardVariants}
                  exit={exitVariant}
                  sx={{
                    width: `${30}%`, // Exact same width for all cards (30% of container)
                    maxWidth: '450px', // Maximum width for very large screens
                  }}
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
                      width: '100%',
                      // Maintain aspect ratio close to original design
                      paddingTop: '140%', 
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderRadius: 6,
                      bgcolor: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      userSelect: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    elevation={0}
                  >
                    {/* Content wrapper to position elements inside the aspect ratio container */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        p: '7%', // Percentage-based padding scales with container
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
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
                          objectFit: 'contain',
                          width: '100%',
                          height: '75%',
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
                            fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' },
                          }}
                        >
                          Agentia {a.name}
                        </Typography>
                      </Stack>

                      {/* BUTTON STYLE ICON */}
                      <IconButton
                        sx={{
                          alignSelf: 'flex-end',
                          bgcolor: 'rgba(255,255,255,0.15)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        <ArrowForwardIosIcon sx={{ color: '#fff' }} />
                      </IconButton>
                    </Box>
                  </MotionPaper>
                </Box>
              );
            })}
          </Box>
        </Box>
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

            {!isElectron && (
              <TextField
                label="URL API"
                fullWidth
                value={dbConfig.apiUrl}
                onChange={(e) => handleDbConfigChange('apiUrl', e.target.value)}
                helperText="URL-ul API-ului backend (ex: http://localhost:8000)"
              />
            )}

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

      {/* Login Dialog */}
      <LoginDialog
        open={openLoginDialog}
        onClose={() => setOpenLoginDialog(false)}
      />
    </Box>
  );
}
