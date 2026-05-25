import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Alert } from "@/shared/components/ui/Alert";
import { useLineItems } from "@/shared/hooks/useLineItems";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { LineItemsEditor } from "@/shared/components/domain/LineItemsEditor";
import { ClienteSelector } from "@/features/clientes/components/ClienteSelector";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import {
  getClientDisplayName,
  type Cliente,
} from "@/features/clientes/types";
import { useCotizacionesQuery, fetchCotizacionById } from "@/features/cotizaciones/hooks/useCotizacionesQuery";
import type { Cotizacion, CotizacionLegacy } from "@/features/cotizaciones/types";
import { useNextNcf } from "@/features/ncf/hooks/useNcf";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import { getTodayDate, toIsoDateOnly } from "@/shared/utils/format";
import { facturasApi } from "../api/facturas";
import { useCreateFactura } from "../hooks/useCreateFactura";
import type { FacturaFormState } from "../types";
import { CreationTypeSelector } from "./CreationTypeSelector";
import { CotizacionSearch } from "./CotizacionSearch";
import {
  DateTotalSection,
  FormFooter,
  SelectedCotizacionBanner,
  TotalDisplay,
} from "./FacturaCommonFields";

const EMPTY_FORM: FacturaFormState = { date: getTodayDate(), client: "", ncf: "", rnc: "" };

interface FacturaCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type CreationType = "client" | "cotizacion" | null;

