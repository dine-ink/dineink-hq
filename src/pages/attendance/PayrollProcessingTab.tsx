import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useAppSelector } from "../../store";
import {
  Alert,
  Button,
  DataTable,
  type DataTableColumn,
  Dialog,
  EmptyState,
  FormField,
  Select,
  StatusChip,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Td,
  Textarea,
  Th,
} from "../../design";
import {
  exportPayrollRunToExcel,
  exportPayrollRunToPDF,
  payrollPeriodLabel,
  type PayrollRun,
} from "./payrollExport";

interface PayrollProcessingTabProps {
  allStaff: any[];
}

const DEDUCTION_TYPES = ["ADVANCE", "FINE", "UNPAID_LEAVE", "OTHER"] as const;

const inr = (v: any) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function PayrollProcessingTab({ allStaff }: PayrollProcessingTabProps) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, token, restaurant } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [monthValue, setMonthValue] = useState(dayjs().format("YYYY-MM"));
  const [month, year] = (() => {
    const [y, m] = monthValue.split("-").map(Number);
    return [m || dayjs().month() + 1, y || dayjs().year()];
  })();

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const [viewingRun, setViewingRun] = useState<PayrollRun | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formDeductionType, setFormDeductionType] =
    useState<(typeof DEDUCTION_TYPES)[number]>("ADVANCE");
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deductionSuccess, setDeductionSuccess] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user?.restaurantId || !selectedBranch?.id) return;
    setLoadingHistory(true);
    setHistoryError(false);
    try {
      const res = await fetch(
        `${API_URL}/api/attendance/payroll/${user.restaurantId}/${selectedBranch.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setRuns(json.data || []);
      else setHistoryError(true);
    } catch {
      setHistoryError(true);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId, selectedBranch?.id]);

  const runPayroll = async () => {
    if (!selectedBranch?.id) return;
    setRunning(true);
    setRunError(null);
    try {
      const res = await fetch(`${API_URL}/api/attendance/payroll/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ branchId: selectedBranch.id, month, year }),
      });
      const json = await res.json();
      if (json.success) {
        setViewingRun(json.data);
        await fetchHistory();
      } else {
        setRunError(json.message || "Failed to run payroll for this period");
      }
    } catch {
      setRunError("Failed to run payroll for this period");
    } finally {
      setRunning(false);
    }
  };

  const openDeductionDialog = () => {
    setFormUserId(allStaff[0] ? String(allStaff[0].id) : "");
    setFormDeductionType("ADVANCE");
    setFormAmount("");
    setFormNotes("");
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDeductionDialog = () => {
    setDialogOpen(false);
    setFormError(null);
  };

  const saveDeduction = async () => {
    if (!selectedBranch?.id) return;
    if (!formUserId || !formAmount || Number(formAmount) <= 0) {
      setFormError("Please select an employee and enter a valid amount");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`${API_URL}/api/attendance/deductions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: Number(formUserId),
          branchId: selectedBranch.id,
          deductionType: formDeductionType,
          amount: Number(formAmount),
          month,
          year,
          notes: formNotes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        closeDeductionDialog();
        setDeductionSuccess(
          `Deduction recorded for ${dayjs(monthValue + "-01").format("MMMM YYYY")}. Re-run payroll for this month to reflect it.`,
        );
      } else {
        setFormError(json.message || "Failed to record this deduction");
      }
    } catch {
      setFormError("Failed to record this deduction");
    } finally {
      setSaving(false);
    }
  };

  const historyColumns: DataTableColumn<PayrollRun>[] = [
    {
      key: "period",
      header: "Period",
      render: (r) => <span className="font-semibold text-gray-900">{payrollPeriodLabel(r)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusChip status="success">{r.status}</StatusChip>,
    },
    {
      key: "total",
      header: "Total Payout",
      render: (r) => <span className="font-semibold text-gray-900">{inr(r.totalPayout)}</span>,
    },
    {
      key: "staff",
      header: "Staff Paid",
      render: (r) => <span className="text-gray-600">{r.lines?.length || 0}</span>,
    },
    {
      key: "runDate",
      header: "Run Date",
      render: (r) => (
        <span className="text-gray-500">{dayjs(r.createdAt).format("DD MMM YYYY, h:mm A")}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-end gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Payroll Period
            </label>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
              className="h-10 rounded-input border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            />
          </div>
          <Button
            leftIcon={<BanknotesIcon className="h-4 w-4" />}
            onClick={runPayroll}
            loading={running}
            disabled={!selectedBranch?.id}
          >
            Run Payroll
          </Button>
          <Button
            variant="outline"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={openDeductionDialog}
            disabled={allStaff.length === 0}
          >
            Record Deduction
          </Button>
        </div>
        <p className="max-w-sm text-[11px] text-gray-400">
          Re-running payroll recalculates using the latest attendance and deductions for this
          month — running it again for the same branch/month/year replaces the previous run.
        </p>
      </div>

      {runError && (
        <Alert variant="danger" title="Couldn't run payroll" onDismiss={() => setRunError(null)}>
          {runError}
        </Alert>
      )}
      {deductionSuccess && (
        <Alert variant="success" onDismiss={() => setDeductionSuccess(null)}>
          {deductionSuccess}
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Payroll Lines</h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {viewingRun
                ? `${payrollPeriodLabel(viewingRun)} · run on ${dayjs(viewingRun.createdAt).format("DD MMM YYYY, h:mm A")}`
                : "Run payroll or select a past run from the history below"}
            </p>
          </div>
          {viewingRun && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowDownTrayIcon className="h-3.5 w-3.5" />}
                onClick={() =>
                  exportPayrollRunToExcel(viewingRun, {
                    restaurantName: restaurant?.name || "DineInk",
                    branchName: selectedBranch?.name || "Branch",
                  })
                }
              >
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowDownTrayIcon className="h-3.5 w-3.5" />}
                onClick={() =>
                  exportPayrollRunToPDF(viewingRun, {
                    restaurantName: restaurant?.name || "DineInk",
                    branchName: selectedBranch?.name || "Branch",
                  })
                }
              >
                Export PDF
              </Button>
            </div>
          )}
        </div>

        {!viewingRun ? (
          <EmptyState
            icon={BanknotesIcon}
            title="No payroll run to display"
            description="Run payroll for the selected month, or click a past run in the history below to view its lines."
          />
        ) : viewingRun.lines.length === 0 ? (
          <EmptyState
            title="This run has no payroll lines"
            description="No staff were paid in this payroll run."
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <Th>Employee</Th>
                <Th className="text-right">Base Salary</Th>
                <Th className="text-right">Overtime Pay</Th>
                <Th className="text-right">Deductions</Th>
                <Th className="text-right">Net Pay</Th>
              </TableHead>
              <TableBody>
                {viewingRun.lines.map((l) => (
                  <TableRow key={l.id}>
                    <Td className="font-semibold text-gray-900">{l.user?.name || "—"}</Td>
                    <Td className="text-right text-gray-700">{inr(l.baseSalary)}</Td>
                    <Td className="text-right text-amber-600">{inr(l.overtimePay)}</Td>
                    <Td className="text-right text-danger-600">{inr(l.deductions)}</Td>
                    <Td className="text-right font-semibold text-gray-900">{inr(l.netPay)}</Td>
                  </TableRow>
                ))}
                <tr className="border-t-2 border-[#b10000] bg-red-50/60">
                  <Td className="font-bold text-gray-900">TOTAL</Td>
                  <Td className="text-right font-bold text-gray-900">
                    {inr(viewingRun.lines.reduce((s, l) => s + Number(l.baseSalary || 0), 0))}
                  </Td>
                  <Td className="text-right font-bold text-gray-900">
                    {inr(viewingRun.lines.reduce((s, l) => s + Number(l.overtimePay || 0), 0))}
                  </Td>
                  <Td className="text-right font-bold text-gray-900">
                    {inr(viewingRun.lines.reduce((s, l) => s + Number(l.deductions || 0), 0))}
                  </Td>
                  <Td className="text-right font-bold text-[#b10000]">
                    {inr(viewingRun.totalPayout)}
                  </Td>
                </tr>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-[15px] font-bold text-gray-900">Payroll History</h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Past payroll runs for {selectedBranch?.name} — click a row to view its lines
          </p>
        </div>
        <DataTable
          columns={historyColumns}
          rows={runs}
          rowKey={(r) => r.id}
          loading={loadingHistory}
          error={historyError}
          onRetry={fetchHistory}
          onRowClick={(r) => setViewingRun(r)}
          selectedRowKey={viewingRun?.id}
          emptyTitle="No payroll runs yet"
          emptyDescription="Run payroll for a month above to see it appear here."
        />
      </div>

      <Dialog
        open={dialogOpen}
        onClose={closeDeductionDialog}
        title="Record Deduction"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeDeductionDialog} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveDeduction} loading={saving}>
              Record Deduction
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <Alert variant="danger" className="text-[11px]">
              {formError}
            </Alert>
          )}
          <p className="text-[11px] text-gray-400">
            Recorded for {dayjs(monthValue + "-01").format("MMMM YYYY")}. Deductions recorded here
            are picked up the next time payroll is run for this month.
          </p>

          <FormField label="Employee" required>
            <Select value={formUserId} onChange={(e) => setFormUserId(e.target.value)}>
              {allStaff.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Deduction Type" required>
            <Select
              value={formDeductionType}
              onChange={(e) =>
                setFormDeductionType(e.target.value as (typeof DEDUCTION_TYPES)[number])
              }
            >
              {DEDUCTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Amount" required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0.00"
              className="h-10 w-full rounded-input border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
            />
          </FormField>

          <FormField label="Notes">
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  );
}
