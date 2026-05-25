export interface Factura {
  id: number;
  date: string;
  no_factura?: string;
  code?: string;
  client?: string;
  client_id?: number | null;
  client_name?: string;
  company_name?: string;
  total?: string | number;
  amount?: string | number;
  NCF?: string;
  description?: string;
  items?: Array<{ description: string; amount: number; quantity: number }>;
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

export interface FacturaFormState {
  date: string;
  client: string;
  ncf: string;
  rnc: string;
}

export interface FacturaItemPayload {
  description: string;
  amount: number;
  quantity: number;
}

export interface CreateFacturaPayload {
  date: string;
  client: string;
  client_id?: number;
  user_id?: number;
  items: FacturaItemPayload[];
  ncf?: string;
}

export interface PreviewFacturaPayload {
  client_id: number;
  items: FacturaItemPayload[];
  ncf: string;
  date?: string;
}
