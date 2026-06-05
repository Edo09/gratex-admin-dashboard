import { useMutation, useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@/shared/api/errors";
import { gastosApi } from "../api/gastos";
import type { CreateGastoPayload } from "../types";

export function useCreateGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateGastoPayload) => {
      const response = await gastosApi.create(data);
      if (response?.success === false || response?.status === false) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo guardar el gasto.");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
    },
  });
}
