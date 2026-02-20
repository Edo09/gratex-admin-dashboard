import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Gratex Dashboard"
        description="Gratex Admin Dashboard"
      />
      <div className="space-y-6">
        <EcommerceMetrics />

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
