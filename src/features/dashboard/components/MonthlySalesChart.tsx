import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo, useState } from "react";
import { Dropdown, DropdownItem } from "@/shared/components/ui/Dropdown";
import { MoreDotIcon } from "@/icons";
import { useAllFacturasQuery, parseFacturaAmount } from "../hooks/useDashboardData";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function MonthlySalesChart() {
  const { data: allFacturas = [] } = useAllFacturasQuery();
  const [isOpen, setIsOpen] = useState(false);

  const { seriesData, categories } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const byMonth = new Array(12).fill(0);
    allFacturas.forEach((f) => {
      const date = new Date(f.date);
      if (date.getFullYear() === currentYear) {
        byMonth[date.getMonth()] += parseFacturaAmount(f);
      }
    });
    return { seriesData: [{ name: "Ventas", data: byMonth }], categories: MONTHS };
  }, [allFacturas]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", height: 180, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "39%", borderRadius: 5, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false } },
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    yaxis: {
      labels: { formatter: (val: number) => `$${(val / 1000).toFixed(0)}k` },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: { formatter: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ventas Mensuales</h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={() => setIsOpen((p) => !p)}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Ver Detalle
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={seriesData} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
