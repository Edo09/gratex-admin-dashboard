import React, { useState, useEffect, useCallback, useRef } from "react";
import PageMeta from "../components/common/PageMeta";
import Input from "../components/form/InputField";
import Label from "../components/form/Label";

// Interfaces
interface CarouselItem {
    id: number;
    title: string;
    subtitle: string;
    image_path: string;
}

interface ServiceItem {
    id: number;
    title: string;
    description: string;
    image_path: string;
}

const API_Base = import.meta.env.VITE_API_URL;

// --- Reusable sub-components ---

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${active
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function FileDropZone({
    onFileSelect,
    file,
    accept = "image/*",
    dimensions,
}: {
    onFileSelect: (file: File) => void;
    file: File | null;
    accept?: string;
    dimensions: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const preview = file ? URL.createObjectURL(file) : null;

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.[0]) onFileSelect(e.dataTransfer.files[0]);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${dragOver
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : file
                    ? "border-green-400 bg-green-50/50 dark:border-green-600 dark:bg-green-900/10"
                    : "border-gray-300 bg-gray-50/50 hover:border-brand-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-white/[0.02] dark:hover:border-brand-600 dark:hover:bg-white/[0.04]"
                }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={(e) => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]); }}
                className="hidden"
            />

            {preview ? (
                <div className="flex items-center gap-4 p-4">
                    <img src={preview} alt="Preview" className="h-20 w-28 rounded-lg object-cover shadow-sm" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/80">{file?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{(file!.size / 1024).toFixed(1)} KB</p>
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ Listo para subir</p>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (inputRef.current) inputRef.current.value = "";
                            onFileSelect(null as unknown as File);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="mb-3 rounded-full bg-brand-50 p-3 dark:bg-brand-500/10">
                        <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Arrastra una imagen o <span className="text-brand-500">haz clic aquí</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WebP · {dimensions}</p>
                </div>
            )}
        </div>
    );
}

function ItemCard({
    imageSrc,
    title,
    subtitle,
    onDelete,
}: {
    imageSrc: string;
    title: string;
    subtitle: string;
    onDelete: () => void;
}) {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700/60 dark:bg-white/[0.03]">
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={imageSrc}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Delete overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-transform hover:bg-red-600 active:scale-95"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Eliminar
                    </button>
                </div>
            </div>
            <div className="p-4">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h5>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700">
            <div className="mb-3 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <>
            {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                    <div className="space-y-2 p-4">
                        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                </div>
            ))}
        </>
    );
}

// --- Main component ---

