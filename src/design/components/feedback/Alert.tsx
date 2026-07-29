import type { ReactNode } from "react";
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export type AlertVariant = "success" | "warning" | "danger" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, { border: string; bg: string; text: string; icon: typeof CheckCircleIcon }> = {
  success: { border: "border-success-200", bg: "bg-success-50", text: "text-success-700", icon: CheckCircleIcon },
  warning: { border: "border-warning-200", bg: "bg-warning-50", text: "text-warning-700", icon: ExclamationTriangleIcon },
  danger: { border: "border-danger-200", bg: "bg-danger-50", text: "text-danger-700", icon: XCircleIcon },
  info: { border: "border-info-200", bg: "bg-info-50", text: "text-info-700", icon: InformationCircleIcon },
};

// A full-width inline banner for form/page-level feedback — distinct from
// the compact <StatusChip> pill. Consolidates the "rounded-xl border
// ${style.border} ${style.bg} ... ${style.text}" pattern already used for
// alert lists in the Executive/Forecast dashboards, generalized into a
// standalone component with the four semantic variants the brief calls
// out.
export function Alert({ variant = "info", title, children, onDismiss, className = "" }: AlertProps) {
  const c = variantConfig[variant];
  const Icon = c.icon;
  return (
    <div role="alert" className={`flex items-start gap-2 rounded-lg border ${c.border} ${c.bg} px-3 py-2.5 text-[12px] ${c.text} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-0.5" : ""}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function SuccessAlert(props: Omit<AlertProps, "variant">) {
  return <Alert variant="success" {...props} />;
}
export function WarningAlert(props: Omit<AlertProps, "variant">) {
  return <Alert variant="warning" {...props} />;
}
export function ErrorAlert(props: Omit<AlertProps, "variant">) {
  return <Alert variant="danger" {...props} />;
}
export function InfoAlert(props: Omit<AlertProps, "variant">) {
  return <Alert variant="info" {...props} />;
}

export default Alert;
