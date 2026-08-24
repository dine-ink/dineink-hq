import { useState } from "react";
import { BanknotesIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import MonthlyExpensesTab from "./MonthlyExpensesTab";
import PaymentDayTrackerTab from "./PaymentDayTrackerTab";
import MonthComparisonTab from "./MonthComparisonTab";
import EbitdaTab from "./EbitdaTab";
import { monthYearLabel } from "./duesShared";
import TabStrip from "../../components/common/TabStrip";

const TABS = ["Monthly Expenses", "Payment Day Tracker", "Month Comparison", "EBITDA"];

export default function DuesTracker() {
  const [activeTab, setActiveTab] = useState("Monthly Expenses");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <main className="flex flex-col overflow-hidden bg-[#f5f6fa]">
      <div className="mx-auto flex h-full w-full flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <BanknotesIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">Dues Tracker</h1>
                <p className="mt-1 text-[12px] text-gray-500">
                  Monthly expense dues, payment day calendar, month-over-month comparison, and EBITDA
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Month/year stepper — shared across all tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1.5 py-1">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  aria-label="Previous month"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[110px] text-center text-[12px] font-semibold text-gray-800">
                  {monthYearLabel(month, year)}
                </span>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  aria-label="Next month"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <TabStrip tabs={TABS} value={activeTab} onChange={setActiveTab} />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {activeTab === "Monthly Expenses" && <MonthlyExpensesTab month={month} year={year} />}
          {activeTab === "Payment Day Tracker" && <PaymentDayTrackerTab month={month} year={year} />}
          {activeTab === "Month Comparison" && <MonthComparisonTab month={month} year={year} />}
          {activeTab === "EBITDA" && <EbitdaTab month={month} year={year} />}
        </div>
      </div>
    </main>
  );
}
