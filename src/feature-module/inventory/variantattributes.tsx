import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import CommonFooter from "../../components/footer/commonFooter";
import PrimeDataTable from "../../components/data-table";
import TableTopHead from "../../components/table-top-head";
import DeleteModal from "../../components/delete-modal";
import SearchFromApi from "../../components/data-table/search";
import { api, getActiveBusinessId } from "../../services/api";
import { useBusiness } from "../../context/BusinessContext";
import { Edit, Trash2, ChevronDown } from "lucide-react";
import { Popover } from "antd";
import { compressImageFile } from "../../utils/imageCompression";

interface VariantAttributeItem { 
  id: string;
  variant: string;
  values: string;
  values_array: string[];
  patterns?: string;
  patterns_array?: string[];
  pattern_images?: Record<string, string>;
  value_images?: Record<string, string>;
  sizes?: string;
  sizes_array?: string[];
  varieties?: string;
  varieties_array?: string[];
  variety_images?: Record<string, string>;
  attribute_type?: string;
  category?: string;
  product_id?: string;
  product_name?: string;
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
  return clean.includes("color") || clean.includes("colour");
};

export const isSizeVariant = (name: string): boolean => {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return clean.includes("size");
};

export const isVarietyVariant = (name: string): boolean => {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return clean.includes("variet");
};

export const isNikhleshNurseryOnly = (
  bizIds: string[],
  availableBusinesses: { id: string; name?: string }[]
): boolean => {
  if (!bizIds || bizIds.length !== 1) return false;
  const id = bizIds[0].toLowerCase();
  if (id === "nikhlesh-nursery") return true;
  const matched = availableBusinesses.find(
    (b) => b.id.toLowerCase() === id || (b.name && b.name.toLowerCase().includes("nikhlesh"))
  );
  return !!matched && (matched.id === "nikhlesh-nursery" || (matched.name?.toLowerCase().includes("nikhlesh") ?? false));
};

export const isGrowNaturals = (
  bizIds: string[],
  availableBusinesses: { id: string; name?: string }[]
): boolean => {
  if (!bizIds || bizIds.length === 0) return true; // Default store is Grow Naturals
  return bizIds.some((id) => {
    const cleanId = id.toLowerCase();
    if (cleanId === "grow-naturals" || cleanId.includes("grow")) return true;
    const matched = availableBusinesses.find(
      (b) => b.id.toLowerCase() === cleanId || (b.name && b.name.toLowerCase().includes("grow"))
    );
    return !!matched;
  });
};

export const getVariantNameOptions = (
  bizIds: string[],
  availableBusinesses: { id: string; name?: string }[]
): string[] => {
  const isNN = isNikhleshNurseryOnly(bizIds, availableBusinesses);
  const isGN = isGrowNaturals(bizIds, availableBusinesses);
  if (isNN) return ["Size", "Variety", "Custom"];
  if (isGN) return ["Size", "Colors", "Custom"];
  return ["Size", "Colors", "Variety", "Custom"];
};

