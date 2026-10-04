import React, { useState, useRef } from 'react';
import type { Invoice } from '../../types';
import { printService } from '../../services/printService';
import { numberToIndianWords } from '../../utils/numberToWords';
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
    let cleanPhone = whatsappPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
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

      <div ref={sheetRef} className="a4-invoice-sheet a4-invoice-container" style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '32px 36px', maxWidth: '850px', margin: '0 auto', fontFamily: 'Nunito, system-ui, sans-serif' }}>
        {/* Invoice Branding Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px', gap: '20px' }}>
          {/* Company Info with Bounded Logo */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
            <img
              src={gnLogo}
              alt="Grow Naturals Logo"
              style={{
                width: '64px',
                height: '64px',
                minWidth: '64px',
                maxWidth: '64px',
                minHeight: '64px',
                maxHeight: '64px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                padding: '2px',
                flexShrink: 0
              }}
              loading="eager"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#166534', margin: 0, lineHeight: 1.2 }}>
                {invoice.business_legal_name || invoice.business_name || (isTaxable ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm')}
              </h1>
              <p style={{ fontSize: '11.5px', color: '#475569', margin: '2px 0 0', lineHeight: 1.35 }}>
                {invoice.business_address || 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu'}
              </p>
              <p style={{ fontSize: '11.5px', color: '#475569', margin: 0 }}>
                Phone: {invoice.business_phone || '+91 98220 12345'} | Email: {invoice.business_email || 'billing@grownaturals.in'}
              </p>
              {isTaxable && invoice.business_gstin && (
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>
                  GSTIN: <span style={{ fontFamily: 'monospace' }}>{invoice.business_gstin}</span>
                </p>
              )}
            </div>
          </div>

          {/* Invoice Title & Metadata */}
          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '200px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {isTaxable ? 'TAX INVOICE' : 'RETAIL INVOICE'}
            </h2>
            <span style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: isTaxable ? '#dcfce7' : '#f1f5f9',
              color: isTaxable ? '#15803d' : '#334155',
              marginTop: '4px'
            }}>
              {isTaxable ? 'GST Registered Entity' : 'Bill of Supply'}
            </span>
            <div style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                Invoice #: <span style={{ fontFamily: 'monospace', fontSize: '13.5px' }}>{invoice.invoice_number}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Date: <strong style={{ color: '#334155' }}>{new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </div>
              {invoice.due_date && (
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Due Date: <strong style={{ color: '#334155' }}>{new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billed To, Shipped To & Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: (invoice.ship_to_name || invoice.ship_to_address) ? '1.2fr 1.2fr 1fr' : '1.5fr 1fr',
          gap: '16px',
          padding: '12px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {/* Billed To */}
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Billed To:
            </span>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              {invoice.customer_name || 'Walk-in Customer'}
            </div>
            {invoice.customer_phone && (
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                Phone: {invoice.customer_phone}
              </div>
            )}
            {invoice.customer_address && (
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                {invoice.customer_address}
              </div>
            )}
            {invoice.customer_gstin && (
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                GSTIN: <span style={{ fontFamily: 'monospace' }}>{invoice.customer_gstin}</span>
              </div>
            )}
            {invoice.project_name && (
              <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                Project: {invoice.project_name}
              </div>
            )}
          </div>

          {/* Shipped To (if present) */}
          {(invoice.ship_to_name || invoice.ship_to_address) && (
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Shipped To:
              </span>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                {invoice.ship_to_name || invoice.customer_name}
              </div>
              {invoice.ship_to_phone && (
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  Phone: {invoice.ship_to_phone}
                </div>
              )}
              {invoice.ship_to_address && (
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.3 }}>
                  {invoice.ship_to_address}
                </div>
              )}
            </div>
          )}

          {/* Payment & Status info */}
          <div style={{ textAlign: (invoice.ship_to_name || invoice.ship_to_address) ? 'left' : 'right' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Payment Details:
            </span>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              Mode: <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>
                {invoice.payment_method === 'split'
                  ? `SPLIT (₹${Number(invoice.split_cash_amount || 0).toFixed(0)} Cash + ₹${Number(invoice.split_upi_amount || 0).toFixed(0)} UPI)`
                  : (invoice.payment_method || 'Cash')}
              </strong>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
              Status: <strong style={{ textTransform: 'uppercase', color: invoice.payment_status === 'paid' ? '#16a34a' : '#d97706' }}>
                {invoice.payment_status || 'Paid'}
              </strong>
            </div>
            {invoice.cashier_name && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Billed By: {invoice.cashier_name}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ width: '35px', padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'center' }}>#</th>
              <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'left' }}>Item / Description</th>
              {isTaxable && <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'center', width: '70px' }}>HSN</th>}
              <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'right', width: '55px' }}>Qty</th>
              <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'right', width: '85px' }}>Rate (₹)</th>
              {isTaxable && <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'right', width: '60px' }}>GST %</th>}
              {isTaxable && <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'right', width: '75px' }}>Tax (₹)</th>}
              <th style={{ padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#334155', textAlign: 'right', width: '95px' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                <td style={{ padding: '8px 10px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '8px 10px', fontSize: '12.5px', color: '#0f172a' }}>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  {item.sku && <div style={{ fontSize: '10.5px', color: '#64748b' }}>SKU: {item.sku}</div>}
                </td>
                {isTaxable && <td style={{ padding: '8px 10px', fontSize: '11.5px', fontFamily: 'monospace', color: '#475569', textAlign: 'center' }}>{item.hsn_code || '0602'}</td>}
                <td style={{ padding: '8px 10px', fontSize: '12.5px', color: '#0f172a', textAlign: 'right', fontFamily: 'monospace' }}>{item.quantity}</td>
                <td style={{ padding: '8px 10px', fontSize: '12.5px', color: '#0f172a', textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.unit_price).toFixed(2)}</td>
                {isTaxable && <td style={{ padding: '8px 10px', fontSize: '11.5px', color: '#64748b', textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.gst_rate || 0).toFixed(0)}%</td>}
                {isTaxable && <td style={{ padding: '8px 10px', fontSize: '12px', color: '#475569', textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.tax_amount || 0).toFixed(2)}</td>}
                <td style={{ padding: '8px 10px', fontSize: '13px', fontWeight: 700, color: '#0f172a', textAlign: 'right', fontFamily: 'monospace' }}>{Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Lower Grid: Bank & QR on Left, Calculation Breakdown on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'flex-start', marginBottom: '16px' }}>
          {/* Left: Bank Details & UPI QR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Bank Details Box */}
            <div style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', fontSize: '11.5px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Bank Account Details:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', rowGap: '3px', color: '#334155' }}>
                <span style={{ color: '#64748b' }}>Bank Name:</span>
                <strong>{isTaxable ? 'Axis Bank Ltd' : 'Canara Bank'}</strong>
                <span style={{ color: '#64748b' }}>A/C Number:</span>
                <strong style={{ fontFamily: 'monospace' }}>{isTaxable ? '923020048192831' : '1084201004921'}</strong>
                <span style={{ color: '#64748b' }}>IFSC Code:</span>
                <strong style={{ fontFamily: 'monospace' }}>{isTaxable ? 'UTIB0000142' : 'CNRB0001084'}</strong>
                <span style={{ color: '#64748b' }}>Branch:</span>
                <span>{isTaxable ? 'Madurai Main Branch' : 'K K Nagar Branch'}</span>
              </div>
            </div>

            {/* UPI QR if enabled */}
            {invoice.show_payment_qr && invoice.upi_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                <img
                  src={invoice.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${invoice.upi_id}&pn=${invoice.business_name || ''}&am=${Number(invoice.total_amount || 0).toFixed(2)}&cu=INR`)}`}
                  alt="UPI QR"
                  style={{ width: '65px', height: '65px', objectFit: 'contain', background: '#ffffff', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '6px', flexShrink: 0 }}
                />
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', display: 'block' }}>Scan & Pay via UPI</span>
                  <span style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>{invoice.upi_id}</span>
                  <span style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>Google Pay / PhonePe / Paytm</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Totals Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 12px', color: '#64748b' }}>Subtotal:</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>₹{Number(invoice.subtotal).toFixed(2)}</td>
                </tr>
                {Number(invoice.discount_amount) > 0 && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 12px', color: '#64748b' }}>Discount:</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#dc2626', fontWeight: 600 }}>-₹{Number(invoice.discount_amount).toFixed(2)}</td>
                  </tr>
                )}
                {Number(invoice.additional_charges) > 0 && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 12px', color: '#64748b' }}>Additional Charges:</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>₹{Number(invoice.additional_charges).toFixed(2)}</td>
                  </tr>
                )}
                {isTaxable && (
                  <>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 12px', color: '#64748b' }}>CGST:</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>₹{Number(invoice.cgst_amount || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 12px', color: '#64748b' }}>SGST:</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>₹{Number(invoice.sgst_amount || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 12px', color: '#64748b' }}>Total GST:</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>₹{Number(invoice.tax_amount || 0).toFixed(2)}</td>
                    </tr>
                  </>
                )}
                {Number(invoice.round_off || 0) !== 0 && (
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 12px', color: '#64748b' }}>Round Off:</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{Number(invoice.round_off) > 0 ? `+₹${Number(invoice.round_off).toFixed(2)}` : `-₹${Math.abs(Number(invoice.round_off)).toFixed(2)}`}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#f0fdf4', borderTop: '2px solid #16a34a' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 800, fontSize: '14px', color: '#166534' }}>Grand Total:</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: '15px', color: '#166534' }}>
                    ₹{Number(invoice.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount in Words */}
        <div style={{ margin: '12px 0', padding: '8px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11.5px' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Amount in Words: </span>
          <strong style={{ color: '#0f172a' }}>{invoice.amount_in_words || numberToIndianWords(Number(invoice.total_amount || 0))}</strong>
        </div>

        {/* Terms and Signature Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px', gap: '20px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
          {/* Terms & Conditions */}
          <div style={{ flex: 1, fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
            <strong style={{ color: '#334155', display: 'block', marginBottom: '2px' }}>Terms & Conditions:</strong>
            <div>1. Goods once sold will not be returned or exchanged without receipt.</div>
            <div>2. Plants require proper watering and care as per nursery instructions.</div>
            <div>3. Subject to Madurai jurisdiction only.</div>
          </div>

          {/* Signature */}
          <div style={{ textAlign: 'center', minWidth: '170px', flexShrink: 0 }}>
            {invoice.signature_url ? (
              <img
                src={invoice.signature_url}
                alt="Signature"
                style={{ maxHeight: '42px', maxWidth: '140px', objectFit: 'contain', marginBottom: '4px' }}
              />
            ) : (
              <div style={{ height: '36px' }} />
            )}
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
              For {invoice.business_legal_name || invoice.business_name || 'Grow Naturals Pvt Ltd'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Authorized Signatory</div>
          </div>
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
                  Recipient Mobile Number (10 Digits)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="input"
                  placeholder="e.g. 9822012345"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
