import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/Table";
import { Pagination } from "@/shared/components/data/Pagination";
import { getClientDisplayName, getClientPhone, type Cliente } from "../types";

interface ClientesTableProps {
  rows: Cliente[];
  loading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowClick: (cliente: Cliente) => void;
}

export function ClientesTable({
  rows,
  loading,
  error,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: ClientesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Nombre</TableCell>
              <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Empresa</TableCell>
              <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">RNC</TableCell>
              <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Email</TableCell>
              <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Teléfono</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={5}>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={5}>
                  <span className="text-red-600 dark:text-red-400 font-medium">Error al cargar clientes</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && rows.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={5}>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Sin resultados</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick(row)}
                role="button"
                tabIndex={0}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              >
                <TableCell className="px-5 py-5 sm:px-6 text-start font-bold text-gray-900 text-base dark:text-white">
                  {getClientDisplayName(row)}
                </TableCell>
                <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                  {row.company_name ?? "—"}
                </TableCell>
                <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                  {row.rnc ?? "—"}
                </TableCell>
                <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                  {row.email ?? "—"}
                </TableCell>
                <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                  {getClientPhone(row) ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!loading && !error && total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>
    </div>
  );
}
