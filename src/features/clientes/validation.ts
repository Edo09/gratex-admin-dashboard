import type { CreateClienteInput } from "./types";

export type CreateClienteErrors = Partial<
  Record<"email" | "client_name" | "company_name" | "phone_number", string>
>;

export const EMPTY_CLIENTE_FORM: CreateClienteInput = {
  client_name: "",
  company_name: "",
  email: "",
  phone_number: "",
  sent_mail: false,
  rnc: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeClienteForm(data: CreateClienteInput): CreateClienteInput {
  return {
    ...data,
    client_name: data.client_name.trim(),
    company_name: data.company_name.trim(),
    email: data.email.trim(),
    phone_number: data.phone_number.trim(),
    rnc: data.rnc.trim(),
  };
}

export function validateCreateCliente(data: CreateClienteInput): CreateClienteErrors {
  const errors: CreateClienteErrors = {};

  if (!data.email || !EMAIL_RE.test(data.email) || data.email.length > 100) {
    errors.email = "El email es obligatorio, debe ser valido y tener maximo 100 caracteres.";
  }
  if (!data.client_name || data.client_name.length > 100) {
    errors.client_name = "El nombre del cliente es obligatorio y no puede exceder 100 caracteres.";
  }
  if (!data.company_name || data.company_name.length > 100) {
    errors.company_name = "La empresa es obligatoria y no puede exceder 100 caracteres.";
  }
  const phoneDigits = data.phone_number.replace(/\D/g, "");
  if (!data.phone_number || data.phone_number.length > 20 || phoneDigits.length > 13) {
    errors.phone_number = "El telefono es obligatorio, maximo 20 caracteres y 13 digitos.";
  }

  return errors;
}
