import { useEffect, useState } from "react";
import { XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface ReorderIngredient {
  id: number;
  name: string;
  unit?: string | null;
}

interface ReorderVendor {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface ReorderDialogProps {
  open: boolean;
  vendor: ReorderVendor | null;
  branchId?: number | null;
  apiUrl: string;
  token: string | null | undefined;
  onClose: () => void;
}

// Small dialog for the "Reorder via WhatsApp/Email" action on a vendor row.
// Reuses the same "ingredients supplied by vendor" endpoint the vendor
// detail drill-down already calls (GET
// /api/ingredients/vendors/:vendorId/ingredients) instead of fetching a new
// data source, then posts the selected ingredient ids + channel to the
// reorder endpoint. Mirrors Vendors.tsx's existing hand-rolled modal style
// (fixed inset-0 + rounded-2xl card) rather than the design-system Dialog,
// since this file doesn't use that system anywhere else.
export default function ReorderDialog({
  open,
  vendor,
  branchId,
  apiUrl,
  token,
  onClose,
}: ReorderDialogProps) {
  const [ingredients, setIngredients] = useState<ReorderIngredient[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open || !vendor) return;
    setSelected([]);
    setError("");
    setSuccess(false);
    setChannel("whatsapp");
    const fetchIngredients = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${apiUrl}/api/ingredients/vendors/${vendor.id}/ingredients`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        setIngredients(data.data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vendor?.id]);

  const toggle = (id: number) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const submit = async () => {
    if (!vendor || selected.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/vendors/${vendor.id}/reorder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ branchId, channel, ingredientIds: selected }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to send reorder request");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Failed to send reorder request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !vendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-black text-gray-900">
            Reorder from {vendor.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-semibold text-emerald-700">
              Reorder request sent via {channel === "whatsapp" ? "WhatsApp" : "Email"}.
            </div>
            {channel === "whatsapp" && (
              <p className="mt-2 text-[10px] text-gray-400">
                Demo mode — WhatsApp messages are logged for records only, not
                actually delivered yet.
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-[12px] font-semibold text-gray-600"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label className="mb-1 block text-[11px] font-bold text-gray-600">
                Send via
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChannel("whatsapp")}
                  className={`flex-1 rounded-xl border py-2 text-[12px] font-bold transition ${
                    channel === "whatsapp"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setChannel("email")}
                  className={`flex-1 rounded-xl border py-2 text-[12px] font-bold transition ${
                    channel === "email"
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Email
                </button>
              </div>
              {channel === "whatsapp" ? (
                <p className="mt-1.5 text-[10px] text-gray-400">
                  Demo mode — WhatsApp messages are logged for records only, not
                  actually delivered yet.
                </p>
              ) : !vendor.email ? (
                <p className="mt-1.5 text-[10px] text-amber-600">
                  This vendor has no email on file — the request may fail.
                </p>
              ) : null}
              {channel === "whatsapp" && !vendor.phone && (
                <p className="mt-1.5 text-[10px] text-amber-600">
                  This vendor has no phone number on file — the request may
                  fail.
                </p>
              )}
            </div>

            <div className="mb-2">
              <label className="mb-1 block text-[11px] font-bold text-gray-600">
                Ingredients to reorder{" "}
                {selected.length > 0 && `(${selected.length} selected)`}
              </label>
              {loading ? (
                <div className="flex h-20 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-red-500" />
                </div>
              ) : ingredients.length === 0 ? (
                <p className="text-[11px] text-gray-400">
                  No ingredients linked to this vendor yet — assign this
                  vendor to ingredients from Menu Management → Ingredients.
                </p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-gray-100 p-2">
                  {ingredients.map((ing) => (
                    <label
                      key={ing.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(ing.id)}
                        onChange={() => toggle(ing.id)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-400"
                      />
                      <span className="font-semibold text-gray-800">
                        {ing.name}
                      </span>
                      {ing.unit && (
                        <span className="text-gray-400">({ing.unit})</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2 text-[12px] font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={selected.length === 0 || submitting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#b10000] py-2 text-[12px] font-bold text-white disabled:opacity-40"
              >
                {submitting ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                )}
                Send Reorder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
