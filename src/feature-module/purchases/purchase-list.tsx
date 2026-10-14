import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getActiveBusinessId } from "../../services/api";
import {
  batchService,
  BatchRecord,
  PurchaseItem,
  ExpenseBreakdown,
} from "../../services/batchService";
import CommonSelect from "../../components/select/common-select";
import "../../styles/purchase-batch.css";
import {
  Plus,
  Calculator,
  Save,
  ArrowLeft,
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
} from "lucide-react";

interface SupplierOption {
  id: string;
  name: string;
}

const DEFAULT_EXPENSE_BREAKDOWN: ExpenseBreakdown = {
  freight: 0,
  labour: 0,
  transport: 0,
  packaging: 0,
  other: 0,
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

export const PurchasesList: React.FC = () => {
  const navigate = useNavigate();

  // View state: "list" | "create"
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchForView, setSelectedBatchForView] = useState<BatchRecord | null>(null);

  // Form State
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [batchNo, setBatchNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([createEmptyItem(1)]);

  // Expenses State
  const [totalExpenseAmount, setTotalExpenseAmount] = useState<number>(0);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdown>({
    freight: 0,
    labour: 0,
    transport: 0,
    packaging: 0,
    other: 0,
  });
  const [showBreakdown, setShowBreakdown] = useState(true);

  // Calculation Results
  const [calcDone, setCalcDone] = useState(false);
  const [calculatedExpensePercent, setCalculatedExpensePercent] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Suppliers & Products for Auto-complete
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);

  // Load initial Batches & Reference data
  const loadBatches = useCallback(() => {
    const list = batchService.getBatches();
    setBatches(list);
  }, []);

  useEffect(() => {
    loadBatches();

    // Fetch suppliers from backend if available
    api
      .get<any[]>("/suppliers")
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSuppliers(res.map((s) => ({ id: s.id, name: s.name })));
        } else {
          setSuppliers([]);
        }
      })
      .catch(() => {
        setSuppliers([]);
      });

    // Fetch products for auto-filling item suggestions
    const bizId = getActiveBusinessId();
    api
      .get<any[]>("/products", { business_id: bizId })
      .then((res) => {
        if (Array.isArray(res)) {
          setProductSuggestions(res);
        }
      })
      .catch(() => {
        setProductSuggestions([]);
      });
  }, [loadBatches]);

  // Overall Statistics
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
        b.batchNo.toLowerCase().includes(q) ||
        b.supplierName.toLowerCase().includes(q) ||
        b.invoiceNo.toLowerCase().includes(q) ||
        b.items.some(
          (it) =>
            it.productName.toLowerCase().includes(q) ||
            (it.sku && it.sku.toLowerCase().includes(q))
        )
    );
  }, [batches, searchQuery]);

  // Helper to Auto Generate Batch Number
  const handleAutoGenerateBatchNo = () => {
    const year = new Date().getFullYear();
    const seq = String(batches.length + 1).padStart(3, "0");
    setBatchNo(`BATCH-${year}-${seq}`);
  };

  // Add Item Row
  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem(prev.length + 1)]);
    setCalcDone(false);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("At least one purchase item is required in a batch.");
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

  // Auto-fill item from suggested product
  const handleSelectProductSuggestion = (itemId: string, prod: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const pPrice = Number(prod.cost_price ?? prod.purchase_price ?? prod.price ?? 0);
        const sPrice = Number(prod.selling_price ?? prod.sale_price ?? prod.price ?? 0);
        return {
          ...it,
          productId: String(prod.id),
          productName: prod.name || prod.product || it.productName,
          sku: prod.sku || it.sku,
          quantity: it.quantity > 0 ? it.quantity : 1,
          remainingQty: it.quantity > 0 ? it.quantity : 1,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          actualCost: pPrice,
        };
      })
    );
    setCalcDone(false);
  };

  // Update Expense Breakdown field & sum into totalExpenseAmount
  const handleUpdateBreakdown = (field: keyof ExpenseBreakdown, val: number) => {
    const updated = {
      ...expenseBreakdown,
      [field]: val >= 0 ? val : 0,
    };
    setExpenseBreakdown(updated);
    const sum =
      (updated.freight || 0) +
      (updated.labour || 0) +
      (updated.transport || 0) +
      (updated.packaging || 0) +
      (updated.other || 0);
    setTotalExpenseAmount(sum);
    setCalcDone(false);
  };

  // CALCULATE BUTTON ACTION
  // Expense % = (Expense Amount ÷ Purchase Price) × 100
  // Actual Cost = Purchase Price + Expense Amount (or Purchase Price + Purchase Price * Expense %)
  const handleCalculate = () => {
    setFormError(null);

    // Calculate total purchase value
    const totalPurchaseValue = items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0),
      0
    );

    if (totalPurchaseValue <= 0) {
      setFormError(
        "Prevent divide-by-zero: Total purchase value is ₹0. Please enter valid item quantities and purchase prices (> 0) to calculate Expense %."
      );
      return;
    }

    const res = batchService.calculateBatch(items, totalExpenseAmount);
    setCalculatedExpensePercent(res.expensePercent);
    setItems(res.calculatedItems);
    setCalcDone(true);
    setFormSuccess(
      `Calculation successful! Expense % = ${res.expensePercent}%. Item actual costs updated.`
    );
    setTimeout(() => setFormSuccess(null), 4000);
  };

  // Start Create Batch Form
  const handleOpenCreateForm = (existing?: BatchRecord) => {
    setFormError(null);
    setFormSuccess(null);
    if (existing) {
      setEditingBatchId(existing.id);
      setBatchNo(existing.batchNo);
      setPurchaseDate(existing.purchaseDate);
      setSupplierName(existing.supplierName);
      setInvoiceNo(existing.invoiceNo);
      setNotes(existing.notes || "");
      setItems(existing.items.map((it) => ({ ...it })));
      setTotalExpenseAmount(existing.totalExpenseAmount);
      setExpenseBreakdown(existing.expenseBreakdown || DEFAULT_EXPENSE_BREAKDOWN);
      setCalculatedExpensePercent(existing.expensePercent);
      setCalcDone(true);
    } else {
      setEditingBatchId(null);
      const year = new Date().getFullYear();
      const seq = String(batches.length + 1).padStart(3, "0");
      setBatchNo(`BATCH-${year}-${seq}`);
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setSupplierName("");
      setInvoiceNo("");
      setNotes("");
      setItems([createEmptyItem(1)]);
      setTotalExpenseAmount(0);
      setExpenseBreakdown({ ...DEFAULT_EXPENSE_BREAKDOWN });
      setCalculatedExpensePercent(0);
      setCalcDone(false);
    }
    setViewMode("create");
  };

  // SAVE BATCH ACTION
  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!batchNo.trim()) {
      setFormError("Batch Name / Batch No. is required.");
      return;
    }

    // Check unique batch name
    if (!batchService.isBatchNameUnique(batchNo, editingBatchId || undefined)) {
      setFormError(`Batch name "${batchNo}" already exists. Batch names must be unique.`);
      return;
    }

    if (!supplierName.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    if (!invoiceNo.trim()) {
      setFormError("Invoice / Bill Number is required.");
      return;
    }

    if (items.length === 0) {
      setFormError("At least one purchase item is required.");
      return;
    }

    // Ensure items have names and quantities
    for (const it of items) {
      if (!it.productName.trim()) {
        setFormError("All purchase items must have a Product Name.");
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

    // Execute calculation to ensure sync
    const res = batchService.calculateBatch(items, totalExpenseAmount);

    const record: BatchRecord = {
      id: editingBatchId || `batch-${Date.now()}`,
      batchNo: batchNo.trim(),
      purchaseDate,
      supplierName: supplierName.trim(),
      invoiceNo: invoiceNo.trim(),
      notes: notes.trim(),
      items: res.calculatedItems,
      totalPurchaseValue: res.totalPurchaseValue,
      totalExpenseAmount: Number(totalExpenseAmount) || 0,
      expenseBreakdown,
      expensePercent: res.expensePercent,
      createdAt: new Date().toISOString(),
    };

    batchService.saveBatch(record);
    loadBatches();
    setViewMode("list");
  };

  // Delete Batch
  const handleDeleteBatch = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete batch "${name}"?`)) {
      batchService.deleteBatch(id);
      loadBatches();
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content pb-wrapper">
        {/* Page Top Header */}
        <div className="pb-header">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Package size={26} className="text-secondary" />
              <h4 className="pb-title">Purchase &amp; Batch Management</h4>
            </div>
            <p className="pb-subtitle">
              Manage purchase batches, bill values, landing expenses, and actual cost calculations.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {viewMode === "create" ? (
              <button
                type="button"
                className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
                onClick={() => setViewMode("list")}
              >
                <ArrowLeft size={16} /> Back to Batch List
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={() => handleOpenCreateForm()}
              >
                <Plus size={18} /> Create New Batch
              </button>
            )}
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="pb-stats-grid">
          <div className="pb-stat-card">
            <div className="pb-stat-icon">
              <Package size={22} />
            </div>
            <div className="pb-stat-content">
              <h6>Total Batches</h6>
              <h3>{stats.count}</h3>
            </div>
          </div>

          <div className="pb-stat-card">
            <div className="pb-stat-icon">
              <DollarSign size={22} />
            </div>
            <div className="pb-stat-content">
              <h6>Total Purchase Value</h6>
              <h3>₹{stats.totalPurchase.toLocaleString("en-IN")}</h3>
            </div>
          </div>

          <div className="pb-stat-card">
            <div className="pb-stat-icon">
              <Truck size={22} />
            </div>
            <div className="pb-stat-content">
              <h6>Total Expenses</h6>
              <h3>₹{stats.totalExp.toLocaleString("en-IN")}</h3>
            </div>
          </div>

          <div className="pb-stat-card">
            <div className="pb-stat-icon">
              <Percent size={22} />
            </div>
            <div className="pb-stat-content">
              <h6>Avg Expense %</h6>
              <h3>{stats.avgExpensePercent}%</h3>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VIEW MODE 1: BATCH LIST TABLE                               */}
        {/* ============================================================ */}
        {viewMode === "list" && (
          <div className="pb-card">
            <div className="pb-card-header">
              <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <h5 className="pb-card-title">
                  <Package size={18} className="text-secondary" />
                  All Purchase Batches ({filteredBatches.length})
                </h5>

                <div className="d-flex align-items-center gap-2" style={{ maxWidth: 350 }}>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                      <Search size={14} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search batch, supplier, invoice, product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-card-body p-0">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-5">
                  <Package size={48} className="text-muted mb-2 opacity-50" />
                  <h6 className="fw-bold text-muted">No Batches Found</h6>
                  <p className="text-muted fs-13 mb-3">
                    {searchQuery
                      ? "No batches matched your search query."
                      : "No purchase batches have been created yet."}
                  </p>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleOpenCreateForm()}
                  >
                    <Plus size={14} className="me-1" /> Create First Batch
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr className="fs-12 text-uppercase text-secondary">
                        <th style={{ width: "16%" }}>Batch Name / No.</th>
                        <th style={{ width: "11%" }}>Purchase Date</th>
                        <th style={{ width: "20%" }}>Supplier</th>
                        <th style={{ width: "13%" }}>Invoice No.</th>
                        <th style={{ width: "13%" }} className="text-end">
                          Purchase Value
                        </th>
                        <th style={{ width: "11%" }} className="text-end">
                          Total Expense
                        </th>
                        <th style={{ width: "10%" }} className="text-center">
                          Expense %
                        </th>
                        <th style={{ width: "16%" }} className="text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="fs-13">
                      {filteredBatches.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="pb-batch-badge">{b.batchNo}</span>
                            </div>
                            <div className="text-muted fs-11 mt-1">
                              {b.items.length} item{b.items.length !== 1 ? "s" : ""}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1 text-secondary">
                              <Calendar size={13} />
                              {b.purchaseDate}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{b.supplierName}</div>
                            {b.notes && (
                              <div
                                className="text-muted fs-11 text-truncate"
                                style={{ maxWidth: 200 }}
                              >
                                {b.notes}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {b.invoiceNo || "-"}
                            </span>
                          </td>
                          <td className="text-end fw-bold text-dark">
                            ₹{Number(b.totalPurchaseValue || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-end text-secondary fw-semibold">
                            ₹{Number(b.totalExpenseAmount || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-center">
                            <span className="pb-expense-badge">
                              {b.expensePercent}%
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-inline-flex align-items-center gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light text-primary"
                                title="View Batch Details"
                                onClick={() => setSelectedBatchForView(b)}
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light text-secondary"
                                title="Edit Batch"
                                onClick={() => handleOpenCreateForm(b)}
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light text-danger"
                                title="Delete Batch"
                                onClick={() => handleDeleteBatch(b.id, b.batchNo)}
                              >
                                <Trash2 size={15} />
                              </button>
                              <Link
                                to={`/add-product?batchId=${b.id}&expensePercent=${b.expensePercent}&batchName=${encodeURIComponent(
                                  b.batchNo
                                )}`}
                                className="btn btn-sm btn-outline-secondary ms-1 py-1 px-2 fs-11 d-inline-flex align-items-center gap-1"
                                title="Use this Batch to Add Product"
                              >
                                <Plus size={12} /> Add Product
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW MODE 2: CREATE / EDIT BATCH FORM                       */}
        {/* ============================================================ */}
        {viewMode === "create" && (
          <form onSubmit={handleSaveBatch}>
            {formError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                <CheckCircle2 size={18} />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Step 1: Batch Header Details */}
            <div className="pb-card">
              <div className="pb-card-header">
                <h5 className="pb-card-title">
                  <Package size={18} className="text-secondary" />
                  1. Batch Details
                </h5>
                <span className="badge bg-light text-dark border fs-12">
                  {editingBatchId ? "Editing Batch" : "New Batch Entry"}
                </span>
              </div>

              <div className="pb-card-body">
                <div className="pb-form-grid">
                  {/* Batch Name */}
                  <div className="pb-form-group">
                    <label className="pb-label">
                      Batch Name / Batch No. <span className="req">*</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="pb-input"
                        placeholder="e.g. BATCH-2026-001"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleAutoGenerateBatchNo}
                        title="Generate Next Batch Number"
                      >
                        <Sparkles size={14} className="me-1" /> Auto
                      </button>
                    </div>
                    <small className="text-muted fs-11">
                      Must be unique across all purchase entries.
                    </small>
                  </div>

                  {/* Purchase Date */}
                  <div className="pb-form-group">
                    <label className="pb-label">
                      Purchase Date <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      className="pb-input"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Supplier Name */}
                  <div className="pb-form-group">
                    <label className="pb-label">
                      Supplier Name <span className="req">*</span>
                    </label>
                    {suppliers.length > 0 ? (
                      <div className="d-flex flex-column gap-1">
                        <CommonSelect
                          value={suppliers.some((s) => s.name === supplierName) ? supplierName : ""}
                          options={[
                            { label: "-- Select Existing Supplier --", value: "" },
                            ...suppliers.map((s) => ({ label: s.name, value: s.name })),
                          ]}
                          placeholder="Select existing supplier..."
                          onChange={(e) => {
                            if (e.value) setSupplierName(e.value);
                          }}
                        />
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Or type supplier name"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          required
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="pb-input"
                        placeholder="e.g. Supplier Name"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  {/* Invoice / Bill Number */}
                  <div className="pb-form-group">
                    <label className="pb-label">
                      Invoice / Bill Number <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="pb-input"
                      placeholder="e.g. INV-1001"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <label className="pb-label">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    className="pb-textarea mt-1"
                    placeholder="Enter transport details, vehicle number, or batch remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Purchase Items Grid */}
            <div className="pb-card">
              <div className="pb-card-header">
                <div className="d-flex align-items-center justify-content-between w-100">
                  <h5 className="pb-card-title">
                    <Package size={18} className="text-secondary" />
                    2. Purchase Items (One row per product or variant)
                  </h5>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                    onClick={handleAddItem}
                  >
                    <Plus size={14} /> Add Item Row
                  </button>
                </div>
              </div>

              <div className="pb-card-body p-0">
                <div className="table-responsive">
                  <table className="pb-items-table">
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th style={{ minWidth: "240px" }}>Product &amp; Variant</th>
                        <th style={{ width: "120px" }}>SKU</th>
                        <th style={{ width: "100px" }}>Qty</th>
                        <th style={{ width: "140px" }}>Purchase Price (₹/unit)</th>
                        <th style={{ width: "140px" }}>Selling Price (₹/unit)</th>
                        <th style={{ width: "120px" }} className="text-end">
                          Line Total (₹)
                        </th>
                        <th style={{ width: "130px" }} className="text-end">
                          Actual Cost (₹/unit)
                        </th>
                        <th style={{ width: "50px" }} className="text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const lineTotal = (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0);
                        return (
                          <tr key={it.id}>
                            <td className="text-muted fw-bold text-center">{idx + 1}</td>
                            <td>
                              {productSuggestions.length > 0 && (
                                <div className="mb-1" style={{ minWidth: 220 }}>
                                  <CommonSelect
                                    value={it.productId || ""}
                                    options={[
                                      { label: "-- Select from Catalog --", value: "" },
                                      ...productSuggestions.map((ps) => ({
                                        label: `${ps.name || ps.product || "Product"}${ps.sku ? ` (${ps.sku})` : ""}`,
                                        value: String(ps.id),
                                      })),
                                    ]}
                                    placeholder="Pick catalog product..."
                                    onChange={(e) => {
                                      if (!e.value) {
                                        handleUpdateItem(it.id, "productId", "");
                                        return;
                                      }
                                      const matched = productSuggestions.find((p) => String(p.id) === String(e.value));
                                      if (matched) {
                                        handleSelectProductSuggestion(it.id, matched);
                                      }
                                    }}
                                  />
                                </div>
                              )}
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Product Name & Variant"
                                value={it.productName}
                                onChange={(e) =>
                                  handleUpdateItem(it.id, "productName", e.target.value)
                                }
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="e.g. SKU-001"
                                value={it.sku}
                                onChange={(e) => handleUpdateItem(it.id, "sku", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                className="form-control form-control-sm text-center"
                                value={it.quantity || ""}
                                onChange={(e) =>
                                  handleUpdateItem(it.id, "quantity", Number(e.target.value))
                                }
                                required
                              />
                            </td>
                            <td>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-control"
                                  value={it.purchasePrice || ""}
                                  onChange={(e) =>
                                    handleUpdateItem(it.id, "purchasePrice", Number(e.target.value))
                                  }
                                  required
                                />
                              </div>
                            </td>
                            <td>
                              <div className="input-group input-group-sm">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-control"
                                  value={it.sellingPrice || ""}
                                  onChange={(e) =>
                                    handleUpdateItem(it.id, "sellingPrice", Number(e.target.value))
                                  }
                                  required
                                />
                              </div>
                            </td>
                            <td className="text-end fw-bold text-dark">
                              ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="text-end fw-bold text-dark">
                              ₹{Number(it.actualCost || it.purchasePrice).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light text-danger"
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
                        <td colSpan={3} className="fw-bold text-secondary text-end">
                          Total Items: {items.length}
                        </td>
                        <td className="fw-bold">
                          {items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} units
                        </td>
                        <td colSpan={2} className="fw-bold text-secondary text-end">
                          Total Purchase Value (Bill Value):
                        </td>
                        <td className="text-end fw-bolder fs-14 text-dark">
                          ₹
                          {items
                            .reduce(
                              (acc, it) =>
                                acc + (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0),
                              0
                            )
                            .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Step 3: Expenses & Calculate Button */}
            <div className="pb-card">
              <div className="pb-card-header">
                <h5 className="pb-card-title">
                  <Truck size={18} className="text-secondary" />
                  3. Expense Details &amp; Landing Cost Calculation
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 text-secondary fw-bold"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                >
                  {showBreakdown ? "- Hide Expense Breakdown" : "+ Show Expense Breakdown"}
                </button>
              </div>

              <div className="pb-card-body">
                {/* Total Expense Input */}
                <div className="row g-3 align-items-center mb-3">
                  <div className="col-md-5">
                    <label className="pb-label mb-1">
                      Total Expense Amount (Freight, Labour, Transport, etc.) <span className="req">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text fw-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control form-control-lg fw-bold text-primary"
                        value={totalExpenseAmount}
                        onChange={(e) => {
                          setTotalExpenseAmount(Number(e.target.value) || 0);
                          setCalcDone(false);
                        }}
                        placeholder="e.g. 0"
                        required
                      />
                    </div>
                    <small className="text-muted fs-11">
                      Direct bill expenses incurred for landing this batch.
                    </small>
                  </div>

                  <div className="col-md-7 d-flex align-items-end">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2 px-4 shadow-sm"
                      onClick={handleCalculate}
                    >
                      <Calculator size={20} />
                      Calculate Expense % &amp; Actual Cost
                    </button>
                  </div>
                </div>

                {/* Optional Breakdown */}
                {showBreakdown && (
                  <div className="bg-light p-3 rounded-3 mb-3 border">
                    <h6 className="fw-bold fs-12 text-secondary mb-2 text-uppercase">
                      Optional Breakdown by Expense Type
                    </h6>
                    <div className="row g-2">
                      <div className="col-sm-6 col-md">
                        <label className="pb-label fs-11">Freight (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={expenseBreakdown.freight || 0}
                          onChange={(e) =>
                            handleUpdateBreakdown("freight", Number(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-sm-6 col-md">
                        <label className="pb-label fs-11">Labour &amp; Loading (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={expenseBreakdown.labour || 0}
                          onChange={(e) =>
                            handleUpdateBreakdown("labour", Number(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-sm-6 col-md">
                        <label className="pb-label fs-11">Transport &amp; Toll (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={expenseBreakdown.transport || 0}
                          onChange={(e) =>
                            handleUpdateBreakdown("transport", Number(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-sm-6 col-md">
                        <label className="pb-label fs-11">Packaging &amp; Crates (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={expenseBreakdown.packaging || 0}
                          onChange={(e) =>
                            handleUpdateBreakdown("packaging", Number(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-sm-6 col-md">
                        <label className="pb-label fs-11">Other / Misc (₹)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={expenseBreakdown.other || 0}
                          onChange={(e) =>
                            handleUpdateBreakdown("other", Number(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Calculation Output Box */}
                <div className="pb-calc-box">
                  <h6 className="pb-calc-title">
                    <Sparkles size={16} />
                    Calculated Landed Cost Metrics
                  </h6>

                  <div className="pb-calc-metrics">
                    <div className="pb-calc-metric-item">
                      <div className="sub">Formula</div>
                      <div className="fs-12 fw-bold text-dark mt-1">
                        (Expense ÷ Purchase) × 100
                      </div>
                    </div>

                    <div className="pb-calc-metric-item">
                      <div className="sub">Expense %</div>
                      <div className="val">{calculatedExpensePercent}%</div>
                    </div>

                    <div className="pb-calc-metric-item">
                      <div className="sub">Example Actual Cost</div>
                      <div className="val">
                        ₹{(100 + (100 * calculatedExpensePercent) / 100).toFixed(2)}
                      </div>
                      <small className="text-muted fs-11">For ₹100 unit price</small>
                    </div>

                    <div className="pb-calc-metric-item">
                      <div className="sub">Calculation Status</div>
                      <div className="mt-1">
                        {calcDone ? (
                          <span className="badge bg-primary text-white">Calculated &amp; Applied</span>
                        ) : (
                          <span className="badge bg-warning text-dark">Click Calculate to Sync</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-white rounded-2 border d-flex align-items-center gap-2 fs-12 text-muted">
                    <Info size={16} className="text-secondary flex-shrink-0" />
                    <span>
                      <strong>Example Rule:</strong> Purchase price ₹100 and expense ₹80 give an
                      actual cost of ₹180 and an expense % of 80%. When saved, all purchase items
                      are stored with this batch and can be pulled into Add Product.
                    </span>
                  </div>
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="d-flex align-items-center justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => setViewMode("list")}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-inline-flex align-items-center gap-2"
                  >
                    <Save size={18} />
                    {editingBatchId ? "Update Batch Record" : "Save Batch & Purchases"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* VIEW BATCH DETAILS MODAL                                     */}
        {/* ============================================================ */}
        {selectedBatchForView && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content border-0 shadow">
                <div className="modal-header bg-light">
                  <div>
                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                      <Package size={20} className="text-secondary" />
                      Batch Details: {selectedBatchForView.batchNo}
                    </h5>
                    <span className="text-muted fs-12">
                      Purchased on {selectedBatchForView.purchaseDate}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedBatchForView(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {/* Header info */}
                  <div className="row g-3 mb-4 p-3 bg-light rounded-3 border">
                    <div className="col-md-3">
                      <div className="text-muted fs-11 text-uppercase fw-bold">Supplier</div>
                      <div className="fw-bold text-dark">{selectedBatchForView.supplierName}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted fs-11 text-uppercase fw-bold">Invoice / Bill</div>
                      <div className="fw-bold text-dark">{selectedBatchForView.invoiceNo}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted fs-11 text-uppercase fw-bold">Purchase Value</div>
                      <div className="fw-bold text-primary">
                        ₹
                        {Number(selectedBatchForView.totalPurchaseValue).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted fs-11 text-uppercase fw-bold">Expense %</div>
                      <div className="fw-bold text-dark fs-15">
                        {selectedBatchForView.expensePercent}% (₹
                        {Number(selectedBatchForView.totalExpenseAmount).toLocaleString("en-IN")})
                      </div>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {selectedBatchForView.notes && (
                    <div className="mb-4 p-2 px-3 bg-white rounded border fs-12 text-secondary">
                      <strong>Notes:</strong> {selectedBatchForView.notes}
                    </div>
                  )}

                  {/* Items Sub-table */}
                  <h6 className="fw-bold fs-13 mb-2 text-dark">
                    Purchase Items Mapped to this Batch ({selectedBatchForView.items.length})
                  </h6>
                  <div className="table-responsive border rounded-3 mb-3">
                    <table className="table table-sm align-middle mb-0 fs-12">
                      <thead className="table-light">
                        <tr>
                          <th>Item Name</th>
                          <th>SKU</th>
                          <th className="text-center">Total Qty</th>
                          <th className="text-center">Stock Left</th>
                          <th className="text-end">Purchase Price</th>
                          <th className="text-end">Actual Cost</th>
                          <th className="text-end">Selling Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBatchForView.items.map((it) => (
                          <tr key={it.id}>
                            <td className="fw-semibold text-dark">
                              {it.productName}
                              {it.variantName && (
                                <span className="text-muted fs-11 ms-1">({it.variantName})</span>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {it.sku || "-"}
                              </span>
                            </td>
                            <td className="text-center">{it.quantity}</td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark border fw-bold">
                                {it.remainingQty}
                              </span>
                            </td>
                            <td className="text-end">
                              ₹{Number(it.purchasePrice).toFixed(2)}
                            </td>
                            <td className="text-end fw-bold text-dark">
                              ₹{Number(it.actualCost).toFixed(2)}
                            </td>
                            <td className="text-end fw-bold text-primary">
                              ₹{Number(it.sellingPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Expense Breakdown Display */}
                  {selectedBatchForView.expenseBreakdown && (
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="text-muted fs-11 fw-bold text-uppercase mb-2">
                        Expense Breakdown Details
                      </div>
                      <div className="row g-2 fs-12">
                        <div className="col-auto">
                          Freight:{" "}
                          <strong>₹{selectedBatchForView.expenseBreakdown.freight || 0}</strong>
                        </div>
                        <div className="col-auto">•</div>
                        <div className="col-auto">
                          Labour:{" "}
                          <strong>₹{selectedBatchForView.expenseBreakdown.labour || 0}</strong>
                        </div>
                        <div className="col-auto">•</div>
                        <div className="col-auto">
                          Transport:{" "}
                          <strong>₹{selectedBatchForView.expenseBreakdown.transport || 0}</strong>
                        </div>
                        <div className="col-auto">•</div>
                        <div className="col-auto">
                          Packaging:{" "}
                          <strong>₹{selectedBatchForView.expenseBreakdown.packaging || 0}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedBatchForView(null)}
                  >
                    Close
                  </button>
                  <Link
                    to={`/add-product?batchId=${selectedBatchForView.id}&expensePercent=${selectedBatchForView.expensePercent}&batchName=${encodeURIComponent(
                      selectedBatchForView.batchNo
                    )}`}
                    className="btn btn-primary d-inline-flex align-items-center gap-1"
                  >
                    <Plus size={16} /> Proceed to Add Product with this Batch
                  </Link>
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
