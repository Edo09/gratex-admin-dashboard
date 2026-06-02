import type { FacturaItem } from "@/features/facturas/types";

/**
 * A "factura simple" is an internal, non-electronic invoice (tipo_ecf IS NULL).
 * It never reaches the DGII: no e-NCF, no XML, no QR. It may carry a traditional
 * NCF (B01…). The records are shaped like the legacy fields of `Factura`, so the
 * list/detail views reuse `Factura` + the helpers in `features/facturas/utils`.
 */

/** Invoice line as returned by GET /facturas-simples (adds explicit ITBIS). */
export interface FacturaSimpleLine extends FacturaItem {
  itbis_amount?: number | string;
}

export interface FacturaSimpleItemPayload {
  description: string;
  quantity: number;
  amount: number;
  /** ITBIS amount for the line. Omit/0 for exento. */
  itbis_amount?: number;
}

export interface CreateFacturaSimplePayload {
  /** Invoice number. Omitted — the backend generates it automatically. */
  no_factura?: string;
  /** Registered client id. Provide this OR `client_name`. */
  client_id?: number;
  /** Walk-in client name when there is no registered client. */
  client_name?: string;
  /** `YYYY-MM-DD`. Omit → backend uses today. */
  date?: string;
  /** Traditional NCF (B01…). Optional. */
  NCF?: string;
  /** Omit → backend sums line subtotals + ITBIS. */
  total?: number;
  items: FacturaSimpleItemPayload[];
}
