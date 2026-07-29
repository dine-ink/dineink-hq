export const trendStyle = (direction: string | null, higherIsBetter: boolean) => {
  if (direction === "flat" || direction === null) return "text-gray-500";
  const isGood = higherIsBetter ? direction === "up" : direction === "down";
  return isGood ? "text-emerald-700" : "text-red-700";
};

export const ALERT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  info: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};
