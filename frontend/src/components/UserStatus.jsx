import { useState, memo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Tooltip,
} from '@mui/material';
import { useUser } from '../context/UserContext';

import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LoginDialog from './LoginDialog';

// Folosim memo pentru a preveni re-renderizările inutile
const UserStatus = memo(function UserStatus() {
  const { user, isLoggedIn, logout } = useUser();
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const theme = useTheme();

  // Folosim useCallback pentru a preveni recrearea funcțiilor la fiecare render
  const handleOpenLoginDialog = useCallback(() => setOpenLoginDialog(true), []);
  const handleCloseLoginDialog = useCallback(() => setOpenLoginDialog(false), []);
  const handleLogout = useCallback(() => logout(), [logout]);

  return (
    <>
      {/* BARĂ FIXĂ, COMPLET TRANSPARENTĂ */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          backgroundColor: 'rgba(10,10,10,0.5)',
          backdropFilter: 'blur(6px)',
          borderRadius: 2,
          color: '#fff',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.1)',
          transform: 'translateZ(0)', // Activăm accelerarea hardware
          willChange: 'transform', // Optimizăm pentru animații
        }}
        className="animated"
      >
        {/* ICON "OMULEȚ" */}
        <Tooltip title={isLoggedIn ? "Utilizator autentificat" : "Vizitator"} arrow>
          <PersonOutlineIcon
            sx={{
              fontSize: 34,
              color: isLoggedIn
                ? theme.palette.primary.main
                : theme.palette.grey[400],
              transition: 'color 0.3s ease, transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              }
            }}
          />
        </Tooltip>

        {/* TEXT STATUS */}
        <Box>
          <Typography variant="body2" fontWeight="bold" sx={{ opacity: 0.9 }}>
            Conectat ca:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: isLoggedIn ? theme.palette.primary.main : '#fff',
              fontWeight: isLoggedIn ? 500 : 400
            }}
          >
            {isLoggedIn ? user?.nume : 'Vizitator'}
          </Typography>
        </Box>

        {/* LOGIN / LOGOUT ‑ TEXT + ICON */}
        <Button
          variant={isLoggedIn ? "outlined" : "contained"}
          size="small"
          startIcon={
            isLoggedIn ? (
              <LogoutIcon fontSize="small" />
            ) : (
              <LoginIcon fontSize="small" />
            )
          }
          onClick={isLoggedIn ? handleLogout : handleOpenLoginDialog}
          sx={{
            ml: 1,
            fontWeight: 600,
            textTransform: 'none',
            color: isLoggedIn ? 'error.main' : '#fff',
            borderColor: isLoggedIn ? 'error.main' : 'transparent',
            backgroundColor: isLoggedIn ? 'transparent' : 'success.main',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isLoggedIn ? 'rgba(255,0,0,0.08)' : 'success.dark',
              transform: 'scale(1.05)',
              borderColor: isLoggedIn ? 'error.main' : 'transparent',
            },
          }}
        >
          {isLoggedIn ? 'Logout' : 'Login'}
        </Button>
      </Box>

      {/* DIALOG AUTENTIFICARE */}
      <LoginDialog
        open={openLoginDialog}
        onClose={handleCloseLoginDialog}
      />
    </>
  );
});

export default UserStatus;
