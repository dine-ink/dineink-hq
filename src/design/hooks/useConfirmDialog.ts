import { useCallback, useState } from "react";
import type { ReactNode } from "react";

interface PendingConfirm {
  title: ReactNode;
  message: ReactNode;
  tone: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
}

export interface UseConfirmDialogResult {
  /** Render `<ConfirmationDialog {...dialogProps}>{dialogProps.children}</ConfirmationDialog>` once, near the root of the component. */
  dialogProps: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: ReactNode;
    children: ReactNode;
    tone: "primary" | "danger";
  };
  /** Call this from an onClick handler instead of window.confirm(...). */
  confirm: (options: { title: ReactNode; message: ReactNode; onConfirm: () => void | Promise<void>; tone?: "primary" | "danger" }) => void;
}

// Pairs with <ConfirmationDialog> to replace the imperative
// `if (!window.confirm("...")) return;` pattern with a properly-styled,
// accessible dialog, without every call site needing to manage its own
// isOpen state. Usage:
//
//   const { dialogProps, confirm } = useConfirmDialog();
//   <button onClick={() => confirm({ title: "Delete?", message: "...", onConfirm: doDelete })}>
//   <ConfirmationDialog {...dialogProps}>{dialogProps.children}</ConfirmationDialog>
export function useConfirmDialog(): UseConfirmDialogResult {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: { title: ReactNode; message: ReactNode; onConfirm: () => void | Promise<void>; tone?: "primary" | "danger" }) => {
    setPending({ title: options.title, message: options.message, tone: options.tone ?? "primary", onConfirm: options.onConfirm });
  }, []);

  const close = useCallback(() => setPending(null), []);

  const handleConfirm = useCallback(async () => {
    if (!pending) return;
    await pending.onConfirm();
    setPending(null);
  }, [pending]);

  return {
    dialogProps: {
      open: !!pending,
      onClose: close,
      onConfirm: handleConfirm,
      title: pending?.title ?? "",
      children: pending?.message ?? "",
      tone: pending?.tone ?? "primary",
    },
    confirm,
  };
}

export default useConfirmDialog;
