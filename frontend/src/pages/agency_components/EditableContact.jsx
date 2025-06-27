import { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const EditableContact = ({ 
  contact = { full_name: '', email: '', phone: '' }, 
  onSave, 
  onDelete,
  index
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    full_name: contact.full_name || '',
    email: contact.email || '',
    phone: contact.phone || ''
  });
  
  // Actualizează editValues când se schimbă contact din props
  useEffect(() => {
    setEditValues({
      full_name: contact.full_name || '',
      email: contact.email || '',
      phone: contact.phone || ''
    });
  }, [contact]);

  const handleChange = (field, value) => {
    setEditValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Basic email validation
    if (editValues.email && !isValidEmail(editValues.email)) {
      alert('Adresa de email nu este validă');
      return;
    }
    
    onSave(index, editValues);
    setIsEditing(false);
  };

  // Simple email validation function
  const isValidEmail = (email) => {
    if (!email) return true; // Empty emails are allowed
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCancel = () => {
    setEditValues({
      full_name: contact.full_name || '',
      email: contact.email || '',
      phone: contact.phone || ''
    });
    setIsEditing(false);
  };

  return (
    <Paper 
      elevation={0}
      data-contact-index={index}
      sx={{ 
        mb: 2, 
        p: 2, 
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {isEditing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
              <PersonIcon />
            </Box>
            <TextField
              value={editValues.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              variant="outlined"
              size="small"
              label="Nume"
              autoFocus
              fullWidth
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: '#fff',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
              <EmailIcon />
            </Box>
            <TextField
              value={editValues.email}
              onChange={(e) => handleChange('email', e.target.value)}
              variant="outlined"
              size="small"
              label="Email"
              type="email"
              fullWidth
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: '#fff',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: 'rgba(255,255,255,0.7)', display: 'flex' }}>
              <PhoneIcon />
            </Box>
            <TextField
              value={editValues.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              variant="outlined"
              size="small"
              label="Telefon"
              fullWidth
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& .MuiInputLabel-root': { color: '#fff' },
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#fff' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: '#fff',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
            <IconButton 
              onClick={handleCancel}
              size="small"
              sx={{ color: 'rgba(255,100,100,0.9)' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            <IconButton 
              color="primary" 
              onClick={handleSave}
              size="small"
              disabled={!editValues.full_name.trim()}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                {contact.full_name}
              </Typography>
            </Box>
            
            {contact.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <EmailIcon sx={{ color: 'rgba(255,255,255,0.5)', mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {contact.email}
                </Typography>
              </Box>
            )}
            
            {contact.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ color: 'rgba(255,255,255,0.5)', mr: 1, fontSize: '1rem' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {contact.phone}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <IconButton 
              onClick={() => setIsEditing(true)}
              size="small"
              className="edit-contact-button"
              sx={{ 
                color: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={() => onDelete(index)}
              size="small"
              sx={{ 
                color: 'rgba(255,100,100,0.7)',
                '&:hover': {
                  color: 'rgba(255,100,100,0.9)',
                  backgroundColor: 'rgba(255,0,0,0.1)'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default EditableContact; 