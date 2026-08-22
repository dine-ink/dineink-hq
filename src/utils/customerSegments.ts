export type CustomerSegment = "active" | "at_risk" | "churned";

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Recency-bucket customer segmentation — Active (visited within 30 days), At
 * Risk (30-90 days), Churned (more than 90 days ago, or never visited at
 * all). Mirrors the Customers page's own Churn Analysis buckets exactly, so
 * every screen that segments customers (Customers page, WhatsApp bulk send)
 * agrees on the same edges — this is the one place those thresholds live.
 */
export function getCustomerSegment(lastVisit: string | null | undefined): CustomerSegment {
  if (!lastVisit) return "churned";
  const days = (Date.now() - new Date(lastVisit).getTime()) / DAY_MS;
  if (days <= 30) return "active";
  if (days <= 90) return "at_risk";
  return "churned";
}

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  active: "Active",
  at_risk: "At Risk",
  churned: "Churned",
};

export const SEGMENT_STYLES: Record<CustomerSegment, { bg: string; text: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700" },
  at_risk: { bg: "bg-amber-50", text: "text-amber-700" },
  churned: { bg: "bg-red-50", text: "text-red-700" },
};
