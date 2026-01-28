import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BasicTableOne from "../components/tables/BasicTables/BasicTableOne";
import { useDebounce } from "../hooks/useDebounce";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import { BoxIcon } from "../icons";
import { clientesApi, cotizacionesApi } from "../services/api";
import Alert from '../components/ui/alert/Alert';

type TableRow = { id: number; date: string; code: string; client: string; description: string; amount: string; total: string };

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
  };
  const [clienteQuery, setClienteQuery] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showClienteOptions, setShowClienteOptions] = useState(false);

  // Fetch clients using TanStack Query
  const {
    data: clientesData,
    isLoading: loadingClientes,
    error: errorClientes,
  } = useQuery({
    queryKey: ['clientes', isCreateOpen],
    queryFn: async () => {
      if (!isCreateOpen) return [];
      const response = await clientesApi.getClientes();
      let items: Cliente[] = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          items = response.data.items;
        }
      }
      return items;
    },
    enabled: isCreateOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  // const [clienteQuery, setClienteQuery] = useState("");
  // const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  // const [showClienteOptions, setShowClienteOptions] = useState(true);
  type LineItem = { id: number; description: string; amount: number; quantity: number };
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

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const mapApiToRow = useMemo(
    () =>
      (item: Record<string, unknown>, index: number): TableRow => {
        let description = (item.description as string) ?? (item.descripcion as string) ?? "";
        if (!description && Array.isArray(item.items) && item.items.length > 0) {
          description = item.items
            .map((it: any) => it.description || "(Sin descripción)")
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
      Array.isArray((cotizacionesData.data as any).data)
    ) {
      rows = (cotizacionesData.data as any).data.map(mapApiToRow);
      total = (cotizacionesData.data as any).total || rows.length;
    }
  }

  const handleAddItem = () => {
    const description = itemForm.description.trim();
    const amount = parseFloat(itemForm.amount);
    const quantity = parseFloat(itemForm.quantity);

    if (!description || isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) return;

    setItems((prev) => [...prev, { id: Date.now(), description, amount, quantity }]);
    setItemForm({ description: "", amount: "", quantity: "1" });

  console.log(1,items);
  console.log(2,itemForm);
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
          onClick={() => setIsCreateOpen(true)}
          className="whitespace-nowrap text-base px-5 py-2.5"
        >
          Crear Cotización
        </Button>
      </div>
      {/* Create Cotización Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        className="max-w-5xl w-full p-0 max-h-[92vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 border-b-2 border-blue-800">
          <h2 className="text-xl font-bold text-white">Nueva Cotización</h2>
          <p className="text-blue-100 text-sm mt-0.5">Complete los detalles para generar la cotización</p>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(92vh - 200px)' }}>
        <form
          className="p-8 space-y-6"
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
              const response = await cotizacionesApi.createCotizacion(payload);
              const cotizacionId = response.data?.id;
              setShowSuccessAlert(true);
              setTimeout(() => setShowSuccessAlert(false), 3500);
              setNewRow({ date: todayStr, client: "", amount: "" });
              setItems([]);
              setSelectedCliente(null);
              setClienteQuery("");
              setShowClienteOptions(true);
              setIsCreateOpen(false);
              setPage(1);
              // Invalidate and refetch cotizaciones table
              await queryClient.invalidateQueries({ queryKey: ['cotizaciones'] });
              // Open PDF in new tab
              if (cotizacionId) {
                try {
                  const pdfResponse = await cotizacionesApi.getCotizacionPdf(cotizacionId);
                  let base64Data = pdfResponse?.content || pdfResponse?.data?.content || pdfResponse?.data;
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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <label className="mb-3 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400">👤</span>
              Información del Cliente
            </label>
            {!selectedCliente && (
              <div className="space-y-3">
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
                {showClienteOptions && clienteQuery.trim().length > 0 && (
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
                        {(clientesData as Cliente[] ?? [])
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
                            return (
                              <li
                                key={c.id}
                                className="cursor-pointer px-5 py-4 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => {
                                  setSelectedCliente(c);
                                  setNewRow({ ...newRow, client: name });
                                  setShowClienteOptions(false);
                                }}
                              >
                                <div className="font-bold text-base text-gray-900 dark:text-white mb-1">{name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {c.company_name ?? ""} {c.email ? `• ${c.email}` : ""} {c.phone_number ? `• ${c.phone_number}` : ""}
                                </div>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </div>
                )}
                <div className="text-base font-medium text-gray-700 dark:text-gray-300 mt-2">✓ Seleccionado: <span className="font-bold">{newRow.client || "Ninguno"}</span></div>
              </div>
            )}
            {selectedCliente && (
              <div className="rounded-xl border-2 border-green-300 bg-green-50/80 dark:bg-green-900/20 p-6 shadow-lg dark:border-green-700">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{selectedCliente.client_name ?? selectedCliente.nombre ?? selectedCliente.name}</div>
                    <div className="text-base text-gray-600 dark:text-gray-400 mt-1">{selectedCliente.company_name ?? "Sin empresa"}</div>
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
                    className="px-4 py-2 text-base"
                  >
                    Cambiar
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">📧 Email</div>
                    <div className="text-base font-medium text-gray-900 dark:text-white">{selectedCliente.email ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">📱 Teléfono</div>
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
                value={newRow.date}
                onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
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
              Items de la Cotización
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
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-gray-900 dark:text-white truncate">{item.description}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.quantity} unidad{item.quantity > 1 ? 'es' : ''} × ${item.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0">
                        ${(item.amount * item.quantity).toFixed(2)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="px-4 py-2 text-base text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/30 flex-shrink-0"
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
        </div>
        
        {/* Footer Actions */}
        <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-8 py-6 flex items-center justify-end gap-4">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-6 py-3 text-base font-semibold"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="button"
              className="px-6 py-3 text-base font-semibold bg-gray-600 hover:bg-gray-700"
              onClick={async () => {
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
                try {
                  // Use a preview endpoint if available, otherwise use the create endpoint but do not persist
                  const result = await (cotizacionesApi.previewCotizacion
                    ? cotizacionesApi.previewCotizacion(payload)
                    : cotizacionesApi.createCotizacion({ ...payload, preview: true }));
                  // Expect the preview response to be a base64 PDF string (or inside .data)
                  const base64Data = (result.data && typeof result.data === 'object')
                    ? ('pdf' in result.data
                        ? result.data.pdf
                        : ('content' in result.data ? result.data.content : ''))
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
              👁️ Ver Preview
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              className="px-6 py-3 text-base font-semibold bg-green-600 hover:bg-green-700"
            >
              💾 Guardar Cotización
            </Button>
          </div>
        {showSuccessAlert && (
          <Alert
            variant="success"
            title="Cotización creada"
            message="La cotización ha sido creada correctamente."
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
      />

    </div>
  );
}
