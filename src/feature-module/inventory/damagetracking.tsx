import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { api, getActiveBusinessId } from "../../services/api";
import { useBusiness } from "../../context/BusinessContext";
import { batchService } from "../../services/batchService";

export interface SavedDamageRecord {
  id: string;
  recordNumber: string;
  date: string;
  invoiceId: string;
  invoicePoNumber: string;
  supplierInvoiceNo?: string;
  supplierName: string;
  businessName?: string;
  productId?: string;
  productName: string;
  sku?: string;
  damagedQuantity: number;
  unitPrice: number;
  totalLoss: number;
  reason: string;
  notes?: string;
  createdAt: string;
}

interface DamagedProductItem {
  id: string | number;
  productId?: string;
  productName: string;
  sku?: string;
  invoiceQuantity: number;
  damagedQuantity: number;
  unitPrice: number;
  totalLoss: number;
  reason: string;
  notes?: string;
}

interface PurchaseOrderItem {
  id: string | number;
  po_id?: string;
  product_id?: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number | string;
  total: number | string;
  batch_no?: string;
}

interface PurchaseInvoice {
  id: string;
  po_number: string;
  supplier_invoice_no?: string;
  supplier_name: string;
  contact_person?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_address?: string;
  supplier_gstin?: string;
  business_id?: string;
  business_name?: string;
  order_date: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  total_amount: number | string;
  paid_amount?: number | string;
  outstanding_due?: number | string;
  notes?: string;
  items?: PurchaseOrderItem[];
  source?: "database" | "batch";
}

const STORAGE_KEY = "gn_damage_tracking_records";

