import { useState } from "react";
import { useAppSelector } from "@/store";
import {
  useGetAddOnGroupsQuery,
  useCreateAddOnGroupMutation,
  useDeleteAddOnGroupMutation,
  useCreateAddOnOptionMutation,
  useDeleteAddOnOptionMutation,
} from "@/store/api/addonsApi";
import { notify } from "@/utils/notify";

/**
 * Add-on groups and their options — "Extra Cheese ₹40" and the like.
 *
 * Lifted out of MenuManagement.tsx for a different reason than the tabs were.
 * Stock Lifecycle and Menu Engineering each owned their data outright, so the
 * fetch moved down with the markup. Add-ons do not: the list is read by the
 * Add-Ons tab, which manages it, *and* by the Menu tab, whose per-item attach
 * modal needs the full set of groups to offer. Neither tab can own it.
 *
 * What is left here after the RTK Query migration is only what is genuinely
 * local: the two draft forms. The list, the fetch and the four refetch-after-
 * write calls are all gone — a mutation invalidates "AddOn" and every reader
 * updates itself.
 *
 * The `activeTab` argument went with them. It existed to reproduce an effect
 * that refetched whenever the tab changed; the cache now decides that, and a
 * tab switch inside the 60-second window serves what it already has.
 */

export interface AddOnOptionDraft {
  name: string;
  price: string;
}

export interface UseAddOns {
  addOnGroups: any[];
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

export function useAddOns(): UseAddOns {
  const { user } = useAppSelector((s) => s.auth);

  const [newGroupName, setNewGroupName] = useState("");
  const [newOptionForm, setNewOptionForm] = useState<
    Record<number, AddOnOptionDraft>
  >({});

  const { data: addOnGroups = [] } = useGetAddOnGroupsQuery(
    user?.restaurantId as number,
    { skip: !user?.restaurantId },
  );

  const [createAddOnGroup] = useCreateAddOnGroupMutation();
  const [deleteAddOnGroup] = useDeleteAddOnGroupMutation();
  const [createAddOnOption] = useCreateAddOnOptionMutation();
  const [deleteAddOnOption] = useDeleteAddOnOptionMutation();

  const createGroup = async () => {
    if (!newGroupName.trim() || !user?.restaurantId) return;
    try {
      await createAddOnGroup({
        restaurantId: user.restaurantId,
        name: newGroupName.trim(),
      }).unwrap();
      setNewGroupName("");
    } catch {
      notify("Failed to create that add-on group");
    }
  };

  const deleteGroup = async (id: number) => {
    if (!window.confirm("Delete this add-on group and all its options?")) return;
    try {
      // Before, the response was never read, so the refetch ran either way — a
      // failed delete showed the group still there with nothing said about why.
      // `.unwrap()` makes a rejection throw, which is what keeps that fixed.
      await deleteAddOnGroup(id).unwrap();
    } catch {
      notify("Failed to delete that add-on group");
    }
  };

  const addOption = async (groupId: number) => {
    const form = newOptionForm[groupId];
    if (!form?.name?.trim() || !form?.price) return;
    try {
      await createAddOnOption({
        addOnGroupId: groupId,
        name: form.name.trim(),
        price: Number(form.price),
      }).unwrap();
      setNewOptionForm((prev) => ({
        ...prev,
        [groupId]: { name: "", price: "" },
      }));
    } catch {
      notify("Failed to add that option");
    }
  };

  const deleteOption = async (id: number) => {
    try {
      await deleteAddOnOption(id).unwrap();
    } catch {
      notify("Failed to delete that option");
    }
  };

  return {
    addOnGroups,
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
