import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalyticsOverview from "./StatsStrip";

describe("StatsStrip (Dashboard KPI cards)", () => {
  it("renders every KPI card with correctly formatted values", () => {
    render(
      <AnalyticsOverview
        analytics={{
          totalRevenue: 125000,
          totalOrders: 340,
          avgOrderValue: 367.5,
          totalCustomers: 210,
          peakHours: "7 PM - 9 PM",
        }}
        revenue={125000}
        ebitda={22000}
        ebitdaPct={17.6}
      />,
    );

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("₹1,25,000")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("340")).toBeInTheDocument();
    expect(screen.getByText("Avg Order")).toBeInTheDocument();
    expect(screen.getByText("₹368")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("210")).toBeInTheDocument();
    expect(screen.getByText("Peak Hours")).toBeInTheDocument();
    expect(screen.getByText("7 PM - 9 PM")).toBeInTheDocument();
    expect(screen.getByText("EBITDA")).toBeInTheDocument();
    expect(screen.getByText("₹22,000")).toBeInTheDocument();
    expect(screen.getByText("+17.6% margin")).toBeInTheDocument();
  });

  it("falls back to placeholder values when analytics data hasn't loaded yet", () => {
    render(<AnalyticsOverview />);
    // Revenue and Avg Order both render "₹0" with no analytics data.
    expect(screen.getAllByText("₹0")).toHaveLength(2);
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Set expenses in Insights")).toBeInTheDocument();
  });
});
