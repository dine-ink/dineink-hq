export interface ProgressIndicatorProps {
  /** 0-100. Omit for an indeterminate (animated, unknown-duration) bar. */
  value?: number;
  label?: string;
  className?: string;
}

// A linear progress bar for long-running operations (report generation,
// bulk uploads) — determinate when `value` is known, otherwise an
// indeterminate animated bar so the user still gets feedback that
// something is happening.
export function ProgressIndicator({ value, label, className = "" }: ProgressIndicatorProps) {
  const determinate = typeof value === "number";
  return (
    <div className={className}>
      {label && <p className="mb-1 text-[11px] text-gray-500">{label}</p>}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={determinate ? Math.round(value) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        ) : (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary-600" />
        )}
      </div>
    </div>
  );
}

export default ProgressIndicator;
