/* eslint-disable react-refresh/only-export-components -- standard
   Context+Provider+hook co-location; splitting it up is a much larger,
   unrelated restructuring than this lint pass warrants. */
import { createContext, useContext, useState, ReactNode } from "react";
import dayjs from "dayjs";

export type Preset = "today" | "week" | "month" | "quarter" | "custom";

export interface DateRange {
  preset: Preset;
  from: string;
  to: string;
  isSingleDay: boolean;
  label: string;
}

interface DateRangeContextType extends DateRange {
  setPreset: (preset: Preset) => void;
  setCustomRange: (from: string, to: string) => void;
}

const computeRange = (preset: Preset): { from: string; to: string } => {
  const now = dayjs();
  switch (preset) {
    case "today":
      return { from: now.format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD") };
    case "week":
      return { from: now.subtract(6, "day").format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD") };
    case "month":
      return { from: now.subtract(29, "day").format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD") };
    case "quarter":
      return { from: now.subtract(89, "day").format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD") };
    default:
      return { from: now.format("YYYY-MM-DD"), to: now.format("YYYY-MM-DD") };
  }
};

const buildLabel = (preset: Preset, from: string, to: string): string => {
  if (preset === "custom") return `${from} → ${to}`;
  const labels: Record<Preset, string> = {
    today: "Today",
    week: "Last 7 days",
    month: "Last 30 days",
    quarter: "Last 90 days",
    custom: "Custom",
  };
  return labels[preset];
};

export const DateRangeContext = createContext<DateRangeContextType>({} as DateRangeContextType);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const initial = computeRange("week");
  const [preset, setPresetState] = useState<Preset>("week");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const setPreset = (p: Preset) => {
    setPresetState(p);
    if (p !== "custom") {
      const r = computeRange(p);
      setFrom(r.from);
      setTo(r.to);
    }
  };

  const setCustomRange = (newFrom: string, newTo: string) => {
    setPresetState("custom");
    setFrom(newFrom);
    setTo(newTo);
  };

  return (
    <DateRangeContext.Provider value={{
      preset, from, to,
      isSingleDay: from === to,
      label: buildLabel(preset, from, to),
      setPreset,
      setCustomRange,
    }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export const useDateRange = () => useContext(DateRangeContext);
