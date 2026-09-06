import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { authenticatedState, renderWithProviders } from "@/test/test-utils";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Dashboard page", () => {
  it("shows a loading indicator until the restaurant-setup check resolves", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {}))); // never resolves
    renderWithProviders(<Dashboard />, { preloadedState: authenticatedState() });
    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });

  it("prompts restaurant setup when the account has no branches yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/my-restaurant")) {
          return Promise.resolve({
            json: () => Promise.resolve({ success: true, data: { restaurant: { branches: [] } } }),
          });
        }
        return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
      }),
    );

    renderWithProviders(<Dashboard />, { preloadedState: authenticatedState() });

    await waitFor(() =>
      expect(screen.queryByText("Loading dashboard...")).not.toBeInTheDocument(),
    );
    // No KPI dashboard is shown — only the setup flow, since a real
    // restaurant/branch is required before any analytics can be computed.
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
  });

  // Every endpoint answers with a `{ success, data }` envelope. When the page
  // moved to RTK Query the per-call-site unwrapping was dropped, so the page
  // read `analytics.revenueByDate` off the envelope instead of the payload and
  // every chart rendered its empty state while the API was returning fine.
  // Real Response objects here — fetchBaseQuery reads status/headers/text(),
  // so a bare `{ json }` stub silently lands in the error branch and exercises
  // none of this.
  it("renders analytics from inside the response envelope", async () => {
    const json = (body: unknown) =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input instanceof Request ? input.url : input);

        if (url.includes("/my-restaurant")) {
          return json({
            success: true,
            data: { restaurant: { branches: [{ id: 20, name: "Test Branch" }] } },
          });
        }
        if (url.includes("restaurantDashboardOverview")) {
          return json({
            success: true,
            data: {
              // Inside the seeded 2026-01-01 → 2026-01-07 range.
              revenueByDate: { "2026-01-03": 5000 },
              ordersByDate: { "2026-01-03": 12 },
              revenueByOrderType: { ONLINE: 3000, DINE_IN: 2000 },
              paymentSplit: { UPI: 4242 },
              topItems: [],
              topCategories: [],
              recentOrders: [],
            },
          });
        }
        if (url.includes("/summary")) {
          return json({
            success: true,
            data: { current: { revenue: 5000, ebitda: 1000, ebitdaPercentage: 20 } },
          });
        }
        if (url.includes("/ratios")) {
          return json({
            success: true,
            data: {
              kpis: [
                { key: "revenue", value: 5000 },
                { key: "ebitdaPercentage", value: 20 },
              ],
            },
          });
        }
        if (url.includes("reorder-alerts")) {
          return json({ success: true, data: { alertCount: 0, alerts: [] } });
        }
        return json({ success: true, data: null });
      }),
    );

    renderWithProviders(<Dashboard />, { preloadedState: authenticatedState() });

    // The branch list lives inside the envelope too, so this also proves the
    // setup modal was not shown in place of the dashboard.
    expect(await screen.findByText("Payment Split")).toBeInTheDocument();

    // The regression: with the envelope left unwrapped these read as absent
    // and every panel renders its empty state though the request succeeded.
    expect(screen.getByText("UPI")).toBeInTheDocument();
    expect(screen.getByText("₹4,242")).toBeInTheDocument();
    expect(screen.queryByText("No revenue data yet")).not.toBeInTheDocument();
  });
});
