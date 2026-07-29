import type { ReactNode } from "react";

export interface ToolbarProps {
  /** Left-aligned content — usually a SearchBar and/or filter dropdowns. */
  children: ReactNode;
  /** Right-aligned content — usually action buttons. */
  actions?: ReactNode;
  className?: string;
}

// The filter/search/action-buttons row that sits above nearly every table
// or list in the app (previously a bespoke flex row per page). Wraps on
// small screens instead of overflowing.
export function Toolbar({ children, actions, className = "" }: ToolbarProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Alias — a Toolbar used purely for filter controls (date range, status
// dropdowns, branch selector) reads more clearly as <FilterBar>.
export const FilterBar = Toolbar;

export default Toolbar;
