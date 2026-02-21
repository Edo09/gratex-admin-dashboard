import { useMemo, useState, useCallback } from "react";
import type { LineItem, ItemFormData } from "../types";

/**
 * Hook for managing line items in invoices and quotes.
 * Single Responsibility: item state + add/remove logic.
 */
export function useLineItems() {
  const [items, setItems] = useState<LineItem[]>([]);
  const [itemForm, setItemForm] = useState<ItemFormData>({
    description: "",
    amount: "",
    quantity: "1",
  });

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
    setItemForm({ description: "", amount: "", quantity: "1" });
  }, [itemForm]);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setItemForm({ description: "", amount: "", quantity: "1" });
  }, []);

  return { items, setItems, itemForm, setItemForm, totalAmount, addItem, removeItem, reset };
}
