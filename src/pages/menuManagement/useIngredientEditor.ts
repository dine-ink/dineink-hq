import { useState } from "react";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { loadWorkbook, sheetToJson } from "@/utils/readExcel";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  ingredientsApi,
  useSaveIngredientsMutation,
  useGenerateIngredientsMutation,
  useUpdateIngredientPriceMutation,
  useUploadVendorDataMutation,
  useGetVendorsQuery,
} from "@/store/api/ingredientsApi";
import { notify, notifySuccess } from "@/utils/notify";
import { confirmAction } from "@/utils/confirmAction";

/**
 * The ingredient stock editor: the draft rows people type into, the categories
 * they are grouped under, the vendor price history, and everything that saves.
 *
 * The Ingredients tab borrowed twenty-three values from the page. Unlike Item
 * Mapping these are not one workflow but four -- editing rows, managing
 * categories, importing from a vendor sheet, and the price-history modal -- yet
 * they all read and write the same `ingredients` draft, so splitting them into
 * four hooks would give four hooks sharing one piece of state. They stay
 * together.
 *
 * The page keeps `ingredients` in view because allIngredients is flattened from
 * it and three other tabs read that.
 */

export function useIngredientEditor(
  categories: any[],
  setCategories: (rows: any[]) => void,
  setLoading: (on: boolean) => void,
) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  const [saveIngredients] = useSaveIngredientsMutation();
  const [generateIngredients] = useGenerateIngredientsMutation();
  const [updateIngredientPrice] = useUpdateIngredientPriceMutation();
  const [uploadVendorData] = useUploadVendorDataMutation();
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const API_URL = import.meta.env.VITE_API_URL;

  const [ingredients, setIngredients] = useState<any>({});

  const [uploadingVendor, setUploadingVendor] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [manualCategories, setManualCategories] = useState<Set<string>>(
    new Set(),
  );

  const [priceHistoryModal, setPriceHistoryModal] = useState<{
    open: boolean;
    ingredientId: number | null;
    ingredientName: string;
    category: string;
    index: number;
    history: any[];
    newPrice: string;
    loading: boolean;
  }>({
    open: false,
    ingredientId: null,
    ingredientName: "",
    category: "",
    index: -1,
    history: [],
    newPrice: "",
    loading: false,
  });

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const suggested = await generateIngredients({
        restaurantId: user.restaurantId,
      }).unwrap();
      const formatted = Object.fromEntries(
        Object.entries(suggested).map(([category, items]) => [
          category,
          (items as string[]).map((item) => ({
            name: item,
            quantity: "",
            unit: "Kg",
            purchasePrice: "",
            pricePerUnit: "",
          })),
        ]),
      );
      setIngredients(formatted);
    } catch {
      notify("Couldn't generate an ingredient list");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Nothing checked this before, so saving with no branch selected threw
    // while building the request body — the ingredients were silently not
    // saved and the swallowed catch below meant no error was shown either.
    if (!selectedBranch?.id) {
      notify("Please select a branch", "warning");
      return;
    }
    try {
      await saveIngredients({
        restaurantId: user.restaurantId,
        branchId: selectedBranch.id,
        ingredients,
      }).unwrap();
      notifySuccess("Ingredients saved successfully");
    } catch {
      // Success alerted; failure did not. Pressing Save and getting no response
      // at all is indistinguishable from the click missing.
      notify("Failed to save these ingredients");
    }
  };

  const openPriceHistory = async (
    category: string,
    index: number,
    ingredient: any,
  ) => {
    if (!ingredient?.id) return;
    setPriceHistoryModal({
      open: true,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      category,
      index,
      history: [],
      newPrice: "",
      loading: true,
    });
    try {
      // Imperative rather than a hook query: it is per-ingredient and only
      // wanted while the modal is open. `initiate` uses the same cache, so
      // reopening the same ingredient is free — it was a fresh request every
      // time before.
      const history = await dispatch(
        ingredientsApi.endpoints.getIngredientPriceHistory.initiate(ingredient.id),
      ).unwrap();
      setPriceHistoryModal((prev) => ({ ...prev, history, loading: false }));
    } catch {
      setPriceHistoryModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateIngredientPrice = async () => {
    const { ingredientId, newPrice, category, index } = priceHistoryModal;
    if (!ingredientId || !newPrice || Number(newPrice) <= 0) return;
    try {
      await updateIngredientPrice({
        ingredientId,
        restaurantId: user.restaurantId,
        newPrice: Number(newPrice),
      }).unwrap();
      // Patch just the one price. Re-seeding the whole draft from the server
      // would discard any other rows being edited — see the note on this
      // mutation's invalidatesTags.
      setIngredients((prev: any) => {
        const updated = { ...prev };
        if (updated[category]?.[index]) {
          updated[category][index] = {
            ...updated[category][index],
            pricePerUnit: Number(newPrice),
          };
        }
        return updated;
      });
      openPriceHistory(category, index, {
        id: ingredientId,
        name: priceHistoryModal.ingredientName,
      });
    } catch {
      // An ingredient price feeds every recipe's food cost, so a change that
      // silently didn't take leaves margins computed on the old figure.
      notify("Failed to record that price change");
    }
  };

  const handleRemoveIngredient = (category: string, index: number) => {
    setIngredients((prev: any) => {
      const updated = { ...prev };
      updated[category] = updated[category].filter(
        (_: any, i: number) => i !== index,
      );
      return updated;
    });
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (ingredients[name] !== undefined) {
      notify("Category already exists", "warning");
      return;
    }
    setIngredients((prev: any) => ({ ...prev, [name]: [] }));
    setManualCategories((prev) => new Set(prev).add(name));
    setNewCategoryName("");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = async (category: string) => {
    const confirmed = await confirmAction({
      title: `Delete the "${category}" category?`,
      message: "Every ingredient in it will be removed from this draft.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setIngredients((prev: any) => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
  };

  const handleAddIngredient = (category: string) => {
    setIngredients((prev: any) => ({
      ...prev,
      [category]: [
        ...prev[category],
        {
          name: "",
          quantity: "",
          unit: "Kg",
          purchasePrice: "",
          pricePerUnit: "",
        },
      ],
    }));
  };

  const handleFieldChange = (
    category: string,
    index: number,
    field: string,
    value: any,
  ) => {
    setIngredients((prev: any) => {
      const updated = { ...prev };
      updated[category][index][field] = value;
      const item = updated[category][index];
      const qty = Number(item.quantity);
      const price = Number(item.purchasePrice);
      if (qty > 0 && price > 0) {
        item.pricePerUnit = (price / qty).toFixed(2);
      }
      return { ...updated };
    });
  };

  const downloadVendorTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Vendors");

    worksheet.columns = [
      {
        header: "Vendor Name",
        key: "name",
        width: 30,
      },
      {
        header: "Address",
        key: "address",
        width: 40,
      },
      {
        header: "Phone Number",
        key: "phone",
        width: 20,
      },
    ];

    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.addRow({
      name: "ABC Traders",
      address: "Chennai",
      phone: "9876543210",
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "vendor-template.xlsx");
  };
  const handleVendorUpload = async (e: any) => {
    try {
      const file = e.target.files[0];

      if (!file) return;

      setUploadingVendor(true);

      const reader = new FileReader();

      reader.onload = async (evt: any) => {
        try {
          const data = new Uint8Array(evt.target.result);

          const workbook = await loadWorkbook(data);

          const worksheet = workbook.worksheets[0];

          const jsonData: any = sheetToJson(worksheet);

          await uploadVendorData({
            restaurantId: user.restaurantId,
            branchId: selectedBranch?.id,
            vendors: jsonData,
          }).unwrap();
          // The vendor list refreshes from the tag; no hand-written refetch.
          notifySuccess(`Vendor upload successful (${jsonData.length} vendors)`);
        } catch {
          notify("Failed to process vendor file");
        } finally {
          setUploadingVendor(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch {
      setUploadingVendor(false);
      notify("Vendor upload failed");
    }
  };

  // Was fetched in an effect with an empty dependency array, so switching
  // branches left the previous branch's vendors on screen. The query is keyed
  // on the branch, so it follows the selection.
  const { data: vendors = [] } = useGetVendorsQuery(
    { restaurantId: user?.restaurantId as number, branchId: selectedBranch?.id as number },
    { skip: !user?.restaurantId || !selectedBranch?.id },
  );

  return {
    ingredients,
    setIngredients,
    uploadingVendor,
    setUploadingVendor,
    showAddCategory,
    setShowAddCategory,
    newCategoryName,
    setNewCategoryName,
    manualCategories,
    setManualCategories,
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
  };
}

export type UseIngredientEditor = ReturnType<typeof useIngredientEditor>;
