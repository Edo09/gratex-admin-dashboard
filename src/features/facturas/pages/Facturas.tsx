import { useState } from "react";
import { PageBreadcrumb } from "@/shared/components/layout/PageBreadcrumb";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { ListToolbar } from "@/shared/components/data/ListToolbar";
import { DataCardList } from "@/shared/components/data/DataCardList";
import { DataTable } from "@/shared/components/data/DataTable";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useFacturasQuery } from "../hooks/useFacturasQuery";
import { facturaToRow, rowToDataListRow } from "../mappers";
import { FacturaCreateModal } from "../components/FacturaCreateModal";

export default function Facturas() {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading, error } = useFacturasQuery({ query: debouncedQuery, page, pageSize });
  const items = data?.items ?? [];
  const total = data?.pagination?.total ?? items.length;

  const rows = items.map((item, idx) => rowToDataListRow(facturaToRow(item, idx)));

  const tableProps = {
    dataKind: "facturas" as const,
    query: debouncedQuery,
    rows,
    loading: isLoading,
    error: error instanceof Error ? error.message : undefined,
    pagination: "server" as const,
    page,
    pageSize,
    total,
    onPageChange: setPage,
    onPageSizeChange: (s: number) => {
      setPageSize(s);
      setPage(1);
    },
  };

  return (
    <div>
      <PageMeta title="Gratex Dashboard" description="Pagina para gestionar las facturas" />
      <PageBreadcrumb pageTitle="Facturas" />

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar por fecha, código, cliente o descripción..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Crear Factura"
        onPrimaryAction={() => setIsCreateModalOpen(true)}
      />

      <FacturaCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setShowSuccessAlert(true);
          setTimeout(() => setShowSuccessAlert(false), 3500);
        }}
      />

      {showSuccessAlert && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-800 border border-green-200 text-sm">
          La factura ha sido creada correctamente.
        </div>
      )}

      {viewMode === "cards" ? <DataCardList {...tableProps} /> : <DataTable {...tableProps} />}
    </div>
  );
}
