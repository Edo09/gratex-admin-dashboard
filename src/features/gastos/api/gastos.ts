import { apiClient, buildQueryString } from "@/shared/api/client";
import { authStorage } from "@/shared/api/storage";
import type { PageQuery, RequestOptions } from "@/shared/api/types";
import type { CreateGastoPayload, Gasto, GastoCategoria } from "../types";

/** Cliente propio: auth por `X-API-KEY` (no Bearer). */
function apiKeyHeaders(): RequestOptions {
  return {
    skipAuth: true,
    headers: { "X-API-KEY": authStorage.getToken() ?? "" },
  };
}

export interface GastoListParams extends PageQuery {
  categoria?: GastoCategoria;
}

export const gastosApi = {
  list: (params?: GastoListParams) =>
    apiClient.get<Gasto[]>(`/gastos${buildQueryString({ ...params })}`, apiKeyHeaders()),

  byId: (id: number) => apiClient.get<Gasto>(`/gastos/${id}`, apiKeyHeaders()),

  /** Consulta el estado del e-CF en DGII (solo auto-emisión) y actualiza el registro. */
  estado: (id: number) => apiClient.get<Gasto>(`/gastos/${id}/estado`, apiKeyHeaders()),

  create: (data: CreateGastoPayload) =>
    apiClient.post<Gasto>("/gastos", data, apiKeyHeaders()),
};
