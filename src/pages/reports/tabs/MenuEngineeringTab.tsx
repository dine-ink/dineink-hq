import { useState } from "react";
import MobileTableCards from "@/components/common/MobileTableCards";

/**
 * Menu Engineering — the classic Stars / Plowhorses / Puzzles / Dogs quadrant,
 * plus the dish-vs-dish comparison.
 *
 * First tab extracted from Report.tsx, which was 4,254 lines in a single
 * component with twelve tabs sharing twenty-odd useState hooks. This one was
 * chosen to go first because it turned out to be genuinely self-contained: it
 * was already written as an IIFE that derives everything it renders from
 *  and , and the only state it touched was its own two
 * comparison pickers — which now live here rather than in the parent.
 *
 * The characterisation suite in Report.characterisation.test.tsx is what makes
 * this safe: it pins every tab mounting and rendering against the same shared
 * data, so an extraction that changes behaviour fails there.
 */

interface MenuEngineeringTabProps {
  bills: any[];
  menuItems: any[];
}

export default function MenuEngineeringTab({ bills, menuItems }: MenuEngineeringTabProps) {
  // Moved down from Report.tsx with the tab — nothing else used them.
  const [compareDishAId, setCompareDishAId] = useState("");
  const [compareDishBId, setCompareDishBId] = useState("");

  // Build item sales map from BillItems
  const itemSales: Record<
    string,
    { name: string; qty: number; revenue: number; price: number }
  > = {};
  bills.forEach((b: any) => {
    (b.items || []).forEach((item: any) => {
      const id = item.menuItemId || item.itemName;
      if (!itemSales[id])
        itemSales[id] = {
          name: item.itemName,
          qty: 0,
          revenue: 0,
          price: Number(item.price || 0),
        };
      itemSales[id].qty += Number(item.quantity || 0);
      itemSales[id].revenue += Number(item.total || 0);
    });
  });

  // Compute food cost from menuItemIngredients
  const itemsWithCost = menuItems.map((mi: any) => {
    const sales = itemSales[mi.id] || {
      name: mi.name,
      qty: 0,
      revenue: 0,
      price: Number(mi.price || 0),
    };
    const recipeCost = (mi.menuItemIngredients || []).reduce(
      (acc: number, m: any) => {
        const ing = m.ingredient;
        if (!ing) return acc;
        const qty = Number(m.quantity || 0);
        const price = Number(ing.pricePerUnit || 0);
        const mu = m.unit?.toLowerCase();
        const iu = ing.unit?.toLowerCase();
        let cost = qty * price;
        if (iu === "kg" && (mu === "gram" || mu === "gm"))
          cost = (qty / 1000) * price;
        else if (iu === "litre" && mu === "ml")
          cost = (qty / 1000) * price;
        return acc + cost;
      },
      0,
    );
    const sellingPrice = Number(mi.price || 0);
    const margin =
      sellingPrice > 0
        ? ((sellingPrice - recipeCost) / sellingPrice) * 100
        : 0;
    const foodCostPercent =
      sellingPrice > 0 ? (recipeCost / sellingPrice) * 100 : 0;
    // Price that would yield a 65% profit margin (35% food cost ratio)
    const suggestedPrice = recipeCost > 0 ? recipeCost / 0.35 : 0;
    return {
      ...mi,
      ...sales,
      recipeCost,
      margin,
      foodCostPercent,
      suggestedPrice,
    };
  });

  // ── Best sellers — ranked by quantity sold, not bucketed ──────────
  const bestSellers = [...itemsWithCost]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // ── Profitability rankings — across all dishes, and per category ──
  const mostProfitableOverall = itemsWithCost
    .filter((i) => i.price > 0)
    .slice()
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 10);

  const categoryStatsMap: Record<string, any> = {};
  itemsWithCost.forEach((item: any) => {
    const catName = item.category?.name || "Uncategorized";
    if (!categoryStatsMap[catName]) {
      categoryStatsMap[catName] = {
        name: catName,
        items: [] as any[],
      };
    }
    categoryStatsMap[catName].items.push(item);
  });
  const categoryRanking = Object.values(categoryStatsMap)
    .map((c: any) => {
      const priced = c.items.filter((i: any) => i.price > 0);
      const avgMargin = priced.length
        ? priced.reduce((s: number, i: any) => s + i.margin, 0) /
          priced.length
        : 0;
      const avgFoodCostPercent = priced.length
        ? priced.reduce(
            (s: number, i: any) => s + i.foodCostPercent,
            0,
          ) / priced.length
        : 0;
      const topDish = [...c.items].sort(
        (a: any, b: any) => b.margin - a.margin,
      )[0];
      return {
        name: c.name,
        count: c.items.length,
        avgMargin,
        avgFoodCostPercent,
        topDish,
      };
    })
    .sort((a: any, b: any) => b.avgMargin - a.avgMargin);

  const medianQty =
    itemsWithCost.length > 0
      ? itemsWithCost.map((i) => i.qty).sort((a, b) => a - b)[
          Math.floor(itemsWithCost.length / 2)
        ]
      : 0;
  const medianMargin =
    itemsWithCost.length > 0
      ? itemsWithCost.map((i) => i.margin).sort((a, b) => a - b)[
          Math.floor(itemsWithCost.length / 2)
        ]
      : 50;

  const classify = (item: any) => {
    const highQty = item.qty >= medianQty;
    const highMargin = item.margin >= medianMargin;
    if (highQty && highMargin)
      return {
        label: "Star",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        tip: "Promote heavily — high demand, high profit",
      };
    if (!highQty && highMargin)
      return {
        label: "Puzzle",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
        tip: "Good margin but needs better visibility",
      };
    if (highQty && !highMargin)
      return {
        label: "Plowhorse",
        color: "bg-orange-100 text-orange-700 border-orange-200",
        dot: "bg-orange-500",
        tip: "Popular but low margin — reprice or reduce cost",
      };
    return {
      label: "Dog",
      color: "bg-red-100 text-red-700 border-red-200",
      dot: "bg-[#b10000]",
      tip: "Low demand, low margin — consider removing",
    };
  };

  const quadrants = {
    Star: [] as any[],
    Puzzle: [] as any[],
    Plowhorse: [] as any[],
    Dog: [] as any[],
  };
  itemsWithCost.forEach((item) => {
    const c = classify(item);
    (quadrants as any)[c.label].push({ ...item, cls: c });
  });
  Object.values(quadrants).forEach((arr) =>
    arr.sort((a: any, b: any) => b.qty - a.qty),
  );

  return (
    <div className="space-y-6">
      {/* ===== BEST SELLERS (ranked by qty, with food cost% + margin) ===== */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h3 className="text-[15px] font-bold text-gray-900">
            Best Sellers
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Ranked by units sold · food cost% and margin% shown side
            by side · suggested price targets a 65% profit margin
          </p>
        </div>
        <div className="overflow-x-auto">
          <MobileTableCards>
          <table className="min-w-full text-[12px]">
            <thead className="bg-gray-50/70">
              <tr className="border-b border-gray-100">
                {[
                  "Item",
                  "Category",
                  "Sold",
                  "Revenue",
                  "Price",
                  "Food Cost %",
                  "Margin %",
                  "Suggested Price (65% profit)",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bestSellers.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50/40"
                >
                  <td className="px-3 py-2 font-semibold text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {item.category?.name || "—"}
                  </td>
                  <td className="px-3 py-2 font-bold text-gray-900">
                    {item.qty}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    ₹
                    {Math.round(item.revenue).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    ₹{item.price}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {item.foodCostPercent.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.margin >= 60 ? "bg-emerald-100 text-emerald-700" : item.margin >= 40 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}
                    >
                      {item.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {item.suggestedPrice > 0
                      ? `₹${Math.round(item.suggestedPrice)}`
                      : "—"}
                  </td>
                </tr>
              ))}
              {bestSellers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-[11px] text-gray-400"
                  >
                    No sales data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </MobileTableCards>
        </div>
      </div>

      {/* ===== ALTERNATE DISH COMPARE ===== */}
      {(() => {
        const dishA = itemsWithCost.find(
          (i: any) => String(i.id) === compareDishAId,
        );
        const dishB = itemsWithCost.find(
          (i: any) => String(i.id) === compareDishBId,
        );
        const rows: Array<{
          label: string;
          a: any;
          b: any;
          format?: (v: any) => string;
        }> = [
          {
            label: "Category",
            a: dishA?.category?.name,
            b: dishB?.category?.name,
          },
          {
            label: "Selling Price",
            a: dishA?.price,
            b: dishB?.price,
            format: (v) => (v != null ? `₹${v}` : "—"),
          },
          {
            label: "Recipe (Food) Cost",
            a: dishA?.recipeCost,
            b: dishB?.recipeCost,
            format: (v) =>
              v != null ? `₹${Number(v).toFixed(2)}` : "—",
          },
          {
            label: "Food Cost %",
            a: dishA?.foodCostPercent,
            b: dishB?.foodCostPercent,
            format: (v) =>
              v != null ? `${Number(v).toFixed(1)}%` : "—",
          },
          {
            label: "Profit Margin %",
            a: dishA?.margin,
            b: dishB?.margin,
            format: (v) =>
              v != null ? `${Number(v).toFixed(1)}%` : "—",
          },
          {
            label: "Units Sold",
            a: dishA?.qty,
            b: dishB?.qty,
          },
          {
            label: "Suggested Price (65% profit)",
            a: dishA?.suggestedPrice,
            b: dishB?.suggestedPrice,
            format: (v) => (v > 0 ? `₹${Math.round(v)}` : "—"),
          },
        ];
        return (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">
                Compare Dishes
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Compare a proposed/alternate dish against an existing
                one on cost, price and margin
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
              <select
                value={compareDishAId}
                onChange={(e) => setCompareDishAId(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
              >
                <option value="">Select existing dish…</option>
                {itemsWithCost.map((i: any) => (
                  <option key={i.id} value={String(i.id)}>
                    {i.name}
                  </option>
                ))}
              </select>
              <select
                value={compareDishBId}
                onChange={(e) => setCompareDishBId(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
              >
                <option value="">Select alternate dish…</option>
                {itemsWithCost.map((i: any) => (
                  <option key={i.id} value={String(i.id)}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            {dishA && dishB ? (
              <div className="overflow-x-auto border-t border-gray-100">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50/70">
                    <tr className="border-b border-gray-100">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Metric
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        {dishA.name}
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        {dishB.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.label}
                        className="border-b border-gray-100"
                      >
                        <td className="px-3 py-2 font-semibold text-gray-500">
                          {r.label}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {r.format ? r.format(r.a) : (r.a ?? "—")}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {r.format ? r.format(r.b) : (r.b ?? "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
            ) : (
              <p className="px-4 pb-4 text-[12px] text-gray-400">
                Pick two dishes above to compare them
              </p>
            )}
          </div>
        );
      })()}

      {/* ===== MENU ITEM SPLIT — PRICE HIGH / USAGE HIGH ===== */}
      {(() => {
        const highestPriced = [...itemsWithCost]
          .sort((a, b) => b.price - a.price)
          .slice(0, 10);
        const highestUsage = [...itemsWithCost]
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 10);
        return (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Menu Split — Price High
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Highest priced items on the menu
                </p>
              </div>
              <div className="overflow-x-auto">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50/70">
                    <tr className="border-b border-gray-100">
                      {["Item", "Category", "Price", "Sold"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {highestPriced.map((item: any) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50/40"
                      >
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {item.category?.name || "—"}
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900">
                          ₹{item.price}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {item.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="px-4 py-3">
                <h3 className="text-[15px] font-bold text-gray-900">
                  Menu Split — Usage High
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Highest volume/most-ordered items on the menu
                </p>
              </div>
              <div className="overflow-x-auto">
                <MobileTableCards>
                <table className="min-w-full text-[12px]">
                  <thead className="bg-gray-50/70">
                    <tr className="border-b border-gray-100">
                      {["Item", "Category", "Sold", "Price"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {highestUsage.map((item: any) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50/40"
                      >
                        <td className="px-3 py-2 font-semibold text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {item.category?.name || "—"}
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-900">
                          {item.qty}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          ₹{item.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </MobileTableCards>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== PROFITABILITY RANKINGS ===== */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              Most Profitable Dishes — All Menu
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Ranked by profit margin %, across every dish
            </p>
          </div>
          <div className="overflow-x-auto">
            <MobileTableCards>
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50/70">
                <tr className="border-b border-gray-100">
                  {["Rank", "Item", "Category", "Margin %"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {mostProfitableOverall.map(
                  (item: any, idx: number) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gray-50/40"
                    >
                      <td className="px-3 py-2 text-gray-400">
                        #{idx + 1}
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {item.category?.name || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {item.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ),
                )}
                {mostProfitableOverall.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-[11px] text-gray-400"
                    >
                      No priced dishes yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              Category Food Cost &amp; Profitability
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Avg. food cost% and margin% per menu category, ranked by
              margin — with each category's most profitable dish
            </p>
          </div>
          <div className="overflow-x-auto">
            <MobileTableCards>
            <table className="min-w-full text-[12px]">
              <thead className="bg-gray-50/70">
                <tr className="border-b border-gray-100">
                  {[
                    "Category",
                    "Items",
                    "Food Cost %",
                    "Margin %",
                    "Top Dish",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryRanking.map((cat: any) => (
                  <tr
                    key={cat.name}
                    className="border-b border-gray-100 hover:bg-gray-50/40"
                  >
                    <td className="px-3 py-2 font-semibold text-gray-900">
                      {cat.name}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {cat.count}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {cat.avgFoodCostPercent.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.avgMargin >= 60 ? "bg-emerald-100 text-emerald-700" : cat.avgMargin >= 40 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}
                      >
                        {cat.avgMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {cat.topDish?.name || "—"}
                    </td>
                  </tr>
                ))}
                {categoryRanking.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-[11px] text-gray-400"
                    >
                      No categories yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Stars",
            count: quadrants.Star.length,
            desc: "High qty · High margin",
            color:
              "bg-emerald-50 border-emerald-100 text-emerald-700",
          },
          {
            label: "Puzzles",
            count: quadrants.Puzzle.length,
            desc: "Low qty · High margin",
            color: "bg-blue-50 border-blue-100 text-blue-700",
          },
          {
            label: "Plowhorses",
            count: quadrants.Plowhorse.length,
            desc: "High qty · Low margin",
            color: "bg-orange-50 border-orange-100 text-orange-700",
          },
          {
            label: "Dogs",
            count: quadrants.Dog.length,
            desc: "Low qty · Low margin",
            color: "bg-red-50 border-red-100 text-red-700",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border p-4 ${k.color.split(" ").slice(0, 2).join(" ")}`}
          >
            <p
              className={`text-[22px] font-black ${k.color.split(" ")[2]}`}
            >
              {k.count}
            </p>
            <p className="mt-1 text-[13px] font-bold text-gray-900">
              {k.label}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {k.desc}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {(Object.entries(quadrants) as [string, any[]][]).map(
          ([label, items]) => {
            const colors: Record<string, string> = {
              Star: "border-emerald-200 bg-emerald-50/40",
              Puzzle: "border-blue-200 bg-blue-50/40",
              Plowhorse: "border-orange-200 bg-orange-50/40",
              Dog: "border-red-200 bg-red-50/40",
            };
            const tips: Record<string, string> = {
              Star: "Promote on menu, push to customers, protect margins",
              Puzzle:
                "Better photos, staff recommendations, combo deals",
              Plowhorse:
                "Increase price by 5–10% or reduce recipe cost",
              Dog: "Remove, rename, or run as a special to test demand",
            };
            return (
              <div
                key={label}
                className={`overflow-hidden rounded-xl border ${colors[label]} shadow-sm`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">
                      {label}s ({items.length})
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {tips[label]}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <MobileTableCards>
                  <table className="min-w-full text-[12px]">
                    <thead className="bg-white/60">
                      <tr className="border-b border-white/60">
                        {[
                          "Item",
                          "Category",
                          "Sold",
                          "Revenue",
                          "Food Cost",
                          "Margin",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(0, 6).map((item: any) => (
                        <tr
                          key={item.id}
                          className="border-b border-white/40 hover:bg-white/50"
                        >
                          <td className="px-3 py-2 font-semibold text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {item.category?.name || "—"}
                          </td>
                          <td className="px-3 py-2 font-bold text-gray-900">
                            {item.qty}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            ₹
                            {Math.round(item.revenue).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            ₹{item.recipeCost.toFixed(2)}
                            <span className="ml-1 text-gray-400">
                              ({item.foodCostPercent.toFixed(0)}%)
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.margin >= 60 ? "bg-emerald-100 text-emerald-700" : item.margin >= 40 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}
                            >
                              {item.margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-6 text-center text-[11px] text-gray-400"
                          >
                            No items in this quadrant
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </MobileTableCards>
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}
