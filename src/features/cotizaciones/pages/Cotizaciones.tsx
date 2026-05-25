import { useState } from "react";
import { PageBreadcrumb } from "@/shared/components/layout/PageBreadcrumb";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { ListToolbar } from "@/shared/components/data/ListToolbar";
import { DataCardList } from "@/shared/components/data/DataCardList";
import { DataTable } from "@/shared/components/data/DataTable";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useCotizacionesQuery } from "../hooks/useCotizacionesQuery";
import { cotizacionToRowMapper, rowToDataListRow } from "../mappers";
import { CotizacionFormModal } from "../components/CotizacionFormModal";
import type { DataListRow } from "@/shared/components/data/useDataListController";

export default function Cotizaciones() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading, error } = useCotizacionesQuery({
    query: debouncedQuery,
    page,
    pageSize,
  });
  const items = data?.items ?? [];
  const total = data?.pagination?.total ?? items.length;

  const rows = items.map((item, idx) => rowToDataListRow(cotizacionToRowMapper(item, idx)));

  const handleRowClick = (row: DataListRow) => {
    setEditingId(row.id);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setIsFormOpen(true);
  };

  const tableProps = {
    dataKind: "cotizaciones" as const,
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
    onRowClick: handleRowClick,
  };

  return (
    <div>
      <PageMeta title="Gratex Dashboard" description="Pagina para gestionar las cotizaciones" />
      <PageBreadcrumb pageTitle="Cotizaciones" />

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar por fecha, código, cliente o descripción..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        primaryActionLabel="Crear Cotización"
        onPrimaryAction={handleCreate}
      />

      <CotizacionFormModal
        isOpen={isFormOpen}
        editingId={editingId}
        onClose={() => setIsFormOpen(false)}
      />

      {viewMode === "cards" ? <DataCardList {...tableProps} /> : <DataTable {...tableProps} />}
    </div>
  );
}
