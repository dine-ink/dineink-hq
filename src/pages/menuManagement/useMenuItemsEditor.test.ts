import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { authenticatedState, hookWrapper } from "@/test/test-utils";
import { useMenuItemsEditor } from "./useMenuItemsEditor";

/**
 * The menu list's filtering, sorting and grouping.
 *
 * Four filters that combine, a price sort, and a second grouped view of the
 * same result for the phone layout. None of it touches the network, and all of
 * it decides what an owner sees when they go looking for one dish among a few
 * hundred — so a filter that silently stops matching is the kind of fault that
 * gets reported as "the search is broken" weeks later.
 */

const CATEGORIES = [
  { id: 1, name: "South Indian" },
  { id: 2, name: "Beverages" },
];

const item = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Masala Dosa",
  price: 180,
  categoryId: 1,
  type: "VEG",
  isAvailable: true,
  category: { id: 1, name: "South Indian" },
  ...over,
});

const ITEMS = [
  item({ id: 11, name: "Masala Dosa", price: 180, categoryId: 1, type: "VEG" }),
  item({
    id: 12,
    name: "Filter Coffee",
    price: 60,
    categoryId: 2,
    type: "VEG",
    isAvailable: false,
    category: { id: 2, name: "Beverages" },
  }),
  item({
    id: 13,
    name: "Chicken 65",
    price: 240,
    categoryId: 1,
    type: "NON_VEG",
    category: { id: 1, name: "South Indian" },
  }),
];

const render = (items = ITEMS, categories = CATEGORIES) => {
  const { Wrapper } = hookWrapper(authenticatedState());
  return renderHook(() => useMenuItemsEditor(items, categories), { wrapper: Wrapper });
};

/** Applies filter state and returns the resulting names, in order. */
const namesAfter = (setup: (api: any) => void, items = ITEMS) => {
  const hook = render(items);
  act(() => setup(hook.result.current));
  return hook.result.current.filteredMenuItems.map((i: any) => i.name);
};

describe("useMenuItemsEditor — filtering", () => {
  it("returns everything, in the given order, with no filters set", () => {
    expect(namesAfter(() => {})).toEqual(["Masala Dosa", "Filter Coffee", "Chicken 65"]);
  });

  it("matches a search anywhere in the name, ignoring case", () => {
    expect(namesAfter((a) => a.setItemSearch("dosa"))).toEqual(["Masala Dosa"]);
    expect(namesAfter((a) => a.setItemSearch("COFFEE"))).toEqual(["Filter Coffee"]);
    expect(namesAfter((a) => a.setItemSearch("ILTE"))).toEqual(["Filter Coffee"]);
  });

  it("returns nothing for a search that matches nothing", () => {
    expect(namesAfter((a) => a.setItemSearch("pizza"))).toEqual([]);
  });

  it("filters by category, comparing the id as a string", () => {
    // The select's value is a string; the item's categoryId is a number.
    expect(namesAfter((a) => a.setItemCatFilter("2"))).toEqual(["Filter Coffee"]);
    expect(namesAfter((a) => a.setItemCatFilter("1"))).toEqual(["Masala Dosa", "Chicken 65"]);
  });

  it("filters by type", () => {
    expect(namesAfter((a) => a.setItemTypeFilter("NON_VEG"))).toEqual(["Chicken 65"]);
  });

  it("splits on availability", () => {
    expect(namesAfter((a) => a.setItemAvailFilter("Available"))).toEqual([
      "Masala Dosa",
      "Chicken 65",
    ]);
    expect(namesAfter((a) => a.setItemAvailFilter("Unavailable"))).toEqual(["Filter Coffee"]);
  });

  it("treats any availability value that is not 'Available' as unavailable", () => {
    // Pinned rather than endorsed: the check is `=== "Available" ? available :
    // !available`, so only that exact string means available and anything else
    // non-empty means the opposite. Fine while the select supplies both values;
    // worth knowing before adding a third option.
    expect(namesAfter((a) => a.setItemAvailFilter("anything-else"))).toEqual(["Filter Coffee"]);
  });

  it("combines filters, requiring all of them", () => {
    expect(
      namesAfter((a) => {
        a.setItemCatFilter("1");
        a.setItemTypeFilter("VEG");
      }),
    ).toEqual(["Masala Dosa"]);
  });

  it("combines a search with a filter that excludes the match", () => {
    expect(
      namesAfter((a) => {
        a.setItemSearch("dosa");
        a.setItemTypeFilter("NON_VEG");
      }),
    ).toEqual([]);
  });
});

