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
} from "lucide-react";

interface AvailableInvoice {
  id: string;
  po_number: string;
  supplier_invoice_no?: string;
  supplier_name: string;
  order_date: string;
  total_amount: number;
  items?: any[];
  source?: "database" | "batch" | "damage_tracking" | "default";
}

const DEFAULT_EXPENSE_BREAKDOWN: ExpenseBreakdown = {
  freight: 0,
  labour: 0,
  transport: 0,
  packaging: 0,
  other: 0,
  customExpenses: [],
};

const createEmptyItem = (index: number): PurchaseItem => ({
  id: `item-${Date.now()}-${index}`,
  productId: "",
  productName: "",
  variantName: "",
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
    total_amount: 45100,
    source: "default",
    items: [
      {
        productId: "prod-coco-01",
        productName: "Coco Peat 5kg Premium Block",
        variantName: "5kg Block",
        sku: "AGR-CP-5KG",
        quantity: 100,
        purchasePrice: 180,
        sellingPrice: 240,
      },
      {
        productId: "prod-vermi-02",
        productName: "Organic Vermicompost 25kg",
        variantName: "25kg Bag",
        sku: "AGR-VC-25K",
        quantity: 50,
        purchasePrice: 350,
        sellingPrice: 480,
      },
      {
        productId: "prod-neem-03",
        productName: "Neem Cake Organic Fertilizer 10kg",
        variantName: "10kg Bag",
        sku: "AGR-NC-10K",
        quantity: 40,
        purchasePrice: 240,
        sellingPrice: 330,
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
 * Helper to fetch tracked damage records from LocalStorage (recorded in Damage Tracking page)
 */
const getInvoiceDamageInfo = (invoiceNoOrPo: string, invoiceId?: string) => {
  try {
    const raw = localStorage.getItem("gn_damage_tracking_records");
    if (!raw) return { totalLoss: 0, damagedUnits: 0, records: [] };
    const parsed: any[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { totalLoss: 0, damagedUnits: 0, records: [] };

    const cleanQuery = (invoiceNoOrPo || "").trim().toLowerCase();
    const cleanId = (invoiceId || "").trim().toLowerCase();

    const matches = parsed.filter((r) => {
      const rInvoiceId = String(r.invoiceId || "").toLowerCase();
      const rPo = String(r.invoicePoNumber || "").toLowerCase();
      const rSuppInv = String(r.supplierInvoiceNo || "").toLowerCase();
      return (
        (cleanId && rInvoiceId === cleanId) ||
        (cleanQuery && (rPo === cleanQuery || rSuppInv === cleanQuery || rInvoiceId === cleanQuery))
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
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [items, setItems] = useState<PurchaseItem[]>([createEmptyItem(1)]);
  const invoiceDropdownRef = useRef<HTMLDivElement>(null);

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

  // Status & Validation
  const [calcDone, setCalcDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        invoiceDropdownRef.current &&
        !invoiceDropdownRef.current.contains(e.target as Node)
      ) {
        setShowInvoiceDropdown(false);
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
        inv.id
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

  // Multi-Invoice Toggle Handler
  const handleToggleInvoice = (invoiceIdOrPo: string) => {
    setSelectedInvoiceIds((prev) => {
      const exists = prev.includes(invoiceIdOrPo);
      let updatedIds: string[];
      if (exists) {
        updatedIds = prev.filter((id) => id !== invoiceIdOrPo);
      } else {
        updatedIds = [...prev, invoiceIdOrPo];
      }

      // Re-map items from the updated selected invoices
      const newlySelectedInvoices = availableInvoices.filter(
        (inv) => updatedIds.includes(inv.id) || updatedIds.includes(inv.po_number)
      );

      if (newlySelectedInvoices.length === 0) {
        setItems([createEmptyItem(1)]);
      } else {
        const combinedItems: PurchaseItem[] = [];
        newlySelectedInvoices.forEach((inv) => {
          if (Array.isArray(inv.items) && inv.items.length > 0) {
            inv.items.forEach((it: any, itIdx: number) => {
              const qty = Number(it.quantity || it.received_quantity || 1);
              const rawPrice = Number(
                it.unit_price ||
                  it.purchasePrice ||
                  it.purchase_price ||
                  it.price ||
                  0
              );
              combinedItems.push({
                id: `inv-${inv.id}-item-${itIdx}-${Date.now()}`,
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
            // Fallback line item for invoice
            combinedItems.push({
              id: `inv-${inv.id}-row-${Date.now()}`,
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
        setItems(combinedItems);
      }

      setCalcDone(false);
      return updatedIds;
    });
  };

  // Select All available invoices
  const handleSelectAllInvoices = () => {
    const allIds = filteredAvailableInvoices.map((inv) => inv.id || inv.po_number);
    setSelectedInvoiceIds(allIds);

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
      }
    });
    setItems(combinedItems.length > 0 ? combinedItems : [createEmptyItem(1)]);
    setCalcDone(false);
  };

  // Clear All selected invoices
  const handleClearAllInvoices = () => {
    setSelectedInvoiceIds([]);
    setItems([createEmptyItem(1)]);
    setCalcDone(false);
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

    setItems(b.items && b.items.length > 0 ? b.items : [createEmptyItem(1)]);
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
    setViewMode("create");
  };

  // Save Branch Form Submission
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1st Card Validations
    if (!branchId.trim()) {
      setFormError("Branch ID is required.");
      return;
    }
    if (!branchName.trim()) {
      setFormError("Branch Name is required.");
      return;
    }
    if (!branchCreatedDate.trim()) {
      setFormError("Branch Created Date is required.");
      return;
    }

    // 2nd Card Validations: At least one invoice must be selected
    if (selectedInvoices.length === 0) {
      setFormError("Please select at least one Purchase Invoice in Card 2.");
      return;
    }

    // Landed Cost Metrics Calculation Check
    if (!calcDone) {
      setFormError("Please click 'Continue' after entering expenses to calculate landed cost metrics before saving.");
      return;
    }

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

        {/* Top Summary Stat Cards (Clean White with Solid Accents & Shadowless) */}
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
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-10 mt-1 fw-semibold">
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
                  <span className="badge bg-success-subtle text-success border border-success-subtle fs-10 mt-1 fw-semibold">
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
                  <span
                    className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fs-10 mt-1 fw-semibold"
                  >
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
                  <span
                    className="badge border fs-10 mt-1 fw-semibold"
                    style={{ backgroundColor: "#f3e8ff", color: "#9333ea", borderColor: "#e9d5ff" }}
                  >
                    Average Markup
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
        {/* VIEW MODE 2: CREATE BRANCH FORM (3 DISTINCT SHADOWLESS CARDS)*/}
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

            {/* ======================================================== */}
            {/* 1ST CARD: BRANCH DETAILS                                 */}
            {/* ======================================================== */}
            <div className="card border rounded-3 mb-4 shadow-none" style={{ borderColor: "#e2e8f0" }}>
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <Building2 size={20} className="text-primary" />
                  <h5 className="fw-bold mb-0 text-dark">1. Branch Details</h5>
                </div>
                <span className="badge bg-light text-muted border fs-12">Step 1 of 3</span>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  {/* Create Branch ID */}
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold text-dark fs-13 mb-1">
                      Create Branch ID <span className="text-danger">*</span>
                    </label>
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
                    rows={2}
                    className="form-control shadow-none"
                    placeholder="Enter location address, branch manager, or operational notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* 2ND CARD: COMPACT SELECT INVOICE(S) DROPDOWN             */}
            {/* ======================================================== */}
            <div className="card border rounded-3 mb-4 shadow-none" style={{ borderColor: "#e2e8f0" }}>
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <FileText size={20} className="text-primary" />
                  <h5 className="fw-bold mb-0 text-dark">2. Select Invoice</h5>
                  {selectedInvoices.length > 0 && (
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-12 px-2 py-0.5">
                      {selectedInvoices.length} Selected
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 shadow-none"
                    onClick={fetchInvoices}
                    disabled={loadingInvoices}
                    title="Reload available invoices"
                  >
                    <RefreshCw size={13} className={loadingInvoices ? "spinner-border spinner-border-sm" : ""} />
                    <span>Refresh</span>
                  </button>
                  <span className="badge bg-light text-muted border fs-12">Step 2 of 3</span>
                </div>
              </div>

              <div className="card-body p-4">
                {/* Select Invoice Dropdown Input & Menu */}
                <div className="mb-3 position-relative" ref={invoiceDropdownRef}>
                  <label className="form-label fw-semibold text-dark fs-13 mb-1">
                    Select Purchase Invoice <span className="text-danger">*</span>
                  </label>

                  {/* Dropdown Trigger Box */}
                  <div
                    className="form-control d-flex align-items-center justify-content-between cursor-pointer bg-white shadow-none"
                    style={{ borderColor: "#e2e8f0", minHeight: "40px" }}
                    onClick={() => setShowInvoiceDropdown((prev) => !prev)}
                  >
                    <div className="d-flex align-items-center gap-1.5 flex-wrap overflow-hidden me-2">
                      {selectedInvoices.length === 0 ? (
                        <span className="text-muted fs-13">
                          -- Select an Invoice to link to this branch (Multiple supported) --
                        </span>
                      ) : (
                        <span className="text-dark fs-13">
                          <strong className="text-primary">{selectedInvoices.length} Invoice{selectedInvoices.length > 1 ? "s" : ""} Selected: </strong>
                          <span>{selectedInvoices.map((inv) => inv.po_number).join(", ")}</span>
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={18}
                      className="text-muted flex-shrink-0"
                      style={{
                        transform: showInvoiceDropdown ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </div>

                  {/* Dropdown Menu Overlay */}
                  {showInvoiceDropdown && (
                    <div
                      className="position-absolute start-0 end-0 bg-white border rounded-3 p-3 mt-1"
                      style={{
                        zIndex: 1050,
                        borderColor: "#cbd5e1",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        maxHeight: "320px",
                      }}
                    >
                      {/* Search & Actions Bar inside dropdown */}
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom">
                        <div className="input-group input-group-sm flex-grow-1">
                          <span className="input-group-text bg-white border-end-0">
                            <Search size={13} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 shadow-none fs-12"
                            placeholder="Filter invoices by PO, supplier..."
                            value={invoiceFilterQuery}
                            onChange={(e) => setInvoiceFilterQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>

                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none p-0 text-primary fs-11 fw-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllInvoices();
                            }}
                          >
                            All
                          </button>
                          <span className="text-muted fs-11">•</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none p-0 text-secondary fs-11 fw-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearAllInvoices();
                            }}
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border py-0.5 px-2 fs-11 shadow-none ms-1"
                            onClick={() => setShowInvoiceDropdown(false)}
                          >
                            Done
                          </button>
                        </div>
                      </div>

                      {/* Invoices List Options */}
                      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        {filteredAvailableInvoices.length === 0 ? (
                          <div className="text-center py-3 text-muted fs-12">
                            No invoices matching &quot;{invoiceFilterQuery}&quot;.
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            {filteredAvailableInvoices.map((inv) => {
                              const isSelected =
                                selectedInvoiceIds.includes(inv.id) ||
                                selectedInvoiceIds.includes(inv.po_number);
                              const dmg = getInvoiceDamageInfo(
                                inv.po_number || inv.supplier_invoice_no || "",
                                inv.id
                              );

                              return (
                                <div
                                  key={inv.id}
                                  className={`p-2 rounded-2 transition-all cursor-pointer d-flex align-items-center justify-content-between gap-2`}
                                  style={{
                                    backgroundColor: isSelected ? "#eff6ff" : "transparent",
                                    border: isSelected ? "1px solid #bfdbfe" : "1px solid transparent",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleInvoice(inv.id || inv.po_number);
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <input
                                      type="checkbox"
                                      className="form-check-input shadow-none mt-0 cursor-pointer"
                                      checked={isSelected}
                                      onChange={() => handleToggleInvoice(inv.id || inv.po_number)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div>
                                      <div className="d-flex align-items-center gap-1.5">
                                        <strong className="fs-12 text-dark">{inv.po_number}</strong>
                                        <span className="text-muted fs-11">• {inv.supplier_name}</span>
                                      </div>
                                      <span className="text-muted fs-11 d-block">
                                        Date: {inv.order_date} • {inv.items?.length || 0} items
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-end">
                                    <strong className="fs-12 text-dark d-block">
                                      ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
                                    </strong>
                                    {dmg.totalLoss > 0 ? (
                                      <span
                                        className="badge fw-semibold"
                                        style={{
                                          backgroundColor: "#fef2f2",
                                          color: "#FF0000",
                                          border: "1px solid #fecaca",
                                          fontSize: "10px",
                                        }}
                                      >
                                        ₹{dmg.totalLoss.toLocaleString("en-IN")} Damage
                                      </span>
                                    ) : (
                                      <span className="badge bg-success-subtle text-success fs-10">
                                        Nil Damage
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected Invoices Badges Bar */}
                  {selectedInvoices.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap align-items-center gap-1.5">
                      <span className="text-muted fs-11 fw-semibold text-uppercase">Selected:</span>
                      {selectedInvoices.map((inv) => (
                        <span
                          key={inv.id}
                          className="badge bg-light text-dark border d-inline-flex align-items-center gap-1 fs-11 py-1 px-2"
                        >
                          <strong className="text-primary">{inv.po_number}</strong>
                          <span className="text-muted">({inv.supplier_name})</span>
                          <X
                            size={12}
                            className="text-danger cursor-pointer ms-0.5"
                            onClick={() => handleToggleInvoice(inv.id || inv.po_number)}
                            title="Remove invoice"
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Displayed Invoice Values Grid & Details (When at least 1 invoice is selected) */}
                {selectedInvoices.length > 0 ? (
                  <div>
                    {/* Invoice Value Metrics Boxes */}
                    <div className="row g-3 mb-4">
                      {/* Supplier Name */}
                      <div className="col-12 col-md-4">
                        <div className="p-3 rounded-3 bg-light border h-100" style={{ borderColor: "#e2e8f0" }}>
                          <span className="text-muted fs-11 text-uppercase fw-semibold d-block">
                            Supplier Name
                          </span>
                          <strong className="fs-14 text-dark d-block mt-1 text-truncate" title={combinedSuppliersText}>
                            {combinedSuppliersText}
                          </strong>
                          <span className="text-muted fs-11 mt-1 d-block">
                            {selectedInvoices.length} invoice(s) linked
                          </span>
                        </div>
                      </div>

                      {/* Invoice Number */}
                      <div className="col-12 col-md-4">
                        <div className="p-3 rounded-3 bg-light border h-100" style={{ borderColor: "#e2e8f0" }}>
                          <span className="text-muted fs-11 text-uppercase fw-semibold d-block">
                            Invoice Number
                          </span>
                          <strong className="fs-14 text-primary d-block mt-1 text-truncate">
                            {selectedInvoices.map((i) => i.po_number).join(", ")}
                          </strong>
                          <span className="text-muted fs-11 mt-1 d-block">
                            Total Bill: ₹{selectedInvoices.reduce((acc, i) => acc + (Number(i.total_amount) || 0), 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Cost of Damage (Tracked in Damage Tracking page) */}
                      <div className="col-12 col-md-4">
                        <div className="p-3 rounded-3 bg-light border h-100" style={{ borderColor: "#e2e8f0" }}>
                          <span className="text-muted fs-11 text-uppercase fw-semibold d-block">
                            Cost of Damage
                          </span>
                          <div className="d-flex align-items-baseline gap-2 mt-1">
                            <strong
                              className="fs-16 fw-bold"
                              style={{ color: combinedDamageData.totalLoss > 0 ? "#FF0000" : "#16a34a" }}
                            >
                              ₹{combinedDamageData.totalLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </strong>
                            {combinedDamageData.totalLoss > 0 ? (
                              <span
                                className="badge rounded-pill fw-semibold"
                                style={{
                                  backgroundColor: "#fef2f2",
                                  color: "#FF0000",
                                  border: "1px solid #fecaca",
                                  fontSize: "11px",
                                }}
                              >
                                {combinedDamageData.damagedUnits} Damaged Units
                              </span>
                            ) : (
                              <span className="badge bg-success-subtle text-success border border-success-subtle fs-11">
                                Nil Damage
                              </span>
                            )}
                          </div>
                          <span className="text-muted fs-11 mt-1 d-block">
                            {combinedDamageData.totalLoss > 0
                              ? "✓ Automatically pulled from Damage Tracking page"
                              : "No damaged goods recorded for selected invoices"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Products Breakdown */}
                    <div className="border rounded-3 p-3 bg-white" style={{ borderColor: "#e2e8f0" }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="fw-bold fs-13 mb-0 text-dark d-flex align-items-center gap-1.5">
                          <Package size={16} className="text-primary" />
                          <span>Purchased Items in Selected Invoice(s) ({items.length})</span>
                        </h6>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 shadow-none"
                          onClick={handleAddItem}
                        >
                          <Plus size={13} /> Add Row
                        </button>
                      </div>

                      <div className="table-responsive">
                        <table className="table datanew mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: "40px" }}>#</th>
                              <th>Product &amp; Variant</th>
                              <th style={{ width: "120px" }}>SKU</th>
                              <th style={{ width: "90px" }} className="text-center">Qty</th>
                              <th style={{ width: "130px" }} className="text-end">Purchase Price (₹)</th>
                              <th style={{ width: "130px" }} className="text-end">Line Total (₹)</th>
                              <th style={{ width: "40px" }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it, idx) => {
                              const lineTotal = (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0);
                              return (
                                <tr key={it.id}>
                                  <td className="text-muted fs-12">{idx + 1}</td>
                                  <td>
                                    <div className="d-flex flex-column gap-1">
                                      <input
                                        type="text"
                                        className="form-control form-control-sm shadow-none"
                                        placeholder="Product Name"
                                        value={it.productName}
                                        onChange={(e) => handleUpdateItem(it.id, "productName", e.target.value)}
                                        required
                                      />
                                      {it.variantName && (
                                        <span className="text-muted fs-11">
                                          Ref: {it.variantName}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm shadow-none"
                                      placeholder="SKU"
                                      value={it.sku}
                                      onChange={(e) => handleUpdateItem(it.id, "sku", e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      min="1"
                                      className="form-control form-control-sm text-center shadow-none"
                                      value={it.quantity || ""}
                                      onChange={(e) => handleUpdateItem(it.id, "quantity", Number(e.target.value))}
                                      required
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      className="form-control form-control-sm text-end shadow-none"
                                      value={it.purchasePrice || ""}
                                      onChange={(e) => handleUpdateItem(it.id, "purchasePrice", Number(e.target.value))}
                                      required
                                    />
                                  </td>
                                  <td className="text-end fw-bold text-dark fs-13">
                                    ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      className="btn btn-sm p-1 text-danger border-0 bg-transparent shadow-none"
                                      onClick={() => handleRemoveItem(it.id)}
                                      title="Remove Item"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan={3} className="fw-bold text-dark fs-13 text-end">
                                Total Purchase (Bill Value):
                              </td>
                              <td className="text-center fw-bold text-dark fs-13">
                                {items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} units
                              </td>
                              <td></td>
                              <td className="text-end fw-bold text-dark fs-14">
                                ₹{totalPurchaseValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed rounded-3 bg-light text-muted fs-13">
                    <FileText size={32} className="text-muted opacity-50 mb-1 d-block mx-auto" />
                    <span>Please select an invoice from the dropdown above to display supplier name, invoice number, and tracked damage cost.</span>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 3RD CARD: EXPENSES & CALCULATION (WITH DAMAGE COST INCLUDED) */}
            {/* ======================================================== */}
            <div className="card border rounded-3 mb-4 shadow-none" style={{ borderColor: "#e2e8f0" }}>
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <Calculator size={20} className="text-primary" />
                  <h5 className="fw-bold mb-0 text-dark">3. Expenses &amp; Landing Cost Calculation</h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0 text-primary fw-semibold"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                  >
                    {showBreakdown ? "- Hide Breakdown" : "+ Show Breakdown"}
                  </button>
                  <span className="badge bg-light text-muted border fs-12">Step 3 of 3</span>
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

                {/* Option to Add Custom Expense Breakdown (Compact with + next to close icon) */}
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

                {/* Bottom of Card 3: Continue Button to move to Calculated Landed Cost Metrics */}
                {!calcDone ? (
                  <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-3 flex-wrap gap-2">
                    <div className="text-muted fs-12 d-flex align-items-center gap-1.5">
                      <Info size={15} className="text-primary flex-shrink-0" />
                      <span>
                        After entering expenses, click <strong>Continue</strong> to calculate and review landed cost metrics.
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-auto">
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4 shadow-none rounded-2"
                        onClick={() => setViewMode("list")}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2 shadow-none rounded-2 fw-semibold"
                        onClick={handleContinue}
                      >
                        <span>Continue</span>
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-3 bg-light p-2.5 rounded-2 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2 text-success fs-12 fw-semibold">
                      <CheckCircle2 size={16} />
                      <span>Expenses recorded. Calculated landed cost metrics data is shown below.</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 shadow-none rounded-2"
                      onClick={() => setCalcDone(false)}
                      title="Modify entered expenses"
                    >
                      <Edit2 size={13} />
                      <span>Edit Expenses</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* 4TH CARD: CALCULATED LANDED COST METRICS DATA             */}
            {/* (Revealed ONLY after clicking Continue)                   */}
            {/* ======================================================== */}
            {calcDone && (
              <div
                ref={metricsRef}
                className="card border rounded-3 mb-4 shadow-none"
                style={{ borderColor: "#e2e8f0" }}
              >
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Sparkles size={20} className="text-primary" />
                    <div>
                      <h5 className="fw-bold mb-0 text-dark">Calculated Landed Cost Metrics Data</h5>
                      <small className="text-muted fs-11">
                        Final landed cost per unit calculated by distributing ₹{totalCalculatedExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })} total expenses ({calculatedExpensePercent}%) across purchase items.
                      </small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 fs-12 d-inline-flex align-items-center gap-1">
                      <Check size={14} />
                      <span>Calculated &amp; Ready</span>
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



                  {/* Action Buttons on Revealed Metrics Card */}
                  <div className="d-flex align-items-center justify-content-between pt-3 border-top flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3 shadow-none rounded-2 d-inline-flex align-items-center gap-1.5"
                      onClick={() => setCalcDone(false)}
                    >
                      <Edit2 size={14} />
                      <span>Edit Expenses</span>
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
