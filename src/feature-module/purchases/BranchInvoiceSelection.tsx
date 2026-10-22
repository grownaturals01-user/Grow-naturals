import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Layers,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  Check,
  CheckCircle2,
  Package,
  Eye,
  AlertCircle,
  ShoppingBag,
  Building2,
  Link as LinkIcon,
  Tag,
  User,
  FilePlus,
  CheckSquare,
} from "lucide-react";
import { batchService, PurchaseItem, BatchRecord } from "../../services/batchService";
import { api } from "../../services/api";
import "../../styles/purchase-batch.css";

export interface AvailableInvoice {
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

export type InvoiceSelectionTab = "recently_added" | "existing_batch" | "auto_batch" | "unbatched";

export interface UnbatchedSoldItem {
  id: string;
  salesInvoiceId: string;
  salesInvoiceNo: string;
  soldDate: string;
  customerName: string;
  customerPhone?: string;
  productId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  costPrice?: number;
  category?: string;
  batchStatus: "unbatched" | "batched";
  linkedBatchId?: string;
  linkedBatchNo?: string;
}

export interface ProductSalesInvoiceEntry {
  id: string;
  salesInvoiceId: string;
  salesInvoiceNo: string;
  soldDate: string;
  customerName: string;
  customerPhone?: string;
  productId: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  channel?: string;
}

/**
 * Default realistic sold items from active sales invoices that have not been assigned to batches
 */
export const DEFAULT_UNBATCHED_SOLD_ITEMS: UnbatchedSoldItem[] = [
  // From Sales Invoice INV-2026-081 (Oberoi Luxury Resorts)
  {
    id: "sold-item-081-1",
    salesInvoiceId: "inv-001",
    salesInvoiceNo: "INV-2026-081",
    soldDate: "2026-10-16",
    customerName: "Oberoi Luxury Resorts",
    customerPhone: "+91 98700 11223",
    productId: "prod-pot-01",
    productName: "Ceramic Glazed Cylinder Planter 12\"",
    variantName: "12\" White Glazed",
    sku: "POT-CER-12",
    quantity: 45,
    unit: "PCS",
    unitPrice: 850,
    totalAmount: 38250,
    costPrice: 550,
    category: "Pots & Planters",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-081-2",
    salesInvoiceId: "inv-001",
    salesInvoiceNo: "INV-2026-081",
    soldDate: "2026-10-16",
    customerName: "Oberoi Luxury Resorts",
    customerPhone: "+91 98700 11223",
    productId: "prod-bon-01",
    productName: "Bonsai Ficus Microcarpa Grafted",
    variantName: "3-Year Trained Bonsai",
    sku: "PLT-BON-01",
    quantity: 30,
    unit: "PCS",
    unitPrice: 1200,
    totalAmount: 36000,
    costPrice: 750,
    category: "Plants & Saplings",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-081-3",
    salesInvoiceId: "inv-001",
    salesInvoiceNo: "INV-2026-081",
    soldDate: "2026-10-16",
    customerName: "Oberoi Luxury Resorts",
    customerPhone: "+91 98700 11223",
    productId: "prod-vermi-02",
    productName: "Organic Vermicompost Enriched 25kg",
    variantName: "25kg Bag",
    sku: "AGR-VC-25K",
    quantity: 50,
    unit: "Bags",
    unitPrice: 580,
    totalAmount: 29000,
    costPrice: 430,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },

  // From Sales Invoice INV-2026-079 (Anita Sharma)
  {
    id: "sold-item-079-1",
    salesInvoiceId: "inv-002",
    salesInvoiceNo: "INV-2026-079",
    soldDate: "2026-10-14",
    customerName: "Anita Sharma",
    customerPhone: "+91 98112 23344",
    productId: "prod-plant-02",
    productName: "Flowering Rose Plant Grafted Premium",
    variantName: "Red & Yellow Grafted",
    sku: "PLT-ROS-01",
    quantity: 35,
    unit: "PCS",
    unitPrice: 180,
    totalAmount: 6300,
    costPrice: 110,
    category: "Plants & Saplings",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-079-2",
    salesInvoiceId: "inv-002",
    salesInvoiceNo: "INV-2026-079",
    soldDate: "2026-10-14",
    customerName: "Anita Sharma",
    customerPhone: "+91 98112 23344",
    productId: "prod-tool-02",
    productName: "Compression Pressure Sprayer 5L",
    variantName: "5 Litre Heavy Duty",
    sku: "TOL-SPR-5L",
    quantity: 12,
    unit: "PCS",
    unitPrice: 850,
    totalAmount: 10200,
    costPrice: 550,
    category: "Garden Tools & Irrigation",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-079-3",
    salesInvoiceId: "inv-002",
    salesInvoiceNo: "INV-2026-079",
    soldDate: "2026-10-14",
    customerName: "Anita Sharma",
    customerPhone: "+91 98112 23344",
    productId: "prod-bio-01",
    productName: "Bio-Neem Cold Pressed Oil 1L",
    variantName: "1 Litre Bottle",
    sku: "BIO-NEM-1L",
    quantity: 20,
    unit: "PCS",
    unitPrice: 550,
    totalAmount: 11000,
    costPrice: 380,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },

  // From Sales Invoice INV-2026-077 (Aarsha Living Spaces)
  {
    id: "sold-item-077-1",
    salesInvoiceId: "inv-003",
    salesInvoiceNo: "INV-2026-077",
    soldDate: "2026-10-12",
    customerName: "Aarsha Living Spaces",
    customerPhone: "+91 94432 10987",
    productId: "prod-snk-01",
    productName: "Indoor Air Purifying Snake Plant (Sansevieria)",
    variantName: "2.5 Feet Potted Ceramic",
    sku: "PLT-SNK-01",
    quantity: 40,
    unit: "PCS",
    unitPrice: 350,
    totalAmount: 14000,
    costPrice: 220,
    category: "Plants & Saplings",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-077-2",
    salesInvoiceId: "inv-003",
    salesInvoiceNo: "INV-2026-077",
    soldDate: "2026-10-12",
    customerName: "Aarsha Living Spaces",
    customerPhone: "+91 94432 10987",
    productId: "prod-ter-08",
    productName: "Terracotta Handcrafted Pots 8-inch",
    variantName: "8-inch Natural Clay",
    sku: "POT-TER-08",
    quantity: 60,
    unit: "PCS",
    unitPrice: 160,
    totalAmount: 9600,
    costPrice: 95,
    category: "Pots & Planters",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-077-3",
    salesInvoiceId: "inv-003",
    salesInvoiceNo: "INV-2026-077",
    soldDate: "2026-10-12",
    customerName: "Aarsha Living Spaces",
    customerPhone: "+91 94432 10987",
    productId: "prod-bio-02",
    productName: "Trichoderma Viride Bio-Fungicide 1kg",
    variantName: "1kg Pack",
    sku: "BIO-TRC-1K",
    quantity: 25,
    unit: "Packs",
    unitPrice: 420,
    totalAmount: 10500,
    costPrice: 290,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },

  // From Sales Invoice INV-2026-074 (Abby Botanical Interiors)
  {
    id: "sold-item-074-1",
    salesInvoiceId: "inv-004",
    salesInvoiceNo: "INV-2026-074",
    soldDate: "2026-10-10",
    customerName: "Abby Botanical Interiors",
    customerPhone: "+91 91234 56780",
    productId: "prod-tool-03",
    productName: "Automatic Drip Irrigation Emitter Kit",
    variantName: "50 Plants Complete Kit",
    sku: "TOL-DRP-50",
    quantity: 15,
    unit: "Kits",
    unitPrice: 650,
    totalAmount: 9750,
    costPrice: 410,
    category: "Garden Tools & Irrigation",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-074-2",
    salesInvoiceId: "inv-004",
    salesInvoiceNo: "INV-2026-074",
    soldDate: "2026-10-10",
    customerName: "Abby Botanical Interiors",
    customerPhone: "+91 91234 56780",
    productId: "prod-tool-01",
    productName: "Garden Hand Pruning Shears Stainless",
    variantName: "Ergonomic Grip Heavy Duty",
    sku: "TOL-PRN-01",
    quantity: 25,
    unit: "PCS",
    unitPrice: 350,
    totalAmount: 8750,
    costPrice: 220,
    category: "Garden Tools & Irrigation",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-074-3",
    salesInvoiceId: "inv-004",
    salesInvoiceNo: "INV-2026-074",
    soldDate: "2026-10-10",
    customerName: "Abby Botanical Interiors",
    customerPhone: "+91 91234 56780",
    productId: "prod-bio-03",
    productName: "Liquid Seaweed Extract Bio-Stimulant",
    variantName: "500ml Bottle",
    sku: "BIO-SWD-500",
    quantity: 30,
    unit: "Bottles",
    unitPrice: 480,
    totalAmount: 14400,
    costPrice: 310,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },

  // From Sales Invoice INV-2026-083 (MDA Pots and Plants)
  {
    id: "sold-item-083-1",
    salesInvoiceId: "inv-005",
    salesInvoiceNo: "INV-2026-083",
    soldDate: "2026-10-17",
    customerName: "MDA Pots and Plants",
    customerPhone: "+91 98420 12345",
    productId: "prod-mon-01",
    productName: "Monstera Deliciosa Swiss Cheese Plant",
    variantName: "Large Foliage Potted",
    sku: "PLT-MON-01",
    quantity: 35,
    unit: "PCS",
    unitPrice: 450,
    totalAmount: 15750,
    costPrice: 280,
    category: "Plants & Saplings",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-083-2",
    salesInvoiceId: "inv-005",
    salesInvoiceNo: "INV-2026-083",
    soldDate: "2026-10-17",
    customerName: "MDA Pots and Plants",
    customerPhone: "+91 98420 12345",
    productId: "prod-met-hg",
    productName: "Hanging Metal Planter Geometric Gold",
    variantName: "Geometric Gold Finish",
    sku: "POT-MET-HG",
    quantity: 20,
    unit: "PCS",
    unitPrice: 680,
    totalAmount: 13600,
    costPrice: 420,
    category: "Pots & Planters",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-083-3",
    salesInvoiceId: "inv-005",
    salesInvoiceNo: "INV-2026-083",
    soldDate: "2026-10-17",
    customerName: "MDA Pots and Plants",
    customerPhone: "+91 98420 12345",
    productId: "prod-seed-01",
    productName: "Hybrid F1 Tomato Seeds 100g",
    variantName: "100g Pack",
    sku: "SED-TOM-100",
    quantity: 40,
    unit: "Packs",
    unitPrice: 450,
    totalAmount: 18000,
    costPrice: 320,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },

  // From Sales Invoice INV-2026-072 (Gowtham Nursery)
  {
    id: "sold-item-072-1",
    salesInvoiceId: "inv-006",
    salesInvoiceNo: "INV-2026-072",
    soldDate: "2026-10-08",
    customerName: "Gowtham Nursery",
    customerPhone: "+91 94430 12345",
    productId: "prod-seed-02",
    productName: "Hybrid F1 Chilli Seeds 50g",
    variantName: "50g Pack",
    sku: "SED-CHL-50",
    quantity: 40,
    unit: "Packs",
    unitPrice: 180,
    totalAmount: 7200,
    costPrice: 120,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },
  {
    id: "sold-item-072-2",
    salesInvoiceId: "inv-006",
    salesInvoiceNo: "INV-2026-072",
    soldDate: "2026-10-08",
    customerName: "Gowtham Nursery",
    customerPhone: "+91 94430 12345",
    productId: "prod-coc-01",
    productName: "Cocopeat Block High Expansion 5kg",
    variantName: "5kg Compressed Block",
    sku: "AGR-COC-5K",
    quantity: 50,
    unit: "Blocks",
    unitPrice: 240,
    totalAmount: 12000,
    costPrice: 150,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },

  // From POS Orders
  {
    id: "sold-pos-104-1",
    salesInvoiceId: "pos-104",
    salesInvoiceNo: "POS-2026-104",
    soldDate: "2026-10-15",
    customerName: "Walk-in Customer",
    productId: "prod-plant-03",
    productName: "Indoor Air Purifying Areca Palm",
    variantName: "2 Feet Potted",
    sku: "PLT-ARC-02",
    quantity: 6,
    unit: "PCS",
    unitPrice: 320,
    totalAmount: 1920,
    costPrice: 195,
    category: "Plants & Saplings",
    batchStatus: "unbatched",
  },
  {
    id: "sold-pos-109-1",
    salesInvoiceId: "pos-109",
    salesInvoiceNo: "POS-2026-109",
    soldDate: "2026-10-13",
    customerName: "Green Oasis Landscapes",
    productId: "prod-bio-01",
    productName: "Bio-Neem Cold Pressed Oil 1L",
    variantName: "1 Litre Bottle",
    sku: "BIO-NEM-1L",
    quantity: 10,
    unit: "PCS",
    unitPrice: 550,
    totalAmount: 5500,
    costPrice: 380,
    category: "Bio-Pesticides & Fertilizers",
    batchStatus: "unbatched",
  },
  {
    id: "sold-pos-115-1",
    salesInvoiceId: "pos-115",
    salesInvoiceNo: "POS-2026-115",
    soldDate: "2026-10-11",
    customerName: "Priya Garden Crafts",
    productId: "prod-pot-tray",
    productName: "Handcrafted Terracotta Bonsai Tray",
    variantName: "Oval Glazed Rim",
    sku: "POT-BON-TR",
    quantity: 15,
    unit: "PCS",
    unitPrice: 490,
    totalAmount: 7350,
    costPrice: 280,
    category: "Pots & Planters",
    batchStatus: "unbatched",
  },
];

interface BranchInvoiceSelectionProps {
  availableInvoices: AvailableInvoice[];
  loadingInvoices: boolean;
  onReloadInvoices: () => void;
  selectedInvoiceIds: string[];
  selectedInvoices: AvailableInvoice[];
  onToggleInvoice: (idOrPo: string) => void;
  onClearAllInvoices: () => void;
  batchedInvoiceKeys: Set<string>;
  getInvoiceItems: (inv: AvailableInvoice) => PurchaseItem[];
  getInvoiceDamageInfo: (invoiceNoOrPo: string, invoiceId?: string, supplierInvoiceNo?: string) => {
    totalLoss: number;
    damagedUnits: number;
    records: any[];
  };
  onBackToDetails: () => void;
  onCancel: () => void;
  onProceedToExpenses: () => void;
  onBatchSoldItems?: (items: PurchaseItem[], syntheticInvoice: AvailableInvoice) => void;
}

export const BranchInvoiceSelection: React.FC<BranchInvoiceSelectionProps> = ({
  availableInvoices,
  loadingInvoices,
  onReloadInvoices,
  selectedInvoiceIds,
  selectedInvoices,
  onToggleInvoice,
  onClearAllInvoices,
  batchedInvoiceKeys,
  getInvoiceItems,
  getInvoiceDamageInfo,
  onBackToDetails,
  onCancel,
  onProceedToExpenses,
  onBatchSoldItems,
}) => {
  // 4-Tab Invoice & Sold Items Selection State
  const [invoiceSelectionTab, setInvoiceSelectionTab] = useState<InvoiceSelectionTab>("recently_added");

  // Filter Toolbar States
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  const [filterCustomer, setFilterCustomer] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDatePreset, setFilterDatePreset] = useState<string>("all");
  const [showDateRangePicker, setShowDateRangePicker] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");

  // Table Row State
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<string[]>([]);
  const [openActionInvoiceId, setOpenActionInvoiceId] = useState<string | null>(null);
  const [openActionSoldItemId, setOpenActionSoldItemId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);

  // Invoices moved from Auto Batch to Create Batch
  const [movedToBatchIds, setMovedToBatchIds] = useState<string[]>([]);
  const [moveToBatchMessage, setMoveToBatchMessage] = useState<string | null>(null);

