import { memo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useSuppliers } from '../../api/queries';

const CategoryBlock = memo(({ cat, expanded, toggle, agencyId, search, onSupplierClick }) => {
  const { data: supp = [] } = useSuppliers(agencyId, cat.id);
  const filteredSup = supp.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ mb: 2, p: 1, border: '1px solid #888', borderRadius: 1 }}>
      {/* header */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box
          onClick={toggle}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <IconButton size="small" sx={{ color: '#fff', flexShrink: 0 }}>
            {expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>

          <Typography sx={{ ml: 1, pr: 1, fontWeight: 600, overflowWrap: 'anywhere' }}>
            {cat.name}
          </Typography>
        </Box>
      </Box>

      {/* furnizori */}
      {expanded && (
        <Box sx={{ ml: 4, mt: 1 }}>
          {filteredSup.length === 0 && (
            <Typography sx={{ fontStyle: 'italic', opacity: 0.6, pb: 0.5 }}>
              (niciun furnizor găsit)
            </Typography>
          )}
          {filteredSup.map(s => (
            <Box
              key={s.id}
              onClick={() => onSupplierClick && onSupplierClick(s)}
              sx={{
                mt: 0.5, p: 0.5,
                cursor: 'pointer', borderRadius: 1,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <Typography sx={{ 
                flex: 1,
                fontWeight: 400,
                fontSize: '0.95rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {s.name}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
});

export default CategoryBlock; 