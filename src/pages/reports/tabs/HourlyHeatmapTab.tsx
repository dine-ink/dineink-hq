import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/**
 * Hourly sales heatmap — revenue by hour and weekday, optionally filtered to a
 * single menu item or category.
 *
 * The filters and the request they drive live here. `heatmapData` does not, and
 * that is deliberate rather than an oversight: the Day Analysis tab reads the
 * same state, and the unfiltered version is loaded by the page's main batch on
 * mount. Owning it here would leave Day Analysis with nothing.
 *
 * That sharing carries an existing quirk, preserved rather than fixed: applying
 * a filter here overwrites the shared data, so Day Analysis afterwards shows
 * figures for the filtered item until the page reloads. Changing it is a
 * behaviour change and belongs with the work that gives each tab its own query,
 * not with moving markup between files.
 */

interface HourlyHeatmapTabProps {
  heatmapData: any;
  setHeatmapData: (data: any) => void;
  dailyData: any;
  menuItems: any;
  from: string;
  to: string;
}

export default function HourlyHeatmapTab({
  heatmapData,
  setHeatmapData,
  dailyData,
  menuItems,
  from,
  to,
}: HourlyHeatmapTabProps) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [heatmapItemId, setHeatmapItemId] = useState("");
  const [heatmapCategoryId, setHeatmapCategoryId] = useState("");

  // The parent's copy of this effect was guarded on the active tab; rendering
  // this component conditionally is that guard.
  useEffect(() => {
    if (!selectedBranch?.id || !user?.restaurantId) return;
    const fetchHeatmap = async () => {
      try {
        const bParam = `branchId=${selectedBranch.id}`;
        const filterParam = heatmapItemId
          ? `&itemId=${heatmapItemId}`
          : heatmapCategoryId
            ? `&categoryId=${heatmapCategoryId}`
            : "";
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/hourly-heatmap?${bParam}&from=${from}&to=${to}${filterParam}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setHeatmapData(json.data);
      } catch {
        // The chart keeps whatever the page's initial load produced.
      }
    };
    fetchHeatmap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatmapItemId, heatmapCategoryId, selectedBranch?.id, from, to]);

  return (
  <div className="space-y-3">
    {/* ===== DEMAND BY ITEM / CATEGORY FILTER ===== */}
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
        Demand for
      </span>
      <select
        value={heatmapItemId}
        onChange={(e) => {
          setHeatmapItemId(e.target.value);
          setHeatmapCategoryId("");
        }}
        className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
      >
        <option value="">Whole Menu (all orders)</option>
        {menuItems.map((mi: any) => (
          <option key={mi.id} value={String(mi.id)}>
            {mi.name}
          </option>
        ))}
      </select>
      <span className="text-[11px] text-gray-400">or category</span>
      <select
        value={heatmapCategoryId}
        onChange={(e) => {
          setHeatmapCategoryId(e.target.value);
          setHeatmapItemId("");
        }}
        className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
      >
        <option value="">All Categories</option>
        {[
          ...new Map(
            menuItems
              .filter((mi: any) => mi.category)
              .map((mi: any) => [mi.category.id, mi.category]),
          ).values(),
        ].map((cat: any) => (
          <option key={cat.id} value={String(cat.id)}>
            {cat.name}
          </option>
        ))}
      </select>
      {(heatmapItemId || heatmapCategoryId) && (
        <button
          onClick={() => {
            setHeatmapItemId("");
            setHeatmapCategoryId("");
          }}
          className="text-[11px] font-semibold text-[#b10000] underline decoration-dotted"
        >
          Clear filter
        </button>
      )}
    </div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        {
          label: "Peak Hour",
          value: heatmapData?.peakHour?.label || "—",
          sub: heatmapData?.itemFiltered
            ? `${heatmapData?.peakHour?.orders || 0} sold in that hour`
            : `₹${(heatmapData?.peakHour?.revenue || 0).toLocaleString("en-IN")} revenue`,
          color: "red",
        },
        {
          label: "Best Day",
          value: heatmapData?.peakDay?.name || "—",
          sub: heatmapData?.itemFiltered
            ? `${heatmapData?.peakDay?.orders || 0} sold that day`
            : `₹${(heatmapData?.peakDay?.revenue || 0).toLocaleString("en-IN")} revenue`,
          color: "emerald",
        },
        {
          label: heatmapData?.itemFiltered
            ? "Peak Hour Qty"
            : "Peak Hour Orders",
          value: heatmapData?.peakHour?.orders || 0,
          sub: heatmapData?.itemFiltered
            ? "units sold in that hour"
            : "orders in that hour",
          color: "blue",
        },
        {
          label: heatmapData?.itemFiltered
            ? "Best Day Qty"
            : "Best Day Orders",
          value: heatmapData?.peakDay?.orders || 0,
          sub: heatmapData?.itemFiltered
            ? "units sold that day"
            : "orders on that day",
          color: "orange",
        },
      ].map((k) => (
        <div
          key={k.label}
          className={`rounded-xl border p-4 ${k.color === "red" ? "border-red-100 bg-red-50/60" : k.color === "emerald" ? "border-emerald-100 bg-emerald-50/60" : k.color === "blue" ? "border-blue-100 bg-blue-50/60" : "border-orange-100 bg-orange-50/60"}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {k.label}
          </p>
          <p
            className={`mt-2 text-[20px] font-bold ${k.color === "red" ? "text-red-700" : k.color === "emerald" ? "text-emerald-700" : k.color === "blue" ? "text-blue-700" : "text-orange-700"}`}
          >
            {k.value}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[15px] font-bold text-gray-900">
            Revenue by Hour of Day
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Which hour generates most revenue across all days
          </p>
        </div>
        <div className="p-3">
          {heatmapData?.hourlyData?.filter((h: any) => h.revenue > 0)
            .length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={(heatmapData.hourlyData || []).filter(
                  (h: any) => h.hour >= 6 && h.hour <= 23,
                )}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: any) =>
                    `₹${Number(v).toLocaleString("en-IN")}`
                  }
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
              No hourly data
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[15px] font-bold text-gray-900">
            Revenue by Day of Week
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Which day is strongest across the period
          </p>
        </div>
        <div className="p-3">
          {heatmapData?.dailyData?.filter((d: any) => d.revenue > 0)
            .length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={heatmapData.dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="short"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: any) =>
                    `₹${Number(v).toLocaleString("en-IN")}`
                  }
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
              No daily data
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Heatmap Grid */}
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-[15px] font-bold text-gray-900">
          Revenue Heatmap — Day × Hour
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Darker red = higher revenue in that time slot
        </p>
      </div>
      <div className="overflow-x-auto p-4">
        {heatmapData?.heatmapGrid?.length > 0 ? (
          (() => {
            const hours = [
              6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
              21, 22, 23,
            ];
            const days = heatmapData.dailyData || [];
            const maxRev = Math.max(
              ...heatmapData.heatmapGrid.map((c: any) => c.revenue),
              1,
            );
            const cell = (day: number, h: number) => {
              const c = heatmapData.heatmapGrid.find(
                (g: any) => g.day === day && g.h === h,
              );
              const intensity = c
                ? Math.round((c.revenue / maxRev) * 100)
                : 0;
              return (
                <td
                  key={h}
                  title={`₹${(c?.revenue || 0).toLocaleString("en-IN")}`}
                  className="border border-white p-0"
                  style={{
                    background:
                      intensity === 0
                        ? "#f9fafb"
                        : `rgba(239,68,68,${0.1 + intensity * 0.009})`,
                    width: 32,
                    height: 24,
                  }}
                />
              );
            };
            return (
              <table className="text-[9px]">
                <thead>
                  <tr>
                    <th className="w-14 pr-2 text-right text-gray-400" />
                    {hours.map((h) => (
                      <th
                        key={h}
                        className="w-8 text-center text-gray-400 font-normal"
                      >
                        {h === 12
                          ? "12P"
                          : h > 12
                            ? `${h - 12}P`
                            : `${h}A`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((d: any) => (
                    <tr key={d.day}>
                      <td className="pr-2 text-right text-[10px] font-semibold text-gray-600">
                        {d.short}
                      </td>
                      {hours.map((h) => cell(d.day, h))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()
        ) : (
          <div className="py-8 text-center text-[12px] text-gray-400">
            No heatmap data for this period
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
