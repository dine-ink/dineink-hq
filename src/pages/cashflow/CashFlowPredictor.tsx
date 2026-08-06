import { useEffect, useState } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAppSelector } from "../../store";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  LoadingOverlay,
  Alert,
  DataTable,
  ChartCard,
  colors,
  type DataTableColumn,
  type MetricStatus,
} from "../../design";

type Horizon = "week" | "month" | "quarter";

const HORIZONS: { key: Horizon; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
];

interface ProjectedOutflow {
  vendorDues: number;
  emiDues: number;
  payroll: number;
  gst: number;
  total: number;
}

interface CashFlowProjection {
  horizon: string;
  fromDate: string;
  toDate: string;
  projectedInflow: number;
  projectedOutflow: ProjectedOutflow;
  netCashFlow: number;
  breakdown: {
    vendorInvoicesDue: unknown[];
    emiSchedulesDue: unknown[];
  };
}

interface DailyInflowPoint {
  date: string;
  revenue: number;
  billCount: number;
}

// Rows in "Upcoming Vendor/EMI Payments Due" tables — the backend's exact
// item shape isn't guaranteed, so every field is read defensively with
// fallbacks (see normalizeDueItem below).
interface DueRow {
  id: string | number;
  label: string;
  amount: number;
  dueDate: string | null;
}

const TICK = { fontSize: 10, fill: colors.neutral[500] };

