import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import {
  useGetBankAccountsQuery,
  useSaveBankAccountMutation,
  useDeleteBankAccountMutation,
} from "@/store/api/bankingApi";
import {
  Button,
  IconButton,
  Dialog,
  ConfirmationDialog,
  FormField,
  Input,
  DataTable,
  type DataTableColumn,
  StatusChip,
  Alert,
  useDisclosure,
  useConfirmDialog,
} from "@/design";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { BankAccount } from "./types";
import { notify } from "@/utils/notify";

const API_URL = import.meta.env.VITE_API_URL;

const emptyForm = {
  accountHolderName: "",
  bankName: "",
  accountNumberMasked: "",
  ifsc: "",
  isPrimary: false,
};

export default function BankAccountsTab() {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState(emptyForm);

  const dialog = useDisclosure();
  const { dialogProps, confirm } = useConfirmDialog();

  const {
    data: accounts = [],
    isFetching: loading,
    isError: error,
    refetch: load,
  } = useGetBankAccountsQuery(user?.restaurantId as number, {
    skip: !user?.restaurantId,
  });

  const [saveBankAccount] = useSaveBankAccountMutation();
  const [deleteBankAccount] = useDeleteBankAccountMutation();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restaurantId]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    dialog.open();
  };

  const openEdit = (acc: BankAccount) => {
    setEditing(acc);
    setForm({
      accountHolderName: acc.accountHolderName,
      bankName: acc.bankName,
      accountNumberMasked: acc.accountNumberMasked,
      ifsc: acc.ifsc,
      isPrimary: acc.isPrimary,
    });
    setFormError(null);
    dialog.open();
  };

  const handleSave = async () => {
    if (!form.accountHolderName.trim() || !form.bankName.trim() || !form.accountNumberMasked.trim() || !form.ifsc.trim()) {
      setFormError("All fields are required.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      const body: Record<string, unknown> = { ...form };
      if (!editing && selectedBranch?.id) body.branchId = selectedBranch.id;

      await saveBankAccount({ id: editing?.id, body }).unwrap();
      dialog.close();
    } catch {
      setFormError("Failed to save account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (acc: BankAccount) => {
    confirm({
      title: "Delete bank account",
      message: `Remove ${acc.bankName} — ${acc.accountNumberMasked} from your saved accounts? This does not affect the actual bank account, only this record.`,
      tone: "danger",
      onConfirm: async () => {
        try {
          // Fire-and-forget before: a refused delete reloaded the list, showed
          // the row still sitting there, and said nothing about why.
          await deleteBankAccount(acc.id).unwrap();
        } catch {
          notify("Failed to delete this account");
        }
      },
    });
  };

  const columns: DataTableColumn<BankAccount>[] = [
    { key: "holder", header: "Account Holder", render: (r) => <span className="font-semibold text-gray-900">{r.accountHolderName}</span> },
    { key: "bank", header: "Bank", render: (r) => r.bankName },
    { key: "acct", header: "Account No.", render: (r) => <span className="font-mono text-[11px]">{r.accountNumberMasked}</span> },
    { key: "ifsc", header: "IFSC", render: (r) => <span className="font-mono text-[11px]">{r.ifsc}</span> },
    {
      key: "primary",
      header: "Primary",
      render: (r) => (r.isPrimary ? <StatusChip status="primary">Primary</StatusChip> : <span className="text-gray-300">—</span>),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusChip status={r.isActive ? "success" : "neutral"}>{r.isActive ? "Active" : "Inactive"}</StatusChip>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <IconButton icon={<PencilIcon className="h-3.5 w-3.5" />} aria-label="Edit account" onClick={() => openEdit(r)} />
          <IconButton icon={<TrashIcon className="h-3.5 w-3.5" />} aria-label="Delete account" variant="danger" onClick={() => handleDelete(r)} />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-gray-400">
          This is a records/reference list your team maintains for payouts and reconciliation notes — it is not a live
          connection to your bank and does not move money or read real balances.
        </p>
        <Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={openAdd} className="shrink-0">
          Add Account
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={accounts}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={load}
        emptyTitle="No bank accounts saved yet"
        emptyDescription="Add the restaurant's bank account details to keep a reference record for payouts and reconciliation."
      />

      <Dialog
        open={dialog.isOpen}
        onClose={dialog.close}
        title={editing ? "Edit Bank Account" : "Add Bank Account"}
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
          <FormField label="Account Holder Name" required>
            <Input
              value={form.accountHolderName}
              onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
              placeholder="e.g. Dine Ink Restaurants Pvt Ltd"
            />
          </FormField>
          <FormField label="Bank Name" required>
            <Input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="e.g. HDFC Bank" />
          </FormField>
          <FormField label="Account Number" required helperText="Store a masked form, e.g. XXXX XXXX 4521">
            <Input
              value={form.accountNumberMasked}
              onChange={(e) => setForm((f) => ({ ...f, accountNumberMasked: e.target.value }))}
              placeholder="XXXX XXXX 4521"
            />
          </FormField>
          <FormField label="IFSC Code" required>
            <Input
              value={form.ifsc}
              onChange={(e) => setForm((f) => ({ ...f, ifsc: e.target.value.toUpperCase() }))}
              placeholder="e.g. HDFC0001234"
            />
          </FormField>
          <label className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-400"
            />
            Set as primary account
          </label>
        </div>
      </Dialog>

      <ConfirmationDialog {...dialogProps}>{dialogProps.children}</ConfirmationDialog>
    </div>
  );
}
