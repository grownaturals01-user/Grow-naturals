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

  // Customer Drawer (#add_order) & Add New Customer States
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState<boolean>(false);
  const [activeCustomerTab, setActiveCustomerTab] = useState<"existing" | "add_new">("existing");
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");
  const [newCustPhoto, setNewCustPhoto] = useState<string>("");
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [newCustEmail, setNewCustEmail] = useState<string>("");
  const [newCustAddress, setNewCustAddress] = useState<string>("");
  const [newCustAddress2, setNewCustAddress2] = useState<string>("");
  const [newCustCountry, setNewCustCountry] = useState<string>("India");
  const [newCustState, setNewCustState] = useState<string>("Maharashtra");
  const [newCustCity, setNewCustCity] = useState<string>("Pune");
  const [newCustPostal, setNewCustPostal] = useState<string>("");
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
          {
            value: "walkin",
            label: "Walk in Customer",
            name: "Walk in Customer",
            phone: "+91 00000 00000",
            address: "",
            gstin: "",
            status: "Available",
          },
          ...custRes.value.map((c) => ({
            value: c.id,
            label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
            name: c.name,
            phone: c.phone || "",
            email: c.email || "",
            address: c.address || "",
            gstin: c.gstin || "",
            image_url: c.image_url || "",
            status: c.status || "Available",
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
        address: [newCustAddress.trim(), newCustAddress2.trim(), newCustCity.trim(), newCustState.trim(), newCustPostal.trim()].filter(Boolean).join(", "),
        city: newCustCity.trim(),
        state: newCustState.trim(),
        country: newCustCountry.trim(),
        postal_code: newCustPostal.trim(),
        image_url: newCustPhoto || undefined,
        business_id: biz,
      });

      const newOption = {
        value: res.id,
        label: `${res.name} ${res.phone ? `(${res.phone})` : ""}`,
        name: res.name,
        phone: res.phone || "",
        email: res.email || "",
        address: res.address || "",
        gstin: res.gstin || "",
        image_url: res.image_url || newCustPhoto || "",
        status: "Available",
      };

      setCustomers((prev) => [newOption, ...prev]);
      setSelectedCustomer(newOption);
      setCustomerDrawerOpen(false);
      setActiveCustomerTab("existing");
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustAddress("");
      setNewCustAddress2("");
      setNewCustPostal("");
      setNewCustPhoto("");
      alert("Customer created and selected successfully!");
    } catch (err: any) {
      alert("Error adding customer: " + (err.message || "Could not save customer"));
    }
  };

  // Filtered Customer List for #add_order Drawer
  const filteredCustomerList = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        (c.label && c.label.toLowerCase().includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  return (
    <div className="main-wrapper pos-three pos-four-enhanced">
      {/* Scoped CSS to make POS 4 100% clean and modern */}
      <style>{`
        .pos-four-enhanced .pos-wrapper {
          min-height: calc(100vh - 65px);
        }
        .pos4-header-bar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .pos4-search-box {
          position: relative;
          min-width: 280px;
        }
        .pos4-search-input {
          height: 38px;
          padding-left: 36px;
          padding-right: 32px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          font-size: 13.5px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .pos4-search-input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15);
          outline: none;
        }
        .pos4-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 15px;
          pointer-events: none;
        }
        .pos4-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .pos4-search-clear:hover {
          color: #475569;
        }

        /* Category Listing Design matching Screenshot 2 */
        .pos-categories-container-new {
          background: transparent;
          margin-bottom: 18px;
        }
        .pos-categories-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding: 0 2px;
        }
        .pos-categories-main-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.015em;
          margin: 0;
        }
        .pos-category-nav-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pos-cat-round-arrow-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .pos-cat-round-arrow-btn:hover {
          background: #f9fafb;
          border-color: #cbd5e1;
        }
        .pos-cat-scroll-track-new {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 2px 2px 8px 2px;
        }
        .pos-cat-scroll-track-new::-webkit-scrollbar {
          display: none;
        }
        .pos-category-badge-pill {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 7px 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 105px;
          user-select: none;
          font-family: inherit;
        }
        .pos-category-badge-pill:hover {
          border-color: #cbd5e1;
          background: #f9fafb;
        }
        .pos-category-badge-pill.active {
          background: #14b8a6;
          border-color: #14b8a6;
          box-shadow: 0 2px 8px rgba(20, 184, 166, 0.25);
        }
        .pos-category-pill-label {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .pos-category-badge-pill.active .pos-category-pill-label {
          color: #ffffff;
          font-weight: 700;
        }
        .pos-category-pill-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 22px;
          padding: 0 8px;
          border-radius: 9999px;
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
          margin-left: auto;
        }
        .pos-category-badge-pill.active .pos-category-pill-count {
          background: #0f766e;
          color: #ffffff;
        }

        /* Customers Drawer (#add_order) matching DreamsPOS offcanvas with Smooth Slide Animation */
        .offcanvas#add_order,
        div#add_order.offcanvas,
        .customer-sidebar-offcanvas {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: auto !important;
          width: 380px !important;
          max-width: 92vw !important;
          min-width: 340px !important;
          height: 100vh !important;
          background-color: #ffffff !important;
          box-shadow: -8px 0 30px rgba(0, 0, 0, 0.18) !important;
          border-left: 1px solid #e2e8f0 !important;
          z-index: 1065 !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.32s ease !important;
        }
        .offcanvas#add_order:not(.show),
        .customer-sidebar-offcanvas:not(.show) {
          transform: translateX(100%) !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .offcanvas#add_order.show,
        .customer-sidebar-offcanvas.show {
          transform: translateX(0%) !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }

        /* Backdrop overlay with fade animation */
        .customer-drawer-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background-color: rgba(0, 0, 0, 0.45) !important;
          z-index: 1060 !important;
          transition: opacity 0.3s ease, visibility 0.3s ease !important;
        }
        .customer-drawer-backdrop:not(.show) {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .customer-drawer-backdrop.show {
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        .offcanvas#add_order .offcanvas-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 16px 20px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .offcanvas#add_order .offcanvas-header .btn-close {
          position: static !important;
          margin: 0 !important;
          transform: none !important;
          width: 32px !important;
          height: 32px !important;
        }
        .orders-tab {
          background: #ffffff;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .orders-tab .nav-pills {
          background: #f8fafc;
          padding: 4px;
          border-radius: 50px;
          border: 1px solid #e2e8f0;
          display: flex;
          gap: 6px;
          width: 100%;
        }
        .orders-tab .nav-pills .nav-link {
          border-radius: 50px !important;
          padding: 7px 12px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #475569 !important;
          background: transparent !important;
          border: none !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 1;
        }
        .orders-tab .nav-pills .nav-link.active {
          background: #0f172a !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15) !important;
        }
        .order-select-card {
          transition: all 0.15s ease;
          border-radius: 10px;
          cursor: pointer;
        }
        .order-select-card:hover {
          background-color: #f8fafc !important;
        }
        .order-select-card.selected-customer-card {
          border-color: #0284c7 !important;
          background-color: #f0f9ff !important;
        }
        .customer-radio-input input[type="radio"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #0284c7;
        }
        .badge-soft-success {
          background-color: #ecfdf5 !important;
          color: #059669 !important;
          border-radius: 50px !important;
          padding: 4px 12px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .badge-soft-danger {
          background-color: #fef2f2 !important;
          color: #ef4444 !important;
          border-radius: 50px !important;
          padding: 4px 12px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }

        .pos4-product-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          user-select: none;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .pos4-product-card:hover {
          border-color: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px -4px rgba(5, 150, 105, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        }
        .pos4-product-card.in-cart {
          border-color: #059669;
          background: #fbfdfb;
          box-shadow: 0 0 0 1.5px #059669;
        }
        .pos4-product-card.out-of-stock {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pos4-card-media {
          height: 120px;
          width: 100%;
          position: relative;
          background: #f8fafc;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .pos4-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .pos4-product-card:hover .pos4-card-img {
          transform: scale(1.05);
        }
        .pos4-card-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #166534;
        }
        .pos4-fallback-icon {
          font-size: 24px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #15803d;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        .pos4-fallback-cat {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #15803d;
          max-width: 85%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pos4-badge-incart {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #059669;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 6px rgba(5, 150, 105, 0.35);
          z-index: 2;
        }
        .pos4-btn-quick-add {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ffffff;
          color: #059669;
          border: 1.5px solid #059669;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          z-index: 2;
        }
        .pos4-btn-quick-add:hover {
          background: #059669;
          color: #ffffff;
          transform: scale(1.1);
        }
        .pos4-card-body {
          padding: 10px 12px 12px;
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: space-between;
          gap: 6px;
        }
        .pos4-card-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 36px;
        }
        .pos4-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }
        .pos4-price {
          font-size: 15px;
          font-weight: 800;
          color: #0f766e;
        }
        .pos4-stock-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 12px;
        }
        .pos4-stock-pill.ok {
          background: #ecfdf5;
          color: #047857;
        }
        .pos4-stock-pill.low {
          background: #fffbeb;
          color: #b45309;
        }
        .pos4-stock-pill.out {
          background: #fef2f2;
          color: #b91c1c;
        }
      `}</style>

      <div className="page-wrapper pos-pg-wrapper ms-0">
        <div className="content pos-design p-0">
          <div className="row align-items-start pos-wrapper g-0">
            {/* Left Catalog Column */}
            <div className="col-md-12 col-lg-7 col-xl-8">
              <div className="pos-categories tabs_wrapper p-3">
                {/* Top Welcome & Search Header */}
                <div className="pos4-header-bar d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                  <div>
                    <h5 className="mb-0 fw-bold text-dark fs-16">
                      Welcome, {user?.name || user?.username || "Vikram Deshmukh"}
                    </h5>
                    <p className="text-muted mb-0 fs-12 mt-1">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div className="pos4-search-box">
                      <span className="pos4-search-icon">
                        <i className="ti ti-search" />
                      </span>
                      <input
                        type="text"
                        className="form-control pos4-search-input"
                        placeholder="Search Product, SKU or Barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="pos4-search-clear"
                          onClick={() => setSearchQuery("")}
                          title="Clear search"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        activeTab === "all" ? "btn-outline-secondary" : "btn-primary"
                      } fw-semibold px-3`}
                      onClick={() => {
                        setActiveTab("all");
                        setSearchQuery("");
                      }}
                    >
                      All Categories
                    </button>
                  </div>
                </div>

                {/* Categories Navigation Bar with Circular Arrows matching Screenshot 2 */}
                <div className="pos-categories-container-new mb-3">
                  <div className="pos-categories-header-row">
                    <h4 className="pos-categories-main-title">Categories</h4>
                    <div className="pos-category-nav-controls">
                      <button
                        type="button"
                        className="pos-cat-round-arrow-btn"
                        onClick={() => {
                          const el = document.getElementById("pos4-cat-scroll-track");
                          if (el) el.scrollBy({ left: -240, behavior: "smooth" });
                        }}
                        title="Scroll categories left"
                      >
                        <i className="ti ti-arrow-left fs-15" />
                      </button>
                      <button
                        type="button"
                        className="pos-cat-round-arrow-btn"
                        onClick={() => {
                          const el = document.getElementById("pos4-cat-scroll-track");
                          if (el) el.scrollBy({ left: 240, behavior: "smooth" });
                        }}
                        title="Scroll categories right"
                      >
                        <i className="ti ti-arrow-right fs-15" />
                      </button>
                    </div>
                  </div>

                  <div className="pos-cat-scroll-track-new" id="pos4-cat-scroll-track">
                    {/* All Items Pill */}
                    <button
                      type="button"
                      className={`pos-category-badge-pill ${activeTab === "all" ? "active" : ""}`}
                      onClick={() => setActiveTab("all")}
                    >
                      <span className="pos-category-pill-label">All Items</span>
                      <span className="pos-category-pill-count">{products.length}</span>
                    </button>

                    {/* Dynamic Backend Categories */}
                    {categories.map((cat, idx) => {
                      const isCatActive =
                        activeTab === cat.id ||
                        activeTab.toLowerCase() === cat.name.toLowerCase();
                      const catProdCount = products.filter(
                        (p) =>
                          p.category_id === cat.id ||
                          (p.category &&
                            p.category.toLowerCase() === cat.name.toLowerCase()) ||
                          (p.category_name &&
                            p.category_name.toLowerCase() === cat.name.toLowerCase())
                      ).length;

                      return (
                        <button
                          key={cat.id || idx}
                          type="button"
                          className={`pos-category-badge-pill ${isCatActive ? "active" : ""}`}
                          onClick={() => setActiveTab(cat.id || cat.name)}
                        >
                          <span className="pos-category-pill-label">{cat.name}</span>
                          <span className="pos-category-pill-count">{catProdCount}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Catalog Grid */}
                <div className="pos-products">
                  {loading ? (
                    <div className="text-center py-5 bg-white rounded border">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading products...</span>
                      </div>
                      <p className="mt-2 text-muted fs-13">Loading product catalog...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded border">
                      <i className="ti ti-package-off fs-40 text-muted mb-2 d-block" />
                      <h5 className="text-muted fw-bold">No products found</h5>
                      <p className="text-muted fs-13">
                        Try adjusting your search query or category filter.
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary mt-2"
                        onClick={() => {
                          setActiveTab("all");
                          setSearchQuery("");
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="row row-cols-xxl-4 row-cols-xl-3 row-cols-lg-2 row-cols-md-2 row-cols-sm-2 row-cols-1 g-3">
                      {filteredProducts.map((p) => {
                        const inCart = cart.find((item) => item.product.id === p.id);
                        const stockQty = p.stock_quantity ?? p.stock ?? 0;
                        const isOutOfStock = stockQty <= 0;
                        const isLowStock = stockQty > 0 && stockQty <= 5;

                        return (
                          <div key={p.id} className="col">
                            <div
                              className={`pos4-product-card ${inCart ? "in-cart" : ""} ${
                                isOutOfStock ? "out-of-stock" : ""
                              }`}
                              onClick={() => !isOutOfStock && addToCart(p)}
                              title={
                                isOutOfStock
                                  ? "Out of Stock"
                                  : `Click to add ${p.name}`
                              }
                            >
                              {/* Media Container */}
                              <div className="pos4-card-media">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="pos4-card-img"
                                    onError={(e) => {
                                      const target = e.target as HTMLElement;
                                      target.style.display = "none";
                                      const fallback =
                                        target.parentElement?.querySelector(
                                          ".pos4-card-fallback"
                                        ) as HTMLElement;
                                      if (fallback) fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null}

                                <div
                                  className="pos4-card-fallback"
                                  style={{
                                    display: p.image_url ? "none" : "flex",
                                  }}
                                >
                                  <div className="pos4-fallback-icon">
                                    <i className="ti ti-leaf" />
                                  </div>
                                  <span className="pos4-fallback-cat">
                                    {p.category_name || p.category || "Nursery"}
                                  </span>
                                </div>

                                {/* In Cart Badge */}
                                {inCart && (
                                  <div className="pos4-badge-incart">
                                    <Check size={12} className="me-1" />
                                    <span>{inCart.quantity} in cart</span>
                                  </div>
                                )}

                                {/* Quick Add Button */}
                                {!isOutOfStock && (
                                  <button
                                    type="button"
                                    className="pos4-btn-quick-add"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(p);
                                    }}
                                    title="Add to cart"
                                  >
                                    <i className="ti ti-plus" />
                                  </button>
                                )}

                                {/* Out of Stock Pill */}
                                {isOutOfStock && (
                                  <div className="pos4-badge-incart bg-danger">
                                    Out of Stock
                                  </div>
                                )}
                              </div>

                              {/* Card Content */}
                              <div className="pos4-card-body">
                                <h6 className="pos4-card-title" title={p.name}>
                                  {p.name}
                                </h6>

                                <div className="pos4-card-footer">
                                  <div className="pos4-price">
                                    {formatINR(p.selling_price || p.price || 0)}
                                  </div>
                                  <span
                                    className={`pos4-stock-pill ${
                                      isOutOfStock
                                        ? "out"
                                        : isLowStock
                                        ? "low"
                                        : "ok"
                                    }`}
                                  >
                                    {isOutOfStock ? "0 Pcs" : `${stockQty} Pcs`}
                                  </span>
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
                      className="btn btn-sm btn-outline-primary shadow-primary d-flex align-items-center"
                      onClick={() => {
                        setActiveCustomerTab("add_new");
                        setCustomerDrawerOpen(true);
                      }}
                    >
                      <i className="ti ti-plus me-1" /> Add Customer
                    </button>
                  </div>

                  <div
                    className="d-flex align-items-center justify-content-between p-2 border rounded bg-light cursor-pointer"
                    onClick={() => {
                      setActiveCustomerTab("existing");
                      setCustomerDrawerOpen(true);
                    }}
                    style={{ cursor: "pointer" }}
                    title="Click to select or change customer"
                  >
                    <div className="d-flex align-items-center">
                      <div
                        className="avatar avatar-sm rounded-circle bg-dark text-white me-2 d-flex align-items-center justify-content-center fw-bold fs-13"
                        style={{ width: "34px", height: "34px" }}
                      >
                        {selectedCustomer?.name
                          ? selectedCustomer.name.charAt(0).toUpperCase()
                          : selectedCustomer?.label
                          ? selectedCustomer.label.charAt(0).toUpperCase()
                          : "W"}
                      </div>
                      <div>
                        <div className="fw-bold fs-13 text-dark text-truncate" style={{ maxWidth: "180px" }}>
                          {selectedCustomer?.name || selectedCustomer?.label || "Walk in Customer"}
                        </div>
                        {selectedCustomer?.phone && (
                          <div className="fs-11 text-muted">{selectedCustomer.phone}</div>
                        )}
                      </div>
                    </div>
                    <span className="btn btn-sm btn-link text-primary p-0 fs-12 fw-semibold">
                      Change
                    </span>
                  </div>
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

      {/* 7. Customers Drawer (#add_order) matching DreamsPOS right offcanvas */}
      <div
        className={`offcanvas offcanvas-end customer-sidebar-offcanvas ${customerDrawerOpen ? "show" : ""}`}
        tabIndex={-1}
        id="add_order"
      >
        <div
          className="offcanvas-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom bg-white"
          style={{ minHeight: "58px" }}
        >
          <h4 className="offcanvas-title mb-0 fw-bold fs-18 text-dark">Customers</h4>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light rounded-circle border d-flex align-items-center justify-content-center"
            onClick={() => setCustomerDrawerOpen(false)}
            aria-label="Close"
            style={{ width: "32px", height: "32px", padding: 0 }}
          >
            <i className="ti ti-x fs-16 text-dark" />
          </button>
        </div>

        <div className="d-flex flex-column overflow-y-auto h-100">
          <div className="offcanvas-body pb-0 p-0 d-flex flex-column h-100">
            <div className="orders-tab d-flex align-items-start p-3">
              <ul className="nav nav-pills w-100 d-flex gap-2 align-items-center flex-sm-nowrap flex-wrap">
                <li className="flex-fill">
                  <button
                    type="button"
                    className={`nav-link w-100 d-flex align-items-center justify-content-center ${
                      activeCustomerTab === "existing" ? "active" : ""
                    }`}
                    onClick={() => setActiveCustomerTab("existing")}
                  >
                    <i className="ti ti-users me-2 fs-15" />
                    Existing Customer
                  </button>
                </li>
                <li className="flex-fill">
                  <button
                    type="button"
                    className={`nav-link w-100 d-flex align-items-center justify-content-center ${
                      activeCustomerTab === "add_new" ? "active" : ""
                    }`}
                    onClick={() => setActiveCustomerTab("add_new")}
                  >
                    <i className="ti ti-plus me-2 fs-15" />
                    Add New Customer
                  </button>
                </li>
              </ul>
            </div>

            <div className="tab-content flex-grow-1 d-flex flex-column">
              {/* Tab 1: Existing Customer */}
              {activeCustomerTab === "existing" && (
                <div
                  className="tab-pane fade show active d-flex flex-column flex-grow-1"
                  id="driversTab"
                >
                  <div className="gx-3 px-3 pb-2 pt-0">
                    <div className="col-12">
                      <label className="form-label fw-bold fs-13 mb-2 text-dark">All Drivers</label>
                      <div className="mb-0">
                        <div className="page-search position-relative">
                          <i
                            className="ti ti-search fs-15 position-absolute text-muted"
                            style={{ left: 14, top: "50%", transform: "translateY(-50%)" }}
                          />
                          <input
                            type="search"
                            className="form-control form-control-sm ps-5"
                            placeholder="Search by name/Phone Number"
                            value={customerSearchQuery}
                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                            style={{ height: "38px", borderRadius: "8px", fontSize: "13px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Cards List */}
                  <div
                    className="customer-list-scroll px-3 flex-grow-1"
                    style={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
                  >
                    {filteredCustomerList.map((c, idx) => {
                      const isSelected = selectedCustomer?.value === c.value;
                      const isAvailable =
                        c.value === "walkin" ||
                        (c.status !== "inactive" && c.status !== "unavailable");

                      return (
                        <div
                          key={c.value || idx}
                          className={`d-flex justify-content-between align-items-center p-2 mb-2 border rounded order-select-card ${
                            isSelected ? "selected-customer-card" : ""
                          }`}
                          style={{
                            cursor: "pointer",
                            background: isSelected ? "#f0f9ff" : "#ffffff",
                            borderColor: isSelected ? "#0284c7" : "#e2e8f0",
                            transition: "all 0.15s ease",
                          }}
                          onClick={() => {
                            setSelectedCustomer(c);
                          }}
                        >
                          <div className="d-flex align-items-center customer-radio-input">
                            <input
                              type="radio"
                              name="customer_radio"
                              checked={isSelected}
                              onChange={() => setSelectedCustomer(c)}
                              className="form-check-input rounded-circle me-3 mt-0"
                              style={{ width: "18px", height: "18px", cursor: "pointer" }}
                            />
                            <div className="d-flex align-items-center">
                              <div
                                className="avatar avatar-rounded flex-shrink-0 me-3 bg-light text-muted d-flex align-items-center justify-content-center fw-semibold border"
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  fontSize: "10px",
                                  color: "#94a3b8",
                                  backgroundColor: "#f1f5f9",
                                  flexShrink: 0,
                                }}
                              >
                                {c.image_url ? (
                                  <img
                                    src={c.image_url}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                ) : (
                                  <span>300 x 300</span>
                                )}
                              </div>
                              <div>
                                <h6
                                  className="fs-13 fw-bold mb-0 text-dark text-truncate"
                                  style={{ maxWidth: "150px" }}
                                >
                                  {c.name || c.label}
                                </h6>
                                <p className="fs-12 text-muted mb-0">
                                  {c.phone || "No phone number"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <span
                              className={`badge ${
                                isAvailable ? "badge-soft-success" : "badge-soft-danger"
                              }`}
                            >
                              {isAvailable ? "Available" : "Unavailable"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="offcanvas-footer d-flex align-items-center gap-2 p-3 border-top mt-auto bg-white">
                    <button
                      type="button"
                      className="btn btn-dark d-flex align-items-center justify-content-center w-100"
                      onClick={() => setCustomerDrawerOpen(false)}
                      style={{ height: "40px", borderRadius: "8px", fontWeight: 600 }}
                    >
                      <i className="ti ti-x me-1" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center justify-content-center w-100"
                      onClick={() => setCustomerDrawerOpen(false)}
                      style={{ height: "40px", borderRadius: "8px", fontWeight: 600 }}
                    >
                      <i className="ti ti-circle-check me-1" />
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Add New Customer */}
              {activeCustomerTab === "add_new" && (
                <div
                  className="tab-pane fade show active d-flex flex-column flex-grow-1"
                  id="add-new-driverTab"
                >
                  <form onSubmit={handleCreateCustomer} className="d-flex flex-column flex-grow-1">
                    <div
                      className="px-3 flex-grow-1"
                      style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
                    >
                      <div className="row g-2 pt-0">
                        <div className="col-12">
                          <div className="mb-2 d-flex align-items-center flex-wrap gap-3">
                            <div
                              className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center"
                              style={{ width: "54px", height: "54px", borderRadius: "8px" }}
                            >
                              {newCustPhoto ? (
                                <img
                                  src={newCustPhoto}
                                  alt="profile"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                  }}
                                />
                              ) : (
                                <i className="ti ti-photo fs-24 text-muted" />
                              )}
                            </div>
                            <div>
                              <label className="form-label fw-bold fs-12 mb-0">
                                Profile Photo <span className="text-danger">*</span>
                              </label>
                              <p className="fs-11 text-muted mb-1">Image should be within 5 MB</p>
                              <div className="d-flex align-items-center">
                                <label className="btn btn-icon btn-sm btn-white border rounded-circle position-relative me-2 mb-0 cursor-pointer shadow-sm">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="d-none"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) =>
                                          setNewCustPhoto(ev.target?.result as string);
                                        reader.readAsDataURL(e.target.files[0]);
                                      }
                                    }}
                                  />
                                  <i className="ti ti-pencil fs-12" />
                                </label>
                                {newCustPhoto && (
                                  <button
                                    type="button"
                                    className="btn btn-icon btn-sm btn-white border rounded-circle text-danger shadow-sm"
                                    onClick={() => setNewCustPhoto("")}
                                  >
                                    <i className="ti ti-trash fs-12" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">
                              Customer Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Customer Name"
                              value={newCustName}
                              onChange={(e) => setNewCustName(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">Phone</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Phone Number"
                              value={newCustPhone}
                              onChange={(e) => setNewCustPhone(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">Email</label>
                            <input
                              type="email"
                              className="form-control form-control-sm"
                              placeholder="Email Address"
                              value={newCustEmail}
                              onChange={(e) => setNewCustEmail(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">
                              Address Line 1 <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Street Address Line 1"
                              value={newCustAddress}
                              onChange={(e) => setNewCustAddress(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">Address Line 2</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Apartment, suite, unit, etc."
                              value={newCustAddress2}
                              onChange={(e) => setNewCustAddress2(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">Country</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Country"
                              value={newCustCountry}
                              onChange={(e) => setNewCustCountry(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">State</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="State"
                              value={newCustState}
                              onChange={(e) => setNewCustState(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">City</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="City"
                              value={newCustCity}
                              onChange={(e) => setNewCustCity(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="mb-2">
                            <label className="form-label fw-bold fs-12 mb-1">
                              Postal Code <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Postal Code"
                              value={newCustPostal}
                              onChange={(e) => setNewCustPostal(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="offcanvas-footer d-flex align-items-center gap-2 p-3 border-top mt-auto bg-white">
                      <button
                        type="button"
                        className="btn btn-dark d-flex align-items-center justify-content-center w-100"
                        onClick={() => {
                          setActiveCustomerTab("existing");
                        }}
                        style={{ height: "40px", borderRadius: "8px", fontWeight: 600 }}
                      >
                        <i className="ti ti-x me-1" />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary d-flex align-items-center justify-content-center w-100"
                        style={{ height: "40px", borderRadius: "8px", fontWeight: 600 }}
                      >
                        <i className="ti ti-circle-check me-1" />
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay with fade animation */}
      <div
        className={`customer-drawer-backdrop ${customerDrawerOpen ? "show" : ""}`}
        onClick={() => setCustomerDrawerOpen(false)}
      />

      {/* Background static theme modals for secondary triggers */}
      <PosModals />
    </div>
  );
};

export default Pos4;
