import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BasicTableOne from "../components/tables/BasicTables/BasicTableOne";
import { useDebounce } from "../hooks/useDebounce";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import { BoxIcon } from "../icons";
import { clientesApi, cotizacionesApi } from "../services/api";
import Alert from '../components/ui/alert/Alert';

type TableRow = { id: number; date: string; code: string; client: string; description: string; amount: string };

export default function Cotizaciones() {
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState<string | undefined>(undefined);
  const [clienteQuery, setClienteQuery] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showClienteOptions, setShowClienteOptions] = useState(true);
  type LineItem = { id: number; description: string; amount: number; quantity: number };
  const [items, setItems] = useState<LineItem[]>([]);
  const [itemForm, setItemForm] = useState({ description: "", amount: "", quantity: "1" });
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount * item.quantity, 0), [items]);

  useEffect(() => {
    setNewRow((prev) => ({ ...prev, amount: totalAmount ? totalAmount.toFixed(2) : "" }));
  }, [totalAmount]);

  // Load clients when opening the create modal
  useEffect(() => {
    let ignore = false;
    const fetchClientes = async () => {
      try {
        setLoadingClientes(true);
        setErrorClientes(undefined);
        console.log("🔄 Fetching clientes...");
        const response = await clientesApi.getClientes();
        console.log("📥 API Response:", response);
        
        let items: Cliente[] = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            items = response.data.items;
          }
        }
        console.log("✅ Parsed items:", items);

        if (!ignore) {
          setClientes(items as Cliente[]);
          console.log("✅ State updated with", items.length, "clientes");
        }
      } catch (e: unknown) {
        console.error("❌ Error fetching clientes:", e);
        const msg = e instanceof Error ? e.message : "Error al cargar clientes";
        if (!ignore) setErrorClientes(msg);
      } finally {
        if (!ignore) setLoadingClientes(false);
      }
    };
    
    if (isCreateOpen) {
      fetchClientes();
    }
    
    return () => {
      ignore = true;
    };
  }, [isCreateOpen]);

  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  console.log("🎯 Current page state:", page, "rows count:", rows.length, "total:", total);

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    // Reset to first page when query changes
    setPage(1);
  }, [debouncedQuery]);

  const mapApiToRow = useMemo(
    () =>
      (item: Record<string, unknown>, index: number): TableRow => {
        // Use top-level description if present, otherwise join item descriptions
        let description = (item.description as string) ?? (item.descripcion as string) ?? "";
        if (!description && Array.isArray(item.items) && item.items.length > 0) {
          description = item.items
            .map((it: any) => it.description || "(Sin descripción)")
            .join("\n");
        }
        return {
          id: (item.id as number) ?? index + 1,
          date: (item.date as string) ?? (item.fecha as string) ?? "",
          code: (item.code as string) ?? (item.codigo as string) ?? "",
          client: (item.client_name as string) ?? (item.client as string) ?? (item.cliente as string) ?? "",
          description,
          amount: (item.total as string) ?? (item.amount as string) ?? (item.monto as string) ?? "",
        };
      },
    []
  );

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(undefined);
        console.log("📥 Fetching cotizaciones with params:", { page, pageSize, query: debouncedQuery });
        const response = await cotizacionesApi.getCotizaciones({
          query: debouncedQuery,
          page,
          pageSize,
        });
        
        console.log("📦 API Response:", response);
        
        // Backend returns: { status: true, data: { total, page, pageSize, data: [...] } }
        // Or: { status: true, data: [...] } (array directly)
        let items: Array<Record<string, unknown>> = [];
        let totalCount = 0;
        
        if (response.data && typeof response.data === 'object') {
          console.log("response.data exists:", response.data);
          console.log("response.data type:", typeof response.data);
          console.log("Is array?:", Array.isArray(response.data));
          
          // If response.data is directly an array
          if (Array.isArray(response.data)) {
            items = response.data as Array<Record<string, unknown>>;
            totalCount = items.length;
            console.log("✅ response.data is direct array:", { items: items.length });
          } else {
            // If response.data has the paginated structure
            const respData = response.data as unknown as Record<string, unknown>;
            if ('data' in respData && Array.isArray(respData.data)) {
              items = respData.data as Array<Record<string, unknown>>;
              totalCount = (respData.total as number) || items.length;
              console.log("✅ Found paginated data:", { items: items.length, total: totalCount });
            }
          }
        }
        
        console.log("📋 Items before mapping:", items);
        const data: TableRow[] = items.map(mapApiToRow);
        console.log("🔄 Mapped rows:", data);
        if (!ignore) {
          console.log("💾 Setting rows with data:", data);
          setRows(data);
          console.log("💾 Setting total:", totalCount);
          setTotal(totalCount);
        }
      } catch (err: unknown) {
        console.error("❌ Error:", err);
        const error_msg = err instanceof Error ? err.message : "Error al cargar datos";
        if (!ignore) setError(error_msg);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchData();
    return () => {
      ignore = true;
    };
  }, [debouncedQuery, page, pageSize, mapApiToRow]);

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
          className="w-full max-w-md rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white bg-white"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="whitespace-nowrap"
        >
          Crear Cotización
        </Button>
      </div>
      {/* Create Cotización Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        className="max-w-3xl w-full p-4 sm:p-6 max-h-[85vh] overflow-y-auto "
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Nueva Cotización</h2>
        <form
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
              console.log("📤 Sending to api/cotizaciones:", payload);
              const response = await cotizacionesApi.createCotizacion(payload);
              console.log("✅ Response:", response);
              
              const cotizacionId = response.data?.id;
              // Show success alert
              setShowSuccessAlert(true);
              setTimeout(() => setShowSuccessAlert(false), 3500);
              // Reset form state
              setNewRow({ date: todayStr, client: "", amount: "" });
              setItems([]);
              setSelectedCliente(null);
              setClienteQuery("");
              setShowClienteOptions(true);
              // Close modal and refresh list
              setIsCreateOpen(false);
              setPage(1); // This will trigger a refetch
              // Open PDF in new tab
              if (cotizacionId) {
                try {
                  const pdfResponse = await cotizacionesApi.getCotizacionPdf(cotizacionId);
                  // Try to get base64 from content or data.content
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
                            const isSelected = newRow.client === name;
                            return (
                              <li
                                key={c.id}
                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.06] ${
                                  isSelected ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-white/[0.08]" : ""
                                }`}
                                onClick={() => {
                                  setSelectedCliente(c);
                                  setNewRow({ ...newRow, client: name });
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
                <div className="text-xs text-gray-600 dark:text-gray-400">Seleccionado: {newRow.client || "—"}</div>
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
                      setNewRow({ ...newRow, client: "" });
                    }}
                    className="px-3 py-1"
                  >
                    Cambiar
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="text-gray-700 dark:text-gray-200">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Empresa</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedCliente.company_name ?? "—"}</div>
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
                value={newRow.date}
                onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white"
              />
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
          </div>
          <div className="space-y-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Items de la cotización</label>
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
                className="md:col-span-3 w-28 h-10 self-center"
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
                        <div className="text-xs text-gray-500 dark:text-gray-400">Cant.: {item.quantity} · Monto: {item.amount.toFixed(2)}</div>
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
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setIsCreateOpen(false)}
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
        </form>
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
            error={error}
            pagination="server"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(newPage) => {
              console.log("📄 Page changed to:", newPage);
              setPage(newPage);
            }}
            onPageSizeChange={(s) => {
              console.log("📏 Page size changed to:", s);
              setPageSize(s);
              setPage(1);
            }}
          />

    </div>
  );
}
