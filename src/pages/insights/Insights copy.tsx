import { useState, useEffect } from "react";
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
  Goal,
  IndianRupee,
  BadgeDollarSign,
  Calculator,
  CalendarRange,
  ChartNoAxesCombined,
  FileText,
  Receipt,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import React from "react";

const tabs = [
  "Overview",
  "Inventory",
  "Inventory Restock",
  "Insights Setup",
];

export default function Insights() {
  const [activeTab, setActiveTab] =  useState("Overview");
  const [staffData, setStaffData] =  useState<any[]>([]);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}",);
  const [insightsSection, setInsightsSection,] = useState("Fixed Expenses",);
  const [ingredients, setIngredients,] = useState<any>({});
  const [loading, setLoading,] = useState(false);
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
  const totalFixedExpenses =
    insightsData.monthlyRent +
    insightsData.loanEmi +
    insightsData.internet +
    insightsData.phoneBills +
    insightsData.accounting +
    insightsData.insurance +
    insightsData.licenses;
  const totalVariableExpenses =
    insightsData.deliveryCharges +
    insightsData.packaging +
    insightsData.paymentGateway +
    insightsData.aggregatorCommission +
    insightsData.electricity +
    insightsData.gas +
    insightsData.maintenance +
    insightsData.fuel;
  const totalLabourCost =
    staffData?.reduce(
      (sum: number, s: any) =>
        sum + (s.salary || 0),
      0,
    ) || 0;
  const totalFinanceCost =
    insightsData.monthlyLoanEmi +
    insightsData.monthlyInterestPayments +
    insightsData.caFees +
    insightsData.insuranceCost +
    insightsData.otherTaxes;
  const totalExpenses =
    totalFixedExpenses +
    totalVariableExpenses +
    totalLabourCost +
    totalFinanceCost;
  const revenue = insightsData.revenue || 0;
  const ebitda = revenue - totalExpenses;
  const restockData = restockHistory || [];
  const totalPurchaseValue =restockData.reduce((sum: number,item: any,) => {
      return ( sum + Number(item.TotalPurchaseAmount || 0,));
    },
    0,
  );
  /* INVENTORY VALUE */
  const inventoryValue = restockData.reduce(( sum: number, item: any,) => {
      return ( sum + Number(item.MonthClosingValue || 0,));
    },
    0,
  );
  /* STARTING INVENTORY */
  const startingInventory = restockData.reduce((sum: number, item: any,) => {
      return ( sum + Number( item.OpeningStockValue || 0, ));
    },
    0,
  );
  /* ACTUAL FOOD COST */
  const actualFoodCost = restockData.reduce(( sum: number, item: any, ) => {
      return ( sum + Number(item.MonthlyRMExpense || 0,));
    },
    0,
  );
  /* FOOD COST % */
  const actualFoodCostPercentage = revenue ? ((actualFoodCost / revenue) * 100).toFixed(1) : "0";
  /* INVENTORY TURNOVER */
  const inventoryTurnover = inventoryValue ? (actualFoodCost / inventoryValue).toFixed(2): "0";
  /* INFLATED INGREDIENTS */
  const inflatedIngredients = restockData.filter((item: any) => {
      const week1 = Number( item.Week1Price || 0, );
      const week5 = Number( item.Week5Price || 0, );
      return week5 > week1;
    },
  );
  /* TOP PURCHASED INGREDIENTS */
  const topPurchasedIngredients =[...restockData].sort((a: any,b: any,) => Number(b.TotalPurchaseAmount || 0,) - Number(a.TotalPurchaseAmount || 0,),).slice(0, 5);
  /* EBITDA % */
  const ebitdaPercentage = revenue ? ((ebitda / revenue) * 100).toFixed(1) : 0;
  /* FOOD COST % */
  const foodCostPercentage = revenue ? ((totalVariableExpenses / revenue) * 100).toFixed(1) : 0;
  /* PRIME COST % */
  const primeCostPercentage = revenue ? (((totalVariableExpenses + totalLabourCost) / revenue ) * 100).toFixed(1) : 0;

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem("token",);
        const user = JSON.parse(localStorage.getItem("user",) || "{}",);
        const res = await fetch(`http://localhost:5000/api/restaurant/insights/${user.restaurantId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (data.success && data.data) {
          setInsightsData(data.data,);
        }
      } catch (err) {
        console.log(err);
      }
    };
    
    const fetchRestockHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user",) || "{}",);
        const token = localStorage.getItem("token",);
        const res = await fetch(`http://localhost:5000/api/restaurant/restock-history/${user.restaurantId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
        const response = await res.json();
        if (response.success) {
          const currentDate = new Date();
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();
          console.log(currentMonth,"---",currentYear,"---",response.data)
          const currentMonthData = response.data.find(
            (item: any) =>
              item.month === currentMonth &&
              item.year === currentYear,
          );
          console.log(currentMonthData.data)
          if (currentMonthData) {
            console.log()
            const formattedData = currentMonthData.data.map(
                (item: any) => ({
                  Category:item["Category"],
                  Ingredient:item["Ingredient"],
                  Unit:item["Unit"],
                  OpeningStockQty:Number(item["Opening Stock Qty"] || 0,),
                  OpeningStockPrice:Number(item["Opening Stock Price"] || 0,),
                  OpeningStockValue:Number(item["Opening Stock Value"] || 0,),
                  Week1PurchaseQty:Number(item["Week1 Purchase Qty"] || 0,),
                  Week2PurchaseQty:Number(item["Week2 Purchase Qty"] || 0,),
                  Week3PurchaseQty:Number(item["Week3 Purchase Qty"] || 0,),
                  Week4PurchaseQty:Number(item["Week4 Purchase Qty"] || 0,),
                  Week5PurchaseQty:Number(item["Week5 Purchase Qty"] || 0,),
                  Week1Price:Number(item["Week1 Price"] || 0,),
                  Week5Price:Number(item["Week5 Price"] || 0,),
                  TotalPurchaseAmount:Number(item["Total Purchase Amount"] || 0,),
                  MonthClosingValue:Number(item["Month Closing Value"] || item["Week5 Closing Value"] || item["Week4 Closing Value"] || item["Week3 Closing Value"] || item["Week2 Closing Value"] || item["Week1 Closing Value"] || 0,),
                  MonthlyRMExpense:
                    Number(
                      item["Monthly RM Expense"] ||
                      (
                        Number(item["Opening Stock Value"] || 0) +
                        Number(item["Total Purchase Amount"] || 0) -
                        Number(item["Week5 Closing Value"] || item["Week4 Closing Value"] || item["Week3 Closing Value"] || item["Week2 Closing Value"] || item["Week1 Closing Value"] || 0,)
                      ),
                    ),
                  TotalPurchasedQty:
                    Number(item["Week1 Purchase Qty"] || 0) +
                    Number(item["Week2 Purchase Qty"] || 0) +
                    Number(item["Week3 Purchase Qty"] || 0) +
                    Number(item["Week4 Purchase Qty"] || 0) +
                    Number(item["Week5 Purchase Qty"] || 0),
                }),
              );
            setRestockHistory(formattedData,);
          } else {
            setRestockHistory([]);
          }
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchInsights();
    fetchRestockHistory();
  }, []);
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token",);
      const user =
      JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("http://localhost:5000/api/ingredients/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,},
          body: user.restaurantId,
        },
      );
      const data = await res.json();
      console.log("AI RESPONSE:", data,);
      if (data.success) {
        const formatted =
          Object.fromEntries(
            Object.entries(data.data,).map(
              ([category, items]) => [
                category,
                (items as string[]).map(
                  (item) => ({
                    name: item,
                    quantity: "",
                    unit: "Kg",
                    purchasePrice: "",
                    pricePerUnit: "",
                  }),
                ),
              ],
            ),
          );
        setIngredients(formatted,);
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
      const res = await fetch( "http://localhost:5000/api/ingredients/save",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            restaurantId,
            ingredients,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        alert(
          "Ingredients saved successfully",
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem("token",);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch(`http://localhost:5000/api/ingredients/restaurant/${user.restaurantId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (data.success && data.data) {
        setIngredients(
          data.data,
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleRemoveIngredient = (category: string, index: number,) => {
    setIngredients(
      (prev: any) => {
        const updated = {...prev,};
        updated[category] = updated[category].filter((_: any,i: number,) => i !== index,);
        return updated;
      },
    );
  };

  const handleAddIngredient = (category: string,) => {
    setIngredients(
      (prev: any) => ({
        ...prev,
        [category]: [
          ...prev[
            category
          ],
          {
            name: "",
            quantity: "",
            unit: "Kg",
            purchasePrice: "",
            pricePerUnit: "",
          },
        ],
      }),
    );
  };

  const handleFieldChange = (category: string, index: number, field: string, value: any,) => {
    setIngredients(
      (prev: any) => {
        const updated = {...prev,};
        updated[category][index][field] = value;
        const item = updated[category][index];
        const qty = Number(item.quantity,);
        const price = Number(item.purchasePrice,);
        if (qty > 0 && price > 0) {
          item.pricePerUnit = (price / qty).toFixed(2);
        }
        return {...updated,};
      },
    );
  };

  const handleSaveInsights = async () => {
    try {
      const token = localStorage.getItem("token",);
      const user = JSON.parse(localStorage.getItem("user",) || "{}",);
      const res = await fetch("http://localhost:5000/api/restaurant/insights",{
          method: "POST",
          headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`,},
          body: JSON.stringify({...insightsData, restaurantId: user.restaurantId,}),
        },
      );
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log(err);
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
      // Object.entries(ingredients).forEach(
      //   ([category, items]: any) => {

      //     items.forEach((item: any) => {

      //       const row = worksheet.getRow(rowNumber);

      //       row.getCell(1).value = category;
      //       row.getCell(2).value = item.name;
      //       row.getCell(3).value = item.unit || "Kg";

      //       // Opening stock value
      //       row.getCell(6).value = {
      //         formula: `D${rowNumber}*E${rowNumber}`,
      //       };

      //       // Week 1
      //       row.getCell(9).value = {
      //         formula: `G${rowNumber}*H${rowNumber}`,
      //       };

      //       row.getCell(10).value = {
      //         formula: `D${rowNumber}+G${rowNumber}`,
      //       };

      //       row.getCell(11).value = {
      //         formula: `F${rowNumber}+I${rowNumber}`,
      //       };

      //       row.getCell(13).value = {
      //         formula:
      //           `(L${rowNumber}/J${rowNumber})*K${rowNumber}`,
      //       };

      //       row.getCell(14).value = {
      //         formula: `K${rowNumber}-M${rowNumber}`,
      //       };

      //       // Week 2
      //       row.getCell(17).value = {
      //         formula: `O${rowNumber}*P${rowNumber}`,
      //       };

      //       row.getCell(18).value = {
      //         formula: `L${rowNumber}+O${rowNumber}`,
      //       };

      //       row.getCell(19).value = {
      //         formula: `M${rowNumber}+Q${rowNumber}`,
      //       };

      //       row.getCell(21).value = {
      //         formula:
      //           `(T${rowNumber}/R${rowNumber})*S${rowNumber}`,
      //       };

      //       row.getCell(22).value = {
      //         formula: `S${rowNumber}-U${rowNumber}`,
      //       };

      //       // Week 3
      //       row.getCell(25).value = {
      //         formula: `W${rowNumber}*X${rowNumber}`,
      //       };

      //       row.getCell(26).value = {
      //         formula: `T${rowNumber}+W${rowNumber}`,
      //       };

      //       row.getCell(27).value = {
      //         formula: `U${rowNumber}+Y${rowNumber}`,
      //       };

      //       row.getCell(29).value = {
      //         formula:
      //           `(AB${rowNumber}/Z${rowNumber})*AA${rowNumber}`,
      //       };

      //       row.getCell(30).value = {
      //         formula: `AA${rowNumber}-AC${rowNumber}`,
      //       };

      //       // Week 4
      //       row.getCell(33).value = {
      //         formula: `AE${rowNumber}*AF${rowNumber}`,
      //       };

      //       row.getCell(34).value = {
      //         formula: `AB${rowNumber}+AE${rowNumber}`,
      //       };

      //       row.getCell(35).value = {
      //         formula: `AC${rowNumber}+AG${rowNumber}`,
      //       };

      //       row.getCell(37).value = {
      //         formula:
      //           `(AJ${rowNumber}/AH${rowNumber})*AI${rowNumber}`,
      //       };

      //       row.getCell(38).value = {
      //         formula: `AI${rowNumber}-AK${rowNumber}`,
      //       };

      //       // Week 5
      //       row.getCell(41).value = {
      //         formula: `AM${rowNumber}*AN${rowNumber}`,
      //       };

      //       row.getCell(42).value = {
      //         formula: `AJ${rowNumber}+AM${rowNumber}`,
      //       };

      //       row.getCell(43).value = {
      //         formula: `AK${rowNumber}+AO${rowNumber}`,
      //       };

      //       row.getCell(45).value = {
      //         formula:
      //           `(AR${rowNumber}/AP${rowNumber})*AQ${rowNumber}`,
      //       };

      //       row.getCell(46).value = {
      //         formula: `AQ${rowNumber}-AS${rowNumber}`,
      //       };

      //       // Monthly totals

      //       row.getCell(47).value = {
      //         formula:
      //           `I${rowNumber}+Q${rowNumber}+Y${rowNumber}+AG${rowNumber}+AO${rowNumber}`,
      //       };

      //       row.getCell(48).value = {
      //         formula:
      //           `N${rowNumber}+V${rowNumber}+AD${rowNumber}+AL${rowNumber}+AT${rowNumber}`,
      //       };

      //       row.getCell(49).value = {
      //         formula: `AS${rowNumber}`,
      //       };

      //       row.getCell(50).value = {
      //         formula:
      //           `F${rowNumber}+AU${rowNumber}-AW${rowNumber}`,
      //       };

      //       // Validation
      //       const validations = [
      //         { closing: "L", total: "J" },
      //         { closing: "T", total: "R" },
      //         { closing: "AB", total: "Z" },
      //         { closing: "AJ", total: "AH" },
      //         { closing: "AR", total: "AP" },
      //       ];

      //       validations.forEach((v) => {

      //         worksheet.getCell(
      //           `${v.closing}${rowNumber}`,
      //         ).dataValidation = {
      //           type: "decimal",
      //           operator: "lessThanOrEqual",
      //           formulae: [`${v.total}${rowNumber}`],
      //           showErrorMessage: true,
      //           errorTitle: "Invalid Stock",
      //           error:
      //             "Closing stock cannot exceed total inventory",
      //         };
      //       });

      //       rowNumber++;
      //     });
      //   },
      // );
      const sourceData = restockHistory?.length ? restockHistory : Object.entries(ingredients).flatMap(([category, items]: any) =>
          items.map((item: any) => ({
            Category: category,
            Ingredient: item.name,
            Unit: item.unit || "Kg",
          }))
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
          row.getCell(6).value = rowData.OpeningStockValue || {formula: `D${rowNumber}*E${rowNumber}`,};
          /* ================= WEEK 1 ================= */
          row.getCell(7).value = rowData.Week1PurchaseQty || 0;
          row.getCell(8).value = rowData.Week1Price || 0;
          row.getCell(9).value = rowData.Week1Total || { formula: `G${rowNumber}*H${rowNumber}`,};
          row.getCell(10).value =rowData.Week1TotalInventory || {formula: `D${rowNumber}+G${rowNumber}`,};
          row.getCell(11).value =rowData.Week1InventoryCost || { formula: `F${rowNumber}+I${rowNumber}`,};
          row.getCell(12).value =rowData.Week1ClosingStock || 0;
          row.getCell(13).value =rowData.Week1ClosingValue || {formula:`(L${rowNumber}/J${rowNumber})*K${rowNumber}`,};
          row.getCell(14).value =rowData.Week1Expense || {formula: `K${rowNumber}-M${rowNumber}`,};
          /* ================= WEEK 2 ================= */
          row.getCell(15).value = rowData.Week2PurchaseQty || 0;
          row.getCell(16).value = rowData.Week2Price || 0;
          row.getCell(17).value = rowData.Week2Total || { formula: `O${rowNumber}*P${rowNumber}`, };
          row.getCell(18).value = rowData.Week2TotalInventory || { formula: `L${rowNumber}+O${rowNumber}`, };
          row.getCell(19).value = rowData.Week2InventoryCost || { formula: `M${rowNumber}+Q${rowNumber}`, };
          row.getCell(20).value = rowData.Week2ClosingStock || 0;
          row.getCell(21).value = rowData.Week2ClosingValue || { formula: `(T${rowNumber}/R${rowNumber})*S${rowNumber}`, };
          row.getCell(22).value = rowData.Week2Expense || { formula: `S${rowNumber}-U${rowNumber}`, };
          /* ================= WEEK 3 ================= */
          row.getCell(23).value = rowData.Week3PurchaseQty || 0;
          row.getCell(24).value = rowData.Week3Price || 0;
          row.getCell(25).value = rowData.Week3Total || { formula: `W${rowNumber}*X${rowNumber}`, };
          row.getCell(26).value = rowData.Week3TotalInventory || { formula: `T${rowNumber}+W${rowNumber}`, };
          row.getCell(27).value = rowData.Week3InventoryCost || { formula: `U${rowNumber}+Y${rowNumber}`, };
          row.getCell(28).value = rowData.Week3ClosingStock || 0;
          row.getCell(29).value = rowData.Week3ClosingValue || { formula: `(AB${rowNumber}/Z${rowNumber})*AA${rowNumber}`, };
          row.getCell(30).value = rowData.Week3Expense || { formula: `AA${rowNumber}-AC${rowNumber}`, };
          /* ================= WEEK 4 ================= */
          row.getCell(31).value = rowData.Week4PurchaseQty || 0;
          row.getCell(32).value = rowData.Week4Price || 0;
          row.getCell(33).value = rowData.Week4Total || { formula: `AE${rowNumber}*AF${rowNumber}`, };
          row.getCell(34).value = rowData.Week4TotalInventory || { formula: `AB${rowNumber}+AE${rowNumber}`, };
          row.getCell(35).value = rowData.Week4InventoryCost || { formula: `AC${rowNumber}+AG${rowNumber}`, };
          row.getCell(36).value = rowData.Week4ClosingStock || 0;
          row.getCell(37).value = rowData.Week4ClosingValue || { formula: `(AJ${rowNumber}/AH${rowNumber})*AI${rowNumber}`, };
          row.getCell(38).value = rowData.Week4Expense || { formula: `AI${rowNumber}-AK${rowNumber}`, };
          /* ================= WEEK 5 ================= */
          row.getCell(39).value = rowData.Week5PurchaseQty || 0;
          row.getCell(40).value = rowData.Week5Price || 0;
          row.getCell(41).value = rowData.Week5Total || { formula: `AM${rowNumber}*AN${rowNumber}`, };
          row.getCell(42).value = rowData.Week5TotalInventory || { formula: `AJ${rowNumber}+AM${rowNumber}`, };
          row.getCell(43).value = rowData.Week5InventoryCost || { formula: `AK${rowNumber}+AO${rowNumber}`, };
          row.getCell(44).value = rowData.Week5ClosingStock || 0;
          row.getCell(45).value = rowData.Week5ClosingValue || { formula: `(AR${rowNumber}/AP${rowNumber})*AQ${rowNumber}`, };
          row.getCell(46).value = rowData.Week5Expense || { formula: `AQ${rowNumber}-AS${rowNumber}`, };
          /* ================= MONTHLY ================= */
          row.getCell(47).value = rowData.TotalPurchaseAmount || 0;
          row.getCell(48).value = rowData.TotalWeeklyExpense || 0;
          row.getCell(49).value = rowData.MonthClosingValue || 0;
          row.getCell(50).value = rowData.MonthlyRMExpense || 0;
          rowNumber++;
        }
      );
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
      [buffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    );
    saveAs(blob,"inventory-template.xlsx",);
  };

  const handleUploadRestockSheet = (e: any,) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt: any,) => {
      const data = new Uint8Array(evt.target.result,);
      const workbook = XLSX.read(data, {type: "array",});
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet,);
      setRestockHistory(jsonData,);
      console.log("RESTOCK DATA",jsonData,);
    };
    reader.readAsArrayBuffer(file);
  };

  const saveRestockHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}",);
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await fetch("http://localhost:5000/api/restaurant/restock-history",{
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
        },
      );
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem("token",);
        const res = await fetch(`http://localhost:5000/api/restaurant/staff/${currentUser.restaurantId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        if (data.success) {
          setStaffData(data.data,);
        }
      } catch (err) {
        console.log(err);
      }
    };
    if (currentUser?.restaurantId) {
      fetchStaff();
    }
  }, []);

  const inventorySummary = restockHistory.reduce((acc: any, row: any) => {
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
    }
  );

  return (
    <main className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-[#f5f6fa] px-4 py-4 xl:px-6 xl:py-5">
      <div className="mx-auto flex h-full w-full  flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white/75 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* TITLE */}
            <div>
              <h1 className="text-[30px] font-bold tracking-tight text-gray-900">Insights</h1>
              <p className="mt-1 text-sm font-medium text-gray-500">Restaurant operational analytics and expense intelligence</p>
            </div>
            {/* TABS */}
            <div className="hide-scrollbar overflow-x-auto">
              <div className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setActiveTab(tab)
                    }
                    className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab
                        ? "border-red-500 bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20"
                        : "border-white/40 bg-white/70 text-gray-700 backdrop-blur-xl hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* OVERVIEW */}
          {activeTab ==="Overview" && (
            <div className="space-y-6">
              {/* TOP KPIs */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {/* REVENUE */}
                <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/75 px-6 py-5 hover:shadow-[0_12px_40px_rgba(255,0,80,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500"></div>
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100 blur-3xl"></div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-800">Monthly Revenue</p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-rose-600">{revenue}</p>
                    <p className="mt-4 text-xs text-gray-800">Total business earnings</p>

                  </div>
                </div>
                {/* NET PROFIT */}
                <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/75 px-6 py-5 hover:shadow-[0_12px_40px_rgba(255,0,80,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500"></div>
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100 blur-3xl"></div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-800">Estimated Net Profit</p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-rose-600">
                      ₹
                      {
                        isNaN(revenue - totalExpenses)
                          ? 0
                          : Math.round(
                              revenue - totalExpenses,
                            ).toLocaleString()
                      }
                    </p>
                    <p className="mt-4 text-xs text-gray-800">Operational profitability</p>
                  </div>
                </div>
                {/* EBITDA */}
                <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/75 px-6 py-5 hover:shadow-[0_12px_40px_rgba(255,0,80,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500"></div>
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100 blur-3xl"></div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-800">EBITDA %</p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-rose-600">{ebitdaPercentage}%</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <p className="text-xs text-gray-800">Profitability indicator</p>
                    </div>
                  </div>
                </div>
                {/* PRIME COST */}
                <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/75 px-6 py-5 hover:shadow-[0_12px_40px_rgba(255,0,80,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-rose-500 to-red-500"></div>
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100 blur-3xl"></div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-800">Prime Cost %</p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-rose-600">{primeCostPercentage}%</p>
                    <p className="mt-4 text-xs text-gray-800">Food + labor efficiency</p>
                  </div>
                </div>
              </div>
              {/* EBITDA HEALTH */}
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50">
                      <TrendingUp className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Profitability Health</h3>
                      <p className="mt-1 text-sm text-gray-500">Current vs target profitability</p>
                    </div>
                  </div>
                  <div className={`rounded-full px-4 py-2 text-sm font-semibold ${Number(ebitdaPercentage,) >= insightsData.targetEbitda
                        ? "bg-green-100 text-green-700"
                        : Number(
                              ebitdaPercentage,
                            ) >=
                            insightsData.targetEbitda -
                              5
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {Number(ebitdaPercentage,) >= insightsData.targetEbitda ? "Healthy" : Number(ebitdaPercentage,) >= insightsData.targetEbitda - 5 ? "Moderate" : "Critical"}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">Current EBITDA</p>
                    <p className="mt-2 text-3xl font-bold text-red-600">{ebitdaPercentage}%</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">Target EBITDA</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{insightsData.targetEbitda}%</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-5">
                    <p className="text-sm text-gray-500">EBITDA Gap</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {
                        isNaN(
                          Number(
                            ebitdaPercentage,
                          ) -
                          insightsData.targetEbitda,
                        )
                          ? "0"
                          : (
                              Number(
                                ebitdaPercentage,
                              ) -
                              insightsData.targetEbitda
                            ).toFixed(1)
                      }
                      %
                    </p>
                  </div>
                </div>
              </div>
              {/* SALES TARGET TABLE */}
              <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                {/* GLOW */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100/70 blur-3xl"></div>
                {/* HEADER */}
                <div className="relative z-10 mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                    <Target className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Sales Required For Target EBITDA</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Revenue required to reach profitability goals</p>
                  </div>
                </div>
                {/* TABLE */}
                <div className="relative z-10 overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-y-1">
                    {/* HEADER */}
                    <thead>
                      <tr>
                        {[
                          "Target EBITDA",
                          "Required Revenue",
                        ].map((head) => (
                          <th
                            key={head}
                            className="px-6 py-2 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    {/* BODY */}
                    <tbody>
                      {[0, 5, 10, 15, 20, 25].map(
                        (target) => {
                          const requiredRevenue =
                            totalExpenses /
                            (1 - target / 100);
                          return (
                            <tr
                              key={target}
                              className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:bg-red-50/30 hover:shadow-md"
                            >
                              {/* EBITDA */}
                              <td className="px-6 py-3">
                                <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{target}%</div>
                              </td>
                              {/* REVENUE */}
                              <td className="px-6 py-3">
                                <p className="text-sm font-semibold tracking-tight text-gray-900">
                                  ₹
                                  {Math.round(
                                    requiredRevenue,
                                  ).toLocaleString()}
                                </p>
                                <p className="mt-1 text-[11px] text-gray-400">Estimated revenue required</p>
                                {/* PROGRESS */}
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-500"
                                    style={{
                                      width: `${Math.min(
                                        target * 4,
                                        100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* COST BREAKDOWN */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Fixed Expenses",
                    value: totalFixedExpenses,
                    color: "from-rose-500 to-pink-500",
                    bg: "bg-rose-100",
                    iconColor: "text-rose-600",
                    text: "text-black",
                    glow: "bg-rose-100",
                    icon: Wallet,
                  },
                  {
                    label: "Variable Expenses",
                    value: totalVariableExpenses,
                    color: "from-rose-500 to-pink-500",
                    bg: "bg-rose-100",
                    iconColor: "text-rose-600",
                    text: "text-black",
                    glow: "bg-rose-100",
                    icon: BarChart3,
                  },
                  {
                    label: "Labour",
                    value: totalLabourCost,
                    color: "from-rose-500 to-pink-500",
                    bg: "bg-rose-100",
                    iconColor: "text-rose-600",
                    text: "text-black",
                    glow: "bg-rose-100",
                    icon: Users,
                  },
                  {
                    label: "Tax & Finance",
                    value: totalFinanceCost,
                    color: "from-rose-500 to-pink-500",
                    bg: "bg-rose-100",
                    iconColor: "text-rose-600",
                    text: "text-black",
                    glow: "bg-rose-100",
                    icon: Landmark,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white/75 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      {/* TOP BORDER */}
                      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${item.color}`}/>
                      {/* GLOW */}
                      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full ${item.glow} blur-3xl`}/>
                      <div className="relative z-10">
                        {/* ICON */}
                        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg}`}>
                          <Icon className={`h-5 w-5 ${item.iconColor}`}/>
                        </div>
                        {/* LABEL */}
                        <p className="text-sm font-medium text-gray-700">{item.label}</p>
                        {/* VALUE */}
                        <p className={`mt-3 text-3xl font-bold tracking-tight ${item.text}`}>
                          ₹
                          {Math.round(
                            item.value,
                          ).toLocaleString()}
                        </p>
                        {/* FOOTER */}
                        <p className="mt-3 text-xs text-gray-400">Expense category overview</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* INVENTORY INTELLIGENCE */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/70 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                {/* GLOW */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-100/70 blur-3xl"></div>
                {/* HEADER */}
                <div className="relative z-10 mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                    <Boxes className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Inventory Intelligence</h3>
                    <p className="mt-1 text-sm text-gray-500">Purchase and stock analytics</p>
                  </div>
                </div>
                {/* METRICS */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      title: "Actual Food Cost",
                      value: `₹${Math.round(actualFoodCost).toLocaleString()}`,
                      subtitle: "Ingredient spending",
                      color: "from-rose-500 to-red-500",
                      bg: "bg-rose-100",
                      iconColor: "text-rose-600",
                      text: "text-black",
                      glow: "bg-rose-100",
                      icon: UtensilsCrossed,
                    },
                    {
                      title: "Food Cost %",
                      value: `${actualFoodCostPercentage}%`,
                      subtitle: "Cost efficiency",
                      color: "from-rose-500 to-red-500",
                      bg: "bg-rose-100",
                      iconColor: "text-rose-600",
                      text: "text-black",
                      glow: "bg-rose-100",
                      icon: Percent,
                    },
                    {
                      title: "Inventory Value",
                      value: `₹${Math.round(inventoryValue).toLocaleString()}`,
                      subtitle: "Current stock worth",
                      color: "from-rose-500 to-red-500",
                      bg: "bg-rose-100",
                      iconColor: "text-rose-600",
                      text: "text-black",
                      glow: "bg-rose-100",
                      icon: Package,
                    },
                    {
                      title: "Inventory Turnover",
                      value: `${inventoryTurnover}x`,
                      subtitle: "Stock movement rate",
                      color: "from-rose-500 to-red-500",
                      bg: "bg-rose-100",
                      iconColor: "text-rose-600",
                      text: "text-black",
                      glow: "bg-rose-100",
                      icon: RefreshCcw,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white/75 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        {/* TOP BORDER */}
                        <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${item.color}`}/>
                        {/* GLOW */}
                        <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full ${item.glow} blur-3xl`}/>
                        <div className="relative z-10">
                          {/* ICON */}
                          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg}`}>
                            <Icon className={`h-5 w-5 ${item.iconColor}`}/>
                          </div>
                          {/* TITLE */}
                          <p className="text-sm font-medium text-gray-700">{item.title}</p>
                          {/* VALUE */}
                          <p className={`mt-3 text-3xl font-bold tracking-tight ${item.text}`}>{item.value}
                            </p>
                          {/* SUBTITLE */}
                          <p className="mt-3 text-xs text-gray-400">{item.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* TOP PURCHASED INGREDIENTS */}
              <div className="rounded-3xl border border-white/40 bg-white/70 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                {/* HEADER */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Top Purchased Ingredients</h3>
                    <p className="mt-1 text-sm text-gray-500">Highest inventory spending this month</p>
                  </div>
                </div>
                {/* LIST */}
                <div className="space-y-3">
                  {topPurchasedIngredients.map((item: any,index: number,) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {/* LEFT ACCENT */}
                        <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-orange-400 to-red-500"></div>
                        <div className="flex items-center justify-between">
                          {/* LEFT */}
                          <div className="flex items-center gap-4">
                            {/* RANK */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-sm font-bold text-orange-600">
                              #{index + 1}
                            </div>
                            {/* INFO */}
                            <div>
                              <p className="text-sm font-semibold tracking-tight text-gray-900">{item.Ingredient}</p>
                              <p className="mt-1 text-xs text-gray-400">{item.Category}</p>
                              {/* BADGE */}
                              <div className="mt-2 inline-flex rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                                High Purchase Volume
                              </div>
                            </div>
                          </div>
                          {/* RIGHT */}
                          <div className="text-right">
                            <p className="text-base font-bold text-gray-900">
                              ₹
                              {Math.round(
                                Number(
                                  item.TotalPurchaseAmount ||
                                    0,
                                ),
                              ).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs font-medium text-orange-500">
                              {item.TotalPurchasedQty}
                              {" "}
                              {item.Unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
              {/* AI INSIGHTS */}
              {/* <div className="relative overflow-hidden rounded-3xl border border-violet-100 from-rose-500 to-red-500  p-6 shadow-[0_8px_30px_rgba(124,58,237,0.08)]">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-200/40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-rose-100/40 blur-3xl"></div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 shadow-sm">
                    <Sparkles className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">AI Business Insights</h3>
                    <p className="mt-1 text-sm text-red-600">Automated operational intelligence</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4"> */}

                  {/* FOOD COST */}
                  {/* {Number(
                    actualFoodCostPercentage,
                  ) >
                    insightsData.targetFoodCost && (

                    <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm">

                      Food cost is above target by{" "}
                      {(
                        Number(
                          actualFoodCostPercentage,
                        ) -
                        insightsData.targetFoodCost
                      ).toFixed(1)}
                      %. Review ingredient pricing and wastage.
                    </div>
                  )} */}

                  {/* PRIME COST */}
                  {/* {Number(
                    primeCostPercentage,
                  ) >
                    insightsData.targetPrimeCost && (

                    <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm">

                      Prime cost exceeds healthy threshold. Labour or food costs need optimization.
                    </div>
                  )} */}

                  {/* EBITDA */}
                  {/* {Number(
                    ebitdaPercentage,
                  ) <
                    insightsData.targetEbitda && (

                    <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm">

                      Current EBITDA is below target. Increasing monthly sales or reducing overhead can improve profitability.
                    </div>
                  )} */}

                  {/* INFLATION */}
                  {/* {inflatedIngredients.length >
                    0 && (

                    <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm">

                      {
                        inflatedIngredients[0]
                          ?.Ingredient
                      }
                      {" "}
                      purchase price increased during the month. Vendor or market inflation may be impacting margins.
                    </div>
                  )} */}

                  {/* INVENTORY VALUE */}
                  {/* {inventoryValue >
                    revenue * 0.4 && (

                    <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm">

                      Inventory holding value is relatively high compared to monthly sales. Overstocking may affect cash flow.
                    </div>
                  )} */}

                  {/* HIGH PURCHASE COST */}
                  {/* {topPurchasedIngredients.length >
                    0 && (

                    <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm">

                      Highest inventory spending this month was on{" "}
                      {
                        topPurchasedIngredients[0]
                          ?.Ingredient
                      }
                      . Monitoring supplier pricing could improve profitability.
                    </div>
                  )}
                </div>
              </div> */}
            </div>
          )}
          {/* Inventory */}
          {activeTab === "Inventory" && (
            <div className="space-y-5">
              {/* TOP HEADER */}
              <div className="rounded-3xl border border-white/40 bg-white/70 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-200">
                      <Boxes className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Intelligence</h2>
                      <p className="mt-1 text-sm text-gray-500">AI-generated ingredient management workspace</p>
                      {/* STATS */}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">AI Generated</div>
                        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{Object.values(ingredients).flat().length} Ingredients</div>
                        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">{Object.keys(ingredients).length} Categories</div>
                      </div>
                    </div>
                  </div>
                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* GENERATE */}
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-5 text-sm font-semibold text-white shadow-lg shadow-red-100 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Sparkles className="h-4 w-4" />
                      {loading
                        ? "Generating..."
                        : "Generate"}
                    </button>
                    {/* SAVE */}
                    {Object.keys(ingredients).length > 0 && (
                      <button
                        onClick={handleSave}
                        className="flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* EMPTY STATE */}
              {Object.keys(ingredients).length === 0 && (
                <div className="flex min-h-[450px] items-center justify-center rounded-3xl border border-dashed border-red-200 bg-gradient-to-br from-red-50 via-white to-pink-50 p-10">
                  <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 shadow-[0_20px_50px_rgba(255,0,80,0.25)]">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-gray-900">
                      No Inventory Setup Found
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
                      Generate ingredients automatically using AI based on your restaurant menu.
                    </p>
                    <button
                      onClick={handleGenerate}
                      className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Ingredients
                    </button>
                  </div>
                </div>
              )}
              {/* INVENTORY */}
              {Object.keys(ingredients).length > 0 && (
                <div className="space-y-5">
                  {Object.entries(ingredients).map(
                    ([category, items]: any) => (
                      <div
                        key={category}
                        className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl"
                      >
                        {/* CATEGORY HEADER */}
                        <div className="border-b border-gray-100 bg-gradient-to-r from-white to-red-50/20 px-5 py-4">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            {/* LEFT */}
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                                <FolderTree className="h-5 w-5 text-red-500" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                                <div className="mt-1 flex items-center gap-3">
                                  <p className="text-sm text-gray-500">{items.length} Ingredients </p>
                                  <div className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">AI Generated</div>
                                </div>
                              </div>
                            </div>
                            {/* ACTION */}
                            <button
                              type="button"
                              onClick={() =>
                                handleAddIngredient(category)
                              }
                              className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              <Plus className="h-4 w-4" />
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
                                  "Action",
                                ].map((head) => (
                                  <th
                                    key={head}
                                    className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400"
                                  >
                                    {head}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            {/* BODY */}
                            <tbody>
                              {items.map((item: any,index: number,) => (
                                  <tr
                                    key={index}
                                    className="border-b border-gray-100 transition-all duration-200 hover:bg-red-50/20"
                                  >
                                    {/* INGREDIENT */}
                                    <td className="px-5 py-3">
                                      <input
                                        value={item.name}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            category,
                                            index,
                                            "name",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-2.5 text-sm font-medium outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                                      />
                                    </td>
                                    {/* QTY */}
                                    <td className="px-5 py-3">
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            category,
                                            index,
                                            "quantity",
                                            e.target.value,
                                          )
                                        }
                                        className="w-24 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                                      />
                                    </td>
                                    {/* UNIT */}
                                    <td className="px-5 py-3">
                                      <select
                                        value={item.unit}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            category,
                                            index,
                                            "unit",
                                            e.target.value,
                                          )
                                        }
                                        className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
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
                                        value={item.purchasePrice}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            category,
                                            index,
                                            "purchasePrice",
                                            e.target.value,
                                          )
                                        }
                                        className="w-32 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:bg-white"
                                      />
                                    </td>
                                    {/* PRICE PER UNIT */}
                                    <td className="px-5 py-3">
                                      <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                                        ₹
                                        {item.pricePerUnit || 0}
                                      </div>
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
                                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-100"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ),
                  )}
                  {/* FLOATING SAVE */}
                  <div className="sticky bottom-5 flex justify-end">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-7 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(255,0,80,0.25)] transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Save className="h-4 w-4" />
                      Save Ingredients
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Inventory Restock */}
          {activeTab === "Inventory Restock" && (
            <div className="space-y-5">
              {/* TOP COMMAND CENTER */}
              <div className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg shadow-red-100">
                      <Warehouse className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Inventory Restock</h2>
                      <p className="mt-1 text-sm text-gray-500">Weekly purchase tracking & inventory movement intelligence</p>
                      {/* STATS */}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          {restockHistory.length} Inventory Rows
                        </div>
                        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">AI Expense Tracking</div>
                        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Monthly Inventory Intelligence</div>
                      </div>
                    </div>
                  </div>
                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* SEARCH */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        placeholder="Search ingredient..."
                        className="h-11 w-[250px] rounded-2xl border border-gray-100 bg-white pl-11 pr-4 text-sm outline-none transition-all duration-200 focus:border-red-300"
                      />
                    </div>
                    {/* DOWNLOAD */}
                    <button
                      onClick={downloadInventoryTemplate}
                      className="flex h-11 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Download className="h-4 w-4" />
                      Template
                    </button>
                    {/* UPLOAD */}
                    <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      Upload Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleUploadRestockSheet}
                        className="hidden"
                      />
                    </label>
                    {/* SAVE */}
                    <button
                      onClick={saveRestockHistory}
                      className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-black to-gray-800 px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Save className="h-4 w-4" />
                      Save Data
                    </button>
                  </div>
                </div>
              </div>
              {/* SUMMARY KPI */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: "Monthly Purchase",
                    value: `₹${inventorySummary.monthlyPurchase.toLocaleString()}`,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                    icon: ShoppingCart,
                  },
                  {
                    label: "Inventory Expense",
                    value: `₹${inventorySummary.inventoryExpense.toLocaleString()}`,
                    color: "text-red-600",
                    bg: "bg-red-50",
                    icon: TrendingDown,
                  },
                  {
                    label: "Closing Stock",
                    value: `₹${inventorySummary.closingStock.toLocaleString()}`,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    icon: Package,
                  },
                  {
                    label: "RM Expense",
                    value: `₹${inventorySummary.rmExpense.toLocaleString()}`,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    icon: BarChart3,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/40 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
                    >
                      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${item.bg}`}>
                        <Icon className={`h-5 w-5 ${item.color}`}/>
                      </div>
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className={`mt-2 text-2xl font-bold tracking-tight ${item.color}`}>{item.value}</p>
                    </div>
                  );
                })}
              </div>
              {/* TABLE */}
              <div className="overflow-hidden rounded-3xl border border-white/40 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
                {/* TABLE HEADER */}
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Uploaded Inventory Sheet</h3>
                      <p className="mt-1 text-sm text-gray-500">Weekly purchase and stock movement tracking</p>
                    </div>
                    <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Live Inventory Analytics</div>
                  </div>
                </div>
                {/* TABLE WRAPPER */}
                <div className="max-h-[75vh] overflow-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    {/* HEADER */}
                    <thead className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
                      {/* GROUP HEADER */}
                      <tr>
                        <th
                          colSpan={6}
                          className="border-b border-r border-gray-200 bg-gray-50 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500"
                        >
                          Opening Stock
                        </th>
                        {[1, 2, 3, 4, 5].map((week) => (
                          <th
                            key={week}
                            colSpan={8}
                            className="border-b border-r border-gray-200 bg-red-50/40 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-red-600"
                          >
                            Week {week}
                          </th>
                        ))}
                        <th
                          colSpan={4}
                          className="border-b bg-gray-50 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500"
                        >
                          Monthly Summary
                        </th>
                      </tr>
                      {/* COLUMN HEADER */}
                      <tr>
                        {[
                          "Category",
                          "Ingredient",
                          "Unit",
                          "Opening Qty",
                          "Opening Price",
                          "Opening Value",

                          "Purchase Qty",
                          "Price",
                          "Total",
                          "Inventory",
                          "Inventory Cost",
                          "Closing Stock",
                          "Closing Value",
                          "Expense",

                          "Purchase Qty",
                          "Price",
                          "Total",
                          "Inventory",
                          "Inventory Cost",
                          "Closing Stock",
                          "Closing Value",
                          "Expense",

                          "Purchase Qty",
                          "Price",
                          "Total",
                          "Inventory",
                          "Inventory Cost",
                          "Closing Stock",
                          "Closing Value",
                          "Expense",

                          "Purchase Qty",
                          "Price",
                          "Total",
                          "Inventory",
                          "Inventory Cost",
                          "Closing Stock",
                          "Closing Value",
                          "Expense",

                          "Purchase Qty",
                          "Price",
                          "Total",
                          "Inventory",
                          "Inventory Cost",
                          "Closing Stock",
                          "Closing Value",
                          "Expense",

                          "Total Purchase",
                          "Total Expense",
                          "Closing Value",
                          "RM Expense",
                        ].map((head, index) => (
                          <th
                            key={index}
                            className={`
                              whitespace-nowrap
                              border-b
                              border-r
                              border-gray-100
                              bg-white
                              px-3
                              py-3
                              text-left
                              text-[11px]
                              font-bold
                              uppercase
                              tracking-[0.18em]
                              text-gray-400
                              ${
                                index <= 2
                                  ? "sticky left-0 z-20 bg-white"
                                  : ""
                              }
                            `}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    {/* BODY */}
                    <tbody>
                      {restockHistory.map((row: any,index,) => (
                          <tr
                            key={index}
                            className="transition-all duration-200 hover:bg-red-50/20"
                          >
                            {/* STICKY COLUMNS */}
                            <td className="sticky left-0 z-10 border-b border-r border-gray-100 bg-white px-3 py-2 text-sm">{row.Category}</td>
                            <td className="sticky left-[120px] z-10 border-b border-r border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-900">{row.Ingredient}</td>
                            <td className="sticky left-[260px] z-10 border-b border-r border-gray-100 bg-white px-3 py-2 text-sm">{row.Unit}</td>
                            {/* OPENING */}
                            <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">{row.OpeningStockQty}</td>
                            <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">₹{row.OpeningStockPrice}</td>
                            <td className="border-b border-r-2 border-gray-200 px-3 py-2 text-sm font-semibold text-indigo-600">₹{row.OpeningStockValue}</td>
                            {/* WEEKS */}
                            {[1, 2, 3, 4, 5].map((week) => (
                              <React.Fragment key={week}>
                                <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">{row[`Week${week}PurchaseQty`]}</td>
                                <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">₹{row[`Week${week}Price`]}</td>
                                <td className="border-b border-r border-gray-100 px-3 py-2 text-sm font-medium">₹{row[`Week${week}Total`]}</td>
                                <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">{row[`Week${week}Inventory`]}</td>
                                <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">₹{row[`Week${week}InventoryCost`]}</td>
                                <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">{row[`Week${week}ClosingStock`]}</td>
                                <td className="border-b border-r border-gray-100 px-3 py-2 text-sm">₹{row[`Week${week}ClosingValue`]}</td>
                                <td className="border-b border-r-2 border-gray-200 px-3 py-2 text-sm font-semibold text-red-500">₹{row[`Week${week}Expense`]}</td>
                              </React.Fragment>
                            ))}
                            {/* MONTHLY */}
                            <td className="border-b border-r border-gray-100 px-3 py-2 text-sm font-bold text-emerald-600">₹{row.TotalPurchaseAmount}</td>
                            <td className="border-b border-r border-gray-100 px-3 py-2 text-sm font-bold text-red-500">₹{row.TotalWeeklyExpense}</td>
                            <td className="border-b border-r border-gray-100 px-3 py-2 text-sm font-bold text-indigo-600">₹{row.MonthClosingValue}</td>
                            <td className="border-b border-gray-100 px-3 py-2 text-sm font-bold text-red-600">₹{row.MonthlyRMExpense}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* PROFITABILITY */}
          {activeTab === "Insights Setup" && (
            <div className="flex h-full overflow-hidden bg-gradient-to-br from-[#fafafa] via-white to-red-50/20">
              {/* SIDEBAR */}
              <div className="hide-scrollbar h-full w-[270px] overflow-y-auto border-r border-white/40 bg-white/70 p-5 backdrop-blur-xl">
                {/* AI HEADER */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 p-5 shadow-[0_20px_50px_rgba(255,0,80,0.18)]">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-white">Financial Intelligence</h2>
                    <p className="mt-1 text-sm leading-6 text-red-100">AI forecasting & profitability engine</p>
                    <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">AI Active</div>
                  </div>
                </div>
                {/* COMPLETION */}
                <div className="mt-5 rounded-3xl border border-white/40 bg-white/80 p-4 shadow-sm">
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
                      insightsData.expectedInflation,
                      insightsData.seasonalImpact,
                      insightsData.weekendSalesIncrease,

                      insightsData.plannedExpansion,
                    ];
                    const filledFields =
                      fields.filter(
                        (field) =>
                          field !== null &&
                          field !== undefined &&
                          field !== "" &&
                          field !== 0,
                      ).length;
                    const completion =
                      Math.round(
                        (filledFields /
                          fields.length) *
                          100,
                      );
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                          <p className="text-sm font-semibold text-gray-900">Setup Readiness</p>
                            <p className="mt-1 text-xs text-gray-500">AI configuration progress</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">{completion}%</p>
                            <p className="text-[11px] text-gray-400">Completed</p>
                          </div>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                            style={{width: `${completion}%`,}}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
                {/* NAVIGATION */}
                <div className="mt-5 space-y-2">
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
                        onClick={() =>
                          setInsightsSection(
                            item.label,
                          )
                        }
                        className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                          insightsSection === item.label
                            ? "border border-red-100 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 shadow-sm"
                            : "text-gray-700 hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                            insightsSection === item.label
                              ? "bg-red-100"
                              : "bg-gray-100 group-hover:bg-red-50"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${insightsSection === item.label
                                ? "text-red-600"
                                : "text-gray-500"}`} children={""}                />
                        </div>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                  {/* TOP HEADER */}
                  <div className="sticky top-0 z-20 rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                            <Sparkles className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                              {insightsSection === "Labour"
                                ? "Labour Intelligence"
                                : insightsSection}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                              AI-powered operational intelligence & forecasting configuration
                            </p>
                          </div>
                        </div>
                      </div>
                      {insightsSection !== "Labour" && (
                        <button
                          onClick={handleSaveInsights}
                          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(255,0,80,0.18)] transition-all duration-300 hover:scale-[1.02]"
                        >
                          <Save className="h-4 w-4" />
                          Save Setup
                        </button>
                      )}
                    </div>
                  </div>
                  {insightsSection === "Fixed Expenses" && (
                    <div className="space-y-6">
                      {/* KPI */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        <div className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-sm">
                          <p className="text-sm text-gray-500">Monthly Fixed Cost</p>
                          <p className="mt-3 text-3xl font-bold tracking-tight text-red-600">
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
                          <p className="mt-3 text-xs text-gray-400">Operational commitments</p>
                        </div>
                        <div className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-sm">
                          <p className="text-sm text-gray-500">Expense Health</p>
                          <p className="mt-3 text-3xl font-bold tracking-tight text-emerald-600">Stable</p>
                          <p className="mt-3 text-xs text-gray-400">Financial commitments manageable</p>
                        </div>
                        <div className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-sm">
                          <p className="text-sm text-gray-500">AI Recommendation</p>
                          <p className="mt-3 text-lg font-semibold leading-7 text-gray-900">Fixed cost ratio is within healthy range.</p>
                        </div>
                      </div>
                      {/* FORM */}
                      <div className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900">Monthly Fixed Expenses</h3>
                          <p className="mt-1 text-sm text-gray-500">Configure recurring operational commitments</p>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                              className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition-all duration-200 hover:bg-white hover:shadow-sm"
                            >
                              <label className="mb-3 block text-sm font-semibold text-gray-700">{field.label}</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  value={
                                    insightsData[
                                      field.key
                                    ]
                                  }
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]:
                                        Number(
                                          e.target
                                            .value,
                                        ),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full rounded-2xl border border-gray-100 bg-white pl-9 pr-4 py-3 text-sm outline-none transition-all duration-200 focus:border-red-300 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)]"
                                />
                              </div>
                              <p className="mt-3 text-xs text-gray-400">Monthly operational expense</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {insightsSection === "Variable Expenses" && (
                  <div className="space-y-6">
                    {/* TOP KPI CARDS */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      {/* TOTAL VARIABLE */}
                      <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-100 blur-3xl"></div>
                        <div className="relative z-10">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                            <Activity className="h-5 w-5 text-red-500" />
                          </div>
                          <p className="mt-4 text-sm text-gray-500">Total Variable Cost</p>
                          <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
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
                          <p className="mt-3 text-xs text-gray-400">Operationally dynamic expenses</p>
                        </div>
                      </div>
                      {/* BUSINESS HEALTH */}
                      <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100 blur-3xl"></div>
                        <div className="relative z-10">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                          </div>
                          <p className="mt-4 text-sm text-gray-500">Cost Efficiency</p>
                          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">Stable</p>
                          <p className="mt-3 text-xs text-gray-400">Expense ratio within healthy range</p>
                        </div>
                      </div>
                      {/* AI INSIGHT */}
                      <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 p-5 shadow-[0_20px_50px_rgba(255,0,80,0.18)]">
                        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-3xl"></div>
                        <div className="relative z-10">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <p className="mt-4 text-sm text-red-100">AI Recommendation</p>
                          <p className="mt-2 text-lg font-semibold leading-7 text-white">
                            Delivery and packaging costs are primary operational drivers.
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* MAIN FORM */}
                    <div className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                      {/* HEADER */}
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                          <Wallet className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Operational Variable Costs</h3>
                          <p className="mt-1 text-sm text-gray-500">Costs that fluctuate with restaurant activity</p>
                        </div>
                      </div>
                      {/* INPUT GRID */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[
                          {
                            label: "Delivery Charges",
                            key: "deliveryCharges",
                            icon: Bike,
                          },
                          {
                            label: "Packaging",
                            key: "packaging",
                            icon: Package,
                          },
                          {
                            label: "Payment Gateway",
                            key: "paymentGateway",
                            icon: CreditCard,
                          },
                          {
                            label: "Aggregator Commission",
                            key: "aggregatorCommission",
                            icon: Percent,
                          },
                          {
                            label: "Electricity",
                            key: "electricity",
                            icon: Zap,
                          },
                          {
                            label: "Gas",
                            key: "gas",
                            icon: Flame,
                          },
                          {
                            label: "Maintenance",
                            key: "maintenance",
                            icon: Wrench,
                          },
                          {
                            label: "Fuel",
                            key: "fuel",
                            icon: Fuel,
                          },
                        ].map((field) => {
                          const Icon = field.icon;
                          return (
                            <div
                              key={field.key}
                              className="group rounded-3xl border border-gray-100 bg-gray-50/70 p-5 transition-all duration-200 hover:bg-white hover:shadow-sm"
                            >
                              {/* TOP */}
                              <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 transition-all duration-200 group-hover:bg-red-100">
                                  <Icon className="h-4 w-4 text-red-500" />
                                </div>
                                <div>
                                  <label className="text-sm font-semibold text-gray-800">
                                    {field.label}
                                  </label>
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    Monthly operational expense
                                  </p>
                                </div>
                              </div>
                              {/* INPUT */}
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  value={
                                    insightsData[
                                      field.key
                                    ]
                                  }
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]:
                                        Number(
                                          e.target
                                            .value,
                                        ),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 pl-9 text-sm font-medium outline-none transition-all duration-200 focus:border-red-300 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)]"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* AI INSIGHT PANEL */}
                    <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-pink-50 p-6">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-100 blur-3xl"></div>
                      <div className="relative z-10 flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            AI Variable Cost Insight
                          </h4>
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">

                            Variable operational expenses directly impact profitability and EBITDA.
                            Monitoring delivery, packaging, electricity and aggregator commissions
                            can significantly improve restaurant operational efficiency.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  {/* LABOUR */}
                  {insightsSection === "Labour" && (
                    <div className="space-y-6">
                      {/* TOP KPI CARDS */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {/* TOTAL STAFF */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Total Staff
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                              {staffData?.length || 0}
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Workforce strength
                            </p>
                          </div>
                        </div>
                        {/* MONTHLY LABOUR COST */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                              <Wallet className="h-5 w-5 text-red-500" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Monthly Labour Cost
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                              ₹
                              {(staffData?.reduce(
                                (sum: number, s: any) =>
                                  sum + (s.salary || 0),
                                0,
                              ) || 0).toLocaleString()}
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Total salary commitment
                            </p>
                          </div>
                        </div>
                        {/* AVG SALARY */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50">
                              <BadgeIndianRupee className="h-5 w-5 text-violet-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Avg Salary
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-violet-600">
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
                            <p className="mt-3 text-xs text-gray-400">
                              Average salary per employee
                            </p>
                          </div>
                        </div>
                        {/* FULL TIME */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                              <UserCheck className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Full Time Staff
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                              {staffData?.filter(
                                (s: any) =>
                                  s.employmentType ===
                                  "FULL_TIME",
                              ).length || 0}
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Permanent employees
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* DEPARTMENT BREAKDOWN */}
                      <div className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        {/* HEADER */}
                        <div className="mb-6 flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Department Breakdown
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Salary distribution by department
                            </p>
                          </div>
                        </div>
                        {/* DEPARTMENT GRID */}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
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
                                (s: any) =>
                                  s.department === dept,
                              ) || [];
                            const deptSalary =
                              deptStaff.reduce(
                                (
                                  sum: number,
                                  s: any,
                                ) =>
                                  sum +
                                  (s.salary || 0),
                                0,
                              );
                            return (
                              <div
                                key={dept}
                                className="group rounded-3xl border border-gray-100 bg-gray-50/70 p-5 transition-all duration-200 hover:bg-white hover:shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                      {dept}
                                    </p>
                                    <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                                      ₹
                                      {deptSalary.toLocaleString()}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">
                                      {deptStaff.length}
                                      {" "}
                                      staff members
                                    </p>
                                  </div>
                                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                                    <Users className="h-5 w-5 text-red-500" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* STAFF TABLE */}
                      <div className="rounded-3xl border border-white/40 bg-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl overflow-hidden">
                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                              <ClipboardList className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Staff Overview
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Restaurant workforce summary
                              </p>
                            </div>
                          </div>
                          <div className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                            {staffData?.length || 0}
                            {" "}
                            Employees
                          </div>
                        </div>
                        {/*TABLE */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-50/80">
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
                                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                                  >
                                    {head}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {staffData?.map(
                                (
                                  staff: any,
                                  index: number,
                                ) => (
                                  <tr
                                    key={index}
                                    className="border-t border-gray-100 transition hover:bg-red-50/30"
                                  >
                                    {/* NAME */}
                                    <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 font-semibold text-gray-700">
                                        {staff.name?.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-900">
                                            {staff.name}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            Staff member
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    {/* ROLE */}
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      {staff.role}
                                    </td>
                                    {/* DEPARTMENT */}
                                    <td className="px-6 py-5">
                                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                        {staff.department}
                                      </span>
                                    </td>
                                    {/* SALARY */}
                                    <td className="px-6 py-5 text-sm font-semibold text-gray-900">
                                      ₹
                                      {staff.salary?.toLocaleString()}
                                    </td>
                                    {/* EMPLOYMENT */}
                                    <td className="px-6 py-5">
                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                          staff.employmentType ===
                                          "FULL_TIME"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-amber-50 text-amber-600"
                                        }`}
                                      >
                                        {staff.employmentType}
                                      </span>
                                    </td>
                                    {/* SHIFT */}
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      {staff.shift}
                                    </td>
                                    {/* HOURS */}
                                    <td className="px-6 py-5 text-sm text-gray-600">
                                      {staff.monthlyWorkingHours}
                                      h
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {/* AI INSIGHT */}
                      <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-pink-50 p-6">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-100 blur-3xl"></div>
                        <div className="relative z-10 flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              AI Labour Insight
                            </h4>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                              Labour cost is one of the biggest operational expenses in restaurants.
                              Monitoring department-wise salary distribution and staffing efficiency
                              helps improve profitability and operational stability.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* FINANCIAL TARGETS */}
                  {insightsSection === "Financial Targets" && (
                    <div className="space-y-6">
                      {/* TOP KPI CARDS */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {/* EBITDA */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                              <TrendingUp className="h-5 w-5 text-red-500" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              EBITDA Goal
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">
                              {insightsData.targetEbitda}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Healthy profitability target
                            </p>
                          </div>
                        </div>
                        {/* FOOD COST */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
                              <UtensilsCrossed className="h-5 w-5 text-orange-500" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Food Cost Goal
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-orange-600">
                              {insightsData.targetFoodCost}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Ingredient efficiency target
                            </p>
                          </div>
                        </div>
                        {/* GROSS MARGIN */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50">
                              <BarChart3 className="h-5 w-5 text-violet-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Gross Margin Goal
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-violet-600">
                              {insightsData.targetGrossMargin}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Operational margin target
                            </p>
                          </div>
                        </div>
                        {/* PRIME COST */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                              <Target className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Prime Cost Goal
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                              {insightsData.targetPrimeCost}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Food + labour efficiency
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* MAIN TARGET FORM */}
                      <div className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        {/* HEADER */}
                        <div className="mb-6 flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                            <Goal className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Financial Targets Setup
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Configure profitability and growth goals
                            </p>
                          </div>
                        </div>
                        {/* INPUT GRID */}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "Target EBITDA %",
                              key: "targetEbitda",
                              placeholder: "15",
                              icon: TrendingUp,
                              color: "red",
                            },
                            {
                              label: "Target Food Cost %",
                              key: "targetFoodCost",
                              placeholder: "30",
                              icon: UtensilsCrossed,
                              color: "orange",
                            },
                            {
                              label: "Target Gross Margin %",
                              key: "targetGrossMargin",
                              placeholder: "60",
                              icon: BarChart3,
                              color: "violet",
                            },
                            {
                              label: "Ideal Prime Cost %",
                              key: "targetPrimeCost",
                              placeholder: "55",
                              icon: Target,
                              color: "emerald",
                            },
                            {
                              label: "Monthly Revenue Goal",
                              key: "monthlyRevenueGoal",
                              placeholder: "500000",
                              icon: Wallet,
                              color: "blue",
                            },
                            {
                              label: "Monthly Profit Goal",
                              key: "monthlyProfitGoal",
                              placeholder: "100000",
                              icon: IndianRupee,
                              color: "pink",
                            },
                          ].map((field) => {
                            const Icon = field.icon;
                            return (
                              <div
                                key={field.key}
                                className="group rounded-3xl border border-gray-100 bg-gray-50/70 p-5 transition-all duration-200 hover:bg-white hover:shadow-sm"
                              >
                                {/* TOP */}
                                <div className="mb-4 flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                      field.color === "red"
                                        ? "bg-red-50"
                                        : field.color === "orange"
                                        ? "bg-orange-50"
                                        : field.color === "violet"
                                        ? "bg-violet-50"
                                        : field.color === "emerald"
                                        ? "bg-emerald-50"
                                        : field.color === "blue"
                                        ? "bg-blue-50"
                                        : "bg-pink-50"
                                    }`}
                                  >
                                    <Icon
                                      className={`h-4 w-4 ${
                                        field.color === "red"
                                          ? "text-red-500"
                                          : field.color === "orange"
                                          ? "text-orange-500"
                                          : field.color === "violet"
                                          ? "text-violet-600"
                                          : field.color === "emerald"
                                          ? "text-emerald-600"
                                          : field.color === "blue"
                                          ? "text-blue-600"
                                          : "text-pink-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-800">
                                      {field.label}
                                    </label>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      Business target configuration
                                    </p>
                                  </div>
                                </div>
                                {/* INPUT */}
                                <div className="relative">
                                  {(field.key === "monthlyRevenueGoal" ||
                                    field.key === "monthlyProfitGoal") && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                                      ₹
                                    </span>
                                  )}
                                  <input
                                    type="number"
                                    value={
                                      insightsData[
                                        field.key
                                      ]
                                    }
                                    onChange={(e) =>
                                      setInsightsData({
                                        ...insightsData,
                                        [field.key]:
                                          Number(
                                            e.target
                                              .value,
                                          ),
                                      })
                                    }
                                    placeholder={field.placeholder}
                                    className={`w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium outline-none transition-all duration-200 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)] ${
                                      field.key ===
                                        "monthlyRevenueGoal" ||
                                      field.key ===
                                        "monthlyProfitGoal"
                                        ? "pl-9"
                                        : ""
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* AI INSIGHT PANEL */}
                      <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 via-white to-pink-50 p-6">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-100 blur-3xl"></div>
                        <div className="relative z-10 flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              AI Financial Insight
                            </h4>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                              Financial targets help DineInk generate profitability forecasting,
                              EBITDA projections, operational health scoring and long-term
                              restaurant growth analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* TAX & FINANCE */}
                  {insightsSection === "Tax & Finance" && (
                    <div className="space-y-6">
                      {/* TOP SUMMARY */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {/* GST */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                              <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              GST Configuration
                            </p>
                            <p className="mt-2 text-3xl font-bold text-blue-600">
                              {insightsData.gstPercentage}%
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              Restaurant taxation setup
                            </p>
                          </div>
                        </div>
                        {/* FINANCIAL BURDEN */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
                              <Landmark className="h-5 w-5 text-red-500" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Monthly Financial Burden
                            </p>
                            <p className="mt-2 text-3xl font-bold text-red-600">
                              ₹
                              {(
                                insightsData.monthlyLoanEmi +
                                insightsData.monthlyInterestPayments
                              ).toLocaleString()}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              EMI + interest obligations
                            </p>
                          </div>
                        </div>
                        {/* IMPACT */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                              <ShieldCheck className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Net Profit Impact
                            </p>
                            <p className="mt-2 text-3xl font-bold text-emerald-600">
                              {(insightsData.monthlyLoanEmi +
                                insightsData.monthlyInterestPayments) > 100000
                                ? "High"
                                : (insightsData.monthlyLoanEmi +
                                  insightsData.monthlyInterestPayments) > 50000
                                ? "Moderate"
                                : "Low"}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              Financial commitment health
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* MAIN FORM */}
                      <div className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        {/* HEADER */}
                        <div className="mb-6 flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
                            <BadgeDollarSign className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Tax & Finance Configuration
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Configure financial obligations & taxation
                            </p>
                          </div>
                        </div>
                        {/* INPUTS */}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              label: "GST Percentage",
                              key: "gstPercentage",
                              placeholder: "5",
                              icon: Receipt,
                              color: "blue",
                              prefix: "%",
                            },
                            {
                              label: "Monthly Loan EMI",
                              key: "monthlyLoanEmi",
                              placeholder: "50000",
                              icon: Landmark,
                              color: "red",
                            },
                            {
                              label: "Monthly Interest Payments",
                              key: "monthlyInterestPayments",
                              placeholder: "10000",
                              icon: Wallet,
                              color: "orange",
                            },
                            {
                              label: "Accounting / CA Fees",
                              key: "caFees",
                              placeholder: "5000",
                              icon: Calculator,
                              color: "violet",
                            },
                            {
                              label: "Insurance Cost",
                              key: "insuranceCost",
                              placeholder: "3000",
                              icon: ShieldCheck,
                              color: "emerald",
                            },
                            {
                              label: "Other Taxes / Charges",
                              key: "otherTaxes",
                              placeholder: "2000",
                              icon: FileText,
                              color: "pink",
                            },
                          ].map((field) => {
                            const Icon = field.icon;
                            return (
                              <div
                                key={field.key}
                                className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5 transition-all duration-200 hover:bg-white hover:shadow-sm"
                              >
                                {/* TOP */}
                                <div className="mb-4 flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                      field.color === "blue"
                                        ? "bg-blue-50"
                                        : field.color === "red"
                                        ? "bg-red-50"
                                        : field.color === "orange"
                                        ? "bg-orange-50"
                                        : field.color === "violet"
                                        ? "bg-violet-50"
                                        : field.color === "emerald"
                                        ? "bg-emerald-50"
                                        : "bg-pink-50"
                                    }`}
                                  >
                                    <Icon
                                      className={`h-4 w-4 ${
                                        field.color === "blue"
                                          ? "text-blue-600"
                                          : field.color === "red"
                                          ? "text-red-500"
                                          : field.color === "orange"
                                          ? "text-orange-500"
                                          : field.color === "violet"
                                          ? "text-violet-600"
                                          : field.color === "emerald"
                                          ? "text-emerald-600"
                                          : "text-pink-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-800">
                                      {field.label}
                                    </label>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      Financial configuration
                                    </p>
                                  </div>
                                </div>
                                {/* INPUT */}
                                <div className="relative">
                                  {!field.prefix && (
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                                      ₹
                                    </span>
                                  )}
                                  <input
                                    type="number"
                                    value={
                                      insightsData[
                                        field.key
                                      ]
                                    }
                                    onChange={(e) =>
                                      setInsightsData({
                                        ...insightsData,
                                        [field.key]:
                                          Number(
                                            e.target
                                              .value,
                                          ),
                                      })
                                    }
                                    placeholder={field.placeholder}
                                    className={`w-full rounded-2xl border border-gray-100 bg-white py-3 text-sm font-medium outline-none transition-all duration-200 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)] ${
                                      field.prefix
                                        ? "px-4"
                                        : "pl-9 pr-4"
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* AI INFO PANEL */}
                      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100 blur-3xl"></div>
                        <div className="relative z-10 flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              AI Finance Intelligence
                            </h4>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                              DineInk uses taxation and finance data to calculate
                              break-even analysis, EBITDA accuracy, net profitability
                              forecasting and long-term financial sustainability.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* BUSINESS ASSUMPTIONS */}
                  {insightsSection === "Business Assumptions" && (
                    <div className="space-y-6">
                      {/* TOP KPI CARDS */}
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {/* GROWTH */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                              <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Projected Growth
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                              +{insightsData.expectedMonthlyGrowth}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Expected business expansion
                            </p>
                          </div>
                        </div>
                        {/* DELIVERY */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
                              <Bike className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Delivery Expansion
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-blue-600">
                              +{insightsData.expectedDeliveryGrowth}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Online order projection
                            </p>
                          </div>
                        </div>
                        {/* INFLATION */}
                        {/* <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
                              <ChartNoAxesCombined className="h-5 w-5 text-orange-500" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Inflation Impact
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-orange-500">
                              {insightsData.expectedInflation}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Estimated operational inflation
                            </p>
                          </div>
                        </div> */}
                        {/* WEEKEND */}
                        <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-100 blur-3xl"></div>
                          <div className="relative z-10">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50">
                              <Rocket className="h-5 w-5 text-violet-600" />
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Weekend Boost
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-violet-600">
                              +{insightsData.weekendSalesIncrease}%
                            </p>
                            <p className="mt-3 text-xs text-gray-400">
                              Weekend sales uplift
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* MAIN FORECAST ENGINE */}
                      <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
                        {/* GLOW */}
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-red-100 blur-3xl"></div>
                        {/* HEADER */}
                        <div className="relative z-10 mb-8 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 shadow-lg">
                              <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">
                                Business Forecast Engine
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                AI-powered future growth & profitability assumptions
                              </p>
                            </div>
                          </div>
                          {/* LIVE CHIP */}
                          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-600">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                            AI Forecast Active
                          </div>
                        </div>
                        {/* INPUT GRID */}
                        <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                            // {
                            //   label: "Expected Inflation %",
                            //   key: "expectedInflation",
                            //   placeholder: "6",
                            //   icon: ChartNoAxesCombined,
                            //   color: "orange",
                            // },
                            {
                              label: "Seasonal Impact %",
                              key: "seasonalImpact",
                              placeholder: "20",
                              icon: CalendarRange,
                              color: "pink",
                            },
                            {
                              label: "Avg Weekend Sales Increase %",
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
                                className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5 transition-all duration-200 hover:bg-white hover:shadow-sm"
                              >
                                {/* TOP */}
                                <div className="mb-4 flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                                      field.color === "emerald"
                                        ? "bg-emerald-50"
                                        : field.color === "blue"
                                        ? "bg-blue-50"
                                        : field.color === "orange"
                                        ? "bg-orange-50"
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
                                          : field.color === "orange"
                                          ? "text-orange-500"
                                          : field.color === "pink"
                                          ? "text-pink-500"
                                          : "text-violet-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-semibold text-gray-800">
                                      {field.label}
                                    </label>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                      Forecast configuration
                                    </p>
                                  </div>
                                </div>
                                {/* INPUT */}
                                <input
                                  type="number"
                                  value={
                                    insightsData[
                                      field.key
                                    ]
                                  }
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]:
                                        Number(
                                          e.target
                                            .value,
                                        ),
                                    })
                                  }
                                  placeholder={field.placeholder}
                                  className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium outline-none transition-all duration-200 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)]"
                                />
                                {/* RANGE */}
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={
                                    insightsData[
                                      field.key
                                    ]
                                  }
                                  onChange={(e) =>
                                    setInsightsData({
                                      ...insightsData,
                                      [field.key]:
                                        Number(
                                          e.target
                                            .value,
                                        ),
                                    })
                                  }
                                  className="mt-4 w-full accent-red-500"
                                />
                              </div>
                            );
                          })}
                          {/* EXPANSION */}
                          <div className="rounded-3xl border border-gray-100 bg-gray-50/70 p-5 transition-all duration-200 hover:bg-white hover:shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
                                <Building2 className="h-4 w-4 text-red-500" />
                              </div>
                              <div>
                                <label className="text-sm font-semibold text-gray-800">
                                  Planned Expansion
                                </label>
                                <p className="mt-0.5 text-xs text-gray-400">
                                  Future business scaling strategy
                                </p>
                              </div>
                            </div>
                            <select
                              value={insightsData.plannedExpansion}
                              onChange={(e) =>
                                setInsightsData({
                                  ...insightsData,
                                  plannedExpansion:
                                    e.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium outline-none transition-all duration-200 focus:shadow-[0_0_0_4px_rgba(255,0,80,0.05)]"
                            >
                              <option value="">
                                Select Expansion
                              </option>
                              <option value="NONE">
                                No Expansion
                              </option>
                              <option value="NEW_BRANCH">
                                New Branch
                              </option>
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
                      {/* AI FORECAST PANEL */}
                      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-6">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100 blur-3xl"></div>
                        <div className="relative z-10 flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              AI Forecast Analysis
                            </h4>
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                              Based on current assumptions, DineInk predicts strong operational
                              scalability with improving delivery performance, optimized
                              weekend revenue growth and controlled inflation impact.
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