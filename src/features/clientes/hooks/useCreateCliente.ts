import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientesApi } from "../api/clientes";
import { extractErrorMessage } from "@/shared/api/errors";
import type { CreateClienteInput } from "../types";

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClienteInput) => {
      const response = await clientesApi.create(data);
      if (response?.status !== true) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo guardar el cliente.");
      }
      return typeof response.data === "string" ? response.data : "Cliente guardado exitosamente.";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
