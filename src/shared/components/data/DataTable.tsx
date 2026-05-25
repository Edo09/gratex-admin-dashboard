import { useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/Table";
import { Spinner } from "@/shared/components/ui/Spinner";
import { formatCurrency, formatDisplayDate } from "@/shared/utils/format";
import { openRowPdf, type DataKind } from "./pdfRowHandlers";
import { Pagination } from "./Pagination";
import { useDataListController, type DataListRow } from "./useDataListController";

interface DataTableProps {
  dataKind: DataKind;
  query?: string;
  rows: DataListRow[];
  loading?: boolean;
  error?: string;
  pagination?: "client" | "server";
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowClick?: (row: DataListRow) => void;
}

export function DataTable({
  dataKind,
  query = "",
  rows,
  loading = false,
  error,
  pagination = "client",
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: DataTableProps) {
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const ctrl = useDataListController({
    query,
    rows,
    pagination,
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
  });

  const handleRowClick = async (row: DataListRow) => {
    if (onRowClick) return onRowClick(row);
    if (loadingRowId !== null) return;
    setLoadingRowId(row.id);
    try {
      await openRowPdf(dataKind, row.id);
    } catch (err) {
      console.error("Error opening PDF:", err);
      alert("Error al abrir el PDF");
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Fecha</TableCell>
              {dataKind === "facturas" ? (
                <>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">No. Factura</TableCell>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Cliente</TableCell>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">NCF</TableCell>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Descripcion</TableCell>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Monto</TableCell>
                </>
              ) : (
                <>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Codigo</TableCell>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Cliente</TableCell>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Descripcion</TableCell>
                  <TableCell isHeader className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300">Monto</TableCell>
                </>
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={6}>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={6}>
                  <span className="text-red-600 dark:text-red-400 font-medium">{error}</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && ctrl.filtered.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={6}>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Sin resultados</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && ctrl.displayRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => handleRowClick(row)}
                role="button"
                tabIndex={0}
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06] ${
                  loadingRowId === row.id ? "opacity-60 pointer-events-none" : ""
                } ${loadingRowId !== null && loadingRowId !== row.id ? "pointer-events-none" : ""}`}
              >
                <TableCell className="px-5 py-5 sm:px-6 text-start">
                  <div className="flex items-center gap-2">
                    {loadingRowId === row.id && <Spinner className="h-5 w-5 text-brand-500" />}
                    <span className="block font-bold text-gray-900 text-base dark:text-white">
                      {formatDisplayDate(row.date)}
                    </span>
                  </div>
                </TableCell>
                {dataKind === "facturas" ? (
                  <>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">{row.no_factura}</TableCell>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">{row.client_name}</TableCell>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">{row.ncf}</TableCell>
                    <TableCell className="px-5 py-5 text-gray-800 text-start text-base font-medium dark:text-gray-200">
                      <MultilineText text={row.description} />
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-900 text-base font-bold dark:text-white">
                      {formatCurrency(row.amount)}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">{row.code}</TableCell>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">{row.client}</TableCell>
                    <TableCell className="px-5 py-5 text-gray-800 text-start text-base font-medium dark:text-gray-200">
                      <MultilineText text={row.description} />
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-900 text-base font-bold dark:text-white">
                      {formatCurrency(row.amount)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && !error && ctrl.totalCount > 0 && (
          <Pagination
            page={ctrl.effectivePage}
            pageSize={ctrl.effectivePageSize}
            total={ctrl.totalCount}
            onPageChange={ctrl.goToPage}
            onPageSizeChange={ctrl.changePageSize}
          />
        )}
      </div>
    </div>
  );
}

function MultilineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n|\r\n?/).map((line, idx) => (
        <span key={idx}>
          {line}
          <br />
        </span>
      ))}
    </>
  );
}
