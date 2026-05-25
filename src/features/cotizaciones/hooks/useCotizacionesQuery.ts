import { useQuery } from "@tanstack/react-query";
import { cotizacionesApi } from "../api/cotizaciones";
import { unwrapList, unwrapOne } from "@/shared/api/envelope";
import type { Cotizacion } from "../types";

interface UseCotizacionesQueryParams {
  query?: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useCotizacionesQuery({
  query = "",
  page,
  pageSize,
  enabled,
}: UseCotizacionesQueryParams = {}) {
  return useQuery({
    queryKey: ["cotizaciones", query, page, pageSize],
    queryFn: async () => unwrapList<Cotizacion>(await cotizacionesApi.list({ query, page, pageSize })),
    enabled,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export async function fetchCotizacionById(id: number): Promise<Cotizacion | null> {
  const response = await cotizacionesApi.byId(id);
  return unwrapOne<Cotizacion>(response, id);
}
