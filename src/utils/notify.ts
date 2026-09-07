import type { ReactNode } from "react";

/**
 * The app's replacement for `window.alert()`.
 *
 * There was already a perfectly good toast system in the design system
 * (feedback/NotificationToast) with a `useToast()` hook — and nothing used it,
 * while 83 call sites still reached for the browser's native alert. This is the
 * bridge that made converting them practical.
 *
 * Why a module function rather than the hook at every call site:
 *
 * Every one of those 83 calls is inside an event handler or a catch block —
 * "the save failed", "pick a branch first" — not inside render. They are
 * imperative announcements, so an imperative API fits them. Using the hook
 * would have meant threading `const { show } = useToast()` through 83 function
 * bodies, including several plain helpers that are not components, for no gain
 * in behaviour.
 *
 * The provider registers itself here on mount (see ToastProvider), so this is
 * the same toast system, reached a different way — not a second one.
 *
 * If nothing has registered, the message goes to the console rather than
 * throwing or vanishing. That matters: a notification that disappears because
 * a provider is missing turns a visible failure back into a silent one, which
 * is the exact bug this whole effort has been removing. Tests mount the
 * provider like the app does, so this path is for a mis-wired root only.
 */

export type NotifyVariant = "success" | "warning" | "danger" | "info";

type Sink = (message: ReactNode, variant: NotifyVariant) => void;

let sink: Sink | null = null;

/** Called by ToastProvider. Returns a de-registration function. */
export function registerNotifySink(next: Sink): () => void {
  sink = next;
  return () => {
    if (sink === next) sink = null;
  };
}

/** Announce something to the person using the app. Defaults to an error. */
export function notify(message: ReactNode, variant: NotifyVariant = "danger") {
  // Several call sites pass a message straight off a response, and not
  // every failing endpoint sends one. A toast with nothing in it is worse
  // than the alert() it replaced, so say *something*.
  if (message === null || message === undefined || message === "") {
    message = "Something went wrong. Please try again.";
  }
  if (sink) {
    sink(message, variant);
    return;
  }
  console.warn(`[notify:${variant}] no ToastProvider mounted:`, message);
}

/** Reads better at call sites that are reporting success. */
export const notifySuccess = (message: ReactNode) => notify(message, "success");
