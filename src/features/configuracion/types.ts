export interface CarouselItem {
  id: number;
  title: string;
  subtitle: string;
  image_path: string;
}

export interface ServiceItem {
  id: number;
  title: string;
  description: string;
  image_path: string;
}

export type LandingTab = "carousel" | "services";

export interface CarouselFormState {
  title: string;
  subtitle: string;
  image: File | null;
}

export interface ServiceFormState {
  title: string;
  description: string;
  image: File | null;
}
