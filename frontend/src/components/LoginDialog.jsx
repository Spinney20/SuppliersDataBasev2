import { useState, useEffect } from 'react';
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
  IconButton
} from '@mui/material';
import { useUser } from '../context/UserContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function LoginDialog({ open, onClose }) {
  const { login, isLoggedIn } = useUser();
  const [formData, setFormData] = useState({
    nume: '',
    email: '',
    smtp_server: '',
    smtp_port: '',
    smtp_user: '',
    smtp_pass: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        nume: '',
        email: '',
        smtp_server: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: '',
      });
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  // Close dialog if user is logged in
  useEffect(() => {
    if (isLoggedIn && open) {
      onClose();
    }
  }, [isLoggedIn, open, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.nume.trim()) {
      setError('Numele este obligatoriu');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email-ul este obligatoriu');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email-ul nu este valid');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call login function from context
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
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog 
      open={open} 
      onClose={!isSubmitting ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Autentificare</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Typography variant="subtitle1" gutterBottom>
            Informații personale
          </Typography>
          
          <TextField
            margin="dense"
            label="Nume"
            name="nume"
            value={formData.nume}
            onChange={handleChange}
            fullWidth
            required
            autoFocus
            disabled={isSubmitting}
          />
          
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            disabled={isSubmitting}
          />
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Configurare email (opțional)
          </Typography>
          <Typography variant="caption" color="text.secondary" paragraph>
            Aceste date sunt necesare pentru a trimite cereri de ofertă direct din aplicație
          </Typography>
          
          <TextField
            margin="dense"
            label="Server SMTP"
            name="smtp_server"
            value={formData.smtp_server}
            onChange={handleChange}
            fullWidth
            disabled={isSubmitting}
            placeholder="ex: smtp.gmail.com"
          />
          
          <TextField
            margin="dense"
            label="Port SMTP"
            name="smtp_port"
            value={formData.smtp_port}
            onChange={handleChange}
            fullWidth
            disabled={isSubmitting}
            placeholder="ex: 587"
          />
          
          <TextField
            margin="dense"
            label="Utilizator SMTP"
            name="smtp_user"
            value={formData.smtp_user}
            onChange={handleChange}
            fullWidth
            disabled={isSubmitting}
            placeholder="De obicei adresa de email"
          />
          
          <TextField
            margin="dense"
            label="Parolă SMTP"
            name="smtp_pass"
            type={showPassword ? "text" : "password"}
            value={formData.smtp_pass}
            onChange={handleChange}
            fullWidth
            disabled={isSubmitting}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={isSubmitting}
        >
          Anulează
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Autentificare'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 