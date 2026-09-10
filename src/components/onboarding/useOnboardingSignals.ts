import { skipToken } from "@reduxjs/toolkit/query";
import { useGetMyRestaurantQuery, useGetStaffQuery } from "@/store/api/dashboardApi";
import { useGetBranchDetailsQuery } from "@/store/api/settingsApi";
import { useGetMappedMenuQuery, useGetMenuManagementQuery } from "@/store/api/inventoryApi";
import { useGetVendorsQuery } from "@/store/api/ingredientsApi";
import { useGetInsightsSetupQuery } from "@/store/api/insightsApi";
import { useGetMonthlyDuesQuery } from "@/store/api/duesApi";
import { useGetEquipmentQuery } from "@/store/api/operationsApi";
import { useGetComplianceRecordsQuery } from "@/store/api/complianceApi";
import { useGetBankAccountsQuery, useGetUpiConfigQuery } from "@/store/api/bankingApi";
import { useGetBudgetsQuery } from "@/store/api/budgetsApi";
import {
  EMPTY_SIGNALS,
  countInsightsFields,
  isBillingConfigured,
  type QuestSignals,
} from "./quests";

/**
 * Gathers every signal the quest checks read, from the same RTK Query
 * endpoints the pages themselves use.
 *
 * Sharing endpoints matters twice over. It means the guide's idea of "done"
 * is exactly what the page shows — the same cache entry, not a parallel
 * request that could disagree. And it means a save on any page invalidates
 * the tag the guide is watching, so a quest ticks itself the moment the data
 * lands, with no wiring in the page.
 *
 * The cost is a burst of requests on the first dashboard load after setup.
 * Most are ones the owner's next page visit would have made anyway, and every
 * one is skipped once the guide is hidden or complete (`enabled` false), so an
 * established account pays nothing.
 *
 * Role-gated endpoints (dues, equipment, compliance, banking) are skipped for
 * anyone outside OWNER/MANAGER: the backend would answer 403, and the quests
 * that read them are not shown to those roles either.
 */
export interface SignalScope {
  restaurantId: number | null | undefined;
  branchId: number | null | undefined;
  role: string | null | undefined;
  /** False stops every request; the hook returns EMPTY_SIGNALS. */
  enabled: boolean;
}

const MANAGEMENT = new Set(["OWNER", "MANAGER"]);

/** A count from a list-shaped payload; null while loading, 0 on error. */
const countOf = (data: unknown, isError: boolean, loading: boolean): number | null => {
  if (loading && !isError) return null;
  return Array.isArray(data) ? data.length : 0;
};

export function useOnboardingSignals({
  restaurantId,
  branchId,
  role,
  enabled,
}: SignalScope): QuestSignals {
  const haveScope = enabled && !!restaurantId && !!branchId;
  const scope = haveScope
    ? { restaurantId: restaurantId as number, branchId: branchId as number }
    : null;
  const isManagement = !!role && MANAGEMENT.has(role);
  const managementScope = isManagement ? scope : null;

  const now = new Date();
  const duesScope = managementScope
    ? { ...managementScope, month: now.getMonth() + 1, year: now.getFullYear() }
    : null;

  // The restaurant itself is fetched by the Dashboard regardless, so this is
  // free even before the rest is enabled — and it is the one signal that must
  // resolve before setup can be declared done.
  const restaurantQ = useGetMyRestaurantQuery(enabled ? undefined : skipToken);
  const branchQ = useGetBranchDetailsQuery(scope ? scope.branchId : skipToken);
  const staffQ = useGetStaffQuery(scope ?? skipToken);
  const menuMgmtQ = useGetMenuManagementQuery(scope ?? skipToken);
  const mappedQ = useGetMappedMenuQuery(scope ? scope.restaurantId : skipToken);
  const vendorsQ = useGetVendorsQuery(scope ?? skipToken);
  const insightsQ = useGetInsightsSetupQuery(scope ?? skipToken);
  const budgetsQ = useGetBudgetsQuery(scope ?? skipToken);
  const duesQ = useGetMonthlyDuesQuery(duesScope ?? skipToken);
  const equipmentQ = useGetEquipmentQuery(managementScope ?? skipToken);
  const complianceQ = useGetComplianceRecordsQuery(managementScope ?? skipToken);
  const bankQ = useGetBankAccountsQuery(managementScope ? managementScope.restaurantId : skipToken);
  const upiQ = useGetUpiConfigQuery(managementScope ?? skipToken);

  if (!enabled) return EMPTY_SIGNALS;

  // "Loading" here is the RTK Query sense: no data yet and no error yet. A
  // skipped query is uninitialized — for a role that cannot see the quest that
  // is fine, the quest is filtered out before its signal is read.
  const pending = (q: { data?: unknown; isError: boolean; isUninitialized: boolean }) =>
    q.data === undefined && !q.isError && !q.isUninitialized;

  const restaurant = restaurantQ.data?.restaurant;
  const branchCount = pending(restaurantQ)
    ? null
    : Array.isArray(restaurant?.branches)
      ? restaurant.branches.length
      : 0;
  // Dishes come from the menu-management payload, not the restaurant one:
  // saving a dish invalidates "MenuItem", which only the former carries, so
  // this is the count that moves the moment Add Item is saved. The
  // restaurant's own list is the fallback for a payload without one.
  const menuItemCount = pending(menuMgmtQ) || pending(restaurantQ)
    ? null
    : Array.isArray(menuMgmtQ.data?.menuItems)
      ? menuMgmtQ.data.menuItems.length
      : Array.isArray(restaurant?.menuItems)
        ? restaurant.menuItems.length
        : 0;

  const branch = branchQ.data;
  const tableCount = pending(branchQ)
    ? null
    : Array.isArray(branch?.tables)
      ? branch.tables.length
      : 0;
  const billingConfigured = pending(branchQ) ? null : isBillingConfigured(branch?.billing);

  // The staff endpoint returns the owner too; they are not "the team".
  const staffCount = pending(staffQ)
    ? null
    : Array.isArray(staffQ.data)
      ? staffQ.data.filter((s: any) => s?.role !== "OWNER").length
      : 0;

  const ingredientCount = pending(menuMgmtQ)
    ? null
    : Array.isArray(menuMgmtQ.data?.ingredients)
      ? menuMgmtQ.data.ingredients.length
      : 0;

  const mappedItemCount = countOf(mappedQ.data, mappedQ.isError, pending(mappedQ));
  const vendorCount = countOf(vendorsQ.data, vendorsQ.isError, pending(vendorsQ));
  const insightsFilledFields = pending(insightsQ) ? null : countInsightsFields(insightsQ.data);
  const budgetCount = countOf(budgetsQ.data, budgetsQ.isError, pending(budgetsQ));

  const duesCount = countOf(duesQ.data, duesQ.isError, pending(duesQ));
  const equipmentCount = countOf(equipmentQ.data, equipmentQ.isError, pending(equipmentQ));
  const complianceCount = countOf(complianceQ.data, complianceQ.isError, pending(complianceQ));
  const bankAccountCount = countOf(bankQ.data, bankQ.isError, pending(bankQ));
  const upiConfigured = pending(upiQ)
    ? null
    : typeof upiQ.data?.upiId === "string" && upiQ.data.upiId.trim() !== "";

  return {
    branchCount,
    menuItemCount,
    tableCount,
    billingConfigured,
    staffCount,
    ingredientCount,
    mappedItemCount,
    insightsFilledFields,
    duesCount,
    vendorCount,
    equipmentCount,
    complianceCount,
    bankAccountCount,
    upiConfigured,
    budgetCount,
  };
}
