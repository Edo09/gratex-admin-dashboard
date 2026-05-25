import type { ReactNode } from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

export function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
