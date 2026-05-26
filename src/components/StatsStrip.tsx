import {
  IndianRupee,
  ShoppingBag,
  BarChart3,
  Users,
  Clock3,
  Repeat,
} from "lucide-react";

type Props = {
  analytics?: any;
};

export default function AnalyticsOverview({ analytics }: Props) {
  const repeatCustomers = analytics?.totalCustomers
    ? Math.round(
        (analytics?.repeatCustomersCount / analytics?.totalCustomers) * 100,
      )
    : 0;

  const stats = [
    {
      name: "Revenue",
      value: `₹${Math.round(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: IndianRupee,
      accent: "bg-red-500",
    },

    {
      name: "Orders",
      value: analytics?.totalOrders || 0,
      icon: ShoppingBag,
      accent: "bg-blue-500",
    },

    {
      name: "Avg Order",
      value: `₹${Math.round(analytics?.avgOrderValue || 0)}`,
      icon: BarChart3,
      accent: "bg-orange-500",
    },

    {
      name: "Customers",
      value: analytics?.totalCustomers || 0,
      icon: Users,
      accent: "bg-emerald-500",
    },

    {
      name: "Peak Hours",
      value: analytics?.peakHours || "N/A",
      icon: Clock3,
      accent: "bg-violet-500",
    },

    {
      name: "Repeat",
      value: `${repeatCustomers}%`,
      icon: Repeat,
      accent: "bg-pink-500",
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* HEADER */}

      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-[16px] font-bold tracking-tight text-gray-900">
            Analytics Overview
          </h2>

          <p className="mt-0.5 text-[12px] text-gray-500">
            Live operational metrics
          </p>
        </div>

        <div className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">
          LIVE
        </div>
      </div>

      {/* KPI GRID */}

      <div className="grid grid-cols-2 xl:grid-cols-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.name}
              className={`
                relative
                px-4
                py-4

                ${
                  index !== stats.length - 1
                    ? "border-b border-gray-100 xl:border-b-0 xl:border-r"
                    : ""
                }
              `}
            >
              {/* TOP */}

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                    {stat.name}
                  </p>

                  <h3 className="mt-2 text-[20px] font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </h3>
                </div>

                {/* ICON */}

                <div
                  className={`
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    bg-gray-50
                  `}
                >
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
              </div>

              {/* FOOTER */}

              <div className="mt-4 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stat.accent}`} />

                <p className="text-[11px] text-gray-500">Live analytics</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
