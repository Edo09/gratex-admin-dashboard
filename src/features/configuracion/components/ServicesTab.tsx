import { useState, type FormEvent } from "react";
import { API_BASE_URL } from "@/shared/api/client";
import { Label } from "@/shared/components/ui/Label";
import { InputField } from "@/shared/components/ui/InputField";
import { FileDropZone } from "./FileDropZone";
import { ItemCard, ItemEmptyState, ItemLoadingSkeleton } from "./ItemCard";
import { useServiceItemsQuery, useCreateServiceItem, useDeleteLandingItem } from "../hooks/useLandingItems";
import type { ServiceFormState } from "../types";

const EMPTY: ServiceFormState = { title: "", description: "", image: null };

export function ServicesTab() {
  const { data: items = [], isLoading } = useServiceItemsQuery();
  const createMutation = useCreateServiceItem();
  const deleteMutation = useDeleteLandingItem("services");
  const [form, setForm] = useState<ServiceFormState>(EMPTY);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.image) return;
    const result = await createMutation.mutateAsync({
      title: form.title,
      description: form.description,
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Nuevo Servicio</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">Imagen recomendada: 400 × 400 px</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Título del Servicio</Label>
              <InputField
                type="text"
                placeholder="Ej: Impresión Digital"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={3}
                placeholder="Describe brevemente el servicio…"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                style={{ height: "auto", minHeight: "88px" }}
              />
            </div>
          </div>

          <div>
            <Label>Imagen</Label>
            <FileDropZone
              file={form.image}
              onFileSelect={(f) => setForm((prev) => ({ ...prev, image: f }))}
              dimensions="400 × 400 px"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !form.image}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createMutation.isPending ? "Subiendo…" : "Agregar Servicio"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Servicios actuales
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
            <ItemEmptyState message="No hay servicios registrados. Agrega el primero arriba." />
          ) : (
            items.map((item) => (
              <ItemCard
                key={item.id}
                imageSrc={`${API_BASE_URL}/${item.image_path}`}
                title={item.title}
                subtitle={item.description}
                onDelete={() => handleDelete(item.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
