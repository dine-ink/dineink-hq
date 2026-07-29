export interface LoadingSkeletonProps {
  /** Number of skeleton rows/lines to render. */
  rows?: number;
  className?: string;
}

// A pulsing gray placeholder block — use in place of a bare spinner when a
// section's final layout (a table, a list, a card grid) is already known,
// so the page doesn't visibly "jump" once real content arrives.
export function LoadingSkeleton({ rows = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-gray-200" style={{ width: `${100 - i * 8}%` }} />
      ))}
    </div>
  );
}

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeClasses = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-2", lg: "h-10 w-10 border-[3px]" };

// The full-page/section loading spinner duplicated as an inline `<div
// className="h-8 w-8 animate-spin ...">` in nearly every page's `if
// (loading) return (...)` branch. `label` is announced to screen readers
// via role="status" even though it's visually optional.
export function Spinner({ size = "md", label, className = "" }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-live="polite">
      <div className={`animate-spin rounded-full border-gray-200 border-t-primary-600 ${sizeClasses[size]}`} />
      {label && <p className="text-[12px] text-gray-500">{label}</p>}
    </div>
  );
}

// Full-viewport-section variant — the exact `flex min-h-[400px] items-
// center justify-center` wrapper repeated at the top of every page's
// loading branch.
export function LoadingOverlay({ label = "Loading...", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex min-h-[400px] items-center justify-center ${className}`}>
      <Spinner label={label} />
    </div>
  );
}

export default LoadingSkeleton;
