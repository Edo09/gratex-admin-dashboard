import { apiClient, buildQueryString } from "@/shared/api/client";
import { authStorage } from "@/shared/api/storage";
import type { PageQuery, RequestOptions } from "@/shared/api/types";
import type { Factura } from "@/features/facturas/types";
import type { PdfResponse } from "@/features/facturas/api/facturas";
import type { CreateFacturaSimplePayload } from "../types";

function apiKeyHeaders(): RequestOptions {
  return {
    skipAuth: true,
    headers: { "X-API-KEY": authStorage.getToken() ?? "" },
  };
}

export const facturasSimplesApi = {
  list: (params?: PageQuery) =>
    apiClient.get<Factura[]>(
      `/facturas-simples${buildQueryString({ ...params })}`,
      apiKeyHeaders(),
    ),

  byId: (id: number) =>
    apiClient.get<Factura>(`/facturas-simples/${id}`, apiKeyHeaders()),

  create: (data: CreateFacturaSimplePayload) =>
    apiClient.post<Factura>("/facturas-simples", data, apiKeyHeaders()),

  /** PDF previo sin guardar. Mismo body que create. */
  preview: (data: CreateFacturaSimplePayload) =>
    apiClient.post<PdfResponse>("/facturas-simples/preview", data, apiKeyHeaders()),

  remove: (id: number) =>
    apiClient.delete<void>(`/facturas-simples/${id}`, apiKeyHeaders()),
};
