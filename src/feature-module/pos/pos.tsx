import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import Select from "react-select";
import PosModals from "../../core/modals/pos-modal/posModalstjsx";
import PosCounter from "../../components/counter/posCounter";
import {
  category1,
  category2,
  category3,
  category4,
  category5,
  category6,
  category7,
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
  cashIcon,
  card,
  points,
  desposit,
  cheque,
  giftCard,
  scanIcon,
  playlater,
  external,
  splitbill,
  discountImg,
} from "../../utils/imagepath";
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
  is_featured?: boolean;
  type?: string;
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

const CountryOptions = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "UAE", label: "UAE" },
];

const StateOptions = [
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Delhi", label: "Delhi" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
];

const CityOptions = [
  { value: "Pune", label: "Pune" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Bangalore", label: "Bangalore" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Delhi", label: "Delhi" },
];

const GenderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const StatusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const formatINR = (val: number | string) => {
  const num = Number(val) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const Pos: React.FC = () => {
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
    name: "Walk in Customer",
    phone: "",
    points: 148,
    loyalty_balance: 20,
  });

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFeaturedOnly, setIsFeaturedOnly] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(true);
  const [isRoundoff, setIsRoundoff] = useState<boolean>(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [orderTaxPercent, setOrderTaxPercent] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [orderNumber] = useState<string>(() => `ORD-${Date.now().toString().slice(-6)}`);

  // Interactive Modals
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>("cash");
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);

  // Custom Quick Edit Modals
  const [discountModalOpen, setDiscountModalOpen] = useState<boolean>(false);
  const [tempDiscount, setTempDiscount] = useState<string>("0");
  const [taxModalOpen, setTaxModalOpen] = useState<boolean>(false);
  const [tempTax, setTempTax] = useState<string>("0");
  const [shippingModalOpen, setShippingModalOpen] = useState<boolean>(false);
  const [tempShipping, setTempShipping] = useState<string>("0");

  // Orders & Held Bills Modal
  const [ordersModalOpen, setOrdersModalOpen] = useState<boolean>(false);
  const [activeOrdersTab, setActiveOrdersTab] = useState<"held" | "recent">("held");
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  // Void & Reset Modals
  const [voidModalOpen, setVoidModalOpen] = useState<boolean>(false);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);

  // Customer Drawer (#add_order / #create)
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
  const [newCustGender, setNewCustGender] = useState<string>("Male");
  const [newCustStatus, setNewCustStatus] = useState<string>("Active");
  const [newCustGstin, setNewCustGstin] = useState<string>("");

  // Barcode Scanner Modal
  const [barcodeModalOpen, setBarcodeModalOpen] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>("");

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

  const saveHeldBills = (bills: HeldBill[]) => {
    setHeldBills(bills);
    try {
      localStorage.setItem(`gn_pos_held_bills_${businessId}`, JSON.stringify(bills));
    } catch (e) {
      console.warn("Could not save held bills:", e);
    }
  };

