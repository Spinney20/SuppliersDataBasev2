import { useState, useEffect } from 'react';
import { Box, Chip, IconButton, Typography, Autocomplete, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { scrollbarStyles } from './styles';

const EditableCategories = ({ categories = [], allCategories = [], onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editCategories, setEditCategories] = useState([...categories]);
  
  console.log('EditableCategories props:', { categories, allCategories });
  
  // Actualizează editCategories când se schimbă categories din props
  useEffect(() => {
    setEditCategories([...categories]);
  }, [categories]);

  const handleSave = () => {
    onSave(editCategories);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditCategories([...categories]);
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
            className="edit-categories-button"
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
          <Autocomplete
            multiple 
            options={allCategories || []} 
            value={editCategories}
            getOptionLabel={o => o?.name || ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            filterSelectedOptions
            onChange={(_, v) => setEditCategories(v)}
            disableCloseOnSelect
            limitTags={5}
            ListboxProps={{
              style: {
                maxHeight: '200px',
              }
            }}
            renderInput={params => (
              <TextField 
                {...params} 
                label="Selectează categorii" 
                placeholder=""
                variant="outlined"
                autoComplete="off"
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
            )}
            sx={{ 
              '.MuiChip-root': { 
                backgroundColor: 'rgba(255,255,255,0.15)', 
                color: '#fff',
                borderRadius: '16px',
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: '#fff'
                  }
                }
              },
              '.MuiAutocomplete-listbox': scrollbarStyles,
              '.MuiAutocomplete-endAdornment': {
                top: 'calc(50% - 14px)'
              }
            }} 
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
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
              disabled={editCategories.length === 0}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
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
          {(!categories || categories.length === 0) && (
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
              Nicio categorie selectată
            </Typography>
          )}
          
          {categories && categories.map((category, index) => (
            <Chip
              key={index}
              label={category?.name || ''}
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

export default EditableCategories; 