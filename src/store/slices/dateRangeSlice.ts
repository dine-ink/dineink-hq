import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import dayjs from "dayjs";

export type Preset = "today" | "week" | "month" | "quarter" | "custom";

interface DateRangeState {
  preset: Preset;
  from: string;
  to: string;
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

const initial = computeRange("week");

const dateRangeSlice = createSlice({
  name: "dateRange",
  initialState: {
    preset: "week" as Preset,
    from: initial.from,
    to: initial.to,
  } as DateRangeState,
  reducers: {
    setPreset(state, action: PayloadAction<Preset>) {
      state.preset = action.payload;
      if (action.payload !== "custom") {
        const r = computeRange(action.payload);
        state.from = r.from;
        state.to = r.to;
      }
    },
    setCustomRange(state, action: PayloadAction<{ from: string; to: string }>) {
      state.preset = "custom";
      state.from = action.payload.from;
      state.to = action.payload.to;
    },
  },
});

export const { setPreset, setCustomRange } = dateRangeSlice.actions;
export const selectDateRange = (s: any) => s.dateRange as DateRangeState;
export const selectIsSingleDay = (s: any) => s.dateRange.from === s.dateRange.to;
export const selectPresetLabel = (s: any): string => {
  const { preset, from, to } = s.dateRange as DateRangeState;
  const labels: Record<Preset, string> = {
    today: "Today",
    week: "Last 7 Days",
    month: "Last 30 Days",
    quarter: "Last 90 Days",
    custom: `${from} → ${to}`,
  };
  return labels[preset];
};
export default dateRangeSlice.reducer;
