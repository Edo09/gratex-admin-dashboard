import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/shared/components/ui/Modal";
import Button from "@/shared/components/ui/Button";
import { DataTable } from "@/shared/components/data/DataTable";
import { facturasApi } from "@/features/facturas/api/facturas";
import { cotizacionesApi } from "@/features/cotizaciones/api/cotizaciones";
import { unwrapList } from "@/shared/api/envelope";
import { formatCurrency } from "@/shared/utils/format";
import { getClientDisplayName, getClientPhone, type Cliente } from "../types";
import type { Factura } from "@/features/facturas/types";
import type { Cotizacion } from "@/features/cotizaciones/types";
import type { DataListRow } from "@/shared/components/data/useDataListController";

interface ClienteDetailsModalProps {
  cliente: Cliente | null;
  onClose: () => void;
}

type Tab = "facturas" | "cotizaciones";

export function ClienteDetailsModal({ cliente, onClose }: ClienteDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("facturas");

  const searchQuery = cliente?.rnc || (cliente ? getClientDisplayName(cliente) : "");

  const { data: facturasResult, isLoading: loadingFacturas, error: errorFacturas } = useQuery({
    queryKey: ["facturas", searchQuery],
    queryFn: async () => unwrapList<Factura>(await facturasApi.list({ query: searchQuery })),
    enabled: !!cliente && !!searchQuery && activeTab === "facturas",
    staleTime: 5 * 60 * 1000,
  });

  const { data: cotizacionesResult, isLoading: loadingCotizaciones, error: errorCotizaciones } = useQuery({
    queryKey: ["cotizaciones", searchQuery],
    queryFn: async () => unwrapList<Cotizacion>(await cotizacionesApi.list({ query: searchQuery })),
    enabled: !!cliente && !!searchQuery && activeTab === "cotizaciones",
    staleTime: 5 * 60 * 1000,
  });

  const facturaRows: DataListRow[] = (facturasResult?.items ?? []).map((item, idx) => ({
    id: item.id ?? idx + 1,
    no_factura: item.no_factura ?? "",
    date: item.date ?? "",
    client_name: item.client_name ?? "",
    company_name: item.company_name ?? "",
    total: String(item.total ?? ""),
    ncf: item.NCF ?? "",
    description: item.description ?? "",
    amount: formatCurrency((item.amount ?? item.total ?? 0) as number | string).replace("$", ""),
  }));

  const cotizacionRows: DataListRow[] = (cotizacionesResult?.items ?? []).map((item, idx) => ({
    id: item.id ?? idx + 1,
    code: item.code ?? "",
    date: item.date ?? "",
    client: item.client_name ?? "",
    company_name: item.company_name ?? "",
    description: item.description ?? "",
    total: formatCurrency(item.total as number | string).replace("$", ""),
    amount: formatCurrency(item.total as number | string).replace("$", ""),
  }));

  if (!cliente) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="max-w-6xl w-full p-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      showCloseButton={false}
    >
      <Header cliente={cliente} onClose={onClose} />

      <div className="p-6 overflow-y-auto max-h-[80vh] bg-gray-50 dark:bg-gray-800">
        <GeneralInfoCard cliente={cliente} />

        <div className="mb-4 space-x-2">
          <Button variant={activeTab === "facturas" ? "primary" : "outline"} onClick={() => setActiveTab("facturas")}>
            Facturas
          </Button>
          <Button variant={activeTab === "cotizaciones" ? "primary" : "outline"} onClick={() => setActiveTab("cotizaciones")}>
            Cotizaciones
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {activeTab === "facturas" ? (
            <DataTable
              dataKind="facturas"
              rows={facturaRows}
              loading={loadingFacturas}
              error={errorFacturas ? String(errorFacturas) : undefined}
              pagination="client"
            />
          ) : (
            <DataTable
              dataKind="cotizaciones"
              rows={cotizacionRows}
              loading={loadingCotizaciones}
              error={errorCotizaciones ? String(errorCotizaciones) : undefined}
              pagination="client"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

function Header({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 border-b-2 border-blue-800 relative rounded-t-2xl">
      <h2 className="text-xl font-bold text-white">Detalles del Cliente</h2>
      <p className="text-blue-100 text-sm mt-0.5">
        {getClientDisplayName(cliente)} {cliente.company_name ? `(${cliente.company_name})` : ""}
      </p>
      <button onClick={onClose} className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-blue-200">
        ✕
      </button>
    </div>
  );
}

function GeneralInfoCard({ cliente }: { cliente: Cliente }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Información General</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCell label="RNC" value={cliente.rnc} />
        <InfoCell label="Email" value={cliente.email} />
        <InfoCell label="Teléfono" value={getClientPhone(cliente)} />
        <InfoCell label="Dirección" value={cliente.direccion} />
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-base font-medium text-gray-900 dark:text-white">{value ?? "—"}</div>
    </div>
  );
}
