import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { landingApi } from "../api/landing";
import type { CarouselItem, ServiceItem } from "../types";

export function useCarouselItemsQuery() {
  return useQuery({
    queryKey: ["landing", "carousel"],
    queryFn: () => landingApi.list<CarouselItem>("carousel"),
  });
}

export function useServiceItemsQuery() {
  return useQuery({
    queryKey: ["landing", "services"],
    queryFn: () => landingApi.list<ServiceItem>("services"),
  });
}

export function useCreateCarouselItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; subtitle: string; image: File }) =>
      landingApi.create("carousel", { title: input.title, subtitle: input.subtitle }, input.image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landing", "carousel"] }),
  });
}

export function useCreateServiceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description: string; image: File }) =>
      landingApi.create("services", { title: input.title, description: input.description }, input.image),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landing", "services"] }),
  });
}

export function useDeleteLandingItem(kind: "carousel" | "services") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => landingApi.remove(kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["landing", kind] }),
  });
}
