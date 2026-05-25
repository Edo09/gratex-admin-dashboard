import { useEffect, useState } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import Button from "@/shared/components/ui/Button";
import { Alert } from "@/shared/components/ui/Alert";
import { formatCurrency, getTodayDate, toIsoDateOnly } from "@/shared/utils/format";
import { openPdfFromBase64, pickPdfBase64 } from "@/shared/lib/pdf";
import { useLineItems } from "@/shared/hooks/useLineItems";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useClienteByIdQuery } from "@/features/clientes/hooks/useClientesQuery";
import type { Cliente } from "@/features/clientes/types";
import { getClientDisplayName } from "@/features/clientes/types";
import { cotizacionesApi } from "../api/cotizaciones";
import { useSaveCotizacion } from "../hooks/useSaveCotizacion";
import { useCotizacionPdf } from "../hooks/useCotizacionPdf";
import { fetchCotizacionById } from "../hooks/useCotizacionesQuery";
import type { Cotizacion, CreateCotizacionPayload, PreviewCotizacionPayload } from "../types";
import { CotizacionClientPicker } from "./CotizacionClientPicker";
import { CotizacionItemsTable } from "./CotizacionItemsTable";

interface CotizacionFormModalProps {
  isOpen: boolean;
  editingId: number | null;
  onClose: () => void;
}

