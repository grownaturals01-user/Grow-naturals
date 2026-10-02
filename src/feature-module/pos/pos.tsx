import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import { api } from "../../services/api";
import { printService } from "../../services/printService";
import confetti from "canvas-confetti";

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  selling_price?: number;
  price?: number;
  tax_rate?: number;
  current_stock?: number;
  stock?: number;
  image_url?: string;
  unit?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

interface CustomerOption {
  value: string;
  label: string;
  phone?: string;
  address?: string;
  gstin?: string;
}

const Pos: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [orderTaxPercent, setOrderTaxPercent] = useState<number>(0);

  // Customer State
  const [customers, setCustomers] = useState<CustomerOption[]>([
    { value: "walkin", label: "Walk-in Customer", phone: "", address: "" },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption>(customers[0]);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "CARD" | "SPLIT">("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recentInvoice, setRecentInvoice] = useState<any>(null);

  // Load Products and Customers on Mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, custRes] = await Promise.allSettled([
        api.get<Product[]>("/products"),
        api.get<any[]>("/customers"),
      ]);

      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
        const uniqueCats = Array.from(
          new Set(
            prodRes.value
              .map((p) => p.category?.trim())
              .filter(Boolean) as string[]
          )
        );
        setCategories(uniqueCats);
      }

      if (custRes.status === "fulfilled" && Array.isArray(custRes.value)) {
        const custOptions: CustomerOption[] = [
          { value: "walkin", label: "Walk-in Customer", phone: "", address: "" },
          ...custRes.value.map((c) => ({
            value: c.id,
            label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
            phone: c.phone || "",
            address: c.address || "",
            gstin: c.gstin || "",
          })),
        ];
        setCustomers(custOptions);
      }
    } catch (err) {
      console.error("Failed to load POS data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCat =
        selectedCategory === "all" ||
        (item.category &&
          item.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => {
      return acc + item.unit_price * item.quantity;
    }, 0);

    const taxAmount = cart.reduce((acc, item) => {
      return acc + item.tax_amount;
    }, 0);

    const calculatedTax = orderTaxPercent > 0 ? (subtotal * orderTaxPercent) / 100 : taxAmount;
    const grossTotal = subtotal + calculatedTax - (discountAmount || 0);
    const grandTotal = Math.max(0, Math.round(grossTotal));
    const roundoff = Number((grandTotal - grossTotal).toFixed(2));

    return {
      subtotal,
      taxAmount: calculatedTax,
      roundoff,
      grandTotal,
      itemCount: cart.reduce((acc, item) => acc + item.quantity, 0),
    };
  }, [cart, discountAmount, orderTaxPercent]);

  // Cart Operations
  const addToCart = (product: Product) => {
    const price = product.selling_price || product.price || 0;
    const taxRate = product.tax_rate || 0;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + 1;
        const itemSubtotal = price * newQty;
        const itemTax = (itemSubtotal * taxRate) / 100;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          tax_amount: itemTax,
          total_amount: itemSubtotal + itemTax,
        };
        return updated;
      } else {
        const itemSubtotal = price * 1;
        const itemTax = (itemSubtotal * taxRate) / 100;
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            unit_price: price,
            tax_rate: taxRate,
            tax_amount: itemTax,
            total_amount: itemSubtotal + itemTax,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const itemSubtotal = item.unit_price * qty;
          const itemTax = (itemSubtotal * item.tax_rate) / 100;
          return {
            ...item,
            quantity: qty,
            tax_amount: itemTax,
            total_amount: itemSubtotal + itemTax,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
  };

  // Submit Order / Create Invoice
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const invoicePayload = {
        customer_id: selectedCustomer.value !== "walkin" ? selectedCustomer.value : null,
        customer_name: selectedCustomer.label.split(" (")[0],
        customer_phone: selectedCustomer.phone || "",
        customer_address: selectedCustomer.address || "",
        customer_gstin: selectedCustomer.gstin || "",
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: discountAmount || 0,
        roundoff: totals.roundoff,
        total_amount: totals.grandTotal,
        payment_status: "PAID",
        payment_mode: paymentMode,
        items: cart.map((item) => ({
          product_id: item.product.id,
          item_name: item.product.name,
          sku: item.product.sku || "",
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          discount_amount: 0,
          total_amount: item.total_amount,
        })),
      };

      const res = await api.post("/invoices", invoicePayload);
      setRecentInvoice(res);
      setShowPaymentModal(false);

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Attempt thermal print via ESC/POS bridge if available
      try {
        await printService.printThermal(invoicePayload);
      } catch (printErr) {
        console.warn("ESC/POS print skipped:", printErr);
      }

      clearCart();
    } catch (err: any) {
      alert("Error completing sale: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-wrapper pos-five">
      <div className="page-wrapper pos-pg-wrapper ms-0">
        <div className="content pos-design p-0">
          <div className="row pos-wrapper g-0">
            {/* Left Section: Product Catalog */}
            <div className="col-md-12 col-lg-7 col-xl-8 d-flex flex-column" style={{ minHeight: "calc(100vh - 65px)" }}>
              <div className="pos-categories tabs_wrapper p-3 flex-fill bg-light">
                {/* Search & Header Bar */}
                <div className="d-flex align-items-center justify-content-between flex-wrap mb-3 gap-2">
                  <div>
                    <h5 className="mb-0 fw-bold">Grow Naturals Counter</h5>
                    <small className="text-muted">{new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}</small>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-grow-1 justify-content-end" style={{ maxWidth: "450px" }}>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="ti ti-search" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search product name or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Categories Pills */}
                <div className="category-scroll mb-3 d-flex gap-2 overflow-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`btn btn-sm ${
                      selectedCategory === "all" ? "btn-primary shadow-sm" : "btn-white border"
                    } rounded-pill px-3`}
                  >
                    All Items ({products.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`btn btn-sm ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? "btn-primary shadow-sm"
                          : "btn-white border"
                      } rounded-pill px-3 text-capitalize text-nowrap`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product Tiles Grid */}
                {isLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-2 text-muted">Loading live inventory...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-3 border">
                    <i className="ti ti-package-off fs-1 text-muted mb-2 d-block" />
                    <h6 className="text-muted">No products found matching your search.</h6>
                  </div>
                ) : (
                  <div className="row g-3 overflow-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
                    {filteredProducts.map((p) => {
                      const inCart = cart.find((i) => i.product.id === p.id);
                      const price = p.selling_price || p.price || 0;
                      return (
                        <div key={p.id} className="col-sm-6 col-md-4 col-xl-3">
                          <div
                            className={`card h-100 p-2 cursor-pointer border transition-all ${
                              inCart ? "border-primary shadow-sm" : "border-gray-200"
                            }`}
                            onClick={() => addToCart(p)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className="badge bg-light text-dark text-capitalize text-truncate" style={{ maxWidth: "100px" }}>
                                {p.category || "General"}
                              </span>
                              {inCart && (
                                <span className="badge bg-primary rounded-pill">
                                  {inCart.quantity} in cart
                                </span>
                              )}
                            </div>
                            <h6 className="fw-semibold text-truncate mb-1" title={p.name}>
                              {p.name}
                            </h6>
                            {p.sku && <small className="text-muted d-block mb-2">SKU: {p.sku}</small>}
                            <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                              <span className="fw-bold text-primary fs-6">
                                ₹{price.toFixed(2)}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary rounded-circle p-1"
                                style={{ width: "28px", height: "28px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(p);
                                }}
                              >
                                <i className="ti ti-plus" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Section: Order Cart & Billing Summary */}
            <div className="col-md-12 col-lg-5 col-xl-4 bg-white border-start d-flex flex-column" style={{ height: "calc(100vh - 65px)" }}>
              {/* Customer Selector */}
              <div className="p-3 border-bottom">
                <label className="form-label text-muted small fw-bold mb-1">CUSTOMER</label>
                <Select
                  options={customers}
                  value={selectedCustomer}
                  onChange={(val: any) => setSelectedCustomer(val)}
                  className="react-select"
                  placeholder="Select or Search Customer..."
                />
              </div>

              {/* Cart Items List */}
              <div className="flex-fill overflow-auto p-3">
                {cart.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="ti ti-shopping-cart-x fs-1 mb-2 d-block text-gray-400" />
                    <p className="mb-0">Cart is empty</p>
                    <small>Click products on the left to add to bill</small>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-2 border rounded-3 bg-light d-flex align-items-center justify-content-between gap-2"
                      >
                        <div className="flex-grow-1 text-truncate">
                          <h6 className="mb-0 text-truncate fw-semibold" title={item.product.name}>
                            {item.product.name}
                          </h6>
                          <small className="text-muted">
                            ₹{item.unit_price.toFixed(2)} × {item.quantity} = ₹{(item.unit_price * item.quantity).toFixed(2)}
                          </small>
                        </div>

                        {/* Quantity Controls */}
                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-white border px-2 py-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="fw-bold px-1" style={{ minWidth: "20px", textAlign: "center" }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-white border px-2 py-0"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm text-danger px-1"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary & Checkout Footer */}
              <div className="p-3 border-top bg-light">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Subtotal:</span>
                  <span className="fw-semibold">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.taxAmount > 0 && (
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Tax (GST):</span>
                    <span className="fw-semibold">₹{totals.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between mb-1 text-success">
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {totals.roundoff !== 0 && (
                  <div className="d-flex justify-content-between mb-1 text-muted small">
                    <span>Round off:</span>
                    <span>{totals.roundoff > 0 ? `+₹${totals.roundoff}` : `-₹${Math.abs(totals.roundoff)}`}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between fs-5 fw-bold border-top pt-2 mb-3">
                  <span>Grand Total:</span>
                  <span className="text-primary">₹{totals.grandTotal.toFixed(2)}</span>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger flex-fill"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn btn-success flex-fill fw-bold py-2 fs-6 d-flex align-items-center justify-content-center gap-1 shadow-sm"
                    onClick={() => setShowPaymentModal(true)}
                    disabled={cart.length === 0}
                  >
                    <i className="ti ti-cash me-1" />
                    Pay ₹{totals.grandTotal.toFixed(2)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Complete Payment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPaymentModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="text-center p-3 bg-light rounded-3 mb-3">
                  <small className="text-muted d-block">AMOUNT DUE</small>
                  <h2 className="text-primary fw-bold mb-0">₹{totals.grandTotal.toFixed(2)}</h2>
                </div>

                <label className="form-label fw-bold">Select Payment Mode</label>
                <div className="row g-2 mb-3">
                  {(["CASH", "UPI", "CARD"] as const).map((mode) => (
                    <div key={mode} className="col-4">
                      <button
                        type="button"
                        className={`btn w-100 py-2 fw-semibold border ${
                          paymentMode === mode ? "btn-primary" : "btn-light"
                        }`}
                        onClick={() => setPaymentMode(mode)}
                      >
                        {mode === "CASH" && <i className="ti ti-cash me-1" />}
                        {mode === "UPI" && <i className="ti ti-qrcode me-1" />}
                        {mode === "CARD" && <i className="ti ti-credit-card me-1" />}
                        {mode}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small">Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedCustomer.label}
                    readOnly
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success fw-bold px-4"
                  onClick={handleCompleteSale}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-check me-1" />
                      Confirm & Print Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