export function FacturaCreateModal({ isOpen, onClose, onSuccess }: FacturaCreateModalProps) {
  const { user } = useAuth();
  const { fetchNextNCF } = useNextNcf();
  const { items, setItems, itemForm, setItemForm, totalAmount, addItem, removeItem, reset: resetItems } = useLineItems();
  const createMutation = useCreateFactura();

  const [creationType, setCreationType] = useState<CreationType>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [formState, setFormState] = useState<FacturaFormState>(EMPTY_FORM);
  const [showClienteRequiredAlert, setShowClienteRequiredAlert] = useState(false);

  // Cotización flow state
  const [cotizacionQuery, setCotizacionQuery] = useState("");
  const debouncedCotizacionQuery = useDebounce(cotizacionQuery, 400);
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionLegacy | null>(null);

  // Fetch clients only when the client flow is active
  const { data: clientesResult, isLoading: loadingClientes, error: errorClientes } = useClientesQuery({
    enabled: isOpen && creationType === "client",
  });
  const clientes = clientesResult?.items ?? [];

  // Fetch cotizaciones when searching in the cotización flow
  const { data: cotizacionesResult, isLoading: loadingCotizaciones, error: errorCotizaciones } = useCotizacionesQuery({
    query: debouncedCotizacionQuery,
    enabled: isOpen && creationType === "cotizacion" && debouncedCotizacionQuery.trim().length > 0,
  });
  const cotizaciones = cotizacionesResult?.items ?? [];

  // Populate form when a cotización is selected
  useEffect(() => {
    if (!selectedCotizacion) return;
    const cot = selectedCotizacion;

    if (Array.isArray(cot.items) && cot.items.length > 0) {
      setItems(
        cot.items.map((item) => ({
          id: Date.now() + Math.random(),
          description: item.description,
          amount: Number(item.amount),
          quantity: Number(item.quantity),
        })),
      );
    } else if (cot.description ?? cot.descripcion) {
      const desc = cot.description ?? cot.descripcion ?? "";
      const totalVal = parseFloat(String(cot.total ?? cot.amount ?? cot.monto ?? 0)) || 0;
      setItems([{ id: Date.now(), description: desc, amount: totalVal, quantity: 1 }]);
    } else {
      setItems([]);
    }
    setItemForm({ description: "", amount: "", quantity: "1" });

    setSelectedCliente({
      id: cot.client_id ?? 0,
      client_name: cot.client_name,
      company_name: cot.company_name,
      email: cot.email,
      phone_number: cot.phone_number,
      nombre: cot.nombre,
      name: cot.name,
      telefono: cot.telefono,
      direccion: cot.direccion,
      rnc: cot.rnc,
    });

    setFormState((fd) => ({
      ...fd,
      client: cot.client_name ?? cot.cliente ?? "",
      date: toIsoDateOnly(cot.date),
      rnc: cot.rnc ?? "",
    }));
  }, [selectedCotizacion, setItems, setItemForm]);

  const handleClose = useCallback(() => {
    setCreationType(null);
    setSelectedCliente(null);
    setSelectedCotizacion(null);
    setFormState(EMPTY_FORM);
    setCotizacionQuery("");
    resetItems();
    onClose();
  }, [onClose, resetItems]);

  const flashClienteRequired = () => {
    setShowClienteRequiredAlert(true);
    setTimeout(() => setShowClienteRequiredAlert(false), 3500);
  };

  const handleSave = useCallback(async () => {
    if (!selectedCliente) return flashClienteRequired();
    if (!formState.date || items.length === 0) return;

    try {
      await createMutation.mutateAsync({
        date: formState.date,
        client: formState.client,
        client_id: selectedCliente.id,
        user_id: user?.id,
        items: items.map(({ description, amount, quantity }) => ({ description, amount, quantity })),
        ncf: formState.ncf || undefined,
      });
      handleClose();
      onSuccess();
    } catch {
      console.error("Error al guardar la factura");
    }
  }, [selectedCliente, formState, items, user, createMutation, handleClose, onSuccess]);

  const handlePreview = useCallback(async () => {
    if (!selectedCliente) return flashClienteRequired();
    if (items.length === 0 || !formState.ncf) return;

    try {
      const result = await facturasApi.preview({
        client_id: selectedCliente.id,
        items: items.map(({ description, amount, quantity }) => ({ description, amount, quantity })),
        ncf: formState.ncf,
        date: formState.date || undefined,
      });
      const base64 = pickPdfBase64(result.data);
      if (base64) openPdfFromBase64(base64);
      else console.error("Preview response did not contain a valid PDF base64 string.", result);
    } catch (err) {
      console.error("Error previewing factura:", err);
    }
  }, [selectedCliente, formState, items]);

  const handleClientSelect = useCallback(
    async (cliente: Cliente) => {
      const nextNCF = await fetchNextNCF();
      setSelectedCliente(cliente);
      setFormState((fd) => ({
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
    setFormState((fd) => ({ ...fd, client: "", rnc: "" }));
  }, []);

  const handleCotizacionSelect = useCallback(
    async (cot: Cotizacion) => {
      try {
        const full = await fetchCotizacionById(cot.id);
        const nextNCF = await fetchNextNCF();
        setSelectedCotizacion((full ?? cot) as CotizacionLegacy);
        setFormState((fd) => ({ ...fd, ncf: nextNCF }));
      } catch (err) {
        console.error("Error fetching cotización details:", err);
        const nextNCF = await fetchNextNCF();
        setSelectedCotizacion(cot as CotizacionLegacy);
        setFormState((fd) => ({ ...fd, ncf: nextNCF }));
      }
    },
    [fetchNextNCF],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-5xl w-full p-0 max-h-[92vh] overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-xl"
      showCloseButton={false}
    >
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 border-b border-blue-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Nueva Factura</h2>
          <p className="text-blue-100 text-xs mt-0.5">Complete los detalles para generar la factura</p>
        </div>
      </div>

      <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(92vh - 140px)" }}>
        {!creationType && <CreationTypeSelector onSelect={setCreationType} onCancel={handleClose} />}

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
              error={errorClientes instanceof Error ? errorClientes.message : undefined}
              selectedCliente={selectedCliente}
              onSelect={handleClientSelect}
              onClear={handleClientClear}
            />
            <DateTotalSection
              date={formState.date}
              onDateChange={(date) => setFormState((fd) => ({ ...fd, date }))}
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
              onSave={() => { /* triggered via form submit */ }}
              onPreview={handlePreview}
              saving={createMutation.isPending}
              isSubmit
            />
          </form>
        )}

        {creationType === "cotizacion" && (
          <div className="space-y-4">
            {!selectedCotizacion && (
              <CotizacionSearch
                cotizaciones={cotizaciones}
                loading={loadingCotizaciones}
                error={errorCotizaciones instanceof Error ? errorCotizaciones.message : undefined}
                query={cotizacionQuery}
                onQueryChange={setCotizacionQuery}
                onSelect={handleCotizacionSelect}
              />
            )}
            {selectedCotizacion && (
              <>
                <SelectedCotizacionBanner
                  code={selectedCotizacion.code ?? selectedCotizacion.codigo ?? ""}
                  description={selectedCotizacion.description ?? selectedCotizacion.descripcion ?? ""}
                  onClear={() => {
                    setSelectedCotizacion(null);
                    setSelectedCliente(null);
                    resetItems();
                    setFormState((fd) => ({ ...fd, client: "" }));
                  }}
                />
                <CotizacionFlowFields
                  date={formState.date}
                  ncf={formState.ncf}
                  totalAmount={totalAmount}
                  onDateChange={(date) => setFormState((fd) => ({ ...fd, date }))}
                  onNcfChange={(ncf) => setFormState((fd) => ({ ...fd, ncf }))}
                />
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
              saving={createMutation.isPending}
            />
          </div>
        )}
      </div>

      {showClienteRequiredAlert && (
        <Alert
          variant="warning"
          title="Cliente requerido"
          message="Debe seleccionar un cliente antes de guardar o ver el preview de la factura."
        />
      )}
    </Modal>
  );
}

function CotizacionFlowFields({
  date,
  ncf,
  totalAmount,
  onDateChange,
  onNcfChange,
}: {
  date: string;
  ncf: string;
  totalAmount: number;
  onDateChange: (v: string) => void;
  onNcfChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
        <label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <span className="text-blue-600 dark:text-blue-400">📅</span> Fecha
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
        />
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
        <label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <span className="text-blue-600 dark:text-blue-400">🆔</span> NCF
        </label>
        <input
          type="text"
          value={ncf}
          onChange={(e) => onNcfChange(e.target.value)}
          placeholder="—"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
        />
      </div>
      <TotalDisplay totalAmount={totalAmount} />
    </div>
  );
}
