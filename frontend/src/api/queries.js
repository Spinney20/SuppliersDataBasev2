import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './axios';

// ▸ /agencies
export const useAgencies = () =>
  useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await api.get('/agencies');
      return res.data;
    },
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
  });

// ▸ /agencies/:id/search/offerings
export const useSearchOfferings = (agencyId, type, searchTerm) =>
  useQuery({
    queryKey: ['search', agencyId, type, searchTerm],
    queryFn: async () => {
      const res = await api.get(`/agencies/${agencyId}/search/offerings`, {
        params: { q: searchTerm, type }
      });
      return res.data;
    },
    enabled: !!agencyId && !!searchTerm && searchTerm.length >= 2,
  });

// User configuration
export const useUserConfig = () => {
  return useQuery({
    queryKey: ['user-config'],
    queryFn: async () => {
      const res = await api.get('/user-config');
      return res.data;
    },
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
      queryClient.invalidateQueries(['user-config']);
    },
  });
};
