import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getActiveBusinessId } from "../../services/api";
import {
  batchService,
  BatchRecord,
  PurchaseItem,
  ExpenseBreakdown,
  CustomExpenseItem,
} from "../../services/batchService";
import "../../styles/purchase-batch.css";
import { BranchInvoiceSelection } from "./BranchInvoiceSelection";
import {
  Plus,
  Calculator,
  Save,
  ArrowLeft,
  ArrowRight,
  Eye,
  Edit2,
  Trash2,
  Package,
  Truck,
  DollarSign,
  Percent,
  Calendar,
  Building2,
  FileText,
  Search,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  AlertTriangle,
  RefreshCw,
  Check,
  Layers,
  ChevronDown,
  ChevronRight,
  MoreVertical,
} from "lucide-react";

interface AvailableInvoice {
  id: string;
  po_number: string;
  supplier_invoice_no?: string;
  supplier_name: string;
  order_date: string;
  total_amount: number;
  items?: any[];
  source?: "database" | "batch" | "damage_tracking" | "default" | "auto_product";
  linkedBatch?: string;
  linkedSalesInvoice?: string;
  linkedProduct?: string;
  isAutoMapped?: boolean;
}

const DEFAULT_EXPENSE_BREAKDOWN: ExpenseBreakdown = {
  freight: 0,
  labour: 0,
  transport: 0,
  packaging: 0,
  other: 0,
  customExpenses: [],
};

const createEmptyItem = (index: number, invoiceId?: string, invoicePo?: string): PurchaseItem => ({
  id: `item-${Date.now()}-${index}`,
  invoiceId,
  invoicePo,
  productId: "",
  productName: "",
  variantName: invoicePo || "",
  sku: "",
  quantity: 1,
  remainingQty: 1,
  purchasePrice: 0,
  sellingPrice: 0,
  actualCost: 0,
});

/**
 * Default standard purchase invoices to ensure invoices are ALWAYS loaded and available
 */
const DEFAULT_PURCHASE_INVOICES: AvailableInvoice[] = [
  {
    id: "inv-po-2026-001",
    po_number: "PO-2026-001",
    supplier_invoice_no: "INV-2026-081",
    supplier_name: "Green Harvest Agro Supplies",
    order_date: "2026-10-10",
    total_amount: 45667.5,
    source: "default",
    items: [
      {
        productId: "prod-coco-01",
        productName: "Coco Peat 5kg Premium Block",
        variantName: "5kg Block",
        sku: "AGR-CP-5KG",
        quantity: 189,
        purchasePrice: 180,
        sellingPrice: 240,
      },
      {
        productId: "prod-vermi-02",
        productName: "Organic Vermicompost 25kg",
        variantName: "25kg Bag",
        sku: "AGR-VC-25K",
        quantity: 100,
        purchasePrice: 116.475,
        sellingPrice: 480,
      },
    ],
  },
  {
    id: "inv-po-2026-002",
    po_number: "PO-2026-002",
    supplier_invoice_no: "INV-2026-104",
    supplier_name: "Nursery World Wholesale Pots",
    order_date: "2026-10-12",
    total_amount: 26650,
    source: "default",
    items: [
      {
        productId: "prod-pot-01",
        productName: "Terracotta UV Plastic Pot 10 Inch",
        variantName: "10 Inch",
        sku: "POT-TER-10",
        quantity: 250,
        purchasePrice: 45,
        sellingPrice: 75,
      },
      {
        productId: "prod-pot-02",
        productName: "Hanging Planters Heavy Duty With Hook",
        variantName: "Green / Terracotta",
        sku: "POT-HNG-HD",
        quantity: 120,
        purchasePrice: 85,
        sellingPrice: 140,
      },
      {
        productId: "prod-tray-03",
        productName: "Seedling Starter Trays 50 Cavity",
        variantName: "50 Cavity",
        sku: "POT-TRY-50",
        quantity: 80,
        purchasePrice: 65,
        sellingPrice: 100,
      },
    ],
  },
  {
    id: "inv-po-2026-003",
    po_number: "PO-2026-003",
    supplier_invoice_no: "INV-2026-145",
    supplier_name: "Kisan Seeds & Flora Exports",
    order_date: "2026-10-14",
    total_amount: 51300,
    source: "default",
    items: [
      {
        productId: "prod-seed-01",
        productName: "Hybrid F1 Tomato Seeds 100g",
        variantName: "100g Pack",
        sku: "SED-TOM-100",
        quantity: 60,
        purchasePrice: 320,
        sellingPrice: 450,
      },
      {
        productId: "prod-plant-02",
        productName: "Flowering Rose Plant Grafted Premium",
        variantName: "Red / Yellow",
        sku: "PLT-ROS-01",
        quantity: 150,
        purchasePrice: 110,
        sellingPrice: 180,
      },
      {
        productId: "prod-plant-03",
        productName: "Indoor Air Purifying Areca Palm",
        variantName: "2 Feet Potted",
        sku: "PLT-ARC-02",
        quantity: 80,
        purchasePrice: 195,
        sellingPrice: 320,
      },
    ],
  },
  {
    id: "inv-po-2026-004",
    po_number: "PO-2026-004",
    supplier_invoice_no: "INV-2026-192",
    supplier_name: "Southern Garden Tools & Spray Co.",
    order_date: "2026-10-15",
    total_amount: 34850,
    source: "default",
    items: [
      {
        productId: "prod-tool-01",
        productName: "Garden Hand Pruning Shears Stainless Steel",
        variantName: "Heavy Duty",
        sku: "TOL-PRN-01",
        quantity: 40,
        purchasePrice: 220,
        sellingPrice: 350,
      },
      {
        productId: "prod-tool-02",
        productName: "Compression Pressure Sprayer 5L",
        variantName: "5 Litre",
        sku: "TOL-SPR-5L",
        quantity: 25,
        purchasePrice: 550,
        sellingPrice: 850,
      },
      {
        productId: "prod-tool-03",
        productName: "Automatic Drip Irrigation Emitter Kit",
        variantName: "50 Plants Kit",
        sku: "TOL-DRP-50",
        quantity: 30,
        purchasePrice: 410,
        sellingPrice: 650,
      },
    ],
  },
  {
    id: "inv-po-2026-005",
    po_number: "PO-2026-005",
    supplier_invoice_no: "INV-2026-210",
    supplier_name: "NatureCare Bio-Pesticides Ltd",
    order_date: "2026-10-16",
    total_amount: 49200,
    source: "default",
    items: [
      {
        productId: "prod-bio-01",
        productName: "Bio-Neem Cold Pressed Oil 1L",
        variantName: "1 Litre Bottle",
        sku: "BIO-NEM-1L",
        quantity: 50,
        purchasePrice: 380,
        sellingPrice: 550,
      },
      {
        productId: "prod-bio-02",
        productName: "Trichoderma Viride Bio-Fungicide 1kg",
        variantName: "1kg Pack",
        sku: "BIO-TRC-1K",
        quantity: 40,
        purchasePrice: 290,
        sellingPrice: 420,
      },
      {
        productId: "prod-bio-03",
        productName: "Liquid Seaweed Extract Bio-Stimulant",
        variantName: "500ml Bottle",
        sku: "BIO-SWD-500",
        quantity: 60,
        purchasePrice: 310,
        sellingPrice: 480,
      },
    ],
  },
];

/**
 * Invoices previously mapped to existing batches
 */
const DEFAULT_EXISTING_BATCH_INVOICES: AvailableInvoice[] = [
  {
    id: "inv-po-2026-006",
    po_number: "PO-2026-006",
    supplier_invoice_no: "INV-2026-301",
    supplier_name: "Bio-Agro Chemical Supplies",
    order_date: "2026-09-28",
    total_amount: 84500,
    source: "batch",
    linkedBatch: "BAT-2026-001 (Main Branch)",
    linkedSalesInvoice: "SI-2026-042",
    items: [
      {
        productId: "prod-bio-01",
        productName: "Bio-Neem Cold Pressed Oil 1L",
        variantName: "1 Litre Bottle",
        sku: "BIO-NEM-1L",
        quantity: 120,
        purchasePrice: 380,
        sellingPrice: 550,
      },
      {
        productId: "prod-tool-02",
        productName: "Compression Pressure Sprayer 5L",
        variantName: "5 Litre",
        sku: "TOL-SPR-5L",
        quantity: 70,
        purchasePrice: 555,
        sellingPrice: 850,
      },
    ],
  },
  {
    id: "inv-po-2026-007",
    po_number: "PO-2026-007",
    supplier_invoice_no: "INV-2026-302",
    supplier_name: "Highland Seeds & Nursery",
    order_date: "2026-09-30",
    total_amount: 62300,
    source: "batch",
    linkedBatch: "BAT-2026-002 (North Hub)",
    linkedSalesInvoice: "SI-2026-049",
    items: [
      {
        productId: "prod-seed-01",
        productName: "Hybrid F1 Tomato Seeds 100g",
        variantName: "100g Pack",
        sku: "SED-TOM-100",
        quantity: 110,
        purchasePrice: 320,
        sellingPrice: 450,
      },
      {
        productId: "prod-plant-02",
        productName: "Flowering Rose Plant Grafted Premium",
        variantName: "Red / Yellow",
        sku: "PLT-ROS-01",
        quantity: 100,
        purchasePrice: 271,
        sellingPrice: 380,
      },
    ],
  },
];

/**
 * Invoices directly mapped to the product page without being mapped to a batch
 */
const DEFAULT_AUTO_INVOICES: AvailableInvoice[] = [
  {
    id: "inv-po-auto-01",
    po_number: "PO-2026-AUTO-01",
    supplier_invoice_no: "INV-AUTO-901",
    supplier_name: "Direct Agro Seed Imports",
    order_date: "2026-10-05",
    total_amount: 64200,
    source: "auto_product",
    isAutoMapped: true,
    linkedProduct: "Hybrid F1 Tomato Seeds 100g",
    linkedSalesInvoice: "SI-2026-058",
    items: [
      {
        productId: "prod-seed-01",
        productName: "Hybrid F1 Tomato Seeds 100g",
        variantName: "100g Pack",
        sku: "SED-TOM-100",
        quantity: 120,
        purchasePrice: 320,
        sellingPrice: 450,
      },
      {
        productId: "prod-vermi-02",
        productName: "Organic Vermicompost 25kg",
        variantName: "25kg Bag",
        sku: "AGR-VC-25K",
        quantity: 60,
        purchasePrice: 430,
        sellingPrice: 580,
      },
    ],
  },
  {
    id: "inv-po-auto-02",
    po_number: "PO-2026-AUTO-02",
    supplier_invoice_no: "INV-AUTO-902",
    supplier_name: "Direct Plant Nursery Link",
    order_date: "2026-10-08",
    total_amount: 38700,
    source: "auto_product",
    isAutoMapped: true,
    linkedProduct: "Indoor Air Purifying Areca Palm",
    linkedSalesInvoice: "SI-2026-061",
    items: [
      {
        productId: "prod-plant-03",
        productName: "Indoor Air Purifying Areca Palm",
        variantName: "2 Feet Potted",
        sku: "PLT-ARC-02",
        quantity: 90,
        purchasePrice: 430,
        sellingPrice: 620,
      },
    ],
  },
];

