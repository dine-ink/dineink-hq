import type { ComponentType, ReactNode } from "react";
import { InboxIcon, MagnifyingGlassIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/design/components/buttons/Button";

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
}

// The dashed-border placeholder used whenever a section has nothing to
// show yet — previously a bespoke `<div className="flex h-40 ... border-
// dashed ...">` per page. One component covering the three common cases:
// no data at all, no search results, and a fetch error with a retry action.
export function EmptyState({ icon: Icon = InboxIcon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center ${className}`}>
      <Icon className="h-8 w-8 text-gray-300" aria-hidden="true" />
      <p className="text-[13px] font-semibold text-gray-600">{title}</p>
      {description && <p className="max-w-sm text-[12px] text-gray-400">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function NoResults(props: Omit<EmptyStateProps, "icon">) {
  return <EmptyState icon={MagnifyingGlassIcon} {...props} />;
}

export function ErrorState({ onRetry, ...props }: Omit<EmptyStateProps, "icon" | "action"> & { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={ExclamationCircleIcon}
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
      {...props}
    />
  );
}

export default EmptyState;
