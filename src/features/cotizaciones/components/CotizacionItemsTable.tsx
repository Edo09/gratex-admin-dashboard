import { useState } from "react";
import Button from "@/shared/components/ui/Button";
import { formatCurrency } from "@/shared/utils/format";
import type { LineItem } from "@/shared/types";

interface EditingForm {
  description: string;
  amount: string;
  quantity: string;
}

const EMPTY_EDIT: EditingForm = { description: "", amount: "", quantity: "" };

interface CotizacionItemsTableProps {
  items: LineItem[];
  onItemsChange: (next: LineItem[]) => void;
}

/**
 * Inline-editable items table used in the cotización modal. The plain
 * LineItemsEditor in shared/ is fire-and-forget; this one supports per-row
 * edit/save/cancel because cotizaciones often need text tweaks after adding.
 */
export function CotizacionItemsTable({ items, onItemsChange }: CotizacionItemsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditingForm>(EMPTY_EDIT);

  const startEdit = (id: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditForm({
      description: item.description,
      amount: item.amount.toString(),
      quantity: item.quantity.toString(),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_EDIT);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const description = editForm.description.trim();
    const amount = parseFloat(editForm.amount);
    const quantity = parseFloat(editForm.quantity);
    if (!description || isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) return;
    onItemsChange(
      items.map((item) =>
        item.id === editingId ? { ...item, description, amount, quantity } : item,
      ),
    );
    cancelEdit();
  };

  const removeItem = (id: number) => onItemsChange(items.filter((item) => item.id !== id));

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 overflow-hidden">
        <div className="p-4 text-center">
          <p className="text-base font-medium text-gray-500 dark:text-gray-400">No hay items agregados</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Use el formulario de arriba para agregar items
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 overflow-hidden">
      <table className="w-full divide-y divide-gray-200 dark:divide-gray-600">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="w-10 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Descripción</th>
            <th className="w-32 px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Cantidad x Monto</th>
            <th className="w-28 px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Subtotal</th>
            <th className="w-16 px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {items.map((item, index) => {
            const isEditing = editingId === item.id;
            return (
              <tr
                key={item.id}
                className={`transition-colors ${
                  isEditing ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                <td className="w-10 px-3 py-2 text-sm text-gray-900 dark:text-white align-top">{index + 1}</td>
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-white align-top">
                  {isEditing ? (
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }
                      }}
                      value={editForm.description}
                      onChange={(e) => {
                        setEditForm((prev) => ({ ...prev, description: e.target.value }));
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      className="w-full rounded-md border border-blue-400 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-blue-600 dark:bg-gray-700 dark:text-white transition-all resize-none overflow-hidden"
                    />
                  ) : (
                    <div className="whitespace-pre-line break-words max-w-xs" title={item.description}>
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="w-32 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 text-right whitespace-nowrap align-top">
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: e.target.value }))}
                        className="w-full rounded-md border border-blue-400 bg-white px-2 py-1 text-sm text-right outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-blue-600 dark:bg-gray-700 dark:text-white transition-all"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.amount}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                        className="w-full rounded-md border border-blue-400 bg-white px-2 py-1 text-sm text-right outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:border-blue-600 dark:bg-gray-700 dark:text-white transition-all"
                      />
                    </div>
                  ) : (
                    <>{item.quantity} x {formatCurrency(item.amount)}</>
                  )}
                </td>
                <td className="w-28 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white text-right whitespace-nowrap align-top">
                  {isEditing
                    ? formatCurrency((parseFloat(editForm.amount) || 0) * (parseFloat(editForm.quantity) || 0))
                    : formatCurrency(item.amount * item.quantity)}
                </td>
                <td className="w-16 px-3 py-2 align-top">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="outline" type="button" onClick={cancelEdit} className="px-3 py-1 text-sm">
                        Cancelar
                      </Button>
                      <Button size="sm" variant="primary" type="button" onClick={saveEdit} className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white">
                        Guardar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" type="button" onClick={() => removeItem(item.id)} className="px-3 py-1 text-sm text-red-600 border-red-300 hover:bg-red-50">
                        Quitar
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => startEdit(item.id)} className="px-3 py-1 text-sm text-blue-600 border-blue-300 hover:bg-blue-50">
                        Editar
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
