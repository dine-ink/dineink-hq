import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { DataTable, type DataTableColumn } from "../../design";
import { MODEL_OPTIONS, PERIOD_OPTIONS } from "./forecastCategories";

interface DemandItem {
  name?: string;
  unit?: string | null;
  historicalDailyAverage?: number;
  projectedDailyConsumption?: number;
  projectedTotalConsumption?: number;
  [key: string]: any;
}

const fmtQty = (value: number | undefined, unit: string | null | undefined) =>
  value != null ? `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}` : "—";

const columns: DataTableColumn<DemandItem>[] = [
  { key: "name", header: "Item", render: (row) => <span className="font-medium text-gray-700">{row.name ?? "—"}</span> },
  {
    key: "historicalDailyAverage",
    header: "Historical Daily Avg",
    headerClassName: "text-right",
    className: "text-right text-gray-500",
    render: (row) => fmtQty(row.historicalDailyAverage, row.unit),
  },
  {
    key: "projectedDailyConsumption",
    header: "Projected Daily Demand",
    headerClassName: "text-right",
    className: "text-right text-gray-600",
    render: (row) => fmtQty(row.projectedDailyConsumption, row.unit),
  },
  {
    key: "projectedTotalConsumption",
    header: "Projected Total (Period)",
    headerClassName: "text-right",
    className: "text-right font-semibold text-gray-900",
    render: (row) => fmtQty(row.projectedTotalConsumption, row.unit),
  },
];

export default function DemandForecastTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [period, setPeriod] = useState("NEXT_MONTH");
  const [model, setModel] = useState("HISTORICAL_TREND");
  const [items, setItems] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDemand = async () => {
      if (!user?.restaurantId) return;
      setLoading(true);
      setError(false);
      try {
        const branchParam = scope === "branch" && selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
        const res = await fetch(`${API_URL}/api/forecasts/${user.restaurantId}/demand?period=${period}&model=${model}&topN=10${branchParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setItems(Array.isArray(json.data?.items) ? json.data.items : []);
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDemand();
  }, [user?.restaurantId, selectedBranch?.id, scope, period, model]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Demand Forecast — Top Items</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setScope("branch")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "branch" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {selectedBranch?.name || "This Branch"}
            </button>
            <button
              type="button"
              onClick={() => setScope("restaurant")}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${scope === "restaurant" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Entire Restaurant
            </button>
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {PERIOD_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {MODEL_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.name ?? JSON.stringify(row)}
        loading={loading}
        error={error}
        emptyTitle="No demand forecast available"
        emptyDescription="There isn't enough historical order data yet to project item-level demand for this period."
      />
    </div>
  );
}
