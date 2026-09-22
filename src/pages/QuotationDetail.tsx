import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import type { Quotation } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import gnLogo from '../assets/grownaturalslogo.jpeg';
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Send,
  Truck,
  Receipt,
  Lock,
  Calendar,
  Phone,
  User,
  AlertTriangle,
  Building2,
  Check,
  Copy,
  ExternalLink,
  X,
  FileCheck2,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  FileDown
} from 'lucide-react';

function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let output = '';

  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  const hundredAndRest = rem % 1000;

  if (crore > 0) output += inWords(crore) + ' Crore ';
  if (lakh > 0) output += inWords(lakh) + ' Lakh ';
  if (thousand > 0) output += inWords(thousand) + ' Thousand ';
  if (hundredAndRest > 0) output += inWords(hundredAndRest);

  output = output.trim() + ' Rupees';

  if (decimalPart > 0) {
    output += ' and ' + inWords(decimalPart) + ' Paise';
  }

  return output + ' Only';
}

export const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isTaxable, business } = useBusiness();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Convert Modal State
  const [convertModalOpen, setConvertModalOpen] = useState<boolean>(false);
  const [convertTargetType, setConvertTargetType] = useState<'invoice' | 'delivery_challan'>('invoice');
  const [convertError, setConvertError] = useState<string | null>(null);

  // WhatsApp Modal State
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  const fetchQuotation = () => {
    setIsLoading(true);
    api
      .get(`/quotations/${id}`)
      .then((res) => {
        setQuotation(res);
        if (res.customer_phone) {
          const digits = res.customer_phone.replace(/\D/g, '');
          setWhatsappPhone(digits.length === 10 ? `91${digits}` : digits);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleOpenConvertModal = (targetType: 'invoice' | 'delivery_challan') => {
    setConvertTargetType(targetType);
    setConvertError(null);
    setConvertModalOpen(true);
  };

  const handleConfirmConvert = async () => {
    setIsConverting(true);
    setConvertError(null);
    try {
      const res = await api.post(`/quotations/${id}/convert`, { target_type: convertTargetType });
      setConvertModalOpen(false);
      if (res.converted_type === 'invoice') {
        navigate(`/invoices/${res.converted_id}`);
      } else {
        navigate(`/delivery-challans/${res.converted_id}`);
      }
    } catch (err: any) {
      setConvertError(err.message || 'Conversion failed. Please try again.');
      setIsConverting(false);
    }
  };

  const handleOpenWhatsAppModal = () => {
    if (!quotation) return;

    const bizName = quotation.legal_name || quotation.business_name || business?.name || 'Grow Naturals';
    const itemsList = (quotation.items || [])
      .map((it, idx) => `${idx + 1}. *${it.product_name}* (Qty: ${it.quantity}) — ₹${Number(it.total).toFixed(2)}`)
      .join('\n');

    const totalVal = Number(quotation.total_amount).toFixed(2);
    const subtotalVal = Number(quotation.subtotal).toFixed(2);
    const taxVal = Number(quotation.tax_amount || 0).toFixed(2);

    const msg = [
      `🌿 *PROPOSAL & ESTIMATE — ${bizName.toUpperCase()}* 🌿`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Quote No:* #${quotation.quotation_number}`,
      `*Client:* ${quotation.customer_name}`,
      `*Date:* ${new Date(quotation.created_at).toLocaleDateString('en-IN')}`,
      `*Valid Until:* ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '30 Days'}`,
      ``,
      `*Proposed Items / Scope of Work:*`,
      itemsList,
      ``,
      `*Subtotal:* ₹${subtotalVal}`,
      ...(Number(quotation.discount) > 0 ? [`*Special Discount:* -₹${Number(quotation.discount).toFixed(2)}`] : []),
      ...(Number(taxVal) > 0 ? [`*Estimated Tax (GST):* ₹${taxVal}`] : []),
      `*Total Estimate:* *₹${totalVal}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_Notes: ${quotation.notes || 'Valid for 30 days. Stock subject to availability.'}_`,
      ``,
      `Please reply to this message or contact us at ${quotation.business_phone || '+91 98220 12345'} to approve and schedule delivery.`
    ].join('\n');

    setWhatsappMessage(msg);

    if (quotation.customer_phone) {
      const digits = quotation.customer_phone.replace(/\D/g, '');
      setWhatsappPhone(digits.length === 10 ? `91${digits}` : digits);
    }

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

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const generatePdfBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    const sheetEl = document.getElementById('quotation-print-sheet');
    if (!sheetEl) return null;

    const canvas = await html2canvas(sheetEl, {
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
    const filename = `Quotation_${quotation?.quotation_number || 'Estimate'}.pdf`;
    const blob = pdf.output('blob');
    return { blob, filename };
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const sheetEl = document.getElementById('quotation-print-sheet');
      if (!sheetEl) {
        window.print();
        return;
      }

      const canvas = await html2canvas(sheetEl, {
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
      pdf.save(`Quotation_${quotation?.quotation_number || 'Estimate'}.pdf`);
    } catch (err) {
      console.warn('html2canvas/jspdf fallback to print:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdfToWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const res = await generatePdfBlob();
      if (res && navigator.share && navigator.canShare) {
        const file = new File([res.blob], res.filename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Quotation #${quotation?.quotation_number}`,
            text: whatsappMessage
          });
          return;
        }
      }

      // Download PDF and open WhatsApp Web with text
      if (res) {
        const url = URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      handleSendWhatsAppDirect();
    } catch (e) {
      handleSendWhatsAppDirect();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading || !quotation) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading quotation estimate...</div>
      </div>
    );
  }

  const isConverted = quotation.status === 'converted_to_invoice' || quotation.status === 'converted_to_dc';
  const totalAmountNum = Number(quotation.total_amount) || 0;
  const subtotalNum = Number(quotation.subtotal) || 0;
  const taxNum = Number(quotation.tax_amount) || 0;
  const discountNum = Number(quotation.discount) || 0;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* 1. Header Toolbar (Hidden in Print) */}
      <div
        className="page-header no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <div className="page-title-group">
          <Link
            to="/quotations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginBottom: '6px',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={15} /> Back to Quotations
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              Quotation #{quotation.quotation_number}
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                backgroundColor:
                  quotation.status === 'converted_to_invoice'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : quotation.status === 'converted_to_dc'
                    ? 'rgba(2, 132, 199, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
                color:
                  quotation.status === 'converted_to_invoice'
                    ? '#059669'
                    : quotation.status === 'converted_to_dc'
                    ? '#0284c7'
                    : '#d97706',
                border: `1px solid ${
                  quotation.status === 'converted_to_invoice'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : quotation.status === 'converted_to_dc'
                    ? 'rgba(2, 132, 199, 0.25)'
                    : 'rgba(245, 158, 11, 0.25)'
                }`
              }}
            >
              {isConverted && <Lock size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />}
              {quotation.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="page-description" style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
            Issued to <strong>{quotation.customer_name}</strong> on {new Date(quotation.created_at).toLocaleDateString('en-IN')}.
          </p>
        </div>

        {/* Action Buttons: WhatsApp + Download PDF + Print + Conversion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Send to WhatsApp Button */}
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
              gap: '6px',
              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)'
            }}
          >
            <Send size={15} /> Send to WhatsApp
          </button>

          {/* Download PDF Button */}
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
              gap: '6px'
            }}
          >
            {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>

          {/* Print Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              gap: '6px'
            }}
          >
            <Printer size={15} /> Print
          </button>

          {/* Conversion Actions */}
          {!isConverted && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleOpenConvertModal('delivery_challan')}
                disabled={isConverting}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-md)',
                  gap: '6px'
                }}
              >
                <Truck size={15} /> Convert to Challan
              </button>
              <button
                type="button"
                className="btn btn-sell"
                onClick={() => handleOpenConvertModal('invoice')}
                disabled={isConverting}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-md)',
                  gap: '6px'
                }}
              >
                <Receipt size={15} /> Convert to Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Converted Alert Banner */}
      {isConverted && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
            color: '#0369a1'
          }}
        >
          <Lock size={18} color="#0284c7" />
          <span style={{ fontSize: '0.8125rem' }}>
            <strong>Quotation Locked:</strong> This estimate has been converted into{' '}
            {quotation.status === 'converted_to_invoice' ? (
              <Link to={`/invoices/${quotation.converted_id}`} style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'underline' }}>
                Invoice #{quotation.converted_id}
              </Link>
            ) : (
              <Link to={`/delivery-challans/${quotation.converted_id}`} style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'underline' }}>
                Delivery Challan #{quotation.converted_id}
              </Link>
            )}
            . Further modifications are locked to prevent estimate drift.
          </span>
        </div>
      )}

      {/* 2. Professional High-End Printable Sheet */}
      <div
        id="quotation-print-sheet"
        className="a4-invoice-sheet a4-invoice-container"
        style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          borderRadius: 'var(--radius-xl)',
          padding: '44px 50px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ maxWidth: '65%', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <img
              src={gnLogo}
              alt="Grow Naturals Logo"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                objectFit: 'contain',
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                flexShrink: 0
              }}
              loading="eager"
            />
            <div>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#166534',
                  letterSpacing: '-0.02em',
                  margin: '0 0 4px 0'
                }}
              >
                {quotation.legal_name || quotation.business_name || (isTaxable ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm')}
              </h1>
              <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0', lineHeight: 1.4 }}>
                {quotation.business_address || 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu'}
              </p>
              <p style={{ fontSize: '12px', color: '#475569', margin: '2px 0' }}>
                <strong>Phone:</strong> {quotation.business_phone || '+91 98220 12345'} | <strong>Email:</strong> {isTaxable ? 'billing@grownaturals.in' : 'sales@nikhleshnursery.in'}
              </p>
              {isTaxable && quotation.business_gstin && (
                <div style={{ marginTop: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1'
                    }}
                  >
                    GSTIN: {quotation.business_gstin}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Header Box */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 16px',
                textAlign: 'right'
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: 0,
                  color: '#166534'
                }}
              >
                PROPOSAL / ESTIMATE
              </h2>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                Quote #: <span style={{ fontFamily: 'monospace', color: '#166534' }}>{quotation.quotation_number}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                <strong>Issue Date:</strong> {new Date(quotation.created_at).toLocaleDateString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                <strong>Valid Until:</strong> {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-IN') : '30 Days from Issue'}
              </div>
            </div>
          </div>
        </div>

        {/* Client & Scope Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '20px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '24px'
          }}
        >
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
              PROPOSAL PREPARED FOR:
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              {quotation.customer_name}
            </div>
            {quotation.customer_phone && (
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={11} /> {quotation.customer_phone}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Location: Madurai & Surrounding Site Installations
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
              QUOTATION SPECIFICATIONS:
            </div>
            <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
              <div>• <strong>Price Validity:</strong> 30 calendar days</div>
              <div>• <strong>Payment Mode:</strong> Bank Transfer / UPI / Advance</div>
              <div>• <strong>Delivery:</strong> Scheduled on Confirmation</div>
            </div>
          </div>
        </div>

        {/* Goods / Materials Table */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '24px',
            fontSize: '12.5px'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#166534', color: '#ffffff' }}>
              <th style={{ width: '6%', padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', borderTopLeftRadius: '6px' }}>#</th>
              <th style={{ width: '48%', padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description of Goods / Scope of Work</th>
              <th style={{ width: '12%', padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quantity</th>
              <th style={{ width: '16%', padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unit Rate (₹)</th>
              <th style={{ width: '18%', padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', borderTopRightRadius: '6px' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {(quotation.items || []).map((item, idx) => (
              <tr
                key={idx}
                style={{
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0'
                }}
              >
                <td style={{ padding: '12px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ padding: '12px 12px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{item.product_name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                    Standard Botanical & Landscape Nursery Grade
                  </div>
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                  {item.quantity} Nos
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#334155' }}>
                  ₹{Number(item.unit_price).toFixed(2)}
                </td>
                <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                  ₹{Number(item.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Calculation & Payment Terms Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '24px',
            marginBottom: '28px',
            alignItems: 'start'
          }}
        >
          {/* Left: Amount in Words + Bank Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px'
              }}
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                Total Estimated Amount in Words:
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#166534', marginTop: '3px', fontStyle: 'italic' }}>
                {numberToIndianWords(totalAmountNum)}
              </div>
            </div>

            {/* Bank / Transfer Instructions */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '11px',
                color: '#334155'
              }}
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                Bank & Payment Details for Advance:
              </div>
              <div>• <strong>Account Name:</strong> {quotation.legal_name || quotation.business_name || 'Grow Naturals Private Limited'}</div>
              <div>• <strong>Bank:</strong> HDFC Bank Ltd, K K Nagar Branch</div>
              <div>• <strong>Account No:</strong> 50200084920194 | <strong>IFSC:</strong> HDFC0000123</div>
              <div>• <strong>UPI ID:</strong> grownaturals@hdfcbank</div>
            </div>
          </div>

          {/* Right: Calculations Table */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 18px'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#64748b' }}>Subtotal (Excl. Tax):</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                    ₹{subtotalNum.toFixed(2)}
                  </td>
                </tr>

                {discountNum > 0 && (
                  <tr>
                    <td style={{ padding: '4px 0', color: '#dc2626' }}>Special Discount:</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', color: '#dc2626', fontFamily: 'monospace', fontWeight: 600 }}>
                      -₹{discountNum.toFixed(2)}
                    </td>
                  </tr>
                )}

                {isTaxable ? (
                  <>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>CGST (9%):</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                        ₹{(taxNum / 2).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>SGST (9%):</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                        ₹{(taxNum / 2).toFixed(2)}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Tax Status:</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                      0.00% Tax Exempt
                    </td>
                  </tr>
                )}

                <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                  <td style={{ padding: '10px 0 4px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    Total Estimate:
                  </td>
                  <td style={{ padding: '10px 0 4px 0', textAlign: 'right', fontSize: '16px', fontWeight: 800, color: '#166534', fontFamily: 'monospace' }}>
                    ₹{totalAmountNum.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '16px',
            marginBottom: '28px',
            fontSize: '11px',
            color: '#64748b'
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            Terms & Conditions:
          </div>
          <ol style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
            <li>This quotation is an estimate and valid for 30 days from the date of issue.</li>
            <li>Plant species and material availability are subject to prior sale at the nursery.</li>
            <li>50% advance is required upon order confirmation to schedule nursery dispatch.</li>
            <li>Site unloading and positioning are executed as per standard landscape protocols.</li>
          </ol>
        </div>

        {/* Authorized Signatory & Client Signature Box */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '20px',
            borderTop: '1px dashed #cbd5e1'
          }}
        >
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ height: '45px', borderBottom: '1px solid #94a3b8', marginBottom: '6px' }} />
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Customer Acceptance Signature</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Date & Site Approval</div>
          </div>

          <div style={{ textAlign: 'center', width: '240px' }}>
            <div style={{ height: '45px', borderBottom: '1px solid #94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>Grow Naturals Nursery</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
              Authorized Signatory
            </div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>
              {quotation.legal_name || 'Grow Naturals Private Limited'}
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '28px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '11px',
            color: '#94a3b8'
          }}
        >
          {quotation.invoice_footer || 'Thank you for choosing Grow Naturals! Handcrafted botanical elegance for your space.'}
        </div>
      </div>

      {/* =========================================================================
          WHATSAPP SHARE MODAL
          ========================================================================= */}
      {whatsappModalOpen && (
        <div className="dialog-overlay no-print" onClick={() => setWhatsappModalOpen(false)}>
          <div
            className="dialog-content"
            style={{ maxWidth: '560px', borderRadius: 'var(--radius-xl)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="dialog-header"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(37, 211, 102, 0.15)',
                    color: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Send Quotation to WhatsApp</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Instant proposal delivery to {quotation.customer_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dialog-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Recipient number */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                  Recipient WhatsApp Mobile Number
                </label>
                <div className="input-addon-group">
                  <span className="input-addon-prefix">📱</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 919822012345 (with country code)"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Message text with copy */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0 }}>
                    WhatsApp Message Text
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppText}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-botanical-700)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    {copiedText ? <Check size={12} style={{ color: '#059669' }} /> : <Copy size={12} />}
                    {copiedText ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <textarea
                  rows={7}
                  className="form-input"
                  style={{
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    lineHeight: 1.4,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)'
                  }}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                />
              </div>

              {/* PDF file attachment info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(37, 211, 102, 0.08)',
                  border: '1px solid rgba(37, 211, 102, 0.25)'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <FileDown size={16} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#166534', flex: 1 }}>
                  <strong>PDF Attachment Included:</strong> Clicking <em>Send PDF & Open WhatsApp</em> generates and downloads the high-res PDF file for instant attachment in your WhatsApp chat.
                </div>
              </div>
            </div>

            <div
              className="dialog-footer"
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-surface-subtle)'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setWhatsappModalOpen(false)}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSendWhatsAppDirect}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontWeight: 600,
                    gap: '4px'
                  }}
                >
                  <ExternalLink size={13} /> Open Text Chat
                </button>

                <button
                  type="button"
                  onClick={handleSharePdfToWhatsApp}
                  disabled={isGeneratingPdf}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    borderColor: '#25D366',
                    fontWeight: 700,
                    padding: '7px 16px',
                    gap: '6px'
                  }}
                >
                  {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {isGeneratingPdf ? 'Preparing...' : 'Send PDF to WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert Quotation Popup Modal */}
      {convertModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => !isConverting && setConvertModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: '480px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #e2e8f0',
              animation: 'modalSlideUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: convertTargetType === 'invoice' ? 'var(--module-sell-accent)' : 'var(--module-inv-accent)',
                color: '#ffffff',
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {convertTargetType === 'invoice' ? <Receipt size={20} /> : <Truck size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                    Convert to {convertTargetType === 'invoice' ? 'Tax Invoice' : 'Delivery Challan'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                    Quotation #{quotation.quotation_number} &bull; {quotation.customer_name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isConverting && setConvertModalOpen(false)}
                disabled={isConverting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: isConverting ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%',
                  opacity: 0.85
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {convertError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-danger-subtle)',
                    border: '1px solid var(--color-danger-border)',
                    color: 'var(--color-danger-text)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{convertError}</span>
                </div>
              )}

              {/* Quotation Summary Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Client:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{quotation.customer_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Items in Quote:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    {(quotation.items || []).length} items ({quotation.items?.reduce((s, it) => s + Number(it.quantity || 0), 0)} units)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Total Value:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--module-sell-accent)', fontFamily: 'monospace' }}>
                    ₹{Number(quotation.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notice description */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  color: '#0369a1',
                  fontSize: '0.8125rem',
                  lineHeight: 1.45
                }}
              >
                <Lock size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#0284c7' }} />
                <div>
                  <strong>Quotation Locking:</strong> Converting will generate an official{' '}
                  <strong>{convertTargetType === 'invoice' ? 'Tax Invoice' : 'Delivery Challan'}</strong> with all items copied over.
                  This quotation will be permanently marked as <em>converted</em> to prevent pricing discrepancies.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 22px',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '10px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-surface-subtle)'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConvertModalOpen(false)}
                disabled={isConverting}
                style={{ fontSize: '0.8125rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                disabled={isConverting}
                className={convertTargetType === 'invoice' ? 'btn btn-sell' : 'btn btn-primary'}
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  padding: '8px 18px',
                  gap: '8px'
                }}
              >
                {isConverting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <Check size={15} /> Yes, Convert to {convertTargetType === 'invoice' ? 'Invoice' : 'Challan'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
