import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useAppSelector } from "../../store";
import { CONFIDENCE_STYLES, fmtCategoryValue, MODEL_OPTIONS, PERIOD_OPTIONS } from "./forecastCategories";

export default function BranchComparisonTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [period, setPeriod] = useState("NEXT_MONTH");
  const [model, setModel] = useState("HISTORICAL_TREND");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/branch-ranking?period=${period}&model=${model}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setRows(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [user?.restaurantId, period, model]);

  const rankBadge = (index: number) => {
    if (index === 0) return "bg-amber-100 text-amber-700";
    if (index === 1) return "bg-gray-200 text-gray-700";
    if (index === 2) return "bg-orange-100 text-orange-700";
    return "bg-gray-50 text-gray-500";
  };

  if (!loading && rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
        No branches to compare.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Branch Forecast Comparison</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {MODEL_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Generating branch forecasts…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Rank</th>
                <th className="px-4 py-2 text-left">Branch</th>
                <th className="px-3 py-2 text-right">Expected Revenue</th>
                <th className="px-3 py-2 text-right">Expected Profit</th>
                <th className="px-3 py-2 text-right">Expected EBITDA</th>
                <th className="px-3 py-2 text-right">Growth %</th>
                <th className="px-3 py-2 text-center">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const style = CONFIDENCE_STYLES[row.confidence] || CONFIDENCE_STYLES.low;
                return (
                  <tr key={row.branch.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${rankBadge(i)}`}>
                        {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{row.branch.name}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{fmtCategoryValue(row.revenue, "currency")}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{fmtCategoryValue(row.netProfit, "currency")}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{fmtCategoryValue(row.ebitda, "currency")}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${(row.growthPercentage ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {row.growthPercentage != null ? `${row.growthPercentage > 0 ? "+" : ""}${row.growthPercentage.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`rounded-full border ${style.border} ${style.bg} px-2 py-0.5 text-[10px] font-semibold capitalize ${style.text}`}>{row.confidence}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
