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
  Divider,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
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

// Opțiuni pentru dimensiunea textului
const fontSizeOptions = [
  { value: '1', label: 'Foarte mic' },
  { value: '2', label: 'Mic' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Mare' },
  { value: '5', label: 'Foarte mare' },
  { value: '6', label: 'Enorm' },
  { value: '7', label: 'Maxim' }
];

// Opțiuni pentru culoarea textului
const colorOptions = [
  { value: '#000000', label: 'Negru', color: '#000000' },
  { value: '#0066cc', label: 'Albastru', color: '#0066cc' },
  { value: '#008800', label: 'Verde', color: '#008800' },
  { value: '#cc0000', label: 'Roșu', color: '#cc0000' },
  { value: '#666666', label: 'Gri', color: '#666666' }
];

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
  const [fontSize, setFontSize] = useState('3');
  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  
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
      // Folosește conținutul editat și păstrează flag-ul use_table_format
      const updatedData = {
        ...emailData,
        subject,
        custom_html: emailContent,
        use_table_format: emailData.use_table_format
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

  // Funcții pentru formatarea textului
  const execFormatCommand = (command, value = null) => {
    if (document.execCommand) {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        editorRef.current.focus();
        setEmailContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleBold = () => execFormatCommand('bold');
  const handleItalic = () => execFormatCommand('italic');
  const handleUnderline = () => execFormatCommand('underline');
  const handleBulletList = () => execFormatCommand('insertUnorderedList');
  const handleNumberedList = () => execFormatCommand('insertOrderedList');
  const handleUndo = () => execFormatCommand('undo');
  const handleRedo = () => execFormatCommand('redo');

  const handleFontSizeChange = (event) => {
    const size = event.target.value;
    setFontSize(size);
    execFormatCommand('fontSize', size);
  };

  const handleColorClick = (event) => {
    setColorAnchorEl(event.currentTarget);
  };

  const handleColorClose = () => {
    setColorAnchorEl(null);
  };

  const handleColorSelect = (color) => {
    execFormatCommand('foreColor', color);
    handleColorClose();
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
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Bara de formatare - vizibilă doar în modul de editare */}
              {isEditing && (
                <Box sx={{ 
                  p: 1, 
                  backgroundColor: '#f5f5f5', 
                  borderBottom: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 0.5
                }}>
                  <Tooltip title="Bold">
                    <IconButton size="small" onClick={handleBold}>
                      <FormatBoldIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Italic">
                    <IconButton size="small" onClick={handleItalic}>
                      <FormatItalicIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Subliniat">
                    <IconButton size="small" onClick={handleUnderline}>
                      <FormatUnderlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  
                  <Tooltip title="Listă cu puncte">
                    <IconButton size="small" onClick={handleBulletList}>
                      <FormatListBulletedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Listă numerotată">
                    <IconButton size="small" onClick={handleNumberedList}>
                      <FormatListNumberedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="font-size-label" sx={{ fontSize: '0.8rem' }}>Dimensiune text</InputLabel>
                    <Select
                      labelId="font-size-label"
                      value={fontSize}
                      onChange={handleFontSizeChange}
                      label="Dimensiune text"
                      sx={{ height: 32 }}
                    >
                      {fontSizeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Tooltip title="Culoare text">
                    <IconButton size="small" onClick={handleColorClick}>
                      <FormatColorTextIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Menu
                    anchorEl={colorAnchorEl}
                    open={Boolean(colorAnchorEl)}
                    onClose={handleColorClose}
                  >
                    {colorOptions.map((option) => (
                      <MenuItem 
                        key={option.value} 
                        onClick={() => handleColorSelect(option.value)}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 16, 
                            height: 16, 
                            backgroundColor: option.color,
                            border: '1px solid #ccc',
                            borderRadius: '2px'
                          }} 
                        />
                        {option.label}
                      </MenuItem>
                    ))}
                  </Menu>
                  
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  
                  <Tooltip title="Anulează">
                    <IconButton size="small" onClick={handleUndo}>
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Refă">
                    <IconButton size="small" onClick={handleRedo}>
                      <RedoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              
              <Box 
                ref={editorRef}
                dangerouslySetInnerHTML={{ __html: emailContent }} 
                sx={{ 
                  p: 3,
                  '& img': { maxWidth: '100%' },
                  flex: 1,
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
                    top: 50,
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