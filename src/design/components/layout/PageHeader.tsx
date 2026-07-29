import type { ReactNode } from "react";

export interface PageHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned content — date range picker, action buttons, KPI chips. */
  actions?: ReactNode;
}

// The header card at the top of every page (icon square + title + subtitle,
// with a soft decorative blur accent) — the exact same markup was
// previously copy-pasted into Kitchen, Bills, and most other pages with
// only the icon/copy changed. One implementation now; the brand color and
// card radius/shadow both come from the design system, so retuning either
// updates every page's header at once.
export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-card border border-surface-border bg-surface-card px-4 py-3 shadow-card">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-100/40 blur-3xl" aria-hidden="true" />
      <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary-600 shadow-card">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-[12px] text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
