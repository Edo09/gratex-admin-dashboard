import { useState } from "react";
import { PageBreadcrumb } from "@/shared/components/layout/PageBreadcrumb";
import { PageMeta } from "@/shared/components/layout/PageMeta";
import { Alert } from "@/shared/components/ui/Alert";
import Button from "@/shared/components/ui/Button";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useClientesQuery } from "../hooks/useClientesQuery";
import { ClientesTable } from "../components/ClientesTable";
import { ClienteDetailsModal } from "../components/ClienteDetailsModal";
import { CreateClienteModal } from "../components/CreateClienteModal";
import type { Cliente } from "../types";

export default function Clientes() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const { data, isLoading, error } = useClientesQuery({ query: debouncedQuery, page, pageSize });
  const rows = data?.items ?? [];
  const total = data?.pagination?.total ?? rows.length;

  const handleCreateSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  return (
    <div>
      <PageMeta
        title="Gestión de Clientes | Gratex Admin"
        description="Panel de administración de clientes para Gratex"
      />
      <PageBreadcrumb pageTitle="Clientes" />

      {successMessage && (
        <div className="mb-4">
          <Alert variant="success" title="Cliente Creado" message={successMessage} />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar clientes por nombre, empresa o RNC..."
          className="w-full max-w-md rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white transition-all"
        />
        <Button onClick={() => setIsCreateOpen(true)} variant="primary">
          Nuevo Cliente
        </Button>
      </div>

      <ClientesTable
        rows={rows}
        loading={isLoading}
        error={error}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        onRowClick={setSelectedCliente}
      />

      <ClienteDetailsModal cliente={selectedCliente} onClose={() => setSelectedCliente(null)} />

      <CreateClienteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
