import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Product, QuotationItem, CustomerQuotationHistory, Customer } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  Users,
  User,
  ChevronDown
} from 'lucide-react';
import { ProductSearchSelect } from '../components/common/ProductSearchSelect';
import { CustomerQuotationIntelligence } from '../components/quotations/CustomerQuotationIntelligence';

export const QuotationNew: React.FC = () => {
  const { businessId, business, isTaxable } = useBusiness();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState<boolean>(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [customerGstin, setCustomerGstin] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [isFetchingGst, setIsFetchingGst] = useState<boolean>(false);
  const [gstFeedback, setGstFeedback] = useState<{ status: 'idle' | 'success' | 'warning' | 'error'; message: string; state?: string } | null>(null);

  // Customer conversion history intelligence state
  const [customerHistory, setCustomerHistory] = useState<CustomerQuotationHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const historyDebounceRef = useRef<any>(null);

  const [validUntil, setValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('Valid for 30 days from proposal date. Transportation charges extra.');
  const [discount, setDiscount] = useState<string>('0');

  // Line items
  const [items, setItems] = useState<Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    gst_rate: number;
  }>>([
    { product_id: '', product_name: '', quantity: 1, unit_price: 0, gst_rate: isTaxable ? 12 : 0 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    api.get('/products', { business_id: businessId }).then(setProducts).catch(console.warn);
    api.get('/customers').then((data) => {
      if (Array.isArray(data)) setExistingCustomers(data);
    }).catch(console.warn);
  }, [businessId]);

  // Click outside listener for customer dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    if (c.phone) setCustomerPhone(c.phone);
    if (c.gstin) setCustomerGstin(c.gstin);
    if (c.address) setCustomerAddress(c.address);
    setShowCustomerSuggestions(false);

    // Immediately trigger customer history lookup
    const cleanPhone = (c.phone || '').replace(/\D/g, '');
    const cleanName = c.name.trim();
    const cleanGst = (c.gstin || '').trim();

    setIsLoadingHistory(true);
    api.get('/quotations/customer-history', {
      phone: cleanPhone || undefined,
      name: cleanName || undefined,
      gstin: cleanGst || undefined,
    }).then((hist) => {
      setCustomerHistory(hist);
    }).catch(console.warn)
      .finally(() => setIsLoadingHistory(false));
  };

  const filteredCustomers = existingCustomers.filter((c) => {
    if (!customerName.trim()) return true;
    const term = customerName.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term)) ||
      (c.gstin && c.gstin.toLowerCase().includes(term))
    );
  });

  // Debounced Customer Intelligence Fetch
  useEffect(() => {
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const cleanName = customerName.trim();
    const cleanGst = customerGstin.trim();

    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }

    if (cleanPhone.length < 7 && cleanName.length < 3 && cleanGst.length < 10) {
      setCustomerHistory(null);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    historyDebounceRef.current = setTimeout(async () => {
      try {
        const data: CustomerQuotationHistory = await api.get('/quotations/customer-history', {
          phone: cleanPhone || undefined,
          name: cleanName || undefined,
          gstin: cleanGst || undefined,
        });
        setCustomerHistory(data);
      } catch (err) {
        console.warn('Could not fetch customer quotation intelligence:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }, 400);

    return () => {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    };
  }, [customerPhone, customerName, customerGstin]);

  // GST Number Auto Fetch Details Handler
  const handleFetchGstDetails = async (inputGstin?: string) => {
    const cleanGst = (inputGstin !== undefined ? inputGstin : customerGstin).trim().toUpperCase();
    if (!cleanGst) return;

    if (cleanGst.length !== 15) {
      setGstFeedback({
        status: 'warning',
        message: `GSTIN must be exactly 15 characters (currently ${cleanGst.length}/15)`,
      });
      return;
    }

    setIsFetchingGst(true);
    setGstFeedback(null);

    try {
      const res: any = await api.get(`/gst/lookup/${cleanGst}`);
      if (res && res.success) {
        if (res.customer_name || res.trade_name || res.legal_name) {
          const fetchedName = res.trade_name || res.legal_name || res.customer_name;
          setCustomerName(fetchedName);
          if (res.phone && !customerPhone) setCustomerPhone(res.phone);
          if (res.address) setCustomerAddress(res.address);

          setGstFeedback({
            status: 'success',
            message: `Verified: ${fetchedName} (${res.state || 'Registered'})`,
            state: res.state,
          });
        } else {
          setGstFeedback({
            status: 'success',
            message: `Valid Indian GSTIN Structure • State: ${res.state || 'India'} (${res.entity_type || 'Business'})`,
            state: res.state,
          });
        }
      } else {
        setGstFeedback({
          status: 'error',
          message: res.error || 'Could not verify GSTIN details.',
        });
      }
    } catch (err: any) {
      setGstFeedback({
        status: 'error',
        message: err.message || 'Error looking up GSTIN.',
      });
    } finally {
      setIsFetchingGst(false);
    }
  };

  // Debounced auto-fetch on typing 15 characters
  const debounceTimerRef = useRef<any>(null);
  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setCustomerGstin(val);
    setGstFeedback(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.length === 15) {
      debounceTimerRef.current = setTimeout(() => {
        handleFetchGstDetails(val);
      }, 350);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { product_id: '', product_name: '', quantity: 1, unit_price: 0, gst_rate: isTaxable ? 12 : 0 },
    ]);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const matched = products.find((p) => p.id === productId);
    if (!matched) return;

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        product_id: matched.id,
        product_name: matched.name,
        quantity: copy[index].quantity || 1,
        unit_price: Number(matched.sale_price),
        gst_rate: isTaxable ? Number(matched.gst_rate) : 0,
      };
      return copy;
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Computations
  const subtotal = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const taxAmount = isTaxable
    ? items.reduce((acc, i) => {
        const line = (Number(i.quantity) || 0) * (Number(i.unit_price) || 0);
        return acc + (line * (Number(i.gst_rate) || 0)) / 100;
      }, 0)
    : 0;

  const totalAmount = Math.max(0, subtotal + taxAmount - (Number(discount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please specify customer / client name.');
      return;
    }

    const validItems = items.filter((i) => i.product_name.trim());
    if (validItems.length === 0) {
      alert('Please add at least one line item with description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/quotations', {
        business_id: businessId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_gstin: customerGstin.trim().toUpperCase(),
        customer_address: customerAddress.trim(),
        valid_until: validUntil || null,
        items: validItems,
        discount: Number(discount) || 0,
        notes: notes.trim(),
      });

      navigate(`/quotations/${res.id}`);
    } catch (err: any) {
      alert(`Error creating quotation: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <Link
            to="/quotations"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Quotations
          </Link>
          <h1 className="page-title">
            <span>New Commercial Quotation ({business?.name})</span>
          </h1>
          <p className="page-description">
            Create an official estimate for plants, landscaping materials, or corporate supply.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          {/* Client Details Section */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--module-sell-accent)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} /> Client / Customer Information
            </h3>

            {/* Row 1: GST Number & Auto-Fetch */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Client GST Number (GSTIN)
                  </label>
                  {customerGstin.length > 0 && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {customerGstin.length}/15 chars
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input tabular"
                    placeholder="e.g. 33AABCT1332L1ZV"
                    value={customerGstin}
                    onChange={handleGstinChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchGstDetails();
                      }
                    }}
                    maxLength={15}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleFetchGstDetails()}
                    disabled={isFetchingGst || customerGstin.length < 15}
                    title="Auto-fetch registered company name and details from GSTIN"
                    style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 12px' }}
                  >
                    {isFetchingGst ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Fetching...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} color="#0284c7" /> Auto Fetch
                      </>
                    )}
                  </button>
                </div>

                {/* GST Verification Feedback Pill */}
                {gstFeedback && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color:
                        gstFeedback.status === 'success'
                          ? '#15803d'
                          : gstFeedback.status === 'warning'
                          ? '#b45309'
                          : '#dc2626',
                    }}
                  >
                    {gstFeedback.status === 'success' ? (
                      <CheckCircle2 size={13} color="#16a34a" />
                    ) : (
                      <AlertCircle size={13} />
                    )}
                    <span>{gstFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Customer / Client Name with Autocomplete & Verified Buyer Indicator */}
              <div className="form-group" style={{ marginBottom: 0, position: 'relative' }} ref={customerDropdownRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Customer / Client Name <span className="required">*</span></span>
                  </label>
                  
                  {/* Real-time Verified Buyer / Tier Badge */}
                  {customerHistory && (customerHistory.customer_tier === 'high_value' || customerHistory.customer_tier === 'regular' || (customerHistory.converted_count && customerHistory.converted_count > 0)) ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#047857',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={`Verified Repeat Buyer • ${customerHistory.converted_count} of ${customerHistory.total_quotations} quotes converted to invoices`}
                    >
                      <CheckCircle2 size={12} color="#10b981" /> Verified Buyer ({customerHistory.conversion_rate}%)
                    </span>
                  ) : customerHistory?.customer_tier === 'quote_shopper' ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#c2410c',
                        backgroundColor: '#fff7ed',
                        border: '1px solid #fed7aa',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={`0 of ${customerHistory.total_quotations} quotes converted to invoices`}
                    >
                      <AlertCircle size={12} color="#ea580c" /> Quote Shopper (0 converted)
                    </span>
                  ) : null}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Oberoi Luxury Resorts, Anita Sharma (type to search)"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowCustomerSuggestions(true);
                    }}
                    onFocus={() => setShowCustomerSuggestions(true)}
                    required
                    autoFocus
                    style={{ paddingRight: '32px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerSuggestions((v) => !v)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Browse saved customers directory"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Existing Saved Customers Dropdown List */}
                {showCustomerSuggestions && existingCustomers.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      marginTop: '4px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748b',
                        backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={13} color="#0284c7" /> Saved Customers ({filteredCustomers.length})
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Click to auto-fill</span>
                    </div>

                    {filteredCustomers.length === 0 ? (
                      <div style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                        No saved customer matching "{customerName}". You can continue typing to create a new client.
                      </div>
                    ) : (
                      filteredCustomers.map((c) => {
                        const hasInvoices = (c.invoice_count || 0) > 0 || Number(c.total_spent || 0) > 0;
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            style={{
                              padding: '10px 12px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f9ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                                  {c.name}
                                </span>
                                {hasInvoices && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      backgroundColor: '#ecfdf5',
                                      color: '#047857',
                                      border: '1px solid #a7f3d0',
                                      padding: '1px 6px',
                                      borderRadius: '999px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                    }}
                                  >
                                    <CheckCircle2 size={10} color="#10b981" /> Verified Buyer
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                {c.phone && <span>📞 {c.phone}</span>}
                                {c.gstin && <span style={{ fontFamily: 'monospace' }}>GST: {c.gstin}</span>}
                              </div>
                            </div>

                            {hasInvoices && (
                              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                                <div style={{ fontWeight: 700, color: '#047857' }}>
                                  ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b' }}>
                                  {c.invoice_count} invoice(s)
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Phone Number & Validity */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input tabular"
                  placeholder="+91 98220 12345"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Proposal Valid Until</label>
                <input
                  type="date"
                  className="form-input tabular"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            {/* Customer Intelligence & Conversion Profiling */}
            <div style={{ marginTop: '16px' }}>
              <CustomerQuotationIntelligence history={customerHistory} isLoading={isLoadingHistory} />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

          {/* Line Items Builder */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--module-sell-accent)' }}>
              Quoted Items & Materials
            </h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
              <Plus size={14} /> Add Another Line
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '4fr 1.2fr 1.5fr 1.5fr auto',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {/* Searchable Product Select */}
                <ProductSearchSelect
                  products={products}
                  value={item.product_name}
                  selectedProductId={item.product_id}
                  onChange={(name, prod) => {
                    if (prod) {
                      handleProductSelect(idx, prod.id);
                    } else {
                      handleUpdateItem(idx, 'product_name', name);
                    }
                  }}
                  placeholder="Search item or enter description..."
                />

                {/* Qty */}
                <input
                  type="number"
                  min="1"
                  className="form-input tabular"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                  required
                />

                {/* Unit Price */}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input tabular"
                  placeholder="Rate (₹)"
                  value={item.unit_price}
                  onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))}
                  required
                />

                {/* Line Total */}
                <div className="tabular" style={{ fontWeight: 700, textAlign: 'right' }}>
                  ₹{((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                </div>

                {/* Delete */}
                <button
                  type="button"
                  className="btn btn-danger-subtle btn-sm btn-icon-only"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

          {/* Notes & Totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div className="form-group">
              <label className="form-label">Terms & Conditions / Special Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                <span>Subtotal:</span>
                <span className="tabular">₹{subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-sm)' }}>
                <span>Special Discount (₹):</span>
                <input
                  type="number"
                  className="form-input tabular"
                  style={{ width: '90px', padding: '2px 6px', textAlign: 'right' }}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              {isTaxable && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span>GST Tax Total:</span>
                  <span className="tabular">₹{taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-lg)', fontWeight: 800 }}>
                <span>Estimated Total:</span>
                <span className="tabular" style={{ color: 'var(--module-sell-accent)' }}>
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <Link to="/quotations" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-sell" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Creating...' : 'Save & Issue Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
};
