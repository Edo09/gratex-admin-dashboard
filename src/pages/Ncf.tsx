import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import { useAuth } from "../context/AuthContext";

export default function Ncf() {
    const { token } = useAuth();
    const [currentSequence, setCurrentSequence] = useState<number | null>(null);
    const [prefix, setPrefix] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [newValue, setNewValue] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchSequence = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ncf/sequence`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.status && data.data) {
                setCurrentSequence(data.data.current_value);
                setPrefix(data.data.type);
                setDescription(data.data.description);
                setNewValue(data.data.current_value.toString());
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to fetch NCF sequence' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSequence();
    }, [token]);

    const handleUpdate = async () => {
        try {
            setIsUpdating(true);
            setMessage(null);
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ncf/sequence`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ current_value: parseInt(newValue) })
            });
            const data = await res.json();
            if (data.status) {
                setMessage({ type: 'success', text: 'NCF Sequence updated successfully' });
                fetchSequence();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error occurred' });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div>
            <PageMeta
                title="NCF Configuration"
                description="Manage NCF Sequences"
            />
            <PageBreadcrumb pageTitle="NCF Configuration" />
            <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
                <div className="mx-auto w-full max-w-[630px]">
                    <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl text-center">
                        Secuencia de Comprobantes Fiscales
                    </h3>

                    <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 sm:text-base text-center">
                        Configure la secuencia actual de su NCF.
                    </p>

                    {isLoading ? (
                        <div className="text-center py-10">Cargando...</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-4">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo de Comprobante</span>
                                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                                        {prefix} - {description}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Valor Actual en Base de Datos</span>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {currentSequence}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Próximo NCF a generar: {prefix}{String((currentSequence || 0) + 1).padStart(8, '0')}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Actualizar Secuencia Manualmente</h4>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="sequence">Nueva Secuencia Actual</Label>
                                        <Input
                                            type="number"
                                            id="sequence"
                                            placeholder="Enter new sequence number"
                                            value={newValue}
                                            onChange={(e) => setNewValue(e.target.value)}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Advertencia: Cambiar esto afectará la generación de futuros comprobantes.
                                        </p>
                                    </div>

                                    {message && (
                                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <Button
                                        variant="primary"
                                        className="w-full justify-center"
                                        onClick={handleUpdate}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? 'Guardando...' : 'Actualizar Secuencia'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
