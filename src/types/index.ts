// Shared domain types used across the application

export interface Cliente {
  id: number;
  email?: string;
  client_name?: string;
  company_name?: string;
  phone_number?: string;
  nombre?: string;
  name?: string;
  telefono?: string;
  direccion?: string;
  rnc?: string;
}

export interface LineItem {
  id: number;
  description: string;
  amount: number;
  quantity: number;
}

export interface ItemFormData {
  description: string;
  amount: string;
  quantity: string;
}

export interface FacturaFormData {
  date: string;
  client: string;
  ncf: string;
  rnc: string;
}

export interface CotizacionRecord {
  id: number;
  code?: string;
  codigo?: string;
  date?: string;
  fecha?: string;
  client_id?: number;
  client_name?: string;
  company_name?: string;
  email?: string;
  phone_number?: string;
  cliente?: string;
  nombre?: string;
  name?: string;
  telefono?: string;
  direccion?: string;
  rnc?: string;
  description?: string;
  descripcion?: string;
  total?: string | number;
  amount?: string | number;
  monto?: string | number;
  items?: Array<{
    description: string;
    amount: number | string;
    quantity: number;
  }>;
}

export interface FacturaTableRow {
  id: number;
  no_factura: string;
  date: string;
  client_name: string;
  company_name?: string;
  total: string;
  ncf: string;
  description: string;
  amount: string;
}

/** Helper to get display name from a Cliente record */
export function getClientDisplayName(c: Cliente): string {
  return c.client_name ?? c.nombre ?? c.name ?? `Cliente ${c.id}`;
}

/** Helper to get today's date as yyyy-MM-dd */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
