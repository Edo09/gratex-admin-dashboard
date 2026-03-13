import { useMemo, useState } from "react";
import { cotizacionesApi, facturasApi } from "../../services/api";
import { formatCurrency } from "../../utils/format";

type DataType = "cotizaciones" | "facturas";
interface BasicCardListOneProps {
  query?: string;
  dataType?: DataType;
  rows: RecordRow[];
  loading?: boolean;
  error?: string;
  pagination?: "client" | "server";
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowClick?: (row: RecordRow) => void;
}

interface RecordRow {
  id: number;
  date: string;
  code?: string;
  client?: string;
  company_name?: string;
  description: string;
  amount: string;
  no_factura?: string;
  client_name?: string;
  total: string;
  ncf?: string;
}

export default function BasicCardListOne({
  query = "",
  dataType = "cotizaciones",
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
}: BasicCardListOneProps) {
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);

  const handleRowClick = async (row: RecordRow) => {
    if (onRowClick) {
      onRowClick(row);
      return;
    }

    if (loadingRowId !== null) return;

    setLoadingRowId(row.id);
    try {
      let base64String: string;

      if (dataType === "cotizaciones") {
        const response = await cotizacionesApi.getCotizacionPdf(row.id);
        base64String = response.data?.content || response.content || response;
      } else if (dataType === "facturas") {
        const response = await facturasApi.getFacturaPdf(row.id);
        base64String = response.data?.content || response.content || response;
      } else {
        return;
      }

      if (base64String && typeof base64String === "string") {
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank");
      } else {
        console.error("Invalid PDF response format:", base64String);
        alert("Formato de PDF invalido");
      }
    } catch (err) {
      console.error("Error opening PDF:", err);
      alert("Error al abrir el PDF");
    } finally {
      setLoadingRowId(null);
    }
  };

  const source = useMemo(() => (rows && rows.length ? rows : []), [rows]);
  const filtered = useMemo(() => {
    if (pagination === "server") return source;
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((r) =>
      [r.date, r.code, r.client, r.company_name, r.description, r.amount]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, pagination, source]);

  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(10);
  const effectivePage = pagination === "server" ? page ?? 1 : clientPage;
  const effectivePageSize = pagination === "server" ? pageSize ?? 10 : clientPageSize;
  const totalCount = pagination === "server" ? total ?? filtered.length : filtered.length;
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / (effectivePageSize || 10)));
  const startIdx = (effectivePage - 1) * effectivePageSize;
  const endIdx = startIdx + effectivePageSize;

  const displayRows =
    pagination === "server"
      ? filtered
      : filtered.slice((effectivePage - 1) * effectivePageSize, effectivePage * effectivePageSize);

  const goToPage = (p: number) => {
    if (pagination === "server") {
      onPageChange?.(p);
    } else {
      setClientPage(Math.min(Math.max(1, p), totalPages));
    }
  };

  const changePageSize = (size: number) => {
    if (pagination === "server") {
      onPageSizeChange?.(size);
      onPageChange?.(1);
    } else {
      setClientPageSize(size);
      setClientPage(1);
    }
  };

  const formatDisplayDate = (date: string) => {
    if (!date) return "";
    const datePart = date.split(" ")[0];
    const [y, m, day] = datePart.split("-");
    if (!y || !m || !day) return date;
    return `${day}/${m}/${y}`;
  };

  const getCardMetaCode = (row: RecordRow) =>
    dataType === "facturas" ? row.no_factura || "-" : row.code || "-";

  const getCardTitle = (row: RecordRow) =>
    dataType === "facturas" ? row.client_name || "-" : row.client || "-";

  const getCompanyName = (row: RecordRow) => {
    const title = getCardTitle(row);
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
        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-5 text-base font-medium text-gray-600 dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-gray-400">
            Sin resultados
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {displayRows.map((row) => (
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
                  <div className="min-w-[132px] rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-200 dark:bg-white/[0.03] dark:ring-white/[0.08]">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {dataType === "facturas" ? "Factura" : "Codigo"}
                    </div>
                    <div className="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {getCardMetaCode(row)}
                    </div>
                    <div className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatDisplayDate(row.date)}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {loadingRowId === row.id && (
                        <svg className="h-4 w-4 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      <h3 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
                        {getCardTitle(row)}
                      </h3>
                    </div>

                    {getCompanyName(row) && (
                      <p className="mt-1 truncate text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {getCompanyName(row)}
                      </p>
                    )}

                    <p className="mt-1 whitespace-pre-line text-base font-medium italic text-gray-600 dark:text-gray-300">
                      {row.description}
                    </p>

                    {dataType === "facturas" && row.ncf && (
                      <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">NCF: {row.ncf}</p>
                    )}
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

      <div className="max-w-full overflow-x-auto">
        {!loading && !error && totalCount > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t-2 border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-base font-medium text-gray-700 dark:text-gray-300">
              Mostrando {Math.min(startIdx + 1, totalCount)}–{Math.min(endIdx, totalCount)} de {totalCount}
            </div>
            <div className="flex items-center gap-3">
              <select
                className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-base font-medium dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]"
                value={effectivePageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
              >
                {[10, 25, 50].map((s) => (
                  <option key={s} value={s} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
                    {s} / pagina
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <button
                  disabled={effectivePage <= 1}
                  onClick={() => goToPage(effectivePage - 1)}
                  className="rounded-lg border-2 border-gray-300 px-4 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Anterior
                </button>
                <span className="px-3 text-base font-bold text-gray-800 dark:text-white">
                  {effectivePage} / {totalPages}
                </span>
                <button
                  disabled={effectivePage >= totalPages}
                  onClick={() => goToPage(effectivePage + 1)}
                  className="rounded-lg border-2 border-gray-300 px-4 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
