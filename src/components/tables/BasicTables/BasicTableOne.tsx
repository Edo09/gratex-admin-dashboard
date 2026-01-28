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
}: BasicTableOneProps) {

  const handleRowClick = async (row: RecordRow) => {
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
                className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
              >
                Fecha
              </TableCell>
              {dataType === "facturas" ? (
                <>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    No. Factura
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    Cliente
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    NCF
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    Descripcion
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    Monto
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    Codigo
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    Cliente
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
                  >
                    Descripcion
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-4 font-bold text-gray-700 text-start text-base dark:text-gray-300"
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
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={5}>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Cargando...</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={5}>
                  <span className="text-red-600 dark:text-red-400 font-medium">{error}</span>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && filtered.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-5 sm:px-6 text-start text-base" colSpan={5}>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Sin resultados</span>
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
                <TableCell className="px-5 py-5 sm:px-6 text-start">
                  <span className="block font-bold text-gray-900 text-base dark:text-white">
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
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                      {row.no_factura}
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                      {row.client_name}
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                      {row.ncf}
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-800 text-start text-base font-medium dark:text-gray-200">
                      {row.description.split(/\n|\r\n?/).map((desc, idx) => (
                        <span key={idx}>
                          {desc}
                          <br />
                        </span>
                      ))}
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-900 text-base font-bold dark:text-white">
                      {row.amount}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                      {row.code}
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-700 text-start text-base font-medium dark:text-gray-300">
                      {row.client}
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-800 text-start text-base font-medium dark:text-gray-200">
                      {row.description.split(/\n|\r\n?/).map((desc, idx) => (
                        <span key={idx}>
                          {desc}
                          <br />
                        </span>
                      ))}
                    </TableCell>
                    <TableCell className="px-5 py-5 text-gray-900 text-base font-bold dark:text-white">
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
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-t-2 border-gray-200 dark:border-gray-700">
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
                    {s} / página
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <button
                  disabled={effectivePage <= 1}
                  onClick={() => goToPage(effectivePage - 1)}
                  className="rounded-lg border-2 border-gray-300 px-4 py-2 text-base font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-3 text-base font-bold text-gray-800 dark:text-white">
                  {effectivePage} / {totalPages}
                </span>
                <button
                  disabled={effectivePage >= totalPages}
                  onClick={() => goToPage(effectivePage + 1)}
                  className="rounded-lg border-2 border-gray-300 px-4 py-2 text-base font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 transition-colors"
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
