import { useState, type FormEvent } from "react";
import { API_BASE_URL } from "@/shared/api/client";
import { Label } from "@/shared/components/ui/Label";
import { InputField } from "@/shared/components/ui/InputField";
import { FileDropZone } from "./FileDropZone";
import { ItemCard, ItemEmptyState, ItemLoadingSkeleton } from "./ItemCard";
import { useCarouselItemsQuery, useCreateCarouselItem, useDeleteLandingItem } from "../hooks/useLandingItems";
import type { CarouselFormState } from "../types";

const EMPTY: CarouselFormState = { title: "", subtitle: "", image: null };

export function CarouselTab() {
  const { data: items = [], isLoading } = useCarouselItemsQuery();
  const createMutation = useCreateCarouselItem();
  const deleteMutation = useDeleteLandingItem("carousel");
  const [form, setForm] = useState<CarouselFormState>(EMPTY);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.image) return;
    const result = await createMutation.mutateAsync({
      title: form.title,
      subtitle: form.subtitle,
      image: form.image,
    });
    if (result.success) {
      setForm(EMPTY);
      alert("Agregado exitosamente");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este item?")) return;
    const result = await deleteMutation.mutateAsync(id);
    if (!result.success) alert("Error al eliminar");
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
            <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Nuevo Slide</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tamaño recomendado: 1366 × 600 px</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Título</Label>
              <InputField
                type="text"
                placeholder="Ej: Bienvenidos a Gratex"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <InputField
                type="text"
                placeholder="Ej: Soluciones industriales"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>Imagen</Label>
            <FileDropZone
              file={form.image}
              onFileSelect={(f) => setForm((prev) => ({ ...prev, image: f }))}
              dimensions="1366 × 600 px"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !form.image}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? "Subiendo…" : "Agregar Slide"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Slides actuales
            {!isLoading && (
              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {items.length}
              </span>
            )}
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <ItemLoadingSkeleton />
          ) : items.length === 0 ? (
            <ItemEmptyState message="No hay slides en el carousel. Agrega el primero arriba." />
          ) : (
            items.map((item) => (
              <ItemCard
                key={item.id}
                imageSrc={`${API_BASE_URL}/${item.image_path}`}
                title={item.title}
                subtitle={item.subtitle}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
