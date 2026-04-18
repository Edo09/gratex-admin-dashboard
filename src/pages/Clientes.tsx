import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { clientesApi, facturasApi, cotizacionesApi } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import BasicTableOne from "../components/tables/BasicTableOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../components/ui/table";
import type { Cliente } from "../types";
import { formatCurrency } from '../utils/format';
import Alert from '../components/ui/alert/Alert';

interface ClienteRow extends Cliente {
  [key: string]: unknown;
}

type CreateClientFormData = {
  client_name: string;
  company_name: string;
  email: string;
  phone_number: string;
  sent_mail: boolean;
  rnc: string;
};

type CreateClientValidationErrors = Partial<Record<"email" | "client_name" | "company_name" | "phone_number", string>>;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeClientFormData = (formData: CreateClientFormData): CreateClientFormData => ({
  ...formData,
  client_name: formData.client_name.trim(),
  company_name: formData.company_name.trim(),
  email: formData.email.trim(),
  phone_number: formData.phone_number.trim(),
  rnc: formData.rnc.trim(),
});

const validateCreateClientData = (formData: CreateClientFormData): CreateClientValidationErrors => {
  const errors: CreateClientValidationErrors = {};

  if (!formData.email || !isValidEmail(formData.email) || formData.email.length > 100) {
    errors.email = "El email es obligatorio, debe ser valido y tener maximo 100 caracteres.";
  }

  if (!formData.client_name || formData.client_name.length > 100) {
    errors.client_name = "El nombre del cliente es obligatorio y no puede exceder 100 caracteres.";
  }

  if (!formData.company_name || formData.company_name.length > 100) {
    errors.company_name = "La empresa es obligatoria y no puede exceder 100 caracteres.";
  }

  const phoneDigits = formData.phone_number.replace(/\D/g, "");
  if (!formData.phone_number || formData.phone_number.length > 20 || phoneDigits.length > 13) {
    errors.phone_number = "El telefono es obligatorio, maximo 20 caracteres y 13 digitos.";
  }

  return errors;
};

const extractErrorMessage = (response: unknown): string | undefined => {
  if (!response || typeof response !== "object") return undefined;

  const candidate = response as { message?: unknown; error?: unknown; data?: unknown };
  if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message;
  if (typeof candidate.error === "string" && candidate.error.trim()) return candidate.error;

  if (candidate.data && typeof candidate.data === "object") {
    const nested = candidate.data as { message?: unknown; error?: unknown };
    if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
    if (typeof nested.error === "string" && nested.error.trim()) return nested.error;
  }

  if (typeof candidate.data === "string" && candidate.data.trim()) return candidate.data;

  return undefined;
};

