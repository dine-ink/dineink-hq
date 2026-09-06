import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { ALL_KPI_LABELS, fmtCategoryValue, PERIOD_OPTIONS, STATUS_STYLES, WIDGET_KPIS } from "./executiveCategories";
import { AlertIcon, TrendIcon } from "@/utils/kpiDisplay";
import { ALERT_STYLES, trendStyle } from "@/utils/kpiStyles";
import MobileTableCards from "@/components/common/MobileTableCards";
import {
  Cog6ToothIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function OverviewTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("currentMonth");
  const [overview, setOverview] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [pinnedKpis, setPinnedKpis] = useState<string[]>(WIDGET_KPIS);

  const branchParam = scope === "branch" && selectedBranch?.id ? `branchId=${selectedBranch.id}` : "";

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.restaurantId) return;
      try {
        const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/preferences`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success && json.data?.pinnedKpis) setPinnedKpis(json.data.pinnedKpis);
        if (json.success && json.data?.defaultPeriod) setPeriod(json.data.defaultPeriod);
      } catch {
        // fetch error — silently ignored
      }
    };
    fetchPreferences();
  }, [user?.restaurantId]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const qs = `period=${period}${branchParam ? `&${branchParam}` : ""}`;
        const [overviewRes, healthRes, alertsRes] = await Promise.all([
          fetch(`${API_URL}/api/executive/${user.restaurantId}/overview?${qs}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/executive/${user.restaurantId}/health-score?${qs}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/executive/${user.restaurantId}/alerts?${qs}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [overviewJson, healthJson, alertsJson] = await Promise.all([overviewRes.json(), healthRes.json(), alertsRes.json()]);
        if (overviewJson.success) setOverview(overviewJson.data);
        if (healthJson.success) setHealth(healthJson.data);
        if (alertsJson.success) setAlerts(alertsJson.data);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user?.restaurantId, selectedBranch?.id, scope, period]);

  /**
   * These saves are optimistic — the pin or reorder is applied on screen first
   * and persisted after. When the save failed, nothing happened at all: the new
   * layout stayed on screen and quietly reverted on the next page load, which
   * reads as the app forgetting the setting rather than as a failure.
   *
   * `rollback` puts the UI back instead. An alert on every pin click would be
   * disproportionate for a layout preference; the pin visibly snapping back is
   * the feedback, and the real reason goes to the console for diagnosis. The
   * response is also checked now — this only awaited the request, so a 400 was
   * as invisible as a thrown error.
   */
  const savePreferences = async (
    next: { pinnedKpis?: string[]; defaultPeriod?: string },
    rollback?: () => void,
  ) => {
    if (!user?.restaurantId) return;
    try {
      const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/preferences`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restaurantId: user.restaurantId, ...next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Request failed (${res.status})`);
      }
    } catch (error) {
      console.error("[executive] could not save dashboard preferences:", error);
      rollback?.();
    }
  };

  const togglePin = (key: string) => {
    const previous = pinnedKpis;
    const next = pinnedKpis.includes(key) ? pinnedKpis.filter((k) => k !== key) : [...pinnedKpis, key];
    setPinnedKpis(next);
    savePreferences({ pinnedKpis: next }, () => setPinnedKpis(previous));
  };

  const moveKpi = (index: number, direction: -1 | 1) => {
    const previous = pinnedKpis;
    const next = [...pinnedKpis];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPinnedKpis(next);
    savePreferences({ pinnedKpis: next }, () => setPinnedKpis(previous));
  };

  const handlePeriodChange = (value: string) => {
    const previous = period;
    setPeriod(value);
    savePreferences({ defaultPeriod: value }, () => setPeriod(previous));
  };

  const kpisByKey = overview ? Object.fromEntries(overview.kpis.map((k: any) => [k.key, k])) : {};
  const healthStyle = health ? STATUS_STYLES[health.status] : STATUS_STYLES["no-data"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button type="button" onClick={() => setScope("branch")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "branch" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {selectedBranch?.name || "This Branch"}
            </button>
            <button type="button" onClick={() => setScope("restaurant")} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "restaurant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              Entire Restaurant
            </button>
          </div>
          <select value={period} onChange={(e) => handlePeriodChange(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {PERIOD_OPTIONS.filter((p) => p.key !== "custom").map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setShowCustomize((v) => !v)} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
          <Cog6ToothIcon className="h-3.5 w-3.5" /> Customize
        </button>
      </div>

      {/* CUSTOMIZE PANEL */}
      {showCustomize && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="mb-2 text-[11px] font-semibold text-gray-600">Pinned KPI cards — reorder, hide, or pin more from the full list below.</p>
          <div className="space-y-1.5">
            {pinnedKpis.map((key, i) => (
              <div key={key} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
                <EllipsisVerticalIcon className="h-3.5 w-3.5 text-gray-300" />
                <span className="flex-1 text-[12px] font-medium text-gray-700">{ALL_KPI_LABELS[key] || key}</span>
                <button type="button" onClick={() => moveKpi(i, -1)} className="rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100">↑</button>
                <button type="button" onClick={() => moveKpi(i, 1)} className="rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100">↓</button>
                <button type="button" onClick={() => togglePin(key)} className="rounded px-1.5 py-0.5 text-red-500 hover:bg-red-50"><EyeSlashIcon className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase text-gray-400">Add more</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(ALL_KPI_LABELS).filter((k) => !pinnedKpis.includes(k)).map((k) => (
              <button key={k} type="button" onClick={() => togglePin(k)} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50">
                <EyeIcon className="h-3 w-3" /> {ALL_KPI_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && overview && (
        <>
          {/* BUSINESS HEALTH SCORE */}
          {health && (
            <div className={`rounded-2xl border ${healthStyle.border} ${healthStyle.bg} p-4 shadow-sm`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${healthStyle.border} bg-white`}>
                    <span className={`text-[20px] font-black ${healthStyle.text}`}>{health.overall}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">Business Health Score</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${healthStyle.text}`}>{health.status}</span>
                  </div>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-5">
                  {health.categories.map((c: any) => {
                    const style = STATUS_STYLES[c.status] || STATUS_STYLES["no-data"];
                    return (
                      <div key={c.key} className="rounded-lg bg-white/70 p-2">
                        <p className="truncate text-[9px] font-semibold uppercase text-gray-500">{c.label}</p>
                        <p className={`text-[13px] font-bold ${style.text}`}>{c.clampedScore != null ? c.clampedScore.toFixed(0) : "—"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              {health.suggestions?.length > 0 && (
                <div className="mt-3 border-t border-white/60 pt-3">
                  <p className="mb-1 text-[11px] font-bold text-gray-700">Improvement Suggestions</p>
                  <ul className="list-inside list-disc space-y-0.5 text-[11px] text-gray-600">
                    {health.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ALERT CENTER */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[13px] font-bold text-gray-900">Executive Alert Center</h4>
              {alerts.map((a, i) => {
                const style = ALERT_STYLES[a.severity] || ALERT_STYLES.info;
                return (
                  <div key={i} className={`rounded-xl border ${style.border} ${style.bg} px-3 py-2 text-[12px] ${style.text}`}>
                    <div className="flex items-start gap-2">
                      <AlertIcon severity={a.severity} />
                      <div className="flex-1">
                        <p className="font-semibold">{a.message}</p>
                        <p className="mt-0.5 text-[11px] opacity-80">{a.impact}</p>
                        <p className="mt-0.5 text-[11px] font-medium">→ {a.recommendedAction}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PINNED KPI CARDS */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pinnedKpis.map((key) => {
              const row = kpisByKey[key];
              if (!row) return null;
              const style = STATUS_STYLES[row.status] || STATUS_STYLES["no-data"];
              return (
                <div key={key} className={`rounded-2xl border ${style.border} ${style.bg} p-3.5 shadow-sm`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">{row.label}</p>
                  <p className="mt-2 text-[20px] font-extrabold tracking-tight text-gray-900">{fmtCategoryValue(row.current, row.unit)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${trendStyle(row.trendDirection, row.higherIsBetter)}`}>
                      <TrendIcon direction={row.trendDirection} />
                      {row.variancePercentage != null ? `${row.variancePercentage > 0 ? "+" : ""}${row.variancePercentage.toFixed(1)}%` : "—"}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}% of target` : "No target set"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FULL KPI TABLE */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <MobileTableCards>
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">KPI</th>
                  <th className="px-3 py-2 text-right">Current</th>
                  <th className="px-3 py-2 text-right">Target</th>
                  <th className="px-3 py-2 text-right">Previous Period</th>
                  <th className="px-3 py-2 text-right">Achievement %</th>
                  <th className="px-3 py-2 text-center">Trend</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.kpis.map((row: any) => {
                  const style = STATUS_STYLES[row.status] || STATUS_STYLES["no-data"];
                  return (
                    <tr key={row.key} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-700">{row.label}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmtCategoryValue(row.current, row.unit)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{row.target != null ? fmtCategoryValue(row.target, row.unit) : "—"}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{row.previousPeriod != null ? fmtCategoryValue(row.previousPeriod, row.unit) : "—"}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{row.achievementPercentage != null ? `${row.achievementPercentage.toFixed(0)}%` : "—"}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex ${trendStyle(row.trendDirection, row.higherIsBetter)}`}><TrendIcon direction={row.trendDirection} /></span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${style.bg} ${style.text}`}>{row.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </>
      )}
    </div>
  );
}
