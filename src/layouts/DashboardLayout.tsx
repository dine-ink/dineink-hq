import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

const NAV = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Shops", href: "/dashboard/shops", icon: BuildingStorefrontIcon },
  { name: "Bills", href: "/dashboard/bills", icon: CreditCardIcon },
  { name: "Customers", href: "/dashboard/customers", icon: UsersIcon },
  {
    name: "Operations",
    href: "/dashboard/menu-management",
    icon: ClipboardDocumentListIcon,
  },
  { name: "Insights", href: "/dashboard/insights", icon: ChartBarIcon },
  { name: "Reports", href: "/dashboard/reports", icon: DocumentChartBarIcon },
  { name: "Attendance", href: "/dashboard/attendance", icon: CalendarDaysIcon },
  { name: "Cash", href: "/dashboard/cash", icon: BanknotesIcon },
  { name: "Compare", href: "/dashboard/comparison", icon: ArrowsRightLeftIcon },
  { name: "Kitchen", href: "/dashboard/kitchen", icon: FireIcon },
];

const SECONDARY = [
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

const navLinkCls = (isActive: boolean, collapsed: boolean) =>
  `group flex items-center rounded-lg text-[11px] font-semibold transition-all duration-200 ${
    collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
  } ${isActive ? "bg-white/15 text-white shadow-sm" : "text-white/60 hover:bg-white/10 hover:text-white"}`;

const iconCls = (isActive: boolean) =>
  `h-4 w-4 shrink-0 transition ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  const handleBranchChange = (branchId: number) => {
    const branch = branches.find((b: any) => b.id === branchId);
    if (!branch) return;
    setSelectedBranch(branch);
    localStorage.setItem("selectedBranch", JSON.stringify(branch));
    window.dispatchEvent(new Event("branchChanged"));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── MOBILE SIDEBAR ───────────────────────────────────────────── */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-40 lg:hidden"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative flex w-72 flex-col bg-gradient-to-b from-red-600 via-red-500 to-rose-600 pt-5 pb-4">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 pb-4">
              <h1 className="text-xl font-black text-white">DineInk</h1>
              <p className="text-[10px] text-red-200">
                Restaurant Intelligence
              </p>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3">
              {NAV.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </DialogPanel>
        </div>
      </Dialog>

      {/* ── DESKTOP SIDEBAR ──────────────────────────────────────────── */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-all duration-300 ${collapsed ? "lg:w-[60px]" : "lg:w-[152px]"}`}
      >
        <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-red-600 via-red-500 to-rose-600">
          {/* Logo + collapse toggle */}
          <div className="relative flex h-12 shrink-0 items-center justify-between px-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
            >
              <span className="text-[15px] font-black">D</span>
            </button>
            {!collapsed && (
              <div className="ml-2 flex-1 overflow-hidden">
                <p className="truncate text-[13px] font-black leading-none text-white">
                  DineInk
                </p>
                <p className="mt-0.5 truncate text-[8px] leading-none text-red-200/70">
                  Restaurant OS
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-white/60 hover:text-white"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-2 pb-2">
            <div className="space-y-0.5">
              {!collapsed && (
                <p className="mb-1.5 px-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-red-300/60">
                  Menu
                </p>
              )}
              {NAV.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
                  className={({ isActive }) => navLinkCls(isActive, collapsed)}
                  title={collapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={iconCls(isActive)} />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="space-y-1">
              {!collapsed && (
                <p className="mb-1 px-1.5 text-[8px] font-bold uppercase tracking-[0.2em] text-red-300/60">
                  Account
                </p>
              )}
              {SECONDARY.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => navLinkCls(isActive, collapsed)}
                  title={collapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={iconCls(isActive)} />
                      {!collapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* User card */}
              <div className="mt-2 border-t border-white/10 pt-2">
                {collapsed ? (
                  <div className="flex justify-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[11px] font-black text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-black/15 px-2.5 py-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/25 text-[10px] font-black text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold leading-none text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="mt-0.5 truncate text-[8px] leading-none text-red-200/70">
                        {user?.role || "Owner"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Expand button when collapsed */}
              {collapsed && (
                <button
                  onClick={() => setCollapsed(false)}
                  className="mt-1 flex w-full items-center justify-center py-1.5 text-white/50 hover:text-white transition"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* ── MAIN AREA ────────────────────────────────────────────────── */}
      <div
        className={`flex h-screen flex-col overflow-hidden transition-all duration-300 ${collapsed ? "lg:pl-[60px]" : "lg:pl-[152px]"}`}
      >
        {/* TOP BAR */}
        <header className="relative z-20 flex h-12 shrink-0 items-center justify-between bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-4 ">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-8 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-red-300/20 blur-2xl" />
          </div>
          {/* Left curve decoration */}
          <div className="hidden lg:block">
            <div className="absolute -bottom-2 left-0 h-2 w-2 bg-red-600">
              <div className="h-2 w-2 rounded-tl-[24px] bg-gray-100"></div>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="relative text-white lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="relative ml-auto flex items-center gap-2">
            {/* Branch selector */}
            {branches.length > 0 && (
              <select
                value={selectedBranch?.id || ""}
                onChange={(e) => handleBranchChange(Number(e.target.value))}
                className="hidden lg:flex min-w-[130px] cursor-pointer appearance-none rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-xl outline-none transition hover:bg-white/20 focus:border-white/40"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  backgroundSize: "12px",
                  paddingRight: "30px",
                }}
              >
                {branches.map((b: any) => (
                  <option
                    key={b.id}
                    value={b.id}
                    className="bg-white text-gray-900"
                  >
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Notification bell */}
            <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20">
              <BellIcon className="h-4 w-4" />
            </button>

            {/* Profile */}
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2 py-1 transition hover:bg-white/20">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-[10px] font-black text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <ChevronDownIcon className="h-3 w-3 text-white/70" />
              </MenuButton>
              <MenuItems className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200/80">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-[13px] font-bold text-gray-900">
                    {user?.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <div className="py-1.5">
                  <MenuItem>
                    <button
                      onClick={() => navigate("/dashboard/settings")}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-gray-700 transition hover:bg-gray-50"
                    >
                      <Cog6ToothIcon className="h-4 w-4 text-gray-400" />
                      Account Settings
                    </button>
                  </MenuItem>
                  <div className="my-1 border-t border-gray-100" />
                  <MenuItem>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      Sign Out
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gray-100 px-4 py-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
