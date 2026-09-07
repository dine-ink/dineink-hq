import {
  ChartBarIcon,
  ChartPieIcon,
  ArchiveBoxIcon,
  ArrowPathRoundedSquareIcon,
  CubeTransparentIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import MobileTableCards from "@/components/common/MobileTableCards";
import { formatQty } from "@/utils/units";
import { chartPalette } from "@/design";
import { useNavigate } from "react-router-dom";
import type { InventoryAnalytics } from "@/pages/menuManagement/useInventoryAnalytics";

/**
 * Ingredient consumption analytics — what the kitchen actually used, what it
 * cost, and which ingredients dominate the bill.
 *
 * Extracted from MenuManagement.tsx as part of breaking up a 6,000-line
 * component. It came out cheaply because the arithmetic had already moved to
 * useInventoryAnalytics: of the eight values it borrowed from the parent, four
 * were derived figures now reachable through that one object, and three more
 * (the chart's view mode, the category filter, and the router) were used by no
 * other tab and came down with it. What is left as props is the two lists it
 * reads and the alert set the page assembles.
 */

interface AnalyticsTabProps {
  analytics: InventoryAnalytics;
  allIngredients: any[];
  aiAlerts: any[];
}

export default function AnalyticsTab({ analytics, allIngredients, aiAlerts }: AnalyticsTabProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("pie");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const { ingredientAnalytics, avgFoodCost, avgProfitMargin, totalConsumptionValue } =
    analytics;

  return (
            <div className="space-y-4">
              {/* ================= HEADER ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                      <ChartBarIcon className="h-5 w-5 text-white" />
                    </div>

                    <div>
                      <h2 className="text-[24px] font-black tracking-tight text-gray-900">
                        Menu Analytics
                      </h2>

                      <p className="mt-1 text-[13px] text-gray-500">
                        Ingredient usage, costing & operational intelligence
                      </p>
                    </div>
                  </div>

                  {/* KPI CHIPS */}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* FOOD COST */}

                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                      <ChartPieIcon className="h-4 w-4 text-red-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-400">
                          Food Cost
                        </p>

                        <p className="mt-1 text-[15px] font-black text-red-700">
                          {avgFoodCost}%
                        </p>
                      </div>
                    </div>

                    {/* INVENTORY */}

                    <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                      <ArchiveBoxIcon className="h-4 w-4 text-indigo-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-400">
                          Inventory
                        </p>

                        <p className="mt-1 text-[15px] font-black text-indigo-700">
                          ₹
                          {allIngredients
                            .reduce((acc: number, item: any) => {
                              return (
                                acc +
                                Number(item.quantity || 0) *
                                  Number(item.pricePerUnit || 0)
                              );
                            }, 0)
                            .toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* TURNOVER */}

                    <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <ArrowPathRoundedSquareIcon className="h-4 w-4 text-emerald-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                          Turnover
                        </p>

                        <p className="mt-1 text-[15px] font-black text-emerald-700">
                          {(
                            totalConsumptionValue /
                            Math.max(
                              allIngredients.reduce(
                                (acc: number, item: any) => {
                                  return (
                                    acc +
                                    Number(item.quantity || 0) *
                                      Number(item.pricePerUnit || 0)
                                  );
                                },
                                0,
                              ),
                              1,
                            )
                          ).toFixed(2)}
                          x
                        </p>
                      </div>
                    </div>

                    {/* USAGE */}

                    <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                      <CubeTransparentIcon className="h-4 w-4 text-orange-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400">
                          Usage
                        </p>

                        <p className="mt-1 text-[15px] font-black text-orange-700">
                          ₹{totalConsumptionValue.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* MARGIN */}

                    <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <BanknotesIcon className="h-4 w-4 text-emerald-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                          Margin
                        </p>

                        <p className="mt-1 text-[15px] font-black text-emerald-700">
                          {avgProfitMargin}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= TOP SECTION ================= */}

              <div className="grid grid-cols-1 gap-4 ">
                {/* ================= ANALYTICS + ALERTS ================= */}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  {/* ================= LEFT ================= */}

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    {/* TOP */}

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      {/* TITLE */}

                      <div>
                        <h3 className="text-[18px] font-black tracking-tight text-gray-900">
                          Ingredient Intelligence
                        </h3>

                        <p className="mt-1 text-[12px] text-gray-500">
                          Usage analytics & inventory distribution
                        </p>
                      </div>

                      {/* RIGHT */}

                      <div className="flex flex-wrap items-center gap-2">
                        {/* VIEW TOGGLE */}

                        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                          {["pie", "table"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setViewMode(mode)}
                              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${viewMode === mode ? "bg-white text-[#b10000] shadow-sm" : "text-gray-500"}`}
                            >
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                          ))}
                        </div>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
                        >
                          <option value="all">All Categories</option>
                          {[
                            ...new Set(
                              ingredientAnalytics.map(
                                (i: any) => i.category || "Other",
                              ),
                            ),
                          ].map((cat) => (
                            <option key={String(cat)} value={String(cat)}>
                              {String(cat)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* ================= DATA ================= */}

                    {(() => {
                      const totalUsage = ingredientAnalytics.reduce(
                        (s: number, i: any) => s + Number(i.consumed || 0),
                        0,
                      );
                      const ingredientData = ingredientAnalytics.map(
                        (i: any) => ({
                          ingredient: i.ingredient,
                          usage:
                            totalUsage > 0
                              ? Math.round(
                                  (Number(i.consumed || 0) / totalUsage) * 100,
                                )
                              : 0,
                          consumed: formatQty(Number(i.consumed || 0), i.unit),
                          cost: Math.round(Number(i.totalCost || 0)),
                          category: i.category || "Other",
                        }),
                      );

                      const filteredData =
                        selectedCategory === "all"
                          ? ingredientData
                          : ingredientData.filter(
                              (i) => i.category === selectedCategory,
                            );

                      return (
                        <>
                          {/* ================= PIE VIEW ================= */}

                          {viewMode === "pie" && (
                            <>
                              {/* PIE */}

                              <div className="mt-4 h-[220px] rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={filteredData}
                                      dataKey="usage"
                                      nameKey="ingredient"
                                      innerRadius={50}
                                      outerRadius={80}
                                      paddingAngle={3}
                                    >
                                      {filteredData.map((_, index) => {
                                        return (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={
                                              chartPalette[
                                                index % chartPalette.length
                                              ]
                                            }
                                          />
                                        );
                                      })}
                                    </Pie>

                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* LEGEND */}

                              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                {filteredData.map((item, index) => {
                                  const colors = [
                                    "bg-[#b10000]",
                                    "bg-blue-500",
                                    "bg-emerald-500",
                                    "bg-orange-500",
                                    "bg-pink-500",
                                  ];

                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm"
                                    >
                                      <div
                                        className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`}
                                      />
                                      <p className="text-[11px] font-semibold text-gray-700">
                                        {item.ingredient}
                                      </p>
                                      <span className="text-[10px] font-bold text-gray-400">
                                        {item.usage}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}

                          {/* ================= TABLE VIEW ================= */}

                          {viewMode === "table" && (
                            <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-100">
                              <MobileTableCards>
                              <table className="min-w-full">
                                {/* HEAD */}

                                <thead className="bg-gray-50">
                                  <tr>
                                    {[
                                      "Ingredient",
                                      "Category",
                                      "Usage %",
                                      "Consumed",
                                      "Cost",
                                    ].map((head) => (
                                      <th
                                        key={head}
                                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
                                      >
                                        {head}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>

                                {/* BODY */}

                                <tbody>
                                  {filteredData.map((item, index) => (
                                    <tr
                                      key={index}
                                      className="border-t border-gray-100 hover:bg-gray-50/50"
                                    >
                                      <td className="px-4 py-3">
                                        <p className="text-[13px] font-semibold text-gray-900">
                                          {item.ingredient}
                                        </p>
                                      </td>

                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                                          {item.category}
                                        </span>
                                      </td>

                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="h-1.5 w-24 rounded-full bg-gray-100">
                                            <div
                                              className="h-1.5 rounded-full bg-[#b10000]"
                                              style={{
                                                width: `${item.usage}%`,
                                              }}
                                            />
                                          </div>

                                          <span className="text-[12px] font-semibold text-gray-700">
                                            {item.usage}%
                                          </span>
                                        </div>
                                      </td>

                                      <td className="px-4 py-3 text-[12px] text-gray-600">
                                        {item.consumed}
                                      </td>

                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                                          ₹{item.cost}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              </MobileTableCards>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* ================= RIGHT ================= */}

                  <div className="space-y-4">
                    {/* ALERTS */}

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-fit">
                      {/* TOP */}

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[18px] font-black tracking-tight text-gray-900">
                            Operational Alerts
                          </h3>

                          <p className="mt-1 text-[12px] text-gray-500">
                            Waste & operational monitoring
                          </p>
                        </div>

                        <div className="rounded-full bg-[#b10000]/10 px-3 py-1 text-[10px] font-bold text-[#b10000]">
                          AI Monitoring
                        </div>
                      </div>

                      {/* ALERTS */}

                      <div className="mt-4 space-y-2">
                        {aiAlerts.slice(0, 6).map((alert: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[14px] font-bold text-gray-900">
                                    {alert.title}
                                  </p>

                                  <span className="text-[10px] font-semibold text-gray-400">
                                    Live
                                  </span>
                                </div>

                                <p
                                  className={`mt-1 text-[12px] ${alert.text || "text-gray-500"}`}
                                >
                                  {alert.desc}
                                </p>

                                {alert.vendorId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate("/dashboard/vendors", {
                                        state: {
                                          restockVendorId: alert.vendorId,
                                          restockIngredientName:
                                            alert.ingredientName,
                                        },
                                      })
                                    }
                                    className="mt-2 rounded-lg bg-[#b10000] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-[#950000]"
                                  >
                                    Restock from {alert.vendorName}
                                  </button>
                                )}
                              </div>

                              <div
                                className={`h-2.5 w-2.5 shrink-0 rounded-full ${alert.color || "bg-gray-400"}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const sorted = [...ingredientAnalytics].sort(
                          (a: any, b: any) =>
                            Number(b.consumed || 0) - Number(a.consumed || 0),
                        );
                        const costSorted = [...ingredientAnalytics].sort(
                          (a: any, b: any) =>
                            Number(b.totalCost || 0) - Number(a.totalCost || 0),
                        );
                        return [
                          {
                            label: "Highest Usage",
                            value: sorted[0]?.ingredient || "—",
                            sub: sorted[0]
                              ? formatQty(
                                  Number(sorted[0].consumed || 0),
                                  sorted[0].unit,
                                )
                              : "No data",
                            color: "text-red-600",
                          },
                          {
                            label: "Fastest Moving",
                            value: sorted[1]?.ingredient || "—",
                            sub: "High kitchen demand",
                            color: "text-emerald-600",
                          },
                          {
                            label: "Highest Cost",
                            value: costSorted[0]?.ingredient || "—",
                            sub: costSorted[0]
                              ? `₹${Math.round(Number(costSorted[0].totalCost || 0)).toLocaleString("en-IN")}`
                              : "No data",
                            color: "text-orange-600",
                          },
                          {
                            label: "Total Consumption",
                            value: `₹${Math.round(totalConsumptionValue).toLocaleString("en-IN")}`,
                            sub: `${ingredientAnalytics.length} ingredients tracked`,
                            color: "text-indigo-600",
                          },
                        ].map((c) => (
                          <div
                            key={c.label}
                            className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              {c.label}
                            </p>
                            <p
                              className={`mt-2 truncate text-[18px] font-black ${c.color}`}
                            >
                              {c.value}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-500">
                              {c.sub}
                            </p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= TABLE ================= */}

              {/* <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"> */}
              {/* HEADER */}

              {/* <div className="border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[18px] font-black tracking-tight text-gray-900">
                        Consumption Analytics
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        Ingredient consumption intelligence
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">
                      Auto Calculated
                    </span>
                  </div>
                </div> */}

              {/* TABLE */}

              {/* <div className="overflow-auto">
                  <MobileTableCards>
                  <table className="min-w-full">

                    <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                      <tr>
                        {[
                          "Ingredient",
                          "Consumed",
                          "Avg Daily",
                          "Recipe Cost",
                          "Waste %",
                          "Status",
                        ].map((head, index) => (
                          <th
                            key={index}
                            className="
                    whitespace-nowrap
                    px-4
                    py-2.5
                    text-left
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    text-gray-400
                  "
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>


                    <tbody>
                      {ingredientAnalytics?.map((row: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-indigo-50/10"
                        >
                

                          <td className="px-4 py-2.5">
                            <p className="text-[13px] font-semibold text-gray-900">
                              {row.ingredient}
                            </p>
                          </td>


                          <td className="px-4 py-2.5 text-[12px] text-gray-600">
                            {Math.round(Number(row.consumed || 0))} {row.unit}
                          </td>


                          <td className="px-4 py-2.5 text-[12px] text-gray-600">
                            {(Number(row.consumed || 0) / 30).toFixed(1)}{" "}
                            {row.unit}
                          </td>


                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                              ₹{Number(row.totalCost || 0).toFixed(0)}
                            </span>
                          </td>


                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-500">
                              0%
                            </span>
                          </td>


                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                              Healthy
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </MobileTableCards>
                </div> */}
              {/* </div> */}
            </div>
  );
}
