import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import Report from "./Report";
import { authenticatedState, renderWithProviders } from "@/test/test-utils";

const mockBills = [
  { id: 1, status: "PAID", total: 1000, discount: 0, cgst: 50, sgst: 50 },
  { id: 2, status: "PAID", total: 500, discount: 0, cgst: 0, sgst: 0 },
];

// Report.tsx fires 9 parallel fetches on mount — this responds to each by
// URL, returning empty-but-well-formed data for everything except bills
// (which drives the P&L KPIs under test) and finance summary (left
// unsuccessful so the page falls back to its bills-derived P&L math,
// avoiding the need to fabricate a full finance-engine payload).
function mockReportFetches() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/bills/")) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true, bills: mockBills }) });
      }
      if (url.includes("/api/finance/")) {
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
      }
      if (url.includes("/menu-management")) {
        return Promise.resolve({ json: () => Promise.resolve({ success: true, data: { menuItems: [] } }) });
      }
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) });
    }),
  );
}

describe("Reports page — P&L Statement (default tab)", () => {
  it("shows a loading indicator before report data arrives", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {}))); // never resolves
    renderWithProviders(<Report />, { preloadedState: authenticatedState() });
    expect(screen.getByText("Loading reports...")).toBeInTheDocument();
  });

  it("renders correctly computed financial values once bills load", async () => {
    mockReportFetches();
    renderWithProviders(<Report />, { preloadedState: authenticatedState() });

    await waitFor(() => expect(screen.getByText("Total Revenue")).toBeInTheDocument());

    // Some of these labels/amounts are repeated elsewhere on the page (the
    // P&L table below, other tabs' table headers), so each KPI card is
    // located via its own unique sub-text rather than its (ambiguous) label.
    const kpiCard = (uniqueSubText: string | RegExp) => screen.getByText(uniqueSubText).closest(".rounded-xl") as HTMLElement;

    // Total Revenue = 1000 + 500; GST Collected = (50+50) CGST/SGST each;
    // Net Profit (no finance-engine data) = revenue - GST - expenses(0).
    const revenueCard = kpiCard("2 paid bills");
    expect(within(revenueCard).getByText("Total Revenue")).toBeInTheDocument();
    expect(within(revenueCard).getByText("₹1,500")).toBeInTheDocument();

    const expensesCard = kpiCard("0 expense entries");
    expect(within(expensesCard).getByText("Total Expenses")).toBeInTheDocument();
    expect(within(expensesCard).getByText("₹0")).toBeInTheDocument();

    const gstCard = kpiCard(/CGST ₹50 \+ SGST ₹50/);
    expect(within(gstCard).getByText("GST Collected")).toBeInTheDocument();
    expect(within(gstCard).getByText("₹100")).toBeInTheDocument();

    const netProfitCard = kpiCard("93.3% margin");
    expect(within(netProfitCard).getByText("Net Profit")).toBeInTheDocument();
    expect(within(netProfitCard).getByText("₹1,400")).toBeInTheDocument();
  });
});
