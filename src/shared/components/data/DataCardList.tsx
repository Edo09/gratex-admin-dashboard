import { useState } from "react";
import { formatCurrency, formatDisplayDate } from "@/shared/utils/format";
import { Spinner } from "@/shared/components/ui/Spinner";
import { openRowPdf, type DataKind } from "./pdfRowHandlers";
import { Pagination } from "./Pagination";
import { useDataListController, type DataListRow } from "./useDataListController";

interface DataCardListProps {
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

export function DataCardList({
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
}: DataCardListProps) {
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

  const cardMetaCode = (row: DataListRow) =>
    dataKind === "facturas" ? row.no_factura || "-" : row.code || "-";
  const cardTitle = (row: DataListRow) =>
    dataKind === "facturas" ? row.client_name || "-" : row.client || "-";
  const companyName = (row: DataListRow) => {
    const title = cardTitle(row);
    const company = row.company_name?.trim();
    if (!company || company === "-" || company.toLowerCase() === title.toLowerCase()) return "";
    return company;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] sm:p-5">
      <div className="space-y-3">
        {loading && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-5 text-base font-medium text-gray-600 dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-gray-400">
            Cargando...
          </div>
        )}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-5 text-base font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        {!loading && !error && ctrl.filtered.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-5 text-base font-medium text-gray-600 dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-gray-400">
            Sin resultados
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {ctrl.displayRows.map((row) => (
              <div
                key={row.id}
                onClick={() => handleRowClick(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void handleRowClick(row);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`group rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 transition-all dark:border-white/[0.06] dark:bg-white/[0.02] sm:px-5 ${
                  loadingRowId === row.id
                    ? "pointer-events-none opacity-60"
                    : "cursor-pointer hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white dark:hover:border-brand-500/40 dark:hover:bg-white/[0.04]"
                } ${loadingRowId !== null && loadingRowId !== row.id ? "pointer-events-none" : ""}`}
              >
                <div className="grid gap-4 lg:grid-cols-[132px_minmax(0,1fr)_auto] lg:items-start lg:gap-5">
                  <div className="flex items-center gap-2 lg:col-span-3">
                    {loadingRowId === row.id && <Spinner className="h-4 w-4 shrink-0 text-brand-500" />}
                    <h3 className="w-full whitespace-nowrap text-2xl font-bold leading-tight text-gray-900 dark:text-white">
                      {cardTitle(row)}
                    </h3>
                  </div>

                  <div className="min-w-[132px]">
                    <div className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-white/[0.03] dark:ring-white/[0.08]">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {dataKind === "facturas" ? "Factura" : "Codigo"}
                      </div>
                      <div className="truncate text-sm font-bold text-gray-900 dark:text-white">
                        {cardMetaCode(row)}
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {formatDisplayDate(row.date)}
                      </div>
                    </div>

                    {dataKind === "facturas" && row.ncf && (
                      <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">NCF: {row.ncf}</p>
                    )}
                  </div>

                  <div className="min-w-0">
                    {companyName(row) && (
                      <p className="mt-1 truncate text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {companyName(row)}
                      </p>
                    )}
                    <p
                      title={row.description}
                      className="mt-1 min-h-[5.5rem] cursor-help line-clamp-4 whitespace-pre-line break-words text-base font-medium italic text-gray-600 dark:text-gray-300"
                    >
                      {row.description}
                    </p>
                  </div>

                  <div className="text-left lg:min-w-[170px] lg:self-center lg:text-right">
                    <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(row.amount)}
                    </div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total Neto
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
  );
}
