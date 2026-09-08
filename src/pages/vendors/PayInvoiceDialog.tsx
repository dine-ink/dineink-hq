import { useEffect, useState } from "react";
import { BanknotesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { nonNegative } from "@/utils/numberInput";

interface PayInvoiceDialogProps {
  open: boolean;
  /** What is still owed on the invoice, in rupees. */
  remaining: number;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

const formatRupees = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/**
 * Records a payment against a vendor invoice.
 *
 * This was the app's one remaining window.prompt() — and it was taking a
 * money amount, which is the worst possible thing to collect that way. Beyond
 * looking like a browser artefact, the old validation was `if (!amt ||
 * isNaN(Number(amt))) return;`, which silently accepted:
 *
 *   - 0, and negative amounts, which is a payment that reduces nothing
 *     (or increases the balance)
 *   - more than the invoice actually owes
 *   - and gave no feedback at all when it bailed out — a typo simply closed
 *     the prompt and nothing happened
 *
 * The full amount is pre-filled because paying an invoice off is the common
 * case, and a part payment is then an edit rather than a fresh calculation.
 *
 * Mirrors Vendors.tsx's hand-rolled modal style rather than the design-system
 * Dialog, for the same reason ReorderDialog does: this page doesn't use that
 * system anywhere else.
 */
export default function PayInvoiceDialog({
  open,
  remaining,
  submitting = false,
  onClose,
  onSubmit,
}: PayInvoiceDialogProps) {
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);

  // Re-prime whenever the dialog opens against a different invoice, so it
  // never shows the previous one's figure.
  useEffect(() => {
    if (open) {
      setAmount(remaining > 0 ? String(remaining) : "");
      setTouched(false);
    }
  }, [open, remaining]);

  if (!open) return null;

  const parsed = Number(amount);
  const error = (() => {
    if (amount.trim() === "") return "Enter an amount.";
    if (!Number.isFinite(parsed)) return "That is not a number.";
    if (parsed <= 0) return "The amount must be more than zero.";
    if (parsed > remaining) return `That is more than the ${formatRupees(remaining)} still owed.`;
    return null;
  })();

  const submit = () => {
    setTouched(true);
    if (error || submitting) return;
    onSubmit(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-invoice-heading"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id="pay-invoice-heading" className="text-[15px] font-black text-gray-900">
            Record a payment
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-[12px] text-gray-500">
          {formatRupees(remaining)} still owed on this invoice.
        </p>

        <label htmlFor="pay-invoice-amount" className="mb-1 block text-[11px] font-bold text-gray-600">
          Amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
            ₹
          </span>
          <input
            id="pay-invoice-amount"
            type="number" {...nonNegative}
            inputMode="decimal"
            min="0"
            max={remaining}
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") onClose();
            }}
            aria-invalid={touched && !!error}
            aria-describedby={touched && error ? "pay-invoice-error" : undefined}
            className={`w-full rounded-xl border py-2 pl-7 pr-3 text-[13px] outline-none focus:ring-2 ${
              touched && error
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-200 focus:ring-red-100"
            }`}
          />
        </div>

        {/* Reserved space, so showing an error does not shift the buttons. */}
        <p id="pay-invoice-error" className="mt-1 min-h-[16px] text-[11px] text-red-600">
          {touched && error ? error : ""}
        </p>

        {parsed > 0 && parsed < remaining && !error && (
          <p className="mt-1 text-[11px] text-gray-500">
            {formatRupees(remaining - parsed)} will remain owed.
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-[12px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !!error}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#b10000] py-2 text-[12px] font-bold text-white hover:bg-[#8f0000] disabled:opacity-50"
          >
            <BanknotesIcon className="h-4 w-4" />
            {submitting ? "Recording…" : "Record payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
