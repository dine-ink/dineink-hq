import { useMemo } from "react";

/**
 * Every figure Menu Management derives from its bills, menu items, ingredient
 * stock and item-to-ingredient mappings.

 * These were eight `const`s scattered down a 5,400-line component -- one at
 * line 561, the next at 1702, two more past 2000 -- and three different tabs
 * read them. Restock shows the inventory turnover, Analytics charts the
 * consumption, Item Mapping prints the average recipe cost, and the AI alerts
 * in between use the same numbers again. Extracting any one of those tabs meant
 * either duplicating the arithmetic or threading half a dozen props down.
 *
 * Pure, like useReportFinancials: no fetching, no state, no effects. The page
 * still owns loading; this only shapes what it loaded. That is also what makes
 * it testable without mounting anything, which none of this arithmetic was
 * before.
 */

export interface InventoryAnalytics {
  /** Per-ingredient consumption and cost, aggregated across every bill. */
  ingredientAnalytics: any[];
  /**
   * Pre-formatted strings, not numbers -- `.toFixed(...)`, or `0` when there is
   * nothing to average over. They are rendered directly, so returning numbers
   * here would print 63.33333333333333% where the page shows 63.
   */
  avgFoodCost: string | number;
  avgRecipeCost: string | number;
  avgProfitMargin: string;
  totalConsumptionValue: number;
  inventoryValue: number;
  /** Also pre-formatted: `.toFixed(2)`. */
  inventoryTurnover: string;
}

export function useInventoryAnalytics(
  bills: any[],
  menuItems: any[],
  allIngredients: any[],
  mappedItems: any[],
): InventoryAnalytics {
  const mappedMenuItems = menuItems.filter(
    (item: any) => item.menuItemIngredients?.length > 0,
  );

  const ingredientAnalytics = useMemo(() => {
    if (!menuItems.length || !bills.length) {
      return [];
    }
    const ingredientConsumptionMap: Record<string, any> = {};
    bills?.forEach((bill: any) => {
      bill.items?.forEach((billItem: any) => {
        const menuItem = menuItems.find(
          (m: any) => m.id === billItem.menuItemId,
        );

        if (!menuItem) return;
        const quantitySold = Number(billItem.quantity || 0);
        menuItem.menuItemIngredients?.forEach((mapping: any) => {
          const ingredient = mapping.ingredient;
          if (!ingredient) return;
          const key = ingredient.id;
          if (!ingredientConsumptionMap[key]) {
            ingredientConsumptionMap[key] = {
              ingredient: ingredient.name,
              category: ingredient.category?.name || "Other",
              unit: mapping.unit,
              consumed: 0,
              totalCost: 0,
            };
          }
          const mappingQty = Number(mapping.quantity || 0);
          const usedQty = mappingQty * quantitySold;
          const price = Number(ingredient.pricePerUnit || 0);
          let cost = 0;
          const mappingUnit = mapping.unit?.toLowerCase();
          const ingredientUnit = ingredient.unit?.toLowerCase();
          if (mappingUnit === ingredientUnit) {
            cost = usedQty * price;
          } else if (
            ingredientUnit === "kg" &&
            (mappingUnit === "gram" || mappingUnit === "gm")
          ) {
            cost = (usedQty / 1000) * price;
          } else if (ingredientUnit === "litre" && mappingUnit === "ml") {
            cost = (usedQty / 1000) * price;
          } else {
            cost = usedQty * price;
          }
          ingredientConsumptionMap[key].consumed += usedQty;
          ingredientConsumptionMap[key].totalCost += cost;
        });
      });
    });
    return Object.values(ingredientConsumptionMap);
  }, [bills, menuItems]);

  const avgFoodCost = (() => {
    // Items with no price set contribute nothing to the sum, so they must
    // also be excluded from the divisor — dividing by the full item count
    // (including unpriced items) silently understated the average.
    let totalFoodCostPct = 0;
    let pricedItemCount = 0;
    mappedMenuItems.forEach((item: any) => {
      const sellingPrice = Number(item.price || 0);
      if (sellingPrice <= 0) return;
      const recipeCost = (item.menuItemIngredients || []).reduce(
        (sum: number, mapping: any) => {
          const ingredient = mapping.ingredient;
          if (!ingredient) return sum;
          const qty = Number(mapping.quantity || 0);
          const price = Number(ingredient.pricePerUnit || 0);
          const mappingUnit = mapping.unit?.toLowerCase();
          const ingredientUnit = ingredient.unit?.toLowerCase();
          let cost = 0;
          if (mappingUnit === ingredientUnit) {
            cost = qty * price;
          } else if (
            ingredientUnit === "kg" &&
            (mappingUnit === "gram" || mappingUnit === "gm")
          ) {
            cost = (qty / 1000) * price;
          } else if (ingredientUnit === "litre" && mappingUnit === "ml") {
            cost = (qty / 1000) * price;
          } else {
            cost = qty * price;
          }
          return sum + cost;
        },
        0,
      );
      totalFoodCostPct += (recipeCost / sellingPrice) * 100;
      pricedItemCount++;
    });
    return pricedItemCount > 0
      ? (totalFoodCostPct / pricedItemCount).toFixed(1)
      : "0";
  })();

  const avgRecipeCost =
    mappedItems.length > 0
      ? (
          mappedItems.reduce((acc: number, item: any) => {
            const total = (item.menuItemIngredients || []).reduce(
              (sum: number, mapping: any) => {
                const ingredient = mapping.ingredient;
                if (!ingredient) return sum;
                const qty = Number(mapping.quantity || 0);
                const price = Number(ingredient.pricePerUnit || 0);
                const mappingUnit = mapping.unit?.toLowerCase()?.trim();
                const ingredientUnit = ingredient.unit?.toLowerCase()?.trim();
                let cost = 0;
                /* SAME UNIT */
                if (mappingUnit === ingredientUnit) {
                  cost = qty * price;
                } else if (
                  /* KG -> GRAM */
                  ingredientUnit === "kg" &&
                  (mappingUnit === "gram" || mappingUnit === "gm")
                ) {
                  cost = (qty / 1000) * price;
                } else if (ingredientUnit === "litre" && mappingUnit === "ml") {
                  /* LITRE -> ML */
                  cost = (qty / 1000) * price;
                } else if (
                  /* PIECE */
                  ingredientUnit === "piece" &&
                  (mappingUnit === "piece" || mappingUnit === "pc")
                ) {
                  cost = qty * price;
                } else {
                  /* FALLBACK */
                  cost = qty * price;
                }
                return sum + Number(cost || 0);
              },
              0,
            );
            return acc + Number(total || 0);
          }, 0) / mappedItems.length
        ).toFixed(0)
      : 0;

  const avgProfitMargin = (100 - Number(avgFoodCost)).toFixed(1);

  const totalConsumptionValue = ingredientAnalytics.reduce(
    (acc: number, item: any) => {
      return acc + Number(item.totalCost || 0);
    },
    0,
  );

  const inventoryValue = allIngredients.reduce((acc: number, item: any) => {
    return acc + Number(item.quantity || 0) * Number(item.pricePerUnit || 0);
  }, 0);

  const inventoryTurnover = (
    totalConsumptionValue / Math.max(inventoryValue, 1)
  ).toFixed(2);

  return {
    ingredientAnalytics,
    avgFoodCost,
    avgRecipeCost,
    avgProfitMargin,
    totalConsumptionValue,
    inventoryValue,
    inventoryTurnover,
  };
}
