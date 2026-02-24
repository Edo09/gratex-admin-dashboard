import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { facturasApi } from "../../services/api";
import type { Factura, PaginatedResponse } from "../../services/api";

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

export default function MonthlySalesChart() {
  const { data: allFacturas = [] } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: fetchAllFacturas,
    staleTime: 5 * 60 * 1000,
  });

  const { seriesData, categories } = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const facturasByMonth = new Array(12).fill(0);

    allFacturas.forEach(f => {
      const date = new Date(f.date);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        const rawAmount = f.total ?? f.amount ?? 0;
        const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
        if (!isNaN(amount)) facturasByMonth[month] += amount;
      }
    });

    return {
      seriesData: [
        {
          name: "Ventas",
          data: facturasByMonth,
        },
      ],
      categories: months,
    };
  }, [allFacturas]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (val: number) => `$${(val / 1000).toFixed(0)}k`,
      }
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      },
    },
  };

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ventas Mensuales
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
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
