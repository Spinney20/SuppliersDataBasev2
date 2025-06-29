import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

// Configurații comune pentru toate query-urile
const defaultQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minute
  cacheTime: 10 * 60 * 1000, // 10 minute
  retry: 1,
  refetchOnWindowFocus: false,
};

// ▸ /agencies
export const useAgencies = () =>
  useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await api.get('/agencies');
      return res.data;
    },
    ...defaultQueryConfig,
  });

// ▸ /agencies/:id/:type/categories
export const useCategories = (agencyId, type) =>
  useQuery({
    queryKey: ['categories', agencyId, type],
    queryFn: async () => {
      const res = await api.get(`/agencies/${agencyId}/${type}/categories`);
      return res.data;
    },
    enabled: !!agencyId && !!type,
    ...defaultQueryConfig,
  });

// ▸ /agencies/:id/categories/:catId/suppliers
export const useSuppliers = (agencyId, categoryId) =>
  useQuery({
    queryKey: ['suppliers', agencyId, categoryId],
    queryFn: async () => {
      const res = await api.get(`/agencies/${agencyId}/categories/${categoryId}/suppliers`);
      return res.data;
    },
    enabled: !!agencyId && !!categoryId,
    ...defaultQueryConfig,
  });

// ▸ /agencies/:id/search/offerings
export const useSearchOfferings = (agencyId, type, searchTerm) =>
  useQuery({
    queryKey: ['search', agencyId, type, searchTerm],
    queryFn: async () => {
      // Optimizare: nu facem cerere dacă termenul de căutare e prea scurt
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }
      
      const res = await api.get(`/agencies/${agencyId}/search/offerings`, {
        params: { q: searchTerm, type }
      });
      return res.data;
    },
    enabled: !!agencyId && !!searchTerm && searchTerm.length >= 2,
    // Configurație specifică pentru căutare
    staleTime: 60 * 1000, // 1 minut
    cacheTime: 2 * 60 * 1000, // 2 minute
    retry: 0, // Nu reîncercăm căutările eșuate
  });

// User configuration
export const useUserConfig = () => {
  return useQuery({
    queryKey: ['user-config'],
    queryFn: async () => {
      const res = await api.get('/user-config');
      return res.data;
    },
    ...defaultQueryConfig,
    // Configurație specifică pentru datele utilizatorului
    staleTime: 30 * 60 * 1000, // 30 minute
  });
};

export const useUpdateUserConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData) => {
      const res = await api.post('/user-config', userData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidăm doar query-ul specific
      queryClient.invalidateQueries({ queryKey: ['user-config'] });
    },
  });
};
