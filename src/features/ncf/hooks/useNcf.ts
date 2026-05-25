import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ncfApi } from "../api/ncf";

export function useNcfSequenceQuery() {
  return useQuery({
    queryKey: ["ncf", "sequence"],
    queryFn: async () => {
      const response = await ncfApi.sequence();
      if (!response.status || !response.data) throw new Error("Failed to fetch NCF sequence");
      return response.data;
    },
  });
}

export function useUpdateNcfSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currentValue: number) => ncfApi.updateSequence(currentValue),
    onSuccess: (response) => {
      if (!response.status) throw new Error(response.error || "Failed to update");
      queryClient.invalidateQueries({ queryKey: ["ncf", "sequence"] });
    },
  });
}

/** Fetches the next NCF on demand. Returns "" if the request fails. */
export function useNextNcf() {
  const fetchNextNCF = useCallback(async (): Promise<string> => {
    try {
      const res = await ncfApi.next();
      if (res.status && res.data) return res.data;
    } catch (error) {
      console.error("Error fetching next NCF:", error);
    }
    return "";
  }, []);
  return { fetchNextNCF };
}