export default function Configuracion() {
    const [activeTab, setActiveTab] = useState<"carousel" | "services">("carousel");
    const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form states
    const [carouselForm, setCarouselForm] = useState({ title: "", subtitle: "", image: null as File | null });
    const [serviceForm, setServiceForm] = useState({ title: "", description: "", image: null as File | null });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const endpoint = activeTab === "carousel" ? "/landing/carousel" : "/landing/services";
            const response = await fetch(`${API_Base}${endpoint}`);
            const data = await response.json();

            if (data.success) {
                if (activeTab === "carousel") {
                    setCarouselItems(data.data);
                } else {
                    setServices(data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent, type: "carousel" | "service") => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        const endpoint = type === "carousel" ? "/landing/carousel" : "/landing/services";

        if (type === "carousel") {
            formData.append("title", carouselForm.title);
            formData.append("subtitle", carouselForm.subtitle);
            if (carouselForm.image) formData.append("image", carouselForm.image);
        } else {
            formData.append("title", serviceForm.title);
            formData.append("description", serviceForm.description);
            if (serviceForm.image) formData.append("image", serviceForm.image);
        }

        try {
            const response = await fetch(`${API_Base}${endpoint}`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                setCarouselForm({ title: "", subtitle: "", image: null });
                setServiceForm({ title: "", description: "", image: null });
                fetchData();
                alert("Agregado exitosamente");
            } else {
                alert("Error: " + result.error);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error al enviar configuración");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number, type: "carousel" | "service") => {
        if (!confirm("¿Estás seguro de eliminar este item?")) return;

        try {
            const endpoint = type === "carousel" ? "/landing/carousel" : "/landing/services";
            const response = await fetch(`${API_Base}${endpoint}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            const result = await response.json();
            if (result.success) {
                fetchData();
            } else {
                alert("Error al eliminar");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    return (
        <>
            <PageMeta
                title="Configuración Landing Page | Admin Dashboard"
                description="Panel de configuración para la Landing Page"
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Configuración Landing
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Gestiona el contenido del carousel y servicios de tu landing page.
                        </p>
                    </div>

                    {/* Pill Tabs */}
                    <div className="inline-flex gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
                        <TabButton
                            active={activeTab === "carousel"}
                            onClick={() => setActiveTab("carousel")}
                            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                            label="Carousel"
                        />
                        <TabButton
                            active={activeTab === "services"}
                            onClick={() => setActiveTab("services")}
                            icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                            label="Servicios"
                        />
                    </div>
                </div>

                {/* Carousel Tab */}
                {activeTab === "carousel" && (
                    <>
                        {/* Add Form Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                                    <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Nuevo Slide</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Tamaño recomendado: 1366 × 600 px</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => handleSubmit(e, "carousel")} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Título</Label>
                                        <Input
                                            type="text"
                                            placeholder="Ej: Bienvenidos a Gratex"
                                            value={carouselForm.title}
                                            onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Subtítulo</Label>
                                        <Input
                                            type="text"
                                            placeholder="Ej: Soluciones industriales"
                                            value={carouselForm.subtitle}
                                            onChange={(e) => setCarouselForm({ ...carouselForm, subtitle: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Imagen</Label>
                                    <FileDropZone
                                        file={carouselForm.image}
                                        onFileSelect={(f) => setCarouselForm((prev) => ({ ...prev, image: f }))}
                                        dimensions="1366 × 600 px"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={uploading || !carouselForm.image}
                                        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Subiendo…
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                Agregar Slide
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Items Grid */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Slides actuales
                                    {!isLoading && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                            {carouselItems.length}
                                        </span>
                                    )}
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {isLoading ? (
                                    <LoadingSkeleton />
                                ) : carouselItems.length === 0 ? (
                                    <EmptyState message="No hay slides en el carousel. Agrega el primero arriba." />
                                ) : (
                                    carouselItems.map((item) => (
                                        <ItemCard
                                            key={item.id}
                                            imageSrc={`${API_Base}/${item.image_path}`}
                                            title={item.title}
                                            subtitle={item.subtitle}
                                            onDelete={() => handleDelete(item.id, "carousel")}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Services Tab */}
                {activeTab === "services" && (
                    <>
                        {/* Add Form Card */}
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-500/10">
                                    <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Nuevo Servicio</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Imagen recomendada: 400 × 400 px</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => handleSubmit(e, "service")} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Título del Servicio</Label>
                                        <Input
                                            type="text"
                                            placeholder="Ej: Impresión Digital"
                                            value={serviceForm.title}
                                            onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Descripción</Label>
                                        <textarea
                                            value={serviceForm.description}
                                            onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
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
                                        file={serviceForm.image}
                                        onFileSelect={(f) => setServiceForm((prev) => ({ ...prev, image: f }))}
                                        dimensions="400 × 400 px"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={uploading || !serviceForm.image}
                                        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                Subiendo…
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                Agregar Servicio
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Items Grid */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Servicios actuales
                                    {!isLoading && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                            {services.length}
                                        </span>
                                    )}
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {isLoading ? (
                                    <LoadingSkeleton />
                                ) : services.length === 0 ? (
                                    <EmptyState message="No hay servicios registrados. Agrega el primero arriba." />
                                ) : (
                                    services.map((item) => (
                                        <ItemCard
                                            key={item.id}
                                            imageSrc={`${API_Base}/${item.image_path}`}
                                            title={item.title}
                                            subtitle={item.description}
                                            onDelete={() => handleDelete(item.id, "service")}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
