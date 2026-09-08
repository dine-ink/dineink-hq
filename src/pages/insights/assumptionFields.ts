// Field groups for the Financial Assumptions tab — mirrors
// financeAssumptions.types.ts's ASSUMPTION_FIELDS on the backend, grouped
// for display. Percentage fields render with a "%" suffix, everything else
// with its own unit.

/**
 * Moved out of Insights.tsx when the Financial Assumptions tab became its own
 * file: the tab and the hook that loads it both need this list, and neither
 * can import it from the page that imports them.
 *
 * Moved verbatim -- 7 groups, 22 fields. Retyping a table this size is how
 * entries go missing without anything failing.
 */

export const ASSUMPTION_FIELD_GROUPS: {
  title: string;
  fields: { key: string; label: string; unit: string }[];
}[] = [
  {
    title: "Property & Occupancy",
    fields: [
      { key: "rentPerSqFt", label: "Rent per Sq Ft", unit: "₹" },
      { key: "camPerSqFt", label: "CAM per Sq Ft", unit: "₹" },
      { key: "chargeableAreaSqFt", label: "Chargeable Area", unit: "sq ft" },
    ],
  },
  {
    title: "Targets",
    fields: [
      { key: "foodCostTargetPercentage", label: "Food Cost Target", unit: "%" },
      { key: "labourTargetPercentage", label: "Labour Target", unit: "%" },
      {
        key: "primeCostTargetPercentage",
        label: "Prime Cost Target",
        unit: "%",
      },
      { key: "ebitdaTargetPercentage", label: "EBITDA Target", unit: "%" },
      {
        key: "occupancyTargetPercentage",
        label: "Occupancy Target",
        unit: "%",
      },
      { key: "utilityTargetPercentage", label: "Utility Target", unit: "%" },
    ],
  },
  {
    title: "Channel Mix & Commission",
    fields: [
      { key: "deliveryPercentage", label: "Delivery Mix", unit: "%" },
      {
        key: "swiggyCommissionPercentage",
        label: "Swiggy Commission",
        unit: "%",
      },
      {
        key: "zomatoCommissionPercentage",
        label: "Zomato Commission",
        unit: "%",
      },
    ],
  },
  {
    title: "Franchise & Royalty",
    fields: [
      { key: "franchiseFeePercentage", label: "Franchise Fee", unit: "%" },
      { key: "royaltyPercentage", label: "Royalty", unit: "%" },
      { key: "marketingFeePercentage", label: "Marketing Fee", unit: "%" },
    ],
  },
  {
    title: "Escalation",
    fields: [
      {
        key: "salaryIncrementPercentage",
        label: "Salary Increment",
        unit: "%",
      },
      { key: "rentEscalationPercentage", label: "Rent Escalation", unit: "%" },
      { key: "inflationPercentage", label: "Inflation", unit: "%" },
    ],
  },
  {
    title: "Tax & Operating Calendar",
    fields: [
      { key: "gstPercentage", label: "GST", unit: "%" },
      { key: "workingDays", label: "Working Days / Month", unit: "days" },
      { key: "businessHours", label: "Business Hours / Day", unit: "hrs" },
    ],
  },
];
