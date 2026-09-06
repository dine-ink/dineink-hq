import { useState } from "react";
import { useAppSelector } from "@/store";
import { ASK_QUESTIONS, fmtCategoryValue, PERIOD_OPTIONS } from "./aiCategories";
import {
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

export default function AskTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [period, setPeriod] = useState("currentMonth");
  const [percentage, setPercentage] = useState(10);
  const [loading, setLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";

  const ask = async (key: string, needsPercentage: boolean) => {
    if (!user?.restaurantId) return;
    setLoading(key);
    try {
      const qs = needsPercentage ? `percentage=${percentage}&period=${period}` : `period=${period}${branchParam}`;
      const res = await fetch(`${API_URL}/api/ai/${user.restaurantId}/ask/${key}?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setHistory((prev) => [json.data, ...prev]);
    } catch {
      // fetch error — silently ignored
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
          {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2">
          <span className="text-[11px] font-semibold text-gray-500">Sales change %:</span>
          <input type="number" value={percentage} onChange={(e) => setPercentage(Number(e.target.value))} className="w-16 text-[12px] font-semibold text-gray-900 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ASK_QUESTIONS.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => ask(q.key, q.needsPercentage)}
            disabled={loading === q.key}
            className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="flex items-center gap-2"><ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5 text-[#b10000]" /> {q.label.replace("X", String(percentage))}</span>
            <PaperAirplaneIcon className="h-3.5 w-3.5 text-gray-400" />
          </button>
        ))}
      </div>

      {loading && <div className="flex h-16 items-center justify-center text-[12px] text-gray-400">Thinking…</div>}

      <div className="space-y-3">
        {history.map((a, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{a.question}</p>
            <p className="mt-1 text-[13px] font-medium text-gray-900">{a.answer}</p>
            {a.supportingMetrics?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {a.supportingMetrics.map((m: any, j: number) => (
                  <span key={j} className="rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600">
                    {m.label}: <span className="font-bold text-gray-900">{m.unit ? fmtCategoryValue(typeof m.value === "number" ? m.value : null, m.unit) : String(m.value ?? "—")}</span>
                  </span>
                ))}
              </div>
            )}
            {a.relatedScreens?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.relatedScreens.map((s: string, j: number) => (
                  <a key={j} href={s} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50">
                    {s.replace("/dashboard/", "").replace(/-/g, " ")}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {history.length === 0 && !loading && (
          <div className="flex h-16 items-center justify-center text-[12px] text-gray-400">Ask a question above to get a data-backed answer.</div>
        )}
      </div>
    </div>
  );
}
