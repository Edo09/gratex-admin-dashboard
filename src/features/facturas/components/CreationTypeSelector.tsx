import Button from "@/shared/components/ui/Button";

interface CreationTypeSelectorProps {
  onSelect: (type: "client" | "cotizacion") => void;
  onCancel: () => void;
}

export function CreationTypeSelector({ onSelect, onCancel }: CreationTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Selecciona cómo deseas crear la factura:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionButton
          title="Desde Cliente"
          subtitle="Crear factura seleccionando un cliente"
          onClick={() => onSelect("client")}
        />
        <OptionButton
          title="Desde Cotización"
          subtitle="Convertir una cotización en factura"
          onClick={() => onSelect("cotizacion")}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="outline" onClick={onCancel} className="px-4 py-2 text-sm font-medium">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function OptionButton({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-all dark:border-gray-600 dark:hover:bg-white/[0.04] dark:hover:border-blue-500 bg-white dark:bg-gray-800"
    >
      <span className="text-base font-medium text-gray-900 dark:text-white">{title}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</span>
    </button>
  );
}
