import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import BasicTableOne from "../components/tables/BasicTableOne";
import { useDebounce } from "../hooks/useDebounce";
import Button from "../components/ui/button/Button";
import FacturaCreateModal from "../components/facturas/FacturaCreateModal";
import { facturasApi } from "../services/api";
import type { FacturaTableRow } from "../types";
import { formatCurrency } from '../utils/format';

/**
 * Facturas page — Single Responsibility: table display + modal orchestration.
 * Creation logic is delegated to FacturaCreateModal.
 */
export default function Facturas() {
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const debouncedQuery = useDebounce(query, 400);

  const mapApiToRow = useMemo(
    () =>
      (item: Record<string, unknown>, index: number): FacturaTableRow => ({
        id: (item.id as number) ?? index + 1,
        no_factura: (item.no_factura as string) ?? "",
        date: (item.date as string) ?? "",
        client_name: (item.client_name as string) ?? "",
        total: (item.total as string) ?? "",
        ncf: (item.NCF as string) ?? "",
        description: (item.description as string) ?? "",
        amount: formatCurrency((item.amount ?? item.total ?? 0) as number | string).replace('$', ''),
      }),
    [],
  );

  const {
    data: facturasData,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["facturas", debouncedQuery, page, pageSize],
    queryFn: () => facturasApi.getFacturas({ query: debouncedQuery, page, pageSize }),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  // Parse total from API response (root-level pagination expected)
  useEffect(() => {
    if (!facturasData) return;
    const paginationTotal = facturasData.pagination?.total;
    if (typeof paginationTotal === 'number') {
      setTotal(paginationTotal);
      return;
    }
    // Fallback to data length if pagination is missing
    const dataArr = Array.isArray(facturasData.data) ? facturasData.data : [];
    setTotal(dataArr.length);
  }, [facturasData]);

  // Map API response to table rows
  let rows: FacturaTableRow[] = [];
  const facturasArray = Array.isArray(facturasData?.data) ? (facturasData!.data as unknown as Record<string, unknown>[]) : [];
  rows = facturasArray.map(mapApiToRow);

  return (
    <div>
      <PageMeta title="Gratex Dashboard" description="Pagina para gestionar las facturas" />
      <PageBreadcrumb pageTitle="Facturas" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por fecha, código, cliente o descripción..."
          className="w-full max-w-md rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white transition-all"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="whitespace-nowrap text-base px-5 py-2.5"
        >
          Crear Factura
        </Button>
      </div>

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

      <BasicTableOne
        dataType="facturas"
        query={debouncedQuery}
        rows={rows}
        loading={loading}
        error={error instanceof Error ? error.message : (error as unknown as string)}
        pagination="server"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />
    </div>
  );
}