// Matches the ₹{value.toLocaleString("en-IN")} convention already used
// across the app's finance pages (Dues Tracker, Insights, Report).
const formatCurrency = (value: number | null | undefined): string =>
  `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// The breakdown arrays' item shape isn't documented precisely — normalize
// whatever comes back (id/label/amount/dueDate under any of several likely
// key names) into one consistent row shape for the tables below.
function normalizeDueItem(item: unknown, idx: number, kind: "vendor" | "emi"): DueRow {
  const o = (item ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]): unknown => {
    for (const k of keys) {
      if (o[k] !== undefined && o[k] !== null) return o[k];
    }
    return undefined;
  };
  const label =
    (pick("label", "invoiceNumber", "loanName", "vendorName", "name", "title", "lender") as string | undefined) ??
    (kind === "vendor" ? `Invoice ${idx + 1}` : `EMI ${idx + 1}`);
  const amount = Number(pick("amount", "amountDue", "pendingAmount", "dueAmount", "emiAmount", "installmentAmount") ?? 0);
  const dueDate = (pick("dueDate", "date", "due_date", "paymentDate") as string | undefined) ?? null;
  const id = (pick("id", "_id") as string | number | undefined) ?? idx;
  return { id, label, amount: Number.isFinite(amount) ? amount : 0, dueDate };
}

const isoDate = (d: Date): string => d.toISOString().split("T")[0];

export default function CashFlowPredictor() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [horizon, setHorizon] = useState<Horizon>("month");
  const [projection, setProjection] = useState<CashFlowProjection | null>(null);
  const [projectionLoading, setProjectionLoading] = useState(false);

  const [dailyInflow, setDailyInflow] = useState<DailyInflowPoint[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    const restaurantId = user?.restaurantId;
    const branchId = selectedBranch?.id;
    if (!restaurantId || !branchId) return;

    const fetchProjection = async () => {
      try {
        setProjectionLoading(true);
        const res = await fetch(
          `${API_URL}/api/cashflow/${restaurantId}/${branchId}/projection?horizon=${horizon}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setProjection(json.data);
      } catch {
        /* silent */
      } finally {
        setProjectionLoading(false);
      }
    };
    fetchProjection();
  }, [API_URL, token, user?.restaurantId, selectedBranch?.id, horizon]);

  useEffect(() => {
    const restaurantId = user?.restaurantId;
    const branchId = selectedBranch?.id;
    if (!restaurantId || !branchId) return;

    const fetchDailyInflow = async () => {
      try {
        setDailyLoading(true);
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - 29);
        const res = await fetch(
          `${API_URL}/api/cashflow/${restaurantId}/${branchId}/inflow-daily?from=${isoDate(from)}&to=${isoDate(to)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setDailyInflow(json.data || []);
      } catch {
        /* silent */
      } finally {
        setDailyLoading(false);
      }
    };
    fetchDailyInflow();
  }, [API_URL, token, user?.restaurantId, selectedBranch?.id]);

  if (projectionLoading && !projection) {
    return <LoadingOverlay label="Loading cash flow projection..." />;
  }

  const outflow: ProjectedOutflow = projection?.projectedOutflow ?? {
    vendorDues: 0,
    emiDues: 0,
    payroll: 0,
    gst: 0,
    total: 0,
  };
  const inflow = projection?.projectedInflow ?? 0;
  const netCashFlow = projection?.netCashFlow ?? inflow - outflow.total;
  const netStatus: MetricStatus = netCashFlow >= 0 ? "success" : "danger";

  const vendorRows: DueRow[] = (projection?.breakdown?.vendorInvoicesDue ?? []).map((item, idx) =>
    normalizeDueItem(item, idx, "vendor"),
  );
  const emiRows: DueRow[] = (projection?.breakdown?.emiSchedulesDue ?? []).map((item, idx) =>
    normalizeDueItem(item, idx, "emi"),
  );

  const comparisonData = [
    { name: "Projected Inflow", value: inflow, fill: colors.success[500] },
    { name: "Projected Outflow", value: outflow.total, fill: colors.danger[500] },
  ];

  const dueColumns: DataTableColumn<DueRow>[] = [
    { key: "label", header: "Description", render: (r) => <span className="font-semibold text-gray-900">{r.label}</span> },
    { key: "amount", header: "Amount", render: (r) => <span className="font-bold text-gray-900">{formatCurrency(r.amount)}</span> },
    { key: "dueDate", header: "Due Date", render: (r) => <span className="text-gray-500">{formatDate(r.dueDate)}</span> },
  ];

  return (
    <PageContainer>
      <PageHeader
        icon={<ArrowsRightLeftIcon className="h-5 w-5 text-white" />}
        title="Cash Flow Predictor"
        subtitle="Projects upcoming cash inflow against outflow — vendor dues, payroll, GST, and EMI — for the selected horizon"
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {HORIZONS.map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => setHorizon(h.key)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 ${
                  horizon === h.key
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>
        }
      />

      {projection && (
        <p className="text-[11px] text-gray-400">
          {formatDate(projection.fromDate)} → {formatDate(projection.toDate)}
          {projectionLoading && " · updating…"}
        </p>
      )}

      {netCashFlow < 0 && (
        <Alert variant="danger" title="Projected shortfall ahead">
          Outflow is projected to exceed inflow by {formatCurrency(Math.abs(netCashFlow))} over this{" "}
          {horizon}. Review vendor and EMI dues below and plan liquidity accordingly.
        </Alert>
      )}

      {/* TOP KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <MetricCard label="Projected Inflow" value={formatCurrency(inflow)} sub={`over the next ${horizon}`} status="success" />
        <MetricCard label="Total Projected Outflow" value={formatCurrency(outflow.total)} sub="vendor dues + payroll + GST + EMI" status="warning" />
        <MetricCard
          label="Net Cash Flow"
          value={formatCurrency(netCashFlow)}
          sub={netCashFlow >= 0 ? "projected surplus" : "projected shortfall"}
          status={netStatus}
        />
      </div>

      {/* OUTFLOW BREAKDOWN */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Vendor Dues" value={formatCurrency(outflow.vendorDues)} sub="pending vendor invoices" status="neutral" />
        <MetricCard label="Payroll" value={formatCurrency(outflow.payroll)} sub="staff salaries due" status="neutral" />
        <MetricCard label="GST" value={formatCurrency(outflow.gst)} sub="tax liability due" status="neutral" />
        <MetricCard label="EMI" value={formatCurrency(outflow.emiDues)} sub="loan installments due" status="neutral" />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ChartCard title="Inflow vs Outflow" subtitle={`Projected totals for the selected ${horizon}`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.neutral[100]} />
              <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
                {comparisonData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recent Daily Cash Inflow" subtitle="Trailing 30 days of billed revenue by day">
          {dailyLoading && dailyInflow.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">Loading…</div>
          ) : dailyInflow.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyInflow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.neutral[100]} />
                <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number, name: string) => (name === "Revenue" ? formatCurrency(v) : v)}
                  labelFormatter={(v) => formatDate(v as string)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={colors.info[500]}
                  strokeWidth={2}
                  dot={{ fill: colors.info[500], r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-[12px] text-gray-400">
              No billing data yet for this branch
            </div>
          )}
        </ChartCard>
      </div>

      {/* DUE TABLES */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ChartCard title="Upcoming Vendor Payments Due" subtitle="Vendor invoices due within the selected horizon" bodyClassName="p-0">
          <DataTable
            columns={dueColumns}
            rows={vendorRows}
            rowKey={(r) => r.id}
            loading={projectionLoading && !projection}
            emptyTitle="No vendor payments due"
            emptyDescription="No vendor invoices are due within this period."
          />
        </ChartCard>

        <ChartCard title="Upcoming EMI Payments Due" subtitle="Loan installments due within the selected horizon" bodyClassName="p-0">
          <DataTable
            columns={dueColumns}
            rows={emiRows}
            rowKey={(r) => r.id}
            loading={projectionLoading && !projection}
            emptyTitle="No EMI payments due"
            emptyDescription="No loan installments are due within this period."
          />
        </ChartCard>
      </div>
    </PageContainer>
  );
}
