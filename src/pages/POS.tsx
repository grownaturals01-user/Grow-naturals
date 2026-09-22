import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { usePosSync } from '../context/PosSyncContext';
import { api } from '../services/api';
import { posQueueService } from '../services/posQueue';
import { barcodeService } from '../services/barcodeService';
import { printService } from '../services/printService';
import type { Product, POSCartItem, Customer, HeldBill, Invoice } from '../types';
import { BarcodeScannerModal } from '../components/pos/BarcodeScannerModal';
import { PosHoldBills } from '../components/pos/PosHoldBills';
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
  Phone,
  UserCheck
} from 'lucide-react';

export const POS: React.FC = () => {
  const { businessId, business, isTaxable } = useBusiness();
  const { user } = useAuth();
  const { isOnline, queueOfflineSale } = usePosSync();

  // Products and Categories
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Registered Customers Lookup
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id?: string; name: string; phone: string }>({
    name: 'Walk-in Customer',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [notes, setNotes] = useState<string>('');

  // Modals & Drawers
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isHoldDrawerOpen, setIsHoldDrawerOpen] = useState<boolean>(false);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [printModalMode, setPrintModalMode] = useState<'receipt' | 'a4' | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load products (online-first, fallback to IndexedDB cache when offline)
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      if (navigator.onLine) {
        const data = await api.get('/products', { business_id: businessId });
        setProducts(data);
        setFilteredProducts(data);
        // Cache to IndexedDB for offline counter access
        await posQueueService.cacheProducts(data);
      } else {
        const cached = await posQueueService.getCachedProducts(businessId);
        setProducts(cached);
        setFilteredProducts(cached);
      }
    } catch {
      // Fallback to cache if network fails
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
    setCart([]);
    setDiscountAmount(0);
    setCompletedInvoice(null);
  }, [businessId, loadProducts, loadHeldBills]);

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

  // Category counts
  const categoryCounts = {
    all: products.length,
    plants: products.filter((p) => p.type === 'plants').length,
    pots: products.filter((p) => p.type === 'pots').length,
    fertilizers: products.filter((p) => p.type === 'fertilizers').length,
    flowers: products.filter((p) => p.type === 'flowers').length,
  };

  // Add product to cart (Immutable state update)
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product_id === product.id);
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        if (item.quantity >= product.stock_quantity) {
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...item,
          quantity: item.quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            hsn_code: product.hsn_code || (isTaxable ? '0602' : ''),
            quantity: 1,
            unit_price: Number(product.sale_price),
            discount: 0,
            gst_rate: isTaxable ? Number(product.gst_rate || 0) : 0,
            stock_quantity: product.stock_quantity,
          },
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
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

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
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

  // Calculations
  const subtotal = cart.reduce((acc, i) => acc + i.quantity * i.unit_price - i.discount, 0);
  const taxAmount = isTaxable
    ? cart.reduce((acc, i) => {
        const lineSubtotal = i.quantity * i.unit_price - i.discount;
        return acc + (lineSubtotal * i.gst_rate) / 100;
      }, 0)
    : 0;

  const cgstAmount = isTaxable ? Number((taxAmount / 2).toFixed(2)) : 0;
  const sgstAmount = isTaxable ? Number((taxAmount / 2).toFixed(2)) : 0;
  const grandTotal = Math.max(0, Number((subtotal + taxAmount - Number(discountAmount)).toFixed(2)));

  // Hold Bill
  const handleHoldBill = async () => {
    if (cart.length === 0) return;

    const holdBill: HeldBill = {
      id: `hold-${Date.now()}`,
      hold_number: `HOLD-${100 + heldBills.length + 1}`,
      business_id: businessId,
      customer_name: selectedCustomer.name,
      customer_phone: selectedCustomer.phone,
      items: cart,
      discount_amount: discountAmount,
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
    posQueueService.deleteHeldBill(bill.id).then(loadHeldBills);
  };

  // Complete Checkout (Online or Offline Queue)
  const handleCheckout = async (methodOverride?: 'cash' | 'upi' | 'card' | 'credit') => {
    if (cart.length === 0 || isProcessingCheckout) return;

    const method = methodOverride || paymentMethod;
    setIsProcessingCheckout(true);

    const payload = {
      business_id: businessId,
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name || 'Walk-in Customer',
      customer_phone: selectedCustomer.phone || '',
      items: cart.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        sku: i.sku,
        hsn_code: i.hsn_code,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        gst_rate: i.gst_rate,
      })),
      discount_amount: Number(discountAmount) || 0,
      payment_method: method,
      notes: notes || '',
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
        const offlineInvNumber = `${businessId === 'grow-naturals' ? 'GN' : 'NN'}-OFF-${Date.now().toString().slice(-4)}`;
        const offlineInvoice: any = {
          id: `off-inv-${Date.now()}`,
          business_id: businessId,
          invoice_number: offlineInvNumber,
          customer_name: selectedCustomer.name || 'Walk-in Customer',
          customer_phone: selectedCustomer.phone || '',
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          cgst_amount: cgstAmount,
          sgst_amount: sgstAmount,
          total_amount: grandTotal,
          payment_method: method,
          notes: 'Offline Queued Bill',
          created_by: user?.id,
          created_at: new Date().toISOString(),
          items: cart.map((i) => ({
            ...i,
            total: (i.quantity * i.unit_price - i.discount) * (1 + i.gst_rate / 100),
          })),
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
  }, [cart, paymentMethod, searchQuery]);

  return (
    <div>
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

              <div className="pos-scanner-badge" title="USB and Bluetooth barcode scanners automatically scan into this terminal">
                <Zap size={13} fill="#16a34a" />
                <span>Scanner Active</span>
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

            {/* Category Filter Pills */}
            <div className="pos-category-pills">
              <button
                type="button"
                className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <Layers size={14} /> All Items
                <span className="pill-count">{categoryCounts.all}</span>
              </button>
              <button
                type="button"
                className={`category-pill ${selectedCategory === 'plants' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('plants')}
              >
                <Leaf size={14} /> Plants & Trees
                <span className="pill-count">{categoryCounts.plants}</span>
              </button>
              <button
                type="button"
                className={`category-pill ${selectedCategory === 'pots' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('pots')}
              >
                🪴 Pots & Planters
                <span className="pill-count">{categoryCounts.pots}</span>
              </button>
              <button
                type="button"
                className={`category-pill ${selectedCategory === 'fertilizers' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('fertilizers')}
              >
                🧪 Fertilizers & Care
                <span className="pill-count">{categoryCounts.fertilizers}</span>
              </button>
              <button
                type="button"
                className={`category-pill ${selectedCategory === 'flowers' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('flowers')}
              >
                🌸 Flowers & Decor
                <span className="pill-count">{categoryCounts.flowers}</span>
              </button>
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
                const isOutOfStock = p.stock_quantity <= 0;
                const cartMatch = cart.find((it) => it.product_id === p.id);
                const isLowStock = !isOutOfStock && p.stock_quantity <= (p.low_stock_threshold || 10);

                return (
                  <div
                    key={p.id}
                    className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''} ${cartMatch ? 'in-cart' : ''}`}
                    onClick={() => !isOutOfStock && addToCart(p)}
                  >
                    <div>
                      <div className="pos-prod-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }}
                            />
                          ) : null}
                          <span className={`pos-prod-badge ${p.type}`}>
                            {!p.image_url && p.type === 'plants' && '🌿 '}
                            {!p.image_url && p.type === 'pots' && '🪴 '}
                            {!p.image_url && p.type === 'fertilizers' && '🧪 '}
                            {!p.image_url && p.type === 'flowers' && '🌸 '}
                            {p.type}
                          </span>
                        </div>
                        {cartMatch && (
                          <span className="pos-in-cart-pill">
                            {cartMatch.quantity} in cart
                          </span>
                        )}
                      </div>

                      <h4 className="pos-prod-name" title={p.name}>
                        {p.name}
                      </h4>
                      <div className="pos-prod-sku">SKU: {p.sku}</div>
                    </div>

                    <div className="pos-prod-footer">
                      <span className="pos-prod-price tabular">₹{Number(p.sale_price).toFixed(2)}</span>
                      <span className={`pos-prod-stock tabular ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`}>
                        {isOutOfStock ? '• Out of stock' : isLowStock ? `⚡ ${p.stock_quantity} left` : `✓ ${p.stock_quantity} left`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Cart Panel */}
        <div className="pos-cart-panel">
          {/* Cart Header */}
          <div className="pos-cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(22, 163, 74, 0.12)',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShoppingBag size={18} />
              </div>
              <div>
                <h3 className="pos-cart-title">
                  Current Sale
                </h3>
              </div>
              <span className="pos-cart-count-badge">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsHoldDrawerOpen(true)}
                title="View Held Bills (F8)"
                style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px' }}
              >
                <Clock size={13} /> Held ({heldBills.length})
              </button>
              {cart.length > 0 && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleHoldBill}
                    title="Hold current sale to attend next customer"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Hold
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      if (window.confirm('Clear all items from current cart?')) {
                        setCart([]);
                        setDiscountAmount(0);
                      }
                    }}
                    title="Clear Cart"
                    style={{ padding: '4px 8px', color: '#dc2626' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Customer Input Card */}
          <div className="pos-customer-card">
            <div className="pos-customer-card-header">
              <div className="pos-customer-label">
                <UserCheck size={14} color="#16a34a" />
                <span>Billed Customer</span>
              </div>
              {selectedCustomer.name !== 'Walk-in Customer' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedCustomer({ name: 'Walk-in Customer', phone: '' })}
                  style={{ fontSize: '0.72rem', padding: '2px 6px', height: '22px', color: '#64748b' }}
                >
                  Reset to Walk-in
                </button>
              )}
            </div>

            <div className="pos-customer-fields">
              <div className="pos-customer-input-wrap">
                <User size={14} className="field-icon" />
                <input
                  type="text"
                  className="pos-customer-input"
                  value={selectedCustomer.name}
                  onChange={(e) => {
                    setSelectedCustomer({ ...selectedCustomer, name: e.target.value, id: undefined });
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Customer Name"
                />
              </div>

              <div className="pos-customer-input-wrap">
                <Phone size={14} className="field-icon" />
                <input
                  type="tel"
                  className="pos-customer-input"
                  value={selectedCustomer.phone}
                  onChange={(e) => {
                    setSelectedCustomer({ ...selectedCustomer, phone: e.target.value });
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Mobile No"
                />
              </div>
            </div>

            {/* Customer Search Auto-Suggest Dropdown */}
            {showCustomerDropdown && (selectedCustomer.name.length > 1 || selectedCustomer.phone.length > 1) && (
              <div className="pos-customer-suggestions">
                <div style={{ padding: '6px 12px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Matching Directory Clients</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => setShowCustomerDropdown(false)}>✕ Close</span>
                </div>
                {allCustomers
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(selectedCustomer.name.toLowerCase()) ||
                      (c.phone && c.phone.includes(selectedCustomer.phone))
                  )
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="pos-customer-suggestion-item"
                      onClick={() => {
                        setSelectedCustomer({ id: c.id, name: c.name, phone: c.phone || '' });
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>{c.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.phone || 'No mobile listed'}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                        Select
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Cart Line Items */}
          <div className="pos-cart-items-wrapper">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '50px 20px', margin: 'auto' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  <ShoppingBag size={26} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Register Cart is Empty</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Click items from catalog or scan product barcode to add
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="pos-cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name" title={item.product_name}>{item.product_name}</div>
                    <div className="cart-item-price-desc">
                      ₹{item.unit_price.toFixed(2)} / unit {isTaxable && item.gst_rate > 0 && `&bull; ${item.gst_rate}% GST`}
                    </div>
                  </div>

                  <div className="cart-qty-controls">
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.product_id, -1)}
                      title="Decrease"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="cart-qty-val tabular">{item.quantity}</span>
                    <button
                      type="button"
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.product_id, 1)}
                      title="Increase"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div className="cart-item-total tabular">
                    ₹{(item.quantity * item.unit_price).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    className="cart-item-delete"
                    onClick={() => removeFromCart(item.product_id)}
                    title="Remove item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Financial Summary */}
          <div className="pos-cart-summary">
            <div className="summary-row">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="tabular" style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Bill Discount (₹)
              </span>
              <input
                type="number"
                min="0"
                className="pos-customer-input"
                style={{ width: '85px', padding: '3px 8px', textAlign: 'right', fontSize: '0.8125rem', height: '28px' }}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="summary-row">
              <span>
                {isTaxable ? 'GST Tax (Included/Applied)' : 'GST Tax (0% Non-Taxable)'}
              </span>
              <span className="tabular" style={{ fontWeight: 600, color: '#0f172a' }}>₹{taxAmount.toFixed(2)}</span>
            </div>

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
                className={`quick-pay-btn credit ${paymentMethod === 'credit' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('credit')}
              >
                <HandCoins size={15} /> Credit / Due
              </button>
            </div>

            <button
              type="button"
              className="complete-checkout-btn"
              onClick={() => handleCheckout(paymentMethod)}
              disabled={cart.length === 0 || isProcessingCheckout}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} />
                <span>{isProcessingCheckout ? 'Processing Bill...' : `Pay with ${paymentMethod.toUpperCase()}`}</span>
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
                  A4 Tax Invoice
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
    </div>
  );
};
