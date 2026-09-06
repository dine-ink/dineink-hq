import { useState } from "react";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "@/store";
import StaffingPlanTab from "./StaffingPlanTab";
import CapacitySweepTab from "./CapacitySweepTab";
import StationsTab from "./StationsTab";
import LaborStandardsTab from "./LaborStandardsTab";
import SkillMatrixTab from "./SkillMatrixTab";
import CalibrationTab from "./CalibrationTab";
import TabStrip from "@/components/common/TabStrip";

// Tab shell copied in structure from Forecasting.tsx so the two pages navigate
// identically — same header block, same pill tabs, same scrolling content card.
const TABS = ["Staffing Plan", "Capacity by Hour", "Stations", "Labor Standards", "Skill Matrix", "Calibration"];

export default function LaborCapacity() {
  const [activeTab, setActiveTab] = useState("Staffing Plan");
  const { selectedBranch } = useAppSelector((s) => s.branch);

  return (
    <main className="flex flex-col overflow-hidden bg-[#f5f6fa]">
      <div className="mx-auto flex h-full w-full flex-col gap-4 overflow-hidden">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="relative z-10 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000] shadow-sm">
                <UserGroupIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-[22px] font-black leading-none tracking-tight text-gray-900">
                  Labor &amp; Capacity
                </h1>
                <p className="mt-1 text-[12px] text-gray-500">
                  Station-level workload from your own order history — whether you need more people, more equipment, or more tables
                </p>
              </div>
            </div>

            <TabStrip tabs={TABS} value={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        {/* CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {/* Every tab here is branch-scoped — stations, equipment, rosters and
              order history all belong to one kitchen, so there is no meaningful
              restaurant-wide view to fall back to. */}
          {!selectedBranch?.id ? (
            <div className="flex h-60 flex-col items-center justify-center gap-2 text-center">
              <p className="text-[14px] font-semibold text-gray-700">Select a branch to continue</p>
              <p className="max-w-md text-[12px] text-gray-500">
                Kitchen stations, equipment, staff rosters and order history are all per-branch, so
                staffing and capacity can only be analysed one kitchen at a time.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "Staffing Plan" && <StaffingPlanTab />}
              {activeTab === "Capacity by Hour" && <CapacitySweepTab />}
              {activeTab === "Stations" && <StationsTab />}
              {activeTab === "Labor Standards" && <LaborStandardsTab />}
              {activeTab === "Skill Matrix" && <SkillMatrixTab />}
              {activeTab === "Calibration" && <CalibrationTab />}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
