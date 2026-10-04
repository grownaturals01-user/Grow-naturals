import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { MinusCircle, PlusCircle, Printer, Check, X } from "react-feather";
import PosModals from "../../core/modals/pos-modal/posModalstjsx";
import {
  card,
  cashIcon,
  category1,
  category2,
  category3,
  category4,
  category5,
  category6,
  category7,
  cheque,
  desposit,
  emptyCart,
  points,
  posProduct01,
  posProduct02,
  posProduct03,
  posProduct05,
  posProduct06,
  posProduct07,
  posProduct08,
  posProduct09,
  posProduct10,
  posProduct11,
  posProduct12,
  posProduct13,
  posProduct14,
  posProduct15,
  posProduct16,
  posProduct17,
  posProduct18,
  posProduct19,
  product4,
} from "../../utils/imagepath";
import CommonSelect from "../../components/select/common-select";
import { api, getActiveBusinessId } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";
import confetti from "canvas-confetti";

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category_id?: string;
  category?: string;
  category_name?: string;
  selling_price?: number;
  price?: number;
  cost_price?: number;
  stock_quantity?: number;
  stock?: number;
  tax_rate?: number;
  image_url?: string;
  unit?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

interface HeldBill {
  id: string;
  orderNumber: string;
  timestamp: string;
  customerName: string;
  customer: any;
  items: CartItem[];
  subtotal: number;
  grandTotal: number;
}

const fallbackProductImages = [
  posProduct01,
  posProduct02,
  posProduct03,
  posProduct05,
  posProduct06,
  posProduct07,
  posProduct08,
  posProduct09,
  posProduct10,
  posProduct11,
  posProduct12,
  posProduct13,
  posProduct14,
  posProduct15,
  posProduct16,
  posProduct17,
  posProduct18,
  posProduct19,
  product4,
];

const fallbackCategoryIcons = [
  category1,
  category2,
  category3,
  category4,
  category5,
  category6,
  category7,
];

