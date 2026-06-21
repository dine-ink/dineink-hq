import { Clock3, Repeat, PieChart } from "lucide-react";

type Props = {
  analytics?: any;
};

export default function BusinessStats({ analytics }: Props) {
  const repeatCustomers = analytics?.totalCustomers
    ? Math.round(
        (analytics?.repeatCustomersCount / analytics?.totalCustomers) * 100,
      )
    : 0;
  const onlineRevenue =
    analytics?.recentOrders
      ?.filter((o: any) => o.orderType === "ONLINE")
      .reduce((sum: number, order: any) => sum + order.total, 0) || 0;
  const dineInRevenue =
    analytics?.recentOrders
      ?.filter((o: any) => o.orderType === "DINE_IN")
      .reduce((sum: number, order: any) => sum + order.total, 0) || 0;
  const totalRevenue = onlineRevenue + dineInRevenue;
  const onlinePercent = totalRevenue
    ? Math.round((onlineRevenue / totalRevenue) * 100)
    : 0;
  const dineInPercent = totalRevenue
    ? Math.round((dineInRevenue / totalRevenue) * 100)
    : 0;
  const stats = [
    {
      name: "Peak Hours",
      value: analytics?.peakHours || "N/A",
      sub: "Best performance time",
      icon: Clock3,
      gradient: "from-orange-500 to-amber-500",
      glow: "bg-orange-200/50",
      badge: "Peak Traffic",
    },
    {
      name: "Repeat Customers",
      value: `${repeatCustomers}%`,
      sub: "Returning users",
      icon: Repeat,
      gradient: "from-emerald-500 to-teal-500",
      glow: "bg-emerald-200/50",
      badge: "Customer Loyalty",
    },
    {
      name: "Order Split",
      value: `Online ${onlinePercent}%`,
      sub: `Dine-in ${dineInPercent}%`,
      icon: PieChart,
      gradient: "from-red-500 to-rose-500",
      glow: "bg-red-200/50",
      badge: "Sales Channels",
    },
  ];
  return (
    <div className="mb-5">
      {/* HEADER */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#b10000]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10000]">
            Smart Analytics
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-gray-900">
            Business Insights
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Real-time operational intelligence
          </p>
        </div>
      </div>
      {/* GRID */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Soft Glow */}
              <div
                className={`absolute -right-8 -top-8 h-20 w-20 rounded-full blur-3xl ${item.glow}`}
              />
              <div className="relative z-10">
                {/* TOP */}
                <div className="flex items-start justify-between">
                  <div>
                    {/* LABEL */}
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      {item.name}
                    </p>
                    {/* VALUE */}
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-900">
                      {item.value}
                    </h2>
                  </div>
                  {/* ICON */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                {/* BOTTOM */}
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">{item.sub}</p>
                  <div className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                    {item.badge}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
