export type TipoEcf = "31" | "32" | "33" | "34" | "41" | "43" | "44" | "45" | "46" | "47";

export type IndicadorFacturacion = 1 | 2 | 3 | 4;

export type IndicadorBienServicio = 1 | 2;

export type TipoPago = 1 | 2 | 3 | 4 | 5;

export type CodigoModificacion = "1" | "2" | "3" | "4";

export type EstadoDgii =
  | "ENVIADO"
  | "EN_PROCESO"
  | "ACEPTADO"
  | "ACEPTADO_CONDICIONAL"
  | "RECHAZADO"
  | "NO_ENCONTRADO"
  | "RFCE_ACEPTADO"
  | "RFCE_RECHAZADO"
  | "RFCE_NO_ENCONTRADO";

export const ECF_TYPES: Record<TipoEcf, { name: string; short: string; description: string }> = {
  "31": { name: "Factura de Crédito Fiscal", short: "Crédito Fiscal", description: "B2B — requiere RNC del comprador" },
  "32": { name: "Factura de Consumo", short: "Consumo", description: "B2C — sin comprador identificado" },
  "33": { name: "Nota de Débito", short: "Nota Débito", description: "Aumenta factura E31 previa" },
  "34": { name: "Nota de Crédito", short: "Nota Crédito", description: "Reduce factura E31 previa" },
  "41": { name: "Comprobante de Compras", short: "Compras", description: "Registro de compras a proveedores" },
  "43": { name: "Gastos Menores", short: "Gastos Menores", description: "Gastos pequeños — solo exento" },
  "44": { name: "Regímenes Especiales", short: "Reg. Especial", description: "Zonas francas — solo exento" },
  "45": { name: "Gubernamental", short: "Gubernamental", description: "Ventas al gobierno" },
  "46": { name: "Comprobante de Exportaciones", short: "Exportación", description: "Ventas al exterior — tasa cero" },
  "47": { name: "Pagos al Exterior", short: "Pago Exterior", description: "Pagos a no residentes — ISR retenido" },
};

export const TIPO_PAGO_LABELS: Record<TipoPago, string> = {
  1: "Contado",
  2: "Crédito",
  3: "Gratuito",
  4: "Permuta",
  5: "Otros",
};

export const INDICADOR_FACTURACION_LABELS: Record<IndicadorFacturacion, string> = {
  1: "ITBIS 18%",
  2: "ITBIS 16%",
  3: "Tasa cero (exportación)",
  4: "Exento",
};

export const INDICADOR_FACTURACION_RATES: Record<IndicadorFacturacion, number> = {
  1: 0.18,
  2: 0.16,
  3: 0,
  4: 0,
};

export const BIEN_SERVICIO_LABELS: Record<IndicadorBienServicio, string> = {
  1: "Bien",
  2: "Servicio",
};

export const CODIGO_MODIFICACION_LABELS: Record<CodigoModificacion, string> = {
  "1": "Anulación total",
  "2": "Corrección de monto",
  "3": "Descuento",
  "4": "Otros",
};

export const ESTADO_DGII_COLORS: Record<EstadoDgii, string> = {
  ENVIADO: "var(--c-amber, #f59e0b)",
  EN_PROCESO: "var(--c-amber, #f59e0b)",
  ACEPTADO: "var(--c-green, #22c55e)",
  ACEPTADO_CONDICIONAL: "var(--c-amber, #f59e0b)",
  RECHAZADO: "var(--bad, #ef4444)",
  NO_ENCONTRADO: "var(--muted, #6b7280)",
  RFCE_ACEPTADO: "var(--c-green, #22c55e)",
  RFCE_RECHAZADO: "var(--bad, #ef4444)",
  RFCE_NO_ENCONTRADO: "var(--muted, #6b7280)",
};

export function ecfRequiresComprador(tipo: TipoEcf): boolean {
  return tipo === "31";
}

export function ecfRequiresReferencia(tipo: TipoEcf): boolean {
  return tipo === "33" || tipo === "34";
}

export function ecfRequiresRetencion(tipo: TipoEcf): boolean {
  return tipo === "41" || tipo === "47";
}

export function ecfRequiresTotales(tipo: TipoEcf): boolean {
  return !["43"].includes(tipo);
}

export function ecfRequiresTipoIngresos(tipo: TipoEcf): boolean {
  return ["31", "32", "33", "34", "44", "45", "46"].includes(tipo);
}

export function ecfAllowedIndicadores(tipo: TipoEcf): IndicadorFacturacion[] {
  switch (tipo) {
    case "43":
    case "44":
    case "47":
      return [4];
    case "46":
      return [3];
    default:
      return [1, 2, 3, 4];
  }
}

export function ecfForcedBienServicio(tipo: TipoEcf): IndicadorBienServicio | null {
  return tipo === "47" ? 2 : null;
}
