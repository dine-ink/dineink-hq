import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticatedState, jsonResponse, makeTestStore, requestUrl } from "@/test/test-utils";
import { forecastApi } from "./forecastApi";
import { billsApi } from "./billsApi";
import { customersApi } from "./customersApi";
import { vendorsApi } from "./vendorsApi";
import { inventoryApi } from "./inventoryApi";
import { insightsApi } from "./insightsApi";
import { aiApi } from "./aiApi";
import { sopApi } from "./sopApi";
import { operationsApi } from "./operationsApi";

/**
 * Contract tests for the API slices.
 *
 * The slices are mostly declarative, and declarative code does not need tests.
 * What does is the small amount of real logic in them: the URL each endpoint
 * builds, and what its transformResponse does to the body that comes back.
 *
 * Those two things carry decisions that are not obvious from reading the call
 * site, and several of them were made deliberately during the migration — a
 * couple of endpoints answer with their rows under a key other than `data`, one
 * tolerates two different response shapes, and two distinguish "the server
 * declined" from "there is nothing" in a way `?? []` would flatten. All of that
 * is invisible to the pages, which is exactly why it needs pinning here: a
 * future tidy-up that "simplifies" one of them would break a screen silently.
 *
 * Each test drives the real endpoint through a real store, so it exercises the
 * URL and the transform together. What is asserted is the request that went out
 * and the value the caller received — not any internal shape.
 */

/** Captures the URL of every request and answers all of them with `body`. */
const mockFetch = (body: unknown, status = 200) => {
  const urls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      urls.push(requestUrl(input));
      return jsonResponse(body, status);
    }),
  );
  return urls;
};

/** Runs one endpoint and returns what the caller sees, plus the URL used. */
async function call<A>(endpoint: any, arg: A) {
  const store = makeTestStore(authenticatedState());
  const result = await store.dispatch(endpoint.initiate(arg));
  return result;
}

