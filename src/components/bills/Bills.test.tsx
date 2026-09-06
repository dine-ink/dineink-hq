import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor, within } from "@testing-library/react";
import Bills from "./Bills";
import { authenticatedState, renderWithProviders } from "@/test/test-utils";

const mockBills = [
  {
    id: 1,
    billNo: "INV-001",
    customer: { name: "Arjun Rao", phone: "9999900001" },
    orderType: "DINE_IN",
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    total: 1000,
    subtotal: 900,
    discount: 0,
    gst: 100,
    cgst: 50,
    sgst: 50,
    serviceCharge: 0,
    packingCharge: 0,
    createdAt: "2026-01-05T12:00:00.000Z",
    items: [
      { id: 11, itemName: "Paneer Tikka", quantity: 2, price: 250, total: 500 },
      { id: 12, itemName: "Butter Naan", quantity: 4, price: 100, total: 400 },
    ],
  },
  {
    id: 2,
    billNo: "INV-002",
    customer: { name: "Priya Nair", phone: "9999900002" },
    orderType: "TAKEAWAY",
    paymentMethod: "UPI",
    paymentStatus: "PAID",
    total: 500,
    subtotal: 500,
    discount: 0,
    gst: 0,
    cgst: 0,
    sgst: 0,
    serviceCharge: 0,
    packingCharge: 0,
    createdAt: "2026-01-06T12:00:00.000Z",
    items: [{ id: 21, itemName: "Veg Biryani", quantity: 1, price: 500, total: 500 }],
  },
];

function mockFetchBills() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ json: () => Promise.resolve({ success: true, bills: mockBills }) }),
  );
}

// The bill list renders twice — the table for md and up, and the mobile card
// layer from MobileTableCards. Only CSS separates them, so both are in the DOM
// under jsdom; scope list assertions to the table to keep them unambiguous.
const inList = () => within(screen.getByRole("table"));

describe("Bills page", () => {
  it("renders the bill list with correctly computed revenue KPIs", async () => {
    mockFetchBills();
    renderWithProviders(<Bills />, { preloadedState: authenticatedState() });

    await waitFor(() =>
      expect(inList().getByText("INV-001")).toBeInTheDocument(),
    );
    expect(inList().getByText("INV-002")).toBeInTheDocument();

    // Revenue = sum of PAID bills' totals (1000 + 500), Avg Bill = 1500 / 2.
    expect(screen.getByText("₹1,500")).toBeInTheDocument();
    expect(screen.getByText("₹750")).toBeInTheDocument();
  });

  it("search narrows the bill list to matching customers", async () => {
    mockFetchBills();
    const user = userEvent.setup();
    renderWithProviders(<Bills />, { preloadedState: authenticatedState() });

    await waitFor(() =>
      expect(inList().getByText("INV-001")).toBeInTheDocument(),
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Priya");

    expect(inList().queryByText("INV-001")).not.toBeInTheDocument();
    expect(inList().getByText("INV-002")).toBeInTheDocument();
  });

  it("opening a bill shows its itemized lines and a correctly computed bill summary", async () => {
    mockFetchBills();
    const user = userEvent.setup();
    renderWithProviders(<Bills />, { preloadedState: authenticatedState() });

    await waitFor(() =>
      expect(inList().getByText("INV-001")).toBeInTheDocument(),
    );
    await user.click(inList().getByText("INV-001"));

    // Scope every remaining assertion to the detail drawer — the bill list
    // stays mounted behind it and shares some of the same rupee amounts.
    const drawerHeading = await screen.findByText("Bill Details");
    const drawer = drawerHeading.closest(".max-w-md") as HTMLElement;
    const inDrawer = within(drawer);

    // Itemized "cart" lines — name, quantity, unit price, and computed total.
    expect(inDrawer.getByText("Paneer Tikka")).toBeInTheDocument();
    expect(inDrawer.getByText("×2")).toBeInTheDocument();
    expect(inDrawer.getByText("₹500")).toBeInTheDocument(); // 2 × 250
    expect(inDrawer.getByText("Butter Naan")).toBeInTheDocument();
    expect(inDrawer.getByText("×4")).toBeInTheDocument();
    expect(inDrawer.getByText("₹400")).toBeInTheDocument(); // 4 × 100

    // Bill summary breakdown.
    expect(inDrawer.getByText("Subtotal")).toBeInTheDocument();
    expect(inDrawer.getByText("₹900")).toBeInTheDocument();
    expect(inDrawer.getByText("CGST / SGST")).toBeInTheDocument();
    // "Total" also labels the itemized-lines column header, so this checks
    // the summary row specifically via its final grand-total amount instead.
    expect(inDrawer.getByText("₹1,000")).toBeInTheDocument();
  });
});
