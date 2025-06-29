import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button,
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
} from '@mui/material';
import { useUser } from '../context/UserContext';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import LoginDialog from './LoginDialog';

export default function UserStatus() {
  const { user, isLoggedIn, logout } = useUser();
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  
  const handleOpenLoginDialog = () => {
    setOpenLoginDialog(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <Box 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          left: 16, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          backgroundColor: 'transparent',
          padding: '8px 12px',
          color: 'white',
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: isLoggedIn ? 'primary.main' : 'grey.500' 
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              Conectat ca:
            </Typography>
            <Typography variant="body2">
              {isLoggedIn ? user?.nume : 'Vizitator'}
            </Typography>
          </Box>
        </Box>
        
        {isLoggedIn ? (
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              backgroundColor: 'rgba(211, 47, 47, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 1)',
              }
            }}
          >
            Logout
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<LoginIcon />}
            onClick={handleOpenLoginDialog}
            sx={{ 
              backgroundColor: 'rgba(46, 125, 50, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(46, 125, 50, 1)',
              }
            }}
          >
            Login
          </Button>
        )}
      </Box>

      <LoginDialog 
        open={openLoginDialog} 
        onClose={() => setOpenLoginDialog(false)} 
      />
    </>
  );
} 