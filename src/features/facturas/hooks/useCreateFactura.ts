import { useMutation, useQueryClient } from "@tanstack/react-query";
import { facturasApi } from "../api/facturas";
import type { CreateFacturaPayload } from "../types";

export function useCreateFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacturaPayload) => facturasApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["facturas"] }),
  });
}
