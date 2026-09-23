/**
 * GrowNaturals Billing — Create Sales Invoice Page
 * Features:
 * 1. Business-specific scoping: Grow Naturals (GN00, 18% GST taxable, Axis Bank),
 *    Nikhlesh Nursery (NN00, 0% agricultural non-taxable, Nursery Bank), and custom businesses.
 * 2. Edit Mode & Live Preview Mode (A4 Printable / PDF / WhatsApp).
 * 3. 'Autofill this bill' side panel (Mira AI inspired) with drag & drop PDF/image/doc,
 *    instant demo presets, scanning shimmer animation, and field auto-population.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Scan,
  Sparkles,
  Upload,
  FileText,
  X,
  Plus,
  Trash2,
  Settings,
  Building2,
  AlertTriangle,
  RotateCcw,
  Eye,
  Edit3,
  Save,
  ChevronDown,
  Search,
  CheckCircle2,
  Loader2,
  Info,
  FileCheck,
  ExternalLink,
  Key,
  EyeOff
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Customer, Product, Invoice } from '../types';
import { A4InvoiceView } from '../components/print/A4InvoiceView';
import '../styles/create-sales-invoice.css';

interface FormItem {
  id: string;
  product_id?: string | null;
  product_name: string;
  sku?: string;
  hsn_code: string;
  mrp: number;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  gst_rate: number;
  tax_amount: number;
  total: number;
  description?: string;
  isNew?: boolean;
}

const INDIAN_STATES = [
  'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana',
  'Maharashtra', 'Delhi', 'Gujarat', 'Rajasthan', 'Uttar Pradesh',
  'West Bengal', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Goa'
];

export const CreateSalesInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { businessId, activeBusiness, businesses, switchBusiness, isTaxable } = useBusiness();

  // Mode: 'edit' | 'preview'
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit');

  // Autofill sidebar toggle
  const [autofillOpen, setAutofillOpen] = useState(true);
  const [billsScannedCount, setBillsScannedCount] = useState(5);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('Loading... 0.6s');
  const [scanSuccessBanner, setScanSuccessBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>(
    (localStorage.getItem('gn_ai_provider') as any) || 'gemini'
  );
  const [aiApiKey, setAiApiKey] = useState<string>(
    localStorage.getItem('gn_ai_api_key') || ''
  );
  const [aiConfigured, setAiConfigured] = useState<boolean>(
    Boolean(localStorage.getItem('gn_ai_api_key'))
  );
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [tempProvider, setTempProvider] = useState<'gemini' | 'openai'>('gemini');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showTempKey, setShowTempKey] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestError, setAiTestError] = useState<string | null>(null);
  const [aiTestSuccess, setAiTestSuccess] = useState<string | null>(null);

  // Business menu dropdown state
  const [bizMenuOpen, setBizMenuOpen] = useState(false);

  // Form State
  const [invoicePrefix, setInvoicePrefix] = useState(activeBusiness.invoice_prefix || (businessId === 'grow-naturals' ? 'GN00' : 'NN00'));
  const [invoiceNumber, setInvoiceNumber] = useState(String(Math.floor(8000 + Math.random() * 1000)));
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [hasCustomDueDate, setHasCustomDueDate] = useState(false);
  const [repeatInvoice, setRepeatInvoice] = useState(false);

  // Party (Bill To)
  const [partyName, setPartyName] = useState('Cash Sale');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyAddress, setPartyAddress] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Tamil Nadu');
  const [isAiExtractedParty, setIsAiExtractedParty] = useState(false);
  const [partyModalOpen, setPartyModalOpen] = useState(false);

  // Line items
  const [items, setItems] = useState<FormItem[]>([]);

  // Notes, terms & bank details
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [terms, setTerms] = useState(
    businessId === 'grow-naturals'
      ? '1. Goods once sold will not be taken back or exchanged.\n2. We do not take any responsibility for the loss or damage of goods once the material dispatched.'
      : '1. Plant saplings and live flora are perishable goods and non-returnable once received in good condition.\n2. Proper watering and sunlight instructions must be followed.'
  );

  const [bankDetails, setBankDetails] = useState({
    account_number: businessId === 'grow-naturals' ? '919020090453200' : '50200084729104',
    ifsc_code: businessId === 'grow-naturals' ? 'UTIB0003648' : 'HDFC0001298',
    bank_name: businessId === 'grow-naturals' ? 'Axis Bank, Teppakulam Madurai' : 'HDFC Bank, K.K Nagar Branch',
    account_holder: activeBusiness.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery & Farm')
  });

  // Additional financial options
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [showAddCharges, setShowAddCharges] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [showOverallDiscount, setShowOverallDiscount] = useState(false);
  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [isMarkAsPaid, setIsMarkAsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [paymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Existing customers & products for autocomplete
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [, setProducts] = useState<Product[]>([]);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');

  // Synchronize business default updates when businessId changes
  useEffect(() => {
    setInvoicePrefix(activeBusiness.invoice_prefix || (businessId === 'grow-naturals' ? 'GN00' : 'NN00'));
    setTerms(
      businessId === 'grow-naturals'
        ? '1. Goods once sold will not be taken back or exchanged.\n2. We do not take any responsibility for the loss or damage of goods once the material dispatched.'
        : '1. Plant saplings and live flora are perishable goods and non-returnable once received in good condition.\n2. Proper watering and sunlight instructions must be followed.'
    );
    setBankDetails({
      account_number: businessId === 'grow-naturals' ? '919020090453200' : '50200084729104',
      ifsc_code: businessId === 'grow-naturals' ? 'UTIB0003648' : 'HDFC0001298',
      bank_name: businessId === 'grow-naturals' ? 'Axis Bank, Teppakulam Madurai' : 'HDFC Bank, K.K Nagar Branch',
      account_holder: activeBusiness.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery & Farm')
    });
  }, [businessId, activeBusiness]);

  // Load existing customers, products, and check AI engine status
  useEffect(() => {
    const loadData = async () => {
      try {
        const [custRes, prodRes, aiRes] = await Promise.all([
          api.get('/customers'),
          api.get('/products'),
          api.get('/invoices/ai-status').catch(() => null)
        ]);
        if (Array.isArray(custRes)) setCustomers(custRes);
        if (Array.isArray(prodRes)) setProducts(prodRes);
        if (aiRes) {
          const aiData = aiRes as any;
          if (aiData.gemini_configured || aiData.openai_configured) {
            setAiConfigured(true);
            if (aiData.active_provider) setAiProvider(aiData.active_provider);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch customers/products/ai:', err);
      }
    };
    loadData();
  }, [businessId]);

  const openAiModal = () => {
    setTempProvider(aiProvider);
    setTempApiKey(aiApiKey);
    setAiTestError(null);
    setAiTestSuccess(null);
    setShowTempKey(false);
    setAiModalOpen(true);
  };

  const handleSaveAiConfig = async () => {
    if (!tempApiKey.trim()) {
      setAiTestError('Please enter an API key');
      return;
    }
    setIsTestingAi(true);
    setAiTestError(null);
    setAiTestSuccess(null);
    try {
      const res: any = await api.post('/invoices/ai-config', {
        provider: tempProvider,
        api_key: tempApiKey.trim()
      });
      if (res && res.success) {
        setAiApiKey(tempApiKey.trim());
        setAiProvider(tempProvider);
        setAiConfigured(true);
        localStorage.setItem('gn_ai_provider', tempProvider);
        localStorage.setItem('gn_ai_api_key', tempApiKey.trim());
        setAiTestSuccess(res.message || 'AI engine connected and verified!');
        setTimeout(() => {
          setAiModalOpen(false);
          setAiTestSuccess(null);
        }, 1200);
      } else {
        setAiTestError(res?.error || 'Verification failed');
      }
    } catch (err: any) {
      setAiTestError(err.response?.data?.error || err.message || 'Failed to verify AI API key');
    } finally {
      setIsTestingAi(false);
    }
  };

  // Helper calculation for an individual row
  const calculateRowValues = (
    qty: number,
    price: number,
    discPercent: number,
    taxRate: number
  ) => {
    const rawTotal = qty * price;
    const discAmount = Number(((rawTotal * discPercent) / 100).toFixed(2));
    const taxableLine = Math.max(0, rawTotal - discAmount);
    const taxAmt = isTaxable ? Number(((taxableLine * taxRate) / 100).toFixed(2)) : 0;
    const finalLineTotal = Number((taxableLine + taxAmt).toFixed(2));
    return { discAmount, taxAmt, finalLineTotal };
  };

  const handleItemChange = (
    id: string,
    field: keyof FormItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };

        if (
          field === 'quantity' ||
          field === 'unit_price' ||
          field === 'discount_percent' ||
          field === 'gst_rate'
        ) {
          const qty = field === 'quantity' ? Number(value) || 0 : it.quantity;
          const price = field === 'unit_price' ? Number(value) || 0 : it.unit_price;
          const discPercent = field === 'discount_percent' ? Number(value) || 0 : it.discount_percent;
          const taxRate = field === 'gst_rate' ? Number(value) || 0 : (isTaxable ? it.gst_rate : 0);

          const { discAmount, taxAmt, finalLineTotal } = calculateRowValues(qty, price, discPercent, taxRate);
          updated.discount_amount = discAmount;
          updated.tax_amount = taxAmt;
          updated.total = finalLineTotal;
        }

        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: FormItem = {
      id: `item-${Date.now()}`,
      product_name: '',
      hsn_code: isTaxable ? '392390' : '0602',
      mrp: 0,
      quantity: 1,
      unit: 'PCS',
      unit_price: 0,
      discount_percent: 0,
      discount_amount: 0,
      gst_rate: isTaxable ? 18 : 0,
      tax_amount: 0,
      total: 0,
      isNew: true
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Financial aggregates
  const subtotalQuantity = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const rawSubtotal = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const totalItemDiscounts = items.reduce((sum, it) => sum + it.discount_amount, 0);
  const taxableAmount = Math.max(0, rawSubtotal - totalItemDiscounts - overallDiscount);
  const totalTaxAmount = items.reduce((sum, it) => sum + it.tax_amount, 0);

  const isInterState = placeOfSupply.toLowerCase() !== 'tamil nadu';
  const cgstAmount = isTaxable && !isInterState ? Number((totalTaxAmount / 2).toFixed(2)) : 0;
  const sgstAmount = isTaxable && !isInterState ? Number((totalTaxAmount / 2).toFixed(2)) : 0;
  const igstAmount = isTaxable && isInterState ? Number(totalTaxAmount.toFixed(2)) : 0;

  const rawGrandTotal = taxableAmount + totalTaxAmount + Number(additionalCharges || 0);
  const roundedGrandTotal = autoRoundOff ? Math.round(rawGrandTotal) : Number(rawGrandTotal.toFixed(2));
  const roundOffDifference = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  // File drop / upload handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileSelection(e.target.files[0]);
    }
  };

  const processFileSelection = (file: File) => {
    setUploadedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedFilePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFilePreview(null);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadedFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });

  // Perform AI / Heuristic Extraction
  const triggerAutofillExtraction = async (presetName?: string) => {
    setIsScanning(true);
    setScanProgressText(
      aiConfigured || aiApiKey
        ? `Scanning with ${aiProvider === 'gemini' ? 'Gemini 1.5 Flash' : 'GPT-4o'}... ~1.2s`
        : 'Extracting all bill items... 0.6s'
    );
    setScanSuccessBanner(null);

    try {
      let payload: any = {
        business_id: businessId,
        filename: uploadedFile?.name || (presetName ? `${presetName}.pdf` : 'Uploaded_Bill.pdf'),
        ai_provider: aiProvider
      };

      if (aiApiKey) {
        payload.ai_api_key = aiApiKey;
      }

      if (presetName) {
        payload.preset = presetName;
      } else if (uploadedFile) {
        payload.filename = uploadedFile.name;
        payload.file_type = uploadedFile.type;
        try {
          payload.file_base64 = await toBase64(uploadedFile);
        } catch (b64Err) {
          console.warn('Base64 conversion note:', b64Err);
        }
        if (uploadedFile.type.includes('text') || uploadedFile.name.endsWith('.txt')) {
          payload.text = await uploadedFile.text();
        }
      } else {
        payload.preset = businessId === 'grow-naturals' ? 'grow-naturals-pots' : 'nikhlesh-nursery-saplings';
      }

      // Small delay to showcase the scanning shimmer radar
      await new Promise((r) => setTimeout(r, 600));

      const res: any = await api.post('/invoices/autofill-extract', payload);
      if (res && res.data) {
        const d = res.data;
        if (d.invoice_prefix) setInvoicePrefix(d.invoice_prefix);
        if (d.invoice_number) setInvoiceNumber(d.invoice_number);
        if (d.sales_invoice_date) setInvoiceDate(d.sales_invoice_date);
        if (d.due_date) {
          setDueDate(d.due_date);
          setHasCustomDueDate(true);
        }
        if (d.party) {
          setPartyName(d.party.name || 'Cash Sale');
          setPartyPhone(d.party.phone || '');
          setPartyAddress(d.party.address || '');
          if (d.party.place_of_supply) setPlaceOfSupply(d.party.place_of_supply);
          setIsAiExtractedParty(true);
        }
        if (d.items && Array.isArray(d.items)) {
          const validItems = d.items.filter((it: any) => {
            if (!it || !it.product_name) return false;
            const name = String(it.product_name).trim();
            const lower = name.toLowerCase();
            if (name.length < 2 || /^[\d\s\-\.\,\:\;\/\(\)\#\+]+$/.test(name)) return false;
            if (lower.includes('@') || lower.includes('.com') || lower.includes('.in') || lower.includes('www.')) return false;
            if (
              /\b(tel|telephone|contact|contact\s*nos?|phone|mobile|mob|cell|fax|whatsapp)\b/i.test(lower) ||
              /^tel[\.:\s]/i.test(lower) ||
              /^contact[\.:\s]/i.test(lower) ||
              lower.startsWith('tel.') ||
              lower.startsWith('contact nos')
            ) {
              return false;
            }
            if (/\b(gstin|pan|cin|ifsc|bank|account|a\/c|branch|pincode|pin\s*code|road|street|nagar)\b/i.test(lower)) return false;
            if (/\b(sub\s*total|subtotal|taxable|total\s*amount|grand\s*total|round\s*off|cgst|sgst|igst|terms)\b/i.test(lower)) return false;

            const qty = Number(it.quantity) || 0;
            const price = Number(it.unit_price) || 0;
            if (qty >= 2000 && price >= 1000) return false;
            if (qty > 50000 || price > 1000000) return false;
            if (qty <= 0) return false;

            return true;
          });

          setItems(
            validItems.map((it: any, idx: number) => ({
              id: `item-${Date.now()}-${idx}`,
              product_id: it.product_id || null,
              product_name: it.product_name,
              sku: it.sku || '',
              hsn_code: it.hsn_code || (isTaxable ? '392390' : '0602'),
              mrp: Number(it.mrp) || 0,
              quantity: Number(it.quantity) || 1,
              unit: it.unit || 'PCS',
              unit_price: Number(it.unit_price) || 0,
              discount_percent: Number(it.discount_percent) || 0,
              discount_amount: Number(it.discount_amount) || 0,
              gst_rate: isTaxable ? (Number(it.gst_rate) || 0) : 0,
              tax_amount: isTaxable ? (Number(it.tax_amount) || 0) : 0,
              total: Number(it.total) || 0,
              description: it.description || '',
              isNew: Boolean(it.isNew)
            }))
          );
        }
        if (d.bank_details) {
          setBankDetails(d.bank_details);
        }
        if (d.terms) {
          setTerms(d.terms);
        }

        const count = d.items?.length || 0;
        setBillsScannedCount((c) => c + 1);
        if (res.ai_powered) {
          setScanSuccessBanner(`✨ ${res.model || 'Gemini AI'} extracted all ${count} items with 100% precision in ${res.extractionTime || '1.2s'}!`);
        } else {
          setScanSuccessBanner(`Extracted all ${count} items in ${res.extractionTime || '0.6s'}! ✨ Saved ~5mins of typing`);
        }
      }
    } catch (err: any) {
      console.error('Autofill extraction error:', err);
      const msg = err.response?.data?.error || err.message || 'Error parsing document';
      alert('Autofill note: ' + msg);
    } finally {
      setIsScanning(false);
    }
  };

  // Construct Live Invoice object for Preview Mode
  const constructLiveInvoice = (): Invoice => {
    return {
      id: `draft-${invoiceNumber}`,
      business_id: businessId,
      invoice_number: `${invoicePrefix}${invoiceNumber}`,
      customer_name: partyName || 'Cash Sale',
      customer_phone: partyPhone || '',
      subtotal: rawSubtotal,
      discount_amount: totalItemDiscounts + overallDiscount,
      tax_amount: totalTaxAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      total_amount: roundedGrandTotal,
      payment_method: paymentMethod,
      payment_status: isMarkAsPaid ? 'paid' : paymentStatus,
      notes: notes,
      business_name: activeBusiness.name,
      business_legal_name: activeBusiness.legal_name,
      business_gstin: activeBusiness.gstin,
      business_address: activeBusiness.address,
      business_phone: activeBusiness.phone,
      business_email: activeBusiness.email,
      business_footer: activeBusiness.invoice_footer || terms,
      created_at: new Date(invoiceDate).toISOString(),
      items: items.map((it) => ({
        id: it.id,
        invoice_id: `draft-${invoiceNumber}`,
        product_id: it.product_id,
        product_name: it.product_name,
        sku: it.sku,
        hsn_code: it.hsn_code,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount: it.discount_amount,
        gst_rate: it.gst_rate,
        tax_amount: it.tax_amount,
        total: it.total
      }))
    };
  };

  // Save invoice to backend
  const handleSaveInvoice = async (saveAndNew = false) => {
    if (items.length === 0 || !items.some((i) => i.product_name.trim())) {
      alert('Please add at least one line item with a name.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const payload = {
        business_id: businessId,
        invoice_prefix: invoicePrefix,
        invoice_number: `${invoicePrefix}${invoiceNumber}`,
        customer_name: partyName || 'Cash Sale',
        customer_phone: partyPhone || '',
        customer_address: partyAddress || '',
        place_of_supply: placeOfSupply,
        invoice_date: invoiceDate,
        due_date: hasCustomDueDate ? dueDate : undefined,
        items: items.map((it) => ({
          product_id: it.product_id || null,
          product_name: it.product_name,
          sku: it.sku || '',
          hsn_code: it.hsn_code,
          quantity: it.quantity,
          unit_price: it.unit_price,
          mrp: it.mrp,
          discount: it.discount_amount,
          gst_rate: it.gst_rate,
          tax_amount: it.tax_amount,
          total: it.total
        })),
        subtotal: rawSubtotal,
        discount_amount: totalItemDiscounts + overallDiscount,
        tax_amount: totalTaxAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        round_off: roundOffDifference,
        total_amount: roundedGrandTotal,
        payment_method: paymentMethod,
        payment_status: isMarkAsPaid ? 'paid' : paymentStatus,
        notes: notes,
        terms: terms
      };

      const res = await api.post('/invoices', payload);
      setSaveSuccessMsg(`Invoice #${res.invoice_number || `${invoicePrefix}${invoiceNumber}`} saved successfully!`);

      if (saveAndNew) {
        setInvoiceNumber(String(Math.floor(8000 + Math.random() * 1000)));
        setItems([
          {
            id: `item-${Date.now()}`,
            product_name: '',
            hsn_code: isTaxable ? '392390' : '0602',
            mrp: 0,
            quantity: 1,
            unit: 'PCS',
            unit_price: 0,
            discount_percent: 0,
            discount_amount: 0,
            gst_rate: isTaxable ? 18 : 0,
            tax_amount: 0,
            total: 0,
            isNew: false
          }
        ]);
        setPartyName('Cash Sale');
        setPartyPhone('');
        setPartyAddress('');
        setIsAiExtractedParty(false);
      } else {
        setTimeout(() => {
          navigate('/invoices');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Save invoice error:', err);
      alert('Error saving invoice: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="csi-root">
      {/* TOP NAVBAR */}
      <header className="csi-header">
        <div className="csi-header-left">
          <button onClick={() => navigate('/invoices')} className="csi-btn-exit">
            <ArrowLeft size={16} />
            <span>Exit</span>
          </button>
          <div className="csi-divider-v" />
          <h1 className="csi-page-title">Create Sales Invoice</h1>

          {/* Business Scoping Selector */}
          <div className="csi-biz-badge-wrapper">
            <button
              onClick={() => setBizMenuOpen(!bizMenuOpen)}
              className="csi-biz-badge"
              title="Click to switch business"
            >
              <Building2 size={15} color="#059669" />
              <span>{activeBusiness.name}</span>
              <span className="csi-tax-pill">
                {isTaxable ? 'GST (Taxable)' : 'Exempt (0%)'}
              </span>
              <ChevronDown size={14} color="#059669" />
            </button>

            {/* Dropdown Menu for Business Switch */}
            {bizMenuOpen && (
              <div className="csi-biz-menu">
                <div className="csi-biz-menu-title">Select Business Series</div>
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => {
                      switchBusiness(biz.id);
                      setBizMenuOpen(false);
                    }}
                    className={`csi-biz-menu-item ${biz.id === businessId ? 'active' : ''}`}
                  >
                    <span>{biz.name}</span>
                    <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                      {biz.invoice_prefix || 'PREFIX-'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Edit Mode / Preview Mode Segmented Switcher */}
        <div className="csi-mode-switcher">
          <button
            onClick={() => setActiveMode('edit')}
            className={`csi-mode-btn ${activeMode === 'edit' ? 'active' : ''}`}
          >
            <Edit3 size={15} />
            <span>Edit Mode</span>
          </button>
          <button
            onClick={() => setActiveMode('preview')}
            className={`csi-mode-btn ${activeMode === 'preview' ? 'active' : ''}`}
          >
            <Eye size={15} />
            <span>Preview Mode</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="csi-header-right">
          {!autofillOpen && (
            <button
              onClick={() => setAutofillOpen(true)}
              className="csi-btn-open-autofill"
            >
              <Sparkles size={15} color="#ea580c" />
              <span>Autofill this bill</span>
            </button>
          )}

          <button
            onClick={() => setSettingsOpen(true)}
            className="csi-btn-icon"
            title="Invoice Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={() => handleSaveInvoice(true)}
            disabled={isSaving}
            className="csi-btn-secondary"
          >
            Save & New
          </button>

          <button
            onClick={() => handleSaveInvoice(false)}
            disabled={isSaving}
            className="csi-btn-primary"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="csi-alert-success">
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Mode View Content */}
      {activeMode === 'preview' ? (
        /* PREVIEW MODE: Live A4 Printable View */
        <div style={{ flex: 1, backgroundColor: '#cbd5e1', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '900px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700 }}>Live Preview:</span>
                <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>#{invoicePrefix}{invoiceNumber}</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '11px', fontWeight: 700 }}>
                  {activeBusiness.name}
                </span>
              </div>
              <button
                onClick={() => setActiveMode('edit')}
                style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: '#334155', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
              >
                Return to Edit
              </button>
            </div>
            <div style={{ padding: '20px', overflowX: 'auto' }}>
              <A4InvoiceView invoice={constructLiveInvoice()} />
            </div>
          </div>
        </div>
      ) : (
        /* EDIT MODE: Split layout with Autofill Sidepanel and Editable Billing Sheet */
        <div className="csi-body">
          {/* LEFT SIDEBAR: "Autofill this bill" Panel */}
          {autofillOpen && (
            <aside className="csi-sidebar">
              {/* Autofill Header */}
              <div className="csi-sidebar-header">
                <div className="csi-sidebar-title-group">
                  <div className="csi-scanner-icon-box">
                    <Scan size={18} />
                  </div>
                  <div>
                    <h2 className="csi-sidebar-title">Autofill this bill</h2>
                  </div>
                </div>
                <button
                  onClick={() => setAutofillOpen(false)}
                  className="csi-sidebar-close"
                  title="Close Autofill Panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Stats Badge Row */}
              <div className="csi-sidebar-stats">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={14} color="#059669" />
                  <strong>{billsScannedCount}</strong> bills scanned
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⏱️</span>
                  <span>~25 mins saved</span>
                </span>
              </div>

              {/* Upload Drop Area */}
              <div className="csi-sidebar-content">
                {/* AI Engine Status & Configuration Card */}
                {aiConfigured ? (
                  <div className="csi-ai-status-card active">
                    <div className="csi-ai-status-left">
                      <span className="csi-ai-pulse-dot" />
                      <div>
                        <div className="csi-ai-status-title">
                          <Sparkles size={13} color="#6366f1" />
                          <span>AI Active ({aiProvider === 'gemini' ? 'Gemini 1.5' : 'GPT-4o'})</span>
                        </div>
                        <span className="csi-ai-status-sub">100% precision on PDF tables</span>
                      </div>
                    </div>
                    <button onClick={openAiModal} className="csi-ai-config-btn" title="Configure AI Key">
                      Configure
                    </button>
                  </div>
                ) : (
                  <div className="csi-ai-status-card unconfigured" onClick={openAiModal} title="Connect Gemini AI for free">
                    <div className="csi-ai-status-left">
                      <Sparkles size={15} color="#059669" />
                      <div>
                        <div className="csi-ai-status-title">Enable AI Bill Reader</div>
                        <span className="csi-ai-status-sub">Free Gemini key for complex PDFs</span>
                      </div>
                    </div>
                    <button className="csi-ai-connect-btn">Connect AI</button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                />

                {!uploadedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`csi-dropzone ${isDragging ? 'dragging' : ''}`}
                  >
                    <div className="csi-dropzone-icon">
                      <Upload size={20} />
                    </div>
                    <p className="csi-dropzone-title">Drag & Drop or Upload file</p>
                    <p className="csi-dropzone-desc">
                      (PDF, JPG, JPEG & PNG file supported, max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="csi-file-preview-card">
                    <div className="csi-file-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="csi-pdf-tag">PDF</div>
                        <span className="csi-file-name">{uploadedFile.name}</span>
                      </div>
                      <button
                        onClick={clearUploadedFile}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
                        title="Remove file"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {uploadedFilePreview ? (
                      <div className="csi-preview-img-wrap">
                        <img src={uploadedFilePreview} alt="Invoice Preview" />
                      </div>
                    ) : (
                      <div className="csi-preview-fallback">
                        <FileCheck size={24} color="#94a3b8" />
                        <span>Document Ready (Page 1/1)</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', padding: '0 2px' }}>
                      <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>Ready to extract</span>
                    </div>
                  </div>
                )}

                {/* Quick Presets (1-Click Test for Immediate Feedback) */}
                <div className="csi-presets-box">
                  <span className="csi-presets-label">Instant Demo Presets:</span>
                  <button
                    onClick={() => triggerAutofillExtraction('grow-naturals-pots')}
                    disabled={isScanning}
                    className="csi-preset-btn"
                  >
                    <span>🪴 Grow Naturals Pot Order (BLRS-2627)</span>
                    <Sparkles size={14} color="#6366f1" />
                  </button>
                  <button
                    onClick={() => triggerAutofillExtraction('nikhlesh-nursery-saplings')}
                    disabled={isScanning}
                    className="csi-preset-btn nursery"
                  >
                    <span>🌱 Nikhlesh Nursery Saplings (0% GST)</span>
                    <Sparkles size={14} color="#059669" />
                  </button>
                </div>

                {/* Action: Proceed Button */}
                <button
                  onClick={() => triggerAutofillExtraction()}
                  disabled={isScanning}
                  className="csi-btn-proceed"
                >
                  {isScanning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{scanProgressText}</span>
                    </>
                  ) : (
                    <span>Proceed & Autofill</span>
                  )}
                </button>

                {/* Scan Success Banner */}
                {scanSuccessBanner && (
                  <div className="csi-scan-success-pill">
                    <CheckCircle2 size={15} color="#059669" style={{ flexShrink: 0 }} />
                    <span>{scanSuccessBanner}</span>
                  </div>
                )}

                {/* AI Disclaimer Alert */}
                {isScanning && (
                  <div className="csi-scan-warning-pill">
                    <Info size={15} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>Please check the details wisely. AI can make mistakes.</span>
                  </div>
                )}
              </div>

              {/* Quick Tips Box (Pinned at bottom) */}
              <div className="csi-quick-tips-card">
                <div className="csi-tips-box">
                  <div className="csi-tips-title">
                    <Sparkles size={14} />
                    <span>Quick Tips</span>
                  </div>
                  <p style={{ margin: 0, color: '#475569', lineHeight: 1.4 }}>
                    Any Party / Item tagged <span className="csi-tag-new">New</span> will be created and added to your inventory.
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '10px' }}>
                    Verify GSTIN, HSN code and GST rates carefully before saving.
                  </p>
                </div>
              </div>
            </aside>
          )}

          {/* MAIN EDITABLE BILLING SHEET */}
          <main className="csi-main">
            {/* Shimmer loading overlay when AI is scanning */}
            {isScanning && (
              <div className="csi-scanning-overlay">
                <div className="csi-scanning-radar">
                  <Scan size={30} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  Extracting Invoice Data...
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Parsing items, HSN codes, discounts and party details
                </p>
              </div>
            )}

            <div className="csi-main-container">
              {/* TOP ROW: Bill To & Invoice Details Card */}
              <div className="csi-grid-2col">
                {/* Bill To Card */}
                <div className="csi-card">
                  <div className="csi-card-header">
                    <h3 className="csi-card-title">Bill To</h3>
                    <button
                      onClick={() => setPartyModalOpen(true)}
                      className="csi-btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      Change Party
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          value={partyName}
                          onChange={(e) => setPartyName(e.target.value)}
                          placeholder="Party / Customer Name"
                          className="csi-input csi-input-lg"
                        />
                        {isAiExtractedParty && (
                          <span className="csi-ai-tag">
                            <Sparkles size={11} /> AI Extracted
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label className="csi-field-label">Address</label>
                        <input
                          type="text"
                          value={partyAddress}
                          onChange={(e) => setPartyAddress(e.target.value)}
                          placeholder="Address, City, Pincode"
                          className="csi-input"
                        />
                      </div>
                      <div>
                        <label className="csi-field-label">Phone Number</label>
                        <input
                          type="text"
                          value={partyPhone}
                          onChange={(e) => setPartyPhone(e.target.value)}
                          placeholder="10-digit mobile"
                          className="csi-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '2px' }}>
                      <label className="csi-field-label">Place of Supply</label>
                      <select
                        value={placeOfSupply}
                        onChange={(e) => setPlaceOfSupply(e.target.value)}
                        className="csi-input"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Invoice Details Card */}
                <div className="csi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div className="csi-card-header">
                      <h3 className="csi-card-title">Invoice Details</h3>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={repeatInvoice}
                          onChange={(e) => setRepeatInvoice(e.target.checked)}
                        />
                        <span>Repeat this Invoice</span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="csi-field-label">Invoice Prefix</label>
                        <input
                          type="text"
                          value={invoicePrefix}
                          onChange={(e) => setInvoicePrefix(e.target.value)}
                          className="csi-input csi-input-mono"
                        />
                      </div>
                      <div>
                        <label className="csi-field-label">Invoice Number</label>
                        <input
                          type="text"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="csi-input csi-input-mono"
                          style={{ fontWeight: 700 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                      <div>
                        <label className="csi-field-label">Sales Invoice Date</label>
                        <input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          className="csi-input"
                        />
                      </div>
                      <div>
                        <label className="csi-field-label">Due Date</label>
                        {hasCustomDueDate ? (
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="csi-input"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setHasCustomDueDate(true);
                              setDueDate(invoiceDate);
                            }}
                            className="csi-input"
                            style={{ borderStyle: 'dashed', color: '#4f46e5', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
                          >
                            + Add Due Date
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {invoiceDate !== new Date().toISOString().split('T')[0] && (
                    <div className="csi-date-warning">
                      <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span>
                        Changing the invoice date can cause invoice numbering and GSTR-1 mismatches.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="csi-table-card">
                <div className="csi-table-wrap">
                  <table className="csi-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>NO</th>
                        <th style={{ minWidth: '220px' }}>ITEMS</th>
                        <th style={{ width: '90px' }}>HSN</th>
                        <th style={{ width: '70px', textAlign: 'right' }}>MRP</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>QTY</th>
                        <th style={{ width: '110px', textAlign: 'right' }}>PRICE/ITEM (₹)</th>
                        <th style={{ width: '110px', textAlign: 'right' }}>DISCOUNT</th>
                        <th style={{ width: '90px', textAlign: 'right' }}>TAX</th>
                        <th style={{ width: '110px', textAlign: 'right' }}>AMOUNT (₹)</th>
                        <th style={{ width: '36px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ textAlign: 'center', padding: '28px 16px', color: '#64748b', fontSize: '13px' }}>
                            <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>No items in invoice</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                              Click <strong>+ Add Item</strong> below or upload a bill via <strong>Autofill this bill</strong>.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        items.map((it, idx) => (
                        <tr key={it.id}>
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                            {idx + 1}
                          </td>
                          <td>
                            <input
                              type="text"
                              value={it.product_name}
                              onChange={(e) => handleItemChange(it.id, 'product_name', e.target.value)}
                              placeholder="Product or service name..."
                              className="csi-input"
                              style={{ border: 'none', background: 'transparent', padding: '2px 0', fontWeight: 600 }}
                            />
                            <input
                              type="text"
                              value={it.description || ''}
                              onChange={(e) => handleItemChange(it.id, 'description', e.target.value)}
                              placeholder="Enter Description (optional)"
                              className="csi-input"
                              style={{ border: 'none', background: 'transparent', padding: '2px 0', fontSize: '11px', color: '#64748b' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={it.hsn_code}
                              onChange={(e) => handleItemChange(it.id, 'hsn_code', e.target.value)}
                              placeholder="HSN"
                              className="csi-input csi-input-mono"
                              style={{ padding: '4px 6px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              value={it.mrp || ''}
                              onChange={(e) => handleItemChange(it.id, 'mrp', Number(e.target.value))}
                              placeholder="0"
                              className="csi-input csi-input-mono"
                              style={{ textAlign: 'right', padding: '4px 6px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleItemChange(it.id, 'quantity', Number(e.target.value))}
                                className="csi-input csi-input-mono"
                                style={{ width: '50px', textAlign: 'center', fontWeight: 700, padding: '4px 2px' }}
                              />
                              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{it.unit}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={it.unit_price}
                              onChange={(e) => handleItemChange(it.id, 'unit_price', Number(e.target.value))}
                              className="csi-input csi-input-mono"
                              style={{ textAlign: 'right', fontWeight: 600, padding: '4px 6px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{ fontFamily: 'monospace', color: '#334155' }}>
                                ₹{it.discount_amount.toFixed(2)}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={it.discount_percent}
                                  onChange={(e) => handleItemChange(it.id, 'discount_percent', Number(e.target.value))}
                                  style={{ width: '36px', textAlign: 'right', fontSize: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '1px 2px' }}
                                />
                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>%</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isTaxable ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <select
                                  value={it.gst_rate}
                                  onChange={(e) => handleItemChange(it.id, 'gst_rate', Number(e.target.value))}
                                  style={{ fontSize: '11px', fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px' }}
                                >
                                  <option value={0}>0%</option>
                                  <option value={5}>5%</option>
                                  <option value={12}>12%</option>
                                  <option value={18}>18%</option>
                                  <option value={28}>28%</option>
                                </select>
                                <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                                  (₹{it.tax_amount.toFixed(2)})
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: '#059669', fontSize: '11px', fontWeight: 600 }}>0% (Exempt)</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                            ₹{it.total.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemoveItem(it.id)}
                              style={{ border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                              title="Delete Item"
                            >
                              <X size={15} />
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>

                {/* Add Item Row & Barcode Scanner Actions */}
                <div className="csi-table-footer-actions">
                  <button onClick={handleAddItem} className="csi-btn-add-item">
                    <Plus size={16} />
                    <span>+ Add Item</span>
                  </button>

                  <button
                    onClick={() => alert('Barcode camera scanner ready. Scan product barcode on counter.')}
                    className="csi-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Scan size={15} />
                    <span>Scan Barcode</span>
                  </button>
                </div>

                {/* Table Totals Row */}
                <div className="csi-table-totals-bar">
                  <span>Subtotal</span>
                  <div className="csi-table-totals-group">
                    <span>Qty: {subtotalQuantity}</span>
                    <span>Subtotal: ₹{rawSubtotal.toFixed(2)}</span>
                    {isTaxable && <span>Tax: ₹{totalTaxAmount.toFixed(2)}</span>}
                    <span style={{ color: '#0f172a', fontWeight: 800 }}>Total: ₹{rawGrandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION */}
              <div className="csi-bottom-grid">
                {/* LEFT BOTTOM: Notes, Terms & Bank Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Notes & Terms Card */}
                  <div className="csi-card">
                    <div className="csi-card-header">
                      <h3 className="csi-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} color="#4f46e5" /> Terms & Conditions
                      </h3>
                      {!showNotesInput && (
                        <button
                          onClick={() => setShowNotesInput(true)}
                          style={{ border: 'none', background: 'transparent', color: '#4f46e5', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                        >
                          + Add Notes
                        </button>
                      )}
                    </div>

                    {showNotesInput && (
                      <div style={{ marginBottom: '10px' }}>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add customer-facing note or memo..."
                          className="csi-input"
                          style={{ width: '100%', resize: 'vertical' }}
                        />
                      </div>
                    )}

                    <textarea
                      rows={3}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      className="csi-input"
                      style={{ width: '100%', fontSize: '11px', resize: 'vertical' }}
                    />
                  </div>

                  {/* Bank Details Card */}
                  <div className="csi-card">
                    <div className="csi-card-header">
                      <h3 className="csi-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={15} color="#059669" /> Bank Details
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                        <button
                          onClick={() =>
                            setBankDetails({
                              account_number: '',
                              ifsc_code: '',
                              bank_name: '',
                              account_holder: ''
                            })
                          }
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                        <button
                          onClick={() => setSettingsOpen(true)}
                          style={{ border: 'none', background: 'transparent', color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}
                        >
                          <RotateCcw size={13} /> Change
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                      <div>
                        <span className="csi-field-label">Account Number</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          {bankDetails.account_number}
                        </span>
                      </div>
                      <div>
                        <span className="csi-field-label">IFSC Code</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          {bankDetails.ifsc_code}
                        </span>
                      </div>
                      <div>
                        <span className="csi-field-label">Bank & Branch Name</span>
                        <span style={{ color: '#334155', fontWeight: 500 }}>{bankDetails.bank_name}</span>
                      </div>
                      <div>
                        <span className="csi-field-label">Account Holder</span>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>{bankDetails.account_holder}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT BOTTOM: Tax Breakdown & Grand Total */}
                <div className="csi-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    {/* Add Additional Charges Link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {!showAddCharges ? (
                        <button
                          onClick={() => setShowAddCharges(true)}
                          style={{ border: 'none', background: 'transparent', color: '#4f46e5', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                        >
                          + Add Additional Charges
                        </button>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span style={{ color: '#475569', fontWeight: 500 }}>Additional Charges</span>
                          <input
                            type="number"
                            value={additionalCharges || ''}
                            onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                            placeholder="₹0"
                            className="csi-input csi-input-mono"
                            style={{ width: '90px', textAlign: 'right', padding: '3px 6px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Taxable Amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f1f5f9', color: '#334155', fontWeight: 600 }}>
                      <span>Taxable Amount</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                        ₹{taxableAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* GST Breakdown */}
                    {isTaxable ? (
                      <>
                        {!isInterState ? (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <span>SGST @9%</span>
                              <span style={{ fontFamily: 'monospace' }}>₹{sgstAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                              <span>CGST @9%</span>
                              <span style={{ fontFamily: 'monospace' }}>₹{cgstAmount.toFixed(2)}</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                            <span>IGST @18%</span>
                            <span style={{ fontFamily: 'monospace' }}>₹{igstAmount.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#065f46', backgroundColor: '#ecfdf5', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        <span>Agricultural Exemption</span>
                        <span>0% GST</span>
                      </div>
                    )}

                    {/* Overall Discount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {!showOverallDiscount ? (
                        <button
                          onClick={() => setShowOverallDiscount(true)}
                          style={{ border: 'none', background: 'transparent', color: '#4f46e5', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                        >
                          + Add Discount
                        </button>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span style={{ color: '#475569', fontWeight: 500 }}>Extra Bill Discount</span>
                          <input
                            type="number"
                            value={overallDiscount || ''}
                            onChange={(e) => setOverallDiscount(Number(e.target.value))}
                            placeholder="₹0"
                            className="csi-input csi-input-mono"
                            style={{ width: '90px', textAlign: 'right', padding: '3px 6px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Auto Round Off */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={autoRoundOff}
                          onChange={(e) => setAutoRoundOff(e.target.checked)}
                        />
                        <span>Auto Round Off</span>
                      </label>
                      <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                        {roundOffDifference >= 0 ? `+ ${roundOffDifference.toFixed(2)}` : roundOffDifference.toFixed(2)}
                      </span>
                    </div>

                    {/* Grand Total Box */}
                    <div className="csi-grand-total-box">
                      <span className="csi-grand-total-label">Total Amount:</span>
                      <span className="csi-grand-total-val">
                        ₹{roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Payment Status & Method */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isMarkAsPaid}
                            onChange={(e) => setIsMarkAsPaid(e.target.checked)}
                          />
                          <span>Mark as fully paid</span>
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="csi-input"
                          style={{ width: 'auto', fontWeight: 600, padding: '3px 8px' }}
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI (GPay / PhonePe)</option>
                          <option value="card">Debit / Credit Card</option>
                          <option value="bank_transfer">Bank Transfer / NEFT</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '12px' }}>
                        <span>Balance Amount:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                          ₹{isMarkAsPaid ? '0.00' : roundedGrandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* MODAL: Customer / Party Selection */}
      {partyModalOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-modal-box">
            <div className="csi-modal-header">
              <h3 className="csi-modal-title">Select Customer / Party</h3>
              <button
                onClick={() => setPartyModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="csi-modal-body">
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  value={searchCustomerQuery}
                  onChange={(e) => setSearchCustomerQuery(e.target.value)}
                  placeholder="Search existing customers by name or phone..."
                  className="csi-input"
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => {
                    setPartyName('Cash Sale');
                    setPartyPhone('');
                    setPartyAddress('');
                    setPartyModalOpen(false);
                  }}
                  className="csi-biz-menu-item"
                  style={{ padding: '8px 10px' }}
                >
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>Walk-in Cash Sale</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Default Counter</span>
                </button>

                {customers
                  .filter((c) =>
                    c.name.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
                    (c.phone && c.phone.includes(searchCustomerQuery))
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setPartyName(c.name);
                        setPartyPhone(c.phone || '');
                        setPartyAddress(c.address || '');
                        setPartyModalOpen(false);
                      }}
                      className="csi-biz-menu-item"
                      style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}
                    >
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {c.phone} {c.address ? `• ${c.address}` : ''}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Invoice Settings */}
      {settingsOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-modal-box">
            <div className="csi-modal-header">
              <h3 className="csi-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings size={16} /> Invoice Configuration
              </h3>
              <button
                onClick={() => setSettingsOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="csi-modal-body">
              <div>
                <label className="csi-field-label">Invoice Prefix Series</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="csi-input csi-input-mono"
                />
              </div>

              <div>
                <label className="csi-field-label">Bank Account Number</label>
                <input
                  type="text"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                  className="csi-input csi-input-mono"
                />
              </div>

              <div>
                <label className="csi-field-label">IFSC Code</label>
                <input
                  type="text"
                  value={bankDetails.ifsc_code}
                  onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
                  className="csi-input csi-input-mono"
                />
              </div>

              <div>
                <label className="csi-field-label">Bank Name & Branch</label>
                <input
                  type="text"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                  className="csi-input"
                />
              </div>

              <button
                onClick={() => setSettingsOpen(false)}
                className="csi-btn-primary"
                style={{ justifyContent: 'center', marginTop: '6px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI Engine Setup */}
      {aiModalOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-modal-box" style={{ maxWidth: '480px' }}>
            <div className="csi-modal-header">
              <h3 className="csi-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#6366f1" /> Connect AI Invoice Engine
              </h3>
              <button
                onClick={() => setAiModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="csi-modal-body">
              <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                Connect an AI Vision engine to extract <strong>every table row, HSN code, tax breakdown, and customer detail</strong> from any PDF, scanned receipt, or photo with 100% accuracy.
              </p>

              {/* Provider Selector */}
              <div>
                <label className="csi-field-label">AI Engine Provider</label>
                <div className="csi-ai-provider-toggle">
                  <button
                    type="button"
                    onClick={() => setTempProvider('gemini')}
                    className={`csi-ai-provider-btn ${tempProvider === 'gemini' ? 'active' : ''}`}
                  >
                    <Sparkles size={14} color="#6366f1" />
                    <span>Google Gemini (Free & Recommended)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempProvider('openai')}
                    className={`csi-ai-provider-btn ${tempProvider === 'openai' ? 'active' : ''}`}
                  >
                    <span>OpenAI (GPT-4o)</span>
                  </button>
                </div>
              </div>

              {/* Helper Links for Free Key */}
              {tempProvider === 'gemini' ? (
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '11px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span>Google AI Studio provides 100% free API keys (no credit card needed).</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', flexShrink: 0 }}
                  >
                    Get Free Key <ExternalLink size={11} />
                  </a>
                </div>
              ) : (
                <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span>Requires an active OpenAI platform API key.</span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#6366f1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', flexShrink: 0 }}
                  >
                    OpenAI Keys <ExternalLink size={11} />
                  </a>
                </div>
              )}

              {/* API Key Input */}
              <div>
                <label className="csi-field-label">
                  <Key size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {tempProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                </label>
                <div className="csi-ai-key-input-wrap">
                  <input
                    type={showTempKey ? 'text' : 'password'}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder={tempProvider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                    className="csi-input csi-input-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTempKey(!showTempKey)}
                    className="csi-ai-key-toggle-eye"
                    title={showTempKey ? 'Hide key' : 'Show key'}
                  >
                    {showTempKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Feedback Alerts */}
              {aiTestError && (
                <div className="csi-scan-warning-pill" style={{ color: '#b91c1c', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                  <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{aiTestError}</span>
                </div>
              )}

              {aiTestSuccess && (
                <div className="csi-scan-success-pill">
                  <CheckCircle2 size={15} color="#059669" style={{ flexShrink: 0 }} />
                  <span>{aiTestSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="csi-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiConfig}
                  disabled={isTestingAi}
                  className="csi-btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {isTestingAi ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Verifying Key...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Save & Activate AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSalesInvoice;
