import { useMutation, useQueryClient } from "@tanstack/react-query";
import { facturasApi } from "../api/facturas";
import { extractErrorMessage } from "@/shared/api/errors";
import type { CreateFacturaPayload } from "../types";

export function useCreateFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFacturaPayload) => {
      const response = await facturasApi.create(data);
      // Some backends return 200 OK with status:false on validation errors —
      // treat that as a thrown error so the modal can surface it.
      if (response?.success === false || response?.status === false) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo guardar la factura.");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "facturas-all"] });
    },
  });
}
