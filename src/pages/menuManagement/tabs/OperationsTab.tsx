import {
  PlusIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/**
 * SOP checklists — the written prep and hygiene procedures, optionally tied to
 * a menu item.
 *
 * Extracted from MenuManagement.tsx as part of breaking up a 6,000-line
 * component. Unlike the Add-Ons tab, this one owns its data outright: nothing
 * outside it reads a SOP checklist, so the state, the fetch and the four
 * handlers all came down with the markup and the `activeTab === "operations"`
 * guard became the mount. What is left as props is the two lists it only reads.
 *
 * (An earlier dependency count put `attachModal` and `handleToggleAttach` in
 * here too, along with `addOnGroups`. They are not: the attach modal renders
 * after this block and is guarded on its own state rather than on the tab, so
 * it stays with the page — and takes those three with it.)
 */

import { useState } from "react";
import { useAppSelector } from "@/store";
import {
  useGetSopChecklistsQuery,
  useSaveSopMutation,
  useDeleteSopMutation,
} from "@/store/api/sopApi";

interface OperationsTabProps {
  menuItems: any[];
}

export default function OperationsTab({ menuItems }: OperationsTabProps) {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [sopForm, setSopForm] = useState<{
    id: number | null;
    title: string;
    category: string;
    menuItemId: string;
    steps: string[];
  }>({ id: null, title: "", category: "", menuItemId: "", steps: [""] });
  const [showSopForm, setShowSopForm] = useState(false);

  const { data: sopChecklists = [] } = useGetSopChecklistsQuery(
    { restaurantId: user?.restaurantId as number, branchId: selectedBranch?.id },
    { skip: !user?.restaurantId },
  );
  const [saveSop] = useSaveSopMutation();
  const [deleteSop] = useDeleteSopMutation();

  const resetSopForm = () =>
    setSopForm({
      id: null,
      title: "",
      category: "",
      menuItemId: "",
      steps: [""],
    });

  const handleSaveSop = async () => {
    const steps = sopForm.steps.map((s) => s.trim()).filter(Boolean);
    if (!sopForm.title.trim() || !steps.length) return;
    try {
      await saveSop({
        id: sopForm.id,
        restaurantId: user.restaurantId,
        branchId: selectedBranch?.id,
        menuItemId: sopForm.menuItemId ? Number(sopForm.menuItemId) : null,
        title: sopForm.title.trim(),
        category: sopForm.category.trim() || null,
        steps,
      }).unwrap();
      setShowSopForm(false);
      resetSopForm();
    } catch {
      // The form stays open and populated so the steps someone just typed are
      // not discarded along with the error.
      alert("Failed to save this SOP checklist");
    }
  };

  const handleEditSop = (sop: any) => {
    setSopForm({
      id: sop.id,
      title: sop.title,
      category: sop.category || "",
      menuItemId: sop.menuItemId ? String(sop.menuItemId) : "",
      steps: Array.isArray(sop.steps) && sop.steps.length ? sop.steps : [""],
    });
    setShowSopForm(true);
  };

  const handleDeleteSop = async (id: number) => {
    if (!window.confirm("Delete this SOP checklist?")) return;
    try {
      await deleteSop(id).unwrap();
    } catch {
      alert("Failed to delete this SOP checklist");
    }
  };

  return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-gray-900">
                    SOP Checklists
                  </h3>
                  <p className="mt-0.5 text-[12px] text-gray-500">
                    Standard operating procedures for prep, portioning and
                    hygiene — optionally tied to a menu item
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetSopForm();
                    setShowSopForm(true);
                  }}
                  className="flex h-10 items-center gap-2 rounded-xl bg-[#b10000] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#950000]"
                >
                  <PlusIcon className="h-4 w-4" /> Add SOP
                </button>
              </div>

              {sopChecklists.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                  <div>
                    <ClipboardDocumentCheckIcon className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-[13px] font-semibold text-gray-600">
                      No SOP checklists yet
                    </p>
                    <p className="mt-1 text-[12px] text-gray-400">
                      Add prep steps, portioning standards or hygiene checklists
                      for your team to follow
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {sopChecklists.map((sop: any) => (
                    <div
                      key={sop.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-[14px] font-bold text-gray-900">
                              {sop.title}
                            </h4>
                            {sop.category && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                                {sop.category}
                              </span>
                            )}
                          </div>
                          {sop.menuItem?.name && (
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              Linked to {sop.menuItem.name}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => handleEditSop(sop)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            <PencilSquareIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSop(sop.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-red-500 hover:bg-red-50"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <ol className="space-y-1.5 px-4 py-3 text-[12px] text-gray-700">
                        {(Array.isArray(sop.steps) ? sop.steps : []).map(
                          (step: string, i: number) => (
                            <li key={i} className="flex gap-2">
                              <span className="font-bold text-gray-400">
                                {i + 1}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ),
                        )}
                      </ol>
                    </div>
                  ))}
                </div>
              )}

              {/* ADD / EDIT SOP MODAL */}
              {showSopForm && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                  onClick={() => setShowSopForm(false)}
                >
                  <div
                    className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[17px] font-bold text-gray-900">
                        {sopForm.id ? "Edit SOP" : "Add SOP Checklist"}
                      </h3>
                      <button
                        onClick={() => setShowSopForm(false)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          Title *
                        </label>
                        <input
                          value={sopForm.title}
                          onChange={(e) =>
                            setSopForm((f) => ({
                              ...f,
                              title: e.target.value,
                            }))
                          }
                          placeholder="e.g. Paneer Butter Masala — Prep SOP"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                            Category
                          </label>
                          <input
                            value={sopForm.category}
                            onChange={(e) =>
                              setSopForm((f) => ({
                                ...f,
                                category: e.target.value,
                              }))
                            }
                            placeholder="Prep / Hygiene / Portioning"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                            Linked Menu Item
                          </label>
                          <select
                            value={sopForm.menuItemId}
                            onChange={(e) =>
                              setSopForm((f) => ({
                                ...f,
                                menuItemId: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          >
                            <option value="">None</option>
                            {menuItems.map((mi: any) => (
                              <option key={mi.id} value={String(mi.id)}>
                                {mi.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          Steps *
                        </label>
                        <div className="space-y-2">
                          {sopForm.steps.map((step, i) => (
                            <div key={i} className="flex gap-2">
                              <input
                                value={step}
                                onChange={(e) =>
                                  setSopForm((f) => ({
                                    ...f,
                                    steps: f.steps.map((s, idx) =>
                                      idx === i ? e.target.value : s,
                                    ),
                                  }))
                                }
                                placeholder={`Step ${i + 1}`}
                                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                              />
                              {sopForm.steps.length > 1 && (
                                <button
                                  onClick={() =>
                                    setSopForm((f) => ({
                                      ...f,
                                      steps: f.steps.filter(
                                        (_, idx) => idx !== i,
                                      ),
                                    }))
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"
                                >
                                  <XMarkIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            setSopForm((f) => ({
                              ...f,
                              steps: [...f.steps, ""],
                            }))
                          }
                          className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#b10000] hover:text-[#950000]"
                        >
                          <PlusIcon className="h-3.5 w-3.5" /> Add Step
                        </button>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setShowSopForm(false)}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSop}
                          className="rounded-xl bg-[#b10000] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#950000]"
                        >
                          Save SOP
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
}
