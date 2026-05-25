import { formatCurrency } from "@/shared/utils/format";
import Button from "@/shared/components/ui/Button";

export function DateTotalSection({
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

export function TotalDisplay({ totalAmount }: { totalAmount: number }) {
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

interface FormFooterProps {
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
  onPreview?: () => void;
  saving: boolean;
  isSubmit?: boolean;
}

export function FormFooter({
  onBack,
  onCancel,
  onSave,
  onPreview,
  saving,
  isSubmit = false,
}: FormFooterProps) {
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

export function SelectedCotizacionBanner({
  code,
  description,
  onClear,
}: {
  code: string;
  description: string;
  onClear: () => void;
}) {
  return (
    <div className="rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-4 dark:border-green-700">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-base font-medium text-gray-900 dark:text-white">{code}</div>
        <Button size="sm" variant="outline" type="button" onClick={onClear} className="px-3 py-1 text-sm">
          Cambiar
        </Button>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
    </div>
  );
}
