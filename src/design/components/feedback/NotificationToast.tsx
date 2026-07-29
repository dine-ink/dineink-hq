/* eslint-disable react-refresh/only-export-components -- useToast must
   live alongside its ToastContext/ToastProvider to avoid a circular import
   between the hook and the provider that creates its context. */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { AlertVariant } from "./Alert";

interface ToastItem {
  id: number;
  variant: AlertVariant;
  message: ReactNode;
}

interface ToastContextValue {
  show: (message: ReactNode, variant?: AlertVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<AlertVariant, { bg: string; text: string; icon: typeof CheckCircleIcon }> = {
  success: { bg: "bg-success-600", text: "text-white", icon: CheckCircleIcon },
  warning: { bg: "bg-warning-500", text: "text-white", icon: ExclamationTriangleIcon },
  danger: { bg: "bg-danger-600", text: "text-white", icon: XCircleIcon },
  info: { bg: "bg-info-600", text: "text-white", icon: InformationCircleIcon },
};

const AUTO_DISMISS_MS = 4000;

// A self-contained toast system (provider + hook) — replaces the app's
// current reliance on the browser's native window.alert() for success/error
// feedback (blocking, unstyled, and inaccessible-by-modern standards).
// Wrap the app once with <ToastProvider>, then call useToast().show(...)
// from anywhere. Existing alert() call sites are unaffected — this is
// additive infrastructure for new/migrated call sites, not a forced
// rip-and-replace of every alert() in the app (see FINAL_UI_UX_POLISH
// _REPORT.md for the migration status).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: ReactNode, variant: AlertVariant = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), AUTO_DISMISS_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => {
          const c = variantConfig[t.variant];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2 rounded-lg px-3 py-2.5 text-[12px] shadow-dialog ${c.bg} ${c.text}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="flex-1">{t.message}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 opacity-80 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}

export default ToastProvider;
