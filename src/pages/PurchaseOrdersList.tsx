import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { PurchaseOrder } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { ShoppingBag, Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const PurchaseOrdersList: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const params: any = { business_id: businessId };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search.trim()) params.search = search.trim();

    api
      .get('/purchases', params)
      .then((data) => {
        if (isMounted) setOrders(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId, statusFilter, search]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Purchase Orders</span>
            <Badge variant="purch">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Stock replenishment orders for {business?.name}. Receiving orders automatically increments inventory.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/purchases/new" className="btn btn-purch">
            <Plus size={16} /> New Purchase Order
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by PO #, vendor, or supplier invoice..."
        />

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending Delivery</option>
          <option value="received">Received (Stock Added)</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading purchase orders...</div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Purchase Orders"
          description={`No purchase orders logged for ${business?.name}.`}
          actionText="Create Purchase Order"
          actionLink="/purchases/new"
          accentClass="btn-purch"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier Vendor</th>
                <th>Order Date</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th style={{ textAlign: 'right' }}>Outstanding Due</th>
                <th style={{ textAlign: 'center' }}>Delivery Status</th>
                <th style={{ textAlign: 'center' }}>Payment Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => {
                const due = Number(po.outstanding_due || 0);

                return (
                  <tr key={po.id}>
                    <td>
                      <Link to={`/purchases/${po.id}`} style={{ fontWeight: 700, color: 'var(--module-purch-accent)' }}>
                        {po.po_number}
                      </Link>
                      {po.supplier_invoice_no && (
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                          Ref: {po.supplier_invoice_no}
                        </div>
                      )}
                    </td>

                    <td style={{ fontWeight: 600 }}>{po.supplier_name}</td>

                    <td style={{ fontSize: 'var(--font-xs)' }}>
                      {new Date(po.order_date).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                      ₹{Number(po.total_amount).toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700, color: due > 0 ? '#dc2626' : '#16a34a' }} className="tabular">
                      ₹{due.toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={po.status === 'received' ? 'success' : 'warning'}>
                        {po.status === 'received' ? 'Stock Added' : 'Pending'}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={po.payment_status === 'paid' ? 'success' : po.payment_status === 'partial' ? 'warning' : 'danger'}>
                        {po.payment_status}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/purchases/${po.id}`} className="btn btn-secondary btn-sm">
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
