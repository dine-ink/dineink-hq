import {
  IndianRupee,
  ShoppingBag,
  BarChart3,
  Users,
} from "lucide-react";

type Props = { analytics?: any;};

export default function StatsStrip({analytics,}: Props) {
  const stats = [
    {
      name: "Revenue",
      value: `₹${Math.round(analytics?.totalRevenue || 0,).toLocaleString()}`,
      icon: IndianRupee,
      gradient:"from-red-500 to-rose-500",
      bg:"bg-red-50",
      color:"text-red-600",
      subtext:"Total sales generated",
    },
    {
      name: "Orders",
      value: analytics?.totalOrders || 0,
      icon: ShoppingBag,
      gradient: "from-blue-500 to-indigo-500",
      bg: "bg-blue-50",
      color: "text-blue-600",
      subtext: "Completed orders",
    },
    {
      name: "Avg Order",
      value: `₹${Math.round( analytics?.avgOrderValue || 0, )}`,
      icon: BarChart3,
      gradient: "from-orange-500 to-amber-500",
      bg: "bg-orange-50",
      color: "text-orange-500",
      subtext: "Average order value",
    },
    {
      name: "Customers",
      value: analytics?.totalCustomers || 0,
      icon: Users,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
      color: "text-emerald-600",
      subtext: "Unique customers",
    },
  ];
  return (
    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name}
            className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            {/* Soft Glow */}
            <div className={`absolute -right-8 -top-8 h-20 w-20 rounded-full ${stat.bg} opacity-60 blur-3xl`} />
            <div className="relative z-10">
              {/* TOP */}
              <div className="flex items-start justify-between">
                <div>
                  {/* LABEL */}
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                    {stat.name}
                  </p>
                  {/* VALUE */}
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
                    {stat.value}
                  </h2>
                </div>
                {/* ICON */}
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`} >
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              {/* BOTTOM */}
              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">
                  {stat.subtext}
                </p>
                <div className={`rounded-full px-2 py-1 text-[10px] font-bold ${stat.bg} ${stat.color}`}>
                  LIVE
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}