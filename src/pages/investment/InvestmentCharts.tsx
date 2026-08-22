import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import { fmtCategoryValue } from "./investmentCategories";

const TICK = { fontSize: 10, fill: "#6b7280" };
const CHART_CARD = "overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm";
const PALETTE = ["#b10000", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#0891b2"];

/** Portfolio-wide comparison charts — spec section 8's first 5 items (Cash Flow Timeline, ROI/NPV Comparison, Investment vs Return, Payback Timeline). Scenario Comparison and Forecast-With-vs-Without live in the per-project detail view instead, since both need one specific project selected. */
export default function InvestmentCharts({ projects }: { projects: { project: any; metrics: any }[] }) {
  if (projects.length === 0) return null;

  const roiData = projects.map((p) => ({ name: p.project.name, roi: p.metrics.roiPercentage ?? 0 }));
  const npvData = projects.map((p) => ({ name: p.project.name, npv: p.metrics.npv ?? 0 }));
  const investmentVsReturnData = projects.map((p) => ({
    name: p.project.name,
    investment: p.project.initialInvestment,
    totalReturn: p.metrics.projection.annualCashFlows.reduce((s: number, v: number) => s + v, 0),
  }));
  const paybackData = projects.filter((p) => p.metrics.paybackPeriodYears !== null).map((p) => ({ name: p.project.name, years: p.metrics.paybackPeriodYears }));

  // Cash flow timeline — cumulative cash flow per year, one line per project (top 6 to keep it legible).
  const timelineProjects = projects.slice(0, 6);
  const maxYears = Math.max(...timelineProjects.map((p) => p.metrics.projection.cumulativeCashFlows.length), 0);
  const timelineData = Array.from({ length: maxYears }, (_, year) => {
    const row: Record<string, any> = { year: `Year ${year}` };
    timelineProjects.forEach((p) => { row[p.project.name] = p.metrics.projection.cumulativeCashFlows[year] ?? null; });
    return row;
  });

  const tickFormatter = (v: number) => (Math.abs(v) >= 100000 ? `${(v / 100000).toFixed(1)}L` : Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v));

  // Project names (e.g. "New Franchise Outlet — Chennai Suburb") are
  // arbitrary-length and otherwise overflow the chart's plotting area —
  // angled X-axis labels clip past the card's left edge, and wrapped Y-axis
  // category labels overlap neighboring rows. Truncating on the axis only
  // affects the rendered tick text; Tooltip still reads the untruncated name
  // from each row's own `name` field, so hovering always shows it in full.
  const truncateLabel = (maxLen: number) => (name: string) => (name.length > maxLen ? `${name.slice(0, maxLen - 1)}…` : name);

  return (
    <div className="space-y-4">
      <h4 className="text-[13px] font-bold text-gray-900">Investment Charts</h4>

      <div className={CHART_CARD}>
        <p className="mb-2 text-[11px] font-bold text-gray-700">Cash Flow Timeline — Cumulative Cash Flow by Year</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timelineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
            <Tooltip formatter={(v: number) => fmtCategoryValue(v, "currency")} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {timelineProjects.map((p, i) => (
              <Line key={p.project.id} type="monotone" dataKey={p.project.name} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className={CHART_CARD}>
          <p className="mb-2 text-[11px] font-bold text-gray-700">ROI Comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={roiData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} tickFormatter={truncateLabel(16)} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Bar dataKey="roi" name="ROI %" radius={[4, 4, 0, 0]}>
                {roiData.map((d, i) => <Cell key={i} fill={d.roi >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={CHART_CARD}>
          <p className="mb-2 text-[11px] font-bold text-gray-700">NPV Comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={npvData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} tickFormatter={truncateLabel(16)} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
              <Tooltip formatter={(v: number) => fmtCategoryValue(v, "currency")} />
              <Bar dataKey="npv" name="NPV" radius={[4, 4, 0, 0]}>
                {npvData.map((d, i) => <Cell key={i} fill={d.npv >= 0 ? "#10b981" : "#ef4444"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={CHART_CARD}>
          <p className="mb-2 text-[11px] font-bold text-gray-700">Investment vs Return</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={investmentVsReturnData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} tickFormatter={truncateLabel(16)} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={tickFormatter} />
              <Tooltip formatter={(v: number) => fmtCategoryValue(v, "currency")} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="investment" name="Initial Investment" fill="#9ca3af" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalReturn" name="Total Cash Flow" fill="#b10000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={CHART_CARD}>
          <p className="mb-2 text-[11px] font-bold text-gray-700">Payback Timeline (Years)</p>
          {/* Height scales with project count so each row keeps a fixed ~36px
              band — a static height cramped long project names into
              overlapping wrapped lines once there were more than ~5 rows. */}
          <ResponsiveContainer width="100%" height={Math.max(220, paybackData.length * 36)}>
            <BarChart data={paybackData} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}y`} />
              <YAxis type="category" dataKey="name" tick={TICK} axisLine={false} tickLine={false} width={130} tickFormatter={truncateLabel(18)} />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)} years`} />
              <Bar dataKey="years" name="Payback" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
