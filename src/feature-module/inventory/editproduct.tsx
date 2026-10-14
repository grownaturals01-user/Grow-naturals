import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import { api, getActiveBusinessId } from "../../services/api";
import { batchService, BatchRecord } from "../../services/batchService";
import { Editor } from "primereact/editor";
import AddCategory from "../../core/modals/inventory/addcategory";
import AddVariant from "../../core/modals/inventory/addvariant";
import AddVarientNew from "../../core/modals/inventory/addVarientNew";
import CommonSelect from "../../components/select/common-select";
import "../../styles/product-wizard.css";
import "../../styles/purchase-batch.css";
import { ImMagicWand } from "react-icons/im";
import {
  ArrowLeft,
  ArrowRight,
  Settings,
  ChevronDown,
  Check,
  Trash2,
  Layers,
  DollarSign,
  Package,
  Image as ImageIcon,
  Plus,
  GripVertical,
  Copy,
  ShoppingBag,
  Building2,
  Percent,
} from "lucide-react";

export interface ProductVariationItem {
  id: string;
  size: string;
  color: string;
  colorCode: string;
  variant: string;
  sku: string;
  image: string;
  status: boolean;
  purchasePrice?: string;
  purchaseTaxType?: "Inclusive" | "Exclusive" | string;
  expensePercent?: string;
  actualPrice?: string;
  profitMarginPercent?: string;
  gstPercent?: string;
  salesPrice?: string;
  retailPriceWithTax?: string;
  retailPriceWithoutTax?: string;
  wholesalePriceWithTax?: string;
  wholesalePriceWithoutTax?: string;
}

export const ROW_GST_OPTIONS = [
  { value: "0", label: "None (0%)" },
  { value: "5", label: "GST 5%" },
  { value: "12", label: "GST 12%" },
  { value: "18", label: "GST 18%" },
  { value: "28", label: "GST 28%" },
];

export const TAX_STATUS_OPTIONS = [
  { value: "taxable", label: "Taxable" },
  { value: "non-taxable", label: "Non-Taxable" },
];

export const GST_RATE_OPTIONS = [
  { value: "0", label: "0% (Nil / Exempt)" },
  { value: "5", label: "GST 5%" },
  { value: "12", label: "GST 12%" },
  { value: "18", label: "GST 18%" },
  { value: "28", label: "GST 28%" },
];

export const SIZE_OPTIONS = [
  { value: "6 inch", label: "6 inch" },
  { value: "8 inch", label: "8 inch" },
  { value: "10 inch", label: "10 inch" },
  { value: "12 inch", label: "12 inch" },
  { value: "14 inch", label: "14 inch" },
  { value: "Small", label: "Small" },
  { value: "Medium", label: "Medium" },
  { value: "Large", label: "Large" },
  { value: "XL", label: "XL" },
];

export const COLOR_OPTIONS = [
  { value: "White", label: "White", hex: "#FFFFFF" },
  { value: "Black", label: "Black", hex: "#111827" },
  { value: "Beige", label: "Beige", hex: "#E8C39E" },
  { value: "Terracotta", label: "Terracotta", hex: "#D97706" },
  { value: "Green", label: "Green", hex: "#059669" },
  { value: "Grey", label: "Grey", hex: "#6B7280" },
  { value: "Brown", label: "Brown", hex: "#78350F" },
  { value: "Blue", label: "Blue", hex: "#2563EB" },
  { value: "Red", label: "Red", hex: "#DC2626" },
];

export const VARIANT_OPTIONS = [
  { value: "Ceramic", label: "Ceramic" },
  { value: "Clay", label: "Clay" },
  { value: "Plastic", label: "Plastic" },
  { value: "Fiberglass", label: "Fiberglass" },
  { value: "Matte", label: "Matte" },
  { value: "Glossy", label: "Glossy" },
  { value: "Standard", label: "Standard" },
  { value: "With Drainage", label: "With Drainage" },
  { value: "No Drainage", label: "No Drainage" },
];

const INITIAL_VARIATIONS: ProductVariationItem[] = [
  {
    id: "var-1",
    size: "6 inch",
    color: "White",
    colorCode: "#FFFFFF",
    variant: "Ceramic",
    sku: "GNCP001-6-WH",
    image: "",
    status: true,
    purchasePrice: "100",
    purchaseTaxType: "Inclusive",
    expensePercent: "80",
    actualPrice: "180",
    profitMarginPercent: "50",
    gstPercent: "0",
    salesPrice: "270",
    retailPriceWithTax: "270",
    retailPriceWithoutTax: "270",
    wholesalePriceWithTax: "240",
    wholesalePriceWithoutTax: "240",
  },
];

export interface ProductPriceRow {
  id: string;
  variant: string;
  color: string;
  size: string;
  purchasePrice: string;
  purchaseTaxType: string;
  salesPrice: string;
  salesTaxType: string;
  mrp: string;
  wholesalePrice: string;
  wholesaleTaxType: string;
  shopQuantity: string;
  warehouseQuantity: string;
  alertQuantity: string;
}

const WIZARD_STEPS = [
  { id: 1, key: "basic", label: "Basic Details" },
  { id: 2, key: "variations", label: "Variations" },
  { id: 3, key: "pricing", label: "Pricing & Tax" },
  { id: 4, key: "stock", label: "Stock" },
  { id: 5, key: "review", label: "Review" },
];

const DEFAULT_BRANDS = [
  { value: "choose", label: "Choose" },
  { value: "grownaturals", label: "Grow Naturals" },
  { value: "nike", label: "Nike" },
  { value: "bolt", label: "Bolt" },
  { value: "botanica", label: "Botanica" },
];

const DEFAULT_UNITS = [
  { value: "choose", label: "Choose" },
  { value: "pc", label: "Piece (Pc)" },
  { value: "kg", label: "Kg" },
  { value: "box", label: "Box" },
  { value: "packet", label: "Packet" },
  { value: "set", label: "Set" },
  { value: "liter", label: "Liter" },
];

