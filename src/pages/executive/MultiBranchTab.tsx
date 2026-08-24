import { useEffect, useState } from "react";
import { Trophy, TrendingUp, AlertTriangle, ArrowDown } from "lucide-react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue, PERIOD_OPTIONS, STATUS_STYLES } from "./executiveCategories";
import { BranchRankingChart, InvestmentPerformanceChart } from "./ExecutiveCharts";
import MobileTableCards from "../../components/common/MobileTableCards";

export default function MultiBranchTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [period, setPeriod] = useState("currentMonth");
  const [multiBranch, setMultiBranch] = useState<any>(null);
  const [panels, setPanels] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const [multiBranchRes, panelsRes] = await Promise.all([
          fetch(`${API_URL}/api/executive/${user.restaurantId}/multi-branch?period=${period}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/executive/${user.restaurantId}/insight-panels?period=${period}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [multiBranchJson, panelsJson] = await Promise.all([multiBranchRes.json(), panelsRes.json()]);
        if (multiBranchJson.success) setMultiBranch(multiBranchJson.data);
        if (panelsJson.success) setPanels(panelsJson.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.restaurantId, period]);

  if (loading) return <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>;
  if (!multiBranch || multiBranch.branches.length === 0) {
    return <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">No branches to compare.</div>;
  }

  const HighlightCard = ({ icon, label, item, tone }: { icon: any; label: string; item: any; tone: string }) => (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-70">{icon} {label}</div>
      <p className="mt-1 text-[14px] font-extrabold">{item?.branch?.name || "—"}</p>
      <p className="text-[11px] opacity-80">Health Score: {item?.healthScore ?? "—"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Multi-Branch Executive View</h3>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
          {PERIOD_OPTIONS.filter((p) => p.key !== "custom").map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>

      {/* HIGHLIGHTS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <HighlightCard icon={<Trophy className="h-3.5 w-3.5" />} label="Best Performing" item={multiBranch.bestPerforming} tone="border-emerald-200 bg-emerald-50 text-emerald-800" />
        <HighlightCard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Most Improved" item={multiBranch.mostImproved} tone="border-blue-200 bg-blue-50 text-blue-800" />
        <HighlightCard icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Highest Risk" item={multiBranch.highestRisk} tone="border-red-200 bg-red-50 text-red-800" />
        <HighlightCard icon={<ArrowDown className="h-3.5 w-3.5" />} label="Lowest Performing" item={multiBranch.lowestPerforming} tone="border-gray-200 bg-gray-50 text-gray-700" />
      </div>

      {/* RANKED TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <MobileTableCards>
        <table className="w-full text-[12px]">
          <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2 text-right">Profit</th>
              <th className="px-3 py-2 text-right">EBITDA</th>
              <th className="px-3 py-2 text-right">Food Cost %</th>
              <th className="px-3 py-2 text-right">Labour %</th>
              <th className="px-3 py-2 text-right">Budget Achievement</th>
              <th className="px-3 py-2 text-right">ROI</th>
              <th className="px-3 py-2 text-right">Repeat Customer Rate</th>
              <th className="px-3 py-2 text-center">Health Score</th>
            </tr>
          </thead>
          <tbody>
            {multiBranch.branches.map((row: any, i: number) => {
              const style = STATUS_STYLES[row.healthStatus] || STATUS_STYLES["no-data"];
              return (
                <tr key={row.branch.id} className="border-t border-gray-100">
                  <td className="px-4 py-2.5">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{row.branch.name}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmtCategoryValue(row.revenue, "currency")}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmtCategoryValue(row.netProfit, "currency")}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{fmtCategoryValue(row.ebitda, "currency")}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{row.foodCostPercentage != null ? `${row.foodCostPercentage.toFixed(1)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{row.labourCostPercentage != null ? `${row.labourCostPercentage.toFixed(1)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{row.budgetAchievementPercentage != null ? `${row.budgetAchievementPercentage.toFixed(0)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{row.roi != null ? `${row.roi.toFixed(1)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{row.repeatCustomerRate != null ? `${row.repeatCustomerRate.toFixed(0)}%` : "—"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>{row.healthScore}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </MobileTableCards>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <BranchRankingChart branches={multiBranch.branches} />
        {panels && <InvestmentPerformanceChart projects={[...panels.topOpportunities, ...panels.topRisks]} />}
      </div>

      {/* INSIGHT PANELS */}
      {panels && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-2 text-[12px] font-bold text-gray-900">Actual vs Budget Summary</p>
            {panels.actualVsBudget ? (
              <div className="space-y-1">
                {panels.actualVsBudget.rows.map((r: any) => (
                  <div key={r.category} className="flex justify-between text-[11px]"><span className="text-gray-500">{r.label}</span><span className="font-semibold text-gray-800">{r.status}</span></div>
                ))}
              </div>
            ) : <p className="text-[11px] text-gray-400">No published budget for this scope yet.</p>}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-2 text-[12px] font-bold text-gray-900">Forecast Summary</p>
            <p className="text-[11px] text-gray-500">Model: {panels.forecastSummary.modelUsed} · Confidence: <span className="font-semibold capitalize">{panels.forecastSummary.confidence}</span></p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-2 text-[12px] font-bold text-gray-900">Scenario Summary</p>
            <div className="flex flex-wrap gap-1.5">
              {panels.scenarioSummary.map((s: any) => <span key={s.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{s.name}</span>)}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <p className="mb-2 text-[12px] font-bold text-gray-900">Investment Portfolio Summary</p>
            <p className="text-[11px] text-gray-500">
              {fmtCategoryValue(panels.investmentPortfolioSummary.totalCapitalDeployed, "currency")} deployed across {panels.investmentPortfolioSummary.projectCount} project(s) · Avg ROI {panels.investmentPortfolioSummary.averageROI != null ? `${panels.investmentPortfolioSummary.averageROI.toFixed(1)}%` : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="mb-2 text-[12px] font-bold text-emerald-800">Top Opportunities</p>
            {panels.topOpportunities.length > 0 ? panels.topOpportunities.map((p: any) => (
              <p key={p.project.id} className="text-[11px] text-emerald-700">{p.project.name} — NPV {fmtCategoryValue(p.metrics.npv, "currency")}</p>
            )) : <p className="text-[11px] text-emerald-600">None yet.</p>}
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="mb-2 text-[12px] font-bold text-red-800">Top Risks</p>
            {panels.topRisks.length > 0 ? panels.topRisks.map((p: any) => (
              <p key={p.project.id} className="text-[11px] text-red-700">{p.project.name} — NPV {fmtCategoryValue(p.metrics.npv, "currency")}</p>
            )) : <p className="text-[11px] text-red-600">None — every investment looks healthy.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
