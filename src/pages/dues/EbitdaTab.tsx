import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { Alert, EmptyState, LoadingOverlay, MetricCard, type MetricStatus } from "../../design";
import { formatCurrency, titleCaseFromKey } from "./duesShared";

interface EbitdaTabProps {
  month: number;
  year: number;
}

// Keys that read more naturally as a percentage than as a currency amount —
// matched loosely since the finance module's exact field names aren't
// contractually fixed from this page's point of view.
const PERCENT_KEY_PATTERN = /(percent|pct|margin|ratio|rate)/i;

const formatMetricValue = (key: string, value: number): string =>
  PERCENT_KEY_PATTERN.test(key) ? `${value.toFixed(1)}%` : formatCurrency(value);

const statusForValue = (key: string, value: number): MetricStatus => {
  if (PERCENT_KEY_PATTERN.test(key)) return value >= 0 ? "success" : "danger";
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
    ([, value]) => typeof value === "number" && Number.isFinite(value),
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
