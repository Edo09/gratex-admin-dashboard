import { useQuery } from "@tanstack/react-query";
import { unwrapList, unwrapOne } from "@/shared/api/envelope";
import type { Factura } from "@/features/facturas/types";
import { facturasSimplesApi } from "../api/facturasSimples";

interface UseFacturasSimplesQueryParams {
  query?: string;
  page?: number;
  pageSize?: number;
}

export function useFacturasSimplesQuery({ query = "", page, pageSize }: UseFacturasSimplesQueryParams = {}) {
  return useQuery({
    queryKey: ["facturas-simples", query, page, pageSize],
    queryFn: async () => unwrapList<Factura>(await facturasSimplesApi.list({ query, page, pageSize })),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useFacturaSimpleByIdQuery(id: number | null) {
  return useQuery({
    queryKey: ["facturas-simples", "detail", id],
    queryFn: async () => {
      if (id == null) return null;
      const response = await facturasSimplesApi.byId(id);
      return unwrapOne<Factura>(response, id);
    },
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  });
}
