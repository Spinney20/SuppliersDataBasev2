import { styled, alpha } from '@mui/material/styles';
import { Box, Button, DialogContent } from '@mui/material';

// Containerul cu cele două butoane
export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
}));

// Buton reutilizabil, variantă profesională
export const ActionButton = styled(Button)(({ theme }) => ({
  flex: 1,
  minHeight: 38,
  borderRadius: theme.shape.borderRadius,       // puțin rotunjit
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.pxToRem(14),
  letterSpacing: '0.25px',
  transition: theme.transitions.create(
    ['background-color', 'transform', 'box-shadow'],
    { duration: theme.transitions.duration.shortest }
  ),
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',        // umbră fină
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.16)',
  },
  '&:focus': {
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

// Adaugă un stil pentru scrollbar modern
export const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
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
  maxHeight: 'calc(100vh - 200px)',
  overflowY: 'auto',
}));

// Stiluri pentru scrollbar-ul din lista de categorii
export const scrollbarStyles = {
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
};

// Stiluri pentru textInput
export const textInputSX = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  '& .MuiInputLabel-root':            { color: '#fff' },
  '& .MuiInputLabel-root.Mui-focused':{ color: 'primary.main' },
  '& .MuiInputBase-input':            { color: '#fff' },
  '& .MuiInputBase-input::placeholder': { color: '#fff', opacity: 1 },
  '& .MuiOutlinedInput-root': {
      '& fieldset':              { borderColor: '#fff' },
      '&:hover fieldset':        { borderColor: '#fff' },
      '&.Mui-focused fieldset':  { borderColor: 'primary.main' },
  },
  '& .MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
  }
}; 