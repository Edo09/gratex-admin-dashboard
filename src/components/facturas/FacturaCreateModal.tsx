import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import ClienteSelector from "../shared/ClienteSelector";
import LineItemsEditor from "../shared/LineItemsEditor";
import { useLineItems } from "../../hooks/useLineItems";
import { useNcf } from "../../hooks/useNcf";
import { useDebounce } from "../../hooks/useDebounce";
import { facturasApi, clientesApi, cotizacionesApi } from "../../services/api";
import type { Cliente, CotizacionRecord, FacturaFormData } from "../../types";
import { getTodayDate, getClientDisplayName } from "../../types";
import { formatCurrency } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";

interface FacturaCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Complete factura creation modal.
 * Handles both "from client" and "from cotización" flows.
 * Single Responsibility: factura creation workflow.
 */
export default function FacturaCreateModal({ isOpen, onClose, onSuccess }: FacturaCreateModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { fetchNextNCF } = useNcf();
  const { items, setItems, itemForm, setItemForm, totalAmount, addItem, removeItem, reset: resetItems } = useLineItems();

  const [creationType, setCreationType] = useState<"client" | "cotizacion" | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [facturaData, setFacturaData] = useState<FacturaFormData>({
    date: getTodayDate(),
    client: "",
    ncf: "",
    rnc: "",
  });
  const [saving, setSaving] = useState(false);

  // Client list state
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errorClientes, setErrorClientes] = useState<string | undefined>();

  // Cotización list state
  const [cotizaciones, setCotizaciones] = useState<CotizacionRecord[]>([]);
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false);
  const [errorCotizaciones, setErrorCotizaciones] = useState<string | undefined>();
  const [cotizacionQuery, setCotizacionQuery] = useState("");
  const debouncedCotizacionQuery = useDebounce(cotizacionQuery, 400);
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionRecord | null>(null);

  // Fetch clients when client flow is selected
  useEffect(() => {
    if (!isOpen || creationType !== "client") return;
    let ignore = false;
    (async () => {
      try {
        setLoadingClientes(true);
        setErrorClientes(undefined);
        const response = await clientesApi.getClientes();
        const raw = response.data;
        const data = raw
          ? Array.isArray(raw)
            ? raw
            : Array.isArray((raw as unknown as Record<string, unknown>).items)
              ? ((raw as unknown as Record<string, unknown>).items as Cliente[])
              : []
          : [];
        if (!ignore) setClientes(data as Cliente[]);
      } catch (e: unknown) {
        if (!ignore) setErrorClientes(e instanceof Error ? e.message : "Error al cargar clientes");
      } finally {
        if (!ignore) setLoadingClientes(false);
      }
    })();
    return () => { ignore = true; };
  }, [isOpen, creationType]);

  // Fetch cotizaciones from API using debounced search query
  useEffect(() => {
    if (!isOpen || creationType !== "cotizacion") return;
    if (!debouncedCotizacionQuery.trim()) {
      setCotizaciones([]);
      return;
    }
    let ignore = false;
    (async () => {
      try {
        setLoadingCotizaciones(true);
        setErrorCotizaciones(undefined);
        const response = await cotizacionesApi.getCotizaciones({ query: debouncedCotizacionQuery });
        const raw = response.data;
        const data = raw
          ? Array.isArray(raw)
            ? raw
            : Array.isArray((raw as unknown as Record<string, unknown>).items)
              ? ((raw as unknown as Record<string, unknown>).items as CotizacionRecord[])
              : Array.isArray((raw as unknown as Record<string, unknown>).data)
                ? ((raw as unknown as Record<string, unknown>).data as CotizacionRecord[])
                : []
          : [];
        if (!ignore) setCotizaciones(data as CotizacionRecord[]);
      } catch (e: unknown) {
        if (!ignore) setErrorCotizaciones(e instanceof Error ? e.message : "Error al cargar cotizaciones");
      } finally {
        if (!ignore) setLoadingCotizaciones(false);
      }
    })();
    return () => { ignore = true; };
  }, [isOpen, creationType, debouncedCotizacionQuery]);

  // Populate form when a cotización is selected
  useEffect(() => {
    if (!selectedCotizacion) return;
    const cotItems = Array.isArray(selectedCotizacion.items) ? selectedCotizacion.items : [];
    if (cotItems.length > 0) {
      const mappedItems = cotItems.map((item) => ({
        id: Date.now() + Math.random(),
        description: item.description,
        amount: Number(item.amount),
        quantity: Number(item.quantity),
      }));
      setItems(mappedItems);
    } else if (selectedCotizacion.description ?? selectedCotizacion.descripcion) {
      // Fallback: reconstruct a single item from the concatenated description + total
      const desc = selectedCotizacion.description ?? selectedCotizacion.descripcion ?? "";
      const totalVal = parseFloat(String(selectedCotizacion.total ?? selectedCotizacion.amount ?? selectedCotizacion.monto ?? 0)) || 0;
      setItems([{
        id: Date.now(),
        description: desc,
        amount: totalVal,
        quantity: 1,
      }]);
    } else {
      setItems([]);
    }
    setItemForm({ description: "", amount: "", quantity: "1" });
    setSelectedCliente({
      id: selectedCotizacion.client_id ?? 0,
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
    let formattedDate = getTodayDate();
    if (selectedCotizacion.date) {
      const dateStr = selectedCotizacion.date.split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) formattedDate = dateStr;
    }
    setFacturaData((fd) => ({
      ...fd,
      client: selectedCotizacion.client_name ?? selectedCotizacion.cliente ?? "",
      date: formattedDate,
      rnc: selectedCotizacion.rnc ?? "",
    }));
  }, [selectedCotizacion, setItems, setItemForm]);

  const handleClose = useCallback(() => {
    setCreationType(null);
    setSelectedCliente(null);
    setSelectedCotizacion(null);
    setFacturaData({ date: getTodayDate(), client: "", ncf: "", rnc: "" });
    resetItems();
    setCotizacionQuery("");
    onClose();
  }, [onClose, resetItems]);

  const handleSave = useCallback(async () => {
    if (!selectedCliente || !facturaData.date || items.length === 0) return;
    try {
      setSaving(true);
      await facturasApi.createFactura({
        date: facturaData.date,
        client: facturaData.client,
        client_id: selectedCliente.id,
        user_id: user?.id,
        items: items.map(({ description, amount, quantity }) => ({ description, amount, quantity })),
        ncf: facturaData.ncf || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["facturas"] });
      handleClose();
      onSuccess();
    } catch {
      console.error("Error al guardar la factura");
    } finally {
      setSaving(false);
    }
  }, [selectedCliente, facturaData, items, user, queryClient, handleClose, onSuccess]);

  const handlePreview = useCallback(async () => {
    if (!selectedCliente || items.length === 0 || !facturaData.ncf) return;
    try {
      const payload = {
        client_id: selectedCliente.id,
        items: items.map(({ description, amount, quantity }) => ({ description, amount, quantity })),
        ncf: facturaData.ncf,
        date: facturaData.date || undefined,
      };

      const result = await facturasApi.previewFactura(payload);
      const base64Data = result.data?.content ?? '';

      if (base64Data.length > 0) {
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
        console.error("Preview response did not contain a valid PDF base64 string.", result);
      }
    } catch (err) {
      console.error("Error previewing factura:", err);
    }
  }, [selectedCliente, facturaData, items]);

  const handleClientSelect = useCallback(
    async (cliente: Cliente) => {
      const nextNCF = await fetchNextNCF();
      setSelectedCliente(cliente);
      setFacturaData((fd) => ({
        ...fd,
        client: getClientDisplayName(cliente),
        rnc: cliente.rnc ?? "",
        ncf: nextNCF,
      }));
    },
    [fetchNextNCF],
  );

  const handleClientClear = useCallback(() => {
    setSelectedCliente(null);
    setFacturaData((fd) => ({ ...fd, client: "", rnc: "" }));
  }, []);

  const handleCotizacionSelect = useCallback(
    async (cot: CotizacionRecord) => {
      try {
        // Fetch full cotización data with items
        const response = await cotizacionesApi.getCotizacionById(cot.id);
        let fullCotizacion: CotizacionRecord | null = null;

        const raw = response.data;
        if (Array.isArray(raw)) {
          // /cotizaciones?id=X returns an array — find the matching record
          const found = (raw as unknown as Record<string, unknown>[]).find(
            (item) => (item as unknown as { id?: number }).id == cot.id
          );
          fullCotizacion = (found ?? raw[0] ?? null) as unknown as CotizacionRecord;
        } else if (raw && typeof raw === 'object') {
          fullCotizacion = raw as unknown as CotizacionRecord;
        }

        const nextNCF = await fetchNextNCF();
        setSelectedCotizacion(fullCotizacion ?? cot);
        setFacturaData((fd) => ({ ...fd, ncf: nextNCF }));
      } catch (err) {
        console.error("Error fetching cotización details:", err);
        // Fallback: use the search result if API call fails
        const nextNCF = await fetchNextNCF();
        setSelectedCotizacion(cot);
        setFacturaData((fd) => ({ ...fd, ncf: nextNCF }));
      }
    },
    [fetchNextNCF],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-5xl w-full p-0 max-h-[92vh] overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 border-b border-blue-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Nueva Factura</h2>
          <p className="text-blue-100 text-xs mt-0.5">Complete los detalles para generar la factura</p>
        </div>

      </div>

      <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(92vh - 140px)' }}>
        {/* Step 1: Choose creation type */}
        {!creationType && <CreationTypeSelector onSelect={setCreationType} onCancel={handleClose} />}

        {/* Step 2a: Client flow */}
        {creationType === "client" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <ClienteSelector
              clientes={clientes}
              loading={loadingClientes}
              error={errorClientes}
              selectedCliente={selectedCliente}
              onSelect={handleClientSelect}
              onClear={handleClientClear}
            />
            <DateTotalSection
              date={facturaData.date}
              onDateChange={(date) => setFacturaData((fd) => ({ ...fd, date }))}
              totalAmount={totalAmount}
            />
            <LineItemsEditor
              items={items}
              itemForm={itemForm}
              onItemFormChange={setItemForm}
              onAddItem={addItem}
              onRemoveItem={removeItem}
            />
            <FormFooter
              onBack={() => setCreationType(null)}
              onCancel={handleClose}
              onSave={() => { }}
              onPreview={handlePreview}
              saving={saving}
              isSubmit
            />
          </form>
        )}

        {/* Step 2b: Cotización flow */}
        {creationType === "cotizacion" && (
          <div className="space-y-4">
            {!selectedCotizacion && (
              <CotizacionSearch
                cotizaciones={cotizaciones}
                loading={loadingCotizaciones}
                error={errorCotizaciones}
                query={cotizacionQuery}
                onQueryChange={setCotizacionQuery}
                onSelect={handleCotizacionSelect}
              />
            )}
            {selectedCotizacion && (
              <>
                <SelectedCotizacionBanner
                  cotizacion={selectedCotizacion}
                  onClear={() => {
                    setSelectedCotizacion(null);
                    setSelectedCliente(null);
                    resetItems();
                    setFacturaData((fd) => ({ ...fd, client: "" }));
                  }}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                    <label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span className="text-blue-600 dark:text-blue-400">📅</span> Fecha
                    </label>
                    <input
                      type="date"
                      value={facturaData.date}
                      onChange={(e) => setFacturaData((fd) => ({ ...fd, date: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                    <label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <span className="text-blue-600 dark:text-blue-400">🆔</span> NCF
                    </label>
                    <input
                      type="text"
                      value={facturaData.ncf}
                      onChange={(e) => setFacturaData((fd) => ({ ...fd, ncf: e.target.value }))}
                      placeholder="—"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <TotalDisplay totalAmount={totalAmount} />
                </div>
                <LineItemsEditor
                  items={items}
                  itemForm={itemForm}
                  onItemFormChange={setItemForm}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                />
              </>
            )}
            <FormFooter
              onBack={() => setCreationType(null)}
              onCancel={handleClose}
              onSave={handleSave}
              onPreview={handlePreview}
              saving={saving}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

// --- Sub-components (Single Responsibility) ---

function CreationTypeSelector({
  onSelect,
  onCancel,
}: {
  onSelect: (type: "client" | "cotizacion") => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Selecciona cómo deseas crear la factura:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect("client")}
          className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-gray-600 dark:hover:bg-white/[0.04] dark:hover:border-blue-500 bg-white dark:bg-gray-800"
        >
          <span className="text-base font-medium text-gray-900 dark:text-white">Desde Cliente</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Crear factura seleccionando un cliente</span>
        </button>
        <button
          onClick={() => onSelect("cotizacion")}
          className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-gray-600 dark:hover:bg-white/[0.04] dark:hover:border-blue-500 bg-white dark:bg-gray-800"
        >
          <span className="text-base font-medium text-gray-900 dark:text-white">Desde Cotización</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Convertir una cotización en factura</span>
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={onCancel} className="px-4 py-2 text-sm font-medium">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function DateTotalSection({
  date,
  onDateChange,
  totalAmount,
}: {
  date: string;
  onDateChange: (date: string) => void;
  totalAmount: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
        <label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <span className="text-red-500">📅</span> Fecha
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
        />
      </div>
      <TotalDisplay totalAmount={totalAmount} />
    </div>
  );
}

function TotalDisplay({ totalAmount }: { totalAmount: number }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-md p-4 border border-green-300 dark:border-green-700 flex flex-col justify-between">
      <label className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-1">
        <span className="text-yellow-500">💰</span> Total Estimado
      </label>
      <div className="text-xl font-medium text-green-700 dark:text-green-400 mt-2">
        {formatCurrency(totalAmount)}
      </div>
    </div>
  );
}

function CotizacionSearch({
  cotizaciones,
  loading,
  error,
  query,
  onQueryChange,
  onSelect,
}: {
  cotizaciones: CotizacionRecord[];
  loading: boolean;
  error?: string;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (cot: CotizacionRecord) => void;
}) {
  return (
    <div className="mb-3">
      <label className="mb-2 text-base font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">🔍</span> Buscar Cotización
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar por código, cliente o descripción..."
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
      />
      {query.trim() && !loading && !error && cotizaciones.length > 0 && (
        <div className="max-h-72 overflow-y-auto mt-2 rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-md divide-y divide-gray-200 dark:divide-gray-600">
          {cotizaciones.map((c) => {
            const code = c.code ?? c.codigo ?? `Cotización ${c.id}`;
            const client = c.client_name ?? c.cliente ?? "";
            const monto = c.total ?? c.amount ?? c.monto ?? "";
            const desc = c.description ?? c.descripcion ?? "";
            let date = c.date ?? c.fecha ?? "";
            if (typeof date === "string" && date.length > 10) date = date.slice(0, 10);
            return (
              <div
                key={c.id}
                className="px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                onClick={() => onSelect(c)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{code}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
                  </div>
                  {monto && (
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      ${monto}
                    </span>
                  )}
                </div>
                {client && (
                  <div className="text-sm text-gray-700 dark:text-gray-300">{client}</div>
                )}
                {desc && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{desc}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {query.trim() && !loading && !error && cotizaciones.length === 0 && (
        <div className="px-3 py-3 mt-2 text-sm text-gray-500 dark:text-gray-400 text-center rounded-md border border-gray-200 dark:border-gray-600">
          No se encontraron cotizaciones
        </div>
      )}
      {loading && (
        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Cargando cotizaciones...</div>
      )}
      {error && <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>}
    </div>
  );
}

function SelectedCotizacionBanner({
  cotizacion,
  onClear,
}: {
  cotizacion: CotizacionRecord;
  onClear: () => void;
}) {
  return (
    <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-4 dark:border-green-700">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-base font-medium text-gray-900 dark:text-white">
          {cotizacion.code ?? cotizacion.codigo}
        </div>
        <Button size="sm" variant="outline" type="button" onClick={onClear} className="px-3 py-1 text-sm">
          Cambiar
        </Button>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {cotizacion.description ?? cotizacion.descripcion ?? ""}
      </div>
    </div>
  );
}

function FormFooter({
  onBack,
  onCancel,
  onSave,
  onPreview,
  saving,
  isSubmit = false,
}: {
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
  onPreview?: () => void;
  saving: boolean;
  isSubmit?: boolean;
}) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
      <Button size="sm" variant="outline" type="button" onClick={onBack} className="px-4 py-2 text-sm font-medium">
        ← Volver
      </Button>
      <div className="flex gap-3">
        <Button size="sm" variant="outline" type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium">
          Cancelar
        </Button>
        {onPreview && (
          <Button
            size="sm"
            variant="primary"
            type="button"
            onClick={onPreview}
            className="px-4 py-2 text-sm font-medium bg-gray-600 hover:bg-gray-700"
          >
            Ver Preview
          </Button>
        )}
        <Button
          size="sm"
          variant="primary"
          type={isSubmit ? "submit" : "button"}
          onClick={isSubmit ? undefined : onSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700"
        >
          {saving ? "Guardando..." : "Guardar Factura"}
        </Button>
      </div>
    </div>
  );
}