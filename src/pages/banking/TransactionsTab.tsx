import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAppSelector } from "../../store";
import {
  Button,
  Dialog,
  FormField,
  Input,
  Select,
  Textarea,
  DataTable,
  type DataTableColumn,
  StatusChip,
  Alert,
  EmptyState,
  useDisclosure,
} from "../../design";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import type { BankTransactionEntry, ReconcileResult, TransactionType } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

const todayStr = () => dayjs().format("YYYY-MM-DD");
const monthAgoStr = () => dayjs().subtract(30, "day").format("YYYY-MM-DD");

const emptyForm = {
  entryDate: todayStr(),
  description: "",
  amount: "",
  type: "CREDIT" as TransactionType,
  notes: "",
};

const statusChip: Record<BankTransactionEntry["reconciliationStatus"], { status: "success" | "neutral" | "warning"; label: string }> = {
  MATCHED: { status: "success", label: "Matched" },
  UNMATCHED: { status: "neutral", label: "Unmatched" },
  IGNORED: { status: "warning", label: "Ignored" },
};

export default function TransactionsTab() {
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const [from, setFrom] = useState(monthAgoStr());
  const [to, setTo] = useState(todayStr());
  const [transactions, setTransactions] = useState<BankTransactionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  const dialog = useDisclosure();
  const branchId = selectedBranch?.id;

  const load = async () => {
    if (!user?.restaurantId || !branchId) return;
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(
        `${API_URL}/api/banking/transactions/${user.restaurantId}/${branchId}?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (json.success) setTransactions(json.data || []);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId, branchId, from, to]);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError(null);
    dialog.open();
  };

  const handleSave = async () => {
    const amountNum = Number(form.amount);
    if (!form.entryDate || !amountNum || amountNum <= 0) {
      setFormError("Date and a positive amount are required.");
      return;
    }
    if (!branchId) {
      setFormError("Select a branch first.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      const res = await fetch(`${API_URL}/api/banking/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          branchId,
          entryDate: form.entryDate,
          description: form.description || undefined,
          amount: amountNum,
          type: form.type,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setFormError(json.message || "Failed to save transaction.");
        return;
      }
      dialog.close();
      await load();
    } catch {
      setFormError("Failed to save transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReconcile = async () => {
    if (!user?.restaurantId || !branchId) return;
    try {
      setReconciling(true);
      setReconcileError(null);
      setReconcileResult(null);
      const res = await fetch(`${API_URL}/api/banking/transactions/${user.restaurantId}/${branchId}/reconcile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setReconcileError(json.message || "Reconciliation failed.");
        return;
      }
      setReconcileResult(json.data);
      await load();
    } catch {
      setReconcileError("Reconciliation failed. Please try again.");
    } finally {
      setReconciling(false);
    }
  };

  const columns: DataTableColumn<BankTransactionEntry>[] = [
    { key: "date", header: "Date", render: (r) => dayjs(r.entryDate).format("DD MMM YYYY") },
    { key: "desc", header: "Description", render: (r) => r.description || "—" },
    {
      key: "amount",
      header: "Amount",
      render: (r) => (
        <span className={`font-bold ${r.type === "CREDIT" ? "text-emerald-600" : "text-red-600"}`}>
          {r.type === "CREDIT" ? "+" : "−"}₹{Number(r.amount).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => <StatusChip status={r.type === "CREDIT" ? "success" : "danger"}>{r.type}</StatusChip>,
    },
    {
      key: "status",
      header: "Reconciliation",
      render: (r) => {
        const c = statusChip[r.reconciliationStatus];
        return <StatusChip status={c.status}>{c.label}</StatusChip>;
      },
    },
    { key: "notes", header: "Notes", render: (r) => <span className="max-w-[160px] truncate text-gray-500">{r.notes || "—"}</span> },
  ];

  if (!branchId) {
    return <EmptyState title="Select a branch" description="Choose a branch from the top bar to view its bank transactions." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* FILTERS + ACTIONS */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-gray-600">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-gray-600">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<ArrowPathIcon className="h-3.5 w-3.5" />} onClick={handleReconcile} loading={reconciling}>
            Reconcile
          </Button>
          <Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={openAdd}>
            Add Transaction
          </Button>
        </div>
      </div>
      <p className="text-[11px] text-gray-400">
        Reconcile runs a best-effort amount + date match against your existing bills and vendor payments — it is not a
        live bank-feed sync, just a helper to flag likely matches for review.
      </p>

      {reconcileResult && (
        <Alert variant="success" title="Reconciliation complete" onDismiss={() => setReconcileResult(null)}>
          {reconcileResult.matched} matched, {reconcileResult.stillUnmatched} still unmatched.
        </Alert>
      )}
      {reconcileError && (
        <Alert variant="danger" title="Reconciliation failed" onDismiss={() => setReconcileError(null)}>
          {reconcileError}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={transactions}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyTitle="No transactions in this date range"
        emptyDescription="Add a manual entry, or widen the date range above."
      />

      <Dialog
        open={dialog.isOpen}
        onClose={dialog.close}
        title="Add Transaction"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={dialog.close} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <FormField label="Date" required>
            <Input type="date" value={form.entryDate} onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))} />
          </FormField>
          <FormField label="Description">
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Vendor payment — ABC Supplies"
            />
          </FormField>
          <FormField label="Amount (₹)" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Type" required>
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TransactionType }))}>
              <option value="CREDIT">Credit (money in)</option>
              <option value="DEBIT">Debit (money out)</option>
            </Select>
          </FormField>
          <FormField label="Notes">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
          </FormField>
        </div>
      </Dialog>
    </div>
  );
}
