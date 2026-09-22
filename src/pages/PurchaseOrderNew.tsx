import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Supplier, Product } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, ShoppingBag, CheckSquare } from 'lucide-react';

export const PurchaseOrderNew: React.FC = () => {
  const { businessId, business } = useBusiness();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [taxAmount, setTaxAmount] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [autoReceive, setAutoReceive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const [items, setItems] = useState<Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>>([
    { product_id: '', product_name: '', quantity: 10, unit_price: 0 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    api.get('/suppliers').then(setSuppliers).catch(console.warn);
    api.get('/products', { business_id: businessId }).then(setProducts).catch(console.warn);
  }, [businessId]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { product_id: '', product_name: '', quantity: 1, unit_price: 0 }]);
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
        unit_price: Number(matched.cost_price),
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

  const subtotal = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const grandTotal = subtotal + (Number(taxAmount) || 0);
  const due = Math.max(0, grandTotal - (Number(paidAmount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert('Please select a supplier.');
      return;
    }

    const validItems = items.filter((i) => i.product_name.trim());
    if (validItems.length === 0) {
      alert('Please add at least one line item to purchase.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/purchases', {
        business_id: businessId,
        supplier_id: supplierId,
        supplier_invoice_no: supplierInvoiceNo.trim(),
        order_date: orderDate,
        delivery_date: deliveryDate || null,
        tax_amount: Number(taxAmount) || 0,
        paid_amount: Number(paidAmount) || 0,
        auto_receive: autoReceive,
        notes: notes.trim(),
        items: validItems,
      });

      navigate(`/purchases/${res.id}`);
    } catch (err: any) {
      alert(`Error creating purchase order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <Link
            to="/purchases"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Purchase Orders
          </Link>
          <h1 className="page-title">
            <span>New Purchase Order ({business?.name})</span>
          </h1>
          <p className="page-description">
            Restock nursery inventory, record incoming vendor bills, and track supplier balances.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Supplier Partner <span className="required">*</span></label>
              <select
                className="form-select"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                autoFocus
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.payment_terms || 'Net 30'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Vendor Invoice / Bill #</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. INV-2026-99"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input
                type="date"
                className="form-input tabular"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '20px 0' }} />

          {/* Line Items */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--module-purch-accent)' }}>
              Stock Items to Receive
            </h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItem}>
              <Plus size={14} /> Add Product Line
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 3fr 1fr 1.5fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <select
                  className="form-select"
                  value={item.product_id}
                  onChange={(e) => handleProductSelect(idx, e.target.value)}
                >
                  <option value="">Choose Existing Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Cur. Stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  className="form-input"
                  placeholder="Item Name"
                  value={item.product_name}
                  onChange={(e) => handleUpdateItem(idx, 'product_name', e.target.value)}
                  required
                />

                <input
                  type="number"
                  min="1"
                  className="form-input tabular"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                  required
                />

                <input
                  type="number"
                  step="0.01"
                  className="form-input tabular"
                  placeholder="Cost Rate (₹)"
                  value={item.unit_price}
                  onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))}
                  required
                />

                <div className="tabular" style={{ fontWeight: 700, textAlign: 'right' }}>
                  ₹{((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                </div>

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

          {/* Auto Receive Checkbox */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--module-inv-subtle)',
              border: '1px solid var(--module-inv-border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <input
              type="checkbox"
              id="autoReceive"
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              checked={autoReceive}
              onChange={(e) => setAutoReceive(e.target.checked)}
            />
            <label htmlFor="autoReceive" style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--module-inv-text)', cursor: 'pointer' }}>
              Automatically increase stock in {business?.name} inventory immediately upon saving
            </label>
          </div>

          {/* Financials & Balance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div className="form-group">
              <label className="form-label">Delivery Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Gate delivery notes, batch numbers, nursery transport notes..."
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
                <span>Vendor Tax (₹):</span>
                <input
                  type="number"
                  step="0.01"
                  className="form-input tabular"
                  style={{ width: '90px', padding: '2px 6px', textAlign: 'right' }}
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-sm)' }}>
                <span>Amount Paid Now (₹):</span>
                <input
                  type="number"
                  step="0.01"
                  className="form-input tabular"
                  style={{ width: '90px', padding: '2px 6px', textAlign: 'right' }}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>

              <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-md)', fontWeight: 700 }}>
                <span>Total Bill:</span>
                <span className="tabular">₹{grandTotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-md)', fontWeight: 800, color: due > 0 ? '#dc2626' : '#16a34a' }}>
                <span>Outstanding Due:</span>
                <span className="tabular">₹{due.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <Link to="/purchases" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-purch" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
};
