import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { usePosSync } from '../context/PosSyncContext';
import { useInventoryModules } from '../context/InventoryModulesContext';
import { api } from '../services/api';
import { posQueueService } from '../services/posQueue';
import { barcodeService } from '../services/barcodeService';
import { printService } from '../services/printService';
import type { Product, POSCartItem, Customer, HeldBill, Invoice, Project } from '../types';
import { BarcodeScannerModal } from '../components/pos/BarcodeScannerModal';
import { PosHoldBills } from '../components/pos/PosHoldBills';
import { CustomerCreateModal } from '../components/pos/CustomerCreateModal';
import { A4InvoiceView } from '../components/print/A4InvoiceView';
import { Receipt80mmView } from '../components/print/Receipt80mmView';
import confetti from 'canvas-confetti';
import {
  Search,
  Camera,
  Plus,
  Minus,
  Trash2,
  Clock,
  CheckCircle,
  Printer,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  User,
  ShoppingBag,
  RefreshCw,
  X,
  Zap,
  Leaf,
  Layers,
  Sparkles,
  HandCoins,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Phone,
  UserCheck,
  FlaskConical,
  Flower2,
  Trees,
  FolderKanban,
  Building,
  ChevronDown,
  Check,
  ArrowLeftRight,
  Store,
  Boxes,
  ScanLine,
  UserPlus,
  Scan,
  Tag,
} from 'lucide-react';
import { CactusIcon, PlanterIcon, getCategoryIcon, renderModuleIcon } from '../components/common/CategoryIcons';