const EditProduct: React.FC = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productId = params.id || searchParams.get("id") || "";

  // Linked Purchase Batch State
  const [linkedBatchId, setLinkedBatchId] = useState<string>("");
  const [linkedBatchName, setLinkedBatchName] = useState<string>("");
  const [linkedExpensePercent, setLinkedExpensePercent] = useState<string>("80");
  const [allBatches, setAllBatches] = useState<BatchRecord[]>([]);

  useEffect(() => {
    setAllBatches(batchService.getBatches());
  }, []);

  const handleSelectBatch = (batchId: string) => {
    if (!batchId) {
      setLinkedBatchId("");
      setLinkedBatchName("");
      setLinkedExpensePercent("");
      return;
    }
    const found = allBatches.find((b) => b.id === batchId);
    if (found) {
      setLinkedBatchId(found.id);
      setLinkedBatchName(found.batchNo);
      const expStr = String(found.expensePercent);
      setLinkedExpensePercent(expStr);

      const expVal = found.expensePercent;
      setVariations((prev) =>
        prev.map((v) => {
          const purchase = parseFloat(v.purchasePrice || "0") || 0;
          const profit = parseFloat(v.profitMarginPercent || "0") || 0;
          const gst = parseFloat(v.gstPercent || "0") || 0;
          const actual = purchase > 0 ? purchase + (purchase * expVal) / 100 : 0;
          const baseSelling = actual > 0 ? actual + (actual * profit) / 100 : 0;
          const sales = baseSelling > 0 ? baseSelling * (1 + gst / 100) : 0;
          return {
            ...v,
            expensePercent: expStr,
            actualPrice: actual > 0 ? formatNum(actual) : v.actualPrice,
            salesPrice: sales > 0 ? formatNum(sales) : v.salesPrice,
            retailPriceWithTax: sales > 0 ? formatNum(sales) : v.retailPriceWithTax,
            retailPriceWithoutTax: baseSelling > 0 ? formatNum(baseSelling) : v.retailPriceWithoutTax,
          };
        })
      );
    }
  };

  // Wizard active step (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields - Tab 1: Exact Fields from Screenshot
  const [selectedStore, setSelectedStore] = useState<string>("choose");
  const [selectedBrand, setSelectedBrand] = useState<string>("choose");
  const [productName, setProductName] = useState("");
  const [slug, setSlug] = useState("");
  const [isShop, setIsShop] = useState(true);
  const [isWarehouse, setIsWarehouse] = useState(false);
  const [isRetail, setIsRetail] = useState(true);
  const [isWholesale, setIsWholesale] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("choose");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("choose");
  const [sku, setSku] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("choose");
  const [text, setText] = useState("");

  // Media state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);

  // Other internal states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Tab 2: Product Variations State
  const [variationMode, setVariationMode] = useState<"color" | "variant">("color");
  const [variations, setVariations] = useState<ProductVariationItem[]>(INITIAL_VARIATIONS);

  const handleAddVariation = () => {
    const newId = `var-${Date.now()}`;
    const basePrefix = sku.trim() || "GNCP001";
    const defaultSize = "10 inch";
    const defaultColor = "Green";
    const defaultHex = "#059669";
    const defaultVariant = "Plastic";
    const suffix = variationMode === "color" ? "GR" : "PL";
    const autoSku = `${basePrefix}-${variations.length + 1}-${suffix}`;
    const lastItem = variations[variations.length - 1];

    setVariations((prev) => [
      ...prev,
      {
        id: newId,
        size: defaultSize,
        color: defaultColor,
        colorCode: defaultHex,
        variant: defaultVariant,
        sku: autoSku,
        image: "",
        status: true,
        purchasePrice: lastItem?.purchasePrice || "100",
        purchaseTaxType: lastItem?.purchaseTaxType || "Inclusive",
        expensePercent: lastItem?.expensePercent || "80",
        actualPrice: lastItem?.actualPrice || "180",
        profitMarginPercent: lastItem?.profitMarginPercent || "50",
        gstPercent: lastItem?.gstPercent || (retailTaxType === "taxable" ? retailGstRate : "0"),
        salesPrice: lastItem?.salesPrice || "270",
        retailPriceWithTax: lastItem?.salesPrice || "270",
        retailPriceWithoutTax: lastItem?.retailPriceWithoutTax || "270",
        wholesalePriceWithTax: lastItem?.wholesalePriceWithTax || "240",
        wholesalePriceWithoutTax: lastItem?.wholesalePriceWithoutTax || "240",
      },
    ]);
  };

  const handleDeleteVariation = (id: string) => {
    setVariations((prev) => prev.filter((v) => v.id !== id));
  };

  const handleDuplicateVariation = (item: ProductVariationItem) => {
    const newId = `var-${Date.now()}`;
    setVariations((prev) => [
      ...prev,
      {
        ...item,
        id: newId,
        sku: `${item.sku}-copy`,
      },
    ]);
  };

  const handleToggleStatus = (id: string) => {
    setVariations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: !v.status } : v))
    );
  };

  const handleUpdateVariation = (id: string, field: keyof ProductVariationItem, value: any) => {
    setVariations((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, [field]: value };
        if (field === "color") {
          const found = COLOR_OPTIONS.find((c) => c.value === value);
          if (found) updated.colorCode = found.hex;
        }
        return updated;
      })
    );
  };

  const generateVariationSku = (id: string, index?: number) => {
    const base = (sku.trim() || productName.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "GNCP001").toUpperCase();
    const item = variations.find((v) => v.id === id);
    const rowNum = (index !== undefined ? index : variations.findIndex((v) => v.id === id)) + 1;
    let suffix = "";
    if (variationMode === "color") {
      const colorCode = item?.color ? item.color.slice(0, 2).toUpperCase() : "WH";
      suffix = colorCode;
    } else {
      const variantCode = item?.variant ? item.variant.slice(0, 3).toUpperCase() : "VAR";
      suffix = variantCode;
    }
    const sizeCode = item?.size ? item.size.replace(/[^0-9A-Za-z]/g, "").toUpperCase() : `${rowNum}`;
    const generated = `${base}-${sizeCode}-${suffix}`;
    handleUpdateVariation(id, "sku", generated);
  };

  const handleVariationImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    handleUpdateVariation(id, "image", objectUrl);
  };

  // Tab 3: Pricing & Tax State & Calculations
  const [priceDisplay, setPriceDisplay] = useState<"inclusive" | "exclusive">("inclusive");
  const [retailTaxType, setRetailTaxType] = useState<"taxable" | "non-taxable">("taxable");
  const [retailGstRate, setRetailGstRate] = useState<string>("12");
  const [wholesaleTaxType, setWholesaleTaxType] = useState<"taxable" | "non-taxable">("taxable");
  const [wholesaleGstRate, setWholesaleGstRate] = useState<string>("12");

  const getEffectiveTaxRate = (taxType: "taxable" | "non-taxable", rateStr: string): number => {
    if (taxType === "non-taxable") return 0;
    const parsed = parseFloat(rateStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calcPriceWithoutTax = (withTaxVal: number, rate: number): string => {
    if (isNaN(withTaxVal) || withTaxVal <= 0) return "";
    if (rate <= 0) return withTaxVal.toFixed(2);
    const withoutTax = withTaxVal / (1 + rate / 100);
    return withoutTax.toFixed(2);
  };

  const calcPriceWithTax = (withoutTaxVal: number, rate: number): string => {
    if (isNaN(withoutTaxVal) || withoutTaxVal <= 0) return "";
    if (rate <= 0) return withoutTaxVal.toFixed(2);
    const withTax = withoutTaxVal * (1 + rate / 100);
    return withTax.toFixed(2);
  };

  const formatNum = (num: number): string => {
    if (num <= 0 || isNaN(num)) return "";
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  const handleRowPricingChange = (
    id: string,
    field:
      | "purchasePrice"
      | "purchaseTaxType"
      | "expensePercent"
      | "actualPrice"
      | "profitMarginPercent"
      | "gstPercent"
      | "salesPrice",
    val: string
  ) => {
    setVariations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };

        if (
          field === "purchasePrice" ||
          field === "expensePercent" ||
          field === "profitMarginPercent" ||
          field === "gstPercent"
        ) {
          const purchase = parseFloat(field === "purchasePrice" ? val : updated.purchasePrice || "0") || 0;
          const expense = parseFloat(field === "expensePercent" ? val : updated.expensePercent || "0") || 0;
          const profit = parseFloat(field === "profitMarginPercent" ? val : updated.profitMarginPercent || "0") || 0;
          const gst = parseFloat(field === "gstPercent" ? val : updated.gstPercent || "0") || 0;

          const actual = purchase > 0 ? purchase + (purchase * expense) / 100 : 0;
          const baseSelling = actual > 0 ? actual + (actual * profit) / 100 : 0;
          const sales = baseSelling > 0 ? baseSelling * (1 + gst / 100) : 0;

          updated.actualPrice = actual > 0 ? formatNum(actual) : "";
          updated.salesPrice = sales > 0 ? formatNum(sales) : "";
          updated.retailPriceWithTax = updated.salesPrice;
          updated.retailPriceWithoutTax = baseSelling > 0 ? formatNum(baseSelling) : "";
        } else if (field === "actualPrice") {
          const actual = parseFloat(val) || 0;
          const purchase = parseFloat(updated.purchasePrice || "0") || 0;
          if (purchase > 0 && actual > 0) {
            const expense = ((actual - purchase) / purchase) * 100;
            updated.expensePercent = formatNum(expense);
          }
          const profit = parseFloat(updated.profitMarginPercent || "0") || 0;
          const gst = parseFloat(updated.gstPercent || "0") || 0;
          const baseSelling = actual > 0 ? actual + (actual * profit) / 100 : 0;
          const sales = baseSelling > 0 ? baseSelling * (1 + gst / 100) : 0;

          updated.salesPrice = sales > 0 ? formatNum(sales) : "";
          updated.retailPriceWithTax = updated.salesPrice;
          updated.retailPriceWithoutTax = baseSelling > 0 ? formatNum(baseSelling) : "";
        } else if (field === "salesPrice") {
          const sales = parseFloat(val) || 0;
          const actual = parseFloat(updated.actualPrice || "0") || 0;
          const gst = parseFloat(updated.gstPercent || "0") || 0;
          if (actual > 0 && sales > 0) {
            const baseSelling = sales / (1 + gst / 100);
            const profit = ((baseSelling - actual) / actual) * 100;
            updated.profitMarginPercent = formatNum(profit);
            updated.retailPriceWithTax = val;
            updated.retailPriceWithoutTax = formatNum(baseSelling);
          }
        }
        return updated;
      })
    );
  };

  const handleRetailTaxChange = (newType: "taxable" | "non-taxable", newRate: string) => {
    setRetailTaxType(newType);
    setRetailGstRate(newRate);
    const rate = getEffectiveTaxRate(newType, newRate);
    const effectiveGst = newType === "non-taxable" ? "0" : newRate;

    setVariations((prev) =>
      prev.map((v) => {
        const purchase = parseFloat(v.purchasePrice || "0") || 0;
        const expense = parseFloat(v.expensePercent || "0") || 0;
        const profit = parseFloat(v.profitMarginPercent || "0") || 0;
        const gst = parseFloat(effectiveGst) || 0;

        const actual = purchase > 0 ? purchase + (purchase * expense) / 100 : 0;
        const baseSelling = actual > 0 ? actual + (actual * profit) / 100 : 0;
        const sales = baseSelling > 0 ? baseSelling * (1 + gst / 100) : 0;

        return {
          ...v,
          gstPercent: effectiveGst,
          actualPrice: actual > 0 ? formatNum(actual) : v.actualPrice,
          salesPrice: sales > 0 ? formatNum(sales) : v.salesPrice,
          retailPriceWithTax: sales > 0 ? formatNum(sales) : v.retailPriceWithTax,
          retailPriceWithoutTax: baseSelling > 0 ? formatNum(baseSelling) : v.retailPriceWithoutTax,
        };
      })
    );
  };

  const handleWholesaleTaxChange = (newType: "taxable" | "non-taxable", newRate: string) => {
    setWholesaleTaxType(newType);
    setWholesaleGstRate(newRate);
    const rate = getEffectiveTaxRate(newType, newRate);

    setVariations((prev) =>
      prev.map((v) => {
        if (priceDisplay === "inclusive") {
          const withTaxNum = parseFloat(v.wholesalePriceWithTax || "0");
          return {
            ...v,
            wholesalePriceWithoutTax: withTaxNum > 0 ? calcPriceWithoutTax(withTaxNum, rate) : v.wholesalePriceWithoutTax,
          };
        } else {
          const withoutTaxNum = parseFloat(v.wholesalePriceWithoutTax || "0");
          return {
            ...v,
            wholesalePriceWithTax: withoutTaxNum > 0 ? calcPriceWithTax(withoutTaxNum, rate) : v.wholesalePriceWithTax,
          };
        }
      })
    );
  };

  const handleVariationPriceChange = (
    id: string,
    field: "retailWithTax" | "retailWithoutTax" | "wholesaleWithTax" | "wholesaleWithoutTax",
    rawVal: string
  ) => {
    const retailRate = getEffectiveTaxRate(retailTaxType, retailGstRate);
    const wholesaleRate = getEffectiveTaxRate(wholesaleTaxType, wholesaleGstRate);

    setVariations((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const num = parseFloat(rawVal);

        if (field === "retailWithTax") {
          return {
            ...v,
            retailPriceWithTax: rawVal,
            retailPriceWithoutTax: !rawVal || isNaN(num) ? "" : calcPriceWithoutTax(num, retailRate),
          };
        } else if (field === "retailWithoutTax") {
          return {
            ...v,
            retailPriceWithoutTax: rawVal,
            retailPriceWithTax: !rawVal || isNaN(num) ? "" : calcPriceWithTax(num, retailRate),
          };
        } else if (field === "wholesaleWithTax") {
          return {
            ...v,
            wholesalePriceWithTax: rawVal,
            wholesalePriceWithoutTax: !rawVal || isNaN(num) ? "" : calcPriceWithoutTax(num, wholesaleRate),
          };
        } else if (field === "wholesaleWithoutTax") {
          return {
            ...v,
            wholesalePriceWithoutTax: rawVal,
            wholesalePriceWithTax: !rawVal || isNaN(num) ? "" : calcPriceWithTax(num, wholesaleRate),
          };
        }
        return v;
      })
    );
  };

  // Dynamic Options
  const [storeOptions, setStoreOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "choose", label: "Choose" },
    { value: "main", label: "Grow Naturals Main" },
    { value: "nikhlesh", label: "Nikhlesh Nursery" },
  ]);

  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "choose", label: "Choose" },
    { value: "plants", label: "Plants" },
    { value: "pots-planters", label: "Pots & Planters" },
    { value: "fertilizers", label: "Fertilizers" },
  ]);

  const [subCategoryOptions, setSubCategoryOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "choose", label: "Choose" },
    { value: "indoor", label: "Indoor Plants" },
    { value: "outdoor", label: "Outdoor Plants" },
  ]);

  const [brandOptions] = useState(DEFAULT_BRANDS);
  const [unitOptions] = useState(DEFAULT_UNITS);

  // Unified Pricing & Stock Rows (preserved for step 3 & 4)
  const [priceRows, setPriceRows] = useState<ProductPriceRow[]>([
    {
      id: "row-1",
      variant: "Standard",
      color: "None",
      size: "None",
      purchasePrice: "",
      purchaseTaxType: "Inclusive",
      salesPrice: "",
      salesTaxType: "Exclusive",
      mrp: "",
      wholesalePrice: "",
      wholesaleTaxType: "Exclusive",
      shopQuantity: "10",
      warehouseQuantity: "0",
      alertQuantity: "5",
    },
  ]);

  // Load product & options from backend
  useEffect(() => {
    const businessId = getActiveBusinessId();

    api.get<any[]>("/businesses").then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setStoreOptions([
          { value: "choose", label: "Choose" },
          ...res.map((b) => ({ value: b.id, label: b.name })),
        ]);
      }
    }).catch(() => {});

    api.get<any[]>("/categories", { business_id: businessId }).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setCategoryOptions([
          { value: "choose", label: "Choose" },
          ...res.map((c) => ({ value: c.id, label: c.name || c.id })),
        ]);
      }
    }).catch(() => {});

    api.get<any[]>("/subcategories", { business_id: businessId }).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setSubCategoryOptions([
          { value: "choose", label: "Choose" },
          ...res.map((sc) => ({ value: sc.id, label: sc.name || sc.id })),
        ]);
      }
    }).catch(() => {});

    if (productId) {
      setIsLoading(true);
      api
        .get<any>(`/products/${productId}`)
        .then((p) => {
          if (p) {
            setProductName(p.name || "");
            setSku(p.sku || "");
            setSlug(p.slug || (p.name ? p.name.toLowerCase().replace(/\s+/g, "-") : ""));
            const primaryImg = p.image_url || "";
            setImageUrl(primaryImg);
            setText(p.description || "");

            // Parse attributes if string
            let attr = p.attributes || {};
            if (typeof attr === "string") {
              try {
                attr = JSON.parse(attr);
              } catch {
                attr = {};
              }
            }

            const rawImages = p.images || attr.images || attr.gallery || (primaryImg ? [primaryImg] : []);
            const parsedImages = Array.isArray(rawImages) ? rawImages.filter(Boolean) : [primaryImg].filter(Boolean);
            setImages(parsedImages);

            if (p.category_id) setSelectedCategory(p.category_id);
            if (p.business_id) setSelectedStore(p.business_id);
            if (attr.sub_category) setSelectedSubCategory(attr.sub_category);
            if (attr.brand) setSelectedBrand(attr.brand);
            if (p.unit) setSelectedUnit(p.unit.toLowerCase());

            if (p.is_shop !== undefined) setIsShop(Boolean(p.is_shop));
            if (p.is_warehouse !== undefined) setIsWarehouse(Boolean(p.is_warehouse));
            if (p.is_retail !== undefined) setIsRetail(Boolean(p.is_retail));
            if (p.is_wholesale !== undefined) setIsWholesale(Boolean(p.is_wholesale));

            // Populate rows if present
            if (attr.pricing_rows && Array.isArray(attr.pricing_rows) && attr.pricing_rows.length > 0) {
              setPriceRows(attr.pricing_rows);
            }
            if (attr.variations && Array.isArray(attr.variations) && attr.variations.length > 0) {
              setVariations(attr.variations);
            }
            if (attr.variation_mode) {
              setVariationMode(attr.variation_mode);
            }
            if (attr.batch_id) {
              setLinkedBatchId(attr.batch_id);
              setLinkedBatchName(attr.batch_name || "");
              setLinkedExpensePercent(attr.expense_percent || "80");
            }
          }
        })
        .catch((err) => {
          console.warn("Failed to load product details for edit:", err);
          setStatusMessage({ type: "error", text: "Failed to load product details." });
        })
        .finally(() => setIsLoading(false));
    }
  }, [productId]);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
      setImages((prev) => [dataUrl, ...prev.filter((item) => item !== dataUrl)]);
    };
    reader.readAsDataURL(file);
  };

  // Generate SKU
  const generateSku = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`GN-${rand}`);
  };

  // Handle Form Submission (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() && !sku.trim()) {
      setStatusMessage({ type: "error", text: "Product Name and SKU are required." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const firstRow = priceRows[0] || ({} as Partial<ProductPriceRow>);
      const parsedPurchase = parseFloat(firstRow.purchasePrice || "") || 0;
      const parsedSales = parseFloat(firstRow.salesPrice || "") || parsedPurchase * 1.3 || 0;
      const parsedMrp = parseFloat(firstRow.mrp || "") || parsedSales || 0;
      const parsedWholesale = parseFloat(firstRow.wholesalePrice || "") || 0;
      const parsedAlert = parseInt(firstRow.alertQuantity || "5", 10) || 5;

      const destination =
        isShop && isWarehouse ? "both" : isShop ? "shop" : isWarehouse ? "warehouse" : "shop";
      const sellingType =
        isRetail && isWholesale ? "both" : isRetail ? "retail" : isWholesale ? "wholesale" : "retail";

      const customAttributes = {
        is_shop: isShop,
        is_warehouse: isWarehouse,
        destination,
        is_retail: isRetail,
        is_wholesale: isWholesale,
        selling_type: sellingType,
        store: selectedStore,
        brand: selectedBrand,
        slug,
        category: selectedCategory,
        sub_category: selectedSubCategory,
        unit: selectedUnit,
        shop_price: parsedPurchase,
        shop_cost_price: parsedSales,
        shop_mrp: parsedMrp,
        shop_wholesale_price: parsedWholesale,
        shop_alert: parsedAlert,
        pricing_rows: priceRows,
        variations,
        variation_mode: variationMode,
        images,
        batch_id: linkedBatchId || undefined,
        batch_name: linkedBatchName || undefined,
        expense_percent: linkedExpensePercent || undefined,
      };

      const primaryCover = imageUrl || images[0] || "";

      const payload = {
        name: productName.trim() || "Product",
        sku: sku.trim() || "GN-0000",
        business_id: selectedStore && selectedStore !== "choose" ? selectedStore : undefined,
        category_id: selectedCategory && selectedCategory !== "choose" ? selectedCategory : undefined,
        sale_price: parsedSales,
        selling_price: parsedSales,
        price: parsedSales,
        cost_price: parsedPurchase,
        mrp: parsedMrp,
        wholesale_price: parsedWholesale,
        stock_quantity: 10,
        quantity: 10,
        low_stock_threshold: parsedAlert,
        unit: selectedUnit && selectedUnit !== "choose" ? selectedUnit : "pc",
        image_url: primaryCover,
        images,
        description: text,
        is_shop: isShop,
        is_warehouse: isWarehouse,
        destination,
        is_retail: isRetail,
        is_wholesale: isWholesale,
        selling_type: sellingType,
        attributes: customAttributes,
      };

      if (productId) {
        await api.put(`/products/${productId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setStatusMessage({ type: "success", text: "Product updated successfully!" });
      setTimeout(() => {
        navigate(route.productlist);
      }, 700);
    } catch (err: any) {
      console.error("Failed to update product:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to update product." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="pw-wrapper">
        {/* Header with Back button and Page Title */}
        <div className="pw-header">
          <Link to={route.productlist} className="pw-back-link">
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
          <h1 className="pw-title">Edit Product</h1>
        </div>

        {/* 5-Step Stepper Bar */}
        <div className="pw-stepper-card">
          {WIZARD_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const statusClass = isActive ? "active" : isCompleted ? "completed" : "inactive";

            return (
              <button
                type="button"
                key={step.id}
                className={`pw-step-item ${statusClass}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="pw-step-badge">
                  {isCompleted ? <Check size={14} /> : step.id}
                </div>
                <span className="pw-step-label">{step.label}</span>
              </button>
            );
          })}
        </div>

        {statusMessage && (
          <div
            className={`alert ${
              statusMessage.type === "success" ? "alert-success" : "alert-danger"
            } mb-3`}
            role="alert"
          >
            {statusMessage.text}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading product...</span>
            </div>
            <p className="mt-2 text-muted">Loading product details...</p>
          </div>
        ) : (
          <>
            {/* Tab 1: Basic Details (Exact Input Fields from Screenshot + Left Image Placeholder) */}
            {currentStep === 1 && (
              <div className="pw-card">
                <div className="pw-card-header">
                  <h2 className="pw-card-title">Product Information</h2>
                </div>

                <div className="pw-basic-layout">
                  {/* Left Column: Product Image Placeholder */}
                  <div className="pw-image-column">
                    <div
                      className={`pw-image-box ${imageUrl ? "has-image" : ""}`}
                      onClick={() => fileInputRef.current?.click()}
                      title={imageUrl ? "Click to change image" : "Click to upload image"}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={productName || "Product Preview"}
                          className="pw-image-preview"
                          onError={() => setImageUrl("")}
                        />
                      ) : (
                        <div className="pw-image-placeholder">
                          <div className="pw-image-placeholder-icon-wrap">
                            <ImageIcon size={26} />
                          </div>
                          <span className="pw-image-placeholder-text">Upload Image</span>
                          <span className="pw-image-placeholder-sub">Click to browse</span>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageUpload}
                    />

                    <div className="d-flex align-items-center gap-2 w-100">
                      <button
                        type="button"
                        className="pw-change-image-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Settings size={15} />
                        <span>{imageUrl ? "Change Image" : "Upload Image"}</span>
                      </button>
                      {imageUrl && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm p-1"
                          style={{ borderRadius: "8px", height: "36px", marginTop: "0.85rem", flexShrink: 0 }}
                          title="Remove image"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageUrl("");
                            setImages([]);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <span className="pw-image-hint">JPG, PNG (Max 5MB)</span>
                  </div>

                  {/* Right Column: Exact Form Fields */}
                  <div className="pw-form-column">
                    <div className="pw-fields-grid">
                      {/* Row 1: Store * & Brand * */}
                      <div className="pw-field-group">
                        <label className="pw-label">
                          Store <span className="pw-req">*</span>
                        </label>
                        <div className="pw-field-control">
                          <CommonSelect
                            className="w-100"
                            options={storeOptions}
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>

                      <div className="pw-field-group">
                        <label className="pw-label">
                          Brand <span className="pw-req">*</span>
                        </label>
                        <div className="pw-field-control">
                          <CommonSelect
                            className="w-100"
                            options={brandOptions}
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>

                      {/* Row 2: Product Name * & Short Name * */}
                      <div className="pw-field-group">
                        <label className="pw-label">
                          Product Name <span className="pw-req">*</span>
                        </label>
                        <div className="pw-field-control">
                          <input
                            type="text"
                            className="pw-input"
                            value={productName}
                            onChange={(e) => {
                              setProductName(e.target.value);
                              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="pw-field-group">
                        <label className="pw-label">
                          Short Name <span className="pw-req">*</span>
                        </label>
                        <div className="pw-field-control">
                          <input
                            type="text"
                            className="pw-input"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Row 3: Add Product For * & Selling Type * (No background, No border checkboxes) */}
                      <div className="pw-field-group">
                        <label className="pw-label">
                          Add Product For <span className="pw-req">*</span>
                        </label>
                        <div className="pw-checkboxes-row pw-field-control">
                          <label className="pw-checkbox-item" htmlFor="chkShopEdit">
                            <input
                              type="checkbox"
                              id="chkShopEdit"
                              checked={isShop}
                              onChange={(e) => setIsShop(e.target.checked)}
                            />
                            <span>Shop</span>
                          </label>
                          <label className="pw-checkbox-item" htmlFor="chkWarehouseEdit">
                            <input
                              type="checkbox"
                              id="chkWarehouseEdit"
                              checked={isWarehouse}
                              onChange={(e) => setIsWarehouse(e.target.checked)}
                            />
                            <span>Warehouse</span>
                          </label>
                        </div>
                      </div>

                      <div className="pw-field-group">
                        <label className="pw-label">
                          Selling Type <span className="pw-req">*</span>
                        </label>
                        <div className="pw-checkboxes-row pw-field-control">
                          <label className="pw-checkbox-item" htmlFor="chkRetailEdit">
                            <input
                              type="checkbox"
                              id="chkRetailEdit"
                              checked={isRetail}
                              onChange={(e) => setIsRetail(e.target.checked)}
                            />
                            <span>Retail</span>
                          </label>
                          <label className="pw-checkbox-item" htmlFor="chkWholesaleEdit">
                            <input
                              type="checkbox"
                              id="chkWholesaleEdit"
                              checked={isWholesale}
                              onChange={(e) => setIsWholesale(e.target.checked)}
                            />
                            <span>Wholesale</span>
                          </label>
                        </div>
                      </div>

                      {/* Row 4: Category * & Sub Category * */}
                      <div className="pw-field-group">
                        <label className="pw-label">
                          Category <span className="pw-req">*</span>
                        </label>
                        <div className="pw-field-control">
                          <CommonSelect
                            className="w-100"
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>

                      <div className="pw-field-group">
                        <label className="pw-label">
                          Sub Category <span className="pw-req">*</span>
                        </label>
                        <div className="pw-field-control">
                          <CommonSelect
                            className="w-100"
                            options={subCategoryOptions}
                            value={selectedSubCategory}
                            onChange={(e) => setSelectedSubCategory(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>

                      {/* Row 5: SKU * (with Generate button) & Unit * */}
                      <div className="pw-field-group">
                        <label className="pw-label">
                          SKU <span className="pw-req">*</span>
                        </label>
                        <div className="pw-input-action-wrap pw-field-control">
                          <input
                            type="text"
                            className="pw-input"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                          />
                          <button
                            type="button"
                            className="pw-btn-generate"
                            onClick={generateSku}
                          >
                            Generate
                          </button>
                        </div>
                      </div>

                      <div className="pw-field-group">
                        <label className="pw-label">
                          Unit <span className="pw-req">*</span>
                        </label>
                        <div className="pw-field-control">
                          <CommonSelect
                            className="w-100"
                            options={unitOptions}
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.value)}
                            placeholder="Choose"
                            filter={false}
                          />
                        </div>
                      </div>

                      {/* Row 6: Description (Full Width Editor) */}
                      <div className="pw-field-group full-width">
                        <label className="pw-label">Description</label>
                        <div className="pw-field-control">
                          <Editor
                            value={text}
                            onTextChange={(e: any) => setText(e.htmlValue)}
                            style={{ height: "130px" }}
                          />
                          <small className="text-muted d-block mt-1">Maximum 60 Words</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Right: Next Button */}
                <div className="pw-footer-actions">
                  <button
                    type="button"
                    className="pw-btn-next"
                    onClick={() => setCurrentStep(2)}
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Variations */}
            {currentStep === 2 && (
              <div className="pw-card">
                <div className="pw-card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <h2 className="pw-card-title">
                      {variationMode === "color" ? "Size & Color Variations" : "Size & Attribute Variations"}
                    </h2>
                    {/* <p className="pw-card-subtitle text-muted mb-0 mt-1 fs-13">
                      {variationMode === "color"
                        ? "Add sizes and colors for this product. You can add multiple combinations."
                        : "Add sizes and attribute variants for this product. You can add multiple combinations."}
                    </p> */}
                  </div>

                  <div className="d-flex align-items-center flex-wrap gap-3">
                    {/* Radio selection for Color vs Variety */}
                    <div className="pw-variation-radio-group">
                      <label className={`pw-radio-option ${variationMode === "color" ? "active" : ""}`}>
                        <input
                          type="radio"
                          name="variationModeEdit"
                          value="color"
                          checked={variationMode === "color"}
                          onChange={() => setVariationMode("color")}
                        />
                        <span>Color</span>
                      </label>
                      <label className={`pw-radio-option ${variationMode === "variant" ? "active" : ""}`}>
                        <input
                          type="radio"
                          name="variationModeEdit"
                          value="variant"
                          checked={variationMode === "variant"}
                          onChange={() => setVariationMode("variant")}
                        />
                        <span>Variety</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Variations Table */}
                <div className="pw-variations-table-wrap">
                  <table className="pw-variations-table">
                    <thead>
                      <tr>
                        <th style={{ width: "42px", textAlign: "center" }}></th>
                        <th style={{ width: "20%" }}>Size</th>
                        <th style={{ width: "22%" }}>{variationMode === "color" ? "Color" : "Variety"}</th>
                        <th style={{ width: "24%" }}>SKU (Auto)</th>
                        <th style={{ width: "10%", textAlign: "center" }}>Image</th>
                        <th style={{ width: "10%", textAlign: "center" }}>Status</th>
                        <th style={{ width: "14%", textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted">
                            No variations added yet.{" "}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success ms-2"
                              onClick={handleAddVariation}
                            >
                              <Plus size={14} className="me-1" />
                              Add Variation
                            </button>
                          </td>
                        </tr>
                      ) : (
                        variations.map((item, index) => (
                          <tr key={item.id}>
                            {/* Drag Handle */}
                            <td style={{ textAlign: "center" }}>
                              <GripVertical size={16} className="text-muted" style={{ cursor: "grab" }} />
                            </td>

                            {/* Size Dropdown */}
                            <td>
                              <CommonSelect
                                className="w-100"
                                options={SIZE_OPTIONS}
                                value={item.size}
                                onChange={(e) => handleUpdateVariation(item.id, "size", e.value)}
                                placeholder="Select Size"
                                filter={false}
                              />
                            </td>

                            {/* Color or Variety Dropdown based on radio selection */}
                            <td>
                              {variationMode === "color" ? (
                                <CommonSelect
                                  className="w-100"
                                  options={COLOR_OPTIONS}
                                  value={item.color}
                                  onChange={(e) => handleUpdateVariation(item.id, "color", e.value)}
                                  placeholder="Select Color"
                                  filter={false}
                                  formatOptionLabel={(option: any) => (
                                    <div className="d-flex align-items-center gap-2">
                                      <span
                                        style={{
                                          width: 14,
                                          height: 14,
                                          borderRadius: "50%",
                                          backgroundColor: option.hex || "#ccc",
                                          border: "1px solid rgba(0,0,0,0.18)",
                                          display: "inline-block",
                                          flexShrink: 0,
                                        }}
                                      />
                                      <span>{option.label}</span>
                                    </div>
                                  )}
                                />
                              ) : (
                                <CommonSelect
                                  className="w-100"
                                  options={VARIANT_OPTIONS}
                                  value={item.variant}
                                  onChange={(e) => handleUpdateVariation(item.id, "variant", e.value)}
                                  placeholder="Select Variety"
                                  filter={false}
                                />
                              )}
                            </td>

                            {/* SKU (Auto) with Generate Button */}
                            <td>
                              <div className="pw-table-sku-wrap">
                                <input
                                  type="text"
                                  className="pw-table-input"
                                  value={item.sku}
                                  onChange={(e) => handleUpdateVariation(item.id, "sku", e.target.value)}
                                  placeholder="SKU"
                                />
                                <button
                                  type="button"
                                  className="pw-btn-table-generate"
                                  onClick={() => generateVariationSku(item.id, index)}
                                  title="Generate SKU for this variation"
                                >
                                  <ImMagicWand size={15} />
                                </button>
                              </div>
                            </td>

                            {/* Image Thumbnail with Upload Trigger */}
                            <td style={{ textAlign: "center" }}>
                              <label className="pw-table-image-box" title="Click to upload image for this variation">
                                {item.image ? (
                                  <img src={item.image} alt={item.sku} className="pw-table-image-preview" />
                                ) : (
                                  <ImageIcon size={18} className="text-muted" />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) => handleVariationImageUpload(item.id, e)}
                                />
                              </label>
                            </td>

                            {/* Status Toggle Switch */}
                            <td style={{ textAlign: "center" }}>
                              <div className="d-flex justify-content-center">
                                <label className="pw-toggle-switch" title={item.status ? "Active" : "Inactive"}>
                                  <input
                                    type="checkbox"
                                    checked={item.status}
                                    onChange={() => handleToggleStatus(item.id)}
                                  />
                                  <span className="pw-toggle-slider" />
                                </label>
                              </div>
                            </td>

                            {/* Actions: Add, Duplicate & Delete */}
                            <td style={{ textAlign: "center" }}>
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <button
                                  type="button"
                                  className="pw-action-icon-btn text-success"
                                  title="Add variation row"
                                  onClick={handleAddVariation}
                                >
                                  <Plus size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="pw-action-icon-btn"
                                  title="Duplicate variation"
                                  onClick={() => handleDuplicateVariation(item)}
                                >
                                  <Copy size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="pw-action-icon-btn text-danger"
                                  title="Delete variation"
                                  onClick={() => handleDeleteVariation(item.id)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Navigation Buttons */}
                <div className="pw-footer-actions">
                  <button
                    type="button"
                    className="pw-btn-prev"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    className="pw-btn-next"
                    onClick={() => setCurrentStep(3)}
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Pricing & Tax */}
            {currentStep === 3 && (
              <div className="pw-card">
                <div className="pw-card-header">
                  <h2 className="pw-card-title">Pricing &amp; Tax</h2>
                  {/* <p className="pw-card-subtitle text-muted mb-0" style={{ fontSize: "0.82rem" }}>
                    Set tax rates and configure retail &amp; wholesale prices for each product variation.
                  </p> */}
                </div>

                {/* Tax Configurations for Retail & Wholesale */}
                <div className="pw-pricing-config-grid">
                  {/* Retail Tax Config Card */}
                  <div className="pw-pricing-config-card">
                    <div className="pw-pricing-config-header">
                      <div className="pw-pricing-config-title">
                        <ShoppingBag size={18} className="text-success" />
                        <span>Retail Tax</span>
                      </div>
                      <span
                        className={`pw-tax-status-badge ${retailTaxType === "non-taxable" ? "non-taxable" : ""}`}
                      >
                        {retailTaxType === "taxable" ? `GST ${retailGstRate}%` : "Non-Taxable (0%)"}
                      </span>
                    </div>

                    <div className="row g-3 align-items-center">
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-muted mb-1">Tax Status</label>
                        <CommonSelect
                          className="w-100"
                          options={TAX_STATUS_OPTIONS}
                          value={retailTaxType}
                          onChange={(e) => handleRetailTaxChange(e.value as any, retailGstRate)}
                          filter={false}
                        />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-muted mb-1">Retail GST Rate</label>
                        <CommonSelect
                          className="w-100"
                          options={GST_RATE_OPTIONS}
                          value={retailTaxType === "taxable" ? retailGstRate : "0"}
                          onChange={(e) => handleRetailTaxChange(retailTaxType, e.value)}
                          disabled={retailTaxType === "non-taxable"}
                          filter={false}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Wholesale Tax Config Card */}
                  <div className="pw-pricing-config-card">
                    <div className="pw-pricing-config-header">
                      <div className="pw-pricing-config-title">
                        <Building2 size={18} className="text-success" />
                        <span>Wholesale Tax</span>
                      </div>
                      <span
                        className={`pw-tax-status-badge ${wholesaleTaxType === "non-taxable" ? "non-taxable" : ""}`}
                      >
                        {wholesaleTaxType === "taxable" ? `GST ${wholesaleGstRate}%` : "Non-Taxable (0%)"}
                      </span>
                    </div>

                    <div className="row g-3 align-items-center">
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-muted mb-1">Tax Status</label>
                        <CommonSelect
                          className="w-100"
                          options={TAX_STATUS_OPTIONS}
                          value={wholesaleTaxType}
                          onChange={(e) => handleWholesaleTaxChange(e.value as any, wholesaleGstRate)}
                          filter={false}
                        />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label small fw-semibold text-muted mb-1">Wholesale GST Rate</label>
                        <CommonSelect
                          className="w-100"
                          options={GST_RATE_OPTIONS}
                          value={wholesaleTaxType === "taxable" ? wholesaleGstRate : "0"}
                          onChange={(e) => handleWholesaleTaxChange(wholesaleTaxType, e.value)}
                          disabled={wholesaleTaxType === "non-taxable"}
                          filter={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associated Purchase Batch Card */}
                <div className="card mb-3 border shadow-none" style={{ borderRadius: "10px", backgroundColor: "#f8fafc" }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <Package size={20} className="text-secondary" />
                        <div>
                          <h6 className="mb-0 fw-bold fs-13 text-dark">
                            Associated Purchase Batch (Auto-Fetch Expense %)
                          </h6>
                          <small className="text-muted fs-11">
                            Select or update purchase batch to auto-apply Expense % across variant lines below.
                          </small>
                        </div>
                      </div>

                      <div style={{ minWidth: "280px" }}>
                        <CommonSelect
                          value={linkedBatchId}
                          options={[
                            { label: "Manual Entry (No Linked Batch)", value: "" },
                            ...allBatches.map((b) => ({
                              label: `${b.batchNo} (${b.expensePercent}% Expense - ${b.supplierName})`,
                              value: b.id,
                            })),
                          ]}
                          placeholder="Select Purchase Batch"
                          onChange={(e) => handleSelectBatch(e.value)}
                        />
                      </div>
                    </div>

                    {linkedBatchId ? (
                      <div className="mt-2 p-2 px-3 bg-light rounded-2 border d-flex align-items-center justify-content-between flex-wrap gap-2 fs-12">
                        <div className="d-flex align-items-center gap-2 text-dark fw-semibold">
                          <Check size={16} className="text-primary" />
                          <span>
                            Linked Batch: <strong>{linkedBatchName}</strong> • Expense % auto-filled to: <strong>{linkedExpensePercent}%</strong>
                          </span>
                        </div>
                        <span className="badge bg-white text-secondary border">
                          Real-time calculation active • Editable per row
                        </span>
                      </div>
                    ) : allBatches.length === 0 ? (
                      <div className="mt-2 p-2 px-3 bg-light rounded-2 border d-flex align-items-center justify-content-between flex-wrap gap-2 fs-12 text-muted">
                        <span>
                          No purchase batches recorded yet. You can manually enter the Expense % for each variant below.
                        </span>
                        <Link to="/purchase-list" className="btn btn-xs btn-outline-secondary py-0 px-2 fs-11">
                          + Create Batch on Purchase Page
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-2 text-muted fs-11">
                        Currently in manual mode. Select a batch above to auto-apply its calculated expense percentage.
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Variations Table */}
                <div className="pw-variations-table-wrap">
                  <table className="pw-variations-table" style={{ minWidth: "900px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "9%", minWidth: "70px" }}>Size</th>
                        <th style={{ width: "12%", minWidth: "95px" }}>{variationMode === "color" ? "Color" : "Variety"}</th>
                        <th style={{ width: "19%", minWidth: "165px" }}>Purchase Price</th>
                        <th style={{ width: "10%", minWidth: "85px" }}>Expense (%)</th>
                        <th style={{ width: "13%", minWidth: "115px" }}>Actual Price</th>
                        <th style={{ width: "11%", minWidth: "95px" }}>Profit Margin (%)</th>
                        <th style={{ width: "12%", minWidth: "120px" }}>GST (%)</th>
                        <th style={{ width: "14%", minWidth: "120px" }}>Sales Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-muted">
                            No variations found from Step 2.{" "}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success ms-2"
                              onClick={() => setCurrentStep(2)}
                            >
                              Back to Variations
                            </button>
                          </td>
                        </tr>
                      ) : (
                        variations.map((item) => (
                          <tr key={item.id}>
                            {/* Size */}
                            <td>
                              <span className="fw-semibold text-dark">{item.size || "Standard"}</span>
                            </td>

                            {/* Color or Variety based on selection in Step 2 */}
                            <td>
                              {variationMode === "color" ? (
                                <div className="d-flex align-items-center gap-2">
                                  <span
                                    className="pw-color-circle"
                                    style={{
                                      backgroundColor:
                                        item.colorCode ||
                                        COLOR_OPTIONS.find((c) => c.value === item.color)?.hex ||
                                        "#cbd5e1",
                                    }}
                                  />
                                  <span className="fw-medium">{item.color || "Default"}</span>
                                </div>
                              ) : (
                                <span className="badge bg-light text-dark border px-2 py-1 fw-medium">
                                  {item.variant || "Standard"}
                                </span>
                              )}
                            </td>

                            {/* Purchase Price (Inclusive / Exclusive Tax) */}
                            <td>
                              <div className="pw-input-addon-wrap">
                                <span className="pw-input-prefix">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pw-addon-input"
                                  value={item.purchasePrice ?? ""}
                                  onChange={(e) =>
                                    handleRowPricingChange(item.id, "purchasePrice", e.target.value)
                                  }
                                  placeholder="0.00"
                                />
                                <select
                                  className="pw-addon-select"
                                  value={item.purchaseTaxType || "Inclusive"}
                                  onChange={(e) =>
                                    handleRowPricingChange(item.id, "purchaseTaxType", e.target.value)
                                  }
                                  title="Tax type"
                                >
                                  <option value="Inclusive">Inclusive</option>
                                  <option value="Exclusive">Exclusive</option>
                                </select>
                              </div>
                            </td>

                            {/* Expense Percentage */}
                            <td>
                              <div className="pw-percent-input-wrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pw-percent-input"
                                  value={item.expensePercent ?? ""}
                                  onChange={(e) =>
                                    handleRowPricingChange(item.id, "expensePercent", e.target.value)
                                  }
                                  placeholder="0"
                                />
                                <span className="pw-percent-suffix">%</span>
                              </div>
                            </td>

                            {/* Actual Price (Auto-calculated) */}
                            <td>
                              <div className="pw-currency-input-wrap">
                                <span className="pw-currency-symbol">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pw-currency-input pw-computed-input"
                                  value={item.actualPrice ?? ""}
                                  onChange={(e) =>
                                    handleRowPricingChange(item.id, "actualPrice", e.target.value)
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                            </td>

                            {/* Profit Margin Percentage */}
                            <td>
                              <div className="pw-percent-input-wrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pw-percent-input"
                                  value={item.profitMarginPercent ?? ""}
                                  onChange={(e) =>
                                    handleRowPricingChange(item.id, "profitMarginPercent", e.target.value)
                                  }
                                  placeholder="0"
                                />
                                <span className="pw-percent-suffix">%</span>
                              </div>
                            </td>

                            {/* GST Percentage */}
                            <td>
                              <div className="pw-pricing-select-wrap">
                                <select
                                  className="pw-pricing-select"
                                  value={item.gstPercent ?? "0"}
                                  onChange={(e) =>
                                    handleRowPricingChange(item.id, "gstPercent", e.target.value)
                                  }
                                >
                                  {ROW_GST_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown size={14} className="pw-table-select-chevron" />
                              </div>
                            </td>

                            {/* Sales Price (Auto-calculated) */}
                            <td>
                              <div className="pw-currency-input-wrap">
                                <span className="pw-currency-symbol">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pw-currency-input pw-sales-price-input"
                                  value={item.salesPrice ?? ""}
                                  onChange={(e) =>
                                    handleRowPricingChange(item.id, "salesPrice", e.target.value)
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Navigation Buttons */}
                <div className="pw-footer-actions">
                  <button
                    type="button"
                    className="pw-btn-prev"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    className="pw-btn-next"
                    onClick={() => setCurrentStep(4)}
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Stock */}
            {currentStep === 4 && (
              <div className="pw-card">
                <div className="pw-card-header d-flex align-items-center justify-content-between">
                  <h2 className="pw-card-title">Step 4: Stock &amp; Inventory</h2>
                  <span className="badge bg-light text-muted">Awaiting next tab design</span>
                </div>

                <div className="pw-tab-placeholder">
                  <div className="pw-tab-placeholder-icon">
                    <Package size={24} />
                  </div>
                  <h3 className="pw-tab-placeholder-title">Stock Management Screen</h3>
                  <p className="pw-tab-placeholder-desc">
                    Set shop &amp; warehouse inventory counts, alert limits, and reorder levels.
                  </p>
                </div>

                <div className="pw-footer-actions">
                  <button
                    type="button"
                    className="pw-btn-prev"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    className="pw-btn-next"
                    onClick={() => setCurrentStep(5)}
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 5: Review & Save */}
            {currentStep === 5 && (
              <div className="pw-card">
                <div className="pw-card-header">
                  <h2 className="pw-card-title">Step 5: Review &amp; Confirm</h2>
                </div>

                <div className="p-3 bg-light rounded-3 mb-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={productName || "Product"}
                        style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "8px",
                          background: "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                          flexShrink: 0,
                        }}
                      >
                        <ImageIcon size={26} />
                      </div>
                    )}
                    <div>
                      <h5 className="mb-1 fw-bold">{productName || "Product"}</h5>
                      <p className="text-muted mb-0 fs-13">SKU: {sku || "GN-0000"} | Unit: {selectedUnit}</p>
                    </div>
                  </div>
                  <div
                    className="text-muted fs-13 mb-0"
                    dangerouslySetInnerHTML={{ __html: text || "No description provided." }}
                  />
                </div>

                <div className="pw-footer-actions">
                  <button
                    type="button"
                    className="pw-btn-prev"
                    onClick={() => setCurrentStep(4)}
                  >
                    <ArrowLeft size={16} />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    className="pw-btn-next"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? "Saving Changes..." : "Update Product"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <AddCategory />
        <AddVariant />
        <AddVarientNew />
      </div>
    </div>
  );
};

export default EditProduct;
