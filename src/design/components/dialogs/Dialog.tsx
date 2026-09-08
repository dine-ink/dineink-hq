import { Fragment } from "react";
import type { ReactNode } from "react";
import { Dialog as HeadlessDialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/design/components/buttons/IconButton";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

// The base modal dialog — built on @headlessui/react (already the app's
// established modal primitive, e.g. RestaurantSetupModal), which supplies
// focus-trapping, Escape-to-close, and correct ARIA roles for free. Every
// specific dialog in the app (ConfirmationDialog, DeleteDialog, and any
// future one) should compose this instead of hand-rolling a fixed/backdrop
// div, which is how modals were previously implemented ad hoc (see
// Bills.tsx's bill-detail drawer, which predates this component).
export function Dialog({ open, onClose, title, children, footer, size = "md" }: DialogProps) {
  return (
    <Transition show={open} as={Fragment}>
      <HeadlessDialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            {/* Bounded to the viewport with the body scrolling, so a tall form is never
                clipped behind a fixed overlay that cannot scroll. Header and footer stay put. */}
            <DialogPanel className={`flex max-h-[90vh] w-full flex-col ${sizeClasses[size]} overflow-hidden rounded-dialog bg-white shadow-dialog`}>
              {title && (
                <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-5 py-4">
                  <DialogTitle className="text-[16px] font-bold text-gray-900">{title}</DialogTitle>
                  <IconButton icon={<XMarkIcon className="h-4 w-4" />} aria-label="Close dialog" onClick={onClose} variant="ghost" />
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
              {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-surface-border px-5 py-3">{footer}</div>}
            </DialogPanel>
          </TransitionChild>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

export default Dialog;
