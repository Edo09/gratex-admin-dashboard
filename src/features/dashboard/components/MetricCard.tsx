import type { ReactNode } from "react";
import { formatCurrency } from "@/shared/utils/format";

interface MetricCardProps {
  title: string;
  value: number;
  secondaryValue?: number;
  icon: ReactNode;
  color: string;
  accent: string;
  isCurrency?: boolean;
}

export function MetricCard({
  title,
  value,
  secondaryValue,
  icon,
  color,
  accent,
  isCurrency,
}: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
          <h4 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isCurrency ? formatCurrency(value) : value.toLocaleString("en-US")}
            {secondaryValue != null && (
              <>
                <span className="mx-1.5 text-base font-normal text-gray-300 dark:text-gray-600">|</span>
                {secondaryValue.toLocaleString("en-US")}
              </>
            )}
          </h4>
        </div>
        <div
          className={`flex size-12 items-center justify-center rounded-xl bg-opacity-10 dark:bg-opacity-20 ${accent} ${color.replace("bg-", "bg-opacity-10 ")}`}
        >
          {icon}
        </div>
      </div>
      <div className={`absolute -bottom-6 -right-6 size-24 rounded-full blur-3xl opacity-10 ${color}`} />
    </div>
  );
}
