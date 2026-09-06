import { useState } from "react";
import { useAppSelector } from "@/store";

/**
 * Which ingredients go into which menu item, and what that recipe costs.
 *
 * The Item Mapping tab borrowed twelve values from the page -- three pieces of
 * state, three handlers, two filtered lists and three derived costs. That is
 * the same signal useAddOns gave: the tab is not the owner, but the page was
 * not either, and threading twelve props down would only have moved the mess.
 *
 * Unlike useInventoryAnalytics this hook is not pure. It holds the selection,
 * fetches the mappings and writes them back, on purpose -- the mapping editor
 * is one stateful workflow, and separating the arithmetic from the state it is
 * computed over would leave two halves that only make sense together.
 *
 * The page still reads mappedItems, ingredientMappings and totalRecipeCost for
 * its AI alerts, and calls refresh() from its own load effect.
 */

export function useIngredientMapping(
  menuItems: any[],
  // The mapping fetch returns the menu items with their mappings attached, so
  // it refreshes the page's own list as a side effect. Passed in rather than
  // duplicated: one list, one owner.
  setMenuItems: (items: any[]) => void,
) {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [_mappingLoading, setMappingLoading] = useState(false);
  const [ingredientMappings, setIngredientMappings] = useState<any[]>([]);

  const mappedItems = menuItems.filter(
    (item: any) => item.menuItemIngredients?.length > 0,
  );
  const unmappedItems = menuItems.filter(
    (item: any) =>
      !item.menuItemIngredients || item.menuItemIngredients.length === 0,
  );

  const handleAddMappingIngredient = () => {
    setIngredientMappings([
      {
        ingredientId: "",
        ingredient: null,
        quantity: "",
        unit: "gm",
        wastage: 0,
      },
      ...ingredientMappings,
    ]);
  };

  const handleSaveMapping = async () => {
    try {
      setMappingLoading(true);

      const payload = {
        menuItemId: selectedMenuItem.id,
        ingredients: ingredientMappings.map((item: any) => ({
          ingredientId: Number(item.ingredientId || item.ingredient?.id),
          quantity: Number(item.quantity),
          unit: item.unit,
          wastage: Number(item.wastage || 0),
        })),
      };

      const res = await fetch(
        `${API_URL}/api/inventory/save-menu-item-mapping`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (data.success) {
        alert("Mapping saved");
        fetchMenuItemMappings();
      } else {
        // `alert(undefined)` renders the string "undefined" when the server
        // sends no message, so the fallback is not cosmetic.
        alert(data.message || "Failed to save this recipe mapping");
      }
    } catch {
      alert("Failed to save this recipe mapping");
    } finally {
      setMappingLoading(false);
    }
  };

  const fetchMenuItemMappings = async () => {
    try {
      const restaurantId = user.restaurantId;
      const res = await fetch(
        `${API_URL}/api/inventory/${restaurantId}/get-mapped-menu`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (data.success) {
        setMenuItems(data.data);

        if (data.data.length) {
          setSelectedMenuItem(data.data[0]);

          setIngredientMappings(data.data[0].menuItemIngredients || []);
        }
      }
    } catch {
      // fetch error
    }
  };

  const handleAISuggest = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/ingredients/ai-suggestIngredients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            menuItemId: selectedMenuItem?.id,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setIngredientMappings(data.data);
      } else {
        // The AI suggestion is a slow call behind a button. With nothing shown
        // on failure, the button simply appeared to do nothing.
        alert(data.message || "Couldn't suggest ingredients for this item");
      }
    } catch {
      alert("Couldn't suggest ingredients for this item");
    }
  };

  const totalRecipeCost = ingredientMappings.reduce((acc: number, row: any) => {
    const ingredient = row.ingredient;
    if (!ingredient) return acc;
    const qty = Number(row.quantity || 0);
    const pricePerUnit = Number(ingredient.pricePerUnit || 0);
    let cost = 0;
    /* WEIGHT */
    if (row.unit === "gm") {
      cost = (qty / 1000) * pricePerUnit;
    } else if (row.unit === "Kg") {
      cost = qty * pricePerUnit;
    } else if (row.unit === "ml") {
      /* LIQUID */
      cost = (qty / 1000) * pricePerUnit;
    } else if (row.unit === "Litre") {
      cost = qty * pricePerUnit;
    } else {
      /* PIECE */
      cost = qty * pricePerUnit;
    }
    return acc + cost;
  }, 0);

  const sellingPrice = Number(selectedMenuItem?.price || 0);
  const foodCostPercentage =
    sellingPrice > 0 ? ((totalRecipeCost / sellingPrice) * 100).toFixed(1) : 0;
  const margin =
    sellingPrice > 0 ? (100 - Number(foodCostPercentage)).toFixed(1) : 0;

  return {
    selectedMenuItem,
    setSelectedMenuItem,
    ingredientMappings,
    setIngredientMappings,
    mappedItems,
    unmappedItems,
    handleAddMappingIngredient,
    handleSaveMapping,
    handleAISuggest,
    refresh: fetchMenuItemMappings,
    totalRecipeCost,
    foodCostPercentage,
    margin,
  };
}

export type UseIngredientMapping = ReturnType<typeof useIngredientMapping>;
