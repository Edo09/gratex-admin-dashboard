import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  ListIcon,
  PageIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

export default function EcommerceMetrics() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
              <ListIcon className="text-gray-800 size-5 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Facturas
              </span>
              <h4 className="font-bold text-gray-800 text-lg dark:text-white/90">
                3,782
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
                5,359
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
              <GroupIcon className="text-gray-800 size-5 dark:text-white/90" />
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Clientes
              </span>
              <h4 className="font-bold text-gray-800 text-lg dark:text-white/90">
                5,359
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
                Ultimo RNC
              </span>
              <h4 className="font-bold text-gray-800 text-lg dark:text-white/90">
                5,359
              </h4>
            </div>
          </div>

        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      
    </div>
  );
}
