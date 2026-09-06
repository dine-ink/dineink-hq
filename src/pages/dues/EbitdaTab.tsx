import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { Alert, EmptyState, LoadingOverlay, MetricCard, type MetricStatus } from "@/design";
import { formatCurrency, titleCaseFromKey } from "./duesShared";

interface EbitdaTabProps {
  month: number;
  year: number;
}

// Keys that are actually percentages — matched on the explicit "Percentage"/
// "Pct" SUFFIX only (the finance module's own naming convention, e.g.
// computeGrossProfitMarginPercentage/computeEBITDAPercentage), not on any
// occurrence of "margin"/"ratio"/"rate" as a bare substring — that broader
// match used to mislabel `contributionMargin` (a ₹ amount) as a percentage.
const PERCENT_KEY_PATTERN = /(?:Percentage|Pct)$/i;

// Plain counts (orders, bill counts, etc.) — a number, but never money and
// never a percentage.
const COUNT_KEY_PATTERN = /(?:orders?|bills?|count|quantity|qty)$/i;

// `month`/`year` are query parameters this tab was called with, not metrics
// — they're already shown in the page's own month/year selector, so they're
// dropped from the grid entirely rather than formatted at all.
const EXCLUDED_KEYS = new Set(["month", "year"]);

const formatMetricValue = (key: string, value: number): string => {
  if (PERCENT_KEY_PATTERN.test(key)) return `${value.toFixed(1)}%`;
  if (COUNT_KEY_PATTERN.test(key)) return Math.round(value).toLocaleString("en-IN");
  return formatCurrency(value);
};

const statusForValue = (key: string, value: number): MetricStatus => {
  if (PERCENT_KEY_PATTERN.test(key)) return value >= 0 ? "success" : "danger";
  if (COUNT_KEY_PATTERN.test(key)) return "primary";
  if (/ebitda|profit|margin/i.test(key)) return value >= 0 ? "success" : "danger";
  return value < 0 ? "danger" : "primary";
};

export default function EbitdaTab({ month, year }: EbitdaTabProps) {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user?.restaurantId || !selectedBranch?.id) return;
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(
          `${API_URL}/api/dues/${user.restaurantId}/${selectedBranch.id}/ebitda-summary?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setData(json.data && typeof json.data === "object" ? json.data : {});
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.restaurantId, selectedBranch?.id, month, year]);

  if (loading) {
    return <LoadingOverlay label="Loading EBITDA summary..." />;
  }

  const numericEntries = Object.entries(data || {}).filter(
    ([key, value]) => typeof value === "number" && Number.isFinite(value) && !EXCLUDED_KEYS.has(key.toLowerCase()),
  ) as [string, number][];

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" title="Couldn't load the EBITDA summary">
          Something went wrong fetching this month's EBITDA metrics.
        </Alert>
      )}

      {!error && numericEntries.length === 0 ? (
        <EmptyState
          title="No EBITDA metrics available"
          description="The finance module hasn't returned any figures for this month yet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {numericEntries.map(([key, value]) => (
            <MetricCard
              key={key}
              label={titleCaseFromKey(key)}
              value={formatMetricValue(key, value)}
              status={statusForValue(key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
