import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Gratex Dashboard"
        description="Gratex Admin Dashboard"
      />
      <div className="space-y-6">
        <EcommerceMetrics />
        <RecentOrders />
      </div>
    </>
  );
}