  // Unbatched Sold Items State
  const [batchedSoldItemIds, setBatchedSoldItemIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("gn_batched_sold_item_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedSoldItemIds, setSelectedSoldItemIds] = useState<string[]>([]);
  const [unbatchedPageSize] = useState<number>(10);
  const [unbatchedCurrentPage, setUnbatchedCurrentPage] = useState<number>(1);
  const [activeAssignModalItem, setActiveAssignModalItem] = useState<UnbatchedSoldItem | null>(null);
  const [activeSaleDetailItem, setActiveSaleDetailItem] = useState<UnbatchedSoldItem | null>(null);
  const [targetAssignBatchId, setTargetAssignBatchId] = useState<string>("");

  // Add to Invoice (Create Batch) Modal State
  const [activeAddToInvoiceItems, setActiveAddToInvoiceItems] = useState<UnbatchedSoldItem[] | null>(null);
  const [drawerStep, setDrawerStep] = useState<"sales_invoices" | "target_purchase_invoice">("sales_invoices");
  const [selectedTargetInvoiceId, setSelectedTargetInvoiceId] = useState<string>("");
  const [modalInvoiceSearch, setModalInvoiceSearch] = useState<string>("");
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);
  const [modalSalesInvoiceSearch, setModalSalesInvoiceSearch] = useState<string>("");
  const [selectedSalesInvoicesByProduct, setSelectedSalesInvoicesByProduct] = useState<Record<string, string[]>>({});
  const [invoiceLinkedSoldItems, setInvoiceLinkedSoldItems] = useState<Record<string, UnbatchedSoldItem[]>>(() => {
    try {
      const stored = localStorage.getItem("gn_invoice_linked_sold_items");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist invoiceLinkedSoldItems
  useEffect(() => {
    try {
      localStorage.setItem("gn_invoice_linked_sold_items", JSON.stringify(invoiceLinkedSoldItems));
    } catch (e) {
      console.warn("Failed to save invoiceLinkedSoldItems", e);
    }
  }, [invoiceLinkedSoldItems]);

  // Load existing batches for assignment
  const existingBatches = useMemo(() => {
    return batchService.getBatches();
  }, [invoiceSelectionTab, activeAssignModalItem]);

  // Close menus on click outside, scroll, or resize
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".pb-action-menu-dropdown") && !target.closest(".pb-action-btn")) {
        setOpenActionInvoiceId(null);
        setOpenActionSoldItemId(null);
        setActionMenuPosition(null);
      }
      if (!target.closest(".pb-date-picker-container")) {
        setShowDateRangePicker(false);
      }
    };

    const handleScrollOrResize = () => {
      if (openActionInvoiceId || openActionSoldItemId) {
        setOpenActionInvoiceId(null);
        setOpenActionSoldItemId(null);
        setActionMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, { capture: true });
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [openActionInvoiceId, openActionSoldItemId]);

  // Move an invoice or selected invoices from Auto Batch to Create Batch
  const handleMoveToBatch = (targetInvoiceIds?: string[]) => {
    const ids =
      targetInvoiceIds && targetInvoiceIds.length > 0
        ? targetInvoiceIds
        : filteredTabInvoices
            .filter(
              (inv) =>
                selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number)
            )
            .map((inv) => inv.id || inv.po_number);

    if (ids.length === 0) return;

    setMovedToBatchIds((prev) => Array.from(new Set([...prev, ...ids])));

    // Ensure moved invoices are selected for the batch
    ids.forEach((id) => {
      if (!selectedInvoiceIds.includes(id)) {
        onToggleInvoice(id);
      }
    });

    setMoveToBatchMessage(
      `Successfully moved ${ids.length} invoice${ids.length === 1 ? "" : "s"} to Create Batch.`
    );
    setInvoiceSelectionTab("recently_added");
  };

  // Determine invoice category across the 3 invoice tabs
  const getInvoiceCategory = (inv: AvailableInvoice): InvoiceSelectionTab => {
    const keyId = (inv.id || "").toLowerCase().trim();
    const keyPo = (inv.po_number || "").toLowerCase().trim();
    const keySupp = (inv.supplier_invoice_no || "").toLowerCase().trim();

    // 0. Explicitly moved from auto_batch to Create Batch
    if (
      movedToBatchIds.includes(inv.id) ||
      movedToBatchIds.includes(inv.po_number) ||
      (inv.supplier_invoice_no && movedToBatchIds.includes(inv.supplier_invoice_no))
    ) {
      return "recently_added";
    }

    // 1. Existing Batch: Mapped to a saved batch, or source is batch, or linkedBatch is set
    if (
      batchedInvoiceKeys.has(keyId) ||
      batchedInvoiceKeys.has(keyPo) ||
      batchedInvoiceKeys.has(keySupp) ||
      inv.source === "batch" ||
      Boolean(inv.linkedBatch)
    ) {
      return "existing_batch";
    }

    // 2. Auto Batch: Directly mapped to product page without being mapped to batch
    if (inv.isAutoMapped || inv.source === "auto_product" || Boolean(inv.linkedProduct)) {
      return "auto_batch";
    }

    // 3. Recently Added (Create Batch): Invoices not mapped to batches yet
    return "recently_added";
  };

  // Invoices partitioned by active tab
  const tabInvoices = useMemo(() => {
    if (invoiceSelectionTab === "unbatched") return [];
    return availableInvoices.filter((inv) => getInvoiceCategory(inv) === invoiceSelectionTab);
  }, [availableInvoices, invoiceSelectionTab, batchedInvoiceKeys, movedToBatchIds]);

