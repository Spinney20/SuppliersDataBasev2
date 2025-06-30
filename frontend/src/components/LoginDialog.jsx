import { useState, useEffect, useCallback, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { useUser } from '../context/UserContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LoginIcon from '@mui/icons-material/Login';
import CancelIcon from '@mui/icons-material/Cancel';
import { motion } from 'framer-motion';

// Import styles - definite în afara componentei pentru a evita recrearea la fiecare render
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

// Stiluri pentru Dialog - definite în afara componentei
const dialogPaperProps = {
  initial:  { opacity: 0, scale: 0.9 },
  animate:  { opacity: 1, scale: 1 },
  exit:     { opacity: 0, scale: 0.9 },
  transition: { duration: 0.25 },
  sx: { 
    backdropFilter: 'blur(8px)', 
    backgroundColor: 'rgba(10,10,10,0.85)',
    px: 2, 
    pb: 2, 
    borderRadius: 3,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
};

const dialogTitleSx = { 
  color: 'primary.main', 
  pb: 1,
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  py: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: 1
};

const tabsSx = { 
  borderBottom: 1, 
  borderColor: 'rgba(255,255,255,0.1)',
  '& .MuiTab-root': { 
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'none',
    fontSize: '0.9rem',
    '&.Mui-selected': {
      color: '#fff',
    }
  },
  '& .MuiTabs-indicator': {
    backgroundColor: 'primary.main',
  }
};

const dialogContentSx = {
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

const cancelButtonSx = {
  color: 'rgba(255,100,100,0.9)',
  borderColor: 'rgba(255,100,100,0.5)',
  textTransform: 'none',
  '&:hover': {
    borderColor: 'rgba(255,100,100,0.9)',
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
  },
};

const continueButtonSx = {
  textTransform: 'none',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
  }
};

const backButtonSx = {
  color: '#fff',
  borderColor: 'rgba(255,255,255,0.5)',
  textTransform: 'none',
  '&:hover': {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
};

// Folosim memo pentru a preveni re-renderizările inutile
const LoginDialog = memo(function LoginDialog({ open, onClose }) {
  const { login, isLoggedIn } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    // Date de autentificare
    email: '',
    smtp_pass: '',
    smtp_server: 'smtp.office365.com',  // Default for Outlook
    smtp_port: '587',                   // Default port
    smtp_user: '',                      // Will be filled with email by default
    
    // Date personale
    nume: '',
    post: '',
    telefon_mobil: '',
    telefon_fix: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        smtp_pass: '',
        smtp_server: 'smtp.office365.com',
        smtp_port: '587',
        smtp_user: '',
        nume: '',
        post: '',
        telefon_mobil: '',
        telefon_fix: '',
      });
      setError('');
      setIsSubmitting(false);
      setActiveTab(0);
      setShowAdvanced(false);
    }
  }, [open]);

  // Close dialog if user is logged in
  useEffect(() => {
    if (isLoggedIn && open) {
      onClose();
    }
  }, [isLoggedIn, open, onClose]);

  // Folosim useCallback pentru a preveni recrearea funcțiilor la fiecare render
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // If email changes, also update smtp_user if it's empty or matches the previous email
      if (name === 'email' && (!prev.smtp_user || prev.smtp_user === prev.email)) {
        return {
          ...prev,
          [name]: value,
          smtp_user: value
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleTogglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const setTabZero = useCallback(() => setActiveTab(0), []);
  const setTabOne = useCallback(() => setActiveTab(1), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    
    // Validări de bază
    if (!formData.email.trim()) {
      setError('Email-ul este obligatoriu');
      setActiveTab(0);
      return;
    }
    
    if (!formData.nume.trim()) {
      setError('Numele este obligatoriu');
      setActiveTab(1);
      return;
    }
    
    // Validare email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email-ul nu este valid');
      setActiveTab(0);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Apelează funcția de login din context
      const success = await login(formData);
      
      if (success) {
        onClose();
      } else {
        setError('A apărut o eroare la autentificare');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('A apărut o eroare la autentificare');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, login, onClose]);

  const toggleAdvancedSettings = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  return (
    <Dialog 
      open={open} 
      onClose={!isSubmitting ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperComponent={motion.div}
      PaperProps={dialogPaperProps}
      TransitionProps={{
        enterTransitionDuration: 200,
        exitTransitionDuration: 100,
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        <LoginIcon sx={{ mr: 1 }} color="primary" /> Autentificare
      </DialogTitle>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={tabsSx}
      >
        <Tab 
          label="Autentificare" 
          icon={<EmailIcon />} 
          iconPosition="start"
        />
        <Tab 
          label="Date personale" 
          icon={<PersonIcon />} 
          iconPosition="start"
        />
      </Tabs>
      
      <DialogContent sx={dialogContentSx}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {activeTab === 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>
                Date de autentificare
              </Typography>
              
              <TextField
                margin="dense"
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
                autoFocus
                disabled={isSubmitting}
                sx={textInputSX}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                margin="dense"
                label="Parolă email"
                name="smtp_pass"
                type={showPassword ? "text" : "password"}
                value={formData.smtp_pass}
                onChange={handleChange}
                fullWidth
                required
                disabled={isSubmitting}
                sx={textInputSX}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        sx={{ color: '#fff' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <Button 
                onClick={toggleAdvancedSettings}
                sx={{ 
                  color: '#fff', 
                  textTransform: 'none',
                  mt: 1,
                  fontSize: '0.85rem'
                }}
              >
                {showAdvanced ? "Ascunde setările avansate" : "Arată setările avansate"}
              </Button>
              
              {showAdvanced && (
                <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 1 }}>
                    Setări avansate pentru serverul de email
                  </Typography>
                  
                  <TextField
                    margin="dense"
                    label="Server SMTP"
                    name="smtp_server"
                    value={formData.smtp_server}
                    onChange={handleChange}
                    fullWidth
                    disabled={isSubmitting}
                    sx={textInputSX}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText={
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Pentru Outlook: smtp.office365.com
                      </Typography>
                    }
                    FormHelperTextProps={{
                      sx: { margin: 0 }
                    }}
                  />
                  
                  <TextField
                    margin="dense"
                    label="Port SMTP"
                    name="smtp_port"
                    value={formData.smtp_port}
                    onChange={handleChange}
                    fullWidth
                    disabled={isSubmitting}
                    sx={textInputSX}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText={
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        De obicei 587 (TLS) sau 465 (SSL)
                      </Typography>
                    }
                    FormHelperTextProps={{
                      sx: { margin: 0 }
                    }}
                  />
                  
                  <TextField
                    margin="dense"
                    label="Utilizator SMTP"
                    name="smtp_user"
                    value={formData.smtp_user}
                    onChange={handleChange}
                    fullWidth
                    disabled={isSubmitting}
                    sx={textInputSX}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText={
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        De obicei este adresa de email completă
                      </Typography>
                    }
                    FormHelperTextProps={{
                      sx: { margin: 0 }
                    }}
                  />
                </Box>
              )}
            </>
          )}
          
          {activeTab === 1 && (
            <>
              <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>
                Date personale
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }} paragraph>
                Aceste date vor apărea în antetul email-urilor trimise
              </Typography>
              
              <TextField
                margin="dense"
                label="Nume complet"
                name="nume"
                value={formData.nume}
                onChange={handleChange}
                fullWidth
                required
                disabled={isSubmitting}
                sx={textInputSX}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                margin="dense"
                label="Poziție / Funcție"
                name="post"
                value={formData.post}
                onChange={handleChange}
                fullWidth
                disabled={isSubmitting}
                sx={textInputSX}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                margin="dense"
                label="Telefon mobil"
                name="telefon_mobil"
                value={formData.telefon_mobil}
                onChange={handleChange}
                fullWidth
                disabled={isSubmitting}
                sx={textInputSX}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                margin="dense"
                label="Telefon fix"
                name="telefon_fix"
                value={formData.telefon_fix}
                onChange={handleChange}
                fullWidth
                disabled={isSubmitting}
                sx={textInputSX}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        justifyContent: 'space-between',
        mt: 1
      }}>
        <Button 
          onClick={onClose} 
          disabled={isSubmitting}
          variant="outlined"
          startIcon={<CancelIcon />}
          sx={cancelButtonSx}
        >
          Anulează
        </Button>
        
        {activeTab === 0 ? (
          <Button 
            onClick={setTabOne}
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
            sx={continueButtonSx}
          >
            Continuă
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={setTabZero}
              variant="outlined"
              disabled={isSubmitting}
              sx={backButtonSx}
            >
              Înapoi
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <LoginIcon />}
              sx={continueButtonSx}
            >
              Autentificare
            </Button>
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
});

export default LoginDialog; 