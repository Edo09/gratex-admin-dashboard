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

export interface CreateClienteInput {
  client_name: string;
  company_name: string;
  email: string;
  phone_number: string;
  sent_mail: boolean;
  rnc: string;
}

/** Best-effort display name for a Cliente record (handles legacy field names). */
export function getClientDisplayName(c: Cliente): string {
  return c.client_name ?? c.nombre ?? c.name ?? `Cliente ${c.id}`;
}

/** Best-effort phone for a Cliente record (handles legacy field names). */
export function getClientPhone(c: Cliente): string | undefined {
  return c.phone_number ?? c.telefono;
}
