import { apiClient, buildQueryString } from "@/shared/api/client";
import { authStorage } from "@/shared/api/storage";
import type { RequestOptions } from "@/shared/api/types";
import type { AprobacionPayload, AprobacionResult, EcfRecibido } from "../types";

interface ListParams {
  page?: number;
  pageSize?: number;
}

/** Cliente propio: auth por `X-API-KEY` (no Bearer). */
function apiKeyHeaders(): RequestOptions {
  return {
    skipAuth: true,
    headers: { "X-API-KEY": authStorage.getToken() ?? "" },
  };
}

export const aprobarEcfApi = {
  /** GET /ecf/recepcion — e-CF recibidos (lee de la DB local, no la DGII). */
  list: (params?: ListParams) =>
    apiClient.get<EcfRecibido[]>(
      `/ecf/recepcion${buildQueryString({ ...params })}`,
      apiKeyHeaders(),
    ),

  /** GET /ecf/recepcion/{trackId} — fila completa (sin xml_firmado). */
  byId: (trackId: string) =>
    apiClient.get<EcfRecibido>(`/ecf/recepcion/${trackId}`, apiKeyHeaders()),

  /** POST /aprobaciones-comerciales — arma/firma el ACECF y lo envía a la DGII. */
  aprobar: (data: AprobacionPayload) =>
    apiClient.post<AprobacionResult>("/aprobaciones-comerciales", data, apiKeyHeaders()),
};
