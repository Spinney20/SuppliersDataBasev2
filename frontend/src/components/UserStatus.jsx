import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import { useUser } from '../context/UserContext';

import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LoginDialog from './LoginDialog';

export default function UserStatus() {
  const { user, isLoggedIn, logout } = useUser();
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const theme = useTheme();

  const handleOpenLoginDialog = () => setOpenLoginDialog(true);
  const handleLogout = () => logout();

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
          px: 1,
          py: 0.5,
          backgroundColor: 'transparent', // zero fundal
          color: '#fff',
          zIndex: 1000,
        }}
      >
        {/* ICON “OMULEȚ” FĂRĂ CERC */}
        <PersonOutlineIcon
          sx={{
            fontSize: 34,
            color: isLoggedIn
              ? theme.palette.primary.main
              : theme.palette.grey[400],
          }}
        />

        {/* TEXT STATUS */}
        <Box>
          <Typography variant="body2" fontWeight="bold">
            Conectat ca:
          </Typography>
          <Typography variant="body2">
            {isLoggedIn ? user?.nume : 'Vizitator'}
          </Typography>
        </Box>

        {/* LOGIN / LOGOUT ‑ TEXT + ICON */}
        <Button
          variant="text"
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
            fontWeight: 700,
            textTransform: 'none',
            color: isLoggedIn
              ? theme.palette.error.main
              : theme.palette.success.main,
            transition: 'transform 0.15s',
            '&:hover': {
              backgroundColor: 'transparent',
              transform: 'scale(1.1)',
            },
          }}
        >
          {isLoggedIn ? 'Logout' : 'Login'}
        </Button>
      </Box>

      {/* DIALOG AUTENTIFICARE */}
      <LoginDialog
        open={openLoginDialog}
        onClose={() => setOpenLoginDialog(false)}
      />
    </>
  );
}
