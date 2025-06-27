import { memo, useState } from 'react';
import { Box, Typography, Button, Autocomplete, TextField } from '@mui/material';
import { scrollbarStyles, textInputSX } from './styles';
import IconTextField from './IconTextField';

// Icons
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

// Simple email validation function
const isValidEmail = (email) => {
  if (!email) return true; // Empty emails are allowed
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Componentă pentru formularul de furnizor
const SupplierForm = memo(({ 
  supplierForm, 
  updateSupplierField, 
  updateSupplierContact,
  addSupplierContactRow,
  removeSupplierContactRow,
  cats,
  type
}) => {
  // State for validation errors
  const [emailError, setEmailError] = useState('');
  const [contactErrors, setContactErrors] = useState({});
  
  // Handle email field change with validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    updateSupplierField('email', value);
    
    if (value && !isValidEmail(value)) {
      setEmailError('Email invalid');
    } else {
      setEmailError('');
    }
  };
  
  // Handle contact email field change with validation
  const handleContactEmailChange = (idx, value) => {
    updateSupplierContact(idx, 'email', value);
    
    if (value && !isValidEmail(value)) {
      setContactErrors(prev => ({
        ...prev,
        [idx]: 'Email invalid'
      }));
    } else {
      setContactErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[idx];
        return newErrors;
      });
    }
  };

  return (
    <>
      {/* --- date generale furnizor --- */}
      <Box sx={{ 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        p: 2, 
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.05)',
        mb: 1
      }}>
        <Typography variant="subtitle2" sx={{ 
          mb: 2, 
          opacity: 0.9, 
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          <BusinessIcon fontSize="small" color="primary" /> Informații generale
        </Typography>
        
        <IconTextField 
          icon={<BusinessIcon />}
          label="Nume furnizor *" 
          value={supplierForm.name}
          onChange={e => updateSupplierField('name', e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          placeholder=""
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <IconTextField 
            icon={<EmailIcon />}
            label="Email" 
            value={supplierForm.email}
            onChange={handleEmailChange}
            fullWidth
            placeholder=""
            error={!!emailError}
            helperText={emailError}
          />
          
          <IconTextField 
            icon={<PhoneIcon />}
            label="Telefon" 
            value={supplierForm.phone}
            onChange={e => updateSupplierField('phone', e.target.value)}
            fullWidth
            placeholder=""
          />
        </Box>

        <Autocomplete  /* categorii */
          multiple 
          options={cats} 
          value={supplierForm.categories}
          getOptionLabel={o=>o.name} 
          filterSelectedOptions
          onChange={(_,v)=>updateSupplierField('categories', v)}
          disableCloseOnSelect
          limitTags={5}
          ListboxProps={{
            style: {
              maxHeight: '200px',
            }
          }}
          renderInput={params=>(
            <TextField 
              {...params} 
              label="Categorii *" 
              placeholder=""
              sx={textInputSX}
              variant="outlined"
              autoComplete="off"
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: '#fff',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <Box sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, display: 'flex' }}>
                      <CategoryIcon />
                    </Box>
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
          sx={{ 
            '.MuiChip-root': { 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              color: '#fff',
              borderRadius: '16px',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#fff'
                }
              }
            },
            '.MuiAutocomplete-listbox': scrollbarStyles,
            '.MuiAutocomplete-endAdornment': {
              top: 'calc(50% - 14px)'
            }
          }} 
        />
      </Box>

      {/* ---------- Contacte ---------- */}
      <Box sx={{ 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        p: 2, 
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.05)',
        mb: 1
      }}>
        <Typography sx={{
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          <PersonIcon fontSize="small" color="primary" /> Contacte
        </Typography>
        
        {supplierForm.contacts.map((c,idx)=>(
          <Box key={idx} sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            p: 2,
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.03)',
          }}>
            <IconTextField 
              icon={<PersonIcon />}
              fullWidth 
              label="Nume *"
              value={c.full_name}
              onChange={e=>updateSupplierContact(idx,'full_name',e.target.value)}
              sx={{flex:1}}
              placeholder=""
            />
            <IconTextField 
              icon={<EmailIcon />}
              label="Email"
              value={c.email}
              onChange={e=>handleContactEmailChange(idx, e.target.value)}
              sx={{width:200}}
              placeholder=""
              error={!!contactErrors[idx]}
              helperText={contactErrors[idx]}
            />
            <IconTextField 
              icon={<PhoneIcon />}
              label="Telefon"
              value={c.phone}
              onChange={e=>updateSupplierContact(idx,'phone',e.target.value)}
              sx={{width:150}}
              placeholder=""
            />
            <Button 
              size="small" 
              onClick={()=>removeSupplierContactRow(idx)}
              sx={{
                color:'#fff',
                alignSelf:'center',
                backgroundColor: 'rgba(255,0,0,0.1)',
                minWidth: '40px',
                height: '40px',
                borderRadius: '50%',
                '&:hover': {
                  backgroundColor: 'rgba(255,0,0,0.2)',
                }
              }}
            >
              <RemoveIcon fontSize="small" />
            </Button>
          </Box>
        ))}
        
        <Button 
          onClick={addSupplierContactRow} 
          startIcon={<AddIcon/>}
          variant="outlined"
          size="small"
          sx={{
            alignSelf:'flex-start', 
            color:'#fff', 
            textTransform:'none',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: '#fff',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          Adaugă contact
        </Button>
      </Box>

      {/* ---------- Offerings ---------- */}
      <Box sx={{ 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        p: 2, 
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Typography sx={{
          fontWeight: 500,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          pb: 1,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          <InventoryIcon fontSize="small" color="primary" /> Offerings ({type})
        </Typography>
        
        <Autocomplete
          multiple 
          freeSolo
          options={[]} 
          value={supplierForm.offerings}
          onChange={(_,v)=>updateSupplierField('offerings', v)}
          disableCloseOnSelect
          limitTags={5}
          ListboxProps={{
            style: {
              maxHeight: '200px',
            }
          }}
          renderInput={params=>(
            <TextField 
              {...params} 
              label="Materiale / Servicii"
              placeholder="Tastează şi Enter"
              sx={textInputSX}
              variant="outlined"
              autoComplete="off"
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: '#fff',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                }
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <Box sx={{ color: 'rgba(255,255,255,0.7)', mr: 1, display: 'flex' }}>
                      <InventoryIcon />
                    </Box>
                    {params.InputProps.startAdornment}
                  </>
                )
              }}
            />
          )}
          sx={{ 
            '.MuiChip-root': { 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              color: '#fff',
              borderRadius: '16px',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#fff'
                }
              }
            },
            '.MuiAutocomplete-listbox': scrollbarStyles,
            '.MuiAutocomplete-endAdornment': {
              top: 'calc(50% - 14px)'
            }
          }} 
        />
      </Box>
    </>
  );
}, (prevProps, nextProps) => {
  // Comparăm doar proprietățile care ar trebui să declanșeze o rerenederizare
  return (
    prevProps.supplierForm === nextProps.supplierForm &&
    prevProps.cats === nextProps.cats &&
    prevProps.type === nextProps.type
  );
});

export default SupplierForm; 