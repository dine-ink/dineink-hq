import {
  CubeIcon,
  PlusIcon,
  SparklesIcon,
  FolderIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import MobileTableCards from "@/components/common/MobileTableCards";
import type { UseIngredientEditor } from "@/pages/menuManagement/useIngredientEditor";

/**
 * Ingredient stock — the editable rows, the categories they group under, the
 * vendor sheet import and the per-ingredient price history.
 *
 * Extracted from MenuManagement.tsx as part of breaking up a 6,000-line
 * component. It borrowed twenty-three values from the page. They are not one
 * workflow the way Item Mapping's were -- editing, categorising, importing and
 * price history are four -- but all four read and write the same `ingredients`
 * draft, so they became one hook rather than four sharing a piece of state.
 *
 * (The dependency scan also credited it with `categories`. That one appears
 * only in a sentence of on-screen help -- the scan blanks comments and string
 * literals, but JSX text is neither.)
 */

interface IngredientsTabProps {
  editor: UseIngredientEditor;
  loading: boolean;
}

export default function IngredientsTab({ editor, loading }: IngredientsTabProps) {
  // Aliased back to the names the markup already used, so this is a move
  // rather than a rewrite.
  const {
    ingredients,
    uploadingVendor,
    showAddCategory,
    setShowAddCategory,
    newCategoryName,
    setNewCategoryName,
    manualCategories,
    vendors,
    priceHistoryModal,
    setPriceHistoryModal,
    handleGenerate,
    handleSave,
    openPriceHistory,
    handleUpdateIngredientPrice,
    handleRemoveIngredient,
    handleAddCategory,
    handleDeleteCategory,
    handleAddIngredient,
    handleFieldChange,
    downloadVendorTemplate,
    handleVendorUpload,
  } = editor;

  return (
            <div className="space-y-3">
              {/* ================= HEADER ================= */}

              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  {/* LEFT */}

                  <div className="flex items-center gap-3">
                    {/* ICON */}

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b10000] shadow-sm">
                      <CubeIcon className="h-5 w-5 text-white" />
                    </div>

                    {/* CONTENT */}

                    <div>
                      <h2 className="text-[24px] font-black tracking-tight text-gray-900">
                        Ingredients
                      </h2>

                      <p className="mt-0.5 text-[13px] text-gray-500">
                        Ingredient inventory & vendor management
                      </p>

                      {/* STATS */}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="rounded-full bg-[#b10000]/10 px-2.5 py-1 text-[10px] font-semibold text-[#b10000]">
                          AI Generated
                        </div>

                        <div className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">
                          {Object.values(ingredients).flat().length} Ingredients
                        </div>

                        <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                          {Object.keys(ingredients).length} Categories
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setShowAddCategory((v) => !v);
                        setNewCategoryName("");
                      }}
                      className="flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Category
                    </button>
                    <button
                      onClick={downloadVendorTemplate}
                      className="
              h-9
              rounded-xl
              border
              border-indigo-100
              bg-indigo-50
              px-4
              text-[12px]
              font-semibold
              text-indigo-600
              transition
              hover:bg-indigo-100
            "
                    >
                      Vendor Template
                    </button>

                    <label
                      className="
              flex
              h-9
              cursor-pointer
              items-center
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              text-[12px]
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-50
            "
                    >
                      {uploadingVendor ? "Uploading..." : "Upload Vendors"}

                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleVendorUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex h-9 items-center gap-2 rounded-xl bg-[#b10000] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                    >
                      <SparklesIcon className="h-4 w-4" />

                      {loading ? "Generating..." : "Generate"}
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= ADD CATEGORY INLINE FORM ================= */}
              {showAddCategory && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <FolderIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCategory();
                      if (e.key === "Escape") setShowAddCategory(false);
                    }}
                    placeholder="Category name (e.g. Vegetables, Dairy, Spices...)"
                    className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[12px] font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> Add
                  </button>
                  <button
                    onClick={() => setShowAddCategory(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ================= EMPTY ================= */}
              {Object.keys(ingredients).length === 0 && (
                <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#b10000]">
                      <SparklesIcon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-gray-900">
                      No Ingredients Yet
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-500">
                      Generate automatically from your menu, or add categories
                      manually
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          setShowAddCategory(true);
                          setNewCategoryName("");
                        }}
                        className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <PlusIcon className="h-4 w-4" /> Add Category Manually
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl bg-[#b10000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#950000] disabled:opacity-60"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {loading ? "Generating..." : "Generate with AI"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= INVENTORY ================= */}

              {ingredients && Object.keys(ingredients).length > 0 && (
                <div className="space-y-3">
                  {Object.entries(ingredients).map(
                    ([category, rawItems]: any) => {
                      const items = Array.isArray(rawItems) ? rawItems : [];

                      return (
                        <div
                          key={category}
                          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                        >
                          {/* CATEGORY HEADER */}

                          <div className="border-b border-gray-100 px-4 py-3">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                              {/* LEFT */}

                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b10000]">
                                  <FolderIcon className="h-4 w-4 text-white" />
                                </div>

                                <div>
                                  <h3 className="text-[17px] font-bold text-gray-900">
                                    {category}
                                  </h3>

                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[12px] text-gray-500">
                                      {items.length} Ingredients
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${manualCategories.has(category) ? "bg-emerald-50 text-emerald-600" : "bg-[#b10000]/10 text-[#b10000]"}`}
                                    >
                                      {manualCategories.has(category)
                                        ? "Manual"
                                        : "AI Generated"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* ACTIONS */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAddIngredient(category)}
                                  className="flex h-9 items-center gap-2 rounded-xl bg-[#b10000] px-4 text-[12px] font-semibold text-white transition hover:bg-[#950000]"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                  Add Ingredient
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(category)}
                                  className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-[12px] font-semibold text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                                  title="Delete category"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* TABLE */}

                          <div className="overflow-x-auto">
                            <MobileTableCards>
                            <table className="min-w-full">
                              {/* HEAD */}

                              <thead className="border-b border-gray-100 bg-gray-50/70">
                                <tr>
                                  {[
                                    "Ingredient",
                                    "Qty",
                                    "Unit",
                                    "Purchase",
                                    "Unit Price",
                                    "Reorder At",
                                    "Vendor",
                                    "Action",
                                  ].map((head) => (
                                    <th
                                      key={head}
                                      className="
                              px-4
                              py-2.5
                              text-left
                              text-[10px]
                              font-bold
                              uppercase
                              tracking-[0.12em]
                              text-gray-400
                            "
                                    >
                                      {head}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              {/* BODY */}

                              <tbody>
                                {items.length > 0 ? (
                                  items.map((item: any, index: number) => (
                                    <tr
                                      key={index}
                                      className="border-b border-gray-100 hover:bg-gray-50/40"
                                    >
                                      {/* INGREDIENT */}

                                      <td className="px-4 py-2.5">
                                        <input
                                          value={item?.name || ""}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "name",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  w-full
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  font-medium
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        />
                                      </td>

                                      {/* QTY */}

                                      <td className="px-4 py-2.5">
                                        <input
                                          type="number"
                                          value={item?.quantity || ""}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "quantity",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  w-20
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        />
                                      </td>

                                      {/* UNIT */}

                                      <td className="px-4 py-2.5">
                                        <select
                                          value={item?.unit || "Kg"}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "unit",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        >
                                          <option>Kg</option>
                                          <option>Gram</option>
                                          <option>Litre</option>
                                          <option>Ml</option>
                                          <option>Piece</option>
                                        </select>
                                      </td>

                                      {/* PURCHASE */}

                                      <td className="px-4 py-2.5">
                                        <input
                                          type="number"
                                          value={item?.purchasePrice || ""}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "purchasePrice",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  w-28
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        />
                                      </td>

                                      {/* PRICE */}

                                      <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                          <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-[12px] font-bold text-gray-700">
                                            ₹{item?.pricePerUnit || 0}
                                          </div>
                                          {item?.id && (
                                            <button
                                              type="button"
                                              title="Update price / view history"
                                              onClick={() =>
                                                openPriceHistory(
                                                  category,
                                                  index,
                                                  item,
                                                )
                                              }
                                              className="text-[10px] font-semibold text-[#b10000] underline decoration-dotted hover:text-[#950000]"
                                            >
                                              History
                                            </button>
                                          )}
                                        </div>
                                      </td>

                                      {/* REORDER LEVEL */}

                                      <td className="px-4 py-2.5">
                                        <input
                                          type="number"
                                          placeholder="e.g. 5"
                                          value={item?.reorderLevel ?? ""}
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "reorderLevel",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  w-24
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        />
                                      </td>

                                      {/* VENDOR */}

                                      <td className="px-4 py-2.5">
                                        <select
                                          value={
                                            item?.vendorId ??
                                            item?.vendor?.[0]?.vendor?.id ??
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleFieldChange(
                                              category,
                                              index,
                                              "vendorId",
                                              e.target.value,
                                            )
                                          }
                                          className="
                                  h-9
                                  min-w-[210px]
                                  rounded-lg
                                  border
                                  border-gray-200
                                  bg-white
                                  px-3
                                  text-[13px]
                                  font-medium
                                  text-gray-700
                                  outline-none
                                  transition
                                  focus:border-red-200
                                  focus:ring-2
                                  focus:ring-red-100
                                "
                                        >
                                          <option value="">
                                            Select Vendor
                                          </option>

                                          {vendors.map((vendor: any) => (
                                            <option
                                              key={vendor.id}
                                              value={vendor.id}
                                            >
                                              {vendor.name} •{" "}
                                              {vendor.phone || "No Phone"}
                                            </option>
                                          ))}
                                        </select>
                                      </td>

                                      {/* REMOVE */}

                                      <td className="px-4 py-2.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveIngredient(
                                              category,
                                              index,
                                            )
                                          }
                                          className="
                                  rounded-lg
                                  border
                                  border-red-200
                                  bg-red-50
                                  px-3
                                  py-2
                                  text-[11px]
                                  font-semibold
                                  text-red-700
                                  transition
                                  hover:bg-red-100
                                "
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-5 py-10 text-center text-sm text-gray-400"
                                    >
                                      No ingredients found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                            </MobileTableCards>
                          </div>
                        </div>
                      );
                    },
                  )}

                  {/* SAVE */}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      className="flex h-10 items-center gap-2 rounded-xl bg-[#b10000] px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                    >
                      <CloudArrowUpIcon className="h-4 w-4" />
                      Save Ingredients
                    </button>
                  </div>
                </div>
              )}

              {/* PRICE HISTORY / UPDATE MODAL */}
              {priceHistoryModal.open && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                  onClick={() =>
                    setPriceHistoryModal((prev) => ({ ...prev, open: false }))
                  }
                >
                  <div
                    className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[17px] font-bold text-gray-900">
                        {priceHistoryModal.ingredientName} — Price
                      </h3>
                      <button
                        onClick={() =>
                          setPriceHistoryModal((prev) => ({
                            ...prev,
                            open: false,
                          }))
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          Update Price/Unit (₹)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={priceHistoryModal.newPrice}
                            onChange={(e) =>
                              setPriceHistoryModal((prev) => ({
                                ...prev,
                                newPrice: e.target.value,
                              }))
                            }
                            placeholder="New price per unit"
                            className="h-9 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-[13px] outline-none transition focus:border-red-200 focus:ring-2 focus:ring-red-100"
                          />
                          <button
                            onClick={handleUpdateIngredientPrice}
                            className="h-9 rounded-lg bg-[#b10000] px-4 text-[12px] font-semibold text-white transition hover:bg-[#950000]"
                          >
                            Update
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          History
                        </p>
                        <div className="max-h-56 space-y-1.5 overflow-y-auto">
                          {priceHistoryModal.loading && (
                            <p className="text-[12px] text-gray-400">
                              Loading...
                            </p>
                          )}
                          {!priceHistoryModal.loading &&
                            priceHistoryModal.history.length === 0 && (
                              <p className="text-[12px] text-gray-400">
                                No price changes recorded yet
                              </p>
                            )}
                          {priceHistoryModal.history.map((h: any) => (
                            <div
                              key={h.id}
                              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 text-[12px]"
                            >
                              <span className="text-gray-500">
                                {new Date(h.createdAt).toLocaleDateString()}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ₹{h.oldPrice ?? "—"} → ₹{h.newPrice}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
}
