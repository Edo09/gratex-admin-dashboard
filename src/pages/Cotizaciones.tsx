import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BasicTableOne from "../components/tables/BasicTableOne";
import { useDebounce } from "../hooks/useDebounce";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import { clientesApi, cotizacionesApi, apiClient } from "../services/api";
import type { Cotizacion } from "../services/api";
import type { Cliente, LineItem } from "../types";
import Alert from '../components/ui/alert/Alert';

type TableRow = { id: number; date: string; code?: string; client?: string; description: string; amount: string; total: string };

export default function Cotizaciones() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [newRow, setNewRow] = useState({
    date: todayStr,
    client: "",
    amount: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [clienteQuery, setClienteQuery] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showClienteOptions, setShowClienteOptions] = useState(false);

  // Fetch clients using TanStack Query
  const debouncedClienteQuery = useDebounce(clienteQuery, 400);

  const {
    data: clientesData,
    isLoading: loadingClientes,
    error: errorClientes,
  } = useQuery({
    queryKey: ['clientes', debouncedClienteQuery],
    queryFn: async () => {
      const response = await clientesApi.getClientes({ query: debouncedClienteQuery });
      let items: Cliente[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          items = response.data;
        } else {
          const paginatedData = response.data as unknown as { data?: unknown };
          if (Array.isArray(paginatedData.data)) {
            items = paginatedData.data as Cliente[];
          }
        }
      }
      return items;
    },
    enabled: isCreateOpen && debouncedClienteQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });
  const [items, setItems] = useState<LineItem[]>([]);
  const [itemForm, setItemForm] = useState({ description: "", amount: "", quantity: "1" });
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount * item.quantity, 0), [items]);

  useEffect(() => {
    setNewRow((prev) => ({ ...prev, amount: totalAmount ? totalAmount.toFixed(2) : "" }));
  }, [totalAmount]);

  // Use clientesData from TanStack Query

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedQuery = useDebounce(query, 400);


  const mapApiToRow = useMemo(
    () =>
      (item: Record<string, unknown>, index: number): TableRow => {
        let description = (item.description as string) ?? (item.descripcion as string) ?? "";
        if (!description && Array.isArray(item.items) && item.items.length > 0) {
          description = (item.items as Record<string, unknown>[])
            .map((it) => (it.description as string) || "(Sin descripción)")
            .join("\n");
        }
        const totalValue = (item.total as string) ?? (item.amount as string) ?? (item.monto as string) ?? "";
        return {
          id: (item.id as number) ?? index + 1,
          date: (item.date as string) ?? (item.fecha as string) ?? "",
          code: (item.code as string) ?? (item.codigo as string) ?? "",
          client: (item.client_name as string) ?? (item.client as string) ?? (item.cliente as string) ?? "",
          description,
          amount: totalValue,
          total: totalValue,
        };
      },
    []
  );

  const {
    data: cotizacionesData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['cotizaciones', debouncedQuery ?? '', page, pageSize],
    queryFn: () =>
      cotizacionesApi.getCotizaciones({
        query: debouncedQuery,
        page,
        pageSize,
      }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });



  // Parse data and total from API response
  let rows: TableRow[] = [];
  let total = 0;
  if (cotizacionesData && cotizacionesData.data) {
    if (Array.isArray(cotizacionesData.data)) {
      rows = cotizacionesData.data.map(mapApiToRow);
      total = rows.length;
    } else if (
      typeof cotizacionesData.data === 'object' &&
      'data' in cotizacionesData.data &&
      Array.isArray((cotizacionesData.data as unknown as Record<string, unknown>).data)
    ) {
      rows = ((cotizacionesData.data as unknown as Record<string, unknown>).data as Record<string, unknown>[]).map(mapApiToRow);
      total = ((cotizacionesData.data as unknown as Record<string, unknown>).total as number) || rows.length;
    }
  }

  const handleRowClick = async (row: TableRow) => {
    try {
      const response = await cotizacionesApi.getCotizacionById(row.id);

      let data = response.data;

      // Handle case where API returns an array directly
      if (Array.isArray(data)) {
        const found = (data as unknown as Record<string, unknown>[]).find((item) => item.id == row.id);
        if (found) {
          data = found as unknown as Cotizacion;
        } else if (data.length > 0) {
          // If we returned a list but ID not found (unlikely if filtered by ID), use first?
          // Or maybe it's just a single item list.
          data = data[0];
        }
      }
      // Handle case where API returns a paginated list wrapper
      else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as unknown as Record<string, unknown>).data)) {
        const list = (data as unknown as Record<string, unknown>).data as Record<string, unknown>[];
        const found = list.find((item) => item.id == row.id);
        if (found) {
          data = found as unknown as Cotizacion;
        } else if (list.length > 0) {
          // Fallback if filtering happened
          data = list[0] as unknown as Cotizacion;
        }
      }

      const currentCotizacion = data as Cotizacion | undefined;

      if (currentCotizacion) {
        setEditingId(currentCotizacion.id);
        setIsEditMode(true);
        setNewRow({
          date: currentCotizacion.date ? currentCotizacion.date.split(' ')[0] : todayStr,
          client: currentCotizacion.client_name,
          amount: currentCotizacion.total,
        });

        // Set items
        if (currentCotizacion.items) {
          setItems((currentCotizacion.items as Record<string, unknown>[]).map((i) => ({
            id: (i.id as number) || Date.now() + Math.random(),
            description: i.description as string,
            amount: parseFloat(i.amount as unknown as string),
            quantity: i.quantity as number
          })));
        } else {
          setItems([]);
        }

        // Fetch full client details
        if (currentCotizacion.client_id) {
          try {
            const clientResponse = await clientesApi.getClienteById(currentCotizacion.client_id);
            let clientData = clientResponse.data;

            // Handle possible array response for client as well
            if (Array.isArray(clientData)) {
              const foundClient = (clientData as unknown as Record<string, unknown>[]).find((c) => c.id == currentCotizacion.client_id);
              if (foundClient) {
                clientData = foundClient as unknown as Cliente;
              } else if (clientData.length > 0) {
                clientData = clientData[0];
              }
            } else if (clientData && typeof clientData === 'object' && 'data' in clientData && Array.isArray((clientData as unknown as Record<string, unknown>).data)) {
              // Check paginated wrapper
              const list = (clientData as unknown as Record<string, unknown>).data as Record<string, unknown>[];
              const foundClient = list.find((c) => c.id == currentCotizacion.client_id);
              if (foundClient) {
                clientData = foundClient as unknown as Cliente;
              } else if (list.length > 0) {
                clientData = list[0] as unknown as Cliente;
              }
            }

            const currentClient = clientData as Cliente | undefined;

            if (currentClient) {
              setSelectedCliente(currentClient);
            } else {
              // Fallback to basic info from quotation if fetch fails or returns empty
              setSelectedCliente({
                id: currentCotizacion.client_id,
                client_name: currentCotizacion.client_name,
              } as Cliente);
            }
          } catch (err) {
            console.error("Error fetching client details:", err);
            // Fallback
            setSelectedCliente({
              id: currentCotizacion.client_id,
              client_name: currentCotizacion.client_name,
            } as Cliente);
          }
        } else {
          setSelectedCliente(null);
        }

        setShowClienteOptions(false);
        setIsCreateOpen(true);
      }
    } catch (e) {
      console.error("Error fetching cotizacion details", e);
    }
  };

  const resetForm = () => {
    setNewRow({ date: todayStr, client: "", amount: "" });
    setItems([]);
    setSelectedCliente(null);
    setClienteQuery("");
    setShowClienteOptions(true);
    setIsEditMode(false);
    setEditingId(null);
  };

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

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  return (
    <div>
      <PageMeta
        title="Gratex Dashboard"
        description="Pagina para gestionar las cotizaciones"
      />
      <PageBreadcrumb pageTitle="Cotizaciones" />
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
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="whitespace-nowrap text-base px-5 py-2.5"
        >
          Crear Cotización
        </Button>
      </div>
      {/* Create Cotización Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        className="max-w-5xl w-full p-0 max-h-[92vh] overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-xl"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 border-b border-blue-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{isEditMode ? "Editar Cotización" : "Nueva Cotización"}</h2>
            <p className="text-blue-100 text-xs mt-0.5">Complete los detalles para generar la cotización</p>
          </div>
          <button
            onClick={() => {
              setIsCreateOpen(false);
              resetForm();
            }}
            className="text-white hover:text-blue-200 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(92vh - 140px)' }}>
          <form
            id="cotizacion-form"
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              // Build the payload that would be sent to api/cotizaciones
              const payload = {
                client_id: selectedCliente?.id ?? null,
                client_name: selectedCliente?.client_name ?? selectedCliente?.nombre ?? selectedCliente?.name ?? null,
                date: newRow.date,
                items: items.map((item) => ({
                  description: item.description,
                  amount: item.amount,
                  quantity: item.quantity,
                  subtotal: item.amount * item.quantity,
                })),
                total: totalAmount,
              };
              try {
                let cotizacionId;
                if (isEditMode && editingId) {
                  // Update - User requested PUT /api/cotizaciones with body
                  const updatePayload = {
                    ...payload,
                    id: editingId,
                  };
                  // We use the root endpoint for update as requested
                  // Use apiClient.put directly for the root endpoint
                  await apiClient.put('/cotizaciones', updatePayload);

                  cotizacionId = editingId;
                  setShowSuccessAlert(true);
                } else {
                  // Create
                  const response = await cotizacionesApi.createCotizacion(payload);
                  cotizacionId = response.data?.id;
                  setShowSuccessAlert(true);
                }

                setTimeout(() => setShowSuccessAlert(false), 3500);
                setIsCreateOpen(false);
                setPage(1);
                resetForm();
                // Invalidate and refetch cotizaciones table
                await queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
                // Open PDF in new tab
                if (cotizacionId) {
                  try {
                    const pdfResponse = await cotizacionesApi.getCotizacionPdf(cotizacionId);
                    const base64Data = pdfResponse?.content || pdfResponse?.data?.content || pdfResponse?.data;
                    if (typeof base64Data === "string" && base64Data.length > 0) {
                      const byteCharacters = atob(base64Data);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: "application/pdf" });
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, "_blank");
                    } else {
                      console.error("❌ PDF response is not valid base64:", base64Data);
                    }
                  } catch (pdfErr) {
                    console.error("❌ Error fetching PDF:", pdfErr);
                  }
                }
              } catch (err) {
                console.error("❌ Error creating cotización:", err);
              }
            }}
          >
            {/* Client Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
              <label className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-100">Información del Cliente</label>
              {!selectedCliente && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={clienteQuery}
                    onChange={(e) => {
                      setClienteQuery(e.target.value);
                      setShowClienteOptions(e.target.value.trim().length > 0);
                    }}
                    placeholder="Buscar cliente por nombre, empresa, email o teléfono..."
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  {showClienteOptions && clienteQuery.trim().length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-md">
                      {loadingClientes && (
                        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Cargando clientes...</div>
                      )}
                      {!loadingClientes && errorClientes && (
                        <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                          {errorClientes instanceof Error ? errorClientes.message : String(errorClientes)}
                        </div>
                      )}
                      {!loadingClientes && !errorClientes && (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                          {(clientesData as Cliente[] ?? [])
                            .map((c) => {
                              const name = c.client_name ?? c.nombre ?? c.name ?? `Cliente ${c.id}`;
                              return (
                                <li
                                  key={c.id}
                                  className="cursor-pointer px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                                  onClick={() => {
                                    setSelectedCliente(c);
                                    setNewRow({ ...newRow, client: name });
                                    setShowClienteOptions(false);
                                  }}
                                >
                                  <div className="font-medium text-sm text-gray-900 dark:text-white">{name}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {c.company_name ?? ""} {c.email ? `• ${c.email}` : ""} {c.phone_number ? `• ${c.phone_number}` : ""}
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="text-sm text-gray-700 dark:text-gray-300">Seleccionado: <span className="font-medium">{newRow.client || "Ninguno"}</span></div>
                </div>
              )}
              {selectedCliente && (
                <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-4 dark:border-green-700">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="text-base font-medium text-gray-900 dark:text-white">{selectedCliente.client_name ?? selectedCliente.nombre ?? selectedCliente.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedCliente.company_name ?? "Sin empresa"}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setSelectedCliente(null);
                        setShowClienteOptions(true);
                        setNewRow({ ...newRow, client: "" });
                      }}
                      className="px-3 py-1 text-sm"
                    >
                      Cambiar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Email</div>
                      <div className="text-sm text-gray-900 dark:text-white">{selectedCliente.email ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Teléfono</div>
                      <div className="text-sm text-gray-900 dark:text-white">{selectedCliente.phone_number ?? selectedCliente.telefono ?? "—"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Date and Total Section */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                <label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                <input
                  type="date"
                  value={newRow.date}
                  onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-md p-4 border border-green-300 dark:border-green-700">
                <label className="mb-2 text-sm font-medium text-green-800 dark:text-green-300">Total Estimado</label>
                <div className="text-xl font-medium text-green-700 dark:text-green-400">
                  ${totalAmount ? totalAmount.toFixed(2) : "0.00"}
                </div>
              </div>
            </div>
            {/* Items Section */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
              <label className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">Items de la Cotización</label>

              {/* Add Item Form */}
              <div className="bg-white dark:bg-gray-700 rounded-md p-3 mb-3 border border-gray-300 dark:border-gray-600">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                      placeholder="Descripción del item..."
                      value={itemForm.description}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Monto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={itemForm.amount}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="1"
                      value={itemForm.quantity}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
                    />
                  </div>
                  <div className="md:col-span-3 flex items-end">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full py-2 text-sm font-medium"
                      onClick={handleAddItem}
                      type="button"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
              {/* Items List */}
              <div className="rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 overflow-hidden">
                {items.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-base font-medium text-gray-500 dark:text-gray-400">No hay items agregados</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Use el formulario de arriba para agregar items</p>
                  </div>
                ) : (
                  <table className="w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Descripción</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Cantidad x Monto</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Subtotal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white truncate">{item.description}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {item.quantity} x ${item.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                            ${(item.amount * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="px-3 py-1 text-sm text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/30"
                            >
                              Quitar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => {
              setIsCreateOpen(false);
              resetForm();
            }}
            className="px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="button"
            className="px-4 py-2 text-sm font-medium bg-gray-600 hover:bg-gray-700"
            onClick={async () => {
              try {
                // If in Edit Mode, allow viewing the original saved PDF (Old Logic)
                if (isEditMode && editingId) {
                  const pdfResponse = await cotizacionesApi.getCotizacionPdf(editingId);
                  const base64Data = pdfResponse?.content || pdfResponse?.data?.content || pdfResponse?.data;
                  if (typeof base64Data === "string" && base64Data.length > 0) {
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: "application/pdf" });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, "_blank");
                    return;
                  }
                }

                // Build the payload as in the submit handler
                const payload = {
                  client_id: selectedCliente?.id ?? null,
                  client_name: selectedCliente?.client_name ?? selectedCliente?.nombre ?? selectedCliente?.name ?? null,
                  date: newRow.date,
                  items: items.map((item) => ({
                    description: item.description,
                    amount: item.amount,
                    quantity: item.quantity,
                    subtotal: item.amount * item.quantity,
                  })),
                  total: totalAmount,
                };

                // Use a preview endpoint if available, otherwise use the create endpoint but do not persist
                const result = await (cotizacionesApi.previewCotizacion
                  ? cotizacionesApi.previewCotizacion(payload)
                  : cotizacionesApi.createCotizacion({ ...payload, preview: true }));
                // Expect the preview response to be a base64 PDF string (or inside .data)
                const base64Data: string = (result.data && typeof result.data === 'object')
                  ? ('pdf' in result.data
                    ? String(result.data.pdf)
                    : ('content' in result.data ? String(result.data.content) : ''))
                  : (typeof result.data === 'string' ? result.data : '');
                if (base64Data && base64Data.length > 0) {
                  const byteCharacters = atob(base64Data);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: "application/pdf" });
                  const blobUrl = URL.createObjectURL(blob);
                  window.open(blobUrl, "_blank");
                } else {
                  console.error("❌ Preview response did not contain a valid PDF base64 string.", result);
                }
              } catch (err) {
                console.error("❌ Error previewing cotización:", err);
              }
            }}
          >
            Ver Preview
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="submit"
            form="cotizacion-form"
            className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700"
          >
            Guardar Cotización
          </Button>
        </div>
        {showSuccessAlert && (
          <Alert
            variant="success"
            title={isEditMode ? "Cotización actualizada" : "Cotización creada"}
            message={isEditMode ? "La cotización ha sido actualizada correctamente." : "La cotización ha sido creada correctamente."}
          />
        )}
      </Modal>
      <BasicTableOne
        dataType="cotizaciones"
        query={debouncedQuery}
        rows={rows}
        loading={loading}
        error={error instanceof Error ? error.message : error as unknown as string}
        pagination="server"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(newPage) => {
          setPage(newPage);
        }}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        onRowClick={handleRowClick}
      />

    </div>
  );
}
