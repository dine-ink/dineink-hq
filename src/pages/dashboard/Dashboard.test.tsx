import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import Dashboard from "./Dashboard";
import { authenticatedState, renderWithProviders } from "../../test/test-utils";

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
});