export default function Clientes() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [newClientData, setNewClientData] = useState<CreateClientFormData>({
    client_name: "",
    company_name: "",
    email: "",
    phone_number: "",
    sent_mail: false,
    rnc: "",
  });
  const [createValidationErrors, setCreateValidationErrors] = useState<CreateClientValidationErrors>({});

  const openCreateClientModal = () => {
    setCreateError("");
    setCreateSuccess("");
    setCreateValidationErrors({});
    setIsCreateModalOpen(true);
  };

  const closeCreateClientModal = () => {
    if (createLoading) return;
    setCreateValidationErrors({});
    setCreateError("");
    setIsCreateModalOpen(false);
  };

  const updateCreateField = <K extends keyof CreateClientFormData>(key: K, value: CreateClientFormData[K]) => {
    setNewClientData((prev) => {
      const next = { ...prev, [key]: value };
      const normalized = normalizeClientFormData(next);
      const nextErrors = validateCreateClientData(normalized);
      setCreateValidationErrors((prevErrors) => {
        if (Object.keys(prevErrors).length === 0 && !prevErrors[key as keyof CreateClientValidationErrors]) {
          return prevErrors;
        }
        return nextErrors;
      });
      return next;
    });
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedData = normalizeClientFormData(newClientData);
    const validationErrors = validateCreateClientData(normalizedData);
    setCreateValidationErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setCreateError("Corrige los campos marcados antes de guardar.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const response = await clientesApi.createCliente(normalizedData);
      if (response && response.status === true) {
        const successMsg = typeof response.data === 'string' ? response.data : "Cliente guardado exitosamente.";
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        setIsCreateModalOpen(false);
        setCreateSuccess("");
        setCreateValidationErrors({});
        setNewClientData({ client_name: "", company_name: "", email: "", phone_number: "", sent_mail: false, rnc: "" });
        setPageSuccessMessage(successMsg);
        setTimeout(() => setPageSuccessMessage(""), 5000);
      } else {
        const backendMessage = extractErrorMessage(response);
        setCreateError(backendMessage ?? "No se pudo guardar el cliente.");
      }
    } catch (e) {
      console.error("Error creating client:", e);
      const errorMessage = extractErrorMessage(e);
      setCreateError(errorMessage ?? "No se pudo guardar el cliente.");
    } finally {
      setCreateLoading(false);
    }
  };

  const [pageSuccessMessage, setPageSuccessMessage] = useState("");

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
    if (!clientesData) return;
    const paginationTotal = clientesData.pagination?.total;
    if (typeof paginationTotal === 'number') {
      setTotal(paginationTotal);
      return;
    }
    const dataArr = Array.isArray(clientesData.data) ? clientesData.data : [];
    setTotal(dataArr.length);
  }, [clientesData]);
  let rows: ClienteRow[] = [];
  rows = Array.isArray(clientesData?.data) ? (clientesData!.data as ClienteRow[]) : [];

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
  type RowShape = { id: number; date: string; code?: string; client?: string; company_name?: string; description: string; amount: string; no_factura?: string; client_name?: string; total: string; ncf?: string };
  let facturaRows: RowShape[] = [];
  if (clientFacturasData && Array.isArray(clientFacturasData.data)) {
    const rawData = clientFacturasData.data as unknown as Record<string, unknown>[];
    facturaRows = rawData.map((item: Record<string, unknown>, index: number) => ({
      id: (item.id as number) ?? index + 1,
      no_factura: (item.no_factura as string) ?? '',
      date: (item.date as string) ?? '',
      client_name: (item.client_name as string) ?? '',
      company_name: (item.company_name as string) ?? (item.empresa as string) ?? (item.company as string) ?? '',
      total: (item.total as string) ?? '',
      ncf: (item.NCF as string) ?? '',
      description: (item.description as string) ?? '',
      amount: formatCurrency((item.amount ?? item.total ?? 0) as number | string).replace('$', ''),
    }));
  }

  // Extract Modal Cotizacion Rows
  let cotizacionRows: RowShape[] = [];
  if (clientCotizacionesData && Array.isArray(clientCotizacionesData.data)) {
    const rawData = clientCotizacionesData.data as unknown as Record<string, unknown>[];
    cotizacionRows = rawData.map((item: Record<string, unknown>, index: number) => ({
      id: (item.id as number) ?? index + 1,
      code: (item.code as string) ?? (item.codigo as string) ?? '',
      date: (item.date as string) ?? '',
      client: (item.client_name as string) ?? (item.cliente as string) ?? '',
      company_name: (item.company_name as string) ?? (item.empresa as string) ?? (item.company as string) ?? '',
      description: (item.description as string) ?? (item.descripcion as string) ?? '',
      total: formatCurrency((item.total ?? 0) as number | string).replace('$', ''),
      amount: formatCurrency((item.amount ?? item.total ?? 0) as number | string).replace('$', ''),
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

      {pageSuccessMessage && (
        <div className="mb-4">
          <Alert
            variant="success"
            title="Cliente Creado"
            message={pageSuccessMessage}
          />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar clientes por nombre, empresa o RNC..."
          className="w-full max-w-md rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white transition-all"
        />
        <Button onClick={openCreateClientModal} variant="primary">
          Nuevo Cliente
        </Button>
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

      {/* Create Client Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateClientModal}
        className="max-w-md w-full max-h-[90vh] p-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 relative">
          <h2 className="text-xl font-bold text-white">Crear Nuevo Cliente</h2>
          <p className="text-blue-100 text-sm mt-0.5">Ingresa los datos para el registro</p>
          <button
            type="button"
            onClick={closeCreateClientModal}
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-gray-800 overflow-y-auto no-scrollbar">
          {createSuccess && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {createSuccess}
            </div>
          )}
          
          {createError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateClient} className="space-y-5">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Cliente <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ej. Juan Pérez"
                    value={newClientData.client_name}
                    onChange={(e) => updateCreateField("client_name", e.target.value)}
                    className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 transition-colors dark:bg-gray-800 dark:text-white ${createValidationErrors.client_name ? "border-red-400 focus:border-red-500 focus:ring-red-300 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400"}`}
                  />
                </div>
                {createValidationErrors.client_name && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{createValidationErrors.client_name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Empresa <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ej. Acme Corp"
                    value={newClientData.company_name}
                    onChange={(e) => updateCreateField("company_name", e.target.value)}
                    className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 transition-colors dark:bg-gray-800 dark:text-white ${createValidationErrors.company_name ? "border-red-400 focus:border-red-500 focus:ring-red-300 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400"}`}
                  />
                </div>
                {createValidationErrors.company_name && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{createValidationErrors.company_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">RNC (Opcional)</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Ej. 130123456"
                    value={newClientData.rnc}
                    onChange={(e) => updateCreateField("rnc", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    placeholder="Ej. juan@ejemplo.com"
                    value={newClientData.email}
                    onChange={(e) => updateCreateField("email", e.target.value)}
                    className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 transition-colors dark:bg-gray-800 dark:text-white ${createValidationErrors.email ? "border-red-400 focus:border-red-500 focus:ring-red-300 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400"}`}
                  />
                </div>
                {createValidationErrors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{createValidationErrors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Teléfono <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="Ej. (809) 555-0198"
                    value={newClientData.phone_number}
                    onChange={(e) => updateCreateField("phone_number", e.target.value)}
                    className={`block w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 transition-colors dark:bg-gray-800 dark:text-white ${createValidationErrors.phone_number ? "border-red-400 focus:border-red-500 focus:ring-red-300 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400"}`}
                  />
                </div>
                {createValidationErrors.phone_number && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{createValidationErrors.phone_number}</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <label className="flex items-center justify-between cursor-pointer w-full">
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Correo de Bienvenida</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enviar un correo introduciendo nuestros servicios.</span>
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={newClientData.sent_mail}
                  onChange={(e) => updateCreateField("sent_mail", e.target.checked)}
                />
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${newClientData.sent_mail ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white border border-gray-300 shadow-sm transition-transform duration-200 ${newClientData.sent_mail ? "translate-x-5 border-white" : "translate-x-0"}`}
                  />
                </div>
              </label>
            </div>
            
            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateClientModal}
                disabled={createLoading}
                className="px-5 py-2.5 shadow-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createLoading}
                className="px-5 py-2.5 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {createLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Guardar Cliente</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
