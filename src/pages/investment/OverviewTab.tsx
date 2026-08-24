import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, Trophy } from "lucide-react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue, riskLevelFor, RISK_STYLES } from "./investmentCategories";
import InvestmentCharts from "./InvestmentCharts";

export default function OverviewTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/portfolio`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setPortfolio(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [user?.restaurantId]);

  if (loading) return <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading portfolio…</div>;

  if (!portfolio || portfolio.projectCount === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
        No investment projects yet — add one under the Projects tab to see portfolio analysis here.
      </div>
    );
  }

  const ProjectRow = ({ item, highlight: _highlight }: { item: any; highlight: "good" | "bad" }) => {
    const risk = riskLevelFor(item.metrics.npv, item.metrics.paybackPeriodYears, item.project.projectLifeYears);
    const style = RISK_STYLES[risk];
    return (
      <div className={`rounded-xl border ${style.border} ${style.bg} p-3`}>
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold text-gray-900">{item.project.name}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${style.text}`}>{risk} risk</span>
        </div>
        <p className="text-[10px] text-gray-500">{item.project.branch?.name || "Restaurant-wide"}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <div>
            <p className="text-[9px] font-semibold uppercase text-gray-400">ROI</p>
            <p className={`text-[12px] font-bold ${(item.metrics.roiPercentage ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {item.metrics.roiPercentage != null ? `${item.metrics.roiPercentage.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase text-gray-400">NPV</p>
            <p className="text-[12px] font-bold text-gray-900">{fmtCategoryValue(item.metrics.npv, "currency")}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase text-gray-400">IRR</p>
            <p className="text-[12px] font-bold text-gray-900">{item.metrics.irrPercentage != null ? `${item.metrics.irrPercentage.toFixed(1)}%` : "—"}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase text-gray-400">Payback</p>
            <p className="text-[12px] font-bold text-gray-900">{item.metrics.paybackPeriodYears != null ? `${item.metrics.paybackPeriodYears.toFixed(1)}y` : "Never"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[16px] font-bold text-gray-900">Investment Portfolio</h3>

      {/* PORTFOLIO SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Capital Deployed</p>
          <p className="mt-2 text-[18px] font-extrabold text-gray-900">{fmtCategoryValue(portfolio.totalCapitalDeployed, "currency")}</p>
          <p className="mt-1 text-[10px] text-gray-400">{portfolio.projectCount} active project(s)</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Average ROI</p>
          <p className={`mt-2 text-[18px] font-extrabold ${(portfolio.averageROI ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {portfolio.averageROI != null ? `${portfolio.averageROI.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Total NPV</p>
          <p className={`mt-2 text-[18px] font-extrabold ${portfolio.totalNPV >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtCategoryValue(portfolio.totalNPV, "currency")}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Expected Annual Return</p>
          <p className="mt-2 text-[18px] font-extrabold text-gray-900">{fmtCategoryValue(portfolio.expectedAnnualReturn, "currency")}</p>
          <p className="mt-1 text-[10px] text-gray-400">Year 1, across all projects</p>
        </div>
      </div>

      {/* TOP PERFORMING / NEEDS ATTENTION */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
            <Trophy className="h-4 w-4 text-amber-500" /> Top Performing Projects
          </h4>
          <div className="space-y-2">
            {portfolio.topPerforming.length > 0 ? (
              portfolio.topPerforming.map((item: any) => <ProjectRow key={item.project.id} item={item} highlight="good" />)
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center text-[11px] text-gray-400">No positive-NPV projects yet.</div>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-gray-900">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Projects Requiring Attention
          </h4>
          <div className="space-y-2">
            {portfolio.needsAttention.length > 0 ? (
              portfolio.needsAttention.map((item: any) => <ProjectRow key={item.project.id} item={item} highlight="bad" />)
            ) : (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-3 text-center text-[11px] text-emerald-700">
                <TrendingUp className="mx-auto mb-1 h-4 w-4" /> Every project has a positive NPV and a viable payback.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <InvestmentCharts projects={portfolio.projects} />
    </div>
  );
}
