import { useCallback, useMemo, useState } from "react";
import type { LineItem, LineItemFormData } from "@/shared/types";

const EMPTY_FORM: LineItemFormData = { description: "", amount: "", quantity: "1" };

/** Local state hook for the line-items editor used by facturas and cotizaciones. */
export function useLineItems() {
  const [items, setItems] = useState<LineItem[]>([]);
  const [itemForm, setItemForm] = useState<LineItemFormData>(EMPTY_FORM);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.amount * item.quantity, 0),
    [items],
  );

  const addItem = useCallback(() => {
    const description = itemForm.description.trim();
    const amount = parseFloat(itemForm.amount);
    const quantity = parseFloat(itemForm.quantity);
    if (!description || isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) return;
    setItems((prev) => [...prev, { id: Date.now(), description, amount, quantity }]);
    setItemForm(EMPTY_FORM);
  }, [itemForm]);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItem = useCallback((id: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setItemForm(EMPTY_FORM);
  }, []);

  return {
    items,
    setItems,
    itemForm,
    setItemForm,
    totalAmount,
    addItem,
    removeItem,
    updateItem,
    reset,
  };
}
