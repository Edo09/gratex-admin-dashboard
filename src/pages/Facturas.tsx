import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BasicTableOne from "../components/tables/BasicTables/BasicTableOne";
import { useDebounce } from "../hooks/useDebounce";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import { BoxIcon } from "../icons";
import { facturasApi, clientesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Facturas() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationType, setCreationType] = useState<"client" | "cotizacion" | null>(null);
  // Local state for create loading and error
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Cotizaciones state for 'crear desde cotización'
  const [cotizaciones, setCotizaciones] = useState<any[]>([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);
  const [errorCotizaciones, setErrorCotizaciones] = useState<string | undefined>(undefined);
  const [cotizacionQuery, setCotizacionQuery] = useState("");
  const [selectedCotizacion, setSelectedCotizacion] = useState<any | null>(null);

  // When a cotización is selected, set items and facturaData
  useEffect(() => {
    if (selectedCotizacion) {
      console.log('selectedCotizacion changed:', selectedCotizacion);
      // Defensive: handle missing or malformed items array
      let cotItems = [];
      if (Array.isArray(selectedCotizacion.items)) {
        cotItems = selectedCotizacion.items;
      } else {
        console.warn('Cotización has no items array:', selectedCotizacion);
      }
      const mappedItems = cotItems.map((item: any) => ({
        id: Date.now() + Math.random(),
        description: item.description,
        amount: Number(item.amount),
        quantity: Number(item.quantity),
      }));
      if (mappedItems.length === 0) {
        console.warn('No items found for selected cotización:', selectedCotizacion);
      }
      console.log('Setting items:', mappedItems);
      setItems(mappedItems);
      setItemForm({ description: '', amount: '', quantity: '1' });
      setSelectedCliente({
        id: selectedCotizacion.client_id,
        client_name: selectedCotizacion.client_name,
        company_name: selectedCotizacion.company_name,
        email: selectedCotizacion.email,
        phone_number: selectedCotizacion.phone_number,
        nombre: selectedCotizacion.nombre,
        name: selectedCotizacion.name,
        telefono: selectedCotizacion.telefono,
        direccion: selectedCotizacion.direccion,
        rnc: selectedCotizacion.rnc,
      });
      // Format date to yyyy-MM-dd
      let formattedDate = getTodayDate();
      if (selectedCotizacion.date) {
        const dateStr = selectedCotizacion.date.split(' ')[0]; // "2025-12-23 00:00:00" -> "2025-12-23"
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          formattedDate = dateStr;
        }
      }
      setFacturaData(fd => ({
        ...fd,
        client: selectedCotizacion.client_name ?? selectedCotizacion.cliente ?? '',
        date: formattedDate,
        ncf: fd.ncf,
        rnc: selectedCotizacion.rnc ?? '',
      }));
    }
  }, [selectedCotizacion]);

  type Cliente = {
    id: number;
    email?: string;
    client_name?: string;
    company_name?: string;
    phone_number?: string;
    nombre?: string;
    name?: string;
    telefono?: string;
    direccion?: string;
    rnc?: string;
  };
  type LineItem = { id: number; description: string; amount: number; quantity: number };

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState<string | undefined>(undefined);
  const [clienteQuery, setClienteQuery] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showClienteOptions, setShowClienteOptions] = useState(false);

  const [items, setItems] = useState<LineItem[]>([]);
  const [itemForm, setItemForm] = useState({ description: "", amount: "", quantity: "1" });
  useEffect(() => {
    console.log('items state changed:', items);
  }, [items]);
  useEffect(() => {
    console.log('itemForm state changed:', itemForm);
  }, [itemForm]);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [facturaData, setFacturaData] = useState({ date: getTodayDate(), client: "", ncf: "", rnc: "" });

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount * item.quantity, 0), [items]);

  // const generateNCF = () => {
  //   // Generate random 9-digit NCF (in real app, would come from API)
  //   return Math.floor(Math.random() * 900000000 + 100000000).toString();
  // };

  // Fetch next NCF from API
  const fetchNextNCF = async () => {
    try {
      // const { token } = JSON.parse(localStorage.getItem('auth_storage') || '{}')?.state || {};
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ncf/next`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.status && data.data) {
        return data.data; // e.g. B0100000005
      }
    } catch (error) {
      console.error("Error fetching next NCF:", error);
    }
    return "";
  };

  type TableRow = {
    id: number;
    no_factura: string;
    date: string;
    client_name: string;
    total: string;
    ncf: string;
    description: string;
    amount: string;
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const mapApiToRow = useMemo(
    () =>
      (item: Record<string, unknown>, index: number): TableRow => ({
        id: (item.id as number) ?? index + 1,
        no_factura: (item.no_factura as string) ?? '',
        date: (item.date as string) ?? '',
        client_name: (item.client_name as string) ?? '',
        total: (item.total as string) ?? '',
        ncf: (item.NCF as string) ?? '',
        description: (item.description as string) ?? '',
        amount: (
          typeof item.amount === "number"
            ? item.amount.toFixed(2)
            : typeof item.amount === "string"
              ? item.amount
              : typeof item.total === "number"
                ? item.total.toFixed(2)
                : typeof item.total === "string"
                  ? item.total
                  : ""
        ),
      }),
    []
  );

  // Load clients or cotizaciones when modal opens
  useEffect(() => {
    let ignore = false;
    const fetchClientes = async () => {
      if (!isCreateModalOpen || creationType !== "client") return;
      try {
        setLoadingClientes(true);
        setErrorClientes(undefined);
        const response = await clientesApi.getClientes();
        const items = response.data ? (Array.isArray(response.data) ? response.data : response.data.items ?? []) : [];
        if (!ignore) setClientes(items as Cliente[]);
      } catch (e: any) {
        if (!ignore) setErrorClientes(e?.message || "Error al cargar clientes");
      } finally {
        if (!ignore) setLoadingClientes(false);
      }
    };
    const fetchCotizaciones = async () => {
      if (!isCreateModalOpen || creationType !== "cotizacion") return;
      try {
        setLoadingCotizaciones(true);
        setErrorCotizaciones(undefined);
        const { cotizacionesApi } = await import("../services/api");
        const response = await cotizacionesApi.getCotizaciones();
        const items = response.data
          ? (Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data.items)
              ? response.data.items
              : Array.isArray(response.data.data)
                ? response.data.data
                : [])
          : [];
        if (!ignore) setCotizaciones(items);
      } catch (e: any) {
        if (!ignore) setErrorCotizaciones(e?.message || "Error al cargar cotizaciones");
      } finally {
        if (!ignore) setLoadingCotizaciones(false);
      }
    };
    fetchClientes();
    fetchCotizaciones();
    return () => { ignore = true; };
  }, [isCreateModalOpen, creationType]);


  const {
    data: facturasData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['facturas', debouncedQuery, page, pageSize],
    queryFn: () => facturasApi.getFacturas({ query: debouncedQuery, page, pageSize }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  // Parse data and total from API response
  let rows: TableRow[] = [];
  useEffect(() => {
    if (facturasData && facturasData.data) {
      if (Array.isArray(facturasData.data)) {
        setTotal(facturasData.data.length);
      } else if (
        typeof facturasData.data === 'object' &&
        'data' in facturasData.data &&
        Array.isArray((facturasData.data as any).data)
      ) {
        setTotal((facturasData.data as any).total || (facturasData.data as any).data.length);
      }
    }
  }, [facturasData]);

  if (facturasData && facturasData.data) {
    if (Array.isArray(facturasData.data)) {
      rows = facturasData.data.map(mapApiToRow);
    } else if (
      typeof facturasData.data === 'object' &&
      'data' in facturasData.data &&
      Array.isArray((facturasData.data as any).data)
    ) {
      rows = (facturasData.data as any).data.map(mapApiToRow);
    }
  }

  const handleAddItem = () => {
    const description = itemForm.description.trim();
    const amount = parseFloat(itemForm.amount);
    const quantity = parseFloat(itemForm.quantity);

    if (!description || isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) return;

    setItems((prev) => [...prev, { id: Date.now(), description, amount, quantity }]);
    setItemForm({ description: "", amount: "", quantity: "1" });
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <PageMeta
        title="Gratex Dashboard"
        description="Pagina para gestionar las facturas"
      />
      <PageBreadcrumb pageTitle="Facturas" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por fecha, código, cliente o descripción..."
          className="w-full max-w-md rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white transition-all"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="whitespace-nowrap text-base px-5 py-2.5"
        >
          Crear Factura
        </Button>
      </div>

      {/* Create Factura Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreationType(null);
        }}
        className="max-w-5xl w-full p-0 max-h-[92vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 border-b-2 border-blue-800">
          <h2 className="text-xl font-bold text-white">Nueva Factura</h2>
          <p className="text-blue-100 text-sm mt-0.5">Complete los detalles para generar la factura</p>
        </div>

        {!creationType ? (
          <div className="p-8 space-y-6">
            <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
              Selecciona cómo deseas crear la factura:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={() => setCreationType("client")}
                className="flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-gray-600 dark:hover:bg-white/[0.04] dark:hover:border-blue-500 bg-white dark:bg-gray-800"
              >
                <svg className="w-16 h-16 mb-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Desde Cliente</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Crear factura seleccionando un cliente</span>
              </button>

              <button
                onClick={() => setCreationType("cotizacion")}
                className="flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-gray-600 dark:hover:bg-white/[0.04] dark:hover:border-blue-500 bg-white dark:bg-gray-800"
              >
                <svg className="w-16 h-16 mb-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-lg font-bold text-gray-900 dark:text-white">Desde Cotización</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Convertir una cotización en factura</span>
              </button>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-6 py-3 text-base font-semibold"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : creationType === "client" ? (
          <form
            className="p-8 space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setCreateError(null);
              if (!selectedCliente || !facturaData.date || items.length === 0) return;
              try {
                setCreateLoading(true);
                await facturasApi.createFactura({
                  date: facturaData.date,
                  client: facturaData.client,
                  client_id: selectedCliente?.id ?? undefined,
                  items: items.map(({ description, amount, quantity }) => ({ description, amount, quantity })),
                  ncf: facturaData.ncf || undefined,
                });
                setIsCreateModalOpen(false);
                setCreationType(null);
                setSelectedCliente(null);
                setFacturaData({ date: getTodayDate(), client: "", ncf: "", rnc: "" });
                setItems([]);
                setItemForm({ description: "", amount: "", quantity: "1" });
                setShowSuccessAlert(true);
                setTimeout(() => setShowSuccessAlert(false), 3500);
                // Invalidate and refetch facturas table
                await queryClient.invalidateQueries({ queryKey: ['facturas'] });
              } catch (err) {
                setCreateError("Error al guardar la factura");
              } finally {
                setCreateLoading(false);
              }
            }}
          >
            {/* Client Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <label className="mb-3 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">👤</span>
                Información del Cliente
              </label>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Cliente</label>
              {!selectedCliente && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={clienteQuery}
                    onChange={(e) => {
                      setClienteQuery(e.target.value);
                      setShowClienteOptions(e.target.value.trim().length > 0);
                    }}
                    placeholder="🔍 Escriba para buscar cliente por nombre, empresa, email o teléfono..."
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-5 py-4 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  {clienteQuery.trim().length > 0 && (
                    <div className="max-h-64 overflow-y-auto rounded-xl border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-lg">
                      {loadingClientes && (
                        <div className="px-5 py-4 text-base font-medium text-gray-600 dark:text-gray-400">⏳ Cargando clientes...</div>
                      )}
                      {!loadingClientes && errorClientes && (
                        <div className="px-5 py-4 text-base font-medium text-red-600 dark:text-red-400">
                          {errorClientes instanceof Error ? errorClientes.message : String(errorClientes)}
                        </div>
                      )}
                      {!loadingClientes && !errorClientes && (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                          {clientes
                            .filter((c) => {
                              const q = clienteQuery.trim().toLowerCase();
                              if (!q) return true;
                              const name = c.client_name ?? c.nombre ?? c.name ?? "";
                              const company = c.company_name ?? "";
                              const email = c.email ?? "";
                              const phone = c.phone_number ?? c.telefono ?? "";
                              return [name, company, email, phone].join(" ").toLowerCase().includes(q);
                            })
                            .map((c) => {
                              const name = c.client_name ?? c.nombre ?? c.name ?? `Cliente ${c.id}`;
                              const isSelected = facturaData.client === name;
                              return (
                                <li
                                  key={c.id}
                                  className={`cursor-pointer px-5 py-4 text-base hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${isSelected ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-white/[0.08]" : ""
                                    }`}
                                  onClick={async () => {
                                    const nextNCF = await fetchNextNCF();
                                    setSelectedCliente(c);
                                    setFacturaData({
                                      ...facturaData,
                                      client: name,
                                      rnc: c.rnc || "",
                                      ncf: nextNCF
                                    });
                                    setShowClienteOptions(false);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800 dark:text-white">{name}</span>
                                    {isSelected && (
                                      <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-white/[0.12] dark:text-white">
                                        Seleccionado
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {c.company_name ?? ""} {c.email ? `• ${c.email}` : ""} {c.phone_number ? `• ${c.phone_number}` : ""}
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 dark:text-gray-400">Seleccionado: {facturaData.client || "—"}</div>
                </div>
              )}
              {selectedCliente && (
                <div className="rounded-xl border-2 border-green-300 bg-green-50/80 dark:bg-green-900/20 p-6 shadow-lg dark:border-green-700">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{selectedCliente.client_name ?? selectedCliente.nombre ?? selectedCliente.name}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedCliente(null);
                        setShowClienteOptions(false);
                        setFacturaData({ ...facturaData, client: "" });
                      }}
                      className="px-4 py-2 text-base"
                    >
                      Cambiar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Empresa</div>
                      <div className="text-base font-medium text-gray-900 dark:text-white">{selectedCliente.company_name ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">RNC</div>
                      <div className="text-base font-medium text-gray-900 dark:text-white">{selectedCliente.rnc ?? "—"}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</div>
                      <div className="text-base font-medium text-gray-900 dark:text-white">{selectedCliente.email ?? "—"}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Teléfono</div>
                      <div className="text-base font-medium text-gray-900 dark:text-white">{selectedCliente.phone_number ?? selectedCliente.telefono ?? "—"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Date and Total Section */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <span className="text-blue-600 dark:text-blue-400">📅</span>
                  Fecha
                </label>
                <input
                  type="date"
                  value={facturaData.date}
                  onChange={(e) => setFacturaData({ ...facturaData, date: e.target.value })}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-xl p-4 border-2 border-green-300 dark:border-green-700">
                <label className="mb-2 block text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-1">
                  <span>💰</span>
                  Total Estimado
                </label>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  ${totalAmount ? totalAmount.toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
            {/* Items Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <label className="mb-4 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">📦</span>
                Items de la Factura
              </label>
              
              {/* Add Item Form */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-5 mb-5 border-2 border-gray-300 dark:border-gray-600">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                    <textarea
                      placeholder="Descripción del item..."
                      value={itemForm.description}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full resize-none rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Monto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={itemForm.amount}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                    />
                  </div>
                  <div className="md:col-span-3 flex items-end">
                    <Button
                      size="sm"
                      variant="primary"
                      startIcon={<BoxIcon className="size-5" />}
                      className="w-full h-12 text-base font-semibold"
                      onClick={handleAddItem}
                      type="button"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
              {/* Items List */}
              <div className="rounded-lg border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 overflow-hidden">
                {items.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                      <BoxIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No hay items agregados</p>
                    <p className="text-base text-gray-400 dark:text-gray-500 mt-1">Use el formulario de arriba para agregar items</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white text-base">{item.description}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Cant. {item.quantity} · Monto ${item.amount.toFixed(2)}</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">${(item.amount * item.quantity).toFixed(2)}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="px-4 py-2 text-base"
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Footer Actions */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-8 py-6 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setCreationType(null)}
                className="px-6 py-3 text-base font-semibold"
              >
                ← Volver
              </Button>
              <div className="flex gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreationType(null);
                  }}
                  className="px-6 py-3 text-base font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  type="submit"
                  className="px-6 py-3 text-base font-semibold bg-green-600 hover:bg-green-700"
                >
                  💾 Guardar Factura
                </Button>
              </div>
            </div>
          </form>
        ) : creationType === "cotizacion" ? (
          <div className="p-8 space-y-6">
            {/* Cotización search and select */}
            {!selectedCotizacion && (
              <div className="mb-4">
                <label className="mb-3 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">🔍</span>
                  Buscar Cotización
                </label>
                <input
                  type="text"
                  value={cotizacionQuery}
                  onChange={e => setCotizacionQuery(e.target.value)}
                  placeholder="Buscar por código, cliente o descripción..."
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-5 py-4 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                />
                {cotizacionQuery.trim() && !loadingCotizaciones && !errorCotizaciones && (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-64 overflow-y-auto mt-4 rounded-xl border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-lg">
                    {cotizaciones.filter(c => {
                      const q = cotizacionQuery.trim().toLowerCase();
                      if (!q) return true;
                      const code = c.code ?? c.codigo ?? '';
                      const client = c.client_name ?? c.cliente ?? '';
                      const desc = c.description ?? c.descripcion ?? '';
                      return [code, client, desc].join(' ').toLowerCase().includes(q);
                    }).map(c => {
                      const code = c.code ?? c.codigo ?? `Cotización ${c.id}`;
                      const client = c.client_name ?? c.cliente ?? '';
                      const monto = c.total ?? c.amount ?? c.monto ?? '';
                      const desc = c.description ?? c.descripcion ?? '';
                      let date = c.date ?? c.fecha ?? '';
                      if (typeof date === 'string' && date.length > 10) date = date.slice(0, 10);
                      return (
                        <li
                          key={c.id}
                          className="cursor-pointer px-5 py-4 text-base hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          onClick={async () => {
                            const nextNCF = await fetchNextNCF();
                            setSelectedCotizacion(c);
                            // Also need to set NCF in facturaData since the useEffect only sets it if it exists in fd.ncf which is empty initially
                            setFacturaData(fd => ({ ...fd, ncf: nextNCF }));
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[80px]">{date}</span>
                            <span className="font-medium text-gray-800 dark:text-white min-w-[90px]">{code}</span>
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{desc}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[90px]">{client}</span>
                            <span className="text-sm text-green-700 dark:text-green-400 font-semibold min-w-[80px] text-right">{monto ? `$${monto}` : ''}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {loadingCotizaciones && <div className="px-5 py-4 text-base font-medium text-gray-600 dark:text-gray-400">⏳ Cargando cotizaciones...</div>}
                {errorCotizaciones && <div className="px-5 py-4 text-base font-medium text-red-600 dark:text-red-400">{errorCotizaciones}</div>}
                <div className="text-base font-medium text-gray-700 dark:text-gray-300 mt-2">✓ Seleccionado: <span className="font-bold">{selectedCotizacion ? (selectedCotizacion.code ?? selectedCotizacion.codigo) : "Ninguna"}</span></div>
              </div>
            )}
            {/* After selecting a cotización, show the factura form (like client flow) */}
            {selectedCotizacion && (
              <>
                <div className="rounded-xl border-2 border-green-300 bg-green-50/80 dark:bg-green-900/20 p-6 shadow-lg dark:border-green-700">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{selectedCotizacion.code ?? selectedCotizacion.codigo}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedCotizacion(null);
                        setSelectedCliente(null);
                        setItems([]);
                        setFacturaData(fd => ({ ...fd, client: '' }));
                      }}
                      className="px-4 py-2 text-base"
                    >
                      Cambiar
                    </Button>
                  </div>
                  <div className="text-base text-gray-500 dark:text-gray-400">{selectedCotizacion.description ?? selectedCotizacion.descripcion ?? ''}</div>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span className="text-blue-600 dark:text-blue-400">📅</span>
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={facturaData.date}
                      onChange={e => setFacturaData(fd => ({ ...fd, date: e.target.value }))}
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                    <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span className="text-blue-600 dark:text-blue-400">🆔</span>
                      NCF
                    </label>
                    <input
                      type="text"
                      value={facturaData.ncf}
                      onChange={e => setFacturaData(fd => ({ ...fd, ncf: e.target.value }))}
                      placeholder="—"
                      className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-xl p-4 border-2 border-green-300 dark:border-green-700">
                    <label className="mb-2 block text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-1">
                      <span>💰</span>
                      Total Estimado
                    </label>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      ${totalAmount ? totalAmount.toFixed(2) : "0.00"}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
                  <label className="mb-4 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">📦</span>
                    Items de la Factura
                  </label>
                  
                  {/* Add Item Form */}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-5 mb-5 border-2 border-gray-300 dark:border-gray-600">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                      <div className="md:col-span-5">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                        <textarea
                          placeholder="Descripción del item..."
                          value={itemForm.description}
                          onChange={e => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                          rows={2}
                          className="w-full resize-none rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Monto ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={itemForm.amount}
                          onChange={e => setItemForm((prev) => ({ ...prev, amount: e.target.value }))}
                          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder="1"
                          value={itemForm.quantity}
                          onChange={e => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                        />
                      </div>
                      <div className="md:col-span-3 flex items-end">
                        <Button
                          size="sm"
                          variant="primary"
                          startIcon={<BoxIcon className="size-5" />}
                          className="w-full h-12 text-base font-semibold"
                          onClick={handleAddItem}
                          type="button"
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Items List */}
                  <div className="rounded-lg border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 overflow-hidden">
                    {items.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                          <BoxIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No hay items agregados</p>
                        <p className="text-base text-gray-400 dark:text-gray-500 mt-1">Use el formulario de arriba para agregar items</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-600">
                        {items.map((item, index) => (
                          <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white text-base">{item.description}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Cant. {item.quantity} · Monto ${item.amount.toFixed(2)}</div>
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">${(item.amount * item.quantity).toFixed(2)}</div>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="px-4 py-2 text-base"
                            >
                              Quitar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {/* Footer Actions */}
            <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-8 py-6 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setCreationType(null)}
                className="px-6 py-3 text-base font-semibold"
              >
                ← Volver
              </Button>
              <div className="flex gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreationType(null);
                  }}
                  className="px-6 py-3 text-base font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  type="button"
                  className="px-6 py-3 text-base font-semibold bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    // Handle save for cotizacion - similar to client but might need different logic
                    // For now, assume same as client
                  }}
                >
                  💾 Guardar Factura
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {showSuccessAlert && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-800 border border-green-200 text-sm">
          La factura ha sido creada correctamente.
        </div>
      )}
      <BasicTableOne
        dataType="facturas"
        query={debouncedQuery}
        rows={rows}
        loading={loading}
        error={error instanceof Error ? error.message : error as unknown as string}
        pagination="server"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />

    </div>
  );
}
