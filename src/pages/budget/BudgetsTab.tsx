import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { errorMessage } from "@/utils/apiRequest";
import {
  budgetsApi,
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
  useDuplicateBudgetMutation,
  useGetBudgetsQuery,
  useGetFixedCostDefaultsQuery,
  useSaveBudgetItemsMutation,
  useUpdateBudgetMutation,
} from "@/store/api/budgetsApi";
import { BUDGET_CATEGORIES, BUDGET_CATEGORY_GROUPS, MONTH_NAMES, fyMonths } from "./budgetCategories";
import MobileTableCards from "@/components/common/MobileTableCards";
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { notify } from "@/utils/notify";
import { confirmAction } from "@/utils/confirmAction";

const currentFyStartYear = () => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

export default function BudgetsTab() {
  const { branches } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const restaurantId = user?.restaurantId as number;

  const { data: budgets = [], isFetching: loading } = useGetBudgetsQuery(
    { restaurantId },
    { skip: !user?.restaurantId },
  );
  const [createBudget] = useCreateBudgetMutation();
  const [updateBudget] = useUpdateBudgetMutation();
  const [saveBudgetItems] = useSaveBudgetItemsMutation();
  const [duplicateBudget] = useDuplicateBudgetMutation();
  const [deleteBudget] = useDeleteBudgetMutation();

  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [gridValues, setGridValues] = useState<Record<string, number | "">>({});
  const [saving, setSaving] = useState(false);

  // Create-form state
  const [formName, setFormName] = useState("");
  const [formFy, setFormFy] = useState(String(currentFyStartYear()));
  const [formBranchId, setFormBranchId] = useState<string>("restaurant");
  const [formDefaults, setFormDefaults] = useState<Record<string, string>>({});

  // Fixed-cost categories (Rent, Labour, EMI, ...) are pre-filled from live
  // RestaurantInsights/payroll data whenever the create form is open — still
  // ordinary editable inputs, just not starting from a blank 0.
  const { data: fixedDefaults } = useGetFixedCostDefaultsQuery(
    {
      restaurantId,
      branchId: formBranchId === "restaurant" ? null : Number(formBranchId),
    },
    { skip: view !== "create" || !user?.restaurantId },
  );

  // Pre-fills the fixed-cost inputs when they arrive. They stay ordinary
  // editable fields — a failed lookup just leaves them blank, which is why this
  // has no error path.
  useEffect(() => {
    if (!fixedDefaults) return;
    setFormDefaults((prev) => ({
      ...prev,
      rent: String(fixedDefaults.rent || ""),
      labour: String(fixedDefaults.labour || ""),
      loanEmi: String(fixedDefaults.loanEmi || ""),
      internet: String(fixedDefaults.internet || ""),
      phoneBills: String(fixedDefaults.phoneBills || ""),
      accounting: String(fixedDefaults.accounting || ""),
      insurance: String(fixedDefaults.insurance || ""),
      licenses: String(fixedDefaults.licenses || ""),
    }));
  }, [fixedDefaults]);

  const openCreate = () => {
    setFormName("");
    setFormFy(String(currentFyStartYear()));
    setFormBranchId("restaurant");
    setFormDefaults({});
    setView("create");
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      notify("Please enter a budget name", "warning");
      return;
    }
    setSaving(true);
    try {
      const monthlyDefaults: Record<string, number> = {};
      Object.entries(formDefaults).forEach(([k, v]) => {
        const n = Number(v);
        if (v !== "" && Number.isFinite(n)) monthlyDefaults[k] = n;
      });
      const created = await createBudget({
        restaurantId,
        body: {
          name: formName.trim(),
          financialYear: formFy,
          branchId: formBranchId === "restaurant" ? null : Number(formBranchId),
          monthlyDefaults,
        },
      }).unwrap();
      if (created) openDetail(created);
    } catch (err) {
      notify(errorMessage(err, "Failed to create budget"));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (budget: any) => {
    setSelectedBudget(budget);
    const values: Record<string, number | ""> = {};
    (budget.items || []).forEach((item: any) => {
      values[`${item.category}:${item.year}:${item.month}`] = item.amount;
    });
    setGridValues(values);
    setView("edit");
  };

  const handleOpenBudget = async (budgetId: number) => {
    try {
      // The detail response carries the line items the grid edits, so it is
      // fetched on demand rather than taken from the list row.
      const full = await dispatch(
        budgetsApi.endpoints.getBudget.initiate({ restaurantId, budgetId }),
      ).unwrap();
      if (full) openDetail(full);
    } catch (err) {
      notify(errorMessage(err, "Couldn't open that budget"));
    }
  };

  const handleGridChange = (category: string, year: number, month: number, value: string) => {
    setGridValues((prev) => ({ ...prev, [`${category}:${year}:${month}`]: value === "" ? "" : Number(value) }));
  };

  const handleSaveGrid = async () => {
    if (!selectedBudget) return;
    setSaving(true);
    try {
      const items = Object.entries(gridValues)
        .filter(([, v]) => v !== "")
        .map(([key, amount]) => {
          const [category, year, month] = key.split(":");
          return { category, year: Number(year), month: Number(month), amount: Number(amount) };
        });
      const saved = await saveBudgetItems({
        restaurantId,
        budgetId: selectedBudget.id,
        items: { items },
      }).unwrap();
      if (saved) setSelectedBudget(saved);
    } catch (err) {
      notify(errorMessage(err, "Failed to save budget items"));
    } finally {
      setSaving(false);
    }
  };

  const handleSetStatus = async (status: "PUBLISHED" | "ARCHIVED" | "DRAFT") => {
    if (!selectedBudget) return;
    try {
      // Publishing or archiving used to look like it worked whichever way it
      // went — a rejected response fell through with no else, and a thrown one
      // was swallowed.
      const updated = await updateBudget({
        restaurantId,
        budgetId: selectedBudget.id,
        body: { status },
      }).unwrap();
      if (updated) setSelectedBudget(updated);
    } catch (err) {
      notify(errorMessage(err, "Failed to change the budget's status"));
    }
  };

  const handleDeleteBudget = async (budget: any) => {
    const confirmed = await confirmAction({
      title: `Delete "${budget.name}"?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    try {
      await deleteBudget({ restaurantId, budgetId: budget.id }).unwrap();
      if (selectedBudget?.id === budget.id) setView("list");
    } catch (err) {
      notify(errorMessage(err, "Failed to delete budget"));
    }
  };

  const handleDuplicate = async (budgetId: number) => {
    try {
      const copy = await duplicateBudget({ restaurantId, budgetId }).unwrap();
      if (copy) openDetail(copy);
    } catch (err) {
      notify(errorMessage(err, "Failed to duplicate this budget"));
    }
  };

  const handleCopyToNextYear = async (budget: any) => {
    try {
      const nextFy = String(Number(budget.financialYear) + 1);
      const copy = await duplicateBudget({
        restaurantId,
        budgetId: budget.id,
        body: { financialYear: nextFy, name: `${budget.name} (FY${nextFy})` },
      }).unwrap();
      if (copy) openDetail(copy);
    } catch (err) {
      notify(errorMessage(err, "Failed to copy this budget to next year"));
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-600",
      PUBLISHED: "bg-emerald-100 text-emerald-700",
      ARCHIVED: "bg-amber-100 text-amber-700",
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] || styles.DRAFT}`}>
        {status}
      </span>
    );
  };

  // ── LIST VIEW ──────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-gray-900">Budgets</h3>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Create Budget
          </button>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-[12px] text-gray-400">Loading…</div>
        ) : budgets.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-[12px] text-gray-400">
            No budgets yet — create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <MobileTableCards>
            <table className="w-full text-[12px] min-w-[36rem]">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Scope</th>
                  <th className="px-4 py-2 text-left">FY</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => handleOpenBudget(b.id)} className="font-semibold text-gray-900 hover:text-[#b10000]">
                        {b.name}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{b.branch?.name || "Restaurant-wide"}</td>
                    <td className="px-4 py-2.5 text-gray-600">FY{b.financialYear}-{String(Number(b.financialYear) + 1).slice(-2)}</td>
                    <td className="px-4 py-2.5">{statusBadge(b.status)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(b.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          <DocumentDuplicateIcon className="h-3 w-3" /> Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBudget(b)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        )}
      </div>
    );
  }

  // ── CREATE VIEW ────────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setView("list")} className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Budgets
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-[15px] font-bold text-gray-900">Create Budget</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Budget Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. FY26-27 Operating Budget"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Financial Year (starting year)</label>
              <input
                type="number"
                value={formFy}
                onChange={(e) => setFormFy(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Scope</label>
              <select
                value={formBranchId}
                onChange={(e) => setFormBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-red-300 focus:bg-white"
              >
                <option value="restaurant">Restaurant-wide (all branches)</option>
                {(branches || []).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="mb-3 mt-5 text-[11px] text-gray-500">
            Set a monthly default for each category — this auto-generates all 12 months. You can edit individual months afterward.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {BUDGET_CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
                  {cat.label}
                  {cat.isFixed && (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                      Auto-filled
                    </span>
                  )}
                </label>
                <div className="relative">
                  {cat.unit === "currency" && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                  )}
                  <input
                    type="number"
                    value={formDefaults[cat.key] ?? ""}
                    onChange={(e) => setFormDefaults((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                    placeholder="0"
                    className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-2 text-sm outline-none focus:border-red-300 focus:bg-white ${cat.unit === "currency" ? "pl-7 pr-3" : "px-3"}`}
                  />
                  {cat.unit === "percentage" && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">%</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Budget"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EDIT / DETAIL VIEW ─────────────────────────────────────────────────
  const months = fyMonths(Number(selectedBudget?.financialYear || currentFyStartYear()));

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setView("list")} className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Budgets
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold text-gray-900">{selectedBudget?.name}</h3>
          {statusBadge(selectedBudget?.status)}
          <span className="text-[11px] text-gray-400">
            {selectedBudget?.branch?.name || "Restaurant-wide"} · FY{selectedBudget?.financialYear}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCopyToNextYear(selectedBudget)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <DocumentDuplicateIcon className="h-3.5 w-3.5" /> Copy to Next Year
          </button>
          {selectedBudget?.status !== "PUBLISHED" && (
            <button
              type="button"
              onClick={() => handleSetStatus("PUBLISHED")}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" /> Publish
            </button>
          )}
          {selectedBudget?.status !== "ARCHIVED" && (
            <button
              type="button"
              onClick={() => handleSetStatus("ARCHIVED")}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100"
            >
              <ArchiveBoxIcon className="h-3.5 w-3.5" /> Archive
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveGrid}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50"
          >
            <CheckIcon className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => handleDeleteBudget(selectedBudget)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
          >
            <TrashIcon className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {BUDGET_CATEGORY_GROUPS.map((group) => (
        <div key={group} className="overflow-hidden rounded-xl border border-gray-200">
          <div className="bg-gray-50 px-4 py-2 text-[12px] font-bold text-gray-900">{group}</div>
          <div className="overflow-x-auto">
            <MobileTableCards>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-t border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  <th className="sticky left-0 bg-white px-3 py-2 text-left">Category</th>
                  {months.map((m) => (
                    <th key={`${m.year}-${m.month}`} className="min-w-[70px] px-2 py-2 text-center">
                      {MONTH_NAMES[m.month - 1]}'{String(m.year).slice(-2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BUDGET_CATEGORIES.filter((c) => c.group === group).map((cat) => (
                  <tr key={cat.key} className="border-t border-gray-100">
                    <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-1.5 font-medium text-gray-700">
                      {cat.label}
                    </td>
                    {months.map((m) => {
                      const key = `${cat.key}:${m.year}:${m.month}`;
                      return (
                        <td key={key} className="px-1 py-1">
                          <input
                            type="number"
                            value={gridValues[key] ?? ""}
                            onChange={(e) => handleGridChange(cat.key, m.year, m.month, e.target.value)}
                            placeholder="0"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-1 text-center text-[11px] outline-none focus:border-red-300 focus:bg-white"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            </MobileTableCards>
          </div>
        </div>
      ))}
    </div>
  );
}
