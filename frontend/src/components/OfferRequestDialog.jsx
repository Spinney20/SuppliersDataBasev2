import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useUser } from '../context/UserContext';
import { useUserConfig } from '../api/queries';
import { api } from '../api/axios';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EmailIcon from '@mui/icons-material/Email';

export default function OfferRequestDialog({ open, onClose, type = 'material' }) {
  const { user, isLoggedIn } = useUser();
  const { data: userData, isLoading } = useUserConfig();
  
  const [formData, setFormData] = useState({
    type_mode: type, // 'material' or 'service'
    subcontract: false,
    subject: 'Cerere ofertă',
    tender_name: '',
    tender_number: '',
    items: [{ name: '', quantity: '', unit: '' }],
    documents: [],
    transfer_link: '',
    recipient_email: '',
  });
  
  const [isSending, setIsSending] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Update type when prop changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, type_mode: type }));
  }, [type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      type_mode: value,
      subcontract: value === 'service' ? prev.subcontract : false
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '', unit: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const fileNames = files.map(file => file.name);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...fileNames]
    }));
  };

  const removeDocument = (index) => {
    const newDocuments = formData.documents.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, documents: newDocuments }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.tender_name || !formData.tender_number || !formData.recipient_email) {
      setSnackbar({
        open: true,
        message: 'Vă rugăm completați toate câmpurile obligatorii',
        severity: 'error'
      });
      return;
    }
    
    // Validate items
    const validItems = formData.items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'Adăugați cel puțin un articol',
        severity: 'error'
      });
      return;
    }
    
    // Prepare data for backend
    const requestData = {
      ...formData,
      items: validItems,
      user_data: {
        nume: userData?.nume || user?.nume,
        post: userData?.post || user?.post,
        email: userData?.email || user?.email,
        smtp_pass: user?.smtp_pass,
        mobil: userData?.mobil || user?.mobil,
        telefon_fix: userData?.telefon_fix || user?.telefon_fix
      }
    };
    
    setIsSending(true);
    
    try {
      // Send data to backend
      const response = await api.post('/send-offer-request', requestData);
      
      setSnackbar({
        open: true,
        message: 'Cererea de ofertă a fost trimisă cu succes!',
        severity: 'success'
      });
      
      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sending offer request:', error);
      
      let errorMessage = 'Eroare la trimiterea cererii de ofertă';
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Alert severity="warning">
            Trebuie să fiți conectat pentru a trimite cereri de ofertă.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Închide
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <EmailIcon color="primary" />
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Cerere de ofertă
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Completați detaliile pentru cererea de ofertă
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Trimiteți ca: <strong>{userData?.nume || user?.nume}</strong> ({userData?.email || user?.email})
          </Typography>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tip cerere</InputLabel>
                    <Select
                      name="type_mode"
                      value={formData.type_mode}
                      onChange={handleTypeChange}
                      label="Tip cerere"
                    >
                      <MenuItem value="material">Materiale</MenuItem>
                      <MenuItem value="service">Servicii</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {formData.type_mode === 'service' && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Subcontractare</InputLabel>
                      <Select
                        name="subcontract"
                        value={formData.subcontract}
                        onChange={(e) => setFormData(prev => ({ ...prev, subcontract: e.target.value }))}
                        label="Subcontractare"
                      >
                        <MenuItem value={false}>Nu</MenuItem>
                        <MenuItem value={true}>Da</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    label="Subiect email"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Numele licitației"
                    name="tender_name"
                    value={formData.tender_name}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Numărul CN al licitației"
                    name="tender_number"
                    value={formData.tender_number}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Email destinatar"
                    name="recipient_email"
                    type="email"
                    value={formData.recipient_email}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Articole
                  </Typography>
                  
                  {formData.items.map((item, index) => (
                    <Paper 
                      key={index} 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        borderRadius: 1
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={5}>
                          <TextField
                            label={`${formData.type_mode === 'material' ? 'Material' : 'Serviciu'}`}
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            fullWidth
                            required
                          />
                        </Grid>
                        
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Cantitate"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Unitate de măsură"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            fullWidth
                            placeholder="ex: buc, m, kg"
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton 
                            color="error" 
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    Adaugă articol
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Documente atașate
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    {formData.documents.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.documents.map((doc, index) => (
                          <Chip
                            key={index}
                            label={doc}
                            onDelete={() => removeDocument(index)}
                            sx={{ maxWidth: '100%' }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Niciun document atașat
                      </Typography>
                    )}
                  </Box>
                  
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<FileUploadIcon />}
                    sx={{ mt: 1 }}
                  >
                    Încarcă documente
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={handleFileChange}
                    />
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Link TransferNow (opțional)"
                    name="transfer_link"
                    value={formData.transfer_link}
                    onChange={handleChange}
                    fullWidth
                    placeholder="https://transfernow.net/..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button 
              onClick={onClose} 
              variant="outlined"
              disabled={isSending}
            >
              Anulare
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isSending}
              startIcon={isSending ? <CircularProgress size={20} /> : <EmailIcon />}
            >
              {isSending ? 'Se trimite...' : 'Trimite cererea'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
} 