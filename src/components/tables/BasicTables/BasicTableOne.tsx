import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import { useMemo, useState } from "react";
import { cotizacionesApi, facturasApi } from "../../../services/api";


type DataType = "cotizaciones" | "facturas";
interface BasicTableOneProps {
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
  description: string;
  amount: string;
  no_factura?: string;
  client_name?: string;
  total: string;
  ncf?: string;
}



export default function BasicTableOne({
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
}: BasicTableOneProps) {

  const handleRowClick = async (row: RecordRow) => {
    if (onRowClick) {
      onRowClick(row);
      return;
    }

    try {
      let base64String: string;

      // Fetch PDF based on data type
      if (dataType === "cotizaciones") {
        const response = await cotizacionesApi.getCotizacionPdf(row.id);
        // API returns { status, data: { filename, content, mime_type } }
        base64String = response.data?.content || response.content || response;
      } else if (dataType === "facturas") {
        const response = await facturasApi.getFacturaPdf(row.id);
        // API returns { status, data: { filename, content, mime_type } }
        base64String = response.data?.content || response.content || response;
      } else {
        return;
      }

      if (base64String && typeof base64String === 'string') {
        // Convert base64 to blob
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });

        // Create object URL and open in new tab
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');

        // Clean up URL reference after a delay
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else {
        console.error("Invalid PDF response format:", base64String);
        alert("Formato de PDF inválido");
      }
    } catch (error) {
      console.error("Error opening PDF:", error);
      alert("Error al abrir el PDF");
    }
  };
  const source = rows && rows.length ? rows : [];
  const filtered = useMemo(() => {
    if (pagination === "server") return source;
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter((r) =>
      [r.date, r.code, r.client, r.description, r.amount]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query, pagination, source]);

  // Pagination state (client) or controlled (server)
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(10);
  const effectivePage = pagination === "server" ? page ?? 1 : clientPage;
  const effectivePageSize = pagination === "server" ? pageSize ?? 10 : clientPageSize;
  const totalCount = pagination === "server" ? total ?? filtered.length : filtered.length;
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / (effectivePageSize || 10)));
  const startIdx = (effectivePage - 1) * effectivePageSize;
  const endIdx = startIdx + effectivePageSize;

  // For server-side pagination, use data as-is (already paginated by backend)
  // For client-side pagination, slice the data
  const displayRows = pagination === "server"
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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fecha
              </TableCell>
              {dataType === "facturas" ? (
                <>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    No. Factura
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Cliente
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    NCF
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Descripcion
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Monto
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Codigo
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Cliente
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Descripcion
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Monto
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading && (
              <TableRow>
                <TableCell className="px-5 py-4 sm:px-6 text-start" colSpan={5}>
                  <span className="text-gray-500 dark:text-gray-400">Cargando...</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell className="px-5 py-4 sm:px-6 text-start" colSpan={5}>
                  <span className="text-red-600 dark:text-red-400">{error}</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-4 sm:px-6 text-start" colSpan={5}>
                  <span className="text-gray-500 dark:text-gray-400">Sin resultados</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && displayRows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => handleRowClick(row)}
                role="button"
                tabIndex={0}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              >
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {(() => {
                      // Format date to dd/mm/yyyy
                      if (!row.date) return "";
                      const d = row.date.split(" ")[0]; // Remove time if present
                      const [y, m, day] = d.split("-");
                      return `${day}/${m}/${y}`;
                    })()}
                  </span>
                </TableCell>
                {dataType === "facturas" ? (
                  <>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.no_factura}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.client_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.ncf}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                      {row.description.split(/\n|\r\n?/).map((desc, idx) => (
                        <span key={idx}>
                          {desc}
                          <br />
                        </span>
                      ))}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 text-theme-sm dark:text-gray-200">
                      {row.amount}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.code}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {row.client}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">
                      {row.description.split(/\n|\r\n?/).map((desc, idx) => (
                        <span key={idx}>
                          {desc}
                          <br />
                        </span>
                      ))}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 text-theme-sm dark:text-gray-200">
                      {row.amount}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination Controls */}
        {!loading && !error && totalCount > 0 && (
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {Math.min(startIdx + 1, totalCount)}–{Math.min(endIdx, totalCount)} de {totalCount}
            </div>
            <div className="flex items-center gap-3">
              <select
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-white/[0.08] dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]"
                value={effectivePageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
              >
                {[10, 25, 50].map((s) => (
                  <option key={s} value={s} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
                    {s} / página
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  disabled={effectivePage <= 1}
                  onClick={() => goToPage(effectivePage - 1)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 disabled:opacity-50 dark:border-white/[0.08] dark:text-white"
                >
                  Anterior
                </button>
                <span className="px-2 text-sm text-gray-700 dark:text-white">
                  {effectivePage} / {totalPages}
                </span>
                <button
                  disabled={effectivePage >= totalPages}
                  onClick={() => goToPage(effectivePage + 1)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 disabled:opacity-50 dark:border-white/[0.08] dark:text-white"
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
