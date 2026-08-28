import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { fmtCategoryValue } from "./investmentCategories";
import MobileTableCards from "../../components/common/MobileTableCards";
import { TrophyIcon } from "@heroicons/react/24/outline";

export default function BranchComparisonTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/branch-ranking`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setRows(json.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [user?.restaurantId]);

  const rankBadge = (index: number) => {
    if (index === 0) return "bg-amber-100 text-amber-700";
    if (index === 1) return "bg-gray-200 text-gray-700";
    if (index === 2) return "bg-orange-100 text-orange-700";
    return "bg-gray-50 text-gray-500";
  };

  if (loading) return <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading branch investment data…</div>;

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
        No branch-scoped investment projects yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[16px] font-bold text-gray-900">Investment Opportunities by Branch</h3>
        <p className="text-[11px] text-gray-500">Which branch offers the highest ROI, the shortest payback, and the greatest long-term value (total NPV)?</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <MobileTableCards>
        <table className="w-full text-[12px] min-w-[36rem]">
          <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-right">Projects</th>
              <th className="px-3 py-2 text-right">Capital Deployed</th>
              <th className="px-3 py-2 text-right">Total NPV</th>
              <th className="px-3 py-2 text-right">Best ROI</th>
              <th className="px-3 py-2 text-right">Shortest Payback</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.branch.id} className="border-t border-gray-100">
                <td className="px-4 py-2.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${rankBadge(i)}`}>
                    {i === 0 ? <TrophyIcon className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-semibold text-gray-900">{row.branch.name}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{row.projectCount}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{fmtCategoryValue(row.totalCapitalDeployed, "currency")}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${(row.totalNPV ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtCategoryValue(row.totalNPV, "currency")}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{row.bestROI != null ? `${row.bestROI.toFixed(1)}%` : "—"}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{row.shortestPaybackYears != null ? `${row.shortestPaybackYears.toFixed(2)}y` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </MobileTableCards>
      </div>
    </div>
  );
}