const DamageTracking: React.FC = () => {
  const { businessId: currentActiveBiz } = useBusiness();

  // Mode: 'list' for the main damage tracking records table, 'add' for recording damage from invoice
  const [viewMode, setViewMode] = useState<"list" | "add">("list");

  // Saved Records State
  const [savedRecords, setSavedRecords] = useState<SavedDamageRecord[]>([]);
  const [listSearch, setListSearch] = useState("");
  const [filterReason, setFilterReason] = useState("all");

  // Add Mode State (Invoice search & selection)
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [damagedItems, setDamagedItems] = useState<DamagedProductItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load Saved Records from LocalStorage
  const loadSavedRecords = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedRecords(parsed);
          return;
        }
      }
    } catch {
      // ignore JSON parse error
    }
    setSavedRecords([]);
  }, []);

  useEffect(() => {
    loadSavedRecords();
  }, [loadSavedRecords]);

  // Load Invoices from Backend API + LocalStorage Batches
  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    const combinedList: PurchaseInvoice[] = [];

    // 1. Fetch purchase orders from backend
    try {
      const activeBiz = getActiveBusinessId();
      const res = await api.get<any[]>("/purchases", {
        business_id: activeBiz || "all",
      });

      if (Array.isArray(res)) {
        res.forEach((po: any) => {
          combinedList.push({
            id: String(po.id),
            po_number: po.po_number || `PO-${po.id}`,
            supplier_invoice_no: po.supplier_invoice_no || "",
            supplier_name: po.supplier_name || "Unknown Supplier",
            contact_person: po.contact_person || "",
            supplier_phone: po.supplier_phone || "",
            supplier_email: po.supplier_email || "",
            supplier_address: po.supplier_address || "",
            supplier_gstin: po.supplier_gstin || "",
            business_id: po.business_id || "",
            business_name: po.business_name || (po.business_id === "nikhlesh-nursery" ? "Nikhlesh Nursery" : "Grow Naturals"),
            order_date: po.order_date ? po.order_date.split("T")[0] : new Date().toISOString().split("T")[0],
            status: po.status || "received",
            payment_status: po.payment_status || "paid",
            payment_method: po.payment_method || "Bank Transfer",
            total_amount: Number(po.total_amount) || 0,
            paid_amount: Number(po.paid_amount) || 0,
            outstanding_due: Number(po.outstanding_due) || 0,
            notes: po.notes || "",
            items: Array.isArray(po.items) ? po.items : undefined,
            source: "database",
          });
        });
      }
    } catch {
      // Backend purchases fallback
    }

    // 2. Fetch local storage batches (Purchase & Batches module)
    try {
      const localBatches = batchService.getBatches();
      if (Array.isArray(localBatches)) {
        (localBatches as any[]).forEach((batch: any) => {
          const bNum = batch.batchNumber || batch.batch_number || batch.batchNo || "";
          const invNum = batch.invoiceNumber || batch.invoice_no || batch.supplier_invoice_no || "";
          const alreadyExists = combinedList.some(
            (p) =>
              (bNum && p.po_number.toLowerCase() === bNum.toLowerCase()) ||
              (invNum && p.supplier_invoice_no?.toLowerCase() === invNum.toLowerCase())
          );

          if (!alreadyExists) {
            const mappedItems: PurchaseOrderItem[] = (batch.items || []).map((item: any, idx: number) => {
              const qty = item.receivedQuantity || item.orderedQuantity || item.quantity || 0;
              const cost = item.costPrice || item.unit_price || item.price || 0;
              return {
                id: `${batch.id}-item-${idx}`,
                product_id: item.productId || item.product_id || "",
                product_name: item.name || item.product_name || item.productName || "Product",
                sku: item.sku || "",
                quantity: qty,
                unit_price: cost,
                total: qty * cost,
                batch_no: bNum,
              };
            });

            combinedList.push({
              id: batch.id,
              po_number: bNum || `BATCH-${batch.id}`,
              supplier_invoice_no: invNum,
              supplier_name: batch.supplier || batch.supplier_name || "Supplier",
              contact_person: "",
              supplier_phone: "",
              supplier_email: "",
              supplier_address: "",
              supplier_gstin: "",
              business_id: batch.businessId || batch.business_id,
              business_name:
                batch.businessName ||
                batch.business_name ||
                ((batch.businessId || batch.business_id) === "nikhlesh-nursery" ? "Nikhlesh Nursery" : "Grow Naturals"),
              order_date: batch.receivedDate || batch.purchaseDate || batch.order_date || new Date().toISOString().split("T")[0],
              status: "received",
              payment_status: batch.paymentStatus || batch.payment_status || "paid",
              payment_method: "Cash / Bank",
              total_amount: batch.totalAmount || batch.total_amount || 0,
              paid_amount: batch.totalAmount || batch.total_amount || 0,
              outstanding_due: 0,
              notes: batch.notes || "",
              items: mappedItems,
              source: "batch",
            });
          }
        });
      }
    } catch {
      // LocalStorage batch fallback
    }

    setInvoices(combinedList);
    setLoadingInvoices(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Click outside to close invoice search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter invoices for autocomplete
  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) {
      return invoices.slice(0, 15);
    }
    const q = searchTerm.toLowerCase().trim();
    return invoices.filter((inv) => {
      const matchPo = inv.po_number.toLowerCase().includes(q);
      const matchInv = inv.supplier_invoice_no?.toLowerCase().includes(q);
      const matchSupplier = inv.supplier_name.toLowerCase().includes(q);
      const matchBiz = inv.business_name?.toLowerCase().includes(q);
      return matchPo || matchInv || matchSupplier || matchBiz;
    });
  }, [invoices, searchTerm]);

  // Select an invoice
  const handleSelectInvoice = async (inv: PurchaseInvoice) => {
    setSelectedInvoice(inv);
    setDamagedItems([]);
    setSearchTerm(`${inv.po_number}${inv.supplier_invoice_no ? ` (${inv.supplier_invoice_no})` : ""} - ${inv.supplier_name}`);
    setShowDropdown(false);

    if (!inv.items || inv.items.length === 0) {
      if (inv.source === "database") {
        setLoadingDetails(true);
        try {
          const detail = await api.get<any>(`/purchases/${inv.id}`);
          if (detail && detail.items) {
            setSelectedInvoice((prev) =>
              prev ? { ...prev, items: detail.items, ...detail } : detail
            );
          }
        } catch {
          // Keep existing preview
        } finally {
          setLoadingDetails(false);
        }
      }
    }
  };

  const handleClearSelection = () => {
    setSelectedInvoice(null);
    setDamagedItems([]);
    setSearchTerm("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Mark / Subtract unit handlers
  const handleAddDamagedUnit = (item: PurchaseOrderItem) => {
    setDamagedItems((prev) => {
      const exists = prev.find((d) => String(d.id) === String(item.id));
      const invQty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      if (exists) {
        return prev.map((d) =>
          String(d.id) === String(item.id)
            ? {
                ...d,
                damagedQuantity: Math.min(invQty, d.damagedQuantity + 1),
                totalLoss: Math.min(invQty, d.damagedQuantity + 1) * price,
              }
            : d
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          sku: item.sku,
          invoiceQuantity: invQty,
          damagedQuantity: 1,
          unitPrice: price,
          totalLoss: price,
          reason: "Physical / Handling Damage",
        },
      ];
    });
  };

  const handleStepDamagedUnit = (itemId: string | number, step: number) => {
    setDamagedItems((prev) => {
      return prev
        .map((d) => {
          if (String(d.id) === String(itemId)) {
            const next = d.damagedQuantity + step;
            if (next <= 0) return null;
            const clamped = Math.min(d.invoiceQuantity, next);
            return {
              ...d,
              damagedQuantity: clamped,
              totalLoss: clamped * d.unitPrice,
            };
          }
          return d;
        })
        .filter(Boolean) as DamagedProductItem[];
    });
  };

  const handleSetDamagedQty = (itemId: string | number, qty: number) => {
    setDamagedItems((prev) => {
      return prev.map((d) => {
        if (String(d.id) === String(itemId)) {
          const clamped = Math.max(1, Math.min(d.invoiceQuantity, qty));
          return {
            ...d,
            damagedQuantity: clamped,
            totalLoss: clamped * d.unitPrice,
          };
        }
        return d;
      });
    });
  };

  const handleUpdateReason = (itemId: string | number, reason: string) => {
    setDamagedItems((prev) =>
      prev.map((d) => (String(d.id) === String(itemId) ? { ...d, reason } : d))
    );
  };

  const handleUpdateNotes = (itemId: string | number, notes: string) => {
    setDamagedItems((prev) =>
      prev.map((d) => (String(d.id) === String(itemId) ? { ...d, notes } : d))
    );
  };

  const handleRemoveDamaged = (itemId: string | number) => {
    setDamagedItems((prev) => prev.filter((d) => String(d.id) !== String(itemId)));
  };

  const totalDamagedUnits = useMemo(() => {
    return damagedItems.reduce((acc, d) => acc + d.damagedQuantity, 0);
  }, [damagedItems]);

  const totalLossAmount = useMemo(() => {
    return damagedItems.reduce((acc, d) => acc + d.totalLoss, 0);
  }, [damagedItems]);

  // SAVE DAMAGE TRACKING ACTION
  const handleSaveDamageTracking = async () => {
    if (!selectedInvoice) {
      setNotification({ type: "danger", message: "Please select a purchase invoice." });
      return;
    }

    if (damagedItems.length === 0) {
      setNotification({
        type: "danger",
        message: "Please mark at least one item as damaged using the subtract button.",
      });
      return;
    }

    setIsSaving(true);
    const currentDate = new Date().toISOString().split("T")[0];
    const newRecords: SavedDamageRecord[] = [];

    const existingCount = savedRecords.length;
    damagedItems.forEach((dmg, index) => {
      const recordNumber = `DMG-${String(existingCount + index + 1).padStart(4, "0")}`;
      newRecords.push({
        id: `dmg_${Date.now()}_${index}`,
        recordNumber,
        date: currentDate,
        invoiceId: selectedInvoice.id,
        invoicePoNumber: selectedInvoice.po_number,
        supplierInvoiceNo: selectedInvoice.supplier_invoice_no,
        supplierName: selectedInvoice.supplier_name,
        businessName: selectedInvoice.business_name || "Grow Naturals",
        productId: dmg.productId,
        productName: dmg.productName,
        sku: dmg.sku,
        damagedQuantity: dmg.damagedQuantity,
        unitPrice: dmg.unitPrice,
        totalLoss: dmg.totalLoss,
        reason: dmg.reason,
        notes: dmg.notes || "",
        createdAt: new Date().toISOString(),
      });
    });

    // Attempt to persist to /inventory-losses backend API as well
    try {
      const activeBiz = getActiveBusinessId() || selectedInvoice.business_id || "nikhlesh-nursery";
      for (const item of newRecords) {
        if (item.productId) {
          try {
            await api.post("/inventory-losses", {
              business_id: activeBiz,
              product_id: item.productId,
              quantity: item.damagedQuantity,
              reason: item.reason,
              damage_date: item.date,
              notes: `Subtracted from ${item.invoicePoNumber} (${item.supplierName}). ${item.notes || ""}`.trim(),
              reported_by: "Store Staff",
              valuation_basis: "cost_price",
            });
          } catch {
            // graceful local fallback
          }
        }
      }
    } catch {
      // silent fallback
    }

    // Persist to LocalStorage
    const updated = [...newRecords, ...savedRecords];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedRecords(updated);

    // Reset Form & Switch to List View
    setIsSaving(false);
    setSelectedInvoice(null);
    setDamagedItems([]);
    setSearchTerm("");
    setViewMode("list");
    setNotification({
      type: "success",
      message: `Successfully saved ${newRecords.length} damaged product record(s) totaling ₹${newRecords
        .reduce((sum, r) => sum + r.totalLoss, 0)
        .toLocaleString("en-IN", { minimumFractionDigits: 2 })}!`,
    });

    // Auto-clear notification after 5s
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Delete a saved record
  const handleDeleteRecord = (id: string) => {
    if (window.confirm("Are you sure you want to delete this damage record?")) {
      const updated = savedRecords.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedRecords(updated);
      setNotification({
        type: "success",
        message: "Damage record removed successfully.",
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filter Saved Records for the main listing table
  const filteredSavedRecords = useMemo(() => {
    return savedRecords.filter((rec) => {
      const q = listSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        rec.productName.toLowerCase().includes(q) ||
        rec.invoicePoNumber.toLowerCase().includes(q) ||
        rec.supplierName.toLowerCase().includes(q) ||
        (rec.sku && rec.sku.toLowerCase().includes(q)) ||
        rec.recordNumber.toLowerCase().includes(q);

      const matchReason = filterReason === "all" || rec.reason === filterReason;

      return matchSearch && matchReason;
    });
  }, [savedRecords, listSearch, filterReason]);

  // Overall KPI metrics from saved records
  const listMetrics = useMemo(() => {
    const totalUnits = savedRecords.reduce((acc, r) => acc + (Number(r.damagedQuantity) || 0), 0);
    const totalLoss = savedRecords.reduce((acc, r) => acc + (Number(r.totalLoss) || 0), 0);
    const uniqueInvoices = new Set(savedRecords.map((r) => r.invoicePoNumber)).size;
    return {
      totalUnits,
      totalLoss,
      totalRecords: savedRecords.length,
      uniqueInvoices,
    };
  }, [savedRecords]);

  const isDropdownVisible = showDropdown && invoices.length > 0;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Toast / Notification Banner */}
        {notification && (
          <div
            className={`alert alert-${notification.type} alert-dismissible fade show d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-sm`}
            role="alert"
          >
            <div className="d-flex align-items-center gap-2">
              {notification.type === "success" ? (
                <i className="feather icon-check-circle text-success fs-18" />
              ) : (
                <i className="feather icon-alert-triangle text-danger fs-18" />
              )}
              <span className="fs-13 fw-semibold">{notification.message}</span>
            </div>
            <button
              type="button"
              className="btn-close shadow-none p-2"
              onClick={() => setNotification(null)}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: DAMAGE TRACKING LIST VIEW (MAIN TABLE)                  */}
        {/* ============================================================== */}
        {viewMode === "list" && (
          <div>
            {/* Header: Title + Add Damage Tracking Button */}
            <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
              <div className="page-title">
                <h4 className="fw-bold mb-1 text-dark" style={{ color: "#000000" }}>
                  Damage Tracking
                </h4>
                <h6 className="text-muted fs-13 mb-0">
                  Track and manage damaged goods, stock write-offs, and losses from purchase bills
                </h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3 py-2 d-inline-flex align-items-center gap-1.5 shadow-none rounded-2"
                  onClick={loadSavedRecords}
                  title="Refresh list"
                >
                  <i className="feather icon-rotate-ccw" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-none rounded-2 fw-semibold"
                  onClick={() => setViewMode("add")}
                >
                  <i className="feather icon-plus" />
                  <span>Add Damage Tracking</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3">
                <div className="p-3 rounded-3 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-semibold text-uppercase">Total Damaged</span>
                    <div
                      className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="feather icon-alert-triangle fs-14" />
                    </div>
                  </div>
                  <h4 className="fw-bold text-danger mb-0">{listMetrics.totalUnits}</h4>
                  <small className="text-muted fs-11">Total units written off</small>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 rounded-3 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-semibold text-uppercase">Total Financial Loss</span>
                    <div
                      className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <span className="fw-bold fs-14">₹</span>
                    </div>
                  </div>
                  <h4 className="fw-bold text-dark mb-0" style={{ color: "#000000" }}>
                    ₹{listMetrics.totalLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </h4>
                  <small className="text-muted fs-11">At invoice cost price</small>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 rounded-3 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-semibold text-uppercase">Incidents Recorded</span>
                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="feather icon-box fs-14" />
                    </div>
                  </div>
                  <h4 className="fw-bold text-primary mb-0">{listMetrics.totalRecords}</h4>
                  <small className="text-muted fs-11">Damaged product entries</small>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 rounded-3 border bg-white shadow-sm h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-semibold text-uppercase">Invoices Affected</span>
                    <div
                      className="rounded-circle bg-light text-muted d-flex align-items-center justify-content-center"
                      style={{ width: "32px", height: "32px" }}
                    >
                      <i className="feather icon-file-text fs-14" />
                    </div>
                  </div>
                  <h4 className="fw-bold text-dark mb-0" style={{ color: "#000000" }}>
                    {listMetrics.uniqueInvoices}
                  </h4>
                  <small className="text-muted fs-11">Purchase bills with damage</small>
                </div>
              </div>
            </div>

            {/* List Table Card with Search & Filters */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white border-bottom py-3 px-4">
                <div className="row g-2 align-items-center justify-content-between">
                  <div className="col-12 col-md-6 col-lg-5">
                    <div className="position-relative">
                      <i className="feather icon-search position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
                      <input
                        type="text"
                        className="form-control ps-5 fs-13"
                        placeholder="Search by product, invoice, SKU, or supplier..."
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        style={{ height: "40px" }}
                      />
                      {listSearch && (
                        <button
                          type="button"
                          className="btn btn-sm position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted"
                          onClick={() => setListSearch("")}
                        >
                          <i className="feather icon-x fs-13" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-md-6 col-lg-4 d-flex align-items-center gap-2 justify-content-md-end">
                    <div className="d-flex align-items-center gap-1 text-muted fs-12">
                      <i className="feather icon-filter" />
                      <span>Reason:</span>
                    </div>
                    <select
                      className="form-select form-select-sm fs-12 shadow-none"
                      style={{ height: "40px", maxWidth: "220px" }}
                      value={filterReason}
                      onChange={(e) => setFilterReason(e.target.value)}
                    >
                      <option value="all">All Damage Reasons</option>
                      <option value="Physical / Handling Damage">Physical / Handling Damage</option>
                      <option value="Transport / Shipping Damage">Transport / Shipping Damage</option>
                      <option value="Pest / Disease Infection">Pest / Disease Infection</option>
                      <option value="Rotting / Wilting / Drying">Rotting / Wilting / Drying</option>
                      <option value="Broken Pot / Damaged Container">Broken Pot / Container</option>
                      <option value="Supplier Quality Defect">Supplier Quality Defect</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Saved Records Table */}
              <div className="card-body p-0">
                {filteredSavedRecords.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <div
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{ width: "64px", height: "64px" }}
                    >
                      <i className="feather icon-alert-triangle text-muted opacity-50" style={{ fontSize: "28px" }} />
                    </div>
                    <h5 className="fw-bold text-dark mb-1" style={{ color: "#000000" }}>
                      {savedRecords.length === 0 ? "No Damage Tracking Records Yet" : "No Matching Records Found"}
                    </h5>
                    <p className="text-muted fs-13 mx-auto mb-3" style={{ maxWidth: "420px" }}>
                      {savedRecords.length === 0
                        ? "Click the 'Add Damage Tracking' button above to select a purchase invoice, subtract damaged units from the bill, and save records."
                        : `No records match your search criteria "${listSearch}". Try clearing filters.`}
                    </p>
                    {savedRecords.length === 0 && (
                      <button
                        type="button"
                        className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-none rounded-2"
                        onClick={() => setViewMode("add")}
                      >
                        <i className="feather icon-plus" />
                        <span>Add Damage Tracking</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="fs-12 text-muted text-uppercase">
                          <th style={{ width: "40px" }} className="ps-3">#</th>
                          <th style={{ width: "110px" }}>Record ID</th>
                          <th style={{ width: "110px" }}>Date</th>
                          <th>Invoice / PO #</th>
                          <th>Supplier</th>
                          <th>Product Name</th>
                          <th>SKU / Variant</th>
                          <th className="text-center">Damaged Qty</th>
                          <th className="text-end">Unit Cost</th>
                          <th className="text-end">Total Loss</th>
                          <th>Reason</th>
                          <th className="text-center pe-3" style={{ width: "70px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSavedRecords.map((rec, idx) => (
                          <tr key={rec.id}>
                            <td className="ps-3 text-muted fs-13">{idx + 1}</td>
                            <td>
                              <span className="badge bg-light text-dark border fs-11 fw-semibold">
                                {rec.recordNumber}
                              </span>
                            </td>
                            <td className="fs-12 text-muted">
                              <span className="d-flex align-items-center gap-1">
                                <i className="feather icon-calendar fs-11" />
                                {rec.date}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <span className="fw-semibold text-dark fs-13" style={{ color: "#000000" }}>
                                  {rec.invoicePoNumber}
                                </span>
                                {rec.supplierInvoiceNo && (
                                  <span className="badge bg-light text-muted border fs-10">
                                    {rec.supplierInvoiceNo}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="text-muted fs-12 d-flex align-items-center gap-1">
                                <i className="feather icon-user fs-11" />
                                {rec.supplierName}
                              </span>
                            </td>
                            <td>
                              <span className="fw-semibold text-dark fs-13" style={{ color: "#000000" }}>
                                {rec.productName}
                              </span>
                              {rec.notes && (
                                <span className="text-muted d-block fs-11 italic">
                                  Note: {rec.notes}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-light text-muted border fs-11">
                                {rec.sku || "N/A"}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-danger text-white fw-bold px-2 py-1 fs-12">
                                {rec.damagedQuantity} units
                              </span>
                            </td>
                            <td className="text-end text-muted fs-13">
                              ₹{Number(rec.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-end fw-bold text-danger fs-13">
                              ₹{Number(rec.totalLoss).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td>
                              <span className="badge bg-danger-subtle text-danger border border-danger-subtle fs-11">
                                {rec.reason}
                              </span>
                            </td>
                            <td className="text-center pe-3">
                              <button
                                type="button"
                                className="btn btn-sm p-1 text-muted border-0 bg-transparent shadow-none"
                                onClick={() => handleDeleteRecord(rec.id)}
                                title="Delete record"
                              >
                                <i className="feather icon-trash-2 text-danger opacity-75" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={7} className="ps-3 fw-bold text-dark fs-13" style={{ color: "#000000" }}>
                            Total Filtered Summary ({filteredSavedRecords.length} records)
                          </td>
                          <td className="text-center fw-bold text-danger fs-13">
                            {filteredSavedRecords.reduce((acc, r) => acc + (Number(r.damagedQuantity) || 0), 0)} units
                          </td>
                          <td></td>
                          <td className="text-end fw-bold text-danger fs-14">
                            ₹{filteredSavedRecords.reduce((acc, r) => acc + (Number(r.totalLoss) || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ADD DAMAGE TRACKING (SELECT INVOICE & MARK SUBTRACTED) */}
        {/* ============================================================== */}
        {viewMode === "add" && (
          <div>
            {/* Header: Title + Back to Damage List Button */}
            <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
              <div className="page-title">
                <h4 className="fw-bold mb-1 text-dark" style={{ color: "#000000" }}>
                  Record Damaged Inventory
                </h4>
                <h6 className="text-muted fs-13 mb-0">
                  Select a purchase invoice to subtract damaged units from the bill and record stock loss
                </h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 py-2 shadow-none rounded-2 fs-13"
                  onClick={() => setViewMode("list")}
                >
                  <i className="feather icon-arrow-left" />
                  <span>Back to Damage List</span>
                </button>
              </div>
            </div>

            {/* Invoice Search / Selection Card */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div
                    className="rounded-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <i className="feather icon-file-text text-primary fs-16" />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark" style={{ color: "#000000" }}>
                      Select Purchase Invoice
                    </h5>
                    <span className="text-muted fs-12">
                      Search by invoice number, PO number, or supplier to preview the bill
                    </span>
                  </div>
                </div>

                {/* Connected Autocomplete Search Field */}
                <div className="row">
                  <div className="col-12 col-md-8 col-lg-7" ref={containerRef}>
                    <label className="form-label fw-semibold text-dark fs-13 mb-1" style={{ color: "#000000" }}>
                      Purchase Invoice <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                      <div className="d-flex align-items-center">
                        <span className="position-absolute start-0 ms-3 text-muted" style={{ zIndex: 1 }}>
                          <i className="feather icon-search fs-14" />
                        </span>
                        <input
                          ref={inputRef}
                          type="text"
                          className="form-control ps-5 pe-5"
                          placeholder="Type invoice no, PO number, or supplier name..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          style={{
                            height: "44px",
                            fontSize: "14px",
                            borderBottomLeftRadius: isDropdownVisible ? 0 : "6px",
                            borderBottomRightRadius: isDropdownVisible ? 0 : "6px",
                            borderColor: isDropdownVisible ? "#86b7fe" : "#dee2e6",
                            boxShadow: isDropdownVisible ? "0 0 0 0.25rem rgba(13, 110, 253, 0.15)" : "none",
                          }}
                        />

                        {/* Right action buttons: Clear (X) & Chevron */}
                        <div className="position-absolute end-0 me-2 d-flex align-items-center gap-1">
                          {searchTerm && (
                            <button
                              type="button"
                              className="btn btn-sm p-1 text-muted border-0 bg-transparent shadow-none"
                              onClick={handleClearSelection}
                              title="Clear search"
                            >
                              <i className="feather icon-x fs-14" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm p-1 text-muted border-0 bg-transparent shadow-none"
                            onClick={() => setShowDropdown((prev) => !prev)}
                            title="Toggle invoice list"
                          >
                            <i
                              className="feather icon-chevron-down fs-14"
                              style={{
                                display: "inline-block",
                                transition: "transform 0.2s ease",
                                transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                              }}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Connected Dropdown Suggestion List */}
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
                            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
                            maxHeight: "280px",
                            overflowY: "auto",
                            padding: "4px 0",
                          }}
                        >
                          {filteredInvoices.length === 0 ? (
                            <div className="px-3 py-3 text-center text-muted fs-13">
                              <i className="feather icon-alert-triangle text-warning mb-1 d-block mx-auto fs-18" />
                              No purchase invoices found matching &quot;{searchTerm}&quot;
                            </div>
                          ) : (
                            filteredInvoices.map((inv) => {
                              const isSelected = selectedInvoice?.id === inv.id;
                              return (
                                <div
                                  key={inv.id}
                                  className="px-3 py-2 border-bottom"
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isSelected ? "#f0f7ff" : "transparent",
                                    transition: "background-color 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = "#f8f9fa";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                                  }}
                                  onClick={() => handleSelectInvoice(inv)}
                                >
                                  <div className="d-flex align-items-center justify-content-between mb-1">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="fw-semibold text-dark fs-13" style={{ color: "#000000" }}>
                                        {inv.po_number}
                                      </span>
                                      {inv.supplier_invoice_no && (
                                        <span className="badge bg-light text-muted border fs-11">
                                          Inv: {inv.supplier_invoice_no}
                                        </span>
                                      )}
                                      <span
                                        className={`badge ${
                                          inv.business_name?.toLowerCase().includes("nikhlesh")
                                            ? "bg-warning-subtle text-warning-emphasis"
                                            : "bg-success-subtle text-success-emphasis"
                                        } fs-10`}
                                      >
                                        {inv.business_name || "Store"}
                                      </span>
                                    </div>
                                    <span className="fw-bold text-dark fs-13">
                                      ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between fs-12 text-muted">
                                    <span className="d-flex align-items-center gap-1">
                                      <i className="feather icon-user fs-11" />
                                      {inv.supplier_name}
                                    </span>
                                    <span className="d-flex align-items-center gap-1">
                                      <i className="feather icon-calendar fs-11" />
                                      {inv.order_date}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <small className="text-muted d-block mt-1 fs-12">
                      {selectedInvoice
                        ? "✓ Invoice selected. See detailed preview below."
                        : "Select an invoice to preview supplier details, purchased items, and quantities."}
                    </small>
                  </div>

                  {/* Change Action Button */}
                  {selectedInvoice && (
                    <div className="col-12 col-md-4 col-lg-5 d-flex align-items-center justify-content-md-end mt-3 mt-md-0 pt-md-4">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 px-3 py-2 fs-12 shadow-none rounded-2"
                        onClick={handleClearSelection}
                        title="Select a different invoice"
                      >
                        <i className="feather icon-x fs-13" />
                        <span>Change Invoice</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* INVOICE PREVIEW SECTION */}
            {selectedInvoice ? (
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                {/* Header of Preview */}
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                      style={{ width: "38px", height: "38px" }}
                    >
                      <i className="feather icon-file-text text-primary fs-18" />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h5 className="fw-bold mb-0 text-dark" style={{ color: "#000000" }}>
                          Invoice Preview: {selectedInvoice.po_number}
                        </h5>
                        <button
                          type="button"
                          className="btn btn-sm p-0 border-0 text-muted shadow-none"
                          onClick={() => handleCopy(selectedInvoice.po_number)}
                          title="Copy PO Number"
                        >
                          {copiedText === selectedInvoice.po_number ? (
                            <i className="feather icon-check text-success fs-13" />
                          ) : (
                            <i className="feather icon-copy fs-13" />
                          )}
                        </button>
                      </div>
                      <span className="text-muted fs-12">
                        Dated: <strong>{selectedInvoice.order_date}</strong> • Business:{" "}
                        <strong>{selectedInvoice.business_name || "Grow Naturals"}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-body p-4">
                  {/* Row 1: Supplier Info Card & Summary KPI Metrics */}
                  <div className="row g-3 mb-4">
                    {/* Supplier Card */}
                    <div className="col-12 col-lg-5">
                      <div className="p-3 rounded-3 border bg-light h-100">
                        <h6 className="fw-bold mb-2 text-dark d-flex align-items-center gap-1.5" style={{ color: "#000000" }}>
                          <i className="feather icon-home text-primary" />
                          Supplier Information
                        </h6>
                        <div className="fs-13 text-dark mb-1 fw-semibold">
                          {selectedInvoice.supplier_name}
                        </div>
                        {selectedInvoice.contact_person && (
                          <div className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
                            <i className="feather icon-user fs-11" />
                            Contact: {selectedInvoice.contact_person}
                          </div>
                        )}
                        {selectedInvoice.supplier_phone && (
                          <div className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
                            <i className="feather icon-phone fs-11" />
                            {selectedInvoice.supplier_phone}
                          </div>
                        )}
                        {selectedInvoice.supplier_email && (
                          <div className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
                            <i className="feather icon-mail fs-11" />
                            {selectedInvoice.supplier_email}
                          </div>
                        )}
                        {selectedInvoice.supplier_address && (
                          <div className="fs-12 text-muted mb-1 d-flex align-items-center gap-1">
                            <i className="feather icon-map-pin fs-11" />
                            {selectedInvoice.supplier_address}
                          </div>
                        )}
                        {selectedInvoice.supplier_gstin && (
                          <div className="fs-11 text-muted mt-2 pt-2 border-top">
                            GSTIN: <strong>{selectedInvoice.supplier_gstin}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* KPI Cards: Total Amount, Paid, Outstanding, Total Items */}
                    <div className="col-12 col-lg-7">
                      <div className="row g-2 h-100">
                        <div className="col-6 col-md-3">
                          <div className="p-3 rounded-3 border bg-white text-center h-100 d-flex flex-column justify-content-center">
                            <span className="text-muted fs-11 fw-semibold text-uppercase">Total Amount</span>
                            <h5 className="fw-bold text-dark mt-1 mb-0" style={{ color: "#000000" }}>
                              ₹{Number(selectedInvoice.total_amount).toLocaleString("en-IN")}
                            </h5>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-3 rounded-3 border bg-white text-center h-100 d-flex flex-column justify-content-center">
                            <span className="text-muted fs-11 fw-semibold text-uppercase">Paid Amount</span>
                            <h5 className="fw-bold text-success mt-1 mb-0">
                              ₹{Number(selectedInvoice.paid_amount || selectedInvoice.total_amount).toLocaleString("en-IN")}
                            </h5>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-3 rounded-3 border bg-white text-center h-100 d-flex flex-column justify-content-center">
                            <span className="text-muted fs-11 fw-semibold text-uppercase">Outstanding</span>
                            <h5 className="fw-bold text-danger mt-1 mb-0">
                              ₹{Number(selectedInvoice.outstanding_due || 0).toLocaleString("en-IN")}
                            </h5>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="p-3 rounded-3 border bg-white text-center h-100 d-flex flex-column justify-content-center">
                            <span className="text-muted fs-11 fw-semibold text-uppercase">Total Items</span>
                            <h5 className="fw-bold text-primary mt-1 mb-0">
                              {selectedInvoice.items ? selectedInvoice.items.length : 1}
                            </h5>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Purchased Items Table with Subtract Button */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5" style={{ color: "#000000" }}>
                        <i className="feather icon-box text-primary" />
                        Items In This Invoice
                      </h6>
                      <span className="text-muted fs-12">
                        {selectedInvoice.items?.length || 0} line items
                      </span>
                    </div>

                    {loadingDetails ? (
                      <div className="p-4 text-center text-muted">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                        Loading items...
                      </div>
                    ) : !selectedInvoice.items || selectedInvoice.items.length === 0 ? (
                      <div className="p-4 text-center text-muted border rounded bg-light fs-13">
                        No individual item breakdown recorded on this invoice.
                      </div>
                    ) : (
                      <div className="table-responsive border rounded-3 overflow-hidden">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr className="fs-12 text-muted text-uppercase">
                              <th style={{ width: "40px" }} className="ps-3">#</th>
                              <th>Product Name</th>
                              <th>SKU / Variant</th>
                              <th className="text-center" style={{ width: "130px" }}>Quantity</th>
                              <th className="text-end">Unit Price</th>
                              <th className="text-end">Total Amount</th>
                              <th className="text-center pe-3" style={{ width: "170px" }}>Subtract Damaged</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items.map((item, idx) => {
                              const damagedEntry = damagedItems.find((d) => String(d.id) === String(item.id));
                              const totalQty = Number(item.quantity) || 0;
                              const dmgQty = damagedEntry ? damagedEntry.damagedQuantity : 0;
                              const remainingQty = Math.max(0, totalQty - dmgQty);

                              return (
                                <tr key={item.id || idx}>
                                  <td className="ps-3 text-muted fs-13">{idx + 1}</td>
                                  <td>
                                    <span className="fw-semibold text-dark fs-13" style={{ color: "#000000" }}>
                                      {item.product_name}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-muted border fs-11">
                                      {item.sku || "N/A"}
                                    </span>
                                  </td>

                                  {/* CLEAN THEME-BASED QUANTITY COLUMN */}
                                  <td className="text-center">
                                    <div className="d-flex flex-column align-items-center justify-content-center">
                                      <span
                                        className="badge bg-light text-dark border fw-bold fs-12 px-2.5 py-1"
                                        style={{ minWidth: "48px" }}
                                      >
                                        {Number(item.quantity).toLocaleString("en-IN")}
                                      </span>
                                      {damagedEntry && (
                                        <span
                                          className="badge bg-danger-subtle text-danger border border-danger-subtle fs-10 mt-1"
                                          style={{ fontWeight: 600 }}
                                        >
                                          -{dmgQty} damaged
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="text-end text-muted fs-13">
                                    ₹{Number(item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-end fw-bold text-dark fs-13" style={{ color: "#000000" }}>
                                    ₹{Number(item.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>

                                  {/* SUBTRACT DAMAGED ACTION */}
                                  <td className="text-center pe-3">
                                    {!damagedEntry ? (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2.5 fs-12 rounded-2 shadow-none"
                                        onClick={() => handleAddDamagedUnit(item)}
                                        title="Subtract units to mark as damaged"
                                      >
                                        <i className="feather icon-minus fs-12" />
                                        <span>Mark Damaged</span>
                                      </button>
                                    ) : (
                                      <div className="d-inline-flex align-items-center gap-1 border border-danger-subtle rounded-2 p-1 bg-white">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-light border-0 p-1 d-flex align-items-center justify-content-center shadow-none text-danger"
                                          style={{ width: "24px", height: "24px" }}
                                          onClick={() => handleStepDamagedUnit(item.id, -1)}
                                          title="Subtract one unit"
                                        >
                                          <i className="feather icon-minus fs-11" />
                                        </button>
                                        <span className="badge bg-danger text-white px-2 py-1 fs-11 fw-bold" style={{ minWidth: "28px" }}>
                                          {damagedEntry.damagedQuantity}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-light border-0 p-1 d-flex align-items-center justify-content-center shadow-none text-danger"
                                          style={{ width: "24px", height: "24px" }}
                                          disabled={damagedEntry.damagedQuantity >= totalQty}
                                          onClick={() => handleStepDamagedUnit(item.id, 1)}
                                          title="Mark one more unit damaged"
                                        >
                                          <i className="feather icon-plus fs-11" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan={3} className="ps-3 fw-bold text-dark fs-13" style={{ color: "#000000" }}>
                                Invoice Grand Total
                              </td>
                              <td className="text-center fw-bold text-dark fs-13" style={{ color: "#000000" }}>
                                {selectedInvoice.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} units
                              </td>
                              <td></td>
                              <td className="text-end fw-bold text-dark fs-14" style={{ color: "#000000" }}>
                                ₹{Number(selectedInvoice.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-center pe-3">
                                {totalDamagedUnits > 0 && (
                                  <span className="badge bg-danger text-white fs-11">
                                    {totalDamagedUnits} Damaged
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Damaged Products Listed Below */}
                  <div className="mt-4 pt-4 border-top">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-2 bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <i className="feather icon-alert-triangle text-danger fs-16" />
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0" style={{ color: "#000000" }}>
                            Damaged Products List
                          </h6>
                          <span className="text-muted fs-12">
                            Units subtracted from this invoice to mark as damaged inventory
                          </span>
                        </div>
                      </div>
                      {damagedItems.length > 0 && (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1.5 fs-12 fw-semibold">
                          {totalDamagedUnits} damaged units marked
                        </span>
                      )}
                    </div>

                    {damagedItems.length === 0 ? (
                      <div className="p-4 text-center border border-dashed rounded-3 bg-light text-muted fs-13">
                        <i className="feather icon-alert-triangle text-muted mb-2 d-block mx-auto opacity-50 fs-24" />
                        <span>No damaged products selected yet. Click the <strong>Mark Damaged (-)</strong> button on any item in the table above to subtract damaged units.</span>
                      </div>
                    ) : (
                      <div>
                        <div className="table-responsive border rounded-3 overflow-hidden mb-3">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr className="fs-12 text-muted text-uppercase">
                                <th style={{ width: "40px" }} className="ps-3">#</th>
                                <th>Product Name</th>
                                <th>SKU / Variant</th>
                                <th className="text-center" style={{ width: "160px" }}>Damaged Quantity</th>
                                <th className="text-end">Unit Price</th>
                                <th className="text-end">Total Loss</th>
                                <th style={{ width: "230px" }}>Damage Reason</th>
                                <th style={{ width: "200px" }}>Notes / Remarks</th>
                                <th className="text-center pe-3" style={{ width: "60px" }}>Remove</th>
                              </tr>
                            </thead>
                            <tbody>
                              {damagedItems.map((dmg, idx) => (
                                <tr key={dmg.id}>
                                  <td className="ps-3 text-muted fs-13">{idx + 1}</td>
                                  <td>
                                    <span className="fw-semibold text-dark fs-13" style={{ color: "#000000" }}>
                                      {dmg.productName}
                                    </span>
                                    <span className="text-muted d-block fs-11">
                                      Invoice Qty: {dmg.invoiceQuantity}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-muted border fs-11">
                                      {dmg.sku || "N/A"}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <div className="d-inline-flex align-items-center border rounded-2 bg-white">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border-0 px-2 py-1 shadow-none"
                                        onClick={() => handleStepDamagedUnit(dmg.id, -1)}
                                        disabled={dmg.damagedQuantity <= 1}
                                        title="Decrease quantity"
                                      >
                                        <i className="feather icon-minus fs-12" />
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        max={dmg.invoiceQuantity}
                                        className="form-control form-control-sm text-center border-0 fw-bold px-1"
                                        style={{ width: "55px", boxShadow: "none" }}
                                        value={dmg.damagedQuantity}
                                        onChange={(e) => handleSetDamagedQty(dmg.id, parseInt(e.target.value) || 1)}
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-light border-0 px-2 py-1 shadow-none"
                                        onClick={() => handleStepDamagedUnit(dmg.id, 1)}
                                        disabled={dmg.damagedQuantity >= dmg.invoiceQuantity}
                                        title="Increase quantity"
                                      >
                                        <i className="feather icon-plus fs-12" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="text-end text-muted fs-13">
                                    ₹{dmg.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="text-end fw-bold text-danger fs-13">
                                    ₹{dmg.totalLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </td>
                                  <td>
                                    <select
                                      className="form-select form-select-sm fs-12 shadow-none"
                                      value={dmg.reason}
                                      onChange={(e) => handleUpdateReason(dmg.id, e.target.value)}
                                    >
                                      <option value="Physical / Handling Damage">Physical / Handling Damage</option>
                                      <option value="Transport / Shipping Damage">Transport / Shipping Damage</option>
                                      <option value="Pest / Disease Infection">Pest / Disease Infection</option>
                                      <option value="Rotting / Wilting / Drying">Rotting / Wilting / Drying</option>
                                      <option value="Broken Pot / Damaged Container">Broken Pot / Container</option>
                                      <option value="Supplier Quality Defect">Supplier Quality Defect</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm fs-12 shadow-none"
                                      placeholder="Optional notes..."
                                      value={dmg.notes || ""}
                                      onChange={(e) => handleUpdateNotes(dmg.id, e.target.value)}
                                    />
                                  </td>
                                  <td className="text-center pe-3">
                                    <button
                                      type="button"
                                      className="btn btn-sm p-1 text-danger border-0 bg-transparent shadow-none"
                                      onClick={() => handleRemoveDamaged(dmg.id)}
                                      title="Remove from damaged list"
                                    >
                                      <i className="feather icon-trash-2 fs-15" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="table-light">
                              <tr>
                                <td colSpan={3} className="ps-3 fw-bold text-dark fs-13" style={{ color: "#000000" }}>
                                  Total Damage Summary
                                </td>
                                <td className="text-center fw-bold text-danger fs-13">
                                  {totalDamagedUnits} damaged units
                                </td>
                                <td></td>
                                <td className="text-end fw-bold text-danger fs-14">
                                  ₹{totalLossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </td>
                                <td colSpan={3}></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Save Actions Bar */}
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-light rounded-3 border mt-3">
                          <div className="fs-13 text-dark">
                            Ready to record <strong>{damagedItems.length}</strong> product line(s) totaling{" "}
                            <strong className="text-danger">{totalDamagedUnits} damaged units</strong> (₹
                            {totalLossAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} loss) from{" "}
                            <strong>{selectedInvoice.po_number}</strong>.
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary px-3 py-2 fs-13 shadow-none rounded-2"
                              onClick={() => setViewMode("list")}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary d-inline-flex align-items-center gap-1.5 px-4 py-2 fs-13 fw-semibold shadow-none rounded-2"
                              disabled={isSaving || damagedItems.length === 0}
                              onClick={handleSaveDamageTracking}
                            >
                              {isSaving ? (
                                <>
                                  <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <i className="feather icon-check-square fs-14" />
                                  <span>Save Damage Tracking</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes (if any) */}
                  {selectedInvoice.notes && (
                    <div className="p-3 rounded-2 bg-light border fs-12 text-muted mt-3">
                      <strong>Notes:</strong> {selectedInvoice.notes}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Empty Placeholder State when no invoice is selected */
              <div className="card border-0 shadow-sm rounded-3 text-center py-5 px-3">
                <div
                  className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: "64px", height: "64px" }}
                >
                  <i className="feather icon-file-text text-muted fs-28" />
                </div>
                <h5 className="fw-bold text-dark mb-1" style={{ color: "#000000" }}>
                  No Purchase Invoice Selected
                </h5>
                <p className="text-muted fs-13 mx-auto mb-3" style={{ maxWidth: "420px" }}>
                  Start typing an invoice number, PO number, or supplier name in the field above to see matching suggestions and load the invoice preview.
                </p>
                <div className="d-inline-flex align-items-center justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-3 shadow-none"
                    onClick={() => {
                      setShowDropdown(true);
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                  >
                    Browse Invoices
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DamageTracking;
