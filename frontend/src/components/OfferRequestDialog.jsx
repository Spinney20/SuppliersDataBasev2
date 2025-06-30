import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Autocomplete,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkIcon from '@mui/icons-material/Link';
import { useUser } from '../context/UserContext';
import { api } from '../api/axios';
import { useCategories, useSuppliers } from '../api/queries';
import { motion } from 'framer-motion';
import { StyledDialogContent, textInputSX } from '../pages/agency_components/styles';
import EmailPreviewDialog from './EmailPreviewDialog';

const initialItem = { name: '', quantity: '', unit: '' };

// Adaug constante pentru localStorage
const STORAGE_KEY = 'offerRequestData';

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

export default function OfferRequestDialog({ open, onClose, type }) {
  const { user, isLoggedIn } = useUser();
  
  // Form fields
  const [subject, setSubject] = useState('');
  const [tenderName, setTenderName] = useState('');
  const [tenderNumber, setTenderNumber] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [ccRecipients, setCcRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [newCcRecipient, setNewCcRecipient] = useState('');
  const [items, setItems] = useState([{ ...initialItem }]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [transferLink, setTransferLink] = useState('');
  const [isSubcontract, setIsSubcontract] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  // Category and supplier selection
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);

  // Get categories based on type
  const { data: categories = [] } = useCategories(selectedAgencyId, type);
  
  // Get suppliers based on selected category
  const { data: suppliers = [] } = useSuppliers(
    selectedAgencyId, 
    selectedCategory?.id
  );

  // Add state for preview dialog
  const [openPreview, setOpenPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Funcție pentru salvarea datelor în localStorage
  const saveFormData = () => {
    const formData = {
      tenderName,
      tenderNumber,
      items,
      transferLink,
      isSubcontract
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  };

  // Funcție pentru încărcarea datelor din localStorage
  const loadFormData = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setTenderName(parsedData.tenderName || '');
        setTenderNumber(parsedData.tenderNumber || '');
        setItems(parsedData.items && parsedData.items.length > 0 ? parsedData.items : [{ ...initialItem }]);
        setTransferLink(parsedData.transferLink || '');
        setIsSubcontract(parsedData.isSubcontract || false);
      }
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
    }
  };

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (open) {
      // Reset all form fields
      resetFormFields();
      
      // Set default subject based on type
      setSubject(`Cerere de ofertă ${type === 'material' ? 'materiale' : 'servicii'} - Viarom Construct`);
      
      // Set agency ID from URL if available
      const pathParts = window.location.pathname.split('/');
      const agencyIdFromUrl = pathParts[2] ? parseInt(pathParts[2]) : null;
      setSelectedAgencyId(agencyIdFromUrl);

      // Încarcă datele salvate
      loadFormData();
    }
  }, [open, type]);

  // Salvează datele când se modifică
  useEffect(() => {
    if (open) {
      saveFormData();
    }
  }, [tenderName, tenderNumber, items, transferLink, isSubcontract, open]);

  // Function to reset all form fields
  const resetFormFields = () => {
    setSubject('');
    setTenderName('');
    setTenderNumber('');
    setRecipients([]);
    setCcRecipients([]);
    setNewRecipient('');
    setNewCcRecipient('');
    setItems([{ ...initialItem }]);
    setSelectedFiles([]);
    setTransferLink('');
    setIsSubcontract(false);
    setError(null);
    setSelectedCategory(null);
    setSelectedSuppliers([]);
    setIsSending(false);
    setOpenPreview(false);
    setPreviewData(null);

    // Șterge datele din localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error removing form data from localStorage:', error);
    }
  };

  // Handle adding a new item
  const handleAddItem = () => {
    setItems([...items, { ...initialItem }]);
  };

  // Handle removing an item
  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    if (newItems.length === 0) {
      newItems.push({ ...initialItem });
    }
    setItems(newItems);
  };

  // Handle item field changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Handle file selection
  const handleFileSelect = async () => {
    // For Electron
    if (window.api && window.api.openFileDialog) {
      try {
        const files = await window.api.openFileDialog({
          title: 'Selectează documente',
          filters: [
            { name: 'Toate fișierele', extensions: ['*'] }
          ],
          properties: ['openFile', 'multiSelections']
        });
        
        if (files && files.length > 0) {
          // Add new files to the list (avoid duplicates)
          const newFiles = files.filter(file => 
            !selectedFiles.some(existing => existing.path === file.path)
          );
          
          setSelectedFiles(prev => [...prev, ...newFiles]);
        }
      } catch (error) {
        console.error('Error selecting files:', error);
      }
    } else {
      // For web (fallback)
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          const fileObjects = files.map(file => ({
            name: file.name,
            path: URL.createObjectURL(file),
            size: file.size,
            type: file.type,
            file: file // Keep reference to the actual File object
          }));
          
          setSelectedFiles(prev => [...prev, ...fileObjects]);
        }
      };
      
      input.click();
    }
  };

  // Handle removing a file
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle adding a recipient email
  const handleAddRecipient = () => {
    if (newRecipient && isValidEmail(newRecipient) && !recipients.includes(newRecipient)) {
      setRecipients(prev => [...prev, newRecipient]);
      setNewRecipient('');
    }
  };

  // Handle removing a recipient email
  const handleRemoveRecipient = (email) => {
    setRecipients(prev => prev.filter(e => e !== email));
  };

  // Handle adding a CC recipient email
  const handleAddCcRecipient = () => {
    if (newCcRecipient && isValidEmail(newCcRecipient) && !ccRecipients.includes(newCcRecipient)) {
      setCcRecipients(prev => [...prev, newCcRecipient]);
      setNewCcRecipient('');
    }
  };

  // Handle removing a CC recipient email
  const handleRemoveCcRecipient = (email) => {
    setCcRecipients(prev => prev.filter(e => e !== email));
  };

  // Handle recipient input change with option to add on comma or space
  const handleRecipientInputChange = (e) => {
    const value = e.target.value;
    setNewRecipient(value);
    
    // Check if the user typed a comma or space after an email
    if (value.endsWith(',') || value.endsWith(' ')) {
      const email = value.slice(0, -1).trim();
      if (isValidEmail(email) && !recipients.includes(email)) {
        setRecipients(prev => [...prev, email]);
        setNewRecipient('');
      }
    }
  };

  // Handle CC input change with option to add on comma or space
  const handleCcInputChange = (e) => {
    const value = e.target.value;
    setNewCcRecipient(value);
    
    // Check if the user typed a comma or space after an email
    if (value.endsWith(',') || value.endsWith(' ')) {
      const email = value.slice(0, -1).trim();
      if (isValidEmail(email) && !ccRecipients.includes(email)) {
        setCcRecipients(prev => [...prev, email]);
        setNewCcRecipient('');
      }
    }
  };

  // Handle category selection
  const handleCategoryChange = (event) => {
    const categoryId = event.target.value;
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category);
    setSelectedSuppliers([]); // Reset selected suppliers when category changes
  };

  // Handle supplier selection
  const handleSupplierChange = (event, newValue) => {
    setSelectedSuppliers(newValue);
    
    // Auto-populate recipient and CC fields based on selected suppliers
    const recipientEmails = [];
    const ccEmails = [];
    
    newValue.forEach(supplier => {
      // Add contact emails to recipients
      supplier.contacts.forEach(contact => {
        if (contact.email && isValidEmail(contact.email) && !recipientEmails.includes(contact.email)) {
          recipientEmails.push(contact.email);
        }
      });
      
      // Add office email to CC if contacts exist, otherwise to recipients
      if (supplier.office_email && isValidEmail(supplier.office_email)) {
        if (supplier.contacts.length > 0) {
          if (!ccEmails.includes(supplier.office_email)) {
            ccEmails.push(supplier.office_email);
          }
        } else {
          if (!recipientEmails.includes(supplier.office_email)) {
            recipientEmails.push(supplier.office_email);
          }
        }
      }
    });
    
    setRecipients(recipientEmails);
    setCcRecipients(ccEmails);
  };

  // Validate email format
  const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Prepare data for the offer request
  const prepareOfferRequestData = () => {
    // Validate required fields
    if (!tenderName.trim()) {
      setError('Numele licitației este obligatoriu');
      return null;
    }
    
    if (!tenderNumber.trim()) {
      setError('Numărul anunțului este obligatoriu');
      return null;
    }
    
    if (recipients.length === 0) {
      setError('Adăugați cel puțin un destinatar');
      return null;
    }
    
    // Validate all recipient emails
    const invalidRecipients = recipients.filter(email => !isValidEmail(email));
    if (invalidRecipients.length > 0) {
      setError(`Următoarele adrese de email sunt invalide: ${invalidRecipients.join(', ')}`);
      return null;
    }
    
    // Validate all CC emails
    const invalidCcRecipients = ccRecipients.filter(email => !isValidEmail(email));
    if (invalidCcRecipients.length > 0) {
      setError(`Următoarele adrese CC sunt invalide: ${invalidCcRecipients.join(', ')}`);
      return null;
    }
    
    // Validate items
    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      setError('Adăugați cel puțin un articol');
      return null;
    }
    
    // Check if user is authenticated and has the necessary data
    if (!isLoggedIn || !user || !user.email || !user.smtp_pass) {
      setError('Trebuie să fiți autentificat cu datele de email complete pentru a trimite cereri de ofertă.');
      return null;
    }
    
    // Prepare data for the offer request
    return {
      type_mode: type,
      subcontract: isSubcontract,
      subject: subject,
      tender_name: tenderName,
      tender_number: tenderNumber,
      items: validItems.map(item => ({
        name: item.name,
        quantity: item.quantity || null,
        unit: item.unit || null
      })),
      documents: selectedFiles.map(file => file.name),
      transfer_link: transferLink || null,
      recipient_emails: recipients,
      cc_emails: ccRecipients,
      user_data: {
        nume: user.nume,
        post: user.post || '',
        email: user.email,
        smtp_pass: user.smtp_pass,
        smtp_server: user.smtp_server || 'smtp.office365.com',
        smtp_port: user.smtp_port || '587',
        smtp_user: user.smtp_user || user.email,
        telefon_mobil: user.telefon_mobil || '',
        telefon_fix: user.telefon_fix || ''
      }
    };
  };

  // Handle preview button click
  const handlePreview = () => {
    setError(null);
    const data = prepareOfferRequestData();
    if (data) {
      setPreviewData(data);
      setOpenPreview(true);
    }
  };

  // Handle sending email after preview
  const handleSendAfterPreview = (updatedData) => {
    // Verificăm dacă există conținut HTML personalizat
    if (updatedData.custom_html) {
      const dataWithCustomHtml = {
        ...updatedData,
        custom_html: updatedData.custom_html
      };
      sendEmail(dataWithCustomHtml);
    } else {
      sendEmail(updatedData);
    }
  };

  // Handle editing email data from preview
  const handleEditFromPreview = (updatedData) => {
    // Update subject if it was changed
    if (updatedData.subject !== subject) {
      setSubject(updatedData.subject);
    }
  };

  // Send email function
  const sendEmail = async (data) => {
    try {
      setIsSending(true);
      setError(null);
      
      console.log('Sending offer request data:', JSON.stringify(data, null, 2));
      
      // Send request to backend
      const response = await api.post('/send-offer-request', data);
      
      if (response.data && response.data.success) {
        // Close dialog and show success message
        onClose();
        alert('Cererea de ofertă a fost trimisă cu succes!');
      } else {
        setError('A apărut o eroare la trimiterea cererii de ofertă.');
      }
    } catch (error) {
      console.error('Error sending offer request:', error);
      setError(`Eroare: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle send email button click
  const handleSendEmail = () => {
    const data = prepareOfferRequestData();
    if (data) {
      handlePreview(); // Show preview instead of sending directly
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={!isSending ? onClose : undefined}
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
            <EmailIcon />
            <Typography variant="h5" component="div" fontWeight="bold">
              Cerere de ofertă {type === 'material' ? 'materiale' : 'servicii'}
            </Typography>
          </Box>

          {/* Buton de resetare */}
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={resetFormFields}
            sx={{
              textTransform: 'none',
              borderColor: 'rgba(255,100,100,0.5)',
              color: 'rgba(255,100,100,0.9)',
              '&:hover': {
                borderColor: 'rgba(255,100,100,0.9)',
                backgroundColor: 'rgba(255, 0, 0, 0.08)',
              }
            }}
          >
            Resetează formularul
          </Button>
        </DialogTitle>
        
        <StyledDialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            
            {/* 1. Detalii licitație */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 0.5 }}>
                Detalii licitație
              </Typography>
              
              <TextField
                label="Subiect email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                fullWidth
                size="small"
                required
                sx={textInputSX}
              />
              
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField
                  label="Nume licitație"
                  value={tenderName}
                  onChange={(e) => setTenderName(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  sx={textInputSX}
                />
                
                <TextField
                  label="Număr anunț"
                  value={tenderNumber}
                  onChange={(e) => setTenderNumber(e.target.value)}
                  fullWidth
                  size="small"
                  required
                  sx={textInputSX}
                />
              </Box>
              
              {type === 'service' && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={isSubcontract}
                      onChange={(e) => setIsSubcontract(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Cerere de subcontractare"
                  sx={{ mt: 0.5, color: '#fff', '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                />
              )}
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* 2. Destinatari */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 0.5 }}>
                Destinatari
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={recipients}
                  inputValue={newRecipient}
                  onInputChange={(event, value) => setNewRecipient(value)}
                  onChange={(event, newValue) => setRecipients(newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        sx={{ 
                          backgroundColor: 'rgba(25, 118, 210, 0.15)',
                          color: '#fff',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { color: '#fff' }
                          }
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Destinatari"
                      placeholder="Adaugă email și apasă Enter..."
                      size="small"
                      sx={textInputSX}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newRecipient && isValidEmail(newRecipient)) {
                          e.preventDefault();
                          if (!recipients.includes(newRecipient)) {
                            setRecipients([...recipients, newRecipient]);
                            setNewRecipient('');
                          }
                        }
                      }}
                    />
                  )}
                />
                
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={ccRecipients}
                  inputValue={newCcRecipient}
                  onInputChange={(event, value) => setNewCcRecipient(value)}
                  onChange={(event, newValue) => setCcRecipients(newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { color: '#fff' }
                          }
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="CC"
                      placeholder="Adaugă email și apasă Enter..."
                      size="small"
                      sx={textInputSX}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCcRecipient && isValidEmail(newCcRecipient)) {
                          e.preventDefault();
                          if (!ccRecipients.includes(newCcRecipient)) {
                            setCcRecipients([...ccRecipients, newCcRecipient]);
                            setNewCcRecipient('');
                          }
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* 3. Selectare furnizori */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 0.5 }}>
                Selectare furnizori
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ flex: 1, ...textInputSX }}>
                  <InputLabel>Categorie</InputLabel>
                  <Select
                    value={selectedCategory?.id || ''}
                    onChange={handleCategoryChange}
                    label="Categorie"
                    size="small"
                  >
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Autocomplete
                  multiple
                  options={suppliers}
                  getOptionLabel={(option) => option.name}
                  value={selectedSuppliers}
                  onChange={handleSupplierChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Furnizori"
                      size="small"
                      sx={textInputSX}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index })}
                        size="small"
                        sx={{ 
                          backgroundColor: 'rgba(25, 118, 210, 0.15)',
                          color: '#fff',
                          '& .MuiChip-deleteIcon': {
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { color: '#fff' }
                          }
                        }}
                      />
                    ))
                  }
                  sx={{ flex: 2 }}
                  disabled={!selectedCategory}
                />
              </Box>
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* 4. Articole */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 0.5 }}>
                Articole
              </Typography>
              
              {items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 0.75, alignItems: 'center' }}>
                  <TextField
                    label="Denumire"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    sx={{ flex: 3, ...textInputSX }}
                    size="small"
                    required
                  />
                  
                  <TextField
                    label="Cantitate"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    sx={{ flex: 1, ...textInputSX }}
                    size="small"
                  />
                  
                  <TextField
                    label="UM"
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    sx={{ flex: 1, ...textInputSX }}
                    size="small"
                  />
                  
                  <IconButton
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    size="small"
                    sx={{ color: 'rgba(255,100,100,0.9)' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                size="small"
                sx={{ 
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: '#fff' }
                }}
                variant="outlined"
              >
                Adaugă articol
              </Button>
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* 5. Documente și link-uri */}
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 0.5 }}>
                Documente și link-uri (opțional)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AttachFileIcon />}
                      onClick={handleFileSelect}
                      size="small"
                      sx={{ 
                        color: '#fff',
                        borderColor: 'rgba(255,255,255,0.5)',
                        '&:hover': { borderColor: '#fff' }
                      }}
                    >
                      Adaugă document
                    </Button>
                  </Box>
                  
                  {selectedFiles.length > 0 && (
                    <List dense sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 1,
                      maxHeight: '100px',
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(255, 255, 255, 0.05)',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px',
                      },
                    }}>
                      {selectedFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          dense
                          secondaryAction={
                            <IconButton edge="end" onClick={() => handleRemoveFile(index)} sx={{ color: 'rgba(255,100,100,0.9)' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText 
                            primary={file.name} 
                            secondary={`${(file.size / 1024).toFixed(1)} KB`}
                            primaryTypographyProps={{ color: '#fff', fontSize: '0.85rem' }}
                            secondaryTypographyProps={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                
                <TextField
                  label="Link transfer fișiere"
                  value={transferLink}
                  onChange={(e) => setTransferLink(e.target.value)}
                  size="small"
                  fullWidth
                  sx={{ flex: 1, ...textInputSX }}
                  placeholder="ex: https://wetransfer.com/..."
                  InputProps={{
                    startAdornment: (
                      <LinkIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem' }} />
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>
        </StyledDialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button 
            onClick={onClose}
            disabled={isSending}
            variant="outlined"
            size="small"
            sx={{
              color: 'rgba(255,100,100,0.9)',
              borderColor: 'rgba(255,100,100,0.5)',
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
            color="primary"
            onClick={handleSendEmail}
            disabled={isSending}
            size="small"
            startIcon={isSending ? <CircularProgress size={16} /> : <EmailIcon />}
            sx={{
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              }
            }}
          >
            {isSending ? 'Se trimite...' : 'Previzualizează și trimite'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        emailData={previewData}
        onSend={handleSendAfterPreview}
        onEdit={handleEditFromPreview}
        onBackToEdit={(data) => {
          // Update subject if it was changed
          if (data.subject !== subject) {
            setSubject(data.subject);
          }
          setOpenPreview(false);
        }}
      />
    </>
  );
} 