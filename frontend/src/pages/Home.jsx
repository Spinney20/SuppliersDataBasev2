// src/pages/Home.jsx
import { useState } from 'react';
import { useAgencies } from '../api/queries';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Stack,
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function Home() {
  const { data: agencies = [] } = useAgencies();
  const nav = useNavigate();
  const [clickedId, setClickedId] = useState(null);

  const handleClick = id => {
    setClickedId(id);
    // aşteptăm animaţia de exit, apoi navigăm
    setTimeout(() => nav(`/agency/${id}`), 500);
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
        px: 3,
        pt: { xs: 8, md: 12 },
      }}
    >
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
                    width: { xs: '80vw', sm: 280, md: 320 },
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
                      {a.name}
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{ color: 'rgba(255,255,255,0.85)' }}
                    >
                      {`Descoperă furnizorii și categoriile ${a.name} într‑o interfață modernă, rapidă și intuitivă.`}
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
    </Box>
  );
}
