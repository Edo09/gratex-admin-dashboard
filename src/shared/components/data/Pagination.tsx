interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 10)));
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;

  return (
    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-t-2 border-gray-200 dark:border-gray-700">
      <div className="text-base font-medium text-gray-700 dark:text-gray-300">
        Mostrando {Math.min(startIdx + 1, total)}–{Math.min(endIdx, total)} de {total}
      </div>
      <div className="flex items-center gap-3">
        <select
          className="rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-base font-medium dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">
              {s} / página
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-lg border-2 border-gray-300 px-4 py-2 text-base font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 transition-colors"
          >
            Anterior
          </button>
          <span className="px-3 text-base font-bold text-gray-800 dark:text-white">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-lg border-2 border-gray-300 px-4 py-2 text-base font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
