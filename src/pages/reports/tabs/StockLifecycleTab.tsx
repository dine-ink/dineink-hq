import { useState } from "react";
import { useAppSelector } from "@/store";
import { useGetStockLifecycleQuery } from "@/store/api/reportsApi";
import MobileTableCards from "@/components/common/MobileTableCards";
import { formatQty } from "@/utils/units";

/**
 * Ingredient stock lifecycle — opening stock, purchases, consumption, wastage
 * and closing stock for a chosen month.
 *
 * Fully self-contained, unlike the tabs extracted before it. Its data, the
 * month/year pickers that drive the request, and its two pieces of UI state
 * (expanded rows, wastage sort) all moved down together, because the fetch in
 * Report.tsx was already guarded on `activeTab === "Stock Lifecycle"` — it only
 * ever ran for this tab. The component is rendered conditionally, so that guard
 * is now the mount itself and is gone.
 *
 * That removes eight useState hooks and an effect from the parent rather than
 * just relocating markup.
 */
export default function StockLifecycleTab() {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [lifecycleMonth, setLifecycleMonth] = useState(new Date().getMonth() + 1);
  const [lifecycleYear, setLifecycleYear] = useState(new Date().getFullYear());
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());
  const [wastageSortBy, setWastageSortBy] = useState<"weight" | "price" | "product">("weight");

  // Keyed by month and year, so stepping back to a month already viewed is
  // instant. On failure `data` is undefined and the empty state below covers
  // it, which is what the old catch arranged by hand.
  const { data: lifecycleData = [], isFetching: lifecycleLoading } =
    useGetStockLifecycleQuery(
      {
        branchId: selectedBranch?.id as number,
        month: lifecycleMonth,
        year: lifecycleYear,
      },
      { skip: !selectedBranch?.id || !user?.restaurantId },
    );

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentY = new Date().getFullYear();
  const yearOptions = [currentY - 2, currentY - 1, currentY];
  const toggleIngredient = (id: number) => {
    setExpandedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // Quantities arrive from the API in the canonical unit (Kg/Litre/Piece);
  // this auto-scales small amounts to grams/ml so they're readable.
  const fmt = (n: number, unit: string) => formatQty(n, unit);
  const adjBadge: Record<string, string> = {
    WASTAGE: "bg-amber-100 text-amber-800",
    DAMAGE: "bg-red-100 text-red-700",
    EXPIRED: "bg-purple-100 text-purple-800",
    MANUAL: "bg-gray-100 text-gray-600",
  };

  // Summary KPIs across all ingredients — excluding ones with no
  // recipe link anywhere (Packaging/Cleaning Supplies etc.).
  // Their "expected consumption" isn't zero-this-month, it's
  // structurally undefined (no recipe will ever explain their
  // usage), so counting their full consumption as "wastage"
  // would inflate the overall % with non-food, non-wasted items.
  // `wastagePercentage === null` is exactly how the backend flags
  // this (see inventory.service.ts's hasRecipeMapping).
  const recipeTrackedIngredients = lifecycleData.filter(
    (i: any) => i.wastagePercentage !== null,
  );
  const totalWastageQty = recipeTrackedIngredients.reduce(
    (s: number, i: any) => s + i.wastageQty,
    0,
  );
  const totalWastageCost = recipeTrackedIngredients.reduce(
    (s: number, i: any) => s + i.wastageCost,
    0,
  );
  const totalAvailable = recipeTrackedIngredients.reduce(
    (s: number, i: any) => s + i.available,
    0,
  );
  const overallWastePct =
    totalAvailable > 0
      ? ((totalWastageQty / totalAvailable) * 100).toFixed(1)
      : "0";
  const worstIng = [...recipeTrackedIngredients].sort(
    (a: any, b: any) => b.wastagePercentage - a.wastagePercentage,
  )[0];

  return (
    <div className="space-y-3">
      {/* Month / Year selector */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Period
          </p>
          <div className="flex gap-2">
            <select
              value={lifecycleMonth}
              onChange={(e) =>
                setLifecycleMonth(Number(e.target.value))
              }
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#b10000]"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={lifecycleYear}
              onChange={(e) =>
                setLifecycleYear(Number(e.target.value))
              }
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#b10000]"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[12px] font-semibold text-gray-700">
            {lifecycleData.length} ingredient
            {lifecycleData.length !== 1 ? "s" : ""} tracked
          </p>
          <p className="text-[11px] text-gray-400">
            {months[lifecycleMonth - 1]} {lifecycleYear}
          </p>
        </div>
      </div>

      {lifecycleLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center text-[12px] text-gray-400">
          Loading lifecycle data…
        </div>
      ) : lifecycleData.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-[13px] font-semibold text-gray-600">
            No stock data for this period
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Upload monthly restock data in Operations → Restock, or
            log inventory adjustments in the POS app.
          </p>
        </div>
      ) : (
        <>
          {/* KPI summary */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              {
                label: "Overall Wastage %",
                value: `${overallWastePct}%`,
                sub: "of total stock received",
                color: "red",
              },
              {
                label: "Total Wastage Cost",
                value: `₹${totalWastageCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                sub: "wastage × unit price",
                color: "amber",
              },
              {
                label: "Highest Waste Ingredient",
                value: worstIng?.name || "—",
                sub: worstIng
                  ? `${worstIng.wastagePercentage}% wastage`
                  : "",
                color: "purple",
              },
              {
                label: "Ingredients Tracked",
                value: lifecycleData.length,
                sub: `${months[lifecycleMonth - 1]} ${lifecycleYear}`,
                color: "blue",
              },
            ].map((k: any) => (
              <div
                key={k.label}
                className={`rounded-xl border p-4 ${k.color === "red" ? "border-red-100 bg-red-50/60" : k.color === "amber" ? "border-amber-100 bg-amber-50/60" : k.color === "purple" ? "border-purple-100 bg-purple-50/60" : "border-blue-100 bg-blue-50/60"}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  {k.label}
                </p>
                <p
                  className={`mt-2 text-[20px] font-bold truncate ${k.color === "red" ? "text-red-700" : k.color === "amber" ? "text-amber-700" : k.color === "purple" ? "text-purple-700" : "text-blue-700"}`}
                >
                  {k.value}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {k.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Formula legend */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[11px] text-gray-500">
            <span className="font-semibold text-gray-700">
              Wastage Formula:{" "}
            </span>
            Wastage = Opening Stock + Purchases − Closing Stock −
            Expected Consumption per SOP (recipe qty × dishes sold)
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <span className="font-semibold text-gray-700">
              Wastage %{" "}
            </span>
            = (Wastage ÷ Total Received) × 100
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <span className="font-semibold text-gray-700">
              Wastage Cost{" "}
            </span>
            = Wastage Qty × Unit Price
          </div>

          {/* Wastage report view — weight / product / price */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
            <span className="pl-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              View by
            </span>
            {(
              [
                { key: "weight", label: "Weightage" },
                { key: "product", label: "Product" },
                { key: "price", label: "Price" },
              ] as const
            ).map((v) => (
              <button
                key={v.key}
                onClick={() => setWastageSortBy(v.key)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${wastageSortBy === v.key ? "bg-[#b10000] text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Per-ingredient cards */}
          {[...lifecycleData]
            .sort((a: any, b: any) => {
              if (wastageSortBy === "price")
                return b.wastageCost - a.wastageCost;
              if (wastageSortBy === "product")
                return a.name.localeCompare(b.name);
              return b.wastageQty - a.wastageQty;
            })
            .map((ing: any) => {
              const expanded = expandedIngredients.has(
                ing.ingredientId,
              );
              const avail = ing.available || 1;
              const dishPct = Math.min(
                100,
                (ing.expectedConsumption / avail) * 100,
              );
              const wastePct = Math.max(
                0,
                Math.min(100, (ing.wastageQty / avail) * 100),
              );
              const closePct = Math.min(
                100,
                (ing.closingQty / avail) * 100,
              );
              return (
                <div
                  key={ing.ingredientId}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* Header */}
                  <button
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    onClick={() => toggleIngredient(ing.ingredientId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold text-gray-800">
                          {ing.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {ing.unit}
                        </span>
                        {!ing.hasRestockData && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                            No restock data
                          </span>
                        )}
                        {ing.hasRecipeMapping === false && (
                          <span
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500"
                            title="Not used in any menu item recipe — its consumption isn't judged against an 'expected usage' figure, so it's excluded from wastage %"
                          >
                            Not recipe-tracked
                          </span>
                        )}
                        {ing.wastagePercentage > 0 && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${ing.wastagePercentage > 15 ? "bg-red-100 text-red-700" : ing.wastagePercentage > 8 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                          >
                            {ing.wastagePercentage}% waste
                          </span>
                        )}
                        {ing.wastagePercentage < 0 && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                            {Math.abs(ing.wastagePercentage)}%
                            under-used
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                        <span className="text-gray-500">
                          Received:{" "}
                          <span className="font-semibold text-gray-700">
                            {fmt(ing.available, ing.unit)}
                          </span>
                        </span>
                        <span className="text-emerald-600">
                          Dishes:{" "}
                          <span className="font-semibold">
                            {fmt(ing.expectedConsumption, ing.unit)}
                          </span>
                        </span>
                        {ing.wastageQty < 0 ? (
                          <span className="text-blue-600">
                            Under-used:{" "}
                            <span className="font-semibold">
                              {fmt(
                                Math.abs(ing.wastageQty),
                                ing.unit,
                              )}
                            </span>
                          </span>
                        ) : (
                          <span className="text-red-600">
                            Wastage:{" "}
                            <span className="font-semibold">
                              {fmt(ing.wastageQty, ing.unit)}
                            </span>
                          </span>
                        )}
                        {ing.pricePerUnit > 0 &&
                          ing.wastageQty > 0 && (
                            <span className="text-gray-500">
                              Cost:{" "}
                              <span className="font-semibold text-red-700">
                                ₹
                                {ing.wastageCost.toLocaleString(
                                  "en-IN",
                                  { maximumFractionDigits: 0 },
                                )}
                              </span>
                            </span>
                          )}
                      </div>
                      {/* Progress bar: dishes (green) | wastage (red) | closing (blue) */}
                      {ing.available > 0 && (
                        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="bg-emerald-400"
                            style={{ width: `${dishPct}%` }}
                            title={`Dishes: ${fmt(ing.expectedConsumption, ing.unit)}`}
                          />
                          <div
                            className="bg-red-400"
                            style={{ width: `${wastePct}%` }}
                            title={`Wastage: ${fmt(ing.wastageQty, ing.unit)}`}
                          />
                          <div
                            className="bg-blue-300"
                            style={{ width: `${closePct}%` }}
                            title={`Closing: ${fmt(ing.closingQty, ing.unit)}`}
                          />
                        </div>
                      )}
                    </div>
                    <span className="mt-1 shrink-0 text-[14px] text-gray-400">
                      {expanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 text-[12px]">
                      {/* Step 1: Stock in */}
                      <div className="rounded-lg bg-gray-50 p-3 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                          Total Stock Received
                        </p>
                        <div className="flex justify-between text-gray-600">
                          <span>Opening stock</span>
                          <span className="font-semibold">
                            {fmt(ing.openingQty, ing.unit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>+ Purchased this month</span>
                          <span className="font-semibold">
                            {fmt(ing.purchases, ing.unit)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-800">
                          <span>= Total Received</span>
                          <span>{fmt(ing.available, ing.unit)}</span>
                        </div>
                      </div>

                      {/* Step 2: Expected Consumption (dishes) */}
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <div className="flex justify-between font-semibold text-emerald-800 mb-2">
                          <span>
                            Expected Consumption{" "}
                            <span className="text-[10px] font-normal text-emerald-600">
                              (Σ Qty Sold × Recipe Qty)
                            </span>
                          </span>
                          <span>
                            {fmt(ing.expectedConsumption, ing.unit)}
                          </span>
                        </div>
                        {ing.usedInDishesByDish.length > 0 ? (
                          <div className="space-y-1 pl-3">
                            {ing.usedInDishesByDish.map(
                              (d: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-emerald-700"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-emerald-400">
                                      └
                                    </span>
                                    {d.dishName}
                                    <span className="text-[10px] text-emerald-500">
                                      ({d.orders} sold)
                                    </span>
                                  </span>
                                  <span>{fmt(d.qty, ing.unit)}</span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="pl-3 text-[11px] text-emerald-600/70">
                            {ing.hasRecipeMapping === false
                              ? "Not used in any menu item recipe (e.g. packaging/cleaning supplies aren't part of a dish) — consumption isn't judged against an expected-usage figure."
                              : ing.expectedConsumption > 0
                                ? "Menu-ingredient mapping needed for dish breakdown."
                                : "No dish usage this period."}
                          </p>
                        )}
                      </div>

                      {/* Step 3: Closing stock */}
                      <div className="rounded-lg bg-blue-50 p-3 flex justify-between font-semibold text-blue-800">
                        <span>
                          Closing Stock{" "}
                          <span className="text-[10px] font-normal text-blue-600">
                            (end of period)
                          </span>
                        </span>
                        <span>{fmt(ing.closingQty, ing.unit)}</span>
                      </div>

                      {/* Step 4: Wastage result — not computed at all for ingredients with
                          no recipe link anywhere (see hasRecipeMapping); showing a red
                          "wastage" box for a takeaway box or cleaning spray would be
                          misleading, not just uninteresting. */}
                      {ing.hasRecipeMapping === false ? (
                        <div className="rounded-lg bg-gray-50 p-3 text-[11px] text-gray-500">
                          Wastage % isn't calculated for this ingredient — it has no menu
                          item recipe to compare its consumption against. Its stock is
                          still tracked (opening/purchases/closing above); use manual
                          inventory adjustments to log damage/expiry for it instead.
                        </div>
                      ) : (
                      <div className="rounded-lg bg-red-50 p-3 space-y-2">
                        <div className="flex justify-between font-bold text-red-800">
                          <span>
                            Wastage
                            <span className="ml-1 text-[10px] font-normal text-red-600">
                              = Total Received − Closing − Expected
                              Consumption
                            </span>
                          </span>
                          <span>{fmt(ing.wastageQty, ing.unit)}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-[11px] text-red-700 border-t border-red-100 pt-2">
                          <span>
                            Wastage % ={" "}
                            <strong>{ing.wastagePercentage}%</strong>{" "}
                            <span className="text-[10px] text-red-500">
                              (÷ Total Received × 100)
                            </span>
                          </span>
                          {ing.pricePerUnit > 0 && (
                            <span>
                              Wastage Cost ={" "}
                              <strong>
                                ₹
                                {ing.wastageCost.toLocaleString(
                                  "en-IN",
                                  { maximumFractionDigits: 0 },
                                )}
                              </strong>{" "}
                              <span className="text-[10px] text-red-500">
                                ({fmt(ing.wastageQty, ing.unit)} × ₹
                                {ing.pricePerUnit}/unit)
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Wastage breakdown: logged entries + unaccounted */}
                        {ing.wastageQty > 0.01 && (
                          <div className="border-t border-red-100 pt-2 space-y-1">
                            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                              Wastage Breakdown
                            </p>
                            {ing.adjustmentEntries.length > 0 && (
                              <div className="space-y-1">
                                {ing.adjustmentEntries.map(
                                  (a: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between gap-2 text-red-700 pl-2"
                                    >
                                      <span className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-red-400">
                                          └
                                        </span>
                                        <span
                                          className={`rounded px-1 py-0.5 text-[9px] font-bold ${adjBadge[a.type] || "bg-gray-100 text-gray-600"}`}
                                        >
                                          {a.type}
                                        </span>
                                        {a.reason && (
                                          <span>{a.reason}</span>
                                        )}
                                        {a.by && (
                                          <span className="text-[10px] text-red-400">
                                            by {a.by}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-red-400">
                                          {new Date(
                                            a.date,
                                          ).toLocaleDateString(
                                            "en-IN",
                                          )}
                                        </span>
                                      </span>
                                      <span className="shrink-0 font-semibold">
                                        {fmt(a.qty, ing.unit)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                            {ing.unaccountedWastage > 0.01 && (
                              <div className="flex justify-between text-red-700 pl-2 font-semibold">
                                <span className="flex items-center gap-1.5">
                                  <span className="text-red-400">
                                    └
                                  </span>
                                  <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold text-red-700">
                                    UNACCOUNTED
                                  </span>
                                  <span className="text-[10px] font-normal text-red-500">
                                    no log entry
                                  </span>
                                </span>
                                <span>
                                  {fmt(
                                    ing.unaccountedWastage,
                                    ing.unit,
                                  )}
                                </span>
                              </div>
                            )}
                            {ing.loggedWastage > 0 && (
                              <div className="flex justify-between text-[11px] text-red-600 pl-2 border-t border-red-100 pt-1">
                                <span>Logged entries total</span>
                                <span className="font-semibold">
                                  {fmt(ing.loggedWastage, ing.unit)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      )}

                      {/* Legend */}
                      <div className="flex flex-wrap gap-3 pt-1">
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="inline-block h-2 w-3 rounded-sm bg-emerald-400" />{" "}
                          Expected (dishes)
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="inline-block h-2 w-3 rounded-sm bg-red-400" />{" "}
                          Wastage
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="inline-block h-2 w-3 rounded-sm bg-blue-300" />{" "}
                          Closing stock
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}
