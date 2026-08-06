import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppSelector } from "../../store";
import { Alert, EmptyState, LoadingOverlay, chartPalette } from "../../design";
import { categoryLabel, formatCurrency, monthYearLabel, type MonthComparisonData } from "./duesShared";

interface MonthComparisonTabProps {
  month: number;
  year: number;
}

const TICK = { fontSize: 10, fill: "#6b7280" };
const CURRENT_COLOR = chartPalette[0]; // danger[500] — this month
const PREVIOUS_COLOR = chartPalette[1]; // info[500] — previous month

const previousMonthYear = (month: number, year: number) => (month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year });

export default function MonthComparisonTab({ month, year }: MonthComparisonTabProps) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [data, setData] = useState<MonthComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user?.restaurantId || !selectedBranch?.id) return;
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(
          `${API_URL}/api/dues/${user.restaurantId}/${selectedBranch.id}/month-comparison?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setData(json.data || null);
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.restaurantId, selectedBranch?.id, month, year]);

  if (loading) {
    return <LoadingOverlay label="Loading month comparison..." />;
  }

  const current = data?.current || [];
  const previous = data?.previous || [];
  const changePercent = data?.changePercent || [];

  const categories = Array.from(new Set([...current.map((c) => c.category), ...previous.map((c) => c.category)]));

  const chartData = categories.map((cat) => ({
    category: cat,
    categoryDisplay: categoryLabel(cat),
    currentAmount: current.find((c) => c.category === cat)?.amountDue || 0,
    previousAmount: previous.find((c) => c.category === cat)?.amountDue || 0,
  }));

  const prev = previousMonthYear(month, year);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" title="Couldn't load the month comparison">
          Something went wrong fetching current vs previous month figures.
        </Alert>
      )}

      {!error && chartData.length === 0 ? (
        <EmptyState title="No comparison data yet" description="Add some monthly dues to see how this month compares to last month." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-[15px] font-bold text-gray-900">Amount Due by Category</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {monthYearLabel(month, year)} vs {monthYearLabel(prev.month, prev.year)}
              </p>
            </div>
            <div className="p-3">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="categoryDisplay" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="currentAmount" name={monthYearLabel(month, year)} fill={CURRENT_COLOR} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previousAmount" name={monthYearLabel(prev.month, prev.year)} fill={PREVIOUS_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Change vs Previous Month</th>
                </tr>
              </thead>
              <tbody>
                {changePercent.length > 0 ? (
                  changePercent.map((c) => (
                    <tr key={c.category} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-medium text-gray-700">{categoryLabel(c.category)}</td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold ${
                          c.pct > 0 ? "text-danger-600" : c.pct < 0 ? "text-success-600" : "text-gray-500"
                        }`}
                      >
                        {c.pct > 0 ? "+" : ""}
                        {c.pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                      No change data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
