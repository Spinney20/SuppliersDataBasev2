import { memo } from 'react';
import { Dialog, DialogTitle, DialogActions, Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { StyledDialogContent } from './styles';
import SupplierForm from './SupplierForm';
import BusinessIcon from '@mui/icons-material/Business';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const AddSupplierDialog = memo(({
  open,
  onClose,
  supplierForm,
  updateSupplierField,
  updateSupplierContact,
  addSupplierContactRow,
  removeSupplierContactRow,
  cats,
  type,
  isLoading,
  onSave
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth maxWidth="md"
      PaperComponent={motion.div}
      PaperProps={{
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit:    { opacity: 0, scale: 0.9 },
        transition: { duration: 0.25 },
        sx: { 
          backdropFilter: 'blur(8px)', 
          backgroundColor: 'rgba(10,10,10,0.85)', 
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          width: '800px',
          maxWidth: '90vw'
        },
      }}
    >
      <DialogTitle sx={{ 
        color: '#fff', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        py: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1
      }}>
        <BusinessIcon sx={{ mr: 1 }} /> Adaugă furnizor
      </DialogTitle>

      <StyledDialogContent sx={{ display:'flex', flexDirection:'column', gap:2, px: 3 }}>
        <SupplierForm
          supplierForm={supplierForm}
          updateSupplierField={updateSupplierField}
          updateSupplierContact={updateSupplierContact}
          addSupplierContactRow={addSupplierContactRow}
          removeSupplierContactRow={removeSupplierContactRow}
          cats={cats}
          type={type}
        />
      </StyledDialogContent>

      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        justifyContent: 'space-between'
      }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          startIcon={<CancelIcon />}
          variant="outlined"
          sx={{
            color: 'rgba(255,100,100,0.9)',
            borderColor: 'rgba(255,100,100,0.5)',
            '&:hover': {
              borderColor: 'rgba(255,100,100,0.9)',
              backgroundColor: 'rgba(255,100,100,0.1)'
            }
          }}
        >
          Anulează
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={
            isLoading ||
            !supplierForm.name.trim() ||
            supplierForm.categories.length === 0
          }
          startIcon={
            isLoading
              ? <CircularProgress size={16} color="inherit" />
              : <SaveIcon />
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

export default AddSupplierDialog; 