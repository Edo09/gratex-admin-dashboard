import type { GastoCategoria, TipoGasto } from "./types";

export const TIPO_GASTO_LABELS: Record<TipoGasto, { name: string; short: string; ncfDgii: string }> = {
  E41: { name: "Comprobante de Compras", short: "Compras", ncfDgii: "11" },
  E43: { name: "Comprobante para Gastos Menores", short: "Gastos Menores", ncfDgii: "13" },
  E47: { name: "Comprobante para Pagos al Exterior", short: "Pago Exterior", ncfDgii: "17" },
  E31: { name: "Factura de Crédito Fiscal", short: "Crédito Fiscal", ncfDgii: "01" },
  B01: { name: "Crédito Fiscal (NCF tradicional)", short: "Crédito Fiscal", ncfDgii: "01" },
  E33: { name: "Nota de Débito recibida", short: "Nota Débito", ncfDgii: "03" },
  E34: { name: "Nota de Crédito recibida", short: "Nota Crédito", ncfDgii: "04" },
};

export const CATEGORIA_LABELS: Record<GastoCategoria, string> = {
  gastos_menores: "Gastos Menores",
  facturas_proveedores: "Facturas de Proveedores",
};

/** Tipos válidos por categoría (combinación inválida → 400 en el backend). */
export const CATEGORIA_TIPOS: Record<GastoCategoria, TipoGasto[]> = {
  gastos_menores: ["E43"],
  facturas_proveedores: ["E41", "E47", "E31", "B01", "E33", "E34"],
};

/** Tipos que la empresa auto-emite (el server genera la secuencia, sin NCF). */
export const AUTO_EMISION_TIPOS = new Set<TipoGasto>(["E41", "E43", "E47"]);

export function isAutoEmision(tipo: TipoGasto): boolean {
  return AUTO_EMISION_TIPOS.has(tipo);
}

/** Recibidos: el usuario digita el NCF que entregó el proveedor. */
export function isTipoRecibido(tipo: TipoGasto): boolean {
  return !AUTO_EMISION_TIPOS.has(tipo);
}
