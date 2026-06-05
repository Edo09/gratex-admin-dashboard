import { useMutation, useQueryClient } from "@tanstack/react-query";
import { extractErrorMessage } from "@/shared/api/errors";
import { aprobarEcfApi } from "../api/aprobarEcf";
import type { AprobacionPayload } from "../types";

export function useAprobarEcf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AprobacionPayload) => {
      const response = await aprobarEcfApi.aprobar(data);
      if (response?.success === false || response?.status === false) {
        throw new Error(extractErrorMessage(response) ?? "No se pudo enviar la aprobación.");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecf-recibidos"] });
    },
  });
}
