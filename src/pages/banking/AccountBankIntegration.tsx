import { useState } from "react";
import { BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { useTabFromQuery } from "@/hooks/useTabFromQuery";
import { PageContainer, PageHeader } from "@/design";
import BankAccountsTab from "./BankAccountsTab";
import UpiTab from "./UpiTab";
import TransactionsTab from "./TransactionsTab";
import PaymentAnalyticsTab from "./PaymentAnalyticsTab";
import TabStrip from "@/components/common/TabStrip";

const TABS = ["Bank Accounts", "UPI", "Transactions", "Payment Analytics"] as const;
type Tab = (typeof TABS)[number];

// Account & Bank Integration — a records/reference hub for the restaurant's
// bank accounts and UPI collection details, manual bank-transaction entries,
// and a best-effort reconciliation helper against existing bills/vendor
// payments. None of this is a live bank-feed or payment-gateway connection;
// see the captions on each tab for exactly what is and isn't automated.
export default function AccountBankIntegration() {
  const [activeTab, setActiveTab] = useState<Tab>("Bank Accounts");
  // The Getting Started guide links straight to the UPI tab.
  useTabFromQuery(TABS, setActiveTab);

  return (
    <PageContainer>
      <PageHeader
        icon={<BuildingLibraryIcon className="h-5 w-5 text-white" />}
        title="Account & Bank Integration"
        subtitle="Bank account records, UPI collection setup, manual transaction log, and reconciliation"
        actions={
          <TabStrip tabs={TABS} value={activeTab} onChange={setActiveTab} />
        }
      />

      <div className="min-h-0 flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        {activeTab === "Bank Accounts" && <BankAccountsTab />}
        {activeTab === "UPI" && <UpiTab />}
        {activeTab === "Transactions" && <TransactionsTab />}
        {activeTab === "Payment Analytics" && <PaymentAnalyticsTab />}
      </div>
    </PageContainer>
  );
}
