import { INDICADOR_FACTURACION_RATES } from "./constants";
import type { IndicadorFacturacion } from "./constants";
import type { Factura, FacturaItem, ItemDraft, FacturaTotales } from "./types";

export function parseFacturaAmount(item: Factura): number {
  const raw = (item.amount ?? item.total) ?? 0;
  const val = typeof raw === "string" ? parseFloat(raw) : raw;
  return isNaN(val) ? 0 : val;
}

export function toEcfDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

export function fromEcfDate(ecfDate: string): string {
  const [d, m, y] = ecfDate.split("-");
  if (!d || !m || !y) return ecfDate;
  return `${y}-${m}-${d}`;
}

export function getItemName(item: FacturaItem): string {
  return item.nombre_item ?? item.description ?? "";
}

export function getItemPrice(item: FacturaItem): number {
  if (item.precio_unitario != null) return item.precio_unitario;
  const raw = item.amount ?? 0;
  return typeof raw === "string" ? parseFloat(raw) || 0 : raw;
}

export function getItemQty(item: FacturaItem): number {
  return item.cantidad ?? item.quantity ?? 1;
}

export function getItemIndicador(item: FacturaItem): IndicadorFacturacion {
  return item.indicador_facturacion ?? 1;
}

export function getFacturaNcf(f: Factura): string {
  return f.e_ncf ?? f.NCF ?? f.no_factura ?? `#${f.id}`;
}

export function getFacturaClientName(f: Factura): string {
  return f.client_name ?? f.client ?? "—";
}

export function getFacturaDescription(f: Factura): string {
  if (f.description && f.description.trim()) return f.description;
  if (Array.isArray(f.items) && f.items.length > 0) {
    const names = f.items
      .map((it) => getItemName(it))
      .filter((s) => s && s.trim());
    if (names.length > 0) return names.join(" · ");
  }
  return "—";
}

export interface ItbisBreakdown {
  subtotal: number;
  itbis18: number;
  itbis16: number;
  totalItbis: number;
  montoExento: number;
  montoTasaCero: number;
  total: number;
}

export function calculateItbisBreakdown(items: ItemDraft[]): ItbisBreakdown {
  let subtotal = 0;
  let itbis18 = 0;
  let itbis16 = 0;
  let montoExento = 0;
  let montoTasaCero = 0;

  for (const it of items) {
    const lineTotal = it.precio_unitario * it.cantidad;
    subtotal += lineTotal;
    switch (it.indicador_facturacion) {
      case 1:
        itbis18 += lineTotal * 0.18;
        break;
      case 2:
        itbis16 += lineTotal * 0.16;
        break;
      case 3:
        montoTasaCero += lineTotal;
        break;
      case 4:
        montoExento += lineTotal;
        break;
    }
  }

  return {
    subtotal,
    itbis18,
    itbis16,
    totalItbis: itbis18 + itbis16,
    montoExento,
    montoTasaCero,
    total: subtotal + itbis18 + itbis16,
  };
}

export function calculateItbisFromResponse(items: FacturaItem[]): ItbisBreakdown {
  const drafts: ItemDraft[] = items.map((it, i) => ({
    id: i,
    nombre_item: getItemName(it),
    precio_unitario: getItemPrice(it),
    cantidad: getItemQty(it),
    indicador_facturacion: getItemIndicador(it),
    indicador_bien_servicio: it.indicador_bien_servicio ?? 1,
    unidad_medida: it.unidad_medida ?? "43",
  }));
  return calculateItbisBreakdown(drafts);
}

export function buildTotales(items: ItemDraft[]): FacturaTotales {
  const hasRate = (rate: IndicadorFacturacion) => items.some((it) => it.indicador_facturacion === rate);
  const totales: FacturaTotales = {};
  if (hasRate(1)) totales.itbis1 = "18";
  if (hasRate(2)) totales.itbis2 = "16";
  if (hasRate(3)) totales.itbis3 = "0";

  const totalItbisRetenido = items.reduce((s, it) => s + (it.monto_itbis_retenido ?? 0), 0);
  const totalIsrRetencion = items.reduce((s, it) => s + (it.monto_isr_retenido ?? 0), 0);
  if (totalItbisRetenido > 0) totales.total_itbis_retenido = totalItbisRetenido;
  if (totalIsrRetencion > 0) totales.total_isr_retencion = totalIsrRetencion;

  return totales;
}

export function itbisRateForIndicador(ind: IndicadorFacturacion): number {
  return INDICADOR_FACTURACION_RATES[ind];
}
