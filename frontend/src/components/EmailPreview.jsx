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
  Tooltip
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

export default function EmailPreview({ 
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
  const [editMode, setEditMode] = useState(false);
  const [editingContent, setEditingContent] = useState(false);

  const contentEditorRef = useRef(null);

  useEffect(() => {
    if (open && emailData) {
      loadPreview();
    } else {
      setEmailContent('');
      setError(null);
      setLoading(false);
      setEditMode(false);
      setEditingContent(false);
    }
  }, [open, emailData]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/preview-offer-request', emailData);
      
      if (response.data && response.data.success) {
        setEmailContent(response.data.html_content);
        setSubject(response.data.subject || emailData.subject);
      } else {
        setError(response.data?.message || 'Failed to generate email preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setError(`Error: ${error.response?.data?.message || error.message}`);
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
      // Use the edited content
      const updatedData = {
        ...emailData,
        subject,
        custom_html: editingContent ? emailContent : undefined
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

  const toggleContentEditing = () => {
    setEditingContent(!editingContent);
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
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          <CloseIcon />
        </IconButton>
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
          {/* Subject field */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: '#fff', minWidth: '80px' }}>Subiect:</Typography>
            {editMode ? (
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
            ) : (
              <Box sx={{ 
                flex: 1, 
                p: 1, 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                borderRadius: 1,
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography>{subject}</Typography>
                <Tooltip title="Editează subiectul">
                  <IconButton 
                    size="small" 
                    onClick={() => setEditMode(true)}
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          
          {/* Email preview */}
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
                p: 3, 
                backgroundColor: '#fff', 
                borderRadius: 2,
                flex: 1,
                overflow: 'auto',
                position: 'relative'
              }}
            >
              {editingContent ? (
                <TextField
                  inputRef={contentEditorRef}
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  multiline
                  fullWidth
                  variant="outlined"
                  sx={{
                    height: '100%',
                    '& .MuiInputBase-root': {
                      height: '100%',
                    },
                    '& .MuiInputBase-input': {
                      height: '100%',
                      overflow: 'auto',
                    }
                  }}
                />
              ) : (
                <Box 
                  dangerouslySetInnerHTML={{ __html: emailContent }} 
                  sx={{ '& img': { maxWidth: '100%' } }}
                />
              )}
              
              <Tooltip title={editingContent ? "Oprește editarea" : "Editează conținutul"}>
                <IconButton 
                  onClick={toggleContentEditing}
                  sx={{ 
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.2)'
                    }
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
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