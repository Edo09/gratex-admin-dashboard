import { apiClient, buildQueryString, API_BASE_URL } from "@/shared/api/client";
import { authStorage } from "@/shared/api/storage";
import type { PageQuery } from "@/shared/api/types";
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

export const facturasApi = {
  list: (params?: PageQuery) =>
    apiClient.get<Factura[]>(`/facturas${buildQueryString({ ...params })}`),

  byId: (id: number) => apiClient.get<Factura>(`/facturas/${id}`),

  create: (data: CreateFacturaPayload) => apiClient.post<Factura>("/facturas", data),

  update: (id: number, data: Partial<CreateFacturaPayload>) =>
    apiClient.put<Factura>(`/facturas/${id}`, data),

  remove: (id: number) => apiClient.delete<void>(`/facturas/${id}`),

  preview: (data: PreviewFacturaPayload) =>
    apiClient.post<PdfResponse>("/facturas/preview", data),

  /** PDF endpoint authenticates via X-API-KEY (per backend) — not the bearer token. */
  pdf: async (id: number): Promise<PdfResponse> => {
    const token = authStorage.getToken();
    const res = await fetch(`${API_BASE_URL}/facturas/${id}/pdf?format=base64`, {
      method: "GET",
      headers: { "X-API-KEY": token ?? "" },
    });
    return res.json();
  },
};
