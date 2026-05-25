import type { ReactNode } from "react";
import Button from "@/shared/components/ui/Button";

interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  viewMode?: "cards" | "table";
  onViewModeChange?: (mode: "cards" | "table") => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  extra?: ReactNode;
}

/** Search box + (optional) view-mode toggle + primary action button. */
export function ListToolbar({
  query,
  onQueryChange,
  placeholder = "Buscar...",
  viewMode,
  onViewModeChange,
  primaryActionLabel,
  onPrimaryAction,
  extra,
}: ListToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-md rounded-lg border-2 border-gray-300 px-4 py-3 text-base font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white bg-white transition-all"
      />
      <div className="flex items-center gap-2">
        {viewMode && onViewModeChange && (
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800">
            <ViewModeButton active={viewMode === "cards"} onClick={() => onViewModeChange("cards")}>Cards</ViewModeButton>
            <ViewModeButton active={viewMode === "table"} onClick={() => onViewModeChange("table")}>Tabla</ViewModeButton>
          </div>
        )}
        {extra}
        {primaryActionLabel && onPrimaryAction && (
          <Button size="sm" variant="primary" onClick={onPrimaryAction} className="whitespace-nowrap text-base px-5 py-2.5">
            {primaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function ViewModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
