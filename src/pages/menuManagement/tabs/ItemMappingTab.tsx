import { useMemo, useState } from "react";
import {
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { MdRestaurant, MdRestaurantMenu } from "react-icons/md";
import MobileTableCards from "@/components/common/MobileTableCards";
import { iconMap, isVegType } from "@/pages/menuManagement/menuDisplay";
import type { UseIngredientMapping } from "@/pages/menuManagement/useIngredientMapping";
import { nonNegative } from "@/utils/numberInput";

/**
 * Item Mapping — which ingredients go into each menu item, in what quantity,
 * and what the resulting recipe costs against the selling price.
 *
 * Extracted from MenuManagement.tsx as part of breaking up a 6,000-line
 * component. It borrowed twelve values from the page; eleven of them were one
 * workflow -- the selection, the mappings, the save, the AI suggestion and the
 * costs derived from all of it -- and became useIngredientMapping. The tab takes
 * that object and three lists.
 */

interface ItemMappingTabProps {
  mapping: UseIngredientMapping;
  menuItems: any[];
  allIngredients: any[];
  avgRecipeCost: string | number;
}

export default function ItemMappingTab({ mapping, menuItems, allIngredients, avgRecipeCost }: ItemMappingTabProps) {
  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const {
    selectedMenuItem,
    setSelectedMenuItem,
    ingredientMappings,
    setIngredientMappings,
    mappedItems,
    unmappedItems,
    handleAddMappingIngredient,
    handleSaveMapping,
    handleAISuggest,
    totalRecipeCost,
    foodCostPercentage,
    margin,
  } = mapping;

  // The search box above the list. It rendered without value/onChange, so
  // typing into it filtered nothing. Matches on the dish name or its category.
  const [search, setSearch] = useState("");
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter(
      (item: any) =>
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.category?.name || "").toLowerCase().includes(q),
    );
  }, [menuItems, search]);

  return (
            <div className="space-y-4">
              {/* ================= HEADER ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b10000] shadow-sm">
                      <MdRestaurantMenu className="text-[24px] text-white" />
                    </div>

                    <div>
                      <h2 className="text-[24px] font-black tracking-tight text-gray-900">
                        Item Mapping
                      </h2>

                      <p className="mt-1 text-[13px] text-gray-500">
                        Recipe costing & ingredient intelligence
                      </p>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* MENU */}

                    <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                      <MdRestaurantMenu className="text-indigo-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-400">
                          Menu
                        </p>

                        <p className="mt-1 text-[16px] font-black text-indigo-700">
                          {menuItems.length}
                        </p>
                      </div>
                    </div>

                    {/* MAPPED */}

                    <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                          Mapped
                        </p>

                        <p className="mt-1 text-[16px] font-black text-emerald-700">
                          {mappedItems.length}
                        </p>
                      </div>
                    </div>

                    {/* UNMAPPED */}

                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-400">
                          Unmapped
                        </p>

                        <p className="mt-1 text-[16px] font-black text-red-700">
                          {unmappedItems.length}
                        </p>
                      </div>
                    </div>

                    {/* COST */}

                    <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                      <CurrencyRupeeIcon className="h-4 w-4 text-orange-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400">
                          Avg Cost
                        </p>

                        <p className="mt-1 text-[16px] font-black text-orange-700">
                          ₹{avgRecipeCost}
                        </p>
                      </div>
                    </div>

                    {/* BUTTONS */}

                    <div className="ml-1 flex items-center gap-2">
                      <button
                        onClick={handleAISuggest}
                        className="
                h-10
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                text-[12px]
                font-semibold
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
              "
                      >
                        AI Suggest
                      </button>

                      <button
                        onClick={handleSaveMapping}
                        className="h-10 rounded-xl bg-[#b10000] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= MAIN ================= */}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr]">
                {/* ================= LEFT ================= */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {/* SEARCH */}

                  <div className="border-b border-gray-100 p-3">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search menu items"
                        placeholder="Search menu items..."
                        className="
                h-10
                w-full
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                pl-10
                pr-3
                text-[13px]
                outline-none
                transition
                focus:border-red-200
                focus:bg-white
              "
                      />
                    </div>
                  </div>

                  {/* MENU LIST */}

                  <div className="max-h-[720px] overflow-auto p-3">
                    <div className="space-y-2">
                      {visibleItems.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedMenuItem(item);
                            setIngredientMappings(
                              item.menuItemIngredients || [],
                            );
                          }}
                          className={`
                  cursor-pointer
                  rounded-2xl
                  border
                  p-3
                  transition-all

                  ${
                    selectedMenuItem?.id === item.id
                      ? "border-[#b10000] bg-red-50 shadow-sm"
                      : "border-gray-100 bg-white hover:bg-gray-50"
                  }
                `}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-[14px] font-semibold text-gray-900">
                                {item.name}
                              </h3>

                              <p className="mt-1 text-[11px] text-gray-500">
                                {item.category?.name || "No Category"}
                              </p>
                            </div>

                            <span
                              className={`
                      rounded-full
                      px-2.5
                      py-1
                      text-[10px]
                      font-semibold

                      ${
                        isVegType(item.type)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }
                    `}
                            >
                              {item.type}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-[15px] font-bold text-gray-900">
                              ₹{item.price}
                            </p>

                            <span
                              className={`
                      rounded-full
                      px-2.5
                      py-1
                      text-[10px]
                      font-semibold

                      ${
                        item.menuItemIngredients?.length > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-700"
                      }
                    `}
                            >
                              {item.menuItemIngredients?.length > 0
                                ? "Mapped"
                                : "Unmapped"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {visibleItems.length === 0 && (
                        <p className="px-2 py-6 text-center text-[12px] text-gray-500">
                          {search.trim()
                            ? `No menu items match "${search.trim()}".`
                            : "No menu items yet."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ================= RIGHT ================= */}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {/* TOP */}

                  <div className="border-b border-gray-100 px-4 py-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      {/* LEFT */}

                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b10000]">
                          {(() => {
                            const Icon =
                              iconMap[selectedMenuItem?.category?.icon] ||
                              MdRestaurant;

                            return <Icon className="text-[24px] text-white" />;
                          })()}
                        </div>

                        <div>
                          <h2 className="text-[22px] font-black tracking-tight text-gray-900">
                            {selectedMenuItem?.name || "Select Menu Item"}
                          </h2>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                              {selectedMenuItem?.category?.name || "Category"}
                            </span>

                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                              ₹{selectedMenuItem?.price || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ANALYTICS */}

                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          {
                            label: "Recipe",
                            value: `₹${totalRecipeCost.toFixed(2)}`,
                            bg: "bg-indigo-50",
                          },
                          {
                            label: "Margin",
                            value: `${margin}%`,
                            bg: "bg-emerald-50",
                          },
                          {
                            label: "Prep",
                            value: `${selectedMenuItem?.prepTime || 0}m`,
                            bg: "bg-orange-50",
                          },
                          {
                            label: "Food Cost",
                            value: `${foodCostPercentage}%`,
                            bg: "bg-red-50 border border-red-100",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`rounded-xl px-3 py-2 ${item.bg}`}
                          >
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              {item.label}
                            </p>

                            <p className="mt-1 text-[16px] font-black text-gray-900">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* TABLE */}

                  <div className="overflow-auto">
                    <MobileTableCards>
                    <table className="min-w-full">
                      <thead className="border-b border-gray-100 bg-gray-50">
                        <tr>
                          {[
                            "Ingredient",
                            "Qty",
                            "Unit",
                            "Cost",
                            "Waste %",
                            "Actions",
                          ].map((head) => (
                            <th
                              key={head}
                              className="
                      whitespace-nowrap
                      px-4
                      py-3
                      text-left
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-gray-400
                    "
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {ingredientMappings.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <select
                                value={String(row.ingredientId || "")}
                                onChange={(e) =>
                                  setIngredientMappings((prev) =>
                                    prev.map((r, i) =>
                                      i === index
                                        ? { ...r, ingredientId: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className="
                        h-10
                        w-full
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        px-3
                        text-[13px]
                        outline-none
                        focus:border-red-200
                      "
                              >
                                <option value="">Select Ingredient</option>

                                {allIngredients.map((ingredient: any) => (
                                  <option
                                    key={ingredient.id}
                                    value={String(ingredient.id)}
                                  >
                                    {ingredient.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number" {...nonNegative}
                                value={row.quantity || ""}
                                onChange={(e) =>
                                  setIngredientMappings((prev) =>
                                    prev.map((r, i) =>
                                      i === index
                                        ? { ...r, quantity: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className="
                        h-10
                        w-24
                        rounded-xl
                        border
                        border-gray-200
                        px-3
                        text-[13px]
                        outline-none
                        focus:border-red-200
                      "
                              />
                            </td>

                            <td className="px-4 py-3">
                              <select
                                value={row.unit || "gm"}
                                onChange={(e) =>
                                  setIngredientMappings((prev) =>
                                    prev.map((r, i) =>
                                      i === index
                                        ? { ...r, unit: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className="
                        h-10
                        rounded-xl
                        border
                        border-gray-200
                        px-3
                        text-[13px]
                        outline-none
                        focus:border-red-200
                      "
                              >
                                {["gm", "Kg", "Litre", "ml", "pc"].map(
                                  (unit) => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ),
                                )}
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[12px] font-bold text-indigo-600">
                                {(() => {
                                  const ing = allIngredients.find(
                                    (i: any) =>
                                      String(i.id) === String(row.ingredientId),
                                  );
                                  const ppu =
                                    parseFloat(ing?.pricePerUnit) || 0;
                                  const qty = parseFloat(row.quantity) || 0;
                                  const ingUnit = ing?.unit || "";
                                  const mapUnit = row.unit || "gm";
                                  let pricePerMapUnit = ppu;
                                  if (ingUnit === "Kg" && mapUnit === "gm")
                                    pricePerMapUnit = ppu / 1000;
                                  else if (ingUnit === "gm" && mapUnit === "Kg")
                                    pricePerMapUnit = ppu * 1000;
                                  else if (
                                    ingUnit === "Litre" &&
                                    mapUnit === "ml"
                                  )
                                    pricePerMapUnit = ppu / 1000;
                                  else if (
                                    ingUnit === "ml" &&
                                    mapUnit === "Litre"
                                  )
                                    pricePerMapUnit = ppu * 1000;
                                  return `₹${(pricePerMapUnit * qty).toFixed(2)}`;
                                })()}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number" {...nonNegative}
                                value={row.wastage || ""}
                                onChange={(e) =>
                                  setIngredientMappings((prev) =>
                                    prev.map((r, i) =>
                                      i === index
                                        ? { ...r, wastage: e.target.value }
                                        : r,
                                    ),
                                  )
                                }
                                className="
                        h-10
                        w-20
                        rounded-xl
                        border
                        border-gray-200
                        px-3
                        text-[13px]
                        outline-none
                        focus:border-red-200
                      "
                              />
                            </td>

                            <td className="px-4 py-3">
                              <button
                                onClick={() =>
                                  setIngredientMappings((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  )
                                }
                                className="
                        rounded-xl
                        border
                        border-red-200
                        bg-red-50
                        px-3
                        py-2
                        text-[12px]
                        font-semibold
                        text-red-700
                        transition
                        hover:bg-red-100
                      "
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </MobileTableCards>

                    {/* FOOTER */}

                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <button
                        onClick={handleAddMappingIngredient}
                        className="
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-2
                text-[12px]
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-100
              "
                      >
                        + Add Ingredient
                      </button>

                      <button
                        onClick={handleSaveMapping}
                        className="rounded-xl bg-[#b10000] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                      >
                        Save Mapping
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
}
