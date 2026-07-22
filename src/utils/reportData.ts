export interface FullReportData {
  analytics: any;
  bills: any[];
  expenses: any[];
  customers: any[];
  menuItems: any[];
  ingredients: any[];
  kitchenData: any;
  attendance: any[];
  allStaff: any[];
  cashSessions: any[];
  branchComparison: any[];
  cityComparison: any[];
  heatmap: any;
  forecast: any;
  rfm: any;
  insightsData: any;
  inventoryAdjustments: any[];
  staffProductivity: any;
  tableOps: any;
  menuEngineering: any;
  vendorOutstanding: any[];
  restockHistory: any[];
  vendorPerformance: any[];
}

const safeJson = async (res: Response) => {
  try { return await res.json(); } catch { return {}; }
};

export async function fetchAllReportData(params: {
  restaurantId: number;
  branchId: number;
  from: string;
  to: string;
  token: string;
  apiUrl: string;
}): Promise<FullReportData> {
  const { restaurantId, branchId, from, to, token, apiUrl } = params;
  const h = { Authorization: `Bearer ${token}` };
  const bp = `branchId=${branchId}`;
  const dr = `from=${from}&to=${to}`;

  const responses = await Promise.all([
    fetch(`${apiUrl}/api/analytics/${restaurantId}/restaurantDashboardOverview?${bp}&range=custom&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/bills/${restaurantId}/restaurantwise?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/reports/expenses?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/customers/${restaurantId}/customerByBranch?${bp}`, { headers: h }),
    fetch(`${apiUrl}/api/inventory/${restaurantId}/menu-management?${bp}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/kitchen?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/attendance/branch/${branchId}?${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/restaurant/staff/${restaurantId}/${branchId}`, { headers: h }),
    fetch(`${apiUrl}/api/cash/sessions?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/branch-comparison?${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/city-comparison?${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/hourly-heatmap?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/revenue-forecast?${bp}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/customer-rfm?${bp}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/insights/${restaurantId}/${branchId}`, { headers: h }),
    fetch(`${apiUrl}/api/inventory/adjustments?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/staff-productivity?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/${branchId}/table-operations?${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/analytics/${restaurantId}/menu-engineering?${bp}&${dr}`, { headers: h }),
    fetch(`${apiUrl}/api/vendors/outstanding/${restaurantId}/${branchId}`, { headers: h }),
    fetch(`${apiUrl}/api/inventory/${restaurantId}/get-restock-history?${bp}`, { headers: h }),
    fetch(`${apiUrl}/api/vendors/performance/${restaurantId}/${branchId}?${dr}`, { headers: h }),
  ]);

  const results = await Promise.all(responses.map(safeJson));

  const [
    analyticsJson, billsJson, expensesJson, customersJson, menuJson,
    kitchenJson, attendanceJson, staffJson, cashJson,
    branchCmpJson, cityCmpJson, heatmapJson, forecastJson, rfmJson, insightsJson,
    adjustmentsJson, productivityJson,
    tableOpsJson, menuEngineeringJson, vendorOutstandingJson, restockHistoryJson,
    vendorPerformanceJson,
  ] = results;

  return {
    analytics:            analyticsJson.success      ? analyticsJson.data       : {},
    bills:                billsJson.success           ? billsJson.bills       || [] : [],
    expenses:             expensesJson.success        ? expensesJson.data     || [] : [],
    customers:            customersJson.success       ? customersJson.customers || [] : [],
    menuItems:            menuJson.success            ? menuJson.data?.menuItems || [] : [],
    ingredients:          menuJson.success            ? menuJson.data?.ingredients || [] : [],
    kitchenData:          kitchenJson.success         ? kitchenJson.data         : {},
    attendance:           attendanceJson.success      ? attendanceJson.data  || [] : [],
    allStaff:             staffJson.success           ? staffJson.data       || [] : [],
    cashSessions:         cashJson.success            ? cashJson.data        || [] : [],
    branchComparison:     branchCmpJson.success       ? branchCmpJson.data   || [] : [],
    cityComparison:       cityCmpJson.success         ? cityCmpJson.data     || [] : [],
    heatmap:              heatmapJson.success         ? heatmapJson.data         : {},
    forecast:             forecastJson.success        ? forecastJson.data        : {},
    rfm:                  rfmJson.success             ? rfmJson.data             : {},
    insightsData:         insightsJson.success        ? insightsJson.data        : {},
    inventoryAdjustments: adjustmentsJson.success     ? adjustmentsJson.data || [] : [],
    staffProductivity:    productivityJson.success    ? productivityJson.data    : {},
    tableOps:             tableOpsJson.success        ? tableOpsJson.data        : {},
    menuEngineering:      menuEngineeringJson.success ? menuEngineeringJson.data : {},
    vendorOutstanding:    vendorOutstandingJson.success ? vendorOutstandingJson.data || [] : [],
    restockHistory:       restockHistoryJson.success  ? restockHistoryJson.data || [] : [],
    vendorPerformance:    vendorPerformanceJson.success ? vendorPerformanceJson.data || [] : [],
  };
}
