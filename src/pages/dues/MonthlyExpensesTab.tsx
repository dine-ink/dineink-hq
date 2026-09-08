import { useState } from "react";
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "@/store";
import { errorMessage as messageFrom } from "@/utils/apiRequest";
import {
  useCreateMonthlyDueMutation,
  useDeleteMonthlyDueMutation,
  useGetMonthlyDuesQuery,
  useUpdateMonthlyDueMutation,
} from "@/store/api/duesApi";
import {
  Alert,
  Button,
  DataTable,
  type DataTableColumn,
  DeleteDialog,
  Dialog,
  FormField,
  Input,
  MetricCard,
  Select,
  StatusChip,
  Textarea,
} from "@/design";
import {
  DUE_CATEGORIES,
  STATUS_TO_CHIP,
  categoryLabel,
  formatCurrency,
  formatDate,
  type DueCategory,
  type MonthlyDue,
} from "./duesShared";

interface MonthlyExpensesTabProps {
  month: number;
  year: number;
}

interface MergedRow {
  key: DueCategory;
  label: string;
  due: MonthlyDue | null;
}

export default function MonthlyExpensesTab({ month, year }: MonthlyExpensesTabProps) {
  // No API_URL and no token here any more: fetchBaseQuery holds the base URL,
  // and prepareHeaders reads the token straight from the store, so neither has
  // to be threaded through the component.
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const scope = {
    restaurantId: user?.restaurantId as number,
    branchId: selectedBranch?.id as number,
    month,
    year,
  };
  const canQuery = Boolean(user?.restaurantId && selectedBranch?.id);

  const {
    data: dues = [],
    isFetching: loading,
    isError: error,
  } = useGetMonthlyDuesQuery(scope, { skip: !canQuery });

  const [createDue] = useCreateMonthlyDueMutation();
  const [updateDue] = useUpdateMonthlyDueMutation();
  const [deleteDue] = useDeleteMonthlyDueMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<MonthlyDue | null>(null);
  const [formCategory, setFormCategory] = useState<DueCategory>("EB");
  const [formAmountDue, setFormAmountDue] = useState("");
  const [formAmountPaid, setFormAmountPaid] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPaidDate, setFormPaidDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<MonthlyDue | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const merged: MergedRow[] = DUE_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    due: dues.find((d) => d.category === c.key) || null,
  }));

  const availableCategories = DUE_CATEGORIES.filter((c) => !dues.some((d) => d.category === c.key));

  const totalDue = dues.reduce((sum, d) => sum + (d.amountDue || 0), 0);
  const totalPaid = dues.reduce((sum, d) => sum + (d.amountPaid || 0), 0);
  const outstanding = totalDue - totalPaid;

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRow(null);
    setFormError(null);
  };

  const openAddDialog = (preset?: DueCategory) => {
    setEditingRow(null);
    setFormError(null);
    setFormCategory(preset || availableCategories[0]?.key || "EB");
    setFormAmountDue("");
    setFormAmountPaid("");
    setFormDueDate("");
    setFormPaidDate("");
    setFormNotes("");
    setDialogOpen(true);
  };

  const openEditDialog = (row: MonthlyDue) => {
    setEditingRow(row);
    setFormError(null);
    setFormCategory(row.category);
    setFormAmountDue(row.amountDue != null ? String(row.amountDue) : "");
    setFormAmountPaid(row.amountPaid != null ? String(row.amountPaid) : "");
    setFormDueDate(row.dueDate ? row.dueDate.split("T")[0] : "");
    setFormPaidDate(row.paidDate ? row.paidDate.split("T")[0] : "");
    setFormNotes(row.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.restaurantId || !selectedBranch?.id) return;
    if (!editingRow && formAmountDue === "") {
      setFormError("Please enter the amount due");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editingRow) {
        await updateDue({
          id: editingRow.id,
          amountDue: formAmountDue === "" ? undefined : Number(formAmountDue),
          amountPaid: formAmountPaid === "" ? undefined : Number(formAmountPaid),
          dueDate: formDueDate || undefined,
          paidDate: formPaidDate || undefined,
          notes: formNotes === "" ? undefined : formNotes,
          scope,
        }).unwrap();
      } else {
        await createDue({
          branchId: selectedBranch.id,
          category: formCategory,
          month,
          year,
          amountDue: Number(formAmountDue) || 0,
          dueDate: formDueDate || undefined,
          notes: formNotes === "" ? undefined : formNotes,
          scope,
        }).unwrap();
      }
      // No manual refetch: invalidatesTags refreshes this branch/month's list,
      // and only that one.
      closeDialog();
    } catch (err) {
      setFormError(messageFrom(err, "Failed to save this due"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteDue({ id: deleteTarget.id, scope }).unwrap();
      setDeleteTarget(null);
    } catch (err) {
      // The previous comment here claimed the failure was "surfaced implicitly
      // — row remains, user can retry". It wasn't: a row that stays looks
      // exactly like one nobody has deleted yet, and the `if (json.success)`
      // above it had no else, so a server-rejected delete said nothing either.
      setDeleteError(messageFrom(err, "Failed to delete this due"));
    }
  };

  const columns: DataTableColumn<MergedRow>[] = [
    { key: "category", header: "Category", render: (r) => <span className="font-semibold text-gray-900">{r.label}</span> },
    { key: "amountDue", header: "Amount Due", render: (r) => (r.due ? formatCurrency(r.due.amountDue) : "—") },
    { key: "amountPaid", header: "Amount Paid", render: (r) => (r.due ? formatCurrency(r.due.amountPaid) : "—") },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.due ? (
          <StatusChip status={STATUS_TO_CHIP[r.due.status]}>{r.due.status}</StatusChip>
        ) : (
          <StatusChip status="neutral">NO ENTRY</StatusChip>
        ),
    },
    { key: "dueDate", header: "Due Date", render: (r) => (r.due ? formatDate(r.due.dueDate) : "—") },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) =>
        r.due ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => openEditDialog(r.due as MonthlyDue)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
            >
              <PencilSquareIcon className="h-3 w-3" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(r.due)}
              className="inline-flex items-center gap-1 rounded-lg border border-danger-200 px-2 py-1 text-[10px] font-semibold text-danger-600 hover:bg-danger-50"
            >
              <TrashIcon className="h-3 w-3" /> Delete
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => openAddDialog(r.key)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
            >
              <PlusIcon className="h-3 w-3" /> Add
            </button>
          </div>
        ),
    },
  ];

  const isEdit = !!editingRow;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" title="Couldn't load monthly expenses">
          Something went wrong fetching this month's dues. The table below may be incomplete — try switching months or refreshing.
        </Alert>
      )}

      {/* A failed delete has no home inside DeleteDialog, and the dialog closes
          on its own — so it is reported here, where the row it failed to remove
          is still visible. */}
      {deleteError && (
        <Alert variant="danger" title="Couldn't delete that entry">
          {deleteError}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Total Due" value={formatCurrency(totalDue)} sub="across all categories" status="primary" />
        <MetricCard label="Total Paid" value={formatCurrency(totalPaid)} sub="settled this month" status="success" />
        <MetricCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          sub="still to be paid"
          status={outstanding > 0 ? "danger" : "success"}
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-gray-900">Expense Categories</h3>
        <Button
          size="sm"
          leftIcon={<PlusIcon className="h-3.5 w-3.5" />}
          onClick={() => openAddDialog()}
          disabled={availableCategories.length === 0}
        >
          Add Due
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <DataTable columns={columns} rows={merged} rowKey={(r) => r.key} loading={loading} />
      </div>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={isEdit ? `Edit ${categoryLabel(formCategory)} Due` : "Add Due"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              {isEdit ? "Save Changes" : "Add Due"}
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

          {isEdit ? (
            <FormField label="Category">
              <Input value={categoryLabel(formCategory)} disabled />
            </FormField>
          ) : (
            <FormField label="Category" required>
              <Select value={formCategory} onChange={(e) => setFormCategory(e.target.value as DueCategory)}>
                {availableCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Amount Due" required={!isEdit}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formAmountDue}
              onChange={(e) => setFormAmountDue(e.target.value)}
              placeholder="0.00"
            />
          </FormField>

          {isEdit && (
            <FormField label="Amount Paid">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formAmountPaid}
                onChange={(e) => setFormAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Due Date">
              <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </FormField>
            {isEdit && (
              <FormField label="Paid Date">
                <Input type="date" value={formPaidDate} onChange={(e) => setFormPaidDate(e.target.value)} />
              </FormField>
            )}
          </div>

          <FormField label="Notes">
            <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Optional notes" />
          </FormField>
        </div>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        itemLabel={deleteTarget ? `the ${categoryLabel(deleteTarget.category)} due entry` : "this due entry"}
      />
    </div>
  );
}
