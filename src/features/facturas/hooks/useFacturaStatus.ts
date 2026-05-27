import { useQuery } from "@tanstack/react-query";
import { facturasApi } from "../api/facturas";

export function useFacturaStatusQuery(facturaId: number | null) {
  return useQuery({
    queryKey: ["facturas", "estado", facturaId],
    queryFn: async () => {
      if (facturaId == null) return null;
      const response = await facturasApi.estado(facturaId);
      return response.data ?? null;
    },
    enabled: facturaId != null,
    refetchInterval: (query) => {
      const estado = query.state.data?.estado_dgii;
      if (estado === "ENVIADO") return 15_000;
      return false;
    },
    staleTime: 30_000,
  });
}
