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
  const [showClienteOptions, setShowClienteOptions] = useState(true);

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
          className="w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white bg-white"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="whitespace-nowrap"
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
        className="max-w-3xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Crear Nueva Factura</h2>

        {!creationType ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Selecciona cómo deseas crear la factura:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setCreationType("client")}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors dark:border-white/[0.08] dark:hover:bg-white/[0.04] dark:hover:border-blue-500"
              >
                <svg className="w-12 h-12 mb-3 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-base font-semibold text-gray-900 dark:text-white">Desde Cliente</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Crear factura seleccionando un cliente</span>
              </button>

              <button
                onClick={() => setCreationType("cotizacion")}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors dark:border-white/[0.08] dark:hover:bg-white/[0.04] dark:hover:border-blue-500"
              >
                <svg className="w-12 h-12 mb-3 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-base font-semibold text-gray-900 dark:text-white">Desde Cotización</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Convertir una cotización en factura</span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : creationType === "client" ? (
          <form
            className="space-y-4"
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
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Cliente</label>
              {!selectedCliente && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={clienteQuery}
                    onChange={(e) => setClienteQuery(e.target.value)}
                    placeholder="Buscar por nombre, empresa, email o teléfono..."
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-gray-800 dark:text-white focus:bg-white"
                  />
                  {showClienteOptions && (
                    <div className="max-h-60 sm:max-h-72 overflow-y-auto rounded-md border border-gray-200 dark:border-white/[0.08]">
                      {loadingClientes && (
                        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Cargando clientes...</div>
                      )}
                      {!loadingClientes && errorClientes && (
                        <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400">{errorClientes}</div>
                      )}
                      {!loadingClientes && !errorClientes && (
                        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
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
                                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.06] ${isSelected ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-white/[0.08]" : ""
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
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
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
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-base font-semibold text-gray-900 dark:text-white">{selectedCliente.client_name ?? selectedCliente.nombre ?? selectedCliente.name}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedCliente(null);
                        setShowClienteOptions(true);
                        setFacturaData({ ...facturaData, client: "" });
                      }}
                      className="px-3 py-1"
                    >
                      Cambiar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="text-gray-700 dark:text-gray-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Empresa</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedCliente.company_name ?? "—"}</div>
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">RNC</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedCliente.rnc ?? "—"}</div>
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedCliente.email ?? "—"}</div>
                    </div>
                    <div className="text-gray-700 dark:text-gray-200 sm:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Teléfono</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedCliente.phone_number ?? selectedCliente.telefono ?? "—"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Fecha</label>
                <input
                  type="date"
                  value={facturaData.date}
                  onChange={(e) => setFacturaData({ ...facturaData, date: e.target.value })}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">NCF</label>
                <input
                  type="text"
                  value={facturaData.ncf}
                  readOnly
                  placeholder="—"
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Total estimado</label>
              <input
                type="text"
                value={totalAmount ? totalAmount.toFixed(2) : ""}
                readOnly
                placeholder="0.00"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              />
            </div>
            <div className="space-y-3">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Items de la factura</label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                <textarea
                  placeholder="Descripción"
                  value={itemForm.description}
                  onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="md:col-span-6 w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                />
                <div className="md:col-span-3 grid grid-cols-1 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Monto"
                    value={itemForm.amount}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm  focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                  />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Cantidad"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  startIcon={<BoxIcon className="size-5" />}
                  className="md:col-span-3 w-full justify-center"
                  onClick={handleAddItem}
                  type="button"
                >
                  Agregar
                </Button>
              </div>
              <div className="rounded-md border border-gray-200 bg-white/60 p-3 text-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                {items.length === 0 && <div className="text-gray-500 dark:text-gray-400">Aún no hay items agregados.</div>}
                {items.length > 0 && (
                  <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <div className="flex-1 min-w-[180px]">
                          <div className="font-medium text-gray-900 dark:text-white">{item.description}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Cant. {item.quantity} · Monto {item.amount.toFixed(2)}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{(item.amount * item.quantity).toFixed(2)}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="px-3 py-1"
                        >
                          Quitar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setCreationType(null)}
              >
                ← Volver
              </Button>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreationType(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  type="submit"
                >
                  Guardar
                </Button>
              </div>
            </div>
          </form>
        ) : creationType === "cotizacion" ? (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); /* TODO: handle submit */ }}>
            {/* Cotización search and select */}
            {!selectedCotizacion && (
              <div className="mb-4">
                <input
                  type="text"
                  value={cotizacionQuery}
                  onChange={e => setCotizacionQuery(e.target.value)}
                  placeholder="Buscar por código, cliente o descripción..."
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-gray-800 dark:text-white focus:bg-white"
                />
                {cotizacionQuery.trim() && !loadingCotizaciones && !errorCotizaciones && (
                  <ul className="divide-y divide-gray-100 dark:divide-white/[0.06] max-h-60 overflow-y-auto mt-2">
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
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                          onClick={async () => {
                            const nextNCF = await fetchNextNCF();
                            setSelectedCotizacion(c);
                            // Also need to set NCF in facturaData since the useEffect only sets it if it exists in fd.ncf which is empty initially
                            setFacturaData(fd => ({ ...fd, ncf: nextNCF }));
                          }}
                        >
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[80px]">{date}</span>
                            <span className="font-medium text-gray-800 dark:text-white min-w-[90px]">{code}</span>
                            <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{desc}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[90px]">{client}</span>
                            <span className="text-xs text-green-700 dark:text-green-400 font-semibold min-w-[80px] text-right">{monto ? `$${monto}` : ''}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {loadingCotizaciones && <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Cargando cotizaciones...</div>}
                {errorCotizaciones && <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400">{errorCotizaciones}</div>}
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Seleccionado: —</div>
              </div>
            )}
            {/* After selecting a cotización, show the factura form (like client flow) */}
            {selectedCotizacion && (
              <>
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] mb-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-base font-semibold text-gray-900 dark:text-white">{selectedCotizacion.code ?? selectedCotizacion.codigo}</div>
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
                      className="px-3 py-1"
                    >
                      Cambiar
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{selectedCotizacion.description ?? selectedCotizacion.descripcion ?? ''}</div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Fecha</label>
                    <input
                      type="date"
                      value={facturaData.date}
                      onChange={e => setFacturaData(fd => ({ ...fd, date: e.target.value }))}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">NCF</label>
                    <input
                      type="text"
                      value={facturaData.ncf}
                      onChange={e => setFacturaData(fd => ({ ...fd, ncf: e.target.value }))}
                      placeholder="—"
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">RNC</label>
                  <input
                    type="text"
                    value={facturaData.rnc}
                    onChange={e => setFacturaData(fd => ({ ...fd, rnc: e.target.value }))}
                    placeholder="—"
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Total estimado</label>
                  <input
                    type="text"
                    value={totalAmount ? totalAmount.toFixed(2) : ''}
                    readOnly
                    placeholder="0.00"
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div className="space-y-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Items de la factura</label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <textarea
                      placeholder="Descripción"
                      value={itemForm.description}
                      onChange={e => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="md:col-span-6 w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                    />
                    <div className="md:col-span-3 grid grid-cols-1 gap-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Monto"
                        value={itemForm.amount}
                        onChange={e => setItemForm((prev) => ({ ...prev, amount: e.target.value }))}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm  focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                      />
                      <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="Cantidad"
                        value={itemForm.quantity}
                        onChange={e => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      startIcon={<BoxIcon className="size-5" />}
                      className="md:col-span-3 w-full justify-center"
                      onClick={handleAddItem}
                      type="button"
                    >
                      Agregar
                    </Button>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white/60 p-3 text-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                    {items.length === 0 && <div className="text-gray-500 dark:text-gray-400">Aún no hay items agregados.</div>}
                    {items.length > 0 && (
                      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                        {items.map((item) => (
                          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                            <div className="flex-1 min-w-[180px]">
                              <div className="font-medium text-gray-900 dark:text-white">{item.description}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Cant. {item.quantity} · Monto {item.amount.toFixed(2)}</div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{(item.amount * item.quantity).toFixed(2)}</div>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="px-3 py-1"
                            >
                              Quitar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center justify-between pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreationType(null)}
              >
                ← Volver
              </Button>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreationType(null);
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  type="submit"
                >
                  Guardar
                </Button>
              </div>
            </div>
          </form>
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