/**
 * Helper to generate initial item rows for pre-selected invoices
 */
const getInitialItemsForInvoices = (invoiceIds: string[]): PurchaseItem[] => {
  const result: PurchaseItem[] = [];
  invoiceIds.forEach((id) => {
    const inv = DEFAULT_PURCHASE_INVOICES.find((i) => i.id === id || i.po_number === id);
    if (inv && Array.isArray(inv.items)) {
      inv.items.forEach((it: any, itIdx: number) => {
        const qty = Number(it.quantity || 1);
        const price = Number(it.purchasePrice || 0);
        result.push({
          id: `initial-${inv.id}-item-${itIdx}-${Date.now()}`,
          invoiceId: inv.id,
          invoicePo: inv.po_number,
          productId: String(it.productId || ""),
          productName: it.productName,
          variantName: it.variantName || inv.po_number,
          sku: it.sku || "",
          quantity: qty,
          remainingQty: qty,
          purchasePrice: price,
          sellingPrice: Number(it.sellingPrice || price * 1.3),
          actualCost: price,
        });
      });
    }
  });
  return result.length > 0 ? result : [createEmptyItem(1)];
};


/**
 * Helper to fetch tracked damage records from LocalStorage (recorded in Damage Tracking page)
 */
const getInvoiceDamageInfo = (invoiceNoOrPo: string, invoiceId?: string, supplierInvoiceNo?: string) => {
  try {
    const raw = localStorage.getItem("gn_damage_tracking_records");
    if (!raw) return { totalLoss: 0, damagedUnits: 0, records: [] };
    const parsed: any[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { totalLoss: 0, damagedUnits: 0, records: [] };

    const cleanQuery = (invoiceNoOrPo || "").trim().toLowerCase();
    const cleanId = (invoiceId || "").trim().toLowerCase();
    const cleanSuppInv = (supplierInvoiceNo || "").trim().toLowerCase();

    const matches = parsed.filter((r) => {
      const rInvoiceId = String(r.invoiceId || "").toLowerCase();
      const rPo = String(r.invoicePoNumber || "").toLowerCase();
      const rSuppInv = String(r.supplierInvoiceNo || "").toLowerCase();
      return (
        (cleanId && rInvoiceId === cleanId) ||
        (cleanQuery && (rPo === cleanQuery || rSuppInv === cleanQuery || rInvoiceId === cleanQuery)) ||
        (cleanSuppInv && (rPo === cleanSuppInv || rSuppInv === cleanSuppInv || rInvoiceId === cleanSuppInv))
      );
    });

    const totalLoss = matches.reduce((sum, r) => sum + (Number(r.totalLoss) || 0), 0);
    const damagedUnits = matches.reduce((sum, r) => sum + (Number(r.damagedQuantity) || 0), 0);

    return { totalLoss, damagedUnits, records: matches };
  } catch {
    return { totalLoss: 0, damagedUnits: 0, records: [] };
  }
};

export const PurchasesList: React.FC = () => {
  const navigate = useNavigate();

  // View state: "list" | "create"
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchForView, setSelectedBatchForView] = useState<BatchRecord | null>(null);

  // 1st Card: Branch Details Form State
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCreatedDate, setBranchCreatedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  // 2nd Card: Multi-Invoice Selection & Details Form State
  const [availableInvoices, setAvailableInvoices] = useState<AvailableInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [invoiceFilterQuery, setInvoiceFilterQuery] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([
    "inv-po-2026-001",
    "inv-po-2026-002",
    "inv-po-2026-003",
  ]);
  const [items, setItems] = useState<PurchaseItem[]>(() =>
    getInitialItemsForInvoices([
      "inv-po-2026-001",
      "inv-po-2026-002",
      "inv-po-2026-003",
    ])
  );
  const invoiceDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<string[]>([]);

  // 4-Tab Invoice Selection State (Mockup UI)
  type InvoiceSelectionTab = "recently_added" | "existing_batch" | "auto_batch" | "unbatched";
  const [invoiceSelectionTab, setInvoiceSelectionTab] = useState<InvoiceSelectionTab>("recently_added");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [filterDatePreset, setFilterDatePreset] = useState<string>("mockup_range");
  const [showDateRangePicker, setShowDateRangePicker] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>("2026-10-01");
  const [customEndDate, setCustomEndDate] = useState<string>("2026-10-16");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [openActionInvoiceId, setOpenActionInvoiceId] = useState<string | null>(null);

  const toggleInvoiceExpand = (invId: string) => {
    setExpandedInvoiceIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    );
  };


  // 3rd Card: Expenses & Calculation Form State
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown>({
    freight: 0,
    labour: 0,
    transport: 0,
    packaging: 0,
    other: 0,
    customExpenses: [],
  });
  const [customExpenses, setCustomExpenses] = useState<CustomExpenseItem[]>([
    { id: `custom-exp-1`, name: "", amount: 0 },
  ]);
  const [includeDamageInExpenses, setIncludeDamageInExpenses] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Tab Navigation for Create / Edit Branch (Exact design from Category Page)
  const CREATE_BRANCH_TABS = [
    { id: "details", label: "1. Branch Details" },
    { id: "invoices", label: "2. Select Invoice" },
    { id: "expenses", label: "3. Expenses" },
    { id: "landing", label: "4. Landing Cost" },
  ] as const;

  type CreateBranchTabId = "details" | "invoices" | "expenses" | "landing";

  const [activeCreateTab, setActiveCreateTab] = useState<CreateBranchTabId>("details");
  const createTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<{
    left: number;
    width: number;
    ready: boolean;
  }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const updateTabIndicator = useCallback(() => {
    const activeEl = createTabRefs.current[activeCreateTab];
    if (activeEl && activeEl.offsetWidth > 0) {
      setTabIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        ready: true,
      });
    }
  }, [activeCreateTab]);

  useEffect(() => {
    if (viewMode === "create") {
      const t = setTimeout(updateTabIndicator, 50);
      return () => clearTimeout(t);
    }
  }, [viewMode, activeCreateTab, updateTabIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateTabIndicator);
    return () => window.removeEventListener("resize", updateTabIndicator);
  }, [updateTabIndicator]);

  // Status & Validation
  const [calcDone, setCalcDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        invoiceDropdownRef.current &&
        !invoiceDropdownRef.current.contains(target as Node)
      ) {
        setShowInvoiceDropdown(false);
      }
      if (!target.closest(".pb-action-menu-dropdown") && !target.closest(".pb-action-btn")) {
        setOpenActionInvoiceId(null);
      }
      if (!target.closest(".pb-date-picker-container")) {
        setShowDateRangePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Load Branch Records
  const loadBatches = useCallback(() => {
    const list = batchService.getBatches();
    setBatches(list);
  }, []);

  // Fetch Available Invoices from Backend API + LocalStorage Batches + Damage Tracking + Defaults
  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    const invoiceMap = new Map<string, AvailableInvoice>();

    // 1. Try Backend Purchases API
    try {
      const activeBiz = getActiveBusinessId();
      const res = await api.get<any[]>("/purchases", { business_id: activeBiz || "all" });
      if (Array.isArray(res)) {
        res.forEach((po: any) => {
          const poNum = po.po_number || `PO-${po.id}`;
          const key = (po.id || poNum).toLowerCase();
          invoiceMap.set(key, {
            id: String(po.id),
            po_number: poNum,
            supplier_invoice_no: po.supplier_invoice_no || "",
            supplier_name: po.supplier_name || "Authorized Supplier",
            order_date: po.order_date ? po.order_date.split("T")[0] : new Date().toISOString().split("T")[0],
            total_amount: Number(po.total_amount) || 0,
            items: Array.isArray(po.items) ? po.items : undefined,
            source: "database",
          });
        });
      }
    } catch {
      // Backend not running; continue seamlessly
    }

    // 2. Load Batches from LocalStorage
    try {
      const localBatches = batchService.getBatches();
      localBatches.forEach((b) => {
        if (b.invoiceNo) {
          const key = (b.invoiceId || b.invoiceNo).toLowerCase();
          if (!invoiceMap.has(key)) {
            invoiceMap.set(key, {
              id: b.id,
              po_number: b.invoiceNo,
              supplier_invoice_no: b.invoiceNo,
              supplier_name: b.supplierName || "Batch Supplier",
              order_date: b.purchaseDate || new Date().toISOString().split("T")[0],
              total_amount: b.totalPurchaseValue || 0,
              items: b.items,
              source: "batch",
            });
          }
        }
      });
    } catch {
      // Ignore
    }

    // 3. Extract any invoices from Damage Tracking records (gn_damage_tracking_records)
    try {
      const rawDmg = localStorage.getItem("gn_damage_tracking_records");
      if (rawDmg) {
        const parsed = JSON.parse(rawDmg);
        if (Array.isArray(parsed)) {
          parsed.forEach((dmg: any) => {
            const poNum = dmg.invoicePoNumber || dmg.supplierInvoiceNo;
            if (poNum) {
              const key = String(dmg.invoiceId || poNum).toLowerCase();
              if (!invoiceMap.has(key)) {
                invoiceMap.set(key, {
                  id: String(dmg.invoiceId || `dmg-inv-${Date.now()}`),
                  po_number: poNum,
                  supplier_invoice_no: dmg.supplierInvoiceNo || "",
                  supplier_name: dmg.supplierName || "Tracked Supplier",
                  order_date: dmg.date || new Date().toISOString().split("T")[0],
                  total_amount: Number(dmg.totalLoss || 0) * 1.5,
                  items: dmg.items,
                  source: "damage_tracking",
                });
              }
            }
          });
        }
      }
    } catch {
      // Ignore
    }

    // 4. Fill in DEFAULT standard purchase invoices to guarantee invoices are NEVER empty
    DEFAULT_PURCHASE_INVOICES.forEach((defInv) => {
      const key = defInv.po_number.toLowerCase();
      if (!invoiceMap.has(key) && !invoiceMap.has(defInv.id.toLowerCase())) {
        invoiceMap.set(key, defInv);
      }
    });

    // 5. Fill in sample existing batched invoices
    DEFAULT_EXISTING_BATCH_INVOICES.forEach((defInv) => {
      const key = defInv.po_number.toLowerCase();
      if (!invoiceMap.has(key) && !invoiceMap.has(defInv.id.toLowerCase())) {
        invoiceMap.set(key, defInv);
      }
    });

    // 6. Fill in sample auto batch invoices (directly mapped to products)
    DEFAULT_AUTO_INVOICES.forEach((defInv) => {
      const key = defInv.po_number.toLowerCase();
      if (!invoiceMap.has(key) && !invoiceMap.has(defInv.id.toLowerCase())) {
        invoiceMap.set(key, defInv);
      }
    });

    const finalInvoices = Array.from(invoiceMap.values());
    setAvailableInvoices(finalInvoices);
    setLoadingInvoices(false);
  }, []);

  useEffect(() => {
    loadBatches();
    fetchInvoices();
  }, [loadBatches, fetchInvoices]);

  // Selected Invoices details
  const selectedInvoices = useMemo(() => {
    return availableInvoices.filter(
      (inv) =>
        selectedInvoiceIds.includes(inv.id) ||
        selectedInvoiceIds.includes(inv.po_number)
    );
  }, [availableInvoices, selectedInvoiceIds]);

  // Filtered available invoices based on user search in dropdown
  const filteredAvailableInvoices = useMemo(() => {
    if (!invoiceFilterQuery.trim()) return availableInvoices;
    const q = invoiceFilterQuery.toLowerCase().trim();
    return availableInvoices.filter(
      (inv) =>
        inv.po_number.toLowerCase().includes(q) ||
        (inv.supplier_invoice_no && inv.supplier_invoice_no.toLowerCase().includes(q)) ||
        inv.supplier_name.toLowerCase().includes(q)
    );
  }, [availableInvoices, invoiceFilterQuery]);

  // Combined Damage Info for all Selected Invoices
  const combinedDamageData = useMemo(() => {
    let totalLoss = 0;
    let damagedUnits = 0;
    const perInvoiceDamage: Record<string, { loss: number; units: number }> = {};

    selectedInvoices.forEach((inv) => {
      const dmg = getInvoiceDamageInfo(
        inv.po_number || inv.supplier_invoice_no || "",
        inv.id,
        inv.supplier_invoice_no
      );
      totalLoss += dmg.totalLoss;
      damagedUnits += dmg.damagedUnits;
      perInvoiceDamage[inv.id] = { loss: dmg.totalLoss, units: dmg.damagedUnits };
      if (inv.po_number) {
        perInvoiceDamage[inv.po_number] = { loss: dmg.totalLoss, units: dmg.damagedUnits };
      }
    });

    return { totalLoss, damagedUnits, perInvoiceDamage };
  }, [selectedInvoices]);

  // Combined Suppliers text
  const combinedSuppliersText = useMemo(() => {
    const suppliers = Array.from(
      new Set(selectedInvoices.map((inv) => inv.supplier_name).filter(Boolean))
    );
    return suppliers.length > 0 ? suppliers.join(", ") : "No invoice selected";
  }, [selectedInvoices]);

  // Set of keys for invoices that are mapped to existing batches
  const batchedInvoiceKeys = useMemo(() => {
    const set = new Set<string>();
    batches.forEach((b) => {
      if (b.invoiceNo) {
        b.invoiceNo.split(",").forEach((s) => s.trim() && set.add(s.trim().toLowerCase()));
      }
      if (b.invoiceId) set.add(b.invoiceId.toLowerCase().trim());
      if (Array.isArray(b.invoiceNos)) {
        b.invoiceNos.forEach((no) => no && set.add(no.toLowerCase().trim()));
      }
      if (Array.isArray(b.invoiceIds)) {
        b.invoiceIds.forEach((id) => id && set.add(id.toLowerCase().trim()));
      }
      if (Array.isArray(b.items)) {
        b.items.forEach((it) => {
          if (it.invoiceId) set.add(it.invoiceId.toLowerCase().trim());
          if (it.invoicePo) set.add(it.invoicePo.toLowerCase().trim());
        });
      }
    });
    return set;
  }, [batches]);

  // Determine invoice category (3 Tabs: Recently Added, Existing Batch, Auto Batch)
  const getInvoiceCategory = useCallback(
    (inv: AvailableInvoice): InvoiceSelectionTab => {
      const keyId = (inv.id || "").toLowerCase().trim();
      const keyPo = (inv.po_number || "").toLowerCase().trim();
      const keySupp = (inv.supplier_invoice_no || "").toLowerCase().trim();

      // If mapped to a saved batch, or explicitly flagged as batch
      if (
        batchedInvoiceKeys.has(keyId) ||
        batchedInvoiceKeys.has(keyPo) ||
        batchedInvoiceKeys.has(keySupp) ||
        inv.source === "batch" ||
        Boolean(inv.linkedBatch)
      ) {
        return "existing_batch";
      }

      // If directly mapped to product page without being mapped to batch
      if (inv.isAutoMapped || inv.source === "auto_product" || Boolean(inv.linkedProduct)) {
        return "auto_batch";
      }

      // Default: Recently added (not mapped to batches yet)
      return "recently_added";
    },
    [batchedInvoiceKeys]
  );

  // Invoices partitioned by the active 3-tab
  const tabInvoices = useMemo(() => {
    return availableInvoices.filter((inv) => getInvoiceCategory(inv) === invoiceSelectionTab);
  }, [availableInvoices, invoiceSelectionTab, getInvoiceCategory]);

  // Tab Counts for badges
  const tabCounts = useMemo(() => {
    let recent = 0;
    let existing = 0;
    let auto = 0;
    availableInvoices.forEach((inv) => {
      const cat = getInvoiceCategory(inv);
      if (cat === "recently_added") recent++;
      else if (cat === "existing_batch") existing++;
      else if (cat === "auto_batch") auto++;
    });
    return { recent, existing, auto };
  }, [availableInvoices, getInvoiceCategory]);

  // Unique suppliers within active tab
  const uniqueSuppliersInTab = useMemo(() => {
    const set = new Set<string>();
    tabInvoices.forEach((inv) => {
      if (inv.supplier_name) set.add(inv.supplier_name);
    });
    return Array.from(set).sort();
  }, [tabInvoices]);

  // Filtered invoices within active tab
  const filteredTabInvoices = useMemo(() => {
    return tabInvoices.filter((inv) => {
      // 1. Supplier Filter
      if (filterSupplier !== "all" && inv.supplier_name !== filterSupplier) {
        return false;
      }

      // 2. Status Filter
      const isSelected =
        selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number);
      if (filterStatus === "selected" && !isSelected) return false;
      if (filterStatus === "not_batched" && (invoiceSelectionTab !== "recently_added" || isSelected))
        return false;
      if (filterStatus === "batched" && invoiceSelectionTab !== "existing_batch") return false;
      if (filterStatus === "auto_mapped" && invoiceSelectionTab !== "auto_batch") return false;

      // 3. Date Filter
      if (filterDatePreset === "mockup_range") {
        const d = inv.order_date;
        if (d && (d < "2026-10-01" || d > "2026-10-16")) return false;
      } else if (filterDatePreset === "last_7") {
        const d = new Date(inv.order_date).getTime();
        const now = Date.now();
        if (now - d > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (filterDatePreset === "last_30") {
        const d = new Date(inv.order_date).getTime();
        const now = Date.now();
        if (now - d > 30 * 24 * 60 * 60 * 1000) return false;
      } else if (filterDatePreset === "custom") {
        if (customStartDate && inv.order_date < customStartDate) return false;
        if (customEndDate && inv.order_date > customEndDate) return false;
      }

      // 4. Search Filter
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const matchPo = (inv.po_number || "").toLowerCase().includes(q);
        const matchSupp = (inv.supplier_name || "").toLowerCase().includes(q);
        const matchSuppInv = (inv.supplier_invoice_no || "").toLowerCase().includes(q);
        const matchAmt = String(inv.total_amount || "").includes(q);
        const matchItems =
          Array.isArray(inv.items) &&
          inv.items.some(
            (it: any) =>
              (it.productName || it.product_name || "").toLowerCase().includes(q) ||
              (it.sku || "").toLowerCase().includes(q)
          );
        if (!matchPo && !matchSupp && !matchSuppInv && !matchAmt && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [
    tabInvoices,
    filterSupplier,
    filterStatus,
    filterDatePreset,
    customStartDate,
    customEndDate,
    filterSearch,
    selectedInvoiceIds,
    invoiceSelectionTab,
  ]);

  // Master selection for the active tab
  const isAllTabSelected = useMemo(() => {
    if (filteredTabInvoices.length === 0) return false;
    return filteredTabInvoices.every(
      (inv) => selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number)
    );
  }, [filteredTabInvoices, selectedInvoiceIds]);

  const handleToggleSelectAllTab = () => {
    if (isAllTabSelected) {
      const toRemove = new Set(filteredTabInvoices.flatMap((inv) => [inv.id, inv.po_number]));
      setSelectedInvoiceIds((prev) => prev.filter((id) => !toRemove.has(id)));
      setItems((prevItems) => {
        const remaining = prevItems.filter((it) => {
          if (it.invoiceId && toRemove.has(it.invoiceId)) return false;
          if (it.invoicePo && toRemove.has(it.invoicePo)) return false;
          return true;
        });
        return remaining.length > 0 ? remaining : [createEmptyItem(1)];
      });
    } else {
      filteredTabInvoices.forEach((inv) => {
        const isSel =
          selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number);
        if (!isSel) {
          handleToggleInvoice(inv.id || inv.po_number);
        }
      });
    }
  };

  // Total amount of selected invoices
  const totalSelectedAmount = useMemo(() => {
    return selectedInvoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
  }, [selectedInvoices]);

  // Proceed to expenses / Create batch
  const handleProceedCreateBatch = () => {
    if (selectedInvoices.length === 0) {
      setFormError("Please select at least one purchase invoice using the checkboxes to create a batch.");
      return;
    }
    if (items.length === 0) {
      setFormError("At least one purchase item is required to proceed with batch creation.");
      return;
    }
    setFormError(null);
    setActiveCreateTab("expenses");
  };

  // Handler when user selects unbatched sold items to create a branch batch
  const handleBatchSoldItems = (soldBatchItems: PurchaseItem[], syntheticInvoice: AvailableInvoice) => {
    setAvailableInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === syntheticInvoice.id || inv.po_number === syntheticInvoice.po_number);
      return exists ? prev : [syntheticInvoice, ...prev];
    });
    setSelectedInvoiceIds([syntheticInvoice.id]);
    setItems(soldBatchItems);
    setCalcDone(false);
    setFormError(null);
    setActiveCreateTab("expenses");
  };

  // Dynamic Status Badge renderer (Updates dynamically based on state)
  const renderInvoiceStatusBadge = (inv: AvailableInvoice) => {
    const isSelected =
      selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number);

    if (invoiceSelectionTab === "existing_batch") {
      return (
        <span className="pb-status-badge pb-status-batched">
          <Check size={12} className="me-1" /> Batched
        </span>
      );
    }

    if (invoiceSelectionTab === "auto_batch") {
      return (
        <span className="pb-status-badge pb-status-auto-mapped">
          <Layers size={12} className="me-1" /> Auto Mapped
        </span>
      );
    }

    // invoiceSelectionTab === "recently_added"
    if (isSelected) {
      return (
        <span className="pb-status-badge pb-status-selected">
          <CheckCircle2 size={12} className="me-1" /> Selected
        </span>
      );
    }

    return <span className="pb-status-badge pb-status-not-batched">Not Batched</span>;
  };


  // Multi-Invoice Toggle Handler
  const handleToggleInvoice = (invoiceIdOrPo: string) => {
    const targetInv = availableInvoices.find(
      (inv) => inv.id === invoiceIdOrPo || inv.po_number === invoiceIdOrPo
    );

    setSelectedInvoiceIds((prev) => {
      const isCurrentlySelected = prev.includes(invoiceIdOrPo) || (targetInv && prev.includes(targetInv.id));
      let updatedIds: string[];

      if (isCurrentlySelected) {
        // Deselect invoice
        updatedIds = prev.filter(
          (id) => id !== invoiceIdOrPo && (!targetInv || id !== targetInv.id && id !== targetInv.po_number)
        );

        // Remove items belonging to this invoice
        setItems((prevItems) => {
          const remaining = prevItems.filter((it) => {
            if (targetInv) {
              if (it.invoiceId && (it.invoiceId === targetInv.id || it.invoiceId === targetInv.po_number)) return false;
              if (it.invoicePo && (it.invoicePo === targetInv.po_number || it.invoicePo === targetInv.id)) return false;
            }
            if (it.invoiceId === invoiceIdOrPo || it.invoicePo === invoiceIdOrPo) return false;
            return true;
          });
          return remaining.length > 0 ? remaining : [createEmptyItem(1)];
        });

        // Collapse removed invoice
        setExpandedInvoiceIds((prevExp) =>
          prevExp.filter(
            (id) => id !== invoiceIdOrPo && (!targetInv || id !== targetInv.id && id !== targetInv.po_number)
          )
        );
      } else {
        // Select invoice
        updatedIds = [...prev, invoiceIdOrPo];

        // Add items for this invoice
        if (targetInv) {
          const newItemsForInv: PurchaseItem[] = [];
          if (Array.isArray(targetInv.items) && targetInv.items.length > 0) {
            targetInv.items.forEach((it: any, itIdx: number) => {
              const qty = Number(it.quantity || it.received_quantity || 1);
              const rawPrice = Number(
                it.unit_price ||
                  it.purchasePrice ||
                  it.purchase_price ||
                  it.price ||
                  0
              );
              newItemsForInv.push({
                id: `inv-${targetInv.id}-item-${itIdx}-${Date.now()}`,
                invoiceId: targetInv.id,
                invoicePo: targetInv.po_number,
                productId: String(it.productId || it.product_id || ""),
                productName: it.productName || it.product_name || it.name || `Item ${itIdx + 1}`,
                variantName: it.variantName || it.variant_name || targetInv.po_number,
                sku: it.sku || "",
                quantity: qty,
                remainingQty: qty,
                purchasePrice: rawPrice,
                sellingPrice: rawPrice * 1.3,
                actualCost: rawPrice,
              });
            });
          } else {
            // Fallback row for this invoice
            newItemsForInv.push({
              id: `inv-${targetInv.id}-row-${Date.now()}`,
              invoiceId: targetInv.id,
              invoicePo: targetInv.po_number,
              productId: "",
              productName: `Purchased Goods (${targetInv.po_number})`,
              variantName: targetInv.po_number,
              sku: "",
              quantity: 1,
              remainingQty: 1,
              purchasePrice: Number(targetInv.total_amount) || 0,
              sellingPrice: (Number(targetInv.total_amount) || 0) * 1.3,
              actualCost: Number(targetInv.total_amount) || 0,
            });
          }

          setItems((prevItems) => {
            // If previous items was only an untagged empty item, replace it
            const isInitialEmpty =
              prevItems.length === 1 &&
              !prevItems[0].invoiceId &&
              !prevItems[0].productName.trim();
            return isInitialEmpty ? newItemsForInv : [...prevItems, ...newItemsForInv];
          });

          // Auto-expand newly selected invoice
          setExpandedInvoiceIds((prevExp) =>
            prevExp.includes(targetInv.id) || prevExp.includes(targetInv.po_number)
              ? prevExp
              : [...prevExp, targetInv.id]
          );
        }
      }

      setCalcDone(false);
      return updatedIds;
    });
  };

  // Select All available invoices
  const handleSelectAllInvoices = () => {
    const allIds = filteredAvailableInvoices.map((inv) => inv.id || inv.po_number);
    setSelectedInvoiceIds(allIds);
    setExpandedInvoiceIds(allIds);

    const combinedItems: PurchaseItem[] = [];
    filteredAvailableInvoices.forEach((inv) => {
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach((it: any, itIdx: number) => {
          const qty = Number(it.quantity || it.received_quantity || 1);
          const rawPrice = Number(
            it.unit_price || it.purchasePrice || it.purchase_price || it.price || 0
          );
          combinedItems.push({
            id: `inv-${inv.id}-item-${itIdx}-${Date.now()}`,
            invoiceId: inv.id,
            invoicePo: inv.po_number,
            productId: String(it.productId || it.product_id || ""),
            productName: it.productName || it.product_name || it.name || `Item ${itIdx + 1}`,
            variantName: it.variantName || it.variant_name || inv.po_number,
            sku: it.sku || "",
            quantity: qty,
            remainingQty: qty,
            purchasePrice: rawPrice,
            sellingPrice: rawPrice * 1.3,
            actualCost: rawPrice,
          });
        });
      } else {
        combinedItems.push({
          id: `inv-${inv.id}-row-${Date.now()}`,
          invoiceId: inv.id,
          invoicePo: inv.po_number,
          productId: "",
          productName: `Purchased Goods (${inv.po_number})`,
          variantName: inv.po_number,
          sku: "",
          quantity: 1,
          remainingQty: 1,
          purchasePrice: Number(inv.total_amount) || 0,
          sellingPrice: (Number(inv.total_amount) || 0) * 1.3,
          actualCost: Number(inv.total_amount) || 0,
        });
      }
    });
    setItems(combinedItems.length > 0 ? combinedItems : [createEmptyItem(1)]);
    setCalcDone(false);
  };

  // Clear All selected invoices
  const handleClearAllInvoices = () => {
    setSelectedInvoiceIds([]);
    setExpandedInvoiceIds([]);
    setItems([createEmptyItem(1)]);
    setCalcDone(false);
  };

  // Helper to get items belonging to a specific invoice
  const getInvoiceItems = (inv: AvailableInvoice) => {
    const matched = items.filter(
      (it) =>
        (it.invoiceId && (it.invoiceId === inv.id || it.invoiceId === inv.po_number)) ||
        (it.invoicePo && (it.invoicePo === inv.po_number || it.invoicePo === inv.id))
    );
    if (matched.length > 0) return matched;
    // Fallback: if only 1 invoice selected and items don't have tags yet
    if (selectedInvoices.length === 1) return items;
    return [];
  };

  // Add Item specifically to an invoice
  const handleAddItemToInvoice = (invId: string, invPo: string) => {
    const newItem = createEmptyItem(items.length + 1, invId, invPo);
    setItems((prev) => [...prev, newItem]);
    setCalcDone(false);
    setExpandedInvoiceIds((prev) =>
      prev.includes(invId) || prev.includes(invPo) ? prev : [...prev, invId]
    );
  };

  // Calculations for Card 3
  const operationalExpenses = useMemo(() => {
    const std =
      (Number(expenseBreakdown.freight) || 0) +
      (Number(expenseBreakdown.labour) || 0) +
      (Number(expenseBreakdown.transport) || 0) +
      (Number(expenseBreakdown.packaging) || 0) +
      (Number(expenseBreakdown.other) || 0);
    const custom = customExpenses.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    return std + custom;
  }, [expenseBreakdown, customExpenses]);

  const effectiveDamageCost = includeDamageInExpenses ? combinedDamageData.totalLoss : 0;
  const totalCalculatedExpense = operationalExpenses + effectiveDamageCost;

  const totalPurchaseValue = useMemo(() => {
    return items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0),
      0
    );
  }, [items]);

  const calculatedExpensePercent = useMemo(() => {
    if (totalPurchaseValue <= 0) return 0;
    return Number(((totalCalculatedExpense / totalPurchaseValue) * 100).toFixed(2));
  }, [totalCalculatedExpense, totalPurchaseValue]);

  // Overall Statistics for List View
  const stats = useMemo(() => {
    const count = batches.length;
    const totalPurchase = batches.reduce((acc, b) => acc + (b.totalPurchaseValue || 0), 0);
    const totalExp = batches.reduce((acc, b) => acc + (b.totalExpenseAmount || 0), 0);
    const avgExpensePercent = count > 0 ? (totalExp / (totalPurchase || 1)) * 100 : 0;
    return {
      count,
      totalPurchase,
      totalExp,
      avgExpensePercent: Number(avgExpensePercent.toFixed(1)),
    };
  }, [batches]);

  // Filtered Batches for Table
  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase().trim();
    return batches.filter(
      (b) =>
        (b.branchId && b.branchId.toLowerCase().includes(q)) ||
        (b.branchName && b.branchName.toLowerCase().includes(q)) ||
        b.batchNo.toLowerCase().includes(q) ||
        b.supplierName.toLowerCase().includes(q) ||
        b.invoiceNo.toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  // Helper to Auto Generate Branch ID
  const handleAutoGenerateBranchId = () => {
    const year = new Date().getFullYear();
    const seq = String(batches.length + 1).padStart(3, "0");
    setBranchId(`BRANCH-${year}-${seq}`);
  };

  // Add Item Row
  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem(prev.length + 1)]);
    setCalcDone(false);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("At least one purchase item is required.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    setCalcDone(false);
  };

  // Update Item Row
  const handleUpdateItem = (id: string, field: keyof PurchaseItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === "quantity") {
          updated.remainingQty = Number(val) || 0;
        }
        return updated;
      })
    );
    setCalcDone(false);
  };

  // Update Expense Breakdown Field
  const handleUpdateBreakdown = (field: keyof ExpenseBreakdown, val: number) => {
    setExpenseBreakdown((prev) => ({
      ...prev,
      [field]: val,
    }));
    setCalcDone(false);
  };

  // Custom Expense Breakdown Handlers
  const handleAddCustomExpense = () => {
    const newExp: CustomExpenseItem = {
      id: `custom-exp-${Date.now()}`,
      name: "",
      amount: 0,
    };
    setCustomExpenses((prev) => [...prev, newExp]);
    setCalcDone(false);
  };

  const handleUpdateCustomExpense = (id: string, field: "name" | "amount", value: any) => {
    setCustomExpenses((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: field === "amount" ? Number(value) || 0 : value };
      })
    );
    setCalcDone(false);
  };

  const handleRemoveCustomExpense = (id: string) => {
    setCustomExpenses((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0) {
        return [{ id: `custom-exp-${Date.now()}`, name: "", amount: 0 }];
      }
      return updated;
    });
    setCalcDone(false);
  };

  // Handle Continue after entering expenses -> Validates inputs and smoothly moves to Calculated Landed Cost Metrics
  const handleContinue = () => {
    setFormError(null);

    // 1st Card Validations
    if (!branchId.trim()) {
      setFormError("Branch ID is required before proceeding.");
      return;
    }
    if (!branchName.trim()) {
      setFormError("Branch Name is required before proceeding.");
      return;
    }
    if (!branchCreatedDate.trim()) {
      setFormError("Branch Created Date is required before proceeding.");
      return;
    }

    // 2nd Card Validations: At least one invoice must be selected
    if (selectedInvoices.length === 0) {
      setFormError("Please select at least one Purchase Invoice in Card 2 before continuing.");
      return;
    }

    // Items Validation
    if (items.length === 0) {
      setFormError("At least one purchase item is required to calculate landed costs.");
      return;
    }
    for (const it of items) {
      if (!it.productName.trim()) {
        setFormError("Please enter product name for all items.");
        return;
      }
      if (Number(it.quantity) <= 0) {
        setFormError(`Quantity for "${it.productName}" must be greater than 0.`);
        return;
      }
      if (Number(it.purchasePrice) < 0) {
        setFormError(`Purchase price for "${it.productName}" cannot be negative.`);
        return;
      }
    }

    setCalcDone(true);
    setFormError(null);

    // Smoothly scroll down to the calculated landed cost metrics
    setTimeout(() => {
      if (metricsRef.current) {
        metricsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleCalculate = handleContinue;

  // Open Create Branch Form
  const handleOpenCreateForm = () => {
    setEditingBatchId(null);
    handleAutoGenerateBranchId();
    setBranchName("");
    setBranchCreatedDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setSelectedInvoiceIds([]);
    setItems([createEmptyItem(1)]);
    setExpenseBreakdown(DEFAULT_EXPENSE_BREAKDOWN);
    setCustomExpenses([{ id: `custom-exp-${Date.now()}`, name: "", amount: 0 }]);
    setIncludeDamageInExpenses(true);
    setCalcDone(false);
    setFormError(null);
    setFormSuccess(null);
    setActiveCreateTab("details");
    setViewMode("create");
  };

  // Open Edit Branch Form
  const handleOpenEditForm = (b: BatchRecord) => {
    setEditingBatchId(b.id);
    setBranchId(b.branchId || b.batchNo);
    setBranchName(b.branchName || b.batchNo);
    setBranchCreatedDate(b.purchaseDate || new Date().toISOString().split("T")[0]);
    setNotes(b.notes || "");

    const invIds = b.invoiceIds && b.invoiceIds.length > 0 ? b.invoiceIds : b.invoiceId ? [b.invoiceId] : b.invoiceNo ? [b.invoiceNo] : [];
    setSelectedInvoiceIds(invIds);
    setExpandedInvoiceIds(invIds);

    const mappedItems = (b.items && b.items.length > 0 ? b.items : [createEmptyItem(1)]).map((it) => ({
      ...it,
      invoiceId: it.invoiceId || (invIds.length === 1 ? invIds[0] : undefined),
      invoicePo: it.invoicePo || b.invoiceNo || (invIds.length === 1 ? invIds[0] : undefined),
    }));
    setItems(mappedItems);
    setExpenseBreakdown(b.expenseBreakdown || DEFAULT_EXPENSE_BREAKDOWN);
    setCustomExpenses(
      b.expenseBreakdown?.customExpenses && b.expenseBreakdown.customExpenses.length > 0
        ? b.expenseBreakdown.customExpenses
        : [{ id: `custom-exp-${Date.now()}`, name: "", amount: 0 }]
    );
    setIncludeDamageInExpenses(b.damageCost !== undefined ? b.damageCost > 0 : true);
    setCalcDone(true);
    setFormError(null);
    setFormSuccess(null);
    setActiveCreateTab("details");
    setViewMode("create");
  };

  // Save Branch Form Submission
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1st Tab: Branch Details Validations
    if (!branchId.trim()) {
      setFormError("Branch ID is required.");
      setActiveCreateTab("details");
      return;
    }
    if (!branchName.trim()) {
      setFormError("Branch Name is required.");
      setActiveCreateTab("details");
      return;
    }
    if (!branchCreatedDate.trim()) {
      setFormError("Branch Created Date is required.");
      setActiveCreateTab("details");
      return;
    }

    // 2nd Tab: Select Invoice Validations
    if (selectedInvoices.length === 0) {
      setFormError("Please select at least one Purchase Invoice.");
      setActiveCreateTab("invoices");
      return;
    }

    // Landed Cost Metrics Calculation Check
    setCalcDone(true);

    // Items Validation
    if (items.length === 0) {
      setFormError("At least one purchase item is required.");
      return;
    }
    for (const it of items) {
      if (!it.productName.trim()) {
        setFormError("Please enter product name for all items.");
        return;
      }
      if (Number(it.quantity) <= 0) {
        setFormError(`Quantity for "${it.productName}" must be greater than 0.`);
        return;
      }
      if (Number(it.purchasePrice) < 0) {
        setFormError(`Purchase price for "${it.productName}" cannot be negative.`);
        return;
      }
    }

    // Calculate actual landed costs per item
    const calculatedItems = items.map((it) => {
      const price = Number(it.purchasePrice) || 0;
      const actualCost =
        calculatedExpensePercent > 0
          ? Number((price + (price * calculatedExpensePercent) / 100).toFixed(2))
          : price;
      return {
        ...it,
        actualCost,
      };
    });

    const fullExpenseBreakdown: ExpenseBreakdown = {
      ...expenseBreakdown,
      customExpenses: customExpenses.filter((c) => c.name.trim() || c.amount > 0),
    };

    const combinedInvNumbers = selectedInvoices
      .map((inv) => inv.po_number || inv.supplier_invoice_no)
      .filter(Boolean)
      .join(", ");

    const record: BatchRecord = {
      id: editingBatchId || `branch-${Date.now()}`,
      batchNo: branchId.trim(),
      branchId: branchId.trim(),
      branchName: branchName.trim(),
      purchaseDate: branchCreatedDate,
      supplierName: combinedSuppliersText,
      invoiceNo: combinedInvNumbers,
      invoiceId: selectedInvoices[0]?.id || "",
      invoiceIds: selectedInvoiceIds,
      invoiceNos: selectedInvoices.map((inv) => inv.po_number || inv.supplier_invoice_no || inv.id),
      invoiceDate: selectedInvoices[0]?.order_date || "",
      invoiceTotal: totalPurchaseValue,
      damageCost: combinedDamageData.totalLoss,
      damageUnits: combinedDamageData.damagedUnits,
      notes: notes.trim(),
      items: calculatedItems,
      totalPurchaseValue,
      totalExpenseAmount: totalCalculatedExpense,
      expenseBreakdown: fullExpenseBreakdown,
      expensePercent: calculatedExpensePercent,
      createdAt: new Date().toISOString(),
    };

    batchService.saveBatch(record);
    loadBatches();
    setViewMode("list");
  };

  // Delete Branch
  const handleDeleteBranch = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete branch "${name}"?`)) {
      batchService.deleteBatch(id);
      loadBatches();
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content pb-wrapper">
        {/* Page Top Header */}
        <div className="pb-header mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Building2 size={26} className="text-primary" />
              <h4 className="pb-title mb-0">Branch Management</h4>
            </div>
            <p className="pb-subtitle text-muted mt-1 mb-0">
              Manage branches, link single or multiple purchase invoices, track damage costs, and compute landing expenses.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {viewMode === "create" ? (
              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 shadow-none rounded-2"
                onClick={() => setViewMode("list")}
              >
                <ArrowLeft size={16} /> Back to Branches
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-none rounded-2"
                onClick={handleOpenCreateForm}
              >
                <Plus size={18} /> Create Branch
              </button>
            )}
          </div>
        </div>

        {/* Top Summary Stat Cards (Clean White with Solid Accents & Shadowless) - Shown in List View */}
        {viewMode === "list" && (
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: "#e2e8f0",
                  borderLeft: "4px solid #2563eb",
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <Building2 size={24} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#2563eb", letterSpacing: "0.5px" }}
                    >
                      Total Branches
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5">{stats.count}</h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      Active Branches
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: "#e2e8f0",
                  borderLeft: "4px solid #16a34a",
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <DollarSign size={24} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#16a34a", letterSpacing: "0.5px" }}
                    >
                      Total Purchase Value
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5">₹{stats.totalPurchase.toLocaleString("en-IN")}</h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      Supplier Purchases
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: "#e2e8f0",
                  borderLeft: "4px solid #ea580c",
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#ea580c",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <Truck size={24} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#ea580c", letterSpacing: "0.5px" }}
                    >
                      Total Expenses
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5">₹{stats.totalExp.toLocaleString("en-IN")}</h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      Freight &amp; Overheads
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="card border rounded-3 p-3 shadow-none mb-0 h-100 bg-white"
                style={{
                  borderColor: "#e2e8f0",
                  borderLeft: "4px solid #9333ea",
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "46px",
                      height: "46px",
                      backgroundColor: "#9333ea",
                      color: "#ffffff",
                      borderRadius: "10px",
                    }}
                  >
                    <Percent size={24} />
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <span
                      className="fs-11 text-uppercase fw-bold d-block"
                      style={{ color: "#9333ea", letterSpacing: "0.5px" }}
                    >
                      Avg Expense %
                    </span>
                    <h3 className="fw-bold mb-0 text-dark mt-0.5">{stats.avgExpensePercent}%</h3>
                    <span className="fs-11 text-muted mt-1 d-block fw-medium">
                      Average Markup
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW MODE 1: BRANCH LIST TABLE                               */}
        {/* ============================================================ */}
        {viewMode === "list" && (
          <div className="card border rounded-3 mb-4 shadow-none" style={{ borderColor: "#e2e8f0" }}>
            <div className="card-header bg-white border-bottom py-3 px-4">
              <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <Building2 size={18} className="text-primary" />
                  <h5 className="fw-bold mb-0 text-dark">
                    All Branches ({filteredBatches.length})
                  </h5>
                </div>

                <div className="d-flex align-items-center gap-2" style={{ maxWidth: 350 }}>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <Search size={14} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 shadow-none"
                      placeholder="Search branch, invoice, supplier..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body p-0">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-5">
                  <Building2 size={48} className="text-muted mb-2 opacity-50" />
                  <h6 className="fw-bold text-dark">No branches found</h6>
                  <p className="text-muted fs-13 mb-3">
                    {searchQuery
                      ? "No records matching your search query."
                      : "Create your first branch to track invoices, damage costs, and landing expenses."}
                  </p>
                  {!searchQuery && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm shadow-none"
                      onClick={handleOpenCreateForm}
                    >
                      <Plus size={16} className="me-1" /> Create Branch
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table datanew mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th>Branch Details</th>
                        <th>Created Date</th>
                        <th>Linked Invoices</th>
                        <th>Supplier(s)</th>
                        <th className="text-end">Cost of Damage</th>
                        <th className="text-end">Total Expenses</th>
                        <th className="text-center">Expense %</th>
                        <th className="text-center" style={{ width: "120px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((b, idx) => {
                        const invList = b.invoiceNos && b.invoiceNos.length > 0 ? b.invoiceNos : b.invoiceNo ? [b.invoiceNo] : [];
                        return (
                          <tr key={b.id}>
                            <td className="text-muted fs-12">{idx + 1}</td>
                            <td>
                              <strong className="text-dark fs-13 d-block">
                                {b.branchName || b.batchNo}
                              </strong>
                              <span className="badge bg-light text-muted border fs-11 mt-0.5">
                                {b.branchId || b.batchNo}
                              </span>
                            </td>
                            <td className="fs-13 text-muted">
                              <span className="d-inline-flex align-items-center gap-1">
                                <Calendar size={13} className="text-muted" />
                                {b.purchaseDate}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1 align-items-center">
                                {invList.length > 0 ? (
                                  invList.map((invNo, iIdx) => (
                                    <span key={iIdx} className="badge bg-light text-primary border fs-11 fw-semibold">
                                      {invNo}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted fs-12">No invoice</span>
                                )}
                              </div>
                            </td>
                            <td className="fs-13 text-dark">{b.supplierName || "—"}</td>
                            <td className="text-end fw-bold fs-13" style={{ color: (b.damageCost || 0) > 0 ? "#FF0000" : "#64748b" }}>
                              ₹{Number(b.damageCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-end fw-bold text-dark fs-13">
                              ₹{Number(b.totalExpenseAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark border fs-12 fw-semibold">
                                {b.expensePercent}%
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="d-inline-flex align-items-center gap-1">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-light shadow-none"
                                  onClick={() => setSelectedBatchForView(b)}
                                  title="View Branch Details"
                                >
                                  <Eye size={15} className="text-secondary" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-light shadow-none"
                                  onClick={() => handleOpenEditForm(b)}
                                  title="Edit Branch"
                                >
                                  <Edit2 size={15} className="text-primary" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-light shadow-none"
                                  onClick={() => handleDeleteBranch(b.id, b.branchName || b.batchNo)}
                                  title="Delete Branch"
                                >
                                  <Trash2 size={15} className="text-danger" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW MODE 2: CREATE / EDIT BRANCH WITH TABBED UI            */}
        {/* (Category-Page Style Sliding Underline Tabs)                */}
        {/* ============================================================ */}
        {viewMode === "create" && (
          <form onSubmit={handleSaveBranch}>
            {formError && (
              <div className="alert alert-danger d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 border-danger-subtle shadow-none">
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle size={18} className="text-danger flex-shrink-0" />
                  <span className="fs-13">{formError}</span>
                </div>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setFormError(null)}
                />
              </div>
            )}

            {/* Animated Sliding Underline Tabs (Exact Category Page Design) */}
            <div className="card border rounded-3 mb-4 shadow-none bg-white" style={{ borderColor: "#e2e8f0" }}>
              <div className="card-header bg-white border-bottom-0 pb-0 pt-3 px-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Building2 size={22} className="text-primary" />
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">
                        {editingBatchId ? `Edit Branch: ${branchName || branchId}` : "Create New Branch"}
                      </h5>
                      <small className="text-muted fs-12">
                        Configure branch details, link purchase invoices, allocate expenses, and compute landed costs.
                      </small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-light text-muted border fs-12">
                      Step {activeCreateTab === "details" ? "1" : activeCreateTab === "invoices" ? "2" : activeCreateTab === "expenses" ? "3" : "4"} of 4
                    </span>
                  </div>
                </div>

                {/* Tab Navigation with Animated Sliding Green Indicator */}
                <div className="position-relative border-bottom">
                  <ul className="nav border-bottom-0 gap-3 gap-sm-4" role="tablist">
                    {CREATE_BRANCH_TABS.map((tab) => {
                      const isSelected = activeCreateTab === tab.id;
                      return (
                        <li key={tab.id} className="nav-item">
                          <button
                            ref={(el) => {
                              createTabRefs.current[tab.id] = el;
                            }}
                            type="button"
                            className={`nav-link border-0 bg-transparent px-2 d-inline-flex align-items-center rounded-0 fs-14 ${
                              isSelected ? "fw-bold" : "text-muted fw-medium"
                            }`}
                            style={{
                              boxShadow: "none",
                              background: "transparent",
                              paddingTop: "2px",
                              paddingBottom: "8px",
                              color: isSelected ? "#127a3c" : undefined,
                              cursor: "pointer",
                              transition: "color 0.2s ease",
                            }}
                            onClick={() => {
                              setFormError(null);
                              setActiveCreateTab(tab.id);
                              if (tab.id === "landing") {
                                setCalcDone(true);
                              }
                            }}
                          >
                            <span>{tab.label}</span>
                            {isSelected && !tabIndicatorStyle.ready && (
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
                      left: `${tabIndicatorStyle.left}px`,
                      width: `${tabIndicatorStyle.width}px`,
                      height: "3px",
                      backgroundColor: "#127a3c",
                      borderRadius: "3px 3px 0 0",
                      transition: tabIndicatorStyle.ready
                        ? "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.28s cubic-bezier(0.4, 0, 0.2, 1)"
                        : "none",
                      pointerEvents: "none",
                      opacity: tabIndicatorStyle.ready && tabIndicatorStyle.width > 0 ? 1 : 0,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 1: BRANCH DETAILS                                */}
            {/* ======================================================== */}
            {activeCreateTab === "details" && (
              <div className="card border rounded-3 mb-4 shadow-none bg-white" style={{ borderColor: "#e2e8f0" }}>
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Building2 size={20} className="text-primary" />
                    <h5 className="fw-bold mb-0 text-dark">1. Branch Details</h5>
                  </div>
                  <span className="badge bg-light text-muted border fs-12">Step 1 of 4</span>
                </div>

                <div className="card-body p-4">
                  <div className="row g-3">
                    {/* Create Branch ID */}
                    <div className="col-12 col-md-4">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label fw-semibold text-dark fs-13 mb-0">
                          Create Branch ID <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-link p-0 fs-11 text-decoration-none text-primary fw-medium"
                          onClick={handleAutoGenerateBranchId}
                        >
                          Auto-generate
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-control shadow-none"
                        placeholder="e.g. BRANCH-2026-001"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        required
                      />
                      <small className="text-muted fs-11 mt-1 d-block">
                        Unique identifier code for this branch.
                      </small>
                    </div>

                    {/* Branch Name */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold text-dark fs-13 mb-1">
                        Branch Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control shadow-none"
                        placeholder="e.g. Main Warehouse, Downtown Branch"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        required
                      />
                      <small className="text-muted fs-11 mt-1 d-block">
                        Official branch or store location name.
                      </small>
                    </div>

                    {/* Branch Created Date */}
                    <div className="col-12 col-md-4">
                      <label className="form-label fw-semibold text-dark fs-13 mb-1">
                        Branch Created Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control shadow-none"
                        value={branchCreatedDate}
                        onChange={(e) => setBranchCreatedDate(e.target.value)}
                        required
                      />
                      <small className="text-muted fs-11 mt-1 d-block">
                        Establishment or creation date of the branch.
                      </small>
                    </div>
                  </div>

                  {/* Optional Remarks */}
                  <div className="mt-3">
                    <label className="form-label fw-semibold text-dark fs-13 mb-1">
                      Branch Remarks / Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      className="form-control shadow-none"
                      placeholder="Enter location address, branch manager, or operational notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Section Footer */}
                <div className="card-footer bg-white border-top py-3 px-4 d-flex align-items-center justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3 shadow-none rounded-2"
                    onClick={() => setViewMode("list")}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2 shadow-none rounded-2 fw-semibold"
                    onClick={() => {
                      if (!branchId.trim()) {
                        setFormError("Branch ID is required before proceeding.");
                        return;
                      }
                      if (!branchName.trim()) {
                        setFormError("Branch Name is required before proceeding.");
                        return;
                      }
                      if (!branchCreatedDate.trim()) {
                        setFormError("Branch Created Date is required before proceeding.");
                        return;
                      }
                      setFormError(null);
                      setActiveCreateTab("invoices");
                    }}
                  >
                    <span>Next: Select Invoice</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 2: SELECT INVOICE(S)                             */}
            {/* ======================================================== */}
            {activeCreateTab === "invoices" && (
              <BranchInvoiceSelection
                availableInvoices={availableInvoices}
                loadingInvoices={loadingInvoices}
                onReloadInvoices={fetchInvoices}
                selectedInvoiceIds={selectedInvoiceIds}
                selectedInvoices={selectedInvoices}
                onToggleInvoice={handleToggleInvoice}
                onClearAllInvoices={handleClearAllInvoices}
                batchedInvoiceKeys={batchedInvoiceKeys}
                getInvoiceItems={getInvoiceItems}
                getInvoiceDamageInfo={getInvoiceDamageInfo}
                onBackToDetails={() => {
                  setFormError(null);
                  setActiveCreateTab("details");
                }}
                onCancel={() => setViewMode("list")}
                onProceedToExpenses={handleProceedCreateBatch}
                onBatchSoldItems={handleBatchSoldItems}
              />
            )}

            {/* ======================================================== */}
            {/* SECTION 3: EXPENSES                                      */}
            {/* ======================================================== */}
            {activeCreateTab === "expenses" && (
              <div className="card border rounded-3 mb-4 shadow-none bg-white" style={{ borderColor: "#e2e8f0" }}>
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Calculator size={20} className="text-primary" />
                    <h5 className="fw-bold mb-0 text-dark">3. Expenses</h5>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-semibold"
                      onClick={() => setShowBreakdown(!showBreakdown)}
                    >
                      {showBreakdown ? "- Hide Breakdown" : "+ Show Breakdown"}
                    </button>
                    <span className="badge bg-light text-muted border fs-12">Step 3 of 4</span>
                  </div>
                </div>

                <div className="card-body p-4">
                  {/* Standard Expense Breakdown */}
                  {showBreakdown && (
                    <div className="mb-4">
                      <h6 className="fw-bold fs-13 text-dark mb-2 text-uppercase">
                        Standard Expense Breakdown
                      </h6>
                      <div className="row g-2">
                        <div className="col-12 col-sm-6 col-md">
                          <label className="form-label fs-11 text-muted fw-semibold mb-1">Freight (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm shadow-none"
                            value={expenseBreakdown.freight || ""}
                            onChange={(e) => handleUpdateBreakdown("freight", Number(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-12 col-sm-6 col-md">
                          <label className="form-label fs-11 text-muted fw-semibold mb-1">Labour &amp; Loading (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm shadow-none"
                            value={expenseBreakdown.labour || ""}
                            onChange={(e) => handleUpdateBreakdown("labour", Number(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-12 col-sm-6 col-md">
                          <label className="form-label fs-11 text-muted fw-semibold mb-1">Transport &amp; Toll (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm shadow-none"
                            value={expenseBreakdown.transport || ""}
                            onChange={(e) => handleUpdateBreakdown("transport", Number(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-12 col-sm-6 col-md">
                          <label className="form-label fs-11 text-muted fw-semibold mb-1">Packaging &amp; Crates (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm shadow-none"
                            value={expenseBreakdown.packaging || ""}
                            onChange={(e) => handleUpdateBreakdown("packaging", Number(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div className="col-12 col-sm-6 col-md">
                          <label className="form-label fs-11 text-muted fw-semibold mb-1">Other / Misc (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm shadow-none"
                            value={expenseBreakdown.other || ""}
                            onChange={(e) => handleUpdateBreakdown("other", Number(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option to Add Custom Expense Breakdown */}
                  <div className="mb-4 p-3 rounded-3 bg-light border" style={{ borderColor: "#e2e8f0" }}>
                    <div className="mb-2">
                      <h6 className="fw-bold fs-13 text-dark mb-0">
                        Custom Expense Breakdown Items
                      </h6>
                      <small className="text-muted fs-11">
                        Add any specific expense category needed for this branch or invoice.
                      </small>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      {customExpenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="row g-2 align-items-center bg-white p-2 rounded-2 border"
                          style={{ borderColor: "#e2e8f0" }}
                        >
                          <div className="col-12 col-sm-6 col-md-7">
                            <input
                              type="text"
                              className="form-control form-control-sm shadow-none"
                              placeholder="e.g. Cold Storage, Unloading Cess, Inspection..."
                              value={exp.name}
                              onChange={(e) => handleUpdateCustomExpense(exp.id, "name", e.target.value)}
                            />
                          </div>
                          <div className="col-9 col-sm-4 col-md-4">
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-light text-muted border-end-0">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control shadow-none border-start-0"
                                placeholder="Amount"
                                value={exp.amount || ""}
                                onChange={(e) => handleUpdateCustomExpense(exp.id, "amount", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="col-3 col-sm-2 col-md-1 text-center">
                            <div className="d-inline-flex align-items-center gap-1">
                              <button
                                type="button"
                                className="btn btn-sm p-1 border-0 bg-transparent shadow-none"
                                style={{ color: "#FF0000" }}
                                onClick={handleAddCustomExpense}
                                title="Add another expense row"
                              >
                                <Plus size={16} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm p-1 border-0 bg-transparent shadow-none"
                                style={{ color: "#FF0000" }}
                                onClick={() => handleRemoveCustomExpense(exp.id)}
                                title="Remove this expense row"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Damage Cost Tracked Under Expenses Row */}
                  <div
                    className="p-3 rounded-3 mb-4 border d-flex flex-wrap align-items-center justify-content-between gap-3"
                    style={{
                      backgroundColor: combinedDamageData.totalLoss > 0 ? "#fff5f5" : "#f8fafc",
                      borderColor: combinedDamageData.totalLoss > 0 ? "#fecaca" : "#e2e8f0",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <AlertTriangle
                        size={20}
                        style={{ color: combinedDamageData.totalLoss > 0 ? "#FF0000" : "#64748b" }}
                      />
                      <div>
                        <h6 className="fw-bold fs-13 mb-0 text-dark">
                          Damage Cost Tracked Under Expenses
                        </h6>
                        <small className="text-muted fs-11">
                          Loss from damaged items across selected invoices is tracked under landing expenses for accurate cost calculation.
                        </small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div className="text-end">
                        <span className="text-muted fs-11 d-block text-uppercase fw-semibold">Damage Amount</span>
                        <strong className="fs-15" style={{ color: combinedDamageData.totalLoss > 0 ? "#FF0000" : "#64748b" }}>
                          ₹{combinedDamageData.totalLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input shadow-none cursor-pointer"
                          type="checkbox"
                          role="switch"
                          id="includeDamageSwitch"
                          checked={includeDamageInExpenses}
                          onChange={(e) => {
                            setIncludeDamageInExpenses(e.target.checked);
                            setCalcDone(false);
                          }}
                        />
                        <label className="form-check-label fs-12 fw-semibold text-dark cursor-pointer" htmlFor="includeDamageSwitch">
                          Include in Expenses
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Total Combined Expenses Summary Box */}
                  <div
                    className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between flex-wrap gap-3 mt-3"
                    style={{ borderColor: "#e2e8f0" }}
                  >
                    <div>
                      <span className="text-muted fs-11 text-uppercase fw-semibold d-block">
                        Total Combined Expenses
                      </span>
                      <h4 className="fw-bold text-dark mb-0 mt-0.5">
                        ₹{totalCalculatedExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </h4>
                      <small className="text-muted fs-11">
                        Operational: ₹{operationalExpenses.toLocaleString("en-IN")} + Damage: ₹{effectiveDamageCost.toLocaleString("en-IN")}
                      </small>
                    </div>
                    <div className="text-end">
                      <span className="text-muted fs-11 text-uppercase fw-semibold d-block">
                        Estimated Expense Overhead %
                      </span>
                      <h3 className="fw-bold text-success mb-0 mt-0.5">
                        {calculatedExpensePercent}%
                      </h3>
                      <small className="text-muted fs-11">
                        Against ₹{totalPurchaseValue.toLocaleString("en-IN")} Total Bill
                      </small>
                    </div>
                  </div>
                </div>

                {/* Section Footer */}
                <div className="card-footer bg-white border-top py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3 shadow-none rounded-2 d-inline-flex align-items-center gap-1.5"
                    onClick={() => {
                      setFormError(null);
                      setActiveCreateTab("invoices");
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back: Select Invoice</span>
                  </button>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3 shadow-none rounded-2"
                      onClick={() => setViewMode("list")}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2 shadow-none rounded-2 fw-semibold"
                      onClick={() => {
                        setCalcDone(true);
                        setFormError(null);
                        setActiveCreateTab("landing");
                      }}
                    >
                      <span>Continue to Landing Cost</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 4: LANDING COST                                  */}
            {/* ======================================================== */}
            {activeCreateTab === "landing" && (
              <div
                ref={metricsRef}
                className="card border rounded-3 mb-4 shadow-none bg-white"
                style={{ borderColor: "#e2e8f0" }}
              >
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Sparkles size={20} className="text-primary" />
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">4. Landing Cost</h5>
                      <small className="text-muted fs-11">
                        Final landed cost per unit calculated by distributing ₹{totalCalculatedExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })} total expenses ({calculatedExpensePercent}%) across purchase items.
                      </small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 fs-12 d-inline-flex align-items-center gap-1">
                      <Check size={14} />
                      <span>Calculated &amp; Ready to Save</span>
                    </span>
                  </div>
                </div>

                <div className="card-body p-4">
                  {/* 4 KPI Metrics Grid (Clean White, Solid Accents & Shadowless) */}
                  <div className="row g-3 mb-3">
                    <div className="col-6 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: "4px solid #2563eb",
                        }}
                      >
                        <span className="fs-11 text-uppercase fw-bold d-block" style={{ color: "#2563eb" }}>
                          Total Bill Value
                        </span>
                        <h4 className="fw-bold text-dark mb-0 mt-1">₹{totalPurchaseValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h4>
                        <small className="text-muted fs-11">{items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} total units</small>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: "4px solid #ea580c",
                        }}
                      >
                        <span className="fs-11 text-uppercase fw-bold d-block" style={{ color: "#ea580c" }}>
                          Operational Exp.
                        </span>
                        <h4 className="fw-bold text-dark mb-0 mt-1">₹{operationalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h4>
                        <small className="text-muted fs-11">Freight, Labour &amp; Custom</small>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: effectiveDamageCost > 0 ? "4px solid #FF0000" : "4px solid #94a3b8",
                        }}
                      >
                        <span
                          className="fs-11 text-uppercase fw-bold d-block"
                          style={{ color: effectiveDamageCost > 0 ? "#FF0000" : "#64748b" }}
                        >
                          Damage Cost
                        </span>
                        <h4 className="fw-bold mb-0 mt-1" style={{ color: effectiveDamageCost > 0 ? "#FF0000" : "#64748b" }}>
                          ₹{effectiveDamageCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </h4>
                        <small className="text-muted fs-11">{includeDamageInExpenses ? "Tracked in landing cost" : "Excluded"}</small>
                      </div>
                    </div>

                    <div className="col-6 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: "4px solid #16a34a",
                        }}
                      >
                        <span className="fs-11 text-uppercase fw-bold d-block" style={{ color: "#16a34a" }}>
                          Expense Percentage
                        </span>
                        <div className="d-flex align-items-baseline gap-1 mt-1">
                          <h3 className="fw-bold mb-0" style={{ color: "#16a34a" }}>{calculatedExpensePercent}%</h3>
                        </div>
                        <small className="text-muted fs-11">Total Exp: ₹{totalCalculatedExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</small>
                      </div>
                    </div>
                  </div>

                  {/* Formula Explanation Callout */}
                  <div className="p-3 bg-white rounded-2 border mb-4 d-flex align-items-start gap-2.5 fs-12 text-muted" style={{ borderColor: "#e2e8f0" }}>
                    <Info size={17} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-dark fw-semibold">Landed Cost Calculation Formula:</span>{" "}
                      <span>
                        (Total Expenses ₹{totalCalculatedExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ÷ Total Purchase Value ₹{totalPurchaseValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}) × 100 = <strong className="text-primary">{calculatedExpensePercent}% overhead</strong>.
                      </span>
                      <div className="mt-1">
                        Each item&apos;s actual landed cost is calculated by adding <strong>{calculatedExpensePercent}%</strong> to its base purchase price.
                      </div>
                    </div>
                  </div>

                  {/* Per-Item Final Landed Cost Breakdown */}
                  <div className="border rounded-3 p-3 bg-white mb-2" style={{ borderColor: "#e2e8f0" }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold fs-13 mb-0 text-dark d-flex align-items-center gap-1.5">
                        <Package size={16} className="text-primary" />
                        <span>Per-Item Final Landed Cost Breakdown ({items.length} Items)</span>
                      </h6>
                      <span className="badge bg-light text-muted border fs-11">
                        +{calculatedExpensePercent}% Overhead
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="table datanew mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }}>#</th>
                            <th>Product &amp; Variant</th>
                            <th style={{ width: "120px" }}>SKU</th>
                            <th style={{ width: "80px" }} className="text-center">Qty</th>
                            <th style={{ width: "120px" }} className="text-end">Base Price (₹)</th>
                            <th style={{ width: "130px" }} className="text-end">Overhead/Unit (₹)</th>
                            <th style={{ width: "130px" }} className="text-end">Landed Cost (₹)</th>
                            <th style={{ width: "130px" }} className="text-end">Total Landed (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => {
                            const qty = Number(it.quantity) || 0;
                            const basePrice = Number(it.purchasePrice) || 0;
                            const overheadPerUnit = calculatedExpensePercent > 0 ? (basePrice * calculatedExpensePercent) / 100 : 0;
                            const landedUnitCost = Number((basePrice + overheadPerUnit).toFixed(2));
                            const lineLandedTotal = Number((landedUnitCost * qty).toFixed(2));

                            return (
                              <tr key={it.id}>
                                <td className="text-muted fs-12">{idx + 1}</td>
                                <td>
                                  <strong className="text-dark fs-13 d-block">{it.productName || "Unnamed Item"}</strong>
                                  {it.variantName && (
                                    <span className="text-muted fs-11">Ref: {it.variantName}</span>
                                  )}
                                </td>
                                <td>
                                  <span className="text-muted fs-12">{it.sku || "—"}</span>
                                </td>
                                <td className="text-center fs-13 text-dark fw-semibold">
                                  {qty}
                                </td>
                                <td className="text-end fs-13 text-muted">
                                  ₹{basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="text-end fs-13 text-warning-emphasis fw-medium">
                                  +₹{overheadPerUnit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="text-end fs-13 fw-bold text-success">
                                  ₹{landedUnitCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="text-end fs-13 fw-bold text-dark">
                                  ₹{lineLandedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan={3} className="fw-bold text-dark fs-13 text-end">
                              Totals:
                            </td>
                            <td className="text-center fw-bold text-dark fs-13">
                              {items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} units
                            </td>
                            <td className="text-end fw-bold text-dark fs-13">
                              ₹{totalPurchaseValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-end fw-bold text-warning-emphasis fs-13">
                              ₹{totalCalculatedExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                            <td className="text-end fw-bold text-primary fs-14">
                              ₹{(totalPurchaseValue + totalCalculatedExpense).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Section Footer */}
                <div className="card-footer bg-white border-top py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3 shadow-none rounded-2 d-inline-flex align-items-center gap-1.5"
                    onClick={() => {
                      setFormError(null);
                      setActiveCreateTab("expenses");
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back: Edit Expenses</span>
                  </button>

                  <div className="d-flex align-items-center gap-2 ms-auto">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 shadow-none rounded-2"
                      onClick={() => setViewMode("list")}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2 shadow-none rounded-2 fw-semibold"
                    >
                      <Save size={18} />
                      <span>{editingBatchId ? "Update Branch" : "Save Branch"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* ============================================================ */}
        {/* VIEW BRANCH DETAILS MODAL (Shadowless)                       */}
        {/* ============================================================ */}
        {selectedBatchForView && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border rounded-3 shadow-none" style={{ borderColor: "#e2e8f0" }}>
                <div className="modal-header bg-light border-bottom">
                  <div>
                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                      <Building2 size={20} className="text-primary" />
                      Branch Details: {selectedBatchForView.branchName || selectedBatchForView.batchNo}
                    </h5>
                    <span className="text-muted fs-12">
                      Branch ID: <strong>{selectedBatchForView.branchId || selectedBatchForView.batchNo}</strong> • Created: {selectedBatchForView.purchaseDate}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-close shadow-none"
                    onClick={() => setSelectedBatchForView(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {/* Summary boxes (Clean White, Solid Accents & Shadowless) */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: "4px solid #2563eb",
                        }}
                      >
                        <span className="fs-11 text-uppercase fw-bold d-block" style={{ color: "#2563eb" }}>Supplier(s)</span>
                        <strong className="text-dark fs-14 d-block mt-1 text-truncate" title={selectedBatchForView.supplierName}>
                          {selectedBatchForView.supplierName || "—"}
                        </strong>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: "4px solid #9333ea",
                        }}
                      >
                        <span className="fs-11 text-uppercase fw-bold d-block" style={{ color: "#9333ea" }}>Linked Invoice(s)</span>
                        <strong className="text-primary fs-14 d-block mt-1 text-truncate" title={selectedBatchForView.invoiceNo}>
                          {selectedBatchForView.invoiceNo || "—"}
                        </strong>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: (selectedBatchForView.damageCost || 0) > 0 ? "4px solid #FF0000" : "4px solid #16a34a",
                        }}
                      >
                        <span
                          className="fs-11 text-uppercase fw-bold d-block"
                          style={{ color: (selectedBatchForView.damageCost || 0) > 0 ? "#FF0000" : "#16a34a" }}
                        >
                          Cost of Damage
                        </span>
                        <strong
                          className="fs-14 d-block mt-1"
                          style={{ color: (selectedBatchForView.damageCost || 0) > 0 ? "#FF0000" : "#16a34a" }}
                        >
                          ₹{Number(selectedBatchForView.damageCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div
                        className="p-3 rounded-3 border bg-white"
                        style={{
                          borderColor: "#e2e8f0",
                          borderLeft: "4px solid #ea580c",
                        }}
                      >
                        <span className="fs-11 text-uppercase fw-bold d-block" style={{ color: "#ea580c" }}>Expense %</span>
                        <strong className="text-dark fs-14 d-block mt-1">
                          {selectedBatchForView.expensePercent}% (₹{Number(selectedBatchForView.totalExpenseAmount || 0).toLocaleString("en-IN")})
                        </strong>
                      </div>
                    </div>
                  </div>

                  {selectedBatchForView.notes && (
                    <div className="mb-4 p-2.5 bg-light rounded-2 border fs-12 text-muted">
                      <strong>Remarks:</strong> {selectedBatchForView.notes}
                    </div>
                  )}

                  {/* Items list */}
                  <h6 className="fw-bold fs-13 mb-2 text-dark">
                    Items In This Branch ({selectedBatchForView.items?.length || 0})
                  </h6>
                  <div className="table-responsive border rounded-3 mb-3">
                    <table className="table datanew mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Item Name</th>
                          <th>SKU</th>
                          <th className="text-center">Total Qty</th>
                          <th className="text-end">Purchase Price</th>
                          <th className="text-end">Actual Landed Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedBatchForView.items || []).map((it) => (
                          <tr key={it.id}>
                            <td className="fw-semibold text-dark">{it.productName}</td>
                            <td><span className="badge bg-light text-muted border fs-11">{it.sku || "—"}</span></td>
                            <td className="text-center">{it.quantity}</td>
                            <td className="text-end">₹{Number(it.purchasePrice).toFixed(2)}</td>
                            <td className="text-end fw-bold text-dark">₹{Number(it.actualCost).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary shadow-none"
                    onClick={() => setSelectedBatchForView(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesList;
