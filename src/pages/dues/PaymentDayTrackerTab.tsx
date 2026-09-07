import { useAppSelector } from "@/store";
import { useGetDuesPaymentCalendarQuery } from "@/store/api/duesApi";
import { Alert, EmptyState, LoadingOverlay, StatusChip } from "@/design";
import {
  SOURCE_CHIP,
  SOURCE_LABEL,
  formatCurrency,
  monthRangeISO,
  monthYearLabel,
  type PaymentCalendarEntry,
} from "./duesShared";

interface PaymentDayTrackerTabProps {
  month: number;
  year: number;
}

export default function PaymentDayTrackerTab({ month, year }: PaymentDayTrackerTabProps) {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);


  // The from/to pair is derived from the month, so it stays part of the
  // cache key rather than being rebuilt inside a fetch.
  const range = monthRangeISO(month, year);
  const {
    data: entries = [],
    isFetching: loading,
    isError: error,
  } = useGetDuesPaymentCalendarQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: selectedBranch?.id as number,
      month,
      year,
      ...range,
    },
    { skip: !user?.restaurantId || !selectedBranch?.id },
  );

  if (loading) {
    return <LoadingOverlay label="Loading payment calendar..." />;
  }

  const groups = new Map<string, PaymentCalendarEntry[]>();
  for (const entry of entries) {
    const dateKey = (entry.dueDate || "").split("T")[0];
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push(entry);
  }
  const orderedDates = Array.from(groups.keys()).sort();

  const formatGroupDate = (dateKey: string) => {
    const d = new Date(dateKey);
    if (Number.isNaN(d.getTime())) return dateKey;
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" title="Couldn't load the payment calendar">
          Something went wrong fetching upcoming payments for {monthYearLabel(month, year)}.
        </Alert>
      )}

      {!error && entries.length === 0 ? (
        <EmptyState
          title="No scheduled payments this month"
          description={`No monthly dues, vendor invoices, or EMIs are due in ${monthYearLabel(month, year)}.`}
        />
      ) : (
        <div className="space-y-4">
          {orderedDates.map((dateKey) => {
            const dayEntries = groups.get(dateKey) || [];
            const dayTotal = dayEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
            return (
              <div key={dateKey} className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                  <p className="text-[12px] font-bold text-gray-900">{formatGroupDate(dateKey)}</p>
                  <p className="text-[11px] font-semibold text-gray-500">{formatCurrency(dayTotal)} total</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {dayEntries.map((entry) => (
                    <div key={`${entry.source}-${entry.id}`} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <StatusChip status={SOURCE_CHIP[entry.source]}>{SOURCE_LABEL[entry.source]}</StatusChip>
                        <p className="text-[13px] font-medium text-gray-800">{entry.label}</p>
                      </div>
                      <p className="text-[13px] font-bold text-gray-900">{formatCurrency(entry.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
