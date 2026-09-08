import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ArrowDownTrayIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/store";
import { errorMessage } from "@/utils/apiRequest";
import { scenariosApi, useGetScenariosQuery } from "@/store/api/scenariosApi";
import { fmtCategoryValue, SCENARIO_KPIS } from "./scenarioCategories";
import MobileTableCards from "@/components/common/MobileTableCards";

const REPORT_TYPES = [
  { key: "summary", label: "Scenario Summary" },
  { key: "comparison", label: "Scenario Comparison" },
  { key: "branch", label: "Branch Scenario Report" },
  { key: "restaurant", label: "Restaurant Scenario Report" },
];

const PERIODS = [
  { key: "currentMonth", label: "Current Month" },
  { key: "currentQuarter", label: "Current Quarter" },
  { key: "currentYear", label: "Current Year" },
  { key: "custom", label: "Custom Range" },
];

const localDateStr = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const MAX_COMPARISON_SCENARIOS = 4;

export default function ReportsTab() {
  const { branches } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const restaurantId = user?.restaurantId as number;

  const [reportType, setReportType] = useState("summary");
  const [period, setPeriod] = useState("currentMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  // Independent of the global top-nav branch selector — same convention as
  // the Scenarios tab's own scope dropdown, so a restaurant-wide custom
  // scenario stays visible here regardless of which branch happens to be
  // selected in the top nav, and vice versa. Drives "summary"/"comparison".
  const [scopeBranchId, setScopeBranchId] = useState<string>("restaurant");
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Scenarios scoped to scopeBranchId (used by "summary" and "comparison").
  const { data: scenarios = [] } = useGetScenariosQuery(
    {
      restaurantId,
      branchId: scopeBranchId === "restaurant" ? null : Number(scopeBranchId),
      activeOnly: true,
    },
    { skip: !user?.restaurantId },
  );

  // Restaurant-wide scenarios (used by "restaurant" and "branch" template picker).
  const { data: restaurantScenarios = [] } = useGetScenariosQuery(
    { restaurantId, branchId: null, activeOnly: true },
    { skip: !user?.restaurantId },
  );
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState({ startDate: "", endDate: "" });

  // Defaults follow whichever list is in scope.
  useEffect(() => {
    setSelectedScenarioId(scenarios[0]?.id ?? null);
    setSelectedIds(scenarios.slice(0, MAX_COMPARISON_SCENARIOS).map((s) => s.id));
  }, [scenarios]);

  useEffect(() => {
    // The range is part of the query arguments now rather than a URL suffix
    // built here — see runWhatIf below.
    if (period === "custom" && (!customFrom || !customTo)) return;

    // Shares the cache with the hooks in the other tabs — a projection this
    // tab asks for may already have been computed by Overview or Comparison.
    const runWhatIf = (scenarioId: number) =>
      dispatch(
        scenariosApi.endpoints.getWhatIf.initiate({
          restaurantId, scenarioId, period, from: customFrom, to: customTo,
        }),
      ).unwrap();

    const run = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      setError("");
      try {
        if (reportType === "summary") {
          if (!selectedScenarioId) return;
          const data = await runWhatIf(selectedScenarioId);
          setMeta({ startDate: data?.startDate ?? "", endDate: data?.endDate ?? "" });
          setColumns(["Actual", "Projected"]);
          setRows(SCENARIO_KPIS.map((def) => {
            const row = data?.kpis?.find((k) => k.key === def.key);
            return { label: def.label, unit: def.unit, values: [row?.baseline ?? null, row?.projected ?? null] };
          }));
        } else if (reportType === "comparison") {
          if (selectedIds.length === 0) return;
          const batch = await dispatch(
            scenariosApi.endpoints.getWhatIfBatch.initiate({
              restaurantId, scenarioIds: selectedIds, period, from: customFrom, to: customTo,
            }),
          ).unwrap();
          const entries = selectedIds.map((id) => ({ id, data: batch[id] }));
          setMeta({ startDate: entries[0]?.data?.startDate ?? "", endDate: entries[0]?.data?.endDate ?? "" });
          const names = entries.map((e) => scenarios.find((s) => s.id === e.id)?.name || `#${e.id}`);
          setColumns(["Actual", ...names]);
          setRows(SCENARIO_KPIS.map((def) => {
            const actual = entries[0]?.data?.kpis?.find((k: any) => k.key === def.key)?.baseline ?? null;
            const values = [actual, ...entries.map((e) => e.data?.kpis?.find((k: any) => k.key === def.key)?.projected ?? null)];
            return { label: def.label, unit: def.unit, values };
          }));
        } else if (reportType === "restaurant") {
          if (!selectedScenarioId) return;
          const restScenario = restaurantScenarios.find((s) => s.id === selectedScenarioId) || restaurantScenarios[0];
          if (!restScenario) { setRows([]); return; }
          const data = await runWhatIf(restScenario.id);
          setMeta({ startDate: data?.startDate ?? "", endDate: data?.endDate ?? "" });
          setColumns(["Actual (All Branches)", "Projected (All Branches)"]);
          setRows(SCENARIO_KPIS.map((def) => {
            const row = data?.kpis?.find((k) => k.key === def.key);
            return { label: def.label, unit: def.unit, values: [row?.baseline ?? null, row?.projected ?? null] };
          }));
        } else if (reportType === "branch") {
          const template = restaurantScenarios.find((s) => s.id === selectedScenarioId) || restaurantScenarios[0];
          if (!template || !branches?.length) { setRows([]); return; }
          const overrideKeys = [
            "revenueGrowthPercentage", "orderGrowthPercentage", "avgOrderValue", "rent", "utilities", "marketing",
            "maintenance", "packaging", "foodCostTargetPercentage", "labourTargetPercentage", "deliveryPercentage",
            "swiggyCommissionPercentage", "zomatoCommissionPercentage", "royaltyPercentage", "franchiseFeePercentage",
            "salaryIncrementPercentage", "inflationPercentage", "rentEscalationPercentage", "workingDays", "businessHours",
          ];
          const liveOverrides = Object.fromEntries(overrideKeys.map((k) => [k, template[k] ?? null]));
          const compared = await dispatch(
            scenariosApi.endpoints.getBranchScenarioComparison.initiate({
              restaurantId,
              branchIds: branches.map((b: any) => b.id),
              period,
              overrides: liveOverrides as Record<string, number | null>,
            }),
          ).unwrap();
          const byId = new Map(branches.map((b: any) => [b.id, b]));
          setMeta({ startDate: "", endDate: "" });
          setColumns(compared.map((c) => (byId.get(c.branchId) as any)?.name ?? `#${c.branchId}`));
          setRows(SCENARIO_KPIS.map((def) => ({
            label: def.label, unit: def.unit,
            values: compared.map((c) => c.kpis.find((k) => k.key === def.key)?.projected ?? null),
          })));
        }
      } catch (err) {
        // Previously silent: a failed report left the previous table on screen,
        // so the numbers looked current for a period that had never loaded.
        setError(errorMessage(err, "Couldn't build this report"));
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reportType, period, customFrom, customTo, selectedScenarioId, selectedIds, user?.restaurantId, branches?.length]);

  const reportTitle = REPORT_TYPES.find((r) => r.key === reportType)?.label || "Scenario Report";
  const reportSubtitle = meta.startDate && meta.endDate ? `${localDateStr(meta.startDate)} to ${localDateStr(meta.endDate)}` : "";

  const handleExportPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16); doc.setTextColor(177, 0, 0); doc.text(reportTitle, 14, 16);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text(reportSubtitle, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["KPI", ...columns]],
      body: rows.map((r) => [r.label, ...r.values.map((v: number | null) => fmtCategoryValue(v, r.unit))]),
      theme: "grid", headStyles: { fillColor: [177, 0, 0] }, styles: { fontSize: 9 }, margin: { left: 14, right: 14 },
    });
    doc.save(`scenario-${reportType}-report-${localDateStr(meta.startDate || new Date().toISOString())}.pdf`);
  };

  const handleExportExcel = async () => {
    if (rows.length === 0) return;
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Scenario Report");
    ws.columns = [{ width: 28 }, ...columns.map(() => ({ width: 18 }))];
    ws.addRow([reportTitle]).font = { bold: true, size: 14 };
    ws.addRow([reportSubtitle]);
    ws.addRow([]);
    ws.addRow(["KPI", ...columns]).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.label, ...r.values.map((v: number | null) => fmtCategoryValue(v, r.unit))]));
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `scenario-${reportType}-report-${localDateStr(meta.startDate || new Date().toISOString())}.xlsx`);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const lines: string[] = [reportTitle, reportSubtitle, "", ["KPI", ...columns].join(",")];
    rows.forEach((r) => lines.push([`"${r.label}"`, ...r.values.map((v: number | null) => fmtCategoryValue(v, r.unit))].join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `scenario-${reportType}-report-${localDateStr(meta.startDate || new Date().toISOString())}.csv`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600 print:hidden">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {REPORT_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>

          {(reportType === "summary" || reportType === "comparison") && (
            <select
              value={scopeBranchId}
              onChange={(e) => setScopeBranchId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            >
              <option value="restaurant">Restaurant-wide (all branches)</option>
              {(branches || []).map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          {(reportType === "summary" || reportType === "restaurant" || reportType === "branch") && (
            <select
              value={selectedScenarioId ?? ""}
              onChange={(e) => setSelectedScenarioId(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none"
            >
              {(reportType === "summary" ? scenarios : restaurantScenarios).map((s) => (
                <option key={s.id} value={s.id}>{reportType === "branch" ? `Apply: ${s.name}` : s.name}</option>
              ))}
            </select>
          )}

          {reportType === "comparison" && (
            <div className="flex flex-wrap items-center gap-1.5">
              {scenarios.map((s) => {
                const selected = selectedIds.includes(s.id);
                const disabled = !selected && selectedIds.length >= MAX_COMPARISON_SCENARIOS;
                return (
                  <button
                    key={s.id} type="button"
                    disabled={disabled}
                    title={disabled ? `Up to ${MAX_COMPARISON_SCENARIOS} scenarios can be compared at once — deselect one first` : undefined}
                    onClick={() => setSelectedIds((prev) => {
                      if (prev.includes(s.id)) return prev.filter((x) => x !== s.id);
                      if (prev.length >= MAX_COMPARISON_SCENARIOS) return prev;
                      return [...prev, s.id];
                    })}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      selected
                        ? "border-[#b10000] bg-red-50 text-[#b10000]"
                        : disabled
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                          : "border-gray-200 bg-white text-gray-500"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
              <span className="text-[10px] font-semibold text-gray-400">{selectedIds.length}/{MAX_COMPARISON_SCENARIOS}</span>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${period === p.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none" />
              <span className="text-[11px] text-gray-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] outline-none" />
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
            <p className="text-[12px] text-gray-500">{reportSubtitle}</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <MobileTableCards>
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
                    {r.values.map((v: number | null, i: number) => (
                      <td key={i} className="px-3 py-2 text-right text-gray-900">{fmtCategoryValue(v, r.unit)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </div>
      )}
    </div>
  );
}
