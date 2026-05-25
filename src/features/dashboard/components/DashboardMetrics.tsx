import { GroupIcon, ListIcon, PageIcon, BoxIconLine } from "@/icons";
import { MetricCard } from "./MetricCard";
import {
  parseFacturaAmount,
  useAllFacturasQuery,
  useDashboardClientCount,
  useDashboardCotizacionCount,
} from "../hooks/useDashboardData";

export function DashboardMetrics() {
  const { data: totalClientes = 0 } = useDashboardClientCount();
  const { data: totalCotizaciones = 0 } = useDashboardCotizacionCount();
  const { data: allFacturas = [] } = useAllFacturasQuery();

  const totalFacturas = allFacturas.length;
  const lifetimeSales = allFacturas.reduce((sum, f) => sum + parseFacturaAmount(f), 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySales = allFacturas.reduce((sum, f) => {
    const date = new Date(f.date.replace(" ", "T"));
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      return sum + parseFacturaAmount(f);
    }
    return sum;
  }, 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <MetricCard
        title="Total Clientes"
        value={totalClientes}
        icon={<GroupIcon className="size-6" />}
        color="bg-blue-500"
        accent="text-blue-600 dark:text-blue-400"
      />
      <MetricCard
        title="Cotizaciones | Facturas"
        value={totalCotizaciones}
        secondaryValue={totalFacturas}
        icon={<PageIcon className="size-6" />}
        color="bg-purple-500"
        accent="text-purple-600 dark:text-purple-400"
      />
      <MetricCard
        title="Ventas Mensuales"
        value={monthlySales}
        icon={<BoxIconLine className="size-6" />}
        color="bg-emerald-500"
        accent="text-emerald-600 dark:text-emerald-400"
        isCurrency
      />
      <MetricCard
        title="Ventas Totales"
        value={lifetimeSales}
        icon={<ListIcon className="size-6" />}
        color="bg-orange-500"
        accent="text-orange-600 dark:text-orange-400"
        isCurrency
      />
    </div>
  );
}
