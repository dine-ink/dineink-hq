import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { useAddOns } from "./useAddOns";
import IngredientsTab from "./tabs/IngredientsTab";
import ItemMappingTab from "./tabs/ItemMappingTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import RestockTab from "./tabs/RestockTab";
import { useInventoryAnalytics } from "./useInventoryAnalytics";
import { useIngredientMapping } from "./useIngredientMapping";
import { useIngredientEditor } from "./useIngredientEditor";
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
import { isVegType } from "./menuDisplay";


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

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState("menu");

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [restocks, setRestocks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
  const { user, token } = useAppSelector((s) => s.auth);
  const [selectedWeek, setSelectedWeek] = useState("week1");
  const [todayAuditCount, setTodayAuditCount] = useState<number | null>(null);
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
  // The ingredient stock editor. The page keeps `ingredients` in view because
  // allIngredients is flattened from it and three other tabs read that.
  const ingredientEditor = useIngredientEditor(categories, setCategories, setLoading);
  const { ingredients, setIngredients } = ingredientEditor;

  const allIngredients: any[] = Object.values(
    ingredients || {},
  ).flat() as any[];
  const [bills, setBills] = useState<any[]>([]);

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

  const fetchBills = async () => {
    try {
      if (!selectedBranch?.id) {
        return;
      }

      // Bounded to the current month — matches Insights.tsx's own Inventory
      // Turnover scope (also hardcoded to the current month, not the global
      // date-range picker). Previously this fetch had no from/to at all, so
      // it pulled every non-cancelled bill ever placed at the branch, making
      // this page's Inventory Turnover figure grow unboundedly with
      // restaurant age instead of being a comparable, period-scoped number
      // like Insights.tsx's.
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const res = await fetch(
        `${API_URL}/api/bills/${user.restaurantId}/restaurantwise?branchId=${selectedBranch.id}&from=${monthStart}&to=${monthEnd}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (data.success) {
        setBills(data.bills || []);
      }
    } catch {
      // fetch error
    }
  };






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
      const [restockRes, mappingRes, billsRes] = await Promise.all([
        fetch(
          `${API_URL}/api/inventory/${user.restaurantId}/get-restock-history?branchId=${selectedBranch?.id || ""}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
        fetch(`${API_URL}/api/inventory/${user.restaurantId}/get-mapped-menu`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${API_URL}/api/bills/${user.restaurantId}/restaurantwise?branchId=${selectedBranch?.id || ""}&from=${monthStart}&to=${monthEnd}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ]);

      const [restockJson, mappingJson, billsJson] = await Promise.all([
        restockRes.json(),
        mappingRes.json(),
        billsRes.json(),
      ]);

      if (restockJson.success && Array.isArray(restockJson.data)) {
        const record = restockJson.data.find(
          (r: any) => r.month === currentMonthNum && r.year === currentYear,
        );
        if (record?.data && !Array.isArray(record.data)) {
          savedWeeks = record.data;
        }
      }

      if (mappingJson.success) {
        freshMenuItems = mappingJson.data || [];
      }

      if (billsJson.success) {
        monthBills = billsJson.bills || [];
      }
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
        alert("Please select branch");

        return;
      }

      const currentDate = new Date();

      const month = currentDate.getMonth() + 1;

      const year = currentDate.getFullYear();

      const res = await fetch(`${API_URL}/api/inventory/save-restock-history`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          restaurantId: user.restaurantId,

          branchId: selectedBranch.id,

          month,

          year,

          data: uploadedData || restockHistory,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setUploadingRestock(false);
      } else {
        alert(data.message || "Failed to save restock");
      }
    } catch {
      alert("Failed to save restock history");
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
  useEffect(() => {
    const fetchMenuManagement = async () => {
      try {
        const restaurantId = user.restaurantId;

        if (!restaurantId || !selectedBranch?.id) {
          return;
        }

        const res = await fetch(
          `${API_URL}/api/inventory/${restaurantId}/menu-management?branchId=${selectedBranch.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const json = await res.json();

        if (json.success) {
          setMenuItems(json.data.menuItems || []);

          if (json.data.menuItems?.length) {
            setSelectedMenuItem(json.data.menuItems[0]);
          }

          const groupedIngredients = (json.data.ingredients || []).reduce(
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

          const currentDate = new Date();

          const currentMonth = currentDate.getMonth() + 1;

          const currentYear = currentDate.getFullYear();
          const currentMonthRestock = (json.data.restocks || []).find(
            (item: any) =>
              item.month === currentMonth && item.year === currentYear,
          );
          const selectedWeekData =
            currentMonthRestock?.data?.[selectedWeek] || [];
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
          setCategories(json.data.categories || []);
        }
      } catch {
        // fetch error
      }
    };
    fetchMenuManagement();
    fetchMenuItemMappings();
    fetchBills();
  }, [selectedBranch?.id, selectedWeek]);

  useEffect(() => {
    const fetchTodayAuditStatus = async () => {
      if (!selectedBranch?.id) return;
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(
          `${API_URL}/api/inventory/daily-audit/history?branchId=${selectedBranch.id}&from=${today}&to=${today}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        setTodayAuditCount(data.success ? (data.data || []).length : null);
      } catch {
        setTodayAuditCount(null);
      }
    };
    fetchTodayAuditStatus();
  }, [selectedBranch?.id]);


  // Owned by useAddOns: the list is read by this page's attach modal and
  // managed by the Add-Ons tab, so neither one can hold it.
  // The whole object goes to the Add-Ons tab, which manages it; the page
  // itself only needs the groups, for the per-item attach modal.
  const addOns = useAddOns(activeTab);
  const { addOnGroups } = addOns;

  const openAttachModal = async (item: any) => {
    setAttachModal({ open: true, item, attachedIds: new Set() });
    try {
      const res = await fetch(`${API_URL}/api/addons/menu-items/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAttachModal({
          open: true,
          item,
          attachedIds: new Set((data.data || []).map((g: any) => g.id)),
        });
      }
    } catch {
      /* silent */
    }
  };

  const handleToggleAttach = async (groupId: number) => {
    if (!attachModal.item) return;
    const isAttached = attachModal.attachedIds.has(groupId);
    // Optimistic update
    setAttachModal((prev) => {
      const next = new Set(prev.attachedIds);
      if (isAttached) next.delete(groupId);
      else next.add(groupId);
      return { ...prev, attachedIds: next };
    });
    try {
      const res = isAttached
        ? await fetch(
            `${API_URL}/api/addons/menu-items/${attachModal.item.id}/groups/${groupId}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
          )
        : await fetch(
            `${API_URL}/api/addons/menu-items/${attachModal.item.id}/groups`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ addOnGroupId: groupId }),
            },
          );
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }
    } catch (error) {
      // The previous comment accepted the drift because "the modal re-fetches
      // next time it opens". Until then the checkbox claims a group is attached
      // when it isn't — and an add-on group that isn't attached is one
      // customers cannot order. Put the checkbox back and say so.
      setAttachModal((prev) => {
        const next = new Set(prev.attachedIds);
        if (isAttached) next.add(groupId);
        else next.delete(groupId);
        return { ...prev, attachedIds: next };
      });
      alert(error instanceof Error ? error.message : "Failed to update the add-ons on this item");
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
        <div className="rounded-md border border-white/40 bg-white/80 p-8 shadow-sm backdrop-blur-xl">
          {/* MENU */}
          {activeTab === "menu" && (
            <div className="space-y-4">
              {/* ================= HEADER ================= */}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* LEFT */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#b10000]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10000]">
                    Menu Center
                  </div>

                  <h2 className="mt-2 text-[24px] font-black tracking-tight text-gray-900">
                    Menu Items
                  </h2>

                  <p className="mt-1 text-[13px] text-gray-500">
                    Manage pricing, categories & availability
                  </p>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMenuCategory((v) => !v)}
                    className="h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    + Category
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setItemForm(blankItemForm);
                      setShowAddItemForm(true);
                    }}
                    className="h-11 rounded-xl bg-[#b10000] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* ── INLINE ADD CATEGORY ── */}
              {showMenuCategory && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <FolderIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <input
                    autoFocus
                    value={menuCatName}
                    onChange={(e) => setMenuCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateMenuCategory();
                      if (e.key === "Escape") setShowMenuCategory(false);
                    }}
                    placeholder="Category name (e.g. Starters, Mains, Desserts…)"
                    className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    onClick={handleCreateMenuCategory}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12px] font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </button>
                  <button
                    onClick={() => setShowMenuCategory(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ================= TABLE ================= */}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* The filter widgets on this table live in its header row, so
                    it cannot become generic cards — phones get the purpose-built
                    accordion below instead. */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full">
                    {/* HEADER */}

                    <thead className="border-b border-gray-100 bg-gray-50/80">
                      {/* FILTER ROW */}

                      <tr className="border-b border-gray-100 bg-gray-50/70">
                        {/* ITEM SEARCH */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Item
                            </p>

                            <input
                              placeholder="Search item..."
                              value={itemSearch}
                              onChange={(e) => setItemSearch(e.target.value)}
                              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                        </th>

                        {/* CATEGORY */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Category
                            </p>

                            <div className="relative">
                              <select
                                value={itemCatFilter}
                                onChange={(e) =>
                                  setItemCatFilter(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">All Categories</option>
                                {categories.map((cat: any) => (
                                  <option key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* TYPE */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Type
                            </p>

                            <div className="relative">
                              <select
                                value={itemTypeFilter}
                                onChange={(e) =>
                                  setItemTypeFilter(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">All Types</option>
                                <option value="VEG">Veg</option>
                                <option value="NON_VEG">Non Veg</option>
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* PRICE */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Price
                            </p>

                            <div className="relative">
                              <select
                                value={itemPriceSort}
                                onChange={(e) =>
                                  setItemPriceSort(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">Sort Price</option>
                                <option value="asc">Low to High</option>
                                <option value="desc">High to Low</option>
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* STATUS */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Status
                            </p>

                            <div className="relative">
                              <select
                                value={itemAvailFilter}
                                onChange={(e) =>
                                  setItemAvailFilter(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">All Status</option>
                                <option value="Available">Available</option>
                                <option value="Unavailable">Unavailable</option>
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* ACTION */}

                        <th className="px-5 py-3">
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                            Actions
                          </p>

                          <div className="flex h-9 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-[11px] font-medium text-gray-400">
                            Controls
                          </div>
                        </th>
                      </tr>
                    </thead>

                    {/* BODY */}

                    <tbody>
                      {filteredMenuItems?.length ? (
                        filteredMenuItems.map((item: any, index: number) => (
                          <tr
                            key={item.id || index}
                            className="border-b border-gray-100 transition hover:bg-gray-50/70"
                          >
                            {/* ITEM */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {/* IMAGE / AVATAR */}

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b10000] text-[14px] font-bold text-white">
                                  {item.name?.charAt(0)}
                                </div>

                                {/* INFO */}

                                <div>
                                  <p className="text-[15px] font-semibold text-gray-900">
                                    {item.name}
                                  </p>

                                  <p className="mt-0.5 text-[11px] text-gray-400">
                                    Item ID #{item.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-4">
                              <span className="text-[13px] font-medium text-gray-600">
                                {item.category?.name || "-"}
                              </span>
                            </td>

                            {/* TYPE */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  isVegType(item.type)
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {isVegType(item.type) ? "Veg" : "Non Veg"}
                              </span>
                            </td>

                            {/* PRICE */}

                            <td className="px-5 py-4">
                              <p className="text-[15px] font-black text-gray-900">
                                ₹{item.price}
                              </p>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  item.isAvailable
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </span>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${item.isAvailable ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                                >
                                  {item.isAvailable ? "Mark Off" : "Mark On"}
                                </button>
                                <button
                                  onClick={() => openAttachModal(item)}
                                  title="Manage add-ons for this item"
                                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-700 transition hover:bg-violet-100"
                                >
                                  Add-Ons
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setItemForm({
                                      name: item.name,
                                      categoryId: String(item.categoryId || ""),
                                      type: item.type || "VEG",
                                      price: String(item.price),
                                      prepTime: String(item.prepTime || ""),
                                      description: item.description || "",
                                      isAvailable: item.isAvailable,
                                    });
                                    setShowAddItemForm(true);
                                  }}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-16 text-center text-sm text-gray-400"
                          >
                            {itemSearch ||
                            itemCatFilter ||
                            itemTypeFilter ||
                            itemAvailFilter
                              ? "No items match your filters"
                              : "No menu items yet — click + Add Item to get started"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ===== MOBILE: SEARCH, FILTERS, CATEGORY ACCORDION ===== */}
                <div className="md:hidden">
                  <div className="space-y-2 border-b border-gray-100 bg-gray-50/70 p-3">
                    <div className="relative">
                      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        placeholder="Search item..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-[13px] font-medium text-gray-700 outline-none placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={itemCatFilter}
                        onChange={(e) => setItemCatFilter(e.target.value)}
                        aria-label="Filter by category"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={itemTypeFilter}
                        onChange={(e) => setItemTypeFilter(e.target.value)}
                        aria-label="Filter by food type"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">All Types</option>
                        <option value="VEG">Veg</option>
                        <option value="NON_VEG">Non Veg</option>
                      </select>
                      <select
                        value={itemAvailFilter}
                        onChange={(e) => setItemAvailFilter(e.target.value)}
                        aria-label="Filter by availability"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">All Status</option>
                        <option value="Available">Available</option>
                        <option value="Unavailable">Unavailable</option>
                      </select>
                      <select
                        value={itemPriceSort}
                        onChange={(e) => setItemPriceSort(e.target.value)}
                        aria-label="Sort by price"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">Sort Price</option>
                        <option value="asc">Low to High</option>
                        <option value="desc">High to Low</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between px-0.5">
                      <p className="text-[11px] text-gray-500">
                        {filteredMenuItems.length}{" "}
                        {filteredMenuItems.length === 1 ? "item" : "items"}
                      </p>
                      {(itemSearch ||
                        itemCatFilter ||
                        itemTypeFilter ||
                        itemAvailFilter ||
                        itemPriceSort) && (
                        <button
                          onClick={() => {
                            setItemSearch("");
                            setItemCatFilter("");
                            setItemTypeFilter("");
                            setItemAvailFilter("");
                            setItemPriceSort("");
                          }}
                          className="text-[11px] font-semibold text-[#b10000]"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredMenuItems.length === 0 ? (
                    <p className="px-4 py-12 text-center text-[13px] text-gray-400">
                      {itemSearch ||
                      itemCatFilter ||
                      itemTypeFilter ||
                      itemAvailFilter
                        ? "No items match your filters"
                        : "No menu items yet — tap + Add Item to get started"}
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {mobileItemGroups.map((group) => {
                        // While searching, every group stays open so matches
                        // show without tapping through categories.
                        const isOpen =
                          !!itemSearch || !!openItemCategories[group.name];
                        return (
                          <div key={group.name}>
                            <button
                              onClick={() =>
                                setOpenItemCategories((prev) => ({
                                  ...prev,
                                  [group.name]: !prev[group.name],
                                }))
                              }
                              aria-expanded={isOpen}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition active:bg-gray-50"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-semibold text-gray-900">
                                  {group.name}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {group.items.length}
                                  {group.items.length === 1 ? " item" : " items"}
                                  {group.unavailable > 0
                                    ? ` · ${group.unavailable} off`
                                    : ""}
                                </span>
                              </span>
                              <ChevronDownIcon
                                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              />
                            </button>

                            {isOpen && (
                              <div className="space-y-2 bg-gray-50/60 px-3 pt-1 pb-3">
                                {group.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="rounded-xl border border-gray-200 bg-white p-3"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b10000] text-[13px] font-bold text-white">
                                        {item.name?.charAt(0)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] font-semibold text-gray-900">
                                          {item.name}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-gray-400">
                                          Item ID #{item.id}
                                        </p>
                                      </div>
                                      <p className="shrink-0 text-[15px] font-black text-gray-900">
                                        ₹{item.price}
                                      </p>
                                    </div>

                                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          isVegType(item.type)
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-700"
                                        }`}
                                      >
                                        {isVegType(item.type) ? "Veg" : "Non Veg"}
                                      </span>
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          item.isAvailable
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                      >
                                        {item.isAvailable
                                          ? "Available"
                                          : "Unavailable"}
                                      </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                                      <button
                                        onClick={() =>
                                          handleToggleAvailability(item)
                                        }
                                        className={`h-9 rounded-xl border text-[12px] font-semibold transition ${item.isAvailable ? "border-orange-200 bg-orange-50 text-orange-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                                      >
                                        {item.isAvailable ? "Mark Off" : "Mark On"}
                                      </button>
                                      <button
                                        onClick={() => openAttachModal(item)}
                                        className="h-9 rounded-xl border border-violet-200 bg-violet-50 text-[12px] font-semibold text-violet-700"
                                      >
                                        Add-Ons
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingItem(item);
                                          setItemForm({
                                            name: item.name,
                                            categoryId: String(
                                              item.categoryId || "",
                                            ),
                                            type: item.type || "VEG",
                                            price: String(item.price),
                                            prepTime: String(item.prepTime || ""),
                                            description: item.description || "",
                                            isAvailable: item.isAvailable,
                                          });
                                          setShowAddItemForm(true);
                                        }}
                                        className="h-9 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteMenuItem(item.id)
                                        }
                                        className="h-9 rounded-xl border border-red-200 bg-red-50 text-[12px] font-semibold text-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
          {/* ── ADD / EDIT ITEM MODAL ── */}
          {showAddItemForm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setShowAddItemForm(false)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[17px] font-bold text-gray-900">
                    {editingItem ? "Edit Item" : "Add Menu Item"}
                  </h3>
                  <button
                    onClick={() => setShowAddItemForm(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      Item Name *
                    </label>
                    <input
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm((f: any) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Paneer Butter Masala"
                      className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Category
                      </label>
                      <select
                        value={itemForm.categoryId}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            categoryId: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">No Category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Type
                      </label>
                      <select
                        value={itemForm.type}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            type: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="VEG">Veg</option>
                        <option value="NON_VEG">Non Veg</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={itemForm.price}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            price: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Prep Time (min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={itemForm.prepTime}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            prepTime: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      Description
                    </label>
                    <input
                      value={itemForm.description}
                      onChange={(e) =>
                        setItemForm((f: any) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Optional description"
                      className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAvail"
                      checked={itemForm.isAvailable}
                      onChange={(e) =>
                        setItemForm((f: any) => ({
                          ...f,
                          isAvailable: e.target.checked,
                        }))
                      }
                      className="accent-[#b10000]"
                    />
                    <label
                      htmlFor="isAvail"
                      className="text-[13px] font-medium text-gray-700"
                    >
                      Available for ordering
                    </label>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddItemForm(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMenuItem}
                    disabled={
                      savingItem || !itemForm.name.trim() || !itemForm.price
                    }
                    className="rounded-xl bg-[#b10000] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50"
                  >
                    {savingItem
                      ? "Saving…"
                      : editingItem
                        ? "Save Changes"
                        : "Add Item"}
                  </button>
                </div>
              </div>
            </div>
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
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
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
