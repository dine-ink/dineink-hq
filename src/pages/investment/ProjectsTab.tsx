import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { tooltipFormatter } from "@/utils/chartFormatters";
import { useAppSelector } from "@/store";
import { ASSUMPTION_FIELDS, fmtCategoryValue, INVESTMENT_STATUSES, INVESTMENT_TYPES, riskLevelFor, RISK_STYLES, STATUS_STYLES } from "./investmentCategories";
import MobileTableCards from "@/components/common/MobileTableCards";
import {
  ArrowLeftIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const SCENARIO_TYPE_LABEL: Record<string, string> = { CONSERVATIVE: "Conservative", EXPECTED: "Expected", OPTIMISTIC: "Optimistic" };

export default function ProjectsTab() {
  const { branches } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selected, setSelected] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenarioId, setScenarioId] = useState<string>("");
  const [forecastComparison, setForecastComparison] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({});

  const fetchProjects = async () => {
    if (!user?.restaurantId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setProjects(json.data);
    } catch {
      // fetch error — silently ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [user?.restaurantId]);

  const openCreate = () => {
    setForm({ name: "", type: "CUSTOM", branchId: "restaurant", initialInvestment: "", plannedStartDate: new Date().toISOString().slice(0, 10), projectLifeYears: "5" });
    setView("create");
  };

  const handleCreate = async () => {
    if (!form.name?.trim()) { alert("Please enter a project name"); return; }
    if (!form.initialInvestment || Number(form.initialInvestment) <= 0) { alert("Please enter a positive initial investment"); return; }
    setSaving(true);
    try {
      const body: Record<string, any> = {
        name: form.name.trim(), type: form.type, description: form.description || null,
        branchId: form.branchId === "restaurant" ? null : Number(form.branchId),
        initialInvestment: Number(form.initialInvestment), plannedStartDate: form.plannedStartDate,
        projectLifeYears: Number(form.projectLifeYears || 5),
      };
      ASSUMPTION_FIELDS.forEach((f) => { if (form[f.key]) body[f.key] = Number(form[f.key]); });
      const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) { await fetchProjects(); openDetail(json.data); } else { alert(json.message || "Failed to create investment"); }
    } catch {
      alert("Failed to create investment");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (project: any) => {
    setSelected(project);
    const values: Record<string, string> = { name: project.name, description: project.description || "" };
    ASSUMPTION_FIELDS.forEach((f) => { values[f.key] = project[f.key] != null ? String(project[f.key]) : ""; });
    setForm(values);
    setScenarioId("");
    setView("edit");
    await loadMetrics(project.id, "");
    await loadForecastComparison(project.id);
    if (user?.restaurantId) {
      try {
        const branchParam = project.branchId ?? "null";
        const res = await fetch(`${API_URL}/api/scenarios/${user.restaurantId}?branchId=${branchParam}&activeOnly=true`, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setScenarios(json.data);
      } catch {
        // fetch error — silently ignored
      }
    }
  };

  const loadMetrics = async (investmentId: number, scenario: string) => {
    try {
      const scenarioParam = scenario ? `?scenarioId=${scenario}` : "";
      const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/${investmentId}/metrics${scenarioParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setMetrics(json.data);
    } catch {
      // fetch error — silently ignored
    }
  };

  const loadForecastComparison = async (investmentId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/${investmentId}/forecast-comparison`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) setForecastComparison(json.data);
    } catch {
      // fetch error — silently ignored
    }
  };

  const handleScenarioChange = (value: string) => {
    setScenarioId(value);
    if (selected) loadMetrics(selected.id, value);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: Record<string, any> = { name: form.name.trim(), description: form.description || null };
      ASSUMPTION_FIELDS.forEach((f) => { body[f.key] = form[f.key] ? Number(form[f.key]) : null; });
      const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/${selected.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) { setSelected(json.data); await fetchProjects(); await loadMetrics(selected.id, scenarioId); }
    } catch {
      // save error — silently ignored
    } finally {
      setSaving(false);
    }
  };

  const handleSetStatus = async (status: string) => {
    if (!selected) return;
    const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/${selected.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.success) { setSelected(json.data); await fetchProjects(); }
  };

  const handleDelete = async (project: any) => {
    if (!confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    const res = await fetch(`${API_URL}/api/investments/${user.restaurantId}/${project.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) await fetchProjects();
    else alert(json.message || "Failed to delete");
  };

  const statusBadge = (status: string) => {
    const style = STATUS_STYLES[status] || STATUS_STYLES.PLANNED;
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>{INVESTMENT_STATUSES.find((s) => s.key === status)?.label || status}</span>;
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-gray-900">Investment Projects</h3>
          <button type="button" onClick={openCreate} className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]">
            <PlusIcon className="h-3.5 w-3.5" /> New Investment
          </button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
            No investment projects yet — create one to evaluate before committing capital.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <MobileTableCards>
            <table className="w-full text-[12px] min-w-[36rem]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-3 py-2 text-right">Initial Investment</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => openDetail(p)} className="font-semibold text-gray-900 hover:text-[#b10000]">{p.name}</button>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{INVESTMENT_TYPES.find((t) => t.key === p.type)?.label || p.type}</td>
                    <td className="px-4 py-2.5 text-gray-600">{p.branch?.name || "Restaurant-wide"}</td>
                    <td className="px-3 py-2.5 text-right text-gray-900">{fmtCategoryValue(p.initialInvestment, "currency")}</td>
                    <td className="px-4 py-2.5">{statusBadge(p.status)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => handleDelete(p)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50">
                        <TrashIcon className="h-3 w-3" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        )}
      </div>
    );
  }

  // ── CREATE VIEW ────────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setView("list")} className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Projects
        </button>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-[15px] font-bold text-gray-900">New Investment Project</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Project Name</label>
              <input type="text" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. New Kitchen Equipment" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Type</label>
              <select value={form.type || "CUSTOM"} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white">
                {INVESTMENT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Scope</label>
              <select value={form.branchId || "restaurant"} onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white">
                <option value="restaurant">Restaurant-wide</option>
                {(branches || []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Initial Investment (₹)</label>
              <input type="number" value={form.initialInvestment || ""} onChange={(e) => setForm((p) => ({ ...p, initialInvestment: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Planned Start Date</label>
              <input type="date" value={form.plannedStartDate || ""} onChange={(e) => setForm((p) => ({ ...p, plannedStartDate: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Project Life (Years)</label>
              <input type="number" value={form.projectLifeYears || "5"} onChange={(e) => setForm((p) => ({ ...p, projectLifeYears: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white" />
            </div>
          </div>

          <p className="mb-3 mt-5 text-[11px] text-gray-500">Assumptions — leave blank to inherit sensible defaults (Discount Rate 12%, Inflation from Financial Assumptions).</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ASSUMPTION_FIELDS.filter((f) => f.key !== "initialInvestment").map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-[11px] font-medium text-gray-600">{f.label}</label>
                <input type="number" value={form[f.key] || ""} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder="Default" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white" />
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={handleCreate} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50">
              {saving ? "Creating…" : "Create Investment"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DETAIL / EDIT VIEW ────────────────────────────────────────────────
  const risk = metrics ? riskLevelFor(metrics.npv, metrics.paybackPeriodYears, selected?.projectLifeYears || 5) : "medium";
  const riskStyle = RISK_STYLES[risk];
  const cashFlowChartData = metrics?.projection?.cumulativeCashFlows.map((v: number, i: number) => ({ year: i === 0 ? "Start" : `Year ${i}`, value: v })) || [];

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setView("list")} className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Projects
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold text-gray-900">{selected?.name}</h3>
          {statusBadge(selected?.status)}
          {metrics && <span className={`rounded-full border ${riskStyle.border} ${riskStyle.bg} px-2 py-0.5 text-[10px] font-semibold capitalize ${riskStyle.text}`}>{risk} risk</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selected?.status || "PLANNED"} onChange={(e) => handleSetStatus(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 outline-none">
            {INVESTMENT_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button type="button" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50">
            <CheckIcon className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">ROI</p>
            <p className={`mt-1 text-[18px] font-extrabold ${(metrics.roiPercentage ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"}`}>{metrics.roiPercentage != null ? `${metrics.roiPercentage.toFixed(1)}%` : "—"}</p>
            <p className="text-[10px] text-gray-400">Annualized {metrics.annualizedRoiPercentage != null ? `${metrics.annualizedRoiPercentage.toFixed(1)}%` : "—"}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">NPV</p>
            <p className={`mt-1 text-[18px] font-extrabold ${metrics.npv >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtCategoryValue(metrics.npv, "currency")}</p>
            <p className="text-[10px] text-gray-400">Profitability Index {metrics.profitabilityIndex != null ? metrics.profitabilityIndex.toFixed(2) : "—"}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">IRR</p>
            <p className="mt-1 text-[18px] font-extrabold text-gray-900">{metrics.irrPercentage != null ? `${metrics.irrPercentage.toFixed(1)}%` : "No real root"}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Payback Period</p>
            <p className="mt-1 text-[18px] font-extrabold text-gray-900">{metrics.paybackPeriodYears != null ? `${metrics.paybackPeriodYears.toFixed(2)}y` : "Never"}</p>
            <p className="text-[10px] text-gray-400">Discounted {metrics.discountedPaybackPeriodYears != null ? `${metrics.discountedPaybackPeriodYears.toFixed(2)}y` : "Never"}</p>
          </div>
        </div>
      )}

      {/* SCENARIO EVALUATION */}
      {scenarios.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Evaluate under scenario</label>
          <select value={scenarioId} onChange={(e) => handleScenarioChange(e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-semibold text-gray-700 outline-none">
            <option value="">This project's own assumptions</option>
            {scenarios.map((s) => <option key={s.id} value={s.id}>{SCENARIO_TYPE_LABEL[s.type] || s.name}</option>)}
          </select>
          <p className="mt-1.5 text-[10px] text-gray-400">Substitutes the scenario's effect on revenue growth for this project's own Annual Revenue Growth assumption.</p>
        </div>
      )}

      {/* CASH FLOW CHART */}
      {metrics && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-[11px] font-bold text-gray-700">Cumulative Cash Flow</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlowChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={tooltipFormatter((v) => fmtCategoryValue(v, "currency"))} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {cashFlowChartData.map((d: any, i: number) => <Cell key={i} fill={d.value >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* FORECAST WITH VS WITHOUT INVESTMENT */}
      {forecastComparison && (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 text-[11px] font-bold text-gray-900">Forecast: With vs Without This Investment (Next Year)</div>
          <div className="overflow-x-auto">
          <MobileTableCards>
          <table className="w-full text-[12px] min-w-[36rem]">
            <thead className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">KPI</th>
                <th className="px-3 py-2 text-right">Without Investment</th>
                <th className="px-3 py-2 text-right">With Investment</th>
                <th className="px-3 py-2 text-right">Uplift %</th>
              </tr>
            </thead>
            <tbody>
              {forecastComparison.rows.map((r: any) => (
                <tr key={r.key} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{fmtCategoryValue(r.withoutInvestment, r.unit)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">{fmtCategoryValue(r.withInvestment, r.unit)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">{r.upliftPercentage != null ? `+${r.upliftPercentage.toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </MobileTableCards>
          </div>
        </div>
      )}

      {/* ASSUMPTIONS EDIT FORM */}
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="bg-gray-50 px-4 py-2 text-[11px] font-bold text-gray-900">Assumptions</div>
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">
          {ASSUMPTION_FIELDS.filter((f) => f.key !== "initialInvestment").map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">{f.label}</label>
              <input type="number" value={form[f.key] || ""} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder="Default" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-red-300 focus:bg-white" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
