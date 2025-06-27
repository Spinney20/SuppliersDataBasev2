import { memo, useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogActions, Button, CircularProgress, Box, Typography, 
  IconButton, Tabs, Tab, Divider, Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import { StyledDialogContent } from './styles';
import BusinessIcon from '@mui/icons-material/Business';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import ContactsIcon from '@mui/icons-material/Contacts';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// Componente editabile
import EditableField from './EditableField';
import EditableContact from './EditableContact';
import EditableOfferings from './EditableOfferings';
import EditableCategories from './EditableCategories';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supplier-tabpanel-${index}`}
      aria-labelledby={`supplier-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && children}
    </div>
  );
}

const SupplierDetailsDialog = memo(({
  open,
  onClose,
  supplier,
  cats,
  type,
  onSave,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [supplierData, setSupplierData] = useState({
    name: supplier?.name || '',
    email: supplier?.office_email || '',
    phone: supplier?.office_phone || '',
    categories: supplier?.categories || [],
    contacts: supplier?.contacts?.length ? [...supplier.contacts] : [],
    offerings: supplier?.offerings?.map(o => o.name) || []
  });
  
  // Resetează datele când se deschide dialogul cu un nou furnizor
  useEffect(() => {
    if (supplier) {
      console.log('Supplier data in dialog:', supplier);
      console.log('Categories in dialog:', supplier.categories);
      console.log('All categories:', cats);
      
      // Convertim category_ids în obiecte complete de categorii dacă este necesar
      let supplierCategories = supplier.categories || [];
      
      // Dacă avem doar category_ids și nu obiecte complete
      if (supplier.category_ids && cats.length > 0) {
        supplierCategories = supplier.category_ids.map(catId => {
          const foundCat = cats.find(c => c.id === catId);
          return foundCat || { id: catId, name: `Categoria ${catId}` };
        });
      }
      
      setSupplierData({
        name: supplier.name || '',
        email: supplier.office_email || '',
        phone: supplier.office_phone || '',
        categories: supplierCategories,
        contacts: supplier.contacts?.length ? [...supplier.contacts] : [],
        offerings: supplier.offerings?.map(o => o.name) || []
      });
    }
  }, [supplier, cats]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    if (onSave) {
      // Prepare data for saving - convert empty strings to null for email fields
      // and filter out contacts with empty names
      const preparedData = {
        ...supplierData,
        email: supplierData.email || null,
        phone: supplierData.phone || null,
        contacts: supplierData.contacts
          .filter(contact => contact.full_name.trim() || contact.email?.trim() || contact.phone?.trim()) // Filter out completely empty contacts
          .map(contact => ({
            ...contact,
            email: contact.email || null,
            phone: contact.phone || null
          }))
      };
      onSave(preparedData);
    }
  };

  // Funcții pentru actualizarea câmpurilor individuale
  const handleUpdateField = (field, value) => {
    setSupplierData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateContact = (index, updatedContact) => {
    setSupplierData(prev => {
      const newContacts = [...prev.contacts];
      newContacts[index] = updatedContact;
      return {
        ...prev,
        contacts: newContacts
      };
    });
  };

  const handleDeleteContact = (index) => {
    setSupplierData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleAddContact = () => {
    const newContact = { full_name: '', email: '', phone: '' };
    const newIndex = supplierData.contacts.length;
    
    setSupplierData(prev => ({
      ...prev,
      contacts: [...prev.contacts, newContact]
    }));
    
    // Set a small timeout to ensure the new contact is added to the DOM before trying to edit it
    setTimeout(() => {
      // Trigger edit mode for the newly added contact
      const contactElement = document.querySelector(`[data-contact-index="${newIndex}"]`);
      if (contactElement) {
        const editButton = contactElement.querySelector('.edit-contact-button');
        if (editButton) {
          editButton.click();
        }
      }
    }, 50);
  };

  const handleUpdateOfferings = (newOfferings) => {
    setSupplierData(prev => ({
      ...prev,
      offerings: newOfferings
    }));
  };

  const handleUpdateCategories = (newCategories) => {
    setSupplierData(prev => ({
      ...prev,
      categories: newCategories
    }));
  };

  const hasChanges = () => {
    // Verifică dacă supplier există
    if (!supplier) return false;
    
    return (
      supplierData.name !== supplier.name ||
      supplierData.email !== supplier.office_email ||
      supplierData.phone !== supplier.office_phone ||
      supplierData.categories.length !== (supplier.categories?.length || 0) ||
      supplierData.contacts.length !== (supplier.contacts?.length || 0) ||
      supplierData.offerings.length !== (supplier.offerings?.length || 0)
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth 
      maxWidth="md"
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
        justifyContent: 'space-between',
        mb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" sx={{ mr: 1 }} /> 
          <EditableField
            value={supplierData.name}
            label="Nume furnizor"
            onSave={(value) => handleUpdateField('name', value)}
          />
        </Box>
        <IconButton onClick={handleClose}>
          <CloseIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            px: 2
          }}
        >
          <Tab 
            label="Informații generale" 
            icon={<BusinessIcon />} 
            iconPosition="start" 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Contacte" 
            icon={<ContactsIcon />} 
            iconPosition="start" 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label="Categorii" 
            icon={<CategoryIcon />} 
            iconPosition="start" 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            label={type === 'material' ? "Materiale disponibile" : "Servicii disponibile"}
            icon={<InventoryIcon />} 
            iconPosition="start" 
            sx={{ textTransform: 'none' }}
          />
        </Tabs>
      </Box>

      <StyledDialogContent sx={{ px: 3 }}>
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            p: 3, 
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Typography variant="subtitle1" sx={{ 
              mb: 3, 
              fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              pb: 1,
              color: 'primary.main'
            }}>
              <BusinessIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
              Informații generale
            </Typography>
            
            <EditableField 
              icon={<EmailIcon />}
              value={supplierData.email}
              label="Email"
              type="email"
              fullWidth
              onSave={(value) => handleUpdateField('email', value)}
            />
            
            <EditableField 
              icon={<PhoneIcon />}
              value={supplierData.phone}
              label="Telefon"
              fullWidth
              onSave={(value) => handleUpdateField('phone', value)}
            />
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            p: 3, 
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              pb: 1,
            }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 500,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center'
              }}>
                <ContactsIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                Contacte
              </Typography>
              
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddContact}
                size="small"
                sx={{
                  color: '#fff',
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    color: 'primary.main',
                  }
                }}
              >
                Adaugă contact
              </Button>
            </Box>
            
            {supplierData.contacts.length === 0 && (
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                Nu există contacte adăugate
              </Typography>
            )}
            
            <Box sx={{
              maxHeight: supplierData.contacts.length > 3 ? '400px' : 'unset',
              overflowY: supplierData.contacts.length > 3 ? 'auto' : 'visible',
              pr: supplierData.contacts.length > 3 ? 1 : 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              },
            }}>
              {supplierData.contacts.map((contact, index) => (
                <EditableContact
                  key={index}
                  contact={contact}
                  index={index}
                  onSave={handleUpdateContact}
                  onDelete={handleDeleteContact}
                />
              ))}
            </Box>
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            p: 3, 
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Typography variant="subtitle1" sx={{ 
              mb: 3, 
              fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              pb: 1,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center'
            }}>
              <CategoryIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
              Categoriile de {type === 'material' ? "materiale" : "servicii"} din care face parte furnizorul
            </Typography>
            
            <EditableCategories
              categories={supplierData.categories}
              allCategories={cats}
              onSave={handleUpdateCategories}
              className="editable-categories-component"
            />
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            p: 3, 
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Typography variant="subtitle1" sx={{ 
              mb: 3, 
              fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              pb: 1,
              color: 'primary.main'
            }}>
              <InventoryIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
              {type === 'material' ? "Materialele" : "Serviciile"} disponibile de la acest furnizor
            </Typography>
            
            <EditableOfferings
              offerings={supplierData.offerings}
              onSave={handleUpdateOfferings}
            />
          </Box>
        </TabPanel>
      </StyledDialogContent>

      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        justifyContent: 'flex-end'
      }}>
        {hasChanges() && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isLoading || !supplierData.name.trim() || supplierData.categories.length === 0}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              }
            }}
          >
            Salvează modificările
          </Button>
        )}
        
        <Button 
          onClick={handleClose} 
          disabled={isLoading}
          variant="outlined"
          sx={{
            color: '#fff',
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
});

export default SupplierDetailsDialog; 