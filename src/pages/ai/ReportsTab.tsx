import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "../../store";
import { PERIOD_OPTIONS } from "./aiCategories";
import MobileTableCards from "../../components/common/MobileTableCards";

const REPORT_TYPES = [
  { key: "executive", label: "AI Executive Report" },
  { key: "insights", label: "Business Insight Report" },
  { key: "risk", label: "Risk Assessment Report" },
  { key: "opportunity", label: "Opportunity Report" },
  { key: "branch", label: "Branch AI Report" },
  { key: "weekly", label: "Weekly Executive Summary" },
];

export default function ReportsTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [reportType, setReportType] = useState("executive");
  const [period, setPeriod] = useState("currentMonth");
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<{ label: string; values: string[] }[]>([]);
  const [summaryLines, setSummaryLines] = useState<string[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        if (reportType === "executive" || reportType === "weekly") {
          const res = await fetch(`${API_URL}/api/ai/${user.restaurantId}/executive-brief?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          const brief = json.data;
          setSummaryLines(brief ? [
            `Business Health: ${brief.businessHealth.overall}/100 (${brief.businessHealth.status})`,
            `Budget Performance: ${brief.budgetPerformance}`,
            `Forecast Summary: ${brief.forecastSummary}`,
            `Investment Updates: ${brief.investmentUpdates}`,
          ] : []);
          setColumns(["Category", "Severity", "Summary"]);
          setRows(brief ? [
            ...brief.biggestWins.map((w: any) => ({ label: w.title, values: ["Opportunity", w.severity, w.summary] })),
            ...brief.biggestRisks.map((r: any) => ({ label: r.title, values: ["Risk", r.severity, r.summary] })),
            ...brief.immediatePriorities.map((p: string) => ({ label: p, values: ["Priority", "—", "Immediate priority flagged by the AI Advisor"] })),
          ] : []);
        } else if (reportType === "insights") {
          const res = await fetch(`${API_URL}/api/ai/${user.restaurantId}/insights?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setSummaryLines([]);
          setColumns(["Category", "Severity", "Confidence", "Summary"]);
          setRows((json.data || []).map((i: any) => ({ label: i.title, values: [i.category, i.severity, i.confidence, i.summary] })));
        } else if (reportType === "risk") {
          const res = await fetch(`${API_URL}/api/ai/${user.restaurantId}/risks?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setSummaryLines([]);
          setColumns(["Severity", "Confidence", "Summary", "Recommended Action"]);
          setRows((json.data || []).map((r: any) => ({ label: r.title, values: [r.severity, r.confidence, r.summary, r.recommendedActions[0] || "—"] })));
        } else if (reportType === "opportunity") {
          const res = await fetch(`${API_URL}/api/ai/${user.restaurantId}/opportunities?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setSummaryLines([]);
          setColumns(["Confidence", "Summary", "Recommended Action"]);
          setRows((json.data || []).map((o: any) => ({ label: o.title, values: [o.confidence, o.summary, o.recommendedActions[0] || "—"] })));
        } else if (reportType === "branch") {
          const res = await fetch(`${API_URL}/api/ai/${user.restaurantId}/branch-narratives?period=${period}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setSummaryLines([]);
          setColumns(["Health Score", "Narrative"]);
          setRows((json.data || []).map((n: any) => ({ label: n.branchName, values: [String(n.healthScore), n.narrative] })));
        }
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reportType, period, user?.restaurantId]);

  const reportTitle = REPORT_TYPES.find((r) => r.key === reportType)?.label || "AI Report";
  const rowLabel = reportType === "branch" ? "Branch" : reportType === "risk" || reportType === "opportunity" ? "Title" : "Item";

  const handleExportPDF = () => {
    if (rows.length === 0 && summaryLines.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16); doc.setTextColor(177, 0, 0); doc.text(reportTitle, 14, 16);
    let startY = 24;
    if (summaryLines.length > 0) {
      doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      summaryLines.forEach((line, i) => doc.text(line, 14, startY + i * 6));
      startY += summaryLines.length * 6 + 6;
    }
    if (rows.length > 0) {
      autoTable(doc, { startY, head: [[rowLabel, ...columns]], body: rows.map((r) => [r.label, ...r.values]), theme: "grid", headStyles: { fillColor: [177, 0, 0] }, styles: { fontSize: 9 }, margin: { left: 14, right: 14 } });
    }
    doc.save(`ai-${reportType}-report.pdf`);
  };

  const handleExportExcel = async () => {
    if (rows.length === 0 && summaryLines.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("AI Report");
    ws.columns = [{ width: 32 }, ...columns.map(() => ({ width: 30 }))];
    ws.addRow([reportTitle]).font = { bold: true, size: 14 };
    ws.addRow([]);
    summaryLines.forEach((line) => ws.addRow([line]));
    if (summaryLines.length > 0) ws.addRow([]);
    ws.addRow([rowLabel, ...columns]).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.label, ...r.values]));
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `ai-${reportType}-report.xlsx`);
  };

  const handleExportCSV = () => {
    if (rows.length === 0 && summaryLines.length === 0) return;
    const lines: string[] = [reportTitle, "", ...summaryLines, "", [rowLabel, ...columns].join(",")];
    rows.forEach((r) => lines.push([`"${r.label}"`, ...r.values.map((v) => `"${v.replace(/"/g, '""')}"`)].join(",")));
    saveAs(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }), `ai-${reportType}-report.csv`);
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
            {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
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

      {!loading && (rows.length > 0 || summaryLines.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-[16px] font-bold text-gray-900">{reportTitle}</h3>
          {summaryLines.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              {summaryLines.map((line, i) => <p key={i} className="text-[12px] text-gray-700">{line}</p>)}
            </div>
          )}
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <MobileTableCards>
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  <tr><th className="px-4 py-2 text-left">{rowLabel}</th>{columns.map((c) => <th key={c} className="px-3 py-2 text-left">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                      {r.values.map((v, j) => <td key={j} className="px-3 py-2 text-gray-900">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              </MobileTableCards>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
