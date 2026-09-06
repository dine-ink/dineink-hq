import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import { loadWorkbook, sheetToJson } from "@/utils/readExcel";
import { useAppSelector } from "@/store";

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
  const { user, token } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);
  const API_URL = import.meta.env.VITE_API_URL;

  const [ingredients, setIngredients] = useState<any>({});

  const [uploadingVendor, setUploadingVendor] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [manualCategories, setManualCategories] = useState<Set<string>>(
    new Set(),
  );

  const [vendors, setVendors] = useState<any[]>([]);
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

      const res = await fetch(
        `${API_URL}/api/ingredients/generateIngredients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            restaurantId: user.restaurantId,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        const formatted = Object.fromEntries(
          Object.entries(data.data).map(([category, items]) => [
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
      } else {
        alert(data.message || "Couldn't generate an ingredient list");
      }
    } catch {
      alert("Couldn't generate an ingredient list");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Nothing checked this before, so saving with no branch selected threw
    // while building the request body — the ingredients were silently not
    // saved and the swallowed catch below meant no error was shown either.
    if (!selectedBranch?.id) {
      alert("Please select a branch");
      return;
    }
    try {
      const restaurantId = user.restaurantId;
      const res = await fetch(`${API_URL}/api/ingredients/saveIngredients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantId,
          branchId: selectedBranch.id,
          ingredients,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Ingredients saved successfully");
      } else {
        // Success alerted; failure did not. Pressing Save and getting no
        // response at all is indistinguishable from the click missing.
        alert(data.message || "Failed to save these ingredients");
      }
    } catch {
      alert("Failed to save these ingredients");
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
      const res = await fetch(
        `${API_URL}/api/ingredients/price-history/${ingredient.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setPriceHistoryModal((prev) => ({
        ...prev,
        history: data.success ? data.data || [] : [],
        loading: false,
      }));
    } catch {
      setPriceHistoryModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleUpdateIngredientPrice = async () => {
    const { ingredientId, newPrice, category, index } = priceHistoryModal;
    if (!ingredientId || !newPrice || Number(newPrice) <= 0) return;
    try {
      const res = await fetch(`${API_URL}/api/ingredients/price-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredientId,
          restaurantId: user.restaurantId,
          newPrice: Number(newPrice),
        }),
      });
      const data = await res.json();
      if (data.success) {
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
      } else {
        // An ingredient price feeds every recipe's food cost, so a price change
        // that silently didn't take leaves margins computed on the old figure.
        alert(data.message || "Failed to record that price change");
      }
    } catch {
      alert("Failed to record that price change");
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
      alert("Category already exists");
      return;
    }
    setIngredients((prev: any) => ({ ...prev, [name]: [] }));
    setManualCategories((prev) => new Set(prev).add(name));
    setNewCategoryName("");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = (category: string) => {
    if (
      !window.confirm(`Delete category "${category}" and all its ingredients?`)
    )
      return;
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

          const res = await fetch(
            `${API_URL}/api/ingredients/uploadVendorData`,
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",

                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                restaurantId: user.restaurantId,

                branchId: selectedBranch?.id,

                vendors: jsonData,
              }),
            },
          );

          const result = await res.json();

          if (result.success) {
            alert(`Vendor upload successful (${jsonData.length} vendors)`);
            await fetchVendors();
          } else {
            alert(result.message || "Vendor upload failed");
          }
        } catch {
          alert("Failed to process vendor file");
        } finally {
          setUploadingVendor(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch {
      setUploadingVendor(false);
      alert("Vendor upload failed");
    }
  };

  const fetchVendors = async () => {
    try {
      if (!selectedBranch?.id) {
        return;
      }

      const res = await fetch(
        `${API_URL}/api/ingredients/${user.restaurantId}/${selectedBranch.id}/fetchVendors`,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await res.json();

      if (result.success) {
        setVendors(result.data || []);
      }
    } catch {
      // fetch error
    }
  };
  useEffect(() => {
    fetchVendors();
  }, []);

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
    setVendors,
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
    vendorsRefresh: fetchVendors,
  };
}

export type UseIngredientEditor = ReturnType<typeof useIngredientEditor>;
