import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import { facturasApi, cotizacionesApi } from "../../services/api";
import { useMemo } from "react";

export default function StatisticsChart() {
  const { data: facturasData } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: () => facturasApi.getFacturas({ pageSize: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: cotizacionesData } = useQuery({
    queryKey: ["dashboard-cotizaciones-all"],
    queryFn: () => cotizacionesApi.getCotizaciones({ pageSize: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const { seriesData, categories } = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    const facturasByMonth = new Array(12).fill(0);
    const cotizacionesByMonth = new Array(12).fill(0);

    const facturas = facturasData?.data?.data || [];
    const cotizaciones = cotizacionesData?.data?.data || [];

    facturas.forEach(f => {
      const date = new Date(f.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const amount = typeof f.amount === 'string' ? parseFloat(f.amount) : f.amount;
        if (!isNaN(amount)) facturasByMonth[month] += amount;
      }
    });

    cotizaciones.forEach(c => {
      const date = new Date(c.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const amount = typeof c.total === 'string' ? parseFloat(c.total) : parseFloat(String(c.total || 0));
        if (!isNaN(amount)) cotizacionesByMonth[month] += amount;
      }
    });

    return {
      seriesData: [
        { name: "Facturas", data: facturasByMonth },
        { name: "Cotizaciones", data: cotizacionesByMonth }
      ],
      categories: months
    };
  }, [facturasData, cotizacionesData]);

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      }
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `$${(val / 1000).toFixed(1)}k`,
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Estadísticas Mensuales
          </h3>
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
