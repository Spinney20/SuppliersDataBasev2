import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { useCategories, useSuppliers } from '../api/queries';
import { api } from '../api/axios';
import { useUser } from '../context/UserContext';
import OfferRequestDialog from './OfferRequestDialog';

// Dialog paper props for consistent styling
const dialogPaperProps = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
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

export default function MultiSendDialog({ open, onClose, agencyId, type, onSupplierSelect }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openOfferRequest, setOpenOfferRequest] = useState(false);
  const { isLoggedIn, user } = useUser();

  // Get categories
  const { data: categories = [], isLoading: loadingCategories } = useCategories(agencyId, type);
  
  // Get suppliers for the selected category
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers(
    agencyId, 
    selectedCategoryId
  );

  // Reset selections when dialog opens/closes or agency/type changes
  useEffect(() => {
    if (open) {
      setSelectedCategoryId('');
      setSelectedSuppliers([]);
      setError(null);
    }
  }, [open, agencyId, type]);

  // Handle category selection
  const handleCategoryChange = (event) => {
    setSelectedCategoryId(event.target.value);
    setSelectedSuppliers([]);
  };

  // Handle supplier selection toggle
  const handleSupplierToggle = (supplier) => {
    setSelectedSuppliers(prev => {
      const isSelected = prev.some(s => s.id === supplier.id);
      if (isSelected) {
        return prev.filter(s => s.id !== supplier.id);
      } else {
        return [...prev, supplier];
      }
    });
  };

  // Select all suppliers
  const handleSelectAll = () => {
    if (selectedSuppliers.length === suppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers([...suppliers]);
    }
  };

  // Continue to offer request form
  const handleContinue = () => {
    if (!isLoggedIn) {
      setError('Trebuie să fiți autentificat pentru a trimite cereri de ofertă.');
      return;
    }

    if (selectedSuppliers.length === 0) {
      setError('Selectați cel puțin un furnizor.');
      return;
    }

    // If onSupplierSelect prop exists, use it (called from OfferRequestDialog)
    if (onSupplierSelect) {
      const supplierContacts = prepareSupplierContacts();
      onSupplierSelect(supplierContacts);
      onClose(); // Close the dialog after selection
    } else {
      // Otherwise open the OfferRequestDialog (standalone mode)
      setOpenOfferRequest(true);
    }
  };

  // Prepare supplier contacts for the OfferRequestDialog
  const prepareSupplierContacts = () => {
    return selectedSuppliers.map(supplier => {
      const contactEmails = supplier.contacts
        .filter(c => c.email)
        .map(c => c.email);
      
      // Decide where to put the office email
      let recipientEmails = [...contactEmails];
      let ccEmails = [];
      
      if (supplier.office_email) {
        if (contactEmails.length > 0) {
          // If there are contact emails, put office email in CC
          ccEmails.push(supplier.office_email);
        } else {
          // If no contact emails, put office email in recipients
          recipientEmails.push(supplier.office_email);
        }
      }
      
      return {
        name: supplier.name,
        emails: recipientEmails,
        cc_emails: ccEmails
      };
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperComponent={motion.div}
        PaperProps={dialogPaperProps}
      >
        <DialogTitle sx={{ 
          color: 'primary.main',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon />
            <Typography variant="h5" component="div" fontWeight="bold">
              Selectare furnizori multipli - {type === 'material' ? 'Materiale' : 'Servicii'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Selector categorie */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Selectați categoria
              </InputLabel>
              <Select
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                label="Selectați categoria"
                disabled={loadingCategories}
                sx={{
                  color: '#fff',
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '.MuiSvgIcon-root': {
                    color: 'rgba(255,255,255,0.7)',
                  },
                }}
              >
                {loadingCategories ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                    <Box sx={{ ml: 1 }}>Se încarcă...</Box>
                  </MenuItem>
                ) : (
                  categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            
            {/* Lista de furnizori */}
            {selectedCategoryId && (
              <Paper 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)', 
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Box sx={{ 
                  p: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                    Furnizori disponibili ({suppliers.length})
                  </Typography>
                  
                  <Button 
                    size="small"
                    onClick={handleSelectAll}
                    sx={{ 
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    {selectedSuppliers.length === suppliers.length ? 'Deselectează tot' : 'Selectează tot'}
                  </Button>
                </Box>
                
                <List sx={{ 
                  maxHeight: 300, 
                  overflow: 'auto',
                  ...scrollbarStyles
                }}>
                  {loadingSuppliers ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : suppliers.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Nu există furnizori în această categorie
                      </Typography>
                    </Box>
                  ) : (
                    suppliers.map((supplier, index) => (
                      <div key={supplier.id}>
                        <ListItem 
                          button 
                          onClick={() => handleSupplierToggle(supplier)}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.05)'
                            },
                            backgroundColor: selectedSuppliers.some(s => s.id === supplier.id) 
                              ? 'rgba(25, 118, 210, 0.15)' 
                              : 'transparent'
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Checkbox
                              edge="start"
                              checked={selectedSuppliers.some(s => s.id === supplier.id)}
                              tabIndex={-1}
                              disableRipple
                              sx={{
                                color: 'rgba(255,255,255,0.5)',
                                '&.Mui-checked': {
                                  color: 'primary.main',
                                },
                              }}
                            />
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Typography sx={{ color: '#fff' }}>
                                {supplier.name}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                {supplier.office_email && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <BusinessIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                                      {supplier.office_email}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {supplier.contacts && supplier.contacts.length > 0 && supplier.contacts.filter(c => c.email).map((contact, contactIdx) => (
                                  <Box key={contactIdx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    <PersonIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
                                      {contact.full_name && `${contact.full_name}: `}{contact.email}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < suppliers.length - 1 && (
                          <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                        )}
                      </div>
                    ))
                  )}
                </List>
              </Paper>
            )}
            
            {/* Informații selecție */}
            {selectedSuppliers.length > 0 && (
              <Box sx={{ 
                p: 1.5, 
                backgroundColor: 'rgba(76,175,80,0.1)', 
                borderRadius: 1,
                border: '1px solid rgba(76,175,80,0.2)'
              }}>
                <Typography sx={{ color: '#4caf50', fontWeight: 'bold', mb: 0.5 }}>
                  {selectedSuppliers.length} furnizori selectați
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedSuppliers.slice(0, 5).map(supplier => (
                    <Chip 
                      key={supplier.id}
                      label={supplier.name}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(76,175,80,0.2)', 
                        color: '#fff',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  ))}
                  
                  {selectedSuppliers.length > 5 && (
                    <Chip 
                      label={`+${selectedSuppliers.length - 5}`}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        color: '#fff',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button 
            onClick={onClose}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#fff'
              }
            }}
          >
            Anulează
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleContinue}
            disabled={selectedSuppliers.length === 0 || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {onSupplierSelect ? 'Selectează' : 'Continuă'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Offer Request Dialog for standalone mode */}
      {!onSupplierSelect && (
        <OfferRequestDialog
          open={openOfferRequest}
          onClose={() => {
            setOpenOfferRequest(false);
            onClose(); // Close the multi-send dialog too when closing the offer request
          }}
          type={type}
          multiSendMode={true}
          supplierContacts={prepareSupplierContacts()}
        />
      )}
    </>
  );
}

// Scrollbar styles
const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0,0,0,0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(255,255,255,0.3)',
  },
}; 