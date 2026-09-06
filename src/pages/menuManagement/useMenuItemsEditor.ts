import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useAppSelector } from "@/store";

/**
 * The menu list: its filters, its sort, and the create/edit/delete of items and
 * categories.
 *
 * The Menu tab borrowed thirty-two values from the page, more than any other,
 * and every one of them was used by that tab alone. They could have gone
 * straight into the tab component the way the SOP checklists did, but that
 * would have made a single file of about a thousand lines. Splitting the state
 * and handlers out here leaves two files that each fit in the head.
 *
 * The filtering and grouping are recomputed on every render, exactly as they
 * were on the page. Nothing here is memoised that was not memoised before.
 */

export function useMenuItemsEditor(
  menuItems: any[],
  // Dispatch, not a plain setter: the handlers use the updater form, and a
  // `(items: any[]) => void` signature rejects it.
  setMenuItems: Dispatch<SetStateAction<any[]>>,
  categories: any[],
  setCategories: Dispatch<SetStateAction<any[]>>,
) {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  // ── Menu tab CRUD state ──────────────────────────────────────────────────
  const [itemSearch, setItemSearch] = useState("");
  const [itemCatFilter, setItemCatFilter] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState("");
  const [itemPriceSort, setItemPriceSort] = useState("");
  const [itemAvailFilter, setItemAvailFilter] = useState("");
  // Mobile menu list only — which category accordions are open. Collapsed by
  // default so a long menu is a short list of categories to begin with.
  const [openItemCategories, setOpenItemCategories] = useState<
    Record<string, boolean>
  >({});
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const blankItemForm = {
    name: "",
    categoryId: "",
    type: "VEG",
    price: "",
    prepTime: "",
    description: "",
    isAvailable: true,
  };
  const [itemForm, setItemForm] = useState<any>(blankItemForm);
  const [showMenuCategory, setShowMenuCategory] = useState(false);
  const [menuCatName, setMenuCatName] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  // ── Menu CRUD helpers ────────────────────────────────────────────────────

  const handleCreateMenuCategory = async () => {
    const name = menuCatName.trim();
    if (!name) return;
    try {
      const res = await fetch(`${API_URL}/api/restaurant/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ restaurantId: user.restaurantId, name }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev: any[]) => [...prev, data.data]);
        setMenuCatName("");
        setShowMenuCategory(false);
      } else {
        // The dialog stays open on failure so the typed name survives a retry.
        alert(data.message || "Failed to add that category");
      }
    } catch {
      alert("Failed to add that category");
    }
  };

  const handleSaveMenuItem = async () => {
    if (!itemForm.name.trim() || !itemForm.price) return;
    setSavingItem(true);
    try {
      const payload = {
        ...itemForm,
        restaurantId: user.restaurantId,
        branchId: user.branchId || null,
        price: Number(itemForm.price),
        prepTime: itemForm.prepTime ? Number(itemForm.prepTime) : 0,
        categoryId: itemForm.categoryId ? Number(itemForm.categoryId) : null,
      };
      const isEdit = !!editingItem;
      const url = isEdit
        ? `${API_URL}/api/restaurant/menu-items/${editingItem.id}`
        : `${API_URL}/api/restaurant/menu-items`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems((prev: any[]) =>
          isEdit
            ? prev.map((m: any) => (m.id === editingItem.id ? data.data : m))
            : [...prev, data.data],
        );
        setShowAddItemForm(false);
        setEditingItem(null);
        setItemForm(blankItemForm);
      }
    } catch {
      /* silent */
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      const res = await fetch(`${API_URL}/api/restaurant/menu-items/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success)
        setMenuItems((prev: any[]) => prev.filter((m: any) => m.id !== id));
      else alert(data.message || "Failed to delete this menu item");
    } catch {
      alert("Failed to delete this menu item");
    }
  };

  const handleToggleAvailability = async (item: any) => {
    try {
      const res = await fetch(
        `${API_URL}/api/restaurant/menu-items/${item.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isAvailable: !item.isAvailable }),
        },
      );
      const data = await res.json();
      if (data.success)
        setMenuItems((prev: any[]) =>
          prev.map((m: any) => (m.id === item.id ? data.data : m)),
        );
      // A rejected toggle left the availability switch showing its old value,
      // which reads as the click not registering rather than being refused.
      else alert(data.message || "Failed to change this item's availability");
    } catch {
      alert("Failed to change this item's availability");
    }
  };

  // ── Filtered menu items ───────────────────────────────────────────────────
  const filteredMenuItems = menuItems
    .filter((item: any) => {
      const matchSearch =
        !itemSearch ||
        item.name.toLowerCase().includes(itemSearch.toLowerCase());
      const matchCat =
        !itemCatFilter || String(item.categoryId) === itemCatFilter;
      const matchType = !itemTypeFilter || item.type === itemTypeFilter;
      const matchAvail =
        !itemAvailFilter ||
        (itemAvailFilter === "Available"
          ? item.isAvailable
          : !item.isAvailable);
      return matchSearch && matchCat && matchType && matchAvail;
    })
    .sort((a: any, b: any) => {
      if (itemPriceSort === "asc") return a.price - b.price;
      if (itemPriceSort === "desc") return b.price - a.price;
      return 0;
    });

  // The same filtered items grouped by category, for the mobile accordion.
  // Order follows `categories` so the phone list matches the category tab, with
  // any uncategorised items last.
  const mobileItemGroups = (() => {
    const groups = new Map<string, any[]>();
    for (const item of filteredMenuItems) {
      const name = item.category?.name || "Uncategorised";
      const bucket = groups.get(name);
      if (bucket) bucket.push(item);
      else groups.set(name, [item]);
    }
    const order = categories.map((c: any) => c.name);
    return [...groups.entries()]
      .sort(([a], [b]) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        // Unknown categories sort to the end, then alphabetically.
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
      .map(([name, items]) => ({
        name,
        items,
        unavailable: items.filter((i: any) => !i.isAvailable).length,
      }));
  })();

  return {
    itemSearch, setItemSearch,
    itemCatFilter, setItemCatFilter,
    itemTypeFilter, setItemTypeFilter,
    itemPriceSort, setItemPriceSort,
    itemAvailFilter, setItemAvailFilter,
    openItemCategories, setOpenItemCategories,
    showAddItemForm, setShowAddItemForm,
    editingItem, setEditingItem,
    blankItemForm,
    itemForm, setItemForm,
    showMenuCategory, setShowMenuCategory,
    menuCatName, setMenuCatName,
    savingItem,
    handleCreateMenuCategory,
    handleSaveMenuItem,
    handleDeleteMenuItem,
    handleToggleAvailability,
    filteredMenuItems,
    mobileItemGroups,
  };
}

export type UseMenuItemsEditor = ReturnType<typeof useMenuItemsEditor>;
