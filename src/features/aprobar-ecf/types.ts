/* ------------------------------------------------------------------ */
/* e-CF recibidos (GET /ecf/recepcion) — comprobantes que otros          */
/* emisores enviaron a tu empresa. Tu rol: comprador.                    */
/* ------------------------------------------------------------------ */

/** Tu decisión comercial enviada a la DGII. `null` = aún no respondido → "Pendiente". */
export type AprobacionComercial = "ACEPTADO" | "RECHAZADO" | null;

export interface EcfRecibido {
  track_id: string;
  tipo_ecf: string;
  e_ncf: string;
  rnc_emisor: string;
  razon_social_emisor: string;
  rnc_comprador: string;
  monto_total: number;
  fecha_emision: string;
  /** Estado técnico de recepción (firma). NO es tu decisión comercial. */
  estado: string;
  /** Decisión comercial: `null` = Pendiente. */
  aprobacion_comercial: AprobacionComercial;
  /** `codigo` de DGII: `1` = procesada OK; `2`/`02` = no procesada. */
  aprobacion_comercial_codigo_dgii: string | number | null;
  /** `estado` textual de DGII. */
  aprobacion_comercial_estado_dgii: string | null;
  /** `1` si la aprobación fue procesada por DGII, `0` si no. */
  aprobacion_comercial_procesada: string | number | null;
  /** Fecha/hora del envío de la aprobación. */
  aprobacion_comercial_fecha: string | null;
}

/* ------------------------------------------------------------------ */
/* Aprobación comercial (POST /aprobaciones-comerciales)                 */
/* ------------------------------------------------------------------ */

/** `1` = Aceptado, `2` = Rechazado. */
export type EstadoAprobacion = "1" | "2";

export interface AprobacionPayload {
  rnc_emisor: string;
  e_ncf: string;
  fecha_emision: string;
  monto_total: string | number;
  estado: EstadoAprobacion;
  /** Obligatorio cuando `estado === "2"`. */
  detalle_motivo?: string;
}

export interface AprobacionResult {
  rnc_emisor: string;
  e_ncf: string;
  estado_aprobacion: string;
  track_id: string;
  estado_dgii?: string;
  codigo_seguridad?: string;
  ambiente?: string;
  fecha_envio?: string;
  dgii_response?: unknown;
}
