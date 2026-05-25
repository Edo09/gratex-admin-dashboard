import { PageMeta } from "@/shared/components/layout/PageMeta";
import { DashboardMetrics } from "../components/DashboardMetrics";
import { MonthlySalesChart } from "../components/MonthlySalesChart";
import { StatisticsChart } from "../components/StatisticsChart";
import { RecentOrders } from "../components/RecentOrders";

export default function Home() {
  return (
    <>
      <PageMeta title="Gratex Dashboard" description="Gratex Admin Dashboard" />
      <div className="space-y-6">
        <DashboardMetrics />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <StatisticsChart />
          </div>
          <div className="xl:col-span-1">
            <MonthlySalesChart />
          </div>
        </div>

        <RecentOrders />
      </div>
    </>
  );
}
