import { useMutation, useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@/shared/api/errors";
import { facturasSimplesApi } from "../api/facturasSimples";

export function useDeleteFacturaSimple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await facturasSimplesApi.remove(id);
      if (response?.success === false || response?.status === false) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo eliminar la factura.");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas-simples"] });
    },
  });
}
