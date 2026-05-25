import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientesApi } from "../api/clientes";
import { extractErrorMessage } from "@/shared/api/errors";
import type { CreateClienteInput } from "../types";

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClienteInput) => {
      const response = await clientesApi.create(data);
      // Some backends return 200 OK with status:false on validation errors —
      // treat that as a thrown error so the modal can surface it.
      if (response?.status !== true) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo guardar el cliente.");
      }
      return typeof response.data === "string" ? response.data : "Cliente guardado.";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "clientes-count"] });
    },
  });
}
