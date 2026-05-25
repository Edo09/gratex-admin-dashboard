import { useEffect, useState } from "react";
import { PageBreadcrumb } from "@/shared/components/layout/PageBreadcrumb";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import Button from "@/shared/components/ui/Button";
import { InputField } from "@/shared/components/ui/InputField";
import { Label } from "@/shared/components/ui/Label";
import { useNcfSequenceQuery, useUpdateNcfSequence } from "../hooks/useNcf";

export default function Ncf() {
  const { data: sequence, isLoading, refetch } = useNcfSequenceQuery();
  const updateMutation = useUpdateNcfSequence();
  const [newValue, setNewValue] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (sequence) setNewValue(sequence.current_value.toString());
  }, [sequence]);

  const handleUpdate = async () => {
    setMessage(null);
    try {
      await updateMutation.mutateAsync(parseInt(newValue));
      setMessage({ type: "success", text: "NCF Sequence updated successfully" });
      refetch();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Network error occurred",
      });
    }
  };

  return (
    <div>
      <PageMeta title="NCF Configuration" description="Manage NCF Sequences" />
      <PageBreadcrumb pageTitle="NCF Configuration" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px]">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl text-center">
            Secuencia de Comprobantes Fiscales
          </h3>
          <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 sm:text-base text-center">
            Configure la secuencia actual de su NCF.
          </p>

          {isLoading || !sequence ? (
            <div className="text-center py-10">Cargando...</div>
          ) : (
            <div className="space-y-6">
              <CurrentSequenceCard
                type={sequence.type}
                description={sequence.description}
                currentValue={sequence.current_value}
              />

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Actualizar Secuencia Manualmente
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sequence">Nueva Secuencia Actual</Label>
                    <InputField
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
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        message.type === "success"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {message.text}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Guardando..." : "Actualizar Secuencia"}
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

function CurrentSequenceCard({
  type,
  description,
  currentValue,
}: {
  type: string;
  description: string;
  currentValue: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Tipo de Comprobante
        </span>
        <div className="text-lg font-medium text-gray-900 dark:text-white">
          {type} - {description}
        </div>
      </div>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Valor Actual en Base de Datos
        </span>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{currentValue}</div>
        <div className="text-sm text-gray-500 mt-1">
          Próximo NCF a generar: {type}
          {String(currentValue + 1).padStart(8, "0")}
        </div>
      </div>
    </div>
  );
}
