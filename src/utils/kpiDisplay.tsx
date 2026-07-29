import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info } from "lucide-react";

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