  // Unbatched items: items sold but not in any batch
  const unbatchedSoldItems = useMemo(() => {
    // Collect all batches to check if any sales invoice or item is allocated
    const batches = batchService.getBatches();
    const batchLinkedSalesInvoices = new Set<string>();
    const batchLinkedSkus = new Set<string>();

    batches.forEach((b) => {
      if (b.invoiceNo) batchLinkedSalesInvoices.add(b.invoiceNo.toLowerCase().trim());
      if (b.notes && b.notes.includes("SI-")) {
        const matches = b.notes.match(/SI-[\w-]+/g);
        if (matches) matches.forEach((m) => batchLinkedSalesInvoices.add(m.toLowerCase()));
      }
      b.items.forEach((it) => {
        if (it.sku) batchLinkedSkus.add(it.sku.toLowerCase().trim());
      });
    });

    // Also include sales invoices mapped in default existing batches
    batchLinkedSalesInvoices.add("si-2026-042");
    batchLinkedSalesInvoices.add("si-2026-049");
    batchLinkedSalesInvoices.add("si-2026-058");
    batchLinkedSalesInvoices.add("si-2026-061");

    return DEFAULT_UNBATCHED_SOLD_ITEMS.filter((item) => {
      // If user has explicitly batched it in session/storage
      if (batchedSoldItemIds.includes(item.id)) return false;

      // If associated sales invoice is already batched
      const cleanInv = item.salesInvoiceNo.toLowerCase().trim();
      if (batchLinkedSalesInvoices.has(cleanInv)) return false;

      return true;
    });
  }, [batchedSoldItemIds]);

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
    return { recent, existing, auto, unbatched: unbatchedSoldItems.length };
  }, [availableInvoices, batchedInvoiceKeys, movedToBatchIds, unbatchedSoldItems]);

  // Unique suppliers within active tab
  const uniqueSuppliersInTab = useMemo(() => {
    const set = new Set<string>();
    tabInvoices.forEach((inv) => {
      if (inv.supplier_name) set.add(inv.supplier_name);
    });
    return Array.from(set).sort();
  }, [tabInvoices]);

  // Unique customers for Unbatched Tab
  const uniqueCustomersInUnbatched = useMemo(() => {
    const set = new Set<string>();
    unbatchedSoldItems.forEach((it) => {
      if (it.customerName) set.add(it.customerName);
    });
    return Array.from(set).sort();
  }, [unbatchedSoldItems]);

  // Filtered invoices within active invoice tabs (1, 2, 3)
  const filteredTabInvoices = useMemo(() => {
    if (invoiceSelectionTab === "unbatched") return [];
    const list = tabInvoices.filter((inv) => {
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
      if (filterDatePreset === "last_7") {
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

    // Automatically move selected invoices to the top of the rows
    return [...list].sort((a, b) => {
      const aSel =
        selectedInvoiceIds.includes(a.id) || selectedInvoiceIds.includes(a.po_number) ? 1 : 0;
      const bSel =
        selectedInvoiceIds.includes(b.id) || selectedInvoiceIds.includes(b.po_number) ? 1 : 0;
      return bSel - aSel;
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

  // Filtered Unbatched Sold Items for Tab 4
  const filteredUnbatchedItems = useMemo(() => {
    const list = unbatchedSoldItems.filter((item) => {
      // 1. Customer Filter
      if (filterCustomer !== "all" && item.customerName !== filterCustomer) {
        return false;
      }

      // 2. Category / Filter
      if (filterCategory !== "all") {
        if (filterCategory === "high_value" && item.totalAmount < 10000) return false;
        if (filterCategory === "bulk_qty" && item.quantity < 20) return false;
        if (
          filterCategory !== "high_value" &&
          filterCategory !== "bulk_qty" &&
          item.category !== filterCategory
        ) {
          return false;
        }
      }

      // 3. Date Filter (Sold Date)
      if (filterDatePreset === "last_7") {
        const d = new Date(item.soldDate).getTime();
        const now = Date.now();
        if (now - d > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (filterDatePreset === "last_30") {
        const d = new Date(item.soldDate).getTime();
        const now = Date.now();
        if (now - d > 30 * 24 * 60 * 60 * 1000) return false;
      } else if (filterDatePreset === "custom") {
        if (customStartDate && item.soldDate < customStartDate) return false;
        if (customEndDate && item.soldDate > customEndDate) return false;
      }

      // 4. Search Filter
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase().trim();
        const matchProd = (item.productName || "").toLowerCase().includes(q);
        const matchSku = (item.sku || "").toLowerCase().includes(q);
        const matchInv = (item.salesInvoiceNo || "").toLowerCase().includes(q);
        const matchCust = (item.customerName || "").toLowerCase().includes(q);
        const matchVariant = (item.variantName || "").toLowerCase().includes(q);
        if (!matchProd && !matchSku && !matchInv && !matchCust && !matchVariant) {
          return false;
        }
      }

      return true;
    });

    // Automatically move selected sold items to the top of the rows
    return [...list].sort((a, b) => {
      const aSel = selectedSoldItemIds.includes(a.id) ? 1 : 0;
      const bSel = selectedSoldItemIds.includes(b.id) ? 1 : 0;
      return bSel - aSel;
    });
  }, [
    unbatchedSoldItems,
    filterCustomer,
    filterCategory,
    filterDatePreset,
    customStartDate,
    customEndDate,
    filterSearch,
    selectedSoldItemIds,
  ]);

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setUnbatchedCurrentPage(1);
  }, [
    filterCustomer,
    filterCategory,
    filterDatePreset,
    customStartDate,
    customEndDate,
    filterSearch,
  ]);

  // Pagination for Unbatched Table (10 rows per page limit)
  const totalUnbatchedPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUnbatchedItems.length / unbatchedPageSize));
  }, [filteredUnbatchedItems.length, unbatchedPageSize]);

  const safeUnbatchedPage = useMemo(() => {
    return Math.min(Math.max(1, unbatchedCurrentPage), totalUnbatchedPages);
  }, [unbatchedCurrentPage, totalUnbatchedPages]);

  const paginatedUnbatchedItems = useMemo(() => {
    const start = (safeUnbatchedPage - 1) * unbatchedPageSize;
    return filteredUnbatchedItems.slice(start, start + unbatchedPageSize);
  }, [filteredUnbatchedItems, safeUnbatchedPage, unbatchedPageSize]);

  // Master selection for the active tab (Invoices)
  const isAllTabSelected = useMemo(() => {
    if (filteredTabInvoices.length === 0) return false;
    return filteredTabInvoices.every(
      (inv) => selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number)
    );
  }, [filteredTabInvoices, selectedInvoiceIds]);

  const handleToggleSelectAllTab = () => {
    if (isAllTabSelected) {
      filteredTabInvoices.forEach((inv) => {
        if (selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number)) {
          onToggleInvoice(inv.id || inv.po_number);
        }
      });
    } else {
      filteredTabInvoices.forEach((inv) => {
        const isSel =
          selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number);
        if (!isSel) {
          onToggleInvoice(inv.id || inv.po_number);
        }
      });
    }
  };

  // Master selection for Unbatched Sold Items (controls visible rows on current page)
  const isAllSoldSelected = useMemo(() => {
    if (paginatedUnbatchedItems.length === 0) return false;
    return paginatedUnbatchedItems.every((it) => selectedSoldItemIds.includes(it.id));
  }, [paginatedUnbatchedItems, selectedSoldItemIds]);

  const handleToggleSelectAllSold = () => {
    if (isAllSoldSelected) {
      setSelectedSoldItemIds((prev) =>
        prev.filter((id) => !paginatedUnbatchedItems.some((it) => it.id === id))
      );
    } else {
      setSelectedSoldItemIds((prev) => {
        const newIds = paginatedUnbatchedItems.map((it) => it.id);
        return Array.from(new Set([...prev, ...newIds]));
      });
    }
  };

  const handleToggleSoldItem = (id: string) => {
    setSelectedSoldItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Batch selected unbatched sold items
  const handleBatchSelectedSoldItems = (targetItems?: UnbatchedSoldItem[]) => {
    const itemsToBatch =
      targetItems && targetItems.length > 0
        ? targetItems
        : filteredUnbatchedItems.filter((it) => selectedSoldItemIds.includes(it.id));

    if (itemsToBatch.length === 0) return;

    // Convert UnbatchedSoldItem[] to PurchaseItem[]
    const batchItems: PurchaseItem[] = itemsToBatch.map((it, idx) => ({
      id: `unbatched-sold-${Date.now()}-${idx}`,
      invoiceId: `INV-SOLD-${it.salesInvoiceNo}`,
      invoicePo: it.salesInvoiceNo,
      productId: it.productId || "",
      productName: it.productName,
      variantName: it.variantName || it.salesInvoiceNo,
      sku: it.sku,
      quantity: it.quantity,
      remainingQty: it.quantity,
      purchasePrice: it.costPrice || Math.round(it.unitPrice * 0.7),
      sellingPrice: it.unitPrice,
      actualCost: it.costPrice || Math.round(it.unitPrice * 0.7),
    }));

    const totalAmount = itemsToBatch.reduce(
      (sum, it) => sum + (it.costPrice || Math.round(it.unitPrice * 0.7)) * it.quantity,
      0
    );
    const invoiceNos = Array.from(new Set(itemsToBatch.map((it) => it.salesInvoiceNo))).join(", ");
    const customers = Array.from(new Set(itemsToBatch.map((it) => it.customerName))).join(", ");

    const syntheticInvoice: AvailableInvoice = {
      id: `inv-sold-${Date.now()}`,
      po_number: `BATCH-SOLD-${Date.now().toString().slice(-4)}`,
      supplier_invoice_no: invoiceNos,
      supplier_name: `Unbatched Sales (${customers})`,
      order_date: new Date().toISOString().split("T")[0],
      total_amount: totalAmount,
      items: batchItems,
      source: "database",
    };

    // Mark these items as batched
    const itemIds = itemsToBatch.map((it) => it.id);
    const updatedBatchedIds = Array.from(new Set([...batchedSoldItemIds, ...itemIds]));
    setBatchedSoldItemIds(updatedBatchedIds);
    try {
      localStorage.setItem("gn_batched_sold_item_ids", JSON.stringify(updatedBatchedIds));
    } catch {
      // Ignore
    }
    setSelectedSoldItemIds([]);

    setMoveToBatchMessage(
      `Successfully created branch batch items for ${itemsToBatch.length} sold item${
        itemsToBatch.length === 1 ? "" : "s"
      } (${invoiceNos}).`
    );

    if (onBatchSoldItems) {
      onBatchSoldItems(batchItems, syntheticInvoice);
    } else {
      onToggleInvoice(syntheticInvoice.id);
      setInvoiceSelectionTab("recently_added");
    }
  };

  // Link a sold item directly to an existing batch
  const handleAssignToExistingBatch = (item: UnbatchedSoldItem, batchId: string) => {
    const batches = batchService.getBatches();
    const targetBatch = batches.find((b) => b.id === batchId || b.batchNo === batchId);
    if (!targetBatch) return;

    const newPurchaseItem: PurchaseItem = {
      id: `assigned-sold-${Date.now()}`,
      invoiceId: `INV-SOLD-${item.salesInvoiceNo}`,
      invoicePo: item.salesInvoiceNo,
      productId: item.productId || "",
      productName: item.productName,
      variantName: item.variantName || item.salesInvoiceNo,
      sku: item.sku,
      quantity: item.quantity,
      remainingQty: item.quantity,
      purchasePrice: item.costPrice || Math.round(item.unitPrice * 0.7),
      sellingPrice: item.unitPrice,
      actualCost: item.costPrice || Math.round(item.unitPrice * 0.7),
    };

    const updatedBatch: BatchRecord = {
      ...targetBatch,
      items: [...targetBatch.items, newPurchaseItem],
      invoiceNos: Array.from(new Set([...(targetBatch.invoiceNos || []), item.salesInvoiceNo])),
      totalPurchaseValue:
        targetBatch.totalPurchaseValue +
        (item.costPrice || Math.round(item.unitPrice * 0.7)) * item.quantity,
    };

    batchService.saveBatch(updatedBatch);

    const updatedBatchedIds = Array.from(new Set([...batchedSoldItemIds, item.id]));
    setBatchedSoldItemIds(updatedBatchedIds);
    try {
      localStorage.setItem("gn_batched_sold_item_ids", JSON.stringify(updatedBatchedIds));
    } catch {
      // Ignore
    }

    setActiveAssignModalItem(null);
    setMoveToBatchMessage(
      `Successfully linked sold item "${item.productName}" (${item.salesInvoiceNo}) to batch "${
        targetBatch.branchName || targetBatch.batchNo
      }".`
    );
  };

  // List of all purchase invoices in the "Create Batch" tab
  const createBatchInvoices = useMemo(() => {
    return availableInvoices.filter((inv) => getInvoiceCategory(inv) === "recently_added");
  }, [availableInvoices, batchedInvoiceKeys, movedToBatchIds]);

  // Filtered invoices for the "Add to Invoice" drawer
  const modalFilteredInvoices = useMemo(() => {
    if (!activeAddToInvoiceItems || activeAddToInvoiceItems.length === 0) return createBatchInvoices;
    const q = modalInvoiceSearch.trim().toLowerCase();

    if (!q) {
      return createBatchInvoices;
    }

    return createBatchInvoices.filter((inv) => {
      const po = (inv.po_number || "").toLowerCase();
      const suppInv = (inv.supplier_invoice_no || "").toLowerCase();
      const suppName = (inv.supplier_name || "").toLowerCase();
      const invItems = getInvoiceItems(inv);
      const itemMatch = invItems.some(
        (it) =>
          (it.productName || "").toLowerCase().includes(q) ||
          (it.sku || "").toLowerCase().includes(q)
      );
      return po.includes(q) || suppInv.includes(q) || suppName.includes(q) || itemMatch;
    });
  }, [createBatchInvoices, activeAddToInvoiceItems, modalInvoiceSearch, getInvoiceItems]);

  // Key helper to identify a product uniquely in the drawer
  const getProductKey = (item: UnbatchedSoldItem | null | undefined): string => {
    if (!item) return "";
    return item.productId || item.sku || item.id || item.productName;
  };

  // Helper to split a product's sold quantity across realistic sales invoices such that their sum equals item.quantity
  const splitQuantityIntoInvoices = (totalQty: number): number[] => {
    if (totalQty <= 0) return [0];
    if (totalQty === 1) return [1];
    if (totalQty === 2) return [1, 1];
    if (totalQty === 3) return [2, 1];

    let targetCount = 3;
    if (totalQty <= 6) targetCount = 2;
    else if (totalQty <= 18) targetCount = 3;
    else if (totalQty <= 45) targetCount = 4;
    else targetCount = 5;

    const count = Math.min(targetCount, totalQty);

    const ratiosMap: Record<number, number[]> = {
      2: [0.6, 0.4],
      3: [0.45, 0.35, 0.2],
      4: [0.35, 0.3, 0.2, 0.15],
      5: [0.3, 0.25, 0.2, 0.15, 0.1],
    };

    const ratios = ratiosMap[count] || ratiosMap[4];
    const splits: number[] = [];
    let remaining = totalQty;

    for (let i = 0; i < count - 1; i++) {
      const raw = Math.round(totalQty * ratios[i]);
      const minNeededForRest = count - 1 - i;
      const portion = Math.max(1, Math.min(raw, remaining - minNeededForRest));
      splits.push(portion);
      remaining -= portion;
    }
    splits.push(Math.max(1, remaining));

    return splits;
  };

  const MOCK_SALES_INVOICE_PROFILES = [
    { invNo: "INV-2026-079", date: "2026-10-14", customer: "Anita Sharma", phone: "+91 98112 23344", channel: "Retail POS" },
    { invNo: "INV-2026-081", date: "2026-10-16", customer: "Oberoi Luxury Resorts", phone: "+91 98700 11223", channel: "B2B Wholesale" },
    { invNo: "INV-2026-077", date: "2026-10-12", customer: "Aarsha Living Spaces", phone: "+91 94432 10987", channel: "Interior Project" },
    { invNo: "INV-2026-088", date: "2026-10-17", customer: "Green Valley Agro Farms", phone: "+91 97654 32109", channel: "Direct Order" },
    { invNo: "INV-2026-095", date: "2026-10-18", customer: "Urban Bloom Terrace & Lawn", phone: "+91 98220 54321", channel: "Retail POS" },
    { invNo: "INV-2026-102", date: "2026-10-19", customer: "Vikram Malhotra", phone: "+91 98331 67890", channel: "Walk-in Counter" },
  ];

  // Retrieve or generate comprehensive sales invoices for a selected product
  // Each product's total sold quantity is split across these sales invoices so the sum exactly matches item.quantity!
  const getSalesInvoicesForProduct = (
    item: UnbatchedSoldItem,
    _allSoldItems: UnbatchedSoldItem[]
  ): ProductSalesInvoiceEntry[] => {
    if (!item) return [];

    const totalQty = Number(item.quantity) || 1;
    const splits = splitQuantityIntoInvoices(totalQty);

    const primaryProfile = {
      invNo: item.salesInvoiceNo || "INV-2026-079",
      date: item.soldDate || "2026-10-14",
      customer: item.customerName || "Anita Sharma",
      phone: item.customerPhone || "+91 98112 23344",
      channel: "Retail POS",
    };

    const otherProfiles = MOCK_SALES_INVOICE_PROFILES.filter(
      (p) => p.invNo !== primaryProfile.invNo
    );
    const profiles = [primaryProfile, ...otherProfiles];

    return splits.map((qty, idx) => {
      const prof = profiles[idx % profiles.length];
      const invId = `${item.id || item.sku || "prod"}-split-${idx + 1}-${prof.invNo}`;
      const unitPrice = Number(item.unitPrice) || 0;
      const totalAmount = Math.round(qty * unitPrice);

      return {
        id: invId,
        salesInvoiceId: `inv-sales-${idx + 1}`,
        salesInvoiceNo: prof.invNo,
        soldDate: prof.date,
        customerName: prof.customer,
        customerPhone: prof.phone,
        productId: item.productId || item.sku,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        quantity: qty,
        unit: item.unit || "PCS",
        unitPrice: unitPrice,
        totalAmount: totalAmount,
        channel: prof.channel,
      };
    });
  };

  // Open the Add to Invoice drawer
  const handleOpenAddToInvoiceModal = (targetItems?: UnbatchedSoldItem[]) => {
    const items =
      targetItems && targetItems.length > 0
        ? targetItems
        : filteredUnbatchedItems.filter((it) => selectedSoldItemIds.includes(it.id));

    if (items.length === 0) return;

    const defaultTargetId =
      createBatchInvoices[0]?.id || createBatchInvoices[0]?.po_number || "";
    setSelectedTargetInvoiceId(defaultTargetId);
    setModalInvoiceSearch("");
    setSelectedProductIndex(0);
    setModalSalesInvoiceSearch("");

    // By default, NO sales invoices are pre-selected (all unchecked)
    const initialSelectedMap: Record<string, string[]> = {};
    items.forEach((it) => {
      const key = getProductKey(it);
      initialSelectedMap[key] = [];
    });
    setSelectedSalesInvoicesByProduct(initialSelectedMap);
    setDrawerStep("sales_invoices");
    setActiveAddToInvoiceItems(items);
  };

  // Currently active product in the drawer
  const activeDrawerProduct = useMemo(() => {
    if (!activeAddToInvoiceItems || activeAddToInvoiceItems.length === 0) return null;
    const safeIdx = Math.min(Math.max(0, selectedProductIndex), activeAddToInvoiceItems.length - 1);
    return activeAddToInvoiceItems[safeIdx];
  }, [activeAddToInvoiceItems, selectedProductIndex]);

  const activeDrawerProductKey = useMemo(() => {
    return getProductKey(activeDrawerProduct);
  }, [activeDrawerProduct]);

  // All sales invoices for active product
  const activeDrawerProductInvoices = useMemo(() => {
    if (!activeDrawerProduct) return [];
    return getSalesInvoicesForProduct(activeDrawerProduct, unbatchedSoldItems);
  }, [activeDrawerProduct, unbatchedSoldItems]);

  // Filtered sales invoices for search
  const filteredDrawerSalesInvoices = useMemo(() => {
    if (!modalSalesInvoiceSearch.trim()) return activeDrawerProductInvoices;
    const q = modalSalesInvoiceSearch.trim().toLowerCase();
    return activeDrawerProductInvoices.filter((inv) => {
      const invNo = (inv.salesInvoiceNo || "").toLowerCase();
      const cust = (inv.customerName || "").toLowerCase();
      const phone = (inv.customerPhone || "").toLowerCase();
      const date = (inv.soldDate || "").toLowerCase();
      const sku = (inv.sku || "").toLowerCase();
      const vName = (inv.variantName || "").toLowerCase();
      const channel = (inv.channel || "").toLowerCase();
      return (
        invNo.includes(q) ||
        cust.includes(q) ||
        phone.includes(q) ||
        date.includes(q) ||
        sku.includes(q) ||
        vName.includes(q) ||
        channel.includes(q)
      );
    });
  }, [activeDrawerProductInvoices, modalSalesInvoiceSearch]);

  // Toggle single sales invoice selection for a product
  const handleToggleSalesInvoice = (productKey: string, invoiceId: string) => {
    setSelectedSalesInvoicesByProduct((prev) => {
      const current = prev[productKey] || [];
      const updated = current.includes(invoiceId)
        ? current.filter((id) => id !== invoiceId)
        : [...current, invoiceId];
      return {
        ...prev,
        [productKey]: updated,
      };
    });
  };

  // Toggle select all visible sales invoices for active product
  const handleToggleSelectAllForActiveProduct = () => {
    if (!activeDrawerProductKey) return;
    const visibleIds = filteredDrawerSalesInvoices.map((inv) => inv.id);
    if (visibleIds.length === 0) return;

    const currentSelected = selectedSalesInvoicesByProduct[activeDrawerProductKey] || [];
    const allSelected = visibleIds.every((id) => currentSelected.includes(id));

    setSelectedSalesInvoicesByProduct((prev) => ({
      ...prev,
      [activeDrawerProductKey]: allSelected
        ? currentSelected.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...currentSelected, ...visibleIds])),
    }));
  };

  // Total summary across all products in the drawer
  const totalSalesInvoiceSummary = useMemo(() => {
    if (!activeAddToInvoiceItems || activeAddToInvoiceItems.length === 0) {
      return { totalProducts: 0, totalInvoices: 0, totalUnits: 0, totalAmount: 0 };
    }

    let totalInvoices = 0;
    let totalUnits = 0;
    let totalAmount = 0;

    activeAddToInvoiceItems.forEach((product) => {
      const key = getProductKey(product);
      const selectedIds = selectedSalesInvoicesByProduct[key] || [];
      const allInvs = getSalesInvoicesForProduct(product, unbatchedSoldItems);
      const chosen = allInvs.filter((inv) => selectedIds.includes(inv.id));

      totalInvoices += chosen.length;
      chosen.forEach((inv) => {
        totalUnits += Number(inv.quantity) || 0;
        totalAmount += Number(inv.totalAmount) || 0;
      });
    });

    return {
      totalProducts: activeAddToInvoiceItems.length,
      totalInvoices,
      totalUnits,
      totalAmount,
    };
  }, [activeAddToInvoiceItems, selectedSalesInvoicesByProduct, unbatchedSoldItems]);

  // Selected units count for active product
  const selectedQtyForActive = useMemo(() => {
    if (!activeDrawerProductKey) return 0;
    const selectedIds = selectedSalesInvoicesByProduct[activeDrawerProductKey] || [];
    return activeDrawerProductInvoices
      .filter((inv) => selectedIds.includes(inv.id))
      .reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);
  }, [activeDrawerProductKey, selectedSalesInvoicesByProduct, activeDrawerProductInvoices]);

  // Proceed from Step 1 (Sales Invoices) to Step 2 (Target Purchase Invoice)
  const handleProceedToPurchaseInvoiceSelection = () => {
    if (totalSalesInvoiceSummary.totalInvoices === 0) return;
    if (!selectedTargetInvoiceId && createBatchInvoices.length > 0) {
      setSelectedTargetInvoiceId(createBatchInvoices[0].id || createBatchInvoices[0].po_number || "");
    }
    setDrawerStep("target_purchase_invoice");
  };

  // Confirm moving sold items / selected sales invoices to selected invoice from Create Batch
  const handleConfirmMoveToInvoice = (items?: UnbatchedSoldItem[], targetInvoiceId?: string) => {
    const finalTargetId = targetInvoiceId || selectedTargetInvoiceId;
    if (!finalTargetId) return;

    let itemsToMove: UnbatchedSoldItem[] = [];

    if (items && items.length > 0) {
      itemsToMove = items;
    } else if (activeAddToInvoiceItems && activeAddToInvoiceItems.length > 0) {
      // Gather chosen sales invoice entries from the drawer selection
      const allChosenEntries: ProductSalesInvoiceEntry[] = [];
      activeAddToInvoiceItems.forEach((product) => {
        const key = getProductKey(product);
        const selectedIds = selectedSalesInvoicesByProduct[key] || [];
        const allInvs = getSalesInvoicesForProduct(product, unbatchedSoldItems);
        const chosen = allInvs.filter((inv) => selectedIds.includes(inv.id));
        allChosenEntries.push(...chosen);
      });

      if (allChosenEntries.length > 0) {
        itemsToMove = allChosenEntries.map((entry, idx) => ({
          id: entry.id || `linked-sold-item-${Date.now()}-${idx}`,
          salesInvoiceId: entry.salesInvoiceId,
          salesInvoiceNo: entry.salesInvoiceNo,
          soldDate: entry.soldDate,
          customerName: entry.customerName,
          customerPhone: entry.customerPhone,
          productId: entry.productId,
          productName: entry.productName,
          variantName: entry.variantName,
          sku: entry.sku,
          quantity: entry.quantity,
          unit: entry.unit,
          unitPrice: entry.unitPrice,
          totalAmount: entry.totalAmount,
          costPrice: Math.round(entry.unitPrice * 0.7),
          category: "Sold Items",
          batchStatus: "unbatched",
        }));
      } else {
        itemsToMove = activeAddToInvoiceItems;
      }
    }

    if (itemsToMove.length === 0) return;

    const targetInvoice =
      createBatchInvoices.find((inv) => inv.id === finalTargetId || inv.po_number === finalTargetId) ||
      availableInvoices.find((inv) => inv.id === finalTargetId || inv.po_number === finalTargetId);

    const invKey = targetInvoice?.id || finalTargetId;
    const invLabel = targetInvoice?.po_number || targetInvoice?.supplier_invoice_no || invKey;

    // 1. Link items to the target invoice in state
    setInvoiceLinkedSoldItems((prev) => ({
      ...prev,
      [invKey]: [...(prev[invKey] || []), ...itemsToMove],
    }));

    // 2. Mark parent sold items as batched/moved out of Unbatched tab
    const movedParentIds = (activeAddToInvoiceItems || []).map((it) => it.id);
    const updatedBatched = Array.from(new Set([...batchedSoldItemIds, ...movedParentIds]));
    setBatchedSoldItemIds(updatedBatched);
    try {
      localStorage.setItem("gn_batched_sold_item_ids", JSON.stringify(updatedBatched));
    } catch (e) {
      console.warn("Failed to save batchedSoldItemIds", e);
    }

    // 3. Clear selected checkboxes
    setSelectedSoldItemIds((prev) => prev.filter((id) => !movedParentIds.includes(id)));

    // 4. Ensure target invoice is selected for batching in Create Batch
    if (targetInvoice && !selectedInvoiceIds.includes(targetInvoice.id)) {
      onToggleInvoice(targetInvoice.id);
    }

    // 5. Success notification message
    const totalUnits = itemsToMove.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    setMoveToBatchMessage(
      `Successfully linked ${itemsToMove.length} sales invoice(s) (${totalUnits} units) to purchase invoice ${invLabel} in Create Batch.`
    );

    // 6. Close modal & navigate to Create Batch tab
    setActiveAddToInvoiceItems(null);
    setDrawerStep("sales_invoices");
    setInvoiceSelectionTab("recently_added");
  };

  // All chosen sales invoice entries from the drawer across all products
  const allChosenSalesInvoiceEntries = useMemo(() => {
    if (!activeAddToInvoiceItems || activeAddToInvoiceItems.length === 0) return [];
    const entries: ProductSalesInvoiceEntry[] = [];
    activeAddToInvoiceItems.forEach((product) => {
      const key = getProductKey(product);
      const selectedIds = selectedSalesInvoicesByProduct[key] || [];
      const allInvs = getSalesInvoicesForProduct(product, unbatchedSoldItems);
      const chosen = allInvs.filter((inv) => selectedIds.includes(inv.id));
      entries.push(...chosen);
    });
    return entries;
  }, [activeAddToInvoiceItems, selectedSalesInvoicesByProduct, unbatchedSoldItems]);

  // Selected target invoice object in Create Batch
  const selectedTargetInvoice = useMemo(() => {
    return (
      createBatchInvoices.find(
        (inv) => inv.id === selectedTargetInvoiceId || inv.po_number === selectedTargetInvoiceId
      ) ||
      availableInvoices.find(
        (inv) => inv.id === selectedTargetInvoiceId || inv.po_number === selectedTargetInvoiceId
      ) ||
      null
    );
  }, [createBatchInvoices, availableInvoices, selectedTargetInvoiceId]);

  // Totals for Unbatched Tab
  const totalSelectedSoldAmount = useMemo(() => {
    return unbatchedSoldItems
      .filter((it) => selectedSoldItemIds.includes(it.id))
      .reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
  }, [unbatchedSoldItems, selectedSoldItemIds]);

  const filteredUnbatchedTotalUnits = useMemo(() => {
    return filteredUnbatchedItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [filteredUnbatchedItems]);

  const filteredUnbatchedTotalSales = useMemo(() => {
    return filteredUnbatchedItems.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
  }, [filteredUnbatchedItems]);

  // Total amount of selected invoices
  const totalSelectedAmount = useMemo(() => {
    return selectedInvoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
  }, [selectedInvoices]);

  const toggleInvoiceExpand = (invId: string) => {
    setExpandedInvoiceIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    );
  };

  const activeActionInvoice = useMemo(() => {
    if (!openActionInvoiceId) return null;
    return filteredTabInvoices.find((i) => i.id === openActionInvoiceId) || null;
  }, [openActionInvoiceId, filteredTabInvoices]);

  const activeActionSoldItem = useMemo(() => {
    if (!openActionSoldItemId) return null;
    return filteredUnbatchedItems.find((i) => i.id === openActionSoldItemId) || null;
  }, [openActionSoldItemId, filteredUnbatchedItems]);

  const isActionInvExpanded = activeActionInvoice
    ? expandedInvoiceIds.includes(activeActionInvoice.id)
    : false;

  const isActionInvSelected = activeActionInvoice
    ? selectedInvoiceIds.includes(activeActionInvoice.id) ||
      selectedInvoiceIds.includes(activeActionInvoice.po_number)
    : false;

  const activeInvDmg = activeActionInvoice
    ? getInvoiceDamageInfo(
        activeActionInvoice.po_number || activeActionInvoice.supplier_invoice_no || "",
        activeActionInvoice.id,
        activeActionInvoice.supplier_invoice_no
      )
    : { damagedUnits: 0, totalLoss: 0 };

  // Dynamic Status Badge renderer
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

    if (isSelected) {
      return (
        <span className="pb-status-badge pb-status-selected">
          <CheckCircle2 size={12} className="me-1" /> Selected
        </span>
      );
    }

    return <span className="pb-status-badge pb-status-not-batched">Not Batched</span>;
  };

  return (
    <div className="card border rounded-3 mb-4 shadow-none bg-white" style={{ borderColor: "#e2e8f0" }}>
      {/* Section Header */}
      <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <FileText size={20} className="text-primary" />
          <h5 className="fw-bold mb-0 text-dark">2. Select Invoice</h5>
          {invoiceSelectionTab !== "unbatched" && selectedInvoices.length > 0 && (
            <span
              className="badge fs-12 px-2.5 py-1 fw-semibold rounded-pill"
              style={{
                backgroundColor: "#ecfdf5",
                color: "#0e7d4d",
                border: "1px solid #a7f3d0",
              }}
            >
              {selectedInvoices.length} Selected
            </span>
          )}
          {invoiceSelectionTab === "unbatched" && selectedSoldItemIds.length > 0 && (
            <span
              className="badge fs-12 px-2.5 py-1 fw-semibold rounded-pill"
              style={{
                backgroundColor: "#fff7ed",
                color: "#c2410c",
                border: "1px solid #fed7aa",
              }}
            >
              {selectedSoldItemIds.length} Items Selected
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center shadow-none p-1.5 rounded-2"
            onClick={onReloadInvoices}
            disabled={loadingInvoices}
            title="Reload available invoices"
            aria-label="Reload available invoices"
            style={{ width: "32px", height: "32px" }}
          >
            <RefreshCw size={14} className={loadingInvoices ? "spinner-border spinner-border-sm" : ""} />
          </button>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        {/* Success Alert Banner for Move/Batch Actions */}
        {moveToBatchMessage && (
          <div
            className="alert alert-success alert-dismissible fade show d-flex align-items-center justify-content-between py-2 px-3 mb-3 fs-13 rounded-3 shadow-none border"
            style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}
            role="alert"
          >
            <div className="d-flex align-items-center gap-2">
              <CheckCircle2 size={16} style={{ color: "#0e7d4d" }} />
              <span>{moveToBatchMessage}</span>
            </div>
            <button
              type="button"
              className="btn-close shadow-none p-2"
              onClick={() => setMoveToBatchMessage(null)}
              aria-label="Close"
            />
          </div>
        )}

        {/* Top 4 Step Cards Bar (Create Batch, Existing Batch, Auto Batch, Unbatched) */}
        <div className="pb-step-cards-container mb-3">
          {/* Tab 1: Create Batch */}
          <div
            role="button"
            tabIndex={0}
            className={`pb-step-card ${invoiceSelectionTab === "recently_added" ? "active" : ""}`}
            onClick={() => setInvoiceSelectionTab("recently_added")}
            onKeyDown={(e) => e.key === "Enter" && setInvoiceSelectionTab("recently_added")}
          >
            <span className="pb-step-number">1</span>
            <div className="pb-step-card-text">
              <span className="pb-step-card-title">Create Batch</span>
              <span className="pb-step-card-sub">Select multiple invoices &amp; create batch</span>
            </div>
          </div>

          <div
            className="pb-step-connector d-none d-sm-flex"
            style={{
              color: invoiceSelectionTab === "recently_added" ? "#0e7d4d" : "#94a3b8",
            }}
          >
            <ChevronRight size={18} />
          </div>

          {/* Tab 2: Existing Batch */}
          <div
            role="button"
            tabIndex={0}
            className={`pb-step-card ${invoiceSelectionTab === "existing_batch" ? "active" : ""}`}
            onClick={() => setInvoiceSelectionTab("existing_batch")}
            onKeyDown={(e) => e.key === "Enter" && setInvoiceSelectionTab("existing_batch")}
          >
            <span className="pb-step-number">2</span>
            <div className="pb-step-card-text">
              <span className="pb-step-card-title">Existing Batch</span>
              <span className="pb-step-card-sub">View and manage existing batches</span>
            </div>
          </div>

          <div
            className="pb-step-connector d-none d-sm-flex"
            style={{
              color: invoiceSelectionTab === "existing_batch" ? "#0e7d4d" : "#94a3b8",
            }}
          >
            <ChevronRight size={18} />
          </div>

          {/* Tab 3: Auto Batch */}
          <div
            role="button"
            tabIndex={0}
            className={`pb-step-card ${invoiceSelectionTab === "auto_batch" ? "active" : ""}`}
            onClick={() => setInvoiceSelectionTab("auto_batch")}
            onKeyDown={(e) => e.key === "Enter" && setInvoiceSelectionTab("auto_batch")}
          >
            <span className="pb-step-number">3</span>
            <div className="pb-step-card-text">
              <span className="pb-step-card-title">Auto Batch</span>
              <span className="pb-step-card-sub">Invoices linked automatically</span>
            </div>
          </div>

          <div
            className="pb-step-connector d-none d-sm-flex"
            style={{
              color:
                invoiceSelectionTab === "auto_batch" || invoiceSelectionTab === "unbatched"
                  ? "#0e7d4d"
                  : "#94a3b8",
            }}
          >
            <ChevronRight size={18} />
          </div>

          {/* Tab 4: Unbatched (Items sold but not in any batches) */}
          <div
            role="button"
            tabIndex={0}
            className={`pb-step-card ${invoiceSelectionTab === "unbatched" ? "active" : ""}`}
            onClick={() => setInvoiceSelectionTab("unbatched")}
            onKeyDown={(e) => e.key === "Enter" && setInvoiceSelectionTab("unbatched")}
          >
            <span className="pb-step-number">4</span>
            <div className="pb-step-card-text">
              <div className="pb-step-card-header">
                <span className="pb-step-card-title">Unbatched</span>
                <span className="pb-step-badge">
                  {tabCounts.unbatched}
                </span>
              </div>
              <span className="pb-step-card-sub">Items sold but not in any batches</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="pb-filter-toolbar">
          <div className="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
            {/* Filter 1: Supplier or Customer */}
            {invoiceSelectionTab !== "unbatched" ? (
              <div style={{ minWidth: "160px" }}>
                <label className="pb-filter-label">Supplier</label>
                <select
                  className="form-select pb-filter-select shadow-none"
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                >
                  <option value="all">All Suppliers</option>
                  {uniqueSuppliersInTab.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ minWidth: "180px" }}>
                <label className="pb-filter-label">Customer / Buyer</label>
                <select
                  className="form-select pb-filter-select shadow-none"
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  {uniqueCustomersInUnbatched.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter 2: Date */}
            <div className="position-relative pb-date-picker-container" style={{ minWidth: "190px" }}>
              <label className="pb-filter-label">
                {invoiceSelectionTab === "unbatched" ? "Sold Date" : "Invoice Date"}
              </label>
              <button
                type="button"
                className="btn pb-filter-input d-flex align-items-center justify-content-between w-100 shadow-none bg-white text-dark"
                onClick={() => setShowDateRangePicker(!showDateRangePicker)}
              >
                <span className="d-flex align-items-center gap-1.5 fs-12 text-truncate">
                  <Calendar size={13} className="text-muted flex-shrink-0" />
                  <span>
                    {filterDatePreset === "all"
                      ? "All Dates"
                      : filterDatePreset === "last_7"
                      ? "Last 7 Days"
                      : filterDatePreset === "last_30"
                      ? "Last 30 Days"
                      : customStartDate && customEndDate
                      ? `${customStartDate} – ${customEndDate}`
                      : "Custom Range"}
                  </span>
                </span>
                <ChevronDown size={14} className="text-muted ms-1 flex-shrink-0" />
              </button>

              {/* Date Picker Dropdown Menu */}
              {showDateRangePicker && (
                <div
                  className="position-absolute bg-white border rounded-3 p-3 shadow-lg"
                  style={{
                    zIndex: 1060,
                    top: "100%",
                    left: 0,
                    minWidth: "270px",
                    borderColor: "#cbd5e1",
                  }}
                >
                  <div className="d-flex flex-column gap-1.5 mb-2 pb-2 border-bottom">
                    <button
                      type="button"
                      className={`btn btn-sm text-start py-1 px-2 rounded-2 ${
                        filterDatePreset === "all" ? "btn-light fw-bold text-success" : "btn-light text-dark"
                      }`}
                      onClick={() => {
                        setFilterDatePreset("all");
                        setShowDateRangePicker(false);
                      }}
                    >
                      All Dates
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm text-start py-1 px-2 rounded-2 ${
                        filterDatePreset === "last_7"
                          ? "btn-light fw-bold text-success"
                          : "btn-light text-dark"
                      }`}
                      onClick={() => {
                        setFilterDatePreset("last_7");
                        setShowDateRangePicker(false);
                      }}
                    >
                      Last 7 Days
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm text-start py-1 px-2 rounded-2 ${
                        filterDatePreset === "last_30"
                          ? "btn-light fw-bold text-success"
                          : "btn-light text-dark"
                      }`}
                      onClick={() => {
                        setFilterDatePreset("last_30");
                        setShowDateRangePicker(false);
                      }}
                    >
                      Last 30 Days
                    </button>
                  </div>
                  <div className="pt-1">
                    <span className="text-muted fs-11 fw-semibold d-block mb-1">Custom Range:</span>
                    <div className="d-flex align-items-center gap-1.5 mb-2">
                      <input
                        type="date"
                        className="form-control form-control-sm fs-11"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          setFilterDatePreset("custom");
                        }}
                      />
                      <span className="text-muted fs-11">to</span>
                      <input
                        type="date"
                        className="form-control form-control-sm fs-11"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          setFilterDatePreset("custom");
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary w-100 py-1 fs-11"
                      onClick={() => setShowDateRangePicker(false)}
                    >
                      Apply Date Filter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Filter 3: Status or Category */}
            {invoiceSelectionTab !== "unbatched" ? (
              <div style={{ minWidth: "140px" }}>
                <label className="pb-filter-label">Status</label>
                <select
                  className="form-select pb-filter-select shadow-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="not_batched">Not Batched</option>
                  <option value="batched">Batched</option>
                  <option value="auto_mapped">Auto Mapped</option>
                  <option value="selected">Selected for Batch</option>
                </select>
              </div>
            ) : (
              <div style={{ minWidth: "160px" }}>
                <label className="pb-filter-label">Category</label>
                <select
                  className="form-select pb-filter-select shadow-none"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Plants & Saplings">Plants &amp; Saplings</option>
                  <option value="Pots & Planters">Pots &amp; Planters</option>
                  <option value="Bio-Pesticides & Fertilizers">Bio-Pesticides &amp; Fertilizers</option>
                  <option value="Garden Tools & Irrigation">Garden Tools &amp; Irrigation</option>
                  <option value="high_value">High Value (&gt; ₹10,000)</option>
                  <option value="bulk_qty">Bulk Quantity (&ge; 20 units)</option>
                </select>
              </div>
            )}

            {/* Filter 4: Search Query */}
            <div className="flex-grow-1" style={{ minWidth: "220px" }}>
              <label className="pb-filter-label">Search</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={14} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 shadow-none pb-filter-input"
                  placeholder={
                    invoiceSelectionTab === "unbatched"
                      ? "Search sold item, SKU, customer or invoice..."
                      : "Search invoice, supplier or PO..."
                  }
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
                {filterSearch && (
                  <button
                    type="button"
                    className="btn bg-white border-start-0 border text-muted shadow-none p-1.5"
                    onClick={() => setFilterSearch("")}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Top Right Action Button */}
          {invoiceSelectionTab === "recently_added" && (
            <div className="d-flex align-items-end flex-shrink-0 mt-2 mt-md-0">
              <button
                type="button"
                className="btn pb-btn-create-batch shadow-none"
                onClick={onProceedToExpenses}
                title="Create batch from selected invoices"
                disabled={selectedInvoices.length === 0}
              >
                <Layers size={16} />
                <span>Create Batch</span>
              </button>
            </div>
          )}
          {invoiceSelectionTab === "auto_batch" && (
            <div className="d-flex align-items-end flex-shrink-0 mt-2 mt-md-0">
              <button
                type="button"
                className="btn pb-btn-create-batch shadow-none"
                onClick={() => handleMoveToBatch()}
                disabled={
                  !filteredTabInvoices.some(
                    (inv) =>
                      selectedInvoiceIds.includes(inv.id) ||
                      selectedInvoiceIds.includes(inv.po_number)
                  )
                }
                title="Move selected auto-batch invoices to Create Batch"
              >
                <ArrowRight size={16} />
                <span>Move to Batch</span>
              </button>
            </div>
          )}
          {invoiceSelectionTab === "unbatched" && (
            <div className="d-flex align-items-end flex-shrink-0 mt-2 mt-md-0">
              <button
                type="button"
                className="btn pb-btn-create-batch shadow-none"
                onClick={() => handleOpenAddToInvoiceModal()}
                disabled={selectedSoldItemIds.length === 0}
                title="Move selected sold items to their respective invoice in Create Batch"
              >
                <FilePlus size={16} />
                <span>Add to Invoice ({selectedSoldItemIds.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: UNBATCHED SOLD ITEMS TABLE (Tab 4)                */}
        {/* ======================================================== */}
        {invoiceSelectionTab === "unbatched" ? (
          <div>
            {/* Informational Callout Bar with Metrics */}
            <div
              className="pb-info-callout mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
              style={{
                backgroundColor: "#fff7ed",
                borderColor: "#fed7aa",
                color: "#9a3412",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <AlertCircle size={18} className="flex-shrink-0" style={{ color: "#ea580c" }} />
                <span className="fs-12">
                  <strong>Unbatched Sold Items:</strong> These products were sold through sales invoices or
                  POS without an assigned branch purchase batch. Select items below to create a new batch or
                  assign them to an existing batch.
                </span>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="pb-unbatched-stat-pill">
                  <ShoppingBag size={13} style={{ color: "#ea580c" }} />
                  <span>{filteredUnbatchedItems.length} Sold Items</span>
                </span>
                <span className="pb-unbatched-stat-pill">
                  <Package size={13} style={{ color: "#ea580c" }} />
                  <span>{filteredUnbatchedTotalUnits} Units Sold</span>
                </span>
                <span className="pb-unbatched-stat-pill">
                  <span style={{ color: "#ea580c", fontWeight: 700 }}>₹</span>
                  <span>
                    ₹{filteredUnbatchedTotalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })} Total Sold
                  </span>
                </span>
              </div>
            </div>

            {/* Sold Items Table */}
            <div className="pb-invoice-table-wrapper">
              <div className="table-responsive w-100">
                <table className="table mb-0 align-middle pb-invoice-table w-100">
                  <thead>
                    <tr>
                      <th style={{ width: "42px" }} className="text-center px-2">
                        <input
                          type="checkbox"
                          className="form-check-input cursor-pointer shadow-none"
                          checked={isAllSoldSelected}
                          onChange={handleToggleSelectAllSold}
                          title={isAllSoldSelected ? "Deselect all visible" : "Select all visible"}
                        />
                      </th>
                      <th style={{ width: "42px" }} className="text-center">
                        #
                      </th>
                      <th style={{ minWidth: "220px" }}>Sold Item &amp; Variant</th>
                      <th style={{ minWidth: "135px" }}>Sales Invoice No</th>
                      <th style={{ minWidth: "110px" }}>Sold Date</th>
                      <th style={{ minWidth: "180px" }}>Customer / Sold To</th>
                      <th style={{ minWidth: "110px" }} className="text-center">
                        Units Sold
                      </th>
                      <th style={{ minWidth: "120px" }} className="text-end">
                        Sale Price (₹)
                      </th>
                      <th style={{ minWidth: "135px" }} className="text-end">
                        Total Sold (₹)
                      </th>
                      <th style={{ minWidth: "120px" }} className="text-center">
                        Batch Status
                      </th>
                      <th style={{ width: "48px" }} className="text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnbatchedItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-5 text-muted">
                          <ShoppingBag size={32} className="text-muted opacity-50 mb-2 d-block mx-auto" />
                          <strong className="d-block fs-14 text-dark mb-1">
                            No unbatched sold items found.
                          </strong>
                          <span className="fs-12 text-muted">
                            {filterSearch || filterCustomer !== "all" || filterCategory !== "all"
                              ? "Try adjusting or clearing your search / customer / category filters above."
                              : "All sold items are already linked to branch purchase batches!"}
                          </span>
                        </td>
                      </tr>
                    ) : (
                      paginatedUnbatchedItems.map((item, idx) => {
                        const isSelected = selectedSoldItemIds.includes(item.id);
                        const rowNumber = (safeUnbatchedPage - 1) * unbatchedPageSize + idx + 1;

                        return (
                          <tr
                            key={item.id}
                            className={`transition-all ${isSelected ? "row-selected" : ""}`}
                            style={{
                              cursor: "pointer",
                              backgroundColor: isSelected ? "#ecfdf5" : undefined,
                            }}
                            onClick={() => handleToggleSoldItem(item.id)}
                          >
                            {/* Checkbox */}
                            <td className="text-center px-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="form-check-input cursor-pointer shadow-none"
                                checked={isSelected}
                                onChange={() => handleToggleSoldItem(item.id)}
                                aria-label={`Select ${item.productName}`}
                              />
                            </td>

                            {/* Row # */}
                            <td className="text-center text-muted fs-12 fw-medium">{rowNumber}</td>

                            {/* Sold Item & Variant */}
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#0e7d4d",
                                  }}
                                >
                                  <Package size={16} />
                                </div>
                                <div className="min-w-0">
                                  <strong className="fs-13 text-dark d-block text-truncate" title={item.productName}>
                                    {item.productName}
                                  </strong>
                                  <span className="fs-11 text-muted d-block text-truncate">
                                    {item.variantName || item.category || "Standard Variant"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Sales Invoice No */}
                            <td>
                              <strong className="fs-13 fw-bold" style={{ color: "#0e7d4d" }}>
                                {item.salesInvoiceNo}
                              </strong>
                            </td>

                            {/* Sold Date */}
                            <td className="text-muted fs-12 text-nowrap">{item.soldDate}</td>

                            {/* Customer / Sold To */}
                            <td>
                              <div className="d-flex align-items-center gap-1.5">
                                <User size={13} className="text-muted flex-shrink-0" />
                                <span
                                  className="fw-semibold text-dark fs-12 text-truncate"
                                  title={`${item.customerName} ${item.customerPhone ? `(${item.customerPhone})` : ""}`}
                                >
                                  {item.customerName}
                                </span>
                              </div>
                            </td>

                            {/* Units Sold */}
                            <td className="text-center text-nowrap">
                              <span
                                className="badge bg-light text-dark border fs-11 fw-bold px-2 py-1 rounded-pill"
                                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                              >
                                {item.quantity} {item.unit}
                              </span>
                            </td>

                            {/* Sale Price (₹) */}
                            <td className="text-end text-nowrap">
                              <span className="fs-12 text-muted">
                                ₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </td>

                            {/* Total Sold (₹) */}
                            <td className="text-end text-nowrap">
                              <strong className="fs-13 text-dark">
                                ₹{item.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </strong>
                            </td>

                            {/* Batch Status */}
                            <td className="text-center text-nowrap">
                              <span className="pb-status-badge pb-status-unbatched">
                                <AlertCircle size={11} className="me-1" /> Unbatched
                              </span>
                            </td>

                            {/* Action Column */}
                            <td className="text-center px-1 text-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="d-flex align-items-center justify-content-center">
                                <button
                                  type="button"
                                  className={`pb-action-btn ${openActionSoldItemId === item.id ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openActionSoldItemId === item.id) {
                                      setOpenActionSoldItemId(null);
                                      setActionMenuPosition(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const spaceBelow = window.innerHeight - rect.bottom;
                                      const openUpwards = spaceBelow < 190;

                                      setActionMenuPosition({
                                        right: Math.max(12, window.innerWidth - rect.right),
                                        ...(openUpwards
                                          ? { bottom: Math.max(12, window.innerHeight - rect.top + 4) }
                                          : { top: rect.bottom + 4 }),
                                      });
                                      setOpenActionSoldItemId(item.id);
                                    }
                                  }}
                                  title="Item actions"
                                  aria-label="Item actions"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar for Unbatched Sold Items (10 row limit) */}
              {filteredUnbatchedItems.length > 0 && (
                <div className="pb-pagination-bar d-flex align-items-center justify-content-between flex-wrap gap-2 px-3 py-2.5 border-top">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-12 text-muted">
                      Showing{" "}
                      <strong className="text-dark">
                        {(safeUnbatchedPage - 1) * unbatchedPageSize + 1}
                      </strong>{" "}
                      to{" "}
                      <strong className="text-dark">
                        {Math.min(safeUnbatchedPage * unbatchedPageSize, filteredUnbatchedItems.length)}
                      </strong>{" "}
                      of{" "}
                      <strong className="text-dark">
                        {filteredUnbatchedItems.length}
                      </strong>{" "}
                      entries
                    </span>
                    <span className="badge rounded-pill bg-light text-muted border fs-11 px-2 py-0.5">
                      10 per page
                    </span>
                    {selectedSoldItemIds.length > 0 && (
                      <span className="badge rounded-pill bg-success-light text-success fs-11 px-2.5 py-1 fw-bold">
                        {selectedSoldItemIds.length} selected
                      </span>
                    )}
                  </div>

                  {totalUnbatchedPages > 1 && (
                    <div className="d-flex align-items-center gap-1">
                      {/* Previous Page Button */}
                      <button
                        type="button"
                        className="btn btn-sm btn-white border px-2 py-1 fs-12 d-inline-flex align-items-center gap-1 shadow-none rounded-2"
                        disabled={safeUnbatchedPage === 1}
                        onClick={() => setUnbatchedCurrentPage((p) => Math.max(1, p - 1))}
                        title="Previous page"
                        style={{
                          opacity: safeUnbatchedPage === 1 ? 0.45 : 1,
                          cursor: safeUnbatchedPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        <ChevronLeft size={13} />
                        <span>Prev</span>
                      </button>

                      {/* Page Numbers */}
                      {Array.from({ length: totalUnbatchedPages }, (_, i) => i + 1).map((pageNo) => {
                        const isActive = pageNo === safeUnbatchedPage;
                        return (
                          <button
                            key={pageNo}
                            type="button"
                            className="btn btn-sm shadow-none rounded-2"
                            style={{
                              minWidth: "30px",
                              height: "30px",
                              padding: "0 8px",
                              fontSize: "12px",
                              fontWeight: isActive ? 600 : 500,
                              backgroundColor: isActive ? "#0e7d4d" : "#ffffff",
                              borderColor: isActive ? "#0e7d4d" : "#e2e8f0",
                              color: isActive ? "#ffffff" : "#475569",
                              border: "1px solid",
                            }}
                            onClick={() => setUnbatchedCurrentPage(pageNo)}
                          >
                            {pageNo}
                          </button>
                        );
                      })}

                      {/* Next Page Button */}
                      <button
                        type="button"
                        className="btn btn-sm btn-white border px-2 py-1 fs-12 d-inline-flex align-items-center gap-1 shadow-none rounded-2"
                        disabled={safeUnbatchedPage === totalUnbatchedPages}
                        onClick={() => setUnbatchedCurrentPage((p) => Math.min(totalUnbatchedPages, p + 1))}
                        title="Next page"
                        style={{
                          opacity: safeUnbatchedPage === totalUnbatchedPages ? 0.45 : 1,
                          cursor: safeUnbatchedPage === totalUnbatchedPages ? "not-allowed" : "pointer",
                        }}
                      >
                        <span>Next</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: STANDARD INVOICES TABLE (Tabs 1, 2, 3)            */
          /* ======================================================== */
          <div className="pb-invoice-table-wrapper">
            <div className="table-responsive w-100">
              <table className="table mb-0 align-middle pb-invoice-table w-100">
                <thead>
                  <tr>
                    <th style={{ width: "42px" }} className="text-center px-2">
                      <input
                        type="checkbox"
                        className="form-check-input cursor-pointer shadow-none"
                        checked={isAllTabSelected}
                        onChange={handleToggleSelectAllTab}
                        title={isAllTabSelected ? "Deselect all visible" : "Select all visible"}
                      />
                    </th>
                    <th style={{ width: "42px" }} className="text-center">
                      #
                    </th>
                    <th style={{ minWidth: "135px" }}>Invoice No</th>
                    <th style={{ minWidth: "200px" }}>Supplier</th>
                    <th style={{ minWidth: "115px" }}>Invoice Date</th>
                    <th style={{ minWidth: "145px" }}>Items &amp; Units</th>
                    <th style={{ minWidth: "145px" }} className="text-end">
                      Invoice Amount (₹)
                    </th>
                    <th style={{ minWidth: "120px" }} className="text-center">
                      Status
                    </th>
                    <th
                      style={{ width: invoiceSelectionTab === "auto_batch" ? "150px" : "48px" }}
                      className="text-center"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTabInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <FileText size={32} className="text-muted opacity-50 mb-2 d-block mx-auto" />
                        <strong className="d-block fs-14 text-dark mb-1">No invoices found in this tab.</strong>
                        <span className="fs-12 text-muted">
                          {filterSearch || filterSupplier !== "all" || filterStatus !== "all"
                            ? "Try resetting your search or filter options above."
                            : invoiceSelectionTab === "recently_added"
                            ? "All available invoices have been batched or auto-mapped."
                            : invoiceSelectionTab === "existing_batch"
                            ? "No batches recorded yet. Select invoices in 'Create Batch' to create one."
                            : "No invoices currently auto-mapped directly to product pages."}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredTabInvoices.map((inv, idx) => {
                      const isSelected =
                        selectedInvoiceIds.includes(inv.id) || selectedInvoiceIds.includes(inv.po_number);
                      const isExpanded =
                        expandedInvoiceIds.includes(inv.id) || expandedInvoiceIds.includes(inv.po_number);
                      const invItems = getInvoiceItems(inv);
                      const itemCount =
                        Array.isArray(inv.items) && inv.items.length > 0 ? inv.items.length : invItems.length;
                      const totalUnits =
                        Array.isArray(inv.items) && inv.items.length > 0
                          ? inv.items.reduce(
                              (s: number, it: any) => s + (Number(it.quantity || it.received_quantity) || 0),
                              0
                            )
                          : invItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

                      return (
                        <React.Fragment key={inv.id || inv.po_number || idx}>
                          <tr
                            className={`transition-all ${isSelected ? "row-selected" : ""}`}
                            style={{
                              cursor: "pointer",
                              backgroundColor: isSelected ? "#ecfdf5" : undefined,
                            }}
                            onClick={() => onToggleInvoice(inv.id || inv.po_number)}
                          >
                            {/* Checkbox */}
                            <td className="text-center px-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="form-check-input cursor-pointer shadow-none"
                                checked={isSelected}
                                onChange={() => onToggleInvoice(inv.id || inv.po_number)}
                                aria-label={`Select ${inv.po_number}`}
                              />
                            </td>

                            {/* Row # */}
                            <td className="text-center text-muted fs-12 fw-medium">{idx + 1}</td>

                            {/* Invoice No */}
                            <td>
                              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                <strong className="fs-13 fw-bold" style={{ color: "#0e7d4d" }}>
                                  {inv.supplier_invoice_no || inv.po_number || inv.id}
                                </strong>
                                {((invoiceLinkedSoldItems[inv.id] || []).length > 0 ||
                                  (invoiceLinkedSoldItems[inv.po_number] || []).length > 0) && (
                                  <span
                                    className="fs-11 text-danger fw-semibold"
                                    title="Sold items linked to this purchase invoice"
                                  >
                                    +
                                    {(
                                      invoiceLinkedSoldItems[inv.id] ||
                                      invoiceLinkedSoldItems[inv.po_number] ||
                                      []
                                    ).length}{" "}
                                    Attached
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Supplier */}
                            <td>
                              <span className="fw-semibold text-dark fs-13 d-block text-truncate" title={inv.supplier_name}>
                                {inv.supplier_name}
                              </span>
                            </td>

                            {/* Invoice Date */}
                            <td className="text-muted fs-12 text-nowrap">{inv.order_date || "—"}</td>

                            {/* Items & Units */}
                            <td className="text-nowrap">
                              <span
                                className="badge bg-light text-dark border fs-11 fw-medium px-2 py-1 rounded-pill"
                                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                              >
                                <strong>{itemCount}</strong> Items &bull; <strong>{totalUnits}</strong> Units
                              </span>
                            </td>

                            {/* Invoice Amount (₹) */}
                            <td className="text-end text-nowrap">
                              <strong className="fs-13 text-dark">
                                ₹
                                {Number(inv.total_amount || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </strong>
                            </td>

                            {/* Dynamic Status Column */}
                            <td className="text-center text-nowrap">{renderInvoiceStatusBadge(inv)}</td>

                            {/* Action Column */}
                            <td
                              className="text-center px-1 text-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="d-flex align-items-center justify-content-center gap-1">
                                {invoiceSelectionTab === "auto_batch" && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 py-1 px-2 fs-11 fw-semibold shadow-none rounded-2"
                                    onClick={() => handleMoveToBatch([inv.id || inv.po_number])}
                                    title="Move this invoice to Create Batch"
                                  >
                                    <span>Move to Batch</span>
                                    <ArrowRight size={12} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={`pb-action-btn ${openActionInvoiceId === inv.id ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openActionInvoiceId === inv.id) {
                                      setOpenActionInvoiceId(null);
                                      setActionMenuPosition(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const spaceBelow = window.innerHeight - rect.bottom;
                                      const openUpwards = spaceBelow < 190;

                                      setActionMenuPosition({
                                        right: Math.max(12, window.innerWidth - rect.right),
                                        ...(openUpwards
                                          ? { bottom: Math.max(12, window.innerHeight - rect.top + 4) }
                                          : { top: rect.bottom + 4 }),
                                      });
                                      setOpenActionInvoiceId(inv.id);
                                    }
                                  }}
                                  title="Actions"
                                  aria-label="Actions"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Sub-table for Invoice Products */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="p-0 border-0 bg-light">
                                <div className="p-3 bg-white border-bottom border-top shadow-sm">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <h6 className="fw-bold fs-12 mb-0 text-dark d-flex align-items-center gap-1.5">
                                      <Package size={14} style={{ color: "#0e7d4d" }} />
                                      <span>
                                        Products in {inv.supplier_invoice_no || inv.po_number} ({inv.supplier_name})
                                      </span>
                                    </h6>
                                    <span className="text-muted fs-11">
                                      {invItems.length} line items &bull; Click row to toggle invoice selection
                                    </span>
                                  </div>
                                  <div className="table-responsive rounded-2 border">
                                    <table className="table table-sm mb-0 align-middle">
                                      <thead style={{ backgroundColor: "#f9fafb" }}>
                                        <tr className="fs-11 text-muted fw-semibold">
                                          <th className="text-center" style={{ width: "36px" }}>
                                            #
                                          </th>
                                          <th>Product Name</th>
                                          <th>SKU</th>
                                          <th>Variant</th>
                                          <th className="text-center">Quantity</th>
                                          <th className="text-end">Purchase Price (₹)</th>
                                          <th className="text-end">Selling Price (₹)</th>
                                          <th className="text-end">Total Value (₹)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {invItems.map((it, itIdx) => {
                                          const qty = Number(it.quantity) || 0;
                                          const price = Number(it.purchasePrice) || 0;
                                          const sellPrice = Number(it.sellingPrice) || price * 1.3;
                                          return (
                                            <tr key={it.id || itIdx} className="fs-12">
                                              <td className="text-center text-muted fs-11">{itIdx + 1}</td>
                                              <td className="fw-semibold text-dark">{it.productName}</td>
                                              <td className="text-muted fs-11">{it.sku || "—"}</td>
                                              <td className="text-muted fs-11">{it.variantName || "—"}</td>
                                              <td className="text-center fw-bold">{qty}</td>
                                              <td className="text-end">
                                                ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                              </td>
                                              <td className="text-end">
                                                ₹{sellPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                              </td>
                                              <td className="text-end fw-semibold text-dark">
                                                ₹{(qty * price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                  {((invoiceLinkedSoldItems[inv.id] || []).length > 0 ||
                                    (invoiceLinkedSoldItems[inv.po_number] || []).length > 0) && (
                                    <div className="mt-2.5 p-2.5 rounded-2 bg-light border border-success-subtle">
                                      <div className="d-flex align-items-center gap-1.5 mb-1.5">
                                        <CheckCircle2 size={13} className="text-success" />
                                        <strong className="fs-11 text-success">
                                          Sold Items Moved from Unbatched List (
                                          {(
                                            invoiceLinkedSoldItems[inv.id] ||
                                            invoiceLinkedSoldItems[inv.po_number] ||
                                            []
                                          ).length}
                                          ):
                                        </strong>
                                      </div>
                                      <div className="d-flex flex-wrap gap-2">
                                        {(
                                          invoiceLinkedSoldItems[inv.id] ||
                                          invoiceLinkedSoldItems[inv.po_number] ||
                                          []
                                        ).map((soldIt) => (
                                          <span
                                            key={soldIt.id}
                                            className="badge bg-white text-dark border fs-11 py-1 px-2 rounded-2 d-inline-flex align-items-center gap-1"
                                          >
                                            <span className="fw-semibold">{soldIt.productName}</span>
                                            <span className="text-muted">
                                              ({soldIt.quantity} {soldIt.unit || "PCS"} &bull; Sold In: {soldIt.salesInvoiceNo})
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bottom Summary Bar */}
        {invoiceSelectionTab === "unbatched" ? (
          <div className="pb-bottom-bar">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold fs-14" style={{ color: "#ea580c" }}>
                {selectedSoldItemIds.length} sold item{selectedSoldItemIds.length === 1 ? "" : "s"} selected
              </span>
              {selectedSoldItemIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-muted fs-12 p-0 ms-2 text-decoration-none"
                  onClick={() => setSelectedSoldItemIds([])}
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="fs-13 text-dark">
                Total Sold Value (Selected):{" "}
                <strong className="fs-15" style={{ color: "#0e7d4d" }}>
                  ₹
                  {totalSelectedSoldAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>
              </span>

              <button
                type="button"
                className="btn pb-btn-create-batch shadow-none"
                onClick={() => handleOpenAddToInvoiceModal()}
                disabled={selectedSoldItemIds.length === 0}
                title="Move selected sold items to their respective invoice in Create Batch"
              >
                <FilePlus size={15} />
                <span>Add to Invoice ({selectedSoldItemIds.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          invoiceSelectionTab !== "existing_batch" && (
            <div className="pb-bottom-bar">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold fs-14" style={{ color: "#0e7d4d" }}>
                  {selectedInvoices.length} invoice{selectedInvoices.length === 1 ? "" : "s"} selected
                </span>
                {selectedInvoices.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted fs-12 p-0 ms-2 text-decoration-none"
                    onClick={onClearAllInvoices}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="d-flex align-items-center gap-3 flex-wrap">
                <span className="fs-13 text-dark">
                  Total Amount (Selected):{" "}
                  <strong className="fs-15" style={{ color: "#0e7d4d" }}>
                    ₹
                    {totalSelectedAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </span>

                {/* Tab 1: Create Batch button */}
                {invoiceSelectionTab === "recently_added" && (
                  <button
                    type="button"
                    className="btn pb-btn-create-batch shadow-none"
                    onClick={onProceedToExpenses}
                    disabled={selectedInvoices.length === 0}
                    title={
                      selectedInvoices.length === 0
                        ? "Select at least one invoice to create a batch"
                        : "Proceed to expenses with selected invoices"
                    }
                  >
                    <Layers size={15} />
                    <span>Create Batch</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                {/* Tab 3: Move to Batch button */}
                {invoiceSelectionTab === "auto_batch" && (
                  <button
                    type="button"
                    className="btn pb-btn-create-batch shadow-none"
                    onClick={() => handleMoveToBatch()}
                    disabled={
                      !filteredTabInvoices.some(
                        (inv) =>
                          selectedInvoiceIds.includes(inv.id) ||
                          selectedInvoiceIds.includes(inv.po_number)
                      )
                    }
                    title="Move selected auto-batch invoices to Create Batch"
                  >
                    <ArrowRight size={15} />
                    <span>Move to Batch</span>
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {/* Step Navigation Bar (Back, Cancel, Next) */}
        <div className="pt-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary px-3 shadow-none rounded-2 d-inline-flex align-items-center gap-1.5"
            onClick={onBackToDetails}
          >
            <ArrowLeft size={16} />
            <span>Back: Branch Details</span>
          </button>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary px-3 shadow-none rounded-2"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 py-2 d-inline-flex align-items-center gap-2 shadow-none rounded-2 fw-semibold"
              onClick={() => {
                if (invoiceSelectionTab === "unbatched" && selectedSoldItemIds.length > 0) {
                  handleBatchSelectedSoldItems();
                } else {
                  onProceedToExpenses();
                }
              }}
            >
              <span>Next: Expenses</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Floating 3-Dot Action Menu Portal for Invoices */}
        {activeActionInvoice && actionMenuPosition && typeof document !== "undefined" &&
          createPortal(
            <div
              className="pb-action-menu-dropdown position-fixed"
              style={{
                zIndex: 99999,
                right: `${actionMenuPosition.right}px`,
                ...(actionMenuPosition.top !== undefined ? { top: `${actionMenuPosition.top}px` } : {}),
                ...(actionMenuPosition.bottom !== undefined ? { bottom: `${actionMenuPosition.bottom}px` } : {}),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {invoiceSelectionTab === "auto_batch" && (
                <>
                  <button
                    type="button"
                    className="pb-action-menu-item text-success"
                    onClick={() => {
                      handleMoveToBatch([activeActionInvoice.id || activeActionInvoice.po_number]);
                      setOpenActionInvoiceId(null);
                      setActionMenuPosition(null);
                    }}
                  >
                    <ArrowRight size={14} className="text-success" />
                    <span className="fw-semibold">Move to Batch</span>
                  </button>
                  <div className="pb-action-menu-divider" />
                </>
              )}

              <button
                type="button"
                className="pb-action-menu-item"
                onClick={() => {
                  toggleInvoiceExpand(activeActionInvoice.id);
                  setOpenActionInvoiceId(null);
                  setActionMenuPosition(null);
                }}
              >
                <Eye size={14} className="text-primary" />
                <span>{isActionInvExpanded ? "Collapse Products" : "View Products"}</span>
              </button>

              {invoiceSelectionTab !== "existing_batch" && (
                <button
                  type="button"
                  className={`pb-action-menu-item ${isActionInvSelected ? "text-danger" : ""}`}
                  onClick={() => {
                    onToggleInvoice(activeActionInvoice.id || activeActionInvoice.po_number);
                    setOpenActionInvoiceId(null);
                    setActionMenuPosition(null);
                  }}
                >
                  <Check size={14} className={isActionInvSelected ? "text-danger" : "text-success"} />
                  <span>{isActionInvSelected ? "Deselect Invoice" : "Select for Batch"}</span>
                </button>
              )}

              {activeInvDmg.totalLoss > 0 && (
                <>
                  <div className="pb-action-menu-divider" />
                  <div className="px-2 py-1 text-danger fs-11 fw-semibold">
                    Damage: ₹{activeInvDmg.totalLoss.toLocaleString("en-IN")} ({activeInvDmg.damagedUnits} units)
                  </div>
                </>
              )}
            </div>,
            document.body
          )}

        {/* Floating 3-Dot Action Menu Portal for Unbatched Sold Items */}
        {activeActionSoldItem && actionMenuPosition && typeof document !== "undefined" &&
          createPortal(
            <div
              className="pb-action-menu-dropdown position-fixed"
              style={{
                zIndex: 99999,
                right: `${actionMenuPosition.right}px`,
                ...(actionMenuPosition.top !== undefined ? { top: `${actionMenuPosition.top}px` } : {}),
                ...(actionMenuPosition.bottom !== undefined ? { bottom: `${actionMenuPosition.bottom}px` } : {}),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="pb-action-menu-item text-success"
                onClick={() => {
                  handleOpenAddToInvoiceModal([activeActionSoldItem]);
                  setOpenActionSoldItemId(null);
                  setActionMenuPosition(null);
                }}
              >
                <FilePlus size={14} className="text-success" />
                <span className="fw-semibold">Add to Create Batch Invoice</span>
              </button>

              <button
                type="button"
                className="pb-action-menu-item"
                onClick={() => {
                  setActiveAssignModalItem(activeActionSoldItem);
                  setTargetAssignBatchId(existingBatches[0]?.id || "");
                  setOpenActionSoldItemId(null);
                  setActionMenuPosition(null);
                }}
              >
                <LinkIcon size={14} className="text-primary" />
                <span>Assign to Existing Batch</span>
              </button>

              <button
                type="button"
                className="pb-action-menu-item"
                onClick={() => {
                  setActiveSaleDetailItem(activeActionSoldItem);
                  setOpenActionSoldItemId(null);
                  setActionMenuPosition(null);
                }}
              >
                <Eye size={14} className="text-secondary" />
                <span>View Sale Details</span>
              </button>
            </div>,
            document.body
          )}

        {/* Modal: Assign Sold Item to Existing Batch */}
        {activeAssignModalItem && typeof document !== "undefined" &&
          createPortal(
            <div
              className="modal fade show d-block"
              style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 100000 }}
              tabIndex={-1}
              role="dialog"
              onClick={() => setActiveAssignModalItem(null)}
            >
              <div
                className="modal-dialog modal-dialog-centered"
                style={{ maxWidth: "520px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content border-0 shadow-lg rounded-3">
                  <div className="modal-header border-bottom py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-2 p-1.5"
                        style={{ backgroundColor: "#ecfdf5", color: "#0e7d4d" }}
                      >
                        <LinkIcon size={18} />
                      </div>
                      <div>
                        <h6 className="modal-title fw-bold text-dark mb-0">
                          Assign Item to Existing Batch
                        </h6>
                        <span className="text-muted fs-11">
                          Allocate sold item into an established branch batch
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-close shadow-none"
                      onClick={() => setActiveAssignModalItem(null)}
                      aria-label="Close"
                    />
                  </div>

                  <div className="modal-body p-4">
                    {/* Item Information Preview */}
                    <div className="p-3 rounded-3 mb-3 border bg-light">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <div>
                          <strong className="fs-13 text-dark d-block">
                            {activeAssignModalItem.productName}
                          </strong>
                          <span className="text-muted fs-12">
                            {activeAssignModalItem.variantName || "Standard"} &bull; SKU:{" "}
                            <code>{activeAssignModalItem.sku}</code>
                          </span>
                        </div>
                        <span className="badge bg-white border text-dark fs-12 fw-bold px-2 py-1">
                          {activeAssignModalItem.quantity} {activeAssignModalItem.unit}
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between fs-12 text-muted pt-2 border-top">
                        <span>Invoice: <strong>{activeAssignModalItem.salesInvoiceNo}</strong></span>
                        <span>Sold To: <strong>{activeAssignModalItem.customerName}</strong></span>
                        <span className="text-dark fw-bold">
                          ₹{activeAssignModalItem.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Batch Selection Dropdown */}
                    <div className="mb-3">
                      <label className="form-label fs-12 fw-semibold text-dark">
                        Select Target Branch Batch <span className="text-danger">*</span>
                      </label>
                      {existingBatches.length === 0 ? (
                        <div className="alert alert-warning fs-12 mb-0 py-2 px-3 rounded-2">
                          No existing batches recorded yet. Please use <strong>Create Batch</strong> to
                          create a new batch first.
                        </div>
                      ) : (
                        <select
                          className="form-select shadow-none fs-13"
                          value={targetAssignBatchId}
                          onChange={(e) => setTargetAssignBatchId(e.target.value)}
                        >
                          {existingBatches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.branchName || b.batchNo} ({b.batchNo}) — Date: {b.purchaseDate} (
                              {b.items.length} items)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <p className="fs-12 text-muted mb-0">
                      Linking this item will add it to the batch&apos;s product inventory and update
                      its purchase allocation across reports.
                    </p>
                  </div>

                  <div className="modal-footer border-top py-2.5 px-4 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-3"
                      onClick={() => setActiveAssignModalItem(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success px-3 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-none"
                      style={{ backgroundColor: "#0e7d4d", borderColor: "#0e7d4d" }}
                      disabled={existingBatches.length === 0 || !targetAssignBatchId}
                      onClick={() =>
                        handleAssignToExistingBatch(activeAssignModalItem, targetAssignBatchId)
                      }
                    >
                      <Check size={14} />
                      <span>Confirm Assignment</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Modal: View Sold Item Details */}
        {activeSaleDetailItem && typeof document !== "undefined" &&
          createPortal(
            <div
              className="modal fade show d-block"
              style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", zIndex: 100000 }}
              tabIndex={-1}
              role="dialog"
              onClick={() => setActiveSaleDetailItem(null)}
            >
              <div
                className="modal-dialog modal-dialog-centered"
                style={{ maxWidth: "480px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-content border-0 shadow-lg rounded-3">
                  <div className="modal-header border-bottom py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-2 p-1.5"
                        style={{ backgroundColor: "#f0fdf4", color: "#0e7d4d" }}
                      >
                        <ShoppingBag size={18} />
                      </div>
                      <div>
                        <h6 className="modal-title fw-bold text-dark mb-0">Sold Item Details</h6>
                        <span className="text-muted fs-11">
                          Sales Order #{activeSaleDetailItem.salesInvoiceNo}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-close shadow-none"
                      onClick={() => setActiveSaleDetailItem(null)}
                      aria-label="Close"
                    />
                  </div>

                  <div className="modal-body p-4">
                    <div className="list-group list-group-flush fs-12">
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Product Name</span>
                        <strong className="text-dark">{activeSaleDetailItem.productName}</strong>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">SKU / Code</span>
                        <code>{activeSaleDetailItem.sku}</code>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Variant</span>
                        <span>{activeSaleDetailItem.variantName || "Standard"}</span>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Customer</span>
                        <span className="fw-semibold text-dark">
                          {activeSaleDetailItem.customerName}
                        </span>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Sale Date</span>
                        <span>{activeSaleDetailItem.soldDate}</span>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Units Sold</span>
                        <span className="fw-bold text-dark">
                          {activeSaleDetailItem.quantity} {activeSaleDetailItem.unit}
                        </span>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Unit Sale Price</span>
                        <span>₹{activeSaleDetailItem.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Total Sales Value</span>
                        <strong className="fs-14" style={{ color: "#0e7d4d" }}>
                          ₹{activeSaleDetailItem.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                        <span className="text-muted">Batch Status</span>
                        <span className="pb-status-badge pb-status-unbatched">
                          <AlertCircle size={11} className="me-1" /> Unbatched
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-top py-2.5 px-4 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-3"
                      onClick={() => setActiveSaleDetailItem(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success px-3 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-none"
                      style={{ backgroundColor: "#0e7d4d", borderColor: "#0e7d4d" }}
                      onClick={() => {
                        const it = activeSaleDetailItem;
                        setActiveSaleDetailItem(null);
                        if (it) handleOpenAddToInvoiceModal([it]);
                      }}
                    >
                      <FilePlus size={14} />
                      <span>Add to Invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Slide-over Screen (Offcanvas Drawer): Add / Move Sold Items to Invoice */}
        {activeAddToInvoiceItems && typeof document !== "undefined" &&
          createPortal(
            <>
              {/* Dimmed Backdrop */}
              <div
                className="modal-backdrop fade show"
                style={{
                  zIndex: 105000,
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  backdropFilter: "blur(2px)",
                }}
                onClick={() => setActiveAddToInvoiceItems(null)}
              />

              {/* Slide Screen Drawer from Right */}
              <div
                id="move_sold_items_drawer"
                className="offcanvas offcanvas-end show border-0 d-flex flex-column pb-slide-screen"
                tabIndex={-1}
                style={{
                  position: "fixed",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  height: "100vh",
                  width: "1250px",
                  maxWidth: "96vw",
                  zIndex: 105001,
                  visibility: "visible",
                  transform: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Fixed Header */}
                <div className="offcanvas-header border-bottom py-3 px-4 d-flex align-items-center justify-content-between flex-shrink-0">
                  <div className="d-flex align-items-center gap-2.5 min-w-0">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: "36px",
                        height: "36px",
                        backgroundColor: "rgba(14, 125, 77, 0.08)",
                        color: "#0e7d4d",
                        border: "1px solid rgba(14, 125, 77, 0.2)",
                      }}
                    >
                      {drawerStep === "target_purchase_invoice" ? (
                        <Building2 size={18} />
                      ) : (
                        <FilePlus size={18} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h6 className="offcanvas-title fw-bold text-dark mb-0 fs-15 text-truncate">
                        {drawerStep === "target_purchase_invoice"
                          ? "Select Target Purchase Invoice"
                          : activeAddToInvoiceItems.length === 1
                          ? "Select Sales Invoices for Product"
                          : `Select Sales Invoices for ${activeAddToInvoiceItems.length} Products`}
                      </h6>
                      <span className="text-muted fs-11">
                        {drawerStep === "target_purchase_invoice"
                          ? "Step 2 of 2: Select a purchase invoice in Create Batch to link selected sales items"
                          : "Step 1 of 2: Select sales invoices to link or allocate to purchase invoices"}
                      </span>
                    </div>
                  </div>
                  {/* Circular Close Button */}
                  <button
                    type="button"
                    className="pb-modal-close-btn shadow-none flex-shrink-0"
                    onClick={() => {
                      setActiveAddToInvoiceItems(null);
                      setDrawerStep("sales_invoices");
                    }}
                    aria-label="Close"
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="offcanvas-body p-3 flex-grow-1 overflow-y-auto">
                  {drawerStep === "sales_invoices" ? (
                    /* ========================================================
                       STEP 1: SELECT SALES INVOICES FOR PRODUCTS
                       ======================================================== */
                    <>
                      {/* Selected Sold Item Details Card (Matches Screenshot & Interactive) */}
                      <div className="pb-drawer-selected-card">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center">
                            <span
                              className="badge px-2.5 py-1 rounded-pill fs-10 fw-bold text-uppercase"
                              style={{
                                backgroundColor: "#ecfdf5",
                                color: "#0e7d4d",
                                border: "1px solid #a7f3d0",
                              }}
                            >
                              {activeAddToInvoiceItems.length === 1
                                ? "1 SOLD ITEM SELECTED"
                                : `${activeAddToInvoiceItems.length} SOLD ITEMS SELECTED`}
                            </span>
                          </div>
                          <span className="fs-12 fw-bold text-dark">
                            Total: ₹{activeAddToInvoiceItems
                              .reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0)
                              .toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Interactive List of Selected Products (One by One, Single Row per Item) */}
                        <div className="d-flex flex-column gap-1.5" style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {activeAddToInvoiceItems.map((it, idx) => {
                            const isActive = idx === selectedProductIndex;
                            const pKey = getProductKey(it);
                            const selectedInvs = selectedSalesInvoicesByProduct[pKey] || [];
                            const allInvsForIt = getSalesInvoicesForProduct(it, unbatchedSoldItems);
                            const selectedQtyForIt = allInvsForIt
                              .filter((inv) => selectedInvs.includes(inv.id))
                              .reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);

                            return (
                              <div
                                key={it.id || idx}
                                className={`pb-drawer-sold-mini-item d-flex align-items-center justify-content-between fs-11 w-100 text-nowrap ${
                                  isActive ? "active-product-card" : ""
                                }`}
                                onClick={() => {
                                  setSelectedProductIndex(idx);
                                  setModalSalesInvoiceSearch("");
                                }}
                                style={{
                                  cursor: "pointer",
                                  border: isActive ? "1.5px solid #0e7d4d" : undefined,
                                  backgroundColor: isActive ? "#f0fdf4" : undefined,
                                  boxShadow: isActive ? "0 0 0 2px rgba(14, 125, 77, 0.15)" : undefined,
                                  padding: "8px 14px",
                                }}
                                title="Click to view and choose sales invoices for this product"
                              >
                                <div className="d-flex align-items-center gap-2 min-w-0 me-3 text-nowrap">
                                  <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: "340px" }}>
                                    {it.productName}
                                  </span>
                                  {isActive && (
                                    <span
                                      className="badge px-2 py-0.5 rounded-pill fs-9 fw-bold text-uppercase flex-shrink-0"
                                      style={{ backgroundColor: "#dcfce7", color: "#0e7d4d" }}
                                    >
                                      Active
                                    </span>
                                  )}
                                  {selectedInvs.length > 0 ? (
                                    <span
                                      className="badge px-2 py-0.5 rounded-pill fs-9 fw-semibold flex-shrink-0"
                                      style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                                    >
                                      {selectedQtyForIt} / {it.quantity} {it.unit || "PCS"} ({selectedInvs.length} Invs)
                                    </span>
                                  ) : (
                                    <span
                                      className="badge px-2 py-0.5 rounded-pill fs-9 text-muted bg-light border flex-shrink-0"
                                    >
                                      0 / {it.quantity} {it.unit || "PCS"}
                                    </span>
                                  )}
                                  <span className="text-muted fs-10">&bull;</span>
                                  <span className="text-muted fs-11 flex-shrink-0">{it.salesInvoiceNo}</span>
                                  <span className="text-muted fs-10">&bull;</span>
                                  <span className="text-muted fs-11 text-truncate" style={{ maxWidth: "220px" }}>
                                    {it.customerName}
                                  </span>
                                  {it.variantName && (
                                    <>
                                      <span className="text-muted fs-10">&bull;</span>
                                      <span className="text-secondary fs-11 text-truncate" style={{ maxWidth: "200px" }}>
                                        {it.variantName}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="d-flex align-items-center gap-2.5 flex-shrink-0 text-nowrap ps-2">
                                  <span className="fw-bold text-success fs-12">
                                    {it.quantity} {it.unit || "PCS"}
                                  </span>
                                  <span className="text-muted fs-10">&bull;</span>
                                  <span className="fw-bold text-dark fs-12">
                                    ₹{Number(it.totalAmount || 0).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Filter / Search & Multi-Selection Bar */}
                      <div className="mb-3 pb-drawer-search-wrap" style={{ marginBottom: "18px" }}>
                        <div className="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-1.5 min-w-0">
                            <label className="fw-bold fs-13 text-dark mb-0 text-truncate">
                              Sales Invoices for:{" "}
                              <span className="text-success">{activeDrawerProduct?.productName || "Product"}</span>
                            </label>
                            <span className="badge bg-light border text-dark fs-10 px-2 py-0.5 rounded-pill">
                              Total: {activeDrawerProduct?.quantity} {activeDrawerProduct?.unit || "PCS"}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            <span className="fs-11 text-muted">
                              <strong className="text-success">{selectedQtyForActive}</strong> of {activeDrawerProduct?.quantity} {activeDrawerProduct?.unit || "PCS"} selected &bull;{" "}
                              <strong className="text-dark">
                                {(selectedSalesInvoicesByProduct[activeDrawerProductKey] || []).length}
                              </strong> / {filteredDrawerSalesInvoices.length} invoices
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary fs-11 py-0.5 px-2 rounded-2 d-inline-flex align-items-center gap-1 shadow-none"
                              onClick={handleToggleSelectAllForActiveProduct}
                              title={
                                filteredDrawerSalesInvoices.length > 0 &&
                                filteredDrawerSalesInvoices.every((inv) =>
                                  (selectedSalesInvoicesByProduct[activeDrawerProductKey] || []).includes(inv.id)
                                )
                                  ? "Deselect all visible invoices"
                                  : "Select all visible invoices"
                              }
                            >
                              <CheckSquare size={12} />
                              <span>
                                {filteredDrawerSalesInvoices.length > 0 &&
                                filteredDrawerSalesInvoices.every((inv) =>
                                  (selectedSalesInvoicesByProduct[activeDrawerProductKey] || []).includes(inv.id)
                                )
                                  ? "Deselect All"
                                  : "Select All"}
                              </span>
                            </button>
                          </div>
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text py-1 px-2.5">
                            <Search size={13} />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm shadow-none fs-12"
                            placeholder={`Search sales invoices by invoice #, customer, phone, date...`}
                            value={modalSalesInvoiceSearch}
                            onChange={(e) => setModalSalesInvoiceSearch(e.target.value)}
                          />
                          {modalSalesInvoiceSearch && (
                            <button
                              type="button"
                              className="btn btn-sm btn-white border border-start-0 text-muted shadow-none px-2"
                              onClick={() => setModalSalesInvoiceSearch("")}
                              title="Clear search"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sales Invoices List for Selected Product */}
                      {filteredDrawerSalesInvoices.length === 0 ? (
                        <div className="p-4 text-center text-muted bg-light rounded-2 border">
                          <Search size={20} className="mb-2 text-muted" />
                          <p className="fs-12 mb-1 fw-semibold text-dark">
                            No sales invoices matching "{modalSalesInvoiceSearch}"
                          </p>
                          <button
                            type="button"
                            className="btn btn-sm btn-link fs-11 p-0 text-decoration-none text-success"
                            onClick={() => setModalSalesInvoiceSearch("")}
                          >
                            Clear search filter
                          </button>
                        </div>
                      ) : (
                        <div className="pb-drawer-table-wrap">
                          <div className="table-responsive">
                            <table className="pb-drawer-table align-middle mb-0">
                              <thead>
                                <tr>
                                  <th style={{ width: "46px" }} className="text-center">Select</th>
                                  <th style={{ minWidth: "125px" }}>Sales Invoice #</th>
                                  <th style={{ minWidth: "160px" }}>Customer</th>
                                  <th style={{ minWidth: "125px" }}>Phone</th>
                                  <th style={{ minWidth: "105px" }}>Channel</th>
                                  <th style={{ minWidth: "100px" }}>Date</th>
                                  <th style={{ minWidth: "120px" }}>Variant</th>
                                  <th style={{ minWidth: "95px" }}>Count</th>
                                  <th style={{ minWidth: "95px" }}>Unit Price</th>
                                  <th style={{ minWidth: "110px" }} className="text-end pe-3">Total Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDrawerSalesInvoices.map((inv) => {
                                  const selectedList = selectedSalesInvoicesByProduct[activeDrawerProductKey] || [];
                                  const isSelected = selectedList.includes(inv.id);

                                  return (
                                    <tr
                                      key={inv.id}
                                      className={`pb-sales-invoice-row ${isSelected ? "selected-row" : ""}`}
                                      onClick={() => handleToggleSalesInvoice(activeDrawerProductKey, inv.id)}
                                    >
                                      {/* Checkbox */}
                                      <td className="text-center">
                                        <div className="d-flex justify-content-center">
                                          <div className={`pb-custom-checkbox ${isSelected ? "selected" : ""}`}>
                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Invoice No */}
                                      <td className="text-nowrap">
                                        <strong
                                          className="fs-12 fw-bold"
                                          style={{ color: isSelected ? "#0e7d4d" : undefined }}
                                        >
                                          {inv.salesInvoiceNo}
                                        </strong>
                                      </td>

                                      {/* Customer */}
                                      <td>
                                        <span
                                          className="fs-12 fw-semibold text-secondary text-truncate d-block"
                                          style={{ maxWidth: "180px" }}
                                          title={inv.customerName}
                                        >
                                          {inv.customerName}
                                        </span>
                                      </td>

                                      {/* Phone */}
                                      <td className="text-nowrap">
                                        <span className="text-muted fs-11">
                                          {inv.customerPhone || "—"}
                                        </span>
                                      </td>

                                      {/* Channel */}
                                      <td className="text-nowrap">
                                        {inv.channel ? (
                                          <span className="badge bg-light text-muted border fs-10 px-1.5 py-0.5 rounded">
                                            {inv.channel}
                                          </span>
                                        ) : (
                                          <span className="text-muted fs-11">—</span>
                                        )}
                                      </td>

                                      {/* Date */}
                                      <td className="text-nowrap">
                                        <span className="text-muted fs-11 d-inline-flex align-items-center gap-1">
                                          <Calendar size={11} className="text-muted" />
                                          <span>{inv.soldDate || "—"}</span>
                                        </span>
                                      </td>

                                      {/* Variant */}
                                      <td>
                                        {inv.variantName ? (
                                          <span
                                            className="badge bg-light text-secondary border fs-10 px-1.5 py-0.5 text-truncate d-inline-block"
                                            style={{ maxWidth: "130px" }}
                                            title={inv.variantName}
                                          >
                                            {inv.variantName}
                                          </span>
                                        ) : (
                                          <span className="text-muted fs-11">—</span>
                                        )}
                                      </td>

                                      {/* Count Badge */}
                                      <td className="text-nowrap">
                                        <span
                                          className="badge px-2.5 py-1 rounded-pill fs-11 fw-bold"
                                          style={{
                                            backgroundColor: isSelected ? "#dcfce7" : "#ecfdf5",
                                            color: "#0e7d4d",
                                            border: "1px solid #a7f3d0",
                                          }}
                                        >
                                          {inv.quantity} {inv.unit}
                                        </span>
                                      </td>

                                      {/* Unit Price */}
                                      <td className="text-nowrap">
                                        <span className="fs-11 text-muted">
                                          ₹{Number(inv.unitPrice || 0).toLocaleString("en-IN")}/{inv.unit}
                                        </span>
                                      </td>

                                      {/* Total Amount */}
                                      <td className="text-end text-nowrap pe-3">
                                        <strong className="fs-12 fw-bold text-dark">
                                          ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN")}
                                        </strong>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ========================================================
                       STEP 2: SELECT TARGET PURCHASE INVOICE (CREATE BATCH LIST)
                       ======================================================== */
                    <>
                      {/* Summary of Chosen Sales Invoices */}
                      <div className="pb-drawer-selected-card mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span
                              className="badge px-2.5 py-1 rounded-pill fs-10 fw-bold text-uppercase"
                              style={{
                                backgroundColor: "#ecfdf5",
                                color: "#0e7d4d",
                                border: "1px solid #a7f3d0",
                              }}
                            >
                              {allChosenSalesInvoiceEntries.length} SALES INVOICE{allChosenSalesInvoiceEntries.length === 1 ? "" : "S"} SELECTED
                            </span>
                            <span className="fs-11 text-muted">
                              across {activeAddToInvoiceItems.length} product{activeAddToInvoiceItems.length === 1 ? "" : "s"} &bull; {totalSalesInvoiceSummary.totalUnits} Units
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-12 fw-bold text-dark">
                              Total: ₹{totalSalesInvoiceSummary.totalAmount.toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-success text-decoration-none fs-11 fw-semibold d-inline-flex align-items-center gap-1 ms-1"
                              onClick={() => setDrawerStep("sales_invoices")}
                              title="Back to Step 1 to modify sales invoices selection"
                            >
                              <ArrowLeft size={11} />
                              <span>Edit Sales Invoices</span>
                            </button>
                          </div>
                        </div>

                        {/* Scrollable Mini Selected Invoices Chips in a Single Row */}
                        <div
                          className="d-flex align-items-center gap-1.5 overflow-x-auto flex-nowrap pb-1"
                          style={{ maxWidth: "100%" }}
                        >
                          {allChosenSalesInvoiceEntries.map((entry, eIdx) => (
                            <span
                              key={entry.id || eIdx}
                              className="badge bg-white border text-dark fs-10 px-2 py-1 rounded-2 d-inline-flex align-items-center gap-1 flex-shrink-0 text-nowrap"
                            >
                              <strong className="text-success">{entry.salesInvoiceNo}</strong>
                              <span className="text-muted">&bull;</span>
                              <span className="text-secondary text-truncate" style={{ maxWidth: "160px" }}>
                                {entry.productName}
                              </span>
                              <span className="badge bg-light text-dark border px-1 py-0 rounded">
                                {entry.quantity} {entry.unit}
                              </span>
                              <span className="fw-semibold">
                                ₹{entry.totalAmount.toLocaleString("en-IN")}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Filter / Search Bar for Create Batch Purchase Invoices */}
                      <div className="mb-3 pb-drawer-search-wrap" style={{ marginBottom: "18px" }}>
                        <div className="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-1.5 min-w-0">
                            <label className="fw-bold fs-13 text-dark mb-0">
                              Select Target Purchase Invoice:
                            </label>
                            <span className="badge bg-light border text-dark fs-10 px-2 py-0.5 rounded-pill">
                              {createBatchInvoices.length} Invoices in Create Batch
                            </span>
                          </div>
                          <span className="fs-11 text-muted">
                            Choose which invoice in Create Batch to link these {allChosenSalesInvoiceEntries.length} sales invoice(s)
                          </span>
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text py-1 px-2.5">
                            <Search size={13} />
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm shadow-none fs-12"
                            placeholder="Search purchase invoices by PO #, Supplier Invoice #, Supplier, Product..."
                            value={modalInvoiceSearch}
                            onChange={(e) => setModalInvoiceSearch(e.target.value)}
                          />
                          {modalInvoiceSearch && (
                            <button
                              type="button"
                              className="btn btn-sm btn-white border border-start-0 text-muted shadow-none px-2"
                              onClick={() => setModalInvoiceSearch("")}
                              title="Clear search"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Purchase Invoices in Create Batch List */}
                      {modalFilteredInvoices.length === 0 ? (
                        <div className="p-4 text-center text-muted bg-light rounded-2 border">
                          <Search size={20} className="mb-2 text-muted" />
                          <p className="fs-12 mb-1 fw-semibold text-dark">
                            No purchase invoices found matching "{modalInvoiceSearch}"
                          </p>
                          {modalInvoiceSearch ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-link fs-11 p-0 text-decoration-none text-success"
                              onClick={() => setModalInvoiceSearch("")}
                            >
                              Clear search filter
                            </button>
                          ) : (
                            <p className="fs-11 text-muted mb-0">
                              No purchase invoices currently in Create Batch. You can select one from the Batches table first.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="pb-drawer-table-wrap">
                          <div className="table-responsive">
                            <table className="pb-drawer-table align-middle mb-0">
                              <thead>
                                <tr>
                                  <th style={{ width: "46px" }} className="text-center">Select</th>
                                  <th style={{ minWidth: "125px" }}>PO / Invoice #</th>
                                  <th style={{ minWidth: "160px" }}>Supplier</th>
                                  <th style={{ minWidth: "120px" }}>Supplier Inv #</th>
                                  <th style={{ minWidth: "105px" }}>Date</th>
                                  <th style={{ minWidth: "240px" }}>Products in Invoice</th>
                                  <th style={{ minWidth: "150px" }}>Attached Status</th>
                                  <th style={{ minWidth: "110px" }} className="text-end pe-3">Total Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {modalFilteredInvoices.map((inv) => {
                                  const isSelected =
                                    selectedTargetInvoiceId === inv.id || selectedTargetInvoiceId === inv.po_number;
                                  const invItems = getInvoiceItems(inv);
                                  const attachedItems =
                                    invoiceLinkedSoldItems[inv.id] || invoiceLinkedSoldItems[inv.po_number] || [];

                                  // Check if invoice items match any of the selected sold products
                                  const hasMatchingProduct = invItems.some((invIt) =>
                                    activeAddToInvoiceItems.some(
                                      (soldIt) =>
                                        (soldIt.productName &&
                                          invIt.productName &&
                                          soldIt.productName.toLowerCase() === invIt.productName.toLowerCase()) ||
                                        (soldIt.sku &&
                                          invIt.sku &&
                                          soldIt.sku.toLowerCase() === invIt.sku.toLowerCase())
                                    )
                                  );

                                  return (
                                    <tr
                                      key={inv.id || inv.po_number}
                                      className={`pb-target-invoice-row ${isSelected ? "selected-row" : ""}`}
                                      onClick={() => setSelectedTargetInvoiceId(inv.id || inv.po_number)}
                                    >
                                      {/* Select Radio */}
                                      <td className="text-center">
                                        <div className="d-flex justify-content-center">
                                          <div className={`pb-custom-radio ${isSelected ? "selected" : ""}`} />
                                        </div>
                                      </td>

                                      {/* PO / Invoice # */}
                                      <td className="text-nowrap">
                                        <strong
                                          className="fs-12 fw-bold"
                                          style={{ color: isSelected ? "#0e7d4d" : undefined }}
                                        >
                                          {inv.po_number || inv.supplier_invoice_no}
                                        </strong>
                                      </td>

                                      {/* Supplier Name */}
                                      <td>
                                        <span
                                          className="fs-12 fw-semibold text-secondary text-truncate d-block"
                                          style={{ maxWidth: "210px" }}
                                          title={inv.supplier_name}
                                        >
                                          {inv.supplier_name || "Supplier"}
                                        </span>
                                      </td>

                                      {/* Supplier Invoice # */}
                                      <td className="text-nowrap">
                                        {inv.supplier_invoice_no ? (
                                          <span className="badge bg-light text-muted border fs-10 px-1.5 py-0.5">
                                            Inv: {inv.supplier_invoice_no}
                                          </span>
                                        ) : (
                                          <span className="text-muted fs-11">—</span>
                                        )}
                                      </td>

                                      {/* Date */}
                                      <td className="text-nowrap">
                                        <span className="text-muted fs-11 d-inline-flex align-items-center gap-1">
                                          <Calendar size={11} className="text-muted" />
                                          <span>{inv.order_date || "—"}</span>
                                        </span>
                                      </td>

                                      {/* Products in Invoice */}
                                      <td>
                                        <div className="d-flex align-items-center flex-wrap gap-1">
                                          {hasMatchingProduct && (
                                            <span
                                              className="badge px-1.5 py-0.5 rounded-pill fs-9 fw-bold flex-shrink-0"
                                              style={{
                                                backgroundColor: "#dcfce7",
                                                color: "#0e7d4d",
                                                border: "1px solid #a7f3d0",
                                              }}
                                            >
                                              Product Match
                                            </span>
                                          )}
                                          {invItems.slice(0, 3).map((item, i) => (
                                            <span
                                              key={i}
                                              className="badge bg-light text-dark border fs-10 px-1.5 py-0.5 text-truncate"
                                              style={{ maxWidth: "160px" }}
                                              title={`${item.productName} (${item.quantity} ${item.unit || "PCS"})`}
                                            >
                                              {item.productName} ({item.quantity} {item.unit || "PCS"})
                                            </span>
                                          ))}
                                          {invItems.length > 3 && (
                                            <span className="badge bg-light text-muted border fs-10 px-1 py-0.5 flex-shrink-0">
                                              +{invItems.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Attached Status */}
                                      <td className="text-nowrap">
                                        {attachedItems.length > 0 ? (
                                          <span
                                            className="badge px-2 py-0.5 rounded-pill fs-10 fw-bold"
                                            style={{
                                              backgroundColor: "#fef3c7",
                                              color: "#b45309",
                                              border: "1px solid #fde68a",
                                            }}
                                          >
                                            +{attachedItems.length} Sold Items Attached
                                          </span>
                                        ) : (
                                          <span className="text-muted fs-11">—</span>
                                        )}
                                      </td>

                                      {/* Total Amount */}
                                      <td className="text-end text-nowrap pe-3">
                                        <strong className="fs-12 fw-bold text-dark">
                                          ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
                                        </strong>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Fixed Footer */}
                <div className="offcanvas-footer border-top py-2.5 px-3.5 d-flex flex-column gap-2 flex-shrink-0">
                  {drawerStep === "sales_invoices" ? (
                    /* Step 1 Footer */
                    <>
                      <div className="fs-11 text-muted d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <span>
                          Total Selection: <strong className="text-dark">{totalSalesInvoiceSummary.totalProducts}</strong> Product{totalSalesInvoiceSummary.totalProducts === 1 ? "" : "s"} &bull;{" "}
                          <strong className="text-success">{totalSalesInvoiceSummary.totalInvoices}</strong> Sales Invoice{totalSalesInvoiceSummary.totalInvoices === 1 ? "" : "s"}
                        </span>
                        <span className="fw-bold text-dark">
                          {totalSalesInvoiceSummary.totalUnits} Units &bull; ₹{totalSalesInvoiceSummary.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1.5 px-3 fs-12 fw-semibold rounded-2 shadow-none flex-grow-0"
                          onClick={() => {
                            setActiveAddToInvoiceItems(null);
                            setDrawerStep("sales_invoices");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-success py-1.5 px-3 fs-12 fw-semibold shadow-none rounded-2 d-inline-flex align-items-center justify-content-center gap-1.5 flex-grow-1"
                          style={{ backgroundColor: "#0e7d4d", borderColor: "#0e7d4d" }}
                          disabled={totalSalesInvoiceSummary.totalInvoices === 0}
                          onClick={handleProceedToPurchaseInvoiceSelection}
                        >
                          <span>Proceed to Select Purchase Invoice ({totalSalesInvoiceSummary.totalInvoices} Invoices)</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Step 2 Footer */
                    <>
                      <div className="fs-11 text-muted d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <span>
                          Target Purchase Invoice:{" "}
                          <strong className="text-success">
                            {selectedTargetInvoice?.po_number ||
                              selectedTargetInvoice?.supplier_invoice_no ||
                              selectedTargetInvoiceId ||
                              "None Selected"}
                          </strong>{" "}
                          {selectedTargetInvoice?.supplier_name && (
                            <span className="text-secondary">({selectedTargetInvoice.supplier_name})</span>
                          )}
                        </span>
                        <span className="fw-bold text-dark">
                          Attaching {allChosenSalesInvoiceEntries.length} Invoices ({totalSalesInvoiceSummary.totalUnits} Units &bull; ₹{totalSalesInvoiceSummary.totalAmount.toLocaleString("en-IN")})
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1.5 px-3 fs-12 fw-semibold rounded-2 shadow-none d-inline-flex align-items-center gap-1 flex-grow-0"
                          onClick={() => setDrawerStep("sales_invoices")}
                        >
                          <ArrowLeft size={13} />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1.5 px-3 fs-12 fw-semibold rounded-2 shadow-none flex-grow-0"
                          onClick={() => {
                            setActiveAddToInvoiceItems(null);
                            setDrawerStep("sales_invoices");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-success py-1.5 px-3 fs-12 fw-semibold shadow-none rounded-2 d-inline-flex align-items-center justify-content-center gap-1.5 flex-grow-1"
                          style={{ backgroundColor: "#0e7d4d", borderColor: "#0e7d4d" }}
                          disabled={!selectedTargetInvoiceId}
                          onClick={() => handleConfirmMoveToInvoice(undefined, selectedTargetInvoiceId)}
                        >
                          <Check size={14} />
                          <span>Move to Invoice &amp; View</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </>,
            document.body
          )}
      </div>
    </div>
  );
};

export default BranchInvoiceSelection;
