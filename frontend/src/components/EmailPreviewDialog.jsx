import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { api } from '../api/axios';

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
    maxWidth: '900px',
    width: '100%',
    height: '80vh',
    maxHeight: '800px'
  },
};

// Stil pentru editorul de email
const emailEditorStyle = {
  backgroundColor: '#fff',
  color: '#000',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  lineHeight: '1.5',
  padding: '16px',
  border: 'none',
  outline: 'none',
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  borderRadius: '4px'
};

export default function EmailPreviewDialog({ 
  open, 
  onClose, 
  emailData, 
  onSend, 
  onEdit,
  onBackToEdit
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailContent, setEmailContent] = useState('');
  const [subject, setSubject] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const editorRef = useRef(null);

  useEffect(() => {
    if (open && emailData) {
      loadPreview();
    } else {
      setEmailContent('');
      setError(null);
      setLoading(false);
      setIsEditing(false);
    }
  }, [open, emailData]);

  // Inițializează editorul WYSIWYG când se activează modul de editare
  useEffect(() => {
    if (isEditing && editorRef.current) {
      // Facem conținutul editabil
      editorRef.current.contentEditable = true;
      editorRef.current.focus();
      
      // Dezactivăm funcționalitățile avansate care ar putea expune HTML
      document.execCommand('styleWithCSS', false, false);
      
      // Salvăm conținutul când se pierde focusul
      const saveContent = () => {
        if (editorRef.current) {
          setEmailContent(editorRef.current.innerHTML);
        }
      };
      
      editorRef.current.addEventListener('blur', saveContent);
      
      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener('blur', saveContent);
          editorRef.current.contentEditable = false;
        }
      };
    }
  }, [isEditing]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/preview-offer-request', emailData);
      
      if (response.data && response.data.success) {
        setEmailContent(response.data.html_content);
        setSubject(response.data.subject || emailData.subject);
      } else {
        setError(response.data?.message || 'Nu s-a putut genera previzualizarea emailului');
      }
    } catch (error) {
      console.error('Eroare la generarea previzualizării:', error);
      setError(`Eroare: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    setSubject(e.target.value);
    if (onEdit) {
      onEdit({ ...emailData, subject: e.target.value });
    }
  };

  const handleSend = () => {
    if (onSend) {
      // Folosește conținutul editat
      const updatedData = {
        ...emailData,
        subject,
        custom_html: emailContent
      };
      onSend(updatedData);
    }
    onClose();
  };

  const handleBackToEdit = () => {
    if (onBackToEdit) {
      onBackToEdit({ ...emailData, subject });
    }
    onClose();
  };

  const toggleEditing = () => {
    if (isEditing && editorRef.current) {
      // Salvăm conținutul când oprim editarea
      setEmailContent(editorRef.current.innerHTML);
    }
    setIsEditing(!isEditing);
  };

  return (
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
        <Typography variant="h5" component="div" fontWeight="bold">
          Previzualizare Email
        </Typography>
        <Box>
          <Tooltip title={isEditing ? "Oprește editarea" : "Editează email"}>
            <IconButton 
              onClick={toggleEditing}
              sx={{ 
                color: isEditing ? 'primary.main' : 'rgba(255,255,255,0.7)',
                mr: 1
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{
        p: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
          },
        },
      }}>
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Câmpul pentru subiect */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>Subiect:</Typography>
            <TextField
              value={subject}
              onChange={handleSubjectChange}
              fullWidth
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                '& .MuiInputBase-input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                }
              }}
            />
          </Box>
          
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
          
          {/* Previzualizare email */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper 
              elevation={3} 
              sx={{ 
                backgroundColor: '#fff', 
                borderRadius: 2,
                flex: 1,
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <Box 
                ref={editorRef}
                dangerouslySetInnerHTML={{ __html: emailContent }} 
                sx={{ 
                  p: 3,
                  '& img': { maxWidth: '100%' },
                  height: '100%',
                  overflow: 'auto',
                  outline: isEditing ? '2px solid #1976d2' : 'none',
                  '&:focus': {
                    outline: '2px solid #1976d2',
                  },
                  ...emailEditorStyle
                }}
              />
              
              {isEditing && (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    color: '#1976d2',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  Mod editare activat
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button 
          onClick={handleBackToEdit}
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.5)',
            '&:hover': {
              borderColor: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
            mr: 'auto'
          }}
        >
          Înapoi la editare
        </Button>
        
        <Button 
          onClick={onClose}
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
          onClick={handleSend}
          size="small"
          startIcon={<SendIcon />}
          sx={{
            textTransform: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
            }
          }}
        >
          Trimite email
        </Button>
      </DialogActions>
    </Dialog>
  );
} 