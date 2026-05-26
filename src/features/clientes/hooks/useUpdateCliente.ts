import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientesApi } from "../api/clientes";
import { extractErrorMessage } from "@/shared/api/errors";
import type { CreateClienteInput } from "../types";

interface UpdateClienteVariables {
  id: number;
  data: Omit<CreateClienteInput, "sent_mail">;
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: UpdateClienteVariables) => {
      const response = await clientesApi.update(id, data);
      // Backend returns status: false on validation/existing errors
      if (response?.status !== true) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo actualizar el cliente.");
      }
      return typeof response.data === "string" ? response.data : "Cliente actualizado.";
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["clientes", "detail", variables.id] });
    },
  });
}
