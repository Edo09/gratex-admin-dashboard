import { useQuery } from "@tanstack/react-query";
import { clientesApi } from "../api/clientes";
import { unwrapList } from "@/shared/api/envelope";
import type { Cliente } from "../types";

interface UseClientesQueryParams {
  query?: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useClientesQuery({ query = "", page, pageSize, enabled }: UseClientesQueryParams = {}) {
  return useQuery({
    queryKey: ["clientes", query, page, pageSize],
    queryFn: async () => {
      const response = await clientesApi.list({ query, page, pageSize });
      return unwrapList<Cliente>(response);
    },
    enabled,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useClienteByIdQuery(id: number | null) {
  return useQuery({
    queryKey: ["clientes", "detail", id],
    queryFn: async () => {
      if (id == null) return null;
      const response = await clientesApi.byId(id);
      const data = response.data;

      if (Array.isArray(data)) {
        return (data as Cliente[]).find((c) => c.id == id) ?? data[0] ?? null;
      }
      if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: Cliente[] }).data)) {
        const list = (data as { data: Cliente[] }).data;
        return list.find((c) => c.id == id) ?? list[0] ?? null;
      }
      return (data as Cliente | null) ?? null;
    },
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  });
}
