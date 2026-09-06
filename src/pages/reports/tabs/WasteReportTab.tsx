import dayjs from "dayjs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import MobileTableCards from "@/components/common/MobileTableCards";

/**
 * Wastage and inventory shrinkage by type, reason and ingredient.
 *
 * Extracted from Report.tsx as part of breaking up a 4,254-line component.
 * Chosen by measurement: it referenced a single value from the
 * parent scope, now its prop. The characterisation suite in
 * Report.characterisation.test.tsx is what verifies the move changed nothing.
 */

interface WasteReportTabProps {
  inventoryAdjustments: any;
}

export default function WasteReportTab({ inventoryAdjustments }: WasteReportTabProps) {
  const byType = inventoryAdjustments.reduce((acc: any, a: any) => {
    const t = a.adjustmentType || "UNKNOWN";
    if (!acc[t]) acc[t] = { type: t, count: 0, items: [] };
    acc[t].count++;
    acc[t].items.push(a);
    return acc;
  }, {});
  const totalAdjustments = inventoryAdjustments.length;
  const wastageItems = inventoryAdjustments.filter(
    (a: any) =>
      a.adjustmentType === "WASTAGE" ||
      a.adjustmentType === "EXPIRED",
  );
  const damageItems = inventoryAdjustments.filter(
    (a: any) => a.adjustmentType === "DAMAGE",
  );
  // SALE_DEDUCTION rows are routine stock decrements auto-logged on
  // every paid bill — not wastage — so they're excluded here even
  // though they still count toward "Total Adjustments" above.
  const wastageByIngredient = inventoryAdjustments
    .filter((a: any) => a.adjustmentType !== "SALE_DEDUCTION")
    .reduce(
      (acc: any, a: any) => {
        const name = a.ingredient?.name || "Unknown";
        if (!acc[name])
          acc[name] = { name, qty: 0, cost: 0, adjustments: 0 };
        const qty = Number(a.quantity || 0);
        acc[name].qty += qty;
        acc[name].cost +=
          qty * Number(a.ingredient?.pricePerUnit || 0);
        acc[name].adjustments++;
        return acc;
      },
      {} as Record<string, any>,
    );
  const topWaste = Object.values(wastageByIngredient)
    .sort((a: any, b: any) => b.qty - a.qty)
    .slice(0, 10);
  const totalWastageCost = Object.values(
    wastageByIngredient,
  ).reduce<number>((s, i: any) => s + i.cost, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: "Total Adjustments",
            value: totalAdjustments,
            sub: "this period",
            cls: "border-gray-200 bg-gray-50/60",
            val: "text-gray-700",
          },
          {
            label: "Wastage / Expired",
            value: wastageItems.length,
            sub: "items wasted",
            cls: "border-orange-100 bg-orange-50/60",
            val: "text-orange-700",
          },
          {
            label: "Damage",
            value: damageItems.length,
            sub: "items damaged",
            cls: "border-red-100 bg-red-50/60",
            val: "text-red-700",
          },
          {
            label: "Unique Ingredients",
            value: Object.keys(wastageByIngredient).length,
            sub: "affected",
            cls: "border-violet-100 bg-violet-50/60",
            val: "text-violet-700",
          },
          {
            label: "Total Wastage Cost",
            value: `₹${Math.round(totalWastageCost).toLocaleString("en-IN")}`,
            sub: "qty × unit price",
            cls: "border-amber-100 bg-amber-50/60",
            val: "text-amber-700",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border p-4 ${k.cls}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {k.label}
            </p>
            <p className={`mt-2 text-[22px] font-bold ${k.val}`}>
              {k.value}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">{k.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              Top Wasted Ingredients
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              By total quantity adjusted
            </p>
          </div>
          {topWaste.length > 0 ? (
            <div className="p-3">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={topWaste} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="qty"
                    name="Qty Wasted"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[230px] items-center justify-center text-[12px] text-gray-400">
              No inventory adjustments for this period
            </div>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-[15px] font-bold text-gray-900">
              By Adjustment Type
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.values(byType).map((t: any) => (
              <div
                key={t.type}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      t.type === "WASTAGE"
                        ? "bg-orange-100 text-orange-700"
                        : t.type === "DAMAGE"
                          ? "bg-red-100 text-red-700"
                          : t.type === "EXPIRED"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {t.type}
                  </span>
                </div>
                <p className="text-[14px] font-bold text-gray-900">
                  {t.count} entries
                </p>
              </div>
            ))}
            {Object.keys(byType).length === 0 && (
              <div className="py-10 text-center text-[12px] text-gray-400">
                No inventory adjustments recorded
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[15px] font-bold text-gray-900">
            Adjustment Log
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Every inventory write-down with reason and staff
            responsible
          </p>
        </div>
        <div className="overflow-x-auto">
          <MobileTableCards>
          <table className="min-w-full text-[12px]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100">
                {[
                  "Date",
                  "Ingredient",
                  "Type",
                  "Quantity",
                  "Cost",
                  "Reason",
                  "Updated By",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryAdjustments.slice(0, 20).map((a: any) => (
                <tr
                  key={a.id}
                  className="border-b border-gray-50 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-2.5 text-gray-500">
                    {dayjs(a.createdAt).format("DD MMM YYYY")}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">
                    {a.ingredient?.name || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        a.adjustmentType === "WASTAGE"
                          ? "bg-orange-50 text-orange-600"
                          : a.adjustmentType === "DAMAGE"
                            ? "bg-red-50 text-red-700"
                            : a.adjustmentType === "EXPIRED"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {a.adjustmentType}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-gray-900">
                    {Number(a.quantity || 0).toFixed(2)}{" "}
                    {a.ingredient?.unit || ""}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    ₹
                    {(
                      Number(a.quantity || 0) *
                      Number(a.ingredient?.pricePerUnit || 0)
                    ).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[180px] truncate">
                    {a.reason || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {a.updatedBy?.name || "—"}
                  </td>
                </tr>
              ))}
              {inventoryAdjustments.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-[12px] text-gray-400"
                  >
                    No inventory adjustments logged. Use the
                    Operations page to record wastage and damage.
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
