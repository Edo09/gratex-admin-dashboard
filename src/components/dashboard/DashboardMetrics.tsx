import { useQuery } from "@tanstack/react-query";
import {
  GroupIcon,
  ListIcon,
  PageIcon,
  BoxIconLine,
} from "../../icons";
import { clientesApi, cotizacionesApi, facturasApi } from "../../services/api";
import type { Factura, PaginatedResponse } from "../../services/api";

/** Fetch all facturas, handling both flat array and paginated responses. */
async function fetchAllFacturas(): Promise<Factura[]> {
  const response = await facturasApi.getFacturas({ page: 1, pageSize: 100 });
  const payload = response.data;

  // If the API returns a flat array directly
  if (Array.isArray(payload)) {
    return payload;
  }

  // If paginated: { page, pageSize, total, totalPages, data: [...] }
  const paginated = payload as PaginatedResponse<Factura> | undefined;
  if (!paginated?.data) return [];

  const allItems = [...paginated.data];
  const totalPages = paginated.totalPages ?? 1;

  if (totalPages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        facturasApi.getFacturas({ page: i + 2, pageSize: 100 })
      )
    );
    for (const res of remaining) {
      const p = res.data as PaginatedResponse<Factura> | undefined;
      if (p?.data && Array.isArray(p.data)) allItems.push(...p.data);
    }
  }

  return allItems;
}

export default function DashboardMetrics() {
  // Fetch total Clientes (API returns a flat array, not paginated)
  const { data: clientesData } = useQuery({
    queryKey: ["dashboard-clientes"],
    queryFn: () => clientesApi.getClientes(),
    staleTime: 5 * 60 * 1000,
  });
  const totalClientes = Array.isArray(clientesData?.data)
    ? clientesData.data.length
    : 0;

  // Fetch total Cotizaciones (only need the count)
  const { data: cotizacionesData } = useQuery({
    queryKey: ["dashboard-cotizaciones"],
    queryFn: () => cotizacionesApi.getCotizaciones({ pageSize: 1 }),
    staleTime: 5 * 60 * 1000,
  });
  const totalCotizaciones = cotizacionesData?.data?.total || 0;

  // Fetch ALL facturas (paginated) for accurate sales totals
  const { data: allFacturas = [] } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: fetchAllFacturas,
    staleTime: 5 * 60 * 1000,
  });

  const totalFacturas = allFacturas.length;

  // Helper to safely parse amount fields
  const parseAmount = (item: Factura) => {
    const rawVal = ((item.amount || item.total) ?? 0) as string | number;
    const val = typeof rawVal === 'string' ? parseFloat(rawVal) : rawVal;
    return isNaN(val) ? 0 : val;
  };

  // Calculate Lifetime Sales
  const lifetimeSales = allFacturas.reduce((sum, f) => sum + parseAmount(f), 0);

  // Calculate Monthly Sales
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySales = allFacturas.reduce((sum, f) => {
    const fDate = new Date(f.date);
    if (fDate.getMonth() === currentMonth && fDate.getFullYear() === currentYear) {
      return sum + parseAmount(f);
    }
    return sum;
  }, 0);

  const metrics = [
    {
      title: "Total Clientes",
      value: totalClientes,
      icon: <GroupIcon className="size-6" />,
      color: "bg-blue-500",
      accent: "text-blue-600 dark:text-blue-400",
      isCurrency: false,
    },
    {
      title: "Cotizaciones | Facturas",
      value: totalCotizaciones,
      secondaryValue: totalFacturas,
      icon: <PageIcon className="size-6" />,
      color: "bg-purple-500",
      accent: "text-purple-600 dark:text-purple-400",
      isCurrency: false,
    },
    {
      title: "Ventas Mensuales",
      value: monthlySales,
      icon: <BoxIconLine className="size-6" />,
      color: "bg-emerald-500",
      accent: "text-emerald-600 dark:text-emerald-400",
      isCurrency: true,
    },
    {
      title: "Ventas Totales",
      value: lifetimeSales,
      icon: <ListIcon className="size-6" />,
      color: "bg-orange-500",
      accent: "text-orange-600 dark:text-orange-400",
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {metric.title}
              </span>
              <h4 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {metric.isCurrency && "$"}
                {metric.value.toLocaleString('en-US', {
                  minimumFractionDigits: metric.isCurrency ? 2 : 0,
                  maximumFractionDigits: metric.isCurrency ? 2 : 0
                })}
                {metric.secondaryValue != null && (
                  <>
                    <span className="mx-1.5 text-base font-normal text-gray-300 dark:text-gray-600">|</span>
                    {metric.secondaryValue.toLocaleString('en-US')}
                  </>
                )}
              </h4>
            </div>

            <div className={`flex size-12 items-center justify-center rounded-xl bg-opacity-10 dark:bg-opacity-20 ${metric.accent} ${metric.color.replace('bg-', 'bg-opacity-10 ')}`}>
              {metric.icon}
            </div>
          </div>

          {/* Subtle background gradient accent */}
          <div className={`absolute -bottom-6 -right-6 size-24 rounded-full blur-3xl opacity-10 ${metric.color}`} />
        </div>
      ))}
    </div>
  );
}
