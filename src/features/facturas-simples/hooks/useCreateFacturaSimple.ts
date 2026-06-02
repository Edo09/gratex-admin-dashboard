import { useMutation, useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@/shared/api/errors";
import { facturasSimplesApi } from "../api/facturasSimples";
import type { CreateFacturaSimplePayload } from "../types";

export function useCreateFacturaSimple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFacturaSimplePayload) => {
      const response = await facturasSimplesApi.create(data);
      if (response?.success === false || response?.status === false) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo guardar la factura.");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas-simples"] });
    },
  });
}
