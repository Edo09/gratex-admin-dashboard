import { apiClient, buildQueryString, API_BASE_URL } from "@/shared/api/client";
import { authStorage } from "@/shared/api/storage";
import type { PageQuery } from "@/shared/api/types";
import type {
  Cotizacion,
  CreateCotizacionPayload,
  PreviewCotizacionPayload,
} from "../types";
import type { PdfResponse } from "@/features/facturas/api/facturas";

interface CreateResponse {
  id: number;
  code: string;
  message: string;
}

export const cotizacionesApi = {
  list: (params?: PageQuery) =>
    apiClient.get<Cotizacion[]>(`/cotizaciones${buildQueryString({ ...params })}`),

  byId: (id: number) => apiClient.get<Cotizacion>(`/cotizaciones?id=${id}`),

  create: (data: CreateCotizacionPayload) =>
    apiClient.post<CreateResponse>("/cotizaciones", data),

  update: (data: CreateCotizacionPayload & { id: number }) =>
    apiClient.put<CreateResponse>("/cotizaciones", data),

  remove: (id: number) => apiClient.delete<void>(`/cotizaciones/${id}`),

  preview: (data: PreviewCotizacionPayload) =>
    apiClient.post<PdfResponse & { id?: number; code?: string; message?: string; pdf?: string }>(
      "/cotizaciones/preview",
      data,
    ),

  /** PDF endpoint authenticates via X-API-KEY (per backend) — not the bearer token. */
  pdf: async (id: number): Promise<PdfResponse> => {
    const token = authStorage.getToken();
    const res = await fetch(`${API_BASE_URL}/cotizaciones/${id}/pdf?format=base64`, {
      method: "GET",
      headers: { "X-API-KEY": token ?? "" },
    });
    return res.json();
  },
};