const DEFAULT_POS_PRODUCTS: Product[] = [
  {
    id: "prod-gn-1",
    name: "Monstera Deliciosa (Swiss Cheese Plant)",
    sku: "GN-MON-01",
    barcode: "8901001001",
    category_id: "cat-gn-1",
    category_name: "Indoor Plants",
    category: "Indoor Plants",
    selling_price: 650,
    price: 650,
    cost_price: 350,
    stock_quantity: 45,
    shop_stock: 45,
    tax_rate: 18,
    unit: "PCS",
    is_featured: true,
  },
  {
    id: "prod-gn-2",
    name: "Fiddle Leaf Fig (Ficus Lyrata)",
    sku: "GN-FID-02",
    barcode: "8901001002",
    category_id: "cat-gn-1",
    category_name: "Indoor Plants",
    category: "Indoor Plants",
    selling_price: 890,
    price: 890,
    cost_price: 480,
    stock_quantity: 28,
    shop_stock: 28,
    tax_rate: 18,
    unit: "PCS",
    is_featured: true,
  },
  {
    id: "prod-gn-3",
    name: "Snake Plant Golden (Sansevieria Trifasciata)",
    sku: "GN-SNK-03",
    barcode: "8901001003",
    category_id: "cat-gn-1",
    category_name: "Indoor Plants",
    category: "Indoor Plants",
    selling_price: 390,
    price: 390,
    cost_price: 180,
    stock_quantity: 80,
    shop_stock: 80,
    tax_rate: 18,
    unit: "PCS",
  },
  {
    id: "prod-gn-4",
    name: "Areca Palm (Indoor Air Purifier)",
    sku: "GN-ARC-04",
    barcode: "8901001004",
    category_id: "cat-gn-1",
    category_name: "Indoor Plants",
    category: "Indoor Plants",
    selling_price: 520,
    price: 520,
    cost_price: 250,
    stock_quantity: 60,
    shop_stock: 60,
    tax_rate: 18,
    unit: "PCS",
    is_featured: true,
  },
  {
    id: "prod-gn-5",
    name: "Peace Lily (Spathiphyllum)",
    sku: "GN-PCE-05",
    barcode: "8901001005",
    category_id: "cat-gn-1",
    category_name: "Indoor Plants",
    category: "Indoor Plants",
    selling_price: 450,
    price: 450,
    cost_price: 200,
    stock_quantity: 35,
    shop_stock: 35,
    tax_rate: 18,
    unit: "PCS",
  },
  {
    id: "prod-gn-6",
    name: "ZZ Plant (Zamioculcas Zamiifolia)",
    sku: "GN-ZZP-06",
    barcode: "8901001006",
    category_id: "cat-gn-1",
    category_name: "Indoor Plants",
    category: "Indoor Plants",
    selling_price: 580,
    price: 580,
    cost_price: 320,
    stock_quantity: 40,
    shop_stock: 40,
    tax_rate: 18,
    unit: "PCS",
  },
  {
    id: "prod-gn-7",
    name: "Matte White Ceramic Planter (8 Inch)",
    sku: "GN-POT-07",
    barcode: "8901001007",
    category_id: "cat-gn-3",
    category_name: "Ceramic Pots",
    category: "Ceramic Pots",
    selling_price: 450,
    price: 450,
    cost_price: 220,
    stock_quantity: 120,
    shop_stock: 120,
    tax_rate: 18,
    unit: "PCS",
  },
  {
    id: "prod-gn-8",
    name: "Terracotta Handcrafted Ribbed Pot (10 Inch)",
    sku: "GN-POT-08",
    barcode: "8901001008",
    category_id: "cat-gn-3",
    category_name: "Ceramic Pots",
    category: "Ceramic Pots",
    selling_price: 320,
    price: 320,
    cost_price: 150,
    stock_quantity: 95,
    shop_stock: 95,
    tax_rate: 18,
    unit: "PCS",
  },
  {
    id: "prod-gn-9",
    name: "Organic Vermicompost Enricher (5 Kg Bag)",
    sku: "GN-FER-09",
    barcode: "8901001009",
    category_id: "cat-gn-5",
    category_name: "Organic Fertilizers",
    category: "Organic Fertilizers",
    selling_price: 240,
    price: 240,
    cost_price: 110,
    stock_quantity: 150,
    shop_stock: 150,
    tax_rate: 5,
    unit: "BAG",
  },
  {
    id: "prod-gn-10",
    name: "Bio-Neem Organic Spray (500ml)",
    sku: "GN-FER-10",
    barcode: "8901001010",
    category_id: "cat-gn-5",
    category_name: "Organic Fertilizers",
    category: "Organic Fertilizers",
    selling_price: 199,
    price: 199,
    cost_price: 95,
    stock_quantity: 75,
    shop_stock: 75,
    tax_rate: 18,
    unit: "BTL",
  },
  {
    id: "prod-gn-11",
    name: "Phalaenopsis Orchid (Potted Flowering)",
    sku: "GN-FLW-11",
    barcode: "8901001011",
    category_id: "cat-gn-6",
    category_name: "Exotic Flowers",
    category: "Exotic Flowers",
    selling_price: 1250,
    price: 1250,
    cost_price: 650,
    stock_quantity: 18,
    shop_stock: 18,
    tax_rate: 18,
    unit: "PCS",
    is_featured: true,
  },
  {
    id: "prod-gn-12",
    name: "Anthurium Red Bloom (Air Purifier)",
    sku: "GN-FLW-12",
    barcode: "8901001012",
    category_id: "cat-gn-6",
    category_name: "Exotic Flowers",
    category: "Exotic Flowers",
    selling_price: 720,
    price: 720,
    cost_price: 380,
    stock_quantity: 25,
    shop_stock: 25,
    tax_rate: 18,
    unit: "PCS",
  },
  {
    id: "prod-nn-1",
    name: "Alphonso Mango Grafted Sapling",
    sku: "NN-MNG-01",
    barcode: "8902002001",
    category_id: "cat-nn-1",
    category_name: "Fruit Saplings",
    category: "Fruit Saplings",
    selling_price: 250,
    price: 250,
    cost_price: 120,
    stock_quantity: 180,
    shop_stock: 180,
    tax_rate: 0,
    unit: "PCS",
  },
  {
    id: "prod-nn-2",
    name: "Taiwan Pink Guava Sapling",
    sku: "NN-GVA-02",
    barcode: "8902002002",
    category_id: "cat-nn-1",
    category_name: "Fruit Saplings",
    category: "Fruit Saplings",
    selling_price: 180,
    price: 180,
    cost_price: 80,
    stock_quantity: 200,
    shop_stock: 200,
    tax_rate: 0,
    unit: "PCS",
  }
];

