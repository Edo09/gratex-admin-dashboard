import { apiClient } from "@/shared/api/client";

export interface NcfSequence {
  type: string;
  description: string;
  current_value: number;
}

export const ncfApi = {
  sequence: () => apiClient.get<NcfSequence>("/ncf/sequence"),

  updateSequence: (currentValue: number) =>
    apiClient.put<NcfSequence>("/ncf/sequence", { current_value: currentValue }),

  next: () => apiClient.get<string>("/ncf/next"),
};
