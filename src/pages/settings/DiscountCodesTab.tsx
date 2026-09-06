import { useState } from "react";
import { useAppSelector } from "@/store";
import { PlusIcon, TrashIcon, TagIcon } from "@heroicons/react/24/outline";
import { ConfirmationDialog, useConfirmDialog } from "@/design";
import MobileTableCards from "@/components/common/MobileTableCards";
import { errorMessage as messageFrom } from "@/utils/apiRequest";
import {
  useCreateDiscountCodeMutation,
  useDeleteDiscountCodeMutation,
  useGetDiscountCodesQuery,
  useUpdateDiscountCodeMutation,
  type DiscountCode,
} from "@/store/api/discountsApi";

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Discount Codes</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Coupon codes cashiers can apply at checkout — a fixed % or ₹ off, optionally capped by uses or an expiry.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-600"
        >
          <PlusIcon className="h-4 w-4" /> New Code
        </button>
      </div>

      {/* Page-level, not inside the create form. Toggling and deleting can fail
          too, and the form is usually closed when they do — an error rendered
          only inside it would set state nobody ever sees, which is the silent
          failure this migration is meant to remove. */}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
          {error}
        </p>
      )}

      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WELCOME10"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-red-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENTAGE" | "FIXED" }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Value</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder={form.type === "PERCENTAGE" ? "10" : "100"}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Max uses <span className="normal-case font-normal">(opt)</span></label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Code"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(blankForm); setError(""); }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-400">Loading...</p>
        ) : codes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <TagIcon className="h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm font-bold text-gray-500">No discount codes yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <MobileTableCards>
          <table className="w-full border-collapse min-w-[40rem]">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                {["Code", "Value", "Uses", "Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((dc) => (
                <tr key={dc.id} className="border-b border-gray-100">
                  <td className="px-3 py-2.5 text-sm font-black text-gray-900">{dc.code}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-700">
                    {dc.type === "PERCENTAGE" ? `${dc.value}%` : `₹${dc.value}`}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">
                    {dc.usedCount}{dc.maxUses ? ` / ${dc.maxUses}` : ""}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => handleToggleActive(dc)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black transition ${
                        dc.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {dc.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(dc.id)}
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
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
        )}
      </div>

      <ConfirmationDialog {...dialogProps}>{dialogProps.children}</ConfirmationDialog>
    </div>
  );
}
