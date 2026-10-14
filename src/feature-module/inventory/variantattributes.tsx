import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";
import { useBusiness } from "../../context/BusinessContext";
import { Edit, Trash2 } from "lucide-react";
import { Popover } from "antd";

interface VariantAttributeItem { 
  id: string;
  variant: string;
  values: string;
  values_array: string[];
  patterns?: string;
  patterns_array?: string[];
  pattern_images?: Record<string, string>;
  createdon: string;
  status: string;
  business_id?: string;
  business_ids?: string[];
  business_name?: string;
  display_business?: string;
  is_mapped_to_both?: boolean;
  raw: any;
}

export const isColorVariant = (name: string): boolean => {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return (
    clean === "colour" ||
    clean === "colours" ||
    clean === "color" ||
    clean === "colors" ||
    clean.startsWith("colour") ||
    clean.startsWith("color")
  );
};

export const canUploadPatternImage = (
  bizIds: string[],
  availableBusinesses: { id: string }[]
): boolean => {
  if (!bizIds || bizIds.length === 0) return false;
  if (
    bizIds.includes("all") ||
    (availableBusinesses.length > 0 && bizIds.length === availableBusinesses.length)
  ) {
    return true;
  }
  return bizIds.includes("nikhlesh-nursery");
};

const VariantAttributes: React.FC = () => {
  const { businesses: contextBusinesses, businessId: currentActiveBiz } = useBusiness();

  // Fallback list of businesses if context not yet loaded
  const defaultBusinesses = useMemo(
    () => [
      { id: "grow-naturals", name: "Grow Naturals" },
      { id: "nikhlesh-nursery", name: "Nikhlesh Nursery" },
    ],
    []
  );

  const availableBusinesses = useMemo(() => {
    const list = (contextBusinesses || []).filter(
      (b) => b.id && b.id !== "all" && b.id !== "combined"
    );
    return list.length > 0 ? list : defaultBusinesses;
  }, [contextBusinesses, defaultBusinesses]);

  const [variantList, setVariantList] = useState<VariantAttributeItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rows, setRows] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Add Form state
  const [variantName, setVariantName] = useState("");
  const [addValuesList, setAddValuesList] = useState<string[]>([]);
  const [addSingleValueInput, setAddSingleValueInput] = useState("");
  const [addPatternsList, setAddPatternsList] = useState<string[]>([]);
  const [addSinglePatternInput, setAddSinglePatternInput] = useState("");
  const [addPatternImages, setAddPatternImages] = useState<Record<string, string>>({});
  const [addCurrentPatternImage, setAddCurrentPatternImage] = useState<string | null>(null);
  const addPatternFileInputRef = useRef<HTMLInputElement | null>(null);
  const [variantStatus, setVariantStatus] = useState(true);
  const [selectedBizIds, setSelectedBizIds] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Edit Form state
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [editVariantName, setEditVariantName] = useState("");
  const [editValuesList, setEditValuesList] = useState<string[]>([]);
  const [editSingleValueInput, setEditSingleValueInput] = useState("");
  const [editPatternsList, setEditPatternsList] = useState<string[]>([]);
  const [editSinglePatternInput, setEditSinglePatternInput] = useState("");
  const [editPatternImages, setEditPatternImages] = useState<Record<string, string>>({});
  const [editCurrentPatternImage, setEditCurrentPatternImage] = useState<string | null>(null);
  const editPatternFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editVariantStatus, setEditVariantStatus] = useState(true);
  const [editSelectedBizIds, setEditSelectedBizIds] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Delete state
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

  const activeBusiness = currentActiveBiz || getActiveBusinessId() || "all";

  // Helper: check if a variant attribute belongs to a business
  const isMappedToBiz = useCallback((item: VariantAttributeItem, bizId: string) => {
    if (bizId === "all") return true;
    if (item.business_id === "all" || item.is_mapped_to_both) return true;
    if (item.business_id === bizId) return true;
    if (Array.isArray(item.business_ids) && item.business_ids.includes(bizId)) return true;
    return false;
  }, []);

  // Fetch variant attributes from backend (fetch all so tab switching is instantaneous)
  const fetchVariants = useCallback(async () => {
    try {
      const data = await api.get("/variant-attributes", { business_id: "all" });
      const mapped: VariantAttributeItem[] = (Array.isArray(data) ? data : []).map((va: any) => {
        const valStr = va.values || "";
        const valArr = valStr
          ? valStr.split(",").map((v: string) => v.trim()).filter((v: string) => v.length > 0)
          : [];

        const patStr = va.patterns || "";
        const patArr = patStr
          ? patStr.split(",").map((p: string) => p.trim()).filter((p: string) => p.length > 0)
          : [];

        const bIds = Array.isArray(va.business_ids)
          ? va.business_ids
          : typeof va.business_ids === "string"
          ? JSON.parse(va.business_ids)
          : [va.business_id];

        const isBoth = va.business_id === "all" || bIds.length >= 2;

        let pImages: Record<string, string> = {};
        if (va.pattern_images) {
          if (typeof va.pattern_images === "object" && va.pattern_images !== null) {
            pImages = va.pattern_images;
          } else if (typeof va.pattern_images === "string") {
            try {
              pImages = JSON.parse(va.pattern_images);
            } catch {
              pImages = {};
            }
          }
        }

        return {
          id: va.id,
          variant: va.name || "",
          values: valStr,
          values_array: valArr,
          patterns: patStr,
          patterns_array: patArr,
          pattern_images: pImages,
          createdon: va.created_at
            ? new Date(va.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "N/A",
          status: va.status || "Active",
          business_id: va.business_id,
          business_ids: bIds,
          business_name: va.business_name,
          display_business: va.display_business || (isBoth ? "Both Businesses" : va.business_name),
          is_mapped_to_both: isBoth,
          raw: va,
        };
      });
      setVariantList(mapped);
    } catch (err: any) {
      console.error("Failed to fetch variant attributes:", err);
    }
  }, []);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // Animated underline tab indicator state
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current[businessFilter];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [businessFilter]);

  useEffect(() => {
    // Small timeout to ensure DOM layout has completed
    const t = setTimeout(updateIndicator, 0);
    return () => clearTimeout(t);
  }, [updateIndicator, availableBusinesses]);

  useEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Pattern image file change handlers
  const handleAddPatternImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAddError("Please select an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAddError("Image size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAddCurrentPatternImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditPatternImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEditError("Please select an image file (PNG, JPG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError("Image size must be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditCurrentPatternImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Reset & prepare Add Modal
  const handleOpenAddModal = () => {
    setVariantName("");
    setAddValuesList([]);
    setAddSingleValueInput("");
    setAddPatternsList([]);
    setAddSinglePatternInput("");
    setAddPatternImages({});
    setAddCurrentPatternImage(null);
    if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
    setVariantStatus(true);
    setAddError(null);

    // Default business mapping based on current tab filter or active business
    if (businessFilter !== "all") {
      setSelectedBizIds([businessFilter]);
    } else if (activeBusiness && activeBusiness !== "all" && activeBusiness !== "combined") {
      setSelectedBizIds([activeBusiness]);
    } else {
      // Default to both businesses
      setSelectedBizIds(availableBusinesses.map((b) => b.id));
    }
  };

  // Add values handlers (one by one)
  const handleAddSingleValue = () => {
    if (!addSingleValueInput.trim()) return;
    const parts = addSingleValueInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return;

    setAddValuesList((prev) => {
      const existing = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = parts.filter((p) => !existing.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setAddSingleValueInput("");
  };

  const handleRemoveSingleValue = (indexToRemove: number) => {
    setAddValuesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Add patterns handlers (one by one)
  const handleAddSinglePattern = () => {
    if (!addSinglePatternInput.trim()) return;
    const parts = addSinglePatternInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return;

    setAddPatternsList((prev) => {
      const existing = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = parts.filter((p) => !existing.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });

    // If an image was attached for this pattern, store it
    if (addCurrentPatternImage) {
      setAddPatternImages((prev) => {
        const next = { ...prev };
        parts.forEach((p) => {
          next[p] = addCurrentPatternImage;
        });
        return next;
      });
      setAddCurrentPatternImage(null);
      if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
    }

    setAddSinglePatternInput("");
  };

  const handleRemoveSinglePattern = (indexToRemove: number) => {
    const patName = addPatternsList[indexToRemove];
    setAddPatternsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (patName) {
      setAddPatternImages((prev) => {
        const next = { ...prev };
        delete next[patName];
        return next;
      });
    }
  };

  // Edit values handlers (one by one)
  const handleEditAddSingleValue = () => {
    if (!editSingleValueInput.trim()) return;
    const parts = editSingleValueInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return;

    setEditValuesList((prev) => {
      const existing = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = parts.filter((p) => !existing.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setEditSingleValueInput("");
  };

  const handleEditRemoveSingleValue = (indexToRemove: number) => {
    setEditValuesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Edit patterns handlers (one by one)
  const handleEditAddSinglePattern = () => {
    if (!editSinglePatternInput.trim()) return;
    const parts = editSinglePatternInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return;

    setEditPatternsList((prev) => {
      const existing = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = parts.filter((p) => !existing.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });

    if (editCurrentPatternImage) {
      setEditPatternImages((prev) => {
        const next = { ...prev };
        parts.forEach((p) => {
          next[p] = editCurrentPatternImage;
        });
        return next;
      });
      setEditCurrentPatternImage(null);
      if (editPatternFileInputRef.current) editPatternFileInputRef.current.value = "";
    }

    setEditSinglePatternInput("");
  };

  const handleEditRemoveSinglePattern = (indexToRemove: number) => {
    const patName = editPatternsList[indexToRemove];
    setEditPatternsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (patName) {
      setEditPatternImages((prev) => {
        const next = { ...prev };
        delete next[patName];
        return next;
      });
    }
  };

  // Toggle business selection for Add
  const handleToggleAddBiz = (id: string) => {
    setSelectedBizIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((b) => b !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleAddAllBiz = () => {
    if (selectedBizIds.length === availableBusinesses.length) {
      setSelectedBizIds([]);
    } else {
      setSelectedBizIds(availableBusinesses.map((b) => b.id));
    }
  };

  // Toggle business selection for Edit
  const handleToggleEditBiz = (id: string) => {
    setEditSelectedBizIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((b) => b !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleEditAllBiz = () => {
    if (editSelectedBizIds.length === availableBusinesses.length) {
      setEditSelectedBizIds([]);
    } else {
      setEditSelectedBizIds(availableBusinesses.map((b) => b.id));
    }
  };

  // Add Variant Attribute
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!variantName.trim()) {
      setAddError("Variant attribute name is required.");
      return;
    }

    // Include any pending single value input
    let finalValues = [...addValuesList];
    if (addSingleValueInput.trim()) {
      const pendingParts = addSingleValueInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existing = new Set(finalValues.map((p) => p.toLowerCase()));
      const toAdd = pendingParts.filter((p) => !existing.has(p.toLowerCase()));
      finalValues = [...finalValues, ...toAdd];
    }

    if (finalValues.length === 0) {
      setAddError("Please add at least one value to the list.");
      return;
    }

    if (selectedBizIds.length === 0) {
      setAddError("Please map this variant to at least one business (or select Both).");
      return;
    }

    let finalPatterns = [...addPatternsList];
    let finalPatternImages = { ...addPatternImages };
    if (addSinglePatternInput.trim()) {
      const pendingParts = addSinglePatternInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existing = new Set(finalPatterns.map((p) => p.toLowerCase()));
      const toAdd = pendingParts.filter((p) => !existing.has(p.toLowerCase()));
      finalPatterns = [...finalPatterns, ...toAdd];
      if (addCurrentPatternImage) {
        toAdd.forEach((p) => {
          finalPatternImages[p] = addCurrentPatternImage;
        });
      }
    }

    setIsAdding(true);
    try {
      await api.post("/variant-attributes", {
        name: variantName.trim(),
        values: finalValues.join(", "),
        patterns: isColorVariant(variantName) ? finalPatterns.join(", ") : "",
        pattern_images: isColorVariant(variantName) ? finalPatternImages : {},
        status: variantStatus ? "Active" : "Inactive",
        business_ids: selectedBizIds,
      });

      // Reset form
      setVariantName("");
      setAddValuesList([]);
      setAddSingleValueInput("");
      setAddPatternsList([]);
      setAddSinglePatternInput("");
      setAddPatternImages({});
      setAddCurrentPatternImage(null);
      if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
      setVariantStatus(true);
      setAddError(null);

      // Dismiss modal
      const modal = document.getElementById("add-variant");
      const closeBtn = modal?.querySelector('[data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();

      await fetchVariants();
    } catch (err: any) {
      setAddError(err.message || "Failed to create variant attribute.");
    } finally {
      setIsAdding(false);
    }
  };

  // Start Edit
  const handleStartEdit = (row: VariantAttributeItem) => {
    setEditingVariant(row.raw);
    setEditVariantName(row.raw.name || "");

    const vList = (row.raw.values || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    setEditValuesList(vList);
    setEditSingleValueInput("");

    const pList = (row.patterns || row.raw.patterns || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
    setEditPatternsList(pList);
    setEditSinglePatternInput("");
    setEditPatternImages(row.pattern_images ? { ...row.pattern_images } : {});
    setEditCurrentPatternImage(null);
    if (editPatternFileInputRef.current) editPatternFileInputRef.current.value = "";

    setEditVariantStatus(row.raw.status === "Active");

    let bIds = row.business_ids || [];
    if (!bIds || bIds.length === 0) {
      bIds = row.business_id === "all" ? availableBusinesses.map((b) => b.id) : (row.business_id ? [row.business_id] : []);
    } else if (row.business_id === "all") {
      bIds = availableBusinesses.map((b) => b.id);
    }
    setEditSelectedBizIds(bIds);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    setEditError(null);

    if (!editVariantName.trim()) {
      setEditError("Variant attribute name is required.");
      return;
    }

    let finalValues = [...editValuesList];
    if (editSingleValueInput.trim()) {
      const pendingParts = editSingleValueInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existing = new Set(finalValues.map((p) => p.toLowerCase()));
      const toAdd = pendingParts.filter((p) => !existing.has(p.toLowerCase()));
      finalValues = [...finalValues, ...toAdd];
    }

    if (finalValues.length === 0) {
      setEditError("Please add at least one value to the list.");
      return;
    }

    if (editSelectedBizIds.length === 0) {
      setEditError("Please map this variant to at least one business (or select Both).");
      return;
    }

    let finalPatterns = [...editPatternsList];
    let finalPatternImages = { ...editPatternImages };
    if (editSinglePatternInput.trim()) {
      const pendingParts = editSinglePatternInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existing = new Set(finalPatterns.map((p) => p.toLowerCase()));
      const toAdd = pendingParts.filter((p) => !existing.has(p.toLowerCase()));
      finalPatterns = [...finalPatterns, ...toAdd];
      if (editCurrentPatternImage) {
        toAdd.forEach((p) => {
          finalPatternImages[p] = editCurrentPatternImage;
        });
      }
    }

    setIsEditing(true);
    try {
      await api.put(`/variant-attributes/${editingVariant.id}`, {
        name: editVariantName.trim(),
        values: finalValues.join(", "),
        patterns: isColorVariant(editVariantName) ? finalPatterns.join(", ") : "",
        pattern_images: isColorVariant(editVariantName) ? finalPatternImages : {},
        status: editVariantStatus ? "Active" : "Inactive",
        business_ids: editSelectedBizIds,
      });

      setEditingVariant(null);
      setEditError(null);

      // Dismiss modal
      const modal = document.getElementById("edit-variant");
      const closeBtn = modal?.querySelector('[data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();

      await fetchVariants();
    } catch (err: any) {
      setEditError(err.message || "Failed to update variant attribute.");
    } finally {
      setIsEditing(false);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!deleteVariantId) return;
    try {
      await api.delete(`/variant-attributes/${deleteVariantId}`);
      setDeleteVariantId(null);

      // Dismiss modal
      const modal = document.getElementById("delete-modal");
      const closeBtn = modal?.querySelector('[data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();

      await fetchVariants();
    } catch (err: any) {
      alert(err.message || "Failed to delete variant attribute.");
    }
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return variantList.filter((item) => {
      // Business tab filter
      if (!isMappedToBiz(item, businessFilter)) {
        return false;
      }
      // Status filter
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery && searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.variant.toLowerCase().includes(query);
        const matchesValues = item.values.toLowerCase().includes(query);
        const matchesDate = item.createdon.toLowerCase().includes(query);
        const matchesBiz = (item.display_business || "").toLowerCase().includes(query);
        return matchesName || matchesValues || matchesDate || matchesBiz;
      }
      return true;
    });
  }, [variantList, businessFilter, statusFilter, searchQuery, isMappedToBiz]);

  // Preview helper for comma-separated values in modals
  const renderPreviewPills = (valStr: string) => {
    const list = valStr
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (list.length === 0) return null;
    return (
      <div className="d-flex flex-wrap gap-1 mt-2">
        {list.map((tag, idx) => (
          <span
            key={idx}
            className="badge bg-primary-transparent text-primary border border-primary-light px-2 py-1 fs-12 fw-medium rounded-pill"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Preview helper for patterns
  const renderPatternPills = (valStr: string) => {
    const list = valStr
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (list.length === 0) return null;
    return (
      <div className="d-flex flex-wrap gap-1 mt-2">
        {list.map((tag, idx) => (
          <span
            key={idx}
            className="badge px-2 py-1 fs-12 fw-medium rounded-pill d-inline-flex align-items-center gap-1"
            style={{
              backgroundColor: "rgba(111, 66, 193, 0.12)",
              color: "#6f42c1",
              border: "1px solid rgba(111, 66, 193, 0.3)",
            }}
          >
            <i className="ti ti-palette fs-12" />
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Helper to retrieve mapped business names for a row
  const getMappedBizNames = useCallback((rowData: VariantAttributeItem): string[] => {
    const isBoth =
      rowData.is_mapped_to_both ||
      rowData.business_id === "all" ||
      (Array.isArray(rowData.business_ids) && rowData.business_ids.length >= 2);

    if (isBoth) {
      return availableBusinesses.map((b) => b.name);
    }

    const ids = Array.isArray(rowData.business_ids) && rowData.business_ids.length > 0
      ? rowData.business_ids
      : [rowData.business_id || ""];

    const names = ids
      .map((id) => {
        const match = availableBusinesses.find((b) => b.id === id);
        if (match) return match.name;
        if (id === "grow-naturals") return "Grow Naturals";
        if (id === "nikhlesh-nursery") return "Nikhlesh Nursery";
        return rowData.business_name || rowData.display_business || id;
      })
      .filter(Boolean);

    return names.length > 0 ? names : ["All Businesses"];
  }, [availableBusinesses]);

  // Helper to render GN, NN or Multi Business avatar icon
  const renderVariantAvatar = (rowData: VariantAttributeItem) => {
    const isBoth =
      rowData.is_mapped_to_both ||
      rowData.business_id === "all" ||
      (Array.isArray(rowData.business_ids) && rowData.business_ids.length >= 2);

    if (isBoth) {
      return (
        <div
          className="avatar avatar-sm rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold fs-11 flex-shrink-0"
          style={{
            backgroundColor: "#fff8f5",
            color: "#e04f16",
            border: "1px solid #ea5455",
            width: "32px",
            height: "32px",
          }}
          title="Multi Business"
        >
          <i className="ti ti-layers-intersect fs-16" />
        </div>
      );
    }

    const bizId = rowData.business_ids?.[0] || rowData.business_id || "";
    const bizName = (rowData.display_business || rowData.business_name || "").toLowerCase();

    const isGrowNaturals = bizId === "grow-naturals" || bizName.includes("grow");
    const isNikhlesh = bizId === "nikhlesh-nursery" || bizName.includes("nikhlesh");

    if (isGrowNaturals) {
      return (
        <div
          className="avatar avatar-sm rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold fs-11 flex-shrink-0"
          style={{
            backgroundColor: "rgba(18, 122, 60, 0.12)",
            color: "#127a3c",
            border: "1px solid rgba(18, 122, 60, 0.3)",
            width: "32px",
            height: "32px",
          }}
          title="Grow Naturals"
        >
          GN
        </div>
      );
    }

    if (isNikhlesh) {
      return (
        <div
          className="avatar avatar-sm rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold fs-11 flex-shrink-0"
          style={{
            backgroundColor: "rgba(13, 110, 253, 0.12)",
            color: "#0d6efd",
            border: "1px solid rgba(13, 110, 253, 0.3)",
            width: "32px",
            height: "32px",
          }}
          title="Nikhlesh Nursery"
        >
          NN
        </div>
      );
    }

    const fallback = (rowData.display_business || rowData.business_name || "VA")
      .split(" ")
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <div
        className="avatar avatar-sm rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold fs-11 flex-shrink-0 bg-light text-dark border"
        style={{ width: "32px", height: "32px" }}
        title={rowData.display_business || rowData.business_name || "Variant"}
      >
        {fallback}
      </div>
    );
  };

  const columns = [
    {
      field: "variant",
      header: "Variant",
      key: "variant",
      sortable: true,
      body: (rowData: VariantAttributeItem) => {
        const isBoth =
          rowData.is_mapped_to_both ||
          rowData.business_id === "all" ||
          (rowData.business_ids && rowData.business_ids.length >= 2);

        const mappedNames = getMappedBizNames(rowData);

        return (
          <div className="d-flex align-items-center">
            {renderVariantAvatar(rowData)}
            <div>
              <span className="fw-semibold text-dark fs-14 d-block">{rowData.variant}</span>

              {/* Only show Multi Business badge when mapped to multiple businesses */}
              {isBoth && (
                <div className="mt-1 d-inline-block">
                  <Popover
                    trigger="click"
                    placement="bottomLeft"
                    title={
                      <div className="pb-1 border-bottom fs-11 text-muted fw-bold text-uppercase">
                        Mapped Stores ({mappedNames.length})
                      </div>
                    }
                    content={
                      <div style={{ minWidth: "190px" }}>
                        <div className="d-flex flex-column gap-1 pt-1">
                          {mappedNames.map((name, idx) => {
                            const isGN = name.toLowerCase().includes("grow");
                            return (
                              <div key={idx} className="d-flex align-items-center gap-2 text-dark py-1">
                                <span
                                  className="badge rounded-pill fs-10 px-2 py-0.5 fw-semibold"
                                  style={{
                                    backgroundColor: isGN ? "rgba(18, 122, 60, 0.15)" : "rgba(13, 110, 253, 0.12)",
                                    color: isGN ? "#127a3c" : "#0d6efd",
                                  }}
                                >
                                  {isGN ? "GN" : "NN"}
                                    </span>
                                    <span className="fw-medium fs-13">{name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        }
                      >
                        <span
                          className="badge fs-11 fw-semibold px-2 py-0.5 d-inline-flex align-items-center gap-1"
                          style={{
                            cursor: "pointer",
                            backgroundColor: "#fff8f5",
                            color: "#e04f16",
                            border: "1px solid #ea5455",
                            borderRadius: "6px",
                          }}
                        >
                          <i className="ti ti-layers-intersect fs-12" style={{ color: "#e04f16" }} />
                          <span style={{ color: "#e04f16" }}>Multi Business</span>
                          <i className="ti ti-info-circle fs-11 opacity-75" style={{ color: "#e04f16" }} />
                        </span>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>
            );
          },
        },
        {
          field: "values",
          header: "Values",
          key: "values",
          sortable: true,
          body: (rowData: VariantAttributeItem) => {
            const isColor = isColorVariant(rowData.variant);
            return (
              <div className="d-flex flex-column gap-1" style={{ maxWidth: "420px" }}>
                <div className="d-flex flex-wrap gap-1 align-items-center">
                  {isColor && (
                    <span className="text-muted fs-11 fw-semibold me-1">Colors:</span>
                  )}
                  {rowData.values_array.length > 0 ? (
                    rowData.values_array.map((val, idx) => (
                      <span
                        key={idx}
                        className="badge bg-light text-dark border px-2 py-1 rounded-pill fs-11 fw-normal"
                      >
                        {val}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted fs-12">—</span>
                  )}
                </div>

                {isColor && rowData.patterns && (
                  <div className="d-flex flex-wrap gap-1 align-items-center mt-1">
                    <span className="text-muted fs-11 fw-semibold me-1">Patterns:</span>
                    {rowData.patterns_array && rowData.patterns_array.length > 0 ? (
                      rowData.patterns_array.map((pat, idx) => {
                        const patImg = rowData.pattern_images?.[pat];
                        return (
                          <span
                            key={idx}
                            className="badge px-2 py-0.5 rounded-pill fs-11 fw-normal d-inline-flex align-items-center gap-1"
                            style={{
                              backgroundColor: "rgba(111, 66, 193, 0.1)",
                              color: "#6f42c1",
                              border: "1px solid rgba(111, 66, 193, 0.25)",
                            }}
                          >
                            {patImg ? (
                              <Popover
                                title={pat}
                                content={
                                  <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                    <img
                                      src={patImg}
                                      alt={pat}
                                      style={{
                                        width: "100%",
                                        maxHeight: "140px",
                                        objectFit: "contain",
                                        borderRadius: "4px",
                                      }}
                                    />
                                  </div>
                                }
                              >
                                <img
                                  src={patImg}
                                  alt={pat}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    border: "1px solid rgba(111, 66, 193, 0.35)",
                                  }}
                                />
                              </Popover>
                            ) : (
                              <i className="ti ti-palette fs-10" />
                            )}
                            {pat}
                          </span>
                        );
                      })
                    ) : null}
                  </div>
                )}
              </div>
            );
          },
        },
        {
          field: "createdon",
          header: "Created On",
          key: "createdon",
          sortable: true,
          body: (rowData: VariantAttributeItem) => (
            <span className="text-muted fs-13">{rowData.createdon}</span>
          ),
        },
        {
          field: "status",
          header: "Status",
          key: "status",
          sortable: true,
          body: (rowData: VariantAttributeItem) => (
            <span
              className={`badge table-badge fw-medium fs-10 ${
                rowData.status === "Active" ? "bg-success" : "bg-danger"
              }`}
            >
              {rowData.status}
            </span>
          ),
        },
        {
          header: "",
          field: "actions",
          key: "actions",
          sortable: false,
          body: (row: VariantAttributeItem) => (
            <div className="edit-delete-action d-flex align-items-center">
              <Link
                className="me-2 d-flex align-items-center justify-content-center border rounded hover-primary bg-white"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#edit-variant"
                onClick={() => handleStartEdit(row)}
                title="Edit Variant"
                style={{ width: "32px", height: "32px" }}
              >
                <Edit size={16} className="text-primary" />
              </Link>
              <Link
                className="d-flex align-items-center justify-content-center border rounded hover-danger bg-white"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#delete-modal"
                onClick={() => setDeleteVariantId(row.id)}
                title="Delete Variant"
                style={{ width: "32px", height: "32px" }}
              >
                <Trash2 size={16} className="text-danger" />
              </Link>
            </div>
          ),
        },
      ];

      return (
        <>
          <div className="page-wrapper">
            <div className="content">
              {/* Page Header */}
              <div className="page-header">
                <div className="add-item d-flex">
                  <div className="page-title">
                    <h4 className="fw-bold">Variant Attributes</h4>
                    <h6>
                      Manage product variant attributes (Size, Color, Pot Material, Pack Weight, etc.)
                    </h6>
                  </div>
                </div>
                <TableTopHead />
                <div className="page-btn">
                  <Link
                    to="#"
                    className="btn btn-primary d-inline-flex align-items-center"
                    data-bs-toggle="modal"
                    data-bs-target="#add-variant"
                    onClick={handleOpenAddModal}
                  >
                    <i className="ti ti-circle-plus me-1 fs-16"></i> Add Variant
                  </Link>
                </div>
              </div>

              {/* Table Card */}
              <div className="card table-list-card">
                <div className="card-header pb-0 border-bottom">
                  {/* Top Row: Search and Status Filter */}
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                    <SearchFromApi
                      callback={handleSearch}
                      rows={rows}
                      setRows={setRows}
                    />
                    <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                      <div className="dropdown me-2">
                        <Link
                          to="#"
                          className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-filter me-1 fs-14" />
                          Status: <span className="fw-semibold ms-1">{statusFilter}</span>
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-2 shadow-sm rounded-2">
                          <li>
                            <button
                              type="button"
                              className={`dropdown-item rounded-1 ${statusFilter === "All" ? "active" : ""}`}
                              onClick={() => setStatusFilter("All")}
                            >
                              All
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className={`dropdown-item rounded-1 ${statusFilter === "Active" ? "active" : ""}`}
                              onClick={() => setStatusFilter("Active")}
                            >
                              Active
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className={`dropdown-item rounded-1 ${statusFilter === "Inactive" ? "active" : ""}`}
                              onClick={() => setStatusFilter("Inactive")}
                            >
                              Inactive
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Animated Underline Tabs placed under the Search Bar */}
                  <div className="position-relative">
                    <ul className="nav border-bottom-0 gap-3 gap-sm-4" role="tablist">
                      <li className="nav-item">
                        <button
                          ref={(el) => {
                            tabRefs.current["all"] = el;
                          }}
                          type="button"
                          className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 ${
                            businessFilter === "all"
                              ? "fw-bold"
                              : "text-muted fw-medium"
                          }`}
                          style={{
                            boxShadow: "none",
                            background: "transparent",
                            paddingTop: 0,
                            paddingBottom: "6px",
                            color: businessFilter === "all" ? "#127a3c" : undefined,
                            transition: "color 0.2s ease",
                          }}
                          onClick={() => {
                            setBusinessFilter("all");
                            setCurrentPage(1);
                          }}
                        >
                          <span>All</span>
                        </button>
                      </li>

                      {availableBusinesses.map((biz) => {
                        const isSelected = businessFilter === biz.id;
                        return (
                          <li key={biz.id} className="nav-item">
                            <button
                              ref={(el) => {
                                tabRefs.current[biz.id] = el;
                              }}
                              type="button"
                              className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 ${
                                isSelected
                                  ? "fw-bold"
                                  : "text-muted fw-medium"
                              }`}
                              style={{
                                boxShadow: "none",
                                background: "transparent",
                                paddingTop: 0,
                                paddingBottom: "6px",
                                color: isSelected ? "#127a3c" : undefined,
                                transition: "color 0.2s ease",
                              }}
                              onClick={() => {
                                setBusinessFilter(biz.id);
                                setCurrentPage(1);
                              }}
                            >
                              <span>{biz.name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Animated sliding underline indicator */}
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                        height: "3px",
                        backgroundColor: "#127a3c",
                        borderRadius: "3px 3px 0 0",
                        transition: indicatorStyle.ready
                          ? "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)"
                          : "none",
                    pointerEvents: "none",
                    opacity: indicatorStyle.ready ? 1 : 0,
                  }}
                />
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive">
                <PrimeDataTable
                  column={columns}
                  data={filteredData}
                  rows={rows}
                  setRows={setRows}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalRecords={filteredData.length}
                  searchQuery={searchQuery}
                  selectionMode="checkbox"
                  selection={selectedProducts}
                  onSelectionChange={(e: any) => setSelectedProducts(e.value)}
                />
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-5">
                  <div className="avatar avatar-xl bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                    <i className="ti ti-layers-intersect fs-32 text-muted" />
                  </div>
                  <h5 className="fw-semibold text-dark">No Variant Attributes Found</h5>
                  <p className="text-muted fs-13 mb-3">
                    {searchQuery
                      ? "No records matched your search query."
                      : businessFilter !== "all"
                      ? `No variant attributes mapped to ${
                          availableBusinesses.find((b) => b.id === businessFilter)?.name || "this store"
                        } yet.`
                      : "Create your first product variant attribute (e.g. Size, Color, Pack Size)."}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#add-variant"
                    onClick={handleOpenAddModal}
                  >
                    <i className="ti ti-circle-plus me-1" /> Add Variant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Add Variant Modal */}
      <div className="modal fade" id="add-variant" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: "1060px" }}>
          <div className="modal-content border-0 shadow">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-bottom">
                  <div className="page-title">
                    <h4 className="fw-bold mb-0">Add Variant Attribute</h4>
                    <span className="text-muted fs-12">Define a reusable variant and preview values on the right</span>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16 rounded-circle border-0 d-flex align-items-center justify-content-center"
                    style={{ width: "28px", height: "28px" }}
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                <form onSubmit={handleAddVariant}>
                  <div className="modal-body custom-modal-bodys">
                    {addError && (
                      <div className="alert alert-danger py-2 px-3 fs-13 mb-3" role="alert">
                        <i className="ti ti-alert-circle me-1" />
                        {addError}
                      </div>
                    )}

                    <div className="row g-4">
                      {/* Left: Input Form Controls */}
                      <div className="col-12 col-lg-7">
                        {/* Business Mapping Field */}
                        <div className="mb-3">
                          <label className="form-label fw-medium d-flex justify-content-between align-items-center mb-1">
                            <span>
                              Map to Business<span className="text-danger ms-1">*</span>
                            </span>
                            <span className="text-muted fs-11">Choose store(s)</span>
                          </label>
                          <div className="p-3 border rounded bg-light-subtle">
                            <div className="row row-cols-3 g-2 g-sm-3 align-items-center">
                              {/* First: All */}
                              <div className="col">
                                <div className="form-check mb-0 d-flex align-items-center">
                                  <input
                                    className="form-check-input me-2 flex-shrink-0"
                                    type="checkbox"
                                    id="add-biz-all"
                                    checked={
                                      availableBusinesses.length > 0 &&
                                      selectedBizIds.length === availableBusinesses.length
                                    }
                                    onChange={handleToggleAddAllBiz}
                                  />
                                  <label
                                    className="form-check-label text-dark fw-semibold fs-13 cursor-pointer text-truncate"
                                    htmlFor="add-biz-all"
                                  >
                                    All
                                  </label>
                                </div>
                              </div>

                              {/* All businesses one by one */}
                              {availableBusinesses.map((biz) => (
                                <div key={biz.id} className="col">
                                  <div className="form-check mb-0 d-flex align-items-center">
                                    <input
                                      className="form-check-input me-2 flex-shrink-0"
                                      type="checkbox"
                                      id={`add-biz-${biz.id}`}
                                      checked={selectedBizIds.includes(biz.id)}
                                      onChange={() => handleToggleAddBiz(biz.id)}
                                    />
                                    <label
                                      className="form-check-label fw-medium fs-13 cursor-pointer text-truncate"
                                      htmlFor={`add-biz-${biz.id}`}
                                      title={biz.name}
                                    >
                                      {biz.name}
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-2 text-muted fs-12 border-top pt-2">
                              {selectedBizIds.length === 0 ? (
                                <span className="text-danger">
                                  <i className="ti ti-alert-circle me-1" />
                                  Please select at least one business.
                                </span>
                              ) : selectedBizIds.length === availableBusinesses.length ? (
                                <span className="text-success fw-medium">
                                  <i className="ti ti-check me-1" />
                                  Mapped to <strong>Both Businesses</strong> (available in both stores).
                                </span>
                              ) : (
                                <span className="text-dark">
                                  <i className="ti ti-info-circle me-1" />
                                  Mapped strictly to:{" "}
                                  <strong>
                                    {availableBusinesses.find((b) => b.id === selectedBizIds[0])?.name ||
                                      selectedBizIds[0]}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Variant Name */}
                        <div className="mb-3">
                          <label className="form-label fw-medium">
                            Variant Name<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Colour, Size, Pot Material, Pack Weight"
                            value={variantName}
                            onChange={(e) => setVariantName(e.target.value)}
                            required
                            autoFocus
                          />
                          <span className="text-muted fs-11 mt-1 d-block">
                            Typing "colour" or "color" unlocks Colour Variants and Pattern options.
                          </span>
                        </div>

                        {/* Values / Colour Variant input one by one */}
                        <div className="mb-3">
                          <label className="form-label fw-medium d-flex justify-content-between align-items-center mb-1">
                            <span>
                              {isColorVariant(variantName) ? "Colour Variant" : "Variant Values"}
                              <span className="text-danger ms-1">*</span>
                            </span>
                            <span className="text-muted fs-11">
                              {addValuesList.length > 0
                                ? `${addValuesList.length} added`
                                : "Add one by one"}
                            </span>
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={
                                isColorVariant(variantName)
                                  ? "e.g. Red, Matte Black, Terracotta"
                                  : "e.g. Small, 500g, 10-inch"
                              }
                              value={addSingleValueInput}
                              onChange={(e) => setAddSingleValueInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  handleAddSingleValue();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary d-flex align-items-center px-3"
                              onClick={handleAddSingleValue}
                            >
                              <i className="ti ti-plus me-1" /> Add
                            </button>
                          </div>
                          <span className="tag-text mt-1 d-block text-muted fs-12">
                            Type an item and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                            Items will appear on the right preview.
                          </span>
                        </div>

                        {/* Pattern field - ONLY for colors */}
                        {isColorVariant(variantName) && (
                          <div className="mb-3">
                            <label className="form-label fw-medium d-flex justify-content-between align-items-center mb-1">
                              <span>
                                Pattern / Finish<span className="text-muted ms-1 fs-12">(Optional)</span>
                              </span>
                              <span className="text-muted fs-11">
                                {addPatternsList.length > 0 ? `${addPatternsList.length} added` : "e.g. Marble, Solid"}
                              </span>
                            </label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Solid, Striped, Marble, Glossy"
                                value={addSinglePatternInput}
                                onChange={(e) => setAddSinglePatternInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    handleAddSinglePattern();
                                  }
                                }}
                              />

                              {/* Pattern image uploading option - visible for Nikhlesh Nursery or Both businesses */}
                              {canUploadPatternImage(selectedBizIds, availableBusinesses) && (
                                <>
                                  <input
                                    type="file"
                                    ref={addPatternFileInputRef}
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleAddPatternImageFileChange}
                                  />
                                  {addCurrentPatternImage ? (
                                    <div
                                      className="d-flex align-items-center bg-white px-2 border"
                                      style={{ borderColor: "#ced4da" }}
                                    >
                                      <img
                                        src={addCurrentPatternImage}
                                        alt="Pattern preview"
                                        style={{
                                          width: "26px",
                                          height: "26px",
                                          objectFit: "cover",
                                          borderRadius: "4px",
                                          border: "1px solid #dee2e6",
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-link text-danger p-0 ms-1 d-flex align-items-center"
                                        style={{ textDecoration: "none" }}
                                        onClick={() => {
                                          setAddCurrentPatternImage(null);
                                          if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
                                        }}
                                        title="Remove image"
                                      >
                                        <i className="ti ti-x fs-14" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary d-flex align-items-center px-2.5"
                                      onClick={() => addPatternFileInputRef.current?.click()}
                                      title="Attach image for this pattern"
                                      style={{
                                        borderColor: "#ced4da",
                                        backgroundColor: "#f8f9fa",
                                      }}
                                    >
                                      <i className="ti ti-photo fs-15 text-muted me-1" />
                                      <span className="fs-12 text-muted">Image</span>
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                className="btn btn-outline-primary d-flex align-items-center px-3"
                                onClick={handleAddSinglePattern}
                              >
                                <i className="ti ti-plus me-1" /> Add
                              </button>
                            </div>
                            <span className="tag-text mt-1 d-block text-muted fs-12">
                              {canUploadPatternImage(selectedBizIds, availableBusinesses) ? (
                                <>
                                  Type pattern name, attach an optional image, and click <strong>+ Add</strong>.
                                </>
                              ) : (
                                <>
                                  Type pattern and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                                </>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Status Toggle */}
                        <div className="mb-0 mt-3 p-2 bg-light rounded">
                          <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                            <span className="status-label fw-medium fs-13">Status (Active / Inactive)</span>
                            <input
                              type="checkbox"
                              id="variant-add-status"
                              className="check"
                              checked={variantStatus}
                              onChange={(e) => setVariantStatus(e.target.checked)}
                            />
                            <label htmlFor="variant-add-status" className="checktoggle" />
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Preview List */}
                      <div className="col-12 col-lg-5">
                        <div
                          className="card border bg-light-subtle shadow-none mb-0 h-100 d-flex flex-column"
                          style={{ minHeight: "410px" }}
                        >
                          <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="d-flex align-items-center justify-content-center rounded bg-primary-transparent text-primary"
                                style={{ width: "26px", height: "26px" }}
                              >
                                <i className="ti ti-eye fs-14" />
                              </div>
                              <span className="fw-bold fs-13 text-dark">Live Attribute Preview</span>
                            </div>
                            <span className="badge bg-primary-transparent text-primary fs-11">
                              {addValuesList.length} {addValuesList.length === 1 ? "value" : "values"}
                            </span>
                          </div>

                          <div className="card-body p-3 d-flex flex-column flex-grow-1">
                            {/* Attribute Overview Box */}
                            <div className="bg-white p-2 px-3 rounded border mb-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <span className="text-muted fs-10 text-uppercase fw-semibold d-block">Attribute</span>
                                  <span className="fw-bold fs-14 text-dark">
                                    {variantName.trim() || <span className="text-muted fst-italic">Untitled Variant</span>}
                                  </span>
                                </div>
                                <div>
                                  <span
                                    className={`badge ${
                                      variantStatus
                                        ? "bg-success-transparent text-success"
                                        : "bg-danger-transparent text-danger"
                                    } fs-11`}
                                  >
                                    {variantStatus ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
                                <span className="text-muted fs-11">Mapped to:</span>
                                <div className="d-flex flex-wrap gap-1 justify-content-end">
                                  {selectedBizIds.length === 0 ? (
                                    <span className="text-danger fs-11">No store selected</span>
                                  ) : selectedBizIds.length === availableBusinesses.length ? (
                                    <span
                                      className="badge fs-10 fw-medium"
                                      style={{
                                        backgroundColor: "#fff8f5",
                                        color: "#e04f16",
                                        border: "1px solid #ea5455",
                                      }}
                                    >
                                      Both Businesses
                                    </span>
                                  ) : (
                                    selectedBizIds.map((bId) => {
                                      const bName = availableBusinesses.find((b) => b.id === bId)?.name || bId;
                                      return (
                                        <span key={bId} className="badge bg-secondary-transparent text-secondary fs-10">
                                          {bName}
                                        </span>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Values Preview Section */}
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fs-12 fw-semibold text-muted text-uppercase">
                                {isColorVariant(variantName) ? "Colour Variant List" : "Values Preview"}
                              </span>
                              {addValuesList.length > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-link text-danger p-0 fs-11 text-decoration-none"
                                  onClick={() => setAddValuesList([])}
                                >
                                  Clear all
                                </button>
                              )}
                            </div>

                            {addValuesList.length === 0 ? (
                              <div className="text-center py-4 px-2 my-auto border border-dashed rounded bg-white">
                                <i className="ti ti-playlist-add fs-28 text-muted mb-1 d-block" />
                                <p className="fs-12 text-muted mb-0 fw-medium">
                                  No {isColorVariant(variantName) ? "colours" : "values"} added yet
                                </p>
                                <span className="fs-11 text-muted">
                                  Type on the left and hit <kbd className="bg-light text-dark border px-1">Enter</kbd> to add
                                </span>
                              </div>
                            ) : (
                              <div
                                className="pe-1 mb-2"
                                style={{
                                  maxHeight: isColorVariant(variantName) ? "170px" : "250px",
                                  overflowY: "auto",
                                }}
                              >
                                <div className="d-flex flex-column gap-1">
                                  {addValuesList.map((val, idx) => (
                                    <div
                                      key={idx}
                                      className="d-flex align-items-center justify-content-between p-2 bg-white border rounded shadow-xs"
                                    >
                                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <span
                                          className="badge bg-light text-muted border fs-10 px-1 py-0 fw-semibold"
                                          style={{ minWidth: "24px" }}
                                        >
                                          #{idx + 1}
                                        </span>
                                        {isColorVariant(variantName) && (
                                          <span
                                            className="rounded-circle border d-inline-block flex-shrink-0"
                                            style={{
                                              width: "12px",
                                              height: "12px",
                                              backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                            }}
                                          />
                                        )}
                                        <span className="fw-medium text-dark fs-12 text-truncate" title={val}>
                                          {val}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0"
                                        style={{ lineHeight: 1 }}
                                        onClick={() => handleRemoveSingleValue(idx)}
                                        title={`Remove ${val}`}
                                      >
                                        <i className="ti ti-x fs-13 text-danger" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Pattern List Preview (if colour) */}
                            {isColorVariant(variantName) && (
                              <div className="mt-2 pt-2 border-top">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fs-12 fw-semibold text-muted text-uppercase">
                                    Patterns ({addPatternsList.length})
                                  </span>
                                  {addPatternsList.length > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-link text-danger p-0 fs-11 text-decoration-none"
                                      onClick={() => setAddPatternsList([])}
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>

                                {addPatternsList.length === 0 ? (
                                  <span className="fs-11 text-muted d-block mb-1 fst-italic">
                                    Optional: Add patterns like Solid, Marble, Striped
                                  </span>
                                ) : (
                                  <div
                                    className="d-flex flex-wrap gap-1 mb-2"
                                    style={{ maxHeight: "75px", overflowY: "auto" }}
                                  >
                                    {addPatternsList.map((pat, pIdx) => {
                                      const patImg = addPatternImages[pat];
                                      return (
                                        <span
                                          key={pIdx}
                                          className="badge px-2 py-1 fs-11 fw-medium rounded-pill d-inline-flex align-items-center gap-1"
                                          style={{
                                            backgroundColor: "rgba(111, 66, 193, 0.12)",
                                            color: "#6f42c1",
                                            border: "1px solid rgba(111, 66, 193, 0.3)",
                                          }}
                                        >
                                          {patImg ? (
                                            <Popover
                                              title={pat}
                                              content={
                                                <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                                  <img
                                                    src={patImg}
                                                    alt={pat}
                                                    style={{
                                                      width: "100%",
                                                      maxHeight: "140px",
                                                      objectFit: "contain",
                                                      borderRadius: "4px",
                                                    }}
                                                  />
                                                </div>
                                              }
                                            >
                                              <img
                                                src={patImg}
                                                alt={pat}
                                                style={{
                                                  width: "16px",
                                                  height: "16px",
                                                  objectFit: "cover",
                                                  borderRadius: "50%",
                                                  cursor: "pointer",
                                                  border: "1px solid rgba(111, 66, 193, 0.4)",
                                                }}
                                              />
                                            </Popover>
                                          ) : (
                                            <i className="ti ti-palette fs-10" />
                                          )}
                                          {pat}
                                          <i
                                            className="ti ti-x fs-10 ms-1 cursor-pointer"
                                            onClick={() => handleRemoveSinglePattern(pIdx)}
                                            title={`Remove ${pat}`}
                                          />
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                Generated combinations preview if both colors and patterns are present
                                {addValuesList.length > 0 && addPatternsList.length > 0 && (
                                  <div className="mt-2 p-2 bg-white rounded border">
                                    <span className="fs-11 fw-semibold text-dark d-block mb-1">
                                      Product Combinations ({addValuesList.length * addPatternsList.length}):
                                    </span>
                                    <div
                                      className="d-flex flex-wrap gap-1"
                                      style={{ maxHeight: "85px", overflowY: "auto" }}
                                    >
                                      {addValuesList.flatMap((c) =>
                                        addPatternsList.map((p) => (
                                          <span
                                            key={`${c}-${p}`}
                                            className="badge bg-light text-dark border fs-10 px-2 py-1"
                                          >
                                            {c} • {p}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-top">
                    <button
                      type="button"
                      className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary fs-13 fw-medium p-2 px-3"
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" />
                          Adding...
                        </>
                      ) : (
                        "Add Variant"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Variant Modal */}
      <div className="modal fade" id="edit-variant" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: "1060px" }}>
          <div className="modal-content border-0 shadow">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-bottom">
                  <div className="page-title">
                    <h4 className="fw-bold mb-0">Edit Variant Attribute</h4>
                    <span className="text-muted fs-12">Update variant name, options, or business mapping</span>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16 rounded-circle border-0 d-flex align-items-center justify-content-center"
                    style={{ width: "28px", height: "28px" }}
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                <form onSubmit={handleSaveEdit}>
                  <div className="modal-body custom-modal-bodys">
                    {editError && (
                      <div className="alert alert-danger py-2 px-3 fs-13 mb-3" role="alert">
                        <i className="ti ti-alert-circle me-1" />
                        {editError}
                      </div>
                    )}

                    <div className="row g-4">
                      {/* Left: Input Form Controls */}
                      <div className="col-12 col-lg-7">
                        {/* Business Mapping Field */}
                        <div className="mb-3">
                          <label className="form-label fw-medium d-flex justify-content-between align-items-center mb-1">
                            <span>
                              Map to Business<span className="text-danger ms-1">*</span>
                            </span>
                            <span className="text-muted fs-11">Choose store(s)</span>
                          </label>
                          <div className="p-3 border rounded bg-light-subtle">
                            <div className="row row-cols-3 g-2 g-sm-3 align-items-center">
                              {/* First: All */}
                              <div className="col">
                                <div className="form-check mb-0 d-flex align-items-center">
                                  <input
                                    className="form-check-input me-2 flex-shrink-0"
                                    type="checkbox"
                                    id="edit-biz-all"
                                    checked={
                                      availableBusinesses.length > 0 &&
                                      editSelectedBizIds.length === availableBusinesses.length
                                    }
                                    onChange={handleToggleEditAllBiz}
                                  />
                                  <label
                                    className="form-check-label text-dark fw-semibold fs-13 cursor-pointer text-truncate"
                                    htmlFor="edit-biz-all"
                                  >
                                    All
                                  </label>
                                </div>
                              </div>

                              {/* All businesses one by one */}
                              {availableBusinesses.map((biz) => (
                                <div key={biz.id} className="col">
                                  <div className="form-check mb-0 d-flex align-items-center">
                                    <input
                                      className="form-check-input me-2 flex-shrink-0"
                                      type="checkbox"
                                      id={`edit-biz-${biz.id}`}
                                      checked={editSelectedBizIds.includes(biz.id)}
                                      onChange={() => handleToggleEditBiz(biz.id)}
                                    />
                                    <label
                                      className="form-check-label fw-medium fs-13 cursor-pointer text-truncate"
                                      htmlFor={`edit-biz-${biz.id}`}
                                      title={biz.name}
                                    >
                                      {biz.name}
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-2 text-muted fs-12 border-top pt-2">
                              {editSelectedBizIds.length === 0 ? (
                                <span className="text-danger">
                                  <i className="ti ti-alert-circle me-1" />
                                  Please select at least one business.
                                </span>
                              ) : editSelectedBizIds.length === availableBusinesses.length ? (
                                <span className="text-success fw-medium">
                                  <i className="ti ti-check me-1" />
                                  Mapped to <strong>Both Businesses</strong> (available in both stores).
                                </span>
                              ) : (
                                <span className="text-dark">
                                  <i className="ti ti-info-circle me-1" />
                                  Mapped strictly to:{" "}
                                  <strong>
                                    {availableBusinesses.find((b) => b.id === editSelectedBizIds[0])?.name ||
                                      editSelectedBizIds[0]}
                                  </strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Variant Name */}
                        <div className="mb-3">
                          <label className="form-label fw-medium">
                            Variant Name<span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={editVariantName}
                            onChange={(e) => setEditVariantName(e.target.value)}
                            required
                          />
                          <span className="text-muted fs-11 mt-1 d-block">
                            Typing "colour" or "color" unlocks Colour Variants and Pattern options.
                          </span>
                        </div>

                        {/* Values / Colour Variant input one by one */}
                        <div className="mb-3">
                          <label className="form-label fw-medium d-flex justify-content-between align-items-center mb-1">
                            <span>
                              {isColorVariant(editVariantName) ? "Colour Variant" : "Variant Values"}
                              <span className="text-danger ms-1">*</span>
                            </span>
                            <span className="text-muted fs-11">
                              {editValuesList.length > 0
                                ? `${editValuesList.length} added`
                                : "Add one by one"}
                            </span>
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              placeholder={
                                isColorVariant(editVariantName)
                                  ? "e.g. Red, Matte Black, Terracotta"
                                  : "e.g. Small, 500g, 10-inch"
                              }
                              value={editSingleValueInput}
                              onChange={(e) => setEditSingleValueInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  handleEditAddSingleValue();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-primary d-flex align-items-center px-3"
                              onClick={handleEditAddSingleValue}
                            >
                              <i className="ti ti-plus me-1" /> Add
                            </button>
                          </div>
                          <span className="tag-text mt-1 d-block text-muted fs-12">
                            Type an item and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                          </span>
                        </div>

                        {/* Pattern field - ONLY for colors */}
                        {isColorVariant(editVariantName) && (
                          <div className="mb-3">
                            <label className="form-label fw-medium d-flex justify-content-between align-items-center mb-1">
                              <span>
                                Pattern / Finish<span className="text-muted ms-1 fs-12">(Optional)</span>
                              </span>
                              <span className="text-muted fs-11">
                                {editPatternsList.length > 0 ? `${editPatternsList.length} added` : "e.g. Marble, Solid"}
                              </span>
                            </label>
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Solid, Striped, Marble, Glossy"
                                value={editSinglePatternInput}
                                onChange={(e) => setEditSinglePatternInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === ",") {
                                    e.preventDefault();
                                    handleEditAddSinglePattern();
                                  }
                                }}
                              />

                              {/* Pattern image uploading option - visible for Nikhlesh Nursery or Both businesses */}
                              {canUploadPatternImage(editSelectedBizIds, availableBusinesses) && (
                                <>
                                  <input
                                    type="file"
                                    ref={editPatternFileInputRef}
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={handleEditPatternImageFileChange}
                                  />
                                  {editCurrentPatternImage ? (
                                    <div
                                      className="d-flex align-items-center bg-white px-2 border"
                                      style={{ borderColor: "#ced4da" }}
                                    >
                                      <img
                                        src={editCurrentPatternImage}
                                        alt="Pattern preview"
                                        style={{
                                          width: "26px",
                                          height: "26px",
                                          objectFit: "cover",
                                          borderRadius: "4px",
                                          border: "1px solid #dee2e6",
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-link text-danger p-0 ms-1 d-flex align-items-center"
                                        style={{ textDecoration: "none" }}
                                        onClick={() => {
                                          setEditCurrentPatternImage(null);
                                          if (editPatternFileInputRef.current) editPatternFileInputRef.current.value = "";
                                        }}
                                        title="Remove image"
                                      >
                                        <i className="ti ti-x fs-14" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary d-flex align-items-center px-2.5"
                                      onClick={() => editPatternFileInputRef.current?.click()}
                                      title="Attach image for this pattern"
                                      style={{
                                        borderColor: "#ced4da",
                                        backgroundColor: "#f8f9fa",
                                      }}
                                    >
                                      <i className="ti ti-photo fs-15 text-muted me-1" />
                                      <span className="fs-12 text-muted">Image</span>
                                    </button>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                className="btn btn-outline-primary d-flex align-items-center px-3"
                                onClick={handleEditAddSinglePattern}
                              >
                                <i className="ti ti-plus me-1" /> Add
                              </button>
                            </div>
                            <span className="tag-text mt-1 d-block text-muted fs-12">
                              {canUploadPatternImage(editSelectedBizIds, availableBusinesses) ? (
                                <>
                                  Type pattern name, attach an optional image, and click <strong>+ Add</strong>.
                                </>
                              ) : (
                                <>
                                  Type pattern and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                                </>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Status Toggle */}
                        <div className="mb-0 mt-3 p-2 bg-light rounded">
                          <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                            <span className="status-label fw-medium fs-13">Status (Active / Inactive)</span>
                            <input
                              type="checkbox"
                              id="variant-edit-status"
                              className="check"
                              checked={editVariantStatus}
                              onChange={(e) => setEditVariantStatus(e.target.checked)}
                            />
                            <label htmlFor="variant-edit-status" className="checktoggle" />
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Preview List */}
                      <div className="col-12 col-lg-5">
                        <div
                          className="card border bg-light-subtle shadow-none mb-0 h-100 d-flex flex-column"
                          style={{ minHeight: "410px" }}
                        >
                          <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="d-flex align-items-center justify-content-center rounded bg-primary-transparent text-primary"
                                style={{ width: "26px", height: "26px" }}
                              >
                                <i className="ti ti-eye fs-14" />
                              </div>
                              <span className="fw-bold fs-13 text-dark">Live Attribute Preview</span>
                            </div>
                            <span className="badge bg-primary-transparent text-primary fs-11">
                              {editValuesList.length} {editValuesList.length === 1 ? "value" : "values"}
                            </span>
                          </div>

                          <div className="card-body p-3 d-flex flex-column flex-grow-1">
                            {/* Attribute Overview Box */}
                            <div className="bg-white p-2 px-3 rounded border mb-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <span className="text-muted fs-10 text-uppercase fw-semibold d-block">Attribute</span>
                                  <span className="fw-bold fs-14 text-dark">
                                    {editVariantName.trim() || <span className="text-muted fst-italic">Untitled Variant</span>}
                                  </span>
                                </div>
                                <div>
                                  <span
                                    className={`badge ${
                                      editVariantStatus
                                        ? "bg-success-transparent text-success"
                                        : "bg-danger-transparent text-danger"
                                    } fs-11`}
                                  >
                                    {editVariantStatus ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
                                <span className="text-muted fs-11">Mapped to:</span>
                                <div className="d-flex flex-wrap gap-1 justify-content-end">
                                  {editSelectedBizIds.length === 0 ? (
                                    <span className="text-danger fs-11">No store selected</span>
                                  ) : editSelectedBizIds.length === availableBusinesses.length ? (
                                    <span
                                      className="badge fs-10 fw-medium"
                                      style={{
                                        backgroundColor: "#fff8f5",
                                        color: "#e04f16",
                                        border: "1px solid #ea5455",
                                      }}
                                    >
                                      Both Businesses
                                    </span>
                                  ) : (
                                    editSelectedBizIds.map((bId) => {
                                      const bName = availableBusinesses.find((b) => b.id === bId)?.name || bId;
                                      return (
                                        <span key={bId} className="badge bg-secondary-transparent text-secondary fs-10">
                                          {bName}
                                        </span>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Values Preview Section */}
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fs-12 fw-semibold text-muted text-uppercase">
                                {isColorVariant(editVariantName) ? "Colour Variant List" : "Values Preview"}
                              </span>
                              {editValuesList.length > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-link text-danger p-0 fs-11 text-decoration-none"
                                  onClick={() => setEditValuesList([])}
                                >
                                  Clear all
                                </button>
                              )}
                            </div>

                            {editValuesList.length === 0 ? (
                              <div className="text-center py-4 px-2 my-auto border border-dashed rounded bg-white">
                                <i className="ti ti-playlist-add fs-28 text-muted mb-1 d-block" />
                                <p className="fs-12 text-muted mb-0 fw-medium">
                                  No {isColorVariant(editVariantName) ? "colours" : "values"} added yet
                                </p>
                                <span className="fs-11 text-muted">
                                  Type on the left and hit <kbd className="bg-light text-dark border px-1">Enter</kbd> to add
                                </span>
                              </div>
                            ) : (
                              <div
                                className="pe-1 mb-2"
                                style={{
                                  maxHeight: isColorVariant(editVariantName) ? "170px" : "250px",
                                  overflowY: "auto",
                                }}
                              >
                                <div className="d-flex flex-column gap-1">
                                  {editValuesList.map((val, idx) => (
                                    <div
                                      key={idx}
                                      className="d-flex align-items-center justify-content-between p-2 bg-white border rounded shadow-xs"
                                    >
                                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <span
                                          className="badge bg-light text-muted border fs-10 px-1 py-0 fw-semibold"
                                          style={{ minWidth: "24px" }}
                                        >
                                          #{idx + 1}
                                        </span>
                                        {isColorVariant(editVariantName) && (
                                          <span
                                            className="rounded-circle border d-inline-block flex-shrink-0"
                                            style={{
                                              width: "12px",
                                              height: "12px",
                                              backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                            }}
                                          />
                                        )}
                                        <span className="fw-medium text-dark fs-12 text-truncate" title={val}>
                                          {val}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0"
                                        style={{ lineHeight: 1 }}
                                        onClick={() => handleEditRemoveSingleValue(idx)}
                                        title={`Remove ${val}`}
                                      >
                                        <i className="ti ti-x fs-13 text-danger" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Pattern List Preview (if colour) */}
                            {isColorVariant(editVariantName) && (
                              <div className="mt-2 pt-2 border-top">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fs-12 fw-semibold text-muted text-uppercase">
                                    Patterns ({editPatternsList.length})
                                  </span>
                                  {editPatternsList.length > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-link text-danger p-0 fs-11 text-decoration-none"
                                      onClick={() => setEditPatternsList([])}
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>

                                {editPatternsList.length === 0 ? (
                                  <span className="fs-11 text-muted d-block mb-1 fst-italic">
                                    Optional: Add patterns like Solid, Marble, Striped
                                  </span>
                                ) : (
                                  <div
                                    className="d-flex flex-wrap gap-1 mb-2"
                                    style={{ maxHeight: "75px", overflowY: "auto" }}
                                  >
                                    {editPatternsList.map((pat, pIdx) => {
                                      const patImg = editPatternImages[pat];
                                      return (
                                        <span
                                          key={pIdx}
                                          className="badge px-2 py-1 fs-11 fw-medium rounded-pill d-inline-flex align-items-center gap-1"
                                          style={{
                                            backgroundColor: "rgba(111, 66, 193, 0.12)",
                                            color: "#6f42c1",
                                            border: "1px solid rgba(111, 66, 193, 0.3)",
                                          }}
                                        >
                                          {patImg ? (
                                            <Popover
                                              title={pat}
                                              content={
                                                <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                                  <img
                                                    src={patImg}
                                                    alt={pat}
                                                    style={{
                                                      width: "100%",
                                                      maxHeight: "140px",
                                                      objectFit: "contain",
                                                      borderRadius: "4px",
                                                    }}
                                                  />
                                                </div>
                                              }
                                            >
                                              <img
                                                src={patImg}
                                                alt={pat}
                                                style={{
                                                  width: "16px",
                                                  height: "16px",
                                                  objectFit: "cover",
                                                  borderRadius: "50%",
                                                  cursor: "pointer",
                                                  border: "1px solid rgba(111, 66, 193, 0.4)",
                                                }}
                                              />
                                            </Popover>
                                          ) : (
                                            <i className="ti ti-palette fs-10" />
                                          )}
                                          {pat}
                                          <i
                                            className="ti ti-x fs-10 ms-1 cursor-pointer"
                                            onClick={() => handleEditRemoveSinglePattern(pIdx)}
                                            title={`Remove ${pat}`}
                                          />
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Generated combinations preview if both colors and patterns are present */}
                                {/* {editValuesList.length > 0 && editPatternsList.length > 0 && (
                                  <div className="mt-2 p-2 bg-white rounded border">
                                    <span className="fs-11 fw-semibold text-dark d-block mb-1">
                                      Product Combinations ({editValuesList.length * editPatternsList.length}):
                                    </span>
                                    <div
                                      className="d-flex flex-wrap gap-1"
                                      style={{ maxHeight: "85px", overflowY: "auto" }}
                                    >
                                      {editValuesList.flatMap((c) =>
                                        editPatternsList.map((p) => (
                                          <span
                                            key={`${c}-${p}`}
                                            className="badge bg-light text-dark border fs-10 px-2 py-1"
                                          >
                                            {c} • {p}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )} */}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-top">
                    <button
                      type="button"
                      className="btn me-2 btn-secondary fs-13 fw-medium p-2 px-3 shadow-none"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary fs-13 fw-medium p-2 px-3"
                      disabled={isEditing}
                    >
                      {isEditing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal onConfirm={handleDelete} />
    </>
  );
};

export default VariantAttributes;
