import { useQuery } from "@tanstack/react-query";
import {
  GroupIcon,
  ListIcon,
  PageIcon,
  BoxIconLine,
} from "../../icons";
import { clientesApi, cotizacionesApi, facturasApi } from "../../services/api";

export default function EcommerceMetrics() {

  // Fetch total Clientes
  const { data: clientesData } = useQuery({
    queryKey: ["dashboard-clientes"],
    queryFn: () => clientesApi.getClientes({ pageSize: 1 }),
    staleTime: 5 * 60 * 1000,
  });
  const totalClientes = clientesData?.data?.total || 0;

  // Fetch total Cotizaciones
  const { data: cotizacionesData } = useQuery({
    queryKey: ["dashboard-cotizaciones"],
    queryFn: () => cotizacionesApi.getCotizaciones({ pageSize: 1 }),
    staleTime: 5 * 60 * 1000,
  });
  const totalCotizaciones = cotizacionesData?.data?.total || 0;

  // Fetch Facturas for Sales calculations
  // Note: Fetching with a large page size to sum up amounts. 
  // Ideally backend should provide this aggregation.
  const { data: facturasData } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: () => facturasApi.getFacturas({ pageSize: 1000 }), // Fetching up to 1000 for stats
    staleTime: 5 * 60 * 1000,
  });

  const allFacturas = facturasData?.data?.data || []; // Access the array inside the response

  // Calculate Lifetime Sales
  const lifetimeSales = allFacturas.reduce((sum, factura) => {
    // Parse amount safely (handle string currency formats if necessary, though API types say number|string)
    const val = typeof factura.amount === 'string' ? parseFloat(factura.amount) : factura.amount;
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Calculate Monthly Sales
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySales = allFacturas.reduce((sum, factura) => {
    const fDate = new Date(factura.date);
    if (fDate.getMonth() === currentMonth && fDate.getFullYear() === currentYear) {
      const val = typeof factura.amount === 'string' ? parseFloat(factura.amount) : factura.amount;
      return sum + (isNaN(val) ? 0 : val);
    }
    return sum;
  }, 0);


  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
              <GroupIcon className="text-gray-800 size-5 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Clientes
              </span>
              <h4 className="font-bold text-gray-800 text-lg dark:text-white/90">
                {totalClientes}
              </h4>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
              <PageIcon className="text-gray-800 size-5 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Cotizaciones
              </span>
              <h4 className="font-bold text-gray-800 text-lg dark:text-white/90">
                {totalCotizaciones}
              </h4>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
              <BoxIconLine className="text-gray-800 size-5 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Ventas Mensuales
              </span>
              <h4 className="font-bold text-gray-800 text-lg dark:text-white/90">
                ${monthlySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
              <ListIcon className="text-gray-800 size-5 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Ventas Totales
              </span>
              <h4 className="font-bold text-gray-800 text-lg dark:text-white/90">
                ${lifetimeSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

    </div>
  );
}
