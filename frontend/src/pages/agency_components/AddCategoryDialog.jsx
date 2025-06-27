import { memo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { textInputSX } from './styles';
import CategoryIcon from '@mui/icons-material/Category';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';

const AddCategoryDialog = memo(({
  open,
  onClose,
  catName,
  setCatName,
  type,
  isLoading,
  onSave
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperComponent={motion.div}
      PaperProps={{
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
          width: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        },
      }}
    >
      <DialogTitle sx={{ 
        color: '#fff', 
        pb: 1,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1,
        color: 'primary.main'
      }}>
        <CategoryIcon sx={{ mr: 1 }} color="primary" /> Adaugă categorie ({type})
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Nume categorie"
          value={catName}
          onChange={e => setCatName(e.target.value)}
          disabled={isLoading}
          variant="outlined"
          autoComplete="off"
          placeholder=""
          sx={{
            mt: 2,
            ...textInputSX
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
      </DialogContent>

      <DialogActions sx={{ 
        pr: 2, 
        pt: 1,
        justifyContent: 'space-between',
        mt: 2
      }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isLoading}
          startIcon={<CancelIcon />}
          sx={{
            color: 'rgba(255,100,100,0.9)',
            borderColor: 'rgba(255,100,100,0.5)',
            textTransform: 'none',
            '&:hover': {
              borderColor: 'rgba(255,100,100,0.9)',
              backgroundColor: 'rgba(255, 0, 0, 0.08)',
            },
          }}
        >
          Anulează
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={isLoading || !catName.trim()}
          startIcon={
            isLoading
              ? <CircularProgress size={16} color="inherit" />
              : <AddIcon />
          }
          sx={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            }
          }}
        >
          Salvează
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default AddCategoryDialog; 