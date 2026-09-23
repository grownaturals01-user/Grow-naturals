import React, { useState } from 'react';
import type { CustomerQuotationHistory } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CustomerQuotationIntelligenceProps {
  history: CustomerQuotationHistory | null;
  isLoading?: boolean;
  compact?: boolean;
}

export const CustomerQuotationIntelligence: React.FC<CustomerQuotationIntelligenceProps> = ({
  history,
  isLoading = false,
  compact = false,
}) => {
  const [showHistoryList, setShowHistoryList] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#64748b',
          marginBottom: '16px',
        }}
      >
        <span className="animate-spin">🔄</span>
        <span>Analyzing client quotation history & conversion rate...</span>
      </div>
    );
  }

  if (!history || (!history.is_repeated && history.total_quotations === 0 && history.total_invoices_count === 0)) {
    return null;
  }

  const {
    total_quotations,
    converted_count,
    conversion_rate,
    total_quoted_amount,
    total_converted_amount,
    total_invoices_count,
    total_invoice_revenue,
    customer_tier,
    tier_label,
    advice,
    recent_quotations = [],
  } = history;

  // Colors based on tier
  const tierThemes = {
    high_value: {
      border: '#a7f3d0',
      bg: '#ecfdf5',
      badgeBg: '#10b981',
      badgeText: '#ffffff',
      icon: <Award size={16} />,
      accent: '#065f46',
    },
    regular: {
      border: '#bfdbfe',
      bg: '#eff6ff',
      badgeBg: '#2563eb',
      badgeText: '#ffffff',
      icon: <CheckCircle2 size={16} />,
      accent: '#1e40af',
    },
    quote_shopper: {
      border: '#fed7aa',
      bg: '#fff7ed',
      badgeBg: '#ea580c',
      badgeText: '#ffffff',
      icon: <AlertTriangle size={16} />,
      accent: '#9a3412',
    },
    prospect: {
      border: '#e0e7ff',
      bg: '#eef2ff',
      badgeBg: '#6366f1',
      badgeText: '#ffffff',
      icon: <Clock size={16} />,
      accent: '#3730a3',
    },
    new: {
      border: '#e2e8f0',
      bg: '#f8fafc',
      badgeBg: '#64748b',
      badgeText: '#ffffff',
      icon: <Sparkles size={16} />,
      accent: '#334155',
    },
  };

  const theme = tierThemes[customer_tier] || tierThemes.new;

  return (
    <div
      style={{
        border: `1.5px solid ${theme.border}`,
        backgroundColor: theme.bg,
        borderRadius: '12px',
        padding: compact ? '12px 14px' : '16px 18px',
        marginBottom: '18px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header with Classification Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              backgroundColor: theme.badgeBg,
              color: theme.badgeText,
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.01em',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {theme.icon}
            {tier_label}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: theme.accent }}>
            Repeated Client Profile
          </span>
        </div>

        {recent_quotations.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistoryList(!showHistoryList)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: theme.accent,
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
            }}
          >
            <span>{recent_quotations.length} Previous Quotes</span>
            {showHistoryList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Advisory Insight */}
      <div
        style={{
          fontSize: '12px',
          color: theme.accent,
          lineHeight: 1.45,
          marginBottom: '12px',
          fontWeight: 500,
        }}
      >
        {advice}
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '10px 14px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Metric 1: Quotations Count */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Quotations
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            {total_quotations}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            ₹{Math.round(total_quoted_amount).toLocaleString('en-IN')} total
          </div>
        </div>

        {/* Metric 2: Converted to Invoices */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Converted
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: converted_count > 0 ? '#16a34a' : '#ea580c',
              marginTop: '2px',
            }}
          >
            {converted_count} of {total_quotations}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            ₹{Math.round(total_converted_amount).toLocaleString('en-IN')} realized
          </div>
        </div>

        {/* Metric 3: Conversion Rate */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Conversion Rate
          </div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: conversion_rate >= 50 ? '#16a34a' : conversion_rate > 0 ? '#0284c7' : '#ea580c',
              marginTop: '2px',
            }}
          >
            {conversion_rate}%
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            {converted_count === 0 ? '0 confirmed orders' : `${converted_count} orders won`}
          </div>
        </div>

        {/* Metric 4: Lifetime Invoices & Revenue */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
            Invoices Spent
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
            ₹{Math.round(total_invoice_revenue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            {total_invoices_count} billed invoice{total_invoices_count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Expandable History Drawer */}
      {showHistoryList && recent_quotations.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.accent, marginBottom: '8px' }}>
            Previous Commercial Proposals:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recent_quotations.map((q) => {
              const isConverted =
                q.status === 'converted_to_invoice' || (q.converted_id && q.converted_id.trim() !== '');
              return (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link
                      to={`/quotations/${q.id}`}
                      target="_blank"
                      style={{
                        fontWeight: 700,
                        color: '#0f172a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        textDecoration: 'none',
                      }}
                    >
                      {q.quotation_number}
                      <ExternalLink size={11} color="#64748b" />
                    </Link>
                    <span style={{ color: '#64748b' }}>
                      {new Date(q.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#0f172a' }}>
                      ₹{Number(q.total_amount).toLocaleString('en-IN')}
                    </strong>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: isConverted ? '#ecfdf5' : '#fff7ed',
                        color: isConverted ? '#047857' : '#c2410c',
                        border: `1px solid ${isConverted ? '#a7f3d0' : '#fed7aa'}`,
                      }}
                    >
                      {isConverted ? 'Converted to Invoice ✅' : 'Unconverted (Draft) ⏳'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const CustomerConversionBadge: React.FC<{
  totalQuotes?: number;
  convertedQuotes?: number;
}> = ({ totalQuotes = 0, convertedQuotes = 0 }) => {
  if (!totalQuotes || totalQuotes <= 0) return null;

  const rate = Math.round((convertedQuotes / totalQuotes) * 100);

  let bg = '#f1f5f9';
  let color = '#475569';
  let border = '#cbd5e1';
  let label = `${convertedQuotes}/${totalQuotes} converted`;

  if (totalQuotes === 1) {
    if (convertedQuotes === 1) {
      bg = '#ecfdf5';
      color = '#047857';
      border = '#a7f3d0';
      label = '1/1 converted (100%)';
    } else {
      bg = '#f8fafc';
      color = '#64748b';
      border = '#e2e8f0';
      label = '1st quote';
    }
  } else if (rate >= 60) {
    bg = '#ecfdf5';
    color = '#047857';
    border = '#a7f3d0';
    label = `⭐ ${convertedQuotes}/${totalQuotes} converted (${rate}%)`;
  } else if (rate > 0) {
    bg = '#eff6ff';
    color = '#1d4ed8';
    border = '#bfdbfe';
    label = `${convertedQuotes}/${totalQuotes} converted (${rate}%)`;
  } else {
    bg = '#fff7ed';
    color = '#c2410c';
    border = '#fed7aa';
    label = `⚠️ ${totalQuotes} quotes (0 converted)`;
  }

  return (
    <span
      title={`Customer quotation conversion history: ${convertedQuotes} of ${totalQuotes} quotes turned into invoices (${rate}%)`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 7px',
        borderRadius: '999px',
        fontSize: '10px',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        marginTop: '3px',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  );
};
