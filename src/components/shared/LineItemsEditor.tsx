import type { LineItem, ItemFormData } from "../../types";
import Button from "../ui/button/Button";
import { BoxIcon } from "../../icons";

interface LineItemsEditorProps {
  items: LineItem[];
  itemForm: ItemFormData;
  onItemFormChange: (form: ItemFormData) => void;
  onAddItem: () => void;
  onRemoveItem: (id: number) => void;
  label?: string;
}

/**
 * Reusable line-items editor with add form and items list.
 * Used in both Facturas and Cotizaciones creation flows.
 */
export default function LineItemsEditor({
  items,
  itemForm,
  onItemFormChange,
  onAddItem,
  onRemoveItem,
  label = "Items de la Factura",
}: LineItemsEditorProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
      <label className="mb-4 block text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">📦</span>
        {label}
      </label>

      {/* Add Item Form */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-5 mb-5 border-2 border-gray-300 dark:border-gray-600">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
            <textarea
              placeholder="Descripción del item..."
              value={itemForm.description}
              onChange={(e) => onItemFormChange({ ...itemForm, description: e.target.value })}
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
              onChange={(e) => onItemFormChange({ ...itemForm, amount: e.target.value })}
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
              onChange={(e) => onItemFormChange({ ...itemForm, quantity: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-600 dark:text-white transition-all"
            />
          </div>
          <div className="md:col-span-3 flex items-end">
            <Button
              size="sm"
              variant="primary"
              startIcon={<BoxIcon className="size-5" />}
              className="w-full h-12 text-base font-semibold"
              onClick={onAddItem}
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
            <p className="text-base text-gray-400 dark:text-gray-500 mt-1">
              Use el formulario de arriba para agregar items
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-base">{item.description}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Cant. {item.quantity} · Monto ${item.amount.toFixed(2)}
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${(item.amount * item.quantity).toFixed(2)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="px-4 py-2 text-base"
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
