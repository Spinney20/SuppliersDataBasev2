import { memo } from 'react';
import { Box, TextField } from '@mui/material';
import { textInputSX } from './styles';

// Componentă pentru câmpurile de input cu icon
const IconTextField = memo(({ icon, textInputSX: customTextInputSX, ...props }) => (
  <TextField
    {...props}
    autoComplete="off"
    InputProps={{
      startAdornment: (
        <Box sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, display: 'flex' }}>
          {icon}
        </Box>
      ),
      sx: { color: '#fff' }
    }}
    InputLabelProps={{
      shrink: true,
      sx: {
        color: '#fff',
        '&.Mui-focused': {
          color: 'primary.main',
        },
      }
    }}
    sx={{
      ...(customTextInputSX || textInputSX),
      ...props.sx
    }}
    variant="outlined"
  />
));

export default IconTextField; 