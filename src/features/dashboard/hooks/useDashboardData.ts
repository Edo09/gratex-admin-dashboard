import { useQuery } from "@tanstack/react-query";
import { facturasApi } from "@/features/facturas/api/facturas";
import { cotizacionesApi } from "@/features/cotizaciones/api/cotizaciones";
import { clientesApi } from "@/features/clientes/api/clientes";
import { unwrapList } from "@/shared/api/envelope";
import type { Factura } from "@/features/facturas/types";
import type { Cotizacion } from "@/features/cotizaciones/types";

/**
 * Walk the pagination for a list endpoint and concatenate every page.
 * Used by the dashboard for accurate totals/charts.
 */
async function paginateAll<T>(
  fetcher: (page: number, pageSize: number) => Promise<{ items: T[]; totalPages: number }>,
  pageSize = 100,
): Promise<T[]> {
  const first = await fetcher(1, pageSize);
  const all = [...first.items];
  if (first.totalPages > 1) {
    const restPages = Array.from({ length: first.totalPages - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(restPages.map((p) => fetcher(p, pageSize)));
    for (const r of rest) all.push(...r.items);
  }
  return all;
}

export function useAllFacturasQuery() {
  return useQuery({
    queryKey: ["dashboard", "facturas-all"],
    queryFn: () =>
      paginateAll<Factura>(async (page, pageSize) => {
        const response = await facturasApi.list({ page, pageSize });
        const { items } = unwrapList<Factura>(response);
        return { items, totalPages: response.pagination?.totalPages ?? 1 };
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllCotizacionesQuery() {
  return useQuery({
    queryKey: ["dashboard", "cotizaciones-all"],
    queryFn: () =>
      paginateAll<Cotizacion>(async (page, pageSize) => {
        const response = await cotizacionesApi.list({ page, pageSize });
        const { items } = unwrapList<Cotizacion>(response);
        return { items, totalPages: response.pagination?.totalPages ?? 1 };
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardClientCount() {
  return useQuery({
    queryKey: ["dashboard", "clientes-count"],
    queryFn: async () => {
      const response = await clientesApi.list();
      return unwrapList(response).items.length;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardCotizacionCount() {
  return useQuery({
    queryKey: ["dashboard", "cotizaciones-count"],
    queryFn: async () => {
      const response = await cotizacionesApi.list({ pageSize: 1 });
      return response.pagination?.total ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentFacturasQuery(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "facturas-recent", limit],
    queryFn: async () => unwrapList<Factura>(await facturasApi.list({ pageSize: limit })).items,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentCotizacionesQuery(limit = 6) {
  return useQuery({
    queryKey: ["dashboard", "cotizaciones-recent", limit],
    queryFn: async () => unwrapList<Cotizacion>(await cotizacionesApi.list({ pageSize: limit })).items,
    staleTime: 5 * 60 * 1000,
  });
}

/** Safely parse a factura amount (handles string or number form). */
export function parseFacturaAmount(item: Factura): number {
  const raw = (item.amount ?? item.total) ?? 0;
  const val = typeof raw === "string" ? parseFloat(raw) : raw;
  return isNaN(val) ? 0 : val;
}
