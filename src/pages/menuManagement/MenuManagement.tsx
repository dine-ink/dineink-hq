import { useEffect, useState } from "react";
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
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState("week1");
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const API_URL = import.meta.env.VITE_API_URL;
  useEffect(() => {
    const storedBranches = JSON.parse(localStorage.getItem("branches") || "[]");

    const storedSelectedBranch = JSON.parse(
      localStorage.getItem("selectedBranch") || "null",
    );

    setBranches(storedBranches);

    if (storedSelectedBranch?.id) {
      setSelectedBranch(storedSelectedBranch);
    } else if (storedBranches.length > 0) {
      setSelectedBranch(storedBranches[0]);
    }
  }, []);
  useEffect(() => {
    const handleBranchChange = () => {
      const updatedBranches = JSON.parse(
        localStorage.getItem("branches") || "[]",
      );

      const updatedSelectedBranch = JSON.parse(
        localStorage.getItem("selectedBranch") || "null",
      );

      setBranches(updatedBranches);

      if (updatedSelectedBranch?.id) {
        setSelectedBranch(updatedSelectedBranch);
      }
    };

    window.addEventListener("branchChanged", handleBranchChange);

    return () => {
      window.removeEventListener("branchChanged", handleBranchChange);
    };
  }, []);
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
      const token = localStorage.getItem("token");

      const user = JSON.parse(localStorage.getItem("user") || "{}");

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
    } catch (err) {
      console.log(err);
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
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
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
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
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
    } catch (err) {
      console.log(err);
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
      const token = localStorage.getItem("token");

      const user = JSON.parse(localStorage.getItem("user") || "{}");

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
    } catch (err) {
      console.log(err);

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

          const token = localStorage.getItem("token");

          const user = JSON.parse(localStorage.getItem("user") || "{}");

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
        } catch (err) {
          console.log(err);

          alert("Failed to process vendor file");
        } finally {
          setUploadingVendor(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.log(err);

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

      const token = localStorage.getItem("token");
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
    } catch (err) {
      console.log(err);
    } finally {
      setMappingLoading(false);
    }
  };

  const fetchMenuItemMappings = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
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
    } catch (err) {
      console.log(err);
    }
  };

  const handleAISuggest = async () => {
    try {
      const token = localStorage.getItem("token");
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
    } catch (err) {
      console.log(err);
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
        const token = localStorage.getItem("token");

        const user = JSON.parse(localStorage.getItem("user") || "{}");

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
          console.log("Restock History:", json.data.restocks);
          const currentMonthRestock = (json.data.restocks || []).find(
            (item: any) =>
              item.month === currentMonth && item.year === currentYear,
          );
          const selectedWeekData =
            currentMonthRestock?.data?.[selectedWeek] || [];
          console.log("Selected Week Data:", selectedWeekData);
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
          setRestocks(formattedRestocks);

          setCategories(json.data.categories || []);
        }
      } catch (err) {
        console.log(err);
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
      const token = localStorage.getItem("token");

      const user = JSON.parse(localStorage.getItem("user") || "{}");

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
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    fetchVendors();
  }, []);
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 px-6 py-6">
      <div className="mx-auto space-y-6">
        {/* ================= HERO ================= */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
          {/* Glow */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-100/70 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* LEFT */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                MENU OPERATIONS
              </div>
              {/* Title */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <UtensilsCrossed className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-900">
                    Menu Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Menu items, inventory & stock analytics
                  </p>
                </div>
              </div>
            </div>
            {/* RIGHT */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
                Live Inventory
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                Stock Synced
              </div>
              <div className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-600">
                Analytics Enabled
              </div>
            </div>
          </div>
        </div>
        {/* ================= TABS ================= */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                  active
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-[0_10px_30px_rgba(255,0,80,0.08)]"
                    : "border-gray-200 bg-white hover:-translate-y-1 hover:border-red-100 hover:shadow-lg"
                }`}
              >
                {/* Glow */}
                {active && (
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100 blur-3xl" />
                )}
                <div className="relative z-10">
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    {/* Icon */}
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-red-100" : "bg-gray-100"}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          active ? "text-red-600" : "text-gray-500"
                        }`}
                      />
                    </div>
                    {/* Active Indicator */}
                    {active && (
                      <div className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                        Active
                      </div>
                    )}
                  </div>
                  {/* Title */}
                  <h3
                    className={`mt-4 text-base font-bold ${
                      active ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {tab.name}
                  </h3>
                  {/* Description */}
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {/* ================= CONTENT ================= */}
        <div className="rounded-2xl border border-white/40 bg-white/80 p-8 shadow-sm backdrop-blur-xl">
          {/* MENU */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              {/* HEADER */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Manage menu items, pricing, availability and categories
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <input
                    placeholder="Search menu item..."
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                  />
                  <button className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600">
                    + Add Menu Item
                  </button>
                </div>
              </div>
              {/* TABLE */}
              <div className="overflow-hidden rounded-2xl border border-white/40 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    {/* HEADER */}
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr className="text-left">
                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                          Item Name
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                          Category
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                          Price
                        </th>
                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    {/* BODY */}
                    <tbody>
                      {menuItems?.length ? (
                        menuItems.map((item: any, index: number) => (
                          <tr
                            key={item.id || index}
                            className="border-b border-gray-50 transition hover:bg-gray-50"
                          >
                            {/* NAME */}
                            <td className="px-4 py-4">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  ID: {item.id}
                                </p>
                              </div>
                            </td>
                            {/* CATEGORY */}
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {item.category?.name || "-"}
                            </td>
                            {/* TYPE */}
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.type === "VEG"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {item.type || "-"}
                              </span>
                            </td>
                            {/* PRICE */}
                            <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                              ₹{item.price}
                            </td>
                            {/* STATUS */}
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.isAvailable
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </span>
                            </td>
                            {/* ACTIONS */}
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                                  Edit
                                </button>
                                <button className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100">
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
                            className="px-6 py-14 text-center text-sm text-gray-400"
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
            <div className="space-y-4">
              {/* TOP HEADER */}
              <div className="rounded-2xl border border-white/40 bg-white p-4 shadow-sm backdrop-blur-xl">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 shadow-lg shadow-red-200">
                      <CubeIcon className="h-7 w-7 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-gray-900">
                        Ingredients
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        AI-generated ingredient management workspace
                      </p>
                      {/* STATS */}
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          AI Generated
                        </div>
                        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                          {Object.values(ingredients).flat().length} Ingredients
                        </div>
                        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                          {Object.keys(ingredients).length} Categories
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* GENERATE */}
                    <div className="flex items-center rounded-xl border border-indigo-100 bg-indigo-50 p-1 shadow-sm">
                      <button
                        onClick={downloadVendorTemplate}
                        className="
        whitespace-nowrap
        rounded-lg
        px-3 py-1.5
        text-xs font-semibold
        text-indigo-600
        transition
        hover:bg-white
      "
                      >
                        Vendor Template
                      </button>

                      <label
                        className="
        cursor-pointer
        whitespace-nowrap
        rounded-lg
        px-3 py-1.5
        text-xs font-semibold
        text-indigo-600
        transition
        hover:bg-white
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
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-5 text-sm font-semibold text-white shadow-lg shadow-red-100 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      {loading ? "Generating..." : "Generate"}
                    </button>
                  </div>
                </div>
              </div>
              {/* EMPTY STATE */}
              {Object.keys(ingredients).length === 0 && (
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/40 p-10">
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-[0_20px_50px_rgba(255,0,80,0.25)]">
                      <SparklesIcon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="mt-8 text-xl font-bold text-gray-900">
                      No Inventory Setup Found
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
                      Generate ingredients automatically using AI based on your
                      restaurant menu.
                    </p>
                    <button
                      onClick={handleGenerate}
                      className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      Generate Ingredients
                    </button>
                  </div>
                </div>
              )}
              {/* INVENTORY */}
              {ingredients && Object.keys(ingredients).length > 0 && (
                <div className="space-y-5">
                  {Object.entries(ingredients).map(
                    ([category, rawItems]: any) => {
                      const items = Array.isArray(rawItems) ? rawItems : [];
                      return (
                        <div
                          key={category}
                          className="overflow-hidden rounded-xl border border-white/40 bg-white shadow-sm backdrop-blur-xl"
                        >
                          {/* CATEGORY HEADER */}
                          <div className="border-b border-gray-100 bg-red-50/30 px-4 py-3">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                              {/* LEFT */}
                              <div className="flex items-center gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                                  <FolderIcon className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {category}
                                  </h3>
                                  <div className="mt-1 flex items-center gap-3">
                                    <p className="text-sm text-gray-500">
                                      {items.length} Ingredients
                                    </p>
                                    <div className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">
                                      AI Generated
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* ACTION */}
                              <button
                                type="button"
                                onClick={() => handleAddIngredient(category)}
                                className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Add Ingredient
                              </button>
                            </div>
                          </div>
                          {/* TABLE */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              {/* HEADER */}
                              <thead className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
                                <tr>
                                  {[
                                    "Ingredient",
                                    "Qty",
                                    "Unit",
                                    "Purchase Price",
                                    "Price / Unit",
                                    "Vendor",
                                    "Action",
                                  ].map((head) => (
                                    <th
                                      key={head}
                                      className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400"
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
                                      className="border-b border-gray-100 transition-all duration-200 hover:bg-gray-50"
                                    >
                                      {/* INGREDIENT */}
                                      <td className="px-5 py-3">
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
                                          className="w-full rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-2 text-sm font-medium outline-none transition-all duration-200 focus:border-gray-300 focus:ring-2 focus:ring-red-100 focus:bg-white"
                                        />
                                      </td>
                                      {/* QTY */}
                                      <td className="px-5 py-3">
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
                                          className="w-24 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-gray-300 focus:ring-2 focus:ring-red-100 focus:bg-white"
                                        />
                                      </td>
                                      {/* UNIT */}
                                      <td className="px-5 py-3">
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
                                          className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-gray-300 focus:ring-2 focus:ring-red-100 focus:bg-white"
                                        >
                                          <option>Kg</option>
                                          <option>Gram</option>
                                          <option>Litre</option>
                                          <option>Ml</option>
                                          <option>Piece</option>
                                        </select>
                                      </td>
                                      {/* PURCHASE PRICE */}
                                      <td className="px-5 py-3">
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
                                          className="w-32 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-gray-300 focus:ring-2 focus:ring-red-100 focus:bg-white"
                                        />
                                      </td>
                                      {/* PRICE PER UNIT */}
                                      <td className="px-5 py-3">
                                        <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                                          ₹{item?.pricePerUnit || 0}
                                        </div>
                                      </td>
                                      {/* VENDOR */}
                                      <td className="px-5 py-3">
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
    min-w-[220px]
    rounded-xl
    border
    border-gray-100
    bg-gray-50/80
    px-3
    py-2.5
    text-sm
    font-medium
    text-gray-700
    outline-none
    transition-all
    duration-200
    focus:border-gray-300
    focus:ring-2
    focus:ring-red-100
    focus:bg-white
  "
                                        >
                                          <option value="">
                                            🏪 Select Vendor
                                          </option>

                                          {vendors.map((vendor: any) => (
                                            <option
                                              key={vendor.id}
                                              value={vendor.id}
                                            >
                                              🧾 {vendor.name} •{" "}
                                              {vendor.phone || "No Phone"}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      {/* REMOVE */}
                                      <td className="px-5 py-3">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveIngredient(
                                              category,
                                              index,
                                            )
                                          }
                                          className="rounded-xl bg-gray-100 hover:bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={6}
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
                  {/* FLOATING SAVE */}
                  <div className="sticky bottom-5 flex justify-end">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(255,0,80,0.25)] transition-all duration-300 hover:scale-[1.02]"
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
            <div className="space-y-6">
              {/* HEADER */}
              <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                      Inventory Tracking
                    </div>
                    <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                      Restock Analytics
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Weekly stock movement, purchase analytics & inventory
                      expense tracking
                    </p>
                    {/* TAGS */}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                        {restocks.length} Inventory Rows
                      </div>
                      <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                        Purchase Analytics
                      </div>
                      <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                        Monthly Tracking
                      </div>
                    </div>
                  </div>
                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                    {/* VENDOR GROUP */}
                    {/* <div className="flex items-center rounded-xl border border-indigo-100 bg-indigo-50 p-1 shadow-sm">
                      <button
                        onClick={downloadVendorTemplate}
                        className="
        whitespace-nowrap
        rounded-lg
        px-3 py-1.5
        text-xs font-semibold
        text-indigo-600
        transition
        hover:bg-white
      "
                      >
                        Vendor Template
                      </button>

                      <label
                        className="
        cursor-pointer
        whitespace-nowrap
        rounded-lg
        px-3 py-1.5
        text-xs font-semibold
        text-indigo-600
        transition
        hover:bg-white
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
                    </div> */}

                    {/* RESTOCK GROUP */}
                    <div className="flex items-center rounded-xl border border-red-100 bg-red-50 p-1 shadow-sm">
                      <button
                        onClick={downloadInventoryTemplate}
                        className="
        whitespace-nowrap
        rounded-lg
        px-3 py-1.5
        text-xs font-semibold
        text-red-600
        transition
        hover:bg-red-100
      "
                      >
                        Restock Template
                      </button>

                      <label
                        className="
        cursor-pointer
        whitespace-nowrap
        rounded-lg
        px-3 py-1.5
        text-xs font-semibold
        text-red-600
        transition
        hover:bg-red-100
      "
                      >
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
              </div>
              {/* KPI */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Food Cost %",
                    value: avgFoodCost,
                    color: "text-red-600",
                    bg: "bg-red-50",
                    icon: ChartPieIcon,
                    prefix: "",
                    suffix: "%",
                  },

                  {
                    label: "Inventory Value",
                    value: inventoryValue,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                    icon: ArchiveBoxIcon,
                    prefix: "₹",
                    suffix: "",
                  },

                  {
                    label: "Inventory Turnover",
                    value: inventoryTurnover,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    icon: ArrowPathRoundedSquareIcon,
                    prefix: "",
                    suffix: "x",
                  },

                  {
                    label: "Inventory Usage",
                    value: totalConsumptionValue,
                    color: "text-orange-500",
                    bg: "bg-orange-50",
                    icon: CubeTransparentIcon,
                    prefix: "₹",
                    suffix: "",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Glow */}
                      <div
                        className={`absolute -right-10 -top-10 h-24 w-24 rounded-full ${item.bg} blur-3xl opacity-60`}
                      />
                      <div className="relative z-10">
                        {/* Top */}
                        <div className="flex items-start justify-between">
                          {/* Icon */}
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}
                          >
                            <Icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          {/* Trend */}
                          <div className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                            LIVE
                          </div>
                        </div>
                        {/* Label */}
                        <p className="mt-4 text-sm font-medium text-gray-500">
                          {item.label}
                        </p>
                        {/* Value */}
                        <p
                          className={`mt-1 text-2xl font-black tracking-tight ${item.color}`}
                        >
                          {item.prefix}
                          {Number(item.value || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          {item.suffix}
                        </p>
                        {/* Footer */}
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-400">
                            Inventory analytics
                          </p>
                          <div
                            className={`h-2 w-2 rounded-full ${item.bg.replace("bg-", "bg-")}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* TABLE */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
                {/* TOP */}
                <div className="border-b border-gray-100 bg-red-50/40 px-6 py-4">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    {/* LEFT */}
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-gray-900">
                        Inventory Sheet
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Weekly purchase and stock movement tracking
                      </p>
                    </div>
                    {/* RIGHT */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((week) => (
                          <button
                            key={week}
                            onClick={() => setSelectedWeek(`week${week}`)}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                              selectedWeek === `week${week}`
                                ? "bg-red-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            Week {week}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* TABLE */}
                <div className="overflow-auto max-h-[75vh]">
                  <table className="min-w-[1600px] border-separate border-spacing-0 text-sm">
                    {/* HEADER */}
                    <thead>
                      {/* GROUP HEADER */}
                      <tr className="sticky top-0 z-50">
                        {/* FIXED LEFT AREA */}
                        <th
                          colSpan={3}
                          className="sticky left-0 z-[60] min-w-[520px] border-b border-r border-gray-200 bg-white px-5 py-3"
                        ></th>
                        {/* OPENING */}
                        <th
                          colSpan={3}
                          className="border-b border-r border-gray-200 bg-slate-50 px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-gray-500"
                        >
                          Opening Stock
                        </th>
                        {/* WEEK 1 */}
                        <th
                          colSpan={5}
                          className="border-b border-r border-red-100 bg-red-50 px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-red-600"
                        >
                          {selectedWeek}
                        </th>
                        {/* MONTH */}
                        <th
                          colSpan={4}
                          className="border-b bg-indigo-50 px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-indigo-600"
                        >
                          Monthly
                        </th>
                      </tr>
                      {/* COLUMN HEADER */}
                      <tr className="sticky top-[48px] z-40">
                        {/* INGREDIENT */}
                        <th className="sticky left-0 z-[55] min-w-[240px] whitespace-nowrap border-b border-r border-gray-100 bg-white px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                          Ingredient
                        </th>
                        {/* CATEGORY */}
                        <th className="sticky left-[240px] z-[55] min-w-[160px] whitespace-nowrap border-b border-r border-gray-100 bg-white px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                          Category
                        </th>
                        {/* UNIT */}
                        <th className="sticky left-[400px] z-[55] min-w-[120px] whitespace-nowrap border-b border-r border-gray-100 bg-white px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                          Unit
                        </th>
                        {[
                          "Opening Qty",
                          "Opening Price",
                          "Opening Value",

                          "Purchase Qty",
                          "Price",
                          "Expense",
                          "Closing",
                          "Closing Value",

                          "Purchase",
                          "Expense",
                          "Closing",
                          "RM Expense",
                        ].map((head, index) => (
                          <th
                            key={`${head}-${index}`}
                            className="whitespace-nowrap border-b border-r border-gray-100 bg-white px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    {/* BODY */}
                    <tbody>
                      {restocks?.length ? (
                        restocks.map((row: any, index: number) => (
                          <tr
                            key={index}
                            className={`transition hover:bg-gray-50 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                            }`}
                          >
                            {/* INGREDIENT */}
                            <td className="sticky left-0 z-40 min-w-[240px] whitespace-nowrap border-b border-r border-gray-100 bg-white px-4 py-3">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {row.Ingredient}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  Inventory Item
                                </p>
                              </div>
                            </td>
                            {/* CATEGORY */}
                            <td className="sticky left-[240px] z-40 min-w-[160px] whitespace-nowrap border-b border-r border-gray-100 bg-white px-4 py-3">
                              <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                {row.Category}
                              </div>
                            </td>
                            {/* UNIT */}
                            <td className="sticky left-[400px] z-40 min-w-[120px] whitespace-nowrap border-b border-r border-gray-100 bg-white px-4 py-3 font-medium text-gray-700">
                              {row.Unit}
                            </td>
                            {/* OPENING QTY */}
                            <td className="border-b border-r border-gray-100 bg-slate-50 px-4 py-3">
                              {row.OpeningStockQty}
                            </td>
                            {/* OPENING PRICE */}
                            <td className="border-b border-r border-gray-100 px-4 py-3 bg-slate-50">
                              ₹
                              {Number(
                                row.OpeningStockPrice || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            {/* OPENING VALUE */}
                            <td className="border-b border-r border-gray-200 px-4 py-3 bg-slate-50 font-semibold text-indigo-600">
                              ₹
                              {Number(
                                row.OpeningStockValue || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            {/* PURCHASE QTY */}
                            <td className="border-b border-r border-red-100 bg-red-50/20 px-4 py-3">
                              {row.Week1PurchaseQty}
                            </td>
                            {/* PRICE */}
                            <td className="border-b border-r border-red-100 bg-red-50/20 px-4 py-3">
                              ₹
                              {Number(row.Week1Price || 0).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </td>
                            {/* EXPENSE */}
                            <td className="border-b border-r border-red-100 bg-red-50/20 px-4 py-3 font-semibold text-red-600">
                              ₹
                              {Number(row.Week1Expense || 0).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </td>
                            {/* CLOSING */}
                            <td className="border-b border-r border-red-100 bg-red-50/20 px-4 py-3">
                              ₹
                              {Number(
                                row.Week1ClosingStock || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            {/* CLOSING VALUE */}
                            <td className="border-b border-r border-red-100 bg-red-50/20 px-4 py-3 font-semibold text-emerald-600">
                              ₹
                              {Number(
                                row.Week1ClosingValue || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            {/* MONTH PURCHASE */}
                            <td className="border-b border-r border-indigo-100 bg-indigo-50/40 px-4 py-3 font-bold text-indigo-600">
                              ₹
                              {Number(
                                row.TotalPurchaseAmount || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            {/* MONTH EXPENSE */}
                            <td className="border-b border-r border-indigo-100 bg-indigo-50/20 px-4 py-3 font-medium text-red-500">
                              ₹
                              {Number(
                                row.TotalWeeklyExpense || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            {/* MONTH CLOSING */}
                            <td className="border-b border-r border-indigo-100 bg-indigo-50/20 px-4 py-3 font-medium text-emerald-600">
                              ₹
                              {Number(
                                row.MonthClosingValue || 0,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            {/* RM EXPENSE */}
                            <td className="border-b bg-indigo-50/20 px-4 py-3 font-medium text-orange-500">
                              ₹
                              {Number(row.MonthlyRMExpense || 0).toLocaleString(
                                "en-IN",
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={15}
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
            <div className="space-y-6">
              {/* HEADER */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}
                  <div>
                    {/* BADGE */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                      Recipe Intelligence
                    </div>
                    {/* TITLE */}
                    <div className="mt-3 flex items-center gap-3">
                      {/* ICON */}
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
                        <MdRestaurantMenu className="text-2xl text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-gray-900">
                          Item Mapping
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-500">
                          Map ingredients to menu items and monitor recipe
                          costing intelligence
                        </p>
                      </div>
                    </div>
                    {/* META TAGS */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                        {menuItems.length} Menu Items
                      </div>
                      <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                        {mappedItems.length} Mapped
                      </div>
                      <div className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                        {unmappedItems.length} Unmapped
                      </div>
                    </div>
                  </div>
                  {/* RIGHT */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* AI SUGGEST */}
                    <button
                      onClick={handleAISuggest}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                      AI Suggest
                    </button>
                    {/* SAVE */}
                    <button
                      onClick={handleSaveMapping}
                      className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:scale-[1.02]"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
              {/* KPI */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Menu Items",
                    value: menuItems.length,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                    icon: MdRestaurantMenu,
                    meta: "Available recipes",
                  },
                  {
                    label: "Mapped Items",
                    value: mappedItems.length,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    icon: MdChecklist,
                    meta: "Ingredients linked",
                  },
                  {
                    label: "Unmapped",
                    value: unmappedItems.length,
                    color: "text-red-600",
                    bg: "bg-red-50",
                    icon: MdWarningAmber,
                    meta: "Needs attention",
                  },
                  {
                    label: "Avg Recipe Cost",
                    value: `₹${avgRecipeCost}`,
                    color: "text-orange-500",
                    bg: "bg-orange-50",
                    icon: MdCurrencyRupee,
                    meta: "Average preparation cost",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Glow */}
                    <div
                      className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${item.bg} opacity-60 blur-3xl`}
                    />
                    <div className="relative z-10">
                      {/* TOP */}
                      <div className="flex items-start justify-between">
                        {/* ICON */}
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}
                        >
                          <item.icon className={`text-2xl ${item.color}`} />
                        </div>
                        {/* LIVE */}
                        <div className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          Live
                        </div>
                      </div>
                      {/* LABEL */}
                      <p className="mt-3 text-sm font-medium text-gray-500">
                        {item.label}
                      </p>
                      {/* VALUE */}
                      <p
                        className={`mt-1 text-2xl font-black tracking-tight ${item.color}`}
                      >
                        {item.value}
                      </p>
                      {/* FOOTER */}
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400">{item.meta}</p>
                        <div
                          className={`h-2 w-2 rounded-full ${item.bg.replace("bg-", "bg-")}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* MAIN */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
                {/* LEFT MENU */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm ">
                  {/* SEARCH */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      placeholder="Search menu items..."
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  {/* MENU LIST */}
                  <div className="max-h-[680px] overflow-auto p-4">
                    <div className="space-y-2">
                      {menuItems.map((item: any) => (
                        <div
                          key={item.id}
                          className={`cursor-pointer rounded-2xl border p-3 transition-all duration-300 hover:bg-gray-50  ${
                            selectedMenuItem?.id === item.id
                              ? "border-red-100 bg-gradient-to-r from-red-50 to-white"
                              : "border-gray-100 bg-white"
                          }`}
                          onClick={() => {
                            setSelectedMenuItem(item);
                            setIngredientMappings(
                              item.menuItemIngredients || [],
                            );
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {item.name}
                              </h3>
                              <p className="mt-1 text-xs text-gray-500">
                                {item.category?.name || "No Category"}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                                item.type === "VEG"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {item.type}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-base font-semibold text-gray-900">
                              ₹{item.price}
                            </p>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold
                              ${
                                item.menuItemIngredients?.length > 0
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-red-50 text-red-600"
                              }`}
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
                {/* RIGHT */}
                <div className="space-y-6">
                  {/* TOP CARD */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                      {/* LEFT */}
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                          {(() => {
                            const Icon =
                              iconMap[selectedMenuItem?.category?.icon] ||
                              MdRestaurant;
                            return <Icon className="text-3xl text-red-500" />;
                          })()}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black tracking-tight text-gray-900">
                            {selectedMenuItem?.name || "Select Menu Item"}
                          </h2>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                              {selectedMenuItem?.category?.name || "Category"}
                            </span>
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                              ₹{selectedMenuItem?.price || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* ANALYTICS */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl p-3 bg-indigo-50">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                            Recipe Cost
                          </p>
                          <p className="mt-2 text-xl font-black text-indigo-600">
                            ₹{totalRecipeCost.toFixed(2)}
                          </p>
                        </div>
                        <div className="rounded-xl p-3 bg-emerald-50 ">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500">
                            Margin
                          </p>
                          <p className="mt-2 text-xl font-black text-emerald-600">
                            {margin}%
                          </p>
                        </div>
                        <div className="rounded-xl p-3 bg-orange-50 ">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-500">
                            Prep Time
                          </p>
                          <p className="mt-2 text-xl font-black text-orange-500">
                            {selectedMenuItem?.prepTime || 0}m
                          </p>
                        </div>
                        <div className="rounded-xl p-3 bg-red-50 ">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500">
                            Food Cost
                          </p>
                          <p className="mt-2 text-xl font-black text-red-600">
                            {foodCostPercentage}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* INGREDIENT TABLE */}
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {/* TOP */}
                    <div className="flex items-center justify-between border-b border-gray-100 p-4">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">
                          Ingredient Mapping
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Ingredients consumed for this menu item
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                          onClick={handleAISuggest}
                        >
                          AI Suggest
                        </button>
                        <button
                          className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-100 transition-all duration-300 hover:scale-[1.02]"
                          onClick={handleSaveMapping}
                        >
                          Save Changes
                        </button>
                        <button
                          className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                          onClick={handleAddMappingIngredient}
                        >
                          + Add Ingredient
                        </button>
                      </div>
                    </div>
                    {/* TABLE */}
                    <div className="overflow-auto">
                      <table className="min-w-full">
                        {/* HEADER */}
                        <thead className="border-b border-gray-100 bg-gray-50/70">
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
                                className="whitespace-nowrap px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400"
                              >
                                {head}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        {/* BODY */}
                        <tbody>
                          {ingredientMappings.map((row, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-100 transition hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <select
                                  value={String(row.ingredientId || "")}
                                  onChange={(e) => {
                                    const updated = [...ingredientMappings];

                                    const selectedIngredient =
                                      allIngredients.find(
                                        (i: any) =>
                                          String(i.id) === e.target.value,
                                      );

                                    updated[index] = {
                                      ...updated[index],
                                      ingredientId: Number(e.target.value),
                                      ingredient: selectedIngredient,
                                    };

                                    setIngredientMappings(updated);
                                  }}
                                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-red-100"
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
                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  value={row.quantity || ""}
                                  onChange={(e) => {
                                    const updated = [...ingredientMappings];
                                    updated[index].quantity = e.target.value;
                                    setIngredientMappings(updated);
                                  }}
                                  className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-red-100"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={row.unit || "gm"}
                                  onChange={(e) => {
                                    const updated = [...ingredientMappings];
                                    updated[index].unit = e.target.value;
                                    setIngredientMappings(updated);
                                  }}
                                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-red-100"
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
                              <td className="px-4 py-4 font-medium text-indigo-600">
                                ₹
                                {(() => {
                                  const ingredient = row.ingredient;
                                  if (!ingredient) return "0.00";
                                  const qty = Number(row.quantity || 0);
                                  const pricePerUnit = Number(
                                    ingredient.pricePerUnit || 0,
                                  );
                                  let cost = 0;
                                  /* WEIGHT */
                                  if (
                                    row.unit === "Gram" ||
                                    row.unit === "gm"
                                  ) {
                                    cost = (qty / 1000) * pricePerUnit;
                                  } else if (row.unit === "Kg") {
                                    cost = qty * pricePerUnit;
                                  } else if (
                                    /* LIQUID */
                                    row.unit === "Ml" ||
                                    row.unit === "ml"
                                  ) {
                                    cost = (qty / 1000) * pricePerUnit;
                                  } else if (row.unit === "Litre") {
                                    cost = qty * pricePerUnit;
                                  } else if (
                                    /* PIECE */
                                    row.unit === "Piece" ||
                                    row.unit === "pc"
                                  ) {
                                    cost = qty * pricePerUnit;
                                  } else {
                                    cost = qty * pricePerUnit;
                                  }
                                  return cost.toFixed(2);
                                })()}
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="number"
                                  value={row.wastage || 0}
                                  onChange={(e) => {
                                    const updated = [...ingredientMappings];
                                    updated[index].wastage = e.target.value;
                                    setIngredientMappings(updated);
                                  }}
                                  className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-red-100"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const updated = ingredientMappings.filter(
                                        (_: any, i: number) => i !== index,
                                      );
                                      setIngredientMappings(updated);
                                    }}
                                    className="rounded-xl  px-4 py-2 text-xs font-semibold bg-gray-100 text-red-500 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* HEADER */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}
                  <div>
                    {/* BADGE */}
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                      Consumption Intelligence
                    </div>
                    {/* TITLE */}
                    <div className="mt-3 flex items-center gap-3">
                      {/* ICON */}
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-gray-900">
                          Menu Analytics
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-gray-500">
                          Ingredient usage, costing, wastage & operational
                          insights
                        </p>
                      </div>
                    </div>
                    {/* META TAGS */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                        Live Analytics
                      </div>
                      <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                        Consumption Tracking
                      </div>
                      <div className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
                        Cost Intelligence
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* KPI */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {[
                  {
                    label: "Food Cost %",
                    value: `${avgFoodCost}%`,
                    color: "text-red-600",
                    bg: "bg-red-50",
                    icon: ChartPieIcon,
                    meta: "Operational cost",
                  },
                  {
                    label: "Inventory Value",
                    value: `₹${allIngredients
                      .reduce((acc: number, item: any) => {
                        return (
                          acc +
                          Number(item.quantity || 0) *
                            Number(item.pricePerUnit || 0)
                        );
                      }, 0)
                      .toFixed(0)}`,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                    icon: ArchiveBoxIcon,
                    meta: "Current stock value",
                  },
                  {
                    label: "Inventory Turnover",
                    value: `${(
                      totalConsumptionValue /
                      Math.max(
                        allIngredients.reduce((acc: number, item: any) => {
                          return (
                            acc +
                            Number(item.quantity || 0) *
                              Number(item.pricePerUnit || 0)
                          );
                        }, 0),
                        1,
                      )
                    ).toFixed(2)}x`,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    icon: ArrowPathRoundedSquareIcon,
                    meta: "Stock efficiency",
                  },
                  {
                    label: "Inventory Usage",
                    value: `₹${totalConsumptionValue.toFixed(0)}`,
                    color: "text-orange-500",
                    bg: "bg-orange-50",
                    icon: CubeTransparentIcon,
                    meta: "Consumption value",
                  },
                  {
                    label: "Profit Margin",
                    value: `${avgProfitMargin}%`,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    icon: BanknotesIcon,
                    meta: "Profitability health",
                  },
                  {
                    label: "Daily Consumption",
                    value: `₹${totalConsumptionValue.toFixed(0)}`,
                    color: "text-orange-500",
                    bg: "bg-orange-50",
                    icon: FireIcon,
                    meta: "Daily operations",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      {/* Glow */}
                      <div
                        className={`absolute -right-8 -top-8 h-20 w-20 rounded-full ${item.bg} opacity-60 blur-3xl`}
                      />
                      <div className="relative z-10">
                        {/* TOP */}
                        <div className="flex items-start justify-between">
                          {/* ICON */}
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}
                          >
                            <Icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          {/* STATUS */}
                          <div className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                            Live
                          </div>
                        </div>
                        {/* LABEL */}
                        <p className="mt-3 text-xs font-medium text-gray-500">
                          {item.label}
                        </p>
                        {/* VALUE */}
                        <p
                          className={`mt-1 text-2xl font-black tracking-tight ${item.color}`}
                        >
                          {item.value}
                        </p>
                        {/* FOOTER */}
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-[11px] text-gray-400">
                            {item.meta}
                          </p>
                          <div
                            className={`h-2 w-2 rounded-full ${item.bg.replace(
                              "bg-",
                              "bg-",
                            )}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* MAIN GRID */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* TOP INGREDIENTS */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  {/* HEADER */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-gray-900">
                        Top Ingredient Usage
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Most consumed inventory items
                      </p>
                    </div>
                    <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                      Live Tracking
                    </div>
                  </div>
                  {/* LIST */}
                  <div className="mt-4 space-y-3">
                    {ingredientAnalytics
                      .sort((a: any, b: any) => b.consumed - a.consumed)
                      .slice(0, visibleIngredients)
                      .map((item: any) => {
                        const percent = Math.min(
                          Number((item.consumed / 10).toFixed(0)),
                          100,
                        );
                        return (
                          <div
                            key={item.ingredient}
                            className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-all duration-200 hover:bg-gray-50"
                          >
                            {/* TOP */}
                            <div className="flex items-center justify-between gap-3">
                              {/* LEFT */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {item.ingredient}
                                  </p>
                                  {/* STATUS */}
                                  <div className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                                    Active
                                  </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  {Math.round(item.consumed)} {item.unit}{" "}
                                  consumed
                                </p>
                              </div>
                              {/* PERCENT */}
                              <div className="text-right">
                                <p className="text-sm font-black text-indigo-600">
                                  {percent}%
                                </p>
                                <p className="mt-0.5 text-[10px] text-gray-400">
                                  Usage
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {ingredientAnalytics.length > 5 && (
                    <div className="mt-4 flex justify-center">
                      {visibleIngredients < ingredientAnalytics.length ? (
                        <button
                          onClick={() =>
                            setVisibleIngredients(ingredientAnalytics.length)
                          }
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                          View More
                        </button>
                      ) : (
                        <button
                          onClick={() => setVisibleIngredients(5)}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* WASTAGE */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  {/* HEADER */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-gray-900">
                        Operational Alerts
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Waste, mismatch & operational risk monitoring
                      </p>
                    </div>
                    {/* STATUS */}
                    <div className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
                      AI Monitoring
                    </div>
                  </div>
                  {/* ALERT LIST */}
                  <div className="mt-4 space-y-3">
                    {aiAlerts
                      .slice(0, visibleAlerts)
                      .map((alert: any, index: number) => (
                        <div
                          key={index}
                          className="group rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition-all duration-200 hover:bg-gray-50"
                        >
                          <div className="flex items-start gap-3">
                            {/* STATUS DOT */}
                            <div
                              className={`mt-1.5 h-2.5 w-2.5 rounded-full ${alert.color}`}
                            />
                            {/* CONTENT */}
                            <div className="min-w-0 flex-1">
                              {/* TITLE + TAG */}
                              <div className="flex items-center justify-between gap-3">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {alert.title}
                                </h4>
                                <div className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-gray-500 shadow-sm">
                                  Live
                                </div>
                              </div>
                              {/* DESCRIPTION */}
                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {alert.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  {aiAlerts.length > 5 && (
                    <div className="mt-4 flex justify-center">
                      {visibleAlerts < aiAlerts.length ? (
                        <button
                          onClick={() => setVisibleAlerts(aiAlerts.length)}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                          View More Alerts
                        </button>
                      ) : (
                        <button
                          onClick={() => setVisibleAlerts(5)}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* BOTTOM TABLE */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* TOP */}
                <div className="border-b border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-gray-900">
                        Consumption Analytics
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Daily ingredient consumption insights
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                      Auto Calculated
                    </span>
                  </div>
                </div>
                {/* TABLE */}
                <div className="overflow-auto">
                  <table className="min-w-full">
                    {/* HEADER */}
                    <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                      <tr>
                        {[
                          "Ingredient",
                          "Consumed",
                          "Avg Daily",
                          "Recipe Cost",
                          "Waste %",
                          "Status",
                        ].map((head) => (
                          <th
                            key={head}
                            className="whitespace-nowrap px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    {/* BODY */}
                    <tbody>
                      {ingredientAnalytics.map((row: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 transition hover:bg-indigo-50/20"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {row.ingredient}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {Math.round(Number(row.consumed || 0))} {row.unit}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {(Number(row.consumed || 0) / 30).toFixed(1)}{" "}
                            {row.unit}
                          </td>
                          <td className="px-4 py-3 font-medium text-indigo-600">
                            ₹{Number(row.totalCost || 0).toFixed(0)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-500">
                              0%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                              Healthy
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
