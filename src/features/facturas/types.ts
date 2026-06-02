import type {
  TipoEcf,
  TipoPago,
  IndicadorFacturacion,
  IndicadorBienServicio,
  CodigoModificacion,
  EstadoDgii,
} from "./constants";

/* ------------------------------------------------------------------ */
/* Response types — what comes back from GET /facturas                  */
/* ------------------------------------------------------------------ */

export interface FacturaItem {
  numero_linea?: number;
  indicador_facturacion?: IndicadorFacturacion;
  nombre_item?: string;
  indicador_bien_servicio?: IndicadorBienServicio;
  cantidad?: number;
  unidad_medida?: string;
  precio_unitario?: number;
  // Legacy fields — older facturas stored these instead
  description?: string;
  amount?: number | string;
  quantity?: number;
  // Retention (E41, E47)
  indicador_agente_retencion_percepcion?: string;
  monto_itbis_retenido?: number;
  monto_isr_retenido?: number;
}

export interface Factura {
  id: number;
  date: string;
  client_id?: number | null;
  client_name?: string;
  company_name?: string;
  total?: string | number;
  amount?: string | number;
  // Totales calculados por el backend (GET por ID). Tienen prioridad sobre el
  // cálculo local: el precio del item incluye ITBIS si indicador_monto_gravado="0".
  monto_gravado?: string | number;
  monto_exento?: string | number;
  monto_tasa_cero?: string | number;
  total_itbis?: string | number;
  items?: FacturaItem[];
  // e-CF fields
  tipo_ecf?: TipoEcf;
  e_ncf?: string;
  track_id?: string;
  rfce_track_id?: string;
  estado_dgii?: EstadoDgii;
  codigo_seguridad?: string;
  fecha_emision_dgii?: string;
  dgii_response?: unknown;
  /** Indica si la secuencia NCF fue consumida (relevante en RECHAZADO). */
  secuencia_utilizada?: boolean | null;
  tipo_pago?: TipoPago;
  ambiente?: string;
  tipo_ingresos?: string;
  indicador_monto_gravado?: string;
  // Legacy fields (kept for backward compat with old records)
  no_factura?: string;
  code?: string;
  client?: string;
  NCF?: string;
  description?: string;
}

/* ------------------------------------------------------------------ */
/* Table row (normalized for display)                                   */
/* ------------------------------------------------------------------ */

export interface FacturaTableRow {
  id: number;
  ncf: string;
  date: string;
  client_name: string;
  company_name?: string;
  total: string;
  tipo_ecf?: TipoEcf;
  estado_dgii?: EstadoDgii;
}

/* ------------------------------------------------------------------ */
/* Form state types                                                     */
/* ------------------------------------------------------------------ */

export interface FacturaFormState {
  tipo_ecf: TipoEcf;
  date: string;
  tipo_pago: TipoPago;
  ncf: string;
  rnc: string;
}

export interface ItemDraft {
  id: number;
  nombre_item: string;
  precio_unitario: number;
  cantidad: number;
  indicador_facturacion: IndicadorFacturacion;
  indicador_bien_servicio: IndicadorBienServicio;
  unidad_medida: string;
  // Retention (E41, E47)
  monto_itbis_retenido?: number;
  monto_isr_retenido?: number;
}

export interface ItemFormState {
  nombre_item: string;
  precio_unitario: string;
  cantidad: string;
  indicador_facturacion: IndicadorFacturacion;
  indicador_bien_servicio: IndicadorBienServicio;
}

/* ------------------------------------------------------------------ */
/* Buyer / reference info                                               */
/* ------------------------------------------------------------------ */

export interface Comprador {
  /** RNC (11 o 9 dígitos). Para no residentes usar `identificador_extranjero`. */
  rnc?: string;
  /** Identificador extranjero — para comprador no residente (E46/E47). */
  identificador_extranjero?: string;
  /** Nombre / razón social del comprador. */
  razon_social: string;
  direccion?: string;
  municipio?: string;
  provincia?: string;
  correo?: string;
  contacto?: string;
}

export interface InformacionReferencia {
  ncf_modificado: string;
  rnc_otro_contribuyente: null;
  fecha_ncf_modificado: string;
  codigo_modificacion: CodigoModificacion;
  razon_modificacion: string;
}

/* ------------------------------------------------------------------ */
/* Totals                                                               */
/* ------------------------------------------------------------------ */

export interface FacturaTotales {
  itbis1?: string;
  itbis2?: string;
  itbis3?: string;
  total_itbis_retenido?: number;
  total_isr_retencion?: number;
}

/* ------------------------------------------------------------------ */
/* Create payload — matches e-CF API (POST /api/facturas)               */
/* ------------------------------------------------------------------ */

export interface FacturaItemPayload {
  numero_linea: number;
  indicador_facturacion: IndicadorFacturacion;
  nombre_item: string;
  indicador_bien_servicio: IndicadorBienServicio;
  cantidad: number;
  unidad_medida: string;
  precio_unitario: number;
  indicador_agente_retencion_percepcion?: string;
  monto_itbis_retenido?: number;
  monto_isr_retenido?: number;
}

export interface CreateFacturaPayload {
  /** Omitted for E32/E43 (no identified buyer). */
  client_id?: number;
  tipo_ecf: TipoEcf;
  items: FacturaItemPayload[];
  user_id?: number;
  /** Formato `DD-MM-YYYY`. Omitir → backend usa hoy. */
  fecha_emision?: string;
  /** Fecha de registro `YYYY-MM-DD H:i:s`. Omitir → backend usa ahora. */
  date?: string;
  tipo_pago?: TipoPago;
  tipo_ingresos?: string;
  indicador_monto_gravado?: string;
  indicador_nota_credito?: string;
  comprador?: Comprador;
  informacion_referencia?: InformacionReferencia;
  totales?: FacturaTotales;
  /** Forzar e-NCF específico — solo usar para reemitir tras RECHAZADO con `secuencia_utilizada=false`. */
  e_ncf?: string;
  /** Si `true`, usar `totales`/`comprador` literales sin merge. */
  strict_input?: boolean;
  // Pago a crédito (opcional)
  fecha_limite_pago?: string;
  termino_pago?: string;
  tipo_cuenta_pago?: string;
  numero_cuenta_pago?: string;
  banco_pago?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  total_paginas?: number;
}

export interface PreviewFacturaPayload {
  client_id?: number;
  items: FacturaItemPayload[];
  ncf?: string;
  date?: string;
  tipo_ecf?: TipoEcf;
}
