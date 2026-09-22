import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Supplier } from '../types';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Link } from 'react-router-dom';
import { Building2, Plus, Phone, Mail, Edit2, ArrowRight } from 'lucide-react';

export const SuppliersList: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    api
      .get('/suppliers', { search: search.trim() })
      .then((data) => {
        if (isMounted) setSuppliers(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">
            <span>Suppliers Directory</span>
            <Badge variant="neutral">Shared Directory</Badge>
          </h1>
          <p className="page-description">
            Supplier partners shared across Grow Naturals & Nikhlesh Nursery. Track order volumes and outstanding balances.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/suppliers/new" className="btn btn-purch">
            <Plus size={16} /> Add Supplier
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search suppliers by vendor name, contact person, or phone..."
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Suppliers Found"
          description="No suppliers registered yet."
          actionText="Add Supplier"
          actionLink="/suppliers/new"
          accentClass="btn-purch"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Supplier Company</th>
                <th>Contact Person</th>
                <th>Phone / Email</th>
                <th>Payment Terms</th>
                <th style={{ textAlign: 'center' }}>Total Orders</th>
                <th style={{ textAlign: 'right' }}>Total Purchased</th>
                <th style={{ textAlign: 'right' }}>Outstanding Due</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const due = Number(s.outstanding_due || 0);

                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.name}</div>
                      {s.gstin && (
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>
                          GSTIN: {s.gstin}
                        </div>
                      )}
                    </td>

                    <td>{s.contact_person || '—'}</td>

                    <td>
                      <div style={{ fontSize: 'var(--font-xs)' }}>{s.phone || '—'}</div>
                      {s.email && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{s.email}</div>}
                    </td>

                    <td>
                      <Badge variant="neutral">{s.payment_terms || 'Standard'}</Badge>
                    </td>

                    <td style={{ textAlign: 'center' }} className="tabular">
                      {s.total_po_count || 0} POs
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="tabular">
                      ₹{Number(s.total_purchased || 0).toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700, color: due > 0 ? '#dc2626' : '#16a34a' }} className="tabular">
                      ₹{due.toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/suppliers/${s.id}/edit`} className="btn btn-secondary btn-sm">
                        <Edit2 size={12} /> Edit
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
