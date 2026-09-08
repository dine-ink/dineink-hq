import {
  PuzzlePieceIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import type { UseAddOns } from "@/pages/menuManagement/useAddOns";
import { nonNegative } from "@/utils/numberInput";

/**
 * Add-on groups and their options — creating "Extras", pricing "Extra Cheese",
 * and seeing which menu items carry each group.
 *
 * Extracted from MenuManagement.tsx as part of breaking up a 6,000-line
 * component. It referenced ten values from the parent scope, nine of which
 * were add-on state and its handlers; those became the useAddOns hook, so the
 * tab now takes that one object and nothing else. (The other value the scan
 * reported, `menuItems`, was a false positive: it is `group.menuItems`, a
 * field on each group, not the page's own list.)
 */

interface AddOnsTabProps {
  addOns: UseAddOns;
}

export default function AddOnsTab({ addOns }: AddOnsTabProps) {
  // Aliased back to the names the markup already used, so the move is a move
  // and not a rewrite.
  const {
    addOnGroups,
    newGroupName,
    setNewGroupName,
    newOptionForm,
    setNewOptionForm,
    createGroup: handleCreateAddOnGroup,
    deleteGroup: handleDeleteAddOnGroup,
    addOption: handleAddOption,
    deleteOption: handleDeleteOption,
  } = addOns;

  return (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b10000] shadow-sm">
                    <PuzzlePieceIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[24px] font-black tracking-tight text-gray-900">
                      Add-On Groups
                    </h2>
                    <p className="mt-1 text-[13px] text-gray-500">
                      Define reusable extras (e.g. "Extra Toppings") once, then
                      attach them to whichever dishes need them from the Menu
                      tab.
                    </p>
                  </div>
                </div>
              </div>

              {/* New group */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex gap-2">
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleCreateAddOnGroup()
                    }
                    placeholder="New group name (e.g. Extra Toppings)"
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-red-300 focus:bg-white"
                  />
                  <button
                    onClick={handleCreateAddOnGroup}
                    disabled={!newGroupName.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[#b10000] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#950000] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Group
                  </button>
                </div>
              </div>

              {/* Groups list */}
              {addOnGroups.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white">
                  <p className="text-[13px] text-gray-400">
                    No add-on groups yet — create one above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {addOnGroups.map((group: any) => (
                    <div
                      key={group.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                          <h3 className="text-[15px] font-bold text-gray-900">
                            {group.name}
                          </h3>
                          <p className="text-[11px] text-gray-400">
                            {group.options?.length || 0} option
                            {group.options?.length === 1 ? "" : "s"} ·{" "}
                            {group.menuItems?.length || 0} item
                            {group.menuItems?.length === 1 ? "" : "s"} attached
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAddOnGroup(group.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {(group.options || []).map((opt: any) => (
                          <div
                            key={opt.id}
                            className="flex items-center justify-between px-4 py-2.5"
                          >
                            <span className="text-[13px] font-semibold text-gray-800">
                              {opt.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold text-gray-900">
                                ₹{opt.price}
                              </span>
                              <button
                                onClick={() => handleDeleteOption(opt.id)}
                                className="text-[11px] font-semibold text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!group.options || group.options.length === 0) && (
                          <p className="px-4 py-3 text-[12px] text-gray-400">
                            No options yet.
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 border-t border-gray-100 bg-gray-50 p-3">
                        <input
                          value={newOptionForm[group.id]?.name || ""}
                          onChange={(e) =>
                            setNewOptionForm((prev) => ({
                              ...prev,
                              [group.id]: {
                                ...prev[group.id],
                                name: e.target.value,
                                price: prev[group.id]?.price || "",
                              },
                            }))
                          }
                          placeholder="Option (e.g. Extra Cheese)"
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-red-300"
                        />
                        <input
                          type="number" {...nonNegative}
                          value={newOptionForm[group.id]?.price || ""}
                          onChange={(e) =>
                            setNewOptionForm((prev) => ({
                              ...prev,
                              [group.id]: {
                                ...prev[group.id],
                                price: e.target.value,
                                name: prev[group.id]?.name || "",
                              },
                            }))
                          }
                          placeholder="₹"
                          className="w-16 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-red-300"
                        />
                        <button
                          onClick={() => handleAddOption(group.id)}
                          className="shrink-0 rounded-lg bg-[#b10000] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#950000]"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
  );
}
