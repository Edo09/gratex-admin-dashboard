import { API_BASE_URL } from "@/shared/api/client";
import type { CarouselItem, ServiceItem } from "../types";

interface LandingResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Landing-page settings (carousel + services) — uses multipart/form-data for
 * uploads, so we hit fetch directly instead of going through apiClient.
 */
export const landingApi = {
  list: async <T extends CarouselItem | ServiceItem>(kind: "carousel" | "services"): Promise<T[]> => {
    const res = await fetch(`${API_BASE_URL}/landing/${kind}`);
    const json: LandingResponse<T[]> = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  },

  create: async (
    kind: "carousel" | "services",
    fields: { title: string; subtitle?: string; description?: string },
    image: File,
  ): Promise<LandingResponse<unknown>> => {
    const formData = new FormData();
    formData.append("title", fields.title);
    if (fields.subtitle !== undefined) formData.append("subtitle", fields.subtitle);
    if (fields.description !== undefined) formData.append("description", fields.description);
    formData.append("image", image);

    const res = await fetch(`${API_BASE_URL}/landing/${kind}`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  remove: async (kind: "carousel" | "services", id: number): Promise<LandingResponse<unknown>> => {
    const res = await fetch(`${API_BASE_URL}/landing/${kind}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return res.json();
  },
};
