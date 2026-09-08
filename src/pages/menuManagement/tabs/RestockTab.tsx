import {
  ArchiveBoxIcon,
  ChartPieIcon,
  ArrowPathRoundedSquareIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/outline";
import MobileTableCards from "@/components/common/MobileTableCards";
import type { InventoryAnalytics } from "@/pages/menuManagement/useInventoryAnalytics";

/**
 * Weekly restock sheets — opening stock, purchases, consumption and closing
 * stock per ingredient, with the spreadsheet upload that fills them in.
 *
 * Extracted from MenuManagement.tsx as part of breaking up a 6,000-line
 * component. Four of the ten values it referenced were derived figures shared
 * with Analytics and Item Mapping; those became useInventoryAnalytics, and the
 * tab takes that one object rather than four separate props.
 */

interface RestockTabProps {
  analytics: InventoryAnalytics;
  restocks: any[];
  selectedWeek: string;
  setSelectedWeek: (week: string) => void;
  uploadingRestock: boolean;
  downloadInventoryTemplate: () => void;
  handleUploadRestockSheet: (e: any) => void;
}

export default function RestockTab({ analytics, restocks, selectedWeek, setSelectedWeek, uploadingRestock, downloadInventoryTemplate, handleUploadRestockSheet }: RestockTabProps) {
  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const { avgFoodCost, inventoryValue, inventoryTurnover, totalConsumptionValue } =
    analytics;

  return (
            <div className="space-y-4">
              {/* ================= HERO ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-4">
                    {/* ICON */}

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b10000] shadow-sm">
                      <ArchiveBoxIcon className="h-5 w-5 text-white" />
                    </div>

                    {/* CONTENT */}

                    <div>
                      <h1 className="text-[24px] font-black leading-none tracking-tight text-gray-900">
                        Restock Analytics
                      </h1>

                      <p className="mt-1 text-[13px] text-gray-500">
                        Inventory purchase & stock tracking
                      </p>
                    </div>
                  </div>

                  {/* RIGHT KPI CHIPS */}

                  {/* RIGHT SECTION */}

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {/* KPI GROUP */}

                    {/* <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-2"> */}
                    {/* FOOD COST */}

                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                        <ChartPieIcon className="h-3.5 w-3.5 text-red-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-red-400">
                          Food Cost
                        </p>

                        <p className="mt-1 text-[14px] font-black text-red-700">
                          {avgFoodCost}%
                        </p>
                      </div>
                    </div>

                    {/* INVENTORY */}

                    <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                        <ArchiveBoxIcon className="h-3.5 w-3.5 text-indigo-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-indigo-400">
                          Inventory
                        </p>

                        <p className="mt-1 text-[14px] font-black text-indigo-700">
                          ₹{Number(inventoryValue || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* TURNOVER */}

                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                        <ArrowPathRoundedSquareIcon className="h-3.5 w-3.5 text-emerald-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                          Turnover
                        </p>

                        <p className="mt-1 text-[14px] font-black text-emerald-700">
                          {inventoryTurnover}x
                        </p>
                      </div>
                    </div>

                    {/* USAGE */}

                    <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                        <CubeTransparentIcon className="h-3.5 w-3.5 text-orange-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-orange-400">
                          Usage
                        </p>

                        <p className="mt-1 text-[14px] font-black text-orange-700">
                          ₹
                          {Number(totalConsumptionValue || 0).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                    </div>
                    {/* </div> */}

                    {/* DIVIDER */}

                    <div className="hidden h-10 w-px bg-gray-200 xl:block" />

                    {/* TEMPLATE BUTTON */}

                    <button
                      onClick={downloadInventoryTemplate}
                      className="flex h-10 items-center rounded-xl border border-[#b10000]/20 bg-white px-4 text-[12px] font-semibold text-[#b10000] shadow-sm transition hover:bg-red-50"
                    >
                      Restock Template
                    </button>
                    <label className="flex h-10 cursor-pointer items-center rounded-xl bg-[#b10000] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]">
                      {uploadingRestock ? "Uploading..." : "Upload Restock"}

                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleUploadRestockSheet}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ================= TABLE ================= */}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* ================= HEADER ================= */}

                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    {/* LEFT */}

                    <div>
                      <h3 className="text-[20px] font-black tracking-tight text-gray-900">
                        Inventory Sheet
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        {new Date().toLocaleString("default", {
                          month: "long",
                        })}{" "}
                        {new Date().getFullYear()} &mdash; Weekly stock &amp;
                        purchase tracking
                      </p>
                    </div>

                    {/* RIGHT */}

                    <div className="flex items-center gap-3">
                      {/* WEEK SWITCHER */}

                      <div className="flex w-full items-center overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-1 xl:w-auto">
                        {[1, 2, 3, 4, 5].map((week) => (
                          <button
                            key={week}
                            onClick={() => setSelectedWeek(`week${week}`)}
                            className={`min-w-[64px] shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold transition-all ${
                              selectedWeek === `week${week}`
                                ? "bg-[#b10000] text-white shadow-sm"
                                : "text-gray-600 hover:bg-white"
                            }`}
                          >
                            Week {week}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= TABLE ================= */}

                <div className="overflow-auto">
                  <MobileTableCards>
                  <table className="min-w-full text-sm">
                    {/* HEADER */}

                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr>
                        {[
                          "Ingredient",
                          "Category",
                          "Unit",
                          "Opening Qty",
                          "Opening Value",
                          "Purchase Qty",
                          "Expense",
                          "Closing",
                          "Monthly Purchase",
                          "RM Expense",
                        ].map((head) => (
                          <th
                            key={head}
                            className="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* BODY */}

                    <tbody>
                      {restocks?.length ? (
                        restocks.map((row: any, index: number) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 transition hover:bg-gray-50/80"
                          >
                            {/* INGREDIENT */}

                            <td className="px-4 py-3">
                              <div>
                                <p className="text-[14px] font-semibold text-gray-900">
                                  {row.Ingredient}
                                </p>

                                <p className="mt-0.5 text-[11px] text-gray-400">
                                  Inventory Item
                                </p>
                              </div>
                            </td>

                            {/* CATEGORY */}

                            <td className="px-4 py-3">
                              <div className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                                {row.Category}
                              </div>
                            </td>

                            {/* UNIT */}

                            <td className="px-4 py-3 text-[13px] font-medium text-gray-700">
                              {row.Unit}
                            </td>

                            {/* OPENING */}

                            <td className="px-4 py-3 text-[13px] text-gray-700">
                              {row.OpeningStockQty}
                            </td>

                            {/* OPENING VALUE */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-indigo-600">
                              ₹
                              {Number(
                                row.OpeningStockValue || 0,
                              ).toLocaleString("en-IN")}
                            </td>

                            {/* PURCHASE */}

                            <td className="px-4 py-3 text-[13px] text-gray-700">
                              {row.Week1PurchaseQty}
                            </td>

                            {/* EXPENSE */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-red-500">
                              ₹
                              {Number(row.Week1Expense || 0).toLocaleString(
                                "en-IN",
                              )}
                            </td>

                            {/* CLOSING */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-emerald-600">
                              ₹
                              {Number(
                                row.Week1ClosingValue || 0,
                              ).toLocaleString("en-IN")}
                            </td>

                            {/* MONTH PURCHASE */}

                            <td className="px-4 py-3 text-[13px] font-bold text-indigo-600">
                              ₹
                              {Number(
                                row.TotalPurchaseAmount || 0,
                              ).toLocaleString("en-IN")}
                            </td>

                            {/* RM */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-orange-500">
                              ₹
                              {Number(row.MonthlyRMExpense || 0).toLocaleString(
                                "en-IN",
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-6 py-16 text-center text-sm text-gray-400"
                          >
                            No inventory data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  </MobileTableCards>
                </div>
              </div>
            </div>
  );
}
