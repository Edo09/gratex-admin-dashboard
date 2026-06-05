import { useQuery } from "@tanstack/react-query";
import { unwrapList } from "@/shared/api/envelope";
import { aprobarEcfApi } from "../api/aprobarEcf";
import type { EcfRecibido } from "../types";

interface UseEcfRecibidosParams {
  page?: number;
  pageSize?: number;
}

export function useEcfRecibidosQuery({ page, pageSize }: UseEcfRecibidosParams = {}) {
  return useQuery({
    queryKey: ["ecf-recibidos", page, pageSize],
    queryFn: async () => unwrapList<EcfRecibido>(await aprobarEcfApi.list({ page, pageSize })),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}
