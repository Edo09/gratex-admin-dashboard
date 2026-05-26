import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientesApi } from "../api/clientes";
import { extractErrorMessage } from "@/shared/api/errors";

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await clientesApi.remove(id);
      // Backend returns status: false on delete constraint/not found errors
      if (response?.status !== true) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo eliminar el cliente.");
      }
      return typeof response.data === "string" ? response.data : "Cliente eliminado.";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "clientes-count"] });
    },
  });
}
