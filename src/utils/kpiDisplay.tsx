import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info } from "lucide-react";

export const trendStyle = (direction: string | null, higherIsBetter: boolean) => {
  if (direction === "flat" || direction === null) return "text-gray-500";
  const isGood = higherIsBetter ? direction === "up" : direction === "down";
  return isGood ? "text-emerald-700" : "text-red-700";
};

export const TrendIcon = ({ direction }: { direction: string | null }) => {
  if (direction === "up") return <TrendingUp className="h-3.5 w-3.5" />;
  if (direction === "down") return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

export const AlertIcon = ({ severity }: { severity: string }) => {
  if (severity === "critical") return <AlertCircle className="h-4 w-4" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
};

export const ALERT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  info: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
};
