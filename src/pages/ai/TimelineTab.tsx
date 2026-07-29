import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { TrendChart } from "../executive/ExecutiveCharts";
import { CATEGORY_BADGE_STYLES, CATEGORY_LABELS, SEVERITY_STYLES } from "./aiCategories";

export default function TimelineTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [logs, setLogs] = useState<any[]>([]);
  const [trendPoints, setTrendPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
        const [logsRes, timelineRes] = await Promise.all([
          fetch(`${API_URL}/api/ai/${user.restaurantId}/insight-timeline?limit=50${branchParam}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/executive/${user.restaurantId}/timeline?granularity=monthly${branchParam}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [logsJson, timelineJson] = await Promise.all([logsRes.json(), timelineRes.json()]);
        if (logsJson.success) setLogs(logsJson.data);
        if (timelineJson.success) setTrendPoints(timelineJson.data.points || []);
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.restaurantId, selectedBranch?.id]);

  return (
    <div className="space-y-4">
      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && (
        <>
          <TrendChart points={trendPoints} />

          <div>
            <h4 className="mb-2 text-[13px] font-bold text-gray-900">Historical Insight Timeline</h4>
            {logs.length === 0 ? (
              <p className="text-[12px] text-gray-400">No insights have been logged yet — visit the Insights tab to generate today's analysis.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const style = SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info;
                  return (
                    <div key={log.id} className={`rounded-xl border ${style.border} ${style.bg} px-3.5 py-2.5`}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-500">{new Date(log.logDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[log.category] || "bg-gray-100 text-gray-600"}`}>
                          {CATEGORY_LABELS[log.category] || log.category}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${style.text} bg-white/70`}>{log.severity}</span>
                      </div>
                      <p className="mt-1 text-[12px] font-bold text-gray-900">{log.title}</p>
                      <p className="text-[11px] text-gray-600">{log.summary}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
