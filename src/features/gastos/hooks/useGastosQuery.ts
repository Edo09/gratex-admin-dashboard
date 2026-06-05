import { useQuery } from "@tanstack/react-query";
import { unwrapList, unwrapOne } from "@/shared/api/envelope";
import { gastosApi } from "../api/gastos";
import type { Gasto, GastoCategoria } from "../types";

interface UseGastosQueryParams {
  query?: string;
  page?: number;
  pageSize?: number;
  categoria?: GastoCategoria;
}

export function useGastosQuery({ query = "", page, pageSize, categoria }: UseGastosQueryParams = {}) {
  return useQuery({
    queryKey: ["gastos", query, page, pageSize, categoria],
    queryFn: async () => unwrapList<Gasto>(await gastosApi.list({ query, page, pageSize, categoria })),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useGastoByIdQuery(id: number | null) {
  return useQuery({
    queryKey: ["gastos", "detail", id],
    queryFn: async () => {
      if (id == null) return null;
      const response = await gastosApi.byId(id);
      return unwrapOne<Gasto>(response, id);
    },
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  });
}
