import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticatedState, jsonResponse, makeTestStore, requestUrl } from "@/test/test-utils";
import { attendanceApi } from "./attendanceApi";
import { bankingApi } from "./bankingApi";
import { menuApi } from "./menuApi";
import { inventoryApi } from "./inventoryApi";
import { vendorsApi } from "./vendorsApi";
import { ingredientsApi } from "./ingredientsApi";
import { operationsApi } from "./operationsApi";
import { whatsappApi } from "./whatsappApi";

/**
 * Tests for what each write invalidates.
 *
 * Every one of these is a bug that was fixed during the migration, and they all
 * have the same shape: two screens read related data, a write refreshed one of
 * them, and the other kept showing figures from before. That class of staleness
 * is hard to notice by hand — the number is plausible, just out of date — so it
 * is exactly the kind that needs a test rather than a careful reviewer.
 *
 * Each test subscribes to the reads, performs the write, and asserts on which
 * URLs were requested again. What is being checked is the observable
 * consequence, not the tag names: renaming a tag should not fail these, but
 * dropping one from an `invalidatesTags` should.
 *
 * The couple of writes that deliberately invalidate *nothing* are here too,
 * because "this must not refetch" is as much a decision as its opposite.
 */

/** Counts requests per path, so a refetch is visible as a second hit. */
const trackFetches = (body: unknown = { success: true, data: [] }) => {
  const hits: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      hits.push(requestUrl(input).replace(/^https?:\/\/[^/]+/, ""));
      return jsonResponse(body);
    }),
  );
  return {
    /** How many times a path containing `fragment` was requested. */
    count: (fragment: string) => hits.filter((h) => h.includes(fragment)).length,
    all: hits,
  };
};

