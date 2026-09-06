import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";

/**
 * Add-on groups and their options — "Extra Cheese ₹40" and the like.
 *
 * Lifted out of MenuManagement.tsx for a different reason than the tabs were.
 * Stock Lifecycle and Menu Engineering each owned their data outright, so the
 * fetch moved down with the markup. Add-ons do not: the list is read by the
 * Add-Ons tab, which manages it, *and* by the Menu tab, whose per-item attach
 * modal needs the full set of groups to offer. Neither tab can own it, and
 * threading eight values through both is what this refactor is trying to stop.
 *
 * So it becomes a hook the page holds and hands to whoever needs it.
 *
 * It takes `activeTab` rather than an `enabled` boolean deliberately. The
 * original effect listed `activeTab` in its dependencies, so moving between the
 * two tabs that use add-ons refetched. A boolean would stay `true` across that
 * move and quietly drop the refetch — better behaviour, probably, but this
 * extraction's contract is that behaviour does not change.
 */

export interface AddOnOptionDraft {
  name: string;
  price: string;
}

export interface UseAddOns {
  addOnGroups: any[];
  refresh: () => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  newOptionForm: Record<number, AddOnOptionDraft>;
  setNewOptionForm: React.Dispatch<
    React.SetStateAction<Record<number, AddOnOptionDraft>>
  >;
  createGroup: () => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  addOption: (groupId: number) => Promise<void>;
  deleteOption: (id: number) => Promise<void>;
}

export function useAddOns(activeTab: string): UseAddOns {
  const { user, token } = useAppSelector((s) => s.auth);
  const API_URL = import.meta.env.VITE_API_URL;

  const [addOnGroups, setAddOnGroups] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newOptionForm, setNewOptionForm] = useState<
    Record<number, AddOnOptionDraft>
  >({});

  const fetchAddOnGroups = async () => {
    if (!user?.restaurantId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/addons/groups/${user.restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (data.success) setAddOnGroups(data.data || []);
    } catch {
      /* silent */
    }
  };

  // Needed on both the Add-Ons tab (management) and the Menu tab (the
  // per-item attach modal needs the full group list too).
  useEffect(() => {
    if (activeTab === "addons" || activeTab === "menu") fetchAddOnGroups();
  }, [activeTab, user?.restaurantId]);

  const createGroup = async () => {
    if (!newGroupName.trim() || !user?.restaurantId) return;
    try {
      const res = await fetch(`${API_URL}/api/addons/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId: user.restaurantId,
          name: newGroupName.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewGroupName("");
        fetchAddOnGroups();
      } else {
        alert(data.message || "Failed to create that add-on group");
      }
    } catch {
      alert("Failed to create that add-on group");
    }
  };

  const deleteGroup = async (id: number) => {
    if (!window.confirm("Delete this add-on group and all its options?"))
      return;
    try {
      // The response was never read, so `fetchAddOnGroups()` ran either way —
      // and because it re-renders from the server, a failed delete showed the
      // group still there with nothing said about why.
      const res = await fetch(`${API_URL}/api/addons/groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }
      fetchAddOnGroups();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete that add-on group");
    }
  };

  const addOption = async (groupId: number) => {
    const form = newOptionForm[groupId];
    if (!form?.name?.trim() || !form?.price) return;
    try {
      const res = await fetch(`${API_URL}/api/addons/options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addOnGroupId: groupId,
          name: form.name.trim(),
          price: Number(form.price),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewOptionForm((prev) => ({
          ...prev,
          [groupId]: { name: "", price: "" },
        }));
        fetchAddOnGroups();
      } else {
        alert(data.message || "Failed to add that option");
      }
    } catch {
      alert("Failed to add that option");
    }
  };

  const deleteOption = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/addons/options/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }
      fetchAddOnGroups();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete that option");
    }
  };

  return {
    addOnGroups,
    refresh: fetchAddOnGroups,
    newGroupName,
    setNewGroupName,
    newOptionForm,
    setNewOptionForm,
    createGroup,
    deleteGroup,
    addOption,
    deleteOption,
  };
}
