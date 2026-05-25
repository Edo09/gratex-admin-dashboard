/**
 * MOCK helpers used where the backend doesn't yet expose a field the Press
 * design needs. Every helper is deterministic (seeded by a stable id) so the
 * same record always renders the same fake values across reloads. Replace
 * each call site with the real field once the backend lands it.
 */

import type { PressStatus } from "@/shared/components/press/Pill";

function seededIndex(id: number | string, len: number): number {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

const COT_STATUSES: PressStatus[] = ["Aprobada", "Pendiente", "Enviada", "Aprobada", "Rechazada"];
const FACT_STATUSES: PressStatus[] = ["Pagada", "Pagada", "Pendiente", "Pagada", "Vencida"];

/** MOCK: cotización status (backend has no `status` column). */
export function mockCotizacionStatus(id: number | string): PressStatus {
  return COT_STATUSES[seededIndex(id, COT_STATUSES.length)];
}

/** MOCK: factura status (backend has no `status` column). */
export function mockFacturaStatus(id: number | string): PressStatus {
  return FACT_STATUSES[seededIndex(id, FACT_STATUSES.length)];
}

/** MOCK: origin cotización code for a factura. */
export function mockFacturaCotzCode(id: number | string): string {
  const letters = ["XVC", "HKV", "DEV", "UKC", "MNT", "QRZ", "PLO", "BNT"];
  const pick = letters[seededIndex(id, letters.length)];
  const n = 100 + (seededIndex(String(id) + "n", 900));
  return `${pick}${n}`;
}

/** MOCK: a cliente's total billed amount across orders. */
export function mockClienteTotal(id: number | string): number {
  return 4000 + seededIndex(String(id) + "t", 40000);
}

/** MOCK: a cliente's number of orders to date. */
export function mockClienteOrders(id: number | string): number {
  return 1 + seededIndex(String(id) + "o", 24);
}

/** MOCK: a static vencimiento date stamped on detail screens. */
export const MOCK_VENCIMIENTO = "14/06/2026";

/** MOCK: vendor name shown on cotización detail. */
export const MOCK_VENDEDOR = "Omar García";

/** MOCK: payment terms shown on cotización detail. */
export const MOCK_PAGO = "Transferencia";

/** MOCK: delivery date shown on cotización detail. */
export const MOCK_ENTREGA = "22/05/2026";

/** MOCK: factura KPI breakdown (until /facturas exposes status counts). */
export function mockFacturaKpis(total: number) {
  const pagadas = Math.round(total * 0.78);
  const pendientes = Math.round(total * 0.2);
  const vencidas = Math.max(0, total - pagadas - pendientes);
  return { pagadas, pendientes, vencidas, vencidoMontoK: 42180 };
}
