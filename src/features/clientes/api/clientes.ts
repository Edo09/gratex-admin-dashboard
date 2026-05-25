import { apiClient, buildQueryString } from "@/shared/api/client";
import type { PageQuery } from "@/shared/api/types";
import type { Cliente, CreateClienteInput } from "../types";

export const clientesApi = {
  list: (params?: PageQuery) =>
    apiClient.get<Cliente[]>(`/clients${buildQueryString({ ...params })}`),

  byId: (id: number) => apiClient.get<Cliente>(`/clients?id=${id}`),

  create: (data: CreateClienteInput) => apiClient.post<Cliente | string>("/clients", data),

  update: (id: number, data: Partial<CreateClienteInput>) =>
    apiClient.put<Cliente>(`/clients/${id}`, data),

  remove: (id: number) => apiClient.delete<void>(`/clients/${id}`),
};
