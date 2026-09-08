import { useState } from "react";
import type { ReactNode } from "react";
import { Dialog } from "./Dialog";
import { Button } from "@/design/components/buttons/Button";

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (delete, cancel, discard) — matches DeleteDialog's styling. */
  tone?: "primary" | "danger";
}

// Replaces the browser's native window.confirm(), which blocked the whole
// tab, could not be styled, and gave no room for an explanatory message.
// No call site uses window.confirm any more; all thirteen were migrated
// (see docs/FINAL_UI_UX_POLISH_REPORT.md for the original survey).
//
// Two ways in, both landing here:
//   - useConfirmDialog(), for a component happy to host the dialog itself
//   - confirmAction() from utils, via ConfirmProvider at the app root, for
//     the `if (!(await confirmAction(...))) return;` call sites — including
//     hooks that render nothing and so cannot host a dialog
export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
}: ConfirmationDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} size="sm" onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[13px] text-gray-600">{children}</div>
    </Dialog>
  );
}

// A pre-configured ConfirmationDialog for destructive delete actions — the
// default copy matches the tone every "Delete this X?" confirmation in the
// app already uses.
export function DeleteDialog({
  itemLabel = "this item",
  ...props
}: Omit<ConfirmationDialogProps, "title" | "children" | "confirmLabel" | "tone"> & { itemLabel?: string }) {
  return (
    <ConfirmationDialog
      {...props}
      tone="danger"
      title="Delete confirmation"
      confirmLabel="Delete"
    >
      Are you sure you want to delete {itemLabel}? This action cannot be undone.
    </ConfirmationDialog>
  );
}

export default ConfirmationDialog;