/** The path part of a captured URL, so tests do not assert on the host. */
const pathOf = (url: string) => url.replace(/^https?:\/\/[^/]+/, "");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("envelopes that are not `data`", () => {
  it("reads bills from `bills`", async () => {
    mockFetch({ success: true, bills: [{ id: 1 }, { id: 2 }] });
    const res = await call(billsApi.endpoints.getBills, {
      restaurantId: 10,
      branchId: 20,
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(res.data).toHaveLength(2);
  });

  it("falls back to `data` for bills, so a normalised backend still works", async () => {
    mockFetch({ success: true, data: [{ id: 1 }] });
    const res = await call(billsApi.endpoints.getBills, {
      restaurantId: 10,
      branchId: 20,
      from: "a",
      to: "b",
    });
    expect(res.data).toHaveLength(1);
  });

  it("reads customers from `customers`", async () => {
    mockFetch({ success: true, customers: [{ id: 7 }] });
    const res = await call(customersApi.endpoints.getCustomersByBranch, {
      restaurantId: 10,
      branchId: 20,
    });
    expect(res.data).toEqual([{ id: 7 }]);
  });
});

describe("vendor outstanding tolerates both response shapes", () => {
  it("accepts an enveloped list", async () => {
    mockFetch({ success: true, data: [{ outstanding: 100 }, { outstanding: 50 }] });
    const res = await call(vendorsApi.endpoints.getVendorOutstanding, {
      restaurantId: 10,
      branchId: 20,
    });
    expect(res.data).toHaveLength(2);
  });

  it("accepts a bare array, which this endpoint has also returned", async () => {
    mockFetch([{ outstanding: 100 }]);
    const res = await call(vendorsApi.endpoints.getVendorOutstanding, {
      restaurantId: 10,
      branchId: 20,
    });
    expect(res.data).toEqual([{ outstanding: 100 }]);
  });

  it("gives an empty list rather than throwing on something unexpected", async () => {
    mockFetch({ success: true, data: { not: "a list" } });
    const res = await call(vendorsApi.endpoints.getVendorOutstanding, {
      restaurantId: 10,
      branchId: 20,
    });
    expect(res.data).toEqual([]);
  });
});

describe("null means the server declined, not that there is nothing", () => {
  it("returns null for a demand forecast the server refused", async () => {
    // The Demand tab shows an error for this and an empty state for [].
    // Collapsing both to [] would silently lose the distinction.
    mockFetch({ success: false, message: "no model" });
    const res = await call(forecastApi.endpoints.getDemandForecast, {
      restaurantId: 10,
      period: "NEXT_MONTH",
      model: "HISTORICAL_TREND",
    });
    expect(res.data).toBeNull();
  });

  it("returns [] for a demand forecast with no items", async () => {
    mockFetch({ success: true, data: { items: [] } });
    const res = await call(forecastApi.endpoints.getDemandForecast, {
      restaurantId: 10,
      period: "NEXT_MONTH",
      model: "HISTORICAL_TREND",
    });
    expect(res.data).toEqual([]);
  });

  it("reads demand rows from the nested `items`, unlike its neighbours", async () => {
    mockFetch({ success: true, data: { items: [{ name: "Dosa" }] } });
    const res = await call(forecastApi.endpoints.getDemandForecast, {
      restaurantId: 10,
      period: "NEXT_MONTH",
      model: "HISTORICAL_TREND",
    });
    expect(res.data).toEqual([{ name: "Dosa" }]);
  });

  it("returns null for an inventory forecast the server refused", async () => {
    mockFetch({ success: false });
    const res = await call(forecastApi.endpoints.getInventoryForecast, {
      restaurantId: 10,
      model: "HISTORICAL_TREND",
    });
    expect(res.data).toBeNull();
  });
});

describe("the daily audit count keeps 'could not check' apart from 'none filed'", () => {
  it("counts what was filed", async () => {
    mockFetch({ success: true, data: [{ id: 1 }, { id: 2 }] });
    const res = await call(inventoryApi.endpoints.getDailyAuditCount, {
      branchId: 20,
      date: "2026-09-07",
    });
    expect(res.data).toBe(2);
  });

  it("is 0 when none were filed today", async () => {
    mockFetch({ success: true, data: [] });
    const res = await call(inventoryApi.endpoints.getDailyAuditCount, {
      branchId: 20,
      date: "2026-09-07",
    });
    expect(res.data).toBe(0);
  });

  it("is null when the check itself failed", async () => {
    // The page nags for a missing audit. It must not nag because it could not
    // find out, which is why this is not 0.
    mockFetch({ success: false });
    const res = await call(inventoryApi.endpoints.getDailyAuditCount, {
      branchId: 20,
      date: "2026-09-07",
    });
    expect(res.data).toBeNull();
  });
});

describe("optional branch scope, which uses two different conventions", () => {
  it("omits branchId entirely for a restaurant-wide forecast", async () => {
    const urls = mockFetch({ success: true, data: {} });
    await call(forecastApi.endpoints.generateForecast, {
      restaurantId: 10,
      period: "NEXT_MONTH",
      model: "HISTORICAL_TREND",
    });
    expect(pathOf(urls[0])).toBe(
      "/api/forecasts/10/generate?period=NEXT_MONTH&model=HISTORICAL_TREND",
    );
  });

  it("includes branchId when one is given", async () => {
    const urls = mockFetch({ success: true, data: {} });
    await call(forecastApi.endpoints.generateForecast, {
      restaurantId: 10,
      branchId: 20,
      period: "NEXT_MONTH",
      model: "HISTORICAL_TREND",
    });
    expect(pathOf(urls[0])).toContain("&branchId=20");
  });

  it("sends the literal string branchId=null for snapshots instead", async () => {
    // Not a mistake and not interchangeable with omitting it: this endpoint
    // reads restaurant-wide only when the parameter is present and "null".
    const urls = mockFetch({ success: true, data: [] });
    await call(forecastApi.endpoints.getForecastSnapshots, { restaurantId: 10, period: "" });
    expect(pathOf(urls[0])).toBe("/api/forecasts/10?branchId=null");
  });

  it("uses an empty branchId for SOP checklists, a third convention", async () => {
    const urls = mockFetch({ success: true, data: [] });
    await call(sopApi.endpoints.getSopChecklists, { restaurantId: 10 });
    expect(pathOf(urls[0])).toBe("/api/sop/10?branchId=");
  });
});

describe("one save endpoint covering create and edit", () => {
  it("POSTs to the collection when there is no id", async () => {
    const urls = mockFetch({ success: true, data: { id: 1 } });
    await call(sopApi.endpoints.saveSop, {
      restaurantId: 10,
      menuItemId: null,
      title: "Prep",
      category: null,
      steps: ["a"],
    });
    expect(pathOf(urls[0])).toBe("/api/sop");
  });

  it("PUTs to the member when there is", async () => {
    const urls = mockFetch({ success: true, data: { id: 5 } });
    await call(sopApi.endpoints.saveSop, {
      id: 5,
      restaurantId: 10,
      menuItemId: null,
      title: "Prep",
      category: null,
      steps: ["a"],
    });
    expect(pathOf(urls[0])).toBe("/api/sop/5");
  });
});

describe("scoped defaults the callers rely on", () => {
  it("asks for every customer with bills excluded, for the bulk-send list", async () => {
    const urls = mockFetch({ success: true, customers: [] });
    await call(customersApi.endpoints.getCustomersByRestaurant, { restaurantId: 10 });
    expect(pathOf(urls[0])).toBe(
      "/api/customers/10/customerByRestaurant?limit=5000&includeBills=false",
    );
  });

  it("looks 30 days ahead for maintenance by default", async () => {
    const urls = mockFetch({ success: true, data: [] });
    await call(operationsApi.endpoints.getMaintenanceDue, {
      restaurantId: 10,
      branchId: 20,
    });
    expect(pathOf(urls[0])).toContain("maintenance-due?withinDays=30");
  });

  it("encodes a procurement term rather than pasting it into the URL", async () => {
    const urls = mockFetch({ success: true, data: {} });
    await call(operationsApi.endpoints.getProcurementPrices, { term: "toor dal & rice" });
    expect(pathOf(urls[0])).toBe("/api/procurement/prices?term=toor%20dal%20%26%20rice");
  });
});

describe("shared endpoints are shared, not duplicated", () => {
  it("serves a second reader of the same AI insight from cache", async () => {
    // The Reports tab and the Insights tab ask for this with identical
    // arguments. Each call is a model run on the server, so the second must not
    // reach it.
    const urls = mockFetch({ success: true, data: [{ title: "x" }] });
    const store = makeTestStore(authenticatedState());
    const args = { restaurantId: 10, period: "currentMonth" };
    await store.dispatch(aiApi.endpoints.getAiInsights.initiate(args));
    await store.dispatch(aiApi.endpoints.getAiInsights.initiate(args));
    expect(urls).toHaveLength(1);
  });

  it("treats a different branch scope as a different question", async () => {
    const urls = mockFetch({ success: true, data: [] });
    const store = makeTestStore(authenticatedState());
    await store.dispatch(
      aiApi.endpoints.getAiInsights.initiate({ restaurantId: 10, period: "currentMonth" }),
    );
    await store.dispatch(
      aiApi.endpoints.getAiInsights.initiate({
        restaurantId: 10,
        period: "currentMonth",
        branchId: 20,
      }),
    );
    expect(urls).toHaveLength(2);
  });
});

describe("auth reaches the request", () => {
  it("sends the bearer token from the store", async () => {
    let seen: Headers | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        seen = (input as Request).headers;
        return jsonResponse({ success: true, data: {} });
      }),
    );
    await call(insightsApi.endpoints.getInsightsSetup, { restaurantId: 10, branchId: 20 });
    expect(seen?.get("authorization")).toBe("Bearer test-token");
  });
});