export const POS: React.FC = () => {
  const { businessId, business, activeBusiness, isTaxable } = useBusiness();
  const { user } = useAuth();
  const { modules } = useInventoryModules();
  const { queueOfflineSale, isOnline } = usePosSync();

  // Products and Categories
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Registered Customers Lookup
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState<boolean>(false);
  const [newCustomerInitialName, setNewCustomerInitialName] = useState<string>('');

  // Client Projects State & Tabs
  const [customerTab, setCustomerTab] = useState<'customer' | 'project'>('customer');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Close project dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [defaultStockSource, setDefaultStockSource] = useState<'shop' | 'inventory'>('shop');
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: string;
    name: string;
    phone: string;
    gstin?: string;
    credit_limit?: number;
    total_spent?: number;
    customer_type?: string;
  }>({
    name: 'Walk in Customer',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit' | 'split'>('cash');
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitUpi, setSplitUpi] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Modals & Drawers
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isHoldDrawerOpen, setIsHoldDrawerOpen] = useState<boolean>(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [printModalMode, setPrintModalMode] = useState<'receipt' | 'a4' | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [openSizeDropdownKey, setOpenSizeDropdownKey] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const checkScrollBounds = useCallback(() => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    checkScrollBounds();
    el.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);
    return () => {
      el.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [checkScrollBounds, products, modules]);

  const handleCategoryScroll = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return;
    const container = categoryScrollRef.current;
    const firstPill = container.querySelector<HTMLElement>('.category-pill');
    const cardStep = firstPill ? firstPill.offsetWidth + 10 : 160;

    if (direction === 'right') {
      container.scrollBy({ left: cardStep, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: -cardStep, behavior: 'smooth' });
    }
    setTimeout(checkScrollBounds, 350);
  };

  // Filter projects by search query
  const filteredProjects = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.client_name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.company && p.company.toLowerCase().includes(projectSearchQuery.toLowerCase()))
  );

  // Load products (online-first, fallback to IndexedDB cache when offline)
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        const data = await api.get('/products', { business_id: businessId });
        setProducts(data);
        setFilteredProducts(data);
        await posQueueService.cacheProducts(data);
      } else {
        const cached = await posQueueService.getCachedProducts(businessId);
        setProducts(cached);
        setFilteredProducts(cached);
      }
    } catch {
      const cached = await posQueueService.getCachedProducts(businessId);
      setProducts(cached);
      setFilteredProducts(cached);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  // Load held bills
  const loadHeldBills = useCallback(async () => {
    try {
      const bills = await posQueueService.getHeldBills(businessId);
      setHeldBills(bills);
    } catch {
      // ignore
    }
  }, [businessId]);

  useEffect(() => {
    loadProducts();
    loadHeldBills();
    api.get('/customers').then((data) => setAllCustomers(data || [])).catch(() => {});
    api.get('/projects', { business_id: businessId }).then((data) => setAllProjects(data || [])).catch(() => {});
    setCart([]);
    setDiscountAmount(0);
    setCompletedInvoice(null);
    setCustomerTab('customer');
    setSelectedProjectId('');
    setSelectedProject(null);
    setProjectSearchQuery('');
    setIsProjectDropdownOpen(false);
  }, [businessId, loadProducts, loadHeldBills]);

  // Dynamic Customer Search Filtering
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return allCustomers.slice(0, 25);
    const q = customerSearchQuery.toLowerCase();
    return allCustomers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.gstin && c.gstin.toLowerCase().includes(q))
      )
      .slice(0, 25);
  }, [allCustomers, customerSearchQuery]);

  // Handle successful customer creation from modal
  const handleCustomerCreated = (newCust: Customer) => {
    setAllCustomers((prev) => [newCust, ...prev]);
    setSelectedCustomer({
      id: newCust.id,
      name: newCust.name,
      phone: newCust.phone || '',
      gstin: newCust.gstin || '',
      credit_limit: newCust.credit_limit || 0,
      total_spent: newCust.total_spent || 0,
      customer_type: newCust.customer_type || 'customer',
    });
    setShowCustomerDropdown(false);
    setCustomerSearchQuery('');
  };

  // Filter products by category and search
  useEffect(() => {
    let result = products;

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.type === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(result);
  }, [products, selectedCategory, searchQuery]);

  // Category counts (strictly dynamic per business modules)
  const categoryCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const m of modules) {
      counts[m.slug] = 0;
    }
    for (const p of products) {
      if (counts[p.type] !== undefined) {
        counts[p.type]++;
      } else {
        counts[p.type] = (counts[p.type] || 0) + 1;
      }
    }
    return counts;
  }, [products, modules]);

  // --- Plant Size & Pricing Helper Functions ---
  const getProductSizes = (product: Product): string[] => {
    const attr = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {});
    if (attr.sizes && Array.isArray(attr.sizes) && attr.sizes.length > 0) {
      return attr.sizes;
    }
    if (attr.size_pricing && typeof attr.size_pricing === 'object') {
      return Object.keys(attr.size_pricing);
    }
    if (attr.size_prices && typeof attr.size_prices === 'object') {
      return Object.keys(attr.size_prices);
    }
    return [];
  };

  const getProductSizePrice = (product: Product, size: string): number => {
    const attr = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {});
    if (attr.size_pricing && attr.size_pricing[size] !== undefined) {
      const p = attr.size_pricing[size];
      return Number(typeof p === 'object' ? p.sale_price : p) || Number(product.sale_price) || 0;
    }
    if (attr.size_prices && attr.size_prices[size] !== undefined) {
      return Number(attr.size_prices[size]) || Number(product.sale_price) || 0;
    }
    return Number(product.sale_price) || 0;
  };

  const getProductLeastPrice = (product: Product): { price: number; defaultSize?: string; availableSizes: string[] } => {
    const sizes = getProductSizes(product);
    if (sizes.length === 0) {
      return { price: Number(product.sale_price) || 0, availableSizes: [] };
    }
    let minPrice = Infinity;
    let minSize = sizes[0];
    for (const sz of sizes) {
      const pr = getProductSizePrice(product, sz);
      if (pr < minPrice) {
        minPrice = pr;
        minSize = sz;
      }
    }
    return {
      price: minPrice !== Infinity ? minPrice : Number(product.sale_price) || 0,
      defaultSize: minSize,
      availableSizes: sizes,
    };
  };

  // Helper to safely extract discount parameters and attributes from product
  const getProductDiscountInfo = (p: Product) => {
    let attr: any = {};
    if (typeof p.attributes === 'string') {
      try {
        attr = JSON.parse(p.attributes);
      } catch (e) {
        attr = {};
      }
    } else if (p.attributes && typeof p.attributes === 'object') {
      attr = p.attributes;
    }
    const discPieces = Number(p.discount_pieces !== undefined && p.discount_pieces !== null ? p.discount_pieces : attr.discount_pieces) || 0;
    const discPercent = Number(p.discount_percent !== undefined && p.discount_percent !== null ? p.discount_percent : attr.discount_percent) || 0;
    return { discPieces, discPercent, attr };
  };

  // Add product to cart (Supports Shop Counter vs Main Inventory selection and Size variants)
  const addToCart = (product: Product, forcedSource?: 'shop' | 'inventory', forcedSize?: string) => {
    const shopStock = Number(product.shop_stock !== undefined ? product.shop_stock : product.stock_quantity) || 0;
    const warehouseStock = Number(product.warehouse_stock) || 0;

    // Pick source: forcedSource > defaultStockSource
    const chosenSource: 'shop' | 'inventory' = forcedSource || defaultStockSource;
    const availableStock = chosenSource === 'shop' ? shopStock : warehouseStock;

    if (availableStock <= 0) return;

    const { price: leastPrice, defaultSize, availableSizes } = getProductLeastPrice(product);
    const chosenSize = forcedSize || defaultSize;
    const chosenPrice = chosenSize ? getProductSizePrice(product, chosenSize) : Number(product.sale_price);

    const { discPieces, discPercent, attr } = getProductDiscountInfo(product);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          item.product_id === product.id &&
          (item.stock_source || 'shop') === chosenSource &&
          (item.size || '') === (chosenSize || '')
      );
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        if (item.quantity >= availableStock) {
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...item,
          quantity: item.quantity + 1,
          discount_pieces: discPieces,
          discount_percent: discPercent,
        };
        return updated;
      } else {
        return [
          {
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            hsn_code: product.hsn_code || (isTaxable ? '0602' : ''),
            quantity: 1,
            unit_price: chosenPrice,
            discount: 0,
            gst_rate: isTaxable ? Number(product.gst_rate || 0) : 0,
            stock_quantity: availableStock,
            stock_source: chosenSource,
            shop_stock: shopStock,
            warehouse_stock: warehouseStock,
            discount_pieces: discPieces,
            discount_percent: discPercent,
            size: chosenSize,
            available_sizes: availableSizes,
            size_pricing: attr.size_pricing,
          },
          ...prevCart,
        ];
      }
    });
  };

  // Switch cart item size from Order List
  const changeCartItemSize = (
    productId: string,
    currentSource: 'shop' | 'inventory',
    oldSize: string | undefined,
    newSize: string
  ) => {
    setCart((prev) => {
      const itemIndex = prev.findIndex(
        (it) =>
          it.product_id === productId &&
          (it.stock_source || 'shop') === currentSource &&
          (it.size || '') === (oldSize || '')
      );
      if (itemIndex === -1) return prev;

      const currentItem = prev[itemIndex];
      const matchedProduct = products.find((p) => p.id === productId);
      const newUnitPrice = matchedProduct ? getProductSizePrice(matchedProduct, newSize) : currentItem.unit_price;

      // Check if target item with newSize already exists
      const existingTargetIndex = prev.findIndex(
        (it, idx) =>
          idx !== itemIndex &&
          it.product_id === productId &&
          (it.stock_source || 'shop') === currentSource &&
          it.size === newSize
      );

      if (existingTargetIndex > -1) {
        // Merge into target
        const targetItem = prev[existingTargetIndex];
        const mergedQty = Math.min(targetItem.quantity + currentItem.quantity, targetItem.stock_quantity);
        const updated = prev.filter((_, idx) => idx !== itemIndex);
        const newTargetIdx = updated.findIndex(
          (it) =>
            it.product_id === productId &&
            (it.stock_source || 'shop') === currentSource &&
            it.size === newSize
        );
        updated[newTargetIdx] = {
          ...targetItem,
          quantity: mergedQty,
          unit_price: newUnitPrice,
        };
        return updated;
      } else {
        const updated = [...prev];
        updated[itemIndex] = {
          ...currentItem,
          size: newSize,
          unit_price: newUnitPrice,
        };
        return updated;
      }
    });
  };

  // Switch cart item source between Shop and Inventory
  const switchCartItemSource = (productId: string, currentSource: 'shop' | 'inventory', targetSource: 'shop' | 'inventory', size?: string) => {
    if (currentSource === targetSource) return;

    setCart((prev) => {
      const itemIndex = prev.findIndex(
        (it) =>
          it.product_id === productId &&
          (it.stock_source || 'shop') === currentSource &&
          (it.size || '') === (size || '')
      );
      if (itemIndex === -1) return prev;

      const item = prev[itemIndex];
      const targetAvailStock = targetSource === 'shop' ? (item.shop_stock || 0) : (item.warehouse_stock || 0);

      if (targetAvailStock <= 0) {
        alert(`Cannot switch to ${targetSource === 'shop' ? 'Shop' : 'Inventory'}: 0 units available.`);
        return prev;
      }

      // Check if an item already exists with targetSource & size
      const existingTargetIndex = prev.findIndex(
        (it, idx) =>
          idx !== itemIndex &&
          it.product_id === productId &&
          (it.stock_source || 'shop') === targetSource &&
          (it.size || '') === (size || '')
      );

      if (existingTargetIndex > -1) {
        // Merge into existing target item
        const existingTarget = prev[existingTargetIndex];
        const newMergedQty = Math.min(existingTarget.quantity + item.quantity, targetAvailStock);
        const updated = prev.filter((_, idx) => idx !== itemIndex);
        const targetNewIndex = updated.findIndex(
          (it) =>
            it.product_id === productId &&
            (it.stock_source || 'shop') === targetSource &&
            (it.size || '') === (size || '')
        );
        updated[targetNewIndex] = {
          ...existingTarget,
          quantity: newMergedQty,
          stock_quantity: targetAvailStock,
        };
        return updated;
      } else {
        // Update source on this item
        const updated = [...prev];
        updated[itemIndex] = {
          ...item,
          stock_source: targetSource,
          stock_quantity: targetAvailStock,
          quantity: Math.min(item.quantity, targetAvailStock),
        };
        return updated;
      }
    });
  };

  // Update item quantity (respects specific stock_source & size)
  const updateQuantity = (productId: string, delta: number, source: 'shop' | 'inventory' = 'shop', size?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.product_id === productId &&
            (item.stock_source || 'shop') === source &&
            (item.size || '') === (size || '')
          ) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stock_quantity) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  // Remove item from cart (respects specific stock_source & size)
  const removeFromCart = (productId: string, source: 'shop' | 'inventory' = 'shop', size?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product_id === productId &&
            (item.stock_source || 'shop') === source &&
            (item.size || '') === (size || '')
          )
      )
    );
  };

  const decrementCardQuantity = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const chosenSource = defaultStockSource;
    const { defaultSize } = getProductLeastPrice(product);
    const cartItem = cart.find(
      (i) =>
        i.product_id === product.id &&
        (i.stock_source || 'shop') === chosenSource &&
        (i.size || '') === (defaultSize || '')
    );
    if (!cartItem) {
      const anyCartItem = [...cart].reverse().find(
        (i) => i.product_id === product.id && (i.stock_source || 'shop') === chosenSource
      );
      if (anyCartItem) {
        updateQuantity(product.id, -1, chosenSource, anyCartItem.size);
      }
      return;
    }
    updateQuantity(product.id, -1, chosenSource, defaultSize);
  };

  const handleProductCardClick = (product: Product) => {
    const shopStock = Number(product.shop_stock !== undefined ? product.shop_stock : product.stock_quantity) || 0;
    const warehouseStock = Number(product.warehouse_stock) || 0;
    const activeStock = defaultStockSource === 'shop' ? shopStock : warehouseStock;
    if (activeStock <= 0) return;

    addToCart(product, defaultStockSource);
  };

  const incrementCardQuantity = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const shopStock = Number(product.shop_stock !== undefined ? product.shop_stock : product.stock_quantity) || 0;
    const warehouseStock = Number(product.warehouse_stock) || 0;
    const activeStock = defaultStockSource === 'shop' ? shopStock : warehouseStock;
    if (activeStock <= 0) return;

    addToCart(product, defaultStockSource);
  };

  // Hardware USB Barcode Scanner listener
  useEffect(() => {
    const removeListener = barcodeService.attachScannerListener((barcode) => {
      const matched = products.find(
        (p) => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase()
      );
      if (matched) {
        addToCart(matched);
      }
    });

    return removeListener;
  }, [products]);

  // Discount calculation per item (supports direct product discount or tiered volume discount based on discount_pieces)
  const getItemDiscount = (item: POSCartItem) => {
    const minPieces = item.discount_pieces && item.discount_pieces > 0 ? item.discount_pieces : 1;
    if (
      item.discount_percent &&
      item.discount_percent > 0 &&
      item.quantity >= minPieces
    ) {
      return Number(((item.quantity * item.unit_price * item.discount_percent) / 100).toFixed(2));
    }
    return Number((item.discount || 0).toFixed(2));
  };

  const autoDiscountTotal = Number(cart.reduce((acc, item) => acc + getItemDiscount(item), 0).toFixed(2));

  // Identify qualifying products for discount
  const qualifyingItems = cart.filter((item) => {
    const minPieces = item.discount_pieces && item.discount_pieces > 0 ? item.discount_pieces : 1;
    return (
      item.discount_percent &&
      item.discount_percent > 0 &&
      item.quantity >= minPieces
    );
  });

  let discountBadgeLabel = '';
  if (qualifyingItems.length === 1) {
    discountBadgeLabel = `${qualifyingItems[0].discount_percent}%`;
  } else if (qualifyingItems.length > 1) {
    const rawSubtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const avgPct = rawSubtotal > 0 ? (autoDiscountTotal / rawSubtotal) * 100 : 0;
    discountBadgeLabel = `${avgPct.toFixed(0)}%`;
  }

  // Combined discount: auto volume discount + manual discount
  const totalDiscount = Number((autoDiscountTotal + Number(discountAmount || 0)).toFixed(2));

  // Calculations
  const rawSubtotal = cart.reduce((acc, i) => acc + i.quantity * i.unit_price, 0);
  const subtotal = rawSubtotal;

  const taxAmount = isTaxable
    ? cart.reduce((acc, i) => {
      const itemDisc = getItemDiscount(i);
      const lineSubtotal = Math.max(0, i.quantity * i.unit_price - itemDisc);
      return acc + (lineSubtotal * i.gst_rate) / 100;
    }, 0)
    : 0;

  const cgstAmount = isTaxable ? Number((taxAmount / 2).toFixed(2)) : 0;
  const sgstAmount = isTaxable ? Number((taxAmount / 2).toFixed(2)) : 0;
  const grandTotal = Math.max(0, Number((subtotal - totalDiscount + taxAmount).toFixed(2)));

  // Split payment helper calculations and actions
  const splitCashNum = Number(splitCash) || 0;
  const splitUpiNum = Number(splitUpi) || 0;
  const splitTotalAllocated = Number((splitCashNum + splitUpiNum).toFixed(2));
  const splitDiff = Number((grandTotal - splitTotalAllocated).toFixed(2));
  const isSplitBalanced = grandTotal > 0 && Math.abs(splitDiff) < 0.01;
  const isSplitShort = grandTotal > 0 && splitDiff > 0.01;
  const isSplitExceeded = grandTotal > 0 && splitDiff < -0.01;

  const handleSelectSplit = () => {
    setPaymentMethod('split');
    if (grandTotal > 0) {
      const half = Math.floor((grandTotal / 2) * 100) / 100;
      const remainder = Number((grandTotal - half).toFixed(2));
      setSplitCash(half > 0 ? half.toString() : '');
      setSplitUpi(remainder > 0 ? remainder.toString() : '');
    }
  };

  const handleSetSplit5050 = () => {
    const half = Math.floor((grandTotal / 2) * 100) / 100;
    const remainder = Number((grandTotal - half).toFixed(2));
    setSplitCash(half > 0 ? half.toString() : '0');
    setSplitUpi(remainder > 0 ? remainder.toString() : '0');
  };

  const handleBalanceToUpi = () => {
    const c = Number(splitCash) || 0;
    const rem = Math.max(0, Number((grandTotal - c).toFixed(2)));
    setSplitUpi(rem.toString());
  };

  const handleBalanceToCash = () => {
    const u = Number(splitUpi) || 0;
    const rem = Math.max(0, Number((grandTotal - u).toFixed(2)));
    setSplitCash(rem.toString());
  };

  // Hold Bill
  const handleHoldBill = async () => {
    if (cart.length === 0) return;

    const mappedCustomerName = customerTab === 'project' && selectedProject
      ? (selectedProject.client_name ? `${selectedProject.client_name} (${selectedProject.name})` : selectedProject.name)
      : selectedCustomer.name;

    const holdBill: HeldBill = {
      id: `hold-${Date.now()}`,
      hold_number: `HOLD-${100 + heldBills.length + 1}`,
      business_id: businessId,
      customer_name: mappedCustomerName,
      customer_phone: selectedCustomer.phone,
      project_id: customerTab === 'project' ? selectedProjectId : undefined,
      project_name: customerTab === 'project' ? selectedProject?.name : undefined,
      customer_tab: customerTab,
      items: cart,
      discount_amount: totalDiscount,
      saved_at: new Date().toISOString(),
    };

    await posQueueService.holdBill(holdBill);
    await loadHeldBills();
    setCart([]);
    setDiscountAmount(0);
  };

  // Resume Held Bill
  const handleResumeBill = (bill: HeldBill) => {
    setCart(bill.items);
    setDiscountAmount(bill.discount_amount);
    setSelectedCustomer({
      name: bill.customer_name,
      phone: bill.customer_phone,
    });
    if (bill.project_id || bill.customer_tab === 'project') {
      setCustomerTab('project');
      const pId = bill.project_id || '';
      setSelectedProjectId(pId);
      const matched = allProjects.find((p) => p.id === pId);
      if (matched) setSelectedProject(matched);
    } else {
      setCustomerTab('customer');
      setSelectedProjectId('');
      setSelectedProject(null);
    }
    posQueueService.deleteHeldBill(bill.id).then(loadHeldBills);
  };

  // Complete Checkout (Online or Offline Queue)
  const handleCheckout = async (methodOverride?: 'cash' | 'upi' | 'card' | 'credit' | 'split') => {
    if (cart.length === 0 || isProcessingCheckout) return;

    if (customerTab === 'project' && !selectedProjectId) {
      alert('Please select a client project from the dropdown before completing checkout.');
      return;
    }

    const method = methodOverride || paymentMethod;

    let splitCashAmount: number | undefined = undefined;
    let splitUpiAmount: number | undefined = undefined;

    if (method === 'split') {
      const cNum = Number(splitCash) || 0;
      const uNum = Number(splitUpi) || 0;
      const allocated = Number((cNum + uNum).toFixed(2));
      if (Math.abs(allocated - grandTotal) > 0.05) {
        alert(
          `Split payment amounts must sum up to the Grand Total (₹${grandTotal.toFixed(2)}).\n` +
          `Currently entered: Cash ₹${cNum.toFixed(2)} + UPI ₹${uNum.toFixed(2)} = ₹${allocated.toFixed(2)} ` +
          `(${allocated < grandTotal ? `₹${(grandTotal - allocated).toFixed(2)} remaining` : `₹${(allocated - grandTotal).toFixed(2)} extra`})`
        );
        return;
      }
      splitCashAmount = cNum;
      splitUpiAmount = uNum;
    }

    setIsProcessingCheckout(true);

    const mappedCustomerName = customerTab === 'project' && selectedProject
      ? (selectedProject.client_name ? `${selectedProject.client_name} (${selectedProject.name})` : selectedProject.name)
      : (selectedCustomer.name || 'Walk-in Customer');

    const mappedPhone = customerTab === 'project' && selectedProject
      ? (selectedCustomer.phone || selectedProject.supervisor_phone || '')
      : (selectedCustomer.phone || '');

    const effectiveProjectId = customerTab === 'project' ? (selectedProjectId || null) : null;

    const payload = {
      business_id: businessId,
      customer_id: customerTab === 'customer' ? selectedCustomer.id : undefined,
      customer_name: mappedCustomerName,
      customer_phone: mappedPhone,
      project_id: effectiveProjectId,
      items: cart.map((i) => {
        const itemDisc = getItemDiscount(i);
        return {
          product_id: i.product_id,
          product_name: i.size ? `${i.product_name} (${i.size})` : i.product_name,
          sku: i.sku,
          hsn_code: i.hsn_code,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: itemDisc,
          gst_rate: i.gst_rate,
          stock_source: i.stock_source || 'shop',
          size: i.size,
        };
      }),
      discount_amount: totalDiscount,
      payment_method: method,
      split_cash_amount: method === 'split' ? splitCashAmount : undefined,
      split_upi_amount: method === 'split' ? splitUpiAmount : undefined,
      notes: notes || (customerTab === 'project' && selectedProject ? `POS Bill mapped to Project: ${selectedProject.name}` : ''),
      created_by: user?.id,
    };

    try {
      if (navigator.onLine) {
        const res = await api.post('/pos/checkout', payload);
        if (res.success && res.invoice) {
          setCompletedInvoice(res.invoice);
          setPrintModalMode('receipt');
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        }
      } else {
        // OFFLINE MODE: Queue in IndexedDB
        const prefix = (activeBusiness?.invoice_prefix || 'INV-').replace(/[^a-zA-Z0-9]/g, '');
        const offlineInvNumber = `${prefix}-OFF-${Date.now().toString().slice(-4)}`;
        const offlineInvoice: any = {
          id: `off-inv-${Date.now()}`,
          business_id: businessId,
          invoice_number: offlineInvNumber,
          customer_name: mappedCustomerName,
          customer_phone: mappedPhone,
          project_id: effectiveProjectId,
          project_name: selectedProject?.name,
          subtotal,
          discount_amount: totalDiscount,
          tax_amount: taxAmount,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          total_amount: grandTotal,
          payment_method: method,
          split_cash_amount: method === 'split' ? splitCashAmount : undefined,
          split_upi_amount: method === 'split' ? splitUpiAmount : undefined,
          notes: notes || (customerTab === 'project' && selectedProject ? `POS Bill mapped to Project: ${selectedProject.name}` : 'Offline Queued Bill'),
          created_by: user?.id,
          created_at: new Date().toISOString(),
          items: cart.map((i) => {
            const itemDisc = getItemDiscount(i);
            return {
              ...i,
              discount: itemDisc,
              total: (i.quantity * i.unit_price - itemDisc) * (1 + i.gst_rate / 100),
            };
          }),
        };

        await queueOfflineSale(offlineInvoice);
        setCompletedInvoice(offlineInvoice);
        setPrintModalMode('receipt');
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      }

      // Reset cart
      setCart([]);
      setDiscountAmount(0);
      setNotes('');
      setSplitCash('');
      setSplitUpi('');
      loadProducts();
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setPaymentMethod('cash');
        if (cart.length > 0) handleCheckout('cash');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setPaymentMethod('upi');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMethod('card');
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleSelectSplit();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) handleHoldBill();
      } else if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentMethod, searchQuery, grandTotal, splitCash, splitUpi]);

  return (
    <div className="pos-page-root">
      <div className="pos-container">
        {/* Left Column: Product Grid & Search */}
        <div className="pos-catalog">
          <div className="pos-catalog-header">
            <div className="pos-search-row">
              <div className="pos-search-box">
                <Search size={18} className="search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="pos-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scan barcode, SKU, or search nursery item..."
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="pos-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Default Stock Source Switcher (Shop vs Inventory) */}
              <div className="pos-source-toggle-wrap" title="Default stock pool when adding products">
                <span className="pos-source-label">Default Stock:</span>
                <div className="pos-source-toggle">
                  <button
                    type="button"
                    className={`pos-source-btn ${defaultStockSource === 'shop' ? 'active shop' : ''}`}
                    onClick={() => setDefaultStockSource('shop')}
                  >
                    <Store size={13} strokeWidth={2.2} />
                    <span>Shop</span>
                  </button>
                  <button
                    type="button"
                    className={`pos-source-btn ${defaultStockSource === 'inventory' ? 'active inv' : ''}`}
                    onClick={() => setDefaultStockSource('inventory')}
                  >
                    <Boxes size={13} strokeWidth={2.2} />
                    <span>Inventory</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-icon-only"
                onClick={() => setIsScannerOpen(true)}
                title="Open Camera Barcode / QR Scanner"
                style={{ height: '44px', width: '44px', borderRadius: 'var(--radius-lg)' }}
              >
                <Camera size={18} />
              </button>
            </div>

            {/* Categories Section with Header & Smooth Navigation Arrows */}
            <div className="pos-categories-section">
              <div className="pos-categories-header">
                <h2 className="pos-categories-title">Categories</h2>
                <div className="pos-category-nav-arrows">
                  <button
                    type="button"
                    className={`pos-nav-arrow-btn ${!canScrollLeft ? 'disabled' : ''}`}
                    onClick={() => handleCategoryScroll('left')}
                    disabled={!canScrollLeft}
                    title="Scroll categories left"
                    aria-label="Previous categories"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className={`pos-nav-arrow-btn ${!canScrollRight ? 'disabled' : ''}`}
                    onClick={() => handleCategoryScroll('right')}
                    disabled={!canScrollRight}
                    title="Scroll categories right"
                    aria-label="Next categories"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Category Filter Pills (Scrollable with Scroll Snap) */}
              <div className="pos-category-pills" ref={categoryScrollRef}>
                <button
                  type="button"
                  className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <span className="pill-name">All</span>
                  <span className="pill-count">{categoryCounts.all || 0}</span>
                </button>

                {modules && modules.length > 0 ? (
                  modules.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`category-pill ${selectedCategory === m.slug ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(m.slug)}
                    >
                      <span className="pill-name">{m.name}</span>
                      <span className="pill-count">{categoryCounts[m.slug] || 0}</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      type="button"
                      className={`category-pill ${selectedCategory === 'plants' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('plants')}
                    >
                      <span className="pill-name">Plants & Trees</span>
                      <span className="pill-count">{categoryCounts.plants || 0}</span>
                    </button>
                    <button
                      type="button"
                      className={`category-pill ${selectedCategory === 'cactus' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('cactus')}
                    >
                      <span className="pill-name">Cactus</span>
                      <span className="pill-count">{categoryCounts.cactus || 0}</span>
                    </button>
                    <button
                      type="button"
                      className={`category-pill ${selectedCategory === 'pots' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('pots')}
                    >
                      <span className="pill-name">Pots & Planters</span>
                      <span className="pill-count">{categoryCounts.pots || 0}</span>
                    </button>
                    <button
                      type="button"
                      className={`category-pill ${selectedCategory === 'fertilizers' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('fertilizers')}
                    >
                      <span className="pill-name">Fertilizers & Care</span>
                      <span className="pill-count">{categoryCounts.fertilizers || 0}</span>
                    </button>
                    <button
                      type="button"
                      className={`category-pill ${selectedCategory === 'flowers' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('flowers')}
                    >
                      <span className="pill-name">Flowers & Decor</span>
                      <span className="pill-count">{categoryCounts.flowers || 0}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="pos-product-grid">
            {isLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#16a34a' }} />
                <div style={{ fontWeight: 600 }}>Loading botanical catalog...</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
                <Leaf size={32} style={{ margin: '0 auto 10px auto', opacity: 0.35 }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>No products match your search</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Try searching by different name, category, or SKU.</div>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const shopStock = Number(p.shop_stock !== undefined ? p.shop_stock : p.stock_quantity) || 0;
                const warehouseStock = Number(p.warehouse_stock) || 0;
                const activeStock = defaultStockSource === 'shop' ? shopStock : warehouseStock;
                const isOutOfStock = activeStock <= 0;
                const totalInCart = cart
                  .filter((it) => it.product_id === p.id && (it.stock_source || 'shop') === defaultStockSource)
                  .reduce((sum, it) => sum + it.quantity, 0);
                const isLowStock = !isOutOfStock && activeStock <= (p.low_stock_threshold || 10);
                const productImg = p.image_url || p.attributes?.image_url || (p as any).image || (p as any).photo;

                return (
                  <div
                    key={p.id}
                    className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''} ${totalInCart > 0 ? 'in-cart' : ''}`}
                    onClick={() => !isOutOfStock && totalInCart < activeStock && addToCart(p, defaultStockSource)}
                  >
                    {/* Full-bleed Top Image (0 padding top/left/right) */}
                    <div className="pos-prod-image-container">
                      {productImg ? (
                        <img
                          src={productImg}
                          alt={p.name}
                          className="pos-prod-img"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const parent = (e.target as HTMLElement).parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.pos-prod-fallback') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}

                      <div
                        className="pos-prod-fallback"
                        style={{ display: productImg ? 'none' : 'flex' }}
                      >
                        <span className="pos-prod-fallback-icon">
                          {p.type === 'plants' && <Trees size={32} strokeWidth={1.8} style={{ color: '#16a34a' }} />}
                          {p.type === 'cactus' && <CactusIcon size={32} style={{ color: '#0d9488' }} />}
                          {p.type === 'pots' && <PlanterIcon size={32} style={{ color: '#ea580c' }} />}
                          {p.type === 'fertilizers' && <FlaskConical size={32} strokeWidth={1.8} style={{ color: '#6366f1' }} />}
                          {p.type === 'flowers' && <Flower2 size={32} strokeWidth={1.8} style={{ color: '#e11d48' }} />}
                          {!['plants', 'cactus', 'pots', 'fertilizers', 'flowers'].includes(p.type) && (
                            modules.find((m) => m.slug === p.type)?.icon ? (
                              <span style={{ fontSize: '1.75rem' }}>{modules.find((m) => m.slug === p.type)?.icon}</span>
                            ) : (
                              <Trees size={32} strokeWidth={1.8} style={{ color: '#16a34a' }} />
                            )
                          )}
                        </span>
                      </div>

                      {/* Top-Left Must Try / Discount Badge */}
                      {(() => {
                        const { discPieces, discPercent, attr: prodAttr } = getProductDiscountInfo(p);
                        if (discPercent > 0) {
                          return (
                            <span className="pos-prod-badge-must-try">
                              🔥 {discPercent}% Off{discPieces > 1 ? ` (${discPieces}+ pcs)` : ''}
                            </span>
                          );
                        }
                        if (prodAttr.is_featured || prodAttr.must_try) {
                          return (
                            <span className="pos-prod-badge-must-try">
                              🔥 Must Try
                            </span>
                          );
                        }
                        return null;
                      })()}

                      {/* Out-of-Stock Overlay */}
                      {isOutOfStock && (
                        <div className="pos-out-of-stock-overlay">
                          <span>Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details Body */}
                    <div className="pos-prod-body">
                      {/* Product Name */}
                      <h4 className="pos-prod-name" title={p.name}>
                        {p.name || 'Product'}
                      </h4>

                      {/* Meta Subtitle Row: Category & Live Stock */}
                      <div className="pos-prod-meta-row">
                        <span className="pos-prod-category-text">
                          {modules.find((m) => m.slug === p.type)?.name || p.type || 'Item'}
                        </span>
                        <span className={`pos-prod-stock-indicator ${isOutOfStock ? 'empty' : isLowStock ? 'low' : 'ok'}`}>
                          {defaultStockSource === 'shop' ? `🏪 ${shopStock}` : `📦 ${warehouseStock}`}
                        </span>
                      </div>

                      {/* Footer: Price & Circular Stepper */}
                      <div className="pos-prod-footer">
                        <div className="pos-prod-price-wrap">
                          {(() => {
                            const { price: leastPrice } = getProductLeastPrice(p);
                            const { discPieces, discPercent } = getProductDiscountInfo(p);
                            if (discPercent > 0 && discPieces <= 1) {
                              return (
                                <>
                                  <span className="pos-prod-price-old">₹{leastPrice.toFixed(0)}</span>
                                  <span className="pos-prod-price-current">
                                    ₹{(leastPrice * (1 - discPercent / 100)).toFixed(0)}
                                  </span>
                                </>
                              );
                            }
                            return <span className="pos-prod-price-current">₹{leastPrice.toFixed(2)}</span>;
                          })()}
                        </div>

                        {/* Stepper with Minus, Quantity, Plus */}
                        <div className="pos-card-stepper" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={`pos-card-step-btn minus ${totalInCart <= 0 ? 'disabled' : ''}`}
                            onClick={(e) => decrementCardQuantity(p, e)}
                            disabled={totalInCart <= 0}
                            title="Decrease Quantity"
                          >
                            −
                          </button>
                          <span className={`pos-card-step-qty ${totalInCart > 0 ? 'active' : ''}`}>
                            {totalInCart}
                          </span>
                          <button
                            type="button"
                            className="pos-card-step-btn plus"
                            onClick={(e) => incrementCardQuantity(p, e)}
                            disabled={isOutOfStock || totalInCart >= activeStock}
                            title="Add to Cart"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Cart Panel */}
        <div className="pos-cart-panel">
          {/* Order List Header */}
          <div className="pos-order-header">
            <h2 className="pos-order-title">Order List</h2>
            <div className="pos-order-header-right">
              <button
                type="button"
                className="pos-held-badge-btn"
                onClick={() => setIsHoldDrawerOpen(true)}
                title="View Held Bills (F8)"
              >
                <Clock size={12} /> Held ({heldBills.length})
              </button>
              <span className="pos-order-badge">
                #ORD123
              </span>
              <button
                type="button"
                className="pos-order-trash-btn"
                onClick={() => {
                  if (cart.length > 0 && window.confirm('Clear all items from current cart?')) {
                    setCart([]);
                    setDiscountAmount(0);
                  }
                }}
                disabled={cart.length === 0}
                title="Clear Cart"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Customer / Project Mapping Mode Switcher */}
          <div className="pos-customer-card">
            {/* Two Tabs: Billed Customer & Project */}
            <div className="pos-mapping-tabs">
              <button
                type="button"
                className={`pos-mapping-tab ${customerTab === 'customer' ? 'active' : ''}`}
                onClick={() => {
                  setCustomerTab('customer');
                  setSelectedProjectId('');
                  setSelectedProject(null);
                }}
              >
                <UserCheck size={14} />
                <span>Billed Customer</span>
              </button>
              <button
                type="button"
                className={`pos-mapping-tab ${customerTab === 'project' ? 'active proj' : ''}`}
                onClick={() => {
                  setCustomerTab('project');
                  setShowCustomerDropdown(false);
                }}
              >
                <FolderKanban size={14} />
                <span>Project</span>
                {allProjects.length > 0 && (
                  <span className="pos-tab-badge">{allProjects.length}</span>
                )}
              </button>
            </div>

            {customerTab === 'customer' ? (
              <div className="pos-customer-section" style={{ padding: 0 }}>
                <div className="pos-customer-select-row">
                  <div
                    className={`pos-customer-trigger ${showCustomerDropdown ? 'open' : ''}`}
                    onClick={() => setShowCustomerDropdown((prev) => !prev)}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedCustomer.name || 'Walk in Customer'}
                    </span>
                    <ChevronDown
                      size={16}
                      style={{
                        color: '#64748b',
                        transform: showCustomerDropdown ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </div>

                  {/* Customer Create Button */}
                  <button
                    type="button"
                    className="pos-cust-action-btn pos-cust-create-btn"
                    onClick={() => {
                      setNewCustomerInitialName(customerSearchQuery);
                      setIsCreateCustomerModalOpen(true);
                    }}
                    title="Add New Customer"
                  >
                    <UserPlus size={18} />
                  </button>

                  {/* Scan Customer / Barcode Button */}
                  <button
                    type="button"
                    className="pos-cust-action-btn pos-cust-scan-btn"
                    onClick={() => setIsScannerOpen(true)}
                    title="Scan Customer Card / QR Code"
                  >
                    <Scan size={18} />
                  </button>

                  {/* Customer Search & Select Dropdown Menu */}
                  {showCustomerDropdown && (
                    <div className="pos-customer-menu">
                      <div className="pos-customer-menu-search">
                        <Search size={14} color="#94a3b8" />
                        <input
                          type="text"
                          placeholder="Search customer name, phone, or GST..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          autoFocus
                        />
                        {customerSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCustomerSearchQuery('')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="pos-customer-menu-list">
                        <div
                          className={`pos-customer-menu-item ${selectedCustomer.name === 'Walk in Customer' || selectedCustomer.name === 'Walk-in Customer' ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCustomer({ name: 'Walk in Customer', phone: '' });
                            setShowCustomerDropdown(false);
                            setCustomerSearchQuery('');
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Walk in Customer</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Standard counter customer</div>
                          </div>
                          {(selectedCustomer.name === 'Walk in Customer' || selectedCustomer.name === 'Walk-in Customer') && (
                            <Check size={16} color="#16a34a" />
                          )}
                        </div>

                        {filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            className={`pos-customer-menu-item ${selectedCustomer.id === c.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedCustomer({
                                id: c.id,
                                name: c.name,
                                phone: c.phone || '',
                                gstin: c.gstin || '',
                                credit_limit: c.credit_limit || 0,
                                total_spent: c.total_spent || 0,
                                customer_type: c.customer_type || 'customer',
                              });
                              setShowCustomerDropdown(false);
                              setCustomerSearchQuery('');
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{c.name}</strong>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {c.phone || 'No mobile listed'} {c.gstin ? `• GST: ${c.gstin}` : ''}
                              </div>
                            </div>
                            {selectedCustomer.id === c.id ? (
                              <Check size={16} color="#16a34a" />
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: '#0d9488',
                                  backgroundColor: '#ccfbf1',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                Select
                              </span>
                            )}
                          </div>
                        ))}

                        {filteredCustomers.length === 0 && customerSearchQuery && (
                          <div style={{ padding: '14px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px 0' }}>
                              No customer found for "{customerSearchQuery}"
                            </p>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setShowCustomerDropdown(false);
                                setNewCustomerInitialName(customerSearchQuery);
                                setIsCreateCustomerModalOpen(true);
                              }}
                              style={{ backgroundColor: '#0d9488', borderColor: '#0d9488', borderRadius: '6px' }}
                            >
                              + Create "{customerSearchQuery}"
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Customer Banner Card */}
                {selectedCustomer.name && selectedCustomer.name !== 'Walk in Customer' && selectedCustomer.name !== 'Walk-in Customer' && (
                  <div className="pos-selected-cust-banner" style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="pos-banner-close-btn"
                      onClick={() => setSelectedCustomer({ name: 'Walk in Customer', phone: '' })}
                      title="Remove customer"
                    >
                      <X size={12} />
                    </button>

                    <div className="pos-banner-info">
                      <div className="pos-banner-name">
                        {selectedCustomer.name}
                      </div>
                      <div className="pos-banner-tags">
                        <span>
                          Phone: <strong style={{ color: '#0f172a' }}>{selectedCustomer.phone || 'N/A'}</strong>
                        </span>
                        {selectedCustomer.gstin && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span>
                              GST: <span className="pos-tag-pill loyalty">{selectedCustomer.gstin}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pos-banner-apply-btn"
                      onClick={() => setShowCustomerDropdown(false)}
                    >
                      Applied
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* --- PROJECT SELECTION WORKFLOW --- */
              <div className="pos-project-select-container">
                <div className="pos-customer-card-header">
                  <div className="pos-customer-label">
                    <FolderKanban size={13} color="#16a34a" />
                    <span>Select Client Project</span>
                  </div>
                  {selectedProject && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSelectedProjectId('');
                        setSelectedProject(null);
                        setProjectSearchQuery('');
                        setSelectedCustomer({ name: 'Walk-in Customer', phone: '' });
                      }}
                      style={{ fontSize: '0.72rem', padding: '2px 6px', height: '22px', color: '#64748b' }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Custom Searchable Project Select Dropdown */}
                <div className="pos-project-select-wrap" ref={projectDropdownRef}>
                  <div
                    className={`pos-project-search-input-box ${isProjectDropdownOpen ? 'focused' : ''} ${selectedProject ? 'has-selection' : ''}`}
                    onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                  >
                    <Building size={15} className="pos-proj-field-icon" />
                    
                    <input
                      type="text"
                      className="pos-project-search-input"
                      value={
                        isProjectDropdownOpen
                          ? projectSearchQuery
                          : selectedProject
                          ? selectedProject.name
                          : projectSearchQuery
                      }
                      onChange={(e) => {
                        setProjectSearchQuery(e.target.value);
                        if (!isProjectDropdownOpen) setIsProjectDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsProjectDropdownOpen(true);
                        if (selectedProject) setProjectSearchQuery('');
                      }}
                      placeholder={selectedProject ? selectedProject.name : 'Search or choose client project...'}
                    />

                    <div className="pos-project-input-actions" onClick={(e) => e.stopPropagation()}>
                      {selectedProject && (
                        <button
                          type="button"
                          className="pos-proj-clear-btn"
                          onClick={() => {
                            setSelectedProjectId('');
                            setSelectedProject(null);
                            setProjectSearchQuery('');
                            setSelectedCustomer({ name: 'Walk-in Customer', phone: '' });
                          }}
                          title="Clear project"
                        >
                          <X size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="pos-proj-chevron-btn"
                        onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                        title="Toggle projects dropdown"
                      >
                        <ChevronDown
                          size={14}
                          style={{
                            transform: isProjectDropdownOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease'
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Floating Custom Dropdown List */}
                  {isProjectDropdownOpen && (
                    <div className="pos-project-dropdown-list">
                      <div className="pos-project-dropdown-header">
                        <span>Projects Directory ({filteredProjects.length})</span>
                        <span className="pos-project-dropdown-close" onClick={() => setIsProjectDropdownOpen(false)}>✕ Close</span>
                      </div>
                      <div className="pos-project-dropdown-items">
                        {filteredProjects.length === 0 ? (
                          <div className="pos-project-no-match">
                            {allProjects.length === 0
                              ? 'No client projects found. Create projects in Client Projects.'
                              : `No projects match "${projectSearchQuery}"`}
                          </div>
                        ) : (
                          filteredProjects.map((p) => {
                            const isSelected = selectedProjectId === p.id;
                            return (
                              <div
                                key={p.id}
                                className={`pos-project-option-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedProjectId(p.id);
                                  setSelectedProject(p);
                                  setProjectSearchQuery('');
                                  setIsProjectDropdownOpen(false);
                                  setSelectedCustomer({
                                    id: undefined,
                                    name: p.client_name ? `${p.client_name} (${p.name})` : p.name,
                                    phone: p.supervisor_phone || ''
                                  });
                                }}
                              >
                                <div className="pos-option-main">
                                  <div className="pos-option-title-row">
                                    <span className="pos-option-name">{p.name}</span>
                                    <span className={`pos-option-status-pill ${p.status}`}>
                                      {p.status}
                                    </span>
                                  </div>
                                  <div className="pos-option-sub">
                                    <span>👤 {p.client_name} {p.company ? `• 🏢 ${p.company}` : ''}</span>
                                    {p.supervisor_name && (
                                      <span>• 👷 {p.supervisor_name}</span>
                                    )}
                                  </div>
                                </div>
                                {isSelected && <Check size={16} className="pos-option-check" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedProject ? (
                  <div className="pos-selected-project-card">
                    <div className="pos-project-meta-grid">
                      <div className="pos-project-meta-item">
                        <span className="meta-label">Client:</span>
                        <span className="meta-val">{selectedProject.client_name} {selectedProject.company && `(${selectedProject.company})`}</span>
                      </div>
                      {selectedProject.supervisor_name && (
                        <div className="pos-project-meta-item">
                          <span className="meta-label">Supervisor:</span>
                          <span className="meta-val">{selectedProject.supervisor_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="pos-project-sync-hint">
                      ✨ Billed amount will automatically credit <strong>Project Expenses</strong> & add to <strong>Billed Invoices</strong>.
                    </div>
                  </div>
                ) : (
                  <div className="pos-project-empty-hint">
                    {allProjects.length === 0 ? (
                      <span>No client projects found. Create projects under Client Projects menu.</span>
                    ) : (
                      <span>Search or pick a project from the dropdown above to map sale.</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Line Items */}
          <div className="pos-cart-items-wrapper">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '28px 16px', margin: 'auto' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px auto'
                  }}
                >
                  <ShoppingBag size={22} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Register Cart is Empty</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                  Click items from catalog or scan product barcode to add
                </div>
              </div>
            ) : (
              cart.map((item) => {
                const itemDisc = getItemDiscount(item);
                const isDiscounted = itemDisc > 0;
                const minPieces = item.discount_pieces && item.discount_pieces > 0 ? item.discount_pieces : 1;
                const needsMorePieces = !isDiscounted && item.discount_percent && item.discount_percent > 0 && item.discount_pieces && item.discount_pieces > 1;
                const currentSource = item.stock_source || 'shop';
                const itemKey = `${item.product_id}-${currentSource}-${item.size || 'default'}`;

                return (
                  <div key={itemKey} className="pos-cart-item">
                    {/* Top Row: Product Name + Size Pill on Left, Total Price on Right */}
                    <div className="pos-cart-item-top">
                      <div className="pos-cart-item-title-group">
                        <span className="pos-cart-item-name" title={item.product_name}>{item.product_name}</span>

                        {/* Interactive Size Badge Button */}
                        {item.size && (
                          <button
                            type="button"
                            className={`pos-cart-size-pill ${openSizeDropdownKey === itemKey ? 'open' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenSizeDropdownKey((prev) => (prev === itemKey ? null : itemKey));
                            }}
                            title="Click to view or add size variants"
                          >
                            <Tag size={10} />
                            <span>Size: {item.size}</span>
                            <ChevronDown size={10} style={{ transform: openSizeDropdownKey === itemKey ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                          </button>
                        )}

                        {isDiscounted && (
                          <span className="pos-cart-applied-discount">
                            🏷️ {item.discount_percent}% off{item.discount_pieces && item.discount_pieces > 1 ? ` (${item.discount_pieces}+ pcs)` : ''}
                          </span>
                        )}
                      </div>

                      <div className="pos-cart-item-total tabular">
                        <span className="pos-cart-total-amount">₹{(item.quantity * item.unit_price - itemDisc).toFixed(2)}</span>
                        {isDiscounted && (
                          <span className="pos-cart-orig-amount">
                            ₹{(item.quantity * item.unit_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Unit Price & GST Info */}
                    <div className="pos-cart-item-meta">
                      <span>
                        {isDiscounted ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '4px' }}>
                              ₹{item.unit_price.toFixed(2)}
                            </span>
                            <span style={{ color: '#059669', fontWeight: 700 }}>
                              ₹{(item.unit_price * (1 - (item.discount_percent || 0) / 100)).toFixed(2)} / unit
                            </span>
                          </>
                        ) : (
                          `₹${item.unit_price.toFixed(2)} / unit`
                        )}
                      </span>
                      {isTaxable && item.gst_rate > 0 ? <span>• {item.gst_rate}% GST</span> : null}
                      {needsMorePieces ? (
                        <span className="pos-cart-upsell-text">
                          (Add {item.discount_pieces! - item.quantity} more for {item.discount_percent}% off)
                        </span>
                      ) : null}
                    </div>

                    {/* Bottom Row: Delete on Left, Stepper on Right */}
                    <div className="pos-cart-item-bottom">
                      <button
                        type="button"
                        className="pos-cart-delete-btn"
                        onClick={() => removeFromCart(item.product_id, currentSource, item.size)}
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="pos-cart-qty-stepper">
                        <button
                          type="button"
                          className="pos-cart-qty-btn minus"
                          onClick={() => updateQuantity(item.product_id, -1, currentSource, item.size)}
                          title="Decrease"
                        >
                          <Minus size={11} strokeWidth={2.5} />
                        </button>
                        <span className="pos-cart-qty-count tabular">{item.quantity}</span>
                        <button
                          type="button"
                          className="pos-cart-qty-btn plus"
                          onClick={() => updateQuantity(item.product_id, 1, currentSource, item.size)}
                          title="Increase"
                          disabled={item.quantity >= item.stock_quantity}
                        >
                          <Plus size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Size Switcher & Multi-Size Adder Popover */}
                    {openSizeDropdownKey === itemKey && item.available_sizes && item.available_sizes.length > 0 && (
                      <div className="pos-cart-size-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="pos-cart-size-dropdown-header">
                          <div className="pos-cart-size-title-wrap">
                            <Tag size={12} className="pos-cart-size-tag-icon" />
                            <span className="pos-cart-size-dropdown-title">Choose Size Variant</span>
                            <span className="pos-cart-size-prod-name">({item.product_name})</span>
                          </div>
                          <button
                            type="button"
                            className="pos-cart-size-close-btn"
                            onClick={() => setOpenSizeDropdownKey(null)}
                            title="Close"
                          >
                            <X size={13} />
                          </button>
                        </div>

                        <div className="pos-cart-size-list">
                          {item.available_sizes.map((sz) => {
                            const matchedProd = products.find((p) => p.id === item.product_id);
                            const szPrice = matchedProd ? getProductSizePrice(matchedProd, sz) : item.unit_price;
                            const isCurrent = item.size === sz;
                            const existingCartItem = cart.find(
                              (it) =>
                                it.product_id === item.product_id &&
                                (it.stock_source || 'shop') === currentSource &&
                                it.size === sz
                            );
                            const qtyInCart = existingCartItem ? existingCartItem.quantity : 0;

                            return (
                              <div key={sz} className={`pos-size-row ${isCurrent ? 'is-current-line' : ''}`}>
                                {/* Left: Size Badge & Price */}
                                <div className="pos-size-row-left">
                                  <span className={`pos-size-pill-tag ${isCurrent ? 'active' : ''}`}>
                                    Size {sz}
                                  </span>
                                  <span className="pos-size-price-text">
                                    ₹{szPrice.toFixed(2)}
                                  </span>
                                  {isCurrent && (
                                    <span className="pos-size-current-indicator">Current</span>
                                  )}
                                </div>

                                {/* Right: Actions */}
                                <div className="pos-size-row-right">
                                  {!isCurrent && (
                                    <button
                                      type="button"
                                      className="pos-size-switch-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        changeCartItemSize(item.product_id, currentSource, item.size, sz);
                                        setOpenSizeDropdownKey(null);
                                      }}
                                      title={`Switch current item to Size ${sz}`}
                                    >
                                      <ArrowLeftRight size={10} /> Switch
                                    </button>
                                  )}
                                  {existingCartItem ? (
                                    <div className="pos-cart-qty-stepper compact">
                                      <button
                                        type="button"
                                        className="pos-cart-qty-btn minus"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(item.product_id, -1, currentSource, sz);
                                        }}
                                        title="Decrease quantity"
                                      >
                                        <Minus size={10} strokeWidth={2.5} />
                                      </button>
                                      <span className="pos-cart-qty-count tabular">
                                        {existingCartItem.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        className="pos-cart-qty-btn plus"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (matchedProd) {
                                            addToCart(matchedProd, currentSource, sz);
                                          }
                                        }}
                                        title="Increase quantity"
                                      >
                                        <Plus size={10} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="pos-size-add-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (matchedProd) {
                                          addToCart(matchedProd, currentSource, sz);
                                        }
                                      }}
                                      title={`Add Size ${sz} to cart`}
                                    >
                                      <Plus size={11} /> Add 1
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Financial Summary */}
          <div className="pos-cart-summary">
            <div className="summary-row">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="tabular" style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row" style={{ alignItems: 'flex-start', padding: '4px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Bill Discount</span>
                  {discountBadgeLabel && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      background: '#ecfdf5',
                      color: '#065f46',
                      borderRadius: '4px',
                      border: '1px solid #a7f3d0'
                    }}>
                      {discountBadgeLabel} OFF
                    </span>
                  )}
                </div>
                {autoDiscountTotal > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                    Reduced: -₹{autoDiscountTotal.toFixed(2)}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {totalDiscount > 0 && (
                  <span className="tabular" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#059669' }}>
                    -₹{totalDiscount.toFixed(2)}
                  </span>
                )}
                <input
                  type="number"
                  min="0"
                  className="pos-customer-input"
                  style={{ width: '70px', padding: '3px 6px', textAlign: 'right', fontSize: '0.8125rem', height: '28px' }}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="+ Extra ₹"
                  title="Add extra manual bill discount if needed"
                />
              </div>
            </div>

            {isTaxable && (
              <div className="summary-row">
                <span>GST Tax (Included/Applied)</span>
                <span className="tabular" style={{ fontWeight: 600, color: '#0f172a' }}>₹{taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row total-row">
              <span>Grand Total</span>
              <span className="total-value tabular">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector & Checkout Bar */}
          <div className="pos-checkout-actions">
            <div className="quick-pay-grid">
              <button
                type="button"
                className={`quick-pay-btn cash ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote size={15} /> Cash [F2]
              </button>
              <button
                type="button"
                className={`quick-pay-btn upi ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <QrCode size={15} /> UPI / QR [F3]
              </button>
              <button
                type="button"
                className={`quick-pay-btn card ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={15} /> Card [F4]
              </button>
              <button
                type="button"
                className={`quick-pay-btn split ${paymentMethod === 'split' ? 'active' : ''}`}
                onClick={handleSelectSplit}
              >
                <ArrowLeftRight size={15} /> Split [F5]
              </button>
              <button
                type="button"
                className={`quick-pay-btn credit ${paymentMethod === 'credit' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('credit')}
              >
                <HandCoins size={15} /> Credit / Due
              </button>
            </div>

            {paymentMethod === 'split' && (
              <div className="pos-split-payment-panel">
                <div className="pos-split-panel-header">
                  <div className="pos-split-title">
                    <ArrowLeftRight size={13} />
                    <span>Split Payment</span>
                  </div>
                  <div className="pos-split-quick-actions">
                    <button
                      type="button"
                      className="pos-split-quick-btn"
                      onClick={handleSetSplit5050}
                      title="Split grand total equally between Cash and UPI"
                    >
                      50/50 Split
                    </button>
                    <button
                      type="button"
                      className="pos-split-quick-btn"
                      onClick={handleBalanceToUpi}
                      title="Auto calculate remainder into UPI"
                    >
                      Rem → UPI
                    </button>
                    <button
                      type="button"
                      className="pos-split-quick-btn"
                      onClick={handleBalanceToCash}
                      title="Auto calculate remainder into Cash"
                    >
                      Rem → Cash
                    </button>
                  </div>
                </div>

                <div className="pos-split-fields-grid">
                  <div className="pos-split-field-wrap">
                    <label className="pos-split-field-label">
                      <Banknote size={13} color="#16a34a" /> Cash Amount
                    </label>
                    <div className="pos-split-input-container">
                      <span className="pos-split-curr">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="pos-split-input"
                        placeholder="0.00"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>

                  <div className="pos-split-field-wrap">
                    <label className="pos-split-field-label">
                      <QrCode size={13} color="#9333ea" /> UPI Amount
                    </label>
                    <div className="pos-split-input-container">
                      <span className="pos-split-curr">₹</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="pos-split-input"
                        placeholder="0.00"
                        value={splitUpi}
                        onChange={(e) => setSplitUpi(e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                </div>

                {grandTotal > 0 && (
                  <div
                    className={`pos-split-status-bar ${
                      isSplitBalanced ? 'balanced' : isSplitShort ? 'short' : 'exceeded'
                    }`}
                  >
                    {isSplitBalanced ? (
                      <span>✓ Exact Match: ₹{splitCashNum.toFixed(2)} Cash + ₹{splitUpiNum.toFixed(2)} UPI = ₹{grandTotal.toFixed(2)}</span>
                    ) : isSplitShort ? (
                      <span>⚠️ ₹{splitDiff.toFixed(2)} remaining to allocate (Total allocated: ₹{splitTotalAllocated.toFixed(2)} / ₹{grandTotal.toFixed(2)})</span>
                    ) : (
                      <span>❌ Allocated ₹{splitTotalAllocated.toFixed(2)} exceeds Grand Total by ₹{Math.abs(splitDiff).toFixed(2)}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="complete-checkout-btn"
              onClick={() => handleCheckout(paymentMethod)}
              disabled={cart.length === 0 || isProcessingCheckout || (paymentMethod === 'split' && !isSplitBalanced)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} />
                <span>
                  {isProcessingCheckout
                    ? 'Processing Bill...'
                    : paymentMethod === 'split'
                    ? 'Complete Split Payment'
                    : `Pay with ${paymentMethod.toUpperCase()}`}
                </span>
              </div>
              <span style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>
                ₹{grandTotal.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          const matched = products.find(
            (p) => p.barcode === scannedCode || p.sku.toLowerCase() === scannedCode.toLowerCase()
          );
          if (matched) {
            addToCart(matched);
          } else {
            alert(`No product found with barcode: ${scannedCode}`);
          }
        }}
      />

      {/* Held Bills Drawer */}
      <PosHoldBills
        isOpen={isHoldDrawerOpen}
        onClose={() => setIsHoldDrawerOpen(false)}
        heldBills={heldBills}
        onResumeBill={handleResumeBill}
        onDeleteBill={(id) => posQueueService.deleteHeldBill(id).then(loadHeldBills)}
      />

      {/* Checkout Success & Print Modal */}
      {completedInvoice && printModalMode && (
        <div className="dialog-overlay" onClick={() => setPrintModalMode(null)}>
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: printModalMode === 'a4' ? '920px' : '440px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="var(--color-success)" />
                <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700 }}>
                  Sale Complete — #{completedInvoice.invoice_number}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${printModalMode === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPrintModalMode('receipt')}
                >
                  80mm Receipt
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${printModalMode === 'a4' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPrintModalMode('a4')}
                >
                  {isTaxable ? 'A4 Tax Invoice' : 'A4 Bill'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalMode(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="dialog-body" style={{ padding: '20px' }}>
              {printModalMode === 'receipt' ? (
                <Receipt80mmView invoice={completedInvoice} />
              ) : (
                <A4InvoiceView invoice={completedInvoice} />
              )}
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="btn btn-sell"
                onClick={() => {
                  setPrintModalMode(null);
                  setCompletedInvoice(null);
                }}
              >
                Start New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Quick Create Popup Modal */}
      <CustomerCreateModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
        initialName={newCustomerInitialName}
      />
    </div>
  );
};
