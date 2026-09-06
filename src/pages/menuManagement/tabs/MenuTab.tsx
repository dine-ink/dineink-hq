import {
  FolderIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import MobileTableCards from "@/components/common/MobileTableCards";
import { isVegType } from "@/pages/menuManagement/menuDisplay";
import type { UseMenuItemsEditor } from "@/pages/menuManagement/useMenuItemsEditor";

/**
 * The menu itself — every item, its price, availability and category, plus the
 * filters and the add/edit form.
 *
 * The last of the eight tabs to come out of MenuManagement.tsx, and the one
 * that borrowed most: thirty-two values, every one of them used by this tab
 * alone. They became useMenuItemsEditor rather than moving in here directly,
 * which would have made one file of about a thousand lines.
 *
 * openAttachModal stays a prop. The attach modal it opens renders on the page,
 * guarded on its own state rather than on the active tab.
 */

interface MenuTabProps {
  editor: UseMenuItemsEditor;
  categories: any[];
  openAttachModal: (item: any) => void;
}

export default function MenuTab({ editor, categories, openAttachModal }: MenuTabProps) {
  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const {
    itemSearch, setItemSearch,
    itemCatFilter, setItemCatFilter,
    itemTypeFilter, setItemTypeFilter,
    itemPriceSort, setItemPriceSort,
    itemAvailFilter, setItemAvailFilter,
    openItemCategories, setOpenItemCategories,
    showAddItemForm, setShowAddItemForm,
    editingItem, setEditingItem,
    blankItemForm,
    itemForm, setItemForm,
    showMenuCategory, setShowMenuCategory,
    menuCatName, setMenuCatName,
    savingItem,
    handleCreateMenuCategory,
    handleSaveMenuItem,
    handleDeleteMenuItem,
    handleToggleAvailability,
    filteredMenuItems,
    mobileItemGroups,
  } = editor;

  return (
    <>
            <div className="space-y-4">
              {/* ================= HEADER ================= */}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* LEFT */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#b10000]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b10000]">
                    Menu Center
                  </div>

                  <h2 className="mt-2 text-[24px] font-black tracking-tight text-gray-900">
                    Menu Items
                  </h2>

                  <p className="mt-1 text-[13px] text-gray-500">
                    Manage pricing, categories & availability
                  </p>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMenuCategory((v) => !v)}
                    className="h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    + Category
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setItemForm(blankItemForm);
                      setShowAddItemForm(true);
                    }}
                    className="h-11 rounded-xl bg-[#b10000] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* ── INLINE ADD CATEGORY ── */}
              {showMenuCategory && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <FolderIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <input
                    autoFocus
                    value={menuCatName}
                    onChange={(e) => setMenuCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateMenuCategory();
                      if (e.key === "Escape") setShowMenuCategory(false);
                    }}
                    placeholder="Category name (e.g. Starters, Mains, Desserts…)"
                    className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    onClick={handleCreateMenuCategory}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12px] font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </button>
                  <button
                    onClick={() => setShowMenuCategory(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ================= TABLE ================= */}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* The filter widgets on this table live in its header row, so
                    it cannot become generic cards — phones get the purpose-built
                    accordion below instead. */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full">
                    {/* HEADER */}

                    <thead className="border-b border-gray-100 bg-gray-50/80">
                      {/* FILTER ROW */}

                      <tr className="border-b border-gray-100 bg-gray-50/70">
                        {/* ITEM SEARCH */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Item
                            </p>

                            <input
                              placeholder="Search item..."
                              value={itemSearch}
                              onChange={(e) => setItemSearch(e.target.value)}
                              className="h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                            />
                          </div>
                        </th>

                        {/* CATEGORY */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Category
                            </p>

                            <div className="relative">
                              <select
                                value={itemCatFilter}
                                onChange={(e) =>
                                  setItemCatFilter(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">All Categories</option>
                                {categories.map((cat: any) => (
                                  <option key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* TYPE */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Type
                            </p>

                            <div className="relative">
                              <select
                                value={itemTypeFilter}
                                onChange={(e) =>
                                  setItemTypeFilter(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">All Types</option>
                                <option value="VEG">Veg</option>
                                <option value="NON_VEG">Non Veg</option>
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* PRICE */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Price
                            </p>

                            <div className="relative">
                              <select
                                value={itemPriceSort}
                                onChange={(e) =>
                                  setItemPriceSort(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">Sort Price</option>
                                <option value="asc">Low to High</option>
                                <option value="desc">High to Low</option>
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* STATUS */}

                        <th className="px-5 py-3">
                          <div>
                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Status
                            </p>

                            <div className="relative">
                              <select
                                value={itemAvailFilter}
                                onChange={(e) =>
                                  setItemAvailFilter(e.target.value)
                                }
                                className="h-9 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-[12px] font-medium text-gray-700 outline-none transition-all duration-200 hover:border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              >
                                <option value="">All Status</option>
                                <option value="Available">Available</option>
                                <option value="Unavailable">Unavailable</option>
                              </select>

                              {/* CUSTOM ARROW */}

                              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <svg
                                  className="h-3.5 w-3.5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </th>

                        {/* ACTION */}

                        <th className="px-5 py-3">
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                            Actions
                          </p>

                          <div className="flex h-9 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-[11px] font-medium text-gray-400">
                            Controls
                          </div>
                        </th>
                      </tr>
                    </thead>

                    {/* BODY */}

                    <tbody>
                      {filteredMenuItems?.length ? (
                        filteredMenuItems.map((item: any, index: number) => (
                          <tr
                            key={item.id || index}
                            className="border-b border-gray-100 transition hover:bg-gray-50/70"
                          >
                            {/* ITEM */}

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {/* IMAGE / AVATAR */}

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#b10000] text-[14px] font-bold text-white">
                                  {item.name?.charAt(0)}
                                </div>

                                {/* INFO */}

                                <div>
                                  <p className="text-[15px] font-semibold text-gray-900">
                                    {item.name}
                                  </p>

                                  <p className="mt-0.5 text-[11px] text-gray-400">
                                    Item ID #{item.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-4">
                              <span className="text-[13px] font-medium text-gray-600">
                                {item.category?.name || "-"}
                              </span>
                            </td>

                            {/* TYPE */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  isVegType(item.type)
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                {isVegType(item.type) ? "Veg" : "Non Veg"}
                              </span>
                            </td>

                            {/* PRICE */}

                            <td className="px-5 py-4">
                              <p className="text-[15px] font-black text-gray-900">
                                ₹{item.price}
                              </p>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  item.isAvailable
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </span>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleToggleAvailability(item)}
                                  className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${item.isAvailable ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                                >
                                  {item.isAvailable ? "Mark Off" : "Mark On"}
                                </button>
                                <button
                                  onClick={() => openAttachModal(item)}
                                  title="Manage add-ons for this item"
                                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] font-semibold text-violet-700 transition hover:bg-violet-100"
                                >
                                  Add-Ons
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setItemForm({
                                      name: item.name,
                                      categoryId: String(item.categoryId || ""),
                                      type: item.type || "VEG",
                                      price: String(item.price),
                                      prepTime: String(item.prepTime || ""),
                                      description: item.description || "",
                                      isAvailable: item.isAvailable,
                                    });
                                    setShowAddItemForm(true);
                                  }}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMenuItem(item.id)}
                                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-16 text-center text-sm text-gray-400"
                          >
                            {itemSearch ||
                            itemCatFilter ||
                            itemTypeFilter ||
                            itemAvailFilter
                              ? "No items match your filters"
                              : "No menu items yet — click + Add Item to get started"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ===== MOBILE: SEARCH, FILTERS, CATEGORY ACCORDION ===== */}
                <div className="md:hidden">
                  <div className="space-y-2 border-b border-gray-100 bg-gray-50/70 p-3">
                    <div className="relative">
                      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        placeholder="Search item..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white pr-3 pl-9 text-[13px] font-medium text-gray-700 outline-none placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={itemCatFilter}
                        onChange={(e) => setItemCatFilter(e.target.value)}
                        aria-label="Filter by category"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={itemTypeFilter}
                        onChange={(e) => setItemTypeFilter(e.target.value)}
                        aria-label="Filter by food type"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">All Types</option>
                        <option value="VEG">Veg</option>
                        <option value="NON_VEG">Non Veg</option>
                      </select>
                      <select
                        value={itemAvailFilter}
                        onChange={(e) => setItemAvailFilter(e.target.value)}
                        aria-label="Filter by availability"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">All Status</option>
                        <option value="Available">Available</option>
                        <option value="Unavailable">Unavailable</option>
                      </select>
                      <select
                        value={itemPriceSort}
                        onChange={(e) => setItemPriceSort(e.target.value)}
                        aria-label="Sort by price"
                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-2 text-[12px] font-medium text-gray-700 outline-none focus:border-red-300"
                      >
                        <option value="">Sort Price</option>
                        <option value="asc">Low to High</option>
                        <option value="desc">High to Low</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between px-0.5">
                      <p className="text-[11px] text-gray-500">
                        {filteredMenuItems.length}{" "}
                        {filteredMenuItems.length === 1 ? "item" : "items"}
                      </p>
                      {(itemSearch ||
                        itemCatFilter ||
                        itemTypeFilter ||
                        itemAvailFilter ||
                        itemPriceSort) && (
                        <button
                          onClick={() => {
                            setItemSearch("");
                            setItemCatFilter("");
                            setItemTypeFilter("");
                            setItemAvailFilter("");
                            setItemPriceSort("");
                          }}
                          className="text-[11px] font-semibold text-[#b10000]"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredMenuItems.length === 0 ? (
                    <p className="px-4 py-12 text-center text-[13px] text-gray-400">
                      {itemSearch ||
                      itemCatFilter ||
                      itemTypeFilter ||
                      itemAvailFilter
                        ? "No items match your filters"
                        : "No menu items yet — tap + Add Item to get started"}
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {mobileItemGroups.map((group) => {
                        // While searching, every group stays open so matches
                        // show without tapping through categories.
                        const isOpen =
                          !!itemSearch || !!openItemCategories[group.name];
                        return (
                          <div key={group.name}>
                            <button
                              onClick={() =>
                                setOpenItemCategories((prev) => ({
                                  ...prev,
                                  [group.name]: !prev[group.name],
                                }))
                              }
                              aria-expanded={isOpen}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition active:bg-gray-50"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-semibold text-gray-900">
                                  {group.name}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {group.items.length}
                                  {group.items.length === 1 ? " item" : " items"}
                                  {group.unavailable > 0
                                    ? ` · ${group.unavailable} off`
                                    : ""}
                                </span>
                              </span>
                              <ChevronDownIcon
                                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              />
                            </button>

                            {isOpen && (
                              <div className="space-y-2 bg-gray-50/60 px-3 pt-1 pb-3">
                                {group.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="rounded-xl border border-gray-200 bg-white p-3"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b10000] text-[13px] font-bold text-white">
                                        {item.name?.charAt(0)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-[14px] font-semibold text-gray-900">
                                          {item.name}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-gray-400">
                                          Item ID #{item.id}
                                        </p>
                                      </div>
                                      <p className="shrink-0 text-[15px] font-black text-gray-900">
                                        ₹{item.price}
                                      </p>
                                    </div>

                                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          isVegType(item.type)
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-700"
                                        }`}
                                      >
                                        {isVegType(item.type) ? "Veg" : "Non Veg"}
                                      </span>
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                          item.isAvailable
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                      >
                                        {item.isAvailable
                                          ? "Available"
                                          : "Unavailable"}
                                      </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                                      <button
                                        onClick={() =>
                                          handleToggleAvailability(item)
                                        }
                                        className={`h-9 rounded-xl border text-[12px] font-semibold transition ${item.isAvailable ? "border-orange-200 bg-orange-50 text-orange-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                                      >
                                        {item.isAvailable ? "Mark Off" : "Mark On"}
                                      </button>
                                      <button
                                        onClick={() => openAttachModal(item)}
                                        className="h-9 rounded-xl border border-violet-200 bg-violet-50 text-[12px] font-semibold text-violet-700"
                                      >
                                        Add-Ons
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingItem(item);
                                          setItemForm({
                                            name: item.name,
                                            categoryId: String(
                                              item.categoryId || "",
                                            ),
                                            type: item.type || "VEG",
                                            price: String(item.price),
                                            prepTime: String(item.prepTime || ""),
                                            description: item.description || "",
                                            isAvailable: item.isAvailable,
                                          });
                                          setShowAddItemForm(true);
                                        }}
                                        className="h-9 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteMenuItem(item.id)
                                        }
                                        className="h-9 rounded-xl border border-red-200 bg-red-50 text-[12px] font-semibold text-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          {/* ── ADD / EDIT ITEM MODAL ── */}
          {showAddItemForm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setShowAddItemForm(false)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[17px] font-bold text-gray-900">
                    {editingItem ? "Edit Item" : "Add Menu Item"}
                  </h3>
                  <button
                    onClick={() => setShowAddItemForm(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      Item Name *
                    </label>
                    <input
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm((f: any) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Paneer Butter Masala"
                      className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Category
                      </label>
                      <select
                        value={itemForm.categoryId}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            categoryId: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">No Category</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Type
                      </label>
                      <select
                        value={itemForm.type}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            type: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="VEG">Veg</option>
                        <option value="NON_VEG">Non Veg</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={itemForm.price}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            price: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        Prep Time (min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={itemForm.prepTime}
                        onChange={(e) =>
                          setItemForm((f: any) => ({
                            ...f,
                            prepTime: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      Description
                    </label>
                    <input
                      value={itemForm.description}
                      onChange={(e) =>
                        setItemForm((f: any) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Optional description"
                      className="h-9 w-full rounded-xl border border-gray-200 px-3 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAvail"
                      checked={itemForm.isAvailable}
                      onChange={(e) =>
                        setItemForm((f: any) => ({
                          ...f,
                          isAvailable: e.target.checked,
                        }))
                      }
                      className="accent-[#b10000]"
                    />
                    <label
                      htmlFor="isAvail"
                      className="text-[13px] font-medium text-gray-700"
                    >
                      Available for ordering
                    </label>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddItemForm(false)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMenuItem}
                    disabled={
                      savingItem || !itemForm.name.trim() || !itemForm.price
                    }
                    className="rounded-xl bg-[#b10000] px-5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-50"
                  >
                    {savingItem
                      ? "Saving…"
                      : editingItem
                        ? "Save Changes"
                        : "Add Item"}
                  </button>
                </div>
              </div>
            </div>
      )}
    </>
  );
}
