import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Product, QuotationItem } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, FileSpreadsheet } from 'lucide-react';
import { ProductSearchSelect } from '../components/common/ProductSearchSelect';

export const QuotationNew: React.FC = () => {
  const { businessId, business, isTaxable } = useBusiness();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
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
  }, [businessId]);

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
          {/* Customer & Validity */}
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Customer / Client Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Oberoi Luxury Resorts, Anita Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input tabular"
                placeholder="+91 98220 12345"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proposal Valid Until</label>
              <input
                type="date"
                className="form-input tabular"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
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

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                <span>{isTaxable ? 'GST Tax Total:' : 'GST Tax (0%):'}</span>
                <span className="tabular">₹{taxAmount.toFixed(2)}</span>
              </div>

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
