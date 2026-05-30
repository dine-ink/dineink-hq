import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/react";

import {
  Bars3CenterLeftIcon,
  BellIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  QueueListIcon,
  Squares2X2Icon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
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
];

const secondaryNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
];

export default function DashboardLayout() {
  const branches = JSON.parse(localStorage.getItem("branches") || "[]");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <div className="min-h-screen ">
      {/* MOBILE SIDEBAR (SAME AS YOUR CODE) */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-40 lg:hidden"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 flex">
          <DialogPanel className="relative flex w-full max-w-xs flex-1 flex-col bg-red-700 pt-5 pb-4">
            <TransitionChild>
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button onClick={() => setSidebarOpen(false)}>
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            <div className="px-6 text-2xl font-bold text-white">DineInk</div>
            <nav className="mt-8 flex-1 space-y-2 px-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-red-100 hover:bg-red-600 hover:text-white"
                >
                  <item.icon className="mr-3 h-4.5 w-4.5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </DialogPanel>
        </div>
      </Dialog>
      {/* DESKTOP SIDEBAR (SAME) */}

      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-all duration-300 ${
          collapsed ? "lg:w-[68px]" : "lg:w-[150px]"
        }`}
      >
        <div className="relative flex h-full flex-col overflow-visible bg-gradient-to-b from-red-600 via-red-500 to-rose-600">
          {/* SIDEBAR GLOW */}
          <div className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-black/10 blur-3xl"></div>
          {/* LOGO */}
          <div className="relative flex h-[48px] items-center px-3">
            {/* LOGO BUTTON */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="relative z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur transition hover:bg-white/25"
            >
              <span className="text-lg font-bold text-red-200">D</span>
            </button>

            {/* LOGO TEXT */}
            {!collapsed && (
              <div className="ml-2 overflow-hidden">
                <h1 className="truncate text-[13px] font-bold leading-none text-white">
                  Dine<span className="text-red-200">Ink</span>
                </h1>

                <p className="mt-1 truncate text-[7px] leading-none text-red-100/80">
                  Restaurant Intelligence
                </p>
              </div>
            )}
          </div>
          {/* NAVIGATION */}
          <nav className="flex flex-1 flex-col justify-between px-2 ">
            <div className="space-y-1.5">
              {!collapsed && (
                <p className="mb-1 px-1.5 text-[8px] font-bold uppercase tracking-[0.18em] text-red-200/60">
                  Main Menu
                </p>
              )}
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end
                  className={({ isActive }) =>
                    `group flex items-center rounded-md text-sm font-medium transition-all duration-200 ${
                      collapsed
                        ? "justify-center px-0 py-2.5"
                        : "gap-1.5 px-1.5 py-1.5"
                    } ${
                      isActive
                        ? "bg-black/10 text-cyan-200 shadow-lg"
                        : "text-slate-200 hover:bg-black/10 hover:text-cyan-200 hover:shadow-lg"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-xl transition-all duration-200  ${
                          isActive
                            ? "bg-black/20"
                            : "bg-black/10 group-hover:bg-black/20"
                        }`}
                      >
                        <item.icon
                          className={`h-3.5 w-3.5 transition ${
                            isActive
                              ? "text-cyan-200"
                              : "text-slate-300 group-hover:text-cyan-200"
                          }`}
                        />
                      </div>
                      {!collapsed && (
                        <span className="truncate text-[11px]">
                          {item.name}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            {/* BOTTOM SECTION */}
            <div className="space-y-2">
              {/* SECONDARY NAV */}
              <div className="space-y-1">
                {!collapsed && (
                  <p className="px-1.5 text-[8px] font-bold uppercase tracking-[0.18em] text-red-200/60">
                    Preferences
                  </p>
                )}
                {secondaryNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center rounded-md text-sm font-medium transition-all duration-200 ${
                        collapsed
                          ? "justify-center px-0 py-2.5"
                          : "gap-1.5 px-1.5 py-1.5"
                      } ${
                        isActive
                          ? "bg-black/10 text-cyan-200 shadow-lg"
                          : "text-slate-200 hover:bg-black/10 hover:text-cyan-200 hover:shadow-lg"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105 ${
                            isActive
                              ? "bg-black/20"
                              : "bg-black/10 group-hover:bg-black/20"
                          }`}
                        >
                          <item.icon
                            className={`h-3.5 w-3.5 transition ${
                              isActive
                                ? "text-cyan-200"
                                : "text-slate-300 group-hover:text-cyan-200"
                            }`}
                          />
                        </div>
                        {!collapsed && (
                          <span className="truncate text-[11px]">
                            {item.name}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* USER INFO */}
              <div className="border-t border-white/10 pt-2 pb-1">
                {collapsed ? (
                  <div className="flex justify-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-black/10 px-2 py-1.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25 text-[9px] font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate text-[10px] font-semibold leading-none text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="mt-0.5 truncate text-[8px] leading-none text-red-200/70">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>
      </div>
      {/* MAIN */}
      <div
        className={`h-screen flex flex-col overflow-hidden transition-all duration-300 ${
          collapsed ? "lg:pl-[68px]" : "lg:pl-[150px]"
        }`}
      >
        {/* TOPBAR */}
        <div className="relative flex h-12 shrink-0 items-center justify-between bg-gradient-to-r from-red-600 via-red-500 to-rose-500 px-4">
          <div className="pointer-events-none absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-red-300/20 blur-2xl"></div>
          <div className="hidden lg:block">
            <div className="absolute -bottom-2 left-0 h-2 w-2 bg-red-600">
              <div className="h-2 w-2 rounded-tl-[24px] bg-gray-100"></div>
            </div>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white lg:hidden"
          >
            <Bars3CenterLeftIcon className="h-5 w-5" />
          </button>

          {/* RIGHT SECTION */}
          <div className="ml-auto flex items-center gap-3">
            {/* BRANCH SELECTOR */}
            <select
              value={selectedBranch?.id || ""}
              onChange={(e) => {
                const branch = branches.find((s: any) => s.id === Number(e.target.value));
                setSelectedBranch(branch);
                localStorage.setItem("selectedBranch", JSON.stringify(branch));
                window.dispatchEvent(new Event("branchChanged"));
              }}
              className="hidden lg:flex min-w-[130px] appearance-none rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-[12px] font-medium text-white shadow-lg shadow-red-900/10 backdrop-blur-xl outline-none transition-all duration-200 hover:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 cursor-pointer"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "12px",
              }}
            >
              {branches.map((branch: any) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  className="bg-white text-gray-800"
                >
                  {branch.name}
                </option>
              ))}
            </select>

            {/* NOTIFICATION */}
            <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20">
              <BellIcon className="h-4 w-4 text-white" />
            </button>

            {/* PROFILE MENU */}
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-1.5 rounded-xl bg-white/10 px-2 py-1 transition hover:bg-white/20">
                <img className="h-6 w-6 rounded-full object-cover" src="https://i.pravatar.cc/40" />
                <ChevronDownIcon className="h-3.5 w-3.5 text-white" />
              </MenuButton>
              <MenuItems className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="mt-1 truncate text-[11px] text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1.5">
                  <MenuItem>
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-gray-700 transition hover:bg-gray-50">
                      <QueueListIcon className="h-4 w-4 text-gray-500" />
                      Help & Support
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-gray-700 transition hover:bg-gray-50">
                      <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500" />
                      Documentation
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.location.href = "/login";
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] text-red-600 transition hover:bg-red-50"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Logout
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-100 px-4 py-3">
          <div className="mx-auto ">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
