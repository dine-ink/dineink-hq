import { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  ArrowPathRoundedSquareIcon,
  Squares2X2Icon,
  ChartBarIcon,
  CloudArrowUpIcon,
  FolderIcon,
  PlusIcon,
  SparklesIcon,
  ChartPieIcon,
  BanknotesIcon,
  FireIcon,
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
  MdWarningAmber,
  MdChecklist,
  MdCurrencyRupee,
} from "react-icons/md";
import { BarChart3, Search, UtensilsCrossed } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const iconMap: any = {
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
};
const tabs = [
  {
    id: "menu",
    name: "Menu",
    icon: ClipboardDocumentListIcon,
    description: "Manage all menu items, categories and pricing",
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
];

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState("menu");
  const [viewMode, setViewMode] = useState("pie");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any>({});
  const [restocks, setRestocks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restockHistory, setRestockHistory] = useState<any[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [ingredientMappings, setIngredientMappings] = useState<any[]>([]);
  const [visibleAlerts, setVisibleAlerts] = useState(5);
  const [visibleIngredients, setVisibleIngredients] = useState(5);
  const [uploadingVendor, setUploadingVendor] = useState(false);
  const [uploadingRestock, setUploadingRestock] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const { branches, selectedBranch } = useAppSelector(s => s.branch);
  const { user, token } = useAppSelector(s => s.auth);
  const [selectedWeek, setSelectedWeek] = useState("week1");
  const API_URL = import.meta.env.VITE_API_URL;
  const allIngredients: any[] = Object.values(
    ingredients || {},
  ).flat() as any[];
  const mappedItems = menuItems.filter(
    (item: any) => item.menuItemIngredients?.length > 0,
  );
  const unmappedItems = menuItems.filter(
    (item: any) =>
      !item.menuItemIngredients || item.menuItemIngredients.length === 0,
  );
  const [bills, setBills] = useState<any[]>([]);

  const fetchBills = async () => {
    try {




      if (!selectedBranch?.id) {
        return;
      }

      const res = await fetch(
        `${API_URL}/api/bills/${user.restaurantId}/restaurantwise?branchId=${selectedBranch.id}`,
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

  const mappedMenuItems = menuItems.filter(
    (item: any) => item.menuItemIngredients?.length > 0,
  );

  const ingredientAnalytics = React.useMemo(() => {
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

  const avgFoodCost =
    mappedMenuItems.length > 0
      ? (
          mappedMenuItems.reduce((acc: number, item: any) => {
            const sellingPrice = Number(item.price || 0);
            if (sellingPrice <= 0) return acc;
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
            const foodCost = (recipeCost / sellingPrice) * 100;
            return acc + foodCost;
          }, 0) / mappedMenuItems.length
        ).toFixed(1)
      : 0;

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

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/api/ingredients/generateIngredients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            restaurantId: user.restaurantId,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        const formatted = Object.fromEntries(
          Object.entries(data.data).map(([category, items]) => [
            category,
            (items as string[]).map((item) => ({
              name: item,
              quantity: "",
              unit: "Kg",
              purchasePrice: "",
              pricePerUnit: "",
            })),
          ]),
        );
        setIngredients(formatted);
      }
    } catch {
      // error silently ignored
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {

      const restaurantId = user.restaurantId;
      const res = await fetch(`${API_URL}/api/ingredients/saveIngredients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          branchId: selectedBranch.id,
          ingredients,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Ingredients saved successfully");
      }
    } catch {
      // fetch error
    }
  };

  const handleRemoveIngredient = (category: string, index: number) => {
    setIngredients((prev: any) => {
      const updated = { ...prev };
      updated[category] = updated[category].filter(
        (_: any, i: number) => i !== index,
      );
      return updated;
    });
  };

  const handleAddIngredient = (category: string) => {
    setIngredients((prev: any) => ({
      ...prev,
      [category]: [
        ...prev[category],
        {
          name: "",
          quantity: "",
          unit: "Kg",
          purchasePrice: "",
          pricePerUnit: "",
        },
      ],
    }));
  };

  const handleFieldChange = (
    category: string,
    index: number,
    field: string,
    value: any,
  ) => {
    setIngredients((prev: any) => {
      const updated = { ...prev };
      updated[category][index][field] = value;
      const item = updated[category][index];
      const qty = Number(item.quantity);
      const price = Number(item.purchasePrice);
      if (qty > 0 && price > 0) {
        item.pricePerUnit = (price / qty).toFixed(2);
      }
      return { ...updated };
    });
  };

  const downloadInventoryTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    const currentMonth = new Date().toLocaleString("default", {
      month: "long",
    });

    const currentYear = new Date().getFullYear();

    /* =========================================================
     DATA SOURCE
  ========================================================= */

    const sourceData = restockHistory?.length
      ? restockHistory
      : Object.entries(ingredients).flatMap(([category, items]: any) =>
          items.map((item: any) => ({
            Category: category,
            Ingredient: item.name,
            Unit: item.unit || "Kg",
          })),
        );

    /* =========================================================
     CREATE 5 WEEK SHEETS
  ========================================================= */

    for (let week = 1; week <= 5; week++) {
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

        /* =====================================================
         BASIC INFO
      ===================================================== */

        row.getCell(1).value = rowData.Category || "";

        row.getCell(2).value = rowData.Ingredient || "";

        row.getCell(3).value = rowData.Unit || "Kg";

        /* =====================================================
         OPENING STOCK
      ===================================================== */

        row.getCell(4).value = rowData.OpeningQty || 0;

        row.getCell(5).value = rowData.OpeningPrice || 0;

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

          // DEFAULT VALUES

          row.getCell(currentCol).value = 0;

          row.getCell(currentCol + 1).value = 0;

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

        // CLOSING STOCK QTY

        row.getCell(currentCol + 3).value = 0;

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

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const allWeeks: any = {};

      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        allWeeks[`week${index + 1}`] = jsonData;
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
  const downloadVendorTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Vendors");

    worksheet.columns = [
      {
        header: "Vendor Name",
        key: "name",
        width: 30,
      },
      {
        header: "Address",
        key: "address",
        width: 40,
      },
      {
        header: "Phone Number",
        key: "phone",
        width: 20,
      },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.addRow({
      name: "ABC Traders",
      address: "Chennai",
      phone: "9876543210",
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "vendor-template.xlsx");
  };
  const handleVendorUpload = async (e: any) => {
    try {
      const file = e.target.files[0];

      if (!file) return;

      setUploadingVendor(true);

      const reader = new FileReader();

      reader.onload = async (evt: any) => {
        try {
          const data = new Uint8Array(evt.target.result);

          const workbook = XLSX.read(data, {
            type: "array",
          });

          const sheetName = workbook.SheetNames[0];

          const worksheet = workbook.Sheets[sheetName];

          const jsonData: any = XLSX.utils.sheet_to_json(worksheet);

    

    

          const res = await fetch(
            `${API_URL}/api/ingredients/uploadVendorData`,
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",

                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                restaurantId: user.restaurantId,

                branchId: selectedBranch?.id,

                vendors: jsonData,
              }),
            },
          );

          const result = await res.json();

          if (result.success) {
            alert(`Vendor upload successful (${jsonData.length} vendors)`);
            await fetchVendors();
          } else {
            alert(result.message || "Vendor upload failed");
          }
        } catch {
          alert("Failed to process vendor file");
        } finally {
          setUploadingVendor(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch {
      setUploadingVendor(false);
      alert("Vendor upload failed");
    }
  };
  const inventorySummary = restocks.reduce(
    (acc: any, row: any) => {
      acc.monthlyPurchase += Number(row.TotalPurchaseAmount || 0);
      acc.inventoryExpense += Number(row.TotalWeeklyExpense || 0);
      acc.closingStock += Number(row.MonthClosingValue || 0);
      acc.rmExpense += Number(row.MonthlyRMExpense || 0);
      return acc;
    },
    {
      monthlyPurchase: 0,
      inventoryExpense: 0,
      closingStock: 0,
      rmExpense: 0,
    },
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
        alert(data.message);
      }
    } catch {
      // mapping error
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

      const allIngredients = Object.values(ingredients).flat();
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
      }
    } catch {
      // fetch error
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
  const totalConsumptionValue = ingredientAnalytics.reduce(
    (acc: number, item: any) => {
      return acc + Number(item.totalCost || 0);
    },
    0,
  );
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

  /* STOCK RISK */

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
        color: "bg-red-500",
        text: "text-red-600",
      });
    } else if (remaining < 2) {
      aiAlerts.push({
        title: "Low Stock Alert",
        desc: `${item.ingredient} stock running low`,
        color: "bg-yellow-500",
        text: "text-yellow-600",
      });
    }
  });
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

  const inventoryValue = allIngredients.reduce((acc: number, item: any) => {
    return acc + Number(item.quantity || 0) * Number(item.pricePerUnit || 0);
  }, 0);

  const inventoryTurnover = (
    totalConsumptionValue / Math.max(inventoryValue, 1)
  ).toFixed(2);
  const fetchVendors = async () => {
    try {




      if (!selectedBranch?.id) {
        return;
      }

      const res = await fetch(
        `${API_URL}/api/ingredients/${user.restaurantId}/${selectedBranch.id}/fetchVendors`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await res.json();

      if (result.success) {
        setVendors(result.data || []);
      }
    } catch {
      // fetch error
    }
  };
  useEffect(() => {
    fetchVendors();
  }, []);
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 rounded-md">
      <div className="mx-auto space-y-6">
        {/* ================= HERO ================= */}

        <div className="relative overflow-hidden rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm">
          {/* Glow */}
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              {/* ICON */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                <UtensilsCrossed className="h-4 w-4 text-white" />
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
                  active ? "border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-sm" : "border-gray-200 bg-white hover:border-red-100 hover:bg-red-50/40"
                }`}
              >
                {active && <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-red-100 blur-3xl" />}
                <div className="relative z-10 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] font-bold ${active ? "text-red-600" : "text-gray-900"}`}>{tab.name}</p>
                    <p className="truncate text-[11px] text-gray-500">{tab.description}</p>
                  </div>
                  {active && <div className="h-2 w-2 rounded-full bg-red-500" />}
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
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
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
                  <button className="h-11 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90">
                    + Add Item
                  </button>
                </div>
              </div>

              {/* ================= TABLE ================= */}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
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
                              className="
          h-9
          w-full
          rounded-xl
          border
          border-gray-200
          bg-white
          px-3
          text-[12px]
          font-medium
          text-gray-700
          outline-none
          transition-all
          duration-200

          placeholder:text-gray-400

          hover:border-red-200
          focus:border-red-300
          focus:ring-2
          focus:ring-red-100
        "
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
                                className="
            h-9
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-3
            pr-9
            text-[12px]
            font-medium
            text-gray-700
            outline-none
            transition-all
            duration-200

            hover:border-red-200
            focus:border-red-300
            focus:ring-2
            focus:ring-red-100
          "
                              >
                                <option>All Categories</option>

                                <option>Kd Gunta Ponganalu</option>

                                <option>Kd Dosa</option>
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
                                className="
            h-9
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-3
            pr-9
            text-[12px]
            font-medium
            text-gray-700
            outline-none
            transition-all
            duration-200

            hover:border-red-200
            focus:border-red-300
            focus:ring-2
            focus:ring-red-100
          "
                              >
                                <option>All Types</option>

                                <option>Veg</option>

                                <option>Non Veg</option>
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
                                className="
            h-9
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-3
            pr-9
            text-[12px]
            font-medium
            text-gray-700
            outline-none
            transition-all
            duration-200

            hover:border-red-200
            focus:border-red-300
            focus:ring-2
            focus:ring-red-100
          "
                              >
                                <option>Sort Price</option>

                                <option>Low to High</option>

                                <option>High to Low</option>
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
                                className="
            h-9
            w-full
            appearance-none
            rounded-xl
            border
            border-gray-200
            bg-white
            pl-3
            pr-9
            text-[12px]
            font-medium
            text-gray-700
            outline-none
            transition-all
            duration-200

            hover:border-red-200
            focus:border-red-300
            focus:ring-2
            focus:ring-red-100
          "
                              >
                                <option>All Status</option>

                                <option>Available</option>

                                <option>Unavailable</option>
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
                      {menuItems?.length ? (
                        menuItems.map((item: any, index: number) => (
                          <tr
                            key={item.id || index}
                            className="border-b border-gray-100 transition hover:bg-gray-50/70"
                          >
                            {/* ITEM */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {/* IMAGE / AVATAR */}

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[14px] font-bold text-red-600">
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
                                  item.type === "VEG"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {item.type === "VEG" ? "Veg" : "Non Veg"}
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
                                <button className="rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50">
                                  Edit
                                </button>

                                <button className="rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600 transition hover:bg-red-100">
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
                            No menu items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* INGREDIENTS */}
          {activeTab === "ingredients" && (
            <div className="space-y-3">
              {/* ================= HEADER ================= */}

              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-center gap-3">
                    {/* ICON */}

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                      <CubeIcon className="h-5 w-5 text-white" />
                    </div>

                    {/* CONTENT */}

                    <div>
                      <h2 className="text-[24px] font-black tracking-tight text-gray-900">
                        Ingredients
                      </h2>

                      <p className="mt-0.5 text-[13px] text-gray-500">
                        Ingredient inventory & vendor management
                      </p>

                      {/* STATS */}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">
                          AI Generated
                        </div>

                        <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">
                          {Object.values(ingredients).flat().length} Ingredients
                        </div>

                        <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                          {Object.keys(ingredients).length} Categories
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={downloadVendorTemplate}
                      className="
              h-9
              rounded-xl
              border
              border-indigo-100
              bg-indigo-50
              px-4
              text-[12px]
              font-semibold
              text-indigo-600
              transition
              hover:bg-indigo-100
            "
                    >
                      Vendor Template
                    </button>

                    <label
                      className="
              flex
              h-9
              cursor-pointer
              items-center
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              text-[12px]
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-50
            "
                    >
                      {uploadingVendor ? "Uploading..." : "Upload Vendors"}

                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleVendorUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="
              flex
              h-9
              items-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-red-500
              to-pink-500
              px-4
              text-[12px]
              font-semibold
              text-white
              shadow-sm
              transition
              hover:scale-[1.01]
            "
                    >
                      <SparklesIcon className="h-4 w-4" />

                      {loading ? "Generating..." : "Generate"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= EMPTY ================= */}

              {Object.keys(ingredients).length === 0 && (
                <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-red-200 bg-white p-10">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500">
                      <SparklesIcon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-gray-900">
                      No Ingredients Generated
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Generate ingredient inventory automatically from menu
                      items
                    </p>

                    <button
                      onClick={handleGenerate}
                      className="
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-red-500
              to-pink-500
              px-5
              py-3
              text-sm
              font-semibold
              text-white
            "
                    >
                      <SparklesIcon className="h-4 w-4" />
                      Generate Ingredients
                    </button>
                  </div>
                </div>
              )}

              {/* ================= INVENTORY ================= */}

              {ingredients && Object.keys(ingredients).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(ingredients).map(
                    ([category, rawItems]: any) => {
                      const items = Array.isArray(rawItems) ? rawItems : [];

                      return (
                        <div
                          key={category}
                          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                        >
                          {/* CATEGORY HEADER */}

                          <div className="border-b border-gray-100 px-4 py-3">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                              {/* LEFT */}

                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                                  <FolderIcon className="h-4 w-4 text-red-500" />
                                </div>

                                <div>
                                  <h3 className="text-[17px] font-bold text-gray-900">
                                    {category}
                                  </h3>

                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[12px] text-gray-500">
                                      {items.length} Ingredients
                                    </span>

                                    <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-red-500">
                                      AI Generated
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* ACTION */}

                              <button
                                type="button"
                                onClick={() => handleAddIngredient(category)}
                                className="
                        flex
                        h-9
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-red-100
                        bg-red-50
                        px-4
                        text-[12px]
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-100
                      "
                              >
                                <PlusIcon className="h-4 w-4" />
                                Add Ingredient
                              </button>
                            </div>
                          </div>

                          {/* TABLE */}

                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              {/* HEAD */}

                              <thead className="border-b border-gray-100 bg-gray-50/70">
                                <tr>
                                  {[
                                    "Ingredient",
                                    "Qty",
                                    "Unit",
                                    "Purchase",
                                    "Unit Price",
                                    "Vendor",
                                    "Action",
                                  ].map((head) => (
                                    <th
                                      key={head}
                                      className="
                              px-4
                              py-2.5
                              text-left
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-[0.12em]
                              text-gray-400
                            "
                                    >
                                      {head}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              {/* BODY */}

                              <tbody>
                                {items.length > 0 ? (
                                  items.map((item: any, index: number) => (
                                    <tr
                                      key={index}
                                      className="border-b border-gray-100 hover:bg-gray-50/40"
                                    >
                                      {/* INGREDIENT */}

                                      <td className="px-4 py-2.5">
                                        <input
                                          value={item?.name || ""}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "name",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  w-full
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  font-medium
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        />
                                      </td>

                                      {/* QTY */}

                                      <td className="px-4 py-2.5">
                                        <input
                                          type="number"
                                          value={item?.quantity || ""}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "quantity",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  w-20
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        />
                                      </td>

                                      {/* UNIT */}

                                      <td className="px-4 py-2.5">
                                        <select
                                          value={item?.unit || "Kg"}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "unit",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        >
                                          <option>Kg</option>
                                          <option>Gram</option>
                                          <option>Litre</option>
                                          <option>Ml</option>
                                          <option>Piece</option>
                                        </select>
                                      </td>

                                      {/* PURCHASE */}

                                      <td className="px-4 py-2.5">
                                        <input
                                          type="number"
                                          value={item?.purchasePrice || ""}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "purchasePrice",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  w-28
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        />
                                      </td>

                                      {/* PRICE */}

                                      <td className="px-4 py-2.5">
                                        <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[12px] font-bold text-red-600">
                                          ₹{item?.pricePerUnit || 0}
                                        </div>
                                      </td>

                                      {/* VENDOR */}

                                      <td className="px-4 py-2.5">
                                        <select
                                          value={
                                            item?.vendor?.[0]?.vendor?.id || ""
                                          }
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "vendorId",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  min-w-[210px]
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  font-medium
                                  text-gray-700
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        >
                                          <option value="">
                                            Select Vendor
                                          </option>

                                          {vendors.map((vendor: any) => (
                                            <option
                                              key={vendor.id}
                                              value={vendor.id}
                                            >
                                              {vendor.name} •{" "}
                                              {vendor.phone || "No Phone"}
                                            </option>
                                          ))}
                                        </select>
                                      </td>

                                      {/* REMOVE */}

                                      <td className="px-4 py-2.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveIngredient(
                                              category,
                                              index,
                                            )
                                          }
                                          className="
                                  rounded-lg
                                  border
                                  border-red-100
                                  bg-red-50
                                  px-3
                                  py-2
                                  text-[11px]
                                  font-semibold
                                  text-red-600
                                  transition
                                  hover:bg-red-100
                                "
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-5 py-10 text-center text-sm text-gray-400"
                                    >
                                      No ingredients found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    },
                  )}

                  {/* SAVE */}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      className="
              flex
              h-10
              items-center
              gap-2
              rounded-xl
              bg-gradient-to-r
              from-red-500
              to-pink-500
              px-5
              text-[13px]
              font-semibold
              text-white
              shadow-sm
              transition
              hover:scale-[1.01]
            "
                    >
                      <CloudArrowUpIcon className="h-4 w-4" />
                      Save Ingredients
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* RESTOCK */}
          {activeTab === "restock" && (
            <div className="space-y-4">
              {/* ================= HERO ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-4">
                    {/* ICON */}

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                      <ArchiveBoxIcon className="h-5 w-5 text-white" />
                    </div>

                    {/* CONTENT */}

                    <div>
                      <h1 className="text-[24px] font-black leading-none tracking-tight text-gray-900">
                        Restock Analytics
                      </h1>

                      <p className="mt-1 text-[13px] text-gray-500">
                        Inventory purchase & stock tracking
                      </p>
                    </div>
                  </div>

                  {/* RIGHT KPI CHIPS */}

                  {/* RIGHT SECTION */}

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {/* KPI GROUP */}

                    {/* <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-2"> */}
                    {/* FOOD COST */}

                    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                        <ChartPieIcon className="h-3.5 w-3.5 text-red-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-red-400">
                          Food Cost
                        </p>

                        <p className="mt-1 text-[14px] font-black text-red-700">
                          {avgFoodCost}%
                        </p>
                      </div>
                    </div>

                    {/* INVENTORY */}

                    <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                        <ArchiveBoxIcon className="h-3.5 w-3.5 text-indigo-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-indigo-400">
                          Inventory
                        </p>

                        <p className="mt-1 text-[14px] font-black text-indigo-700">
                          ₹{Number(inventoryValue || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* TURNOVER */}

                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
                        <ArrowPathRoundedSquareIcon className="h-3.5 w-3.5 text-emerald-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                          Turnover
                        </p>

                        <p className="mt-1 text-[14px] font-black text-emerald-700">
                          {inventoryTurnover}x
                        </p>
                      </div>
                    </div>

                    {/* USAGE */}

                    <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                        <CubeTransparentIcon className="h-3.5 w-3.5 text-orange-600" />
                      </div>

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-orange-400">
                          Usage
                        </p>

                        <p className="mt-1 text-[14px] font-black text-orange-700">
                          ₹
                          {Number(totalConsumptionValue || 0).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                    </div>
                    {/* </div> */}

                    {/* DIVIDER */}

                    <div className="hidden h-10 w-px bg-gray-200 xl:block" />

                    {/* TEMPLATE BUTTON */}

                    <button onClick={downloadInventoryTemplate}
                      className="flex h-10 items-center rounded-xl border border-red-100 bg-white px-4 text-[12px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50">
                      Restock Template
                    </button>
                    <label className="flex h-10 cursor-pointer items-center rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:scale-[1.02]">
                      {uploadingRestock ? "Uploading..." : "Upload Restock"}

                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleUploadRestockSheet}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* ================= TABLE ================= */}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* ================= HEADER ================= */}

                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    {/* LEFT */}

                    <div>
                      <h3 className="text-[20px] font-black tracking-tight text-gray-900">
                        Inventory Sheet
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        Weekly stock & purchase tracking
                      </p>
                    </div>

                    {/* RIGHT */}

                    <div className="flex items-center gap-3">
                      {/* WEEK SWITCHER */}

                      <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1">
                        {[1, 2, 3, 4, 5].map(week => (
                          <button key={week} onClick={() => setSelectedWeek(`week${week}`)}
                            className={`min-w-[64px] rounded-xl px-3 py-2 text-[12px] font-semibold transition-all ${
                              selectedWeek === `week${week}` ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm" : "text-gray-600 hover:bg-white"
                            }`}>
                            Week {week}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= TABLE ================= */}

                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    {/* HEADER */}

                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr>
                        {[
                          "Ingredient",
                          "Category",
                          "Unit",
                          "Opening Qty",
                          "Opening Value",
                          "Purchase Qty",
                          "Expense",
                          "Closing",
                          "Monthly Purchase",
                          "RM Expense",
                        ].map((head) => (
                          <th key={head} className="whitespace-nowrap border-b border-gray-100 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* BODY */}

                    <tbody>
                      {restocks?.length ? (
                        restocks.map((row: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100 transition hover:bg-gray-50/80">
                            {/* INGREDIENT */}

                            <td className="px-4 py-3">
                              <div>
                                <p className="text-[14px] font-semibold text-gray-900">
                                  {row.Ingredient}
                                </p>

                                <p className="mt-0.5 text-[11px] text-gray-400">
                                  Inventory Item
                                </p>
                              </div>
                            </td>

                            {/* CATEGORY */}

                            <td className="px-4 py-3">
                              <div className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                                {row.Category}
                              </div>
                            </td>

                            {/* UNIT */}

                            <td className="px-4 py-3 text-[13px] font-medium text-gray-700">
                              {row.Unit}
                            </td>

                            {/* OPENING */}

                            <td className="px-4 py-3 text-[13px] text-gray-700">
                              {row.OpeningStockQty}
                            </td>

                            {/* OPENING VALUE */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-indigo-600">
                              ₹
                              {Number(
                                row.OpeningStockValue || 0,
                              ).toLocaleString("en-IN")}
                            </td>

                            {/* PURCHASE */}

                            <td className="px-4 py-3 text-[13px] text-gray-700">
                              {row.Week1PurchaseQty}
                            </td>

                            {/* EXPENSE */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-red-500">
                              ₹
                              {Number(row.Week1Expense || 0).toLocaleString(
                                "en-IN",
                              )}
                            </td>

                            {/* CLOSING */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-emerald-600">
                              ₹
                              {Number(
                                row.Week1ClosingValue || 0,
                              ).toLocaleString("en-IN")}
                            </td>

                            {/* MONTH PURCHASE */}

                            <td className="px-4 py-3 text-[13px] font-bold text-indigo-600">
                              ₹
                              {Number(
                                row.TotalPurchaseAmount || 0,
                              ).toLocaleString("en-IN")}
                            </td>

                            {/* RM */}

                            <td className="px-4 py-3 text-[13px] font-semibold text-orange-500">
                              ₹
                              {Number(row.MonthlyRMExpense || 0).toLocaleString(
                                "en-IN",
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-6 py-16 text-center text-sm text-gray-400"
                          >
                            No inventory data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* ITEM MAPPING */}
          {activeTab === "mapping" && (
            <div className="space-y-4">
              {/* ================= HEADER ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
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
                      <MdChecklist className="text-emerald-600" />

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
                      <MdWarningAmber className="text-red-600" />

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
                      <MdCurrencyRupee className="text-orange-600" />

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
                        className="
                h-10
                rounded-xl
                bg-gradient-to-r
                from-red-500
                to-pink-500
                px-4
                text-[12px]
                font-semibold
                text-white
                shadow-sm
                transition
                hover:scale-[1.02]
              "
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
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
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
                      {menuItems.map((item: any) => (
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
                      ? "border-red-100 bg-red-50"
                      : "border-gray-100 hover:bg-gray-50"
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
                        item.type === "VEG"
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
                          : "bg-red-50 text-red-600"
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                          {(() => {
                            const Icon =
                              iconMap[selectedMenuItem?.category?.icon] ||
                              MdRestaurant;

                            return (
                              <Icon className="text-[24px] text-red-500" />
                            );
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

                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">
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
                            bg: "bg-red-50",
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
                                type="number"
                                value={row.quantity || ""}
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
                                ₹0.00
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={row.wastage || 0}
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
                                className="
                        rounded-xl
                        bg-red-50
                        px-3
                        py-2
                        text-[12px]
                        font-semibold
                        text-red-600
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
                        className="
                rounded-xl
                bg-gradient-to-r
                from-red-500
                to-pink-500
                px-4
                py-2
                text-[12px]
                font-semibold
                text-white
                shadow-sm
              "
                      >
                        Save Mapping
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              {/* ================= HEADER ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>

                    <div>
                      <h2 className="text-[24px] font-black tracking-tight text-gray-900">
                        Menu Analytics
                      </h2>

                      <p className="mt-1 text-[13px] text-gray-500">
                        Ingredient usage, costing & operational intelligence
                      </p>
                    </div>
                  </div>

                  {/* KPI CHIPS */}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* FOOD COST */}

                    <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                      <ChartPieIcon className="h-4 w-4 text-red-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-red-400">
                          Food Cost
                        </p>

                        <p className="mt-1 text-[15px] font-black text-red-700">
                          {avgFoodCost}%
                        </p>
                      </div>
                    </div>

                    {/* INVENTORY */}

                    <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
                      <ArchiveBoxIcon className="h-4 w-4 text-indigo-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-400">
                          Inventory
                        </p>

                        <p className="mt-1 text-[15px] font-black text-indigo-700">
                          ₹
                          {allIngredients
                            .reduce((acc: number, item: any) => {
                              return (
                                acc +
                                Number(item.quantity || 0) *
                                  Number(item.pricePerUnit || 0)
                              );
                            }, 0)
                            .toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* TURNOVER */}

                    <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <ArrowPathRoundedSquareIcon className="h-4 w-4 text-emerald-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                          Turnover
                        </p>

                        <p className="mt-1 text-[15px] font-black text-emerald-700">
                          {(
                            totalConsumptionValue /
                            Math.max(
                              allIngredients.reduce(
                                (acc: number, item: any) => {
                                  return (
                                    acc +
                                    Number(item.quantity || 0) *
                                      Number(item.pricePerUnit || 0)
                                  );
                                },
                                0,
                              ),
                              1,
                            )
                          ).toFixed(2)}
                          x
                        </p>
                      </div>
                    </div>

                    {/* USAGE */}

                    <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
                      <CubeTransparentIcon className="h-4 w-4 text-orange-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-400">
                          Usage
                        </p>

                        <p className="mt-1 text-[15px] font-black text-orange-700">
                          ₹{totalConsumptionValue.toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* MARGIN */}

                    <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <BanknotesIcon className="h-4 w-4 text-emerald-600" />

                      <div className="leading-none">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                          Margin
                        </p>

                        <p className="mt-1 text-[15px] font-black text-emerald-700">
                          {avgProfitMargin}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= TOP SECTION ================= */}

              <div className="grid grid-cols-1 gap-4 ">
                {/* ================= ANALYTICS + ALERTS ================= */}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                  {/* ================= LEFT ================= */}

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    {/* TOP */}

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      {/* TITLE */}

                      <div>
                        <h3 className="text-[18px] font-black tracking-tight text-gray-900">
                          Ingredient Intelligence
                        </h3>

                        <p className="mt-1 text-[12px] text-gray-500">
                          Usage analytics & inventory distribution
                        </p>
                      </div>

                      {/* RIGHT */}

                      <div className="flex items-center gap-2">
                        {/* VIEW TOGGLE */}

                        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                          {["pie", "table"].map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)}
                              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${viewMode === mode ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}>
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                          ))}
                        </div>
                        <select
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none"
                        >
                          <option value="all">All Categories</option>
                          {[...new Set(ingredientAnalytics.map((i: any) => i.category || "Other"))].map(cat => (
                            <option key={String(cat)} value={String(cat)}>{String(cat)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* ================= DATA ================= */}

                    {(() => {
                      const totalUsage = ingredientAnalytics.reduce((s: number, i: any) => s + Number(i.consumed || 0), 0);
                      const ingredientData = ingredientAnalytics.map((i: any) => ({
                        ingredient: i.ingredient,
                        usage: totalUsage > 0 ? Math.round((Number(i.consumed || 0) / totalUsage) * 100) : 0,
                        consumed: `${Number(i.consumed || 0).toFixed(2)} ${i.unit || ""}`,
                        cost: Math.round(Number(i.totalCost || 0)),
                        category: i.category || "Other",
                      }));

                      const filteredData = selectedCategory === "all"
                        ? ingredientData
                        : ingredientData.filter(i => i.category === selectedCategory);

                      return (
                        <>
                          {/* ================= PIE VIEW ================= */}

                          {viewMode === "pie" && (
                            <>
                              {/* PIE */}

                              <div className="mt-4 h-[220px] rounded-2xl border border-gray-100 bg-gray-50/40 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={filteredData}
                                      dataKey="usage"
                                      nameKey="ingredient"
                                      innerRadius={50}
                                      outerRadius={80}
                                      paddingAngle={3}
                                    >
                                      {filteredData.map((_, index) => {
                                        const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f97316", "#ec4899"];
                                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                                      })}
                                    </Pie>

                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* LEGEND */}

                              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                {filteredData.map((item, index) => {
                                  const colors = [
                                    "bg-red-500",
                                    "bg-blue-500",
                                    "bg-emerald-500",
                                    "bg-orange-500",
                                    "bg-pink-500",
                                  ];

                                  return (
                                    <div key={index} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm">
                                      <div className={`h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`} />
                                      <p className="text-[11px] font-semibold text-gray-700">{item.ingredient}</p>
                                      <span className="text-[10px] font-bold text-gray-400">{item.usage}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}

                          {/* ================= TABLE VIEW ================= */}

                          {viewMode === "table" && (
                            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                              <table className="min-w-full">
                                {/* HEAD */}

                                <thead className="bg-gray-50">
                                  <tr>
                                    {[
                                      "Ingredient",
                                      "Category",
                                      "Usage %",
                                      "Consumed",
                                      "Cost",
                                    ].map((head) => (
                                      <th key={head} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                        {head}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>

                                {/* BODY */}

                                <tbody>
                                  {filteredData.map((item, index) => (
                                    <tr
                                      key={index}
                                      className="border-t border-gray-100 hover:bg-gray-50/50"
                                    >
                                      <td className="px-4 py-3">
                                        <p className="text-[13px] font-semibold text-gray-900">
                                          {item.ingredient}
                                        </p>
                                      </td>

                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                                          {item.category}
                                        </span>
                                      </td>

                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="h-1.5 w-24 rounded-full bg-gray-100">
                                            <div
                                              className="h-1.5 rounded-full bg-red-500"
                                              style={{
                                                width: `${item.usage}%`,
                                              }}
                                            />
                                          </div>

                                          <span className="text-[12px] font-semibold text-gray-700">
                                            {item.usage}%
                                          </span>
                                        </div>
                                      </td>

                                      <td className="px-4 py-3 text-[12px] text-gray-600">
                                        {item.consumed}
                                      </td>

                                      <td className="px-4 py-3">
                                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                                          ₹{item.cost}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* ================= RIGHT ================= */}

                  <div className="space-y-4">
                    {/* ALERTS */}

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm h-fit">
                      {/* TOP */}

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[18px] font-black tracking-tight text-gray-900">
                            Operational Alerts
                          </h3>

                          <p className="mt-1 text-[12px] text-gray-500">
                            Waste & operational monitoring
                          </p>
                        </div>

                        <div className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600">
                          AI Monitoring
                        </div>
                      </div>

                      {/* ALERT */}

                      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-bold text-gray-900">
                                Inventory Healthy
                              </p>

                              <span className="text-[10px] font-semibold text-gray-400">
                                Live
                              </span>
                            </div>

                            <p className="mt-1 text-[12px] text-gray-500">
                              No operational risks detected
                            </p>
                          </div>

                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const sorted = [...ingredientAnalytics].sort((a: any, b: any) => Number(b.consumed || 0) - Number(a.consumed || 0));
                        const costSorted = [...ingredientAnalytics].sort((a: any, b: any) => Number(b.totalCost || 0) - Number(a.totalCost || 0));
                        return [
                          { label: "Highest Usage", value: sorted[0]?.ingredient || "—", sub: sorted[0] ? `${Number(sorted[0].consumed || 0).toFixed(1)} ${sorted[0].unit || ""}` : "No data", color: "text-red-600" },
                          { label: "Fastest Moving", value: sorted[1]?.ingredient || "—", sub: "High kitchen demand", color: "text-emerald-600" },
                          { label: "Highest Cost", value: costSorted[0]?.ingredient || "—", sub: costSorted[0] ? `₹${Math.round(Number(costSorted[0].totalCost || 0)).toLocaleString()}` : "No data", color: "text-orange-600" },
                          { label: "Total Consumption", value: `₹${Math.round(totalConsumptionValue).toLocaleString()}`, sub: `${ingredientAnalytics.length} ingredients tracked`, color: "text-indigo-600" },
                        ].map(c => (
                          <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{c.label}</p>
                            <p className={`mt-2 truncate text-[18px] font-black ${c.color}`}>{c.value}</p>
                            <p className="mt-1 text-[11px] text-gray-500">{c.sub}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= TABLE ================= */}

              {/* <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"> */}
              {/* HEADER */}

              {/* <div className="border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[18px] font-black tracking-tight text-gray-900">
                        Consumption Analytics
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        Ingredient consumption intelligence
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">
                      Auto Calculated
                    </span>
                  </div>
                </div> */}

              {/* TABLE */}

              {/* <div className="overflow-auto">
                  <table className="min-w-full">

                    <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                      <tr>
                        {[
                          "Ingredient",
                          "Consumed",
                          "Avg Daily",
                          "Recipe Cost",
                          "Waste %",
                          "Status",
                        ].map((head, index) => (
                          <th
                            key={index}
                            className="
                    whitespace-nowrap
                    px-4
                    py-2.5
                    text-left
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.14em]
                    text-gray-400
                  "
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>


                    <tbody>
                      {ingredientAnalytics?.map((row: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-indigo-50/10"
                        >
                

                          <td className="px-4 py-2.5">
                            <p className="text-[13px] font-semibold text-gray-900">
                              {row.ingredient}
                            </p>
                          </td>


                          <td className="px-4 py-2.5 text-[12px] text-gray-600">
                            {Math.round(Number(row.consumed || 0))} {row.unit}
                          </td>


                          <td className="px-4 py-2.5 text-[12px] text-gray-600">
                            {(Number(row.consumed || 0) / 30).toFixed(1)}{" "}
                            {row.unit}
                          </td>


                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                              ₹{Number(row.totalCost || 0).toFixed(0)}
                            </span>
                          </td>


                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-500">
                              0%
                            </span>
                          </td>


                          <td className="px-4 py-2.5">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                              Healthy
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div> */}
              {/* </div> */}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
