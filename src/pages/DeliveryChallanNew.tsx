import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Project, Product, Customer } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { ProductSearchSelect } from '../components/common/ProductSearchSelect';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Truck,
  User,
  Phone,
  Calendar,
  IndianRupee,
  AlertCircle,
  Building2,
  FileText,
  Loader2,
  PackageCheck
} from 'lucide-react';

export const DeliveryChallanNew: React.FC = () => {
  const { businessId, business } = useBusiness();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingCustomerDue, setExistingCustomerDue] = useState<number | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [notes, setNotes] = useState<string>('Delivered in good condition. Payment due upon final inspection / invoice.');

  // Items with pricing
  const [items, setItems] = useState<Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total: number;
  }>>([
    { product_id: '', product_name: '', quantity: 1, unit: 'Nos', unit_price: 0, total: 0 },
  ]);

  // Payment on Delivery options
  const [paymentOption, setPaymentOption] = useState<'credit' | 'partial' | 'paid'>('credit');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get('/projects', { business_id: businessId }).then(setProjects).catch(console.warn);
    api.get('/products', { business_id: businessId }).then(setProducts).catch(console.warn);
    api.get('/customers', { business_id: businessId }).then(setCustomers).catch(console.warn);
  }, [businessId]);

  // Check customer dues when customer is selected
  const handleSelectCustomer = (selectedId: string) => {
    setCustomerId(selectedId);
    const found = customers.find((c) => c.id === selectedId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');

      // Fetch customer's outstanding DC dues
      api.get('/delivery-challans/customers-summary', { business_id: businessId, search: found.name })
        .then((summaries: any[]) => {
          const match = summaries.find((s) => s.customer_name.toLowerCase() === found.name.toLowerCase());
          setExistingCustomerDue(match ? match.total_due_balance : 0);
        })
        .catch(() => setExistingCustomerDue(null));
    } else {
      setExistingCustomerDue(null);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { product_id: '', product_name: '', quantity: 1, unit: 'Nos', unit_price: 0, total: 0 },
    ]);
  };

  const handleProductSelect = (index: number, product: Product) => {
    setItems((prev) => {
      const copy = [...prev];
      const qty = copy[index].quantity || 1;
      const price = Number(product.sale_price) || 0;
      copy[index] = {
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit: copy[index].unit || 'Nos',
        unit_price: price,
        total: qty * price,
      };
      return copy;
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const updated = { ...copy[index], [field]: value };
      const qty = Number(updated.quantity) || 0;
      const price = Number(updated.unit_price) || 0;
      updated.total = qty * price;
      copy[index] = updated;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      setItems([{ product_id: '', product_name: '', quantity: 1, unit: 'Nos', unit_price: 0, total: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Grand Total calculation
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('Customer / Consignee name is required.');
      return;
    }

    const validItems = items.filter((i) => i.product_name.trim());
    if (validItems.length === 0) {
      setErrorMessage('Please add at least one material line item to dispatch.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    let finalPaidAmount = 0;
    if (paymentOption === 'paid') {
      finalPaidAmount = totalAmount;
    } else if (paymentOption === 'partial') {
      finalPaidAmount = Number(paidAmount) || 0;
    }

    try {
      const res = await api.post('/delivery-challans', {
        business_id: businessId,
        customer_id: customerId || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        project_id: projectId || null,
        dispatch_date: dispatchDate,
        vehicle_no: vehicleNo.trim(),
        driver_name: driverName.trim(),
        notes: notes.trim(),
        paid_amount: finalPaidAmount,
        payment_method: finalPaidAmount > 0 ? paymentMethod : '',
        items: validItems,
      });

      navigate(`/delivery-challans/${res.id}`);
    } catch (err: any) {
      setErrorMessage(`Error creating Delivery Challan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', width: '100%', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-title-group">
          <Link
            to="/delivery-challans"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginBottom: '6px'
            }}
          >
            <ArrowLeft size={15} /> Back to Delivery Challans
          </Link>
          <h1 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>
            <span>New Delivery Challan ({business?.name})</span>
          </h1>
          <p className="page-description" style={{ fontSize: '0.8125rem', marginTop: '3px' }}>
            Dispatch goods to customer or project site. Unpaid items are logged as outstanding customer dues.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-danger-subtle)',
            color: 'var(--color-danger-text)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="card-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. Customer & Consignee Information */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: 'var(--module-sell-accent)' }} /> Customer / Consignee Details
            </h3>

            <div className="form-grid-3" style={{ gap: '12px 16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Select Existing Customer (Optional)</label>
                <select
                  className="form-select"
                  value={customerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Customer / Client Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Oberoi Luxury Suites, Priya Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone / Contact</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Existing Dues Indicator */}
            {existingCustomerDue !== null && existingCustomerDue > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--module-sell-subtle)',
                  color: 'var(--module-sell-text)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--module-sell-border)',
                  marginTop: '10px',
                  fontSize: '0.78rem'
                }}
              >
                <AlertCircle size={15} />
                <span>
                  <strong>Notice:</strong> This customer already has <strong>₹{existingCustomerDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> in previous unpaid delivery challans. This new challan will be appended to their ledger.
                </span>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* 2. Dispatch, Project & Transit Info */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck size={14} style={{ color: 'var(--module-sell-accent)' }} /> Transport & Dispatch Info
            </h3>

            <div className="form-grid-3" style={{ gap: '12px 16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Linked Project (Optional)</label>
                <select
                  className="form-select"
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    const p = projects.find((pr) => pr.id === e.target.value);
                    if (p && !customerName) {
                      setCustomerName(p.client_name);
                    }
                  }}
                >
                  <option value="">None / Direct Sale Delivery</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Dispatch Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vehicle No / Transit ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MH 12 AB 1234 / Handover"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* 3. Items Table with Searchable Combobox & Sizing */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageCheck size={14} style={{ color: 'var(--module-sell-accent)' }} /> Dispatched Items & Materials
              </h3>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
                style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px' }}
              >
                <Plus size={13} /> Add Item Row
              </button>
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <table className="table" style={{ fontSize: '0.8125rem', margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-surface-subtle)' }}>
                    <th style={{ width: '42%' }}>Product / Description</th>
                    <th style={{ width: '13%' }}>Quantity</th>
                    <th style={{ width: '16%' }}>Unit</th>
                    <th style={{ width: '14%', textAlign: 'right' }}>Rate / Unit (₹)</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>Total (₹)</th>
                    <th style={{ width: '3%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ position: 'relative' }}>
                        <ProductSearchSelect
                          products={products}
                          value={item.product_name}
                          selectedProductId={item.product_id}
                          onChange={(name, prod) => {
                            if (prod) {
                              handleProductSelect(idx, prod);
                            } else {
                              handleUpdateItem(idx, 'product_name', name);
                            }
                          }}
                          placeholder="Search product name or SKU..."
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-input tabular"
                          style={{ height: '36px', padding: '6px 10px', fontSize: '0.8125rem' }}
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          required
                        />
                      </td>

                      <td>
                        <select
                          className="form-select"
                          style={{ height: '36px', padding: '6px 28px 6px 10px', fontSize: '0.8125rem', width: '100%' }}
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                        >
                          <option value="Nos">Nos / Pots</option>
                          <option value="Bags">Bags / Sacks</option>
                          <option value="Pcs">Pieces</option>
                          <option value="Kg">Kilograms (Kg)</option>
                          <option value="Ltr">Liters (Ltr)</option>
                          <option value="Sq.Ft">Sq.Ft (Lawn)</option>
                          <option value="Truck">Truck Load</option>
                        </select>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input tabular"
                          style={{ height: '36px', padding: '6px 10px', fontSize: '0.8125rem', textAlign: 'right' }}
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </td>

                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                        ₹{(item.total || 0).toFixed(2)}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Value Summary Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '20px',
                marginTop: '12px',
                padding: '12px 18px',
                backgroundColor: 'var(--color-bg-surface-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Challan Value:
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', marginLeft: '10px' }} className="tabular">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

          {/* 4. Payment & Due Terms */}
          <div>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IndianRupee size={14} style={{ color: 'var(--module-sell-accent)' }} /> Payment & Due Settlement Terms
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <button
                type="button"
                className={`category-card-btn ${paymentOption === 'credit' ? 'active' : ''}`}
                onClick={() => setPaymentOption('credit')}
                style={{ padding: '10px 14px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>📦 Deliver on Credit / Unpaid</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    ₹0 received now. Full ₹{totalAmount.toFixed(2)} logged as customer due.
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`category-card-btn ${paymentOption === 'partial' ? 'active' : ''}`}
                onClick={() => setPaymentOption('partial')}
                style={{ padding: '10px 14px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>💵 Advance / Partial Paid</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Record upfront token/advance with remainder on due.
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`category-card-btn ${paymentOption === 'paid' ? 'active' : ''}`}
                onClick={() => setPaymentOption('paid')}
                style={{ padding: '10px 14px' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>✅ Fully Paid on Delivery</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Full payment received upon truck dispatch/unloading.
                  </span>
                </div>
              </button>
            </div>

            {paymentOption !== 'credit' && (
              <div className="form-grid-2" style={{ gap: '12px 16px', padding: '12px 16px', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    {paymentOption === 'paid' ? 'Full Payment Amount (₹)' : 'Advance Paid Amount (₹)'}
                  </label>
                  <div className="input-addon-group">
                    <span className="input-addon-prefix">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={totalAmount}
                      className="form-input tabular"
                      value={paymentOption === 'paid' ? totalAmount : paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      disabled={paymentOption === 'paid'}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">💵 Cash Handover</option>
                    <option value="upi">📱 UPI / QR Code</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="card">💳 Card</option>
                    <option value="cheque">📝 Cheque</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 5. Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dispatch Notes & Delivery Instructions</label>
            <input
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Unload at back lawn gate, verify plant count with site supervisor"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="card-footer" style={{ padding: '12px 24px' }}>
          <Link to="/delivery-challans" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.8125rem' }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-sell"
            disabled={isSubmitting}
            style={{
              padding: '8px 22px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Issuing Challan...
              </>
            ) : (
              <>
                <Save size={15} /> Issue Delivery Challan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
