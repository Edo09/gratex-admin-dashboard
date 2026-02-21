import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { clientesApi, facturasApi, cotizacionesApi } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import BasicTableOne from "../components/tables/BasicTables/BasicTableOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import type { Cliente } from "../types";

interface ClienteRow extends Cliente {
  [key: string]: unknown;
}

export default function Clientes() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteRow | null>(null);

  // Data tabs in Modal
  const [activeTab, setActiveTab] = useState<"facturas" | "cotizaciones">("facturas");

  const {
    data: clientesData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['clientes', debouncedQuery, page, pageSize],
    queryFn: () => clientesApi.getClientes({ query: debouncedQuery, page, pageSize }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (clientesData && clientesData.data) {
      if (Array.isArray(clientesData.data)) {
        setTotal(clientesData.data.length);
      } else if (
        typeof clientesData.data === 'object' &&
        'data' in clientesData.data
      ) {
        const nested = clientesData.data as unknown as Record<string, unknown>;
        if (Array.isArray(nested.data)) {
          setTotal((nested.total as number) || (nested.data as unknown[]).length);
        }
      }
    }
  }, [clientesData]);

  let rows: ClienteRow[] = [];
  if (clientesData && clientesData.data) {
    if (Array.isArray(clientesData.data)) {
      rows = clientesData.data as ClienteRow[];
    } else if (
      typeof clientesData.data === 'object' &&
      'data' in clientesData.data
    ) {
      const nested = clientesData.data as unknown as Record<string, unknown>;
      if (Array.isArray(nested.data)) {
        rows = nested.data as ClienteRow[];
      }
    }
  }

  const handleRowClick = (client: ClienteRow) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    setActiveTab("facturas");
  };

  // Queries for Modal
  const clientSearchQuery = selectedClient?.rnc || selectedClient?.client_name || selectedClient?.nombre || selectedClient?.name || "";

  const {
    data: clientFacturasData,
    isLoading: loadingFacturas,
    error: errorFacturas,
  } = useQuery({
    queryKey: ['facturas', clientSearchQuery],
    queryFn: () => facturasApi.getFacturas({ query: clientSearchQuery }),
    enabled: isModalOpen && !!clientSearchQuery && activeTab === "facturas",
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: clientCotizacionesData,
    isLoading: loadingCotizaciones,
    error: errorCotizaciones,
  } = useQuery({
    queryKey: ['cotizaciones', clientSearchQuery],
    queryFn: () => cotizacionesApi.getCotizaciones({ query: clientSearchQuery }),
    enabled: isModalOpen && !!clientSearchQuery && activeTab === "cotizaciones",
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Extract Modal Factura Rows
  type RowShape = { id: number; date: string; code?: string; client?: string; description: string; amount: string; no_factura?: string; client_name?: string; total: string; ncf?: string };
  let facturaRows: RowShape[] = [];
  if (clientFacturasData && clientFacturasData.data) {
    const rawData = Array.isArray(clientFacturasData.data)
      ? clientFacturasData.data
      : ((clientFacturasData.data as unknown as Record<string, unknown>).data as Record<string, unknown>[]) || [];
    facturaRows = (rawData as Record<string, unknown>[]).map((item: Record<string, unknown>, index: number) => ({
      id: (item.id as number) ?? index + 1,
      no_factura: (item.no_factura as string) ?? '',
      date: (item.date as string) ?? '',
      client_name: (item.client_name as string) ?? '',
      total: (item.total as string) ?? '',
      ncf: (item.NCF as string) ?? '',
      description: (item.description as string) ?? '',
      amount: typeof item.amount === "number" ? item.amount.toFixed(2) : typeof item.amount === "string" ? item.amount : typeof item.total === "number" ? item.total.toFixed(2) : typeof item.total === "string" ? item.total : "",
    }));
  }

  // Extract Modal Cotizacion Rows
  let cotizacionRows: RowShape[] = [];
  if (clientCotizacionesData && clientCotizacionesData.data) {
    const rawData = Array.isArray(clientCotizacionesData.data)
      ? clientCotizacionesData.data
      : ((clientCotizacionesData.data as unknown as Record<string, unknown>).data as Record<string, unknown>[]) || [];
    cotizacionRows = (rawData as Record<string, unknown>[]).map((item: Record<string, unknown>, index: number) => ({
      id: (item.id as number) ?? index + 1,
      code: (item.code as string) ?? (item.codigo as string) ?? '',
      date: (item.date as string) ?? '',
      client: (item.client_name as string) ?? (item.cliente as string) ?? '',
      description: (item.description as string) ?? (item.descripcion as string) ?? '',
      total: typeof item.total === "string" ? item.total : typeof item.total === "number" ? item.total.toFixed(2) : "",
      amount: typeof item.amount === "number" ? item.amount.toFixed(2) : typeof item.amount === "string" ? item.amount : typeof item.total === "number" ? item.total.toFixed(2) : typeof item.total === "string" ? item.total : "",
    }));
  }

  const clientNameDisplay = selectedClient?.client_name ?? selectedClient?.nombre ?? selectedClient?.name ?? "Cliente Desconocido";

  return (
    <div>
      <PageMeta
        title="Gestión de Clientes | Gratex Admin"
        description="Panel de administración de clientes para Gratex"
      />
      <PageBreadcrumb pageTitle="Clientes" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar clientes por nombre, empresa o RNC..."
          className="w-full max-w-md rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white transition-all"
        />
      </div>

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
                  onClick={() => handleRowClick(row)}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <TableCell className="px-5 py-5 sm:px-6 text-start font-bold text-gray-900 text-base dark:text-white">
                    {row.client_name ?? row.nombre ?? row.name ?? "—"}
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
                    {row.phone_number ?? row.telefono ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {!loading && !error && total > 0 && (
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-t-2 border-gray-200 dark:border-gray-700">
              <div className="text-base font-medium text-gray-700 dark:text-gray-300">
                Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-base font-medium dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 25, 50].map((s) => (
                    <option key={s} value={s} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
                      {s} / página
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="rounded-lg border-2 border-gray-300 px-4 py-2 text-base font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-3 text-base font-bold text-gray-800 dark:text-white">
                    {page} / {Math.max(1, Math.ceil(total / pageSize))}
                  </span>
                  <button
                    disabled={page >= Math.ceil(total / pageSize)}
                    onClick={() => setPage(p => p + 1)}
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

      {/* Client Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(null);
        }}
        className="max-w-6xl w-full p-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 border-b-2 border-blue-800 relative rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Detalles del Cliente</h2>
          <p className="text-blue-100 text-sm mt-0.5">{clientNameDisplay} {selectedClient?.company_name ? `(${selectedClient.company_name})` : ""}</p>
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-blue-200"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh] bg-gray-50 dark:bg-gray-800">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">RNC</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{selectedClient?.rnc ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{selectedClient?.email ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Teléfono</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{selectedClient?.phone_number ?? selectedClient?.telefono ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dirección</div>
                <div className="text-base font-medium text-gray-900 dark:text-white">{selectedClient?.direccion ?? "—"}</div>
              </div>
            </div>
          </div>

          <div className="mb-4 space-x-2">
            <Button
              variant={activeTab === "facturas" ? "primary" : "outline"}
              onClick={() => setActiveTab("facturas")}
            >
              Facturas
            </Button>
            <Button
              variant={activeTab === "cotizaciones" ? "primary" : "outline"}
              onClick={() => setActiveTab("cotizaciones")}
            >
              Cotizaciones
            </Button>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {activeTab === "facturas" ? (
              <BasicTableOne
                dataType="facturas"
                rows={facturaRows}
                loading={loadingFacturas}
                error={errorFacturas ? String(errorFacturas) : undefined}
                pagination="client"
              />
            ) : (
              <BasicTableOne
                dataType="cotizaciones"
                rows={cotizacionRows}
                loading={loadingCotizaciones}
                error={errorCotizaciones ? String(errorCotizaciones) : undefined}
                pagination="client"
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
