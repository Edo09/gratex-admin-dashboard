import { useQuery } from "@tanstack/react-query";
import { facturasApi } from "@/features/facturas/api/facturas";
import { facturasSimplesApi } from "@/features/facturas-simples/api/facturasSimples";
import { cotizacionesApi } from "@/features/cotizaciones/api/cotizaciones";
import { clientesApi } from "@/features/clientes/api/clientes";
import { unwrapList } from "@/shared/api/envelope";
import type { Factura } from "@/features/facturas/types";
import { isFacturaRejected } from "@/features/facturas/constants";
import { parseFacturaAmount } from "@/features/facturas/utils";
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
    queryFn: async () => {
      const all = await paginateAll<Factura>(async (page, pageSize) => {
        const response = await facturasApi.list({ page, pageSize });
        const { items } = unwrapList<Factura>(response);
        return { items, totalPages: response.pagination?.totalPages ?? 1 };
      });
      // Rejected comprobantes are not real sales — exclude from all dashboard
      // totals/charts (same rule the Facturas list uses).
      return all.filter((f) => !isFacturaRejected(f.estado_dgii));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Same as useAllFacturasQuery but for facturas simples (NCF). No reject filter:
 * simples are never submitted to DGII, so they have no estado_dgii. */
export function useAllFacturasSimplesQuery() {
  return useQuery({
    queryKey: ["dashboard", "facturas-simples-all"],
    queryFn: () =>
      paginateAll<Factura>(async (page, pageSize) => {
        const response = await facturasSimplesApi.list({ page, pageSize });
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

export function useRecentFacturasSimplesQuery(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "facturas-simples-recent", limit],
    queryFn: async () =>
      unwrapList<Factura>(await facturasSimplesApi.list({ pageSize: limit })).items,
    staleTime: 5 * 60 * 1000,
  });
}

export type FacturaSource = "ecf" | "ncf";
export interface DashboardFactura extends Factura {
  source: FacturaSource;
}

/** All facturas (e-CF + NCF) merged for totals/chart. Order irrelevant. */
export function useAllFacturasMerged(): Factura[] {
  const { data: ecf = [] } = useAllFacturasQuery(); // already reject-filtered
  const { data: ncf = [] } = useAllFacturasSimplesQuery();
  return [...ecf, ...ncf];
}

/** Most-recent e-CF + NCF merged, newest first, tagged with source. */
export function useRecentFacturasMerged(limit = 5): DashboardFactura[] {
  const { data: ecf = [] } = useRecentFacturasQuery(limit + 3);
  const { data: ncf = [] } = useRecentFacturasSimplesQuery(limit + 3);
  const toTime = (f: Factura) => new Date((f.date ?? "").replace(" ", "T")).getTime() || 0;
  return [
    ...ecf.map((f) => ({ ...f, source: "ecf" as const })),
    ...ncf.map((f) => ({ ...f, source: "ncf" as const })),
  ]
    .filter((f) => !isFacturaRejected(f.estado_dgii)) // only touches e-CF
    .sort((a, b) => toTime(b) - toTime(a))
    .slice(0, limit);
}

export function useRecentCotizacionesQuery(limit = 6) {
  return useQuery({
    queryKey: ["dashboard", "cotizaciones-recent", limit],
    queryFn: async () => unwrapList<Cotizacion>(await cotizacionesApi.list({ pageSize: limit })).items,
    staleTime: 5 * 60 * 1000,
  });
}


/** Safely parse a cotización total (handles string or number form). */
export function parseCotizacionAmount(item: Cotizacion): number {
  const raw = item.total ?? 0;
  const val = typeof raw === "string" ? parseFloat(raw) : Number(raw);
  return isNaN(val) ? 0 : val;
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as const;

export interface DashboardMonthlyPoint {
  m: string;
  f: number;
  c: number;
}

/**
 * Derives a 12-month series of factura and cotización totals for the given
 * year (default: current). Reads from the shared "all" queries so it's free if
 * those are already loaded for the metric cards.
 */
export function useMonthlyProduction(year: number = new Date().getFullYear()): DashboardMonthlyPoint[] {
  const facturas = useAllFacturasMerged();
  const { data: cotizaciones = [] } = useAllCotizacionesQuery();

  const facturasByMonth = new Array(12).fill(0);
  for (const f of facturas) {
    if (!f.date) continue;
    const date = new Date(f.date.replace(" ", "T"));
    if (date.getFullYear() !== year) continue;
    facturasByMonth[date.getMonth()] += parseFacturaAmount(f);
  }

  const cotizacionesByMonth = new Array(12).fill(0);
  for (const c of cotizaciones) {
    if (!c.date) continue;
    const date = new Date(c.date);
    if (date.getFullYear() !== year) continue;
    cotizacionesByMonth[date.getMonth()] += parseCotizacionAmount(c);
  }

  return MONTH_LABELS.map((m, i) => ({
    m,
    f: facturasByMonth[i],
    c: cotizacionesByMonth[i],
  }));
}

export interface DashboardKpis {
  clientesTotal: number | undefined;
  cotizacionesTotal: number | undefined;
  facturasTotal: number;
  ventasMes: number;
  ventasTotal: number;
  /** ventas-mes vs prior month, as a signed fraction (e.g. 0.246 = +24.6%). */
  ventasMomDelta: number | null;
  /** facturas / cotizaciones, as a fraction (e.g. 0.74 = 74%). */
  conversion: number | null;
}

/** Años presentes en las facturas (e-CF + NCF) + el año actual, orden desc. */
export function useFacturaYears(): number[] {
  const facturas = useAllFacturasMerged();
  const years = new Set<number>([new Date().getFullYear()]);
  for (const f of facturas) {
    if (!f.date) continue;
    const y = new Date(f.date.replace(" ", "T")).getFullYear();
    if (!isNaN(y)) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

/** Single derived view of all KPIs the dashboard tiles need. `ventasTotal` se
 * filtra por `year` (default: actual). */
export function useDashboardKpis(year: number = new Date().getFullYear()): DashboardKpis {
  const { data: clientesTotal } = useDashboardClientCount();
  const { data: cotizacionesTotal } = useDashboardCotizacionCount();
  const facturas = useAllFacturasMerged();

  const facturasTotal = facturas.length;
  const ventasTotal = facturas.reduce((sum, f) => {
    if (!f.date) return sum;
    const y = new Date(f.date.replace(" ", "T")).getFullYear();
    return y === year ? sum + parseFacturaAmount(f) : sum;
  }, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const priorDate = new Date(now);
  priorDate.setMonth(currentMonth - 1);
  const priorMonth = priorDate.getMonth();
  const priorYear = priorDate.getFullYear();

  let ventasMes = 0;
  let ventasPriorMes = 0;
  for (const f of facturas) {
    if (!f.date) continue;
    const date = new Date(f.date.replace(" ", "T"));
    const amt = parseFacturaAmount(f);
    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) ventasMes += amt;
    if (date.getFullYear() === priorYear && date.getMonth() === priorMonth) ventasPriorMes += amt;
  }

  const ventasMomDelta = ventasPriorMes > 0 ? (ventasMes - ventasPriorMes) / ventasPriorMes : null;
  const conversion =
    cotizacionesTotal && cotizacionesTotal > 0 ? facturasTotal / cotizacionesTotal : null;

  return {
    clientesTotal,
    cotizacionesTotal,
    facturasTotal,
    ventasMes,
    ventasTotal,
    ventasMomDelta,
    conversion,
  };
}
