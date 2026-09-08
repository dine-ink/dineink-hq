import { useAppSelector } from "@/store";
import { useGetMenuEngineeringQuery } from "@/store/api/inventoryApi";
import { tooltipFormatter } from "@/utils/chartFormatters";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import MobileTableCards from "@/components/common/MobileTableCards";

/**
 * Menu Engineering — the Star / Plowhorse / Puzzle / Dog matrix, plotting each
 * dish by popularity against margin.
 *
 * Self-contained: it takes no props. Its data and loading flag were the only
 * things it read from the parent, and the fetch behind them was already guarded
 * on `activeTab === "engineering"`, so it only ever ran for this tab. Rendering
 * the component conditionally is that guard, and both pieces of state came down
 * with it.
 *
 * First tab out of MenuManagement, which was 6,359 lines and 44 useState hooks
 * in a single component.
 */
export default function MenuEngineeringMatrixTab() {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  // On failure `data` is undefined, which the empty state below already
  // handles — the same outcome the old catch arranged by setting null.
  const { data: menuEngineering, isFetching: engineeringLoading } =
    useGetMenuEngineeringQuery(
      { restaurantId: user?.restaurantId as number, branchId: selectedBranch?.id },
      { skip: !user?.restaurantId },
    );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-[24px] font-black tracking-tight text-gray-900">
                Menu Engineering
              </h2>
              <p className="mt-1 text-[13px] text-gray-500">
                Classic Star / Plowhorse / Puzzle / Dog matrix — margin
                vs. popularity for every dish sold this period
              </p>
            </div>
          </div>
          {menuEngineering && (
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  label: "Stars",
                  value: menuEngineering.summary.star,
                  cls: "border-emerald-100 bg-emerald-50 text-emerald-700",
                },
                {
                  label: "Plowhorses",
                  value: menuEngineering.summary.plowhorse,
                  cls: "border-blue-100 bg-blue-50 text-blue-700",
                },
                {
                  label: "Puzzles",
                  value: menuEngineering.summary.puzzle,
                  cls: "border-orange-100 bg-orange-50 text-orange-700",
                },
                {
                  label: "Dogs",
                  value: menuEngineering.summary.dog,
                  cls: "border-red-100 bg-red-50 text-red-700",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  className={`rounded-xl border px-3 py-2 ${k.cls}`}
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] opacity-70">
                    {k.label}
                  </p>
                  <p className="mt-1 text-[15px] font-black">
                    {k.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {engineeringLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
        </div>
      ) : !menuEngineering || menuEngineering.items.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
          <p className="text-[13px] text-gray-400">
            No sales recorded yet — items need at least one sale to be
            classified.
          </p>
        </div>
      ) : (
        <>
          {/* QUADRANT CHART */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-1 text-[15px] font-bold text-gray-900">
              Popularity vs. Margin
            </h3>
            <p className="mb-3 text-[11px] text-gray-500">
              Each dot is a dish. Top-right = Star, bottom-right =
              Plowhorse, top-left = Puzzle, bottom-left = Dog.
            </p>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 24, bottom: 10, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    dataKey="popularityShare"
                    name="Popularity"
                    unit="%"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="margin"
                    name="Margin"
                    unit="₹"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ZAxis
                    type="number"
                    dataKey="quantitySold"
                    range={[40, 260]}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={tooltipFormatter((value, name) =>
                      name === "Popularity"
                        ? [`${value}%`, "Popularity share"]
                        : name === "Margin"
                          ? [`₹${value}`, "Margin/unit"]
                          : [value, name],
                    )}
                    labelFormatter={() => ""}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d: any = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] shadow-lg">
                          <p className="font-bold text-gray-900">
                            {d.name}
                          </p>
                          <p className="text-gray-500">
                            Margin ₹{d.margin} · {d.popularityShare}% of
                            sales
                          </p>
                          <p className="text-gray-500">
                            {d.quantitySold} sold
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine
                    x={menuEngineering.summary.popularityThresholdPct}
                    stroke="#9ca3af"
                    strokeDasharray="4 2"
                  />
                  <ReferenceLine
                    y={menuEngineering.summary.avgMargin}
                    stroke="#9ca3af"
                    strokeDasharray="4 2"
                  />
                  <Scatter data={menuEngineering.items}>
                    {menuEngineering.items.map((item: any) => (
                      <Cell
                        key={item.id}
                        fill={
                          item.classification === "STAR"
                            ? "#10b981"
                            : item.classification === "PLOWHORSE"
                              ? "#3b82f6"
                              : item.classification === "PUZZLE"
                                ? "#f97316"
                                : "#ef4444"
                        }
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ITEM TABLE */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Dish Classification
              </h3>
            </div>
            <div className="overflow-x-auto">
              <MobileTableCards>
              <table className="min-w-full text-[12px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      "Dish",
                      "Category",
                      "Price",
                      "Cost",
                      "Margin",
                      "Qty Sold",
                      "Popularity",
                      "Classification",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...menuEngineering.items]
                    .sort(
                      (a: any, b: any) =>
                        b.quantitySold - a.quantitySold,
                    )
                    .map((item: any) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {item.category}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          ₹{item.price}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          ₹{item.cost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          ₹{item.margin}{" "}
                          <span className="text-gray-400">
                            ({item.marginPct}%)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.quantitySold}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {item.popularityShare}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              item.classification === "STAR"
                                ? "bg-emerald-50 text-emerald-700"
                                : item.classification === "PLOWHORSE"
                                  ? "bg-blue-50 text-blue-700"
                                  : item.classification === "PUZZLE"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-red-50 text-red-700"
                            }`}
                          >
                            {item.classification === "STAR" &&
                              "⭐ Star — protect it"}
                            {item.classification === "PLOWHORSE" &&
                              "🐴 Plowhorse — reprice/cost down"}
                            {item.classification === "PUZZLE" &&
                              "🧩 Puzzle — promote more"}
                            {item.classification === "DOG" &&
                              "🐶 Dog — reconsider"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </MobileTableCards>
            </div>
          </div>

          {menuEngineering.notSold?.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-[13px] font-bold text-gray-900">
                Not Sold This Period ({menuEngineering.notSold.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {menuEngineering.notSold.map((item: any) => (
                  <span
                    key={item.id}
                    className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {menuEngineering.categoryCostBreakdown?.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="mb-1 text-[13px] font-bold text-gray-900">
                Category Cost %
              </h3>
              <p className="mb-3 text-[11px] text-gray-500">
                Recipe cost ÷ revenue, per category — generalizes
                "Beverage Cost %" to every category on the menu
              </p>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {menuEngineering.categoryCostBreakdown.map((c: any) => (
                  <div
                    key={c.category}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      {c.category}
                    </p>
                    <p
                      className={`mt-2 text-[18px] font-bold ${
                        c.costPercentage > 35
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {c.costPercentage}%
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      ₹{c.cost.toLocaleString("en-IN")} cost / ₹
                      {c.revenue.toLocaleString("en-IN")} revenue
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
