import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import ClienteSelector from "../shared/ClienteSelector";
import LineItemsEditor from "../shared/LineItemsEditor";
import { useLineItems } from "../../hooks/useLineItems";
import { useNcf } from "../../hooks/useNcf";
import { facturasApi, clientesApi, cotizacionesApi } from "../../services/api";
import type { Cliente, CotizacionRecord, FacturaFormData } from "../../types";
import { getTodayDate, getClientDisplayName } from "../../types";

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

  // Fetch cotizaciones when cotización flow is selected
  useEffect(() => {
    if (!isOpen || creationType !== "cotizacion") return;
    let ignore = false;
    (async () => {
      try {
        setLoadingCotizaciones(true);
        setErrorCotizaciones(undefined);
        const response = await cotizacionesApi.getCotizaciones();
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
  }, [isOpen, creationType]);

  // Populate form when a cotización is selected
  useEffect(() => {
    if (!selectedCotizacion) return;
    const cotItems = Array.isArray(selectedCotizacion.items) ? selectedCotizacion.items : [];
    const mappedItems = cotItems.map((item) => ({
      id: Date.now() + Math.random(),
      description: item.description,
      amount: Number(item.amount),
      quantity: Number(item.quantity),
    }));
    setItems(mappedItems);
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
  }, [selectedCliente, facturaData, items, queryClient, handleClose, onSuccess]);

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
      const nextNCF = await fetchNextNCF();
      setSelectedCotizacion(cot);
      setFacturaData((fd) => ({ ...fd, ncf: nextNCF }));
    },
    [fetchNextNCF],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-5xl w-full p-0 max-h-[92vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 border-b-2 border-blue-800">
        <h2 className="text-xl font-bold text-white">Nueva Factura</h2>
        <p className="text-blue-100 text-sm mt-0.5">Complete los detalles para generar la factura</p>
      </div>

      {/* Step 1: Choose creation type */}
      {!creationType && <CreationTypeSelector onSelect={setCreationType} onCancel={handleClose} />}

      {/* Step 2a: Client flow */}
      {creationType === "client" && (
        <form
          className="p-8 space-y-6"
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
            onSave={() => {}}
            saving={saving}
            isSubmit
          />
        </form>
      )}

      {/* Step 2b: Cotización flow */}
      {creationType === "cotizacion" && (
        <div className="p-8 space-y-6">
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                  <label className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400">📅</span> Fecha
                  </label>
                  <input
                    type="date"
                    value={facturaData.date}
                    onChange={(e) => setFacturaData((fd) => ({ ...fd, date: e.target.value }))}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                  <label className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400">🆔</span> NCF
                  </label>
                  <input
                    type="text"
                    value={facturaData.ncf}
                    onChange={(e) => setFacturaData((fd) => ({ ...fd, ncf: e.target.value }))}
                    placeholder="—"
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
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
            saving={saving}
          />
        </div>
      )}
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
    <div className="p-8 space-y-6">
      <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
        Selecciona cómo deseas crear la factura:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          onClick={() => onSelect("client")}
          className="flex flex-col items-center justify-center p-8 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-gray-600 dark:hover:bg-white/[0.04] dark:hover:border-blue-500 bg-white dark:bg-gray-800"
        >
          <svg className="w-16 h-16 mb-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Desde Cliente</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Crear factura seleccionando un cliente</span>
        </button>
        <button
          onClick={() => onSelect("cotizacion")}
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
        <Button size="sm" variant="outline" onClick={onCancel} className="px-6 py-3 text-base font-semibold">
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
        <label className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <span className="text-blue-600 dark:text-blue-400">📅</span> Fecha
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
        />
      </div>
      <TotalDisplay totalAmount={totalAmount} />
    </div>
  );
}

function TotalDisplay({ totalAmount }: { totalAmount: number }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-xl p-4 border-2 border-green-300 dark:border-green-700">
      <label className="mb-2 text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-1">
        <span>💰</span> Total Estimado
      </label>
      <div className="text-2xl font-bold text-green-700 dark:text-green-400">
        ${totalAmount ? totalAmount.toFixed(2) : "0.00"}
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
  const filtered = cotizaciones.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const code = c.code ?? c.codigo ?? "";
    const client = c.client_name ?? c.cliente ?? "";
    const desc = c.description ?? c.descripcion ?? "";
    return [code, client, desc].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="mb-4">
      <label className="mb-3 text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">🔍</span> Buscar Cotización
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar por código, cliente o descripción..."
        className="w-full rounded-lg border-2 border-gray-300 bg-white px-5 py-4 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
      />
      {query.trim() && !loading && !error && (
        <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-64 overflow-y-auto mt-4 rounded-xl border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 shadow-lg">
          {filtered.map((c) => {
            const code = c.code ?? c.codigo ?? `Cotización ${c.id}`;
            const client = c.client_name ?? c.cliente ?? "";
            const monto = c.total ?? c.amount ?? c.monto ?? "";
            const desc = c.description ?? c.descripcion ?? "";
            let date = c.date ?? c.fecha ?? "";
            if (typeof date === "string" && date.length > 10) date = date.slice(0, 10);
            return (
              <li
                key={c.id}
                className="cursor-pointer px-5 py-4 text-base hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                onClick={() => onSelect(c)}
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[80px]">{date}</span>
                  <span className="font-medium text-gray-800 dark:text-white min-w-[90px]">{code}</span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{desc}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[90px]">{client}</span>
                  <span className="text-sm text-green-700 dark:text-green-400 font-semibold min-w-[80px] text-right">
                    {monto ? `$${monto}` : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {loading && (
        <div className="px-5 py-4 text-base font-medium text-gray-600 dark:text-gray-400">⏳ Cargando cotizaciones...</div>
      )}
      {error && <div className="px-5 py-4 text-base font-medium text-red-600 dark:text-red-400">{error}</div>}
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
    <div className="rounded-xl border-2 border-green-300 bg-green-50/80 dark:bg-green-900/20 p-6 shadow-lg dark:border-green-700">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          {cotizacion.code ?? cotizacion.codigo}
        </div>
        <Button size="sm" variant="outline" type="button" onClick={onClear} className="px-4 py-2 text-base">
          Cambiar
        </Button>
      </div>
      <div className="text-base text-gray-500 dark:text-gray-400">
        {cotizacion.description ?? cotizacion.descripcion ?? ""}
      </div>
    </div>
  );
}

function FormFooter({
  onBack,
  onCancel,
  onSave,
  saving,
  isSubmit = false,
}: {
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  isSubmit?: boolean;
}) {
  return (
    <div className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-8 py-6 flex items-center justify-between">
      <Button size="sm" variant="outline" type="button" onClick={onBack} className="px-6 py-3 text-base font-semibold">
        ← Volver
      </Button>
      <div className="flex gap-4">
        <Button size="sm" variant="outline" type="button" onClick={onCancel} className="px-6 py-3 text-base font-semibold">
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="primary"
          type={isSubmit ? "submit" : "button"}
          onClick={isSubmit ? undefined : onSave}
          disabled={saving}
          className="px-6 py-3 text-base font-semibold bg-green-600 hover:bg-green-700"
        >
          {saving ? "Guardando..." : "💾 Guardar Factura"}
        </Button>
      </div>
    </div>
  );
}
