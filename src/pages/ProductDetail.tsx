import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { barcodeService } from '../services/barcodeService';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import type { Product, StockMovement } from '../types';
import { Badge } from '../components/common/Badge';
import {
  ArrowLeft,
  Edit2,
  Printer,
  History,
  Tag,
  PlusCircle,
  Package,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId, isTaxable } = useBusiness();
  const { user } = useAuth();

  const [product, setProduct] = useState<(Product & { movements?: StockMovement[] }) | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustQty, setAdjustQty] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);

  const barcodeRef = useRef<SVGSVGElement | null>(null);

  const fetchProduct = () => {
    setIsLoading(true);
    api
      .get(`/products/${id}`)
      .then((data) => {
        setProduct(data);
        if (data.barcode || data.sku) {
          barcodeService.generateQRCode(data.barcode || data.sku).then(setQrDataUrl);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && barcodeRef.current) {
      barcodeService.renderBarcode(barcodeRef.current, product.barcode || product.sku, {
        height: 48,
        displayValue: true,
      });
    }
  }, [product]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustQty || isNaN(Number(adjustQty))) return;

    try {
      await api.post(`/products/${id}/adjust-stock`, {
        quantity_change: Number(adjustQty),
        reason: adjustReason || 'Manual stock update',
        user_id: user?.id,
      });
      setAdjustMessage('Stock successfully adjusted!');
      setAdjustQty('');
      setAdjustReason('');
      setIsAdjusting(false);
      fetchProduct();
      setTimeout(() => setAdjustMessage(null), 4000);
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  if (isLoading || !product) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading product...</div>;
  }

  const attributes = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : (product.attributes || {});
  const isLow = product.stock_quantity <= product.low_stock_threshold;
  const isOut = product.stock_quantity <= 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header no-print">
        <div className="page-title-group">
          <Link
            to="/products"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Products
          </Link>
          <h1 className="page-title">
            <span>{product.name}</span>
            <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
              {product.stock_quantity} in stock
            </Badge>
          </h1>
          <p className="page-description">
            SKU: {product.sku} | Category: {product.category_name || product.type}
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setIsAdjusting((p) => !p)}>
            <PlusCircle size={16} /> Adjust Stock
          </button>
          <button type="button" className="btn btn-secondary" onClick={handlePrintLabel}>
            <Printer size={16} /> Print Label
          </button>
          <Link to={`/products/${id}/edit`} className="btn btn-inv">
            <Edit2 size={16} /> Edit Product
          </Link>
        </div>
      </div>

      {adjustMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success-text)', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>{adjustMessage}</span>
        </div>
      )}

      {/* Adjust Stock Panel */}
      {isAdjusting && (
        <form onSubmit={handleAdjustStock} className="card no-print" style={{ marginBottom: '24px', backgroundColor: 'var(--color-bg-surface-subtle)' }}>
          <div className="card-body">
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: '12px' }}>
              Quick Stock Adjustment
            </h3>
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Quantity Change (+ to add, - to subtract)</label>
                <input
                  type="number"
                  className="form-input tabular"
                  placeholder="+5 or -2"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Physical count discrepancy, damaged plant"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Apply Adjustment
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Product Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left: Financials & Specialized Attributes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Financials Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Tag size={18} color="var(--module-inv-accent)" /> Financial & Stock Overview
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div>
                  <div className="stat-label">Selling Price</div>
                  <div className="stat-value tabular" style={{ fontSize: '22px', color: 'var(--module-sell-accent)' }}>
                    ₹{Number(product.sale_price).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="stat-label">Cost Price</div>
                  <div className="stat-value tabular" style={{ fontSize: '22px' }}>
                    ₹{Number(product.cost_price).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="stat-label">GST Rate</div>
                  <div className="stat-value tabular" style={{ fontSize: '22px' }}>
                    {isTaxable ? `${Number(product.gst_rate).toFixed(0)}%` : '0% (Non-Taxable)'}
                  </div>
                </div>

                <div>
                  <div className="stat-label">Current Stock</div>
                  <div className="stat-value tabular" style={{ fontSize: '22px', color: isOut ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {product.stock_quantity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specialized Attributes Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Package size={18} color="var(--module-inv-accent)" />
                {product.type.toUpperCase()} Specifications
              </h3>
            </div>
            <div className="card-body">
              {Object.keys(attributes).length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>No category attributes specified.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {Object.entries(attributes).map(([key, val]) => (
                    <div key={key} style={{ borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '8px' }}>
                      <div style={{ fontSize: 'var(--font-xs)', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product Photo & Printable Barcode & QR Label */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Product Image Card */}
          {product.image_url ? (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ height: '220px', width: '100%', background: '#f8fafc', position: 'relative' }}>
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Product Photo</span>
                <Link to={`/products/${id}/edit`} style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Change Image</Link>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <Package size={32} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>No image uploaded</div>
              <Link to={`/products/${id}/edit`} className="btn btn-secondary btn-sm" style={{ marginTop: '8px', display: 'inline-flex' }}>
                + Add Photo
              </Link>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Barcode & Label</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  border: '1px dashed var(--color-border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  width: '100%',
                  maxWidth: '260px',
                  boxShadow: 'var(--shadow-xs)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
                  ₹{Number(product.sale_price).toFixed(2)}
                </div>

                {/* SVG Code128 Barcode */}
                <div style={{ margin: '8px 0' }}>
                  <svg ref={barcodeRef} style={{ width: '100%', height: '54px' }} />
                </div>

                {/* QR Code */}
                {qrDataUrl && (
                  <div style={{ margin: '8px 0' }}>
                    <img src={qrDataUrl} alt="Product QR" style={{ width: '100px', height: '100px' }} />
                  </div>
                )}

                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  GrowNaturals Botanical Counter
                </div>
              </div>

              <button type="button" className="btn btn-secondary btn-sm no-print" onClick={handlePrintLabel}>
                <Printer size={14} /> Print This Label
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement Audit Log */}
      <div className="card no-print">
        <div className="card-header">
          <h3 className="card-title">
            <History size={18} color="var(--module-sell-accent)" />
            Stock Movement Audit Trail
          </h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th style={{ textAlign: 'center' }}>Change</th>
                <th style={{ textAlign: 'center' }}>Previous</th>
                <th style={{ textAlign: 'center' }}>New Balance</th>
                <th>Reference</th>
                <th>Notes / Reason</th>
              </tr>
            </thead>
            <tbody>
              {(product.movements || []).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    No stock movements recorded yet.
                  </td>
                </tr>
              ) : (
                product.movements!.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 'var(--font-xs)' }}>
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td>
                      <Badge
                        variant={
                          m.type === 'purchase'
                            ? 'success'
                            : m.type === 'sale'
                            ? 'sell'
                            : m.type === 'refund'
                            ? 'warning'
                            : 'neutral'
                        }
                        style={{ textTransform: 'capitalize' }}
                      >
                        {m.type}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }} className="tabular">
                      {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                    </td>
                    <td style={{ textAlign: 'center' }} className="tabular">{m.previous_quantity}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }} className="tabular">{m.new_quantity}</td>
                    <td style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                      {m.reference_type && `${m.reference_type.toUpperCase()}: ${m.reference_id || '—'}`}
                    </td>
                    <td style={{ fontSize: 'var(--font-xs)' }}>{m.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
