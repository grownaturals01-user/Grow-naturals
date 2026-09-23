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
  FileText,
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileDown,
  Bell,
  Clock,
  Edit3
} from 'lucide-react';

export const DeliveryChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId, isTaxable } = useBusiness();
  const navigate = useNavigate();

  const [challan, setChallan] = useState<DeliveryChallan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  // Amount display mode (With Amount vs Without Amount)
  const [includeAmount, setIncludeAmount] = useState<boolean>(true);

  // WhatsApp / Share Modal state
  const [sendModalOpen, setSendModalOpen] = useState<boolean>(false);
  const [sendWithAmount, setSendWithAmount] = useState<boolean>(true);
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Due Date Editor state
  const [isEditingDueDate, setIsEditingDueDate] = useState<boolean>(false);
  const [editDueDateVal, setEditDueDateVal] = useState<string>('');
  const [editReminderNotesVal, setEditReminderNotesVal] = useState<string>('');
  const [isSavingDueDate, setIsSavingDueDate] = useState<boolean>(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [convertToInvoice, setConvertToInvoice] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Manager Approval Modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState<boolean>(false);
  const [managerActionNotes, setManagerActionNotes] = useState<string>('');
  const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState<boolean>(false);

  const fetchChallan = () => {
    setIsLoading(true);
    api
      .get(`/delivery-challans/${id}`)
      .then((data) => {
        setChallan(data);
        const due = Number(data.due_amount) || Math.max(0, (Number(data.total_amount) || 0) - (Number(data.paid_amount) || 0));
        setPaymentAmount(String(due));
        setPaymentNotes(`Payment for DC #${data.challan_number}`);
        setEditDueDateVal(data.due_date ? data.due_date.split('T')[0] : '');
        setEditReminderNotesVal(data.reminder_notes || '');
        if (data.customer_phone) {
          const digits = data.customer_phone.replace(/\D/g, '');
          setWhatsappPhone(digits.length === 10 ? `91${digits}` : digits);
        }
        // Auto-open approval popup on initial load if pending approval
        if (data.approval_status === 'pending_approval' && !hasAutoOpenedModal) {
          setApprovalModalOpen(true);
          setHasAutoOpenedModal(true);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleApproveChallan = async (notes?: string) => {
    setIsApproving(true);
    try {
      await api.post(`/delivery-challans/${id}/approve`, { 
        approved_by: 'Manager',
        approval_notes: notes || managerActionNotes || 'Credit limit override approved'
      });
      setApprovalModalOpen(false);
      setManagerActionNotes('');
      fetchChallan();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectChallan = async (reasonInput?: string) => {
    const reason = reasonInput || managerActionNotes || prompt('Please enter rejection reason:', 'Credit limit exceeded override denied');
    if (!reason) return;
    setIsRejecting(true);
    try {
      await api.post(`/delivery-challans/${id}/reject`, { reason, rejected_by: 'Manager' });
      setApprovalModalOpen(false);
      setManagerActionNotes('');
      fetchChallan();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSaveDueDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDueDate(true);
    try {
      await api.put(`/delivery-challans/${id}/due-date`, {
        due_date: editDueDateVal || null,
        reminder_notes: editReminderNotesVal.trim()
      });
      setIsEditingDueDate(false);
      fetchChallan();
    } catch (err: any) {
      alert(`Failed to update due date: ${err.message}`);
    } finally {
      setIsSavingDueDate(false);
    }
  };

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

  let daysUntilDue: number | null = null;
  let dueReminderStatus: 'overdue' | 'due_today' | 'due_soon' | 'upcoming' | null = null;
  if (challan.due_date && due > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dDate = new Date(challan.due_date);
    dDate.setHours(0, 0, 0, 0);
    const diffTime = dDate.getTime() - today.getTime();
    daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) dueReminderStatus = 'overdue';
    else if (daysUntilDue === 0) dueReminderStatus = 'due_today';
    else if (daysUntilDue <= 3) dueReminderStatus = 'due_soon';
    else dueReminderStatus = 'upcoming';
  }

  const handleSendDueReminderWhatsApp = () => {
    if (!challan) return;
    const bizName = challan.legal_name || challan.business_name || (isTaxable ? 'Grow Naturals' : 'Nikhlesh Nursery');
    const formattedDueDate = challan.due_date ? new Date(challan.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'immediate';
    
    let dueMsgHeadline = `Payment is due on *${formattedDueDate}*`;
    if (daysUntilDue !== null && daysUntilDue < 0) {
      dueMsgHeadline = `Payment was due on *${formattedDueDate}* (*Overdue by ${Math.abs(daysUntilDue)} days*)`;
    } else if (daysUntilDue === 0) {
      dueMsgHeadline = `Payment is *Due Today (${formattedDueDate})*`;
    } else if (daysUntilDue !== null && daysUntilDue <= 3) {
      dueMsgHeadline = `Payment is *Due in ${daysUntilDue} day(s) on ${formattedDueDate}*`;
    }

    const reminderMsg = [
      `🔔 *PAYMENT DUE REMINDER — ${bizName.toUpperCase()}* 🔔`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Dear *${challan.customer_name}*,`,
      ``,
      `Greetings from ${bizName}. This is a friendly reminder regarding Delivery Challan *#${challan.challan_number}*.`,
      ``,
      `• *Dispatched Date:* ${new Date(challan.dispatch_date).toLocaleDateString('en-IN')}`,
      `• *Total Value:* ₹${total.toFixed(2)}`,
      `• *Outstanding Due:* *₹${due.toFixed(2)}*`,
      `• *Due Status:* ${dueMsgHeadline}`,
      ...(challan.reminder_notes ? [`• *Notes:* ${challan.reminder_notes}`] : []),
      ``,
      `Kindly arrange for payment settlement at your earliest convenience via UPI, Bank Transfer, or Cash.`,
      `For any questions or invoices, contact ${challan.business_phone || '+91 98220 12345'}.`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Thank you for your business!`
    ].join('\n');

    const phoneDigits = (whatsappPhone || challan.customer_phone || '').replace(/\D/g, '');
    const phoneWithCountry = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(reminderMsg)}`;
    window.open(url, '_blank');
  };

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

            {/* Approval Status Badge */}
            {challan.approval_status === 'pending_approval' ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldAlert size={12} color="#d97706" /> Pending Credit Approval
              </span>
            ) : challan.approval_status === 'rejected' ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <X size={12} color="#dc2626" /> Credit Override Rejected
              </span>
            ) : challan.approved_by ? (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--radius-full)', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} color="#10b981" /> Approved by {challan.approved_by}
              </span>
            ) : null}

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
                gap: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: includeAmount ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: includeAmount ? '#ffffff' : 'transparent',
                color: includeAmount ? 'var(--color-botanical-800)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                boxShadow: includeAmount ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <IndianRupee size={12} style={{ strokeWidth: 2.5 }} /> With Amount
            </button>
            <button
              type="button"
              onClick={() => setIncludeAmount(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: !includeAmount ? 700 : 500,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: !includeAmount ? '#ffffff' : 'transparent',
                color: !includeAmount ? '#0284c7' : 'var(--color-text-muted)',
                cursor: 'pointer',
                boxShadow: !includeAmount ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={13} style={{ strokeWidth: 2.2 }} /> Without Amount
            </button>
          </div>

          {/* Send to WhatsApp Button (Locked if pending approval) */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={challan.approval_status === 'pending_approval' ? () => setApprovalModalOpen(true) : handleOpenSendModal}
            disabled={challan.approval_status === 'rejected'}
            style={{
              fontSize: '0.8125rem',
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: challan.approval_status === 'pending_approval' ? '#fef3c7' : '#059669',
              borderColor: challan.approval_status === 'pending_approval' ? '#fde68a' : '#059669',
              color: challan.approval_status === 'pending_approval' ? '#92400e' : '#ffffff',
              fontWeight: 600,
              boxShadow: challan.approval_status === 'pending_approval' ? 'none' : '0 1px 2px rgba(5, 150, 105, 0.2)'
            }}
            title={challan.approval_status === 'pending_approval' ? 'Credit Approval Required: Click to review manager approval' : 'Send Delivery Challan via WhatsApp'}
          >
            {challan.approval_status === 'pending_approval' ? (
              <>
                <Lock size={14} style={{ color: '#d97706' }} /> Send (Approval Required)
              </>
            ) : (
              <>
                <Send size={14} /> Send Challan
              </>
            )}
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
              onClick={() => {
                if (challan.approval_status === 'pending_approval') {
                  setApprovalModalOpen(true);
                  return;
                }
                setPaymentModalOpen(true);
              }}
              disabled={challan.approval_status === 'rejected'}
              style={{
                fontSize: '0.8125rem',
                padding: '7px 16px',
                fontWeight: 700,
                gap: '5px',
                opacity: challan.approval_status === 'pending_approval' ? 0.7 : 1
              }}
            >
              <IndianRupee size={14} /> Collect Payment
            </button>
          )}

          {challan.status !== 'delivered' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (challan.approval_status === 'pending_approval') {
                  setApprovalModalOpen(true);
                  return;
                }
                handleMarkDelivered();
              }}
              disabled={isUpdating || challan.approval_status === 'pending_approval' || challan.approval_status === 'rejected'}
              style={{
                fontSize: '0.8125rem',
                padding: '7px 14px',
                opacity: challan.approval_status === 'pending_approval' ? 0.7 : 1
              }}
            >
              <CheckCircle size={14} /> Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Credit Limit Exceeded Approval Banner */}
      {challan.approval_status === 'pending_approval' && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #f59e0b',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '720px' }}>
            <ShieldAlert size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e', margin: '0 0 4px 0' }}>
                🛡️ Credit Limit Exceeded — Manager Approval Required
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#78350f', margin: 0, lineHeight: 1.45 }}>
                <strong>{challan.approval_reason || `Credit limit of ₹${challan.credit_limit_at_creation} exceeded by ₹${challan.credit_exceeded_amount}.`}</strong>
                <br />
                This Delivery Challan is locked. Sending via WhatsApp, marking as delivered, and invoice conversion are disabled until a manager approves the credit override.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setApprovalModalOpen(true)}
              style={{
                borderColor: '#f59e0b',
                color: '#92400e',
                backgroundColor: '#fef3c7',
                fontWeight: 600,
                padding: '8px 14px'
              }}
            >
              <ShieldAlert size={14} /> Review Popup
            </button>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => handleApproveChallan()}
              disabled={isApproving || isRejecting}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: 700,
                padding: '8px 16px',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {isApproving ? 'Approving...' : 'Approve DC Dispatch'}
            </button>

            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => handleRejectChallan()}
              disabled={isApproving || isRejecting}
              style={{
                color: '#dc2626',
                fontWeight: 600,
                padding: '8px 14px',
                gap: '6px'
              }}
            >
              {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Reject DC
            </button>
          </div>
        </div>
      )}

      {challan.approval_status === 'rejected' && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: '#fee2e2',
            border: '1.5px solid #ef4444',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
            color: '#991b1b'
          }}
        >
          <X size={20} color="#dc2626" />
          <span style={{ fontSize: '0.8125rem' }}>
            <strong>Delivery Challan Rejected:</strong> {challan.approval_reason || 'Credit limit override was denied by manager.'}
          </span>
        </div>
      )}

      {/* Due Banner & Due End Date Reminder */}
      {due > 0 && (
        <div
          className="no-print"
          style={{
            padding: '16px 20px',
            backgroundColor: dueReminderStatus === 'overdue' ? '#fef2f2' : dueReminderStatus === 'due_today' ? '#fff7ed' : dueReminderStatus === 'due_soon' ? '#fffbeb' : 'var(--module-sell-subtle)',
            color: dueReminderStatus === 'overdue' ? '#991b1b' : dueReminderStatus === 'due_today' ? '#9a3412' : dueReminderStatus === 'due_soon' ? '#92400e' : 'var(--module-sell-text)',
            borderRadius: 'var(--radius-xl)',
            border: `1.5px solid ${dueReminderStatus === 'overdue' ? '#fca5a5' : dueReminderStatus === 'due_today' ? '#fdba74' : dueReminderStatus === 'due_soon' ? '#fde68a' : 'var(--module-sell-border)'}`,
            marginBottom: '18px',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '650px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: dueReminderStatus === 'overdue' ? '#fee2e2' : dueReminderStatus === 'due_today' ? '#ffedd5' : '#fef3c7',
                  border: `1px solid ${dueReminderStatus === 'overdue' ? '#fca5a5' : dueReminderStatus === 'due_today' ? '#fdba74' : '#fde68a'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: dueReminderStatus === 'overdue' ? '#dc2626' : dueReminderStatus === 'due_today' ? '#ea580c' : '#d97706',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              >
                <Bell size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>
                    Payment Due: ₹{due.toFixed(2)}
                  </strong>
                  
                  {/* Due Status Pill */}
                  {dueReminderStatus === 'overdue' ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#dc2626', color: '#ffffff' }}>
                      ⚠️ Overdue by {Math.abs(daysUntilDue || 0)} day(s)
                    </span>
                  ) : dueReminderStatus === 'due_today' ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#ea580c', color: '#ffffff' }}>
                      ⏰ Payment Due Today
                    </span>
                  ) : dueReminderStatus === 'due_soon' ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                      ⏳ Due in {daysUntilDue} day(s)
                    </span>
                  ) : challan.due_date ? (
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                      Due on {new Date(challan.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                      No due date set
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.8125rem', margin: '0 0 4px 0', opacity: 0.95 }}>
                  {challan.due_date ? (
                    <>
                      Payment due date set for <strong>{new Date(challan.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
                      {challan.reminder_notes && <span> ({challan.reminder_notes})</span>}
                    </>
                  ) : (
                    <span>Goods dispatched on credit with no specific due date configured.</span>
                  )}
                </p>

                {!isEditingDueDate && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDueDate(true)}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      color: 'var(--color-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'underline'
                    }}
                  >
                    <Edit3 size={11} /> {challan.due_date ? 'Reschedule / Change Due Date' : 'Set Due End Date'}
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleSendDueReminderWhatsApp}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#bbf7d0',
                  color: '#15803d',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  padding: '7px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                title="Send Payment Due Reminder to Customer WhatsApp"
              >
                <Bell size={14} style={{ color: '#16a34a' }} /> Send WhatsApp Due Reminder
              </button>

              <button
                type="button"
                className="btn btn-inv btn-sm"
                onClick={() => setPaymentModalOpen(true)}
                style={{ fontWeight: 700, padding: '7px 16px', fontSize: '0.8125rem' }}
              >
                <IndianRupee size={13} /> Clear Due Now
              </button>
            </div>
          </div>

          {/* In-place Due Date Editor */}
          {isEditingDueDate && (
            <form
              onSubmit={handleSaveDueDate}
              style={{
                marginTop: '6px',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  Due End Date:
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={editDueDateVal}
                  onChange={(e) => setEditDueDateVal(e.target.value)}
                  style={{ width: '160px', fontSize: '0.8125rem', padding: '5px 10px' }}
                  required
                />
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[7, 15, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + days);
                      setEditDueDateVal(d.toISOString().split('T')[0]);
                    }}
                    style={{ padding: '3px 8px', fontSize: '0.72rem', border: '1px solid #cbd5e1' }}
                  >
                    +{days}d
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, minWidth: '180px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={editReminderNotesVal}
                  onChange={(e) => setEditReminderNotesVal(e.target.value)}
                  placeholder="Reminder notes (e.g. Call client post-delivery)..."
                  style={{ fontSize: '0.8125rem', padding: '5px 10px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditingDueDate(false)}
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSavingDueDate}
                  style={{ padding: '5px 14px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  {isSavingDueDate ? <Loader2 size={12} className="animate-spin" /> : 'Save Due Date'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Printable Challan Sheet */}
      <div id="challan-print-sheet" className="a4-invoice-sheet a4-invoice-container" style={{ boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-xl)', padding: '36px 40px', backgroundColor: '#ffffff' }}>
        
        {/* Top Header & Branding */}
        <div className="invoice-branding-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', maxWidth: '62%' }}>
            <img
              src={gnLogo}
              alt="Grow Naturals Logo"
              className="invoice-header-logo"
              loading="eager"
              style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '8px' }}
            />
            <div>
              <h1 className="invoice-biz-title" style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.2 }}>
                {challan.legal_name || challan.business_name || (isTaxable ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm')}
              </h1>
              <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 2px 0', lineHeight: 1.4 }}>
                {challan.business_address || 'No. 19/7, Annasalai, K K Nagar, 80 Feet Road, Madurai-625020, Tamil Nadu'}
              </p>
              <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 2px 0' }}>
                <strong>Phone:</strong> {challan.business_phone || '+91 98220 12345'}
              </p>
              {isTaxable && challan.business_gstin && (
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>
                  GSTIN: {challan.business_gstin}
                </p>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
              DELIVERY CHALLAN
            </h2>
            <div
              style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                backgroundColor: includeAmount ? 'rgba(5, 150, 105, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                color: includeAmount ? '#065f46' : '#0369a1',
                border: `1px solid ${includeAmount ? 'rgba(5, 150, 105, 0.25)' : 'rgba(2, 132, 199, 0.25)'}`
              }}
            >
              {includeAmount ? 'Commercial Supply / Dispatch Note' : 'Material Handover Note (Non-Commercial)'}
            </div>
            <p style={{ fontSize: '13.5px', fontWeight: 700, marginTop: '8px', color: '#0f172a', margin: '8px 0 2px 0' }}>
              DC #: <span className="tabular">{challan.challan_number}</span>
            </p>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Date: <strong>{new Date(challan.dispatch_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
            </p>
          </div>
        </div>

        {/* Consignee & Transport Grid (Structured 2-Panel Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '22px' }}>
          
          {/* Consignee Panel */}
          <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <User size={12} style={{ color: '#0284c7' }} /> Consignee / Delivery Site Location
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              {challan.customer_name}
            </div>
            {challan.customer_phone && (
              <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '3px' }}>
                <strong>Phone:</strong> {challan.customer_phone}
              </div>
            )}
            {challan.project_name && (
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 700, marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                <Building size={11} /> Project: {challan.project_name}
              </div>
            )}
          </div>

          {/* Transport Panel */}
          <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Truck size={12} style={{ color: '#0284c7' }} /> Logistics & Transport Details
            </div>
            <div style={{ fontSize: '13px', color: '#0f172a', marginBottom: '3px' }}>
              Vehicle No: <strong style={{ fontSize: '13.5px' }}>{challan.vehicle_no || 'Local Handover'}</strong>
            </div>
            {challan.driver_name && (
              <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '3px' }}>
                Driver / Transporter: <strong>{challan.driver_name}</strong>
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Status: 
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: challan.status === 'delivered' ? '#dcfce7' : '#fef3c7', color: challan.status === 'delivered' ? '#15803d' : '#b45309', border: `1px solid ${challan.status === 'delivered' ? '#bbf7d0' : '#fde68a'}` }}>
                {challan.status === 'delivered' ? 'DELIVERED TO SITE' : 'IN TRANSIT'}
              </span>
            </div>
          </div>
        </div>

        {/* Challan Items Table */}
        <table className="invoice-items-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1.5px solid #cbd5e1' }}>
              <th style={{ width: '40px', padding: '10px 12px', fontSize: '11.5px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>#</th>
              <th style={{ padding: '10px 12px', fontSize: '11.5px', fontWeight: 700, color: '#334155', textAlign: 'left' }}>Material / Item Description</th>
              <th style={{ textAlign: 'center', width: '120px', padding: '10px 12px', fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Quantity</th>
              <th style={{ textAlign: 'center', width: '90px', padding: '10px 12px', fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Unit</th>
              {includeAmount ? (
                <>
                  <th style={{ textAlign: 'right', width: '120px', padding: '10px 12px', fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Rate (₹)</th>
                  <th style={{ textAlign: 'right', width: '130px', padding: '10px 12px', fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Amount (₹)</th>
                </>
              ) : (
                <th style={{ textAlign: 'center', width: '180px', padding: '10px 12px', fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>Site Inspection</th>
              )}
            </tr>
          </thead>
          <tbody>
            {challan.items?.map((it, idx) => {
              const qty = Number(it.quantity) || 1;
              const rate = Number(it.unit_price) || 0;
              const itemTotal = Number(it.total) || qty * rate;

              return (
                <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ textAlign: 'center', padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{it.product_name}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }} className="tabular">{qty}</td>
                  <td style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{it.unit || 'Nos'}</td>
                  {includeAmount ? (
                    <>
                      <td style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12.5px' }} className="tabular">₹{rate.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, fontSize: '13px', color: '#0f172a' }} className="tabular">₹{itemTotal.toFixed(2)}</td>
                    </>
                  ) : (
                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                        <span style={{ width: '12px', height: '12px', border: '1.5px solid #94a3b8', borderRadius: '2px', display: 'inline-block' }}></span>
                        <span>Received OK</span>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* Total Row for Items */}
            {!includeAmount && (
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1', borderBottom: '1.5px solid #cbd5e1' }}>
                <td colSpan={2} style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                  Total Dispatched Quantity:
                </td>
                <td style={{ textAlign: 'center', padding: '10px 14px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }} className="tabular">
                  {totalItemsCount}
                </td>
                <td style={{ textAlign: 'center', padding: '10px 14px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Units
                </td>
                <td style={{ textAlign: 'center', padding: '10px 14px', fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                  ✓ Verification Pending
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Bottom Section: Notes & Summary Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', gap: '20px', alignItems: 'flex-start' }}>
          
          {/* Left Column: Notes & Handover Terms */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {challan.notes && (
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
                <strong style={{ color: '#0f172a' }}>Dispatch & Handling Notes:</strong> {challan.notes}
              </div>
            )}
            
            {includeAmount && challan.payment_notes && (
              <div style={{ padding: '8px 14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '12px', color: '#14532d' }}>
                <strong>Payment Notes:</strong> {challan.payment_notes}
              </div>
            )}

            {!includeAmount && (
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', lineHeight: 1.45 }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '3px' }}>Site Handover Terms:</div>
                <div>1. Materials listed above have been verified and dispatched in good condition.</div>
                <div>2. Consignee / Site In-charge must inspect materials upon receipt and endorse this note.</div>
                <div>3. This delivery challan serves as non-commercial proof of delivery for site transit.</div>
              </div>
            )}
          </div>

          {/* Right Column: Financial Summary OR Material Summary Card */}
          {includeAmount ? (
            <div style={{ width: '280px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Total Dispatched Value:</span>
                <strong className="tabular">₹{total.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#16a34a' }}>
                <span>Paid Amount:</span>
                <strong className="tabular">₹{paid.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px 0', fontSize: '15px', color: due > 0 ? '#dc2626' : '#16a34a' }}>
                <strong>Due Balance:</strong>
                <strong className="tabular" style={{ fontSize: '17px' }}>₹{due.toFixed(2)}</strong>
              </div>
            </div>
          ) : (
            <div style={{ width: '310px', padding: '14px 16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1.5px solid #bae6fd' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Package size={16} style={{ color: '#0284c7' }} /> Material Dispatch Summary
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', padding: '4px 0', borderBottom: '1px dashed #cbd5e1' }}>
                <span>Total Item Varieties:</span>
                <strong>{challan.items?.length || 0} line item(s)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#0f172a', padding: '6px 0', borderBottom: '1px dashed #cbd5e1' }}>
                <span>Total Quantity Dispatched:</span>
                <strong style={{ fontSize: '13.5px', color: '#0369a1' }}>{totalItemsCount} Units</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
                Commercial valuation omitted for site transit. Unpriced goods dispatch handover note.
              </div>
            </div>
          )}
        </div>

        {/* Declarations & Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ textAlign: 'left', width: '240px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', height: '44px', marginBottom: '6px' }}></div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
              Receiver / Site Supervisor Signature
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              Goods received in full & good condition
            </p>
          </div>

          <div style={{ textAlign: 'right', width: '240px' }}>
            <div style={{ borderBottom: '1px solid #0f172a', height: '44px', marginBottom: '6px' }}></div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
              Authorized Dispatcher Signature
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              For {challan.legal_name || challan.business_name || (isTaxable ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm')}
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <IndianRupee size={13} style={{ color: '#059669', strokeWidth: 2.5 }} /> With Amount (Commercial)
                    </span>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={14} style={{ color: '#0284c7', strokeWidth: 2 }} /> Without Amount (Material Only)
                    </span>
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

      {/* Credit Limit Exceeded Approval Modal Popup */}
      {approvalModalOpen && challan.approval_status === 'pending_approval' && (
        <div className="dialog-overlay" onClick={() => setApprovalModalOpen(false)} style={{ zIndex: 1050 }}>
          <div
            className="dialog-content"
            style={{
              maxWidth: '560px',
              width: '100%',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(217, 119, 6, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="dialog-header"
              style={{
                padding: '18px 22px',
                backgroundColor: '#fffbeb',
                borderBottom: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d97706',
                    flexShrink: 0
                  }}
                >
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                    Credit Limit Exceeded
                  </h3>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', margin: '2px 0 0 0' }}>
                    Manager Approval Required for DC #{challan.challan_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#92400e',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close popup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="dialog-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Highlight Banner / Notice */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #f59e0b',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 700, marginBottom: '3px', color: '#92400e' }}>
                    {challan.approval_reason || `Credit limit of ₹${Number(challan.credit_limit_at_creation || 0).toFixed(2)} exceeded.`}
                  </div>
                  <div>
                    This Delivery Challan is locked. Sending via WhatsApp, marking as delivered, and invoice conversion are disabled until a manager approves the credit override.
                  </div>
                </div>
              </div>

              {/* Financial Metrics Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Credit Limit
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '3px' }} className="tabular">
                    ₹{Number(challan.credit_limit_at_creation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Challan Total
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '3px' }} className="tabular">
                    ₹{Number(challan.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#fee2e2',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fca5a5',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                    Exceeded By
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#b91c1c', marginTop: '3px' }} className="tabular">
                    +₹{Number(challan.credit_exceeded_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <span><strong>Customer:</strong> {challan.customer_name}</span>
                {challan.customer_phone && <span><strong>Phone:</strong> {challan.customer_phone}</span>}
              </div>

              {/* Manager Note Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Manager Decision Note / Reason (Optional)
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={managerActionNotes}
                  onChange={(e) => setManagerActionNotes(e.target.value)}
                  placeholder="e.g. Approved per direct verbal confirmation / client advance on next milestone..."
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              className="dialog-footer"
              style={{
                padding: '14px 22px',
                backgroundColor: 'var(--color-bg-surface-subtle)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApprovalModalOpen(false)}
                style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
              >
                Review Later
              </button>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleRejectChallan()}
                  disabled={isApproving || isRejecting}
                  style={{
                    color: '#dc2626',
                    borderColor: '#fca5a5',
                    backgroundColor: '#fff',
                    fontWeight: 600,
                    padding: '8px 16px',
                    fontSize: '0.8125rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Reject DC
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApproveChallan()}
                  disabled={isApproving || isRejecting}
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    fontWeight: 700,
                    padding: '8px 20px',
                    fontSize: '0.8125rem',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve DC Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
