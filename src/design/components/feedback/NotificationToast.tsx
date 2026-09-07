/* eslint-disable react-refresh/only-export-components -- useToast must
   live alongside its ToastContext/ToastProvider to avoid a circular import
   between the hook and the provider that creates its context. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { AlertVariant } from "./Alert";
import { registerNotifySink } from "@/utils/notify";

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

/**
 * How long each kind of message stays up.
 *
 * A failure gets noticeably longer than a confirmation. "Saved" is a message
 * you glance at and forget; "Vendor payment failed — ₹50,000 was not
 * recorded" is one you may need to read twice and act on, and it is the one
 * that hurts most to miss. Neither blocks the page, so a longer error costs
 * the reader nothing but a close button.
 */
const DISMISS_MS: Record<AlertVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  danger: 9000,
};

/** Beyond this the stack starts covering the page it is reporting on. */
const MAX_VISIBLE = 4;

/**
 * A self-contained toast system, replacing the browser's native window.alert()
 * for success and error feedback — which blocked the page, could not be
 * styled, and read poorly to a screen reader.
 *
 * Wrap the app once with <ToastProvider>. Then either:
 *
 *   - `useToast().show(...)` inside a component, or
 *   - `notify(...)` from utils/notify anywhere at all.
 *
 * The second is what the app's own call sites use, and the provider registers
 * itself as its sink below. Both routes land in the same list of toasts; there
 * is not a second notification system hiding behind the other name.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Every pending auto-dismiss, so unmounting cannot leave a timer that fires
  // into a gone component.
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: ReactNode, variant: AlertVariant = "info") => {
    const id = Date.now() + Math.random();

    setToasts((prev) => {
      // A double-clicked save button should not stack the same sentence twice.
      // Only comparable for plain strings, which every call site in the app
      // uses; a richer node is always treated as new.
      const duplicate =
        typeof message === "string" &&
        prev.some((t) => t.variant === variant && t.message === message);
      if (duplicate) return prev;

      return [...prev, { id, variant, message }].slice(-MAX_VISIBLE);
    });

    timers.current.set(
      id,
      setTimeout(() => dismiss(id), DISMISS_MS[variant]),
    );
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  // Lets `notify()` reach this provider from outside React — every converted
  // alert() call site goes through that rather than the hook, because all of
  // them are in handlers rather than in render.
  useEffect(() => registerNotifySink(show), [show]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const c = variantConfig[t.variant];
          const Icon = c.icon;
          const isError = t.variant === "danger";
          return (
            <div
              key={t.id}
              // A failure interrupts; a confirmation waits its turn. Set per
              // toast rather than on the container, so one region does not
              // have to be assertive for everything it might ever hold.
              role={isError ? "alert" : "status"}
              aria-live={isError ? "assertive" : "polite"}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-[13px] leading-snug shadow-dialog animate-toast-in motion-reduce:animate-none ${c.bg} ${c.text}`}
            >
              <Icon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="flex-1">{t.message}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-m-0.5 shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <XMarkIcon className="h-4 w-4" />
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
