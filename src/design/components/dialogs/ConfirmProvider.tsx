import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { registerConfirmSink } from "@/utils/confirmAction";
import type { ConfirmOptions } from "@/utils/confirmAction";

/**
 * Hosts one <ConfirmationDialog> for the whole app and lets `confirmAction()`
 * open it from anywhere — including from hooks that render nothing.
 *
 * Wrap the app once, alongside ToastProvider. See utils/confirmAction for why
 * the imperative promise API exists rather than every call site using
 * useConfirmDialog.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);

  // The waiting caller's `resolve`, held outside state: settling a promise is
  // a side effect, and a state updater must stay pure — StrictMode calls it
  // twice in development.
  const resolveRef = useRef<((answer: boolean) => void) | null>(null);

  const request = useCallback((options: ConfirmOptions) => {
    // A dialog is modal, so a second question while one is open has nowhere
    // to appear. Declining it keeps that caller from awaiting forever.
    if (resolveRef.current) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setPending(options);
    });
  }, []);

  useEffect(() => registerConfirmSink(request), [request]);

  /** Answers the outstanding question, whichever way the dialog was closed. */
  const settle = useCallback((answer: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setPending(null);
    resolve?.(answer);
  }, []);

  useEffect(() => {
    // If the provider unmounts with a question outstanding, answer it rather
    // than leaving whoever asked awaiting a promise that never settles.
    return () => {
      const resolve = resolveRef.current;
      resolveRef.current = null;
      resolve?.(false);
    };
  }, []);

  return (
    <>
      {children}
      <ConfirmationDialog
        open={!!pending}
        onClose={() => settle(false)}
        onConfirm={() => settle(true)}
        title={pending?.title ?? ""}
        tone={pending?.tone ?? "danger"}
        confirmLabel={pending?.confirmLabel}
        cancelLabel={pending?.cancelLabel}
      >
        {pending?.message ?? ""}
      </ConfirmationDialog>
    </>
  );
}

export default ConfirmProvider;