describe("useMenuItemsEditor — price sort", () => {
  it("leaves the order alone until a direction is chosen", () => {
    expect(namesAfter(() => {})).toEqual(["Masala Dosa", "Filter Coffee", "Chicken 65"]);
  });

  it("sorts ascending", () => {
    expect(namesAfter((a) => a.setItemPriceSort("asc"))).toEqual([
      "Filter Coffee",
      "Masala Dosa",
      "Chicken 65",
    ]);
  });

  it("sorts descending", () => {
    expect(namesAfter((a) => a.setItemPriceSort("desc"))).toEqual([
      "Chicken 65",
      "Masala Dosa",
      "Filter Coffee",
    ]);
  });

  it("sorts what the filters left, not the whole menu", () => {
    expect(
      namesAfter((a) => {
        a.setItemCatFilter("1");
        a.setItemPriceSort("desc");
      }),
    ).toEqual(["Chicken 65", "Masala Dosa"]);
  });

  it("does not reorder the list it was given", () => {
    // `.sort` mutates, and it is called on the array `.filter` returns rather
    // than on menuItems — so the caller's array has to come back untouched.
    const items = [...ITEMS];
    const hook = render(items);
    act(() => hook.result.current.setItemPriceSort("asc"));
    expect(items.map((i) => i.name)).toEqual(["Masala Dosa", "Filter Coffee", "Chicken 65"]);
  });
});

describe("useMenuItemsEditor — mobile grouping", () => {
  it("groups by category name and counts the unavailable ones", () => {
    const { result } = render();
    expect(result.current.mobileItemGroups).toEqual([
      {
        name: "South Indian",
        items: [expect.objectContaining({ name: "Masala Dosa" }), expect.objectContaining({ name: "Chicken 65" })],
        unavailable: 0,
      },
      {
        name: "Beverages",
        items: [expect.objectContaining({ name: "Filter Coffee" })],
        unavailable: 1,
      },
    ]);
  });

  it("follows the order of `categories`, not the items", () => {
    // Beverages is second in CATEGORIES, so its group comes second even though
    // Filter Coffee appears before Chicken 65 in the item list.
    const { result } = render();
    expect(result.current.mobileItemGroups.map((g: any) => g.name)).toEqual([
      "South Indian",
      "Beverages",
    ]);
  });

  it("buckets an item with no category as Uncategorised", () => {
    const { result } = render([item({ id: 99, name: "Mystery", category: null })]);
    expect(result.current.mobileItemGroups[0].name).toBe("Uncategorised");
  });

  it("puts categories it does not recognise last, then alphabetically", () => {
    const rogue = [
      item({ id: 21, name: "Zeta", category: { name: "Zulu" } }),
      item({ id: 22, name: "Alpha", category: { name: "Alpha Cat" } }),
      item({ id: 23, name: "Known", category: { name: "Beverages" } }),
    ];
    const { result } = render(rogue);
    expect(result.current.mobileItemGroups.map((g: any) => g.name)).toEqual([
      "Beverages",
      "Alpha Cat",
      "Zulu",
    ]);
  });

  it("groups only what survived the filters", () => {
    const hook = render();
    act(() => hook.result.current.setItemCatFilter("2"));
    expect(hook.result.current.mobileItemGroups).toHaveLength(1);
    expect(hook.result.current.mobileItemGroups[0].name).toBe("Beverages");
  });

  it("is empty when nothing matches", () => {
    const hook = render();
    act(() => hook.result.current.setItemSearch("nothing"));
    expect(hook.result.current.mobileItemGroups).toEqual([]);
  });
});
