import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { cotizacionesApi, facturasApi } from "../../services/api";
import { useMemo } from "react";

export default function RecentOrders() {
  const { data: cotizacionesData, isLoading: loadingCotizaciones } = useQuery({
    queryKey: ["dashboard-recent-cotizaciones"],
    queryFn: () => cotizacionesApi.getCotizaciones({ pageSize: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: facturasData, isLoading: loadingFacturas } = useQuery({
    queryKey: ["dashboard-recent-facturas"],
    queryFn: () => facturasApi.getFacturas({ pageSize: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const combinedRows = useMemo(() => {
    const cotizaciones = (cotizacionesData?.data?.data || []).map(item => ({
      ...item,
      type: "Cotización",
      displayDate: item.date ? item.date.split(" ")[0] : "",
      sortBy: item.date ? new Date(item.date).getTime() : 0,
    }));

    const facturas = (facturasData?.data?.data || []).map(item => ({
      ...item,
      type: "Factura",
      client_name: item.client, // Factura has 'client', Cotizacion has 'client_name'
      displayDate: item.date ? item.date.split(" ")[0] : "",
      sortBy: item.date ? new Date(item.date).getTime() : 0,
      total: item.amount, // Normalize total/amount
    }));

    return [...cotizaciones, ...facturas]
      .sort((a, b) => b.sortBy - a.sortBy)
      .slice(0, 10); // Show top 10 recent
  }, [cotizacionesData, facturasData]);

  const isLoading = loadingCotizaciones || loadingFacturas;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Actividad Reciente
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Últimas facturas y cotizaciones generadas
          </p>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Fecha
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Tipo
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Cliente
              </TableCell>
              <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Total
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading && (
              <TableRow>
                <TableCell className="py-3 text-center" colSpan={4}>Cargando...</TableCell>
              </TableRow>
            )}
            {!isLoading && combinedRows.map((row) => (
              <TableRow key={`${row.type}-${row.id}`}>
                <TableCell className="py-3">
                  <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                    {row.displayDate}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${row.type === "Factura"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                    {row.type}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {row.client_name}
                  </p>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  ${typeof row.total === 'number' ? row.total.toLocaleString('en-US', { minimumFractionDigits: 2 }) : row.total}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && combinedRows.length === 0 && (
              <TableRow>
                <TableCell className="py-3 text-center text-gray-500" colSpan={4}>
                  No hay actividad reciente
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
