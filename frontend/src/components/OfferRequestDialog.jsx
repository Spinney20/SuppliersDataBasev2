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
  Tooltip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkIcon from '@mui/icons-material/Link';
import SendIcon from '@mui/icons-material/Send';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import { useUser } from '../context/UserContext';
import { api } from '../api/axios';
import { useCategories, useSuppliers } from '../api/queries';
import { motion } from 'framer-motion';
import { StyledDialogContent, textInputSX } from '../pages/agency_components/styles';
import EmailPreviewDialog from './EmailPreviewDialog';
import MultiSendDialog from './MultiSendDialog';

const initialItem = { name: '', quantity: '', unit: '' };

// Adaug constante pentru localStorage
const getStorageKey = (type) => `offerRequestData_${type || 'global'}`;

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

export default function OfferRequestDialog({ open, onClose, type, multiSendMode = false, supplierContacts = [], initialMultiSend = false }) {
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
  
  // Store selected supplier contacts for multi-send
  const [selectedSupplierContacts, setSelectedSupplierContacts] = useState(supplierContacts || []);

  // Add state for table format toggle
  const [useTableFormat, setUseTableFormat] = useState(false);

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
  
  // Status pentru trimiterea multiplă
  const [multiSendStatus, setMultiSendStatus] = useState({
    inProgress: false,
    total: 0,
    sent: 0,
    failed: 0,
    details: []
  });

  // New state for multi-send toggle
  const [showMultiSendDialog, setShowMultiSendDialog] = useState(false);
  const [useMultiSend, setUseMultiSend] = useState(multiSendMode);

  // Funcție pentru salvarea datelor în localStorage
  const saveFormData = () => {
    const formData = {
      subject,
      tenderName,
      tenderNumber,
      items,
      transferLink,
      isSubcontract,
      selectedCategory: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name } : null,
      selectedSuppliers: Array.isArray(selectedSuppliers) 
        ? selectedSuppliers.map(s => ({ id: s.id, name: s.name }))
        : (selectedSuppliers ? [{ id: selectedSuppliers.id, name: selectedSuppliers.name }] : []),
      useMultiSend,
      selectedSupplierContacts,
      useTableFormat // Save table format preference
    };
    
    try {
      // Salvăm datele atât global cât și specific pentru tipul curent
      localStorage.setItem(getStorageKey('global'), JSON.stringify(formData));
      localStorage.setItem(getStorageKey(type), JSON.stringify(formData));
      console.log(`Datele au fost salvate pentru ${type}`);
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
    }
  };

  // Funcție pentru încărcarea datelor din localStorage
  const loadFormData = () => {
    try {
      // Încercăm să încărcăm datele specifice pentru tipul curent
      let savedData = localStorage.getItem(getStorageKey(type));
      
      // Dacă nu există date specifice, încercăm să încărcăm datele globale
      if (!savedData) {
        savedData = localStorage.getItem(getStorageKey('global'));
      }
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Setăm datele de bază
        if (parsedData.subject) setSubject(parsedData.subject);
        setTenderName(parsedData.tenderName || '');
        setTenderNumber(parsedData.tenderNumber || '');
        setItems(parsedData.items && parsedData.items.length > 0 ? parsedData.items : [{ ...initialItem }]);
        setTransferLink(parsedData.transferLink || '');
        setIsSubcontract(parsedData.isSubcontract || false);
        
        // Setăm datele avansate dacă există
        if (parsedData.selectedCategory) {
          setSelectedCategory(parsedData.selectedCategory);
        }
        
        if (parsedData.useMultiSend) {
          setUseMultiSend(parsedData.useMultiSend);
        }
        
        if (parsedData.selectedSupplierContacts && parsedData.selectedSupplierContacts.length > 0) {
          setSelectedSupplierContacts(parsedData.selectedSupplierContacts);
        }

        // Load table format preference if exists
        if (parsedData.useTableFormat !== undefined) {
          setUseTableFormat(parsedData.useTableFormat);
        }
        
        console.log(`Datele au fost încărcate pentru ${type}`);
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
      
      // Handle multi-send mode initialization
      if (multiSendMode && supplierContacts.length > 0) {
        // Prepare all data for batch update
        const allRecipients = [];
        const allCcRecipients = [];
        
        supplierContacts.forEach(contact => {
          if (contact.emails && contact.emails.length > 0) {
            allRecipients.push(...contact.emails);
          }
          if (contact.cc_emails && contact.cc_emails.length > 0) {
            allCcRecipients.push(...contact.cc_emails);
          }
        });
        
        // Batch state updates
        setUseMultiSend(true);
        setSelectedSupplierContacts([...supplierContacts]);
        setRecipients([...new Set(allRecipients)]);
        setCcRecipients([...new Set(allCcRecipients)]);
        
        console.log('Mod de trimitere multiplă activat cu', supplierContacts.length, 'furnizori');
      }
      
      // If initialMultiSend is true, open the MultiSendDialog automatically
      if (initialMultiSend) {
        setShowMultiSendDialog(true);
      }
    }
  }, [open, type, multiSendMode, initialMultiSend]);

  // Salvează datele când se modifică
  useEffect(() => {
    if (open) {
      saveFormData();
    }
  }, [
    tenderName, 
    tenderNumber, 
    items, 
    transferLink, 
    isSubcontract, 
    open, 
    subject, 
    selectedCategory, 
    selectedSuppliers, 
    useMultiSend, 
    selectedSupplierContacts,
    useTableFormat, // Add table format to the dependency array
    type // Adăugăm tipul pentru a asigura salvarea corectă când se schimbă
  ]);

  // Function to reset all form fields
  const resetFormFields = () => {
    setSubject(`Cerere de ofertă ${type === 'material' ? 'materiale' : 'servicii'} - Viarom Construct`);
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
    setUseMultiSend(false);
    setSelectedSupplierContacts([]);
    setIsSending(false);
    setOpenPreview(false);
    setPreviewData(null);
    setUseTableFormat(false); // Reset table format toggle

    // Șterge datele din localStorage
    try {
      localStorage.removeItem(getStorageKey(type));
      localStorage.removeItem(getStorageKey('global'));
      console.log(`Datele au fost resetate pentru ${type}`);
    } catch (error) {
      console.error('Error removing form data from localStorage:', error);
    }
  };

  // Funcție pentru resetarea doar a articolelor
  const resetItems = () => {
    setItems([{ ...initialItem }]);
    
    // Actualizează localStorage cu noile articole goale
    try {
      const savedData = localStorage.getItem(getStorageKey(type));
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        parsedData.items = [{ ...initialItem }];
        localStorage.setItem(getStorageKey(type), JSON.stringify(parsedData));
        localStorage.setItem(getStorageKey('global'), JSON.stringify(parsedData));
      }
      console.log('Articolele au fost resetate');
    } catch (error) {
      console.error('Error updating form data in localStorage:', error);
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
          console.log('Selected Electron files:', files);
          
          // Add new files to the list (avoid duplicates)
          const newFiles = files.filter(file => 
            !selectedFiles.some(existing => existing.path === file.path)
          ).map(file => ({
            ...file,
            displayName: file.name, // Ensure we have a displayName for each file
            path: file.path, // Make sure path is explicitly set
            file: null // No File object for Electron
          }));
          
          console.log('Adding Electron files:', newFiles);
          setSelectedFiles(prev => {
            const updated = [...prev, ...newFiles];
            console.log('Updated selectedFiles:', updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Error selecting files:', error);
      }
    } else {
      // For web (fallback)
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '*/*'; // Accept all file types
      
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          console.log('Selected web files:', files);
          
          const fileObjects = files.map(file => {
            console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
            return {
              name: file.name,
              displayName: file.name,
              path: URL.createObjectURL(file), // This is just for display
              size: file.size,
              type: file.type,
              file: file // Keep reference to the actual File object
            };
          });
          
          console.log('Created file objects:', fileObjects);
          setSelectedFiles(prev => {
            const newFiles = [...prev, ...fileObjects];
            console.log('Updated selectedFiles:', newFiles);
            return newFiles;
          });
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
    // Ensure newValue is always an array
    const suppliersArray = Array.isArray(newValue) ? newValue : (newValue ? [newValue] : []);
    
    setSelectedSuppliers(suppliersArray);
    
    // Auto-populate recipient and CC fields based on selected suppliers
    const recipientEmails = [];
    const ccEmails = [];
    
    suppliersArray.forEach(supplier => {
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

  // Prepare data for sending
  const prepareOfferRequestData = () => {
    try {
      // Validare câmpuri obligatorii
      if (!subject) {
        setError('Completați subiectul emailului');
        return null;
      }
      
      if (!tenderName) {
        setError('Completați numele licitației');
        return null;
      }
      
      // În modul de trimitere multiplă, nu validăm destinatarii aici
      if (!useMultiSend) {
        if (recipients.length === 0) {
          setError('Adăugați cel puțin un destinatar');
          return null;
        }
      } else if (selectedSupplierContacts.length === 0) {
        setError('Selectați cel puțin un furnizor pentru trimiterea multiplă');
        return null;
      }
      
      // Validare articole
      const validItems = items.filter(item => item.name.trim() !== '');
      if (validItems.length === 0) {
        setError('Adăugați cel puțin un articol');
        return null;
      }
      
      // Ensure we have proper document paths and names
      const documentPaths = selectedFiles.map(file => file.path || '');
      const documentNames = selectedFiles.map(file => file.displayName || file.name || 'document');
      
      console.log('Prepared document paths:', documentPaths);
      console.log('Prepared document names:', documentNames);
      console.log('Selected files objects:', selectedFiles);
      
      // Construiește datele pentru cererea de ofertă
      const requestData = {
        subject,
        tender_name: tenderName,
        tender_number: tenderNumber,
        recipient_emails: recipients,
        cc_emails: ccRecipients,
        items: validItems,
        documents: documentPaths,
        document_names: documentNames,
        transfer_link: transferLink,
        subcontract: isSubcontract,
        type_mode: type,
        use_table_format: useTableFormat, // Add table format flag
        user_data: {
          nume: user.nume,
          post: user.post,
          email: user.email,
          smtp_pass: user.smtp_pass,
          smtp_server: user.smtp_server || "smtp.office365.com",
          smtp_port: user.smtp_port || "587",
          smtp_user: user.smtp_user || user.email,
          telefon_mobil: user.telefon_mobil || user.mobil,
          telefon_fix: user.telefon_fix
        }
      };
      
      // Adaugă lista de furnizori pentru trimiterea multiplă
      if (useMultiSend && selectedSupplierContacts.length > 0) {
        requestData.suppliers = [...selectedSupplierContacts];
      }
      
      return requestData;
    } catch (error) {
      console.error('Error preparing offer request data:', error);
      setError(`Eroare: ${error.message}`);
      return null;
    }
  };

  // Handle preview button click
  const handlePreview = () => {
    setError(null);
    const data = prepareOfferRequestData();
    if (data) {
      setPreviewData(data);
      setOpenPreview(true);
      console.log("Deschid previzualizarea cu datele:", data); // Pentru debugging
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
      
      console.log('Preparing offer request data for sending...');
      
      // Determină endpoint-ul în funcție de modul de trimitere
      const endpoint = useMultiSend ? '/send-multiple-offer-requests' : '/send-offer-request';
      
      // Check if we need to handle file uploads (for web version)
      const hasWebFiles = selectedFiles.some(file => file.file && file.file instanceof File);
      
      if (hasWebFiles) {
        // Web version with File objects - we need to send as FormData
        const formData = new FormData();
        
        // Add all the regular data as a JSON string
        const dataWithoutFiles = { ...data };
        delete dataWithoutFiles.documents; // Remove document paths
        formData.append('data', JSON.stringify(dataWithoutFiles));
        
        console.log('Selected files to send:', selectedFiles);
        
        // Add each file with a predictable name pattern
        let fileCount = 0;
        for (const fileObj of selectedFiles) {
          if (fileObj.file && fileObj.file instanceof File) {
            console.log(`Appending file ${fileCount}: ${fileObj.name} (${fileObj.file.size} bytes)`);
            
            // Ensure the file is valid
            if (fileObj.file.size > 0) {
              try {
                // Create a new File object to ensure it's properly serialized
                const file = new File([fileObj.file], fileObj.name, { type: fileObj.file.type });
                formData.append(`file_${fileCount}`, file);
                console.log(`Successfully appended file ${fileCount}: ${file.name} (${file.size} bytes)`);
                fileCount++;
              } catch (error) {
                console.error(`Error appending file ${fileObj.name}:`, error);
              }
            } else {
              console.warn(`Skipping empty file: ${fileObj.name}`);
            }
          } else if (fileObj.path) {
            console.log(`File has path but no File object: ${fileObj.path}`);
          }
        }
        
        // Log the FormData keys for debugging
        console.log('FormData keys:');
        for (let key of formData.keys()) {
          console.log(` - ${key}`);
          if (key.startsWith('file_')) {
            const file = formData.get(key);
            console.log(`   - File: ${file.name}, size: ${file.size}, type: ${file.type}`);
          }
        }
        
        // Send with FormData - explicitly set Content-Type to undefined to let browser handle it
        console.log('Sending request with FormData...');
        const response = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': undefined
          }
        });
        
        console.log('Response received:', response);
        handleEmailResponse(response);
      } else {
        // Electron version or no files - send as regular JSON
        console.log('Sending offer request data with documents:', data.documents);
        console.log('Document names:', data.document_names);
        const response = await api.post(endpoint, data);
        handleEmailResponse(response);
      }
    } catch (error) {
      console.error('Error sending offer request:', error);
      console.error('Error details:', error.response?.data);
      setError(`Eroare: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSending(false);
    }
  };
  
  // Helper function to handle email response
  const handleEmailResponse = (response) => {
    if (response.data && response.data.success) {
      // În cazul trimiterii multiple, afișăm un status mai detaliat
      if (useMultiSend) {
        setMultiSendStatus({
          inProgress: false,
          total: selectedSupplierContacts.length,
          sent: response.data.details.filter(d => d.success).length,
          failed: response.data.details.filter(d => !d.success).length,
          details: response.data.details
        });
        
        // Afișăm un mesaj cu rezultatul
        const successCount = response.data.details.filter(d => d.success).length;
        const failCount = response.data.details.filter(d => !d.success).length;
        
        if (failCount === 0) {
          alert(`Toate cele ${successCount} cereri de ofertă au fost trimise cu succes!`);
        } else {
          alert(`Au fost trimise ${successCount} cereri de ofertă cu succes și ${failCount} au eșuat.`);
        }
      } else {
        // Mesaj standard pentru trimitere simplă
        alert('Cererea de ofertă a fost trimisă cu succes!');
      }
      
      // Nu mai închidem dialogul - lăsăm utilizatorul să decidă când să închidă
      setOpenPreview(false);
    } else {
      setError('A apărut o eroare la trimiterea cererii de ofertă.');
    }
  };

  // Handle send email button click
  const handleSendEmail = () => {
    const data = prepareOfferRequestData();
    if (data) {
      handlePreview(); // Show preview instead of sending directly
    }
  };

  // Handle multi-send toggle
  const handleMultiSendToggle = () => {
    if (!useMultiSend) {
      setShowMultiSendDialog(true);
    } else {
      setUseMultiSend(false);
      // Reset any multi-send related state
      setRecipients([]);
      setSelectedSuppliers([]);
      setSelectedSupplierContacts([]);
    }
  };

  // Handle closing the multi-send dialog
  const handleMultiSendDialogClose = () => {
    setShowMultiSendDialog(false);
  };

  // Handle supplier selection from multi-send dialog
  const handleMultiSendSupplierSelection = (selectedContacts) => {
    if (selectedContacts && selectedContacts.length > 0) {
      // Batch all state updates together to prevent multiple re-renders
      const allRecipients = [];
      const allCcRecipients = [];
      
      selectedContacts.forEach(contact => {
        if (contact.emails && contact.emails.length > 0) {
          allRecipients.push(...contact.emails);
        }
        if (contact.cc_emails && contact.cc_emails.length > 0) {
          allCcRecipients.push(...contact.cc_emails);
        }
      });
      
      // Use a single batch update
      setUseMultiSend(true);
      setSelectedSupplierContacts([...selectedContacts]);
      setRecipients([...new Set(allRecipients)]);
      setCcRecipients([...new Set(allCcRecipients)]);
    }
    setShowMultiSendDialog(false);
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
            <EmailIcon />
            <Typography variant="h5" component="div" fontWeight="bold">
              Cerere de ofertă - {type === 'material' ? 'Materiale' : 'Servicii'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <DeleteIcon />
          </IconButton>
        </DialogTitle>

        <StyledDialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Send Mode Toggle Switch */}
          <Box sx={{ 
            mb: 3, 
            pb: 2, 
            display: 'flex', 
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <ToggleButtonGroup
              value={useMultiSend ? "multiple" : "single"}
              exclusive
              onChange={(e, newValue) => {
                if (newValue === null) return; // Prevent deselection
                
                if (newValue === "multiple" && !useMultiSend) {
                  // Only open dialog if not already in multi-send mode
                  handleMultiSendToggle();
                } else if (newValue === "single" && useMultiSend) {
                  // Reset multi-send related state
                  setUseMultiSend(false);
                  setSelectedSupplierContacts([]);
                  setRecipients([]);
                  setCcRecipients([]);
                }
              }}
              aria-label="mod trimitere"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '24px',
                padding: '4px',
                '& .MuiToggleButtonGroup-grouped': {
                  border: 0,
                  borderRadius: '20px !important',
                  mx: 0.5,
                  px: 2,
                  py: 0.75,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: useMultiSend ? 'info.main' : 'success.main',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: useMultiSend ? 'info.dark' : 'success.dark',
                    }
                  },
                  '&:not(.Mui-selected)': {
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: '#fff'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="single" aria-label="trimitere singulară">
                <PersonIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Trimitere singulară
              </ToggleButton>
              <ToggleButton value="multiple" aria-label="trimitere multiplă">
                <GroupIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Trimitere multiplă
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* Categoria și furnizorul */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: '#fff' }}>
              {useMultiSend ? 'Furnizori selectați pentru trimitere multiplă' : 'Selectează categoria și furnizorul'}
            </Typography>
            
            {!useMultiSend && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Categorie</InputLabel>
                  <Select
                    value={selectedCategory?.id || ''}
                    onChange={handleCategoryChange}
                    label="Categorie"
                    disabled={categories.length === 0}
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
                    {categories.length === 0 ? (
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

                <FormControl fullWidth>
                  <Autocomplete
                    options={suppliers}
                    getOptionLabel={(option) => option.name}
                    value={selectedSuppliers.length > 0 ? selectedSuppliers[0] : null}
                    onChange={handleSupplierChange}
                    disabled={!selectedCategory}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Furnizor"
                        InputLabelProps={{
                          sx: { color: 'rgba(255,255,255,0.7)' },
                        }}
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
                          input: { color: '#fff' },
                        }}
                      />
                    )}
                    sx={{
                      '.MuiAutocomplete-tag': {
                        backgroundColor: 'primary.main',
                        color: '#fff',
                      },
                    }}
                  />
                </FormControl>
              </Box>
            )}
            
            {useMultiSend && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1, fontSize: '1.2rem', color: '#2196f3' }} />
                    <strong>Mod trimitere multiplă activ</strong>
                  </Typography>
                  
                  <Button 
                    size="small"
                    variant="outlined"
                    onClick={() => setShowMultiSendDialog(true)}
                    sx={{ 
                      color: '#2196f3',
                      borderColor: '#2196f3',
                      '&:hover': {
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)'
                      }
                    }}
                  >
                    Modifică selecția
                  </Button>
                </Box>
                
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                  {selectedSupplierContacts.length} furnizori selectați
                </Typography>
                
                {selectedSupplierContacts.length > 0 && (
                  <Box sx={{ 
                    maxHeight: '150px', 
                    overflow: 'auto',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: 1,
                    p: 1,
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
                    {selectedSupplierContacts.map((supplier, idx) => (
                      <Box key={idx} sx={{ 
                        mb: 1, 
                        pb: 1, 
                        borderBottom: idx < selectedSupplierContacts.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                      }}>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {supplier.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                          Destinatari: {supplier.emails.join(', ')}
                        </Typography>
                        {supplier.cc_emails.length > 0 && (
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                            CC: {supplier.cc_emails.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Rest of the form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
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
              
              {type === 'serviciu' && (
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
              
              {!useMultiSend && (
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
              )}
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
            
            {/* 4. Articole */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: '#fff', mb: 0.5 }}>
                  Articole
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useTableFormat}
                        onChange={(e) => setUseTableFormat(e.target.checked)}
                        color="info"
                        size="small"
                      />
                    }
                    label="Format tabel"
                    sx={{ 
                      color: '#fff', 
                      '& .MuiFormControlLabel-label': { 
                        fontSize: '0.85rem',
                        color: useTableFormat ? '#64b5f6' : 'rgba(255,255,255,0.7)'
                      } 
                    }}
                  />
                  <Button
                    size="small"
                    onClick={resetItems}
                    sx={{ 
                      minWidth: 'auto',
                      py: 0.2,
                      px: 1,
                      fontSize: '0.7rem',
                      color: 'rgba(255,152,0,0.9)',
                      borderColor: 'rgba(255,152,0,0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255,152,0,0.9)',
                        backgroundColor: 'rgba(255,152,0,0.1)'
                      }
                    }}
                    variant="outlined"
                  >
                    Resetează articole
                  </Button>
                </Box>
              </Box>
              
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

        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Button 
              onClick={resetFormFields}
              disabled={isSending}
              variant="outlined"
              size="small"
              sx={{
                color: '#ff9800',
                borderColor: 'rgba(255,152,0,0.5)',
                mr: 1,
                '&:hover': {
                  borderColor: '#ff9800',
                  backgroundColor: 'rgba(255, 152, 0, 0.08)',
                },
              }}
            >
              Resetează
            </Button>
            
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
              Închide
            </Button>
          </Box>
          
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

      {/* Preview Dialog */}
      <EmailPreviewDialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        emailData={previewData}
        onSend={handleSendAfterPreview}
        onEdit={handleEditFromPreview}
      />
      
      {/* MultiSend Dialog */}
      <MultiSendDialog
        open={showMultiSendDialog}
        onClose={handleMultiSendDialogClose}
        agencyId={selectedAgencyId}
        type={type}
        onSupplierSelect={handleMultiSendSupplierSelection}
      />
    </>
  );
} 