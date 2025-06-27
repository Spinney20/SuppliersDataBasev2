import { useState, useEffect } from 'react';
import { Box, Chip, IconButton, TextField, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const EditableOfferings = ({ offerings = [], onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editOfferings, setEditOfferings] = useState([...offerings]);
  const [newOffering, setNewOffering] = useState('');
  
  // Actualizează editOfferings când se schimbă offerings din props
  useEffect(() => {
    setEditOfferings([...offerings]);
  }, [offerings]);

  const handleAddOffering = () => {
    if (newOffering.trim()) {
      setEditOfferings([...editOfferings, newOffering.trim()]);
      setNewOffering('');
    }
  };

  const handleRemoveOffering = (index) => {
    setEditOfferings(editOfferings.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newOffering.trim()) {
      handleAddOffering();
      e.preventDefault();
    }
  };

  const handleSave = () => {
    onSave(editOfferings);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditOfferings([...offerings]);
    setNewOffering('');
    setIsEditing(false);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        mb: 2
      }}>
        {!isEditing && (
          <IconButton 
            onClick={() => setIsEditing(true)}
            size="small"
            className="edit-offerings-button"
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
        )}
      </Box>
      
      {isEditing ? (
        <Box>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mb: 2,
            p: 2,
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            minHeight: '50px'
          }}>
            {editOfferings.length === 0 && (
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                Nicio ofertă adăugată
              </Typography>
            )}
            
            {editOfferings.map((offering, index) => (
              <Chip
                key={index}
                label={offering || ''}
                onDelete={() => handleRemoveOffering(index)}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      color: 'rgba(255,100,100,0.9)'
                    }
                  }
                }}
              />
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              value={newOffering}
              onChange={(e) => setNewOffering(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Adaugă produs/serviciu"
              size="small"
              fullWidth
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: '#fff' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={handleAddOffering}
              disabled={!newOffering.trim()}
              startIcon={<AddIcon />}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                },
                '&.Mui-disabled': {
                  color: 'rgba(255,255,255,0.3)',
                  borderColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Adaugă
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<CloseIcon />}
              sx={{
                color: 'rgba(255,100,100,0.9)',
                borderColor: 'rgba(255,100,100,0.5)',
                '&:hover': {
                  borderColor: 'rgba(255,100,100,0.9)',
                  backgroundColor: 'rgba(255,0,0,0.05)'
                }
              }}
            >
              Anulează
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              startIcon={<SaveIcon />}
            >
              Salvează
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1,
          p: 2,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          minHeight: '50px'
        }}>
          {offerings.length === 0 && (
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
              Nicio ofertă adăugată
            </Typography>
          )}
          
          {offerings.map((offering, index) => (
            <Chip
              key={index}
              label={offering || ''}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff'
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default EditableOfferings; 