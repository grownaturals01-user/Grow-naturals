import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import placeholderPos from "../../assets/img/placeholderpos.jpg";
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
  sale_price?: number;
  price?: number;
  wholesale_price?: number;
  cost_price?: number;
  stock_quantity?: number;
  shop_stock?: number;
  warehouse_stock?: number;
  stock?: number;
  low_stock_threshold?: number;
  tax_rate?: number;
  image_url?: string;
  unit?: string;
  is_featured?: boolean;
  type?: string;
  attributes?: Record<string, any>;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  selectedSize?: { id: string; name: string; price: number };
  selectedAddons?: Array<{ id: string; name: string; price: number }>;
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
  placeholderPos,
];

// Available Add-ons & Upgrades for Grow Naturals Products
const POS_ADDONS = [
  { id: "addon-soil", name: "Organic Potting Mix (1kg)", price: 60, icon: "ti ti-leaf" },
  { id: "addon-tray", name: "Ceramic Drip Tray", price: 90, icon: "ti ti-circle-half" },
  { id: "addon-spray", name: "Bio Plant Food Spray (100ml)", price: 75, icon: "ti ti-droplet" },
  { id: "addon-wrap", name: "Eco Gift Packaging & Bow", price: 40, icon: "ti ti-gift" },
  { id: "addon-stand", name: "Wooden Planter Stand", price: 180, icon: "ti ti-box" },
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
  const [salesChannel, setSalesChannel] = useState<"shop" | "inventory">("shop");
  const [salesType, setSalesType] = useState<"retail" | "wholesale">("retail");
  const [channelDropdownOpen, setChannelDropdownOpen] = useState<boolean>(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<boolean>(false);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [showAlert, setShowAlert] = useState<boolean>(true);
  const [isRoundoff, setIsRoundoff] = useState<boolean>(true);
  const [orderMode, setOrderMode] = useState<"counter_bills" | "tokens" | "project">("counter_bills");

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Dynamic Price & Stock helpers based on Sales Channel and Sales Type
  const getProductPrice = useCallback(
    (prod: Product, sType: "retail" | "wholesale" = salesType) => {
      if (sType === "wholesale") {
        if (prod.wholesale_price !== undefined && Number(prod.wholesale_price) > 0) {
          return Number(prod.wholesale_price);
        }
        if (prod.attributes?.wholesale_price) {
          return Number(prod.attributes.wholesale_price);
        }
        if (prod.cost_price && Number(prod.cost_price) > 0) {
          return Math.round(Number(prod.cost_price) * 1.25);
        }
        const retailPrice = Number(prod.selling_price ?? prod.price ?? prod.sale_price ?? 0);
        return Math.round(retailPrice * 0.75);
      }
      return Number(prod.selling_price ?? prod.price ?? prod.sale_price ?? 0);
    },
    [salesType]
  );

  const getProductStock = useCallback(
    (prod: Product, sChannel: "shop" | "inventory" = salesChannel) => {
      if (sChannel === "shop") {
        return Number(prod.shop_stock ?? prod.stock_quantity ?? prod.stock ?? 0);
      }
      return Number(prod.warehouse_stock ?? prod.stock_quantity ?? prod.stock ?? 0);
    },
    [salesChannel]
  );

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
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

  // Item Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [editingNoteItem, setEditingNoteItem] = useState<{ id: string; name: string; notes: string } | null>(null);

  // Edit Product Slide-over Drawer (#edit-product)
  const [editProductDrawerOpen, setEditProductDrawerOpen] = useState<boolean>(false);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editProductName, setEditProductName] = useState<string>("");
  const [editProductPrice, setEditProductPrice] = useState<string>("");
  const [editTaxType, setEditTaxType] = useState<{ value: string; label: string }>({
    value: "Exclusive",
    label: "Exclusive",
  });
  const [editTaxRate, setEditTaxRate] = useState<string>("0");
  const [editDiscountType, setEditDiscountType] = useState<{ value: string; label: string }>({
    value: "Percentage",
    label: "Percentage (%)",
  });
  const [editDiscountValue, setEditDiscountValue] = useState<string>("0");
  const [editSaleUnit, setEditSaleUnit] = useState<{ value: string; label: string }>({
    value: "Piece",
    label: "Piece (pc)",
  });
  const [editItemNotes, setEditItemNotes] = useState<string>("");

  // Item Details / Size & Add-ons Modal (#items_details)
  const [itemDetailsModalOpen, setItemDetailsModalOpen] = useState<boolean>(false);
  const [detailsCartItem, setDetailsCartItem] = useState<CartItem | null>(null);
  const [detailsSelectedSize, setDetailsSelectedSize] = useState<{ id: string; name: string; price: number } | null>(null);
  const [detailsSelectedAddons, setDetailsSelectedAddons] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [detailsQuantity, setDetailsQuantity] = useState<number>(1);

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

  const DEFAULT_POS_CUSTOMERS = [
    {
      value: "walkin",
      label: "Walk in Customer",
      name: "Walk in Customer",
      phone: "+91 98765 43210",
      points: 148,
      loyalty_balance: 20,
      status: "Available",
    },
    {
      value: "cust-1",
      label: "Rajesh Kumar Sharma (+91 98234 56789)",
      name: "Rajesh Kumar Sharma",
      phone: "+91 98234 56789",
      email: "rajesh.sharma@example.com",
      points: 320,
      loyalty_balance: 45,
      status: "Available",
    },
    {
      value: "cust-2",
      label: "Priya Patel (+91 97123 45678)",
      name: "Priya Patel",
      phone: "+91 97123 45678",
      email: "priya.p@example.com",
      points: 180,
      loyalty_balance: 15,
      status: "Available",
    },
    {
      value: "cust-3",
      label: "Amit Verma (+91 99887 76655)",
      name: "Amit Verma",
      phone: "+91 99887 76655",
      email: "amit.verma@example.com",
      points: 210,
      loyalty_balance: 25,
      status: "Available",
    },
    {
      value: "cust-4",
      label: "Ananya Deshmukh (+91 94220 11223)",
      name: "Ananya Deshmukh",
      phone: "+91 94220 11223",
      email: "ananya.d@example.com",
      points: 450,
      loyalty_balance: 60,
      status: "Available",
    },
    {
      value: "cust-5",
      label: "Vikram Malhotra (+91 98111 22334)",
      name: "Vikram Malhotra",
      phone: "+91 98111 22334",
      email: "vikram.m@example.com",
      points: 90,
      loyalty_balance: 0,
      status: "Unavailable",
    },
  ];

  // Fetch Products, Categories, Customers dynamically
  const loadPOSData = useCallback(async () => {
    const biz = businessId || getActiveBusinessId();

    try {
      const [prodRes, catRes, custRes] = await Promise.allSettled([
        api.get<Product[]>("/products", {
          business_id: biz,
          sales_channel: salesChannel,
          sales_type: salesType,
          stock_source: salesChannel,
        }),
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
      } else {
        setCustomers(DEFAULT_POS_CUSTOMERS);
      }
    } catch (err) {
      console.error("Error loading POS master data:", err);
      setProducts(DEFAULT_POS_PRODUCTS);
      setCategories(DEFAULT_POS_CATEGORIES);
      setCustomers(DEFAULT_POS_CUSTOMERS);
    }
  }, [businessId, salesChannel, salesType]);

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

      return matchesCat && matchesSearch;
    });
  }, [products, activeTab, searchQuery]);

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

  // Group cart items dynamically by Category Name
  const cartByCategory = useMemo(() => {
    const groups: { [catName: string]: { items: CartItem[]; subtotal: number; totalQty: number } } = {};
    cart.forEach((item) => {
      const catName = item.product.category_name || item.product.category || "General";
      if (!groups[catName]) {
        groups[catName] = { items: [], subtotal: 0, totalQty: 0 };
      }
      const itemSubtotal = item.unit_price * item.quantity;
      groups[catName].items.push(item);
      groups[catName].subtotal += itemSubtotal;
      groups[catName].totalQty += item.quantity;
    });
    return groups;
  }, [cart]);

  // Cart Operations
  const addToCart = (product: Product) => {
    const totalStock = getProductStock(product, salesChannel);
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (totalStock > 0 && currentQty >= totalStock) {
      alert(`Maximum stock reached (${totalStock} ${product.unit || "Pcs"}) for ${product.name}`);
      return;
    }

    const price = getProductPrice(product, salesType);
    const taxRate = Number(product.tax_rate) || 5;
    const defaultSize = { id: "size-sm", name: "Small (6-inch)", price: Math.max(10, Math.round(price * 0.75)) };
    const unitPrice = defaultSize.price;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.product.id === product.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const newQty = copy[existingIdx].quantity + 1;
        const currentUnitPrice = copy[existingIdx].unit_price || unitPrice;
        const lineSubtotal = currentUnitPrice * newQty;
        const lineTax = (lineSubtotal * taxRate) / 100;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: newQty,
          tax_amount: lineTax,
          total_amount: lineSubtotal + lineTax,
        };
        return copy;
      } else {
        const lineSubtotal = unitPrice * 1;
        const lineTax = (lineSubtotal * taxRate) / 100;
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unit_price: unitPrice,
            discount: 0,
            tax_rate: taxRate,
            tax_amount: lineTax,
            total_amount: lineSubtotal + lineTax,
            selectedSize: defaultSize,
            selectedAddons: [],
          },
        ];
      }
    });
  };

  const addonScrollRef = useRef<HTMLDivElement>(null);
  const scrollAddons = (direction: "left" | "right") => {
    if (addonScrollRef.current) {
      const scrollAmt = direction === "left" ? -180 : 180;
      addonScrollRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  const openProductDetailsModal = useCallback(
    (product: Product) => {
      const existingCartItem = cart.find((c) => c.product.id === product.id);
      const baseP = getProductPrice(product, salesType);
      const sizes = [
        { id: "size-sm", name: "Small (6-inch)", price: Math.max(10, Math.round(baseP * 0.75)) },
        { id: "size-md", name: "Medium (8-inch)", price: baseP },
        { id: "size-lg", name: "Large (12-inch)", price: Math.round(baseP * 1.35) },
        { id: "size-xl", name: "Exotic Jumbo", price: Math.round(baseP * 1.75) },
      ];

      if (existingCartItem) {
        setDetailsCartItem(existingCartItem);
        setDetailsSelectedSize(existingCartItem.selectedSize || sizes[0]);
        setDetailsSelectedAddons(existingCartItem.selectedAddons || []);
        setDetailsQuantity(existingCartItem.quantity);
      } else {
        const defaultSize = sizes[0];
        const unitPrice = defaultSize.price;
        const taxRate = Number(product.tax_rate) || 5;
        const lineTax = (unitPrice * 1 * taxRate) / 100;
        const tempItem: CartItem = {
          product,
          quantity: 1,
          unit_price: unitPrice,
          discount: 0,
          tax_rate: taxRate,
          tax_amount: lineTax,
          total_amount: unitPrice + lineTax,
          selectedSize: defaultSize,
          selectedAddons: [],
        };
        setDetailsCartItem(tempItem);
        setDetailsSelectedSize(defaultSize);
        setDetailsSelectedAddons([]);
        setDetailsQuantity(1);
      }
      setItemDetailsModalOpen(true);
    },
    [cart, getProductPrice, salesType]
  );

  const openEditProductDrawer = (item: CartItem) => {
    setEditingCartItem(item);
    setEditProductName(item.product.name);
    setEditProductPrice(item.unit_price.toString());
    setEditTaxType(
      item.product.attributes?.tax_type === "Inclusive"
        ? { value: "Inclusive", label: "Inclusive" }
        : { value: "Exclusive", label: "Exclusive" }
    );
    setEditTaxRate((item.tax_rate ?? item.product.tax_rate ?? 0).toString());
    setEditDiscountType(
      item.discount > 0 && item.discount <= 100
        ? { value: "Percentage", label: "Percentage (%)" }
        : { value: "Fixed", label: "Fixed Amount (₹)" }
    );
    setEditDiscountValue((item.discount || 0).toString());
    const unitVal = item.product.unit || "Piece";
    setEditSaleUnit({ value: unitVal, label: unitVal });
    setEditItemNotes(item.notes || "");
    setEditProductDrawerOpen(true);
  };

  const handleSaveEditProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingCartItem) return;

    const newPrice = Math.max(0, Number(editProductPrice) || 0);
    const newTaxRate = Math.max(0, Number(editTaxRate) || 0);
    const newDiscountVal = Math.max(0, Number(editDiscountValue) || 0);
    const qty = editingCartItem.quantity || 1;

    let itemDiscountAmount = 0;
    if (editDiscountType.value === "Percentage") {
      itemDiscountAmount = (newPrice * newDiscountVal) / 100;
    } else {
      itemDiscountAmount = newDiscountVal / qty;
    }

    const priceAfterDiscount = Math.max(0, newPrice - itemDiscountAmount);
    const lineTax = (priceAfterDiscount * qty * newTaxRate) / 100;
    const totalAmount = priceAfterDiscount * qty + lineTax;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === editingCartItem.product.id) {
          return {
            ...item,
            product: {
              ...item.product,
              name: editProductName.trim() || item.product.name,
              unit: editSaleUnit.value,
            },
            unit_price: newPrice,
            tax_rate: newTaxRate,
            tax_amount: lineTax,
            discount: newDiscountVal,
            total_amount: Math.round(totalAmount),
            notes: editItemNotes.trim(),
          };
        }
        return item;
      })
    );

    setEditProductDrawerOpen(false);
    setEditingCartItem(null);
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

        /* Product Card: Light Mode Base */
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
          border-color: #22c55e !important;
          box-shadow: none !important;
        }
        .pos-five .pos-products .product-info.card.active {
          border-color: #22c55e !important;
          background: #ffffff !important;
        }

        /* Image Container: Square 1:1 design matching the original theme layout (187 x 187 px rendered size) */
        .pos-five .pos-products .product-info .pro-img {
          background-color: #f9fafb !important;
          border-radius: 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-bottom: 10px !important;
          position: relative !important;
          width: 100% !important;
          aspect-ratio: 1 / 1 !important;
          height: auto !important;
          min-height: unset !important;
          max-height: none !important;
          overflow: hidden !important;
          padding: 12px !important;
          border: 1px solid #f1f5f9 !important;
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
          transform: scale(1.08) !important;
        }
        .pos-five .pos-products .product-info .pro-img span,
        [data-theme="dark"] .pos-five .pos-products .product-info .pro-img span,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .pro-img span,
        .dark .pos-five .pos-products .product-info .pro-img span,
        body.dark-mode .pos-five .pos-products .product-info .pro-img span {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          left: auto !important;
          bottom: auto !important;
          width: 22px !important;
          height: 22px !important;
          border-radius: 50% !important;
          display: none !important;
          align-items: center !important;
          justify-content: center !important;
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          z-index: 10 !important;
          line-height: 1 !important;
        }
        .pos-five .pos-products .product-info.card.active .pro-img span {
          display: flex !important;
        }
        .pos-five .pos-products .product-info .pro-img span i {
          font-size: 20px !important;
          line-height: 1 !important;
          color: #22c55e !important;
          display: block !important;
        }

        /* Card body content inside */
        .pos-five .pos-products .product-info .card-body-content {
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          flex-grow: 1 !important;
          justify-content: space-between !important;
        }
        .pos-five .pos-products .product-info .cat-name {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 2px;
          text-transform: capitalize;
        }
        .pos-five .pos-products .product-info .cat-name a {
          color: inherit;
          text-decoration: none;
        }
        .pos-five .pos-products .product-info .product-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.35;
          min-height: 36px;
          transition: color 0.15s ease;
        }
        .pos-five .pos-products .product-info .product-name a {
          color: inherit !important;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .pos-five .pos-products .product-info .product-name:hover,
        .pos-five .pos-products .product-info .product-name a:hover,
        .pos-five .pos-products .product-info:hover .product-name,
        .pos-five .pos-products .product-info:hover .product-name a,
        .pos-five .pos-products .product-info.active .product-name,
        .pos-five .pos-products .product-info.active .product-name a {
          color: var(--theme-primary, #fe9f43) !important;
        }
        .pos-five .pos-products .product-info .price {
          border-top: 1px dashed #e2e8f0 !important;
          margin-top: 10px !important;
          padding-top: 10px !important;
        }
        .pos-five .pos-products .product-info .price-val {
          color: #1e293b;
          font-weight: 700;
          font-size: 15px;
        }

        /* Quantity Counter: Clean (-) 4 (+) with no outer border or background */
        .qty-item {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          position: relative !important;
          height: auto !important;
        }
        .qty-item .dec,
        .qty-item .inc,
        .action .btn-icon {
          position: static !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          transform: none !important;
          width: 28px !important;
          height: 28px !important;
          min-width: 28px !important;
          max-width: 28px !important;
          border-radius: 50% !important;
          padding: 0 !important;
          margin: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 13px !important;
          border: none !important;
          box-shadow: none !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        .qty-item .dec i,
        .qty-item .inc i,
        .action .btn-icon i,
        .action .btn-icon [class^="icon-"],
        .action .btn-icon [class*=" icon-"] {
          font-size: 14px !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .qty-item .dec,
        .qty-item .inc {
          background-color: #f8f9fa !important;
          color: #333843 !important;
        }
        .qty-item .dec:hover,
        .qty-item .inc:hover {
          background-color: #e9ecef !important;
          color: #111827 !important;
          transform: scale(1.06) !important;
        }
        .action .btn-icon.btn-light {
          background-color: transparent !important;
          color: #333843 !important;
          box-shadow: none !important;
        }
        .action .btn-icon.btn-light:hover {
          background-color: transparent !important;
          color: #111827 !important;
          transform: none !important;
          box-shadow: none !important;
        }
        .action .btn-icon.btn-danger {
          background-color: #ff3b30 !important;
          color: #ffffff !important;
        }
        .action .btn-icon.btn-danger:hover {
          background-color: #e02d23 !important;
          color: #ffffff !important;
          transform: scale(1.06) !important;
        }
        .qty-item input {
          position: static !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          transform: none !important;
          width: 20px !important;
          min-width: 20px !important;
          max-width: 28px !important;
          height: 24px !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          color: #1e293b !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          text-align: center !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* ==========================================================================
           DARK THEME STYLES (Matching Original DreamsPOS Dark Design)
           ========================================================================== */
        [data-theme="dark"] .pos-five .pos-products .product-info.card,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info.card,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info.card,
        .dark .pos-five .pos-products .product-info.card,
        body.dark-mode .pos-five .pos-products .product-info.card {
          background: #111417 !important;
          border: 1px solid #1f2328 !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info.card:hover,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info.card:hover,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info.card:hover,
        .dark .pos-five .pos-products .product-info.card:hover,
        body.dark-mode .pos-five .pos-products .product-info.card:hover {
          border-color: #22c55e !important;
          box-shadow: none !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info.card.active,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info.card.active,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info.card.active,
        .dark .pos-five .pos-products .product-info.card.active,
        body.dark-mode .pos-five .pos-products .product-info.card.active {
          border-color: #22c55e !important;
          background: #111417 !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info .pro-img,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .pro-img,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info .pro-img,
        .dark .pos-five .pos-products .product-info .pro-img,
        body.dark-mode .pos-five .pos-products .product-info .pro-img {
          background-color: #0b0d0e !important;
          border: 1px solid #1a1e23 !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info .cat-name,
        [data-theme="dark"] .pos-five .pos-products .product-info .cat-name a,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .cat-name,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .cat-name a,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info .cat-name,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info .cat-name a,
        .dark .pos-five .pos-products .product-info .cat-name,
        .dark .pos-five .pos-products .product-info .cat-name a,
        body.dark-mode .pos-five .pos-products .product-info .cat-name,
        body.dark-mode .pos-five .pos-products .product-info .cat-name a {
          color: #878a99 !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info .product-name,
        [data-theme="dark"] .pos-five .pos-products .product-info .product-name a,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .product-name,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .product-name a,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info .product-name,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info .product-name a,
        .dark .pos-five .pos-products .product-info .product-name,
        .dark .pos-five .pos-products .product-info .product-name a,
        body.dark-mode .pos-five .pos-products .product-info .product-name,
        body.dark-mode .pos-five .pos-products .product-info .product-name a {
          color: #ffffff !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info .product-name a:hover,
        [data-theme="dark"] .pos-five .pos-products .product-info:hover .product-name a,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .product-name a:hover,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info:hover .product-name a,
        .dark .pos-five .pos-products .product-info .product-name a:hover,
        .dark .pos-five .pos-products .product-info:hover .product-name a,
        body.dark-mode .pos-five .pos-products .product-info .product-name a:hover,
        body.dark-mode .pos-five .pos-products .product-info:hover .product-name a {
          color: var(--theme-primary, #fe9f43) !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info .price,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .price,
        .dark .pos-five .pos-products .product-info .price,
        body.dark-mode .pos-five .pos-products .product-info .price {
          border-top: 1px dashed #2d333b !important;
        }
        [data-theme="dark"] .pos-five .pos-products .product-info .price-val,
        [data-theme="dark"] .pos-five .pos-products .product-info .price p,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .price-val,
        [data-bs-theme="dark"] .pos-five .pos-products .product-info .price p,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info .price-val,
        [data-layout-mode="dark"] .pos-five .pos-products .product-info .price p,
        .dark .pos-five .pos-products .product-info .price-val,
        .dark .pos-five .pos-products .product-info .price p,
        body.dark-mode .pos-five .pos-products .product-info .price-val,
        body.dark-mode .pos-five .pos-products .product-info .price p {
          color: #ffffff !important;
        }
        [data-theme="dark"] .pos-five .pos-products .qty-item,
        [data-bs-theme="dark"] .pos-five .pos-products .qty-item,
        .dark .pos-five .pos-products .qty-item,
        body.dark-mode .pos-five .pos-products .qty-item {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        [data-theme="dark"] .pos-five .pos-products .qty-item .dec,
        [data-theme="dark"] .pos-five .pos-products .qty-item .inc,
        [data-bs-theme="dark"] .pos-five .pos-products .qty-item .dec,
        [data-bs-theme="dark"] .pos-five .pos-products .qty-item .inc,
        .dark .pos-five .pos-products .qty-item .dec,
        .dark .pos-five .pos-products .qty-item .inc,
        body.dark-mode .pos-five .pos-products .qty-item .dec,
        body.dark-mode .pos-five .pos-products .qty-item .inc {
          background: #ffffff !important;
          color: #111417 !important;
          border: none !important;
          box-shadow: none !important;
        }
        [data-theme="dark"] .pos-five .pos-products .qty-item .dec:hover,
        [data-theme="dark"] .pos-five .pos-products .qty-item .inc:hover,
        [data-bs-theme="dark"] .pos-five .pos-products .qty-item .dec:hover,
        [data-bs-theme="dark"] .pos-five .pos-products .qty-item .inc:hover {
          background: #e2e8f0 !important;
          color: #000000 !important;
        }
        [data-theme="dark"] .pos-five .pos-products .qty-item input,
        [data-bs-theme="dark"] .pos-five .pos-products .qty-item input,
        .dark .pos-five .pos-products .qty-item input,
        body.dark-mode .pos-five .pos-products .qty-item input {
          color: #ffffff !important;
          background: transparent !important;
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

        /* Customer & Edit Product Offcanvas Drawers */
        .offcanvas#add_order,
        .offcanvas#edit_product_drawer,
        .offcanvas.pos-edit-product-drawer {
          width: 480px !important;
          max-width: 480px !important;
          min-width: unset !important;
          background: #ffffff !important;
          position: fixed !important;
          right: 0 !important;
          left: auto !important;
          top: 0 !important;
          bottom: 0 !important;
          height: 100vh !important;
          border-radius: 0 !important;
          border: none !important;
          border-left: 1px solid #f1f5f9 !important;
          box-shadow: -8px 0 30px rgba(0, 0, 0, 0.08) !important;
        }
        .offcanvas#add_order .customer-row-item {
          transition: background-color 0.15s ease;
        }
        .offcanvas#add_order .customer-row-item:hover {
          background-color: #f8fafc !important;
        }

        /* POS Action Dropdowns */
        .pos-action-dropdown {
          position: relative;
          display: inline-block;
        }
        .pos-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          height: 34px;
          min-width: 135px;
          padding: 0 10px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          outline: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
          box-sizing: border-box;
        }
        .pos-action-btn .btn-content {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pos-action-btn.channel-btn {
          background-color: #1e293b;
          color: #ffffff;
          border-color: #334155;
        }
        .pos-action-btn.channel-btn:hover {
          background-color: #0f172a;
          box-shadow: 0 3px 8px rgba(15, 23, 42, 0.15);
        }
        .pos-action-btn.type-btn {
          background-color: var(--theme-primary, #fe9f43);
          color: #ffffff;
          border-color: transparent;
        }
        .pos-action-btn.type-btn:hover {
          filter: brightness(0.92);
          box-shadow: 0 3px 10px rgba(254, 159, 67, 0.25);
        }
        .pos-action-btn .dropdown-arrow {
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          margin-left: 2px;
        }
        .pos-action-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 100%;
          min-width: 135px;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 4px !important;
          box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.05) !important;
          z-index: 1060;
          margin: 0;
          list-style: none;
          box-sizing: border-box;
        }
        .pos-action-dropdown.align-right .pos-action-menu {
          left: auto;
          right: 0;
        }
        .pos-action-item {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          padding: 6px 8px;
          border-radius: 5px;
          border: none;
          background: transparent;
          color: #334155;
          font-size: 12px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
          box-sizing: border-box;
        }
        .pos-action-item .item-icon {
          font-size: 14px;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }
        .pos-action-item .item-label {
          flex: 1;
          white-space: nowrap;
        }
        .pos-action-item .item-check {
          font-size: 13px;
          color: #22c55e;
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          margin-left: 2px;
        }
        .pos-action-item:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .pos-action-item:hover .item-icon {
          color: #0f172a;
        }
        .pos-action-item.active.channel-active {
          background-color: #f1f5f9;
          color: #0f172a;
          font-weight: 600;
        }
        .pos-action-item.active.channel-active .item-icon {
          color: #0f172a;
        }
        .pos-action-item.active.type-active {
          background-color: #fff8f1;
          color: #d97706;
          font-weight: 600;
        }
        .pos-action-item.active.type-active .item-icon,
        .pos-action-item.active.type-active .item-check {
          color: #fe9f43;
        }

        /* Lock outer POS page to eliminate duplicate outer scrollbar */
        .pos-pg-wrapper {
          height: 100vh !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }
        .pos-design,
        .pos-wrapper,
        .pos-categories.tabs_wrapper {
          height: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
        }
        .theiaStickySidebar {
          height: calc(100vh - 85px) !important;
          max-height: calc(100vh - 85px) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
          border-left: 1px solid #e2e8f0 !important;
          scrollbar-width: thin !important;
          scrollbar-color: var(--theme-primary, #fe9f43) transparent !important;
        }
        .theiaStickySidebar::-webkit-scrollbar {
          width: 4px !important;
        }
        .theiaStickySidebar::-webkit-scrollbar-thumb {
          background: var(--theme-primary, #fe9f43) !important;
          border-radius: 4px !important;
        }

        aside.product-order-list {
          padding: 0 !important;
          margin: 0 !important;
          background: #ffffff !important;
          border: none !important;
          box-shadow: none !important;
        }
        aside.product-order-list .card {
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          background: transparent !important;
        }
        aside.product-order-list .card .card-body {
          padding: 18px 20px !important;
        }

        /* Category & Product Independent Scrolling */
        .pos-categories .content-wrap {
          display: flex !important;
          height: calc(100vh - 85px) !important;
          max-height: calc(100vh - 85px) !important;
          overflow: hidden !important;
          align-items: flex-start !important;
        }
        .pos-categories .tab-wrap {
          position: sticky !important;
          top: 0 !important;
          height: 100% !important;
          max-height: calc(100vh - 85px) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          flex-shrink: 0 !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .pos-categories .tab-wrap::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .pos-categories .tab-wrap ul.pos-category5 {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 8px !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .pos-categories .tab-wrap ul.pos-category5 li {
          width: 100% !important;
          min-height: 84px !important;
          height: auto !important;
          padding: 10px 6px !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
        .pos-categories .tab-wrap ul.pos-category5 li > a {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          margin: 0 auto 6px auto !important;
        }
        .pos-categories .tab-wrap ul.pos-category5 li a img {
          display: block !important;
          width: 26px !important;
          height: 26px !important;
          object-fit: contain !important;
          margin: 0 auto !important;
        }
        .pos-categories .tab-wrap ul.pos-category5 li h6 {
          display: block !important;
          margin: 0 !important;
          width: 100% !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          line-height: 1.25 !important;
          white-space: normal !important;
          text-align: center !important;
          word-break: break-word !important;
        }
        .pos-categories .tab-wrap ul.pos-category5 li h6 a {
          display: block !important;
          width: 100% !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          line-height: 1.25 !important;
          white-space: normal !important;
          text-align: center !important;
          word-break: break-word !important;
        }
        .pos-categories .tab-content-wrap {
          flex: 1 !important;
          height: 100% !important;
          max-height: calc(100vh - 85px) !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          padding: 16px 20px !important;
          scrollbar-width: thin !important;
          scrollbar-color: var(--theme-primary, #fe9f43) transparent !important;
        }
        .pos-categories .tab-content-wrap::-webkit-scrollbar {
          display: block !important;
          width: 5px !important;
        }
        .pos-categories .tab-content-wrap::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .pos-categories .tab-content-wrap::-webkit-scrollbar-thumb {
          background: var(--theme-primary, #fe9f43) !important;
          border-radius: 6px !important;
        }
        .pos-categories .tab-content-wrap::-webkit-scrollbar-thumb:hover {
          filter: brightness(0.85);
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
                    {/* Search Bar & Controls Header */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <div className="input-icon-start search-pos position-relative flex-grow-1" style={{ maxWidth: "240px" }}>
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
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {/* Dropdown 1: Showroom vs Warehouse */}
                        <div className="pos-action-dropdown" ref={channelDropdownRef}>
                          <button
                            type="button"
                            className="pos-action-btn channel-btn"
                            onClick={() => {
                              setChannelDropdownOpen((prev) => !prev);
                              setTypeDropdownOpen(false);
                            }}
                          >
                            <span className="btn-content">
                              <i className={salesChannel === "shop" ? "ti ti-building-store fs-15" : "ti ti-packages fs-15"} />
                              <span>{salesChannel === "shop" ? "Showroom" : "Warehouse"}</span>
                            </span>
                            <span className="dropdown-arrow">
                              <i className={`ti ti-chevron-${channelDropdownOpen ? "up" : "down"}`} />
                            </span>
                          </button>

                          {channelDropdownOpen && (
                            <div className="pos-action-menu">
                              <button
                                type="button"
                                className={`pos-action-item ${
                                  salesChannel === "shop" ? "active channel-active" : ""
                                }`}
                                onClick={() => {
                                  setSalesChannel("shop");
                                  setChannelDropdownOpen(false);
                                }}
                              >
                                <span className="item-icon">
                                  <i className="ti ti-building-store" />
                                </span>
                                <span className="item-label">Showroom</span>
                                {salesChannel === "shop" && (
                                  <span className="item-check">
                                    <i className="ti ti-check" />
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                className={`pos-action-item ${
                                  salesChannel === "inventory" ? "active channel-active" : ""
                                }`}
                                onClick={() => {
                                  setSalesChannel("inventory");
                                  setChannelDropdownOpen(false);
                                }}
                              >
                                <span className="item-icon">
                                  <i className="ti ti-packages" />
                                </span>
                                <span className="item-label">Warehouse</span>
                                {salesChannel === "inventory" && (
                                  <span className="item-check">
                                    <i className="ti ti-check" />
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Dropdown 2: Retail vs Wholesale Sales */}
                        <div className="pos-action-dropdown align-right" ref={typeDropdownRef}>
                          <button
                            type="button"
                            className="pos-action-btn type-btn"
                            onClick={() => {
                              setTypeDropdownOpen((prev) => !prev);
                              setChannelDropdownOpen(false);
                            }}
                          >
                            <span className="btn-content">
                              <i className={salesType === "retail" ? "ti ti-shopping-bag fs-15" : "ti ti-building-warehouse fs-15"} />
                              <span>{salesType === "retail" ? "Retail" : "Wholesale"}</span>
                            </span>
                            <span className="dropdown-arrow">
                              <i className={`ti ti-chevron-${typeDropdownOpen ? "up" : "down"}`} />
                            </span>
                          </button>

                          {typeDropdownOpen && (
                            <div className="pos-action-menu">
                              <button
                                type="button"
                                className={`pos-action-item ${
                                  salesType === "retail" ? "active type-active" : ""
                                }`}
                                onClick={() => {
                                  setSalesType("retail");
                                  setTypeDropdownOpen(false);
                                }}
                              >
                                <span className="item-icon">
                                  <i className="ti ti-shopping-bag" />
                                </span>
                                <span className="item-label">Retail</span>
                                {salesType === "retail" && (
                                  <span className="item-check">
                                    <i className="ti ti-check" />
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                className={`pos-action-item ${
                                  salesType === "wholesale" ? "active type-active" : ""
                                }`}
                                onClick={() => {
                                  setSalesType("wholesale");
                                  setTypeDropdownOpen(false);
                                }}
                              >
                                <span className="item-icon">
                                  <i className="ti ti-building-warehouse" />
                                </span>
                                <span className="item-label">Wholesale</span>
                                {salesType === "wholesale" && (
                                  <span className="item-check">
                                    <i className="ti ti-check" />
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reset Filter Button */}
                        <button
                          type="button"
                          className="pos-filter-reset-btn"
                          title="Reset to Showroom & Retail"
                          aria-label="Reset dropdowns to default"
                          onClick={() => {
                            setSalesChannel("shop");
                            setSalesType("retail");
                            setChannelDropdownOpen(false);
                            setTypeDropdownOpen(false);
                          }}
                        >
                          <i className="ti ti-rotate-2 fs-16" />
                        </button>
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
                              const stock = getProductStock(product, salesChannel);
                              const currentPrice = getProductPrice(product, salesType);

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
                                          product.image_url || placeholderPos
                                        }
                                        onError={(e) => {
                                          e.currentTarget.src = placeholderPos;
                                        }}
                                        alt={product.name}
                                      />
                                      <span>
                                        <i className="ti ti-circle-check-filled" />
                                      </span>
                                    </Link>
                                    <div className="card-body-content">
                                      <div>
                                        <h6 className="cat-name">
                                          <Link
                                            to="#"
                                            title={product.category_name || product.category || "Products"}
                                            onClick={(e) => e.preventDefault()}
                                          >
                                            {product.category_name || product.category || "Products"}
                                          </Link>
                                        </h6>
                                        <h6 className="product-name">
                                          <Link
                                            to="#"
                                            title={product.name}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              openProductDetailsModal(product);
                                            }}
                                          >
                                            {product.name}
                                          </Link>
                                        </h6>
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                          <span
                                            className={`badge ${stock > 10
                                                ? "bg-success-transparent text-success"
                                                : stock > 0
                                                  ? "bg-warning-transparent text-warning"
                                                  : "bg-danger-transparent text-danger"
                                              } fs-11 fw-semibold`}
                                          >
                                            <i className="ti ti-box me-1" />
                                            {stock > 0
                                              ? `${stock} in ${salesChannel === "shop" ? "Showroom" : "WH"}`
                                              : "Out of Stock"}
                                          </span>
                                          <button
                                            type="button"
                                            className="btn btn-icon btn-xs rounded-circle border-0 d-inline-flex align-items-center justify-content-center pos-view-eye-btn pos-view-info-btn"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              openProductDetailsModal(product);
                                            }}
                                            title="View Details, Sizes & Upgrades"
                                          >
                                            <i className="ti ti-edit fs-15" />
                                          </button>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="d-flex align-items-center justify-content-between price">
                                          <p className="price-val fw-bold fs-15 mb-0">
                                            {formatINR(currentPrice)}
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
            <div className="col-md-12 col-lg-5 col-xl-4 p-0 theiaStickySidebar d-lg-flex">
              <aside className="product-order-list bg-white flex-fill p-0 border-0 m-0">
                {/* Order List Card */}
                <div className="card border-0 shadow-none m-0 rounded-0 bg-transparent">
                  <div className="card-body p-3">
                    <div className="order-head d-flex align-items-center justify-content-between w-100">
                      <div>
                        <h3>Order List</h3>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Link
                          to="#"
                          className="text-danger text-decoration-underline fs-13 fw-semibold"
                          data-bs-toggle="offcanvas"
                          data-bs-target="#filter-offcanvas-3"
                          onClick={(e) => e.preventDefault()}
                        >
                          View Details
                        </Link>
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

                    {/* Order Mode Tabs (Counter Bills, Tokens, Project) */}
                    <ul
                      className="nav nav-tabs nav-tabs-solid border-0 mb-3 align-items-center justify-content-between flex-wrap gap-1 pos-tab"
                      role="tablist"
                    >
                      <li className="nav-item flex-fill">
                        <Link
                          to="#"
                          className={`nav-link justify-content-center ${
                            orderMode === "counter_bills" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            setOrderMode("counter_bills");
                          }}
                        >
                          <i className="ti ti-receipt me-1" />
                          Counter Bills
                        </Link>
                      </li>
                      <li className="nav-item flex-fill">
                        <Link
                          to="#"
                          className={`nav-link justify-content-center ${
                            orderMode === "tokens" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            setOrderMode("tokens");
                          }}
                        >
                          <i className="ti ti-ticket me-1" />
                          Tokens
                        </Link>
                      </li>
                      <li className="nav-item flex-fill">
                        <Link
                          to="#"
                          className={`nav-link flex-fill justify-content-center ${
                            orderMode === "project" ? "active" : ""
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            setOrderMode("project");
                          }}
                        >
                          <i className="ti ti-folders me-1" />
                          Project
                        </Link>
                      </li>
                    </ul>

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

                    {/* Ordered Menus */}
                    <div className="product-added block-section">
                      <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
                        <h6 className="mb-0 fw-bold fs-15">Ordered Menus</h6>
                        <div className="d-flex align-items-center gap-2">
                          <p className="mb-0 d-flex align-items-center text-dark fs-13">
                            Total Menus :{" "}
                            <span
                              className="d-flex align-items-center justify-content-center fs-12 fw-bold btn btn-icon btn-xs rounded-circle border flex-shrink-0 ms-1 text-dark"
                              style={{ width: "24px", height: "24px" }}
                            >
                              {cart.length}
                            </span>
                          </p>
                          {cart.length > 0 && (
                            <Link
                              to="#"
                              className="d-flex align-items-center clear-icon fs-11 fw-medium text-danger ms-1"
                              onClick={(e) => {
                                e.preventDefault();
                                clearCart();
                              }}
                            >
                              Clear all
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="product-wrap">
                        {cart.length === 0 ? (
                          <div className="empty-cart text-center py-4 my-2">
                            <i className="ti ti-shopping-cart fs-36 text-muted mb-2 d-block opacity-50" />
                            <p className="fw-semibold text-muted mb-0">No Products Selected</p>
                          </div>
                        ) : (
                          <div className="ordered-menu-list">
                            {cart.map((item) => {
                              const isExpanded = expandedItemId === item.product.id;
                              return (
                                <div
                                  key={item.product.id}
                                  className={`menu-item p-2 rounded border shadow-sm mb-3 ${
                                    isExpanded ? "active" : ""
                                  }`}
                                >
                                  <div className="d-flex align-items-center justify-content-between flex-wrap flex-xl-nowrap gap-2">
                                    {/* Clickable Header for Expanding/Collapsing */}
                                    <div
                                      className="d-flex align-items-center overflow-hidden flex-grow-1 user-select-none"
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        setExpandedItemId((prev) =>
                                          prev === item.product.id ? null : item.product.id
                                        )
                                      }
                                      title={isExpanded ? "Click to collapse details" : "Click to view rate & cost details"}
                                    >
                                      <div className="avatar avatar-md flex-shrink-0" style={{ marginRight: "6px" }}>
                                        <img
                                          src={item.product.image_url || placeholderPos}
                                          alt={item.product.name}
                                          className="img-fluid rounded"
                                          style={{ width: "36px", height: "36px", objectFit: "cover" }}
                                        />
                                      </div>
                                      <div className="overflow-hidden min-w-0 flex-grow-1" style={{ maxWidth: "165px" }}>
                                        <h6
                                          className="mb-1 fs-13 fw-semibold d-flex align-items-center gap-1"
                                          title={item.product.name}
                                          style={{ minWidth: 0 }}
                                        >
                                          <span
                                            className="text-truncate d-inline-block"
                                            style={{
                                              maxWidth: "135px",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {item.product.name}
                                          </span>
                                          <i
                                            className={`ti ti-chevron-${
                                              isExpanded ? "up" : "down"
                                            } fs-12 text-muted flex-shrink-0`}
                                          />
                                        </h6>
                                        <button
                                          type="button"
                                          className="badge badge-sm bg-light text-dark mb-0 border-0 p-1 px-2 d-inline-flex align-items-center gap-1 item-size-badge"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const baseP = getProductPrice(item.product, salesType);
                                            const sizes = [
                                              { id: "size-sm", name: "Small (6-inch)", price: Math.max(10, Math.round(baseP * 0.75)) },
                                              { id: "size-md", name: "Medium (8-inch)", price: baseP },
                                              { id: "size-lg", name: "Large (12-inch)", price: Math.round(baseP * 1.35) },
                                              { id: "size-xl", name: "Exotic Jumbo", price: Math.round(baseP * 1.75) },
                                            ];
                                            setDetailsCartItem(item);
                                            setDetailsSelectedSize(item.selectedSize || sizes[0]);
                                            setDetailsSelectedAddons(item.selectedAddons || []);
                                            setDetailsQuantity(item.quantity);
                                            setItemDetailsModalOpen(true);
                                          }}
                                          title="Click to customize size & add-ons"
                                        >
                                          <span>
                                            {item.selectedSize?.name || (item.product.unit && item.product.unit !== "PCS" ? item.product.unit : "Small (6-inch)")}
                                          </span>
                                          <i className="ti ti-edit fs-10 text-muted" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Quantity Controls & Actions */}
                                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                      {/* Quantity Controls */}
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
                                      {/* Action Buttons: Edit & Delete */}
                                      <div className="action">
                                        <div className="d-flex align-items-center">
                                          {/* Edit Button (Light Grey Circle) */}
                                          <button
                                            type="button"
                                            className="btn btn-icon btn-sm btn-light rounded-circle position-relative me-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openEditProductDrawer(item);
                                            }}
                                            title="Edit"
                                          >
                                            <i className="icon-pencil-line" />
                                          </button>
                                          {/* Delete Button (Red Circle) */}
                                          <button
                                            type="button"
                                            className="btn btn-icon btn-sm btn-danger rounded-circle"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeFromCart(item.product.id);
                                            }}
                                            title="Delete"
                                          >
                                            <i className="icon-trash-2" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expandable/Collapsible Details */}
                                  {isExpanded && (
                                    <div className="pt-2 mt-2 border-top">
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div className="text-center">
                                          <span className="fs-12 mb-1 d-block fw-medium text-muted">
                                            Item Rate
                                          </span>
                                          <p className="mb-0 fs-13 fw-normal">
                                            {formatINR(item.unit_price)}
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <span className="fs-12 mb-1 d-block fw-medium text-muted">
                                            Amount
                                          </span>
                                          <p className="mb-0 fs-13 fw-normal">
                                            {formatINR(item.unit_price * item.quantity)}
                                          </p>
                                        </div>
                                        <div className="text-center">
                                          <span className="fs-12 mb-1 d-block fw-medium text-muted">
                                            Total
                                          </span>
                                          <p className="mb-0 fs-13 fw-semibold text-dark">
                                            {formatINR(item.total_amount)}
                                          </p>
                                        </div>
                                      </div>
                                      {item.notes && (
                                        <div className="mt-2 pt-1 border-top fs-11 text-primary d-flex align-items-center gap-1">
                                          <i className="ti ti-notes" />{" "}
                                          <span className="text-truncate">{item.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "cash" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "card" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "points" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "deposit" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "cheque" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "giftcard" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "scan" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "paylater" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "external" ? "active" : ""
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
                          className={`payment-item d-flex align-items-center justify-content-center p-2 flex-fill ${selectedPaymentMode === "split" ? "active" : ""
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

      {/* Dynamic Order Details Offcanvas Drawer (#filter-offcanvas-3) */}
      <div
        className="offcanvas offcanvas-end"
        tabIndex={-1}
        id="filter-offcanvas-3"
        aria-labelledby="filter-offcanvas-3-label"
      >
        <div className="offcanvas-header pb-0">
          <div className="border-bottom d-flex align-items-center justify-content-between w-100 pb-3">
            <div>
              <h4 className="offcanvas-title mb-1" id="filter-offcanvas-3-label">
                Order Details
              </h4>
              <div className="d-flex align-items-center gap-2 text-muted fs-12">
                <span className="badge bg-soft-primary text-primary fw-semibold">#{orderNumber}</span>
                <span>•</span>
                <span>{selectedCustomer?.name || selectedCustomer?.label?.split(" (")[0] || "Walk in Customer"}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-modal"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            >
              <i className="ti ti-x fs-16" />
            </button>
          </div>
        </div>
        <div className="offcanvas-body d-flex flex-column pt-3">
          {cart.length === 0 ? (
            <div className="text-center py-5 my-auto">
              <i className="ti ti-shopping-cart-x fs-48 text-muted mb-3 d-block opacity-50" />
              <h5 className="fw-semibold text-muted mb-1">Your cart is empty</h5>
              <p className="text-muted fs-13 mb-0">Add products to your cart to see live items grouped by category.</p>
            </div>
          ) : (
            <div className="accordion pos-accordion" id="pos-order-accordion">
              {/* Category-wise Accordion Items */}
              {Object.entries(cartByCategory).map(([catName, catData], catIdx) => (
                <div className="accordion-item" key={catName}>
                  <h3 className="accordion-header" id={`cat-heading-${catIdx}`}>
                    <Link
                      to="#"
                      className="accordion-button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#cat-collapse-${catIdx}`}
                      aria-expanded="true"
                      aria-controls={`cat-collapse-${catIdx}`}
                      onClick={(e) => e.preventDefault()}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100 me-2">
                        <span className="fw-bold">{catName}</span>
                        <span className="badge bg-primary-1 text-dark">
                          {catData.totalQty} {catData.totalQty === 1 ? "Item" : "Items"}
                        </span>
                      </div>
                    </Link>
                  </h3>
                  <div
                    id={`cat-collapse-${catIdx}`}
                    className="accordion-collapse collapse show"
                    aria-labelledby={`cat-heading-${catIdx}`}
                  >
                    <div className="accordion-body">
                      <div className="accordion-content">
                        <div>
                          {catData.items.map((item) => (
                            <p
                              key={item.product.id}
                              className="d-flex align-items-center justify-content-between mb-2 text-dark"
                            >
                              <span>
                                {item.product.name}{" "}
                                <span className="text-muted fw-normal">
                                  × {item.quantity} {item.product.unit || "Pcs"}
                                </span>
                              </span>
                              <span className="fw-semibold">
                                {formatINR(item.unit_price * item.quantity)}
                              </span>
                            </p>
                          ))}
                          <h6 className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
                            <span>Subtotal</span>
                            <span className="fw-bold text-dark">{formatINR(catData.subtotal)}</span>
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Payment Summary */}
              <div className="accordion-item border-0 mb-0">
                <h3 className="accordion-header" id="heading-payment-summary">
                  <Link
                    to="#"
                    className="accordion-button d-flex align-items-center justify-content-between"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-payment-summary"
                    aria-expanded="true"
                    aria-controls="collapse-payment-summary"
                    onClick={(e) => e.preventDefault()}
                  >
                    Payment Summary
                  </Link>
                </h3>
                <div
                  id="collapse-payment-summary"
                  className="accordion-collapse collapse show"
                  aria-labelledby="heading-payment-summary"
                >
                  <div className="accordion-body">
                    <div className="accordion-content">
                      <div>
                        <p className="d-flex align-items-center justify-content-between mb-2 text-dark">
                          <span>Items Subtotal ({totals.totalItems} items)</span>
                          <span className="fw-semibold">{formatINR(totals.subtotal)}</span>
                        </p>
                        {discountPercent > 0 && (
                          <p className="d-flex align-items-center justify-content-between mb-2 text-dark">
                            <span>Discount ({discountPercent}%)</span>
                            <span className="fw-semibold text-danger">-{formatINR(totals.discount)}</span>
                          </p>
                        )}
                        {orderTaxPercent > 0 && (
                          <p className="d-flex align-items-center justify-content-between mb-2 text-dark">
                            <span>Tax ({orderTaxPercent}%)</span>
                            <span className="fw-semibold text-dark">+{formatINR(totals.tax)}</span>
                          </p>
                        )}
                        {shippingCost > 0 && (
                          <p className="d-flex align-items-center justify-content-between mb-2 text-dark">
                            <span>Shipping</span>
                            <span className="fw-semibold text-dark">+{formatINR(totals.shipping)}</span>
                          </p>
                        )}
                        {isRoundoff && totals.roundoffDiff !== 0 && (
                          <p className="d-flex align-items-center justify-content-between mb-2 text-dark">
                            <span>Round Off</span>
                            <span className="fw-semibold text-muted">
                              {totals.roundoffDiff > 0 ? `+${formatINR(totals.roundoffDiff)}` : `-${formatINR(Math.abs(totals.roundoffDiff))}`}
                            </span>
                          </p>
                        )}
                        <h5 className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top mb-0">
                          <span>Amount to be Paid</span>
                          <span className="fw-bold text-success">{formatINR(totals.grandTotal)}</span>
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                    className={`btn btn-sm ${selectedPaymentMode === m.id ? "btn-primary" : "btn-outline-secondary"
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
        className={`offcanvas offcanvas-end ${customerDrawerOpen ? "show" : ""}`}
        tabIndex={-1}
        id="add_order"
        style={{
          visibility: customerDrawerOpen ? "visible" : "hidden",
          transform: customerDrawerOpen ? "none" : "translateX(calc(100% + 40px))",
          transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 1065,
          width: "480px",
          maxWidth: "100vw",
          right: 0,
          left: "auto",
          top: 0,
          bottom: 0,
          height: "100vh",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.12)",
        }}
      >
        {/* Fixed Header */}
        <div className="offcanvas-header d-flex align-items-center justify-content-between flex-shrink-0 px-4 pt-4 pb-2">
          <h4 className="offcanvas-title mb-0 fw-bold" style={{ color: "#1e293b", fontSize: "20px" }}>Customers</h4>
          <button
            type="button"
            className="btn-close-modal"
            onClick={() => setCustomerDrawerOpen(false)}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#64748b",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <i className="ti ti-x fs-16" />
          </button>
        </div>

        {/* Fixed Tab Switcher */}
        <div className="orders-tab d-flex align-items-center px-4 pt-2 pb-3 flex-shrink-0">
          <ul className="nav nav-pills w-100 d-flex gap-2 align-items-center flex-nowrap mb-0 p-0">
            <li className="flex-fill">
              <button
                type="button"
                className={`nav-link w-100 border-0 ${
                  activeCustomerTab === "existing" ? "active" : ""
                } d-flex align-items-center justify-content-center`}
                onClick={() => setActiveCustomerTab("existing")}
                style={{
                  borderRadius: "9999px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: activeCustomerTab === "existing" ? "#0f172a" : "#f8fafc",
                  color: activeCustomerTab === "existing" ? "#ffffff" : "#475569",
                  border: activeCustomerTab === "existing" ? "none" : "1px solid #e2e8f0",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="ti ti-user me-2" />
                Existing Customer
              </button>
            </li>
            <li className="flex-fill">
              <button
                type="button"
                className={`nav-link w-100 border-0 ${
                  activeCustomerTab === "add_new" ? "active" : ""
                } d-flex align-items-center justify-content-center`}
                onClick={() => setActiveCustomerTab("add_new")}
                style={{
                  borderRadius: "9999px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: activeCustomerTab === "add_new" ? "#0f172a" : "#f8fafc",
                  color: activeCustomerTab === "add_new" ? "#ffffff" : "#475569",
                  border: activeCustomerTab === "add_new" ? "none" : "1px solid #e2e8f0",
                  transition: "all 0.2s ease",
                }}
              >
                <i className="ti ti-plus me-2" />
                Add New Customer
              </button>
            </li>
          </ul>
        </div>

        {/* Scrollable Body */}
        <div className="offcanvas-body flex-grow-1 overflow-y-auto px-4 py-2">
          {activeCustomerTab === "existing" ? (
            <div id="driversTab">
              <div className="mb-3">
                <div className="page-search position-relative">
                  <i className="ti ti-search fs-14 position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" />
                  <input
                    type="search"
                    className="form-control ps-5"
                    style={{
                      borderRadius: "9999px",
                      borderColor: "#e2e8f0",
                      fontSize: "13px",
                      paddingTop: "9px",
                      paddingBottom: "9px",
                    }}
                    placeholder="Search by name/Phone Number"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-muted position-absolute end-0 top-50 translate-middle-y p-0 pe-3"
                      onClick={() => setCustomerSearchQuery("")}
                      style={{ textDecoration: "none" }}
                    >
                      <i className="ti ti-x fs-14" />
                    </button>
                  )}
                </div>
              </div>

              <div className="customer-scroll-area d-flex flex-column gap-1">
                {filteredCustomerList.map((c, idx) => {
                  const isSelected = selectedCustomer?.value === c.value;
                  const isAvailable =
                    c.value === "walkin" ||
                    (c.status !== "inactive" &&
                      c.status !== "unavailable" &&
                      c.status !== "Inactive" &&
                      c.status !== "Unavailable");

                  return (
                    <div
                      key={c.value || idx}
                      className="customer-row-item d-flex align-items-center justify-content-between p-2 rounded-3"
                      style={{
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#f8fafc" : "transparent",
                      }}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setShowAlert(true);
                      }}
                    >
                      <div className="d-flex align-items-center gap-3 min-w-0 flex-grow-1">
                        {/* Radio selection indicator */}
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: isSelected ? "5px solid #00acc1" : "1.5px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            boxSizing: "border-box",
                            display: "inline-block",
                            flexShrink: 0,
                            transition: "all 0.15s ease",
                          }}
                        />

                        {/* Customer Avatar */}
                        {c.image_url ? (
                          <img
                            src={c.image_url}
                            alt={c.name || "Customer"}
                            className="rounded-circle"
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: 40,
                              height: 40,
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#94a3b8",
                              flexShrink: 0,
                            }}
                          >
                            <i className="ti ti-user fs-18" />
                          </div>
                        )}

                        {/* Name and Phone */}
                        <div className="min-w-0 flex-grow-1 text-truncate">
                          <h6
                            className="mb-0 text-truncate"
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#1e293b",
                              lineHeight: 1.25,
                            }}
                          >
                            {c.name || c.label}
                          </h6>
                          <p
                            className="mb-0 text-truncate text-muted"
                            style={{
                              fontSize: "12px",
                              lineHeight: 1.25,
                              marginTop: "3px",
                            }}
                          >
                            {c.phone || "No phone number"}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="ms-2 flex-shrink-0">
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: isAvailable ? "#16a34a" : "#dc2626",
                            backgroundColor: isAvailable ? "#f0fdf4" : "#fef2f2",
                            border: `1px solid ${isAvailable ? "#dcfce7" : "#fee2e2"}`,
                            borderRadius: "9999px",
                            padding: "3px 12px",
                            whiteSpace: "nowrap",
                            lineHeight: "18px",
                            display: "inline-block",
                          }}
                        >
                          {isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {filteredCustomerList.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    <i className="ti ti-user-x fs-32 mb-2 d-block" />
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

      {/* 4.5. Slide Animated Edit Product Drawer (#edit-product) */}
      <div
        className={`offcanvas offcanvas-end pos-edit-product-drawer ${editProductDrawerOpen ? "show" : ""}`}
        tabIndex={-1}
        id="edit_product_drawer"
        style={{
          visibility: editProductDrawerOpen ? "visible" : "hidden",
          transform: editProductDrawerOpen ? "none" : "translateX(calc(100% + 40px))",
          transition: "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 1065,
          width: "480px",
          maxWidth: "480px",
          minWidth: "unset",
          position: "fixed",
          right: 0,
          left: "auto",
          top: 0,
          bottom: 0,
          height: "100vh",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header */}
        <div className="offcanvas-header d-flex align-items-center justify-content-between flex-shrink-0 px-4 pt-4 pb-3 border-bottom">
          <div>
            <h4 className="offcanvas-title mb-1 fw-bold" style={{ color: "#1e293b", fontSize: "20px" }}>
              Edit Product
            </h4>
            <p className="mb-0 text-muted fs-12">
              Modify product rate, tax, discount & sale unit for this item
            </p>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={() => setEditProductDrawerOpen(false)}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#64748b",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <i className="ti ti-x fs-16" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="offcanvas-body flex-grow-1 overflow-y-auto px-4 py-3">
          <form id="edit-cart-product-form" onSubmit={handleSaveEditProduct}>
            <div className="row gx-3 gy-2">
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editProductName}
                    onChange={(e) => setEditProductName(e.target.value)}
                    placeholder="Enter Product Name"
                    required
                  />
                </div>
              </div>

              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Product Price <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-control border-start-0 ps-1"
                      value={editProductPrice}
                      onChange={(e) => setEditProductPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Tax Type <span className="text-danger">*</span>
                  </label>
                  <Select
                    className="select"
                    classNamePrefix="react-select"
                    options={[
                      { value: "Exclusive", label: "Exclusive" },
                      { value: "Inclusive", label: "Inclusive" },
                    ]}
                    value={editTaxType}
                    onChange={(opt: any) =>
                      setEditTaxType(opt || { value: "Exclusive", label: "Exclusive" })
                    }
                  />
                </div>
              </div>

              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Tax Rate (%) <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      className="form-control border-end-0"
                      value={editTaxRate}
                      onChange={(e) => setEditTaxRate(e.target.value)}
                      placeholder="0"
                    />
                    <span className="input-group-text bg-light text-muted border-start-0">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Discount Type <span className="text-danger">*</span>
                  </label>
                  <Select
                    className="select"
                    classNamePrefix="react-select"
                    options={[
                      { value: "Percentage", label: "Percentage (%)" },
                      { value: "Fixed", label: "Fixed Amount (₹)" },
                    ]}
                    value={editDiscountType}
                    onChange={(opt: any) =>
                      setEditDiscountType(
                        opt || { value: "Percentage", label: "Percentage (%)" }
                      )
                    }
                  />
                </div>
              </div>

              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Discount Value <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-control"
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="col-lg-6 col-12">
                <div className="mb-3">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Sale Unit <span className="text-danger">*</span>
                  </label>
                  <Select
                    className="select"
                    classNamePrefix="react-select"
                    options={[
                      { value: "Piece", label: "Piece (pc)" },
                      { value: "Kilogram", label: "Kilogram (kg)" },
                      { value: "Gram", label: "Gram (g)" },
                      { value: "Liter", label: "Liter (L)" },
                      { value: "Pack", label: "Pack" },
                      { value: "Box", label: "Box" },
                      { value: "Meter", label: "Meter (m)" },
                      { value: "Unit", label: "Unit" },
                    ]}
                    value={editSaleUnit}
                    onChange={(opt: any) =>
                      setEditSaleUnit(opt || { value: "Piece", label: "Piece (pc)" })
                    }
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="mb-2">
                  <label className="form-label fw-semibold fs-13 mb-1">
                    Notes / Instructions
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editItemNotes}
                    onChange={(e) => setEditItemNotes(e.target.value)}
                    placeholder="Special instructions or notes for this item..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="offcanvas-footer d-flex align-items-center gap-2 p-3 border-top flex-shrink-0 bg-white">
          <button
            type="button"
            className="btn btn-dark d-flex align-items-center justify-content-center w-100"
            onClick={() => {
              const form = document.getElementById("edit-cart-product-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
          >
            <i className="ti ti-check me-1" /> Update Item
          </button>
          <button
            type="button"
            className="btn btn-light d-flex align-items-center justify-content-center w-100"
            onClick={() => setEditProductDrawerOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>

      {editProductDrawerOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setEditProductDrawerOpen(false)}
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
      {/* 11. Add Item Note Modal */}
      {noteModalOpen && editingNoteItem && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setNoteModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card p-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 className="fw-bold mb-0">Add Note - {editingNoteItem.name}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setNoteModalOpen(false)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label fs-13 text-muted">Special instructions / custom note:</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Extra wrapping, specific batch, instructions..."
                value={editingNoteItem.notes}
                onChange={(e) =>
                  setEditingNoteItem({ ...editingNoteItem, notes: e.target.value })
                }
                autoFocus
              />
            </div>
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setNoteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setCart((prev) =>
                    prev.map((item) =>
                      item.product.id === editingNoteItem.id
                        ? { ...item, notes: editingNoteItem.notes }
                        : item
                    )
                  );
                  setNoteModalOpen(false);
                  setEditingNoteItem(null);
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 12. Dynamic Item Details / Size & Add-ons Modal (#items_details) */}
      {itemDetailsModalOpen && detailsCartItem && detailsSelectedSize && (
        <div
          className="pos-five-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setItemDetailsModalOpen(false);
          }}
        >
          <div className="pos-five-modal-card wide p-4 position-relative" style={{ maxWidth: "780px" }}>
            <button
              type="button"
              className="btn-close position-absolute top-0 end-0 m-3 z-1"
              onClick={() => setItemDetailsModalOpen(false)}
            />
            <div className="row g-4">
              {/* Left Column: Product Image & Info */}
              <div className="col-lg-5">
                <div className="items-img p-3 border rounded bg-light text-center h-100 d-flex flex-column align-items-center justify-content-center position-relative">
                  <img
                    src={detailsCartItem.product.image_url || placeholderPos}
                    alt={detailsCartItem.product.name}
                    className="img-fluid rounded"
                    style={{ maxHeight: "200px", objectFit: "contain" }}
                  />
                </div>
              </div>

              {/* Right Column: Title, Sizes, Add-ons & Total */}
              <div className="col-lg-7">
                <div className="items-content">
                  <h4 className="fw-bold mb-1">{detailsCartItem.product.name}</h4>
                  <p className="text-muted fs-13 mb-3">
                    View product specifications, select size, and review pricing &amp; inventory availability.
                  </p>

                  {/* Sizes Selection */}
                  <div className="items-info mb-3 pb-3 border-bottom">
                    <h6 className="fw-semibold mb-2 fs-13">Available Sizes</h6>
                    <div className="d-flex align-items-center flex-wrap gap-2 size-group">
                      {(() => {
                        const baseP = getProductPrice(detailsCartItem.product, salesType);
                        const sizes = [
                          { id: "size-sm", name: "Small (6-inch)", price: Math.max(10, Math.round(baseP * 0.75)) },
                          { id: "size-md", name: "Medium (8-inch)", price: baseP },
                          { id: "size-lg", name: "Large (12-inch)", price: Math.round(baseP * 1.35) },
                          { id: "size-xl", name: "Exotic Jumbo", price: Math.round(baseP * 1.75) },
                        ];
                        return sizes.map((sz) => {
                          const isSelected = detailsSelectedSize.id === sz.id;
                          return (
                            <div className={`size-tab ${isSelected ? "active" : ""}`} key={sz.id}>
                              <button
                                type="button"
                                className="tag d-flex align-items-center justify-content-between gap-2"
                                onClick={() => setDetailsSelectedSize(sz)}
                              >
                                <span>{sz.name}</span>
                                <span className="fw-bold">{formatINR(sz.price)}</span>
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Pricing & Stock Details (Replaced Add-ons & Upgrades) */}
                  <div className="mb-3 pb-3 border-bottom">
                    <h6 className="fw-semibold mb-2 fs-13">Pricing &amp; Inventory Details</h6>
                    <div className="row g-2">
                      {/* Retail Price */}
                      <div className="col-6">
                        <div className="p-2 border rounded bg-light d-flex align-items-center gap-2 h-100">
                          <div
                            className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-soft-primary text-primary flex-shrink-0"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <i className="ti ti-tag fs-16" />
                          </div>
                          <div>
                            <span className="fs-11 text-muted d-block lh-1 mb-1">Retail Price</span>
                            <span className="fs-13 fw-bold text-dark">
                              {formatINR(detailsCartItem.product.selling_price ?? detailsCartItem.product.price ?? 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wholesale Price */}
                      <div className="col-6">
                        <div className="p-2 border rounded bg-light d-flex align-items-center gap-2 h-100">
                          <div
                            className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-soft-success text-success flex-shrink-0"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <i className="ti ti-building-store fs-16" />
                          </div>
                          <div>
                            <span className="fs-11 text-muted d-block lh-1 mb-1">Wholesale Price</span>
                            <span className="fs-13 fw-bold text-dark">
                              {formatINR(
                                detailsCartItem.product.wholesale_price ??
                                  (detailsCartItem.product.cost_price
                                    ? Math.round(Number(detailsCartItem.product.cost_price) * 1.25)
                                    : Math.round(Number(detailsCartItem.product.selling_price ?? detailsCartItem.product.price ?? 0) * 0.75))
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Showroom Stock */}
                      <div className="col-6">
                        <div className="p-2 border rounded bg-light d-flex align-items-center gap-2 h-100">
                          <div
                            className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-soft-info text-info flex-shrink-0"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <i className="ti ti-building fs-16" />
                          </div>
                          <div>
                            <span className="fs-11 text-muted d-block lh-1 mb-1">Showroom Stock</span>
                            <span className="fs-13 fw-bold text-dark">
                              {detailsCartItem.product.shop_stock ?? detailsCartItem.product.stock_quantity ?? detailsCartItem.product.stock ?? 0}{" "}
                              <small className="text-muted fs-11">
                                {detailsCartItem.product.unit && detailsCartItem.product.unit !== "PCS" ? detailsCartItem.product.unit : "Units"}
                              </small>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Warehouse Stock */}
                      <div className="col-6">
                        <div className="p-2 border rounded bg-light d-flex align-items-center gap-2 h-100">
                          <div
                            className="rounded-circle p-1 d-flex align-items-center justify-content-center bg-soft-warning text-warning flex-shrink-0"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <i className="ti ti-building-warehouse fs-16" />
                          </div>
                          <div>
                            <span className="fs-11 text-muted d-block lh-1 mb-1">Warehouse Stock</span>
                            <span className="fs-13 fw-bold text-dark">
                              {detailsCartItem.product.warehouse_stock ?? detailsCartItem.product.stock_quantity ?? detailsCartItem.product.stock ?? 0}{" "}
                              <small className="text-muted fs-11">
                                {detailsCartItem.product.unit && detailsCartItem.product.unit !== "PCS" ? detailsCartItem.product.unit : "Units"}
                              </small>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total & Action Button */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="fs-13 text-muted">Item Total</span>
                      <h4 className="fw-bold text-success mb-0">
                        {formatINR(detailsSelectedSize.price * detailsQuantity)}
                      </h4>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      <div className="qty-item m-0">
                        <PosCounter
                          value={detailsQuantity}
                          onIncrement={() => setDetailsQuantity((prev) => prev + 1)}
                          onDecrement={() => setDetailsQuantity((prev) => Math.max(1, prev - 1))}
                          onChange={(val) => setDetailsQuantity(Math.max(1, val))}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary flex-fill d-flex align-items-center justify-content-center gap-2"
                        onClick={() => {
                          if (!detailsCartItem || !detailsSelectedSize) return;
                          const baseUnitPrice = detailsSelectedSize.price;
                          const taxRate = Number(detailsCartItem.product.tax_rate) || 5;
                          const lineSubtotal = baseUnitPrice * detailsQuantity;
                          const lineTax = (lineSubtotal * taxRate) / 100;

                          const updatedItem: CartItem = {
                            ...detailsCartItem,
                            quantity: detailsQuantity,
                            unit_price: baseUnitPrice,
                            tax_amount: lineTax,
                            total_amount: lineSubtotal + lineTax,
                            selectedSize: detailsSelectedSize,
                          };

                          setCart((prev) => {
                            const exists = prev.some((c) => c.product.id === detailsCartItem.product.id);
                            if (exists) {
                              return prev.map((c) => (c.product.id === detailsCartItem.product.id ? updatedItem : c));
                            } else {
                              return [...prev, updatedItem];
                            }
                          });

                          setItemDetailsModalOpen(false);
                          setDetailsCartItem(null);
                        }}
                      >
                        <i className="ti ti-shopping-bag" />
                        {cart.some((c) => c.product.id === detailsCartItem.product.id) ? "Update Cart" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
