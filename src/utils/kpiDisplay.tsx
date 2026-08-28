import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

export const TrendIcon = ({ direction }: { direction: string | null }) => {
  if (direction === "up") return <ArrowTrendingUpIcon className="h-3.5 w-3.5" />;
  if (direction === "down") return <ArrowTrendingDownIcon className="h-3.5 w-3.5" />;
  return <MinusIcon className="h-3.5 w-3.5" />;
};

export const AlertIcon = ({ severity }: { severity: string }) => {
  if (severity === "critical") return <ExclamationCircleIcon className="h-4 w-4" />;
  if (severity === "warning") return <ExclamationTriangleIcon className="h-4 w-4" />;
  return <InformationCircleIcon className="h-4 w-4" />;
};
