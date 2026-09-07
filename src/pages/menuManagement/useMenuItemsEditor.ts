import { useState } from "react";
import { useAppSelector } from "@/store";
import {
  useCreateMenuCategoryMutation,
  useSaveMenuItemMutation,
  useDeleteMenuItemMutation,
  useSetMenuItemAvailabilityMutation,
} from "@/store/api/menuApi";
import { notify } from "@/utils/notify";

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

/**
 * Both setters this used to take are gone. They existed so the write handlers
 * could patch the page's arrays by hand — map after an edit, filter after a
 * delete, append after a create. The cache tag does that now, so the hook only
 * reads.
 */
export function useMenuItemsEditor(menuItems: any[], categories: any[]) {
  const { user } = useAppSelector((s) => s.auth);

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

  const [createMenuCategory] = useCreateMenuCategoryMutation();
  const [saveMenuItemMutation, { isLoading: savingItem }] = useSaveMenuItemMutation();
  const [deleteMenuItemMutation] = useDeleteMenuItemMutation();
  const [setAvailability] = useSetMenuItemAvailabilityMutation();

  // ── Menu CRUD helpers ────────────────────────────────────────────────────

  const handleCreateMenuCategory = async () => {
    const name = menuCatName.trim();
    if (!name) return;
    try {
      await createMenuCategory({ restaurantId: user.restaurantId, name }).unwrap();
      setMenuCatName("");
      setShowMenuCategory(false);
    } catch {
      // The dialog stays open on failure so the typed name survives a retry.
      notify("Failed to add that category");
    }
  };

  const handleSaveMenuItem = async () => {
    if (!itemForm.name.trim() || !itemForm.price) return;
    try {
      await saveMenuItemMutation({
        id: editingItem?.id,
        payload: {
          ...itemForm,
          restaurantId: user.restaurantId,
          branchId: user.branchId || null,
          price: Number(itemForm.price),
          prepTime: itemForm.prepTime ? Number(itemForm.prepTime) : 0,
          categoryId: itemForm.categoryId ? Number(itemForm.categoryId) : null,
        },
      }).unwrap();
      setShowAddItemForm(false);
      setEditingItem(null);
      setItemForm(blankItemForm);
    } catch {
      // This path said nothing at all before: a rejected save closed no dialog
      // and raised no message, so the item simply never appeared. The form
      // stays open and populated.
      notify("Failed to save this menu item");
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await deleteMenuItemMutation(id).unwrap();
    } catch {
      notify("Failed to delete this menu item");
    }
  };

  const handleToggleAvailability = async (item: any) => {
    try {
      await setAvailability({ id: item.id, isAvailable: !item.isAvailable }).unwrap();
    } catch {
      // A rejected toggle leaves the switch showing its old value, which reads
      // as the click not registering rather than being refused.
      notify("Failed to change this item's availability");
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
