/* ------------------------------------------------------------------ */
/* Gastos (GET/POST /gastos) — comprobantes que sustentan costos.        */
/* Auto-emitidos por la empresa (E41/E43/E47) o recibidos de un          */
/* proveedor (E31/B01/E33/E34, el usuario digita el NCF).                */
/* ------------------------------------------------------------------ */

export type GastoCategoria = "gastos_menores" | "facturas_proveedores";

export type TipoGasto = "E41" | "E43" | "E47" | "E31" | "B01" | "E33" | "E34";

export interface GastoItem {
  id?: number;
  description: string;
  amount: string | number;
  quantity?: number;
  subtotal?: string | number;
  itbis_amount?: string | number;
  indicador_facturacion?: number;
  indicador_bien_servicio?: number;
}

export interface Gasto {
  id: number;
  categoria: GastoCategoria;
  tipo_gasto: TipoGasto;
  ncf: string | null;
  rnc_proveedor: string | null;
  nombre_proveedor: string;
  fecha: string;
  subtotal: string | number;
  itbis: string | number;
  total: string | number;
  es_auto_emision: 0 | 1 | boolean;
  estado_dgii?: string | null;
  track_id?: string | null;
  codigo_seguridad?: string | null;
  fecha_emision_dgii?: string | null;
  ambiente?: string;
  user_id?: number;
  items?: GastoItem[];
  /** Presente cuando el guard DGII está apagado (auto-emisión diferida). */
  aviso?: string;
}

export interface CreateGastoItemPayload {
  description: string;
  amount: number;
  quantity?: number;
  itbis_amount?: number;
}

export interface CreateGastoPayload {
  categoria: GastoCategoria;
  tipo_gasto: TipoGasto;
  /** Requerido para facturas_proveedores; opcional en E43 (gastos menores). */
  rnc_proveedor?: string;
  nombre_proveedor: string;
  /** Solo recibidos (E31/B01/E33/E34); en auto-emisión el server lo genera. */
  ncf?: string;
  /** Default: hoy (Y-m-d). */
  fecha?: string;
  items: CreateGastoItemPayload[];
}
