import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cotizacionesApi } from "../api/cotizaciones";
import { cotizacionToRowMapper } from "../mappers";
import type { CreateCotizacionPayload } from "../types";

interface SaveArgs {
  payload: CreateCotizacionPayload;
  editingId: number | null;
}

/**
 * Saves a cotización — performs create or update depending on `editingId`.
 * Returns the cotización id (existing or new).
 */
export function useSaveCotizacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, editingId }: SaveArgs): Promise<number | undefined> => {
      if (editingId) {
        await cotizacionesApi.update({ ...payload, id: editingId });
        return editingId;
      }
      const response = await cotizacionesApi.create(payload);
      return response.data?.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
    },
  });
}

// Re-export for mappers used in the cotizaciones page
export { cotizacionToRowMapper };
