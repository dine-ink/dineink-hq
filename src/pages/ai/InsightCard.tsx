import { AlertTriangle, AlertCircle, Lightbulb, TrendingUp, Sparkles } from "lucide-react";
import { CATEGORY_BADGE_STYLES, CATEGORY_LABELS, CONFIDENCE_STYLES, fmtCategoryValue, SEVERITY_STYLES } from "./aiCategories";

const CATEGORY_ICON: Record<string, any> = {
  insight: Lightbulb, risk: AlertCircle, opportunity: TrendingUp, recommendation: Sparkles, anomaly: AlertTriangle,
};

export default function InsightCard({ insight }: { insight: any }) {
  const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
  const Icon = CATEGORY_ICON[insight.category] || Lightbulb;

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ${style.text}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[insight.category] || "bg-gray-100 text-gray-600"}`}>
              {CATEGORY_LABELS[insight.category] || insight.category}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${style.text} bg-white/70`}>{insight.severity}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${CONFIDENCE_STYLES[insight.confidence] || "bg-gray-100 text-gray-600"}`}>
              {insight.confidence} confidence
            </span>
          </div>
          <p className="mt-1.5 text-[13px] font-bold text-gray-900">{insight.title}</p>
          <p className="mt-0.5 text-[12px] text-gray-700">{insight.summary}</p>

          {insight.supportingMetrics?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {insight.supportingMetrics.map((m: any, i: number) => (
                <span key={i} className="rounded-lg bg-white/70 px-2 py-1 text-[11px] font-medium text-gray-600">
                  {m.label}: <span className="font-bold text-gray-900">{m.unit ? fmtCategoryValue(typeof m.value === "number" ? m.value : null, m.unit) : String(m.value ?? "—")}</span>
                </span>
              ))}
            </div>
          )}

          {insight.recommendedActions?.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-gray-600">
              {insight.recommendedActions.map((a: string, i: number) => <li key={i}>{a}</li>)}
            </ul>
          )}

          {insight.relatedScreens?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {insight.relatedScreens.map((s: string, i: number) => (
                <a key={i} href={s} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50">
                  {s.replace("/dashboard/", "").replace(/-/g, " ")}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
