export interface Cotizacion {
  id: number;
  code?: string;
  date?: string;
  client_id?: number;
  client_name?: string;
  company_name?: string;
  email?: string;
  phone_number?: string;
  telefono?: string;
  direccion?: string;
  rnc?: string;
  description?: string;
  total?: string | number;
  items?: CotizacionItem[];
}

export interface CotizacionItem {
  id?: number;
  description: string;
  amount: string | number;
  quantity: number;
  subtotal?: string | number;
}

/** Legacy field-name tolerant Cotizacion shape (used in the create-from-cotizacion flow). */
export interface CotizacionLegacy extends Cotizacion {
  codigo?: string;
  fecha?: string;
  cliente?: string;
  nombre?: string;
  name?: string;
  descripcion?: string;
  amount?: string | number;
  monto?: string | number;
  items?: Array<{
    id?: number;
    description: string;
    amount: number | string;
    quantity: number;
    subtotal?: number | string;
  }>;
}

export interface CotizacionTableRow {
  id: number;
  date: string;
  code?: string;
  client?: string;
  company_name?: string;
  description: string;
  amount: string;
  total: string;
}

export interface CreateCotizacionPayload {
  client_id: number | null;
  client_name: string | null;
  user_id?: number;
  date: string;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
  preview?: boolean;
  sent_email?: boolean;
}

export interface PreviewCotizacionPayload {
  client_id: number | null;
  client_name: string | null;
  date: string;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
    subtotal: number;
  }>;
  total: number;
}
