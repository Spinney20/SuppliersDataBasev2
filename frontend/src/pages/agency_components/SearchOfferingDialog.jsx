import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Typography, CircularProgress,
  List, ListItem, ListItemText, Divider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useSearchSuppliersByOffering } from '../../api/queries';

const SearchOfferingDialog = ({ 
  open, 
  onClose, 
  agencyId, 
  type,
  onSupplierClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        setDebouncedSearchTerm(searchTerm);
      } else if (searchTerm.trim() === '') {
        setDebouncedSearchTerm('');
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Query for suppliers based on offering search
  const { data: suppliers = [], isLoading, isError } = useSearchSuppliersByOffering(
    agencyId, 
    debouncedSearchTerm,
    type
  );
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSupplierSelect = (supplier) => {
    onSupplierClick(supplier);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          color: '#fff',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InventoryIcon color="primary" />
          <Typography variant="h6">
            Caută după {type === 'material' ? 'materiale' : 'servicii'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 2 }}>
        <TextField
          autoFocus
          fullWidth
          variant="outlined"
          label={`Caută ${type === 'material' ? 'materiale' : 'servicii'}`}
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.7)' }} />,
          }}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(255,255,255,0.05)',
            '& .MuiInputBase-input': { color: '#fff' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover fieldset': { borderColor: '#fff' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
            '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
          }}
          placeholder="Ex: beton, ciment, lemn, etc."
        />
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {isError && (
          <Typography color="error" sx={{ textAlign: 'center', my: 2 }}>
            A apărut o eroare la căutare. Încearcă din nou.
          </Typography>
        )}
        
        {!isLoading && !isError && debouncedSearchTerm && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              {suppliers.length > 0 
                ? `${suppliers.length} furnizori găsiți pentru "${debouncedSearchTerm}"` 
                : `Nu s-au găsit furnizori pentru "${debouncedSearchTerm}"`}
            </Typography>
            
            <List sx={{ 
              maxHeight: '400px', 
              overflow: 'auto',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 1,
              border: suppliers.length > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              {suppliers.map((supplier, index) => (
                <Box key={supplier.id}>
                  <ListItem 
                    button 
                    onClick={() => handleSupplierSelect(supplier)}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                      transition: 'background-color 0.2s',
                      py: 1.5
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 500 }}>{supplier.name}</Typography>
                      }
                      secondary={
                        <Box sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                          <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                            Offerings: {supplier.offerings.map(o => o.name).join(', ')}
                          </Typography>
                          {supplier.office_phone && (
                            <Typography variant="body2" component="span" sx={{ display: 'block', mt: 0.5 }}>
                              Tel: {supplier.office_phone}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < suppliers.length - 1 && (
                    <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  )}
                </Box>
              ))}
            </List>
          </>
        )}
        
        {!isLoading && !debouncedSearchTerm && (
          <Box sx={{ 
            textAlign: 'center', 
            my: 4, 
            color: 'rgba(255,255,255,0.5)',
            p: 4,
            border: '1px dashed rgba(255,255,255,0.2)',
            borderRadius: 2
          }}>
            <InventoryIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
            <Typography>
              Introdu un termen de căutare pentru a găsi furnizori după {type === 'material' ? 'materiale' : 'servicii'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Minim 2 caractere pentru a începe căutarea
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          Închide
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SearchOfferingDialog; 