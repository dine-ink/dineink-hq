import { useAppSelector } from "@/store";
import { useGetExecutiveTimelineQuery } from "@/store/api/executiveApi";
import { useGetAiInsightTimelineQuery } from "@/store/api/aiApi";
import { TrendChart } from "@/pages/executive/ExecutiveCharts";
import { CATEGORY_BADGE_STYLES, CATEGORY_LABELS, SEVERITY_STYLES } from "./aiCategories";

export default function TimelineTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  // Two sources, two slices: the trend series belongs to the executive module,
  // the insight log to the AI one. That split used to be half-done — the
  // comment here said the log "moves when that module does", and it now has.
  const { data: timeline, isFetching: timelineLoading } = useGetExecutiveTimelineQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: selectedBranch?.id ?? null,
      granularity: "monthly",
    },
    { skip: !user?.restaurantId },
  );
  const trendPoints = timeline?.points ?? [];

  // On failure the list is empty and the trend chart above is unaffected, which
  // is what the old catch arranged by hand.
  const { data: logs = [], isFetching: logsLoading } = useGetAiInsightTimelineQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: selectedBranch?.id,
      limit: 50,
    },
    { skip: !user?.restaurantId },
  );
  const loading = logsLoading || timelineLoading;

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
