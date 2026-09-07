import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import Kitchen from "./Kitchen";
import {
  authenticatedState,
  jsonResponse,
  renderWithProviders,
} from "@/test/test-utils";

describe("Kitchen analytics page", () => {
  it("shows a loading indicator before data arrives", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    ); // never resolves
    renderWithProviders(<Kitchen />, { preloadedState: authenticatedState() });
    expect(
      screen.getByText("Loading kitchen analytics..."),
    ).toBeInTheDocument();
  });

  it("renders kitchen KPI cards once data loads", async () => {
    // jsonResponse, not a `{ json }` stand-in: fetchBaseQuery calls
    // response.clone() and reads its headers, so the hand-rolled object this
    // used to return made every query reject — and reject invisibly, because
    // the page renders its empty state either way.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        jsonResponse({
          success: true,
          data: {
            summary: {
              totalOrders: 128,
              avgTime: 18,
              slaPercent: 92,
              fastestOrder: 6,
              peakHourLabel: "1 PM - 2 PM",
            },
            hourlyData: [],
            dailyTrend: [],
            tableTurnData: [],
            topItems: [],
            slowestOrders: [],
            orderTypeSpeeds: [],
          },
        }),
      ),
    );

    renderWithProviders(<Kitchen />, { preloadedState: authenticatedState() });

    await waitFor(() =>
      expect(
        screen.queryByText("Loading kitchen analytics..."),
      ).not.toBeInTheDocument(),
    );

    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("18m")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("6m")).toBeInTheDocument();
    expect(screen.getByText("1 PM - 2 PM")).toBeInTheDocument();
  });
});
