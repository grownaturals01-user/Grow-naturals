import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import type { DeliveryChallan } from '../types';
import { Badge } from '../components/common/Badge';
import gnLogo from '../assets/grownaturalslogo.jpeg';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Truck,
  Building,
  User,
  Calendar,
  IndianRupee,
  FileCheck,
  Receipt,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Send,
  Download,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Package,
  FileText
} from 'lucide-react';

export const DeliveryChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId, isTaxable } = useBusiness();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<DeliveryChallan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Amount display mode (With Amount vs Without Amount)
  const [includeAmount, setIncludeAmount] = useState<boolean>(true);

  // WhatsApp / Share Modal state
  const [sendModalOpen, setSendModalOpen] = useState<boolean>(false);
  const [sendWithAmount, setSendWithAmount] = useState<boolean>(true);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [convertToInvoice, setConvertToInvoice] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const fetchChallan = () => {
    setIsLoading(true);
    api
      .get(`/delivery-challans/${id}`)
      .then((data) => {
        setChallan(data);
        const due = Number(data.due_amount) || Math.max(0, (Number(data.total_amount) || 0) - (Number(data.paid_amount) || 0));
        setPaymentAmount(String(due));
        setPaymentNotes(`Payment for DC #${data.challan_number}`);
        if (data.customer_phone) {
          const digits = data.customer_phone.replace(/\D/g, '');
          setWhatsappPhone(digits.length === 10 ? `91${digits}` : digits);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  // Construct formatted WhatsApp message based on mode
  const buildWhatsAppMessage = (withAmt: boolean) => {
    if (!challan) return '';

    const bizName = challan.legal_name || challan.business_name || (isTaxable ? 'Grow Naturals' : 'Nikhlesh Nursery');
    const items = challan.items || [];
    const totalVal = Number(challan.total_amount) || 0;
    const paidVal = Number(challan.paid_amount) || 0;
    const dueVal = Number(challan.due_amount) || Math.max(0, totalVal - paidVal);

    if (withAmt) {
      const itemsList = items
        .map((it, idx) => {
          const qty = Number(it.quantity) || 1;
          const rate = Number(it.unit_price) || 0;
          const itemTotal = Number(it.total) || qty * rate;
          return `${idx + 1}. *${it.product_name}* — ${qty} ${it.unit || 'Nos'} @ ₹${rate.toFixed(2)} = ₹${itemTotal.toFixed(2)}`;
        })
        .join('\n');

      return [
        `🚚 *DELIVERY CHALLAN (COMMERCIAL) — ${bizName.toUpperCase()}* 🚚`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `*DC No:* #${challan.challan_number}`,
        `*Consignee / Site:* ${challan.customer_name}`,
        `*Dispatch Date:* ${new Date(challan.dispatch_date).toLocaleDateString('en-IN')}`,
        `*Vehicle No:* ${challan.vehicle_no || 'Local Handover'}`,
        ...(challan.driver_name ? [`*Driver:* ${challan.driver_name}`] : []),
        ``,
        `*Dispatched Materials & Pricing:*`,
        itemsList,
        ``,
        `*Total Dispatched Value:* *₹${totalVal.toFixed(2)}*`,
        `*Paid Amount:* ₹${paidVal.toFixed(2)}`,
        `*Due Pending:* *₹${dueVal.toFixed(2)}*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ...(challan.notes ? [`_Dispatch Notes: ${challan.notes}_`] : []),
        ``,
        `Please inspect materials upon receipt. For queries, contact ${challan.business_phone || '+91 98220 12345'}.`
      ].join('\n');
    } else {
      const itemsList = items
        .map((it, idx) => {
          const qty = Number(it.quantity) || 1;
          return `${idx + 1}. *${it.product_name}* — ${qty} ${it.unit || 'Nos'}`;
        })
        .join('\n');

      const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

      return [
        `🚚 *DELIVERY CHALLAN (MATERIAL DISPATCH) — ${bizName.toUpperCase()}* 🚚`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `*DC No:* #${challan.challan_number}`,
        `*Consignee / Site:* ${challan.customer_name}`,
        `*Dispatch Date:* ${new Date(challan.dispatch_date).toLocaleDateString('en-IN')}`,
        `*Vehicle No:* ${challan.vehicle_no || 'Local Handover'}`,
        ...(challan.driver_name ? [`*Driver:* ${challan.driver_name}`] : []),
        ``,
        `*Dispatched Materials & Quantities:*`,
        itemsList,
        ``,
        `*Total Quantity:* *${totalUnits} items across ${items.length} varieties*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `_Material delivery note for site inspection and physical handover._`,
        ...(challan.notes ? [`_Dispatch Notes: ${challan.notes}_`] : []),
        ``,
        `Please verify goods received at site. For queries, contact ${challan.business_phone || '+91 98220 12345'}.`
      ].join('\n');
    }
  };

  // Open WhatsApp Send modal
  const handleOpenSendModal = () => {
    const initialMode = includeAmount;
    setSendWithAmount(initialMode);
    setWhatsappMessage(buildWhatsAppMessage(initialMode));
    if (challan?.customer_phone) {
      const digits = challan.customer_phone.replace(/\D/g, '');
      setWhatsappPhone(digits.length === 10 ? `91${digits}` : digits);
    }
    setSendModalOpen(true);
  };

  // Switch Send mode in modal
  const handleToggleSendMode = (withAmt: boolean) => {
    setSendWithAmount(withAmt);
    setWhatsappMessage(buildWhatsAppMessage(withAmt));
  };

  // Direct WhatsApp send
  const handleSendWhatsAppDirect = () => {
    const cleanPhone = whatsappPhone.replace(/\D/g, '');
    const encoded = encodeURIComponent(whatsappMessage);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Copy text
  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Generate PDF Blob
  const generatePdfBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    const sheetEl = document.getElementById('challan-print-sheet');
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

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));

    const modeSlug = includeAmount ? 'commercial' : 'material-dispatch';
    const filename = `DC-${challan?.challan_number || 'Challan'}-${modeSlug}.pdf`;
    const blob = pdf.output('blob');
    return { blob, filename };
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfBlob();
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Share PDF & Open WhatsApp
  const handleSharePdfToWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const result = await generatePdfBlob();
      if (result) {
        const file = new File([result.blob], result.filename, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Delivery Challan #${challan?.challan_number}`,
            text: whatsappMessage
          });
          return;
        }

        // Fallback: download PDF and launch WhatsApp
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
      }
      handleSendWhatsAppDirect();
    } catch (err) {
      handleSendWhatsAppDirect();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleMarkDelivered = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/delivery-challans/${id}/status`, { status: 'delivered' });
      fetchChallan();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(paymentAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await api.post(`/delivery-challans/${id}/payments`, {
        amount: amountVal,
        payment_method: paymentMethod,
        notes: paymentNotes,
        create_invoice: convertToInvoice,
      });

      if (convertToInvoice && res.invoice_id) {
        navigate(`/invoices/${res.invoice_id}`);
        return;
      }

      setPaymentModalOpen(false);
      fetchChallan();
    } catch (err: any) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading || !challan) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px', color: 'var(--color-text-muted)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--module-sell-accent)' }} />
        <p style={{ fontSize: 'var(--font-sm)' }}>Loading delivery challan...</p>
      </div>
    );
  }

  const total = Number(challan.total_amount) || 0;
  const paid = Number(challan.paid_amount) || 0;
  const due = Number(challan.due_amount) || Math.max(0, total - paid);
  const totalItemsCount = (challan.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header Actions */}
      <div className="page-header no-print" style={{ marginBottom: '16px' }}>
        <div className="page-title-group">
          <Link
            to="/delivery-challans"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              marginBottom: '6px'
            }}
          >
            <ArrowLeft size={15} /> Back to Delivery Challans
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>
              <span>Delivery Challan #{challan.challan_number}</span>
            </h1>
            <Badge variant={challan.status === 'delivered' ? 'success' : 'warning'}>
              {challan.status === 'delivered' ? 'Delivered to Site' : 'In Transit'}
            </Badge>
            {challan.payment_status === 'billed' ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--module-inv-subtle)', color: 'var(--module-inv-text)' }}>
                Billed / Invoiced
              </span>
            ) : due > 0 ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger-text)' }}>
                ₹{due.toFixed(2)} Due Pending
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-botanical-100)', color: 'var(--color-botanical-800)' }}>
                Fully Paid
              </span>
            )}
          </div>
          <p className="page-description" style={{ fontSize: '0.8125rem', marginTop: '3px' }}>
            Site dispatch note for {challan.customer_name}.
          </p>
        </div>

        {/* Toolbar & Actions */}
        <div className="page-actions" style={{ gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Amount Display Toggle: With Amount vs Without Amount */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              gap: '2px',
              border: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={() => setIncludeAmount(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                fontSize: '0.75rem',
                fontWeight: includeAmount ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: includeAmount ? '#ffffff' : 'transparent',
                color: includeAmount ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: includeAmount ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <span>💰</span> With Amount
            </button>
            <button
              type="button"
              onClick={() => setIncludeAmount(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                fontSize: '0.75rem',
                fontWeight: !includeAmount ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: !includeAmount ? '#ffffff' : 'transparent',
                color: !includeAmount ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: !includeAmount ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <span>📦</span> Without Amount
            </button>
          </div>

          {/* Send to WhatsApp Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenSendModal}
            style={{
              fontSize: '0.8125rem',
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#059669',
              borderColor: '#059669'
            }}
          >
            <Send size={14} /> Send Challan
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            style={{ fontSize: '0.8125rem', padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> {isGeneratingPdf ? 'Generating...' : 'PDF'}
          </button>

          {/* Print Challan */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ fontSize: '0.8125rem', padding: '7px 14px' }}
          >
            <Printer size={14} /> Print
          </button>

          {due > 0 && (
            <button
              type="button"
              className="btn btn-inv"
              onClick={() => setPaymentModalOpen(true)}
              style={{ fontSize: '0.8125rem', padding: '7px 16px', fontWeight: 700, gap: '5px' }}
            >
              <IndianRupee size={14} /> Collect Payment
            </button>
          )}

          {challan.status !== 'delivered' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMarkDelivered}
              disabled={isUpdating}
              style={{ fontSize: '0.8125rem', padding: '7px 14px' }}
            >
              <CheckCircle size={14} /> Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Due Banner if unpaid */}
      {due > 0 && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 18px',
            backgroundColor: 'var(--module-sell-subtle)',
            color: 'var(--module-sell-text)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--module-sell-border)',
            marginBottom: '18px',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <div>
              <strong style={{ fontSize: '0.875rem' }}>Bill is Pending Payment:</strong>
              <span style={{ fontSize: '0.8125rem', marginLeft: '6px' }}>
                Goods have been dispatched, but an outstanding balance of <strong>₹{due.toFixed(2)}</strong> remains unpaid for {challan.customer_name}.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-inv btn-sm"
            onClick={() => setPaymentModalOpen(true)}
            style={{ fontWeight: 700 }}
          >
            Clear Due Now
          </button>
        </div>
      )}

      {/* Printable Challan Sheet */}
      <div id="challan-print-sheet" className="a4-invoice-sheet a4-invoice-container" style={{ boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-xl)' }}>
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
                {challan.legal_name || challan.business_name || (isTaxable ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm')}
              </h1>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                {challan.business_address || 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu'}
              </p>
              <p style={{ fontSize: '13px', color: '#475569' }}>
                Phone: {challan.business_phone}
              </p>
              {isTaxable && challan.business_gstin && (
                <p style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                  GSTIN: {challan.business_gstin}
                </p>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
              DELIVERY CHALLAN
            </h2>
            <div className="invoice-tax-badge">
              {includeAmount ? 'Commercial Supply / Dispatch Note' : 'Material Handover Note (Non-Commercial)'}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>
              DC #: <span className="tabular">{challan.challan_number}</span>
            </p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Date: {new Date(challan.dispatch_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Consignee & Transport Grid */}
        <div className="invoice-details-grid">
          <div className="invoice-detail-block">
            <h4>Consignee / Site Location:</h4>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{challan.customer_name}</p>
            {challan.customer_phone && <p style={{ fontSize: '13px', color: '#475569' }}>Phone: {challan.customer_phone}</p>}
            {challan.project_name && <p style={{ fontSize: '13px', color: '#166534', fontWeight: 600 }}>Project: {challan.project_name}</p>}
          </div>

          <div className="invoice-detail-block" style={{ textAlign: 'right' }}>
            <h4>Transport Details:</h4>
            <p style={{ fontSize: '13px', color: '#475569' }}>
              Vehicle No: <strong>{challan.vehicle_no || 'Local Handover'}</strong>
            </p>
            {challan.driver_name && (
              <p style={{ fontSize: '13px', color: '#475569' }}>
                Driver: <strong>{challan.driver_name}</strong>
              </p>
            )}
            <p style={{ fontSize: '13px', color: '#475569' }}>
              Status: <strong>{challan.status.toUpperCase()}</strong>
            </p>
          </div>
        </div>

        {/* Challan Items Table (Dynamic With Amount / Without Amount) */}
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Material / Item Description</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Quantity</th>
              <th style={{ textAlign: 'center', width: '90px' }}>Unit</th>
              {includeAmount ? (
                <>
                  <th style={{ textAlign: 'right', width: '120px' }}>Rate (₹)</th>
                  <th style={{ textAlign: 'right', width: '130px' }}>Amount (₹)</th>
                </>
              ) : (
                <th style={{ textAlign: 'center', width: '150px' }}>Physical Inspection</th>
              )}
            </tr>
          </thead>
          <tbody>
            {challan.items?.map((it, idx) => {
              const qty = Number(it.quantity) || 1;
              const rate = Number(it.unit_price) || 0;
              const itemTotal = Number(it.total) || qty * rate;

              return (
                <tr key={it.id || idx}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{it.product_name}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }} className="tabular">{qty}</td>
                  <td style={{ textAlign: 'center', color: '#64748b' }}>{it.unit || 'Nos'}</td>
                  {includeAmount ? (
                    <>
                      <td style={{ textAlign: 'right' }} className="tabular">₹{rate.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">₹{itemTotal.toFixed(2)}</td>
                    </>
                  ) : (
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      [ &nbsp; &nbsp; ] Verified OK
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Financial Settlement & Totals Grid (Conditional) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            {challan.notes && (
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <strong>Dispatch Notes:</strong> {challan.notes}
              </div>
            )}
            {includeAmount && challan.payment_notes && (
              <div style={{ padding: '8px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '12px', marginTop: '8px', color: '#14532d' }}>
                <strong>Payment Notes:</strong> {challan.payment_notes}
              </div>
            )}
          </div>

          {includeAmount ? (
            <div style={{ width: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Total Dispatched Value:</span>
                <strong className="tabular">₹{total.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#16a34a' }}>
                <span>Paid Amount:</span>
                <strong className="tabular">₹{paid.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', color: due > 0 ? '#dc2626' : '#16a34a' }}>
                <strong>Due Balance:</strong>
                <strong className="tabular" style={{ fontSize: '17px' }}>₹{due.toFixed(2)}</strong>
              </div>
            </div>
          ) : (
            <div style={{ width: '320px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📦</span> Material Handover Summary
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                Total Quantity: <strong>{totalItemsCount} units</strong> across <strong>{challan.items?.length || 0}</strong> varieties.
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Non-commercial delivery note. Commercial valuation omitted for site delivery and transporter dispatch.
              </div>
            </div>
          )}
        </div>

        {/* Declarations & Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px' }}></div>
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: '#475569' }}>
              Receiver's Signature / Stamp
            </p>
          </div>

          <div style={{ textAlign: 'center', width: '200px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', height: '40px' }}></div>
            <p style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: '#475569' }}>
              Authorized Dispatcher Signature
            </p>
          </div>
        </div>
      </div>

      {/* Send / WhatsApp Modal */}
      {sendModalOpen && (
        <div className="dialog-overlay no-print" onClick={() => setSendModalOpen(false)}>
          <div className="dialog-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Send Delivery Challan #{challan.challan_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSendModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="dialog-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Optional Amount Toggle Choice */}
              <div>
                <label className="form-label" style={{ marginBottom: '6px', fontWeight: 600 }}>
                  Select Delivery Challan Format:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: sendWithAmount ? '2px solid #059669' : '1px solid #e2e8f0',
                      backgroundColor: sendWithAmount ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: sendWithAmount ? 700 : 500,
                      color: sendWithAmount ? '#065f46' : '#334155'
                    }}
                  >
                    <input
                      type="radio"
                      name="sendAmountOption"
                      checked={sendWithAmount}
                      onChange={() => handleToggleSendMode(true)}
                    />
                    <span>💰 With Amount (Commercial)</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: !sendWithAmount ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      backgroundColor: !sendWithAmount ? '#e0f2fe' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: !sendWithAmount ? 700 : 500,
                      color: !sendWithAmount ? '#0369a1' : '#334155'
                    }}
                  >
                    <input
                      type="radio"
                      name="sendAmountOption"
                      checked={!sendWithAmount}
                      onChange={() => handleToggleSendMode(false)}
                    />
                    <span>📦 Without Amount (Quantity Only)</span>
                  </label>
                </div>
              </div>

              {/* Recipient Phone */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Recipient Mobile / WhatsApp Number
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="e.g. 919876543210"
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Include country code (e.g. 91 for India)
                </span>
              </div>

              {/* Message Text Preview */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                    Message Content Preview
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyWhatsAppText}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: copiedText ? '#16a34a' : '#4f46e5',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    {copiedText ? <Check size={13} /> : <Copy size={13} />}
                    {copiedText ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  rows={7}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div className="dialog-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSendModalOpen(false)}
                style={{ padding: '7px 16px', fontSize: '0.8125rem' }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendWhatsAppDirect}
                style={{
                  padding: '7px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: '#059669',
                  borderColor: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ExternalLink size={14} /> Send WhatsApp Text
              </button>
              <button
                type="button"
                className="btn btn-inv"
                onClick={handleSharePdfToWhatsApp}
                disabled={isGeneratingPdf}
                style={{
                  padding: '7px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Send PDF to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Clearance Modal */}
      {paymentModalOpen && (
        <div className="dialog-overlay" onClick={() => setPaymentModalOpen(false)}>
          <div className="dialog-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IndianRupee size={18} style={{ color: 'var(--module-inv-accent)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Record Payment for DC #{challan.challan_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div className="dialog-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Current Outstanding Due:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-danger)' }} className="tabular">
                    ₹{due.toFixed(2)}
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Payment Amount to Collect (₹) <span className="required">*</span>
                  </label>
                  <div className="input-addon-group">
                    <span className="input-addon-prefix">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={due}
                      className="form-input tabular"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">💵 Cash Received</option>
                    <option value="upi">📱 UPI / QR Code</option>
                    <option value="bank_transfer">🏦 Direct Bank Transfer</option>
                    <option value="card">💳 Card Swipe</option>
                    <option value="cheque">📝 Cheque</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Transaction Note</label>
                  <input
                    type="text"
                    className="form-input"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <input
                    type="checkbox"
                    id="convertSingleToInvoiceCheck"
                    checked={convertToInvoice}
                    onChange={(e) => setConvertToInvoice(e.target.checked)}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor="convertSingleToInvoiceCheck" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <strong>Convert to Formal Paid Invoice</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Creates an official paid tax invoice record linked to this delivery challan.
                    </div>
                  </label>
                </div>
              </div>

              <div className="dialog-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaymentModalOpen(false)}
                  style={{ padding: '7px 16px', fontSize: '0.8125rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-inv"
                  disabled={isProcessingPayment}
                  style={{ padding: '7px 20px', fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Clear Due
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
