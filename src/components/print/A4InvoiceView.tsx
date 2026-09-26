import React, { useState, useRef } from 'react';
import type { Invoice } from '../../types';
import { printService } from '../../services/printService';
import { Printer, Download, Send, Copy, Check, ExternalLink, X, Loader2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import gnLogo from '../../assets/grownaturalslogo.jpeg';
import { useBusiness } from '../../context/BusinessContext';

interface A4InvoiceViewProps {
  invoice: Invoice;
}

export const A4InvoiceView: React.FC<A4InvoiceViewProps> = ({ invoice }) => {
  const { businesses } = useBusiness();
  const matchedBiz = businesses.find(b => b.id === invoice.business_id);
  const isTaxable = matchedBiz?.is_taxable !== undefined
    ? Boolean(matchedBiz.is_taxable)
    : (Number(invoice.tax_amount || 0) > 0 || invoice.business_id === 'grow-naturals');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(
    invoice.customer_phone ? (invoice.customer_phone.replace(/\D/g, '').length === 10 ? `91${invoice.customer_phone.replace(/\D/g, '')}` : invoice.customer_phone.replace(/\D/g, '')) : ''
  );
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);

  const handleOpenWhatsAppModal = () => {
    const bizName = invoice.business_legal_name || invoice.business_name || (isTaxable ? 'Grow Naturals Pvt Ltd' : 'Nikhlesh Nursery');
    const itemsSummary = (invoice.items || [])
      .map((it, idx) => `${idx + 1}. *${it.product_name}* (Qty: ${it.quantity}) — ₹${Number(it.total).toFixed(2)}`)
      .join('\n');

    const paymentMethodText = invoice.payment_method === 'split'
      ? `SPLIT (Cash: ₹${Number(invoice.split_cash_amount || 0).toFixed(2)} + UPI: ₹${Number(invoice.split_upi_amount || 0).toFixed(2)})`
      : (invoice.payment_method || 'Cash').toUpperCase();

    const msg = [
      `🧾 *TAX INVOICE — ${bizName.toUpperCase()}* 🧾`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Invoice No:* #${invoice.invoice_number}`,
      `*Customer:* ${invoice.customer_name || 'Valued Customer'}`,
      `*Date:* ${new Date(invoice.created_at).toLocaleDateString('en-IN')}`,
      `*Payment Status:* ${invoice.payment_status.toUpperCase()}`,
      `*Payment Method:* ${paymentMethodText}`,
      ``,
      `*Items Summary:*`,
      itemsSummary,
      ``,
      `*Grand Total:* *₹${Number(invoice.total_amount).toFixed(2)}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Thank you for your business! 🌱`
    ].join('\n');

    setWhatsappMessage(msg);
    setWhatsappModalOpen(true);
  };

  const handleSendWhatsAppDirect = () => {
    const cleanPhone = whatsappPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(whatsappMessage);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!sheetRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.warn('PDF generation fallback to print:', err);
      printService.printBrowser();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          onClick={handleOpenWhatsAppModal}
          style={{
            backgroundColor: '#25D366',
            color: '#ffffff',
            borderColor: '#25D366',
            fontSize: '0.8125rem',
            fontWeight: 700,
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
          }}
        >
          <Send size={15} /> Send to WhatsApp
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
          {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => printService.printBrowser()}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Printer size={15} />
          Print
        </button>
      </div>

      <div ref={sheetRef} className="a4-invoice-sheet a4-invoice-container">
        {/* Invoice Branding Header */}
        <div className="invoice-branding-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', maxWidth: '65%' }}>
            <img
              src={gnLogo}
              alt="Grow Naturals Logo"
              className="invoice-header-logo"
              loading="eager"
            />
            <div>
              <h1 className="invoice-biz-title">
                {invoice.business_legal_name || invoice.business_name || (isTaxable ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm')}
              </h1>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                {invoice.business_address || 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu'}
              </p>
              <p style={{ fontSize: '13px', color: '#475569' }}>
                Phone: {invoice.business_phone || '+91 98220 12345'} | Email: {invoice.business_email || 'billing@grownaturals.in'}
              </p>
              {isTaxable && invoice.business_gstin && (
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                  GSTIN: {invoice.business_gstin}
                </p>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
              {isTaxable ? 'TAX INVOICE' : 'RETAIL INVOICE'}
            </h2>
            <div className="invoice-tax-badge">
              {isTaxable ? 'GST Registered Entity' : 'Retail Invoice'}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>
              Invoice #: <span className="tabular">{invoice.invoice_number}</span>
            </p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Date: {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Billed To & Order Details */}
        <div className="invoice-details-grid">
          <div className="invoice-detail-block">
            <h4>Billed To:</h4>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{invoice.customer_name || 'Walk-in Customer'}</p>
            {invoice.customer_phone && <p style={{ fontSize: '13px', color: '#475569' }}>Phone: {invoice.customer_phone}</p>}
            {invoice.project_name && <p style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Project: {invoice.project_name}</p>}
          </div>

          <div className="invoice-detail-block" style={{ textAlign: 'right' }}>
            <h4>Payment Info:</h4>
            <p style={{ fontSize: '13px', color: '#475569' }}>
              Payment Mode:{' '}
              <strong style={{ textTransform: 'uppercase' }}>
                {invoice.payment_method === 'split'
                  ? `SPLIT (Cash: ₹${Number(invoice.split_cash_amount || 0).toFixed(2)} + UPI: ₹${Number(invoice.split_upi_amount || 0).toFixed(2)})`
                  : invoice.payment_method}
              </strong>
            </p>
            <p style={{ fontSize: '13px', color: '#475569' }}>Payment Status: <strong style={{ textTransform: 'uppercase', color: invoice.payment_status === 'paid' ? '#16a34a' : '#d97706' }}>{invoice.payment_status}</strong></p>
            {invoice.cashier_name && <p style={{ fontSize: '12px', color: '#64748b' }}>Billed By: {invoice.cashier_name}</p>}
          </div>
        </div>

        {/* Line Items Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Description of Goods / Plants</th>
              {isTaxable && <th>HSN</th>}
              <th className="text-right">Qty</th>
              <th className="text-right">Rate (₹)</th>
              {isTaxable && <th className="text-right">GST %</th>}
              {isTaxable && <th className="text-right">Tax (₹)</th>}
              <th className="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={item.id || idx}>
                <td>{idx + 1}</td>
                <td>
                  <strong>{item.product_name}</strong>
                  {item.sku && <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>SKU: {item.sku}</span>}
                </td>
                {isTaxable && <td className="tabular">{item.hsn_code || '0602'}</td>}
                <td className="text-right tabular">{item.quantity}</td>
                <td className="text-right tabular">{Number(item.unit_price).toFixed(2)}</td>
                {isTaxable && <td className="text-right tabular">{Number(item.gst_rate || 0).toFixed(2)}%</td>}
                {isTaxable && <td className="text-right tabular">{Number(item.tax_amount || 0).toFixed(2)}</td>}
                <td className="text-right tabular" style={{ fontWeight: 700 }}>{Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Tax Split */}
        <div className="invoice-totals-wrapper">
          <table className="invoice-totals-table">
            <tbody>
              <tr>
                <td style={{ color: '#64748b' }}>Subtotal:</td>
                <td className="text-right tabular">₹{Number(invoice.subtotal).toFixed(2)}</td>
              </tr>
              {Number(invoice.discount_amount) > 0 && (
                <tr>
                  <td style={{ color: '#64748b' }}>Discount:</td>
                  <td className="text-right tabular" style={{ color: '#dc2626' }}>-₹{Number(invoice.discount_amount).toFixed(2)}</td>
                </tr>
              )}
              {isTaxable && (
                <>
                  <tr>
                    <td style={{ color: '#64748b' }}>CGST:</td>
                    <td className="text-right tabular">₹{Number(invoice.cgst_amount || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>SGST:</td>
                    <td className="text-right tabular">₹{Number(invoice.sgst_amount || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b' }}>Total GST Tax:</td>
                    <td className="text-right tabular">₹{Number(invoice.tax_amount || 0).toFixed(2)}</td>
                  </tr>
                </>
              )}
              <tr className="invoice-grand-total">
                <td style={{ fontWeight: 800 }}>Grand Total:</td>
                <td className="text-right tabular" style={{ fontWeight: 800, color: '#166534' }}>
                  ₹{Number(invoice.total_amount).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Terms & Thanks */}
        <div className="invoice-footer-notes">
          <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
            {invoice.business_footer || (isTaxable ? 'Thank you for shopping at Grow Naturals! Plants bring life to spaces.' : 'Thank you for choosing Nikhlesh Nursery. Live green, grow happy!')}
          </p>
          <p>This is a computer generated invoice and requires no physical signature.</p>
        </div>
      </div>

      {/* WhatsApp Sharing Modal */}
      {whatsappModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setWhatsappModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '520px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              animation: 'modalSlideUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#25D366',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Send size={20} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Send Invoice via WhatsApp</h3>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Invoice #{invoice.invoice_number}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Recipient Mobile Number (with country code)
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. 919822012345"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  style={{ width: '100%', fontSize: '0.875rem', fontWeight: 600 }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Message Content
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsappMessage);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: copiedText ? '#059669' : '#0284c7',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedText ? <Check size={12} /> : <Copy size={12} />}
                    {copiedText ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <textarea
                  className="input"
                  rows={8}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                    lineHeight: 1.4,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleSendWhatsAppDirect}
                  style={{
                    flex: 1,
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 16px',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
                  }}
                >
                  <Send size={16} /> Open in WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
