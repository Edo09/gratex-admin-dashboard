import { useQuery } from "@tanstack/react-query";
import { facturasApi } from "../api/facturas";
import { unwrapList } from "@/shared/api/envelope";
import type { Factura } from "../types";

interface UseFacturasQueryParams {
  query?: string;
  page?: number;
  pageSize?: number;
}

export function useFacturasQuery({ query = "", page, pageSize }: UseFacturasQueryParams = {}) {
  return useQuery({
    queryKey: ["facturas", query, page, pageSize],
    queryFn: async () => unwrapList<Factura>(await facturasApi.list({ query, page, pageSize })),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}