export const formatVariantName = (name: string): string => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  if (lower === "color" || lower === "colors" || lower === "colour" || lower === "colours") return "Colors";
  if (lower === "size" || lower === "sizes") return "Size";
  if (lower === "variety" || lower === "varieties") return "Variety";
  return name.trim();
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
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [businessFilter, setBusinessFilter] = useState<string>(() => {
    if (currentActiveBiz && currentActiveBiz !== "all" && currentActiveBiz !== "combined") {
      return currentActiveBiz;
    }
    return "grow-naturals";
  });
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Keep businessFilter synced with available businesses
  useEffect(() => {
    if (businessFilter === "all" || !availableBusinesses.some((b) => b.id === businessFilter)) {
      if (availableBusinesses.length > 0) {
        setBusinessFilter(availableBusinesses[0].id);
      }
    }
  }, [availableBusinesses, businessFilter]);

  // Add Form state
  const [variantName, setVariantName] = useState("Size");
  const [variantNameType, setVariantNameType] = useState<string>("Size");
  const addVariantInputRef = useRef<HTMLInputElement | null>(null);
  const [addProductName, setAddProductName] = useState("");
  const [addSizesList, setAddSizesList] = useState<string[]>([]);
  const [addSingleSizeInput, setAddSingleSizeInput] = useState("");
  const [addValuesList, setAddValuesList] = useState<string[]>([]);
  const [addSingleValueInput, setAddSingleValueInput] = useState("");
  const [addValueImages, setAddValueImages] = useState<Record<string, string>>({});
  const [addCurrentValueImage, setAddCurrentValueImage] = useState<string | null>(null);
  const addValueFileInputRef = useRef<HTMLInputElement | null>(null);
  const [addPatternsList, setAddPatternsList] = useState<string[]>([]);
  const [addSinglePatternInput, setAddSinglePatternInput] = useState("");
  const [addPatternImages, setAddPatternImages] = useState<Record<string, string>>({});
  const [addCurrentPatternImage, setAddCurrentPatternImage] = useState<string | null>(null);
  const addPatternFileInputRef = useRef<HTMLInputElement | null>(null);
  const [variantStatus, setVariantStatus] = useState(true);
  const [selectedBizIds, setSelectedBizIds] = useState<string[]>(() => {
    if (currentActiveBiz && currentActiveBiz !== "all" && currentActiveBiz !== "combined") {
      return [currentActiveBiz];
    }
    return ["grow-naturals"];
  });
  const [addAttributeType, setAddAttributeType] = useState<"general" | "product_based">("general");
  const [addCategory, setAddCategory] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Edit Form state
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [editVariantName, setEditVariantName] = useState("Size");
  const [editVariantNameType, setEditVariantNameType] = useState<string>("Size");
  const editVariantInputRef = useRef<HTMLInputElement | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSizesList, setEditSizesList] = useState<string[]>([]);
  const [editSingleSizeInput, setEditSingleSizeInput] = useState("");
  const [editValuesList, setEditValuesList] = useState<string[]>([]);
  const [editSingleValueInput, setEditSingleValueInput] = useState("");
  const [editValueImages, setEditValueImages] = useState<Record<string, string>>({});
  const [editCurrentValueImage, setEditCurrentValueImage] = useState<string | null>(null);
  const editValueFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editPatternsList, setEditPatternsList] = useState<string[]>([]);
  const [editSinglePatternInput, setEditSinglePatternInput] = useState("");
  const [editPatternImages, setEditPatternImages] = useState<Record<string, string>>({});
  const [editCurrentPatternImage, setEditCurrentPatternImage] = useState<string | null>(null);
  const editPatternFileInputRef = useRef<HTMLInputElement | null>(null);
  const [editVariantStatus, setEditVariantStatus] = useState(true);
  const [editSelectedBizIds, setEditSelectedBizIds] = useState<string[]>([]);
  const [editAttributeType, setEditAttributeType] = useState<"general" | "product_based">("general");
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [showAddCategoryDropdown, setShowAddCategoryDropdown] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const addCategoryContainerRef = useRef<HTMLDivElement | null>(null);                                                                                                                      
  const editCategoryContainerRef = useRef<HTMLDivElement | null>(null);

  // Size & Color / Variety recommendation dropdown states & refs
  const [showAddSizeDropdown, setShowAddSizeDropdown] = useState(false);
  const [showAddColorDropdown, setShowAddColorDropdown] = useState(false);
  const addSizeContainerRef = useRef<HTMLDivElement | null>(null);
  const addColorContainerRef = useRef<HTMLDivElement | null>(null);

  const [showEditSizeDropdown, setShowEditSizeDropdown] = useState(false);
  const [showEditColorDropdown, setShowEditColorDropdown] = useState(false);
  const editSizeContainerRef = useRef<HTMLDivElement | null>(null);
  const editColorContainerRef = useRef<HTMLDivElement | null>(null);

  // Close recommendation & category dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        addCategoryContainerRef.current &&
        !addCategoryContainerRef.current.contains(target)
      ) {
        setShowAddCategoryDropdown(false);
      }
      if (
        editCategoryContainerRef.current &&
        !editCategoryContainerRef.current.contains(target)
      ) {
        setShowEditCategoryDropdown(false);
      }
      if (
        addSizeContainerRef.current &&
        !addSizeContainerRef.current.contains(target)
      ) {
        setShowAddSizeDropdown(false);
      }
      if (
        addColorContainerRef.current &&
        !addColorContainerRef.current.contains(target)
      ) {
        setShowAddColorDropdown(false);
      }
      if (
        editSizeContainerRef.current &&
        !editSizeContainerRef.current.contains(target)
      ) {
        setShowEditSizeDropdown(false);
      }
      if (
        editColorContainerRef.current &&
        !editColorContainerRef.current.contains(target)
      ) {
        setShowEditColorDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Delete state
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

  const activeBusiness = currentActiveBiz || getActiveBusinessId() || "all";

  // Check if Pattern / Finish section should be shown (NOT for Grow Naturals)
  const showAddPatterns =
    !isGrowNaturals(selectedBizIds, availableBusinesses) && isColorVariant(variantName);

  const showEditPatterns =
    !isGrowNaturals(editSelectedBizIds, availableBusinesses) && isColorVariant(editVariantName);

  // Helper: check if a variant attribute belongs to a business
  const isMappedToBiz = useCallback((item: VariantAttributeItem, bizId: string) => {
    if (bizId === "all") return true;
    if (item.business_id === "all" || item.is_mapped_to_both) return true;
    if (item.business_id === bizId) return true;
    if (Array.isArray(item.business_ids) && item.business_ids.includes(bizId)) return true;
    return false;
  }, []);

  const isVariantForBiz = useCallback((item: VariantAttributeItem, bizId: string) => {
    if (!bizId || bizId === "all") return true;
    const targetId = bizId.toLowerCase();
    const bIds = (item.business_ids || []).map((id) => String(id).toLowerCase());
    if (bIds.includes(targetId)) return true;
    if (item.business_id && String(item.business_id).toLowerCase() === targetId) return true;
    if (item.business_name) {
      const bName = item.business_name.toLowerCase();
      if (targetId.includes("grow") && bName.includes("grow")) return true;
      if (targetId.includes("nikhlesh") && bName.includes("nikhlesh")) return true;
    }
    return false;
  }, []);

  // Categories helper per business (strict store isolation: only actual user-saved categories for that business, no dump data)
  const getCategoriesForBiz = useCallback(
    (bizId: string): string[] => {
      if (!bizId) return [];
      const catSet = new Set<string>();

      // From variantList (only previously typed & saved categories for this business)
      variantList.forEach((item) => {
        if (isVariantForBiz(item, bizId)) {
          const rawCat = (item.raw?.category || item.category || "").trim();
          if (
            rawCat &&
            rawCat.toLowerCase() !== "general" &&
            rawCat.toLowerCase() !== "product based"
          ) {
            catSet.add(rawCat);
          }
        }
      });

      return Array.from(catSet).sort((a, b) => a.localeCompare(b));
    },
    [variantList, isVariantForBiz]
  );

  // Product name to category map for auto-mapping within store
  const getProductToCategoryMap = useCallback(
    (bizId: string): Record<string, string> => {
      if (!bizId) return {};
      const map: Record<string, string> = {};
      variantList.forEach((item) => {
        if (isVariantForBiz(item, bizId)) {
          const pName = (item.raw?.product_name || item.product_name || item.variant || "").trim().toLowerCase();
          const cat = (item.raw?.category || item.category || "").trim();
          if (pName && cat && cat.toLowerCase() !== "general" && cat.toLowerCase() !== "product based") {
            map[pName] = cat;
          }
        }
      });
      return map;
    },
    [variantList, isVariantForBiz]
  );

  // Sizes helper per business (strict store isolation: previously entered sizes for this business)
  const getSizesForBiz = useCallback(
    (bizId: string): string[] => {
      if (!bizId) return [];
      const seenLower = new Set<string>();
      const result: string[] = [];

      const addSize = (s: string) => {
        const trimmed = s.trim();
        if (!trimmed) return;
        const lower = trimmed.toLowerCase();
        if (!seenLower.has(lower)) {
          seenLower.add(lower);
          result.push(trimmed);
        }
      };

      variantList.forEach((item) => {
        if (isVariantForBiz(item, bizId)) {
          // From sizes_array or sizes string
          if (item.sizes_array && item.sizes_array.length > 0) {
            item.sizes_array.forEach(addSize);
          } else if (item.sizes) {
            item.sizes.split(",").forEach(addSize);
          }
          // If variant is Size
          const vName = (item.variant || item.raw?.name || "").toLowerCase();
          if (isSizeVariant(vName) || vName === "size" || vName === "sizes") {
            if (item.values_array && item.values_array.length > 0) {
              item.values_array.forEach(addSize);
            } else if (item.values) {
              item.values.split(",").forEach(addSize);
            }
          }
        }
      });

      return result.sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
      );
    },
    [variantList, isVariantForBiz]
  );

  // Colors helper per business (strict store isolation: previously entered colors with images for this business)
  const getColorsForBiz = useCallback(
    (bizId: string): { name: string; image?: string }[] => {
      if (!bizId) return [];
      const colorMap = new Map<string, string | undefined>();

      variantList.forEach((item) => {
        if (isVariantForBiz(item, bizId)) {
          const vName = (item.variant || item.raw?.name || "").toLowerCase();
          const isNN = isNikhleshNurseryOnly([bizId], availableBusinesses);
          const isColor =
            vName.includes("color") ||
            vName.includes("colour") ||
            (item.attribute_type === "product_based" && !isNN);

          if (isColor) {
            const list =
              item.values_array && item.values_array.length > 0
                ? item.values_array
                : item.values
                ? item.values.split(",").map((v) => v.trim()).filter(Boolean)
                : [];

            list.forEach((col) => {
              const trimmed = col.trim();
              if (!trimmed) return;
              const lower = trimmed.toLowerCase();
              const existingImg = colorMap.get(lower);
              const itemImg =
                item.value_images?.[trimmed] ||
                item.value_images?.[lower] ||
                item.variety_images?.[trimmed] ||
                item.variety_images?.[lower];

              if (!colorMap.has(lower) || (!existingImg && itemImg)) {
                colorMap.set(lower, itemImg);
              }
            });
          }
        }
      });

      const keys = Array.from(colorMap.keys()).sort();
      return keys.map((key) => {
        const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
        return {
          name: capitalized,
          image: colorMap.get(key),
        };
      });
    },
    [variantList, isVariantForBiz, availableBusinesses]
  );

  // Varieties helper per business (strict store isolation: previously entered varieties with images for Nikhlesh Nursery)
  const getVarietiesForBiz = useCallback(
    (bizId: string): { name: string; image?: string }[] => {
      if (!bizId) return [];
      const varietyMap = new Map<string, string | undefined>();

      variantList.forEach((item) => {
        if (isVariantForBiz(item, bizId)) {
          const vName = (item.variant || item.raw?.name || "").toLowerCase();
          const isNN = isNikhleshNurseryOnly([bizId], availableBusinesses);
          const isVariety =
            vName.includes("variety") ||
            (item.attribute_type === "product_based" && isNN);

          if (isVariety) {
            const list =
              item.varieties_array && item.varieties_array.length > 0
                ? item.varieties_array
                : item.varieties
                ? item.varieties.split(",").map((v) => v.trim()).filter(Boolean)
                : item.values_array && item.values_array.length > 0
                ? item.values_array
                : item.values
                ? item.values.split(",").map((v) => v.trim()).filter(Boolean)
                : [];

            list.forEach((vr) => {
              const trimmed = vr.trim();
              if (!trimmed) return;
              const lower = trimmed.toLowerCase();
              const existingImg = varietyMap.get(lower);
              const itemImg =
                item.variety_images?.[trimmed] ||
                item.variety_images?.[lower] ||
                item.value_images?.[trimmed] ||
                item.value_images?.[lower];

              if (!varietyMap.has(lower) || (!existingImg && itemImg)) {
                varietyMap.set(lower, itemImg);
              }
            });
          }
        }
      });

      const keys = Array.from(varietyMap.keys()).sort();
      return keys.map((key) => {
        const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
        return {
          name: capitalized,
          image: varietyMap.get(key),
        };
      });
    },
    [variantList, isVariantForBiz, availableBusinesses]
  );

  const activeAddBiz = selectedBizIds[0] || (availableBusinesses[0]?.id ?? "grow-naturals");
  const availableAddCategories = useMemo(
    () => getCategoriesForBiz(activeAddBiz),
    [getCategoriesForBiz, activeAddBiz]
  );
  const addProductCatMap = useMemo(
    () => getProductToCategoryMap(activeAddBiz),
    [getProductToCategoryMap, activeAddBiz]
  );
  const availableAddSizes = useMemo(
    () => getSizesForBiz(activeAddBiz),
    [getSizesForBiz, activeAddBiz]
  );
  const availableAddColors = useMemo(
    () => getColorsForBiz(activeAddBiz),
    [getColorsForBiz, activeAddBiz]
  );
  const availableAddVarieties = useMemo(
    () => getVarietiesForBiz(activeAddBiz),
    [getVarietiesForBiz, activeAddBiz]
  );

  const activeEditBiz = editSelectedBizIds[0] || (availableBusinesses[0]?.id ?? "grow-naturals");
  const availableEditCategories = useMemo(
    () => getCategoriesForBiz(activeEditBiz),
    [getCategoriesForBiz, activeEditBiz]
  );
  const editProductCatMap = useMemo(
    () => getProductToCategoryMap(activeEditBiz),
    [getProductToCategoryMap, activeEditBiz]
  );
  const availableEditSizes = useMemo(
    () => getSizesForBiz(activeEditBiz),
    [getSizesForBiz, activeEditBiz]
  );
  const availableEditColors = useMemo(
    () => getColorsForBiz(activeEditBiz),
    [getColorsForBiz, activeEditBiz]
  );
  const availableEditVarieties = useMemo(
    () => getVarietiesForBiz(activeEditBiz),
    [getVarietiesForBiz, activeEditBiz]
  );

  // Available categories for table filter based on active business tab (no dump data, only actual categories in variant list)
  const availableTableCategories = useMemo(() => {
    const catSet = new Set<string>();
    variantList.forEach((item) => {
      if (businessFilter === "all" || isMappedToBiz(item, businessFilter)) {
        const rawCat = (item.raw?.category || item.category || "").trim();
        if (
          rawCat &&
          rawCat.toLowerCase() !== "general" &&
          rawCat.toLowerCase() !== "product based"
        ) {
          catSet.add(rawCat);
        }
      }
    });
    return Array.from(catSet).sort((a, b) => a.localeCompare(b));
  }, [variantList, businessFilter, isMappedToBiz]);

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

        let vImages: Record<string, string> = {};
        if (va.value_images) {
          if (typeof va.value_images === "object" && va.value_images !== null) {
            vImages = va.value_images;
          } else if (typeof va.value_images === "string") {
            try {
              vImages = JSON.parse(va.value_images);
            } catch {
              vImages = {};
            }
          }
        }

        let vrImages: Record<string, string> = {};
        if (va.variety_images) {
          if (typeof va.variety_images === "object" && va.variety_images !== null) {
            vrImages = va.variety_images;
          } else if (typeof va.variety_images === "string") {
            try {
              vrImages = JSON.parse(va.variety_images);
            } catch {
              vrImages = {};
            }
          }
        }

        const sizesStr = va.sizes || "";
        const sizesArr = sizesStr
          ? sizesStr.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0)
          : [];

        const varietiesStr = va.varieties || "";
        const varietiesArr = varietiesStr
          ? varietiesStr.split(",").map((v: string) => v.trim()).filter((v: string) => v.length > 0)
          : [];

        return {
          id: va.id,
          variant: formatVariantName(va.name || ""),
          values: valStr,
          values_array: valArr,
          patterns: patStr,
          patterns_array: patArr,
          pattern_images: pImages,
          value_images: Object.keys(vImages).length > 0 ? vImages : vrImages,
          sizes: sizesStr,
          sizes_array: sizesArr,
          varieties: varietiesStr,
          varieties_array: varietiesArr,
          variety_images: Object.keys(vrImages).length > 0 ? vrImages : vImages,
          attribute_type: va.attribute_type || "general",
          category: va.category ? va.category : (va.attribute_type === "product_based" ? "Product Based" : "General"),
          product_id: va.product_id || "",
          product_name: va.product_name || "",
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

  // Animated underline tab indicator for Add Modal Choose Store
  const addTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [addIndicatorStyle, setAddIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateAddIndicator = useCallback(() => {
    const activeBiz = selectedBizIds[0];
    const activeEl = activeBiz ? addTabRefs.current[activeBiz] : null;
    if (activeEl && activeEl.offsetWidth > 0) {
      setAddIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [selectedBizIds]);

  useEffect(() => {
    const t = setTimeout(updateAddIndicator, 50);
    return () => clearTimeout(t);
  }, [updateAddIndicator, selectedBizIds]);

  useEffect(() => {
    const modalEl = document.getElementById("add-variant");
    if (!modalEl) return;
    const onShown = () => {
      setTimeout(updateAddIndicator, 60);
    };
    modalEl.addEventListener("shown.bs.modal", onShown);
    return () => {
      modalEl.removeEventListener("shown.bs.modal", onShown);
    };
  }, [updateAddIndicator]);

  // Animated underline tab indicator for Edit Modal Choose Store
  const editTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [editIndicatorStyle, setEditIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateEditIndicator = useCallback(() => {
    const activeBiz = editSelectedBizIds[0];
    const activeEl = activeBiz ? editTabRefs.current[activeBiz] : null;
    if (activeEl && activeEl.offsetWidth > 0) {
      setEditIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [editSelectedBizIds]);

  useEffect(() => {
    const t = setTimeout(updateEditIndicator, 50);
    return () => clearTimeout(t);
  }, [updateEditIndicator, editSelectedBizIds]);

  useEffect(() => {
    const modalEl = document.getElementById("edit-variant");
    if (!modalEl) return;
    const onShown = () => {
      setTimeout(updateEditIndicator, 60);
    };
    modalEl.addEventListener("shown.bs.modal", onShown);
    return () => {
      modalEl.removeEventListener("shown.bs.modal", onShown);
    };
  }, [updateEditIndicator]);

  const handleSearch = (value: any) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Pattern image file change handlers
  const handleAddPatternImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAddError(null);
      const compressed = await compressImageFile(file, {
        maxDimension: 800,
        quality: 0.82,
        maxSizeBytes: 10 * 1024 * 1024,
      });
      setAddCurrentPatternImage(compressed);
    } catch (err: any) {
      setAddError(err.message || "Failed to load pattern image. Please select an image up to 10MB.");
    }
  };

  const handleAddValueImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAddError(null);
      const compressed = await compressImageFile(file, {
        maxDimension: 800,
        quality: 0.82,
        maxSizeBytes: 10 * 1024 * 1024,
      });
      setAddCurrentValueImage(compressed);
    } catch (err: any) {
      setAddError(err.message || "Failed to load image. Please select an image up to 10MB.");
    }
  };

  const handleEditPatternImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEditError(null);
      const compressed = await compressImageFile(file, {
        maxDimension: 800,
        quality: 0.82,
        maxSizeBytes: 10 * 1024 * 1024,
      });
      setEditCurrentPatternImage(compressed);
    } catch (err: any) {
      setEditError(err.message || "Failed to load pattern image. Please select an image up to 10MB.");
    }
  };

  const handleEditValueImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEditError(null);
      const compressed = await compressImageFile(file, {
        maxDimension: 800,
        quality: 0.82,
        maxSizeBytes: 10 * 1024 * 1024,
      });
      setEditCurrentValueImage(compressed);
    } catch (err: any) {
      setEditError(err.message || "Failed to load image. Please select an image up to 10MB.");
    }
  };

  // Reset & prepare Add Modal
  const handleOpenAddModal = () => {
    setVariantName("");
    setAddProductName("");
    setAddSizesList([]);
    setAddSingleSizeInput("");
    setAddValuesList([]);
    setAddSingleValueInput("");
    setAddValueImages({});
    setAddCurrentValueImage(null);
    if (addValueFileInputRef.current) addValueFileInputRef.current.value = "";
    setAddPatternsList([]);
    setAddSinglePatternInput("");
    setAddPatternImages({});
    setAddCurrentPatternImage(null);
    if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
    setVariantStatus(true);
    setAddAttributeType("general");
    setAddCategory("");
    setShowAddCategoryDropdown(false);
    setAddError(null);

    // Pre-select store tab (matching current businessFilter or first business)
    const activeBiz =
      businessFilter && businessFilter !== "all" && availableBusinesses.some((b) => b.id === businessFilter)
        ? businessFilter
        : availableBusinesses[0]?.id || "grow-naturals";
    setSelectedBizIds([activeBiz]);
    const isNN = isNikhleshNurseryOnly([activeBiz], availableBusinesses);
    const defaultOption = isNN ? "Variety" : "Size";
    setVariantNameType(defaultOption);
    setVariantName(defaultOption);
  };

  // Add sizes handlers (one by one)
  const handleAddSingleSize = () => {
    if (!addSingleSizeInput.trim()) return;
    const parts = addSingleSizeInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return;

    setAddSizesList((prev) => {
      const existing = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = parts.filter((p) => !existing.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setAddSingleSizeInput("");
  };

  const handleRemoveSingleSize = (indexToRemove: number) => {
    setAddSizesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

    if (addCurrentValueImage) {
      setAddValueImages((prev) => {
        const next = { ...prev };
        parts.forEach((p) => {
          next[p] = addCurrentValueImage;
        });
        return next;
      });
      setAddCurrentValueImage(null);
      if (addValueFileInputRef.current) addValueFileInputRef.current.value = "";
    }

    setAddSingleValueInput("");
  };

  const handleRemoveSingleValue = (indexToRemove: number) => {
    const valName = addValuesList[indexToRemove];
    setAddValuesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (valName) {
      setAddValueImages((prev) => {
        const next = { ...prev };
        delete next[valName];
        return next;
      });
    }
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

  // Edit sizes handlers (one by one)
  const handleEditAddSingleSize = () => {
    if (!editSingleSizeInput.trim()) return;
    const parts = editSingleSizeInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return;

    setEditSizesList((prev) => {
      const existing = new Set(prev.map((p) => p.toLowerCase()));
      const toAdd = parts.filter((p) => !existing.has(p.toLowerCase()));
      return [...prev, ...toAdd];
    });
    setEditSingleSizeInput("");
  };

  const handleEditRemoveSingleSize = (indexToRemove: number) => {
    setEditSizesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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

    if (editCurrentValueImage) {
      setEditValueImages((prev) => {
        const next = { ...prev };
        parts.forEach((p) => {
          next[p] = editCurrentValueImage;
        });
        return next;
      });
      setEditCurrentValueImage(null);
      if (editValueFileInputRef.current) editValueFileInputRef.current.value = "";
    }

    setEditSingleValueInput("");
  };

  const handleEditRemoveSingleValue = (indexToRemove: number) => {
    const valName = editValuesList[indexToRemove];
    setEditValuesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (valName) {
      setEditValueImages((prev) => {
        const next = { ...prev };
        delete next[valName];
        return next;
      });
    }
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

  const handleVariantNameTypeChange = (newType: string) => {
    setVariantNameType(newType);
    if (newType === "Custom") {
      if (["Size", "Colors", "Variety"].includes(variantName)) {
        setVariantName("");
      }
      setTimeout(() => {
        addVariantInputRef.current?.focus();
      }, 50);
    } else {
      setVariantName(newType);
    }
  };

  const handleEditVariantNameTypeChange = (newType: string) => {
    setEditVariantNameType(newType);
    if (newType === "Custom") {
      if (["Size", "Colors", "Variety"].includes(editVariantName)) {
        setEditVariantName("");
      }
      setTimeout(() => {
        editVariantInputRef.current?.focus();
      }, 50);
    } else {
      setEditVariantName(newType);
    }
  };

  // Select store for Add Modal - tabs selection
  const handleSelectAddBiz = (id: string) => {
    if (selectedBizIds.length === 1 && selectedBizIds[0] === id) return;
    setSelectedBizIds([id]);
    const isNN = isNikhleshNurseryOnly([id], availableBusinesses);
    const defaultOption = isNN ? "Variety" : "Size";
    setVariantNameType(defaultOption);
    setVariantName(defaultOption);
    // Reset inputs & attribute type when switching store so data doesn't cross over
    setAddAttributeType("general");
    setAddCategory("");
    setShowAddCategoryDropdown(false);
    setAddProductName("");
    setAddSizesList([]);
    setAddSingleSizeInput("");
    setAddValuesList([]);
    setAddSingleValueInput("");
    setAddValueImages({});
    setAddCurrentValueImage(null);
    if (addValueFileInputRef.current) addValueFileInputRef.current.value = "";
    setAddPatternsList([]);
    setAddSinglePatternInput("");
    setAddPatternImages({});
    setAddCurrentPatternImage(null);
    if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
    setAddError(null);
  };

  // Switch Attribute Type in Add Modal & clear all entered data
  const handleSelectAddAttributeType = (type: "general" | "product_based") => {
    if (selectedBizIds.length === 0) return;
    if (addAttributeType === type) return;

    setAddAttributeType(type);

    const isNN = isNikhleshNurseryOnly(selectedBizIds, availableBusinesses);
    const defaultOption = isNN ? "Variety" : "Size";
    setVariantNameType(defaultOption);
    setVariantName(defaultOption);

    // Clear all previously entered data so it does not carry over between General and Product Based
    setAddProductName("");
    setAddCategory("");
    setShowAddCategoryDropdown(false);
    setAddSizesList([]);
    setAddSingleSizeInput("");
    setAddValuesList([]);
    setAddSingleValueInput("");
    setAddValueImages({});
    setAddCurrentValueImage(null);
    if (addValueFileInputRef.current) addValueFileInputRef.current.value = "";
    setAddPatternsList([]);
    setAddSinglePatternInput("");
    setAddPatternImages({});
    setAddCurrentPatternImage(null);
    if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
    setAddError(null);
  };

  // Select store for Edit Modal - tabs selection
  const handleSelectEditBiz = (id: string) => {
    if (editSelectedBizIds.length === 1 && editSelectedBizIds[0] === id) return;
    setEditSelectedBizIds([id]);
    const isNN = isNikhleshNurseryOnly([id], availableBusinesses);
    const options = getVariantNameOptions([id], availableBusinesses);
    if (!options.includes(editVariantNameType)) {
      const defaultOption = isNN ? "Variety" : "Size";
      setEditVariantNameType(defaultOption);
      setEditVariantName(defaultOption);
    }
    // Reset inputs & attribute type when switching store so data doesn't cross over
    setEditAttributeType("general");
    setEditProductName("");
    setEditCategory("");
    setShowEditCategoryDropdown(false);
    setEditSizesList([]);
    setEditSingleSizeInput("");
    setEditValuesList([]);
    setEditSingleValueInput("");
    setEditValueImages({});
    setEditCurrentValueImage(null);
    if (editValueFileInputRef.current) editValueFileInputRef.current.value = "";
    setEditPatternsList([]);
    setEditSinglePatternInput("");
    setEditPatternImages({});
    setEditCurrentPatternImage(null);
    if (editPatternFileInputRef.current) editPatternFileInputRef.current.value = "";
    setEditError(null);
  };

  // Switch Attribute Type in Edit Modal & clear entered data
  const handleSelectEditAttributeType = (type: "general" | "product_based") => {
    if (editSelectedBizIds.length === 0) return;
    if (editAttributeType === type) return;

    setEditAttributeType(type);

    // Clear all previously entered data so it does not carry over between General and Product Based
    setEditVariantName("");
    setEditProductName("");
    setEditCategory("");
    setShowEditCategoryDropdown(false);
    setEditSizesList([]);
    setEditSingleSizeInput("");
    setEditValuesList([]);
    setEditSingleValueInput("");
    setEditValueImages({});
    setEditCurrentValueImage(null);
    if (editValueFileInputRef.current) editValueFileInputRef.current.value = "";
    setEditPatternsList([]);
    setEditSinglePatternInput("");
    setEditPatternImages({});
    setEditCurrentPatternImage(null);
    if (editPatternFileInputRef.current) editPatternFileInputRef.current.value = "";
    setEditError(null);
  };

  // Add Variant Attribute
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const isNN = isNikhleshNurseryOnly(selectedBizIds, availableBusinesses);

    if (selectedBizIds.length === 0) {
      setAddError("Please select a business first.");
      return;
    }

    let finalVariantName = (variantNameType === "Custom" || addAttributeType === "product_based") ? variantName.trim() : variantNameType;
    if (!isNN && addAttributeType === "product_based") {
      if (!addProductName.trim()) {
        setAddError("Product name is required.");
        return;
      }
    } else {
      if (!finalVariantName) {
        setAddError(isNN && addAttributeType === "product_based" ? "Product name is required." : (isNN ? "Variant name is required." : "Variant attribute name is required."));
        return;
      }
    }

    // Include any pending single size input
    let finalSizes = [...addSizesList];
    if (addSingleSizeInput.trim()) {
      const pendingSizeParts = addSingleSizeInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existingSizes = new Set(finalSizes.map((p) => p.toLowerCase()));
      const toAddSizes = pendingSizeParts.filter((p) => !existingSizes.has(p.toLowerCase()));
      finalSizes = [...finalSizes, ...toAddSizes];
    }

    // Include any pending single value input
    let finalValues = [...addValuesList];
    let finalValueImages = { ...addValueImages };
    if (addSingleValueInput.trim()) {
      const pendingParts = addSingleValueInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existing = new Set(finalValues.map((p) => p.toLowerCase()));
      const toAdd = pendingParts.filter((p) => !existing.has(p.toLowerCase()));
      finalValues = [...finalValues, ...toAdd];
      if (addCurrentValueImage) {
        toAdd.forEach((v) => {
          finalValueImages[v] = addCurrentValueImage;
        });
      }
    }

    if (addAttributeType === "product_based") {
      if (finalSizes.length === 0) {
        setAddError("Please add at least one Size Attribute.");
        return;
      }
      if (finalValues.length === 0) {
        setAddError(isNN ? "Please add at least one Variety." : "Please add at least one Color.");
        return;
      }
    } else {
      if (finalValues.length === 0) {
        setAddError(isNN ? "Please add at least one Variety." : "Please add at least one value to the list.");
        return;
      }
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
        name: !isNN && addAttributeType === "product_based" ? addProductName.trim() : finalVariantName,
        product_name: addAttributeType === "product_based" ? (isNN ? finalVariantName : addProductName.trim()) : "",
        category: addAttributeType === "product_based" ? addCategory.trim() : "",
        values: finalValues.join(", "),
        sizes: addAttributeType === "product_based" ? finalSizes.join(", ") : "",
        varieties: isNN || addAttributeType === "product_based" ? finalValues.join(", ") : "",
        variety_images: finalValueImages,
        value_images: finalValueImages,
        patterns: showAddPatterns ? finalPatterns.join(", ") : "",
        pattern_images: showAddPatterns ? finalPatternImages : {},
        attribute_type: addAttributeType,
        status: variantStatus ? "Active" : "Inactive",
        business_ids: selectedBizIds,
      });

      // Reset form
      const defaultOption = isNN ? "Variety" : "Size";
      setVariantNameType(defaultOption);
      setVariantName(defaultOption);
      setAddProductName("");
      setAddCategory("");
      setShowAddCategoryDropdown(false);
      setAddSizesList([]);
      setAddSingleSizeInput("");
      setAddValuesList([]);
      setAddSingleValueInput("");
      setAddValueImages({});
      setAddCurrentValueImage(null);
      if (addValueFileInputRef.current) addValueFileInputRef.current.value = "";
      setAddPatternsList([]);
      setAddSinglePatternInput("");
      setAddPatternImages({});
      setAddCurrentPatternImage(null);
      if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
      setVariantStatus(true);
      setAddAttributeType("general");
      setSelectedBizIds([]);
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
    setEditingVariant(row.raw || row);
    const rawName = row.raw?.name || row.variant || "";
    const cleanLower = rawName.trim().toLowerCase();
    if (cleanLower === "size" || cleanLower === "sizes") {
      setEditVariantNameType("Size");
      setEditVariantName("Size");
    } else if (cleanLower === "colors" || cleanLower === "color" || cleanLower === "colour" || cleanLower === "colours") {
      setEditVariantNameType("Colors");
      setEditVariantName("Colors");
    } else if (cleanLower === "variety" || cleanLower === "varieties") {
      setEditVariantNameType("Variety");
      setEditVariantName("Variety");
    } else {
      setEditVariantNameType("Custom");
      setEditVariantName(rawName);
    }
    setEditProductName(row.raw?.product_name || row.product_name || "");

    const sList =
      row.sizes_array && row.sizes_array.length > 0
        ? [...row.sizes_array]
        : (row.raw?.sizes || row.sizes || "")
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
    setEditSizesList(sList);
    setEditSingleSizeInput("");

    const isSize = cleanLower === "size" || cleanLower === "sizes";
    const isColor = cleanLower === "colors" || cleanLower === "color" || cleanLower === "colour" || cleanLower === "colours";

    const vList =
      (isSize || isColor) && row.values_array && row.values_array.length > 0
        ? [...row.values_array]
        : (row.raw?.values || row.values || "")
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
    setEditValuesList(vList);
    setEditSingleValueInput("");
    setEditValueImages(
      row.value_images
        ? { ...row.value_images }
        : row.raw?.value_images
        ? { ...row.raw.value_images }
        : row.variety_images
        ? { ...row.variety_images }
        : {}
    );
    setEditCurrentValueImage(null);
    if (editValueFileInputRef.current) editValueFileInputRef.current.value = "";

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
    setEditAttributeType(row.raw.attribute_type === "product_based" ? "product_based" : "general");
    setEditCategory(
      row.raw?.category ||
      (row.category && row.category !== "General" && row.category !== "Product Based" ? row.category : "") ||
      ""
    );
    setShowEditCategoryDropdown(false);

    let bIds = row.business_ids || [];
    if (!bIds || bIds.length === 0) {
      bIds = row.business_id ? [row.business_id] : [];
    }
    if (bIds.length > 1) {
      bIds = [bIds[0]];
    }
    setEditSelectedBizIds(bIds);
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    setEditError(null);

    const isEditNN = isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses);

    if (editSelectedBizIds.length === 0) {
      setEditError("Please select a business first.");
      return;
    }

    let finalEditVariantName = (editVariantNameType === "Custom" || editAttributeType === "product_based") ? editVariantName.trim() : editVariantNameType;
    if (!isEditNN && editAttributeType === "product_based") {
      if (!editProductName.trim()) {
        setEditError("Product name is required.");
        return;
      }
    } else {
      if (!finalEditVariantName) {
        setEditError(isEditNN && editAttributeType === "product_based" ? "Product name is required." : (isEditNN ? "Variant name is required." : "Variant attribute name is required."));
        return;
      }
    }

    // Include any pending single size input
    let finalSizes = [...editSizesList];
    if (editSingleSizeInput.trim()) {
      const pendingSizeParts = editSingleSizeInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existingSizes = new Set(finalSizes.map((p) => p.toLowerCase()));
      const toAddSizes = pendingSizeParts.filter((p) => !existingSizes.has(p.toLowerCase()));
      finalSizes = [...finalSizes, ...toAddSizes];
    }

    let finalValues = [...editValuesList];
    let finalValueImages = { ...editValueImages };
    if (editSingleValueInput.trim()) {
      const pendingParts = editSingleValueInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const existing = new Set(finalValues.map((p) => p.toLowerCase()));
      const toAdd = pendingParts.filter((p) => !existing.has(p.toLowerCase()));
      finalValues = [...finalValues, ...toAdd];
      if (editCurrentValueImage) {
        toAdd.forEach((v) => {
          finalValueImages[v] = editCurrentValueImage;
        });
      }
    }

    if (editAttributeType === "product_based") {
      if (finalSizes.length === 0) {
        setEditError("Please add at least one Size Attribute.");
        return;
      }
      if (finalValues.length === 0) {
        setEditError(isEditNN ? "Please add at least one Variety." : "Please add at least one Color.");
        return;
      }
    } else {
      if (finalValues.length === 0) {
        setEditError(isEditNN ? "Please add at least one Variety." : "Please add at least one value to the list.");
        return;
      }
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
      const isVirtual = editingVariant.id && String(editingVariant.id).startsWith("virtual-");
      if (isVirtual) {
        await api.post("/variant-attributes", {
          name: !isEditNN && editAttributeType === "product_based" ? editProductName.trim() : finalEditVariantName,
          product_name: editAttributeType === "product_based" ? (isEditNN ? finalEditVariantName : editProductName.trim()) : "",
          category: editAttributeType === "product_based" ? editCategory.trim() : "",
          values: finalValues.join(", "),
          sizes: editAttributeType === "product_based" ? finalSizes.join(", ") : "",
          varieties: isEditNN || editAttributeType === "product_based" ? finalValues.join(", ") : "",
          variety_images: finalValueImages,
          value_images: finalValueImages,
          patterns: showEditPatterns ? finalPatterns.join(", ") : "",
          pattern_images: showEditPatterns ? finalPatternImages : {},
          attribute_type: editAttributeType,
          status: editVariantStatus ? "Active" : "Inactive",
          business_ids: editSelectedBizIds,
        });
      } else {
        await api.put(`/variant-attributes/${editingVariant.id}`, {
          name: !isEditNN && editAttributeType === "product_based" ? editProductName.trim() : finalEditVariantName,
          product_name: editAttributeType === "product_based" ? (isEditNN ? finalEditVariantName : editProductName.trim()) : (editingVariant.product_name || ""),
          category: editAttributeType === "product_based" ? editCategory.trim() : "",
          values: finalValues.join(", "),
          sizes: editAttributeType === "product_based" ? finalSizes.join(", ") : "",
          varieties: isEditNN || editAttributeType === "product_based" ? finalValues.join(", ") : "",
          variety_images: finalValueImages,
          value_images: finalValueImages,
          patterns: showEditPatterns ? finalPatterns.join(", ") : "",
          pattern_images: showEditPatterns ? finalPatternImages : {},
          attribute_type: editAttributeType,
          status: editVariantStatus ? "Active" : "Inactive",
          business_ids: editSelectedBizIds,
        });
      }

      setEditingVariant(null);
      setEditProductName("");
      setEditCategory("");
      setShowEditCategoryDropdown(false);
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
    if (String(deleteVariantId).startsWith("virtual-")) {
      setDeleteVariantId(null);
      const modal = document.getElementById("delete-modal");
      const closeBtn = modal?.querySelector('[data-bs-dismiss="modal"]') as HTMLElement;
      if (closeBtn) closeBtn.click();
      return;
    }
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

  // Filtered dataset with aggregated sizes and colors per business
  const filteredData = useMemo(() => {
    // 1. Get raw items mapped to the currently selected business
    const bizRawItems = variantList.filter((item) => isMappedToBiz(item, businessFilter));

    // 2. Collect all sizes for this business:
    //    - from general Size rows
    //    - from all product-based rows
    const sizesSet = new Set<string>();
    const allSizesList: string[] = [];
    const addSizeItem = (s: string) => {
      const trimmed = s.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!sizesSet.has(lower)) {
        sizesSet.add(lower);
        allSizesList.push(trimmed);
      }
    };

    // First collect from general Size rows
    bizRawItems
      .filter((item) => item.attribute_type !== "product_based" && isSizeVariant(item.variant))
      .forEach((item) => {
        (item.values_array || []).forEach(addSizeItem);
        (item.sizes_array || []).forEach(addSizeItem);
      });

    // Then collect from all product-based rows
    bizRawItems
      .filter((item) => item.attribute_type === "product_based")
      .forEach((item) => {
        (item.sizes_array || []).forEach(addSizeItem);
        if (item.sizes) {
          item.sizes.split(",").forEach(addSizeItem);
        }
      });

    // 3. Collect all colors for this business:
    //    - from general Colors rows
    //    - from all product-based rows
    const colorsSet = new Set<string>();
    const allColorsList: string[] = [];
    const mergedColorImages: Record<string, string> = {};

    const addColorItem = (c: string, img?: string) => {
      const trimmed = c.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!colorsSet.has(lower)) {
        colorsSet.add(lower);
        allColorsList.push(trimmed);
      }
      if (img && !mergedColorImages[trimmed]) {
        mergedColorImages[trimmed] = img;
      }
    };

    // First collect from general Colors rows
    bizRawItems
      .filter((item) => item.attribute_type !== "product_based" && isColorVariant(item.variant))
      .forEach((item) => {
        (item.values_array || []).forEach((val) => {
          const img = item.value_images?.[val] || item.variety_images?.[val];
          addColorItem(val, img);
        });
      });

    // Then collect from all product-based rows
    bizRawItems
      .filter((item) => item.attribute_type === "product_based")
      .forEach((item) => {
        (item.values_array || []).forEach((val) => {
          const img = item.value_images?.[val] || item.variety_images?.[val];
          addColorItem(val, img);
        });
      });

    // 4. Transform items:
    //    - General Size rows get allSizesList
    //    - General Colors rows get allColorsList + mergedColorImages
    //    - Product-based rows retain their own sizes and colors
    let hasGeneralSizeRow = false;
    let hasGeneralColorRow = false;

    const transformedItems: VariantAttributeItem[] = bizRawItems.map((item) => {
      if (item.attribute_type !== "product_based" && isSizeVariant(item.variant)) {
        hasGeneralSizeRow = true;
        const finalSizes = allSizesList.length > 0 ? allSizesList : item.values_array;
        return {
          ...item,
          values: finalSizes.join(", "),
          values_array: finalSizes,
          sizes: finalSizes.join(", "),
          sizes_array: finalSizes,
        };
      }

      if (item.attribute_type !== "product_based" && isColorVariant(item.variant)) {
        hasGeneralColorRow = true;
        const finalColors = allColorsList.length > 0 ? allColorsList : item.values_array;
        const finalImages = { ...(item.value_images || {}), ...mergedColorImages };
        return {
          ...item,
          values: finalColors.join(", "),
          values_array: finalColors,
          value_images: finalImages,
          variety_images: finalImages,
        };
      }

      // Product-based and other items remain as-is in their respective rows
      return item;
    });

    // 5. If no general Size row exists for this business but there are sizes, synthesize a Size row
    const targetBizName =
      availableBusinesses.find((b) => b.id === businessFilter)?.name || "Grow Naturals";

    if (!hasGeneralSizeRow && allSizesList.length > 0) {
      const virtualSizeRow: VariantAttributeItem = {
        id: `virtual-size-${businessFilter}`,
        variant: "Size",
        values: allSizesList.join(", "),
        values_array: allSizesList,
        sizes: allSizesList.join(", "),
        sizes_array: allSizesList,
        attribute_type: "general",
        category: "General",
        createdon: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        status: "Active",
        business_id: businessFilter,
        business_ids: [businessFilter],
        business_name: targetBizName,
        display_business: targetBizName,
        is_mapped_to_both: false,
        raw: {
          id: `virtual-size-${businessFilter}`,
          name: "Size",
          values: allSizesList.join(", "),
          sizes: allSizesList.join(", "),
          attribute_type: "general",
          status: "Active",
          business_id: businessFilter,
          business_ids: [businessFilter],
        },
      };
      transformedItems.unshift(virtualSizeRow);
    }

    // 6. If no general Colors row exists for this business but there are colors (and not NN only), synthesize a Colors row
    const isNN = isNikhleshNurseryOnly([businessFilter], availableBusinesses);
    if (!hasGeneralColorRow && allColorsList.length > 0 && !isNN) {
      const virtualColorRow: VariantAttributeItem = {
        id: `virtual-colors-${businessFilter}`,
        variant: "Colors",
        values: allColorsList.join(", "),
        values_array: allColorsList,
        value_images: mergedColorImages,
        variety_images: mergedColorImages,
        attribute_type: "general",
        category: "General",
        createdon: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        status: "Active",
        business_id: businessFilter,
        business_ids: [businessFilter],
        business_name: targetBizName,
        display_business: targetBizName,
        is_mapped_to_both: false,
        raw: {
          id: `virtual-colors-${businessFilter}`,
          name: "Colors",
          values: allColorsList.join(", "),
          attribute_type: "general",
          value_images: mergedColorImages,
          variety_images: mergedColorImages,
          status: "Active",
          business_id: businessFilter,
          business_ids: [businessFilter],
        },
      };
      transformedItems.splice(hasGeneralSizeRow ? 1 : 0, 0, virtualColorRow);
    }

    // 7. Apply status, category, and search filters
    return transformedItems.filter((item) => {
      // Status filter
      if (statusFilter !== "All" && item.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "All") {
        const itemCat = (item.raw?.category || item.category || "").trim();
        if (itemCat.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }
      }
      // Search query filter
      if (searchQuery && searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.variant.toLowerCase().includes(query);
        const matchesValues = item.values.toLowerCase().includes(query);
        const matchesCategory = (
          item.category || (item.attribute_type === "product_based" ? "Product Based" : "General")
        )
          .toLowerCase()
          .includes(query);
        const matchesDate = item.createdon.toLowerCase().includes(query);
        const matchesBiz = (item.display_business || "").toLowerCase().includes(query);
        return matchesName || matchesValues || matchesCategory || matchesDate || matchesBiz;
      }
      return true;
    });
  }, [variantList, businessFilter, statusFilter, categoryFilter, searchQuery, isMappedToBiz, availableBusinesses]);

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

  const renderCategoryField = (
    isEdit: boolean,
    currentCategory: string,
    onCategoryChange: (val: string) => void,
    showDropdown: boolean,
    setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    categoriesList: string[]
  ) => {
    const filtered = categoriesList.filter(
      (c) => !currentCategory.trim() || c.toLowerCase().includes(currentCategory.trim().toLowerCase())
    );
    const isCustomNew =
      currentCategory.trim() &&
      !categoriesList.some((c) => c.toLowerCase() === currentCategory.trim().toLowerCase());

    const isDropdownVisible = showDropdown && (categoriesList.length > 0 || isCustomNew);

    return (
      <div className="col-12 col-md-6 mb-3" ref={containerRef}>
        <label className="form-label fw-semibold text-dark" style={{ color: "#000000" }}>
          <span style={{ color: "#000000" }}>Category</span>
        </label>
        <div className="position-relative">
          <input
            type="text"
            className="form-control"
            placeholder="Select or type category (e.g. Indoor Plants, Ceramic Pots)"
            value={currentCategory}
            onChange={(e) => {
              onCategoryChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            style={{
              height: "40px",
              paddingRight: categoriesList.length > 0 ? "36px" : "12px",
              borderBottomLeftRadius: isDropdownVisible ? 0 : "6px",
              borderBottomRightRadius: isDropdownVisible ? 0 : "6px",
              borderColor: isDropdownVisible ? "#86b7fe" : undefined,
            }}
          />
          {categoriesList.length > 0 && (
            <button
              type="button"
              className="btn p-0 position-absolute end-0 top-50 translate-middle-y me-2 d-flex align-items-center justify-content-center border-0 bg-transparent shadow-none"
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{
                width: "28px",
                height: "28px",
                border: "none",
                background: "transparent",
                boxShadow: "none",
                cursor: "pointer",
                padding: 0,
              }}
              title="Toggle categories"
            >
              <ChevronDown
                size={16}
                className="text-muted"
                style={{
                  transition: "transform 0.2s ease",
                  transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
          )}

          {isDropdownVisible && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1060,
                backgroundColor: "#ffffff",
                border: "1px solid #86b7fe",
                borderTop: "1px solid #e9ecef",
                borderBottomLeftRadius: "6px",
                borderBottomRightRadius: "6px",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
                maxHeight: "200px",
                overflowY: "auto",
                padding: "4px 0",
              }}
            >
              {filtered.map((cat, idx) => {
                const isSelected = currentCategory.trim().toLowerCase() === cat.toLowerCase();
                return (
                  <div
                    key={idx}
                    className="d-flex align-items-center justify-content-between px-3 py-2"
                    style={{
                      cursor: "pointer",
                      fontSize: "13px",
                      backgroundColor: isSelected ? "#f0f7ff" : "transparent",
                      color: isSelected ? "#0d6efd" : "#212529",
                      fontWeight: isSelected ? 500 : 400,
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => {
                      onCategoryChange(cat);
                      setShowDropdown(false);
                    }}
                  >
                    <span>{cat}</span>
                    {isSelected && <i className="ti ti-check text-primary fs-14" />}
                  </div>
                );
              })}

              {filtered.length === 0 && !isCustomNew && (
                <div className="px-3 py-2 text-muted fs-13 text-center">
                  No matching categories
                </div>
              )}

              {isCustomNew && (
                <div
                  className="d-flex align-items-center gap-2 px-3 py-2 text-success"
                  style={{
                    cursor: "pointer",
                    fontSize: "13px",
                    backgroundColor: "transparent",
                    transition: "background-color 0.15s ease",
                    borderTop: filtered.length > 0 ? "1px solid #f1f5f9" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0fdf4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onClick={() => setShowDropdown(false)}
                >
                  <i className="ti ti-plus fs-14" />
                  <span>Use &quot;<strong>{currentCategory.trim()}</strong>&quot;</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSizeInputField = (
    isEdit: boolean,
    placeholderText: string = "e.g. 4 inch, 6 inch, 8 inch, Small, Medium, Large"
  ) => {
    const currentVal = isEdit ? editSingleSizeInput : addSingleSizeInput;
    const setVal = isEdit ? setEditSingleSizeInput : setAddSingleSizeInput;
    const handleAdd = isEdit ? handleEditAddSingleSize : handleAddSingleSize;
    const showDropdown = isEdit ? showEditSizeDropdown : showAddSizeDropdown;
    const setShowDropdown = isEdit ? setShowEditSizeDropdown : setShowAddSizeDropdown;
    const containerRef = isEdit ? editSizeContainerRef : addSizeContainerRef;
    const sizesList = isEdit ? availableEditSizes : availableAddSizes;
    const currentAddedList = isEdit ? editSizesList : addSizesList;
    const setAddedList = isEdit ? setEditSizesList : setAddSizesList;
    const bizId = isEdit ? activeEditBiz : activeAddBiz;
    const bizName = bizId === "nikhlesh-nursery" ? "Nikhlesh Nursery" : "Grow Naturals";

    const filtered = sizesList.filter(
      (s) => !currentVal.trim() || s.toLowerCase().includes(currentVal.trim().toLowerCase())
    );

    return (
      <div className="d-flex align-items-center gap-2">
        <div className="position-relative flex-grow-1" ref={containerRef}>
          <input
            type="text"
            className="form-control"
            placeholder={placeholderText}
            style={{
              height: "40px",
              paddingRight: sizesList.length > 0 ? "36px" : "12px",
            }}
            value={currentVal}
            onChange={(e) => {
              setVal(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                setShowDropdown(false);
                handleAdd();
              }
            }}
          />
          {sizesList.length > 0 && (
            <button
              type="button"
              className="btn p-0 position-absolute end-0 top-50 translate-middle-y me-2 d-flex align-items-center justify-content-center border-0 bg-transparent shadow-none"
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{
                width: "28px",
                height: "28px",
                cursor: "pointer",
              }}
              title="Show existing sizes"
            >
              <ChevronDown
                size={16}
                className="text-muted"
                style={{
                  transition: "transform 0.2s ease",
                  transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
          )}

          {showDropdown && sizesList.length > 0 && (
            <ul
              className="dropdown-menu show w-100 shadow border mt-1"
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 1060,
              }}
            >
              <li className="dropdown-header d-flex justify-content-between align-items-center text-uppercase fs-11 fw-bold text-muted py-1 px-3">
                <span>Previously Used Sizes ({bizName})</span>
                <span className="badge bg-light text-muted border">{filtered.length}</span>
              </li>
              {filtered.length === 0 ? (
                <li className="text-muted fs-12 py-2 px-3">No matching sizes found</li>
              ) : (
                filtered.map((sz, idx) => {
                  const isAlreadyAdded = currentAddedList.some(
                    (s) => s.toLowerCase() === sz.toLowerCase()
                  );
                  return (
                    <li key={idx}>
                      <div
                        className="dropdown-item d-flex align-items-center justify-content-between py-2 px-3"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setVal(sz);
                          setShowDropdown(false);
                        }}
                      >
                        <span className="d-flex align-items-center gap-2">
                          <i className="ti ti-ruler-2 text-primary fs-14" />
                          <span className="fw-medium text-dark">{sz}</span>
                        </span>
                        {isAlreadyAdded ? (
                          <span className="badge bg-success-subtle text-success fs-10 px-2 py-0 border border-success-subtle">
                            Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary py-0 px-2 fs-11 d-flex align-items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddedList((prev) => {
                                const existing = new Set(prev.map((p) => p.toLowerCase()));
                                if (existing.has(sz.toLowerCase())) return prev;
                                return [...prev, sz];
                              });
                              setShowDropdown(false);
                            }}
                            title={`Add ${sz} directly`}
                          >
                            <i className="ti ti-plus fs-10" /> Add
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary d-flex align-items-center px-3 flex-shrink-0"
          style={{ height: "40px" }}
          onClick={() => {
            setShowDropdown(false);
            handleAdd();
          }}
        >
          <i className="ti ti-plus me-1" /> Add
        </button>
      </div>
    );
  };

  const renderValueWithImageInputField = (
    isEdit: boolean,
    isNN: boolean,
    labelName: string,
    placeholderText: string,
    canUploadImage: boolean,
    itemType?: "size" | "color" | "variety" | "custom"
  ) => {
    const currentVal = isEdit ? editSingleValueInput : addSingleValueInput;
    const setVal = isEdit ? setEditSingleValueInput : setAddSingleValueInput;
    const handleAdd = isEdit ? handleEditAddSingleValue : handleAddSingleValue;
    const showDropdown = isEdit ? showEditColorDropdown : showAddColorDropdown;
    const setShowDropdown = isEdit ? setShowEditColorDropdown : setShowAddColorDropdown;
    const containerRef = isEdit ? editColorContainerRef : addColorContainerRef;
    
    let itemsList: { name: string; image?: string }[] = [];
    if (itemType === "size") {
      itemsList = (isEdit ? availableEditSizes : availableAddSizes).map((s) => ({ name: s }));
    } else if (itemType === "color") {
      itemsList = isEdit ? availableEditColors : availableAddColors;
    } else if (itemType === "variety") {
      itemsList = isEdit ? availableEditVarieties : availableAddVarieties;
    } else if (itemType === "custom") {
      itemsList = [];
    } else {
      itemsList = isNN
        ? (isEdit ? availableEditVarieties : availableAddVarieties)
        : (isEdit ? availableEditColors : availableAddColors);
    }

    const currentAddedList = isEdit ? editValuesList : addValuesList;
    const setAddedList = isEdit ? setEditValuesList : setAddValuesList;
    const setAddedImages = isEdit ? setEditValueImages : setAddValueImages;
    const currentImage = isEdit ? editCurrentValueImage : addCurrentValueImage;
    const setCurrentImage = isEdit ? setEditCurrentValueImage : setAddCurrentValueImage;
    const fileInputRef = isEdit ? editValueFileInputRef : addValueFileInputRef;
    const handleImageChange = isEdit ? handleEditValueImageFileChange : handleAddValueImageFileChange;
    const bizId = isEdit ? activeEditBiz : activeAddBiz;
    const bizName = bizId === "nikhlesh-nursery" ? "Nikhlesh Nursery" : "Grow Naturals";

    const filtered = itemsList.filter(
      (item) => !currentVal.trim() || item.name.toLowerCase().includes(currentVal.trim().toLowerCase())
    );

    return (
      <div className="d-flex align-items-center gap-2">
        <div className="position-relative flex-grow-1" ref={containerRef}>
          <div
            className="d-flex align-items-center flex-grow-1 border rounded bg-white overflow-hidden"
            style={{ borderColor: "#ced4da", height: "40px" }}
          >
            <input
              type="text"
              className="form-control border-0 shadow-none px-3"
              placeholder={placeholderText}
              style={{ height: "100%", background: "transparent", color: "#212529" }}
              value={currentVal}
              onChange={(e) => {
                setVal(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  setShowDropdown(false);
                  handleAdd();
                }
              }}
            />

            {itemsList.length > 0 && (
              <button
                type="button"
                className="btn p-0 me-1 d-flex align-items-center justify-content-center border-0 bg-transparent shadow-none"
                onClick={() => setShowDropdown((prev) => !prev)}
                style={{ width: "24px", height: "24px", cursor: "pointer" }}
                title={`Show existing ${labelName.toLowerCase()}`}
              >
                <ChevronDown
                  size={15}
                  className="text-muted"
                  style={{
                    transition: "transform 0.2s ease",
                    transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
            )}

            {canUploadImage && (
              <div
                className="d-flex align-items-center pe-2 ps-2 flex-shrink-0 border-start"
                style={{ borderColor: "#ced4da", height: "100%", backgroundColor: "#fdfdfe" }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = "";
                  }}
                  onChange={handleImageChange}
                />
                {currentImage ? (
                  <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                    <img
                      src={currentImage}
                      alt={`${labelName} preview`}
                      style={{
                        width: "24px",
                        height: "24px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid #ced4da",
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-link text-danger p-0 ms-1 d-flex align-items-center"
                      style={{ textDecoration: "none", lineHeight: 1 }}
                      onClick={() => {
                        setCurrentImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      title="Remove image"
                    >
                      <i className="ti ti-x fs-13" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm border-0 shadow-none d-flex align-items-center px-2 py-1 text-muted"
                    onClick={() => fileInputRef.current?.click()}
                    title={`Attach image for this ${isNN || itemType === "variety" ? "variety" : "color"}`}
                    style={{ background: "transparent", fontSize: "12px" }}
                  >
                    <i className="ti ti-photo fs-15 text-primary me-1" />
                    <span className="fw-medium text-dark">Image</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {showDropdown && itemsList.length > 0 && (
            <ul
              className="dropdown-menu show w-100 shadow border mt-1"
              style={{
                maxHeight: "220px",
                overflowY: "auto",
                position: "absolute",
                top: "100%",
                left: 0,
                zIndex: 1060,
              }}
            >
              <li className="dropdown-header d-flex justify-content-between align-items-center text-uppercase fs-11 fw-bold text-muted py-1 px-3">
                <span>Previously Used {labelName} ({bizName})</span>
                <span className="badge bg-light text-muted border">{filtered.length}</span>
              </li>
              {filtered.length === 0 ? (
                <li className="text-muted fs-12 py-2 px-3">No matching {labelName.toLowerCase()} found</li>
              ) : (
                filtered.map((item, idx) => {
                  const isAlreadyAdded = currentAddedList.some(
                    (v) => v.toLowerCase() === item.name.toLowerCase()
                  );
                  return (
                    <li key={idx}>
                      <div
                        className="dropdown-item d-flex align-items-center justify-content-between py-2 px-3"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setVal(item.name);
                          if (item.image && !currentImage) {
                            setCurrentImage(item.image);
                          }
                          setShowDropdown(false);
                        }}
                      >
                        <span className="d-flex align-items-center gap-2 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: "20px",
                                height: "20px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                              }}
                            />
                          ) : itemType === "size" ? (
                            <i className="ti ti-ruler-2 text-primary fs-14 flex-shrink-0" />
                          ) : isNN || itemType === "variety" ? (
                            <div
                              className="d-flex align-items-center justify-content-center bg-light border rounded text-success flex-shrink-0"
                              style={{ width: "20px", height: "20px", borderRadius: "4px" }}
                            >
                              <i className="ti ti-leaf fs-11" />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                backgroundColor: item.name.toLowerCase().replace(/\s+/g, ""),
                                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                              }}
                            />
                          )}
                          <span className="fw-medium text-dark text-truncate">{item.name}</span>
                        </span>
                        {isAlreadyAdded ? (
                          <span className="badge bg-success-subtle text-success fs-10 px-2 py-0 border border-success-subtle">
                            Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary py-0 px-2 fs-11 d-flex align-items-center gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddedList((prev) => {
                                const existing = new Set(prev.map((p) => p.toLowerCase()));
                                if (existing.has(item.name.toLowerCase())) return prev;
                                return [...prev, item.name];
                              });
                              if (item.image) {
                                setAddedImages((prev) => ({
                                  ...prev,
                                  [item.name]: item.image!,
                                }));
                              }
                              setShowDropdown(false);
                            }}
                            title={`Add ${item.name} directly`}
                          >
                            <i className="ti ti-plus fs-10" /> Add
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary d-flex align-items-center px-3 flex-shrink-0"
          style={{ height: "40px" }}
          onClick={() => {
            setShowDropdown(false);
            handleAdd();
          }}
        >
          <i className="ti ti-plus me-1" /> Add
        </button>
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
            <div>
              <span className="fw-semibold text-dark fs-14 d-block">{formatVariantName(rowData.variant)}</span>

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
            const isSize = isSizeVariant(rowData.variant);
            const isVariety = isVarietyVariant(rowData.variant);
            const isPB = rowData.attribute_type === "product_based";
            const hasSizes = rowData.sizes_array && rowData.sizes_array.length > 0;
            const isNN = isNikhleshNurseryOnly(rowData.business_ids || (rowData.business_id ? [rowData.business_id] : []), availableBusinesses);

            const renderLabel = (label: string, icon: string, colorClass: string = "text-muted") => (
              <div className="d-flex align-items-center gap-1 fs-11 fw-semibold mb-1">
                <i className={`${icon} fs-12 ${colorClass}`} />
                <span className={colorClass}>{label}</span>
              </div>
            );

            if (isPB) {
              return (
                <div className="d-flex flex-column py-1" style={{ maxWidth: "480px", gap: "8px" }}>
                  {/* Sizes Section */}
                  {hasSizes && (
                    <div>
                      {renderLabel("Sizes:", "ti ti-ruler-2", "text-primary")}
                      <div className="d-flex flex-wrap gap-1 align-items-center">
                        {rowData.sizes_array!.map((sz, idx) => (
                          <span
                            key={idx}
                            className="badge bg-primary-transparent text-primary border border-primary-light px-2 py-0.5 rounded-pill fs-11 fw-normal"
                          >
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors / Varieties Section */}
                  <div>
                    {renderLabel(
                      isNN ? "Varieties:" : "Colors:",
                      isNN ? "ti ti-leaf" : "ti ti-palette",
                      "text-muted"
                    )}
                    <div className="d-flex flex-wrap gap-1 align-items-center">
                      {rowData.values_array.length > 0 ? (
                        rowData.values_array.map((val, idx) => {
                          const valImg = rowData.value_images?.[val] || rowData.variety_images?.[val];
                          return (
                            <span
                              key={idx}
                              className="badge bg-light text-dark border px-2 py-0.5 rounded-pill fs-11 fw-normal d-inline-flex align-items-center gap-1"
                            >
                              {valImg ? (
                                <Popover
                                  title={val}
                                  content={
                                    <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                      <img
                                        src={valImg}
                                        alt={val}
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
                                    src={valImg}
                                    alt={val}
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      objectFit: "cover",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      border: "1px solid #ced4da",
                                    }}
                                  />
                                </Popover>
                              ) : isColor ? (
                                <span
                                  className="rounded-circle border d-inline-block flex-shrink-0"
                                  style={{
                                    width: "9px",
                                    height: "9px",
                                    backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                  }}
                                />
                              ) : null}
                              {val}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted fs-12">—</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // General Attributes
            const generalLabel = isSize
              ? { text: "Sizes:", icon: "ti ti-ruler-2", colorClass: "text-primary" }
              : isColor
              ? { text: "Colors:", icon: "ti ti-palette", colorClass: "text-muted" }
              : isVariety
              ? { text: "Varieties:", icon: "ti ti-leaf", colorClass: "text-success" }
              : { text: "Values:", icon: "ti ti-tag", colorClass: "text-muted" };

            return (
              <div className="d-flex flex-column py-1" style={{ maxWidth: "480px", gap: "8px" }}>
                <div>
                  {renderLabel(generalLabel.text, generalLabel.icon, generalLabel.colorClass)}
                  <div className="d-flex flex-wrap gap-1 align-items-center">
                    {rowData.values_array.length > 0 ? (
                      rowData.values_array.map((val, idx) => {
                        const valImg = rowData.value_images?.[val] || rowData.variety_images?.[val];
                        return (
                          <span
                            key={idx}
                            className={`badge ${
                              isSize
                                ? "bg-primary-transparent text-primary border border-primary-light"
                                : "bg-light text-dark border"
                            } px-2 py-0.5 rounded-pill fs-11 fw-normal d-inline-flex align-items-center gap-1`}
                          >
                            {valImg ? (
                              <Popover
                                title={val}
                                content={
                                  <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                    <img
                                      src={valImg}
                                      alt={val}
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
                                  src={valImg}
                                  alt={val}
                                  style={{
                                    width: "18px",
                                    height: "18px",
                                    objectFit: "cover",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    border: "1px solid #ced4da",
                                  }}
                                />
                              </Popover>
                            ) : isColor ? (
                              <span
                                className="rounded-circle border d-inline-block flex-shrink-0"
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                }}
                              />
                            ) : null}
                            {val}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-muted fs-12">—</span>
                    )}
                  </div>
                </div>

                {isColor && rowData.patterns && (
                  <div>
                    {renderLabel("Patterns:", "ti ti-palette", "text-purple")}
                    <div className="d-flex flex-wrap gap-1 align-items-center">
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
                                      width: "20px",
                                      height: "18px",
                                      objectFit: "cover",
                                      borderRadius: "4px",
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
                  </div>
                )}
              </div>
            );
          },
        },
        {
          field: "category",
          header: "Type",
          key: "category",
          sortable: true,
          body: (rowData: VariantAttributeItem) => {
            const isPB = rowData.attribute_type === "product_based";
            const displayCat =
              rowData.category &&
              rowData.category !== "General" &&
              rowData.category !== "Product Based"
                ? rowData.category
                : isPB
                ? "Product Based"
                : "General";
            return isPB ? (
              <span
                className="badge rounded-pill fs-10 px-2 py-0.5 fw-semibold border d-inline-flex align-items-center gap-1"
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  borderColor: "#bfdbfe",
                }}
                title={displayCat}
              >
                <i className="ti ti-folder fs-10" />
                {displayCat}
              </span>
            ) : (
              <span
                className="badge bg-light text-muted border rounded-pill fs-10 px-2 py-0.5 fw-normal d-inline-flex align-items-center gap-1"
                title="General Attribute"
              >
                <i className="ti ti-layout-grid fs-10" />
                General
              </span>
            );
          },
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
                className="me-2 d-flex align-items-center justify-content-center border rounded hover-dark bg-white"
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#edit-variant"
                onClick={() => handleStartEdit(row)}
                title="Edit Variant"
                style={{ width: "32px", height: "32px" }}
              >
                <Edit size={16} className="text-dark" style={{ color: "#000000" }} />
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
                      {/* Category Filter */}
                      <div className="dropdown me-2">
                        <Link
                          to="#"
                          className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <i className="ti ti-folder me-1 fs-14" />
                          Category: <span className="fw-semibold ms-1">{categoryFilter}</span>
                        </Link>
                        <ul
                          className="dropdown-menu dropdown-menu-end p-2 shadow-sm rounded-2"
                          style={{ maxHeight: "300px", overflowY: "auto", minWidth: "180px" }}
                        >
                          <li>
                            <button
                              type="button"
                              className={`dropdown-item rounded-1 ${categoryFilter === "All" ? "active" : ""}`}
                              onClick={() => {
                                setCategoryFilter("All");
                                setCurrentPage(1);
                              }}
                            >
                              All
                            </button>
                          </li>
                          {availableTableCategories.map((cat, idx) => (
                            <li key={idx}>
                              <button
                                type="button"
                                className={`dropdown-item rounded-1 d-flex align-items-center justify-content-between ${
                                  categoryFilter.toLowerCase() === cat.toLowerCase() ? "active" : ""
                                }`}
                                onClick={() => {
                                  setCategoryFilter(cat);
                                  setCurrentPage(1);
                                }}
                              >
                                <span>{cat}</span>
                                {categoryFilter.toLowerCase() === cat.toLowerCase() && (
                                  <i className="ti ti-check fs-12 ms-2 text-primary" />
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Status Filter */}
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
                              onClick={() => {
                                setStatusFilter("All");
                                setCurrentPage(1);
                              }}
                            >
                              All
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className={`dropdown-item rounded-1 ${statusFilter === "Active" ? "active" : ""}`}
                              onClick={() => {
                                setStatusFilter("Active");
                                setCurrentPage(1);
                              }}
                            >
                              Active
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className={`dropdown-item rounded-1 ${statusFilter === "Inactive" ? "active" : ""}`}
                              onClick={() => {
                                setStatusFilter("Inactive");
                                setCurrentPage(1);
                              }}
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
                                setCategoryFilter("All");
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
                    {/* <span className="text-muted fs-12">Define a reusable variant and preview values on the right</span> */}
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
                        {/* Choose Store Tabs */}
                        <div className="mb-3">
                          <div className="position-relative border-bottom">
                            <ul className="nav border-bottom-0 gap-3 gap-sm-4" role="tablist">
                              {availableBusinesses.map((biz) => {
                                const isSelected = selectedBizIds.includes(biz.id);
                                return (
                                  <li key={biz.id} className="nav-item">
                                    <button
                                      ref={(el) => {
                                        addTabRefs.current[biz.id] = el;
                                      }}
                                      type="button"
                                      className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 position-relative ${
                                        isSelected ? "fw-bold" : "text-muted fw-medium"
                                      }`}
                                      style={{
                                        boxShadow: "none",
                                        background: "transparent",
                                        paddingTop: "4px",
                                        paddingBottom: "8px",
                                        color: isSelected ? "#127a3c" : "#5b6b79",
                                        cursor: "pointer",
                                        transition: "color 0.2s ease",
                                      }}
                                      onClick={() => handleSelectAddBiz(biz.id)}
                                    >
                                      <span>{biz.name}</span>
                                      {isSelected && !addIndicatorStyle.ready && (
                                        <span
                                          style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: "3px",
                                            backgroundColor: "#127a3c",
                                            borderRadius: "3px 3px 0 0",
                                          }}
                                        />
                                      )}
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
                                left: `${addIndicatorStyle.left}px`,
                                width: `${addIndicatorStyle.width}px`,
                                height: "3px",
                                backgroundColor: "#127a3c",
                                borderRadius: "3px 3px 0 0",
                                transition: addIndicatorStyle.ready
                                  ? "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)"
                                  : "none",
                                pointerEvents: "none",
                                opacity: addIndicatorStyle.ready && addIndicatorStyle.width > 0 ? 1 : 0,
                              }}
                            />
                          </div>
                        </div>

                        {/* Attribute Type: General vs Product Based */}
                        <div className="mb-3">
                          <div className="p-3 border rounded bg-light-subtle">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <div
                                className={`form-check mb-0 d-flex align-items-center px-3 py-2 border rounded ${
                                  addAttributeType === "general"
                                    ? "border-primary bg-white shadow-xs fw-semibold text-primary"
                                    : "border-transparent bg-white text-dark"
                                }`}
                                onClick={() => handleSelectAddAttributeType("general")}
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <input
                                  className="form-check-input me-2 mt-0 flex-shrink-0"
                                  type="radio"
                                  name="add_attribute_type"
                                  id="add_attr_type_general"
                                  checked={addAttributeType === "general"}
                                  onChange={() => handleSelectAddAttributeType("general")}
                                  style={{ cursor: "pointer" }}
                                />
                                <label
                                  className="form-check-label fs-13 d-flex align-items-center mb-0 text-dark"
                                  htmlFor="add_attr_type_general"
                                  style={{ cursor: "pointer", color: "#000000" }}
                                >
                                  <span style={{ color: "#000000" }}>General</span>
                                </label>
                              </div>

                              <div
                                className={`form-check mb-0 d-flex align-items-center px-3 py-2 border rounded ${
                                  addAttributeType === "product_based"
                                    ? "border-primary bg-white shadow-xs fw-semibold text-primary"
                                    : "border-transparent bg-white text-dark"
                                }`}
                                onClick={() => handleSelectAddAttributeType("product_based")}
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <input
                                  className="form-check-input me-2 mt-0 flex-shrink-0"
                                  type="radio"
                                  name="add_attribute_type"
                                  id="add_attr_type_product"
                                  checked={addAttributeType === "product_based"}
                                  onChange={() => handleSelectAddAttributeType("product_based")}
                                  style={{ cursor: "pointer" }}
                                />
                                <label
                                  className="form-check-label fs-13 d-flex align-items-center mb-0 text-dark"
                                  htmlFor="add_attr_type_product"
                                  style={{ cursor: "pointer", color: "#000000" }}
                                >
                                  <span style={{ color: "#000000" }}>Product Based</span>
                                </label>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* CASE 1: NIKHLESH NURSERY + PRODUCT BASED -> Size Attribute and Variety listed one by one */}
                        {isNikhleshNurseryOnly(selectedBizIds, availableBusinesses) && addAttributeType === "product_based" ? (
                          <>
                            {/* Product Name and Category side by side */}
                            <div className="row">
                              <div className="col-12 col-md-6 mb-3">
                                <label className="form-label fw-semibold text-dark" style={{ color: "#000000" }}>
                                  <span style={{ color: "#000000" }}>Product Name</span><span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  ref={addVariantInputRef}
                                  className="form-control"
                                  placeholder="e.g. Mango Variety, Bougainvillea, Hibiscus"
                                  value={variantName === "Variety" ? "" : variantName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setVariantName(val);
                                    const mapped = addProductCatMap[val.trim().toLowerCase()];
                                    if (mapped && !addCategory) {
                                      setAddCategory(mapped);
                                    }
                                  }}
                                  style={{
                                    height: "40px",
                                  }}
                                  required
                                  autoFocus
                                />
                              </div>

                              {/* Category */}
                              {renderCategoryField(
                                false,
                                addCategory,
                                setAddCategory,
                                showAddCategoryDropdown,
                                setShowAddCategoryDropdown,
                                addCategoryContainerRef,
                                availableAddCategories
                              )}
                            </div>

                            {/* Section 1: Size Attribute */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Size Attribute<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {addSizesList.length > 0 ? `${addSizesList.length} added` : "Add one by one"}
                                </span>
                              </label>
                                {renderSizeInputField(false, "e.g. 1 ft, 2 ft, 5 ft, 6 inch")}
                                <span className="tag-text mt-1 d-block text-muted fs-12">
                                  Type size and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                                </span>
                            </div>

                            {/* Section 2: Variety (below Size Attribute) */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Variety<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {addValuesList.length > 0 ? `${addValuesList.length} added` : "with photo"}
                                </span>
                              </label>
                              {renderValueWithImageInputField(false, true, "Varieties", "e.g. Alphonso, Kesar, Dasheri", true, "variety")}
                              <span className="tag-text mt-1 d-block text-muted fs-12">
                                Type variety name, attach an optional image, and click <strong>+ Add</strong>.
                              </span>
                            </div>
                          </>
                        ) : !isNikhleshNurseryOnly(selectedBizIds, availableBusinesses) && addAttributeType === "product_based" ? (
                          /* CASE 2: GROW NATURALS + PRODUCT BASED -> Product Name, Variant Name, Size Attributes, Variants with photo upload */
                          <>
                            {/* Product Name and Category side by side */}
                            <div className="row">
                              <div className="col-12 col-md-6 mb-3">
                                <label className="form-label fw-semibold text-dark" style={{ color: "#000000" }}>
                                  <span style={{ color: "#000000" }}>Product Name</span><span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g. Terracotta Pot, Ceramic Planter, Monstera Deliciosa"
                                  value={addProductName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setAddProductName(val);
                                    const mapped = addProductCatMap[val.trim().toLowerCase()];
                                    if (mapped && !addCategory) {
                                      setAddCategory(mapped);
                                    }
                                  }}
                                  style={{ height: "40px" }}
                                  required
                                  autoFocus
                                />
                              </div>

                              {/* Category */}
                              {renderCategoryField(
                                false,
                                addCategory,
                                setAddCategory,
                                showAddCategoryDropdown,
                                setShowAddCategoryDropdown,
                                addCategoryContainerRef,
                                availableAddCategories
                              )}
                            </div>


                            {/* Section: Size Attributes */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Size<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {addSizesList.length > 0 ? `${addSizesList.length} added` : "Add one by one"}
                                </span>
                              </label>
                                {renderSizeInputField(false, "e.g. 4 inch, 6 inch, 8 inch, Small, Medium, Large")}
                                <span className="tag-text mt-1 d-block text-muted fs-12">
                                  Type size and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                                </span>
                            </div>

                            {/* Section: Colors (with image uploading option) */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Colors<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {addValuesList.length > 0 ? `${addValuesList.length} added` : "with photo"}
                                </span>
                              </label>
                              {renderValueWithImageInputField(false, false, "Colors", "e.g. Red, Matte Black, Terracotta, White", true, "color")}
                              <span className="tag-text mt-1 d-block text-muted fs-12">
                                Type color, attach an optional image, and click <strong>+ Add</strong>.
                              </span>
                            </div>
                          </>
                        ) : (
                          /* CASE 3: GENERAL ATTRIBUTE (Same as it was for both GN and NN) */
                          <>
                            {/* Variant Name */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark" style={{ color: "#000000" }}>
                                <span style={{ color: "#000000" }}>Variant Name</span>
                                <span className="ms-1" style={{ color: "#000000" }}>*</span>
                              </label>
                              <div className="input-group">
                                <input
                                  type="text"
                                  ref={addVariantInputRef}
                                  className="form-control"
                                  placeholder={
                                    variantNameType === "Custom"
                                      ? (isNikhleshNurseryOnly(selectedBizIds, availableBusinesses)
                                          ? "e.g. Plant Type, Soil Mix, Bougainvillea"
                                          : "e.g. Pot Material, Pack Weight, Material")
                                      : "Variant Name"
                                  }
                                  value={variantName}
                                  onChange={(e) => setVariantName(e.target.value)}
                                  readOnly={variantNameType !== "Custom"}
                                  style={{
                                    backgroundColor: variantNameType !== "Custom" ? "#fbfcfd" : "#ffffff",
                                    cursor: variantNameType !== "Custom" ? "default" : "text",
                                    height: "40px",
                                  }}
                                  required
                                  autoFocus={variantNameType === "Custom"}
                                />
                                <select
                                  className="form-select flex-grow-0"
                                  style={{
                                    width: "120px",
                                    backgroundColor: "#f8f9fa",
                                    borderColor: "#ced4da",
                                    fontWeight: 500,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    height: "40px",
                                  }}
                                  value={variantNameType}
                                  onChange={(e) => handleVariantNameTypeChange(e.target.value)}
                                >
                                  {getVariantNameOptions(selectedBizIds, availableBusinesses).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Values / Variety Values / Colour Variant input one by one */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span className="text-capitalize" style={{ color: "#000000" }}>
                                  {isNikhleshNurseryOnly(selectedBizIds, availableBusinesses)
                                    ? "Variety Values"
                                    : variantName.trim()
                                    ? `${variantName.trim()} Values`
                                    : "Variant Values"}
                                  <span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {addValuesList.length > 0
                                    ? `${addValuesList.length} added`
                                    : "Add one by one"}
                                </span>
                              </label>

                              {/* Value input with recommendation dropdown and optional image */}
                              {renderValueWithImageInputField(
                                false,
                                isNikhleshNurseryOnly(selectedBizIds, availableBusinesses),
                                isSizeVariant(variantName)
                                  ? "Sizes"
                                  : isColorVariant(variantName)
                                  ? "Colors"
                                  : isVarietyVariant(variantName)
                                  ? "Varieties"
                                  : "Values",
                                isNikhleshNurseryOnly(selectedBizIds, availableBusinesses)
                                  ? "e.g. Alphonso, Kesar, Dasheri"
                                  : isColorVariant(variantName)
                                  ? "e.g. Red, Matte Black, Terracotta"
                                  : isSizeVariant(variantName)
                                  ? "e.g. 4 inch, 6 inch, Small, Medium"
                                  : "e.g. Small, 500g, 10-inch",
                                !isGrowNaturals(selectedBizIds, availableBusinesses) || isColorVariant(variantName),
                                isSizeVariant(variantName)
                                  ? "size"
                                  : isColorVariant(variantName)
                                  ? "color"
                                  : isVarietyVariant(variantName)
                                  ? "variety"
                                  : "custom"
                              )}

                              <span className="tag-text mt-1 d-block text-muted fs-12">
                                {(!isGrowNaturals(selectedBizIds, availableBusinesses) || isColorVariant(variantName))
                                  ? "Type an item, attach an optional image, and click + Add."
                                  : "Type an item and click + Add."}
                              </span>
                            </div>

                            {/* Pattern field - ONLY for colors if not Grow Naturals */}
                            {showAddPatterns && (
                              <div className="mb-3">
                                <label
                                  className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                  style={{ color: "#000000" }}
                                >
                                  <span style={{ color: "#000000" }}>
                                    Pattern / Finish <span className="ms-1 fs-12 fw-normal" style={{ color: "#000000" }}>(Optional)</span>
                                  </span>
                                  <span className="text-muted fs-11 fw-normal">
                                    {addPatternsList.length > 0 ? `${addPatternsList.length} added` : "e.g. Marble, Solid"}
                                  </span>
                                </label>
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    className="d-flex align-items-center flex-grow-1 border rounded bg-white overflow-hidden"
                                    style={{
                                      borderColor: "#ced4da",
                                      height: "40px",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      className="form-control border-0 shadow-none px-3"
                                      placeholder="e.g. Solid, Striped, Marble, Glossy"
                                      style={{ height: "100%", background: "transparent", color: "#212529" }}
                                      value={addSinglePatternInput}
                                      onChange={(e) => setAddSinglePatternInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === ",") {
                                          e.preventDefault();
                                          handleAddSinglePattern();
                                        }
                                      }}
                                    />

                                    {canUploadPatternImage(selectedBizIds, availableBusinesses) && (
                                      <div
                                        className="d-flex align-items-center pe-2 ps-2 flex-shrink-0 border-start"
                                        style={{ borderColor: "#ced4da", height: "100%", backgroundColor: "#fdfdfe" }}
                                      >
                                        <input
                                          type="file"
                                          ref={addPatternFileInputRef}
                                          accept="image/*"
                                          style={{ display: "none" }}
                                          onClick={(e) => {
                                            (e.target as HTMLInputElement).value = "";
                                          }}
                                          onChange={handleAddPatternImageFileChange}
                                        />
                                        {addCurrentPatternImage ? (
                                          <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                                            <img
                                              src={addCurrentPatternImage}
                                              alt="Pattern preview"
                                              style={{
                                                width: "24px",
                                                height: "24px",
                                                objectFit: "cover",
                                                borderRadius: "4px",
                                                border: "1px solid #ced4da",
                                              }}
                                            />
                                            <button
                                              type="button"
                                              className="btn btn-link text-danger p-0 ms-1 d-flex align-items-center"
                                              style={{ textDecoration: "none", lineHeight: 1 }}
                                              onClick={() => {
                                                setAddCurrentPatternImage(null);
                                                if (addPatternFileInputRef.current) addPatternFileInputRef.current.value = "";
                                              }}
                                              title="Remove image"
                                            >
                                              <i className="ti ti-x fs-13" />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            className="btn btn-sm border-0 shadow-none d-flex align-items-center px-2 py-1 text-muted"
                                            onClick={() => addPatternFileInputRef.current?.click()}
                                            title="Attach image for this pattern"
                                            style={{
                                              background: "transparent",
                                              fontSize: "12px",
                                            }}
                                          >
                                            <i className="ti ti-photo fs-15 text-primary me-1" />
                                            <span className="fw-medium text-dark">Image</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    className="btn btn-primary d-flex align-items-center px-3 flex-shrink-0"
                                    style={{ height: "40px" }}
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
                          </>
                        )}

                        {/* Status Toggle */}
                        <div className="mb-0 mt-3 p-2 bg-light rounded">
                          <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                            <span className="status-label fw-semibold fs-13 text-dark" style={{ color: "#000000" }}>Status (Active / Inactive)</span>
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
                          <div className="card-body p-3 d-flex flex-column flex-grow-1">
                            {/* IF PRODUCT BASED: SHOW BOTH SIZES AND VARIANTS PREVIEW */}
                            {addAttributeType === "product_based" ? (
                              <>
                                {/* Product Name Preview at Top */}
                                {(isNikhleshNurseryOnly(selectedBizIds, availableBusinesses) ? variantName.trim() : addProductName.trim()) ? (
                                  <div style={{ marginBottom: "14px" }}>
                                    <span className="fw-bold fs-15 text-dark text-truncate d-block" style={{ color: "#000000" }}>
                                      {isNikhleshNurseryOnly(selectedBizIds, availableBusinesses)
                                        ? variantName.trim()
                                        : addProductName.trim()}
                                    </span>
                                    {addCategory.trim() && (
                                      <span
                                        className="badge rounded-pill fs-11 px-2 py-0.5 mt-1 border d-inline-flex align-items-center gap-1"
                                        style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}
                                      >
                                        <i className="ti ti-folder fs-11" />
                                        {addCategory.trim()}
                                      </span>
                                    )}
                                  </div>
                                ) : null}

                                {/* Sizes Preview Header & List */}
                                <div style={{ marginBottom: "18px" }}>
                                  <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "10px" }}>
                                    <span className="fs-12 fw-semibold text-dark text-uppercase d-inline-flex align-items-center" style={{ color: "#000000", gap: "6px" }}>
                                      <i className="ti ti-ruler-2 fs-14 text-muted" />
                                      Size Attributes ({addSizesList.length})
                                    </span>
                                    {addSizesList.length > 0 && (
                                      <button
                                        type="button"
                                        className="btn btn-link text-danger p-0 fs-11 text-decoration-none"
                                        onClick={() => setAddSizesList([])}
                                      >
                                        Clear
                                      </button>
                                    )}
                                  </div>

                                  {addSizesList.length === 0 ? (
                                    <div className="text-center py-3 px-2 border border-dashed rounded bg-white">
                                      <i className="ti ti-ruler-2 fs-20 text-muted mb-1 d-block" />
                                      <p className="fs-12 text-muted mb-0 fw-medium">No sizes added yet</p>
                                      <span className="fs-11 text-muted">e.g. 4 inch, 6 inch, Small, Medium</span>
                                    </div>
                                  ) : (
                                    <div className="pe-1" style={{ maxHeight: "160px", overflowY: "auto" }}>
                                      <div className="d-flex flex-column" style={{ gap: "8px" }}>
                                        {addSizesList.map((sz, sIdx) => (
                                          <div
                                            key={sIdx}
                                            className="d-flex align-items-center justify-content-between bg-white border shadow-xs"
                                            style={{
                                              padding: "8px 14px",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <div className="d-flex align-items-center flex-grow-1 overflow-hidden" style={{ gap: "12px" }}>
                                              <span
                                                className="badge bg-light text-secondary border fw-semibold flex-shrink-0"
                                                style={{
                                                  fontSize: "11px",
                                                  padding: "4px 8px",
                                                  borderRadius: "6px",
                                                  lineHeight: 1,
                                                }}
                                              >
                                                #{sIdx + 1}
                                              </span>
                                              <span className="fw-medium text-dark text-truncate" style={{ fontSize: "13px", lineHeight: 1.2 }}>
                                                {sz}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                                              style={{ width: "24px", height: "24px", lineHeight: 1 }}
                                              onClick={() => handleRemoveSingleSize(sIdx)}
                                              title={`Remove ${sz}`}
                                            >
                                              <i className="ti ti-x fs-13 text-danger" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Colors / Varieties Preview Header & List */}
                                <div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "10px" }}>
                                    <span className="fs-12 fw-semibold text-dark text-uppercase d-inline-flex align-items-center" style={{ color: "#000000", gap: "6px" }}>
                                      <i className="ti ti-palette fs-14 text-muted" />
                                      {isNikhleshNurseryOnly(selectedBizIds, availableBusinesses)
                                        ? `Varieties (${addValuesList.length})`
                                        : `Colors (${addValuesList.length})`}
                                    </span>
                                    {addValuesList.length > 0 && (
                                      <button
                                        type="button"
                                        className="btn btn-link text-danger p-0 fs-11 text-decoration-none"
                                        onClick={() => setAddValuesList([])}
                                      >
                                        Clear
                                      </button>
                                    )}
                                  </div>

                                  {addValuesList.length === 0 ? (
                                    <div className="text-center py-3 px-2 border border-dashed rounded bg-white">
                                      <i className="ti ti-palette fs-20 text-muted mb-1 d-block" />
                                      <p className="fs-12 text-muted mb-0 fw-medium">
                                        No {isNikhleshNurseryOnly(selectedBizIds, availableBusinesses) ? "varieties" : "colors"} added yet
                                      </p>
                                      <span className="fs-11 text-muted">
                                        {isNikhleshNurseryOnly(selectedBizIds, availableBusinesses)
                                          ? "e.g. Alphonso, Kesar, Dasheri"
                                          : "e.g. Red, Matte Black, Terracotta"}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="pe-1" style={{ maxHeight: "240px", overflowY: "auto" }}>
                                      <div className="d-flex flex-column" style={{ gap: "8px" }}>
                                        {addValuesList.map((val, idx) => {
                                          const valImg = addValueImages[val];
                                          return (
                                            <div
                                              key={idx}
                                              className="d-flex align-items-center justify-content-between bg-white border shadow-xs"
                                              style={{
                                                padding: "8px 14px",
                                                borderRadius: "8px",
                                              }}
                                            >
                                              <div className="d-flex align-items-center flex-grow-1 overflow-hidden" style={{ gap: "12px" }}>
                                                <span
                                                  className="badge bg-light text-secondary border fw-semibold flex-shrink-0"
                                                  style={{
                                                    fontSize: "11px",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    lineHeight: 1,
                                                  }}
                                                >
                                                  #{idx + 1}
                                                </span>
                                                {valImg ? (
                                                  <Popover
                                                    title={val}
                                                    content={
                                                      <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                                        <img
                                                          src={valImg}
                                                          alt={val}
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
                                                      src={valImg}
                                                      alt={val}
                                                      className="flex-shrink-0 cursor-pointer d-block"
                                                      style={{
                                                        width: "35px",
                                                        height: "35px",
                                                        objectFit: "cover",
                                                        borderRadius: "6px",
                                                        border: "1px solid #ced4da",
                                                      }}
                                                    />
                                                  </Popover>
                                                ) : isNikhleshNurseryOnly(selectedBizIds, availableBusinesses) ? (
                                                  <div
                                                    className="d-flex align-items-center justify-content-center bg-light border rounded flex-shrink-0"
                                                    style={{ width: "35px", height: "35px", borderRadius: "6px" }}
                                                  >
                                                    <i className="ti ti-leaf fs-14 text-success" />
                                                  </div>
                                                ) : (
                                                  <div
                                                    className="flex-shrink-0"
                                                    style={{
                                                      width: "35px",
                                                      height: "35px",
                                                      borderRadius: "6px",
                                                      border: "1px solid #ced4da",
                                                      backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
                                                    }}
                                                  />
                                                )}
                                                <span
                                                  className="fw-medium text-dark text-truncate"
                                                  style={{
                                                    fontSize: "13px",
                                                    textTransform: "capitalize",
                                                    lineHeight: 1.2,
                                                  }}
                                                  title={val}
                                                >
                                                  {val}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                                                style={{ width: "24px", height: "24px", lineHeight: 1 }}
                                                onClick={() => handleRemoveSingleValue(idx)}
                                                title={`Remove ${val}`}
                                              >
                                                <i className="ti ti-x fs-13 text-danger" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              /* STANDARD GENERAL PREVIEW */
                              <>
                                {/* Values Preview Section */}
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fs-12 fw-semibold text-dark text-capitalize" style={{ color: "#000000" }}>
                                    {isNikhleshNurseryOnly(selectedBizIds, availableBusinesses)
                                      ? (variantName.trim() ? `${variantName.trim()} Preview` : "Variant Values Preview")
                                      : (variantName.trim() ? `${variantName.trim()} Preview` : "Values Preview")}
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
                                      No {variantName.trim() ? variantName.trim().toLowerCase() : isNikhleshNurseryOnly(selectedBizIds, availableBusinesses) ? "varieties" : "values"} added yet
                                    </p>
                                    <span className="fs-11 text-muted">
                                      Type on the left and hit <kbd className="bg-light text-dark border px-1">Enter</kbd> to add
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    className="pe-1 mb-2"
                                    style={{
                                      maxHeight: showAddPatterns ? "170px" : "320px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <div className="d-flex flex-column gap-1">
                                      {addValuesList.map((val, idx) => {
                                        const valImg = addValueImages[val];
                                        return (
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
                                              {valImg ? (
                                                <Popover
                                                  title={val}
                                                  content={
                                                    <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                                      <img
                                                        src={valImg}
                                                        alt={val}
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
                                                    src={valImg}
                                                    alt={val}
                                                    className="flex-shrink-0 cursor-pointer"
                                                    style={{
                                                      width: "35px",
                                                      height: "35px",
                                                      objectFit: "cover",
                                                      borderRadius: "6px",
                                                      border: "1px solid #ced4da",
                                                    }}
                                                  />
                                                </Popover>
                                              ) : isColorVariant(variantName) ? (
                                                <span
                                                  className="border d-inline-block flex-shrink-0"
                                                  style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    borderRadius: "6px",
                                                    border: "1px solid #ced4da",
                                                    backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                                  }}
                                                />
                                              ) : !isGrowNaturals(selectedBizIds, availableBusinesses) ? (
                                                <div
                                                  className="d-flex align-items-center justify-content-center bg-light border rounded text-muted flex-shrink-0"
                                                  style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    borderRadius: "6px",
                                                  }}
                                                  title="No image attached"
                                                >
                                                  <i className="ti ti-photo fs-14" />
                                                </div>
                                              ) : null}
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
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Pattern List Preview (if colour) */}
                                {showAddPatterns && (
                                  <div className="mt-2 pt-2 border-top">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-12 fw-semibold text-dark text-uppercase" style={{ color: "#000000" }}>
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
                                      <div className="text-center py-3 px-2 border border-dashed rounded bg-white">
                                        <i className="ti ti-palette fs-24 text-muted mb-1 d-block" />
                                        <p className="fs-12 text-muted mb-0 fw-medium">No patterns added yet</p>
                                        <span className="fs-11 text-muted">
                                          Optional: Add patterns like Solid, Marble, Striped
                                        </span>
                                      </div>
                                    ) : (
                                      <div
                                        className="pe-1 mb-2"
                                        style={{
                                          maxHeight: "170px",
                                          overflowY: "auto",
                                        }}
                                      >
                                        <div className="d-flex flex-column gap-1">
                                          {addPatternsList.map((pat, pIdx) => {
                                            const patImg = addPatternImages[pat];
                                            return (
                                              <div
                                                key={pIdx}
                                                className="d-flex align-items-center justify-content-between p-2 bg-white border rounded shadow-xs"
                                              >
                                                <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                  <span
                                                    className="badge bg-light text-muted border fs-10 px-1 py-0 fw-semibold"
                                                    style={{ minWidth: "24px" }}
                                                  >
                                                    #{pIdx + 1}
                                                  </span>

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
                                                        className="flex-shrink-0 cursor-pointer"
                                                        style={{
                                                          width: "35px",
                                                          height: "35px",
                                                          objectFit: "cover",
                                                          borderRadius: "6px",
                                                          border: "1px solid #ced4da",
                                                        }}
                                                      />
                                                    </Popover>
                                                  ) : (
                                                    <div
                                                      className="d-flex align-items-center justify-content-center bg-light border rounded text-muted flex-shrink-0"
                                                      style={{
                                                        width: "35px",
                                                        height: "35px",
                                                        borderRadius: "6px",
                                                      }}
                                                      title="No image attached"
                                                    >
                                                      <i className="ti ti-palette fs-14" />
                                                    </div>
                                                  )}

                                                  <span className="fw-medium text-dark fs-12 text-truncate" title={pat}>
                                                    {pat}
                                                  </span>
                                                </div>

                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0"
                                                  style={{ lineHeight: 1 }}
                                                  onClick={() => handleRemoveSinglePattern(pIdx)}
                                                  title={`Remove ${pat}`}
                                                >
                                                  <i className="ti ti-x fs-13 text-danger" />
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Combinations preview if both colors and patterns are present */}
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
                              </>
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
                        {/* Choose Store Tabs */}
                        <div className="mb-3">
                          <div className="position-relative border-bottom">
                            <ul className="nav border-bottom-0 gap-3 gap-sm-4" role="tablist">
                              {availableBusinesses.map((biz) => {
                                const isSelected = editSelectedBizIds.includes(biz.id);
                                return (
                                  <li key={biz.id} className="nav-item">
                                    <button
                                      ref={(el) => {
                                        editTabRefs.current[biz.id] = el;
                                      }}
                                      type="button"
                                      className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 position-relative ${
                                        isSelected ? "fw-bold" : "text-muted fw-medium"
                                      }`}
                                      style={{
                                        boxShadow: "none",
                                        background: "transparent",
                                        paddingTop: "4px",
                                        paddingBottom: "8px",
                                        color: isSelected ? "#127a3c" : "#5b6b79",
                                        cursor: "pointer",
                                        transition: "color 0.2s ease",
                                      }}
                                      onClick={() => handleSelectEditBiz(biz.id)}
                                    >
                                      <span>{biz.name}</span>
                                      {isSelected && !editIndicatorStyle.ready && (
                                        <span
                                          style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            height: "3px",
                                            backgroundColor: "#127a3c",
                                            borderRadius: "3px 3px 0 0",
                                          }}
                                        />
                                      )}
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
                                left: `${editIndicatorStyle.left}px`,
                                width: `${editIndicatorStyle.width}px`,
                                height: "3px",
                                backgroundColor: "#127a3c",
                                borderRadius: "3px 3px 0 0",
                                transition: editIndicatorStyle.ready
                                  ? "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)"
                                  : "none",
                                pointerEvents: "none",
                                opacity: editIndicatorStyle.ready && editIndicatorStyle.width > 0 ? 1 : 0,
                              }}
                            />
                          </div>
                        </div>

                        {/* Attribute Type: General vs Product Based */}
                        <div className="mb-3">
                          <div className="p-3 border rounded bg-light-subtle">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <div
                                className={`form-check mb-0 d-flex align-items-center px-3 py-2 border rounded ${
                                  editAttributeType === "general"
                                    ? "border-primary bg-white shadow-xs fw-semibold text-primary"
                                    : "border-transparent bg-white text-dark"
                                }`}
                                onClick={() => handleSelectEditAttributeType("general")}
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <input
                                  className="form-check-input me-2 mt-0 flex-shrink-0"
                                  type="radio"
                                  name="edit_attribute_type"
                                  id="edit_attr_type_general"
                                  checked={editAttributeType === "general"}
                                  onChange={() => handleSelectEditAttributeType("general")}
                                  style={{ cursor: "pointer" }}
                                />
                                <label
                                  className="form-check-label fs-13 d-flex align-items-center mb-0 text-dark"
                                  htmlFor="edit_attr_type_general"
                                  style={{ cursor: "pointer", color: "#000000" }}
                                >
                                  <span style={{ color: "#000000" }}>General</span>
                                </label>
                              </div>

                              <div
                                className={`form-check mb-0 d-flex align-items-center px-3 py-2 border rounded ${
                                  editAttributeType === "product_based"
                                    ? "border-primary bg-white shadow-xs fw-semibold text-primary"
                                    : "border-transparent bg-white text-dark"
                                }`}
                                onClick={() => handleSelectEditAttributeType("product_based")}
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <input
                                  className="form-check-input me-2 mt-0 flex-shrink-0"
                                  type="radio"
                                  name="edit_attribute_type"
                                  id="edit_attr_type_product"
                                  checked={editAttributeType === "product_based"}
                                  onChange={() => handleSelectEditAttributeType("product_based")}
                                  style={{ cursor: "pointer" }}
                                />
                                <label
                                  className="form-check-label fs-13 d-flex align-items-center mb-0 text-dark"
                                  htmlFor="edit_attr_type_product"
                                  style={{ cursor: "pointer", color: "#000000" }}
                                >
                                  <span style={{ color: "#000000" }}>Product Based</span>
                                </label>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* CASE 1: NIKHLESH NURSERY + PRODUCT BASED -> Size Attribute and Variety listed one by one */}
                        {isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses) && editAttributeType === "product_based" ? (
                          <>
                            {/* Product Name and Category side by side */}
                            <div className="row">
                              <div className="col-12 col-md-6 mb-3">
                                <label className="form-label fw-semibold text-dark" style={{ color: "#000000" }}>
                                  <span style={{ color: "#000000" }}>Product Name</span><span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  ref={editVariantInputRef}
                                  className="form-control"
                                  placeholder="e.g. Mango Variety, Bougainvillea, Hibiscus"
                                  value={editVariantName === "Variety" ? "" : editVariantName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditVariantName(val);
                                    const mapped = editProductCatMap[val.trim().toLowerCase()];
                                    if (mapped && !editCategory) {
                                      setEditCategory(mapped);
                                    }
                                  }}
                                  style={{
                                    height: "40px",
                                  }}
                                  required
                                  autoFocus
                                />
                              </div>

                              {/* Category */}
                              {renderCategoryField(
                                true,
                                editCategory,
                                setEditCategory,
                                showEditCategoryDropdown,
                                setShowEditCategoryDropdown,
                                editCategoryContainerRef,
                                availableEditCategories
                              )}
                            </div>

                            {/* Section 1: Size Attribute */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Size Attribute<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {editSizesList.length > 0 ? `${editSizesList.length} added` : "Add one by one"}
                                </span>
                              </label>
                                {renderSizeInputField(true, "e.g. 1 ft, 2 ft, 5 ft, 6 inch")}
                                <span className="tag-text mt-1 d-block text-muted fs-12">
                                  Type size and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                                </span>
                            </div>

                            {/* Section 2: Variety (below Size Attribute) */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Variety<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {editValuesList.length > 0 ? `${editValuesList.length} added` : "with photo"}
                                </span>
                              </label>
                              {renderValueWithImageInputField(true, true, "Varieties", "e.g. Alphonso, Kesar, Dasheri", true, "variety")}
                              <span className="tag-text mt-1 d-block text-muted fs-12">
                                Type variety name, attach an optional image, and click <strong>+ Add</strong>.
                              </span>
                            </div>
                          </>
                        ) : !isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses) && editAttributeType === "product_based" ? (
                          /* CASE 2: GROW NATURALS + PRODUCT BASED -> Product Name, Variant Name, Size Attributes, Variants with photo upload */
                          <>
                            {/* Product Name and Category side by side */}
                            <div className="row">
                              <div className="col-12 col-md-6 mb-3">
                                <label className="form-label fw-semibold text-dark" style={{ color: "#000000" }}>
                                  <span style={{ color: "#000000" }}>Product Name</span><span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g. Terracotta Pot, Ceramic Planter, Monstera Deliciosa"
                                  value={editProductName}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditProductName(val);
                                    const mapped = editProductCatMap[val.trim().toLowerCase()];
                                    if (mapped && !editCategory) {
                                      setEditCategory(mapped);
                                    }
                                  }}
                                  style={{ height: "40px" }}
                                  required
                                />
                              </div>

                              {/* Category */}
                              {renderCategoryField(
                                true,
                                editCategory,
                                setEditCategory,
                                showEditCategoryDropdown,
                                setShowEditCategoryDropdown,
                                editCategoryContainerRef,
                                availableEditCategories
                              )}
                            </div>


                            {/* Section: Size Attributes */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Size<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {editSizesList.length > 0 ? `${editSizesList.length} added` : "Add one by one"}
                                </span>
                              </label>
                                {renderSizeInputField(true, "e.g. 4 inch, 6 inch, 8 inch, Small, Medium, Large")}
                                <span className="tag-text mt-1 d-block text-muted fs-12">
                                  Type size and press <kbd className="bg-light text-dark border px-1 rounded">Enter</kbd> or click <strong>+ Add</strong>.
                                </span>
                            </div>

                            {/* Section: Colors (with image uploading option) */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span style={{ color: "#000000" }}>
                                  Colors<span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {editValuesList.length > 0 ? `${editValuesList.length} added` : "with photo"}
                                </span>
                              </label>
                              {renderValueWithImageInputField(true, false, "Colors", "e.g. Red, Matte Black, Terracotta, White", true, "color")}
                              <span className="tag-text mt-1 d-block text-muted fs-12">
                                Type color, attach an optional image, and click <strong>+ Add</strong>.
                              </span>
                            </div>
                          </>
                        ) : (
                          /* CASE 3: GENERAL ATTRIBUTE (Same as it was for both GN and NN) */
                          <>
                            {/* Variant Name */}
                            <div className="mb-3">
                              <label className="form-label fw-semibold text-dark" style={{ color: "#000000" }}>
                                <span style={{ color: "#000000" }}>Variant Name</span>
                                <span className="ms-1" style={{ color: "#000000" }}>*</span>
                              </label>
                              <div className="input-group">
                                <input
                                  type="text"
                                  ref={editVariantInputRef}
                                  className="form-control"
                                  placeholder={
                                    editVariantNameType === "Custom"
                                      ? (isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses)
                                          ? "e.g. Plant Type, Soil Mix, Bougainvillea"
                                          : "e.g. Pot Material, Pack Weight, Material")
                                      : "Variant Name"
                                  }
                                  value={editVariantName}
                                  onChange={(e) => setEditVariantName(e.target.value)}
                                  readOnly={editVariantNameType !== "Custom"}
                                  style={{
                                    backgroundColor: editVariantNameType !== "Custom" ? "#fbfcfd" : "#ffffff",
                                    cursor: editVariantNameType !== "Custom" ? "default" : "text",
                                    height: "40px",
                                  }}
                                  required
                                  autoFocus={editVariantNameType === "Custom"}
                                />
                                <select
                                  className="form-select flex-grow-0"
                                  style={{
                                    width: "120px",
                                    backgroundColor: "#f8f9fa",
                                    borderColor: "#ced4da",
                                    fontWeight: 500,
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    height: "40px",
                                  }}
                                  value={editVariantNameType}
                                  onChange={(e) => handleEditVariantNameTypeChange(e.target.value)}
                                >
                                  {getVariantNameOptions(editSelectedBizIds, availableBusinesses).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Values / Variety Values / Colour Variant input one by one */}
                            <div className="mb-3">
                              <label
                                className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                style={{ color: "#000000" }}
                              >
                                <span className="text-capitalize" style={{ color: "#000000" }}>
                                  {isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses)
                                    ? "Variety Values"
                                    : editVariantName.trim()
                                    ? `${editVariantName.trim()} Values`
                                    : "Variant Values"}
                                  <span className="ms-1" style={{ color: "#000000" }}>*</span>
                                </span>
                                <span className="text-muted fs-11 fw-normal">
                                  {editValuesList.length > 0
                                    ? `${editValuesList.length} added`
                                    : "Add one by one"}
                                </span>
                              </label>

                              {/* Value input with recommendation dropdown and optional image */}
                              {renderValueWithImageInputField(
                                true,
                                isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses),
                                isSizeVariant(editVariantName)
                                  ? "Sizes"
                                  : isColorVariant(editVariantName)
                                  ? "Colors"
                                  : isVarietyVariant(editVariantName)
                                  ? "Varieties"
                                  : "Values",
                                isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses)
                                  ? "e.g. Alphonso, Kesar, Dasheri"
                                  : isColorVariant(editVariantName)
                                  ? "e.g. Red, Matte Black, Terracotta"
                                  : isSizeVariant(editVariantName)
                                  ? "e.g. 4 inch, 6 inch, Small, Medium"
                                  : "e.g. Small, 500g, 10-inch",
                                !isGrowNaturals(editSelectedBizIds, availableBusinesses) || isColorVariant(editVariantName),
                                isSizeVariant(editVariantName)
                                  ? "size"
                                  : isColorVariant(editVariantName)
                                  ? "color"
                                  : isVarietyVariant(editVariantName)
                                  ? "variety"
                                  : "custom"
                              )}

                              <span className="tag-text mt-1 d-block text-muted fs-12">
                                {(!isGrowNaturals(editSelectedBizIds, availableBusinesses) || isColorVariant(editVariantName))
                                  ? "Type an item, attach an optional image, and click + Add."
                                  : "Type an item and click + Add."}
                              </span>
                            </div>

                            {/* Pattern field - ONLY for colors if not Grow Naturals */}
                            {showEditPatterns && (
                              <div className="mb-3">
                                <label
                                  className="form-label fw-semibold d-flex justify-content-between align-items-center mb-1 text-dark"
                                  style={{ color: "#000000" }}
                                >
                                  <span style={{ color: "#000000" }}>
                                    Pattern / Finish <span className="ms-1 fs-12 fw-normal" style={{ color: "#000000" }}>(Optional)</span>
                                  </span>
                                  <span className="text-muted fs-11 fw-normal">
                                    {editPatternsList.length > 0 ? `${editPatternsList.length} added` : "e.g. Marble, Solid"}
                                  </span>
                                </label>
                                <div className="d-flex align-items-center gap-2">
                                  {/* Textbox and Image Option in the same box with seamless merged borders */}
                                  <div
                                    className="d-flex align-items-center flex-grow-1 border rounded bg-white overflow-hidden"
                                    style={{
                                      borderColor: "#ced4da",
                                      height: "40px",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      className="form-control border-0 shadow-none px-3"
                                      placeholder="e.g. Solid, Striped, Marble, Glossy"
                                      style={{ height: "100%", background: "transparent", color: "#212529" }}
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
                                      <div
                                        className="d-flex align-items-center pe-2 ps-2 flex-shrink-0 border-start"
                                        style={{ borderColor: "#ced4da", height: "100%", backgroundColor: "#fdfdfe" }}
                                      >
                                        <input
                                          type="file"
                                          ref={editPatternFileInputRef}
                                          accept="image/*"
                                          style={{ display: "none" }}
                                          onClick={(e) => {
                                            (e.target as HTMLInputElement).value = "";
                                          }}
                                          onChange={handleEditPatternImageFileChange}
                                        />
                                        {editCurrentPatternImage ? (
                                          <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded">
                                            <img
                                              src={editCurrentPatternImage}
                                              alt="Pattern preview"
                                              style={{
                                                width: "24px",
                                                height: "24px",
                                                objectFit: "cover",
                                                borderRadius: "4px",
                                                border: "1px solid #ced4da",
                                              }}
                                            />
                                            <button
                                              type="button"
                                              className="btn btn-link text-danger p-0 ms-1 d-flex align-items-center"
                                              style={{ textDecoration: "none", lineHeight: 1 }}
                                              onClick={() => {
                                                setEditCurrentPatternImage(null);
                                                if (editPatternFileInputRef.current) editPatternFileInputRef.current.value = "";
                                              }}
                                              title="Remove image"
                                            >
                                              <i className="ti ti-x fs-13" />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            className="btn btn-sm border-0 shadow-none d-flex align-items-center px-2 py-1 text-muted"
                                            onClick={() => editPatternFileInputRef.current?.click()}
                                            title="Attach image for this pattern"
                                            style={{
                                              background: "transparent",
                                              fontSize: "12px",
                                            }}
                                          >
                                            <i className="ti ti-photo fs-15 text-primary me-1" />
                                            <span className="fw-medium text-dark">Image</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Separate Add Button */}
                                  <button
                                    type="button"
                                    className="btn btn-primary d-flex align-items-center px-3 flex-shrink-0"
                                    style={{ height: "40px" }}
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
                          </>
                        )}

                        {/* Status Toggle */}
                        <div className="mb-0 mt-3 p-2 bg-light rounded">
                          <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                            <span className="status-label fw-semibold fs-13 text-dark" style={{ color: "#000000" }}>Status (Active / Inactive)</span>
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
                          <div className="card-body p-3 d-flex flex-column flex-grow-1">
                            {editAttributeType === "product_based" ? (
                              /* PRODUCT BASED PREVIEW */
                              <>
                                {/* Product Name Preview at Top */}
                                {(isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses) ? editVariantName.trim() : editProductName.trim()) ? (
                                  <div style={{ marginBottom: "14px" }}>
                                    <span className="fw-bold fs-15 text-dark text-truncate d-block" style={{ color: "#000000" }}>
                                      {isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses)
                                        ? editVariantName.trim()
                                        : editProductName.trim()}
                                    </span>
                                    {editCategory.trim() && (
                                      <span
                                        className="badge rounded-pill fs-11 px-2 py-0.5 mt-1 border d-inline-flex align-items-center gap-1"
                                        style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}
                                      >
                                        <i className="ti ti-folder fs-11" />
                                        {editCategory.trim()}
                                      </span>
                                    )}
                                  </div>
                                ) : null}

                                {/* Sizes Preview */}
                                <div style={{ marginBottom: "18px" }}>
                                  <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "10px" }}>
                                    <span className="fs-12 fw-semibold text-dark text-uppercase d-inline-flex align-items-center" style={{ color: "#000000", gap: "6px" }}>
                                      <i className="ti ti-ruler-2 fs-14 text-muted" />
                                      Size Attributes ({editSizesList.length})
                                    </span>
                                    {editSizesList.length > 0 && (
                                      <button
                                        type="button"
                                        className="btn btn-link text-danger p-0 fs-11 text-decoration-none"
                                        onClick={() => setEditSizesList([])}
                                      >
                                        Clear sizes
                                      </button>
                                    )}
                                  </div>

                                  {editSizesList.length === 0 ? (
                                    <div className="text-center py-3 px-2 border border-dashed rounded bg-white">
                                      <i className="ti ti-ruler-2 fs-20 text-muted mb-1 d-block" />
                                      <p className="fs-12 text-muted mb-0 fw-medium">No sizes added yet</p>
                                      <span className="fs-11 text-muted">e.g. 4 inch, 6 inch, 1 ft, Small</span>
                                    </div>
                                  ) : (
                                    <div className="pe-1" style={{ maxHeight: "160px", overflowY: "auto" }}>
                                      <div className="d-flex flex-column" style={{ gap: "8px" }}>
                                        {editSizesList.map((sz, sIdx) => (
                                          <div
                                            key={sIdx}
                                            className="d-flex align-items-center justify-content-between bg-white border shadow-xs"
                                            style={{
                                              padding: "8px 14px",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <div className="d-flex align-items-center flex-grow-1 overflow-hidden" style={{ gap: "12px" }}>
                                              <span
                                                className="badge bg-light text-secondary border fw-semibold flex-shrink-0"
                                                style={{
                                                  fontSize: "11px",
                                                  padding: "4px 8px",
                                                  borderRadius: "6px",
                                                  lineHeight: 1,
                                                }}
                                              >
                                                #{sIdx + 1}
                                              </span>
                                              <span className="fw-medium text-dark text-truncate" style={{ fontSize: "13px", lineHeight: 1.2 }}>
                                                {sz}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                                              style={{ width: "24px", height: "24px", lineHeight: 1 }}
                                              onClick={() => handleEditRemoveSingleSize(sIdx)}
                                              title={`Remove ${sz}`}
                                            >
                                              <i className="ti ti-x fs-13 text-danger" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Colors / Varieties Preview */}
                                <div>
                                  <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "10px" }}>
                                    <span className="fs-12 fw-semibold text-dark text-uppercase d-inline-flex align-items-center" style={{ color: "#000000", gap: "6px" }}>
                                      <i className="ti ti-palette fs-14 text-muted" />
                                      {isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses)
                                        ? `Varieties (${editValuesList.length})`
                                        : `Colors (${editValuesList.length})`}
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
                                    <div className="text-center py-3 px-2 border border-dashed rounded bg-white">
                                      <i className="ti ti-palette fs-20 text-muted mb-1 d-block" />
                                      <p className="fs-12 text-muted mb-0 fw-medium">
                                        No {isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses) ? "varieties" : "colors"} added yet
                                      </p>
                                      <span className="fs-11 text-muted">
                                        {isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses)
                                          ? "e.g. Alphonso, Kesar, Dasheri"
                                          : "e.g. Red, Matte Black, Terracotta"}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="pe-1" style={{ maxHeight: "240px", overflowY: "auto" }}>
                                      <div className="d-flex flex-column" style={{ gap: "8px" }}>
                                        {editValuesList.map((val, idx) => {
                                          const valImg = editValueImages[val];
                                          return (
                                            <div
                                              key={idx}
                                              className="d-flex align-items-center justify-content-between bg-white border shadow-xs"
                                              style={{
                                                padding: "8px 14px",
                                                borderRadius: "8px",
                                              }}
                                            >
                                              <div className="d-flex align-items-center flex-grow-1 overflow-hidden" style={{ gap: "12px" }}>
                                                <span
                                                  className="badge bg-light text-secondary border fw-semibold flex-shrink-0"
                                                  style={{
                                                    fontSize: "11px",
                                                    padding: "4px 8px",
                                                    borderRadius: "6px",
                                                    lineHeight: 1,
                                                  }}
                                                >
                                                  #{idx + 1}
                                                </span>
                                                {valImg ? (
                                                  <Popover
                                                    title={val}
                                                    content={
                                                      <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                                        <img
                                                          src={valImg}
                                                          alt={val}
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
                                                      src={valImg}
                                                      alt={val}
                                                      className="flex-shrink-0 cursor-pointer d-block"
                                                      style={{
                                                        width: "35px",
                                                        height: "35px",
                                                        objectFit: "cover",
                                                        borderRadius: "6px",
                                                        border: "1px solid #ced4da",
                                                      }}
                                                    />
                                                  </Popover>
                                                ) : isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses) ? (
                                                  <div
                                                    className="d-flex align-items-center justify-content-center bg-light border rounded text-muted flex-shrink-0"
                                                    style={{ width: "35px", height: "35px", borderRadius: "6px" }}
                                                  >
                                                    <i className="ti ti-leaf fs-14 text-success" />
                                                  </div>
                                                ) : (
                                                  <div
                                                    className="flex-shrink-0"
                                                    style={{
                                                      width: "35px",
                                                      height: "35px",
                                                      borderRadius: "6px",
                                                      border: "1px solid #ced4da",
                                                      backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05)",
                                                    }}
                                                  />
                                                )}
                                                <span
                                                  className="fw-medium text-dark text-truncate"
                                                  style={{
                                                    fontSize: "13px",
                                                    textTransform: "capitalize",
                                                    lineHeight: 1.2,
                                                  }}
                                                  title={val}
                                                >
                                                  {val}
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0 d-flex align-items-center justify-content-center"
                                                style={{ width: "24px", height: "24px", lineHeight: 1 }}
                                                onClick={() => handleEditRemoveSingleValue(idx)}
                                                title={`Remove ${val}`}
                                              >
                                                <i className="ti ti-x fs-13 text-danger" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              /* STANDARD GENERAL PREVIEW */
                              <>
                                {/* Values Preview Section */}
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fs-12 fw-semibold text-dark text-capitalize" style={{ color: "#000000" }}>
                                    {isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses)
                                      ? (editVariantName.trim() ? `${editVariantName.trim()} Preview` : "Variant Values Preview")
                                      : (editVariantName.trim() ? `${editVariantName.trim()} Preview` : "Values Preview")}
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
                                      No {editVariantName.trim() ? editVariantName.trim().toLowerCase() : isNikhleshNurseryOnly(editSelectedBizIds, availableBusinesses) ? "varieties" : "values"} added yet
                                    </p>
                                    <span className="fs-11 text-muted">
                                      Type on the left and hit <kbd className="bg-light text-dark border px-1">Enter</kbd> to add
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    className="pe-1 mb-2"
                                    style={{
                                      maxHeight: showEditPatterns ? "170px" : "320px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    <div className="d-flex flex-column gap-1">
                                      {editValuesList.map((val, idx) => {
                                        const valImg = editValueImages[val];
                                        return (
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
                                              {valImg ? (
                                                <Popover
                                                  title={val}
                                                  content={
                                                    <div style={{ maxWidth: "160px", textAlign: "center" }}>
                                                      <img
                                                        src={valImg}
                                                        alt={val}
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
                                                    src={valImg}
                                                    alt={val}
                                                    className="flex-shrink-0 cursor-pointer"
                                                    style={{
                                                      width: "35px",
                                                      height: "35px",
                                                      objectFit: "cover",
                                                      borderRadius: "6px",
                                                      border: "1px solid #ced4da",
                                                    }}
                                                  />
                                                </Popover>
                                              ) : isColorVariant(editVariantName) ? (
                                                <span
                                                  className="border d-inline-block flex-shrink-0"
                                                  style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    borderRadius: "6px",
                                                    border: "1px solid #ced4da",
                                                    backgroundColor: val.toLowerCase().replace(/\s+/g, ""),
                                                  }}
                                                />
                                              ) : !isGrowNaturals(editSelectedBizIds, availableBusinesses) ? (
                                                <div
                                                  className="d-flex align-items-center justify-content-center bg-light border rounded text-muted flex-shrink-0"
                                                  style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    borderRadius: "6px",
                                                  }}
                                                  title="No image attached"
                                                >
                                                  <i className="ti ti-photo fs-14" />
                                                </div>
                                              ) : null}
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
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Pattern List Preview (if colour) */}
                                {showEditPatterns && (
                                  <div className="mt-2 pt-2 border-top">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fs-12 fw-semibold text-dark text-uppercase" style={{ color: "#000000" }}>
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
                                      <div className="text-center py-3 px-2 border border-dashed rounded bg-white">
                                        <i className="ti ti-palette fs-24 text-muted mb-1 d-block" />
                                        <p className="fs-12 text-muted mb-0 fw-medium">No patterns added yet</p>
                                        <span className="fs-11 text-muted">
                                          Optional: Add patterns like Solid, Marble, Striped
                                        </span>
                                      </div>
                                    ) : (
                                      <div
                                        className="pe-1 mb-2"
                                        style={{
                                          maxHeight: "170px",
                                          overflowY: "auto",
                                        }}
                                      >
                                        <div className="d-flex flex-column gap-1">
                                          {editPatternsList.map((pat, pIdx) => {
                                            const patImg = editPatternImages[pat];
                                            return (
                                              <div
                                                key={pIdx}
                                                className="d-flex align-items-center justify-content-between p-2 bg-white border rounded shadow-xs"
                                              >
                                                <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                  <span
                                                    className="badge bg-light text-muted border fs-10 px-1 py-0 fw-semibold"
                                                    style={{ minWidth: "24px" }}
                                                  >
                                                    #{pIdx + 1}
                                                  </span>

                                                  {/* Box shape image or icon */}
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
                                                        className="flex-shrink-0 cursor-pointer"
                                                        style={{
                                                          width: "35px",
                                                          height: "35px",
                                                          objectFit: "cover",
                                                          borderRadius: "6px",
                                                          border: "1px solid #ced4da",
                                                        }}
                                                      />
                                                    </Popover>
                                                  ) : (
                                                    <div
                                                      className="d-flex align-items-center justify-content-center bg-light border rounded text-muted flex-shrink-0"
                                                      style={{
                                                        width: "35px",
                                                        height: "35px",
                                                        borderRadius: "6px",
                                                      }}
                                                      title="No image attached"
                                                    >
                                                      <i className="ti ti-palette fs-14" />
                                                    </div>
                                                  )}

                                                  {/* Text on side */}
                                                  <span className="fw-medium text-dark fs-12 text-truncate" title={pat}>
                                                    {pat}
                                                  </span>
                                                </div>

                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-icon text-muted p-0 border-0 ms-2 flex-shrink-0"
                                                  style={{ lineHeight: 1 }}
                                                  onClick={() => handleEditRemoveSinglePattern(pIdx)}
                                                  title={`Remove ${pat}`}
                                                >
                                                  <i className="ti ti-x fs-13 text-danger" />
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
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
