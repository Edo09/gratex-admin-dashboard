import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import { useAllCotizacionesQuery, useAllFacturasQuery, parseFacturaAmount } from "../hooks/useDashboardData";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function StatisticsChart() {
  const { data: allFacturas = [] } = useAllFacturasQuery();
  const { data: allCotizaciones = [] } = useAllCotizacionesQuery();

  const { seriesData, categories } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const facturasByMonth = new Array(12).fill(0);
    const cotizacionesByMonth = new Array(12).fill(0);

    allFacturas.forEach((f) => {
      const date = new Date(f.date);
      if (date.getFullYear() === currentYear) {
        facturasByMonth[date.getMonth()] += parseFacturaAmount(f);
      }
    });

    allCotizaciones.forEach((c) => {
      const date = new Date(c.date ?? "");
      if (date.getFullYear() === currentYear) {
        const raw = c.total ?? 0;
        const amount = typeof raw === "string" ? parseFloat(raw) : parseFloat(String(raw));
        if (!isNaN(amount)) cotizacionesByMonth[date.getMonth()] += amount;
      }
    });

    return {
      seriesData: [
        { name: "Facturas", data: facturasByMonth },
        { name: "Cotizaciones", data: cotizacionesByMonth },
      ],
      categories: MONTHS,
    };
  }, [allFacturas, allCotizaciones]);

  const options: ApexOptions = {
    legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    colors: ["#465FFF", "#9CB9FF"],
    chart: { fontFamily: "Outfit, sans-serif", height: 310, type: "area", toolbar: { show: false } },
    stroke: { curve: "smooth", width: [2, 2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      },
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        formatter: (val: number) =>
          `$${parseFloat((val / 1000).toFixed(2)).toLocaleString("en-US", { minimumFractionDigits: 2 })}k`,
        style: { fontSize: "12px", colors: ["#6B7280"] },
      },
      title: { text: "" },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Estadísticas Mensuales</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Comparativa de Facturas y Cotizaciones (Año {new Date().getFullYear()})
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={seriesData} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
