import { useQuery } from "@tanstack/react-query";
import { api } from "./axios";

export const useAgencies = () =>
  useQuery(["agencies"], () => api.get("/agencies").then(r => r.data));

export const useCategories = (agencyId, type) =>
  useQuery(
    ["categories", agencyId, type],
    () =>
      api
        .get(`/agencies/${agencyId}/${type}/categories`)
        .then(r => r.data),
    { enabled: !!agencyId }
  );

export const useSuppliersByCat = (agencyId, catId) =>
  useQuery(
    ["suppliers", agencyId, catId],
    () =>
      api
        .get(`/agencies/${agencyId}/categories/${catId}/suppliers`)
        .then(r => r.data),
    { enabled: !!catId }
  );
