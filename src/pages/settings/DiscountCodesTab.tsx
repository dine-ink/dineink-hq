import { useState } from "react";
import { Pagination, usePagination } from "@/design";
import { useAppSelector } from "@/store";
import { PlusIcon, TrashIcon, TagIcon } from "@heroicons/react/24/outline";
import { ConfirmationDialog, useConfirmDialog } from "@/design";
import { FormField, Input, Select } from "@/design/components/forms";
import { Button, PrimaryButton } from "@/design/components/buttons";
import MobileTableCards from "@/components/common/MobileTableCards";
import { errorMessage as messageFrom } from "@/utils/apiRequest";
import {
  useCreateDiscountCodeMutation,
  useDeleteDiscountCodeMutation,
  useGetDiscountCodesQuery,
  useUpdateDiscountCodeMutation,
  type DiscountCode,
} from "@/store/api/discountsApi";
import { nonNegative } from "@/utils/numberInput";

const blankForm: { code: string; type: "PERCENTAGE" | "FIXED"; value: string; maxUses: string } = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  maxUses: "",
};

export default function DiscountCodesTab() {
  const { user } = useAppSelector((s) => s.auth);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const { dialogProps, confirm } = useConfirmDialog();

  // `skip` replaces the `if (!user?.restaurantId) return` guard that every
  // hand-written fetch effect had to remember; the request simply does not fire
  // until the argument is real.
  const { data: codes = [], isFetching: loading } = useGetDiscountCodesQuery(
    { restaurantId: user?.restaurantId as number },
    { skip: !user?.restaurantId },
  );

  const [createCode, { isLoading: saving }] = useCreateDiscountCodeMutation();
  const [updateCode] = useUpdateDiscountCodeMutation();
  const [deleteCode] = useDeleteDiscountCodeMutation();

  const handleCreate = async () => {
    setError("");
    if (!form.code.trim()) return setError("Code is required");
    if (!(Number(form.value) > 0)) return setError("Value must be greater than 0");
    try {
      // `.unwrap()` is what turns a rejected mutation into a thrown error.
      // Without it the promise resolves either way and the failure is silent —
      // the same shape of bug as the bare `catch {}` this replaces.
      await createCode({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
      }).unwrap();
      // No list surgery: invalidatesTags refetches getDiscountCodes, so what
      // renders is what the server stored rather than this component's guess.
      setForm(blankForm);
      setShowForm(false);
    } catch (err) {
      setError(messageFrom(err, "Failed to create discount code"));
    }
  };

  const handleToggleActive = async (dc: DiscountCode) => {
    setError("");
    try {
      await updateCode({ id: dc.id, isActive: !dc.isActive }).unwrap();
    } catch (err) {
      // Previously silent: a failed toggle left the switch where it was and
      // looked like the click had simply not registered.
      setError(messageFrom(err, "Failed to update discount code"));
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "Delete confirmation",
      message: "Are you sure you want to delete this discount code? This action cannot be undone.",
      tone: "danger",
      onConfirm: async () => {
        setError("");
        try {
          await deleteCode({ id }).unwrap();
        } catch (err) {
          // Previously silent: the row stayed on screen and the person assumed
          // the delete had not gone through, when in fact it had not.
          setError(messageFrom(err, "Failed to delete discount code"));
        }
      },
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(blankForm);
    setError("");
  };

  const codePager = usePagination(codes, 10);
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-gray-900">Discount Codes</h2>
          <p className="mt-0.5 text-[12px] text-gray-500">
            Coupon codes cashiers can apply at checkout: a fixed % or ₹ off, optionally capped by uses.
          </p>
        </div>
        {!showForm && (
          <PrimaryButton
            type="button"
            onClick={() => setShowForm(true)}
            leftIcon={<PlusIcon className="h-4 w-4" />}
            className="shrink-0 whitespace-nowrap"
          >
            New Code
          </PrimaryButton>
        )}
      </div>

      {/* Page-level, not inside the create form. Toggling and deleting can fail
          too, and the form is usually closed when they do — an error rendered
          only inside it would set state nobody ever sees, which is the silent
          failure this migration is meant to remove. */}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12px] font-medium text-red-700"
        >
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
          noValidate
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#b10000]">
              <TagIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">Create a code</p>
              <p className="text-[11px] text-gray-400">Codes are stored in capitals and must be unique.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Code" required>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WELCOME10"
                className="uppercase"
                autoFocus
              />
            </FormField>
            <FormField label="Type">
              <Select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENTAGE" | "FIXED" }))}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed amount (₹)</option>
              </Select>
            </FormField>
            <FormField label={form.type === "PERCENTAGE" ? "Value (%)" : "Value (₹)"} required>
              <Input
                type="number" {...nonNegative}
                min={0}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={form.type === "PERCENTAGE" ? "10" : "100"}
              />
            </FormField>
            <FormField label="Max uses" helperText="Leave empty for unlimited">
              <Input
                type="number" {...nonNegative}
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited"
              />
            </FormField>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <PrimaryButton type="submit" loading={saving} leftIcon={<PlusIcon className="h-4 w-4" />}>
              Create Code
            </PrimaryButton>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-400">Loading...</p>
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#b10000]">
              <TagIcon className="h-6 w-6" />
            </div>
            <p className="mt-3 text-[14px] font-semibold text-gray-900">No discount codes yet</p>
            <p className="mt-1 max-w-xs text-[12px] text-gray-500">
              Create one and cashiers can apply it at checkout.
            </p>
          </div>
        ) : (
          <><div className="overflow-x-auto">
          <MobileTableCards>
          <table className="w-full border-collapse min-w-[40rem]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                {["Code", "Value", "Uses", "Status", ""].map((h, i) => (
                  <th
                    key={h || `col-${i}`}
                    className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codePager.pageRows.map((dc) => (
                <tr key={dc.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{dc.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {dc.type === "PERCENTAGE" ? `${dc.value}%` : `₹${dc.value}`}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-500">
                    {dc.usedCount}{dc.maxUses ? ` / ${dc.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(dc)}
                      aria-pressed={dc.isActive}
                      title={dc.isActive ? "Click to deactivate" : "Click to activate"}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                        dc.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {dc.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(dc.id)}
                      aria-label={`Delete ${dc.code}`}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </MobileTableCards>
          </div>
          <Pagination
            page={codePager.page}
            totalPages={codePager.totalPages}
            onPageChange={codePager.setPage}
            pageSize={codePager.pageSize}
            onPageSizeChange={codePager.setPageSize}
            range={{ from: codePager.from, to: codePager.to, total: codePager.total, noun: "codes" }}
          />
          </>
        )}
      </div>

      <ConfirmationDialog {...dialogProps}>{dialogProps.children}</ConfirmationDialog>
    </div>
  );
}
