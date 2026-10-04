import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { all_routes } from "../../routes/all_routes";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Select from "react-select";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { MinusCircle, PlusCircle, Printer, Check, X } from "react-feather";
import { Banknote, CreditCard, Sparkles, QrCode, ReceiptText } from "lucide-react";
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
  shop_stock?: number;
  stock?: number;
  low_stock_threshold?: number;
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

const CountryOptions = [
  { value: "Select", label: "Select" },
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
];

const StateOptions = [
  { value: "Select", label: "Select" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Delhi", label: "Delhi" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "California", label: "California" },
  { value: "Texas", label: "Texas" },
];

const CityOptions = [
  { value: "Select", label: "Select" },
  { value: "Pune", label: "Pune" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Bangalore", label: "Bangalore" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Chennai", label: "Chennai" },
  { value: "Delhi", label: "Delhi" },
  { value: "Los Angeles", label: "Los Angeles" },
];

const GenderOptions = [
  { value: "Select", label: "Select" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const StatusOptions = [
  { value: "Select", label: "Select" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const Pos4: React.FC = () => {
  const { user } = useAuth();
  const { businessId, activeBusiness } = useBusiness();
  const location = useLocation();

  const categoryPrevRef = useRef<HTMLButtonElement | null>(null);
  const categoryNextRef = useRef<HTMLButtonElement | null>(null);

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
  const [activeOrdersTab, setActiveOrdersTab] = useState<"held" | "recent">("held");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  // Void & Reset Modals
  const [voidModalOpen, setVoidModalOpen] = useState<boolean>(false);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);

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
  const [newCustGender, setNewCustGender] = useState<string>("Male");
  const [newCustStatus, setNewCustStatus] = useState<string>("Active");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

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
    const totalStock = Number(product.stock_quantity ?? product.stock ?? product.shop_stock ?? 0);
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (totalStock > 0 && currentQty >= totalStock) {
      alert(`Cannot add more: Maximum available stock (${totalStock} ${product.unit || "Pcs"}) reached for ${product.name}`);
      return;
    }

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

  const handleCardIncrement = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product);
  };

  const handleCardDecrement = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existing = cart.find((i) => i.product.id === product.id);
    if (!existing) return;
    if (existing.quantity <= 1) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, existing.quantity - 1);
    }
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
    setActiveOrdersTab("held");
    setOrdersModalOpen(true);
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

  // Open Recent Orders / Held Bills
  const handleOpenOrdersModal = async (tab: "held" | "recent" = "held") => {
    setActiveOrdersTab(tab);
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

        /* Category Filter Tabs & Active State */
        .pos-four-enhanced .category-tab {
          display: flex;
          list-style: none;
          padding-left: 0;
          margin-bottom: 1.25rem;
        }
        .pos-four-enhanced .category-tab .swiper-slide {
          height: auto;
          display: flex;
          min-width: 0;
        }
        .pos-four-enhanced .category-tab .swiper-slide li {
          width: 100%;
          min-width: 0;
          list-style: none;
        }
        .pos-four-enhanced .category-tab .nav-link,
        .pos-four-enhanced .category-tab li a {
          padding: 6px 10px 6px 14px !important;
          background: #ffffff !important;
          border-radius: 50px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #334155 !important;
          border: 1.5px solid #e2e8f0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 6px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          text-decoration: none !important;
          width: 100% !important;
          min-width: 0 !important;
          overflow: hidden !important;
          user-select: none !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
        }
        .pos-four-enhanced .category-tab .cat-name {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
          font-size: 13px;
        }
        .pos-four-enhanced .category-tab .nav-link:hover,
        .pos-four-enhanced .category-tab li a:hover {
          background: #f8fafc !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .pos-four-enhanced .category-tab .nav-link.active,
        .pos-four-enhanced .category-tab li a.active {
          background: #ecfdf5 !important;
          border: 1.5px solid #059669 !important;
          color: #065f46 !important;
          font-weight: 600 !important;
          border-radius: 50px !important;
          box-shadow: 0 1px 4px rgba(5, 150, 105, 0.15) !important;
        }
        .pos-four-enhanced .category-tab .nav-link .badge,
        .pos-four-enhanced .category-tab li a .badge {
          background: #f1f5f9 !important;
          border-radius: 50px !important;
          padding: 2px 8px !important;
          font-size: 11.5px !important;
          font-weight: 600 !important;
          color: #64748b !important;
          transition: all 0.2s ease !important;
          flex-shrink: 0 !important;
          margin-left: auto !important;
        }
        .pos-four-enhanced .category-tab .nav-link.active .badge,
        .pos-four-enhanced .category-tab li a.active .badge {
          background: #059669 !important;
          color: #ffffff !important;
          font-weight: 700 !important;
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
        .quantity-control {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 50px;
          text-align: center;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        .quantity-control .btn {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          outline: none;
          font-size: 13px;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s;
          flex-shrink: 0;
          cursor: pointer;
        }
        .quantity-control .btn:hover:not(:disabled) {
          background: #0d9488;
          color: #ffffff;
          border-color: #0d9488;
        }
        .quantity-control .btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: #f8fafc;
          border-color: #f1f5f9;
        }
        .quantity-control .quantity-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          width: 100%;
          color: #0f172a;
          padding: 0;
        }
        .quantity-control.active {
          border-color: #0d9488;
          background: #f0fdf4;
          box-shadow: 0 1px 4px rgba(13, 148, 136, 0.12);
        }
        .quantity-control.active .quantity-input {
          color: #0d9488;
        }
        .quantity-control.active .btn.minus-btn {
          background: #e6fffa;
          color: #0d9488;
          border-color: #99f6e4;
        }
        .quantity-control.active .btn.minus-btn:hover:not(:disabled) {
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
        }
        .quantity-control.active .btn.add-btn {
          background: #0d9488;
          color: #ffffff;
          border-color: #0d9488;
        }
        .quantity-control.active .btn.add-btn:hover:not(:disabled) {
          background: #0f766e;
          border-color: #0f766e;
        }

        /* Slide-in Left Drawer Modals */
        @keyframes posSlideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0.6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes posFadeInBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .pos-left-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(3px);
          z-index: 1060;
          display: flex;
          justify-content: flex-start;
          align-items: stretch;
          animation: posFadeInBackdrop 0.2s ease-out;
        }

        .pos-left-modal-content {
          background: #ffffff;
          height: 100vh;
          max-height: 100vh;
          width: 440px;
          max-width: 95vw;
          display: flex;
          flex-direction: column;
          box-shadow: 12px 0 36px rgba(0, 0, 0, 0.18);
          border-right: 1.5px solid #e2e8f0;
          animation: posSlideInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 1061;
          overflow: hidden;
        }

        .pos-left-modal-content.wide {
          width: 620px;
        }

        .pos-left-modal-content.compact {
          width: 380px;
        }

        .pos-left-modal-header {
          padding: 16px 20px;
          border-bottom: 1.5px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          flex-shrink: 0;
        }

        .pos-left-modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1 1 auto;
        }

        .pos-left-modal-footer {
          padding: 14px 20px;
          border-top: 1.5px solid #f1f5f9;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }

        .pos-left-modal-preset-btn {
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pos-left-modal-preset-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .pos-left-modal-preset-btn.active {
          background: #ecfdf5;
          border-color: #059669;
          color: #065f46;
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
                    <Link
                      to={all_routes.dashboard}
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fw-medium"
                      title="Go to Dashboard"
                    >
                      <i className="ti ti-layout-dashboard" />
                      <span className="d-none d-md-inline">Dashboard</span>
                    </Link>
                    <Link
                      to={all_routes.posorder}
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fw-medium"
                      title="View POS Orders"
                    >
                      <i className="ti ti-shopping-cart" />
                      <span className="d-none d-md-inline">Orders</span>
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fw-medium"
                      onClick={loadPOSData}
                      title="Reload Product Catalog"
                    >
                      <i className="ti ti-refresh" />
                      <span className="d-none d-md-inline">Reload</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 fw-medium"
                      onClick={handleToggleFullscreen}
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      <i className={`ti ${isFullscreen ? "ti-minimize" : "ti-maximize"}`} />
                    </button>
                  </div>
                </div>

                {/* Start Categories matching Theme2 */}
                <div className="categories mb-4">
                  <div className="pos-title d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <h5 className="mb-0 title">Categories</h5>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="slick-arrow category-prev"
                        ref={categoryPrevRef}
                        title="Previous category"
                      >
                        <i className="icon-arrow-left" />
                      </button>

                      <button
                        type="button"
                        className="slick-arrow category-next"
                        ref={categoryNextRef}
                        title="Next category"
                      >
                        <i className="icon-arrow-right" />
                      </button>
                    </div>
                  </div>

                  {/* Swiper Category Slider matching Theme2 */}
                  <Swiper
                    modules={[Navigation]}
                    speed={400}
                    spaceBetween={10}
                    navigation={{
                      prevEl: categoryPrevRef.current,
                      nextEl: categoryNextRef.current,
                    }}
                    onBeforeInit={(swiper) => {
                      // @ts-ignore
                      swiper.params.navigation.prevEl = categoryPrevRef.current;
                      // @ts-ignore
                      swiper.params.navigation.nextEl = categoryNextRef.current;
                      swiper.navigation.init();
                      swiper.navigation.update();
                    }}
                    breakpoints={{
                      1600: { slidesPerView: 4.5 },
                      1399: { slidesPerView: 3.8 },
                      1100: { slidesPerView: 3.2 },
                      768: { slidesPerView: 2.6 },
                      576: { slidesPerView: 2 },
                    }}
                    className="category-tab border-0 category-slider mb-4"
                  >
                    <SwiperSlide>
                      <li className="nav-item w-100">
                        <Link
                          to="#all-menu"
                          className={`nav-link ${activeTab === "all" ? "active" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveTab("all");
                          }}
                          title={`All Products (${products.length})`}
                        >
                          <span className="cat-name">All</span>
                          <span className="badge">{products.length}</span>
                        </Link>
                      </li>
                    </SwiperSlide>

                    {categories.map((cat, idx) => {
                      const isCatActive =
                        activeTab === cat.id ||
                        (cat.name && activeTab.toLowerCase() === cat.name.toLowerCase());
                      const catProdCount = products.filter(
                        (p) =>
                          p.category_id === cat.id ||
                          (p.category &&
                            cat.name &&
                            p.category.toLowerCase() === cat.name.toLowerCase()) ||
                          (p.category_name &&
                            cat.name &&
                            p.category_name.toLowerCase() === cat.name.toLowerCase())
                      ).length;

                      return (
                        <SwiperSlide key={cat.id || idx}>
                          <li className="nav-item w-100">
                            <Link
                              to={`#cat-${cat.id || idx}`}
                              className={`nav-link ${isCatActive ? "active" : ""}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(cat.id || cat.name);
                              }}
                              title={`${cat.name} (${catProdCount})`}
                            >
                              <span className="cat-name">{cat.name}</span>
                              <span className="badge">{catProdCount}</span>
                            </Link>
                          </li>
                        </SwiperSlide>
                      );
                    })}
                  </Swiper>
                </div>
                {/* End Categories */}

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
                        const inCartQty = inCart ? inCart.quantity : 0;
                        const totalStock = Number(
                          p.stock_quantity ?? p.stock ?? (p as any).shop_stock ?? 0
                        );
                        const availableStock = Math.max(0, totalStock - inCartQty);
                        const isOutOfStock = totalStock <= 0;
                        const isAllInCart = !isOutOfStock && availableStock <= 0;
                        const isLowStock =
                          !isOutOfStock &&
                          availableStock > 0 &&
                          availableStock <= (p.low_stock_threshold || 5);
                        const unitLabel = p.unit || "Pcs";

                        let stockClass = "ok";
                        let stockText = `${availableStock} ${unitLabel}`;
                        if (isOutOfStock) {
                          stockClass = "out";
                          stockText = `0 ${unitLabel}`;
                        } else if (isAllInCart) {
                          stockClass = "low";
                          stockText = `0 ${unitLabel} left`;
                        } else if (isLowStock) {
                          stockClass = "low";
                          stockText = inCartQty > 0 ? `${availableStock} ${unitLabel} left` : `${availableStock} ${unitLabel}`;
                        } else if (inCartQty > 0) {
                          stockClass = "ok";
                          stockText = `${availableStock} left`;
                        }

                        return (
                          <div key={p.id} className="col">
                            <div
                              className={`pos4-product-card ${inCartQty > 0 ? "in-cart" : ""} ${
                                isOutOfStock ? "out-of-stock" : ""
                              }`}
                              onClick={() => !isOutOfStock && !isAllInCart && addToCart(p)}
                              title={
                                isOutOfStock
                                  ? "Out of Stock"
                                  : isAllInCart
                                  ? `All ${totalStock} ${unitLabel} in cart`
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
                                {inCartQty > 0 && (
                                  <div className="pos4-badge-incart">
                                    <Check size={12} className="me-1" />
                                    <span>{inCartQty} in cart</span>
                                  </div>
                                )}

                                {/* Quick Add Button (Top Right) */}
                                {!isOutOfStock && !isAllInCart && inCartQty === 0 && (
                                  <button
                                    type="button"
                                    className="pos4-btn-quick-add"
                                    onClick={(e) => handleCardIncrement(p, e)}
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
                                    className={`pos4-stock-pill ${stockClass}`}
                                    title={`Backend stock: ${totalStock} ${unitLabel}`}
                                  >
                                    {stockText}
                                  </span>
                                </div>

                                {/* Quantity Control (- 1 +) matching Theme2 */}
                                <div
                                  className={`quantity-control ${inCartQty > 0 ? "active" : ""}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="minus-btn btn"
                                    disabled={inCartQty <= 0}
                                    onClick={(e) => handleCardDecrement(p, e)}
                                    title="Decrease quantity"
                                  >
                                    <i className="ti ti-minus" />
                                  </button>

                                  <input
                                    type="text"
                                    className="quantity-input"
                                    value={inCartQty}
                                    readOnly
                                    aria-label="Quantity"
                                  />

                                  <button
                                    type="button"
                                    className="add-btn btn"
                                    disabled={isOutOfStock || isAllInCart}
                                    onClick={(e) => handleCardIncrement(p, e)}
                                    title={isAllInCart ? "All available stock in cart" : "Increase quantity"}
                                  >
                                    <i className="ti ti-plus" />
                                  </button>
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
                {/* Customer Info Section matching Theme2 */}
                <div className="order-info pb-3 border-bottom mb-3">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <div className="d-flex align-items-center">
                      <h5 className="mb-0 fw-bold">Order Details</h5>
                      <span className="badge badge-purple badge-xs fs-10 fw-medium ms-2">
                        #{orderNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-white shadow-sm d-flex align-items-center text-danger border btn-sm"
                      onClick={clearCart}
                      title="Clear Cart"
                    >
                      <i className="icon-x me-1" /> Clear
                    </button>
                  </div>

                  <div className="select-input">
                    <div className="input-item d-flex align-items-center gap-2 flex-grow-1">
                      <Select
                        className="select2 flex-grow-1"
                        classNamePrefix="react-select"
                        options={customers}
                        value={selectedCustomer}
                        onChange={(opt: any) => setSelectedCustomer(opt)}
                        placeholder="Select Customer..."
                        isSearchable
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-icon"
                        onClick={() => {
                          setActiveCustomerTab("add_new");
                          setCustomerDrawerOpen(true);
                        }}
                        title="Add Customer"
                      >
                        <i className="icon-plus" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-icon btn-dark fs-14 fw-normal"
                      onClick={() => {
                        setActiveCustomerTab("existing");
                        setCustomerDrawerOpen(true);
                      }}
                      title="Browse / Change Customers"
                    >
                      <i className="icon-users-round" />
                    </button>
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
                        onClick={() => handleOpenOrdersModal("held")}
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
                        onClick={() => setVoidModalOpen(true)}
                      >
                        <i className="ti ti-trash me-1" />
                        Void
                      </button>
                      <button
                        type="button"
                        className="btn btn-indigo d-flex align-items-center justify-content-center w-100 mb-2 py-1 fs-13"
                        onClick={() => setResetModalOpen(true)}
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
                        onClick={() => handleOpenOrdersModal("recent")}
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
                    {[
                      { key: "cash", label: "Cash", Icon: Banknote, iconColor: "#10b981" },
                      { key: "card", label: "Card", Icon: CreditCard, iconColor: "#3b82f6" },
                      { key: "points", label: "Points", Icon: Sparkles, iconColor: "#f59e0b" },
                      { key: "upi", label: "UPI", Icon: QrCode, iconColor: "#06b6d4" },
                      { key: "cheque", label: "Cheque", Icon: ReceiptText, iconColor: "#8b5cf6" },
                    ].map(({ key, label, Icon, iconColor }) => {
                      const isSelected = selectedPaymentMode === key;
                      return (
                        <div className="col d-flex" key={key}>
                          <div
                            className={`payment-item flex-fill text-center p-2 rounded border cursor-pointer ${
                              isSelected ? "active border-primary" : ""
                            }`}
                            onClick={() => handleOpenPayment(key)}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: "72px",
                              backgroundColor: isSelected ? "#ecfdf5" : "#ffffff",
                              borderColor: isSelected ? "#059669" : "#e2e8f0",
                              borderWidth: "1.5px",
                              borderStyle: "solid",
                              borderRadius: "10px",
                              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                              boxShadow: isSelected ? "0 2px 6px rgba(5, 150, 105, 0.16)" : "0 1px 2px rgba(0, 0, 0, 0.03)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                backgroundColor: isSelected ? "rgba(5, 150, 105, 0.12)" : "#f8fafc",
                                color: isSelected ? "#059669" : iconColor,
                                transition: "all 0.2s ease",
                                marginBottom: "4px",
                              }}
                            >
                              <Icon size={20} strokeWidth={2} />
                            </div>
                            <p
                              className="mb-0 fs-12"
                              style={{
                                fontWeight: isSelected ? 700 : 600,
                                color: isSelected ? "#065f46" : "#334155",
                                transition: "color 0.2s ease",
                              }}
                            >
                              {label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
      {/* SLIDE-IN LEFT DRAWERS FOR ACTION BUTTONS */}
      {/* ========================================================================= */}

      {/* 1. Payment Drawer (Slides from Left) */}
      {paymentModalOpen && (
        <div
          className="pos-left-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPaymentModalOpen(false);
          }}
        >
          <div className="pos-left-modal-content">
            <div className="pos-left-modal-header">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-success text-success"
                  style={{ width: "36px", height: "36px" }}
                >
                  <Banknote size={20} />
                </div>
                <h5 className="modal-title fw-bold mb-0">
                  Finalize Sale - {selectedPaymentMode.toUpperCase()}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setPaymentModalOpen(false)}
              />
            </div>
            <div className="pos-left-modal-body">
              <div className="mb-3 text-center p-3 rounded" style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0" }}>
                <small className="text-muted text-uppercase fw-bold fs-11">Grand Total Due</small>
                <h2 className="fw-bold mb-0" style={{ color: "#065f46" }}>{formatINR(totals.grandTotal)}</h2>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold fs-13">Select Payment Method</label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { key: "cash", label: "Cash", Icon: Banknote },
                    { key: "card", label: "Card", Icon: CreditCard },
                    { key: "points", label: "Points", Icon: Sparkles },
                    { key: "upi", label: "UPI", Icon: QrCode },
                    { key: "cheque", label: "Cheque", Icon: ReceiptText },
                  ].map(({ key, label, Icon }) => {
                    const isSel = selectedPaymentMode === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className="btn btn-sm d-flex align-items-center gap-1 flex-fill justify-content-center py-2"
                        style={{
                          borderRadius: "8px",
                          border: isSel ? "1.5px solid #059669" : "1.5px solid #e2e8f0",
                          background: isSel ? "#ecfdf5" : "#ffffff",
                          color: isSel ? "#065f46" : "#475569",
                          fontWeight: isSel ? 700 : 500,
                        }}
                        onClick={() => setSelectedPaymentMode(key)}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold fs-13">Received Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold fs-13">Change Return</label>
                  <input
                    type="text"
                    className="form-control bg-light fw-bold text-success"
                    value={formatINR(Math.max(0, Number(receivedAmount) - totals.grandTotal))}
                    readOnly
                  />
                </div>
              </div>

              {/* Quick Cash Shortcuts */}
              {selectedPaymentMode === "cash" && (
                <div className="mb-3">
                  <label className="form-label text-muted fs-12 mb-1">Quick Tender Cash</label>
                  <div className="d-flex gap-2 flex-wrap">
                    {[
                      { label: "Exact", val: totals.grandTotal },
                      { label: "₹500", val: 500 },
                      { label: "₹1000", val: 1000 },
                      { label: "₹2000", val: 2000 },
                    ].map(({ label, val }) => (
                      <button
                        key={label}
                        type="button"
                        className="pos-left-modal-preset-btn flex-fill py-1 text-center"
                        onClick={() => setReceivedAmount(val.toString())}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold fs-13">Order / Reference Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Optional notes or transaction ref..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="pos-left-modal-footer">
              <button
                type="button"
                className="btn btn-light"
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

      {/* 3. Discount Drawer (Slides from Left) */}
      {discountModalOpen && (
        <div
          className="pos-left-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDiscountModalOpen(false);
          }}
        >
          <div className="pos-left-modal-content compact">
            <div className="pos-left-modal-header">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-teal text-teal"
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="ti ti-percentage fs-18" />
                </div>
                <h5 className="modal-title fw-bold mb-0">Apply Discount</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setDiscountModalOpen(false)}
              />
            </div>
            <div className="pos-left-modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold fs-13">Discount Percentage (%)</label>
                <div className="input-group mb-3">
                  <input
                    type="number"
                    className="form-control form-control-lg fw-bold"
                    min={0}
                    max={100}
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(e.target.value)}
                    placeholder="0"
                  />
                  <span className="input-group-text fw-bold">%</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted fs-12 mb-2">Quick Presets</label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { label: "5%", val: "5" },
                    { label: "10%", val: "10" },
                    { label: "15%", val: "15" },
                    { label: "20%", val: "20" },
                    { label: "25%", val: "25" },
                    { label: "50%", val: "50" },
                    { label: "Clear", val: "0" },
                  ].map(({ label, val }) => (
                    <button
                      key={label}
                      type="button"
                      className={`pos-left-modal-preset-btn ${tempDiscount === val ? "active" : ""}`}
                      onClick={() => setTempDiscount(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-light rounded mt-4">
                <div className="d-flex justify-content-between fs-13 mb-1">
                  <span className="text-muted">Subtotal:</span>
                  <span className="fw-semibold">{formatINR(totals.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between fs-13 text-danger">
                  <span>Discount Amount:</span>
                  <span className="fw-bold">
                    -{formatINR((totals.subtotal * (Number(tempDiscount) || 0)) / 100)}
                  </span>
                </div>
              </div>
            </div>
            <div className="pos-left-modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setDiscountModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 fw-semibold"
                onClick={() => {
                  setDiscountPercent(Math.min(100, Math.max(0, Number(tempDiscount) || 0)));
                  setDiscountModalOpen(false);
                }}
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tax Drawer (Slides from Left) */}
      {taxModalOpen && (
        <div
          className="pos-left-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTaxModalOpen(false);
          }}
        >
          <div className="pos-left-modal-content compact">
            <div className="pos-left-modal-header">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-purple text-purple"
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="ti ti-receipt-tax fs-18" />
                </div>
                <h5 className="modal-title fw-bold mb-0">Order Tax Rate</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setTaxModalOpen(false)}
              />
            </div>
            <div className="pos-left-modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold fs-13">Tax Rate Percentage (%)</label>
                <div className="input-group mb-3">
                  <input
                    type="number"
                    className="form-control form-control-lg fw-bold"
                    min={0}
                    max={100}
                    value={tempTax}
                    onChange={(e) => setTempTax(e.target.value)}
                    placeholder="0"
                  />
                  <span className="input-group-text fw-bold">%</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted fs-12 mb-2">GST Presets</label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { label: "0% (Exempt)", val: "0" },
                    { label: "5% GST", val: "5" },
                    { label: "12% GST", val: "12" },
                    { label: "18% GST", val: "18" },
                    { label: "28% GST", val: "28" },
                  ].map(({ label, val }) => (
                    <button
                      key={label}
                      type="button"
                      className={`pos-left-modal-preset-btn ${tempTax === val ? "active" : ""}`}
                      onClick={() => setTempTax(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-light rounded mt-4">
                <div className="d-flex justify-content-between fs-13 mb-1">
                  <span className="text-muted">Taxable Subtotal:</span>
                  <span className="fw-semibold">{formatINR(totals.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between fs-13 text-success">
                  <span>Estimated Tax:</span>
                  <span className="fw-bold">
                    +{formatINR((totals.subtotal * (Number(tempTax) || 0)) / 100)}
                  </span>
                </div>
              </div>
            </div>
            <div className="pos-left-modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setTaxModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 fw-semibold"
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
      )}

      {/* 5. Shipping Cost Drawer (Slides from Left) */}
      {shippingModalOpen && (
        <div
          className="pos-left-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShippingModalOpen(false);
          }}
        >
          <div className="pos-left-modal-content compact">
            <div className="pos-left-modal-header">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-pink text-pink"
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="ti ti-package-import fs-18" />
                </div>
                <h5 className="modal-title fw-bold mb-0">Shipping &amp; Delivery</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShippingModalOpen(false)}
              />
            </div>
            <div className="pos-left-modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold fs-13">Shipping Amount (₹)</label>
                <div className="input-group mb-3">
                  <span className="input-group-text fw-bold">₹</span>
                  <input
                    type="number"
                    className="form-control form-control-lg fw-bold"
                    min={0}
                    value={tempShipping}
                    onChange={(e) => setTempShipping(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted fs-12 mb-2">Delivery Presets</label>
                <div className="d-flex gap-2 flex-wrap">
                  {[
                    { label: "Free (₹0)", val: "0" },
                    { label: "Standard (₹50)", val: "50" },
                    { label: "Express (₹100)", val: "100" },
                    { label: "Bulk / Heavy (₹200)", val: "200" },
                  ].map(({ label, val }) => (
                    <button
                      key={label}
                      type="button"
                      className={`pos-left-modal-preset-btn ${tempShipping === val ? "active" : ""}`}
                      onClick={() => setTempShipping(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pos-left-modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setShippingModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 fw-semibold"
                onClick={() => {
                  setShippingCost(Math.max(0, Number(tempShipping) || 0));
                  setShippingModalOpen(false);
                }}
              >
                Apply Shipping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. View Orders & Held Bills / Recent Drawer (Slides from Left) */}
      {ordersModalOpen && (
        <div
          className="pos-left-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOrdersModalOpen(false);
          }}
        >
          <div className="pos-left-modal-content wide">
            <div className="pos-left-modal-header">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-primary text-primary"
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="ti ti-shopping-cart fs-18" />
                </div>
                <h5 className="modal-title fw-bold mb-0">Orders &amp; Held Bills</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setOrdersModalOpen(false)}
              />
            </div>
            <div className="pos-left-modal-body p-0">
              <ul className="nav nav-tabs nav-justified border-bottom">
                <li className="nav-item">
                  <button
                    className={`nav-link fw-bold ${activeOrdersTab === "held" ? "active" : ""}`}
                    onClick={() => setActiveOrdersTab("held")}
                  >
                    On-Hold Orders ({heldBills.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link fw-bold ${activeOrdersTab === "recent" ? "active" : ""}`}
                    onClick={() => setActiveOrdersTab("recent")}
                  >
                    Recent Transactions
                  </button>
                </li>
              </ul>

              <div className="p-3">
                {/* Held Bills Tab */}
                {activeOrdersTab === "held" && (
                  <div>
                    {heldBills.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className="ti ti-inbox fs-36 mb-2 d-block text-muted" />
                        <h6 className="fw-bold mb-1">No Orders on Hold</h6>
                        <p className="fs-12 text-muted">Click the Hold button on any active order to save it here.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
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
                )}

                {/* Recent Bills Tab */}
                {activeOrdersTab === "recent" && (
                  <div>
                    {recentInvoices.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className="ti ti-history fs-36 mb-2 d-block text-muted" />
                        <h6 className="fw-bold mb-1">No Recent Transactions</h6>
                        <p className="fs-12 text-muted">Completed sales will automatically show up here.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Invoice #</th>
                              <th>Customer</th>
                              <th>Method</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentInvoices.slice(0, 10).map((inv) => (
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
                )}
              </div>
            </div>
            <div className="pos-left-modal-footer">
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
      )}

      {/* 7. Void Confirmation Drawer (Slides from Left) */}
      {voidModalOpen && (
        <div
          className="pos-left-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVoidModalOpen(false);
          }}
        >
          <div className="pos-left-modal-content compact">
            <div className="pos-left-modal-header">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-danger text-danger"
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="ti ti-trash fs-18" />
                </div>
                <h5 className="modal-title fw-bold mb-0 text-danger">Void Current Order</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setVoidModalOpen(false)}
              />
            </div>
            <div className="pos-left-modal-body text-center py-4">
              <div
                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center bg-soft-danger text-danger"
                style={{ width: "64px", height: "64px" }}
              >
                <i className="ti ti-alert-triangle fs-32" />
              </div>
              <h5 className="fw-bold mb-2">Are you sure?</h5>
              <p className="text-muted fs-13 mb-0">
                This will void the current transaction and clear all <strong>{cart.length}</strong> items from the cart.
              </p>
            </div>
            <div className="pos-left-modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setVoidModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger px-4 fw-semibold"
                onClick={() => {
                  clearCart();
                  setVoidModalOpen(false);
                }}
              >
                Yes, Void Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Reset Register Confirmation Drawer (Slides from Left) */}
      {resetModalOpen && (
        <div
          className="pos-left-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetModalOpen(false);
          }}
        >
          <div className="pos-left-modal-content compact">
            <div className="pos-left-modal-header">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-indigo text-indigo"
                  style={{ width: "36px", height: "36px" }}
                >
                  <i className="ti ti-reload fs-18" />
                </div>
                <h5 className="modal-title fw-bold mb-0">Reset POS Register</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setResetModalOpen(false)}
              />
            </div>
            <div className="pos-left-modal-body text-center py-4">
              <div
                className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center bg-soft-indigo text-indigo"
                style={{ width: "64px", height: "64px" }}
              >
                <i className="ti ti-refresh fs-32" />
              </div>
              <h5 className="fw-bold mb-2">Reset Register State?</h5>
              <p className="text-muted fs-13 mb-0">
                This will reset cart items, discount, shipping, and customer selection to a fresh state.
              </p>
            </div>
            <div className="pos-left-modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setResetModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-indigo px-4 fw-semibold"
                onClick={() => {
                  clearCart();
                  setDiscountPercent(0);
                  setOrderTaxPercent(0);
                  setShippingCost(0);
                  setSelectedCustomer({ value: "walkin", label: "Walk in Customer (Default)" });
                  setResetModalOpen(false);
                }}
              >
                Reset Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Drawer (Slides from Left) */}
      <div
        className={`offcanvas offcanvas-start ${customerDrawerOpen ? "show" : ""}`}
        tabIndex={-1}
        id="add_order"
        style={{
          visibility: customerDrawerOpen ? "visible" : "hidden",
          transform: customerDrawerOpen ? "none" : "translateX(calc(-100% - 30px))",
          transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 1065,
          width: "520px",
          maxWidth: "100vw",
        }}
      >
        {/* Fixed Header */}
        <div className="offcanvas-header d-flex align-items-center justify-content-between flex-shrink-0">
          <h4 className="offcanvas-title mb-0">Customers</h4>
          <button
            type="button"
            className="btn-close btn-close-modal"
            onClick={() => setCustomerDrawerOpen(false)}
            aria-label="Close"
          >
            <i className="icon-x" />
          </button>
        </div>

        {/* Fixed Tab Switcher */}
        <div className="orders-tab d-flex align-items-start p-3 flex-shrink-0 border-bottom">
          <ul className="nav nav-pills w-100 d-flex gap-3 align-items-center flex-sm-nowrap flex-wrap">
            <li>
              <button
                type="button"
                className={`nav-link border-0 ${
                  activeCustomerTab === "existing" ? "active" : ""
                } d-flex align-items-center justify-content-center`}
                onClick={() => setActiveCustomerTab("existing")}
              >
                <i className="icon-users-round me-2" />
                Existing Customer
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`nav-link border-0 ${
                  activeCustomerTab === "add_new" ? "active" : ""
                } d-flex align-items-center justify-content-center`}
                onClick={() => setActiveCustomerTab("add_new")}
              >
                <i className="icon-plus me-2" />
                Add New Customer
              </button>
            </li>
          </ul>
        </div>

        {/* Scrollable Body */}
        <div className="offcanvas-body flex-grow-1 overflow-y-auto p-3">
          {activeCustomerTab === "existing" ? (
            <div id="driversTab">
              <div className="mb-3">
                <label className="form-label fw-bold">All Customers</label>
                <div className="page-search position-relative">
                  <i className="icon-search fs-14" />
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search by name or Phone Number..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-0 pe-2"
                      onClick={() => setCustomerSearchQuery("")}
                      style={{ textDecoration: "none" }}
                    >
                      <i className="icon-x fs-14" />
                    </button>
                  )}
                </div>
              </div>

              <div className="customer-scroll-area">
                {filteredCustomerList.map((c, idx) => {
                  const isSelected = selectedCustomer?.value === c.value;
                  const isAvailable =
                    c.value === "walkin" ||
                    (c.status !== "inactive" &&
                      c.status !== "unavailable" &&
                      c.status !== "Inactive");

                  return (
                    <div
                      key={c.value || idx}
                      className={`d-flex justify-content-between p-3 mb-2 border rounded order-select-card ${
                        isSelected ? "selected" : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <div className="d-flex align-items-center customer-radio-input">
                        <input
                          type="radio"
                          name="customer"
                          checked={isSelected}
                          onChange={() => setSelectedCustomer(c)}
                          className="form-check-input rounded-circle me-3"
                          style={{ cursor: "pointer" }}
                        />
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-rounded flex-shrink-0 me-2">
                            {c.image_url ? (
                              <img
                                src={c.image_url}
                                alt="customer"
                                className="img-fluid rounded-circle"
                                style={{
                                  width: 40,
                                  height: 40,
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="avatar avatar-rounded flex-shrink-0 bg-light text-body d-flex align-items-center justify-content-center"
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  fontSize: 14,
                                  fontWeight: 600,
                                }}
                              >
                                {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                              </div>
                            )}
                          </div>
                          <div>
                            <h6 className="fs-14 fw-bold mb-1">
                              {c.name || c.label}
                            </h6>
                            <p className="fs-13 text-muted mb-0">
                              {c.phone || "No phone number"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <span
                          className={`badge ${
                            isAvailable
                              ? "badge-soft-success"
                              : "badge-soft-danger"
                          }`}
                        >
                          {isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredCustomerList.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    <i className="ti ti-user-x fs-28 mb-2 d-block" />
                    <p className="mb-0 fs-13">No customers found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div id="add-new-driverTab">
              <form id="add-new-customer-form" onSubmit={handleCreateCustomer}>
                <div className="row gx-3">
                  <div className="col-md-12">
                    <div className="mb-3 d-flex align-items-center flex-wrap gap-3">
                      <div
                        className="avatar avatar-3xl border bg-light d-flex align-items-center justify-content-center"
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        {newCustPhoto ? (
                          <img
                            src={newCustPhoto}
                            alt="profile"
                            className="img-fluid w-100 h-100 object-fit-cover"
                          />
                        ) : (
                          <i className="icon-images fs-28 text-dark" />
                        )}
                      </div>
                      <div>
                        <label className="form-label mb-1">
                          Profile Photo
                        </label>
                        <p className="fs-12 mb-2 text-muted">Image size within 5 MB</p>
                        <div className="d-flex align-items-center">
                          <div className="btn btn-icon btn-sm btn-white rounded-circle position-relative me-2 border shadow-sm">
                            <input
                              type="file"
                              accept="image/*"
                              className="form-control position-absolute w-100 h-100 top-0 start-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) =>
                                    setNewCustPhoto(ev.target?.result as string);
                                  reader.readAsDataURL(e.target.files[0]);
                                }
                              }}
                            />
                            <i className="icon-pencil-line" />
                          </div>
                          {newCustPhoto && (
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-white rounded-circle text-danger border shadow-sm"
                              onClick={() => setNewCustPhoto("")}
                            >
                              <i className="icon-trash-2" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Customer Name<span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="Enter Customer Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="Enter Phone Number"
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        placeholder="Enter Email Address"
                      />
                    </div>
                  </div>

                  <div className="col-lg-12 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Address Line 1<span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        placeholder="Enter Address Line 1"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-12 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Address Line 2</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustAddress2}
                        onChange={(e) => setNewCustAddress2(e.target.value)}
                        placeholder="Enter Address Line 2"
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Country</label>
                      <Select
                        className="select"
                        classNamePrefix="react-select"
                        options={CountryOptions}
                        value={{ value: newCustCountry, label: newCustCountry }}
                        onChange={(opt: any) =>
                          setNewCustCountry(opt?.value || "India")
                        }
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">State</label>
                      <Select
                        className="select"
                        classNamePrefix="react-select"
                        options={StateOptions}
                        value={{ value: newCustState, label: newCustState }}
                        onChange={(opt: any) =>
                          setNewCustState(opt?.value || "Maharashtra")
                        }
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">City</label>
                      <Select
                        className="select"
                        classNamePrefix="react-select"
                        options={CityOptions}
                        value={{ value: newCustCity, label: newCustCity }}
                        onChange={(opt: any) =>
                          setNewCustCity(opt?.value || "Pune")
                        }
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Postal Code<span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustPostal}
                        onChange={(e) => setNewCustPostal(e.target.value)}
                        placeholder="Enter Postal Code"
                        required
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Gender</label>
                      <Select
                        className="select"
                        classNamePrefix="react-select"
                        options={GenderOptions}
                        value={{ value: newCustGender, label: newCustGender }}
                        onChange={(opt: any) => setNewCustGender(opt?.value || "Male")}
                      />
                    </div>
                  </div>

                  <div className="col-lg-6 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <Select
                        className="select"
                        classNamePrefix="react-select"
                        options={StatusOptions}
                        value={{ value: newCustStatus, label: newCustStatus }}
                        onChange={(opt: any) => setNewCustStatus(opt?.value || "Active")}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Pinned Bottom Footer */}
        <div className="offcanvas-footer d-flex align-items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className="btn btn-dark d-flex align-items-center justify-content-center w-100"
            onClick={() => {
              if (activeCustomerTab === "add_new") {
                setActiveCustomerTab("existing");
              } else {
                setCustomerDrawerOpen(false);
              }
            }}
          >
            <i className="icon-x me-1" />
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center justify-content-center w-100"
            onClick={() => {
              if (activeCustomerTab === "add_new") {
                const form = document.getElementById("add-new-customer-form") as HTMLFormElement;
                if (form) {
                  if (form.reportValidity()) {
                    form.requestSubmit();
                  }
                }
              } else {
                setCustomerDrawerOpen(false);
              }
            }}
            disabled={activeCustomerTab === "add_new" && isSubmitting}
          >
            <i className="icon-circle-check me-1" />
            {activeCustomerTab === "add_new" && isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* Backdrop overlay */}
      {customerDrawerOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setCustomerDrawerOpen(false)}
          style={{ zIndex: 1040 }}
        />
      )}

      {/* Background static theme modals for secondary triggers */}
      <PosModals />
    </div>
  );
};

export default Pos4;
