import { useEffect, useState } from "react";
// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "../../store";
import { fmtCategoryValue, MODEL_OPTIONS, PERIOD_OPTIONS } from "./forecastCategories";

const REPORT_TYPES = [
  { key: "summary", label: "Forecast Summary Report" },
  { key: "revenue", label: "Revenue Forecast Report" },
  { key: "profit", label: "Profit Forecast Report" },
  { key: "branch", label: "Branch Forecast Report" },
  { key: "accuracy", label: "Forecast Accuracy Report" },
];

const REVENUE_KEYS = ["revenue", "orders", "avgOrderValue"];
const PROFIT_KEYS = ["grossProfit", "grossProfitMarginPercentage", "ebitda", "ebitdaPercentage", "netProfit", "contributionMargin", "marginOfSafety"];

const localDateStr = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function ReportsTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [reportType, setReportType] = useState("summary");
  const [period, setPeriod] = useState("NEXT_MONTH");
  const [model, setModel] = useState("HISTORICAL_TREND");
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [subtitle, setSubtitle] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      try {
        if (reportType === "branch") {
          const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/branch-ranking?period=${period}&model=${model}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Expected Revenue", "Expected Profit", "Expected EBITDA", "Growth %", "Confidence"]);
          setRows((json.data || []).map((r: any) => ({
            label: r.branch.name, unit: "currency",
            values: [fmtCategoryValue(r.revenue, "currency"), fmtCategoryValue(r.netProfit, "currency"), fmtCategoryValue(r.ebitda, "currency"), r.growthPercentage != null ? `${r.growthPercentage.toFixed(1)}%` : "—", r.confidence],
          })));
          setSubtitle(`${PERIOD_OPTIONS.find((p) => p.key === period)?.label} · ${MODEL_OPTIONS.find((m) => m.key === model)?.label}`);
        } else if (reportType === "accuracy") {
          const branchParam = selectedBranch?.id ? `branchId=${selectedBranch.id}` : "branchId=null";
          const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/accuracy?${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          setColumns(["Average Accuracy %", "Sample Size"]);
          setRows((json.data?.kpiAccuracy || []).map((k: any) => ({ label: k.label, unit: "percentage", values: [`${k.averageAccuracyPercentage.toFixed(1)}%`, String(k.sampleSize)] })));
          setSubtitle(`${selectedBranch?.name || "Restaurant-wide"} · ${json.data?.completedForecastCount ?? 0} completed forecast(s)`);
        } else {
          const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
          const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/generate?period=${period}&model=${model}${branchParam}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await res.json();
          const keyFilter = reportType === "revenue" ? REVENUE_KEYS : reportType === "profit" ? PROFIT_KEYS : null;
          const kpis = keyFilter ? (json.data?.kpis || []).filter((k: any) => keyFilter.includes(k.key)) : json.data?.kpis || [];
          setColumns(["Last Period", "Forecast", "Variance %", "Achievement %"]);
          setRows(kpis.map((k: any) => ({
            label: k.label, unit: k.unit,
            values: [fmtCategoryValue(k.baseline, k.unit), fmtCategoryValue(k.predicted, k.unit), k.variancePercentage != null ? `${k.variancePercentage.toFixed(1)}%` : "—", k.achievementPercentage != null ? `${k.achievementPercentage.toFixed(0)}%` : "—"],
          })));
          setSubtitle(`${selectedBranch?.name || "Restaurant-wide"} · ${PERIOD_OPTIONS.find((p) => p.key === period)?.label} · ${json.data ? `${localDateStr(json.data.targetStartDate)} to ${localDateStr(json.data.targetEndDate)}` : ""} · ${MODEL_OPTIONS.find((m) => m.key === (json.data?.modelUsed || model))?.label}`);
        }
      } catch {
        // fetch error — silently ignored
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reportType, period, model, user?.restaurantId, selectedBranch?.id]);

  const reportTitle = REPORT_TYPES.find((r) => r.key === reportType)?.label || "Forecast Report";

  const handleExportPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16); doc.setTextColor(177, 0, 0); doc.text(reportTitle, 14, 16);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(subtitle, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["KPI", ...columns]],
      body: rows.map((r) => [r.label, ...r.values]),
      theme: "grid", headStyles: { fillColor: [177, 0, 0] }, styles: { fontSize: 9 }, margin: { left: 14, right: 14 },
    });
    doc.save(`forecast-${reportType}-report.pdf`);
  };

  const handleExportExcel = async () => {
    if (rows.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Forecast Report");
    ws.columns = [{ width: 28 }, ...columns.map(() => ({ width: 18 }))];
    ws.addRow([reportTitle]).font = { bold: true, size: 14 };
    ws.addRow([subtitle]);
    ws.addRow([]);
    ws.addRow(["KPI", ...columns]).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.label, ...r.values]));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `forecast-${reportType}-report.xlsx`);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const lines: string[] = [reportTitle, subtitle, "", ["KPI", ...columns].join(",")];
    rows.forEach((r) => lines.push([`"${r.label}"`, ...r.values].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `forecast-${reportType}-report.csv`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {REPORT_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          {reportType !== "accuracy" && (
            <>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
                {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
                {MODEL_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExportPDF} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF
          </button>
          <button type="button" onClick={handleExportExcel} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Excel
          </button>
          <button type="button" onClick={handleExportCSV} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> CSV
          </button>
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]">
            <PrinterIcon className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {loading && <div className="flex h-24 items-center justify-center text-[12px] text-gray-400">Loading…</div>}

      {!loading && rows.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">{reportTitle}</h3>
            <p className="text-[12px] text-gray-500">{subtitle}</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">KPI</th>
                  {columns.map((c) => <th key={c} className="px-3 py-2 text-right">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-700">{r.label}</td>
                    {r.values.map((v: string, i: number) => <td key={i} className="px-3 py-2 text-right text-gray-900">{v}</td>)}
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