/** Lets the invalidation-driven refetches settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hours worked reach payroll", () => {
  it("refreshes the day, the month and the payroll run", async () => {
    const f = trackFetches();
    const store = makeTestStore(authenticatedState());

    store.dispatch(
      attendanceApi.endpoints.getAttendanceForDate.initiate({
        branchId: 20,
        date: "2026-09-07",
      }),
    );
    store.dispatch(
      attendanceApi.endpoints.getAttendanceForRange.initiate({
        branchId: 20,
        from: "2026-09-01",
        to: "2026-09-30",
      }),
    );
    store.dispatch(
      attendanceApi.endpoints.getPayroll.initiate({ restaurantId: 10, branchId: 20 }),
    );
    await settle();

    expect(f.count("attendance/branch/20?date=")).toBe(1);
    expect(f.count("attendance/payroll/10/20")).toBe(1);

    await store.dispatch(
      attendanceApi.endpoints.saveManualAttendance.initiate({ userId: 1, date: "2026-09-07" }),
    );
    await settle();

    // The payroll one is the fix: saving hours used to refresh only the day, so
    // the run kept reporting figures computed from the old hours.
    expect(f.count("attendance/branch/20?date=")).toBe(2);
    expect(f.count("attendance/branch/20?from=")).toBe(2);
    expect(f.count("attendance/payroll/10/20")).toBe(2);
  });
});

describe("approving leave reaches payroll", () => {
  it("refreshes the leave list and the payroll run", async () => {
    const f = trackFetches();
    const store = makeTestStore(authenticatedState());

    store.dispatch(
      attendanceApi.endpoints.getLeaveRequests.initiate({ restaurantId: 10, branchId: 20 }),
    );
    store.dispatch(
      attendanceApi.endpoints.getPayroll.initiate({ restaurantId: 10, branchId: 20 }),
    );
    await settle();

    await store.dispatch(
      attendanceApi.endpoints.setLeaveStatus.initiate({ id: 3, status: "APPROVED" }),
    );
    await settle();

    // Approved unpaid leave changes what someone is owed.
    expect(f.count("attendance/leave/10/20")).toBe(2);
    expect(f.count("attendance/payroll/10/20")).toBe(2);
  });
});

describe("saving UPI details reaches the QR code", () => {
  it("refreshes the config and the code drawn from it", async () => {
    const f = trackFetches({ success: true, data: { upiId: "x@bank" } });
    const store = makeTestStore(authenticatedState());

    store.dispatch(bankingApi.endpoints.getUpiConfig.initiate({ restaurantId: 10, branchId: 20 }));
    store.dispatch(bankingApi.endpoints.getUpiQr.initiate({ restaurantId: 10, branchId: 20 }));
    await settle();

    await store.dispatch(
      bankingApi.endpoints.saveUpiConfig.initiate({ branchId: 20, upiId: "new@bank" }),
    );
    await settle();

    // Before this, the page kept showing a QR pointing at the previous UPI id
    // until someone reloaded — a bad way to be paid.
    expect(f.count("banking/upi/10/20/qr")).toBe(2);
    expect(f.all.filter((h) => h.endsWith("banking/upi/10/20")).length).toBe(2);
  });
});

describe("menu-item writes reach the payload three views share", () => {
  it("refreshes menu-management and the engineering matrix", async () => {
    const f = trackFetches({ success: true, data: { menuItems: [] } });
    const store = makeTestStore(authenticatedState());

    store.dispatch(
      inventoryApi.endpoints.getMenuManagement.initiate({ restaurantId: 10, branchId: 20 }),
    );
    store.dispatch(
      inventoryApi.endpoints.getMenuEngineering.initiate({ restaurantId: 10, branchId: 20 }),
    );
    await settle();

    await store.dispatch(
      menuApi.endpoints.saveMenuItem.initiate({ payload: { name: "Dosa", price: 100 } }),
    );
    await settle();

    // The list, the mobile accordion and the matrix all read this payload; the
    // writes used to patch a local array instead.
    expect(f.count("inventory/10/menu-management")).toBe(2);
    expect(f.count("menu-engineering")).toBe(2);
  });
});

describe("vendor money reaches the owed figures", () => {
  it("refreshes outstanding and performance after a payment", async () => {
    const f = trackFetches();
    const store = makeTestStore(authenticatedState());

    store.dispatch(
      vendorsApi.endpoints.getVendorOutstanding.initiate({ restaurantId: 10, branchId: 20 }),
    );
    store.dispatch(
      vendorsApi.endpoints.getVendorPerformance.initiate({ restaurantId: 10, branchId: 20 }),
    );
    await settle();

    await store.dispatch(
      vendorsApi.endpoints.recordVendorPayment.initiate({ vendorId: 1, amount: 50000 }),
    );
    await settle();

    // fetchOutstanding() was called by hand from five places for this.
    expect(f.count("vendors/outstanding/10/20")).toBe(2);
    expect(f.count("vendors/performance/10/20")).toBe(2);
  });
});

describe("writes that deliberately invalidate nothing", () => {
  it("leaves the stock draft alone when a generated list comes back", async () => {
    // generateIngredients returns a *suggestion* for the form to hold. If it
    // invalidated the payload, the refetch would overwrite that draft with the
    // empty list still on the server and the feature would appear to do
    // nothing at all.
    const f = trackFetches({ success: true, data: { ingredients: [] } });
    const store = makeTestStore(authenticatedState());

    store.dispatch(
      inventoryApi.endpoints.getMenuManagement.initiate({ restaurantId: 10, branchId: 20 }),
    );
    await settle();

    await store.dispatch(
      ingredientsApi.endpoints.generateIngredients.initiate({ restaurantId: 10 }),
    );
    await settle();

    expect(f.count("inventory/10/menu-management")).toBe(1);
  });

  it("leaves it alone for a price update too, patching just the one price", async () => {
    // Same reason: a price changed from the history modal must not discard rows
    // someone is part-way through typing elsewhere on the form.
    const f = trackFetches({ success: true, data: { ingredients: [] } });
    const store = makeTestStore(authenticatedState());

    store.dispatch(
      inventoryApi.endpoints.getMenuManagement.initiate({ restaurantId: 10, branchId: 20 }),
    );
    store.dispatch(ingredientsApi.endpoints.getIngredientPriceHistory.initiate(5));
    await settle();

    await store.dispatch(
      ingredientsApi.endpoints.updateIngredientPrice.initiate({
        ingredientId: 5,
        restaurantId: 10,
        newPrice: 70,
      }),
    );
    await settle();

    expect(f.count("inventory/10/menu-management")).toBe(1);
    // Its own history does refresh, so a reopened modal shows the new price.
    expect(f.count("ingredients/price-history/5")).toBe(2);
  });
});

describe("the labour namespace can write equipment", () => {
  it("refreshes the equipment list after a station link", async () => {
    const f = trackFetches();
    const store = makeTestStore(authenticatedState());

    store.dispatch(
      operationsApi.endpoints.getEquipment.initiate({ restaurantId: 10, branchId: 20 }),
    );
    await settle();

    await store.dispatch(
      operationsApi.endpoints.writeLabor.initiate({
        path: "/equipment/7/station",
        method: "PUT",
        body: { stationId: 2 },
      }),
    );
    await settle();

    // /labor/equipment/:id/station writes equipment, so Labor alone was not
    // enough — the Stations tab used to bump a nonce by hand for this.
    expect(f.count("equipment/10/20")).toBe(2);
  });
});

describe("a bulk send shows up in the log", () => {
  it("refreshes the log without anyone watching the tab", async () => {
    const f = trackFetches();
    const store = makeTestStore(authenticatedState());

    store.dispatch(whatsappApi.endpoints.getWhatsAppLogs.initiate({ restaurantId: 10 }));
    await settle();

    await store.dispatch(
      whatsappApi.endpoints.sendBulkWhatsApp.initiate({ restaurantId: 10, body: {} }),
    );
    await settle();

    // There used to be an effect refetching this whenever the Message Log tab
    // was opened, for exactly this case.
    expect(f.count("/api/whatsapp/10?")).toBe(2);
  });
});