const DEFAULT_POS_CATEGORIES = [
  { id: "cat-gn-1", name: "Indoor Plants" },
  { id: "cat-gn-3", name: "Ceramic Pots" },
  { id: "cat-gn-5", name: "Organic Fertilizers" },
  { id: "cat-gn-6", name: "Exotic Flowers" },
  { id: "cat-nn-1", name: "Fruit Saplings" },
];

  // Fetch Products, Categories, Customers
  const loadPOSData = useCallback(async () => {
    const biz = businessId || getActiveBusinessId();

    try {
      const [prodRes, catRes, custRes] = await Promise.allSettled([
        api.get<Product[]>("/products", { business_id: biz }),
        api.get<any[]>("/categories", { business_id: biz }),
        api.get<any[]>("/customers", { business_id: biz }),
      ]);

      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value) && prodRes.value.length > 0) {
        setProducts(prodRes.value);
      } else {
        setProducts(DEFAULT_POS_PRODUCTS);
      }

      if (catRes.status === "fulfilled" && Array.isArray(catRes.value) && catRes.value.length > 0) {
        setCategories(catRes.value);
      } else {
        setCategories(DEFAULT_POS_CATEGORIES);
      }

      if (custRes.status === "fulfilled" && Array.isArray(custRes.value) && custRes.value.length > 0) {
        const custOpts = [
          {
            value: "walkin",
            label: "Walk in Customer",
            name: "Walk in Customer",
            phone: "",
            points: 148,
            loyalty_balance: 20,
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
            points: c.points ?? 100,
            loyalty_balance: c.loyalty_balance ?? 15,
            status: c.status || "Available",
          })),
        ];
        setCustomers(custOpts);
      }
    } catch (err) {
      console.error("Error loading POS master data:", err);
      setProducts(DEFAULT_POS_PRODUCTS);
      setCategories(DEFAULT_POS_CATEGORIES);
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

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        activeTab === "all" ||
        p.category_id === activeTab ||
        (p.category && p.category.toLowerCase() === activeTab.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase() === activeTab.toLowerCase()) ||
        (p.type && p.type.toLowerCase() === activeTab.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.toLowerCase().includes(query));

      const matchesFeatured = !isFeaturedOnly || Boolean(p.is_featured);

      return matchesCat && matchesSearch && matchesFeatured;
    });
  }, [products, activeTab, searchQuery, isFeaturedOnly]);

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

  // Calculations
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const discount = discountPercent > 0 ? Number(((subtotal * discountPercent) / 100).toFixed(2)) : 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = orderTaxPercent > 0 ? Number(((taxableAmount * orderTaxPercent) / 100).toFixed(2)) : 0;
    const shipping = Number(shippingCost) || 0;
    const rawGrandTotal = Math.max(0, Number((taxableAmount + tax + shipping).toFixed(2)));
    const roundedGrandTotal = isRoundoff ? Math.round(rawGrandTotal) : rawGrandTotal;
    const roundoffDiff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    return {
      subtotal,
      discount,
      tax,
      shipping,
      rawGrandTotal,
      grandTotal: roundedGrandTotal,
      roundoffDiff,
      totalItems,
    };
  }, [cart, discountPercent, orderTaxPercent, shippingCost, isRoundoff]);

  // Cart Operations
  const addToCart = (product: Product) => {
    const totalStock = Number(product.stock_quantity ?? product.stock ?? product.shop_stock ?? 0);
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (totalStock > 0 && currentQty >= totalStock) {
      alert(`Maximum stock reached (${totalStock} ${product.unit || "Pcs"}) for ${product.name}`);
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

  const handleRestoreOrder = (hold: HeldBill) => {
    setCart(hold.items);
    if (hold.customer) setSelectedCustomer(hold.customer);
    saveHeldBills(heldBills.filter((b) => b.id !== hold.id));
    setOrdersModalOpen(false);
  };

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
        gstin: newCustGstin.trim(),
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
        points: 100,
        loyalty_balance: 15,
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
      setNewCustGstin("");
      alert("Customer created and selected successfully!");
    } catch (err: any) {
      alert("Error adding customer: " + (err.message || "Could not save customer"));
    }
  };

  // Barcode Submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim().toLowerCase();
    if (!code) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code) ||
        (p.sku && p.sku.toLowerCase() === code) ||
        p.id.toLowerCase() === code
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput("");
      setBarcodeModalOpen(false);
    } else {
      alert(`No product found with barcode / SKU: ${barcodeInput}`);
    }
  };

  // Print Order Trigger
  const handlePrintOrder = (e: React.MouseEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please add items to cart before printing an order.");
      return;
    }
    window.print();
  };

  // Formatted Date
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="main-wrapper pos-five">
      {/* Scoped CSS to enforce exact card geometry, image cropping, and modal responsiveness */}
      <style>{`
        .pos-five .pos-category5 {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          max-height: calc(100vh - 160px);
        }
        .pos-five .pos-category5::-webkit-scrollbar {
          width: 4px;
        }
        .pos-five .pos-category5::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .pos-five aside .card {
          margin-bottom: 14px;
        }

        /* Product Card: Restored uniform padding on all sides */
        .pos-five .pos-products .product-info.card {
          padding: 14px !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          transition: all 0.2s ease-in-out !important;
          background: #ffffff !important;
        }
        .pos-five .pos-products .product-info.card:hover {
          border-color: #fe9f43 !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08) !important;
        }
        .pos-five .pos-products .product-info.card.active {
          // border-color: #fe9f43 !important;
          background: #ffffffff !important;
        }

        /* Image Container: Square 1:1 design matching the original theme layout (187 x 187 px rendered size) */
        .pos-five .pos-products .product-info .pro-img {
          background-color: #f9fafb !important;
          border-radius: 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-bottom: 12px !important;
          position: relative !important;
          width: 100% !important;
          aspect-ratio: 1 / 1 !important;
          height: auto !important;
          min-height: unset !important;
          max-height: none !important;
          overflow: hidden !important;
          padding: 12px !important;
        }
        .pos-five .pos-products .product-info .pro-img img {
          max-width: 100% !important;
          max-height: 100% !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
          border-radius: 6px !important;
          display: block !important;
          margin: 0 auto !important;
          transition: transform 0.3s ease !important;
        }
        .pos-five .pos-products .product-info:hover .pro-img img {
          transform: scale(1.1) !important;
        }
        .pos-five .pos-products .product-info .pro-img span {
          position: absolute;
          top: 6px;
          right: 6px;
          color: #22c55e;
          font-size: 18px;
          line-height: 1;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          padding: 2px;
          display: none;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
        }
        .pos-five .pos-products .product-info.card.active .pro-img span {
          display: flex !important;
        }

        /* Card body content inside */
        .pos-five .pos-products .product-info .card-body-content {
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          flex-grow: 1 !important;
          justify-content: space-between !important;
        }
        .pos-five .pos-products .product-info .product-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.35;
          min-height: 36px;
        }
        .pos-five .pos-products .product-info .product-name a {
          color: inherit;
          text-decoration: none;
        }
        .pos-five .pos-products .product-info .product-name a:hover {
          color: #fe9f43;
        }

        /* Payment items */
        .pos-five .payment-item {
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        .pos-five .payment-item:hover,
        .pos-five .payment-item.active {
          border-color: #fe9f43;
          background: #fff8f1;
        }

        /* Modal backdrops */
        .pos-five-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(2px);
          z-index: 1070;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .pos-five-modal-card {
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          z-index: 1071;
        }
        .pos-five-modal-card.wide {
          max-width: 760px;
        }

        /* Customer Offcanvas Drawer */
        .offcanvas#add_order {
          background: #ffffff;
        }
        .offcanvas#add_order .order-select-card {
          transition: all 0.2s ease;
        }
        .offcanvas#add_order .order-select-card:hover {
          border-color: #fe9f43 !important;
          background-color: #fffaf5;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #pos-print-area, #pos-print-area * {
            visibility: visible;
          }
          #pos-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="page-wrapper pos-pg-wrapper ms-0">
        <div className="content pos-design p-0">
          <div className="row pos-wrapper">
            {/* Products Column */}
            <div className="col-md-12 col-lg-7 col-xl-8 d-flex">
              <div className="pos-categories tabs_wrapper p-0 flex-fill">
                <div className="content-wrap">
                  {/* Category Tabs */}
                  <div className="tab-wrap">
                    <ul className="tabs owl-carousel pos-category5">
                      <li
                        id="all"
                        onClick={() => setActiveTab("all")}
                        className={activeTab === "all" ? "active" : ""}
                      >
                        <Link to="#" onClick={(e) => e.preventDefault()}>
                          <img
                            src={category1}
                            alt="Categories"
                          />
                        </Link>
                        <h6>
                          <Link to="#" onClick={(e) => e.preventDefault()}>All</Link>
                        </h6>
                      </li>
                      {categories.map((cat, idx) => (
                        <li
                          key={cat.id || idx}
                          id={cat.id}
                          onClick={() => setActiveTab(cat.id || cat.name)}
                          className={activeTab === (cat.id || cat.name) ? "active" : ""}
                        >
                          <Link to="#" onClick={(e) => e.preventDefault()}>
                            <img
                              src={cat.image_url || fallbackCategoryIcons[(idx + 1) % fallbackCategoryIcons.length]}
                              alt={cat.name}
                            />
                          </Link>
                          <h6>
                            <Link to="#" onClick={(e) => e.preventDefault()}>{cat.name}</Link>
                          </h6>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tab Content & Product Grid */}
                  <div className="tab-content-wrap">
                    {/* Welcome & Search Bar */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                      <div className="mb-3">
                        <h5 className="mb-1">
                          Welcome, {user?.name || user?.username || activeBusiness?.name || "Admin"}
                        </h5>
                        <p>{formattedDate}</p>
                      </div>
                      <div className="d-flex align-items-center flex-wrap mb-2">
                        <div className="input-icon-start search-pos position-relative mb-2 me-3">
                          <span className="input-icon-addon">
                            <i className="ti ti-search" />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search Product"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Link
                          to="#"
                          className="btn btn-sm btn-dark mb-2 me-2"
                          onClick={(e) => {
                            e.preventDefault();
                            setSearchQuery("");
                            setActiveTab("all");
                            setIsFeaturedOnly(false);
                          }}
                        >
                          <i className="ti ti-tag me-1" />
                          View All Brands
                        </Link>
                        <Link
                          to="#"
                          className={`btn btn-sm ${isFeaturedOnly ? "btn-warning text-dark fw-bold" : "btn-primary"} mb-2`}
                          onClick={(e) => {
                            e.preventDefault();
                            setIsFeaturedOnly(!isFeaturedOnly);
                          }}
                        >
                          <i className="ti ti-star me-1" />
                          Featured
                        </Link>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="pos-products">
                      <div className="tabs_container">
                        <div className="tab_content active" data-tab={activeTab}>
                          <div className="row g-3">
                            {filteredProducts.map((product, idx) => {
                              const inCart = cart.find((i) => i.product.id === product.id);
                              const cardQty = inCart ? inCart.quantity : 0;
                              const stock = Number(
                                product.stock_quantity ?? product.stock ?? product.shop_stock ?? 0
                              );

                              return (
                                <div
                                  className="col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3 d-flex"
                                  key={product.id || idx}
                                >
                                  <div
                                    className={`product-info card mb-0 flex-fill ${inCart ? "active" : ""}`}
                                    onClick={() => addToCart(product)}
                                    tabIndex={0}
                                  >
                                    <Link
                                      to="#"
                                      className="pro-img"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        addToCart(product);
                                      }}
                                    >
                                      <img
                                        src={
                                          product.image_url ||
                                          fallbackProductImages[idx % fallbackProductImages.length]
                                        }
                                        alt={product.name}
                                      />
                                      <span>
                                        <i className="ti ti-circle-check-filled" />
                                      </span>
                                    </Link>
                                    <div className="card-body-content">
                                      <div>
                                        <h6 className="product-name">
                                          <Link
                                            to="#"
                                            title={product.name}
                                            onClick={(e) => e.preventDefault()}
                                          >
                                            {product.name}
                                          </Link>
                                        </h6>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                          <span
                                            className={`badge ${
                                              stock > 10
                                                ? "bg-success-transparent text-success"
                                                : stock > 0
                                                ? "bg-warning-transparent text-warning"
                                                : "bg-danger-transparent text-danger"
                                            } fs-11 fw-semibold`}
                                          >
                                            <i className="ti ti-box me-1" />
                                            {stock > 0 ? `${stock} ${product.unit || "Pcs"} In Stock` : "Out of Stock"}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="d-flex align-items-center justify-content-between price">
                                          <p className="text-gray-9 fw-bold fs-15 mb-0">
                                            {formatINR(product.selling_price ?? product.price ?? 0)}
                                          </p>
                                          <div
                                            className="qty-item m-0"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <PosCounter
                                              value={cardQty}
                                              onIncrement={() => addToCart(product)}
                                              onDecrement={() => {
                                                if (cardQty <= 1) {
                                                  removeFromCart(product.id);
                                                } else {
                                                  updateQuantity(product.id, cardQty - 1);
                                                }
                                              }}
                                              onChange={(val) => updateQuantity(product.id, val)}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {filteredProducts.length === 0 && (
                              <div className="col-12 text-center py-5">
                                <i className="ti ti-shopping-bag-x fs-40 text-muted mb-2 d-block" />
                                <p className="text-muted fs-15 mb-0">No products found matching your search</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Products Column */}

            {/* Order Details Column */}
            <div className="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar d-lg-flex">
              <aside className="product-order-list bg-secondary-transparent flex-fill">
                {/* Order List Card */}
                <div className="card">
                  <div className="card-body">
                    <div className="order-head d-flex align-items-center justify-content-between w-100">
                      <div>
                        <h3>Order List</h3>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge badge-dark fs-10 fw-medium badge-xs">
                          #{orderNumber}
                        </span>
                        <Link
                          className="link-danger fs-16"
                          to="#"
                          onClick={(e) => {
                            e.preventDefault();
                            clearCart();
                          }}
                          title="Clear Cart"
                        >
                          <i className="ti ti-trash-x-filled" />
                        </Link>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="customer-info block-section">
                      <h5 className="mb-2">Customer Information</h5>
                      <div className="d-flex align-items-center gap-2">
                        <div className="flex-grow-1">
                          <Select
                            options={customers}
                            classNamePrefix="react-select select"
                            placeholder="Choose a Name"
                            value={selectedCustomer}
                            onChange={(opt) => {
                              setSelectedCustomer(opt);
                              setShowAlert(true);
                            }}
                          />
                        </div>
                        <Link
                          to="#"
                          className="btn btn-teal btn-icon fs-20"
                          onClick={(e) => {
                            e.preventDefault();
                            setCustomerDrawerOpen(true);
                          }}
                          title="Add Customer"
                        >
                          <i className="ti ti-user-plus" />
                        </Link>
                        <Link
                          to="#"
                          className="btn btn-info btn-icon fs-20"
                          onClick={(e) => {
                            e.preventDefault();
                            setBarcodeModalOpen(true);
                          }}
                          title="Scan Barcode"
                        >
                          <i className="ti ti-scan" />
                        </Link>
                      </div>

                      {showAlert && selectedCustomer && (
                        <div className="customer-item border border-orange bg-orange-100 d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
                          <div>
                            <h6 className="fs-16 fw-bold mb-1">
                              {selectedCustomer.name || selectedCustomer.label?.split(" (")[0]}
                            </h6>
                            <div className="d-inline-flex align-items-center gap-2 customer-bonus">
                              <p className="fs-13 d-inline-flex align-items-center gap-1">
                                Bonus :
                                <span className="badge bg-cyan fs-13 fw-bold p-1">
                                  {selectedCustomer.points ?? 148}
                                </span>{" "}
                              </p>
                              <p className="fs-13 d-inline-flex align-items-center gap-1">
                                Loyality :
                                <span className="badge bg-teal fs-13 fw-bold p-1">
                                  ₹{selectedCustomer.loyalty_balance ?? 20}
                                </span>{" "}
                              </p>
                            </div>
                          </div>
                          <Link
                            to="#"
                            className="btn btn-orange btn-sm"
                            onClick={(e) => {
                              e.preventDefault();
                              setDiscountPercent(5);
                            }}
                          >
                            Apply
                          </Link>
                          <Link
                            to="#"
                            className="close-icon"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowAlert(false);
                            }}
                          >
                            <i className="ti ti-x" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Order Details / Product Added */}
                    <div className="product-added block-section">
                      <div className="head-text d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <h5 className="me-2">Order Details</h5>
                          <div className="badge bg-light text-gray-9 fs-12 fw-semibold py-2 border rounded">
                            Items : <span className="text-teal">{totals.totalItems}</span>
                          </div>
                        </div>
                        <Link
                          to="#"
                          className="d-flex align-items-center clear-icon fs-10 fw-medium"
                          onClick={(e) => {
                            e.preventDefault();
                            clearCart();
                          }}
                        >
                          Clear all
                        </Link>
                      </div>

                      <div className="product-wrap">
                        {cart.length === 0 ? (
                          <div className="empty-cart" style={{ display: "flex" }}>
                            <div className="fs-24 mb-1">
                              <i className="ti ti-shopping-cart" />
                            </div>
                            <p className="fw-bold">No Products Selected</p>
                          </div>
                        ) : (
                          <div className="product-list border-0 p-0" style={{ display: "block" }}>
                            <div className="table-responsive">
                              <table className="table table-borderless">
                                <thead>
                                  <tr>
                                    <th className="fw-bold bg-light">Item</th>
                                    <th className="fw-bold bg-light">QTY</th>
                                    <th className="fw-bold bg-light text-end">Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cart.map((item) => (
                                    <tr key={item.product.id}>
                                      <td>
                                        <div className="d-flex align-items-center">
                                          <Link
                                            className="delete-icon"
                                            to="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              removeFromCart(item.product.id);
                                            }}
                                          >
                                            <i className="ti ti-trash-x-filled" />
                                          </Link>
                                          <h6 className="fs-13 fw-normal">
                                            <Link to="#" className="link-default">
                                              {item.product.name}
                                            </Link>
                                          </h6>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="qty-item m-0">
                                          <PosCounter
                                            value={item.quantity}
                                            onIncrement={() =>
                                              updateQuantity(item.product.id, item.quantity + 1)
                                            }
                                            onDecrement={() =>
                                              updateQuantity(item.product.id, item.quantity - 1)
                                            }
                                            onChange={(val) =>
                                              updateQuantity(item.product.id, val)
                                            }
                                          />
                                        </div>
                                      </td>
                                      <td className="fs-13 fw-semibold text-gray-9 text-end">
                                        {formatINR(item.total_amount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {discountPercent > 0 && (
                        <div className="discount-item d-flex align-items-center justify-content-between bg-purple-transparent mt-3 flex-wrap gap-2">
                          <div className="d-flex align-items-center">
                            <span className="bg-purple discount-icon br-5 flex-shrink-0 me-2">
                              <img src={discountImg} alt="img" />
                            </span>
                            <div>
                              <h6 className="fs-14 fw-bold text-purple mb-1">
                                Discount {discountPercent}%
                              </h6>
                              <p className="mb-0">Applied to current order</p>
                            </div>
                          </div>
                          <Link
                            to="#"
                            className="close-icon"
                            onClick={(e) => {
                              e.preventDefault();
                              setDiscountPercent(0);
                            }}
                          >
                            <i className="ti ti-trash" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Payment Summary */}
                    <div className="order-total bg-total bg-white p-0">
                      <h5 className="mb-3">Payment Summary</h5>
                      <table className="table table-responsive table-borderless">
                        <tbody>
                          <tr>
                            <td>
                              Shipping
                              <Link
                                to="#"
                                className="ms-3 link-default"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setTempShipping(shippingCost.toString());
                                  setShippingModalOpen(true);
                                }}
                              >
                                <i className="ti ti-edit" />
                              </Link>
                            </td>
                            <td className="text-gray-9 text-end">{formatINR(totals.shipping)}</td>
                          </tr>
                          <tr>
                            <td>
                              Tax
                              <Link
                                to="#"
                                className="ms-3 link-default"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setTempTax(orderTaxPercent.toString());
                                  setTaxModalOpen(true);
                                }}
                              >
                                <i className="ti ti-edit" />
                              </Link>
                            </td>
                            <td className="text-gray-9 text-end">
                              {formatINR(totals.tax)} ({orderTaxPercent}%)
                            </td>
                          </tr>
                          <tr>
                            <td>
                              Coupon
                              <Link
                                to="#"
                                className="ms-3 link-default"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setTempDiscount(discountPercent.toString());
                                  setDiscountModalOpen(true);
                                }}
                              >
                                <i className="ti ti-edit" />
                              </Link>
                            </td>
                            <td className="text-gray-9 text-end">{formatINR(totals.discount)}</td>
                          </tr>
                          <tr>
                            <td>
                              <span className="text-danger">Discount</span>
                              <Link
                                to="#"
                                className="ms-3 link-default"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setTempDiscount(discountPercent.toString());
                                  setDiscountModalOpen(true);
                                }}
                              >
                                <i className="ti ti-edit" />
                              </Link>
                            </td>
                            <td className="text-danger text-end">-{formatINR(totals.discount)}</td>
                          </tr>
                          <tr>
                            <td>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  id="round"
                                  checked={isRoundoff}
                                  onChange={(e) => setIsRoundoff(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="round">
                                  Roundoff
                                </label>
                              </div>
                            </td>
                            <td className="text-gray-9 text-end">
                              {totals.roundoffDiff >= 0
                                ? `+${totals.roundoffDiff.toFixed(2)}`
                                : totals.roundoffDiff.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td>Sub Total</td>
                            <td className="text-gray-9 text-end">{formatINR(totals.subtotal)}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold border-top border-dashed">Total Payable</td>
                            <td className="text-gray-9 fw-bold text-end border-top border-dashed">
                              {formatINR(totals.grandTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Card */}
                <div className="card payment-method">
                  <div className="card-body">
                    <h5 className="mb-3">Select Payment</h5>
                    <div className="row align-items-center methods g-2">
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "cash" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("cash");
                          }}
                        >
                          <img src={cashIcon} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Cash</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "card" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("card");
                          }}
                        >
                          <img src={card} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Card</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "points" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("points");
                          }}
                        >
                          <img src={points} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Points</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "deposit" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("deposit");
                          }}
                        >
                          <img src={desposit} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Deposit</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "cheque" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("cheque");
                          }}
                        >
                          <img src={cheque} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Cheque</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "giftcard" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("giftcard");
                          }}
                        >
                          <img src={giftCard} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Gift Card</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "scan" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("scan");
                          }}
                        >
                          <img src={scanIcon} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Scan</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "paylater" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("paylater");
                          }}
                        >
                          <img src={playlater} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Pay Later</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "external" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("external");
                          }}
                        >
                          <img src={external} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">External</p>
                        </Link>
                      </div>
                      <div className="col-sm-6 col-md-4 d-flex">
                        <Link
                          to="#"
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${
                            selectedPaymentMode === "split" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenPayment("split");
                          }}
                        >
                          <img src={splitbill} className="me-2" alt="img" />
                          <p className="fs-14 fw-medium">Split Bill</p>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Order & Place Order */}
                <div className="btn-row d-flex align-items-center justify-content-between gap-3">
                  <Link
                    to="#"
                    className="btn btn-white d-flex align-items-center justify-content-center flex-fill m-0"
                    onClick={handlePrintOrder}
                  >
                    <i className="ti ti-printer me-2" />
                    Print Order
                  </Link>
                  <Link
                    to="#"
                    className="btn btn-secondary d-flex align-items-center justify-content-center flex-fill m-0"
                    onClick={() => handleOpenPayment(selectedPaymentMode || "cash")}
                  >
                    <i className="ti ti-shopping-cart me-2" />
                    Place Order
                  </Link>
                </div>
              </aside>
            </div>
            {/* /Order Details Column */}
          </div>

          {/* POS Footer Bar */}
          <div className="pos-footer bg-white p-3 border-top">
            <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
              <Link
                to="#"
                className="btn btn-orange d-inline-flex align-items-center justify-content-center"
                onClick={(e) => {
                  e.preventDefault();
                  handleHoldOrder();
                }}
              >
                <i className="ti ti-player-pause me-2" />
                Hold
              </Link>
              <Link
                to="#"
                className="btn btn-info d-inline-flex align-items-center justify-content-center"
                onClick={(e) => {
                  e.preventDefault();
                  setVoidModalOpen(true);
                }}
              >
                <i className="ti ti-trash me-2" />
                Void
              </Link>
              <Link
                to="#"
                className="btn btn-cyan d-flex align-items-center justify-content-center"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenPayment("cash");
                }}
              >
                <i className="ti ti-cash-banknote me-2" />
                Payment
              </Link>
              <Link
                to="#"
                className="btn btn-secondary d-inline-flex align-items-center justify-content-center"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenOrdersModal("held");
                }}
              >
                <i className="ti ti-shopping-cart me-2" />
                View Orders
              </Link>
              <Link
                to="#"
                className="btn btn-indigo d-inline-flex align-items-center justify-content-center"
                onClick={(e) => {
                  e.preventDefault();
                  setResetModalOpen(true);
                }}
              >
                <i className="ti ti-reload me-2" />
                Reset
              </Link>
              <Link
                to="#"
                className="btn btn-danger d-inline-flex align-items-center justify-content-center"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenOrdersModal("recent");
                }}
              >
                <i className="ti ti-refresh-dot me-2" />
                Transaction
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* POS Theme Modals from Core */}
      <PosModals />

      {/* ================= FUNCTIONAL INTERACTIVE MODALS ================= */}

      {/* 1. Payment Modal */}
      {paymentModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPaymentModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center bg-soft-primary text-primary"
                  style={{ width: "38px", height: "38px" }}
                >
                  <i className="ti ti-wallet fs-20" />
                </div>
                <div>
                  <h4 className="fw-bold mb-0">Checkout &amp; Payment</h4>
                  <small className="text-muted">Order #{orderNumber}</small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setPaymentModalOpen(false)}
              />
            </div>

            {/* Total Payable Box */}
            <div className="bg-light p-3 rounded-3 text-center mb-4 border">
              <span className="text-muted fs-13 d-block mb-1">TOTAL AMOUNT PAYABLE</span>
              <h2 className="text-primary fw-bolder mb-0">{formatINR(totals.grandTotal)}</h2>
            </div>

            {/* Payment Method Switcher */}
            <div className="mb-3">
              <label className="form-label fw-bold fs-13 mb-2">Payment Method</label>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { id: "cash", label: "Cash", icon: "ti-cash" },
                  { id: "card", label: "Card", icon: "ti-credit-card" },
                  { id: "scan", label: "UPI / QR", icon: "ti-qrcode" },
                  { id: "points", label: "Points", icon: "ti-award" },
                  { id: "cheque", label: "Cheque", icon: "ti-file-invoice" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`btn btn-sm ${
                      selectedPaymentMode === m.id ? "btn-primary" : "btn-outline-secondary"
                    } d-inline-flex align-items-center gap-1`}
                    onClick={() => {
                      setSelectedPaymentMode(m.id);
                      if (m.id === "cash") setReceivedAmount(totals.grandTotal.toString());
                    }}
                  >
                    <i className={`ti ${m.icon}`} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Options */}
            {selectedPaymentMode === "cash" && (
              <div className="mb-3">
                <label className="form-label fw-semibold fs-13">Cash Received (₹)</label>
                <div className="input-group mb-2">
                  <span className="input-group-text">₹</span>
                  <input
                    type="number"
                    className="form-control form-control-lg fw-bold"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="d-flex gap-2 flex-wrap mb-3">
                  {[
                    totals.grandTotal,
                    Math.ceil(totals.grandTotal / 50) * 50,
                    Math.ceil(totals.grandTotal / 100) * 100,
                    Math.ceil(totals.grandTotal / 500) * 500,
                  ].map((chipVal, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn btn-xs btn-outline-primary"
                      onClick={() => setReceivedAmount(chipVal.toString())}
                    >
                      ₹{chipVal}
                    </button>
                  ))}
                </div>

                {Number(receivedAmount) >= totals.grandTotal && (
                  <div className="alert alert-success d-flex align-items-center justify-content-between p-2 mb-0">
                    <span className="fs-13 fw-semibold">Change to Return:</span>
                    <span className="fs-15 fw-bold text-success">
                      {formatINR(Number(receivedAmount) - totals.grandTotal)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="form-label fw-semibold fs-13">Payment Notes</label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional payment or reference note..."
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light flex-fill"
                onClick={() => setPaymentModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary flex-fill fw-bold"
                disabled={isSubmitting}
                onClick={handleExecuteCheckout}
              >
                {isSubmitting ? "Processing..." : "Complete & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Success Receipt Modal */}
      {receiptModalOpen && completedInvoice && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReceiptModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4">
            <div className="text-center pb-3 border-bottom mb-3">
              <div
                className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-2"
                style={{ width: "50px", height: "50px" }}
              >
                <i className="ti ti-check fs-24" />
              </div>
              <h4 className="fw-bold mb-1">Sale Completed!</h4>
              <p className="text-muted fs-13 mb-0">Invoice #{completedInvoice.invoice_number || completedInvoice.id}</p>
            </div>

            {/* Printable Receipt Preview */}
            <div
              id="pos-print-area"
              className="bg-light p-3 rounded-3 mb-3 border text-start"
              style={{ fontFamily: "monospace", fontSize: "12px" }}
            >
              <div className="text-center mb-2">
                <h5 className="fw-bold mb-0">{activeBusiness?.name || "GrowNaturals Store"}</h5>
                <p className="text-muted mb-0">{completedInvoice.date}</p>
              </div>
              <div className="border-bottom border-dashed pb-2 mb-2">
                <div>Customer: {completedInvoice.customer_name}</div>
                <div>Payment: {completedInvoice.payment_method?.toUpperCase()}</div>
              </div>
              <table className="w-100 mb-2">
                <thead>
                  <tr className="border-bottom">
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {completedInvoice.items?.map((it: CartItem, i: number) => (
                    <tr key={i}>
                      <td>{it.product.name}</td>
                      <td className="text-center">{it.quantity}</td>
                      <td className="text-end">{formatINR(it.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-top border-dashed pt-2">
                <div className="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>{formatINR(completedInvoice.subtotal)}</span>
                </div>
                {completedInvoice.discount > 0 && (
                  <div className="d-flex justify-content-between text-danger">
                    <span>Discount:</span>
                    <span>-{formatINR(completedInvoice.discount)}</span>
                  </div>
                )}
                {completedInvoice.tax > 0 && (
                  <div className="d-flex justify-content-between">
                    <span>Tax:</span>
                    <span>+{formatINR(completedInvoice.tax)}</span>
                  </div>
                )}
                {completedInvoice.shipping > 0 && (
                  <div className="d-flex justify-content-between">
                    <span>Shipping:</span>
                    <span>+{formatINR(completedInvoice.shipping)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between fw-bold fs-14 mt-1 border-top pt-1">
                  <span>Grand Total:</span>
                  <span>{formatINR(completedInvoice.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-dark flex-fill"
                onClick={() => window.print()}
              >
                <i className="ti ti-printer me-1" />
                Print Receipt
              </button>
              <button
                type="button"
                className="btn btn-primary flex-fill"
                onClick={() => setReceiptModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Orders & Held Bills Modal */}
      {ordersModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOrdersModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card wide p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="fw-bold mb-0">Orders &amp; Held Bills</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setOrdersModalOpen(false)}
              />
            </div>

            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeOrdersTab === "held" ? "active fw-bold" : ""}`}
                  onClick={() => setActiveOrdersTab("held")}
                >
                  On-Hold Orders ({heldBills.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeOrdersTab === "recent" ? "active fw-bold" : ""}`}
                  onClick={() => setActiveOrdersTab("recent")}
                >
                  Recent Transactions ({recentInvoices.length})
                </button>
              </li>
            </ul>

            {activeOrdersTab === "held" ? (
              <div className="table-responsive" style={{ maxHeight: "360px", overflowY: "auto" }}>
                {heldBills.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="ti ti-inbox fs-36 mb-2 d-block" />
                    No orders on hold
                  </div>
                ) : (
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
                )}
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: "360px", overflowY: "auto" }}>
                {recentInvoices.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="ti ti-history fs-36 mb-2 d-block" />
                    No recent transactions
                  </div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th className="text-end">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="fw-bold">{inv.invoice_number || inv.id}</td>
                          <td>{inv.customer_name || "Walk-in"}</td>
                          <td className="fw-bold text-success">
                            {formatINR(inv.grand_total || inv.total_amount || 0)}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark text-uppercase">
                              {inv.payment_method || "Cash"}
                            </span>
                          </td>
                          <td className="text-end text-muted fs-12">
                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Slide Animated Customer Drawer (#add_order) */}
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
            <i className="ti ti-x" />
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
                <i className="ti ti-users me-2" />
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
                <i className="ti ti-plus me-2" />
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
                  <i className="ti ti-search fs-14 position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" />
                  <input
                    type="search"
                    className="form-control form-control-sm ps-5"
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
                      <i className="ti ti-x fs-14" />
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
                        isSelected ? "border-primary bg-light" : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setShowAlert(true);
                      }}
                    >
                      <div className="d-flex align-items-center customer-radio-input">
                        <input
                          type="radio"
                          name="customer"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedCustomer(c);
                            setShowAlert(true);
                          }}
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
                                className="avatar avatar-rounded flex-shrink-0 bg-primary text-white d-flex align-items-center justify-content-center"
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
                              ? "bg-success-transparent text-success"
                              : "bg-danger-transparent text-danger"
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
                          <i className="ti ti-user fs-28 text-muted" />
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
                            <i className="ti ti-pencil" />
                          </div>
                          {newCustPhoto && (
                            <button
                              type="button"
                              className="btn btn-icon btn-sm btn-white rounded-circle text-danger border shadow-sm"
                              onClick={() => setNewCustPhoto("")}
                            >
                              <i className="ti ti-trash" />
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

                  <div className="col-lg-12 col-md-12">
                    <div className="mb-3">
                      <label className="form-label">GSTIN</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newCustGstin}
                        onChange={(e) => setNewCustGstin(e.target.value)}
                        placeholder="Enter GSTIN Number"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Pinned Bottom Footer */}
        <div className="offcanvas-footer d-flex align-items-center gap-2 p-3 border-top flex-shrink-0 bg-white">
          <button
            type="button"
            className="btn btn-dark d-flex align-items-center justify-content-center w-100"
            onClick={() => {
              if (activeCustomerTab === "add_new") {
                const form = document.getElementById("add-new-customer-form") as HTMLFormElement;
                if (form) form.requestSubmit();
              } else {
                setCustomerDrawerOpen(false);
              }
            }}
          >
            {activeCustomerTab === "add_new" ? "Save Customer" : "Select Customer"}
          </button>
          <button
            type="button"
            className="btn btn-light d-flex align-items-center justify-content-center w-100"
            onClick={() => setCustomerDrawerOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>

      {customerDrawerOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setCustomerDrawerOpen(false)}
          style={{ zIndex: 1060 }}
        />
      )}

      {/* 5. Barcode Scanner Modal */}
      {barcodeModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBarcodeModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="fw-bold mb-0">Scan Barcode / SKU</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setBarcodeModalOpen(false)}
              />
            </div>
            <form onSubmit={handleBarcodeSubmit}>
              <div className="mb-3">
                <label className="form-label fs-13 text-muted">
                  Type or scan barcode / SKU with your handheld reader:
                </label>
                <input
                  type="text"
                  autoFocus
                  className="form-control form-control-lg text-center fw-bold"
                  placeholder="Scan or type barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Add to Cart
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Discount Modal */}
      {discountModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDiscountModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="fw-bold mb-0">Apply Discount</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setDiscountModalOpen(false)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-13">Discount Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                value={tempDiscount}
                onChange={(e) => setTempDiscount(e.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                {[5, 10, 15, 20].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className="btn btn-xs btn-outline-secondary"
                    onClick={() => setTempDiscount(d.toString())}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => {
                setDiscountPercent(Math.max(0, Math.min(100, Number(tempDiscount) || 0)));
                setDiscountModalOpen(false);
              }}
            >
              Apply Discount
            </button>
          </div>
        </div>
      )}

      {/* 7. Edit Tax Modal */}
      {taxModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTaxModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="fw-bold mb-0">Order Tax Rate</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setTaxModalOpen(false)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-13">Tax Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                className="form-control"
                value={tempTax}
                onChange={(e) => setTempTax(e.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                {[0, 5, 12, 18, 28].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="btn btn-xs btn-outline-secondary"
                    onClick={() => setTempTax(t.toString())}
                  >
                    {t}%
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => {
                setOrderTaxPercent(Math.max(0, Math.min(100, Number(tempTax) || 0)));
                setTaxModalOpen(false);
              }}
            >
              Update Tax
            </button>
          </div>
        </div>
      )}

      {/* 8. Edit Shipping Modal */}
      {shippingModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShippingModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="fw-bold mb-0">Shipping Charges</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShippingModalOpen(false)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-13">Shipping Amount (₹)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={tempShipping}
                onChange={(e) => setTempShipping(e.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                {[0, 50, 100, 200].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="btn btn-xs btn-outline-secondary"
                    onClick={() => setTempShipping(s.toString())}
                  >
                    ₹{s}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => {
                setShippingCost(Math.max(0, Number(tempShipping) || 0));
                setShippingModalOpen(false);
              }}
            >
              Update Shipping
            </button>
          </div>
        </div>
      )}

      {/* 9. Void Confirmation Modal */}
      {voidModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setVoidModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4 text-center">
            <i className="ti ti-alert-triangle fs-40 text-danger mb-2 d-block" />
            <h5 className="fw-bold mb-2">Void Current Order?</h5>
            <p className="text-muted fs-13 mb-4">
              This will clear all items in the cart and cancel this transaction.
            </p>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light flex-fill"
                onClick={() => setVoidModalOpen(false)}
              >
                No, Keep
              </button>
              <button
                type="button"
                className="btn btn-danger flex-fill"
                onClick={() => {
                  clearCart();
                  setVoidModalOpen(false);
                }}
              >
                Yes, Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Reset Confirmation Modal */}
      {resetModalOpen && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4 text-center">
            <i className="ti ti-reload fs-40 text-indigo mb-2 d-block" />
            <h5 className="fw-bold mb-2">Reset Register?</h5>
            <p className="text-muted fs-13 mb-4">
              This will reset the current customer, cart, and discount settings.
            </p>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light flex-fill"
                onClick={() => setResetModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-indigo flex-fill"
                onClick={() => {
                  clearCart();
                  setSelectedCustomer({
                    value: "walkin",
                    label: "Walk in Customer",
                    name: "Walk in Customer",
                    phone: "",
                    points: 148,
                    loyalty_balance: 20,
                  });
                  setResetModalOpen(false);
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
