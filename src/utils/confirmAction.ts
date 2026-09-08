import type { ReactNode } from "react";

/**
 * The app's replacement for `window.confirm()`.
 *
 * A promise rather than the callback style of `useConfirmDialog`, because of
 * the shape the existing call sites are in. All twenty of them read:
 *
 *   if (!window.confirm("Delete this menu item?")) return;
 *   await deleteItem(id).unwrap();
 *
 * and six of those are inside plain hooks (useAddOns, useIngredientEditor,
 * useMenuItemsEditor) that render nothing and so cannot host a dialog. Moving
 * them to a callback would mean inverting each function and threading
 * dialogProps out through the hook's return type up to whichever page renders
 * it. Awaiting a boolean instead leaves the control flow exactly as it is:
 *
 *   if (!(await confirmAction({ title: "Delete this menu item?" }))) return;
 *
 * `useConfirmDialog` stays as it is and keeps its two callers — it suits a
 * component that wants the dialog in its own tree. This is the same dialog
 * reached a different way, exactly as notify() is for toasts.
 */

export interface ConfirmOptions {
  /** The question, as the dialog's heading. */
  title: ReactNode;
  /** Optional detail below it — consequences, what cannot be undone. */
  message?: ReactNode;
  /** "danger" for anything destructive. Defaults to danger: nearly every
   *  call site here is a delete, and erring towards a red button is safer
   *  than erring towards a blue one. */
  tone?: "primary" | "danger";
  confirmLabel?: string;
  cancelLabel?: string;
}

type Sink = (options: ConfirmOptions) => Promise<boolean>;

let sink: Sink | null = null;

/** Called by ConfirmProvider. Returns a de-registration function. */
export function registerConfirmSink(next: Sink): () => void {
  sink = next;
  return () => {
    if (sink === next) sink = null;
  };
}

/**
 * Ask the person to confirm something. Resolves true if they did.
 *
 * With no provider mounted this resolves **false** — the action is declined.
 * For a set of call sites that is almost entirely deletes, a mis-wired root
 * should mean "nothing happened", never "deleted without asking".
 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (sink) return sink(options);
  console.warn("[confirmAction] no ConfirmProvider mounted; declining:", options.title);
  return Promise.resolve(false);
}
