import { useState } from "react";
import { useGetInventoryForecastQuery } from "@/store/api/forecastApi";
import { useAppSelector } from "@/store";
import { DataTable, StatusChip, type DataTableColumn } from "@/design";
import { MODEL_OPTIONS } from "./forecastCategories";

interface InventoryItem {
  ingredientName?: string;
  currentQuantity?: number;
  projectedDailyConsumption?: number;
  daysUntilStockout?: number;
  reorderRecommended?: boolean;
  [key: string]: any;
}

const columns: DataTableColumn<InventoryItem>[] = [
  { key: "ingredientName", header: "Ingredient", render: (row) => <span className="font-medium text-gray-700">{row.ingredientName ?? "—"}</span> },
  {
    key: "currentQuantity",
    header: "Current Quantity",
    headerClassName: "text-right",
    className: "text-right text-gray-600",
    render: (row) => (row.currentQuantity != null ? row.currentQuantity.toLocaleString("en-IN") : "—"),
  },
  {
    key: "projectedDailyConsumption",
    header: "Projected Daily Consumption",
    headerClassName: "text-right",
    className: "text-right text-gray-600",
    render: (row) => (row.projectedDailyConsumption != null ? row.projectedDailyConsumption.toLocaleString("en-IN") : "—"),
  },
  {
    key: "daysUntilStockout",
    header: "Days Until Stockout",
    headerClassName: "text-right",
    className: "text-right font-semibold text-gray-900",
    render: (row) => (row.daysUntilStockout != null ? row.daysUntilStockout : "—"),
  },
  {
    key: "reorderRecommended",
    header: "Reorder",
    headerClassName: "text-center",
    className: "text-center",
    render: (row) =>
      row.reorderRecommended ? (
        <StatusChip status={(row.daysUntilStockout ?? 99) <= 2 ? "danger" : "warning"}>Reorder Recommended</StatusChip>
      ) : (
        <StatusChip status="success">OK</StatusChip>
      ),
  },
];

export default function InventoryForecastTab() {
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);

  const [scope, setScope] = useState<"branch" | "restaurant">("branch");
  const [model, setModel] = useState("HISTORICAL_TREND");

  const {
    data,
    isFetching: loading,
    isError,
  } = useGetInventoryForecastQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: scope === "branch" ? selectedBranch?.id : undefined,
      model,
    },
    { skip: !user?.restaurantId },
  );
  // The request failing and the server declining stay separate, as before.
  const error = isError || data === null;
  const items: InventoryItem[] = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-[16px] font-bold text-gray-900">Inventory Forecast — Stockout Risk</h3>
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
          <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 outline-none">
            {MODEL_OPTIONS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(row) => row.ingredientName ?? JSON.stringify(row)}
        loading={loading}
        error={error}
        emptyTitle="No inventory forecast available"
        emptyDescription="There isn't enough historical consumption data yet to project ingredient stockouts."
      />
    </div>
  );
}
