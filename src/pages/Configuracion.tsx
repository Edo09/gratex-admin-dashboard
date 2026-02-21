import React, { useState, useEffect } from "react";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
// import { useAuth } from "../context/AuthContext";

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

export default function Configuracion() {
    const [activeTab, setActiveTab] = useState<"carousel" | "services">("carousel");
    const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    // const { token } = useAuth(); // If needed for authenticated requests

    // Form states
    const [carouselForm, setCarouselForm] = useState({ title: "", subtitle: "", image: null as File | null });
    const [serviceForm, setServiceForm] = useState({ title: "", description: "", image: null as File | null });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const endpoint = activeTab === "carousel" ? "/api/landing/carousel" : "/api/landing/services";
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
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "carousel" | "service") => {
        if (e.target.files && e.target.files[0]) {
            if (type === "carousel") {
                setCarouselForm(prev => ({ ...prev, image: e.target.files![0] }));
            } else {
                setServiceForm(prev => ({ ...prev, image: e.target.files![0] }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent, type: "carousel" | "service") => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData();
        const endpoint = type === "carousel" ? "/api/landing/carousel" : "/api/landing/services";

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
                body: formData, // No need for Content-Type header with FormData
            });

            const result = await response.json();
            if (result.success) {
                // Reset forms
                setCarouselForm({ title: "", subtitle: "", image: null });
                setServiceForm({ title: "", description: "", image: null });
                // Refresh list
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
            const endpoint = type === "carousel" ? "/api/landing/carousel" : "/api/landing/services";
            const response = await fetch(`${API_Base}${endpoint}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id })
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

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Configuración Landing Page
                </h3>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab("carousel")}
                                className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === "carousel"
                                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                                    : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                                    }`}
                            >
                                Carousel (Slider)
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                onClick={() => setActiveTab("services")}
                                className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === "services"
                                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                                    : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                                    }`}
                            >
                                Servicios
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Carousel Section */}
                {activeTab === "carousel" && (
                    <div className="space-y-6">
                        <div className="p-4 border rounded-lg dark:border-gray-700">
                            <h4 className="mb-3 text-md font-semibold dark:text-white">Agregar Nuevo Slide (1366x600)</h4>
                            <form onSubmit={(e) => handleSubmit(e, "carousel")} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Título</Label>
                                        <Input
                                            type="text"
                                            value={carouselForm.title}
                                            onChange={(e) => setCarouselForm({ ...carouselForm, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Subtítulo</Label>
                                        <Input
                                            type="text"
                                            value={carouselForm.subtitle}
                                            onChange={(e) => setCarouselForm({ ...carouselForm, subtitle: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Imagen (1366x600 px)</Label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, "carousel")}
                                        required
                                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Imágenes se guardan en backend.</p>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={uploading}>
                                        {uploading ? "Subiendo..." : "Agregar al Carousel"}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {isLoading ? (
                                <p>Cargando...</p>
                            ) : (
                                carouselItems.map((item) => (
                                    <div key={item.id} className="relative group overflow-hidden rounded-lg border dark:border-gray-700">
                                        <img
                                            src={`${API_Base}/${item.image_path}`}
                                            alt={item.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-4 bg-white dark:bg-gray-800">
                                            <h5 className="font-bold text-gray-900 dark:text-white">{item.title}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                                            <button
                                                onClick={() => handleDelete(item.id, "carousel")}
                                                className="mt-3 px-3 py-1 text-xs text-red-600 border border-red-600 rounded hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Services Section */}
                {activeTab === "services" && (
                    <div className="space-y-6">
                        <div className="p-4 border rounded-lg dark:border-gray-700">
                            <h4 className="mb-3 text-md font-semibold dark:text-white">Agregar Nuevo Servicio</h4>
                            <form onSubmit={(e) => handleSubmit(e, "service")} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Título del Servicio</Label>
                                        <Input
                                            type="text"
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
                                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label>Imagen (400x400 px)</Label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, "service")}
                                        required
                                        className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Imágenes se guardan en backend.</p>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={uploading}>
                                        {uploading ? "Subiendo..." : "Agregar Servicio"}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {isLoading ? (
                                <p>Cargando...</p>
                            ) : (
                                services.map((item) => (
                                    <div key={item.id} className="relative group overflow-hidden rounded-lg border dark:border-gray-700">
                                        <img
                                            src={`${API_Base}/${item.image_path}`}
                                            alt={item.title}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-4 bg-white dark:bg-gray-800">
                                            <h5 className="font-bold text-gray-900 dark:text-white">{item.title}</h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-ellipsis overflow-hidden line-clamp-3">{item.description}</p>
                                            <button
                                                onClick={() => handleDelete(item.id, "service")}
                                                className="mt-3 px-3 py-1 text-xs text-red-600 border border-red-600 rounded hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
