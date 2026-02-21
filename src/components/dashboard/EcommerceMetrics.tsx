import { useQuery } from "@tanstack/react-query";
import {
  GroupIcon,
  ListIcon,
  PageIcon,
  BoxIconLine,
} from "../../icons";
import { clientesApi, cotizacionesApi, facturasApi } from "../../services/api";
import type { Factura } from "../../services/api";

export default function EcommerceMetrics() {
  // Fetch total Clientes
  const { data: clientesData } = useQuery({
    queryKey: ["dashboard-clientes"],
    queryFn: () => clientesApi.getClientes({ pageSize: 1 }),
    staleTime: 5 * 60 * 1000,
  });
  const totalClientes = clientesData?.data?.total || 0;

  // Fetch total Cotizaciones
  const { data: cotizacionesData } = useQuery({
    queryKey: ["dashboard-cotizaciones"],
    queryFn: () => cotizacionesApi.getCotizaciones({ pageSize: 1 }),
    staleTime: 5 * 60 * 1000,
  });
  const totalCotizaciones = cotizacionesData?.data?.total || 0;

  // Fetch Facturas for Sales calculations
  const { data: facturasData } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: () => facturasApi.getFacturas({ pageSize: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const allFacturas = facturasData?.data?.data || [];

  // Helper to safely parse amount fields
  const parseAmount = (item: Factura) => {
    const rawVal = (item.amount ?? 0) as string | number;
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
      change: "+12%",
      isCurrency: false,
    },
    {
      title: "Cotizaciones",
      value: totalCotizaciones,
      icon: <PageIcon className="size-6" />,
      color: "bg-purple-500",
      accent: "text-purple-600 dark:text-purple-400",
      change: "+5%",
      isCurrency: false,
    },
    {
      title: "Ventas Mensuales",
      value: monthlySales,
      icon: <BoxIconLine className="size-6" />,
      color: "bg-emerald-500",
      accent: "text-emerald-600 dark:text-emerald-400",
      change: "+18%",
      isCurrency: true,
    },
    {
      title: "Ventas Totales",
      value: lifetimeSales,
      icon: <ListIcon className="size-6" />,
      color: "bg-orange-500",
      accent: "text-orange-600 dark:text-orange-400",
      change: "+24%",
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
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {metric.isCurrency && "$"}
                  {metric.value.toLocaleString('en-US', {
                    minimumFractionDigits: metric.isCurrency ? 2 : 0,
                    maximumFractionDigits: metric.isCurrency ? 2 : 0
                  })}
                </h4>
                <span className={`text-xs font-bold ${metric.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {metric.change}
                </span>
              </div>
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
