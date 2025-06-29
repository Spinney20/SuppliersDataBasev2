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
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useUser } from '../context/UserContext';
import { api } from '../api/axios';

const initialItem = { name: '', quantity: '', unit: '' };

export default function OfferRequestDialog({ open, onClose, type }) {
  const { user, isLoggedIn } = useUser();
  const [subject, setSubject] = useState('');
  const [tenderName, setTenderName] = useState('');
  const [tenderNumber, setTenderNumber] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [items, setItems] = useState([{ ...initialItem }]);
  const [documents, setDocuments] = useState([]);
  const [transferLink, setTransferLink] = useState('');
  const [isSubcontract, setIsSubcontract] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [newDocument, setNewDocument] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSubject('');
      setTenderName('');
      setTenderNumber('');
      setRecipientEmail('');
      setItems([{ ...initialItem }]);
      setDocuments([]);
      setTransferLink('');
      setIsSubcontract(false);
      setError(null);
      
      // Set default subject based on type
      setSubject(`Cerere de ofertă ${type === 'material' ? 'materiale' : 'servicii'} - Viarom Construct`);
    }
  }, [open, type]);

  const handleAddItem = () => {
    setItems([...items, { ...initialItem }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    if (newItems.length === 0) {
      newItems.push({ ...initialItem });
    }
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddDocument = () => {
    if (newDocument.trim()) {
      setDocuments([...documents, newDocument.trim()]);
      setNewDocument('');
    }
  };

  const handleRemoveDocument = (index) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
  };

  const handleSendEmail = async () => {
    // Validare câmpuri obligatorii
    if (!tenderName.trim()) {
      setError('Numele licitației este obligatoriu');
      return;
    }
    
    if (!tenderNumber.trim()) {
      setError('Numărul anunțului este obligatoriu');
      return;
    }
    
    if (!recipientEmail.trim()) {
      setError('Adresa de email a destinatarului este obligatorie');
      return;
    }
    
    // Validare email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      setError('Adresa de email a destinatarului nu este validă');
      return;
    }
    
    // Validare articole
    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      setError('Adăugați cel puțin un articol');
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      // Verifică dacă utilizatorul este autentificat și are datele necesare
      if (!isLoggedIn || !user || !user.email || !user.smtp_pass) {
        setError('Trebuie să fiți autentificat cu datele de email complete pentru a trimite cereri de ofertă.');
        setIsSending(false);
        return;
      }
      
      // Pregătește datele pentru cererea de ofertă
      const offerRequestData = {
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
        documents: documents,
        transfer_link: transferLink || null,
        recipient_email: recipientEmail,
        user_data: {
          nume: user.nume,
          post: user.post || '',
          email: user.email,
          smtp_pass: user.smtp_pass,
          smtp_server: user.smtp_server || 'smtp.gmail.com',
          smtp_port: user.smtp_port || '587',
          smtp_user: user.smtp_user || user.email,
          telefon_mobil: user.telefon_mobil || '',
          telefon_fix: user.telefon_fix || ''
        }
      };
      
      // Trimite cererea către backend
      const response = await api.post('/send-offer-request', offerRequestData);
      
      if (response.data && response.data.success) {
        // Închide dialogul și afișează mesaj de succes
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

  return (
    <Dialog
      open={open}
      onClose={!isSending ? onClose : undefined}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight="bold">
          Cerere de ofertă {type === 'material' ? 'materiale' : 'servicii'}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Detalii licitație
            </Typography>
            
            <TextField
              label="Subiect email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              fullWidth
              margin="dense"
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <TextField
                label="Nume licitație"
                value={tenderName}
                onChange={(e) => setTenderName(e.target.value)}
                fullWidth
                margin="dense"
                required
              />
              
              <TextField
                label="Număr anunț"
                value={tenderNumber}
                onChange={(e) => setTenderNumber(e.target.value)}
                fullWidth
                margin="dense"
                required
              />
            </Box>
            
            <TextField
              label="Email destinatar"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              fullWidth
              margin="dense"
              required
              type="email"
            />
            
            {type === 'service' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isSubcontract}
                    onChange={(e) => setIsSubcontract(e.target.checked)}
                    color="primary"
                  />
                }
                label="Cerere de subcontractare"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          
          <Divider />
          
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Articole
            </Typography>
            
            {items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <TextField
                  label="Denumire"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  sx={{ flex: 3 }}
                  margin="dense"
                  required
                />
                
                <TextField
                  label="Cantitate"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  sx={{ flex: 1 }}
                  margin="dense"
                />
                
                <TextField
                  label="UM"
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                  sx={{ flex: 1 }}
                  margin="dense"
                />
                
                <IconButton
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                  sx={{ mt: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{ mt: 1 }}
            >
              Adaugă articol
            </Button>
          </Box>
          
          <Divider />
          
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Documente și link-uri (opțional)
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Denumire document"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                fullWidth
                margin="dense"
              />
              
              <Button
                onClick={handleAddDocument}
                disabled={!newDocument.trim()}
                sx={{ mt: 1, whiteSpace: 'nowrap' }}
              >
                Adaugă
              </Button>
            </Box>
            
            {documents.length > 0 && (
              <List dense>
                {documents.map((doc, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveDocument(index)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={doc} />
                  </ListItem>
                ))}
              </List>
            )}
            
            <TextField
              label="Link transfer fișiere"
              value={transferLink}
              onChange={(e) => setTransferLink(e.target.value)}
              fullWidth
              margin="dense"
              placeholder="ex: https://wetransfer.com/..."
            />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          disabled={isSending}
        >
          Anulează
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendEmail}
          disabled={isSending}
          startIcon={isSending ? <CircularProgress size={20} /> : null}
        >
          {isSending ? 'Se trimite...' : 'Trimite cerere'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 