/** Create + edit modal for a cotización. */
export function CotizacionFormModal({ isOpen, editingId, onClose }: CotizacionFormModalProps) {
  const { user } = useAuth();
  const lineItems = useLineItems();
  const saveMutation = useSaveCotizacion();
  const { openSavedPdf } = useCotizacionPdf();

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [date, setDate] = useState(getTodayDate());
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showClienteRequiredAlert, setShowClienteRequiredAlert] = useState(false);

  const isEditMode = editingId !== null;
  const { items, setItems, totalAmount } = lineItems;

  // Load existing cotización when entering edit mode
  useEffect(() => {
    if (!isOpen || !editingId) return;
    let cancelled = false;
    void (async () => {
      const cot = await fetchCotizacionById(editingId);
      if (cancelled || !cot) return;
      hydrateFromCotizacion(cot);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  const { data: fullClient } = useClienteByIdQuery(
    isEditMode && selectedCliente?.id ? selectedCliente.id : null,
  );
  useEffect(() => {
    if (fullClient) setSelectedCliente(fullClient);
  }, [fullClient]);

  const hydrateFromCotizacion = (cot: Cotizacion) => {
    setDate(toIsoDateOnly(cot.date));

    if (cot.items && cot.items.length > 0) {
      setItems(
        cot.items.map((i) => ({
          id: (i.id as number) || Date.now() + Math.random(),
          description: i.description,
          amount: parseFloat(i.amount as unknown as string),
          quantity: i.quantity,
        })),
      );
    } else if (cot.description) {
      const totalVal = parseFloat(String(cot.total ?? 0)) || 0;
      setItems([{ id: Date.now(), description: cot.description, amount: totalVal, quantity: 1 }]);
    } else {
      setItems([]);
    }

    if (cot.client_id) {
      // placeholder until the full client query resolves
      setSelectedCliente({ id: cot.client_id, client_name: cot.client_name } as Cliente);
    } else {
      setSelectedCliente(null);
    }
  };

  const reset = () => {
    setDate(getTodayDate());
    setSelectedCliente(null);
    lineItems.reset();
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const buildPayload = (): CreateCotizacionPayload => ({
    client_id: selectedCliente?.id ?? null,
    client_name: selectedCliente ? getClientDisplayName(selectedCliente) : null,
    user_id: user?.id,
    date,
    items: items.map((item) => ({
      description: item.description,
      amount: item.amount,
      quantity: item.quantity,
      subtotal: item.amount * item.quantity,
    })),
    total: totalAmount,
  });

  const flashClienteRequired = () => {
    setShowClienteRequiredAlert(true);
    setTimeout(() => setShowClienteRequiredAlert(false), 3500);
  };

  const handleSubmit = async (sentEmail: boolean) => {
    if (!selectedCliente) return flashClienteRequired();
    try {
      const cotizacionId = await saveMutation.mutateAsync({
        payload: { ...buildPayload(), sent_email: sentEmail },
        editingId,
      });
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3500);
      handleClose();
      if (cotizacionId) await openSavedPdf(cotizacionId);
    } catch (err) {
      console.error("Error saving cotizacion", err);
    }
  };

  const handlePreview = async () => {
    if (!selectedCliente) return flashClienteRequired();
    try {
      const previewPayload: PreviewCotizacionPayload = buildPayload();
      const result = await cotizacionesApi.preview(previewPayload);
      const base64 = pickPdfBase64(result.data);
      if (base64) openPdfFromBase64(base64);
      else console.error("Preview response did not contain a valid PDF base64 string", result);
    } catch (err) {
      console.error("Error previewing cotizacion", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-5xl w-full p-0 max-h-[92vh] overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-xl"
      showCloseButton={false}
    >
      <Header isEditMode={isEditMode} />

      <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(92vh - 140px)" }}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <CotizacionClientPicker
            selectedCliente={selectedCliente}
            onSelect={setSelectedCliente}
            onClear={() => setSelectedCliente(null)}
          />

          <DateTotalSection date={date} onDateChange={setDate} totalAmount={totalAmount} />

          <AddItemSection
            description={lineItems.itemForm.description}
            amount={lineItems.itemForm.amount}
            quantity={lineItems.itemForm.quantity}
            onChange={(patch) => lineItems.setItemForm({ ...lineItems.itemForm, ...patch })}
            onAdd={lineItems.addItem}
          />

          <CotizacionItemsTable items={items} onItemsChange={setItems} />
        </form>
      </div>

      <Footer
        onCancel={handleClose}
        onPreview={handlePreview}
        onSave={() => handleSubmit(false)}
        onSend={() => handleSubmit(true)}
        saving={saveMutation.isPending}
      />

      {showSuccessAlert && (
        <Alert
          variant="success"
          title={isEditMode ? "Cotización actualizada" : "Cotización creada"}
          message={
            isEditMode
              ? "La cotización ha sido actualizada correctamente."
              : "La cotización ha sido creada correctamente."
          }
        />
      )}
      {showClienteRequiredAlert && (
        <Alert
          variant="warning"
          title="Cliente requerido"
          message="Debe seleccionar un cliente antes de continuar."
        />
      )}
    </Modal>
  );
}

function Header({ isEditMode }: { isEditMode: boolean }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 border-b border-blue-800 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {isEditMode ? "Editar Cotización" : "Nueva Cotización"}
        </h2>
        <p className="text-blue-100 text-xs mt-0.5">Complete los detalles para generar la cotización</p>
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
        <label className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all"
        />
      </div>
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-md p-4 border border-green-300 dark:border-green-700">
        <label className="mb-2 text-sm font-medium text-green-800 dark:text-green-300">Total Estimado</label>
        <div className="text-xl font-medium text-green-700 dark:text-green-400">{formatCurrency(totalAmount)}</div>
      </div>
    </div>
  );
}

interface AddItemSectionProps {
  description: string;
  amount: string;
  quantity: string;
  onChange: (patch: Partial<{ description: string; amount: string; quantity: string }>) => void;
  onAdd: () => void;
}

function AddItemSection({ description, amount, quantity, onChange, onAdd }: AddItemSectionProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
      <label className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">Items de la Cotización</label>
      <div className="bg-white dark:bg-gray-700 rounded-md p-3 mb-3 border border-gray-300 dark:border-gray-600">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
            <textarea
              placeholder="Descripción del item..."
              value={description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => onChange({ amount: e.target.value })}
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
              value={quantity}
              onChange={(e) => onChange({ quantity: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
            />
          </div>
          <div className="md:col-span-3 flex items-end">
            <Button size="sm" variant="primary" type="button" className="w-full py-2 text-sm font-medium" onClick={onAdd}>
              Agregar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FooterProps {
  onCancel: () => void;
  onPreview: () => void;
  onSave: () => void;
  onSend: () => void;
  saving: boolean;
}

function Footer({ onCancel, onPreview, onSave, onSend, saving }: FooterProps) {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-end gap-3">
      <Button size="sm" variant="outline" type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium">
        Cancelar
      </Button>
      <Button
        size="sm"
        variant="primary"
        type="button"
        onClick={onPreview}
        className="px-4 py-2 text-sm font-medium bg-gray-600 hover:bg-gray-700"
      >
        Ver Preview
      </Button>
      <Button
        size="sm"
        variant="primary"
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
      >
        Guardar
      </Button>
      <Button
        size="sm"
        variant="primary"
        type="button"
        onClick={onSend}
        disabled={saving}
        className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700"
      >
        Enviar
      </Button>
    </div>
  );
}
