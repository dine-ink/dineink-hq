import { useEffect, useState } from "react";
// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "../../store";
import { fmtCategoryValue, PERIOD_OPTIONS } from "./executiveCategories";

const REPORT_TYPES = [
  { key: "summary", label: "Executive Summary Report" },
  { key: "ceo", label: "CEO Dashboard Report" },
  { key: "branch", label: "Multi-Branch Performance Report" },
  { key: "scorecard", label: "KPI Scorecard Report" },
  { key: "trend", label: "Executive Trend Report" },
  { key: "health", label: "Business Health Report" },
  { key: "risk", label: "Executive Risk Report" },
];

export default function ReportsTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [reportType, setReportType] = useState("summary");
  const [period, setPeriod] = useState("currentMonth");
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
        if (reportType === "summary" || reportType === "ceo") {
          const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/overview?period=${period}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Current", "Target", "Previous Period", "Achievement %", "Status"]);
          setRows((json.data?.kpis || []).map((k: any) => ({
            label: k.label, unit: k.unit,
            values: [fmtCategoryValue(k.current, k.unit), k.target != null ? fmtCategoryValue(k.target, k.unit) : "—", k.previousPeriod != null ? fmtCategoryValue(k.previousPeriod, k.unit) : "—", k.achievementPercentage != null ? `${k.achievementPercentage.toFixed(0)}%` : "—", k.status],
          })));
          if (reportType === "ceo") {
            const healthRes = await fetch(`${API_URL}/api/executive/${user.restaurantId}/health-score?period=${period}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
            const healthJson = await healthRes.json();
            setRows((prev) => [
              { label: "Business Health Score", unit: "count", values: [String(healthJson.data?.overall ?? "—"), "—", "—", "—", healthJson.data?.status ?? "—"] },
              ...prev,
            ]);
          }
        } else if (reportType === "branch") {
          const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/multi-branch?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Revenue", "Profit", "EBITDA", "Food Cost %", "Labour %", "ROI", "Health Score"]);
          setRows((json.data?.branches || []).map((b: any) => ({
            label: b.branch.name, unit: "currency",
            values: [fmtCategoryValue(b.revenue, "currency"), fmtCategoryValue(b.netProfit, "currency"), fmtCategoryValue(b.ebitda, "currency"), b.foodCostPercentage != null ? `${b.foodCostPercentage.toFixed(1)}%` : "—", b.labourCostPercentage != null ? `${b.labourCostPercentage.toFixed(1)}%` : "—", b.roi != null ? `${b.roi.toFixed(1)}%` : "—", String(b.healthScore)],
          })));
        } else if (reportType === "scorecard") {
          const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/scorecards?period=${period}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Current", "Target", "Budget", "Forecast", "Achievement %", "Status"]);
          setRows((json.data || []).map((r: any) => ({
            label: r.label, unit: r.unit,
            values: [fmtCategoryValue(r.current, r.unit), r.target != null ? fmtCategoryValue(r.target, r.unit) : "—", r.budget != null ? fmtCategoryValue(r.budget, r.unit) : "—", r.forecast != null ? fmtCategoryValue(r.forecast, r.unit) : "—", r.achievementPercentage != null ? `${r.achievementPercentage.toFixed(0)}%` : "—", r.status],
          })));
        } else if (reportType === "trend") {
          const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/timeline?granularity=monthly${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Revenue", "Net Profit", "EBITDA"]);
          setRows((json.data?.points || []).map((p: any) => ({ label: p.label, unit: "currency", values: [fmtCategoryValue(p.revenue, "currency"), fmtCategoryValue(p.netProfit, "currency"), fmtCategoryValue(p.ebitda, "currency")] })));
        } else if (reportType === "health") {
          const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/health-score?period=${period}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Score", "Weight", "Contribution", "Status"]);
          setRows((json.data?.categories || []).map((c: any) => ({ label: c.label, unit: "count", values: [c.clampedScore != null ? c.clampedScore.toFixed(0) : "—", `${(c.weight * 100).toFixed(0)}%`, c.contribution.toFixed(1), c.status] })));
        } else if (reportType === "risk") {
          const res = await fetch(`${API_URL}/api/executive/${user.restaurantId}/alerts?period=${period}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Severity", "Impact", "Recommended Action"]);
          setRows((json.data || []).map((a: any) => ({ label: a.message, unit: "count", values: [a.severity, a.impact, a.recommendedAction] })));
        }
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reportType, period, user?.restaurantId, selectedBranch?.id]);

  const reportTitle = REPORT_TYPES.find((r) => r.key === reportType)?.label || "Executive Report";
  const rowLabel = reportType === "risk" ? "Alert" : reportType === "branch" ? "Branch" : reportType === "trend" ? "Period" : "KPI";

  const handleExportPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16); doc.setTextColor(177, 0, 0); doc.text(reportTitle, 14, 16);
    autoTable(doc, { startY: 24, head: [[rowLabel, ...columns]], body: rows.map((r) => [r.label, ...r.values]), theme: "grid", headStyles: { fillColor: [177, 0, 0] }, styles: { fontSize: 9 }, margin: { left: 14, right: 14 } });
    doc.save(`executive-${reportType}-report.pdf`);
  };

  const handleExportExcel = async () => {
    if (rows.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Executive Report");
    ws.columns = [{ width: 32 }, ...columns.map(() => ({ width: 20 }))];
    ws.addRow([reportTitle]).font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow([rowLabel, ...columns]).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.label, ...r.values]));
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `executive-${reportType}-report.xlsx`);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const lines: string[] = [reportTitle, "", [rowLabel, ...columns].join(",")];
    rows.forEach((r) => lines.push([`"${r.label}"`, ...r.values.map((v: string) => `"${v}"`)].join(",")));
    saveAs(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }), `executive-${reportType}-report.csv`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {REPORT_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {PERIOD_OPTIONS.filter((p) => p.key !== "custom").map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportPDF} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF</button>
          <button type="button" onClick={handleExportExcel} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> Excel</button>
          <button type="button" onClick={handleExportCSV} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> CSV</button>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"><PrinterIcon className="h-3.5 w-3.5" /> Print</button>
        </div>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[16px] font-bold text-gray-900">{reportTitle}</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr><th className="px-4 py-2 text-left">{rowLabel}</th>{columns.map((c) => <th key={c} className="px-3 py-2 text-right">{c}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                    {r.values.map((v: string, j: number) => <td key={j} className="px-3 py-2 text-right text-gray-900">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
