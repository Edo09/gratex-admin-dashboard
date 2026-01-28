import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
// import Badge from "../ui/badge/Badge"; // Not using badges for now as status isn't available
import { cotizacionesApi } from "../../services/api";

export default function RecentOrders() {
  const { data: cotizacionesData, isLoading } = useQuery({
    queryKey: ["dashboard-recent-cotizaciones"],
    queryFn: () => cotizacionesApi.getCotizaciones({ pageSize: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  // Extract rows from the response (handling paginated structure)
  const rows = cotizacionesData?.data?.data || [];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Cotizaciones Recientes
          </h3>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fecha
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Cliente
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Descripción
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading && (
              <TableRow>
                <TableCell className="py-3 text-center" colSpan={4}>Cargando...</TableCell>
              </TableRow>
            )}
            {!isLoading && rows.map((row) => (
              <TableRow key={row.id} className="">
                <TableCell className="py-3">
                  <span className="text-gray-500 text-theme-sm dark:text-gray-400">
                    {row.date ? row.date.split(" ")[0] : ""}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {row.client_name}
                  </p>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {/* Truncate description if too long */}
                  {row.items && row.items.length > 0
                    ? row.items[0].description.substring(0, 30) + (row.items[0].description.length > 30 ? "..." : "")
                    : (row.description || "").substring(0, 30)}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {row.total}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
