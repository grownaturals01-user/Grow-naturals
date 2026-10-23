import React, { useState } from 'react';
import { LandscapingProject } from '../../types/landscaping';
import { calculateProjectFinancials, formatCurrency } from '../../utils/calculations';
import {
  X,
  MessageSquare,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Send,
  AlertCircle,
  FileText,
  Building,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

interface SelectedRecipient {
  project: LandscapingProject;
  outstanding: number;
}

interface PaymentReminderModalProps {
  recipients: SelectedRecipient[];
  currency: string;
  onClose: () => void;
}

type ReminderType = 'milestone' | 'advance' | 'settlement' | 'overdue';

const TEMPLATES: Record<ReminderType, { title: string; subject: string; body: string }> = {
  milestone: {
    title: 'Milestone Progress & Part Payment',
    subject: 'Payment Milestone Update - {projectTitle} | TerraFlow',
    body: `Dear {clientName},

Greetings from TerraFlow Landscaping! We are pleased to report that work on your project "{projectTitle}" is progressing smoothly as per schedule.

As per our contracted milestone plan, a scheduled part-payment of {currency}{outstandingAmount} is currently due. Timely settlement helps our site supervisors maintain continuous material deliveries and skilled masonry work on-site.

Payment Summary:
- Project: {projectTitle} ({projectCode})
- Total Contract: {currency}{contractTotal}
- Total Paid to Date: {currency}{paidTotal}
- Balance Outstanding: {currency}{outstandingAmount}

Kindly arrange the transfer and share the transaction reference at your earliest convenience.

Warm regards,
Accounts & Billing Team
TerraFlow Landscaping & Design Studio`,
  },
  advance: {
    title: 'Initial Advance & Mobilization Notice',
    subject: 'Advance Payment Request - {projectTitle} | TerraFlow',
    body: `Dear {clientName},

Thank you for approving our landscape design and quotation for "{projectTitle}".

To initiate material procurement, soil prep, and mobilize site workers, the agreed advance payment of {currency}{outstandingAmount} is now payable.

Project Summary:
- Project: {projectTitle} ({projectCode})
- Scope: Landscape Design, Hardscape & Planting
- Advance Amount Due: {currency}{outstandingAmount}

Please process the transfer via UPI/NEFT so our site team can schedule immediate earthwork and nursery deliveries.

Best regards,
TerraFlow Landscaping Operations`,
  },
  settlement: {
    title: 'Final Handover & Settlement Invoice',
    subject: 'Final Settlement & Handover Statement - {projectTitle} | TerraFlow',
    body: `Dear {clientName},

We are pleased to inform you that landscape construction and planting at "{projectTitle}" have been successfully completed and the site is ready for final handover and inspection!

The final settlement statement for your project is as follows:
- Total Contract & Approved Variations: {currency}{contractTotal}
- Total Advance & Installments Received: {currency}{paidTotal}
- Final Settlement Balance Due: {currency}{outstandingAmount}

Please review the final statement and arrange the closing balance payment. We are grateful for the opportunity to transform your outdoor living space!

Warm regards,
TerraFlow Landscaping`,
  },
  overdue: {
    title: 'Gentle Overdue Balance Follow-up',
    subject: 'Friendly Follow-up: Outstanding Balance for {projectTitle}',
    body: `Dear {clientName},

This is a gentle reminder regarding the pending balance of {currency}{outstandingAmount} for "{projectTitle}" ({projectCode}).

We understand schedules get busy. If this payment is already in transit, please disregard this notice and kindly reply with the payment reference. Otherwise, we appreciate your prompt assistance in clearing this balance.

Outstanding Balance: {currency}{outstandingAmount}

Thank you for your cooperation!

Sincerely,
Accounts Department
TerraFlow Landscaping`,
  },
};

export const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({
  recipients,
  currency,
  onClose,
}) => {
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [reminderType, setReminderType] = useState<ReminderType>('milestone');
  const [customBody, setCustomBody] = useState<string>(TEMPLATES.milestone.body);
  const [customSubject, setCustomSubject] = useState<string>(TEMPLATES.milestone.subject);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleTemplateChange = (type: ReminderType) => {
    setReminderType(type);
    setCustomBody(TEMPLATES[type].body);
    setCustomSubject(TEMPLATES[type].subject);
  };

  const totalOutstandingSum = recipients.reduce((sum, r) => sum + r.outstanding, 0);

  const generatePersonalizedMessage = (
    recipient: SelectedRecipient,
    templateText: string
  ): string => {
    const p = recipient.project;
    const fin = calculateProjectFinancials(p);
    return templateText
      .replace(/{clientName}/g, p.step1Enquiry.clientName || 'Valued Client')
      .replace(/{projectTitle}/g, p.title)
      .replace(/{projectCode}/g, p.code)
      .replace(/{currency}/g, currency)
      .replace(/{outstandingAmount}/g, recipient.outstanding.toLocaleString('en-IN'))
      .replace(/{contractTotal}/g, fin.totalContractValue.toLocaleString('en-IN'))
      .replace(/{paidTotal}/g, fin.totalCollected.toLocaleString('en-IN'));
  };

  const getCleanPhoneNumber = (phone: string): string => {
    // Remove spaces, hyphens, parentheses
    const cleaned = phone.replace(/[^0-9]/g, '');
    // If 10 digits (India standard), prefix 91
    if (cleaned.length === 10) return `91${cleaned}`;
    return cleaned;
  };

  const handleOpenWhatsApp = (recipient: SelectedRecipient) => {
    const cleanPhone = getCleanPhoneNumber(recipient.project.step1Enquiry.phone);
    const text = generatePersonalizedMessage(recipient, customBody);
    const encoded = encodeURIComponent(text);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenEmail = (recipient: SelectedRecipient) => {
    const email = recipient.project.step1Enquiry.email;
    const subject = generatePersonalizedMessage(recipient, customSubject);
    const body = generatePersonalizedMessage(recipient, customBody);
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleCopySingle = (recipient: SelectedRecipient) => {
    const text = generatePersonalizedMessage(recipient, customBody);
    navigator.clipboard.writeText(text);
    setCopiedId(recipient.project.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const allTexts = recipients
      .map(r => {
        const p = r.project;
        return `========================================\nTO: ${p.step1Enquiry.clientName} (${p.step1Enquiry.phone || p.step1Enquiry.email})\nPROJECT: ${p.title} [${p.code}]\nOUTSTANDING: ${currency} ${r.outstanding.toLocaleString('en-IN')}\n\n${generatePersonalizedMessage(r, customBody)}`;
      })
      .join('\n\n\n');

    navigator.clipboard.writeText(allTexts);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl my-6 border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-800 text-emerald-200">
                <Send className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight">
                Customer Payment Reminders Dispatcher
              </h2>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Generating reminders for {recipients.length} client{recipients.length > 1 ? 's' : ''} with total receivables of{' '}
              <strong className="text-white font-semibold">
                {formatCurrency(totalOutstandingSum, currency)}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Selection: Channel & Template Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Channel Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Communication Channel</label>
              <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveChannel('whatsapp')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    activeChannel === 'whatsapp'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200" />
                  <span>WhatsApp Reminder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChannel('email')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    activeChannel === 'email'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Mail className="w-4 h-4 text-emerald-200" />
                  <span>Email Statement</span>
                </button>
              </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Reminder Template Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {(['milestone', 'advance', 'settlement', 'overdue'] as ReminderType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTemplateChange(type)}
                    className={`text-left px-3 py-2 rounded-lg text-xs border transition-all ${
                      reminderType === type
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-700'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="truncate">{TEMPLATES[type].title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editable Template Text */}
          <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                Customize Reminder Text (Supports Dynamic Variables)
              </span>
              <div className="text-[11px] text-neutral-500">
                Variables: <code className="bg-neutral-200 px-1 py-0.5 rounded text-[10px]">{"{clientName}"}</code>{' '}
                <code className="bg-neutral-200 px-1 py-0.5 rounded text-[10px]">{"{projectTitle}"}</code>{' '}
                <code className="bg-neutral-200 px-1 py-0.5 rounded text-[10px]">{"{outstandingAmount}"}</code>
              </div>
            </div>

            {activeChannel === 'email' && (
              <div>
                <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Email Subject</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Message Body</label>
              <textarea
                rows={5}
                value={customBody}
                onChange={e => setCustomBody(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Recipients List & Live Individual Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Recipients & Preview ({recipients.length})
              </h3>
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-emerald-800 font-semibold bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-md transition-colors"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'All Copied to Clipboard!' : 'Copy All Formatted Reminders'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {recipients.map(r => {
                const p = r.project;
                const fin = calculateProjectFinancials(p);
                const isCopied = copiedId === p.id;
                const sampleMsg = generatePersonalizedMessage(r, customBody);

                return (
                  <div
                    key={p.id}
                    className="border border-neutral-200 rounded-xl p-4 bg-white hover:border-neutral-300 transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-neutral-900">
                            {p.step1Enquiry.clientName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                            {p.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-3">
                          <span>{p.title}</span>
                          <span>•</span>
                          <span>{p.step1Enquiry.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-500 block">Outstanding Balance:</span>
                          <span className="text-xs font-bold text-amber-800 tabular-nums">
                            {formatCurrency(r.outstanding, currency)}
                          </span>
                        </div>

                        {/* Direct Trigger Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {activeChannel === 'whatsapp' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(r)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                              title={`Send WhatsApp message to ${p.step1Enquiry.phone}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEmail(r)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                              title={`Send email to ${p.step1Enquiry.email}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Open Email</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopySingle(r)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                            title="Copy message to clipboard"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsed message preview snippet */}
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-[11px] text-neutral-600 leading-relaxed font-sans whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {sampleMsg}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5">
                      <div className="flex items-center gap-3">
                        <span>📞 {p.step1Enquiry.phone || 'No phone recorded'}</span>
                        <span>✉️ {p.step1Enquiry.email || 'No email recorded'}</span>
                      </div>
                      <div className="text-neutral-500 font-medium">
                        Progress: {fin.collectionProgressPercent}% collected of {formatCurrency(fin.totalContractValue, currency)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-3.5 bg-neutral-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500">
            Selected: <strong className="text-neutral-800">{recipients.length} clients</strong> · Total:{' '}
            <strong className="text-neutral-800">{formatCurrency(totalOutstandingSum, currency)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
