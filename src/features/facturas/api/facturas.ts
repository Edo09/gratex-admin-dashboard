import { apiClient, buildQueryString, API_BASE_URL } from "@/shared/api/client";
import { authStorage } from "@/shared/api/storage";
import type { PageQuery, RequestOptions } from "@/shared/api/types";
import type {
  CreateFacturaPayload,
  Factura,
  PreviewFacturaPayload,
} from "../types";

export interface PdfResponse {
  filename?: string;
  content: string;
  mime_type?: string;
}

export interface DgiiConsulta {
  trackId?: string;
  codigo?: string;
  estado?: string;
  rnc?: string;
  encf?: string;
  fechaRecepcion?: string;
  mensajes?: Array<{ valor: string; codigo: number }>;
}

export interface EstadoResponse {
  factura_id: number;
  e_ncf?: string;
  track_id?: string;
  estado_dgii: string;
  consulta?: DgiiConsulta;
}

function apiKeyHeaders(): RequestOptions {
  return {
    skipAuth: true,
    headers: { "X-API-KEY": authStorage.getToken() ?? "" },
  };
}

export const facturasApi = {
  list: (params?: PageQuery) =>
    apiClient.get<Factura[]>(
      `/facturas${buildQueryString({ ...params })}`,
      apiKeyHeaders(),
    ),

  byId: (id: number) =>
    apiClient.get<Factura>(
      `/facturas${buildQueryString({ id })}`,
      apiKeyHeaders(),
    ),

  create: (data: CreateFacturaPayload) =>
    apiClient.post<Factura>("/facturas", data, apiKeyHeaders()),

  update: (id: number, data: Partial<CreateFacturaPayload>) =>
    apiClient.put<Factura>(`/facturas/${id}`, data, apiKeyHeaders()),

  remove: (id: number) =>
    apiClient.delete<void>(`/facturas/${id}`, apiKeyHeaders()),

  preview: (data: PreviewFacturaPayload) =>
    apiClient.post<PdfResponse>("/facturas/preview", data, apiKeyHeaders()),

  estado: (id: number) =>
    apiClient.get<EstadoResponse>(`/facturas/${id}/estado`, apiKeyHeaders()),

  xml: (id: number, rfce = false) => {
    const qs = buildQueryString({ format: "base64", type: rfce ? "rfce" : undefined });
    return apiClient.get<PdfResponse>(`/facturas/${id}/xml${qs}`, apiKeyHeaders());
  },

  pdf: async (id: number): Promise<PdfResponse> => {
    const token = authStorage.getToken();
    const res = await fetch(`${API_BASE_URL}/facturas/${id}/pdf?format=base64`, {
      method: "GET",
      headers: { "X-API-KEY": token ?? "" },
    });
    return res.json();
  },
};
