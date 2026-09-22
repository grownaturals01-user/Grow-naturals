import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Quotation } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Plus, ArrowRight, Lock } from 'lucide-react';

export const QuotationsList: React.FC = () => {
  const { businessId, business } = useBusiness();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
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
      .get('/quotations', params)
      .then((data) => {
        if (isMounted) setQuotations(data);
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
            <span>Quotations & Estimates</span>
            <Badge variant="sell">{business?.name}</Badge>
          </h1>
          <p className="page-description">
            Commercial proposals and estimates scoped to {business?.name}. Convert to DC or Invoice in 1 click.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/quotations/new" className="btn btn-sell">
            <Plus size={16} /> New Quotation
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by quote #, customer name, phone..."
        />

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Quotations</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="converted_to_invoice">Converted to Invoice</option>
          <option value="converted_to_dc">Converted to Challan</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading quotations...</div>
      ) : quotations.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No Quotations Found"
          description={`No quotation records found for ${business?.name}.`}
          actionText="Create First Quotation"
          actionLink="/quotations/new"
          accentClass="btn-sell"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Quote Number</th>
                <th>Customer</th>
                <th>Valid Until</th>
                <th style={{ textAlign: 'center' }}>Items</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const isConverted = q.status === 'converted_to_invoice' || q.status === 'converted_to_dc';

                return (
                  <tr key={q.id}>
                    <td>
                      <Link to={`/quotations/${q.id}`} style={{ fontWeight: 700, color: 'var(--module-sell-accent)' }}>
                        {q.quotation_number}
                      </Link>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                        Issued {new Date(q.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{q.customer_name}</div>
                      {q.customer_phone && (
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                          {q.customer_phone}
                        </div>
                      )}
                    </td>

                    <td style={{ fontSize: 'var(--font-xs)' }}>
                      {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '30 Days'}
                    </td>

                    <td style={{ textAlign: 'center' }} className="tabular">
                      {q.items?.length ?? '—'}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 800 }} className="tabular">
                      ₹{Number(q.total_amount).toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <Badge
                        variant={
                          q.status === 'converted_to_invoice'
                            ? 'success'
                            : q.status === 'converted_to_dc'
                            ? 'info'
                            : q.status === 'sent'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {isConverted && <Lock size={11} style={{ marginRight: '2px' }} />}
                        {q.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/quotations/${q.id}`} className="btn btn-secondary btn-sm">
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
