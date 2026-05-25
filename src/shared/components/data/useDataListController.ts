import { useMemo, useState } from "react";

export interface DataListRow {
  id: number;
  date: string;
  code?: string;
  client?: string;
  company_name?: string;
  description: string;
  amount: string;
  no_factura?: string;
  client_name?: string;
  total: string;
  ncf?: string;
}

interface ControllerOptions {
  query?: string;
  rows: DataListRow[];
  pagination: "client" | "server";
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/**
 * Drives the filter + pagination state for DataCardList / DataTable.
 * Handles both server pagination (controlled) and client pagination (uncontrolled).
 */
export function useDataListController({
  query = "",
  rows,
  pagination,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: ControllerOptions) {
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(10);

  const filtered = useMemo(() => {
    if (pagination === "server") return rows;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.date, r.code, r.client, r.company_name, r.description, r.amount]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, pagination, rows]);

  const effectivePage = pagination === "server" ? page ?? 1 : clientPage;
  const effectivePageSize = pagination === "server" ? pageSize ?? 10 : clientPageSize;
  const totalCount = pagination === "server" ? total ?? filtered.length : filtered.length;
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / (effectivePageSize || 10)));

  const displayRows =
    pagination === "server"
      ? filtered
      : filtered.slice((effectivePage - 1) * effectivePageSize, effectivePage * effectivePageSize);

  const goToPage = (p: number) => {
    if (pagination === "server") onPageChange?.(p);
    else setClientPage(Math.min(Math.max(1, p), totalPages));
  };

  const changePageSize = (size: number) => {
    if (pagination === "server") {
      onPageSizeChange?.(size);
      onPageChange?.(1);
    } else {
      setClientPageSize(size);
      setClientPage(1);
    }
  };

  return {
    filtered,
    displayRows,
    effectivePage,
    effectivePageSize,
    totalCount,
    totalPages,
    goToPage,
    changePageSize,
  };
}
