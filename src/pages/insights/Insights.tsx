import { useState, useEffect } from "react";
import { useAppSelector } from "../../store";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import {
  TrendingUp,
  Target,
  Boxes,
  ShoppingCart,
  Sparkles,
  BarChart3,
  Landmark,
  Users,
  Wallet,
  Package,
  Percent,
  RefreshCcw,
  UtensilsCrossed,
  FolderTree,
  Plus,
  Save,
  Search,
  Download,
  TrendingDown,
  Upload,
  Warehouse,
  Building2,
  Bike,
  CreditCard,
  Flame,
  Fuel,
  Wrench,
  Zap,
  Activity,
  ClipboardList,
  BadgeIndianRupee,
  UserCheck,
  IndianRupee,
  CalendarRange,
  Receipt,
  ShieldCheck,
  Rocket,
  PieChart,
  BadgePercent,
} from "lucide-react";
import React from "react";

const tabs = ["Overview", "Insights Setup"];

export default function Insights() {
  const { selectedBranch } = useAppSelector(s => s.branch);
  const { user, token } = useAppSelector(s => s.auth);
  const currentUser = user; // alias kept for existing code that uses currentUser
  const API_URL = import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState("Overview");
  const [staffData, setStaffData] = useState<any[]>([]);
  const [insightsSection, setInsightsSection] = useState("Fixed Expenses");
  const [ingredients, setIngredients] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [restockHistory, setRestockHistory] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any>({
    monthlyRent: 0,
    loanEmi: 0,
    internet: 0,
    phoneBills: 0,
    accounting: 0,
    insurance: 0,
    licenses: 0,
    deliveryCharges: 0,
    packaging: 0,
    paymentGateway: 0,
    aggregatorCommission: 0,
    electricity: 0,
    gas: 0,
    maintenance: 0,
    fuel: 0,
    targetEbitda: 0,
    targetFoodCost: 0,
    targetGrossMargin: 0,
    targetPrimeCost: 0,
    monthlyRevenueGoal: 0,
    monthlyProfitGoal: 0,
    gstPercentage: 0,
    monthlyLoanEmi: 0,
    monthlyInterestPayments: 0,
    caFees: 0,
    insuranceCost: 0,
    otherTaxes: 0,
    expectedMonthlyGrowth: 0,
    expectedDeliveryGrowth: 0,
    expectedInflation: 0,
    seasonalImpact: 0,
    weekendSalesIncrease: 0,
    plannedExpansion: "",
    revenue: 0,
  });
  const n = (v: any) => Number(v) || 0;
  const totalFixedExpenses =
    n(insightsData.monthlyRent) +
    n(insightsData.loanEmi) +
    n(insightsData.internet) +
    n(insightsData.phoneBills) +
    n(insightsData.accounting) +
    n(insightsData.insurance) +
    n(insightsData.licenses);
  const totalVariableExpenses =
    n(insightsData.deliveryCharges) +
    n(insightsData.packaging) +
    n(insightsData.paymentGateway) +
    n(insightsData.aggregatorCommission) +
    n(insightsData.electricity) +
    n(insightsData.gas) +
    n(insightsData.maintenance) +
    n(insightsData.fuel);
  const totalLabourCost =
    staffData?.reduce((sum: number, s: any) => sum + (s.salary || 0), 0) || 0;
  const totalFinanceCost =
    n(insightsData.monthlyLoanEmi) +
    n(insightsData.monthlyInterestPayments) +
    n(insightsData.caFees) +
    n(insightsData.insuranceCost) +
    n(insightsData.otherTaxes);
  const totalExpenses =
    totalFixedExpenses +
    totalVariableExpenses +
    totalLabourCost +
    totalFinanceCost;
  const revenue = insightsData.revenue || 0;
  const ebitda = revenue - totalExpenses;
  const restockData = restockHistory || [];
  const totalPurchaseValue = restockData.reduce((sum: number, item: any) => {
    return sum + Number(item.TotalPurchaseAmount || 0);
  }, 0);
  /* INVENTORY VALUE */
  const inventoryValue = restockData.reduce((sum: number, item: any) => {
    return sum + Number(item.MonthClosingValue || 0);
  }, 0);
  /* STARTING INVENTORY */
  const startingInventory = restockData.reduce((sum: number, item: any) => {
    return sum + Number(item.OpeningStockValue || 0);
  }, 0);
  /* ACTUAL FOOD COST */
  const actualFoodCost = restockData.reduce((sum: number, item: any) => {
    return sum + Number(item.MonthlyRMExpense || 0);
  }, 0);
  /* FOOD COST % */
  const actualFoodCostPercentage = revenue
    ? ((actualFoodCost / revenue) * 100).toFixed(1)
    : "0";
  /* INVENTORY TURNOVER */
  const inventoryTurnover = inventoryValue
    ? (actualFoodCost / inventoryValue).toFixed(2)
    : "0";
  /* INFLATED INGREDIENTS */
  const inflatedIngredients = restockData.filter((item: any) => {
    const week1 = Number(item.Week1Price || 0);
    const week5 = Number(item.Week5Price || 0);
    return week5 > week1;
  });
  /* TOP PURCHASED INGREDIENTS */
  const topPurchasedIngredients = [...restockData]
    .sort(
      (a: any, b: any) =>
        Number(b.TotalPurchaseAmount || 0) - Number(a.TotalPurchaseAmount || 0),
    )
    .slice(0, 5);
  /* EBITDA % */
  const ebitdaPercentage = revenue ? ((ebitda / revenue) * 100).toFixed(1) : 0;
  /* FOOD COST % */
  const foodCostPercentage = revenue
    ? ((totalVariableExpenses / revenue) * 100).toFixed(1)
    : 0;
  /* PRIME COST % */
  const primeCostPercentage = revenue
    ? (((totalVariableExpenses + totalLabourCost) / revenue) * 100).toFixed(1)
    : 0;

  useEffect(() => {
    const fetchInsights = async () => {
      try {




        if (!selectedBranch?.id) return;

        const res = await fetch(
          `${API_URL}/api/analytics/insights/${user.restaurantId}/${selectedBranch.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const json = await res.json();

        if (json.success && json.data) {
          // Normalize null/undefined → 0 for all numeric fields so downstream
          // arithmetic (totalFixedExpenses + ...) never produces NaN
          const normalized = Object.fromEntries(
            Object.entries(json.data).map(([k, v]) => [k, v === null || v === undefined ? 0 : v])
          );
          setInsightsData((prev: any) => ({ ...prev, ...normalized }));
        }
      } catch {
        // fetch error
      }
    };

    const fetchRestockHistory = async () => {
      try {


        const res = await fetch(
          `${API_URL}/api/inventory/${user.restaurantId}/get-restock-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const response = await res.json();
        if (response.success) {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();
          const currentMonthData = response.data.find(
            (item: any) =>
              item.month === currentMonth && item.year === currentYear,
          );
          if (currentMonthData) {
            const formattedData = currentMonthData.data.map((item: any) => ({
              Category: item["Category"],
              Ingredient: item["Ingredient"],
              Unit: item["Unit"],
              OpeningStockQty: Number(item["Opening Stock Qty"] || 0),
              OpeningStockPrice: Number(item["Opening Stock Price"] || 0),
              OpeningStockValue: Number(item["Opening Stock Value"] || 0),
              Week1PurchaseQty: Number(item["Week1 Purchase Qty"] || 0),
              Week2PurchaseQty: Number(item["Week2 Purchase Qty"] || 0),
              Week3PurchaseQty: Number(item["Week3 Purchase Qty"] || 0),
              Week4PurchaseQty: Number(item["Week4 Purchase Qty"] || 0),
              Week5PurchaseQty: Number(item["Week5 Purchase Qty"] || 0),
              Week1Price: Number(item["Week1 Price"] || 0),
              Week5Price: Number(item["Week5 Price"] || 0),
              TotalPurchaseAmount: Number(item["Total Purchase Amount"] || 0),
              MonthClosingValue: Number(
                item["Month Closing Value"] ||
                  item["Week5 Closing Value"] ||
                  item["Week4 Closing Value"] ||
                  item["Week3 Closing Value"] ||
                  item["Week2 Closing Value"] ||
                  item["Week1 Closing Value"] ||
                  0,
              ),
              MonthlyRMExpense: Number(
                item["Monthly RM Expense"] ||
                  Number(item["Opening Stock Value"] || 0) +
                    Number(item["Total Purchase Amount"] || 0) -
                    Number(
                      item["Week5 Closing Value"] ||
                        item["Week4 Closing Value"] ||
                        item["Week3 Closing Value"] ||
                        item["Week2 Closing Value"] ||
                        item["Week1 Closing Value"] ||
                        0,
                    ),
              ),
              TotalPurchasedQty:
                Number(item["Week1 Purchase Qty"] || 0) +
                Number(item["Week2 Purchase Qty"] || 0) +
                Number(item["Week3 Purchase Qty"] || 0) +
                Number(item["Week4 Purchase Qty"] || 0) +
                Number(item["Week5 Purchase Qty"] || 0),
            }));
            setRestockHistory(formattedData);
          } else {
            setRestockHistory([]);
          }
        }
      } catch {
        // fetch error
      }
    };
    fetchInsights();
    fetchRestockHistory();
  }, [selectedBranch]);
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(`${API_URL}/api/ingredients/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: user.restaurantId,
      });
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
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const restaurantId = user.restaurantId;
      const res = await fetch(`${API_URL}/api/ingredients/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          ingredients,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Ingredients saved successfully");
      }
    } catch {
      // error silently ignored
    }
  };

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(
        `${API_URL}/api/ingredients/${user.restaurantId}/getRestaurantIngredients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (data.success && data.data) {
        setIngredients(data.data);
      }
    } catch {
      // error silently ignored
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, [selectedBranch]);

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

  const handleSaveInsights = async () => {
    try {
      const token = localStorage.getItem("token");

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!selectedBranch?.id) {
        alert("Please select branch");
        return;
      }

      const res = await fetch(`${API_URL}/api/analytics/insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          ...insightsData,
          restaurantId: user.restaurantId,
          branchId: selectedBranch.id,
        }),
      });

      await res.json();
    } catch {
      // save error — silently ignore
    }
  };

  const downloadInventoryTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    months.forEach((monthName) => {
      const worksheet = workbook.addWorksheet(monthName);
      const headers = [
        "Category",
        "Ingredient",
        "Unit",
        "Opening Stock Qty",
        "Opening Stock Price",
        "Opening Stock Value",
        // Week 1
        "Week1 Purchase Qty",
        "Week1 Price",
        "Week1 Total",
        "Week1 Total Inventory",
        "Week1 Inventory Cost",
        "Week1 Closing Stock",
        "Week1 Closing Value",
        "Week1 Expense",
        // Week 2
        "Week2 Purchase Qty",
        "Week2 Price",
        "Week2 Total",
        "Week2 Total Inventory",
        "Week2 Inventory Cost",
        "Week2 Closing Stock",
        "Week2 Closing Value",
        "Week2 Expense",
        // Week 3
        "Week3 Purchase Qty",
        "Week3 Price",
        "Week3 Total",
        "Week3 Total Inventory",
        "Week3 Inventory Cost",
        "Week3 Closing Stock",
        "Week3 Closing Value",
        "Week3 Expense",
        // Week 4
        "Week4 Purchase Qty",
        "Week4 Price",
        "Week4 Total",
        "Week4 Total Inventory",
        "Week4 Inventory Cost",
        "Week4 Closing Stock",
        "Week4 Closing Value",
        "Week4 Expense",
        // Week 5
        "Week5 Purchase Qty",
        "Week5 Price",
        "Week5 Total",
        "Week5 Total Inventory",
        "Week5 Inventory Cost",
        "Week5 Closing Stock",
        "Week5 Closing Value",
        "Week5 Expense",
        // Monthly
        "Total Purchase Amount",
        "Total Weekly Expense",
        "Month Closing Value",
        "Monthly RM Expense",
      ];
      worksheet.addRow(headers);
      worksheet.getRow(1).font = {
        bold: true,
      };
      worksheet.columns.forEach((col) => {
        col.width = 20;
      });
      let rowNumber = 2;

      const sourceData = restockHistory?.length
        ? restockHistory
        : Object.entries(ingredients).flatMap(([category, items]: any) =>
            items.map((item: any) => ({
              Category: category,
              Ingredient: item.name,
              Unit: item.unit || "Kg",
            })),
          );
      sourceData.forEach((rowData: any) => {
        const row = worksheet.getRow(rowNumber);
        /* ================= BASIC ================= */
        row.getCell(1).value = rowData.Category || "";
        row.getCell(2).value = rowData.Ingredient || "";
        row.getCell(3).value = rowData.Unit || "Kg";
        /* ================= OPENING STOCK ================= */
        row.getCell(4).value = rowData.OpeningStockQty || 0;
        row.getCell(5).value = rowData.OpeningStockPrice || 0;
        row.getCell(6).value = rowData.OpeningStockValue || {
          formula: `D${rowNumber}*E${rowNumber}`,
        };
        /* ================= WEEK 1 ================= */
        row.getCell(7).value = rowData.Week1PurchaseQty || 0;
        row.getCell(8).value = rowData.Week1Price || 0;
        row.getCell(9).value = rowData.Week1Total || {
          formula: `G${rowNumber}*H${rowNumber}`,
        };
        row.getCell(10).value = rowData.Week1TotalInventory || {
          formula: `D${rowNumber}+G${rowNumber}`,
        };
        row.getCell(11).value = rowData.Week1InventoryCost || {
          formula: `F${rowNumber}+I${rowNumber}`,
        };
        row.getCell(12).value = rowData.Week1ClosingStock || 0;
        row.getCell(13).value = rowData.Week1ClosingValue || {
          formula: `(L${rowNumber}/J${rowNumber})*K${rowNumber}`,
        };
        row.getCell(14).value = rowData.Week1Expense || {
          formula: `K${rowNumber}-M${rowNumber}`,
        };
        /* ================= WEEK 2 ================= */
        row.getCell(15).value = rowData.Week2PurchaseQty || 0;
        row.getCell(16).value = rowData.Week2Price || 0;
        row.getCell(17).value = rowData.Week2Total || {
          formula: `O${rowNumber}*P${rowNumber}`,
        };
        row.getCell(18).value = rowData.Week2TotalInventory || {
          formula: `L${rowNumber}+O${rowNumber}`,
        };
        row.getCell(19).value = rowData.Week2InventoryCost || {
          formula: `M${rowNumber}+Q${rowNumber}`,
        };
        row.getCell(20).value = rowData.Week2ClosingStock || 0;
        row.getCell(21).value = rowData.Week2ClosingValue || {
          formula: `(T${rowNumber}/R${rowNumber})*S${rowNumber}`,
        };
        row.getCell(22).value = rowData.Week2Expense || {
          formula: `S${rowNumber}-U${rowNumber}`,
        };
        /* ================= WEEK 3 ================= */
        row.getCell(23).value = rowData.Week3PurchaseQty || 0;
        row.getCell(24).value = rowData.Week3Price || 0;
        row.getCell(25).value = rowData.Week3Total || {
          formula: `W${rowNumber}*X${rowNumber}`,
        };
        row.getCell(26).value = rowData.Week3TotalInventory || {
          formula: `T${rowNumber}+W${rowNumber}`,
        };
        row.getCell(27).value = rowData.Week3InventoryCost || {
          formula: `U${rowNumber}+Y${rowNumber}`,
        };
        row.getCell(28).value = rowData.Week3ClosingStock || 0;
        row.getCell(29).value = rowData.Week3ClosingValue || {
          formula: `(AB${rowNumber}/Z${rowNumber})*AA${rowNumber}`,
        };
        row.getCell(30).value = rowData.Week3Expense || {
          formula: `AA${rowNumber}-AC${rowNumber}`,
        };
        /* ================= WEEK 4 ================= */
        row.getCell(31).value = rowData.Week4PurchaseQty || 0;
        row.getCell(32).value = rowData.Week4Price || 0;
        row.getCell(33).value = rowData.Week4Total || {
          formula: `AE${rowNumber}*AF${rowNumber}`,
        };
        row.getCell(34).value = rowData.Week4TotalInventory || {
          formula: `AB${rowNumber}+AE${rowNumber}`,
        };
        row.getCell(35).value = rowData.Week4InventoryCost || {
          formula: `AC${rowNumber}+AG${rowNumber}`,
        };
        row.getCell(36).value = rowData.Week4ClosingStock || 0;
        row.getCell(37).value = rowData.Week4ClosingValue || {
          formula: `(AJ${rowNumber}/AH${rowNumber})*AI${rowNumber}`,
        };
        row.getCell(38).value = rowData.Week4Expense || {
          formula: `AI${rowNumber}-AK${rowNumber}`,
        };
        /* ================= WEEK 5 ================= */
        row.getCell(39).value = rowData.Week5PurchaseQty || 0;
        row.getCell(40).value = rowData.Week5Price || 0;
        row.getCell(41).value = rowData.Week5Total || {
          formula: `AM${rowNumber}*AN${rowNumber}`,
        };
        row.getCell(42).value = rowData.Week5TotalInventory || {
          formula: `AJ${rowNumber}+AM${rowNumber}`,
        };
        row.getCell(43).value = rowData.Week5InventoryCost || {
          formula: `AK${rowNumber}+AO${rowNumber}`,
        };
        row.getCell(44).value = rowData.Week5ClosingStock || 0;
        row.getCell(45).value = rowData.Week5ClosingValue || {
          formula: `(AR${rowNumber}/AP${rowNumber})*AQ${rowNumber}`,
        };
        row.getCell(46).value = rowData.Week5Expense || {
          formula: `AQ${rowNumber}-AS${rowNumber}`,
        };
        /* ================= MONTHLY ================= */
        row.getCell(47).value = rowData.TotalPurchaseAmount || 0;
        row.getCell(48).value = rowData.TotalWeeklyExpense || 0;
        row.getCell(49).value = rowData.MonthClosingValue || 0;
        row.getCell(50).value = rowData.MonthlyRMExpense || 0;
        rowNumber++;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "inventory-template.xlsx");
  };

  const handleUploadRestockSheet = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setRestockHistory(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  const saveRestockHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await fetch(`${API_URL}/api/restaurant/restock-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId: user.restaurantId,
          month,
          year,
          data: restockHistory,
        }),
      });
      await res.json();
    } catch {
      // save error
    }
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {

        const res = await fetch(
          `${API_URL}/api/restaurant/staff/${currentUser.restaurantId}/${selectedBranch.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (data.success) {
          setStaffData(data.data);
        }
      } catch {
        // fetch error
      }
    };
    if (currentUser?.restaurantId) {
      fetchStaff();
    }
  }, [selectedBranch]);

  return (
    <main className="flex flex-col overflow-hidden bg-[#f5f6fa]">
      <div className="mx-auto flex h-full w-full flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-100/50 blur-3xl" />

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* LEFT */}

            <div className="flex items-start gap-3">
              {/* ICON */}

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 shadow-sm">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>

              {/* CONTENT */}

              <div>
                {/* TITLE */}

                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">
                  Insights
                </h1>

                {/* SUBTITLE */}

                <p className="mt-1 text-[12px] text-gray-500">
                  Restaurant operational analytics & expense intelligence
                </p>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md"
                      : "border border-gray-200 bg-gray-50 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="space-y-4">
              {/* TOP KPIs */}
              {/* ================= KPI ================= */}

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  {
                    label: "Revenue",
                    value: revenue,
                    sub: "Monthly earnings",
                    icon: IndianRupee,
                    color: "emerald",
                  },

                  {
                    label: "Net Profit",
                    value: `₹${
                      isNaN(revenue - totalExpenses)
                        ? 0
                        : Math.round(revenue - totalExpenses).toLocaleString()
                    }`,
                    sub: "Estimated profit",
                    icon: TrendingUp,
                    color: "blue",
                  },

                  {
                    label: "EBITDA",
                    value: `${ebitdaPercentage}%`,
                    sub: "Profitability",
                    icon: BarChart3,
                    color: "violet",
                  },

                  {
                    label: "Prime Cost",
                    value: `${primeCostPercentage}%`,
                    sub: "Food + labour",
                    icon: PieChart,
                    color: "orange",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  const colorMap: Record<string, { text: string; bg: string; icon: string }> = {
                    emerald: { text: "text-emerald-500", bg: "bg-emerald-50", icon: "text-emerald-600" },
                    blue: { text: "text-blue-500", bg: "bg-blue-50", icon: "text-blue-600" },
                    violet: { text: "text-violet-500", bg: "bg-violet-50", icon: "text-violet-600" },
                    orange: { text: "text-orange-500", bg: "bg-orange-50", icon: "text-orange-600" },
                  };
                  const c = colorMap[item.color] || colorMap.orange;
                  return (
                    <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${c.text}`}>{item.label}</p>
                          <p className="mt-2 text-[22px] font-bold tracking-tight text-gray-900">{item.value}</p>
                          <p className="mt-1 text-[11px] text-gray-500">{item.sub}</p>
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
                          <Icon className={`h-4 w-4 ${c.icon}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= EBITDA HEALTH ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                      <TrendingUp className="h-4 w-4 text-violet-600" />
                    </div>

                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                        Profitability Health
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        EBITDA performance tracking
                      </p>
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        label: "Status",
                        value:
                          Number(ebitdaPercentage) >= insightsData.targetEbitda
                            ? "Healthy"
                            : "Critical",
                        color:
                          Number(ebitdaPercentage) >= insightsData.targetEbitda
                            ? "emerald"
                            : "red",
                      },

                      {
                        label: "Current",
                        value: `${ebitdaPercentage}%`,
                        color: "violet",
                      },

                      {
                        label: "Target",
                        value: `${insightsData.targetEbitda}%`,
                        color: "emerald",
                      },

                      {
                        label: "Gap",
                        value: `${(
                          Number(ebitdaPercentage) - insightsData.targetEbitda
                        ).toFixed(1)}%`,
                        color: "orange",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                          {item.label}
                        </p>

                        <p className={`text-[16px] font-bold ${
                          item.color === "emerald" ? "text-emerald-600" :
                          item.color === "red" ? "text-red-600" :
                          item.color === "violet" ? "text-violet-600" : "text-orange-600"
                        }`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROGRESS */}

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">EBITDA Progress</p>
                    <p className="text-[11px] font-semibold text-violet-600">
                      {insightsData.targetEbitda > 0
                        ? Math.min(Math.round((Number(ebitdaPercentage) / insightsData.targetEbitda) * 100), 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${insightsData.targetEbitda > 0 ? Math.min((Number(ebitdaPercentage) / insightsData.targetEbitda) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ================= REVENUE TARGETS ================= */}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* HEADER */}

                <div className="mb-4 flex items-center justify-between">
                  {/* LEFT */}

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                      <Target className="h-4 w-4 text-red-600" />
                    </div>

                    <div>
                      <h3 className="text-[18px] font-bold tracking-tight text-gray-900">
                        Revenue Targets
                      </h3>

                      <p className="mt-1 text-[12px] text-gray-500">
                        EBITDA revenue planning
                      </p>
                    </div>
                  </div>

                  {/* BADGE */}

                  <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-semibold text-red-600">
                    Financial Planning
                  </span>
                </div>

                {/* TARGET GRID */}

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
                  {[0, 5, 10, 15, 20, 25].map((target) => {
                    const requiredRevenue = totalExpenses / (1 - target / 100);

                    const extraNeeded = requiredRevenue - revenue;

                    return (
                      <div
                        key={target}
                        className={`rounded-2xl border p-3 shadow-sm transition-all ${
                          target >= 20 ? "border-emerald-100 bg-emerald-50/40" :
                          target >= 10 ? "border-orange-100 bg-orange-50/40" : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                            target >= 20 ? "text-emerald-500" : target >= 10 ? "text-orange-500" : "text-gray-500"
                          }`}>
                            {target}% EBITDA
                          </p>
                          <div className={`h-2 w-2 rounded-full ${
                            target >= 20 ? "bg-emerald-500" : target >= 10 ? "bg-orange-500" : "bg-gray-400"
                          }`} />
                        </div>
                        <p className="mt-3 text-[24px] font-bold leading-none tracking-tight text-gray-900">
                          ₹{Math.round(requiredRevenue).toLocaleString()}
                        </p>
                        <p className={`mt-2 text-[11px] font-semibold ${extraNeeded <= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {extraNeeded <= 0 ? "Target achieved" : `+₹${Math.round(extraNeeded).toLocaleString()}`}
                        </p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
                          <div className={`h-full rounded-full ${
                            target >= 20 ? "bg-emerald-500" : target >= 10 ? "bg-orange-500" : "bg-gray-500"
                          }`} style={{ width: `${Math.min(target * 4, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= COST BREAKDOWN ================= */}

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  {
                    label: "Fixed",
                    value: totalFixedExpenses,
                    icon: Wallet,
                    color: "blue",
                  },

                  {
                    label: "Variable",
                    value: totalVariableExpenses,
                    icon: BarChart3,
                    color: "orange",
                  },

                  {
                    label: "Labour",
                    value: totalLabourCost,
                    icon: Users,
                    color: "emerald",
                  },

                  {
                    label: "Tax",
                    value: totalFinanceCost,
                    icon: Landmark,
                    color: "violet",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{item.label}</p>
                          <p className="mt-2 text-[22px] font-bold tracking-tight text-gray-900">₹{Math.round(item.value).toLocaleString()}</p>
                          <p className="mt-1 text-[11px] text-gray-500">{totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : "0.0"}% of expenses</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Icon className="h-4 w-4 text-gray-700" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Insights Setup */}
          {activeTab === "Insights Setup" && (
            <div className="flex h-full overflow-hidden bg-[#f6f7fb]">
              {/* ================= SIDEBAR ================= */}

              <div className="hide-scrollbar h-full w-[230px] overflow-y-auto border-r border-gray-200 bg-white p-4">
                {/* AI CARD */}

                <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-500 to-pink-500 p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>

                  <h2 className="mt-4 text-[18px] font-bold text-white">
                    Financial Intelligence
                  </h2>

                  <p className="mt-1 text-[12px] leading-6 text-red-100">
                    AI forecasting & profitability engine
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white">
                    AI Active
                  </div>
                </div>

                {/* COMPLETION */}

                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                  {(() => {
                    const fields = [
                      insightsData.monthlyRent,
                      insightsData.loanEmi,
                      insightsData.internet,
                      insightsData.phoneBills,
                      insightsData.accounting,
                      insightsData.insurance,
                      insightsData.licenses,

                      insightsData.deliveryCharges,
                      insightsData.packaging,
                      insightsData.paymentGateway,
                      insightsData.aggregatorCommission,
                      insightsData.electricity,
                      insightsData.gas,
                      insightsData.maintenance,
                      insightsData.fuel,

                      insightsData.targetEbitda,
                      insightsData.targetFoodCost,
                      insightsData.targetGrossMargin,
                      insightsData.targetPrimeCost,
                      insightsData.monthlyRevenueGoal,
                      insightsData.monthlyProfitGoal,

                      insightsData.gstPercentage,
                      insightsData.monthlyLoanEmi,
                      insightsData.monthlyInterestPayments,
                      insightsData.caFees,
                      insightsData.insuranceCost,
                      insightsData.otherTaxes,

                      insightsData.expectedMonthlyGrowth,
                      insightsData.expectedDeliveryGrowth,
                      insightsData.seasonalImpact,
                      insightsData.weekendSalesIncrease,

                      insightsData.plannedExpansion,
                    ];

                    const filledFields = fields.filter(
                      (field) =>
                        field !== null &&
                        field !== undefined &&
                        field !== "" &&
                        field !== 0,
                    ).length;

                    const completion = Math.round(
                      (filledFields / fields.length) * 100,
                    );

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              Setup Readiness
                            </p>

                            <p className="mt-1 text-[11px] text-gray-500">
                              AI configuration progress
                            </p>
                          </div>

                          <p className="text-xl font-bold text-red-600">
                            {completion}%
                          </p>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* NAVIGATION */}

                <div className="mt-4 space-y-1.5">
                  {[
                    {
                      label: "Fixed Expenses",
                      icon: Building2,
                    },
                    {
                      label: "Variable Expenses",
                      icon: Activity,
                    },
                    {
                      label: "Labour",
                      icon: Users,
                    },
                    {
                      label: "Financial Targets",
                      icon: Target,
                    },
                    {
                      label: "Tax & Finance",
                      icon: Landmark,
                    },
                    {
                      label: "Business Assumptions",
                      icon: TrendingUp,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        onClick={() => setInsightsSection(item.label)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                          insightsSection === item.label
                            ? "bg-red-50 text-red-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />

                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================= CONTENT ================= */}

              <div className="flex-1 overflow-y-auto p-4">
                <div className="mx-auto max-w-7xl space-y-4">
                  {/* TOP HEADER */}

                  <div className="sticky top-0 z-20 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      {/* LEFT */}

                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                          <Sparkles className="h-4 w-4 text-red-500" />
                        </div>

                        <div>
                          <h1 className="text-xl font-bold tracking-tight text-gray-900">
                            {insightsSection === "Labour"
                              ? "Labour Intelligence"
                              : insightsSection}
                          </h1>

                          <p className="mt-0.5 text-[12px] text-gray-500">
                            AI-powered operational intelligence
                          </p>
                        </div>
                      </div>

                      {/* BUTTON */}

                      {insightsSection !== "Labour" && (
                        <button
                          onClick={handleSaveInsights}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95"
                        >
                          <Save className="h-4 w-4" />
                          Save Setup
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ================= FIXED EXPENSES ================= */}

                  {insightsSection === "Fixed Expenses" && (
                    <div className="space-y-4">
                      {/* KPI */}

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {/* MONTHLY FIXED */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Monthly Fixed Cost
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                            ₹
                            {(
                              insightsData.monthlyRent +
                              insightsData.loanEmi +
                              insightsData.internet +
                              insightsData.phoneBills +
                              insightsData.accounting +
                              insightsData.insurance +
                              insightsData.licenses
                            ).toLocaleString()}
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Operational commitments
                          </p>
                        </div>

                        {/* HEALTH */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Expense Health
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                            Stable
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Financial commitments manageable
                          </p>
                        </div>

                        {/* AI */}

                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="mt-0.5 h-4 w-4 text-blue-600" />

                            <p className="text-sm leading-6 text-blue-900">
                              Fixed cost ratio is currently within healthy
                              operational range.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* FORM */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-5">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Monthly Fixed Expenses
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Configure recurring operational commitments
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Monthly Rent",
                              key: "monthlyRent",
                            },
                            {
                              label: "Loan EMI",
                              key: "loanEmi",
                            },
                            {
                              label: "Internet",
                              key: "internet",
                            },
                            {
                              label: "Phone Bills",
                              key: "phoneBills",
                            },
                            {
                              label: "Accounting",
                              key: "accounting",
                            },
                            {
                              label: "Insurance",
                              key: "insurance",
                            },
                            {
                              label: "Licenses",
                              key: "licenses",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                  ₹
                                </span>

                                <input
                                  type="number"
                                  value={insightsData[field.key]}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-3 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                Monthly operational expense
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ================= VARIABLE EXPENSES ================= */}

                  {insightsSection === "Variable Expenses" && (
                    <div className="space-y-4">
                      {/* KPI */}

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {/* MONTHLY VARIABLE */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Monthly Variable Cost
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                            ₹
                            {(
                              insightsData.deliveryCharges +
                              insightsData.packaging +
                              insightsData.paymentGateway +
                              insightsData.aggregatorCommission +
                              insightsData.electricity +
                              insightsData.gas +
                              insightsData.maintenance +
                              insightsData.fuel
                            ).toLocaleString()}
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Operational running expenses
                          </p>
                        </div>

                        {/* HEALTH */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-[12px] font-medium uppercase tracking-wide text-gray-400">
                            Expense Health
                          </p>

                          <p className="mt-2 text-2xl font-bold tracking-tight text-orange-500">
                            Moderate
                          </p>

                          <p className="mt-2 text-[12px] text-gray-500">
                            Utility & operational costs increasing
                          </p>
                        </div>

                        {/* AI */}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="mt-0.5 h-4 w-4 text-orange-600" />

                            <p className="text-sm leading-6 text-orange-900">
                              Electricity and aggregator charges are
                              contributing heavily to monthly variable expenses.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* FORM */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-5">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Monthly Variable Expenses
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Configure operational & utility based expenses
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Delivery Charges",
                              key: "deliveryCharges",
                            },
                            {
                              label: "Packaging",
                              key: "packaging",
                            },
                            {
                              label: "Payment Gateway",
                              key: "paymentGateway",
                            },
                            {
                              label: "Aggregator Commission",
                              key: "aggregatorCommission",
                            },
                            {
                              label: "Electricity",
                              key: "electricity",
                            },
                            {
                              label: "Gas",
                              key: "gas",
                            },
                            {
                              label: "Maintenance",
                              key: "maintenance",
                            },
                            {
                              label: "Fuel",
                              key: "fuel",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                  ₹
                                </span>

                                <input
                                  type="number"
                                  value={insightsData[field.key]}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-8 pr-3 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                Monthly operational expense
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {insightsSection === "Labour" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* TOTAL STAFF */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Staff
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {staffData?.length || 0}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Active workforce
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        {/* LABOUR COST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Labour Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  staffData?.reduce(
                                    (sum: number, s: any) =>
                                      sum + (s.salary || 0),
                                    0,
                                  ) || 0
                                ).toLocaleString()}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Monthly salary
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                              <Wallet className="h-4 w-4 text-red-500" />
                            </div>
                          </div>
                        </div>

                        {/* AVG SALARY */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Avg Salary
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {staffData?.length
                                  ? Math.round(
                                      staffData.reduce(
                                        (sum: number, s: any) =>
                                          sum + (s.salary || 0),
                                        0,
                                      ) / staffData.length,
                                    ).toLocaleString()
                                  : 0}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Per employee
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <BadgeIndianRupee className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>

                        {/* FULL TIME */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Full Time
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {staffData?.filter(
                                  (s: any) => s.employmentType === "FULL_TIME",
                                ).length || 0}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Permanent staff
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                              <UserCheck className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= DEPARTMENT BREAKDOWN ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                            <Building2 className="h-4 w-4 text-indigo-600" />
                          </div>

                          <div>
                            <h3 className="text-[18px] font-semibold text-gray-900">
                              Department Breakdown
                            </h3>

                            <p className="mt-1 text-[12px] text-gray-500">
                              Salary distribution by department
                            </p>
                          </div>
                        </div>

                        {/* GRID */}

                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                          {[
                            "KITCHEN",
                            "SERVICE",
                            "DELIVERY",
                            "CLEANING",
                            "ADMIN",
                            "SECURITY",
                            "PURCHASE",
                            "MAINTENANCE",
                          ].map((dept) => {
                            const deptStaff =
                              staffData?.filter(
                                (s: any) => s.department === dept,
                              ) || [];

                            const deptSalary = deptStaff.reduce(
                              (sum: number, s: any) => sum + (s.salary || 0),
                              0,
                            );

                            return (
                              <div
                                key={dept}
                                className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-200 hover:bg-white"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                      {dept}
                                    </p>

                                    <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">
                                      ₹{deptSalary.toLocaleString()}
                                    </p>

                                    <p className="mt-1 text-[11px] text-gray-500">
                                      {deptStaff.length} staff members
                                    </p>
                                  </div>

                                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                                    <Users className="h-4 w-4 text-red-500" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ================= STAFF TABLE ================= */}

                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {/* HEADER */}

                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                              <ClipboardList className="h-4 w-4 text-red-500" />
                            </div>

                            <div>
                              <h3 className="text-[18px] font-semibold text-gray-900">
                                Staff Overview
                              </h3>

                              <p className="mt-1 text-[12px] text-gray-500">
                                Restaurant workforce summary
                              </p>
                            </div>
                          </div>

                          <div className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
                            {staffData?.length || 0} Employees
                          </div>
                        </div>

                        {/* TABLE */}

                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            {/* HEAD */}

                            <thead className="bg-gray-50">
                              <tr>
                                {[
                                  "Name",
                                  "Role",
                                  "Department",
                                  "Salary",
                                  "Employment",
                                  "Shift",
                                  "Hours",
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
                    tracking-[0.14em]
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
                              {staffData?.map((staff: any, index: number) => (
                                <tr
                                  key={index}
                                  className="border-t border-gray-100 transition hover:bg-red-50/20"
                                >
                                  {/* NAME */}

                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-700">
                                        {staff.name?.charAt(0)}
                                      </div>

                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {staff.name}
                                        </p>

                                        <p className="text-[11px] text-gray-400">
                                          Staff member
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* ROLE */}

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {staff.role}
                                  </td>

                                  {/* DEPARTMENT */}

                                  <td className="px-4 py-3">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                                      {staff.department}
                                    </span>
                                  </td>

                                  {/* SALARY */}

                                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                    ₹{staff.salary?.toLocaleString()}
                                  </td>

                                  {/* EMPLOYMENT */}

                                  <td className="px-4 py-3">
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                        staff.employmentType === "FULL_TIME"
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-amber-50 text-amber-600"
                                      }`}
                                    >
                                      {staff.employmentType}
                                    </span>
                                  </td>

                                  {/* SHIFT */}

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {staff.shift}
                                  </td>

                                  {/* HOURS */}

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {staff.monthlyWorkingHours}h
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ================= FINANCIAL TARGETS ================= */}

                  {insightsSection === "Financial Targets" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* TARGET EBITDA */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                EBITDA Target
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {insightsData.targetEbitda || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Profitability goal
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <TrendingUp className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>

                        {/* FOOD COST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Food Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {insightsData.targetFoodCost || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Inventory efficiency
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                              <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                            </div>
                          </div>
                        </div>

                        {/* GROSS MARGIN */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Gross Margin
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {insightsData.targetGrossMargin || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Revenue margin target
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                              <BarChart3 className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                        </div>

                        {/* PRIME COST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Prime Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {insightsData.targetPrimeCost || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Labour + food cost
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                              <PieChart className="h-4 w-4 text-red-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= TARGET FORM ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                            <Target className="h-4 w-4 text-red-500" />
                          </div>

                          <div>
                            <h3 className="text-[18px] font-semibold text-gray-900">
                              Financial Goal Configuration
                            </h3>

                            <p className="mt-1 text-[12px] text-gray-500">
                              Configure profitability & operational targets
                            </p>
                          </div>
                        </div>

                        {/* FORM GRID */}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Target EBITDA %",
                              key: "targetEbitda",
                              helper: "Expected profitability target",
                            },

                            {
                              label: "Target Food Cost %",
                              key: "targetFoodCost",
                              helper: "Ideal inventory cost ratio",
                            },

                            {
                              label: "Target Gross Margin %",
                              key: "targetGrossMargin",
                              helper: "Revenue profitability expectation",
                            },

                            {
                              label: "Target Prime Cost %",
                              key: "targetPrimeCost",
                              helper: "Combined labour & food cost",
                            },

                            {
                              label: "Monthly Revenue Goal",
                              key: "monthlyRevenueGoal",
                              helper: "Target monthly restaurant revenue",
                              prefix: "₹",
                            },

                            {
                              label: "Monthly Profit Goal",
                              key: "monthlyProfitGoal",
                              helper: "Expected monthly net profit",
                              prefix: "₹",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                {field.prefix ? (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    {field.prefix}
                                  </span>
                                ) : (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    %
                                  </span>
                                )}

                                <input
                                  type="number"
                                  value={insightsData[field.key]}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white ${
                                    field.prefix ? "pl-8 pr-3" : "pl-3 pr-8"
                                  }`}
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                {field.helper}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ================= TARGET INSIGHTS ================= */}

                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        {/* EBITDA */}

                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="mt-0.5 h-4 w-4 text-violet-600" />

                            <div>
                              <p className="text-sm font-semibold text-violet-900">
                                EBITDA Strategy
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-violet-800">
                                Maintaining EBITDA above 15% is considered
                                healthy for most restaurant operations.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* FOOD */}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <div className="flex items-start gap-3">
                            <UtensilsCrossed className="mt-0.5 h-4 w-4 text-orange-600" />

                            <div>
                              <p className="text-sm font-semibold text-orange-900">
                                Food Cost Control
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-orange-800">
                                Restaurants usually maintain food cost between
                                28%–35% for sustainable profitability.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* PRIME */}

                        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                          <div className="flex items-start gap-3">
                            <PieChart className="mt-0.5 h-4 w-4 text-red-500" />

                            <div>
                              <p className="text-sm font-semibold text-red-900">
                                Prime Cost Health
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-red-800">
                                Prime cost should ideally stay below 60% for
                                strong operational performance.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= TAX & FINANCE ================= */}

                  {insightsSection === "Tax & Finance" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* GST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                GST
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                {insightsData.gstPercentage || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Tax percentage
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <Receipt className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        {/* EMI */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Loan EMI
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  insightsData.monthlyLoanEmi || 0
                                ).toLocaleString()}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Monthly repayments
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                              <Wallet className="h-4 w-4 text-red-500" />
                            </div>
                          </div>
                        </div>

                        {/* INTEREST */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Interest
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  insightsData.monthlyInterestPayments || 0
                                ).toLocaleString()}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Financing charges
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                              <BadgePercent className="h-4 w-4 text-orange-600" />
                            </div>
                          </div>
                        </div>

                        {/* TOTAL */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Finance Cost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                                ₹
                                {(
                                  (insightsData.monthlyLoanEmi || 0) +
                                  (insightsData.monthlyInterestPayments || 0) +
                                  (insightsData.caFees || 0) +
                                  (insightsData.insuranceCost || 0) +
                                  (insightsData.otherTaxes || 0)
                                ).toLocaleString()}
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Total financial overhead
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <Landmark className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= FORM ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                            <Landmark className="h-4 w-4 text-violet-600" />
                          </div>

                          <div>
                            <h3 className="text-[18px] font-semibold text-gray-900">
                              Tax & Financial Configuration
                            </h3>

                            <p className="mt-1 text-[12px] text-gray-500">
                              Configure tax liabilities & financing expenses
                            </p>
                          </div>
                        </div>

                        {/* GRID */}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "GST Percentage",
                              key: "gstPercentage",
                              helper: "Applicable restaurant GST %",
                              suffix: "%",
                            },

                            {
                              label: "Monthly Loan EMI",
                              key: "monthlyLoanEmi",
                              helper: "Monthly repayment amount",
                              prefix: "₹",
                            },

                            {
                              label: "Interest Payments",
                              key: "monthlyInterestPayments",
                              helper: "Monthly financing interest",
                              prefix: "₹",
                            },

                            {
                              label: "CA / Accounting Fees",
                              key: "caFees",
                              helper: "Professional accounting expense",
                              prefix: "₹",
                            },

                            {
                              label: "Insurance Cost",
                              key: "insuranceCost",
                              helper: "Monthly business insurance",
                              prefix: "₹",
                            },

                            {
                              label: "Other Taxes",
                              key: "otherTaxes",
                              helper: "Additional tax obligations",
                              prefix: "₹",
                            },
                          ].map((field) => (
                            <div
                              key={field.key}
                              className="rounded-xl border border-gray-200 bg-white p-3"
                            >
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>

                              <div className="relative">
                                {field.prefix && (
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    {field.prefix}
                                  </span>
                                )}

                                {field.suffix && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    {field.suffix}
                                  </span>
                                )}

                                <input
                                  type="number"
                                  value={insightsData[field.key]}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className={`w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white ${
                                    field.prefix
                                      ? "pl-8 pr-3"
                                      : field.suffix
                                        ? "pl-3 pr-8"
                                        : "px-3"
                                  }`}
                                />
                              </div>

                              <p className="mt-2 text-[11px] text-gray-400">
                                {field.helper}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ================= INSIGHTS ================= */}

                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        {/* TAX */}

                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <div className="flex items-start gap-3">
                            <Receipt className="mt-0.5 h-4 w-4 text-blue-600" />

                            <div>
                              <p className="text-sm font-semibold text-blue-900">
                                GST Planning
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-blue-800">
                                Restaurants generally operate under 5% GST
                                without input tax credit for simplified
                                taxation.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* LOAN */}

                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <div className="flex items-start gap-3">
                            <Wallet className="mt-0.5 h-4 w-4 text-orange-600" />

                            <div>
                              <p className="text-sm font-semibold text-orange-900">
                                Financing Health
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-orange-800">
                                Loan repayment should ideally remain below 15%
                                of monthly revenue for healthy cash flow.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* INSURANCE */}

                        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                          <div className="flex items-start gap-3">
                            <ShieldCheck className="mt-0.5 h-4 w-4 text-violet-600" />

                            <div>
                              <p className="text-sm font-semibold text-violet-900">
                                Risk Protection
                              </p>

                              <p className="mt-1 text-[12px] leading-6 text-violet-800">
                                Insurance coverage protects restaurant
                                operations against unexpected liabilities &
                                operational risks.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* ================= BUSINESS ASSUMPTIONS ================= */}

                  {insightsSection === "Business Assumptions" && (
                    <div className="space-y-4">
                      {/* ================= KPI ================= */}

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {/* GROWTH */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Revenue Growth
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                                +{insightsData.expectedMonthlyGrowth || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Monthly projection
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                              <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                        </div>

                        {/* DELIVERY */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Delivery
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600">
                                +{insightsData.expectedDeliveryGrowth || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Online expansion
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                              <Bike className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                        </div>

                        {/* WEEKEND */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Weekend Boost
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-violet-600">
                                +{insightsData.weekendSalesIncrease || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Weekend uplift
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                              <Rocket className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </div>

                        {/* SEASONAL */}

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                Seasonal
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-tight text-pink-500">
                                {insightsData.seasonalImpact || 0}%
                              </p>

                              <p className="mt-1 text-[11px] text-gray-500">
                                Seasonal fluctuation
                              </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
                              <CalendarRange className="h-4 w-4 text-pink-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ================= FORECAST ENGINE ================= */}

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* HEADER */}

                        <div className="mb-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                              <Sparkles className="h-4 w-4 text-red-500" />
                            </div>

                            <div>
                              <h3 className="text-[18px] font-semibold text-gray-900">
                                Business Forecast Engine
                              </h3>

                              <p className="mt-1 text-[12px] text-gray-500">
                                Future growth & operational assumptions
                              </p>
                            </div>
                          </div>

                          <div className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
                            AI Forecast Active
                          </div>
                        </div>

                        {/* INPUT GRID */}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Expected Monthly Growth %",
                              key: "expectedMonthlyGrowth",
                              placeholder: "10",
                              icon: TrendingUp,
                              color: "emerald",
                            },

                            {
                              label: "Expected Delivery Growth %",
                              key: "expectedDeliveryGrowth",
                              placeholder: "15",
                              icon: Bike,
                              color: "blue",
                            },

                            {
                              label: "Seasonal Impact %",
                              key: "seasonalImpact",
                              placeholder: "20",
                              icon: CalendarRange,
                              color: "pink",
                            },

                            {
                              label: "Weekend Sales Increase %",
                              key: "weekendSalesIncrease",
                              placeholder: "25",
                              icon: Rocket,
                              color: "violet",
                            },
                          ].map((field) => {
                            const Icon = field.icon;

                            return (
                              <div
                                key={field.key}
                                className="rounded-xl border border-gray-200 bg-white p-3"
                              >
                                {/* TOP */}

                                <div className="mb-3 flex items-center gap-3">
                                  <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                      field.color === "emerald"
                                        ? "bg-emerald-50"
                                        : field.color === "blue"
                                          ? "bg-blue-50"
                                          : field.color === "pink"
                                            ? "bg-pink-50"
                                            : "bg-violet-50"
                                    }`}
                                  >
                                    <Icon
                                      className={`h-4 w-4 ${
                                        field.color === "emerald"
                                          ? "text-emerald-600"
                                          : field.color === "blue"
                                            ? "text-blue-600"
                                            : field.color === "pink"
                                              ? "text-pink-500"
                                              : "text-violet-600"
                                      }`}
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-800">
                                      {field.label}
                                    </label>

                                    <p className="mt-0.5 text-[11px] text-gray-400">
                                      Forecast configuration
                                    </p>
                                  </div>
                                </div>

                                {/* INPUT */}

                                <div className="relative">
                                  <input
                                    type="number"
                                    value={insightsData[field.key]}
                                    onChange={(e) =>
                                      setInsightsData({
                                        ...insightsData,
                                        [field.key]: Number(e.target.value),
                                      })
                                    }
                                    placeholder={field.placeholder}
                                    className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    py-2.5
                    pl-3
                    pr-8
                    text-sm
                    outline-none
                    transition-all
                    duration-200
                    focus:border-red-300
                    focus:bg-white
                  "
                                  />

                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    %
                                  </span>
                                </div>

                                {/* RANGE */}

                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={insightsData[field.key]}
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]: Number(e.target.value),
                                    })
                                  }
                                  className="mt-3 w-full accent-red-500"
                                />
                              </div>
                            );
                          })}

                          {/* EXPANSION */}

                          <div className="rounded-xl border border-gray-200 bg-white p-3 md:col-span-2 xl:col-span-1">
                            <div className="mb-3 flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                                <Building2 className="h-4 w-4 text-red-500" />
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-800">
                                  Planned Expansion
                                </label>

                                <p className="mt-0.5 text-[11px] text-gray-400">
                                  Future scaling strategy
                                </p>
                              </div>
                            </div>

                            <select
                              value={insightsData.plannedExpansion}
                              onChange={(e) =>
                                setInsightsData({
                                  ...insightsData,
                                  plannedExpansion: e.target.value,
                                })
                              }
                              className="
              w-full
              rounded-xl
              border
              border-gray-200
              bg-gray-50
              px-3
              py-2.5
              text-sm
              outline-none
              transition-all
              duration-200
              focus:border-red-300
              focus:bg-white
            "
                            >
                              <option value="">Select Expansion</option>

                              <option value="NONE">No Expansion</option>

                              <option value="NEW_BRANCH">New Branch</option>

                              <option value="CLOUD_KITCHEN">
                                Cloud Kitchen
                              </option>

                              <option value="MULTI_CITY">
                                Multi City Expansion
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ================= AI INSIGHT ================= */}

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-emerald-900">
                              AI Forecast Analysis
                            </h4>

                            <p className="mt-1 text-[13px] leading-6 text-emerald-800">
                              Based on current assumptions, the restaurant shows
                              healthy delivery scalability, improving weekend
                              performance and stable operational growth
                              potential.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
