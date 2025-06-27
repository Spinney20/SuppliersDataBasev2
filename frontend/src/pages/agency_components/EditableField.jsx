import { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const EditableField = ({ 
  value = '', 
  label, 
  icon, 
  onSave, 
  type = 'text',
  fullWidth = false,
  width
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  
  // Actualizează editValue când se schimbă value din props
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      mb: 2,
      width: fullWidth ? '100%' : 'auto',
      minWidth: width || 'auto'
    }}>
      {icon && (
        <Box sx={{ 
          color: 'rgba(255,255,255,0.7)', 
          mr: 1.5, 
          display: 'flex',
          alignItems: 'center',
          minWidth: 24
        }}>
          {icon}
        </Box>
      )}
      
      {isEditing ? (
        <>
          <TextField
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            variant="outlined"
            size="small"
            type={type}
            label={label}
            autoFocus
            fullWidth={fullWidth}
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
          <IconButton 
            color="primary" 
            onClick={handleSave}
            size="small"
            sx={{ ml: 1 }}
          >
            <SaveIcon fontSize="small" />
          </IconButton>
          <IconButton 
            onClick={handleCancel}
            size="small"
            sx={{ color: 'rgba(255,100,100,0.9)' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="caption" 
              component="div"
              sx={{ 
                color: 'rgba(255,255,255,0.6)', 
                fontSize: '0.7rem',
                mb: 0.3
              }}
            >
              {label}
            </Typography>
            <Typography 
              variant="body1"
              sx={{ 
                color: '#fff',
                wordBreak: 'break-word'
              }}
            >
              {value || <em style={{ opacity: 0.5 }}>Nespecificat</em>}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setIsEditing(true)}
            size="small"
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
        </>
      )}
    </Box>
  );
};

export default EditableField; 