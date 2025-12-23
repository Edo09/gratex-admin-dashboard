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

export default function Facturas() {
  const queryClient = useQueryClient();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationType, setCreationType] = useState<"client" | "cotizacion" | null>(null);
  // Local state for create loading and error
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
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
  
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [facturaData, setFacturaData] = useState({ date: getTodayDate(), client: "", ncf: "", rnc: "" });
  
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount * item.quantity, 0), [items]);
  
  const generateNCF = () => {
    // Generate random 9-digit NCF (in real app, would come from API)
    return Math.floor(Math.random() * 900000000 + 100000000).toString();
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

  // Load clients when modal opens with client type
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
    fetchClientes();
    return () => {
      ignore = true;
    };
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
                                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.06] ${
                                    isSelected ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-white/[0.08]" : ""
                                  }`}
                                  onClick={() => {
                                    setSelectedCliente(c);
                                    setFacturaData({ 
                                      ...facturaData, 
                                      client: name,
                                      rnc: c.rnc || "",
                                      ncf: generateNCF()
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
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-white/[0.04]">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Formulario para crear factura desde cotización (por implementar)
              </p>
            </div>
            
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
          </div>
        )}
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
