import { useEffect, useRef, useState } from "react";
import { useTabFromQuery } from "@/hooks/useTabFromQuery";
import { useGetMenuCategoriesQuery } from "@/store/api/menuApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { useAddOns } from "./useAddOns";
import {
  inventoryApi,
  useGetMenuManagementQuery,
  useGetDailyAuditCountQuery,
  useSaveRestockHistoryMutation,
} from "@/store/api/inventoryApi";
import { billsApi, useGetBillsQuery } from "@/store/api/billsApi";
import {
  useAttachAddOnGroupMutation,
  useDetachAddOnGroupMutation,
  addonsApi,
} from "@/store/api/addonsApi";
import MenuTab from "./tabs/MenuTab";
import IngredientsTab from "./tabs/IngredientsTab";
import ItemMappingTab from "./tabs/ItemMappingTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import RestockTab from "./tabs/RestockTab";
import { useInventoryAnalytics } from "./useInventoryAnalytics";
import { useIngredientMapping } from "./useIngredientMapping";
import { useIngredientEditor } from "./useIngredientEditor";
import { useMenuItemsEditor } from "./useMenuItemsEditor";
import OperationsTab from "./tabs/OperationsTab";
import AddOnsTab from "./tabs/AddOnsTab";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { loadWorkbook, sheetToJson } from "@/utils/readExcel";
import {
  ArrowPathRoundedSquareIcon,
  BanknotesIcon,
  CakeIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CloudArrowUpIcon,
  CubeIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  FireIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import {
  ShoppingCartIcon,
  ArrowTrendingDownIcon,
  ArchiveBoxIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/solid";
import {
  MdRestaurant,
  MdLocalCafe,
  MdLocalBar,
  MdWineBar,
  MdBakeryDining,
  MdLocalPizza,
  MdFastfood,
  MdCoffee,
  MdCake,
  MdIcecream,
  MdRiceBowl,
  MdDinnerDining,
  MdRamenDining,
  MdSoupKitchen,
  MdOutdoorGrill,
  MdSetMeal,
  MdKebabDining,
  MdEmojiFoodBeverage,
  MdLiquor,
  MdTakeoutDining,
  MdDeliveryDining,
  MdLocalDining,
  MdStorefront,
  MdBrunchDining,
  MdTapas,
  MdRestaurantMenu,
  MdFlatware,
  MdLunchDining,
  MdBreakfastDining,
} from "react-icons/md";
import {
  GiNoodles,
  GiSandwich,
  GiSteak,
  GiChickenLeg,
  GiWok,
  GiTacos,
  GiHotDog,
  GiCupcake,
  GiShrimp,
  GiSushis,
  GiDumpling,
} from "react-icons/gi";
import {
  FaLeaf,
  FaEgg,
  FaCocktail,
  FaBeer,
  FaCheese,
  FaFish,
} from "react-icons/fa";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import MobileTableCards from "@/components/common/MobileTableCards";
import MenuEngineeringMatrixTab from "./tabs/MenuEngineeringMatrixTab";
import { notify } from "@/utils/notify";


const tabs = [
  {
    id: "menu",
    name: "Menu",
    icon: ClipboardDocumentListIcon,
    description: "Manage all menu items, categories and pricing",
  },

  {
    id: "addons",
    name: "Add-Ons",
    icon: PuzzlePieceIcon,
    description: "Extra toppings and options — extra cheese, paneer, etc.",
  },

  {
    id: "ingredients",
    name: "Ingredients",
    icon: CubeIcon,
    description: "Manage inventory ingredients and stock",
  },

  {
    id: "restock",
    name: "Restock",
    icon: ArrowPathRoundedSquareIcon,
    description: "Track restocking and purchase entries",
  },

  {
    id: "mapping",
    name: "Item Mapping",
    icon: Squares2X2Icon,
    description: "Map ingredients and quantities for menu items",
  },

  {
    id: "analytics",
    name: "Analytics",
    icon: ChartBarIcon,
    description: "Inventory ageing, wastage and operational analytics",
  },

  {
    id: "engineering",
    name: "Menu Engineering",
    icon: ChartBarIcon,
    description: "Classify dishes by popularity and profit margin",
  },

  {
    id: "operations",
    name: "Operations",
    icon: ClipboardDocumentCheckIcon,
    description: "SOP checklists for prep, portioning and hygiene",
  },
];

const TAB_IDS = tabs.map((t) => t.id);

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState("menu");
  // The Getting Started guide links straight to Ingredients and Item Mapping.
  useTabFromQuery(TAB_IDS, setActiveTab);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restockHistory, setRestockHistory] = useState<any[]>([]);
  const [attachModal, setAttachModal] = useState<{
    open: boolean;
    item: any | null;
    attachedIds: Set<number>;
  }>({
    open: false,
    item: null,
    attachedIds: new Set(),
  });
  const [uploadingRestock, setUploadingRestock] = useState(false);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  // Whether a closing-stock audit has been filed today. The query returns null
  // when the check itself failed, which is not the same as "none filed" — the
  // page nags only for the second.
  const today = new Date().toISOString().split("T")[0];
  const { data: todayAuditCount = null } = useGetDailyAuditCountQuery(
    { branchId: selectedBranch?.id as number, date: today },
    { skip: !selectedBranch?.id },
  );
  const [selectedWeek, setSelectedWeek] = useState("week1");

  // Menu categories come from their own endpoint. The menu-management
  // payload also carries a `categories` field, but that is the ingredient
  // category table; feeding it to the Menu tab gave its dropdowns Grains and
  // Dairy and saved dishes against ingredient-category ids.
  const { data: menuCategories = [] } = useGetMenuCategoriesQuery(
    user?.restaurantId as number,
    { skip: !user?.restaurantId },
  );

  // The menu list: filters, sort, and the create/edit/delete of items and
  // categories. Nothing outside the Menu tab reads any of it.
  const menuEditor = useMenuItemsEditor(menuItems, menuCategories);

  // The ingredient stock editor. The page keeps `ingredients` in view because
  // allIngredients is flattened from it and three other tabs read that.
  const ingredientEditor = useIngredientEditor(setLoading);
  const { ingredients, setIngredients } = ingredientEditor;

  const allIngredients: any[] = Object.values(
    ingredients || {},
  ).flat() as any[];


  /**
   * Bounded to the current month — matches Insights.tsx's own Inventory
   * Turnover scope (also hardcoded to the current month, not the global
   * date-range picker). Before that bound existed this pulled every
   * non-cancelled bill ever placed at the branch, so the turnover figure grew
   * with restaurant age instead of being comparable.
   */
  const monthRange = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(lastDay).padStart(2, "0")}` };
  })();

  const { data: bills = [] } = useGetBillsQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: selectedBranch?.id,
      from: monthRange.from,
      to: monthRange.to,
    },
    { skip: !user?.restaurantId || !selectedBranch?.id },
  );






  // The eight derived figures Restock, Analytics, Item Mapping and the AI
  // alerts all read. See useInventoryAnalytics for why they are not inline.
  // The Item Mapping editor -- selection, mappings, recipe cost. The page
  // reads three of these for its AI alerts and its load effect, and hands the
  // whole object to the tab.
  const mapping = useIngredientMapping(menuItems, setMenuItems);
  const { mappedItems, ingredientMappings, setSelectedMenuItem } = mapping;
  const fetchMenuItemMappings = mapping.refresh;

  const analytics = useInventoryAnalytics(bills, menuItems, allIngredients, mappedItems);
  // Restock and Analytics take the whole object; the AI alerts and the Item
  // Mapping tab, both still on this page, read these two by name.
  const { ingredientAnalytics, avgRecipeCost } = analytics;


  const downloadInventoryTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    const now = new Date();
    const currentMonth = now.toLocaleString("default", { month: "long" });
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;

    /* =========================================================
     DATA SOURCE — fetch fresh from backend in parallel so we always
     have the latest data with no stale-state or race-condition issues
  ========================================================= */

    const monthStart = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-01`;
    const lastDay = new Date(currentYear, currentMonthNum, 0).getDate();
    const monthEnd = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    let savedWeeks: Record<string, any[]> = {};
    let freshMenuItems: any[] = [];
    let monthBills: any[] = [];

    try {
      // `forceRefetch` on all three, on purpose. The template is a file someone
      // is about to work from offline, and the comment above is right that it
      // must not be built from stale state. Going through the cache layer still
      // buys the shared auth and envelope handling; it just declines the cache.
      const [restockRecords, mapped, monthBillRows] = await Promise.all([
        dispatch(
          inventoryApi.endpoints.getRestockHistory.initiate(
            { restaurantId: user.restaurantId, branchId: selectedBranch?.id },
            { forceRefetch: true },
          ),
        ).unwrap(),
        dispatch(
          inventoryApi.endpoints.getMappedMenu.initiate(user.restaurantId, {
            forceRefetch: true,
          }),
        ).unwrap(),
        dispatch(
          billsApi.endpoints.getBills.initiate(
            {
              restaurantId: user.restaurantId,
              branchId: selectedBranch?.id,
              from: monthStart,
              to: monthEnd,
            },
            { forceRefetch: true },
          ),
        ).unwrap(),
      ]);

      const record = restockRecords.find(
        (r: any) => r.month === currentMonthNum && r.year === currentYear,
      );
      if (record?.data && !Array.isArray(record.data)) {
        savedWeeks = record.data;
      }
      freshMenuItems = mapped || [];
      monthBills = monthBillRows || [];
    } catch {
      // silent — fall back to baseRows / zero consumption
    }

    // Normalize small units to human-friendly larger units in the template
    const normalizeIngUnit = (unit: string): string => {
      const u = (unit || "").toLowerCase();
      if (u === "gram" || u === "gm" || u === "g") return "Kg";
      if (u === "ml" || u === "millilitre" || u === "milliliter")
        return "Litre";
      return unit || "Kg";
    };
    // Multiplier to convert a saved quantity to the normalized unit (gram→Kg = /1000, etc.)
    const ingUnitMult = (unit: string): number => {
      const u = (unit || "").toLowerCase();
      return u === "gram" ||
        u === "gm" ||
        u === "g" ||
        u === "ml" ||
        u === "millilitre" ||
        u === "milliliter"
        ? 1 / 1000
        : 1;
    };

    const baseRows = Object.entries(ingredients).flatMap(
      ([category, items]: any) =>
        items.map((item: any) => ({
          Category: category,
          Ingredient: item.name,
          Unit: normalizeIngUnit(item.unit || "Kg"),
        })),
    );

    /* =========================================================
     CONSUMPTION CALCULATION — deduct orders from stock per week
  ========================================================= */

    // Build menuItemId → ingredient mappings from freshly fetched data
    const itemIngMap = new Map<number, any[]>();
    for (const mi of freshMenuItems) {
      if (mi.id && mi.menuItemIngredients?.length) {
        itemIngMap.set(mi.id, mi.menuItemIngredients);
      }
    }

    // weekConsumed[weekIndex][ingredientName.lower] = qty consumed in that calendar week (always in Kg/Litre)
    // Week 0 = days 1-7, Week 1 = days 8-14, etc. — use day-of-month to avoid timezone edge cases
    const weekConsumed: Record<number, Record<string, number>> = {};
    for (const bill of monthBills) {
      if (!bill.createdAt) continue;
      const dayOfMonth = new Date(bill.createdAt).getDate();
      const wIdx = Math.floor((dayOfMonth - 1) / 7);
      if (wIdx > 4) continue;
      if (!weekConsumed[wIdx]) weekConsumed[wIdx] = {};
      for (const item of bill.items || []) {
        if (!item.menuItemId) continue;
        const mappings = itemIngMap.get(item.menuItemId);
        if (!mappings) continue;
        const soldQty = Number(item.quantity || 0);
        for (const m of mappings) {
          const key = (m.ingredient?.name || "").toLowerCase().trim();
          let consumed = Number(m.quantity || 0) * soldQty;
          const mUnit = (m.unit || "").toLowerCase();
          // Always normalize consumed to Kg/Litre regardless of ingredient base unit
          if (mUnit === "gram" || mUnit === "gm" || mUnit === "g")
            consumed /= 1000;
          else if (
            mUnit === "ml" ||
            mUnit === "millilitre" ||
            mUnit === "milliliter"
          )
            consumed /= 1000;
          weekConsumed[wIdx][key] = (weekConsumed[wIdx][key] || 0) + consumed;
        }
      }
    }

    // closing stock of week N carries forward as opening stock of week N+1
    const prevClosing: Record<string, number> = {};

    /* =========================================================
     CREATE 5 WEEK SHEETS
  ========================================================= */

    for (let week = 1; week <= 5; week++) {
      const weekKey = `week${week}`;
      const weekRows: any[] = savedWeeks[weekKey] || [];
      const sourceData = weekRows.length > 0 ? weekRows : baseRows;

      const worksheet = workbook.addWorksheet(
        `Week-${week}-${currentMonth}-${currentYear}`,
      );

      /* =========================================================
       HEADERS
    ========================================================= */

      const headers: string[] = [
        "Category",
        "Ingredient",
        "Unit",

        "Opening Qty",
        "Opening Price",
        "Opening Value",
      ];

      /* =========================================================
       7 DAYS
    ========================================================= */

      for (let day = 1; day <= 7; day++) {
        headers.push(`Day ${day} Qty`, `Day ${day} Price`, `Day ${day} Total`);
      }

      /* =========================================================
       WEEK SUMMARY
    ========================================================= */

      headers.push(
        "Week Purchase",
        "Week Inventory",
        "Week Inventory Cost",
        "Closing Qty",
        "Closing Value",
        "Expense",
      );

      worksheet.addRow(headers);

      /* =========================================================
       HEADER STYLE
    ========================================================= */

      const headerRow = worksheet.getRow(1);

      headerRow.height = 42;

      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          color: {
            argb: "FFFFFF",
          },
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "EF4444",
          },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };

        cell.border = {
          top: {
            style: "thin",
          },
          left: {
            style: "thin",
          },
          bottom: {
            style: "thin",
          },
          right: {
            style: "thin",
          },
        };
      });

      /* =========================================================
       COLUMN WIDTHS
    ========================================================= */

      worksheet.columns.forEach((column, index) => {
        if (index <= 2) {
          column.width = 24;
        } else {
          column.width = 16;
        }
      });

      /* =========================================================
       ADD DATA ROWS
    ========================================================= */

      let rowNumber = 2;

      sourceData.forEach((rowData: any) => {
        const row = worksheet.getRow(rowNumber);
        const ingName = (rowData.Ingredient || "").toLowerCase().trim();

        // If saved data was in gram/ml, convert quantities to Kg/Litre for consistent display
        const mult = ingUnitMult(rowData.Unit || "Kg");

        // Week 1: use stored/entered opening qty; weeks 2-5: carry forward prev week's closing
        const openingQty =
          week === 1
            ? Number(rowData["Opening Qty"] || 0) * mult
            : (prevClosing[ingName] ??
              Number(rowData["Opening Qty"] || 0) * mult);

        /* =====================================================
         BASIC INFO
      ===================================================== */

        row.getCell(1).value = rowData.Category || "";

        row.getCell(2).value = rowData.Ingredient || "";

        row.getCell(3).value = normalizeIngUnit(rowData.Unit || "Kg");

        /* =====================================================
         OPENING STOCK
      ===================================================== */

        row.getCell(4).value = openingQty;

        row.getCell(5).value = Number(rowData["Opening Price"] || 0);

        row.getCell(6).value = {
          formula: `D${rowNumber}*E${rowNumber}`,
        };

        /* =====================================================
         DAILY PURCHASES
      ===================================================== */

        let currentCol = 7;

        const dailyTotals: string[] = [];

        const dailyQtys: string[] = [];

        for (let day = 1; day <= 7; day++) {
          const qtyCol = worksheet.getColumn(currentCol).letter;

          const priceCol = worksheet.getColumn(currentCol + 1).letter;

          const totalCol = worksheet.getColumn(currentCol + 2).letter;

          // Restore saved values, converting gram/ml → Kg/Litre if needed

          row.getCell(currentCol).value =
            Number(rowData[`Day ${day} Qty`] || 0) * mult;

          row.getCell(currentCol + 1).value = Number(
            rowData[`Day ${day} Price`] || 0,
          );

          // DAILY TOTAL

          row.getCell(currentCol + 2).value = {
            formula: `${qtyCol}${rowNumber}*${priceCol}${rowNumber}`,
          };

          dailyQtys.push(`${qtyCol}${rowNumber}`);

          dailyTotals.push(`${totalCol}${rowNumber}`);

          currentCol += 3;
        }

        /* =====================================================
         WEEK SUMMARY
      ===================================================== */

        const purchaseCol = worksheet.getColumn(currentCol).letter;

        const inventoryQtyCol = worksheet.getColumn(currentCol + 1).letter;

        const inventoryCostCol = worksheet.getColumn(currentCol + 2).letter;

        const closingQtyCol = worksheet.getColumn(currentCol + 3).letter;

        const closingValueCol = worksheet.getColumn(currentCol + 4).letter;

        // PURCHASE TOTAL

        row.getCell(currentCol).value = {
          formula: dailyTotals.join("+"),
        };

        // INVENTORY QTY

        row.getCell(currentCol + 1).value = {
          formula: `D${rowNumber}+${dailyQtys.join("+")}`,
        };

        // INVENTORY COST

        row.getCell(currentCol + 2).value = {
          formula: `F${rowNumber}+${purchaseCol}${rowNumber}`,
        };

        // CLOSING STOCK QTY — opening + purchases - consumption (all values normalized to Kg/Litre)
        const weekPurchaseQty = [1, 2, 3, 4, 5, 6, 7].reduce(
          (sum, d) => sum + Number(rowData[`Day ${d} Qty`] || 0) * mult,
          0,
        );
        const consumed = weekConsumed[week - 1]?.[ingName] || 0;
        const closingQty = Math.max(0, openingQty + weekPurchaseQty - consumed);
        prevClosing[ingName] = closingQty;

        row.getCell(currentCol + 3).value = closingQty;

        // CLOSING VALUE

        row.getCell(currentCol + 4).value = {
          formula: `IF(${inventoryQtyCol}${rowNumber}=0,0,(${closingQtyCol}${rowNumber}/${inventoryQtyCol}${rowNumber})*${inventoryCostCol}${rowNumber})`,
        };

        // EXPENSE

        row.getCell(currentCol + 5).value = {
          formula: `${inventoryCostCol}${rowNumber}-${closingValueCol}${rowNumber}`,
        };

        /* =====================================================
         ROW STYLE
      ===================================================== */

        row.eachCell((cell) => {
          cell.border = {
            top: {
              style: "thin",
              color: {
                argb: "E5E7EB",
              },
            },
            left: {
              style: "thin",
              color: {
                argb: "E5E7EB",
              },
            },
            bottom: {
              style: "thin",
              color: {
                argb: "E5E7EB",
              },
            },
            right: {
              style: "thin",
              color: {
                argb: "E5E7EB",
              },
            },
          };

          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
        });

        rowNumber++;
      });

      /* =========================================================
       FREEZE PANES
    ========================================================= */

      worksheet.views = [
        {
          state: "frozen",
          xSplit: 3,
          ySplit: 1,
        },
      ];

      /* =========================================================
       AUTO FILTER
    ========================================================= */

      worksheet.autoFilter = {
        from: "A1",
        to: `${worksheet.getColumn(worksheet.columnCount).letter}1`,
      };
    }

    /* =========================================================
     DOWNLOAD
  ========================================================= */

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${currentMonth}-${currentYear}-inventory-template.xlsx`);
  };
  const handleUploadRestockSheet = (e: any) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt: any) => {
      const data = new Uint8Array(evt.target.result);

      const workbook = await loadWorkbook(data);

      const allWeeks: any = {};

      workbook.worksheets.forEach((worksheet, index) => {
        allWeeks[`week${index + 1}`] = sheetToJson(worksheet);
      });

      setRestockHistory(allWeeks);

      await saveRestockHistory(allWeeks);
    };

    reader.readAsArrayBuffer(file);
  };

  const saveRestockHistory = async (uploadedData?: any) => {
    try {
      setUploadingRestock(true);

      if (!selectedBranch?.id) {
        notify("Please select branch", "warning");

        return;
      }

      const currentDate = new Date();

      const month = currentDate.getMonth() + 1;

      const year = currentDate.getFullYear();

      await saveRestockHistoryMutation({
        restaurantId: user.restaurantId,
        branchId: selectedBranch.id,
        month,
        year,
        data: uploadedData || restockHistory,
      }).unwrap();
    } catch {
      notify("Failed to save restock history");
    } finally {
      // Was cleared only on success, so a failed upload left the spinner
      // running and the button disabled until a reload.
      setUploadingRestock(false);
    }
  };

  const aiAlerts: any[] = [];

  /* HIGH FOOD COST */
  mappedItems.forEach((item: any) => {
    const totalRecipeCost =
      item.menuItemIngredients?.reduce((sum: number, mapping: any) => {
        const ingredient = mapping.ingredient;
        if (!ingredient) return sum;
        const qty = Number(mapping.quantity || 0);
        const price = Number(ingredient.pricePerUnit || 0);
        let cost = 0;
        const mappingUnit = mapping.unit?.toLowerCase();
        const ingredientUnit = ingredient.unit?.toLowerCase();
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
      }, 0) || 0;

    const menuPrice = Number(item.price || 0);
    const foodCostPercent =
      menuPrice > 0 ? (totalRecipeCost / menuPrice) * 100 : 0;

    if (foodCostPercent > 45) {
      aiAlerts.push({
        title: "Over Portioning",
        desc: `${item.name} food cost is ${foodCostPercent.toFixed(0)}%`,
        color: "bg-orange-500",
        text: "text-orange-600",
      });
    }
  });

  /* STOCK MISMATCH — consumption exceeds recorded stock */

  ingredientAnalytics.forEach((item: any) => {
    const allIngredients = Object.values(ingredients || {}).flat() as any[];
    const ingredientData = allIngredients.find(
      (i: any) => i.name === item.ingredient,
    );
    if (!ingredientData) return;
    const remaining = Number(ingredientData.quantity || 0);
    const consumed = Number(item.consumed || 0);
    if (consumed > remaining) {
      aiAlerts.push({
        title: "Stock Mismatch",
        desc: `${item.ingredient} consumption exceeds stock`,
        color: "bg-[#b10000]",
        text: "text-white",
      });
    }
  });

  /* LOW STOCK — checked against every ingredient (not just ones with sales
     history), using each ingredient's own configurable reorder level. */

  Object.values(ingredients || {})
    .flat()
    .forEach((ingredientData: any) => {
      if (!ingredientData?.name) return;
      const remaining = Number(ingredientData.quantity ?? 0);
      const reorderLevel =
        ingredientData.reorderLevel != null &&
        ingredientData.reorderLevel !== ""
          ? Number(ingredientData.reorderLevel)
          : 2;
      if (remaining <= reorderLevel) {
        const linkedVendor = ingredientData.vendor?.[0]?.vendor;
        aiAlerts.push({
          title: "Low Stock Alert",
          desc: `${ingredientData.name} stock running low (${remaining} ${ingredientData.unit || ""} left)`,
          color: "bg-yellow-500",
          text: "text-yellow-600",
          vendorId: linkedVendor?.id,
          vendorName: linkedVendor?.name,
          ingredientName: ingredientData.name,
        });
      }
    });
  /* DAILY STOCK AUDIT REMINDER — after branch closing time, if today's
     closing-stock audit hasn't been submitted yet. */
  if (selectedBranch?.closingTime && todayAuditCount === 0) {
    const [closeH, closeM] = selectedBranch.closingTime.split(":").map(Number);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const closingMinutes = (closeH || 0) * 60 + (closeM || 0);
    if (nowMinutes >= closingMinutes) {
      aiAlerts.push({
        title: "Daily Stock Pending",
        desc: `Closing time (${selectedBranch.closingTime}) has passed — submit today's closing stock audit`,
        color: "bg-orange-500",
        text: "text-orange-600",
      });
    }
  }

  /* HIGH WASTAGE */
  ingredientMappings.forEach((mapping: any) => {
    const waste = Number(mapping.wastage || 0);
    if (waste > 10) {
      aiAlerts.push({
        title: "Untracked Waste",
        desc: `${mapping.ingredient?.name} wastage at ${waste}%`,
        color: "bg-yellow-500",
        text: "text-yellow-600",
      });
    }
  });

  /* FALLBACK */

  if (!aiAlerts.length) {
    aiAlerts.push({
      title: "Inventory Healthy",
      desc: "No operational risks detected",
      color: "bg-emerald-500",
      text: "text-emerald-600",
    });
  }
  /**
   * One cached payload, two derivations.
   *
   * This used to be a single effect keyed on `[selectedBranch?.id,
   * selectedWeek]`, which meant picking a different week refetched this
   * payload, the mappings and the month's bills. Only the restock formatting
   * depends on the week, and it needs no network at all — so the fetch is keyed
   * on the branch and the week-dependent shaping is a separate effect over the
   * cached result.
   */
  const { data: menuManagement } = useGetMenuManagementQuery(
    { restaurantId: user?.restaurantId as number, branchId: selectedBranch?.id },
    { skip: !user?.restaurantId || !selectedBranch?.id },
  );

  /**
   * Two kinds of assignment, and they cannot share an effect.
   *
   * `menuItems` is a read-only mirror of the payload, so it is safe to
   * overwrite whenever it refreshes.
   *
   * The ingredient rows are not: they are an editable draft, and the Item
   * Mapping selection is a choice someone made. Both used to be re-seeded here
   * on every payload change, which was harmless while the payload only
   * refetched on a branch or week change. It stopped being harmless the moment
   * menu-item writes began invalidating it — saving a menu item would have
   * discarded half-typed ingredient rows and jumped the mapping selection back
   * to the first item.
   *
   * So the draft and the selection are seeded once per branch, and the mirrors
   * follow the cache.
   */
  const seededBranch = useRef<number | null>(null);

  useEffect(() => {
    if (!menuManagement) return;
    setMenuItems(menuManagement.menuItems || []);
  }, [menuManagement]);

  useEffect(() => {
    if (!menuManagement) return;
    const branchId = selectedBranch?.id ?? null;
    if (seededBranch.current === branchId) return;
    seededBranch.current = branchId;

    if (menuManagement.menuItems?.length) {
      setSelectedMenuItem(menuManagement.menuItems[0]);
    }

    const groupedIngredients = (menuManagement.ingredients || []).reduce(
      (acc: any, item: any) => {
        const categoryName = item.category?.name || "Others";
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          purchasePrice: item.purchasePrice,
          pricePerUnit: item.pricePerUnit,
          reorderLevel: item.reorderLevel,
          vendor: item.ingredientVendors,
        });
        return acc;
      },
      {},
    );
    setIngredients(groupedIngredients);
  }, [menuManagement, selectedBranch?.id]);

  // Week-dependent only. No request: the sheets are already in the payload
  // above, and this reshapes the chosen week's rows for the Restock tab.
  useEffect(() => {
    if (!menuManagement) return;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentMonthRestock = (menuManagement.restocks || []).find(
      (item: any) => item.month === currentMonth && item.year === currentYear,
    );
    const selectedWeekData = currentMonthRestock?.data?.[selectedWeek] || [];
    const formattedRestocks =
      selectedWeekData.map((item: any) => {
        // TOTAL PURCHASE QTY
        const totalPurchaseQty =
          Number(item["Day 1 Qty"] || 0) +
          Number(item["Day 2 Qty"] || 0) +
          Number(item["Day 3 Qty"] || 0) +
          Number(item["Day 4 Qty"] || 0) +
          Number(item["Day 5 Qty"] || 0) +
          Number(item["Day 6 Qty"] || 0) +
          Number(item["Day 7 Qty"] || 0);

        // AVG PRICE
        const prices = [
          Number(item["Day 1 Price"] || 0),
          Number(item["Day 2 Price"] || 0),
          Number(item["Day 3 Price"] || 0),
          Number(item["Day 4 Price"] || 0),
          Number(item["Day 5 Price"] || 0),
          Number(item["Day 6 Price"] || 0),
          Number(item["Day 7 Price"] || 0),
        ].filter((p) => p > 0);
        const avgPrice = prices.length
          ? prices.reduce((a, b) => a + b, 0) / prices.length
          : 0;

        return {
          Category: item.Category,
          Ingredient: item.Ingredient,
          Unit: item.Unit,
          // OPENING
          OpeningStockQty: Number(item["Opening Qty"] || 0),
          OpeningStockPrice: Number(item["Opening Price"] || 0),
          OpeningStockValue: Number(item["Opening Value"] || 0),
          // WEEK 1
          Week1PurchaseQty: totalPurchaseQty,
          Week1Price: avgPrice,
          Week1Expense: Number(item["Expense"] || 0),
          Week1ClosingStock: Number(item["Closing Qty"] || 0),
          Week1ClosingValue: Number(item["Closing Value"] || 0),
          // MONTHLY
          TotalPurchaseAmount: Number(item["Week Purchase"] || 0),
          TotalWeeklyExpense: Number(item["Expense"] || 0),
          MonthClosingValue: Number(item["Closing Value"] || 0),
          MonthlyRMExpense: Number(item["Expense"] || 0),
        };
      }) || [];

    setRestocks(formattedRestocks);
    setRestockHistory(currentMonthRestock?.data || {});
  }, [menuManagement, selectedWeek]);

  // Bills are a query now; only the mapping load is still imperative, because
  // it also reseeds the Item Mapping selection.
  useEffect(() => {
    fetchMenuItemMappings();
  }, [selectedBranch?.id]);



  // Owned by useAddOns: the list is read by this page's attach modal and
  // managed by the Add-Ons tab, so neither one can hold it.
  // The whole object goes to the Add-Ons tab, which manages it; the page
  // itself only needs the groups, for the per-item attach modal.
  const addOns = useAddOns();
  const [saveRestockHistoryMutation] = useSaveRestockHistoryMutation();
  const [attachAddOnGroup] = useAttachAddOnGroupMutation();
  const [detachAddOnGroup] = useDetachAddOnGroupMutation();
  const { addOnGroups } = addOns;

  /**
   * Which groups are already on this item. Fetched imperatively rather than as
   * a hook query because it is per-item and only wanted while the modal is
   * open — `initiate` still goes through the same cache, so opening the same
   * item twice in a row costs nothing.
   */
  const openAttachModal = async (item: any) => {
    setAttachModal({ open: true, item, attachedIds: new Set() });
    try {
      const groups = await dispatch(
        addonsApi.endpoints.getMenuItemAddOnGroups.initiate(item.id),
      ).unwrap();
      setAttachModal({
        open: true,
        item,
        attachedIds: new Set((groups || []).map((g: any) => g.id)),
      });
    } catch {
      /* silent */
    }
  };

  const handleToggleAttach = async (groupId: number) => {
    if (!attachModal.item) return;
    const menuItemId = attachModal.item.id;
    const isAttached = attachModal.attachedIds.has(groupId);
    // Optimistic update. Kept local rather than moved into an RTK Query cache
    // patch: the checkbox is the modal's own state, and a round trip per click
    // would be worse than what is here.
    setAttachModal((prev) => {
      const next = new Set(prev.attachedIds);
      if (isAttached) next.delete(groupId);
      else next.add(groupId);
      return { ...prev, attachedIds: next };
    });
    try {
      const run = isAttached ? detachAddOnGroup : attachAddOnGroup;
      await run({ menuItemId, addOnGroupId: groupId }).unwrap();
    } catch {
      // A checkbox that claims a group is attached when it isn't describes an
      // add-on customers cannot order. Put it back and say so.
      setAttachModal((prev) => {
        const next = new Set(prev.attachedIds);
        if (isAttached) next.add(groupId);
        else next.delete(groupId);
        return { ...prev, attachedIds: next };
      });
      notify("Failed to update the add-ons on this item");
    }
  };



  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 rounded-md">
      <div className="mx-auto space-y-6">
        {/* ================= HERO ================= */}

        <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              {/* ICON */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <CakeIcon className="h-4 w-4 text-white" />
              </div>

              {/* CONTENT */}
              <div>
                {/* TITLE */}
                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">
                  Menu Operations
                </h1>

                {/* SUBTITLE */}
                <p className="mt-1 text-[12px] text-gray-500">
                  Menu items, ingredients, stock & analytics
                </p>
              </div>
            </div>

            {/* RIGHT STATUS CHIPS */}

            <div className="flex flex-wrap items-center gap-1.5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400">
                  Inventory
                </p>

                <p className="text-[13px] font-black text-blue-700">Synced</p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                  Stock
                </p>

                <p className="text-[13px] font-black text-emerald-700">Live</p>
              </div>

              <div className="rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400">
                  Analytics
                </p>

                <p className="text-[13px] font-black text-orange-700">
                  Enabled
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABS ================= */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative overflow-hidden rounded-md border px-4 py-3 text-left transition-all duration-200 ${
                  active
                    ? "border-[#b10000] bg-red-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-red-100 hover:bg-red-50"
                }`}
              >
                {active && (
                  <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-red-100 blur-3xl" />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#b10000] text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[14px] font-bold ${active ? "text-[#b10000]" : "text-gray-900"}`}
                    >
                      {tab.name}
                    </p>
                    <p className="truncate text-[11px] text-gray-500">
                      {tab.description}
                    </p>
                  </div>
                  {active && (
                    <div className="h-2 w-2 rounded-full bg-[#b10000]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {/* ================= CONTENT ================= */}
        {/* No backdrop-blur here: a backdrop filter makes this card the containing
            block for position:fixed descendants, so every tab's fixed-overlay
            modal was centred on this (very tall) card instead of the viewport,
            and had to be scrolled to. */}
        <div className="rounded-md border border-gray-200 bg-white p-8 shadow-sm">
          {/* MENU */}
          {activeTab === "menu" && (
            <MenuTab editor={menuEditor} categories={menuCategories} openAttachModal={openAttachModal} />
          )}

          {/* INGREDIENTS */}
          {activeTab === "ingredients" && (
            <IngredientsTab editor={ingredientEditor} loading={loading} />
          )}
          {/* RESTOCK */}
          {activeTab === "restock" && (
            <RestockTab analytics={analytics} restocks={restocks} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} uploadingRestock={uploadingRestock} downloadInventoryTemplate={downloadInventoryTemplate} handleUploadRestockSheet={handleUploadRestockSheet} />
          )}
          {/* ITEM MAPPING */}
          {activeTab === "mapping" && (
            <ItemMappingTab mapping={mapping} menuItems={menuItems} allIngredients={allIngredients} avgRecipeCost={avgRecipeCost} />
          )}
          {/* ANALYTICS */}
          {activeTab === "analytics" && (
            <AnalyticsTab analytics={analytics} allIngredients={allIngredients} aiAlerts={aiAlerts} />
          )}

          {/* ================= MENU ENGINEERING ================= */}
          {activeTab === "engineering" && <MenuEngineeringMatrixTab />}

          {/* ================= ADD-ONS ================= */}
          {activeTab === "addons" && (
            <AddOnsTab addOns={addOns} />
          )}

          {/* ================= OPERATIONS (SOP CHECKLISTS) ================= */}
          {activeTab === "operations" && (
            <OperationsTab menuItems={menuItems} />
          )}

          {/* ================= ATTACH ADD-ON GROUPS TO ITEM ================= */}
          {attachModal.open && attachModal.item && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() =>
                setAttachModal({
                  open: false,
                  item: null,
                  attachedIds: new Set(),
                })
              }
            >
              <div
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900">
                      Add-Ons for {attachModal.item.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Choose which groups apply to this dish
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setAttachModal({
                        open: false,
                        item: null,
                        attachedIds: new Set(),
                      })
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>

                {addOnGroups.length === 0 ? (
                  <p className="text-[12px] text-gray-400">
                    No add-on groups yet — create one in the Add-Ons tab first.
                  </p>
                ) : (
                  <div className="max-h-80 space-y-1.5 overflow-y-auto">
                    {addOnGroups.map((group: any) => {
                      const checked = attachModal.attachedIds.has(group.id);
                      return (
                        <label
                          key={group.id}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                            checked
                              ? "border-violet-300 bg-violet-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">
                              {group.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {group.options?.length || 0} option
                              {group.options?.length === 1 ? "" : "s"}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleAttach(group.id)}
                            className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