const formatINR = (val: number | string) => {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const Pos4: React.FC = () => {
  const { user } = useAuth();
  const { businessId, activeBusiness } = useBusiness();
  const location = useLocation();

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>({
    value: "walkin",
    label: "Walk in Customer",
  });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [orderTaxPercent, setOrderTaxPercent] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [orderNumber] = useState<string>(() => `ORD-${Date.now().toString().slice(-6)}`);

  // Modals & Interactive Overlays
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("cash");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);

  // Custom Discount Modal
  const [discountModalOpen, setDiscountModalOpen] = useState<boolean>(false);
  const [tempDiscount, setTempDiscount] = useState<string>("0");

  // Custom Tax Modal
  const [taxModalOpen, setTaxModalOpen] = useState<boolean>(false);
  const [tempTax, setTempTax] = useState<string>("0");

  // Custom Shipping Modal
  const [shippingModalOpen, setShippingModalOpen] = useState<boolean>(false);
  const [tempShipping, setTempShipping] = useState<string>("0");

  // Held Bills & View Orders Modal
  const [ordersModalOpen, setOrdersModalOpen] = useState<boolean>(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  // Add Customer Modal
  const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [newCustEmail, setNewCustEmail] = useState<string>("");
  const [newCustAddress, setNewCustAddress] = useState<string>("");
  const [newCustGstin, setNewCustGstin] = useState<string>("");

  // Load Held Bills from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`gn_pos_held_bills_${businessId}`);
      if (stored) {
        setHeldBills(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load held bills:", e);
    }
  }, [businessId]);

  // Save Held Bills to LocalStorage
  const saveHeldBills = (bills: HeldBill[]) => {
    setHeldBills(bills);
    try {
      localStorage.setItem(`gn_pos_held_bills_${businessId}`, JSON.stringify(bills));
    } catch (e) {
      console.warn("Could not save held bills:", e);
    }
  };

  // Fetch Products, Categories, Customers
  const loadPOSData = useCallback(async () => {
    setLoading(true);
    const biz = businessId || getActiveBusinessId();

    try {
      const [prodRes, catRes, custRes] = await Promise.allSettled([
        api.get<Product[]>("/products", { business_id: biz }),
        api.get<any[]>("/categories", { business_id: biz }),
        api.get<any[]>("/customers", { business_id: biz }),
      ]);

      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
      }

      if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
        setCategories(catRes.value);
      }

      if (custRes.status === "fulfilled" && Array.isArray(custRes.value)) {
        const custOpts = [
          { value: "walkin", label: "Walk in Customer", phone: "", address: "", gstin: "" },
          ...custRes.value.map((c) => ({
            value: c.id,
            label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
            phone: c.phone || "",
            address: c.address || "",
            gstin: c.gstin || "",
          })),
        ];
        setCustomers(custOpts);
      }
    } catch (err) {
      console.error("Error loading POS master data:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadPOSData();
  }, [loadPOSData]);

  // Body Class handling
  useEffect(() => {
    document.body.classList.add("pos-page");
    return () => {
      document.body.classList.remove("pos-page");
    };
  }, [location.pathname]);

  // Carousel Slider Settings
  const sliderSettings = {
    dots: false,
    autoplay: false,
    slidesToShow: Math.min(6, (categories.length || 0) + 1),
    margin: 0,
    arrows: true,
    speed: 400,
    infinite: false,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 5 } },
      { breakpoint: 992, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 576, settings: { slidesToShow: 2 } },
    ],
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        activeTab === "all" ||
        p.category_id === activeTab ||
        (p.category && p.category.toLowerCase() === activeTab.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase() === activeTab.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.toLowerCase().includes(query));

      return matchesCat && matchesSearch;
    });
  }, [products, activeTab, searchQuery]);

  // Calculations
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const discount = discountPercent > 0 ? Number(((subtotal * discountPercent) / 100).toFixed(2)) : 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = orderTaxPercent > 0 ? Number(((taxableAmount * orderTaxPercent) / 100).toFixed(2)) : 0;
    const shipping = Number(shippingCost) || 0;
    const grandTotal = Math.max(0, Number((taxableAmount + tax + shipping).toFixed(2)));
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    return {
      subtotal,
      discount,
      tax,
      shipping,
      grandTotal,
      totalItems,
    };
  }, [cart, discountPercent, orderTaxPercent, shippingCost]);

  // Cart Operations
  const addToCart = (product: Product) => {
    const price = Number(product.selling_price || product.price) || 0;
    const taxRate = Number(product.tax_rate) || 5;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.product.id === product.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + 1;
        const lineSubtotal = price * newQty;
        const lineTax = (lineSubtotal * taxRate) / 100;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          tax_amount: lineTax,
          total_amount: lineSubtotal + lineTax,
        };
        return copy;
      } else {
        const lineSubtotal = price * 1;
        const lineTax = (lineSubtotal * taxRate) / 100;
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unit_price: price,
            discount: 0,
            tax_rate: taxRate,
            tax_amount: lineTax,
            total_amount: lineSubtotal + lineTax,
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
          const lineSubtotal = item.unit_price * qty;
          const lineTax = (lineSubtotal * item.tax_rate) / 100;
          return {
            ...item,
            quantity: qty,
            tax_amount: lineTax,
            total_amount: lineSubtotal + lineTax,
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
    setDiscountPercent(0);
    setOrderTaxPercent(0);
    setShippingCost(0);
  };

  // Hold Current Order
  const handleHoldOrder = () => {
    if (cart.length === 0) {
      alert("Cart is empty! Add products before holding.");
      return;
    }
    const newHold: HeldBill = {
      id: `hold-${Date.now()}`,
      orderNumber,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      customerName: selectedCustomer?.label?.split(" (")[0] || "Walk in Customer",
      customer: selectedCustomer,
      items: [...cart],
      subtotal: totals.subtotal,
      grandTotal: totals.grandTotal,
    };
    saveHeldBills([newHold, ...heldBills]);
    clearCart();
    alert(`Order #${orderNumber} placed on hold successfully!`);
  };

  // Restore Held Order
  const handleRestoreOrder = (hold: HeldBill) => {
    setCart(hold.items);
    if (hold.customer) setSelectedCustomer(hold.customer);
    saveHeldBills(heldBills.filter((b) => b.id !== hold.id));
    setOrdersModalOpen(false);
  };

  // Delete Held Order
  const handleDeleteHeldOrder = (holdId: string) => {
    saveHeldBills(heldBills.filter((b) => b.id !== holdId));
  };

  // Open Recent Orders
  const handleOpenOrdersModal = async () => {
    setOrdersModalOpen(true);
    try {
      const biz = businessId || getActiveBusinessId();
      const res = await api.get<any[]>("/invoices", { business_id: biz, limit: 10 });
      if (Array.isArray(res)) setRecentInvoices(res);
    } catch (e) {
      console.warn("Could not load recent invoices:", e);
    }
  };

  // Open Checkout Modal
  const handleOpenPayment = (mode: string = "cash") => {
    if (cart.length === 0) {
      alert("Please add items to cart before proceeding to payment.");
      return;
    }
    setSelectedPaymentMode(mode);
    setReceivedAmount(totals.grandTotal.toString());
    setPaymentModalOpen(true);
  };

  // Complete Sale & Execute Checkout API
  const handleExecuteCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    const biz = businessId || getActiveBusinessId();
    const customerName = selectedCustomer?.label?.split(" (")[0] || "Walk in Customer";
    const customerId = selectedCustomer?.value !== "walkin" ? selectedCustomer?.value : null;

    const payload = {
      business_id: biz,
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: selectedCustomer?.phone || "",
      items: cart.map((i) => ({
        product_id: i.product.id,
        product_name: i.product.name,
        sku: i.product.sku || "",
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount || 0,
        gst_rate: i.product.tax_rate || 5,
      })),
      discount_amount: totals.discount,
      payment_method: selectedPaymentMode,
      notes: paymentNotes || `POS Sale - ${selectedPaymentMode.toUpperCase()}`,
    };

    try {
      const res = await api.post<any>("/pos/checkout", payload);
      const invoiceData = res?.invoice || res;

      setCompletedInvoice({
        ...invoiceData,
        items: cart,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        shipping: totals.shipping,
        grandTotal: totals.grandTotal,
        payment_method: selectedPaymentMode,
        customer_name: customerName,
        customer_phone: selectedCustomer?.phone || "",
        date: new Date().toLocaleDateString("en-IN", { dateStyle: "medium" }),
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setPaymentModalOpen(false);
      setReceiptModalOpen(true);
      clearCart();

      // Refresh products to show updated stock
      loadPOSData();
    } catch (err: any) {
      alert("Error completing sale: " + (err.message || "Failed to process checkout"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Customer API
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      alert("Customer Name is required");
      return;
    }

    try {
      const biz = businessId || getActiveBusinessId();
      const res = await api.post<any>("/customers", {
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        email: newCustEmail.trim(),
        address: newCustAddress.trim(),
        gstin: newCustGstin.trim(),
        business_id: biz,
      });

      const newOption = {
        value: res.id,
        label: `${res.name} ${res.phone ? `(${res.phone})` : ""}`,
        phone: res.phone || "",
        address: res.address || "",
        gstin: res.gstin || "",
      };

      setCustomers((prev) => [newOption, ...prev]);
      setSelectedCustomer(newOption);
      setCustomerModalOpen(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustAddress("");
      setNewCustGstin("");
      alert("Customer added successfully!");
    } catch (err: any) {
      alert("Error adding customer: " + (err.message || "Could not save customer"));
    }
  };

  return (
    <div className="main-wrapper pos-three">
      <div className="page-wrapper pos-pg-wrapper ms-0">
        <div className="content pos-design p-0">
          <div className="row align-items-start pos-wrapper g-0">
            {/* Products Column */}
            <div className="col-md-12 col-lg-7 col-xl-8">
              <div className="pos-categories tabs_wrapper p-3">
                {/* Top Welcome & Search Header */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                  <div>
                    <h5 className="mb-1 fw-bold">
                      Welcome, {user?.name || user?.username || "Admin"}
                    </h5>
                    <p className="text-muted mb-0">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="input-icon-start pos-search position-relative">
                      <span className="input-icon-addon">
                        <i className="ti ti-search" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search Product, SKU or Barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setActiveTab("all")}
                    >
                      View All Categories
                    </button>
                  </div>
                </div>

                {/* Categories Slider */}
                <div className="mb-4">
                  <Slider {...sliderSettings} className="tabs owl-carousel pos-category3">
                    {/* All Categories Pill */}
                    <div
                      key="all"
                      onClick={() => setActiveTab("all")}
                      className={`owl-item cursor-pointer ${activeTab === "all" ? "active" : ""}`}
                      style={{ cursor: "pointer" }}
                    >
                      <Link to="#" onClick={(e) => e.preventDefault()}>
                        <img src={category1} alt="All Categories" />
                      </Link>
                      <h6>
                        <Link to="#" onClick={(e) => e.preventDefault()}>
                          All Items
                        </Link>
                      </h6>
                    </div>

                    {/* Dynamic Backend Categories */}
                    {categories.map((cat, idx) => {
                      const icon = fallbackCategoryIcons[(idx + 1) % fallbackCategoryIcons.length];
                      const isCatActive =
                        activeTab === cat.id ||
                        activeTab.toLowerCase() === cat.name.toLowerCase();
                      return (
                        <div
                          key={cat.id || idx}
                          onClick={() => setActiveTab(cat.id || cat.name)}
                          className={`owl-item cursor-pointer ${isCatActive ? "active" : ""}`}
                          style={{ cursor: "pointer" }}
                        >
                          <Link to="#" onClick={(e) => e.preventDefault()}>
                            <img src={cat.image_url || icon} alt={cat.name} />
                          </Link>
                          <h6>
                            <Link to="#" onClick={(e) => e.preventDefault()}>
                              {cat.name}
                            </Link>
                          </h6>
                        </div>
                      );
                    })}
                  </Slider>
                </div>

                {/* Product Catalog Grid */}
                <div className="pos-products">
                  <div className="tabs_container">
                    <div className="tab_content active">
                      {loading ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading products...</span>
                          </div>
                          <p className="mt-2 text-muted">Loading product catalog...</p>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-5">
                          <i className="ti ti-package-off fs-40 text-muted mb-2 d-block" />
                          <h5 className="text-muted">No products found</h5>
                          <p className="text-muted fs-13">
                            Try adjusting your search query or category filter.
                          </p>
                        </div>
                      ) : (
                        <div className="row row-cols-xxl-5 row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row-cols-sm-2 row-cols-1 g-3">
                          {filteredProducts.map((p, idx) => {
                            const inCart = cart.find((item) => item.product.id === p.id);
                            const stockQty = p.stock_quantity ?? p.stock ?? 0;
                            const isOutOfStock = stockQty <= 0;
                            const fallbackImg =
                              fallbackProductImages[idx % fallbackProductImages.length];

                            return (
                              <div key={p.id} className="col">
                                <div
                                  className={`product-info card ${inCart ? "active" : ""} ${
                                    isOutOfStock ? "opacity-75" : ""
                                  }`}
                                  onClick={() => addToCart(p)}
                                  style={{
                                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                                    transition: "all 0.2s ease-in-out",
                                  }}
                                >
                                  <Link
                                    to="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      addToCart(p);
                                    }}
                                    className="product-image"
                                  >
                                    <img
                                      src={p.image_url || fallbackImg}
                                      alt={p.name}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = fallbackImg;
                                      }}
                                    />
                                  </Link>
                                  <div className="product-content">
                                    <h6
                                      className="fs-14 fw-bold mb-1 text-truncate"
                                      title={p.name}
                                    >
                                      <Link
                                        to="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          addToCart(p);
                                        }}
                                      >
                                        {p.name}
                                      </Link>
                                    </h6>
                                    <div className="d-flex align-items-center justify-content-between">
                                      <h6 className="text-teal fs-14 fw-bold">
                                        {formatINR(p.selling_price || p.price || 0)}
                                      </h6>
                                      <p
                                        className={
                                          isOutOfStock
                                            ? "text-danger fw-bold"
                                            : stockQty <= 5
                                            ? "text-orange fw-bold"
                                            : "text-pink"
                                        }
                                      >
                                        {isOutOfStock ? "Out of Stock" : `${stockQty} Pcs`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Order Details & Cart */}
            <div className="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar">
              <aside className="product-order-list bg-white border-start p-3">
                {/* Customer Info Section */}
                <div className="customer-info pb-3 border-bottom mb-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                    <div className="d-flex align-items-center">
                      <h4 className="mb-0 fw-bold">New Order</h4>
                      <span className="badge badge-purple badge-xs fs-10 fw-medium ms-2">
                        #{orderNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary shadow-primary"
                      onClick={() => setCustomerModalOpen(true)}
                    >
                      + Add Customer
                    </button>
                  </div>
                  <CommonSelect
                    options={customers}
                    className="select w-100"
                    value={selectedCustomer}
                    onChange={(e: any) => setSelectedCustomer(e)}
                    placeholder="Choose Customer"
                    filter={false}
                  />
                </div>

                {/* Cart Product List Section */}
                <div className="product-added block-section mb-3">
                  <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                    <h5 className="d-flex align-items-center mb-0 fw-bold">Order Details</h5>
                    <div className="badge bg-light text-gray-9 fs-12 fw-semibold py-2 border rounded">
                      Items : <span className="text-teal">{totals.totalItems}</span>
                    </div>
                  </div>

                  <div className="product-wrap">
                    {cart.length === 0 ? (
                      <div className="empty-cart d-flex align-items-center justify-content-center flex-column text-center py-5">
                        <div className="mb-2">
                          <img
                            src={emptyCart}
                            alt="Empty Cart"
                            className="img-fluid"
                            style={{ maxHeight: "110px" }}
                          />
                        </div>
                        <p className="fw-bold mb-1">No Products Selected</p>
                        <small className="text-muted">Click any item to add to bill</small>
                      </div>
                    ) : (
                      <div
                        className="product-list border-0 p-0"
                        style={{ maxHeight: "280px", overflowY: "auto" }}
                      >
                        <div className="table-responsive">
                          <table className="table table-borderless mb-0">
                            <thead>
                              <tr>
                                <th className="bg-transparent fw-bold">Product</th>
                                <th className="bg-transparent fw-bold text-center">QTY</th>
                                <th className="bg-transparent fw-bold">Price</th>
                                <th className="bg-transparent fw-bold text-end" />
                              </tr>
                            </thead>
                            <tbody>
                              {cart.map((item) => (
                                <tr key={item.product.id} className="border-bottom">
                                  <td>
                                    <div className="d-flex align-items-center mb-1">
                                      <h6
                                        className="fs-15 fw-medium text-truncate mb-0"
                                        style={{ maxWidth: "130px" }}
                                        title={item.product.name}
                                      >
                                        {item.product.name}
                                      </h6>
                                    </div>
                                    <small className="text-muted">
                                      Price : {formatINR(item.unit_price)}
                                    </small>
                                  </td>
                                  <td>
                                    <div className="qty-item m-0 d-flex align-items-center justify-content-center">
                                      <span
                                        className="quantity-btn ps-1 cursor-pointer"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          updateQuantity(item.product.id, item.quantity - 1)
                                        }
                                      >
                                        <MinusCircle size={17} className="text-muted" />
                                      </span>
                                      <input
                                        type="number"
                                        className="quntity-input bg-transparent text-center border-0 p-0 fw-bold"
                                        style={{ width: "34px", outline: "none" }}
                                        value={item.quantity}
                                        onChange={(e) =>
                                          updateQuantity(
                                            item.product.id,
                                            parseInt(e.target.value) || 1
                                          )
                                        }
                                        min={1}
                                      />
                                      <span
                                        className="quantity-btn pe-1 cursor-pointer"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          updateQuantity(item.product.id, item.quantity + 1)
                                        }
                                      >
                                        <PlusCircle size={17} className="text-muted" />
                                      </span>
                                    </div>
                                  </td>
                                  <td className="fw-bold fs-14">
                                    {formatINR(item.unit_price * item.quantity)}
                                  </td>
                                  <td className="text-end">
                                    <button
                                      type="button"
                                      className="btn btn-link btn-icon delete-icon p-0 text-danger"
                                      onClick={() => removeFromCart(item.product.id)}
                                    >
                                      <i className="ti ti-trash fs-16" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary Calculations */}
                <div className="block-section order-method bg-light p-3 rounded mb-3">
                  <div className="order-total mb-2">
                    <div className="table-responsive">
                      <table className="table table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td>Sub Total</td>
                            <td className="text-end fw-semibold">
                              {formatINR(totals.subtotal)}
                            </td>
                          </tr>
                          {totals.shipping > 0 && (
                            <tr>
                              <td>Shipping</td>
                              <td className="text-end">{formatINR(totals.shipping)}</td>
                            </tr>
                          )}
                          {totals.tax > 0 && (
                            <tr>
                              <td>Tax ({orderTaxPercent}%)</td>
                              <td className="text-end">{formatINR(totals.tax)}</td>
                            </tr>
                          )}
                          {totals.discount > 0 && (
                            <tr>
                              <td>Discount ({discountPercent}%)</td>
                              <td className="text-danger text-end">
                                -{formatINR(totals.discount)}
                              </td>
                            </tr>
                          )}
                          <tr className="border-top">
                            <td className="fw-bold fs-16">Grand Total</td>
                            <td className="text-end fw-bold fs-16 text-primary">
                              {formatINR(totals.grandTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quick Action Buttons Grid */}
                  <div className="row gx-2">
                    <div className="col-4">
                      <button
                        type="button"
                        className="btn btn-teal d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={() => {
                          setTempDiscount(discountPercent.toString());
                          setDiscountModalOpen(true);
                        }}
                      >
                        <i className="ti ti-percentage me-1" />
                        Discount
                      </button>
                      <button
                        type="button"
                        className="btn btn-orange d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={handleHoldOrder}
                      >
                        <i className="ti ti-player-pause me-1" />
                        Hold
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={handleOpenOrdersModal}
                      >
                        <i className="ti ti-shopping-cart me-1" />
                        Orders
                      </button>
                    </div>

                    <div className="col-4">
                      <button
                        type="button"
                        className="btn btn-purple d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={() => {
                          setTempTax(orderTaxPercent.toString());
                          setTaxModalOpen(true);
                        }}
                      >
                        <i className="ti ti-receipt-tax me-1" />
                        Tax
                      </button>
                      <button
                        type="button"
                        className="btn btn-info d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13 text-white"
                        onClick={() => {
                          if (window.confirm("Void current order and clear cart?")) {
                            clearCart();
                          }
                        }}
                      >
                        <i className="ti ti-trash me-1" />
                        Void
                      </button>
                      <button
                        type="button"
                        className="btn btn-indigo d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={() => {
                          if (window.confirm("Reset cart and selections?")) {
                            clearCart();
                          }
                        }}
                      >
                        <i className="ti ti-reload me-1" />
                        Reset
                      </button>
                    </div>

                    <div className="col-4">
                      <button
                        type="button"
                        className="btn btn-pink d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={() => {
                          setTempShipping(shippingCost.toString());
                          setShippingModalOpen(true);
                        }}
                      >
                        <i className="ti ti-package-import me-1" />
                        Shipping
                      </button>
                      <button
                        type="button"
                        className="btn btn-cyan d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13 text-white"
                        onClick={() => handleOpenPayment("cash")}
                      >
                        <i className="ti ti-cash-banknote me-1" />
                        Payment
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={handleOpenOrdersModal}
                      >
                        <i className="ti ti-refresh-dot me-1" />
                        Recent
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Row */}
                <div className="block-section payment-method">
                  <h6 className="mb-2 fw-bold">Select Payment</h6>
                  <div className="row align-items-center justify-content-center methods g-2 mb-3">
                    <div className="col d-flex">
                      <div
                        className={`payment-item flex-fill text-center p-2 rounded border cursor-pointer ${
                          selectedPaymentMode === "cash" ? "border-primary bg-soft-primary" : ""
                        }`}
                        onClick={() => handleOpenPayment("cash")}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={cashIcon} alt="Cash" style={{ maxHeight: "24px" }} />
                        <p className="fw-medium mb-0 fs-12 mt-1">Cash</p>
                      </div>
                    </div>
                    <div className="col d-flex">
                      <div
                        className={`payment-item flex-fill text-center p-2 rounded border cursor-pointer ${
                          selectedPaymentMode === "card" ? "border-primary bg-soft-primary" : ""
                        }`}
                        onClick={() => handleOpenPayment("card")}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={card} alt="Card" style={{ maxHeight: "24px" }} />
                        <p className="fw-medium mb-0 fs-12 mt-1">Card</p>
                      </div>
                    </div>
                    <div className="col d-flex">
                      <div
                        className={`payment-item flex-fill text-center p-2 rounded border cursor-pointer ${
                          selectedPaymentMode === "points" ? "border-primary bg-soft-primary" : ""
                        }`}
                        onClick={() => handleOpenPayment("points")}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={points} alt="Points" style={{ maxHeight: "24px" }} />
                        <p className="fw-medium mb-0 fs-12 mt-1">Points</p>
                      </div>
                    </div>
                    <div className="col d-flex">
                      <div
                        className={`payment-item flex-fill text-center p-2 rounded border cursor-pointer ${
                          selectedPaymentMode === "upi" ? "border-primary bg-soft-primary" : ""
                        }`}
                        onClick={() => handleOpenPayment("upi")}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={desposit} alt="UPI/Deposit" style={{ maxHeight: "24px" }} />
                        <p className="fw-medium mb-0 fs-12 mt-1">UPI</p>
                      </div>
                    </div>
                    <div className="col d-flex">
                      <div
                        className={`payment-item flex-fill text-center p-2 rounded border cursor-pointer ${
                          selectedPaymentMode === "cheque" ? "border-primary bg-soft-primary" : ""
                        }`}
                        onClick={() => handleOpenPayment("cheque")}
                        style={{ cursor: "pointer" }}
                      >
                        <img src={cheque} alt="Cheque" style={{ maxHeight: "24px" }} />
                        <p className="fw-medium mb-0 fs-12 mt-1">Cheque</p>
                      </div>
                    </div>
                  </div>

                  {/* Big Checkout Action Button */}
                  <div className="btn-block m-0">
                    <button
                      type="button"
                      className="btn btn-teal w-100 py-3 fs-16 fw-bold shadow-sm"
                      onClick={() => handleOpenPayment(selectedPaymentMode)}
                      disabled={cart.length === 0}
                    >
                      Pay : {formatINR(totals.grandTotal)}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME DYNAMIC MODALS (THEME-ALIGNED) */}
      {/* ========================================================================= */}

      {/* 1. Payment Modal */}
      {paymentModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Finalize Sale - {selectedPaymentMode.toUpperCase()}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setPaymentModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3 text-center p-3 bg-light rounded">
                  <small className="text-muted text-uppercase fw-semibold">Grand Total Due</small>
                  <h2 className="text-primary fw-bold mb-0">{formatINR(totals.grandTotal)}</h2>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Payment Mode</label>
                  <div className="btn-group w-100">
                    {["cash", "card", "upi", "cheque"].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`btn btn-sm ${
                          selectedPaymentMode === mode ? "btn-primary" : "btn-outline-secondary"
                        } text-capitalize`}
                        onClick={() => setSelectedPaymentMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-semibold">Received Amount</label>
                    <input
                      type="number"
                      className="form-control"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold">Change Return</label>
                    <input
                      type="text"
                      className="form-control bg-light fw-bold text-success"
                      value={formatINR(Math.max(0, Number(receivedAmount) - totals.grandTotal))}
                      readOnly
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Order / Reference Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Optional notes or transaction ref..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success fw-bold px-4"
                  onClick={handleExecuteCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm & Pay"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Order Success Receipt Modal */}
      {receiptModalOpen && completedInvoice && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setReceiptModalOpen(false)}
                />
              </div>
              <div className="modal-body text-center pt-0">
                <div className="avatar avatar-xl bg-soft-success text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center">
                  <Check size={32} />
                </div>
                <h4 className="fw-bold mb-1">Sale Completed!</h4>
                <p className="text-muted fs-13 mb-3">
                  Invoice <span className="fw-bold text-dark">{completedInvoice.invoice_number}</span> created
                </p>

                <div className="p-3 bg-light rounded text-start fs-13 mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Customer:</span>
                    <span className="fw-medium">{completedInvoice.customer_name}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Payment:</span>
                    <span className="fw-medium text-capitalize">
                      {completedInvoice.payment_method}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between border-top pt-2 mt-2">
                    <span className="fw-bold">Amount Paid:</span>
                    <span className="fw-bold text-primary fs-15">
                      {formatINR(completedInvoice.grandTotal || completedInvoice.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-dark flex-fill d-flex align-items-center justify-content-center"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} className="me-1" /> Print
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-fill"
                    onClick={() => setReceiptModalOpen(false)}
                  >
                    Next Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Discount Modal */}
      {discountModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Apply Discount</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDiscountModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Discount Percentage (%)</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={100}
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(e.target.value)}
                  />
                  <span className="input-group-text">%</span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDiscountModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setDiscountPercent(Math.min(100, Math.max(0, Number(tempDiscount) || 0)));
                    setDiscountModalOpen(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tax Modal */}
      {taxModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Order Tax Rate</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setTaxModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Tax Percentage (%)</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={100}
                    value={tempTax}
                    onChange={(e) => setTempTax(e.target.value)}
                  />
                  <span className="input-group-text">%</span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setTaxModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setOrderTaxPercent(Math.max(0, Number(tempTax) || 0));
                    setTaxModalOpen(false);
                  }}
                >
                  Apply Tax
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Shipping Cost Modal */}
      {shippingModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Shipping Cost</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShippingModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <label className="form-label fw-semibold">Shipping Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  value={tempShipping}
                  onChange={(e) => setTempShipping(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShippingModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShippingCost(Math.max(0, Number(tempShipping) || 0));
                    setShippingModalOpen(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. View Orders & Held Bills Modal */}
      {ordersModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Orders &amp; Held Bills</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setOrdersModalOpen(false)}
                />
              </div>
              <div className="modal-body p-0">
                <ul className="nav nav-tabs nav-justified border-bottom">
                  <li className="nav-item">
                    <button
                      className="nav-link active fw-bold"
                      data-bs-toggle="tab"
                      data-bs-target="#held-bills-tab"
                    >
                      On-Hold Orders ({heldBills.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className="nav-link fw-bold"
                      data-bs-toggle="tab"
                      data-bs-target="#recent-bills-tab"
                    >
                      Recent Transactions
                    </button>
                  </li>
                </ul>

                <div className="tab-content p-3">
                  {/* Held Bills Tab */}
                  <div className="tab-pane fade show active" id="held-bills-tab">
                    {heldBills.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <i className="ti ti-inbox fs-32 mb-1 d-block" />
                        No orders currently on hold.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Order #</th>
                              <th>Customer</th>
                              <th>Items</th>
                              <th>Total</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {heldBills.map((b) => (
                              <tr key={b.id}>
                                <td className="fw-bold">{b.orderNumber}</td>
                                <td>{b.customerName}</td>
                                <td>{b.items.length} items</td>
                                <td className="fw-bold text-primary">{formatINR(b.grandTotal)}</td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary me-2"
                                    onClick={() => handleRestoreOrder(b)}
                                  >
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteHeldOrder(b.id)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Recent Bills Tab */}
                  <div className="tab-pane fade" id="recent-bills-tab">
                    {recentInvoices.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        No recent invoices found.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Invoice #</th>
                              <th>Customer</th>
                              <th>Method</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentInvoices.slice(0, 8).map((inv) => (
                              <tr key={inv.id}>
                                <td className="fw-bold text-dark">{inv.invoice_number}</td>
                                <td>{inv.customer_name || "Walk-in"}</td>
                                <td>
                                  <span className="badge badge-soft-success text-capitalize">
                                    {inv.payment_method || "Cash"}
                                  </span>
                                </td>
                                <td className="fw-bold text-primary">
                                  {formatINR(inv.total_amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOrdersModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Customer Modal */}
      {customerModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Add New Customer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setCustomerModalOpen(false)}
                />
              </div>
              <form onSubmit={handleCreateCustomer}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Customer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Agro"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="10-digit mobile number"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="email@example.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Billing / Delivery address"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">GSTIN (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="GSTIN Number"
                      value={newCustGstin}
                      onChange={(e) => setNewCustGstin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCustomerModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold">
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Background static theme modals for secondary triggers */}
      <PosModals />
    </div>
  );
};

export default Pos4;
