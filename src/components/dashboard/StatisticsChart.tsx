import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useQuery } from "@tanstack/react-query";
import { facturasApi, cotizacionesApi } from "../../services/api";
import type { Factura, PaginatedResponse, Cotizacion } from "../../services/api";
import { useMemo } from "react";

/** Fetch all facturas, handling both flat array and paginated responses. */
async function fetchAllFacturas(): Promise<Factura[]> {
  const response = await facturasApi.getFacturas({ page: 1, pageSize: 100 });
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  const paginated = payload as PaginatedResponse<Factura> | undefined;
  if (!paginated?.data) return [];
  const allItems = [...paginated.data];
  const totalPages = paginated.totalPages ?? 1;
  if (totalPages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        facturasApi.getFacturas({ page: i + 2, pageSize: 100 })
      )
    );
    for (const res of remaining) {
      const p = res.data as PaginatedResponse<Factura> | undefined;
      if (p?.data && Array.isArray(p.data)) allItems.push(...p.data);
    }
  }
  return allItems;
}

/** Fetch all cotizaciones, handling both flat array and paginated responses. */
async function fetchAllCotizaciones(): Promise<Cotizacion[]> {
  const response = await cotizacionesApi.getCotizaciones({ page: 1, pageSize: 100 });
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  const paginated = payload as PaginatedResponse<Cotizacion> | undefined;
  if (!paginated?.data) return [];
  const allItems = [...paginated.data];
  const totalPages = paginated.totalPages ?? 1;
  if (totalPages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        cotizacionesApi.getCotizaciones({ page: i + 2, pageSize: 100 })
      )
    );
    for (const res of remaining) {
      const p = res.data as PaginatedResponse<Cotizacion> | undefined;
      if (p?.data && Array.isArray(p.data)) allItems.push(...p.data);
    }
  }
  return allItems;
}

export default function StatisticsChart() {
  const { data: allFacturas = [] } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: fetchAllFacturas,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allCotizaciones = [] } = useQuery({
    queryKey: ["dashboard-cotizaciones-all"],
    queryFn: fetchAllCotizaciones,
    staleTime: 5 * 60 * 1000,
  });

  const { seriesData, categories } = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    const facturasByMonth = new Array(12).fill(0);
    const cotizacionesByMonth = new Array(12).fill(0);

    allFacturas.forEach(f => {
      const date = new Date(f.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const rawAmount = f.total ?? f.amount ?? 0;
        const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
        if (!isNaN(amount)) facturasByMonth[month] += amount;
      }
    });

    allCotizaciones.forEach(c => {
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
  }, [allFacturas, allCotizaciones]);

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
