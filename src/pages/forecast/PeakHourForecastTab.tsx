import { useEffect, useState } from "react";
import { ClockIcon, UsersIcon } from "@heroicons/react/24/outline";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSelector } from "../../store";
import { MetricCard } from "../../design";
import { MODEL_OPTIONS, PERIOD_OPTIONS } from "./forecastCategories";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm";

export default function PeakHourForecastTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("NEXT_MONTH");
  const [model, setModel] = useState("HISTORICAL_TREND");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPeakHour = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const branchParam = scope === "branch" && selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
        const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/peak-hour?period=${period}&model=${model}${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
        else setData(null);
      } catch {
        // fetch error — silently ignored
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPeakHour();
  }, [user?.restaurantId, selectedBranch?.id, scope, period, model]);

  const hourly = Array.isArray(data?.hourly) ? data.hourly : [];
  const chartData = hourly.map((row: any, i: number) => ({
    name: row?.label ?? row?.hour ?? `#${i + 1}`,
    projectedOrders: row?.projectedOrders ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setScope("branch")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "branch" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {selectedBranch?.name || "This Branch"}
            </button>
            <button
              type="button"
              onClick={() => setScope("restaurant")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "restaurant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Entire Restaurant
            </button>
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {MODEL_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Generating forecast…</div>}

      {!loading && !data && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
          No peak hour forecast available yet.
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <MetricCard
              label="Projected Peak Hour"
              value={data.projectedPeakHour?.label ?? data.projectedPeakHour?.hour ?? "—"}
              sub={data.projectedPeakHour?.projectedOrders != null ? `${data.projectedPeakHour.projectedOrders} projected orders` : undefined}
              icon={ClockIcon}
              status="primary"
            />
            <MetricCard
              label="Projected Staff Requirement"
              value={data.projectedStaffRequirement != null ? String(data.projectedStaffRequirement) : "—"}
              sub="staff recommended during peak"
              icon={UsersIcon}
              status="secondary"
            />
          </div>

          {chartData.length > 0 && (
            <div className={CHART_CARD}>
              <p className="mb-2 text-[11px] font-bold text-gray-700">Projected Orders by Hour</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="projectedOrders" name="Projected Orders" fill="#b10000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
