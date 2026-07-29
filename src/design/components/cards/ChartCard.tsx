import type { ReactNode } from "react";
import { Card } from "./Card";
import { SectionHeader } from "../layout/SectionHeader";

export interface ChartCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Extra padding class for the chart body (charts usually want p-3, tables/lists often want p-0). */
  bodyClassName?: string;
}

// A titled card wrapping a chart or any bordered-section content — the
// "border-b header, then padded body" shape repeated at the top of nearly
// every chart/table section in the app.
export function ChartCard({ title, subtitle, actions, children, bodyClassName = "p-3" }: ChartCardProps) {
  return (
    <Card noPadding>
      <SectionHeader title={title} subtitle={subtitle} actions={actions} />
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}

// Alias — a ChartCard used for prose/summary content (not a chart) reads
// more clearly as <InfoCard>.
export const InfoCard = ChartCard;

export default ChartCard;
