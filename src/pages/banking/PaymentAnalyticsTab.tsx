import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store";
import { Button, LoadingOverlay, EmptyState } from "@/design";
import { ChartBarIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL;

// Payment-method revenue mix already exists as the "Payment Split" panel on
// the main Dashboard (fed by /api/analytics/:restaurantId/
// restaurantDashboardOverview). Rather than fabricate a separate banking
// analytics endpoint, this tab reads the same payload for a quick preview
// and links out to the full Dashboard for the complete view — no new
// backend endpoint invented here.
export default function PaymentAnalyticsTab() {
  const navigate = useNavigate();
  const { from, to, preset } = useAppSelector((s) => s.dateRange);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user, token } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const [paymentSplit, setPaymentSplit] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      if (!user?.restaurantId || !selectedBranch?.id) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${API_URL}/api/analytics/${user.restaurantId}/restaurantDashboardOverview?branchId=${selectedBranch.id}&range=${preset}&from=${from}&to=${to}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await res.json();
        if (json.success) setPaymentSplit(json.data?.paymentSplit || {});
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [user?.restaurantId, selectedBranch?.id, from, to, preset, token]);

  if (loading) return <LoadingOverlay label="Loading payment analytics..." />;

  const entries = Object.entries(paymentSplit || {});
  const max = Math.max(...entries.map(([, v]) => Number(v)), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-gray-400">
          Payment method analytics are sourced from the restaurant's main revenue analytics — shown here as a quick
          preview, with the full breakdown on the Dashboard.
        </p>
        <Button size="sm" variant="outline" rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />} onClick={() => navigate("/dashboard")} className="shrink-0">
          View full Dashboard
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={ChartBarIcon}
          title="No payment method data for this period"
          description="Revenue by payment method (Cash / Card / UPI / etc.) shows up here once bills are recorded. See the Payment Split panel on the main Dashboard for the full view."
          action={{ label: "Go to Dashboard", onClick: () => navigate("/dashboard") }}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-[14px] font-bold text-gray-900">Payment Split</h3>
          <p className="mt-0.5 text-[11px] text-gray-500">Revenue by payment method for {from} → {to}</p>
          <div className="mt-3 space-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-gray-900">{key}</p>
                  <p className="text-[12px] font-bold text-gray-700">₹{Number(value).toLocaleString("en-IN")}</p>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min((Number(value) / max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
