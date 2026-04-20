import { useState } from 'react'
import {
  Bars3CenterLeftIcon,
  BellIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeIcon,
  QueueListIcon,
  Squares2X2Icon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/20/solid'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
  { name: 'Shops', href: '#', icon: BuildingStorefrontIcon, current: false },
  { name: 'Menu', href: '#', icon: QueueListIcon, current: false },
  { name: 'Tables', href: '#', icon: Squares2X2Icon, current: false },
  { name: 'Orders', href: '#', icon: ClipboardDocumentListIcon, current: false },
  { name: 'Bills', href: '#', icon: CreditCardIcon, current: false },
  { name: 'Customers', href: '#', icon: UsersIcon, current: false },
  { name: 'Reports', href: '#', icon: ChartBarIcon, current: false },
]

const secondaryNavigation = [
  { name: 'Settings', href: '#', icon: Cog6ToothIcon },
]

const cards = [
  { name: "Today's Revenue", amount: '₹24,500' },
  { name: 'Orders Today', amount: '128' },
  { name: 'Active Tables', amount: '18' },
  { name: 'Pending Orders', amount: '12' },
]

const recentOrders = [
  {
    id: 1,
    customer: 'Rahul Kumar',
    table: 'Table 5',
    amount: '₹1,250',
    status: 'Completed',
  },
  {
    id: 2,
    customer: 'Anjali Sharma',
    table: 'Takeaway',
    amount: '₹680',
    status: 'Preparing',
  },
  {
    id: 3,
    customer: 'Vikram Singh',
    table: 'Table 2',
    amount: '₹2,150',
    status: 'Pending',
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-40 lg:hidden">
        <DialogBackdrop className="fixed inset-0 bg-black/50" />

        <div className="fixed inset-0 z-40 flex">
          <DialogPanel className="relative flex w-full max-w-xs flex-1 flex-col bg-red-700 pt-5 pb-4">
            <TransitionChild>
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <div className="px-6 text-2xl font-bold tracking-wide text-white">
              DineInk
            </div>

            <nav className="mt-8 flex-1 space-y-2 px-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-red-800 text-white'
                      : 'text-red-100 hover:bg-red-600 hover:text-white',
                    'group flex items-center rounded-xl px-4 py-3 text-sm font-medium'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </nav>
          </DialogPanel>
        </div>
      </Dialog>
       <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-red-700 px-6 py-6">
          <div className="text-3xl font-bold tracking-wide text-white">
            DineInk
          </div>

          <nav className="mt-10 flex flex-1 flex-col justify-between">
            <div className="space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'bg-red-800 text-white'
                      : 'text-red-100 hover:bg-red-600 hover:text-white',
                    'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </div>


            <div className="space-y-2">
              {secondaryNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-red-100 hover:bg-red-600 hover:text-white"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 lg:hidden"
          >
            <Bars3CenterLeftIcon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center gap-4 px-4">
            <div className="relative w-full max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search orders, menu, customers..."
                className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
              <BellIcon className="h-5 w-5" />
            </button>

            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-3 rounded-xl bg-gray-100 px-3 py-2 hover:bg-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&w=256&h=256&q=80"
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
                <span className="hidden text-sm font-medium text-gray-700 lg:block">
                  Vikranth
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </MenuButton>

              <MenuItems className="absolute right-0 mt-2 w-48 rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5 focus:outline-none">
                <MenuItem>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </a>
                </MenuItem>
                <MenuItem>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Settings
                  </a>
                </MenuItem>
                <MenuItem>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Logout
                  </a>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>

        <main className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back 👋</h1>
              <p className="mt-2 text-gray-500">
                Here’s what’s happening in your restaurant today.
              </p>
            </div>

            <button className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-red-500">
              + Add New Shop
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.name} className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500">{card.name}</p>
                <p className="mt-3 text-3xl font-bold text-gray-900">{card.amount}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <button className="text-sm font-medium text-red-600 hover:text-red-500">
                  View All
                </button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-500">Customer</th>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-500">Table</th>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-500">Amount</th>
                      <th className="pb-3 text-left text-sm font-semibold text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-4 text-sm text-gray-900">{order.customer}</td>
                        <td className="py-4 text-sm text-gray-500">{order.table}</td>
                        <td className="py-4 text-sm font-medium text-gray-900">{order.amount}</td>
                        <td className="py-4">
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>

              <div className="mt-6 space-y-4">
                <button className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50">
                  Add Menu Item
                </button>

                <button className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50">
                  Add Table
                </button>

                <button className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50">
                  Add Staff Member
                </button>

                <button className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:border-red-300 hover:bg-red-50">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}