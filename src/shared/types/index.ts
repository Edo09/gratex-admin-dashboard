/** A line item used in invoices and quotes. */
export interface LineItem {
  id: number;
  description: string;
  amount: number;
  quantity: number;
}

/** Form input state for adding/editing a single line item. */
export interface LineItemFormData {
  description: string;
  amount: string;
  quantity: string;
}
