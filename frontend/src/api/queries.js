import { useQuery } from '@tanstack/react-query';
import { api } from './axios';

// ▸ /agencies
export const useAgencies = () =>
  useQuery({
    queryKey: ['agencies'],
    queryFn: () => api.get('/agencies').then(r => r.data),
  });

// ▸ /agencies/:id/:type/categories
export const useCategories = (agencyId, type) =>
  useQuery({
    queryKey: ['categories', agencyId, type],
    queryFn: () =>
      api.get(`/agencies/${agencyId}/${type}/categories`).then(r => r.data),
    enabled: !!agencyId,
  });

// ▸ /agencies/:id/categories/:catId/suppliers
export const useSuppliersByCat = (agencyId, catId) =>
  useQuery({
    queryKey: ['suppliers', agencyId, catId],
    queryFn: () =>
      api
        .get(`/agencies/${agencyId}/categories/${catId}/suppliers`)
        .then(r => r.data),
    enabled: !!catId,
  });
