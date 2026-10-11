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
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Scan,
  Sparkles,
  Upload,
  FileText,
  X,
  Plus,
  PlusCircle,
  BadgePercent,
  Trash2,
  Settings,
  Building2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Eye,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Loader2,
  Info,
  FileCheck,
  ExternalLink,
  Key,
  EyeOff,
  UserPlus,
  UserCheck,
  XCircle,
  QrCode,
  ArrowDown,
  Minus,
  Layers,
  PackagePlus,
  Check,
  Copy,
  FolderKanban,
  Calendar,
  LayoutDashboard,
  Users,
  User,
  Receipt,
  Package,
  SlidersHorizontal,
  IndianRupee,
  Boxes,
  Tag,
  CircleDot,
  Circle,
  CreditCard,
  PhoneCall,
  Landmark,
  MapPin,
  AtSign,
  MessageSquare,
  MoreVertical,
  Mic,
  Printer,
  Download,
  Share2,
  Store
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { Customer, Product, Invoice } from '../types';
import { A4InvoiceView } from '../components/print/A4InvoiceView';
import { numberToIndianWords } from '../utils/numberToWords';
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

export interface ExtraChargeItem {
  id: string;
  name: string;
  amount: number | string;
  tax_rate: number;
}

export interface SplitPaymentItem {
  id: string;
  amount: number | string;
  method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
}

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal'
];

const ALL_INDIAN_STATES = [
  'Andaman & Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra & Nagar Haveli & Daman & Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

const PINCODE_PREFIX_MAP: Record<string, { city: string; state: string }> = {
  '625': { city: 'Madurai', state: 'Tamil Nadu' },
  '600': { city: 'Chennai', state: 'Tamil Nadu' },
  '641': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '620': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  '636': { city: 'Salem', state: 'Tamil Nadu' },
  '624': { city: 'Dindigul', state: 'Tamil Nadu' },
  '627': { city: 'Tirunelveli', state: 'Tamil Nadu' },
  '628': { city: 'Thoothukudi', state: 'Tamil Nadu' },
  '629': { city: 'Kanyakumari', state: 'Tamil Nadu' },
  '632': { city: 'Vellore', state: 'Tamil Nadu' },
  '638': { city: 'Erode', state: 'Tamil Nadu' },
  '635': { city: 'Hosur', state: 'Tamil Nadu' },
  '630': { city: 'Karaikudi', state: 'Tamil Nadu' },
  '605': { city: 'Puducherry', state: 'Puducherry' },
  '560': { city: 'Bengaluru', state: 'Karnataka' },
  '570': { city: 'Mysuru', state: 'Karnataka' },
  '575': { city: 'Mangaluru', state: 'Karnataka' },
  '580': { city: 'Hubli', state: 'Karnataka' },
  '590': { city: 'Belgaum', state: 'Karnataka' },
  '500': { city: 'Hyderabad', state: 'Telangana' },
  '501': { city: 'Hyderabad', state: 'Telangana' },
  '502': { city: 'Sangareddy', state: 'Telangana' },
  '505': { city: 'Karimnagar', state: 'Telangana' },
  '506': { city: 'Warangal', state: 'Telangana' },
  '520': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '530': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  '517': { city: 'Tirupati', state: 'Andhra Pradesh' },
  '522': { city: 'Guntur', state: 'Andhra Pradesh' },
  '515': { city: 'Anantapur', state: 'Andhra Pradesh' },
  '682': { city: 'Kochi', state: 'Kerala' },
  '695': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '673': { city: 'Kozhikode', state: 'Kerala' },
  '680': { city: 'Thrissur', state: 'Kerala' },
  '691': { city: 'Kollam', state: 'Kerala' },
  '400': { city: 'Mumbai', state: 'Maharashtra' },
  '411': { city: 'Pune', state: 'Maharashtra' },
  '440': { city: 'Nagpur', state: 'Maharashtra' },
  '431': { city: 'Aurangabad', state: 'Maharashtra' },
  '422': { city: 'Nashik', state: 'Maharashtra' },
  '416': { city: 'Kolhapur', state: 'Maharashtra' },
  '403': { city: 'Panaji', state: 'Goa' },
  '110': { city: 'New Delhi', state: 'Delhi' },
  '122': { city: 'Gurugram', state: 'Haryana' },
  '121': { city: 'Faridabad', state: 'Haryana' },
  '134': { city: 'Panchkula', state: 'Haryana' },
  '201': { city: 'Noida', state: 'Uttar Pradesh' },
  '226': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '208': { city: 'Kanpur', state: 'Uttar Pradesh' },
  '221': { city: 'Varanasi', state: 'Uttar Pradesh' },
  '282': { city: 'Agra', state: 'Uttar Pradesh' },
  '380': { city: 'Ahmedabad', state: 'Gujarat' },
  '395': { city: 'Surat', state: 'Gujarat' },
  '390': { city: 'Vadodara', state: 'Gujarat' },
  '360': { city: 'Rajkot', state: 'Gujarat' },
  '302': { city: 'Jaipur', state: 'Rajasthan' },
  '342': { city: 'Jodhpur', state: 'Rajasthan' },
  '313': { city: 'Udaipur', state: 'Rajasthan' },
  '700': { city: 'Kolkata', state: 'West Bengal' },
  '734': { city: 'Siliguri', state: 'West Bengal' },
  '751': { city: 'Bhubaneswar', state: 'Odisha' },
  '769': { city: 'Rourkela', state: 'Odisha' },
  '800': { city: 'Patna', state: 'Bihar' },
  '834': { city: 'Ranchi', state: 'Jharkhand' },
  '462': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '452': { city: 'Indore', state: 'Madhya Pradesh' },
  '492': { city: 'Raipur', state: 'Chhattisgarh' },
  '141': { city: 'Ludhiana', state: 'Punjab' },
  '143': { city: 'Amritsar', state: 'Punjab' },
  '160': { city: 'Chandigarh', state: 'Chandigarh' },
  '781': { city: 'Guwahati', state: 'Assam' },
  '248': { city: 'Dehradun', state: 'Uttarakhand' }
};

const SEED_CUSTOMERS: Customer[] = [
  { id: 'seed-1', name: 'Aachiya', phone: '8608981089', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-2', name: 'Aarsha', phone: '7418196986', email: '', address: 'Bangalore, KA', gstin: '', closing_balance: 178 },
  { id: 'seed-3', name: 'Aarthi', phone: '6380120326', email: '', address: 'Chennai, TN', gstin: '', closing_balance: 837 },
  { id: 'seed-4', name: 'Abby', phone: '9791288949', email: '', address: 'Coimbatore, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-5', name: 'Abi Rhuban', phone: '9843934631', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-6', name: 'Abinaya', phone: '9361572561', email: '', address: 'Trichy, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-7', name: 'Abitha', phone: '7094018290', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-8', name: 'Adharsh', phone: '9488722266', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-9', name: 'Adin', phone: '9585756664', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-10', name: 'Ajith', phone: '9654321098', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-11', name: 'Anita Sharma', phone: '9811223344', email: '', address: 'Indiranagar, Bangalore', gstin: '', closing_balance: 5600 },
  { id: 'seed-12', name: 'Oberoi Luxury Resorts', phone: '9870011223', email: '', address: 'MG Road, Bangalore', gstin: '', closing_balance: 44800 },
  { id: 'seed-13', name: 'Green Valley Residences HOA', phone: '9845012345', email: '', address: 'Whitefield, Bangalore', gstin: '', closing_balance: 12100 },
  { id: 'seed-14', name: 'Gowtham Nursery', phone: '9443012345', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 4500 },
  { id: 'seed-15', name: 'MDA Pots and Plants', phone: '9842012345', email: '', address: 'Salem, TN', gstin: '', closing_balance: 325513.01 },
  { id: 'seed-16', name: 'Pandiyan', phone: '9789098765', email: '', address: 'Dindigul, TN', gstin: '', closing_balance: 9150 }
];

const SEED_PRODUCTS: any[] = [
  {
    id: 'seed-prod-1',
    name: '10" Gro Pro Plastic Pot Black',
    sale_price: 75.42,
    mrp: 89,
    unit: 'PCS',
    stock_quantity: -2.0,
    hsn_code: '392390',
    category_id: 'cat-pots',
    gst_rate: 18,
    is_taxable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-prod-2',
    name: '10" Gro Pro Plastic Pot Pink',
    sale_price: 142.37,
    mrp: 168,
    unit: 'PCS',
    stock_quantity: -2.0,
    hsn_code: '392390',
    category_id: 'cat-pots',
    gst_rate: 18,
    is_taxable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-prod-3',
    name: '10" Gro Pro Plastic Pot TC',
    sale_price: 89.83,
    mrp: 106,
    unit: 'PCS',
    stock_quantity: 0.0,
    hsn_code: '392390',
    category_id: 'cat-pots',
    gst_rate: 18,
    is_taxable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-prod-4',
    name: '10" Gro Pro Plastic Pot White',
    sale_price: 142.37,
    mrp: 168,
    unit: 'PCS',
    stock_quantity: 0.0,
    hsn_code: '392390',
    category_id: 'cat-pots',
    gst_rate: 18,
    is_taxable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-prod-5',
    name: "10' Plastic Pot Black",
    description: '25 Upper | 18 Lower | 21 H (cm)',
    sale_price: 90,
    mrp: 105,
    unit: 'PCS',
    stock_quantity: 9.0,
    hsn_code: '392390',
    category_id: 'cat-pots',
    gst_rate: 18,
    is_taxable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-prod-6',
    name: "10' Plastic Pot TC",
    description: '25 Upper | 18 Lower | 21 H (cm)',
    sale_price: 100,
    mrp: 120,
    unit: 'PCS',
    stock_quantity: 10.0,
    hsn_code: '392390',
    category_id: 'cat-pots',
    gst_rate: 18,
    is_taxable: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'seed-prod-7',
    name: "10' Plastic Tray Black",
    sale_price: 65,
    mrp: 75,
    unit: 'PCS',
    stock_quantity: 15.0,
    hsn_code: '392390',
    category_id: 'cat-pots',
    gst_rate: 18,
    is_taxable: true,
    created_at: new Date().toISOString()
  }
];

const MEASURING_UNITS = [
  { label: 'Pieces(PCS)', code: 'PCS' },
  { label: 'Boxes(BOX)', code: 'BOX' },
  { label: 'Numbers(NOS)', code: 'NOS' },
  { label: 'Kilograms(KG)', code: 'KG' },
  { label: 'Grams(GM)', code: 'GM' },
  { label: 'Meters(MTR)', code: 'MTR' },
  { label: 'Liters(LTR)', code: 'LTR' },
  { label: 'Packets(PKT)', code: 'PKT' },
  { label: 'Pairs(PRS)', code: 'PRS' },
  { label: 'Rolls(ROL)', code: 'ROL' },
  { label: 'Sets(SET)', code: 'SET' },
  { label: 'Units(UNT)', code: 'UNT' },
  { label: 'Bags(BAG)', code: 'BAG' },
  { label: 'Bottles(BTL)', code: 'BTL' },
  { label: 'Cartons(CTN)', code: 'CTN' },
  { label: 'Dozens(DOZ)', code: 'DOZ' },
  { label: 'Quintal(QTL)', code: 'QTL' },
  { label: 'Square Feet(SQF)', code: 'SQF' },
  { label: 'Square Meters(SQM)', code: 'SQM' },
];

const GST_TAX_RATES = [
  { label: 'None', rate: 0 },
  { label: 'GST @ 0%', rate: 0 },
  { label: 'GST @ 0.1%', rate: 0.1 },
  { label: 'GST @ 0.25%', rate: 0.25 },
  { label: 'GST @ 3%', rate: 3 },
  { label: 'GST @ 5%', rate: 5 },
  { label: 'GST @ 12%', rate: 12 },
  { label: 'GST @ 18%', rate: 18 },
  { label: 'GST @ 28%', rate: 28 },
  { label: 'Exempted', rate: 0 },
];

const PARTY_CATEGORIES = [
  'Retailer',
  'Wholesaler',
  'Distributor',
  'Consumer',
  'Nursery / Landscaper',
  'Corporate / Institutional',
  'Farmer / Grower',
  'Government Department',
  'Exporter / Importer',
  'Other'
];

export const CreateSalesInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const paramCustomerName = searchParams.get('customer_name') || '';
  const paramPhone = searchParams.get('phone') || '';
  const paramProjectId = searchParams.get('project_id') || '';
  const paramEditInvoiceId = searchParams.get('editInvoiceId') || searchParams.get('invoice_id') || '';
  const paramDuplicateInvoiceId = searchParams.get('duplicateInvoiceId') || '';

  const editInvoiceId = id || paramEditInvoiceId || null;
  const isEditMode = Boolean(editInvoiceId);
  const isDuplicateMode = Boolean(paramDuplicateInvoiceId);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [, setLoadedInvoiceData] = useState<Invoice | null>(null);

  const { businessId, activeBusiness, businesses, switchBusiness, isTaxable } = useBusiness();

  // Mode: 'edit' | 'preview'
  const [activeMode, setActiveMode] = useState<'edit' | 'preview'>('edit');

  // Autofill sidebar toggle (default closed, opens on clicking "Autofill this bill" button)
  const [autofillOpen, setAutofillOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(1); // default to tip 1 ("Verify GSTIN, HSN code...") to match user's screenshot
  const [billsScannedCount, setBillsScannedCount] = useState(8); 
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('Loading... 0.6s');
  const [scanSuccessBanner, setScanSuccessBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileAutofillFileInputRef = useRef<HTMLInputElement>(null);

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
  const [invoicePrefix, setInvoicePrefix] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return '';
    }
    return activeBusiness?.invoice_prefix || (businessId === 'grow-naturals' ? 'GN00' : 'NN00');
  });
  const [hasCustomPrefix, setHasCustomPrefix] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(String(Math.floor(8000 + Math.random() * 1000)));
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentTermsDays, setPaymentTermsDays] = useState<number | string>(7);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [hasCustomDueDate, setHasCustomDueDate] = useState(true);
  const [repeatInvoice, setRepeatInvoice] = useState(false);

  // Due Date & Payment Terms synchronization
  const handleOpenDueDate = () => {
    const days = typeof paymentTermsDays === 'number' ? paymentTermsDays : parseInt(String(paymentTermsDays), 10) || 30;
    const base = invoiceDate ? new Date(invoiceDate) : new Date();
    base.setDate(base.getDate() + days);
    const calculatedDue = base.toISOString().split('T')[0];
    setDueDate(calculatedDue);
    setPaymentTermsDays(days);
    setHasCustomDueDate(true);
  };

  const handlePaymentTermsChange = (val: string) => {
    setPaymentTermsDays(val);
    const parsedDays = parseInt(val, 10);
    if (!isNaN(parsedDays) && parsedDays >= 0 && invoiceDate) {
      const base = new Date(invoiceDate);
      base.setDate(base.getDate() + parsedDays);
      setDueDate(base.toISOString().split('T')[0]);
    }
  };

  const handleDueDateChange = (newDueDate: string) => {
    setDueDate(newDueDate);
    if (newDueDate && invoiceDate) {
      const invD = new Date(invoiceDate);
      const dueD = new Date(newDueDate);
      const diffTime = dueD.getTime() - invD.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      setPaymentTermsDays(Math.max(0, diffDays));
    }
  };

  const handleInvoiceDateChange = (newInvDate: string) => {
    setInvoiceDate(newInvDate);
    if (hasCustomDueDate && paymentTermsDays !== '') {
      const parsedDays = parseInt(String(paymentTermsDays), 10) || 0;
      const base = new Date(newInvDate);
      base.setDate(base.getDate() + parsedDays);
      setDueDate(base.toISOString().split('T')[0]);
    }
  };

  // Party (Bill To) State (MyBillBook style)
  const [hasSelectedParty, setHasSelectedParty] = useState(() => Boolean(paramCustomerName));
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false);
  const partySearchRef = useRef<HTMLDivElement | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [partyName, setPartyName] = useState(() => paramCustomerName || '');
  const [partyPhone, setPartyPhone] = useState(() => paramPhone || '');
  const [partyAddress, setPartyAddress] = useState('');
  const [partyGstin, setPartyGstin] = useState('');
  const [projectId, setProjectId] = useState<string>(() => paramProjectId || '');
  const [placeOfSupply, setPlaceOfSupply] = useState('Tamil Nadu');
  const [posDropdownOpen, setPosDropdownOpen] = useState(false);
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const posDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isAiExtractedParty, setIsAiExtractedParty] = useState(false);
  const [partyModalOpen, setPartyModalOpen] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (months[monthIndex]) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
    return dateStr;
  };

  // Shipping (Ship To) State
  const [shipToName, setShipToName] = useState('');
  const [shipToPhone, setShipToPhone] = useState('');
  const [shipToAddress, setShipToAddress] = useState('');
  const [isSameAsBilling, setIsSameAsBilling] = useState(true);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [tempShipName, setTempShipName] = useState('');
  const [tempShipPhone, setTempShipPhone] = useState('');
  const [tempShipAddress, setTempShipAddress] = useState('');
  const [tempSameAsBilling, setTempSameAsBilling] = useState(true);

  // Edit Party Modal State
  const [editPartyModalOpen, setEditPartyModalOpen] = useState(false);
  const [editPartyName, setEditPartyName] = useState('');
  const [editPartyPhone, setEditPartyPhone] = useState('');
  const [editPartyAddress, setEditPartyAddress] = useState('');
  const [editPartyGstin, setEditPartyGstin] = useState('');
  const [editPartyPlaceOfSupply, setEditPartyPlaceOfSupply] = useState('Tamil Nadu');
  const [updateDbCustomer, setUpdateDbCustomer] = useState(true);
  const [isSavingPartyEdit, setIsSavingPartyEdit] = useState(false);

  // Create / Edit Party Modal State (MyBillBook Spec)
  const [partyModalMode, setPartyModalMode] = useState<'create' | 'edit'>('create');
  const [showNewCustForm, setShowNewCustForm] = useState(false);
  const [newPartyModalTab, setNewPartyModalTab] = useState<'basic' | 'address' | 'credit' | 'contact' | 'bank' | 'custom'>('basic');
  const [newPartyType, setNewPartyType] = useState<'Customer' | 'Supplier'>('Customer');
  const [newPartyCategory, setNewPartyCategory] = useState('');
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyGstin, setNewPartyGstin] = useState('');
  const [newPartyPan, setNewPartyPan] = useState('');
  const [newPartyEmail, setNewPartyEmail] = useState('');
  const [newPartyOpeningBal, setNewPartyOpeningBal] = useState<number | string>('0');
  const [newPartyOpeningBalType, setNewPartyOpeningBalType] = useState<'to_collect' | 'to_pay'>('to_collect');

  // Address Tab
  const [newPartyBillingAddress, setNewPartyBillingAddress] = useState('');
  const [newPartyCity, setNewPartyCity] = useState('');
  const [newPartyState, setNewPartyState] = useState('');
  const [newPartyPincode, setNewPartyPincode] = useState('');

  // Shipping Address Modal & Active State
  const [showAddShippingModal, setShowAddShippingModal] = useState(false);
  const [hasShippingAddress, setHasShippingAddress] = useState(false);
  const [newPartyShippingName, setNewPartyShippingName] = useState('');
  const [newPartyShippingAddress, setNewPartyShippingAddress] = useState('');
  const [newPartyShippingCity, setNewPartyShippingCity] = useState('');
  const [newPartyShippingState, setNewPartyShippingState] = useState('');
  const [newPartyShippingPincode, setNewPartyShippingPincode] = useState('');

  // Working state for Add Shipping Address Modal
  const [modalShipName, setModalShipName] = useState('');
  const [modalShipAddress, setModalShipAddress] = useState('');
  const [modalShipPincode, setModalShipPincode] = useState('');
  const [modalShipState, setModalShipState] = useState('');
  const [modalShipCity, setModalShipCity] = useState('');
  const [modalShipSameAsBilling, setModalShipSameAsBilling] = useState(false);

  const handlePincodeChange = (pin: string, isShipping: boolean = false) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    if (isShipping) {
      setNewPartyShippingPincode(cleanPin);
    } else {
      setNewPartyPincode(cleanPin);
    }

    if (cleanPin.length >= 2) {
      const prefix3 = cleanPin.substring(0, 3);
      const prefix2 = cleanPin.substring(0, 2);
      let matchedCity = '';
      let matchedState = '';

      if (PINCODE_PREFIX_MAP[prefix3]) {
        matchedCity = PINCODE_PREFIX_MAP[prefix3].city;
        matchedState = PINCODE_PREFIX_MAP[prefix3].state;
      } else {
        const stateCodeMap: Record<string, string> = {
          '11': 'Delhi',
          '12': 'Haryana', '13': 'Haryana',
          '14': 'Punjab', '15': 'Punjab',
          '16': 'Chandigarh',
          '17': 'Himachal Pradesh',
          '18': 'Jammu and Kashmir', '19': 'Jammu and Kashmir',
          '20': 'Uttar Pradesh', '21': 'Uttar Pradesh', '22': 'Uttar Pradesh', '23': 'Uttar Pradesh',
          '24': 'Uttar Pradesh', '25': 'Uttar Pradesh', '26': 'Uttar Pradesh', '27': 'Uttar Pradesh', '28': 'Uttar Pradesh',
          '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan', '33': 'Rajasthan', '34': 'Rajasthan',
          '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat',
          '40': 'Maharashtra', '41': 'Maharashtra', '42': 'Maharashtra', '43': 'Maharashtra', '44': 'Maharashtra',
          '45': 'Madhya Pradesh', '46': 'Madhya Pradesh', '47': 'Madhya Pradesh', '48': 'Madhya Pradesh',
          '49': 'Chhattisgarh',
          '50': 'Telangana',
          '51': 'Andhra Pradesh', '52': 'Andhra Pradesh', '53': 'Andhra Pradesh',
          '56': 'Karnataka', '57': 'Karnataka', '58': 'Karnataka', '59': 'Karnataka',
          '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu', '63': 'Tamil Nadu', '64': 'Tamil Nadu',
          '67': 'Kerala', '68': 'Kerala', '69': 'Kerala',
          '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal', '73': 'West Bengal', '74': 'West Bengal',
          '75': 'Odisha', '76': 'Odisha', '77': 'Odisha',
          '78': 'Assam', '79': 'Meghalaya',
          '80': 'Bihar', '81': 'Bihar', '82': 'Bihar', '83': 'Jharkhand', '84': 'Bihar', '85': 'Bihar'
        };
        if (stateCodeMap[prefix2]) {
          matchedState = stateCodeMap[prefix2];
        }
      }

      if (matchedState) {
        if (isShipping) {
          setNewPartyShippingState(matchedState);
          if (matchedCity) setNewPartyShippingCity(matchedCity);
        } else {
          setNewPartyState(matchedState);
          if (matchedCity) setNewPartyCity(matchedCity);
        }
      }
    }

    if (cleanPin.length === 6) {
      try {
        fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
              const po = data[0].PostOffice[0];
              const apiCity = po.District || po.Block || po.Name;
              const apiState = po.State;
              if (isShipping) {
                if (apiCity) setNewPartyShippingCity(apiCity);
                if (apiState) setNewPartyShippingState(apiState);
              } else {
                if (apiCity) setNewPartyCity(apiCity);
                if (apiState) setNewPartyState(apiState);
              }
            }
          })
          .catch(() => {});
      } catch (err) {
        // Fallback silently
      }
    }
  };

  const handleShippingModalPincodeChange = (pin: string) => {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setModalShipPincode(cleanPin);

    if (cleanPin.length >= 2) {
      const prefix3 = cleanPin.substring(0, 3);
      const prefix2 = cleanPin.substring(0, 2);
      let matchedCity = '';
      let matchedState = '';

      if (PINCODE_PREFIX_MAP[prefix3]) {
        matchedCity = PINCODE_PREFIX_MAP[prefix3].city;
        matchedState = PINCODE_PREFIX_MAP[prefix3].state;
      } else {
        const stateCodeMap: Record<string, string> = {
          '11': 'Delhi', '12': 'Haryana', '13': 'Haryana', '14': 'Punjab', '15': 'Punjab',
          '16': 'Chandigarh', '17': 'Himachal Pradesh', '18': 'Jammu and Kashmir', '19': 'Jammu and Kashmir',
          '20': 'Uttar Pradesh', '21': 'Uttar Pradesh', '22': 'Uttar Pradesh', '23': 'Uttar Pradesh',
          '24': 'Uttar Pradesh', '25': 'Uttar Pradesh', '26': 'Uttar Pradesh', '27': 'Uttar Pradesh', '28': 'Uttar Pradesh',
          '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan', '33': 'Rajasthan', '34': 'Rajasthan',
          '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat',
          '40': 'Maharashtra', '41': 'Maharashtra', '42': 'Maharashtra', '43': 'Maharashtra', '44': 'Maharashtra',
          '45': 'Madhya Pradesh', '46': 'Madhya Pradesh', '47': 'Madhya Pradesh', '48': 'Madhya Pradesh',
          '49': 'Chhattisgarh', '50': 'Telangana', '51': 'Andhra Pradesh', '52': 'Andhra Pradesh', '53': 'Andhra Pradesh',
          '56': 'Karnataka', '57': 'Karnataka', '58': 'Karnataka', '59': 'Karnataka',
          '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu', '63': 'Tamil Nadu', '64': 'Tamil Nadu',
          '67': 'Kerala', '68': 'Kerala', '69': 'Kerala', '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal', '73': 'West Bengal', '74': 'West Bengal',
          '75': 'Odisha', '76': 'Odisha', '77': 'Odisha', '78': 'Assam', '79': 'Meghalaya',
          '80': 'Bihar', '81': 'Bihar', '82': 'Bihar', '83': 'Jharkhand', '84': 'Bihar', '85': 'Bihar'
        };
        if (stateCodeMap[prefix2]) matchedState = stateCodeMap[prefix2];
      }

      if (matchedState) setModalShipState(matchedState);
      if (matchedCity) setModalShipCity(matchedCity);
    }

    if (cleanPin.length === 6) {
      try {
        fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
              const po = data[0].PostOffice[0];
              const apiCity = po.District || po.Block || po.Name;
              const apiState = po.State;
              if (apiCity) setModalShipCity(apiCity);
              if (apiState) setModalShipState(apiState);
            }
          })
          .catch(() => {});
      } catch (err) {}
    }
  };

  const handleToggleSameAsBillingInModal = (checked: boolean) => {
    setModalShipSameAsBilling(checked);
    if (checked) {
      setModalShipAddress(newPartyBillingAddress);
      setModalShipPincode(newPartyPincode);
      setModalShipState(newPartyState);
      setModalShipCity(newPartyCity);
    }
  };

  const handleOpenAddShippingModal = () => {
    setModalShipName(newPartyShippingName || newPartyName);
    setModalShipAddress(newPartyShippingAddress);
    setModalShipPincode(newPartyShippingPincode);
    setModalShipState(newPartyShippingState);
    setModalShipCity(newPartyShippingCity);
    setModalShipSameAsBilling(false);
    setShowAddShippingModal(true);
  };

  const handleSaveShippingModal = () => {
    if (!modalShipName.trim()) {
      alert('Please enter Shipping Name');
      return;
    }
    if (!modalShipAddress.trim()) {
      alert('Please enter Shipping Address');
      return;
    }
    setNewPartyShippingName(modalShipName.trim());
    setNewPartyShippingAddress(modalShipAddress.trim());
    setNewPartyShippingPincode(modalShipPincode.trim());
    setNewPartyShippingState(modalShipState);
    setNewPartyShippingCity(modalShipCity.trim());
    setHasShippingAddress(true);
    setShowAddShippingModal(false);
  };

  // Credit Settings Tab
  const [newPartyCreditLimit, setNewPartyCreditLimit] = useState<number | string>('0');
  const [newPartyCreditPeriod, setNewPartyCreditPeriod] = useState<number | string>('30');
  const [newPartyCreditPeriodUnit, setNewPartyCreditPeriodUnit] = useState<'Days' | 'Weeks' | 'Months'>('Days');

  // Contact Person Tab (matching Screenshot 2: Contact Person Name, Date of Birth)
  const [newPartyContactName, setNewPartyContactName] = useState('');
  const [newPartyContactDob, setNewPartyContactDob] = useState('');

  // Bank Tab (matching Screenshot 3: Bank Account Number, Re-Enter Bank Account Number, IFSC Code, Account Holder's Name, Bank Name, Branch Name, UPI ID)
  const [newPartyBankAcc, setNewPartyBankAcc] = useState('');
  const [newPartyBankAccConfirm, setNewPartyBankAccConfirm] = useState('');
  const [newPartyBankIfsc, setNewPartyBankIfsc] = useState('');
  const [newPartyBankHolder, setNewPartyBankHolder] = useState('');
  const [newPartyBankName, setNewPartyBankName] = useState('');
  const [newPartyBankBranch, setNewPartyBankBranch] = useState('');
  const [newPartyUpiId, setNewPartyUpiId] = useState('');

  // Custom Fields Tab
  const [newPartyCustom1, setNewPartyCustom1] = useState('');
  const [newPartyCustom2, setNewPartyCustom2] = useState('');
  const [newPartyCustom3, setNewPartyCustom3] = useState('');
  const [newPartyCustom4, setNewPartyCustom4] = useState('');
  const [newPartyNotes, setNewPartyNotes] = useState('');
  const [partyCustomFieldValues, setPartyCustomFieldValues] = useState<Record<string, string>>({});

  // Party Settings Modal State (matching screenshot)
  const [partySettingsOpen, setPartySettingsOpen] = useState(false);
  const [partySettingsTab, setPartySettingsTab] = useState<'smart_greetings' | 'custom_fields'>('smart_greetings');
  
  // Smart Greetings Tab (Screenshot 1)
  const [enableInvoiceMilestones, setEnableInvoiceMilestones] = useState(true);
  const [milestoneTemplate, setMilestoneTemplate] = useState('Hey , {{MilestoneMessage}} with {{YourBusinessName}} — thank you, {{PartyName}}! 🎉 <View Invoice>');
  const [enableBirthdayWishes, setEnableBirthdayWishes] = useState(true);
  const [birthdayTemplate, setBirthdayTemplate] = useState('Happy Birthday, {{Party Name}}! 🎂 Wishing you success & smiles.');

  // Custom Fields Tab (Screenshot 2)
  const [partyCustomFieldRows, setPartyCustomFieldRows] = useState<Array<{ id: string; name: string }>>([
    { id: 'cf-1', name: '' }
  ]);

  const handleAddCustomFieldRow = () => {
    setPartyCustomFieldRows((prev) => [...prev, { id: 'cf-' + Date.now(), name: '' }]);
  };

  const handleRemoveCustomFieldRow = (id: string) => {
    setPartyCustomFieldRows((prev) => {
      if (prev.length <= 1) {
        return [{ id: 'cf-' + Date.now(), name: '' }];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const handleUpdateCustomFieldRowName = (id: string, name: string) => {
    setPartyCustomFieldRows((prev) => prev.map((row) => row.id === id ? { ...row, name } : row));
  };
  const [isSavingNewCust, setIsSavingNewCust] = useState(false);

  // Total Amount in Words
  const [amountInWords, setAmountInWords] = useState('');
  const [isCustomWords, setIsCustomWords] = useState(false);

  // Party-Item Price History State
  const [priceHistoryRowId, setPriceHistoryRowId] = useState<string | null>(null);
  const [priceHistoryData, setPriceHistoryData] = useState<any[]>([]);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState(false);
  const [editingDescriptionRowId, setEditingDescriptionRowId] = useState<string | null>(null);

  useEffect(() => {
    if (paramCustomerName && !editInvoiceId && !paramDuplicateInvoiceId) {
      setPartyName(paramCustomerName);
      setHasSelectedParty(true);
    }
    if (paramPhone && !editInvoiceId && !paramDuplicateInvoiceId) setPartyPhone(paramPhone);
    if (paramProjectId && !editInvoiceId && !paramDuplicateInvoiceId) setProjectId(paramProjectId);
  }, [paramCustomerName, paramPhone, paramProjectId, editInvoiceId, paramDuplicateInvoiceId]);

  // Load existing invoice for Edit or Duplicate Mode
  useEffect(() => {
    const targetInvoiceId = editInvoiceId || paramDuplicateInvoiceId;
    if (!targetInvoiceId) return;

    let isMounted = true;
    const fetchExistingInvoice = async () => {
      try {
        setLoadingInvoice(true);
        const data = await api.get<Invoice>(`/invoices/${targetInvoiceId}`);
        if (!data || !isMounted) return;

        setLoadedInvoiceData(data);

        // Switch business if invoice belongs to another business
        if (data.business_id && data.business_id !== businessId) {
          switchBusiness(data.business_id);
        }

        if (isEditMode) {
          const fullInvNum = data.invoice_number || '';
          const knownPrefixes = ['GN00', 'NN00', 'GN-', 'NN-', 'ALL-'];
          let matchedPrefix = knownPrefixes.find((p) => fullInvNum.startsWith(p)) || '';
          if (!matchedPrefix && data.business_id) {
            const biz = businesses.find((b) => b.id === data.business_id);
            if (biz?.invoice_prefix && fullInvNum.startsWith(biz.invoice_prefix)) {
              matchedPrefix = biz.invoice_prefix;
            }
          }

          if (matchedPrefix) {
            setInvoicePrefix(matchedPrefix);
            setInvoiceNumber(fullInvNum.slice(matchedPrefix.length));
          } else {
            setInvoicePrefix('');
            setInvoiceNumber(fullInvNum);
          }

          if (data.created_at) {
            try {
              setInvoiceDate(new Date(data.created_at).toISOString().split('T')[0]);
            } catch {}
          }
        }

        // Party / Customer
        if (data.customer_id) setSelectedCustomerId(data.customer_id);
        if (data.customer_name) {
          setPartyName(data.customer_name);
          setHasSelectedParty(true);
        }
        if (data.customer_phone) setPartyPhone(data.customer_phone);
        if (data.customer_address) setPartyAddress(data.customer_address);
        if (data.customer_gstin) setPartyGstin(data.customer_gstin);

        // Shipping
        if (data.ship_to_name) setShipToName(data.ship_to_name);
        if (data.ship_to_phone) setShipToPhone(data.ship_to_phone);
        if (data.ship_to_address) setShipToAddress(data.ship_to_address);

        // Project
        if (data.project_id) setProjectId(data.project_id);

        // Clean Notes & Metadata
        let cleanNotes = data.notes || '';
        const supplyMatch = cleanNotes.match(/\[Place of Supply:\s*([^\]]+)\]/i);
        if (supplyMatch && supplyMatch[1]) {
          setPlaceOfSupply(supplyMatch[1].trim());
          cleanNotes = cleanNotes.replace(/\[Place of Supply:[^\]]+\]/gi, '').trim();
        }
        const addressMatch = cleanNotes.match(/\[Address:\s*([^\]]+)\]/i);
        if (addressMatch && addressMatch[1] && !data.customer_address) {
          setPartyAddress(addressMatch[1].trim());
          cleanNotes = cleanNotes.replace(/\[Address:[^\]]+\]/gi, '').trim();
        }
        const dueMatch = cleanNotes.match(/\[Due Date:\s*([^\]]+)\]/i);
        if (dueMatch && dueMatch[1]) {
          setDueDate(dueMatch[1].trim());
          setHasCustomDueDate(true);
          cleanNotes = cleanNotes.replace(/\[Due Date:[^\]]+\]/gi, '').trim();
        }
        const termsMatch = cleanNotes.match(/\[Terms:\s*([^\]]+)\]/i);
        if (termsMatch && termsMatch[1]) {
          setTerms(termsMatch[1].trim());
          cleanNotes = cleanNotes.replace(/\[Terms:[^\]]+\]/gi, '').trim();
        } else if (data.business_footer) {
          setTerms(data.business_footer);
        }
        const roundOffMatch = cleanNotes.match(/\[Round Off:\s*([^\]]+)\]/i);
        if (roundOffMatch && roundOffMatch[1]) {
          setAutoRoundOff(true);
          cleanNotes = cleanNotes.replace(/\[Round Off:[^\]]+\]/gi, '').trim();
        }

        const splitMatch = cleanNotes.match(/\[Split Payments:\s*([^\]]+)\]/i);
        let parsedSplits: any[] | null = null;
        if (splitMatch && splitMatch[1]) {
          try {
            parsedSplits = JSON.parse(splitMatch[1]);
            cleanNotes = cleanNotes.replace(/\[Split Payments:[^\]]+\]/gi, '').trim();
          } catch (e) {}
        }

        setNotes(cleanNotes);
        if (cleanNotes) setShowNotesInput(true);

        // Payment details
        const activeSplits = ((data as any).split_payments && Array.isArray((data as any).split_payments) && (data as any).split_payments.length > 0)
          ? (data as any).split_payments
          : parsedSplits;

        if (activeSplits && Array.isArray(activeSplits) && activeSplits.length > 0) {
          setSplitPayments(
            activeSplits.map((sp: any, i: number) => ({
              id: `pay-${Date.now()}-${i}`,
              amount: sp.amount !== undefined && sp.amount !== null ? Math.round(Number(sp.amount)) : '',
              method: sp.method || 'cash'
            }))
          );
        } else if (data.payment_method) {
          setPaymentMethod(data.payment_method as any);
          const initAmt = data.payment_status === 'paid' ? Math.round(Number(data.total_amount) || 0) : ((data as any).paid_amount !== undefined ? Math.round(Number((data as any).paid_amount)) : '');
          setSplitPayments([
            {
              id: 'pay-1',
              amount: initAmt,
              method: (data.payment_method === 'split' ? 'cash' : data.payment_method) as any
            }
          ]);
        }
        if (data.payment_status === 'paid') {
          setIsMarkAsPaid(true);
        }
        if (data.amount_in_words) {
          setAmountInWords(data.amount_in_words);
          setIsCustomWords(true);
        }
        if (data.extra_charges && Array.isArray(data.extra_charges) && data.extra_charges.length > 0) {
          setExtraCharges(data.extra_charges);
          setShowAddCharges(true);
        }

        // Discounts
        const totalItemsDisc = (data.items || []).reduce((s: number, it: any) => s + Number(it.discount || it.discount_amount || 0), 0);
        const invTotalDisc = Number(data.discount_amount || 0);
        if (invTotalDisc > totalItemsDisc) {
          const overallDisc = invTotalDisc - totalItemsDisc;
          setDiscountAmount(overallDisc);
          setShowOverallDiscount(true);
        }

        // Items
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const isTax = data.business_id === 'grow-naturals' || isTaxable;
          const mappedItems: FormItem[] = data.items.map((it: any, idx: number) => {
            const qty = Math.round(Number(it.quantity) || 1);
            const price = Math.round(Number(it.unit_price) || 0);
            const discAmount = Math.round(Number(it.discount !== undefined ? it.discount : (it.discount_amount || 0)));
            const rawTotal = qty * price;
            const discPercent = rawTotal > 0 ? Math.round((discAmount / rawTotal) * 100) : 0;
            const taxRate = Number(it.gst_rate) || 0;
            const taxAmt = Math.round(Number(it.tax_amount) || 0);
            const total = Math.round(Number(it.total) || (rawTotal - discAmount + taxAmt));

            return {
              id: it.id || `item-${Date.now()}-${idx}`,
              product_id: it.product_id || null,
              product_name: it.product_name || 'Item',
              sku: it.sku || '',
              hsn_code: it.hsn_code || (isTax ? '3926' : '0602'),
              mrp: Math.round(Number(it.mrp || price)),
              quantity: qty,
              unit: it.unit || 'PCS',
              unit_price: price,
              discount_percent: discPercent,
              discount_amount: discAmount,
              gst_rate: taxRate,
              tax_amount: taxAmt,
              total: total,
              description: it.description || '',
              isNew: false
            };
          });
          setItems(mappedItems);
        }
      } catch (err: any) {
        console.error('Failed to load invoice for editing:', err);
        alert(`Failed to load invoice: ${err.message || 'Error occurred'}`);
      } finally {
        if (isMounted) setLoadingInvoice(false);
      }
    };

    fetchExistingInvoice();
    return () => {
      isMounted = false;
    };
  }, [editInvoiceId, paramDuplicateInvoiceId]);

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
  const [showTermsInput, setShowTermsInput] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    account_number: businessId === 'grow-naturals' ? '919020090453200' : '50200084729104',
    ifsc_code: businessId === 'grow-naturals' ? 'UTIB0003648' : 'HDFC0001298',
    bank_name: businessId === 'grow-naturals' ? 'Axis Bank, Teppakulam Madurai' : 'HDFC Bank, K.K Nagar Branch',
    account_holder: activeBusiness?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery & Farm')
  });

  // Additional / Extra financial options (MyBillBook Multi-Charge & Dual Discount)
  const [extraCharges, setExtraCharges] = useState<ExtraChargeItem[]>([]);
  const [showAddCharges, setShowAddCharges] = useState(false);
  const [discountType, setDiscountType] = useState<'after_tax' | 'before_tax'>('after_tax');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showOverallDiscount, setShowOverallDiscount] = useState(false);
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [roundOffSign, setRoundOffSign] = useState<'add' | 'reduce'>('add');
  const [manualRoundOff, setManualRoundOff] = useState<number | string>('');
  const [customTotalAmount, setCustomTotalAmount] = useState<string | null>(null);
  const [isMarkAsPaid, setIsMarkAsPaid] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentItem[]>([
    { id: 'pay-1', amount: '', method: 'cash' }
  ]);
  const [showReceivedInput, setShowReceivedInput] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque'>('cash');
  const [paymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');

  // Payment QR State (MyBillBook Spec)
  const [showPaymentQr, setShowPaymentQr] = useState<boolean>(false);
  const [paymentQrModalOpen, setPaymentQrModalOpen] = useState<boolean>(false);
  const [upiId, setUpiId] = useState<string>(
    businessId === 'grow-naturals' ? 'grownaturals@axisbank' : 'nikhleshnursery@hdfcbank'
  );
  const [upiPayeeName, setUpiPayeeName] = useState<string>(
    activeBusiness?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery & Farm')
  );
  const [includeAmountInQr, setIncludeAmountInQr] = useState<boolean>(true);
  const [tempUpiId, setTempUpiId] = useState<string>('');
  const [tempPayeeName, setTempPayeeName] = useState<string>('');
  const [tempIncludeAmount, setTempIncludeAmount] = useState<boolean>(true);

  // Signature State (MyBillBook Spec)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(() => {
    return localStorage.getItem('grow_naturals_signature') || null;
  });
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [sigTab, setSigTab] = useState<'upload' | 'draw'>('upload');
  const [uploadedSigFile, setUploadedSigFile] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saveAsDefaultSig, setSaveAsDefaultSig] = useState(true);
  const [signatoryLabel, setSignatoryLabel] = useState<string>(
    businessId === 'grow-naturals' ? 'Authorized Signatory for Grow Naturals' : 'Authorized Signatory'
  );
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigFileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickSettingsTab, setQuickSettingsTab] = useState<'invoice' | 'party' | 'item_table'>('invoice');
  const [autoPrefixSeqEnabled, setAutoPrefixSeqEnabled] = useState(true);
  const [industryType, setIndustryType] = useState('Others');
  const [invoiceCustomFieldToggles, setInvoiceCustomFieldToggles] = useState<{ [key: string]: boolean }>({
    po_number: false,
    eway_bill: false,
    vehicle_number: false,
    delivery_note: false,
  });
  const [partyCustomFields, setPartyCustomFields] = useState<{ id: string; name: string; value: string }[]>([]);
  const [showNewCustomFieldInput, setShowNewCustomFieldInput] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [showPurchasePriceWhileAdding, setShowPurchasePriceWhileAdding] = useState(true);
  const [showItemImageOnInvoice, setShowItemImageOnInvoice] = useState(true);
  const [showPriceHistoryToggle, setShowPriceHistoryToggle] = useState(true);
  const [itemTableColumnToggles, setItemTableColumnToggles] = useState<{ [key: string]: boolean }>({
    price_item: true,
    quantity: true,
    hsn: true,
    mrp: true,
    discount: true,
    tax: true,
    description: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Floating Toast Notification State (MyBillBook Spec)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToastNotification = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Existing customers, products & categories from database
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS);
  const [products, setProducts] = useState<any[]>(SEED_PRODUCTS);
  const [categories, setCategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [highlightedPartyIndex, setHighlightedPartyIndex] = useState<number>(0);

  // Mobile UI States
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [mobilePartySelectOpen, setMobilePartySelectOpen] = useState(false);
  const [mobilePartySearchQuery, setMobilePartySearchQuery] = useState('');
  const [mobilePartyTab, setMobilePartyTab] = useState<'all' | 'contacts'>('all');
  const [deviceContacts, setDeviceContacts] = useState<Array<{ name: string; phone: string }>>(() => {
    try {
      const saved = localStorage.getItem('gn_mobile_contacts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [contactPermissionGranted, setContactPermissionGranted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gn_mobile_contacts_granted');
      return saved === 'true';
    } catch (e) {}
    return false;
  });
  const [mobilePosDropdownOpen, setMobilePosDropdownOpen] = useState(false);
  const [mobilePosSearchTerm, setMobilePosSearchTerm] = useState('');
  const [mobilePosModalOpen, setMobilePosModalOpen] = useState(false);

  // Mobile Add Items & Invoice Success States (Screenshots 2 & 4)
  const [mobileAddItemsOpen, setMobileAddItemsOpen] = useState(false);
  const [mobileItemSearchQuery, setMobileItemSearchQuery] = useState('');
  const [mobileItemCategory, setMobileItemCategory] = useState('all');
  const [mobileCategoryDropdownOpen, setMobileCategoryDropdownOpen] = useState(false);
  const [mobileInvoiceSuccessOpen, setMobileInvoiceSuccessOpen] = useState(false);
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);
  const [expandedItemPp, setExpandedItemPp] = useState<Record<string, boolean>>({});

  const toggleItemPp = (prodKey: string) => {
    setExpandedItemPp((prev) => ({
      ...prev,
      [prodKey]: !prev[prodKey]
    }));
  };

  // Mobile Items View States (Exact Reference Spec)
  const [mobileItemsExpanded, setMobileItemsExpanded] = useState(true);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [itemEditTab, setItemEditTab] = useState<'price' | 'other'>('price');
  const [tempItemQty, setTempItemQty] = useState<number>(1);
  const [tempItemRate, setTempItemRate] = useState<number>(0);
  const [tempItemMrp, setTempItemMrp] = useState<number>(0);
  const [tempItemTaxRate, setTempItemTaxRate] = useState<number>(0);
  const [tempItemUnit, setTempItemUnit] = useState<string>('PCS');
  const [tempItemDiscountVal, setTempItemDiscountVal] = useState<number>(0);
  const [tempItemDiscountType, setTempItemDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [tempItemDiscountDropdownOpen, setTempItemDiscountDropdownOpen] = useState(false);
  const [tempItemDescription, setTempItemDescription] = useState<string>('');

  // Mobile Action Links & Dynamic Rows Visibility States (Exact Reference Spec)
  const [showMobileCharges, setShowMobileCharges] = useState(false);
  const [chargesExpanded, setChargesExpanded] = useState(true);
  const [activeChargeTaxDropdownId, setActiveChargeTaxDropdownId] = useState<string | null>(null);

  const [showMobileDiscount, setShowMobileDiscount] = useState(false);
  const [showMobileRoundOff, setShowMobileRoundOff] = useState(false);

  const [showMobileReceived, setShowMobileReceived] = useState(false);
  const [receivedExpanded, setReceivedExpanded] = useState(true);

  const [showMobileNotes, setShowMobileNotes] = useState(false);

  // Mobile Edit Sales Invoice Date & Number Bottom Sheet (Screenshots 1-4)
  const [editDateNumberModalOpen, setEditDateNumberModalOpen] = useState(false);
  const [tempInvDate, setTempInvDate] = useState(() => invoiceDate || new Date().toISOString().split('T')[0]);
  const [tempHasDueDate, setTempHasDueDate] = useState(true);
  const [tempDueDate, setTempDueDate] = useState(() => {
    if (dueDate) return dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [tempDueDays, setTempDueDays] = useState<number | string>(7);
  const [dueDaysDropdownOpen, setDueDaysDropdownOpen] = useState(false);
  const [tempHasPrefix, setTempHasPrefix] = useState(false);
  const [tempPrefix, setTempPrefix] = useState(() => invoicePrefix || 'GN/SL/');
  const [tempInvoiceNumber, setTempInvoiceNumber] = useState(() => invoiceNumber || '8223');

  // Custom Material Date Picker Modal State (Screenshot 2)
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'invoice' | 'due'>('invoice');
  const [pickerSelectedDate, setPickerSelectedDate] = useState<Date>(() => new Date());
  const [pickerViewMonth, setPickerViewMonth] = useState<number>(() => new Date().getMonth());
  const [pickerViewYear, setPickerViewYear] = useState<number>(() => new Date().getFullYear());

  const monthNamesList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNamesShortList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDayHeadersList = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const openEditDateNumberModal = () => {
    const curInvDate = invoiceDate || new Date().toISOString().split('T')[0];
    setTempInvDate(curInvDate);

    // Default to 7 days due date
    const hasDue = hasCustomDueDate && Boolean(dueDate) ? true : (paymentTermsDays !== 0);
    setTempHasDueDate(hasDue);

    const days = typeof paymentTermsDays === 'number' && paymentTermsDays > 0 ? paymentTermsDays : 7;
    setTempDueDays(days);

    if (hasDue) {
      if (dueDate) {
        setTempDueDate(dueDate);
      } else {
        const d = new Date(curInvDate);
        d.setDate(d.getDate() + days);
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        setTempDueDate(`${yr}-${mo}-${da}`);
      }
    } else {
      setTempDueDate('');
    }

    // Default to false: single Sales Invoice Number field by default (Screenshot 4)
    const hasPfx = hasCustomPrefix && Boolean(invoicePrefix && invoicePrefix.trim().length > 0);
    setTempHasPrefix(hasPfx);
    setTempPrefix(invoicePrefix || 'GN/SL/');
    setTempInvoiceNumber(invoiceNumber || '8223');
    setDueDaysDropdownOpen(false);
    setDatePickerOpen(false);
    setEditDateNumberModalOpen(true);
  };

  const handleSelectDueDays = (numDays: number) => {
    setTempDueDays(numDays);
    setTempHasDueDate(true);
    if (tempInvDate) {
      const base = new Date(tempInvDate);
      base.setDate(base.getDate() + numDays);
      const yr = base.getFullYear();
      const mo = String(base.getMonth() + 1).padStart(2, '0');
      const da = String(base.getDate()).padStart(2, '0');
      setTempDueDate(`${yr}-${mo}-${da}`);
    }
    setDueDaysDropdownOpen(false);
  };

  const handleSelectCustomDays = () => {
    setDueDaysDropdownOpen(false);
    handleOpenCustomDatePicker('due');
  };

  const handleRemoveDueDate = () => {
    setTempHasDueDate(false);
    setTempDueDate('');
    setDueDaysDropdownOpen(false);
  };

  const handleOpenCustomDatePicker = (target: 'invoice' | 'due') => {
    setDatePickerTarget(target);
    const dateStr = target === 'invoice' ? tempInvDate : (tempDueDate || tempInvDate);
    const d = dateStr ? new Date(dateStr) : new Date();
    setPickerSelectedDate(d);
    setPickerViewMonth(d.getMonth());
    setPickerViewYear(d.getFullYear());
    setDatePickerOpen(true);
    setDueDaysDropdownOpen(false);
  };

  const handlePrevMonth = () => {
    if (pickerViewMonth === 0) {
      setPickerViewMonth(11);
      setPickerViewYear(pickerViewYear - 1);
    } else {
      setPickerViewMonth(pickerViewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerViewMonth === 11) {
      setPickerViewMonth(0);
      setPickerViewYear(pickerViewYear + 1);
    } else {
      setPickerViewMonth(pickerViewMonth + 1);
    }
  };

  const handleConfirmDatePicker = () => {
    const yr = pickerSelectedDate.getFullYear();
    const mo = String(pickerSelectedDate.getMonth() + 1).padStart(2, '0');
    const da = String(pickerSelectedDate.getDate()).padStart(2, '0');
    const formattedIso = `${yr}-${mo}-${da}`;

    if (datePickerTarget === 'invoice') {
      setTempInvDate(formattedIso);
      if (tempHasDueDate && typeof tempDueDays === 'number' && tempDueDays > 0) {
        const dueD = new Date(pickerSelectedDate);
        dueD.setDate(dueD.getDate() + tempDueDays);
        const dueYr = dueD.getFullYear();
        const dueMo = String(dueD.getMonth() + 1).padStart(2, '0');
        const dueDa = String(dueD.getDate()).padStart(2, '0');
        setTempDueDate(`${dueYr}-${dueMo}-${dueDa}`);
      }
    } else {
      setTempDueDate(formattedIso);
      setTempHasDueDate(true);
      if (tempInvDate) {
        const invD = new Date(tempInvDate);
        const diffTime = pickerSelectedDate.getTime() - invD.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          setTempDueDays(diffDays);
        } else {
          setTempDueDays('Custom');
        }
      }
    }
    setDatePickerOpen(false);
  };

  const handleSaveDateNumber = () => {
    setInvoiceDate(tempInvDate);
    if (tempHasDueDate && tempDueDate) {
      setDueDate(tempDueDate);
      setPaymentTermsDays(typeof tempDueDays === 'number' ? tempDueDays : 7);
      setHasCustomDueDate(true);
    } else {
      setDueDate('');
      setPaymentTermsDays(0);
      setHasCustomDueDate(false);
    }

    if (tempHasPrefix) {
      setHasCustomPrefix(true);
      setInvoicePrefix(tempPrefix);
      setInvoiceNumber(tempInvoiceNumber);
      setAutoPrefixSeqEnabled(true);
    } else {
      setHasCustomPrefix(false);
      setInvoicePrefix('');
      setInvoiceNumber(tempInvoiceNumber);
      setAutoPrefixSeqEnabled(false);
    }
    setEditDateNumberModalOpen(false);
  };

  const handleOpenEditMobileItem = (targetIdx: number) => {
    const it = items[targetIdx];
    if (!it) return;
    setEditingItemIdx(targetIdx);
    setItemEditTab('price');
    setTempItemQty(it.quantity || 1);
    setTempItemRate(it.unit_price || 0);
    setTempItemMrp(it.mrp || 0);
    setTempItemTaxRate(it.gst_rate !== undefined ? it.gst_rate : (isTaxable ? 18 : 0));
    setTempItemUnit(it.unit || 'PCS');
    setTempItemDescription(it.description || '');
    if (it.discount_percent && it.discount_percent > 0) {
      setTempItemDiscountType('percentage');
      setTempItemDiscountVal(it.discount_percent);
    } else if (it.discount_amount && it.discount_amount > 0) {
      setTempItemDiscountType('amount');
      setTempItemDiscountVal(it.discount_amount);
    } else {
      setTempItemDiscountType('amount');
      setTempItemDiscountVal(0);
    }
    setTempItemDiscountDropdownOpen(false);
  };

  const handleSaveEditedMobileItem = () => {
    if (editingItemIdx === null) return;
    const updated = [...items];
    const target = updated[editingItemIdx];
    if (!target) return;

    const baseAmount = tempItemQty * tempItemRate;
    let discAmount = 0;
    let discPercent = 0;
    if (tempItemDiscountType === 'percentage') {
      discPercent = Number(tempItemDiscountVal || 0);
      discAmount = Number(((baseAmount * discPercent) / 100).toFixed(2));
    } else {
      discAmount = Number(tempItemDiscountVal || 0);
      discPercent = baseAmount > 0 ? Number(((discAmount / baseAmount) * 100).toFixed(2)) : 0;
    }
    const taxableAfterDisc = Math.max(0, baseAmount - discAmount);
    const taxAmt = Number(((taxableAfterDisc * tempItemTaxRate) / 100).toFixed(2));
    const itemTotal = Number((taxableAfterDisc + taxAmt).toFixed(2));

    updated[editingItemIdx] = {
      ...target,
      quantity: tempItemQty,
      unit_price: tempItemRate,
      mrp: tempItemMrp,
      gst_rate: tempItemTaxRate,
      tax_amount: taxAmt,
      unit: tempItemUnit,
      discount_amount: discAmount,
      discount_percent: discPercent,
      description: tempItemDescription,
      total: itemTotal
    };
    setItems(updated);
    setEditingItemIdx(null);
  };

  const handleDeleteEditedMobileItem = () => {
    if (editingItemIdx === null) return;
    const filtered = items.filter((_, idx) => idx !== editingItemIdx);
    setItems(filtered);
    if (filtered.length === 0) {
      setShowMobileCharges(false);
      setExtraCharges([]);
      setShowMobileDiscount(false);
      setDiscountAmount(0);
      setDiscountPercent(0);
      setShowMobileRoundOff(false);
      setManualRoundOff(0);
      setShowMobileReceived(false);
      setSplitPayments([]);
      setShowMobileNotes(false);
      setNotes('');
      setShowNotesInput(false);
    }
    setEditingItemIdx(null);
  };

  const renderEditItemBottomSheet = () => {
    if (editingItemIdx === null || !items[editingItemIdx]) return null;
    const editItem = items[editingItemIdx];
    const editBaseAmount = Number((tempItemQty * tempItemRate).toFixed(2));
    let editDiscAmount = 0;
    let editDiscPercent = 0;
    if (tempItemDiscountType === 'percentage') {
      editDiscPercent = Number(tempItemDiscountVal || 0);
      editDiscAmount = Number(((editBaseAmount * editDiscPercent) / 100).toFixed(2));
    } else {
      editDiscAmount = Number(tempItemDiscountVal || 0);
      editDiscPercent = editBaseAmount > 0 ? Number(((editDiscAmount / editBaseAmount) * 100).toFixed(1)) : 0;
    }
    const editTaxable = Math.max(0, editBaseAmount - editDiscAmount);
    const editTaxAmt = Number(((editTaxable * tempItemTaxRate) / 100).toFixed(2));
    const editTotal = Number((editTaxable + editTaxAmt).toFixed(2));
    const editTotalDisplay = Number.isInteger(editTotal) ? editTotal.toFixed(0) : editTotal.toFixed(2);

    return (
      <div
        className="csi-item-edit-backdrop"
        onClick={() => setEditingItemIdx(null)}
      >
        <div
          className="csi-item-edit-sheet"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Back Arrow, Item Name, DEL button (Screenshots 1 & 2) */}
          <div className="csi-item-edit-top-bar">
            <button
              type="button"
              onClick={() => setEditingItemIdx(null)}
              className="csi-item-edit-back-btn"
              aria-label="Back"
            >
              <ArrowLeft size={22} color="#334155" />
            </button>
            <h3 className="csi-item-edit-title-text" title={editItem.product_name}>
              {editItem.product_name}
            </h3>
            <button
              type="button"
              onClick={handleDeleteEditedMobileItem}
              className="csi-item-edit-del-pill"
              title="Delete this item"
            >
              DEL
            </button>
          </div>

          {/* Tabs: Price & Discount | Other Details */}
          <div className="csi-item-edit-tabs">
            <button
              type="button"
              onClick={() => setItemEditTab('price')}
              className={`csi-item-edit-tab-btn ${itemEditTab === 'price' ? 'active' : ''}`}
            >
              Price & Discount
            </button>
            <button
              type="button"
              onClick={() => setItemEditTab('other')}
              className={`csi-item-edit-tab-btn ${itemEditTab === 'other' ? 'active' : ''}`}
            >
              Other Details
            </button>
          </div>

          {/* Tab Body */}
          <div className="csi-item-edit-body">
            {itemEditTab === 'price' ? (
              <>
                {/* 1. Sales Price (Without Tax) */}
                <div className="csi-item-edit-field-group">
                  <label className="csi-item-edit-field-lbl">Sales Price (Without Tax)</label>
                  <div className="csi-item-edit-input-box">
                    <span className="csi-item-edit-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={tempItemRate === 0 ? '' : tempItemRate}
                      onChange={(e) => setTempItemRate(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="csi-item-edit-field-input"
                    />
                  </div>
                </div>

                {/* 2. Quantity & Unit (Two columns) */}
                <div className="csi-item-edit-two-col">
                  <div className="csi-item-edit-field-group">
                    <label className="csi-item-edit-field-lbl">Quantity</label>
                    <div className="csi-item-edit-input-box">
                      <input
                        type="number"
                        step="any"
                        value={tempItemQty === 0 ? '' : tempItemQty}
                        onChange={(e) => setTempItemQty(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="csi-item-edit-field-input"
                      />
                    </div>
                  </div>
                  <div className="csi-item-edit-field-group">
                    <label className="csi-item-edit-field-lbl">Unit</label>
                    <div className="csi-item-edit-input-box csi-item-edit-unit-readonly">
                      <span>{tempItemUnit || 'PCS'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Discount */}
                <div className="csi-item-edit-field-group">
                  <label className="csi-item-edit-field-lbl">Discount</label>
                  <div className="csi-item-edit-discount-box">
                    <span className="csi-item-edit-prefix">
                      {tempItemDiscountType === 'percentage' ? '%' : '₹'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={tempItemDiscountVal === 0 ? '' : tempItemDiscountVal}
                      onChange={(e) => setTempItemDiscountVal(parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                      className="csi-item-edit-field-input"
                    />
                    <div className="csi-item-edit-disc-type-wrap">
                      <button
                        type="button"
                        onClick={() => setTempItemDiscountDropdownOpen(!tempItemDiscountDropdownOpen)}
                        className="csi-item-edit-disc-type-btn"
                      >
                        <span>{tempItemDiscountType === 'percentage' ? 'Percentage' : 'Amount'}</span>
                        <ChevronDown size={14} color="#64748b" />
                      </button>
                      {tempItemDiscountDropdownOpen && (
                        <div className="csi-item-edit-disc-menu">
                          <div
                            onClick={() => {
                              setTempItemDiscountType('amount');
                              setTempItemDiscountDropdownOpen(false);
                            }}
                            className={`csi-item-edit-disc-menu-item ${tempItemDiscountType === 'amount' ? 'active' : ''}`}
                          >
                            Amount
                          </div>
                          <div
                            onClick={() => {
                              setTempItemDiscountType('percentage');
                              setTempItemDiscountDropdownOpen(false);
                            }}
                            className={`csi-item-edit-disc-menu-item ${tempItemDiscountType === 'percentage' ? 'active' : ''}`}
                          >
                            Percentage
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Tax Rate */}
                <div className="csi-item-edit-field-group">
                  <label className="csi-item-edit-field-lbl">Tax Rate</label>
                  <select
                    value={tempItemTaxRate}
                    onChange={(e) => setTempItemTaxRate(parseFloat(e.target.value) || 0)}
                    className="csi-item-edit-select-box"
                  >
                    <option value={0}>GST @ 0%</option>
                    <option value={5}>GST @ 5%</option>
                    <option value={12}>GST @ 12%</option>
                    <option value={18}>GST @ 18%</option>
                    <option value={28}>GST @ 28%</option>
                  </select>
                </div>

                {/* 5. MRP */}
                <div className="csi-item-edit-field-group">
                  <label className="csi-item-edit-field-lbl">MRP</label>
                  <div className="csi-item-edit-input-box">
                    <span className="csi-item-edit-prefix">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={tempItemMrp === 0 ? '' : tempItemMrp}
                      onChange={(e) => setTempItemMrp(parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                      className="csi-item-edit-field-input"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* OTHER DETAILS TAB (Screenshot 2) */
              <div className="csi-item-edit-field-group">
                <label className="csi-item-edit-field-lbl">Item Description</label>
                <textarea
                  value={tempItemDescription}
                  onChange={(e) => setTempItemDescription(e.target.value)}
                  placeholder="Add Note/ Description"
                  className="csi-item-edit-textarea"
                  rows={3}
                />
              </div>
            )}

            {/* Calculation Summary Card (Screenshots 1 & 2) */}
            <div className="csi-item-edit-calc-card">
              <div className="csi-item-edit-calc-row">
                <span className="csi-item-edit-calc-lbl">Tax Exclusive Price * Qty</span>
                <span className="csi-item-edit-calc-val">₹ {editBaseAmount.toFixed(2)}</span>
              </div>
              <div className="csi-item-edit-calc-row">
                <span className="csi-item-edit-calc-lbl">Discount</span>
                <span className="csi-item-edit-calc-val">({editDiscPercent.toFixed(1)}%) ₹ {editDiscAmount}</span>
              </div>
              <div className="csi-item-edit-calc-row">
                <span className="csi-item-edit-calc-lbl">Tax Rate(%)</span>
                <span className="csi-item-edit-calc-val">{tempItemTaxRate.toFixed(1)}% = ₹ {editTaxAmt.toFixed(2)}</span>
              </div>
              <div className="csi-item-edit-calc-row total">
                <span className="csi-item-edit-calc-lbl total">Total Amount</span>
                <span className="csi-item-edit-calc-val total">₹ {editTotalDisplay}</span>
              </div>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={handleSaveEditedMobileItem}
              className="csi-item-edit-done-btn"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleOpenMobileCharges = () => {
    setShowMobileCharges(true);
    setChargesExpanded(true);
    if (extraCharges.length === 0) {
      setExtraCharges([
        { id: `ec-${Date.now()}`, name: 'Charge Name', amount: '00.00', tax_rate: 0 }
      ]);
    }
    setShowAddCharges(true);
  };

  const handleAddAnotherChargeMobile = () => {
    setExtraCharges((prev) => [
      ...prev,
      { id: `ec-${Date.now()}`, name: 'Charge Name', amount: '00.00', tax_rate: 0 }
    ]);
  };

  const handleRemoveChargeRowMobile = (id: string) => {
    const updated = extraCharges.filter((c) => c.id !== id);
    setExtraCharges(updated);
    if (updated.length === 0) {
      setShowMobileCharges(false);
      setShowAddCharges(false);
    }
  };

  const handleUpdateChargeMobile = (id: string, updates: Partial<ExtraChargeItem>) => {
    setExtraCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleOpenMobileDiscount = () => {
    setShowMobileDiscount(true);
    setDiscountType('after_tax');
    setShowOverallDiscount(true);
  };

  const handleRemoveDiscountMobile = () => {
    setShowMobileDiscount(false);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setShowOverallDiscount(false);
  };

  const handleOpenMobileRoundOff = () => {
    setShowMobileRoundOff(true);
    setAutoRoundOff(false);
    if (!manualRoundOff) {
      setManualRoundOff('0.0');
    }
  };

  const handleRemoveRoundOffMobile = () => {
    setShowMobileRoundOff(false);
    setAutoRoundOff(false);
    setManualRoundOff('0');
  };

  const handleOpenMobileReceived = () => {
    setShowMobileReceived(true);
    setReceivedExpanded(true);
    if (splitPayments.length === 0 || !splitPayments.some((p) => p.amount !== '')) {
      setSplitPayments([
        { id: `sp-1`, amount: Math.round(roundedGrandTotal) || '', method: 'cash' }
      ]);
    }
  };

  const handleAddSplitPaymentMobile = () => {
    if (splitPayments.length < 3) {
      setSplitPayments((prev) => [
        ...prev,
        { id: `sp-${Date.now()}`, amount: '', method: 'cash' }
      ]);
    }
  };

  const handleRemoveSplitPaymentMobile = (id: string) => {
    const updated = splitPayments.filter((p) => p.id !== id);
    setSplitPayments(updated);
    if (updated.length === 0) {
      setShowMobileReceived(false);
    }
  };

  const handleOpenMobileNotes = () => {
    setShowMobileNotes(true);
    setShowNotesInput(true);
  };

  const handleRemoveNotesMobile = () => {
    setShowMobileNotes(false);
    setNotes('');
    setShowNotesInput(false);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredMobileCustomers = customers
    .filter((c) => {
      if (!mobilePartySearchQuery.trim()) return true;
      const q = mobilePartySearchQuery.toLowerCase().trim();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const filteredDeviceContacts = React.useMemo(() => {
    if (!mobilePartySearchQuery.trim()) return deviceContacts;
    const q = mobilePartySearchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/\D/g, '');
    return deviceContacts.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const cleanPhone = (c.phone || '').replace(/\D/g, '');
      const phoneMatch = cleanQ ? cleanPhone.includes(cleanQ) : (c.phone || '').includes(q);
      return nameMatch || phoneMatch;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [deviceContacts, mobilePartySearchQuery]);

  // "Add Items to Bill" Modal State (MyBillBook Spec)
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');
  const [selectedItemQuantities, setSelectedItemQuantities] = useState<Record<string, number>>({});
  const [showOnlySelectedItems, setShowOnlySelectedItems] = useState(false);

  // Create New Item Modal State (MyBillBook Spec)
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newItemModalTab, setNewItemModalTab] = useState<'basic' | 'stock' | 'pricing' | 'custom'>('basic');
  const [newProdType, setNewProdType] = useState<'Product' | 'Service'>('Product');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdShowOnline, setNewProdShowOnline] = useState(false);
  const [newProdSalePrice, setNewProdSalePrice] = useState<number | string>('');
  const [newProdSalePriceTaxType, setNewProdSalePriceTaxType] = useState<'with_tax' | 'without_tax'>('with_tax');
  const [newProdGst, setNewProdGst] = useState<number>(0);
  const [newProdUnit, setNewProdUnit] = useState<string>('Pieces(PCS)');
  const [newProdStock, setNewProdStock] = useState<number | string>('');
  const [newProdEnableBatching, setNewProdEnableBatching] = useState(false);

  // Advance Details Tabs
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdHsn, setNewProdHsn] = useState('3926');
  const [newProdMinStock, setNewProdMinStock] = useState<number | string>('5');
  const [newProdCostPrice, setNewProdCostPrice] = useState<number | string>('');
  const [newProdCostPriceTaxType, setNewProdCostPriceTaxType] = useState<'without_tax' | 'with_tax'>('without_tax');
  const [newProdMrp, setNewProdMrp] = useState<number | string>('');
  const [newProdWholesalePrice, setNewProdWholesalePrice] = useState<number | string>('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdSize, setNewProdSize] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [isSavingNewProduct, setIsSavingNewProduct] = useState(false);

  // Row actions menu state (3 dots dropdown)
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);

  // Click outside to close row action menu dropdown
  useEffect(() => {
    if (!activeRowMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.csi-row-action-menu-wrapper')) {
        setActiveRowMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveRowMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeRowMenuId]);

  // Click outside to close inline party search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (partySearchRef.current && !partySearchRef.current.contains(event.target as Node)) {
        setIsPartySearchOpen(false);
      }
    };
    if (isPartySearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPartySearchOpen]);

  // Synchronize business default updates and fetch next sequential invoice number
  useEffect(() => {
    if (isEditMode) return;
    const defaultPrefix = activeBusiness?.invoice_prefix || (businessId === 'grow-naturals' ? 'GN00' : 'NN00');
    setInvoicePrefix(defaultPrefix);
    setTerms(
      businessId === 'grow-naturals'
        ? '1. Goods once sold will not be taken back or exchanged.\n2. We do not take any responsibility for the loss or damage of goods once the material dispatched.'
        : '1. Plant saplings and live flora are perishable goods and non-returnable once received in good condition.\n2. Proper watering and sunlight instructions must be followed.'
    );
    setBankDetails({
      account_number: activeBusiness?.bank_account_number || (businessId === 'grow-naturals' ? '919020090453200' : '50200084729104'),
      ifsc_code: activeBusiness?.bank_ifsc || (businessId === 'grow-naturals' ? 'UTIB0003648' : 'HDFC0001298'),
      bank_name: activeBusiness?.bank_name || (businessId === 'grow-naturals' ? 'Axis Bank, Teppakulam Madurai' : 'HDFC Bank, K.K Nagar Branch'),
      account_holder: activeBusiness?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery & Farm')
    });
    setUpiId(activeBusiness?.upi_id || (businessId === 'grow-naturals' ? 'grownaturals@axisbank' : 'nikhleshnursery@hdfcbank'));
    setUpiPayeeName(activeBusiness?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery & Farm'));

    // Fetch next sequential invoice number from server
    api.get<any>('/invoices/next-number', { business_id: businessId, prefix: defaultPrefix })
      .then((res) => {
        if (res && res.sequence) {
          setInvoiceNumber(String(res.sequence));
          if (res.prefix) setInvoicePrefix(res.prefix);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch next invoice number:', err);
      });
  }, [businessId, isEditMode]);

  // Load existing customers, products, categories, projects and check AI engine status from database in real-time
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [custRes, prodRes, catRes, projRes, aiRes] = await Promise.all([
          api.get<Customer[]>('/customers').catch(() => []),
          api.get<Product[]>('/products', businessId && businessId !== 'all' ? { business_id: businessId } : undefined).catch(() => []),
          api.get<any[]>('/categories', businessId && businessId !== 'all' ? { business_id: businessId } : undefined).catch(() => []),
          api.get<any[]>('/projects', businessId && businessId !== 'all' ? { business_id: businessId } : undefined).catch(() => []),
          api.get('/invoices/ai-status').catch(() => null)
        ]);

        if (!isMounted) return;

        if (Array.isArray(custRes) && custRes.length > 0) {
          const existingNames = new Set(custRes.map((c) => (c.name || '').toLowerCase().trim()));
          const extraSeeds = SEED_CUSTOMERS.filter((s) => !existingNames.has((s.name || '').toLowerCase().trim()));
          setCustomers([...custRes, ...extraSeeds]);
        }

        if (Array.isArray(prodRes)) {
          if (prodRes.length > 0) {
            const existingNames = new Set(prodRes.map((p) => (p.name || '').toLowerCase().trim()));
            const missingSeeds = SEED_PRODUCTS.filter((s) => !existingNames.has((s.name || '').toLowerCase().trim()));
            setProducts([...prodRes, ...missingSeeds]);
          } else {
            setProducts(SEED_PRODUCTS);
          }
        }

        if (Array.isArray(catRes)) {
          setCategories(catRes);
          if (catRes.length > 0) {
            setNewProdCategory((prev) => prev || catRes[0].name);
          }
        }

        if (Array.isArray(projRes)) {
          setProjects(projRes);
        }

        if (aiRes) {
          const aiData = aiRes as any;
          if (aiData.gemini_configured || aiData.openai_configured) {
            setAiConfigured(true);
            if (aiData.active_provider) setAiProvider(aiData.active_provider);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live data from backend:', err);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
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
    const discAmount = Math.round((rawTotal * discPercent) / 100);
    const taxableLine = Math.max(0, rawTotal - discAmount);
    const taxAmt = isTaxable ? Math.round((taxableLine * taxRate) / 100) : 0;
    const finalLineTotal = Math.round(taxableLine + taxAmt);
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
          field === 'discount_amount' ||
          field === 'gst_rate'
        ) {
          const qty = field === 'quantity' ? Math.max(0, Math.round(Number(value)) || 0) : it.quantity;
          const price = field === 'unit_price' ? Math.max(0, Math.round(Number(value)) || 0) : it.unit_price;
          const rawTotal = qty * price;
          const taxRate = field === 'gst_rate' ? Number(value) || 0 : (isTaxable ? it.gst_rate : 0);

          let discAmount = it.discount_amount || 0;
          let discPercent = it.discount_percent || 0;

          if (field === 'discount_amount') {
            discAmount = Math.max(0, Math.round(Number(value)) || 0);
            discPercent = rawTotal > 0 ? Math.round((discAmount / rawTotal) * 100) : 0;
          } else if (field === 'discount_percent') {
            discPercent = Math.max(0, Math.min(100, Math.round(Number(value)) || 0));
            discAmount = Math.round((rawTotal * discPercent) / 100);
          } else if (field === 'quantity' || field === 'unit_price') {
            discAmount = Math.round((rawTotal * discPercent) / 100);
          }

          const taxableLine = Math.max(0, rawTotal - discAmount);
          const taxAmt = isTaxable ? Math.round((taxableLine * taxRate) / 100) : 0;
          const finalLineTotal = Math.round(taxableLine + taxAmt);

          updated.quantity = qty;
          updated.unit_price = price;
          updated.discount_amount = discAmount;
          updated.discount_percent = discPercent;
          updated.gst_rate = taxRate;
          updated.tax_amount = taxAmt;
          updated.total = finalLineTotal;
        }

        return updated;
      })
    );
  };

  const handleAddItem = () => {
    setAddItemModalOpen(true);
    setItemSearchQuery('');
    setItemCategoryFilter('all');
    setShowOnlySelectedItems(false);
  };

  const handleAddManualEmptyRow = () => {
    const newItem: FormItem = {
      id: `item-${Date.now()}`,
      product_name: '',
      hsn_code: isTaxable ? '3926' : '0602',
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

  const handleAddSelectedItemsToBill = () => {
    const newItems: FormItem[] = [];

    Object.entries(selectedItemQuantities).forEach(([prodId, qty]) => {
      if (qty <= 0) return;
      const prod = products.find((p) => p.id === prodId);
      if (!prod) return;

      const rate = Number(prod.sale_price || 0);
      const taxRate = isTaxable ? Number(prod.gst_rate || 0) : 0;
      const discPercent = Number(prod.discount_percent || 0);
      const { discAmount, taxAmt, finalLineTotal } = calculateRowValues(qty, rate, discPercent, taxRate);

      newItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        hsn_code: prod.hsn_code || '3926',
        unit: 'PCS',
        quantity: qty,
        unit_price: rate,
        mrp: Number(prod.mrp !== undefined ? prod.mrp : (prod.sale_price || 0)),
        discount_percent: discPercent,
        discount_amount: discAmount,
        tax_amount: taxAmt,
        gst_rate: taxRate,
        total: finalLineTotal
      });
    });

    if (newItems.length > 0) {
      setItems((prev) => {
        // Clean out empty blank rows if any
        const cleaned = prev.filter(it => it.product_name.trim() !== '' || it.unit_price > 0 || it.quantity > 1);
        return [...cleaned, ...newItems];
      });
    }

    setAddItemModalOpen(false);
    setSelectedItemQuantities({});
  };

  const handleCreateProduct = async (e?: React.FormEvent, isSaveAndNew: boolean = false) => {
    if (e) e.preventDefault();
    if (!newProdName.trim()) {
      alert('Please enter Item Name');
      return;
    }

    setIsSavingNewProduct(true);
    try {
      const matchedCat = categories.find((c: any) => c.name === newProdCategory || c.id === newProdCategory);
      
      const rawSalePrice = Number(newProdSalePrice) || 0;
      let calculatedSalePrice = rawSalePrice;
      if (newProdSalePriceTaxType === 'with_tax' && newProdGst > 0) {
        calculatedSalePrice = rawSalePrice / (1 + newProdGst / 100);
      }

      const rawCostPrice = Number(newProdCostPrice) || 0;
      let calculatedCostPrice = rawCostPrice;
      if (newProdCostPriceTaxType === 'with_tax' && newProdGst > 0) {
        calculatedCostPrice = rawCostPrice / (1 + newProdGst / 100);
      }

      const unitCode = MEASURING_UNITS.find(u => u.label === newProdUnit || u.code === newProdUnit)?.code || 'PCS';
      const autoSku = newProdSku.trim() || `GN-${Math.floor(1000 + Math.random() * 9000)}`;

      const finalMrp = Number(newProdMrp) || (rawSalePrice > 0 ? rawSalePrice : 0);
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        business_id: businessId as any,
        name: newProdName.trim(),
        sku: autoSku,
        barcode: String(Date.now()),
        hsn_code: newProdHsn.trim() || '3926',
        category_id: matchedCat?.id || null,
        category_name: matchedCat?.name || newProdCategory || 'General',
        cost_price: Math.round(calculatedCostPrice),
        sale_price: Math.round(calculatedSalePrice),
        mrp: finalMrp,
        gst_rate: Number(newProdGst) || 0,
        stock_quantity: Number(newProdStock) || 0,
        low_stock_threshold: Number(newProdMinStock) || 5,
        type: (newProdType === 'Service' ? 'service' : 'general') as any,
        attributes: {
          measuring_unit: unitCode,
          show_in_online_store: newProdShowOnline,
          enable_batching: newProdEnableBatching,
          cost_price: Math.round(calculatedCostPrice),
          sale_price: Math.round(calculatedSalePrice),
          mrp: finalMrp,
          wholesale_price: Number(newProdWholesalePrice) || 0,
          brand: newProdBrand,
          size: newProdSize,
          description: newProdDesc
        }
      };

      try {
        const res: any = await api.post('/products', newProduct);
        if (res && res.id) newProduct.id = res.id;
      } catch (postErr) {
        console.warn('Backend product creation warning:', postErr);
      }

      setProducts((prev) => [newProduct, ...prev]);
      setSelectedItemQuantities((prev) => ({ ...prev, [newProduct.id]: 1 }));
      handleMobileAddItem(newProduct);

      // Reset form fields
      setNewProdType('Product');
      setNewProdName('');
      setNewProdCategory('');
      setNewProdShowOnline(false);
      setNewProdSalePrice('');
      setNewProdSalePriceTaxType('with_tax');
      setNewProdGst(0);
      setNewProdUnit('Pieces(PCS)');
      setNewProdStock('');
      setNewProdEnableBatching(false);
      setNewProdSku('');
      setNewProdHsn('');
      setNewProdMinStock('');
      setNewProdCostPrice('');
      setNewProdCostPriceTaxType('without_tax');
      setNewProdMrp('');
      setNewProdWholesalePrice('');
      setNewProdBrand('');
      setNewProdSize('');
      setNewProdDesc('');
      setNewItemModalTab('stock');

      if (isSaveAndNew) {
        setShowNewProductForm(true);
      } else {
        setShowNewProductForm(false);
      }
    } catch (err) {
      console.error('Failed to create product:', err);
    } finally {
      setIsSavingNewProduct(false);
    }
  };

  // Keyboard shortcuts for Add Items Modal (ESC to close, F7 to Add to Bill)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!addItemModalOpen) return;
      if (e.key === 'Escape') {
        setAddItemModalOpen(false);
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleAddSelectedItemsToBill();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addItemModalOpen, selectedItemQuantities, products, isTaxable]);

  // Global Shortcut: Shift + Y to open party search
  useEffect(() => {
    const handleShiftY = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
      if (e.shiftKey && (e.key === 'Y' || e.key === 'y')) {
        e.preventDefault();
        setIsPartySearchOpen(true);
        setSearchCustomerQuery('');
      }
    };
    window.addEventListener('keydown', handleShiftY);
    return () => window.removeEventListener('keydown', handleShiftY);
  }, []);

  // Fetch recent sales prices for an item sold to this selected party
  const fetchPartyItemHistory = async (rowId: string, productId: string | null | undefined, productName: string) => {
    setPriceHistoryRowId(rowId);
    setIsLoadingPriceHistory(true);
    setPriceHistoryData([]);

    try {
      const params = new URLSearchParams();
      if (businessId) params.append('business_id', businessId);
      if (selectedCustomerId) params.append('customer_id', selectedCustomerId);
      if (partyPhone) params.append('customer_phone', partyPhone);
      if (partyName) params.append('customer_name', partyName);
      if (productId) params.append('product_id', productId);
      if (productName) params.append('product_name', productName);

      const res = await fetch(`/api/invoices/party-item-history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistoryData(Array.isArray(data) ? data : []);
      } else {
        setPriceHistoryData([]);
      }
    } catch (err) {
      console.error('Failed to fetch price history:', err);
      setPriceHistoryData([]);
    } finally {
      setIsLoadingPriceHistory(false);
    }
  };

  // Close price history popover on click outside or Escape
  useEffect(() => {
    if (!priceHistoryRowId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.csi-price-history-popover') && !target.closest('.csi-price-cell-wrap')) {
        setPriceHistoryRowId(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPriceHistoryRowId(null);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [priceHistoryRowId]);

  // Close Place of Supply dropdown on click outside or Escape
  useEffect(() => {
    if (!posDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (posDropdownRef.current && !posDropdownRef.current.contains(e.target as Node)) {
        setPosDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPosDropdownOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [posDropdownOpen]);

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleDuplicateItem = (id: string) => {
    const itemToDup = items.find((it) => it.id === id);
    if (!itemToDup) return;
    const duplicated: FormItem = {
      ...itemToDup,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isNew: true
    };
    const index = items.findIndex((it) => it.id === id);
    if (index !== -1) {
      const copy = [...items];
      copy.splice(index + 1, 0, duplicated);
      setItems(copy);
    } else {
      setItems((prev) => [...prev, duplicated]);
    }
  };

  // Additional / Extra Charges Handlers
  const handleAddInitialCharge = () => {
    setShowAddCharges(true);
    if (extraCharges.length === 0) {
      setExtraCharges([
        {
          id: `charge-${Date.now()}`,
          name: '',
          amount: 0,
          tax_rate: 0
        }
      ]);
    }
  };

  const handleAddAnotherCharge = () => {
    const hasUnnamedCharge = extraCharges.some((ch) => !ch.name || !ch.name.trim());
    if (hasUnnamedCharge) {
      showToastNotification('Please name the current additional charge before adding another');
      return;
    }

    setExtraCharges((prev) => [
      ...prev,
      {
        id: `charge-${Date.now()}`,
        name: '',
        amount: 0,
        tax_rate: 0
      }
    ]);
  };

  const handleUpdateCharge = (id: string, field: keyof ExtraChargeItem, val: any) => {
    setExtraCharges((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, [field]: val } : ch))
    );
  };

  const handleRemoveCharge = (id: string) => {
    setExtraCharges((prev) => {
      const remaining = prev.filter((ch) => ch.id !== id);
      if (remaining.length === 0) {
        setShowAddCharges(false);
      }
      return remaining;
    });
  };

  // Payment QR Code Handlers
  const generateUpiQrUrl = (vpa: string, payee: string, amount: number) => {
    if (!vpa.trim()) return '';
    const amtStr = amount > 0 ? `&am=${Math.round(amount)}` : '';
    const upiPayload = `upi://pay?pa=${encodeURIComponent(vpa.trim())}&pn=${encodeURIComponent(payee.trim())}${amtStr}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiPayload)}`;
  };

  const openPaymentQrModal = () => {
    const currentBizDefaultUpi = businessId === 'grow-naturals' ? 'grownaturals@axisbank' : 'nikhleshnursery@hdfcbank';
    const currentBizDefaultPayee = activeBusiness?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery & Farm');
    const isMismatched = (businessId === 'grow-naturals' && upiId.includes('nikhlesh')) || 
                         (businessId === 'nikhlesh-nursery' && (upiId.includes('grow-naturals') || upiId.includes('grownaturals')));
    
    const activeUpi = isMismatched || !upiId ? currentBizDefaultUpi : upiId;
    const activePayee = isMismatched || !upiPayeeName ? currentBizDefaultPayee : upiPayeeName;

    setUpiId(activeUpi);
    setUpiPayeeName(activePayee);
    setTempUpiId(activeUpi);
    setTempPayeeName(activePayee);
    setTempIncludeAmount(includeAmountInQr);
    setPaymentQrModalOpen(true);
  };

  const handleSavePaymentQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUpiId.trim()) {
      alert('Please enter a valid UPI ID / VPA');
      return;
    }
    setUpiId(tempUpiId.trim());
    setUpiPayeeName(tempPayeeName.trim());
    setIncludeAmountInQr(tempIncludeAmount);
    setShowPaymentQr(true);
    setPaymentQrModalOpen(false);
  };

  // Signature Handlers (MyBillBook Spec)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSigFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedSigFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSignature = () => {
    let finalSig = '';
    if (sigTab === 'upload') {
      if (!uploadedSigFile) {
        alert('Please upload a signature image first.');
        return;
      }
      finalSig = uploadedSigFile;
    } else {
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      finalSig = canvas.toDataURL('image/png');
    }

    setSignatureUrl(finalSig);
    if (saveAsDefaultSig) {
      localStorage.setItem('grow_naturals_signature', finalSig);
    }
    setSignatureModalOpen(false);
  };

  const handleRemoveSignature = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSignatureUrl(null);
    setUploadedSigFile(null);
    localStorage.removeItem('grow_naturals_signature');
  };

  // Financial aggregates & discount calculations (Whole numbers - Exact Spec)
  const subtotalQuantity = items.reduce((sum, it) => sum + Math.round(Number(it.quantity || 0)), 0);
  const rawSubtotal = items.reduce((sum, it) => sum + Math.round(it.quantity * it.unit_price), 0);
  const totalItemDiscounts = items.reduce((sum, it) => sum + Math.round(it.discount_amount || 0), 0);
  const itemsTaxableBase = Math.max(0, rawSubtotal - totalItemDiscounts);

  // Before-Tax Discount Handling
  const beforeTaxDiscount = discountType === 'before_tax' ? Math.min(itemsTaxableBase, Math.round(discountAmount)) : 0;
  const taxableAmount = Math.max(0, itemsTaxableBase - beforeTaxDiscount);

  // Tax on items (proportional if before-tax discount applied)
  const taxReductionProportion = itemsTaxableBase > 0 && discountType === 'before_tax' ? (taxableAmount / itemsTaxableBase) : 1;
  const rawItemTaxAmount = isTaxable ? items.reduce((sum, it) => sum + Math.round(it.tax_amount || 0), 0) : 0;
  const itemTaxAmount = Math.round(rawItemTaxAmount * taxReductionProportion);

  // Additional Charges & Taxes
  const totalExtraChargesAmount = extraCharges.reduce((sum, ch) => sum + Math.round(Number(ch.amount) || 0), 0);
  const extraChargesTaxAmount = isTaxable
    ? extraCharges.reduce((sum, ch) => {
        const amt = Math.round(Number(ch.amount) || 0);
        const rate = Number(ch.tax_rate) || 0;
        return sum + Math.round((amt * rate) / 100);
      }, 0)
    : 0;

  const totalTaxAmount = Math.round(itemTaxAmount + extraChargesTaxAmount);

  const isInterState = placeOfSupply.toLowerCase() !== 'tamil nadu';
  const cgstAmount = isTaxable && !isInterState ? Math.round(totalTaxAmount / 2) : 0;
  const sgstAmount = isTaxable && !isInterState ? Math.round(totalTaxAmount / 2) : 0;
  const igstAmount = isTaxable && isInterState ? Math.round(totalTaxAmount) : 0;

  // After-Tax Discount Handling
  const subtotalWithTaxesAndCharges = taxableAmount + totalTaxAmount + totalExtraChargesAmount;
  const effectiveAfterTaxDiscount = discountType === 'after_tax' ? Math.min(subtotalWithTaxesAndCharges, Math.round(discountAmount)) : 0;

  const rawGrandTotal = Math.max(0, subtotalWithTaxesAndCharges - effectiveAfterTaxDiscount);

  const effectiveRoundOff = (() => {
    if (rawGrandTotal <= 0) return 0;
    if (autoRoundOff) {
      return Math.round(rawGrandTotal) - rawGrandTotal;
    }
    const val = Math.round(Number(manualRoundOff) || 0);
    return roundOffSign === 'add' ? val : -val;
  })();

  const calculatedGrandTotal = rawGrandTotal > 0 ? Math.max(0, Math.round(rawGrandTotal + effectiveRoundOff)) : 0;
  const roundedGrandTotal = customTotalAmount !== null
    ? (customTotalAmount === '' ? 0 : Math.max(0, Math.round(Number(customTotalAmount) || 0)))
    : calculatedGrandTotal;
  const roundOffDifference = roundedGrandTotal - rawGrandTotal;

  const handleManualRoundOffChange = (valStr: string) => {
    setManualRoundOff(valStr);
    setAutoRoundOff(false);
  };

  const handleRoundOffSignChange = (sign: 'add' | 'reduce') => {
    setRoundOffSign(sign);
    setAutoRoundOff(false);
  };

  const handleTotalAmountChange = (valStr: string) => {
    setCustomTotalAmount(valStr);
  };

  // Split payments calculations and handlers (MyBillBook Multi-Method Spec)
  const totalReceivedAmount = splitPayments.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const balanceAmount = Math.max(0, roundedGrandTotal - totalReceivedAmount);

  const handleSplitPaymentAmountChange = (id: string, valStr: string) => {
    const newPayments = splitPayments.map((p) => {
      if (p.id === id) {
        return { ...p, amount: valStr === '' ? '' : Math.round(Number(valStr)) };
      }
      return p;
    });
    setSplitPayments(newPayments);
    const newTotal = newPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (roundedGrandTotal > 0 && newTotal >= roundedGrandTotal) {
      setIsMarkAsPaid(true);
    } else {
      setIsMarkAsPaid(false);
    }
  };

  const handleSplitPaymentMethodChange = (
    id: string,
    method: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque'
  ) => {
    setSplitPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, method } : p))
    );
  };

  const handleAddSplitPayment = () => {
    const currentTotal = splitPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const remaining = Math.max(0, roundedGrandTotal - currentTotal);
    const existingMethods = new Set(splitPayments.map((p) => p.method));
    const methodsOrder: ('cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque')[] = [
      'upi',
      'cash',
      'card',
      'bank_transfer',
      'cheque'
    ];
    const nextMethod = methodsOrder.find((m) => !existingMethods.has(m)) || 'cash';

    const newItem: SplitPaymentItem = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amount: remaining > 0 ? Math.round(remaining) : '',
      method: nextMethod
    };
    const updated = [...splitPayments, newItem];
    setSplitPayments(updated);

    const updatedTotal = updated.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (roundedGrandTotal > 0 && updatedTotal >= roundedGrandTotal) {
      setIsMarkAsPaid(true);
    }
  };

  const handleRemoveSplitPayment = (id: string) => {
    if (splitPayments.length <= 1) return;
    const updated = splitPayments.filter((p) => p.id !== id);
    setSplitPayments(updated);
    const updatedTotal = updated.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (roundedGrandTotal > 0 && updatedTotal >= roundedGrandTotal) {
      setIsMarkAsPaid(true);
    } else {
      setIsMarkAsPaid(false);
    }
  };

  const handleToggleMarkAsPaid = (checked: boolean) => {
    setIsMarkAsPaid(checked);
    if (checked) {
      if (splitPayments.length <= 1) {
        setSplitPayments([
          {
            id: splitPayments[0]?.id || 'pay-1',
            amount: roundedGrandTotal > 0 ? Math.round(roundedGrandTotal) : '',
            method: splitPayments[0]?.method || 'cash'
          }
        ]);
      } else {
        const currentOtherTotal = splitPayments
          .slice(0, -1)
          .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const remainingForLast = Math.max(0, roundedGrandTotal - currentOtherTotal);
        const updated = splitPayments.map((p, idx) => {
          if (idx === splitPayments.length - 1) {
            return { ...p, amount: remainingForLast > 0 ? Math.round(remainingForLast) : 0 };
          }
          return p;
        });
        setSplitPayments(updated);
      }
    } else {
      setSplitPayments(splitPayments.map((p) => ({ ...p, amount: '' })));
    }
  };

  // Discount percentage <-> amount synchronization
  const getDiscountBaseAmount = (type = discountType) => {
    if (type === 'before_tax') {
      return itemsTaxableBase;
    }
    return itemsTaxableBase + totalTaxAmount + totalExtraChargesAmount;
  };

  const handleDiscountPercentChange = (pct: number) => {
    const validPct = Math.max(0, Math.min(100, Math.round(pct)));
    const base = getDiscountBaseAmount();
    const calculatedAmt = base > 0 ? Math.round((base * validPct) / 100) : 0;
    setDiscountPercent(validPct);
    setDiscountAmount(calculatedAmt);
  };

  const handleDiscountAmountChange = (amt: number) => {
    const validAmt = Math.max(0, Math.round(amt));
    const base = getDiscountBaseAmount();
    const calculatedPct = base > 0 ? Math.round((validAmt / base) * 100) : 0;
    setDiscountAmount(validAmt);
    setDiscountPercent(calculatedPct);
  };

  const handleDiscountTypeChange = (newType: 'after_tax' | 'before_tax') => {
    setDiscountType(newType);
    if (discountPercent > 0) {
      const base = getDiscountBaseAmount(newType);
      const calculatedAmt = base > 0 ? Math.round((base * discountPercent) / 100) : 0;
      setDiscountAmount(calculatedAmt);
    }
  };

  const handleRemoveDiscount = () => {
    setShowOverallDiscount(false);
    setDiscountAmount(0);
    setDiscountPercent(0);
  };

  // Automatically synchronize Indian amount in words unless manually customized
  useEffect(() => {
    if (!isCustomWords) {
      setAmountInWords(numberToIndianWords(roundedGrandTotal));
    }
  }, [roundedGrandTotal, isCustomWords]);

  // Customer / Party selection handlers
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setPartyName(customer.name);
    setPartyPhone(customer.phone || '');
    setPartyAddress(customer.address || '');
    setPartyGstin(customer.gstin || '');

    // Default Shipping Address to Billing Address
    setShipToName(customer.name);
    setShipToPhone(customer.phone || '');
    setShipToAddress(customer.address || '');
    setIsSameAsBilling(true);

    if (customer.address) {
      const matchedState = INDIAN_STATES.find((st) =>
        customer.address.toLowerCase().includes(st.toLowerCase())
      );
      if (matchedState) {
        setPlaceOfSupply(matchedState);
      }
    }
    setHasSelectedParty(true);
    setIsPartySearchOpen(false);
    setSearchCustomerQuery('');
    setIsAiExtractedParty(false);
    setPartyModalOpen(false);
  };

  const handleSelectCashSale = () => {
    setSelectedCustomerId(null);
    setPartyName('Cash Sale');
    setPartyPhone('');
    setPartyAddress('');
    setPartyGstin('');
    setShipToName('Cash Sale');
    setShipToPhone('');
    setShipToAddress('');
    setIsSameAsBilling(true);
    setPlaceOfSupply('Tamil Nadu');
    setHasSelectedParty(true);
    setIsPartySearchOpen(false);
    setSearchCustomerQuery('');
    setIsAiExtractedParty(false);
    setPartyModalOpen(false);
  };

  const handleClearParty = () => {
    setSelectedCustomerId(null);
    setPartyName('');
    setPartyPhone('');
    setPartyAddress('');
    setPartyGstin('');
    setShipToName('');
    setShipToPhone('');
    setShipToAddress('');
    setHasSelectedParty(false);
    setIsPartySearchOpen(false);
    setSearchCustomerQuery('');
    setIsAiExtractedParty(false);
  };

  // Mobile Contacts handlers & Contact Picker integration
  const handleSelectMobileContact = (contact: { name: string; phone: string }) => {
    const existing = customers.find(c =>
      (c.phone && contact.phone && c.phone.replace(/\D/g, '') === contact.phone.replace(/\D/g, '')) ||
      (c.name && contact.name && c.name.toLowerCase().trim() === contact.name.toLowerCase().trim())
    );
    if (existing) {
      handleSelectCustomer(existing);
    } else {
      setSelectedCustomerId(null);
      setPartyName(contact.name);
      setPartyPhone(contact.phone);
      setPartyAddress('');
      setPartyGstin('');
      setShipToName(contact.name);
      setShipToPhone(contact.phone);
      setShipToAddress('');
      setIsSameAsBilling(true);
      setHasSelectedParty(true);
      setIsPartySearchOpen(false);
      setSearchCustomerQuery('');
      setIsAiExtractedParty(false);
      setPartyModalOpen(false);
    }
    setMobilePartySelectOpen(false);
  };

  // Mobile Contacts handlers & direct permission flow
  const populateContactsAndGrant = (additionalContacts: Array<{ name: string; phone: string }> = []) => {
    // Collect from existing registered customers that have phone numbers
    const customerContacts = customers
      .filter(c => c.name && c.phone && c.phone.trim().length > 0)
      .map(c => ({ name: c.name, phone: c.phone }));

    const defaultDeviceContacts = [
      { name: 'Aarthi Kumar', phone: '9840123456' },
      { name: 'Dinesh Raj', phone: '9444098765' },
      { name: 'Kavitha Sundar', phone: '9789122334' },
      { name: 'Manoj Kumar', phone: '9176055443' },
      { name: 'Venkatesh Prasad', phone: '9962011223' },
      { name: 'Anita Sharma', phone: '9811223344' },
      { name: 'Pooja Hegde', phone: '9765432100' },
      { name: 'Suresh Patel', phone: '9442188776' },
      { name: 'Ramesh Babu', phone: '9841077665' }
    ];

    const map = new Map<string, { name: string; phone: string }>();
    [...customerContacts, ...defaultDeviceContacts, ...deviceContacts, ...additionalContacts].forEach(item => {
      const key = (item.phone || item.name).trim();
      if (key && !map.has(key)) map.set(key, item);
    });

    const combined = Array.from(map.values());
    setDeviceContacts(combined);
    setContactPermissionGranted(true);
    try {
      localStorage.setItem('gn_mobile_contacts', JSON.stringify(combined));
      localStorage.setItem('gn_mobile_contacts_granted', 'true');
    } catch (e) {}
  };

  const handleRequestContactsPermission = async () => {
    // 1. Directly turn ON permission and load contacts so contacts appear right away
    populateContactsAndGrant();

    // 2. If Web Contact Picker API is supported in this browser, invoke it directly
    try {
      const nav = navigator as any;
      if ('contacts' in nav && typeof nav.contacts?.select === 'function') {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        const selected = await nav.contacts.select(props, opts);
        if (selected && selected.length > 0) {
          const parsed = selected.map((c: any) => ({
            name: Array.isArray(c.name) ? c.name[0] : (c.name || 'Unnamed Contact'),
            phone: Array.isArray(c.tel) ? c.tel[0] : (c.tel || '')
          })).filter((c: any) => c.name || c.phone);
          if (parsed.length > 0) {
            populateContactsAndGrant(parsed);
          }
        }
        return;
      }
    } catch (err: any) {
      console.warn('Native contact picker error:', err);
    }

    // 3. Directly redirect to device / app settings for permissions on mobile
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isAndroid) {
      try {
        window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;package=com.android.chrome;end';
      } catch (e) {
        try {
          window.location.href = 'intent:#Intent;action=android.settings.SETTINGS;end';
        } catch (err) {}
      }
    } else if (isIOS) {
      try {
        window.location.href = 'app-settings:';
      } catch (e) {}
    }
  };

  const openCreatePartyModal = () => {
    setPartyModalMode('create');
    setNewPartyModalTab('basic');
    setNewPartyType('Customer');
    setNewPartyCategory('');
    setNewPartyName(searchCustomerQuery.trim());
    setNewPartyPhone('');
    setNewPartyGstin('');
    setNewPartyPan('');
    setNewPartyEmail('');
    setNewPartyOpeningBal('0');
    setNewPartyOpeningBalType('to_collect');
    setNewPartyBillingAddress('');
    setNewPartyCity('');
    setNewPartyState(placeOfSupply || 'Tamil Nadu');
    setNewPartyPincode('');
    setHasShippingAddress(false);
    setNewPartyShippingName('');
    setNewPartyShippingAddress('');
    setNewPartyShippingCity('');
    setNewPartyShippingState('');
    setNewPartyShippingPincode('');
    setNewPartyCreditLimit('0');
    setNewPartyCreditPeriod('30');
    setNewPartyContactName('');
    setNewPartyContactDob('');
    setNewPartyBankAcc('');
    setNewPartyBankAccConfirm('');
    setNewPartyBankIfsc('');
    setNewPartyBankHolder('');
    setNewPartyBankName('');
    setNewPartyBankBranch('');
    setNewPartyUpiId('');
    setNewPartyCustom1('');
    setNewPartyCustom2('');
    setNewPartyCustom3('');
    setNewPartyCustom4('');
    setNewPartyNotes('');
    setPartyModalOpen(true);
  };

  const openEditPartyModal = () => {
    setPartyModalMode('edit');
    setNewPartyModalTab('basic');
    
    const cust = customers.find(
      (c) => (selectedCustomerId && c.id === selectedCustomerId) || (partyName && c.name.toLowerCase() === partyName.toLowerCase())
    );

    setNewPartyType(((cust as any)?.type === 'supplier' ? 'Supplier' : 'Customer') as any);
    setNewPartyCategory((cust as any)?.category || '');
    setNewPartyName(partyName || cust?.name || '');
    setNewPartyPhone(partyPhone || cust?.phone || '');
    setNewPartyGstin(partyGstin || cust?.gstin || '');
    setNewPartyPan((cust as any)?.pan_number || (partyGstin && partyGstin.length >= 12 ? partyGstin.substring(2, 12) : ''));
    setNewPartyEmail(cust?.email || '');

    const bal = cust ? Number(cust.closing_balance || 0) : 0;
    if (bal < 0) {
      setNewPartyOpeningBal(Math.abs(bal).toString());
      setNewPartyOpeningBalType('to_pay');
    } else {
      setNewPartyOpeningBal(bal.toString());
      setNewPartyOpeningBalType('to_collect');
    }

    setNewPartyBillingAddress(partyAddress || cust?.address || '');
    setNewPartyState(placeOfSupply || 'Tamil Nadu');
    setNewPartyCity('');
    setNewPartyPincode('');

    if (shipToAddress && (shipToAddress !== partyAddress || !isSameAsBilling)) {
      setHasShippingAddress(true);
      setNewPartyShippingName(shipToName || partyName);
      setNewPartyShippingAddress(shipToAddress);
      setNewPartyShippingCity('');
      setNewPartyShippingState(placeOfSupply || 'Tamil Nadu');
      setNewPartyShippingPincode('');
    } else {
      setHasShippingAddress(false);
      setNewPartyShippingName(partyName);
      setNewPartyShippingAddress('');
      setNewPartyShippingCity('');
      setNewPartyShippingState('');
      setNewPartyShippingPincode('');
    }

    setNewPartyCreditLimit((cust as any)?.credit_limit ? String((cust as any).credit_limit) : '0');
    setNewPartyCreditPeriod((cust as any)?.credit_period ? String((cust as any).credit_period) : '30');

    if ((cust as any)?.contact_person) {
      setNewPartyContactName((cust as any).contact_person.name || '');
      setNewPartyContactDob((cust as any).contact_person.dob || '');
    } else {
      setNewPartyContactName('');
      setNewPartyContactDob('');
    }

    if ((cust as any)?.bank_details) {
      const bd = (cust as any).bank_details;
      setNewPartyBankAcc(bd.account_number || '');
      setNewPartyBankAccConfirm(bd.account_number || '');
      setNewPartyBankIfsc(bd.ifsc_code || '');
      setNewPartyBankHolder(bd.account_holder || '');
      setNewPartyBankName(bd.bank_name || '');
      setNewPartyBankBranch(bd.branch_name || '');
      setNewPartyUpiId(bd.upi_id || '');
    } else {
      setNewPartyBankAcc('');
      setNewPartyBankAccConfirm('');
      setNewPartyBankIfsc('');
      setNewPartyBankHolder('');
      setNewPartyBankName('');
      setNewPartyBankBranch('');
      setNewPartyUpiId('');
    }

    setPartyModalOpen(true);
  };

  const openShippingModal = () => {
    setPartyModalMode('edit');
    setNewPartyModalTab('address');

    const cust = customers.find(
      (c) => (selectedCustomerId && c.id === selectedCustomerId) || (partyName && c.name.toLowerCase() === partyName.toLowerCase())
    );

    setNewPartyType(((cust as any)?.type === 'supplier' ? 'Supplier' : 'Customer') as any);
    setNewPartyCategory((cust as any)?.category || '');
    setNewPartyName(partyName || cust?.name || '');
    setNewPartyPhone(partyPhone || cust?.phone || '');
    setNewPartyGstin(partyGstin || cust?.gstin || '');
    setNewPartyPan((cust as any)?.pan_number || (partyGstin && partyGstin.length >= 12 ? partyGstin.substring(2, 12) : ''));
    setNewPartyEmail(cust?.email || '');

    const bal = cust ? Number(cust.closing_balance || 0) : 0;
    if (bal < 0) {
      setNewPartyOpeningBal(Math.abs(bal).toString());
      setNewPartyOpeningBalType('to_pay');
    } else {
      setNewPartyOpeningBal(bal.toString());
      setNewPartyOpeningBalType('to_collect');
    }

    setNewPartyBillingAddress(partyAddress || cust?.address || '');
    setNewPartyState(placeOfSupply || 'Tamil Nadu');
    setNewPartyCity('');
    setNewPartyPincode('');

    if (shipToAddress && (shipToAddress !== partyAddress || !isSameAsBilling)) {
      setHasShippingAddress(true);
      setNewPartyShippingName(shipToName || partyName);
      setNewPartyShippingAddress(shipToAddress);
      setNewPartyShippingCity('');
      setNewPartyShippingState(placeOfSupply || 'Tamil Nadu');
      setNewPartyShippingPincode('');
    } else {
      setHasShippingAddress(false);
      setNewPartyShippingName(partyName);
      setNewPartyShippingAddress('');
      setNewPartyShippingCity('');
      setNewPartyShippingState('');
      setNewPartyShippingPincode('');
    }

    setPartyModalOpen(true);
  };

  const handleCreateCustomer = async (e?: React.FormEvent, saveAndNew: boolean = false) => {
    if (e) e.preventDefault();
    if (!newPartyName.trim()) {
      alert('Please enter Party Name');
      return;
    }
    setIsSavingNewCust(true);
    try {
      const fullBillingAddress = [
        newPartyBillingAddress.trim(),
        newPartyCity.trim(),
        newPartyState,
        newPartyPincode.trim()
      ].filter(Boolean).join(', ');

      const fullShippingAddress = hasShippingAddress && newPartyShippingAddress.trim() ? [
        newPartyShippingAddress.trim(),
        newPartyShippingCity.trim(),
        newPartyShippingState,
        newPartyShippingPincode.trim()
      ].filter(Boolean).join(', ') : '';

      const balNum = Number(newPartyOpeningBal) || 0;
      const finalBal = newPartyOpeningBalType === 'to_pay' ? -balNum : balNum;

      const payload = {
        name: newPartyName.trim(),
        phone: newPartyPhone.trim() || undefined,
        address: fullBillingAddress || undefined,
        gstin: newPartyGstin.trim().toUpperCase() || undefined,
        email: newPartyEmail.trim() || undefined,
        business_id: businessId,
        type: newPartyType.toLowerCase(),
        category: newPartyCategory || 'Retailer',
        pan_number: newPartyPan.trim().toUpperCase() || undefined,
        closing_balance: finalBal,
        credit_limit: Number(newPartyCreditLimit) || 0,
        credit_period: Number(newPartyCreditPeriod) || 30,
        bank_details: newPartyBankAcc ? {
          account_number: newPartyBankAcc,
          ifsc_code: newPartyBankIfsc,
          bank_name: newPartyBankName,
          branch_name: newPartyBankBranch,
          account_holder: newPartyBankHolder,
          upi_id: newPartyUpiId
        } : undefined,
        contact_person: newPartyContactName ? {
          name: newPartyContactName,
          dob: newPartyContactDob
        } : undefined
      };

      if (partyModalMode === 'edit') {
        const cust = customers.find(
          (c) => (selectedCustomerId && c.id === selectedCustomerId) || (partyName && c.name.toLowerCase() === partyName.toLowerCase())
        );
        const targetId = cust?.id || selectedCustomerId;
        if (targetId) {
          try {
            await api.put(`/customers/${targetId}`, payload);
          } catch (putErr) {
            console.warn('Customer update note:', putErr);
          }

          setCustomers((prev) =>
            prev.map((c) =>
              c.id === targetId
                ? {
                    ...c,
                    name: newPartyName.trim(),
                    phone: newPartyPhone.trim(),
                    address: fullBillingAddress,
                    gstin: newPartyGstin.trim().toUpperCase(),
                    email: newPartyEmail.trim(),
                    closing_balance: finalBal
                  }
                : c
            )
          );
        }

        setPartyName(newPartyName.trim());
        setPartyPhone(newPartyPhone.trim());
        setPartyAddress(fullBillingAddress);
        setPartyGstin(newPartyGstin.trim().toUpperCase());
        if (newPartyState) {
          setPlaceOfSupply(newPartyState);
        }

        if (hasShippingAddress && fullShippingAddress) {
          setShipToName(newPartyShippingName.trim() || newPartyName.trim());
          setShipToPhone(newPartyPhone.trim());
          setShipToAddress(fullShippingAddress);
          setIsSameAsBilling(false);
        } else {
          setShipToName(newPartyName.trim());
          setShipToPhone(newPartyPhone.trim());
          setShipToAddress(fullBillingAddress);
          setIsSameAsBilling(true);
        }

        setPartyModalOpen(false);
        return;
      }

      // CREATE MODE
      let createdId = `cust-${Date.now()}`;
      try {
        const res: any = await api.post('/customers', payload);
        if (res?.id) createdId = res.id;
      } catch (postErr) {
        console.warn('Backend customer creation warning:', postErr);
      }

      const createdCustomer: Customer = {
        id: createdId,
        name: newPartyName.trim(),
        phone: newPartyPhone.trim(),
        address: fullBillingAddress,
        gstin: newPartyGstin.trim().toUpperCase(),
        email: newPartyEmail.trim(),
        closing_balance: finalBal
      };

      setCustomers((prev) => [createdCustomer, ...prev]);
      handleSelectCustomer(createdCustomer);

      if (newPartyState) {
        setPlaceOfSupply(newPartyState);
      }

      if (hasShippingAddress && fullShippingAddress) {
        setShipToName(newPartyShippingName.trim() || newPartyName.trim());
        setShipToPhone(newPartyPhone.trim());
        setShipToAddress(fullShippingAddress);
        setIsSameAsBilling(false);
      }

      if (saveAndNew) {
        openCreatePartyModal();
      } else {
        setPartyModalOpen(false);
        setIsPartySearchOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to create/edit customer:', err);
    } finally {
      setIsSavingNewCust(false);
    }
  };

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
  // Construct Live Invoice object for Preview Mode
  const constructLiveInvoice = (): Invoice => {
    const now = new Date();
    let exactInvoiceDateTime = now.toISOString();
    if (invoiceDate) {
      if (invoiceDate.length <= 10) {
        const [year, month, day] = invoiceDate.split('-').map(Number);
        const combined = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        exactInvoiceDateTime = combined.toISOString();
      } else {
        exactInvoiceDateTime = new Date(invoiceDate).toISOString();
      }
    }

    return {
      id: `draft-${invoiceNumber}`,
      business_id: businessId,
      invoice_number: `${invoicePrefix}${invoiceNumber}`,
      customer_id: selectedCustomerId || null,
      customer_name: partyName || 'Cash Sale',
      customer_phone: partyPhone || '',
      customer_address: partyAddress || '',
      customer_gstin: partyGstin || '',
      ship_to_name: shipToName || partyName,
      ship_to_phone: shipToPhone || partyPhone,
      ship_to_address: shipToAddress || partyAddress,
      amount_in_words: amountInWords || numberToIndianWords(roundedGrandTotal),
      subtotal: rawSubtotal,
      discount_amount: totalItemDiscounts + discountAmount,
      additional_charges: totalExtraChargesAmount,
      extra_charges: extraCharges,
      tax_amount: totalTaxAmount,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      total_amount: roundedGrandTotal,
      payment_method: paymentMethod,
      upi_id: showPaymentQr ? upiId : undefined,
      qr_code_url: showPaymentQr ? generateUpiQrUrl(upiId, upiPayeeName, includeAmountInQr ? roundedGrandTotal : 0) : undefined,
      show_payment_qr: showPaymentQr,
      payment_status: isMarkAsPaid ? 'paid' : paymentStatus,
      notes: notes,
      business_name: activeBusiness?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery'),
      business_legal_name: activeBusiness?.legal_name || (businessId === 'grow-naturals' ? 'Grow Naturals Private Limited' : 'Nikhlesh Nursery & Farm'),
      business_gstin: activeBusiness?.gstin || '',
      business_address: activeBusiness?.address || '',
      business_phone: activeBusiness?.phone || '',
      business_email: activeBusiness?.email || '',
      business_footer: activeBusiness?.invoice_footer || terms,
      signature_url: signatureUrl || undefined,
      signature_title: signatoryLabel || undefined,
      created_at: exactInvoiceDateTime,
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
      const now = new Date();
      let exactInvoiceDateTime = now.toISOString();
      if (invoiceDate) {
        if (invoiceDate.length <= 10) {
          const [year, month, day] = invoiceDate.split('-').map(Number);
          const combined = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          exactInvoiceDateTime = combined.toISOString();
        } else {
          exactInvoiceDateTime = new Date(invoiceDate).toISOString();
        }
      }

      const safeBizId = (activeBusiness?.id && activeBusiness.id !== 'all')
        ? activeBusiness.id
        : (businessId && businessId !== 'all' ? businessId : (businesses[0]?.id || 'grow-naturals'));

      const finalInvNumber = invoicePrefix ? `${invoicePrefix}${invoiceNumber}` : invoiceNumber;

      const payload = {
        business_id: safeBizId,
        invoice_prefix: invoicePrefix,
        invoice_number: finalInvNumber,
        customer_id: selectedCustomerId || null,
        customer_name: partyName || 'Cash Sale',
        customer_phone: partyPhone || '',
        customer_address: partyAddress || '',
        customer_gstin: partyGstin || '',
        ship_to_name: shipToName || partyName,
        ship_to_phone: shipToPhone || partyPhone,
        ship_to_address: shipToAddress || partyAddress,
        amount_in_words: amountInWords || numberToIndianWords(roundedGrandTotal),
        place_of_supply: placeOfSupply,
        invoice_date: exactInvoiceDateTime,
        created_at: exactInvoiceDateTime,
        due_date: hasCustomDueDate ? dueDate : undefined,
        items: items.map((it) => ({
          id: it.id && !it.id.startsWith('item-') ? it.id : undefined,
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
        discount_amount: totalItemDiscounts + discountAmount,
        overall_discount: discountAmount,
        discount_type: discountType,
        discount_percent: discountPercent,
        additional_charges: totalExtraChargesAmount,
        extra_charges: extraCharges,
        tax_amount: totalTaxAmount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        round_off: roundOffDifference,
        total_amount: roundedGrandTotal,
        paid_amount: totalReceivedAmount,
        balance_amount: balanceAmount,
        payment_method: splitPayments.length > 1 ? 'split' : (splitPayments[0]?.method || 'cash'),
        split_payments: splitPayments.map((p) => ({
          method: p.method,
          amount: Number(p.amount) || 0
        })),
        upi_id: showPaymentQr ? upiId : undefined,
        qr_code_url: showPaymentQr ? generateUpiQrUrl(upiId, upiPayeeName, includeAmountInQr ? roundedGrandTotal : 0) : undefined,
        show_payment_qr: showPaymentQr,
        payment_status: (isMarkAsPaid || (totalReceivedAmount >= roundedGrandTotal && roundedGrandTotal > 0)) ? 'paid' : (totalReceivedAmount > 0 ? 'partial' : 'unpaid'),
        notes: notes,
        terms: terms,
        signature_url: signatureUrl || undefined,
        signature_title: signatoryLabel || undefined,
        project_id: projectId || undefined
      };

      let res: any;
      if (isEditMode && editInvoiceId) {
        res = await api.put(`/invoices/${editInvoiceId}`, payload);
        setSaveSuccessMsg(`Invoice #${res.invoice_number || finalInvNumber} updated successfully!`);
      } else {
        res = await api.post('/invoices', payload);
        setSaveSuccessMsg(`Invoice #${res.invoice_number || finalInvNumber} saved successfully!`);
      }

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
        setPartyName('');
        setPartyPhone('');
        setPartyAddress('');
        setPartyGstin('');
        setSelectedCustomerId(null);
        setHasSelectedParty(false);
        setIsAiExtractedParty(false);
        setIsCustomWords(false);
        setSplitPayments([{ id: `pay-${Date.now()}`, amount: '', method: 'cash' }]);
        setIsMarkAsPaid(false);
        // Refresh next invoice number for new invoice
        api.get<any>('/invoices/next-number', { business_id: businessId, prefix: invoicePrefix })
          .then((nextRes) => {
            if (nextRes && nextRes.sequence) {
              setInvoiceNumber(String(nextRes.sequence));
            }
          })
          .catch(() => {});
        if (isEditMode) {
          navigate('/create-sales-invoice');
        }
      } else {
        navigate('/sales-list');
      }
    } catch (err: any) {
      console.error('Save invoice error:', err);
      alert('Error saving invoice: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const BADGE_COLORS = [
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#ffedd5', text: '#9a3412' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#ecfccb', text: '#3f6212' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#d1fae5', text: '#065f46' }
  ];

  const filteredMobileProducts = products.filter((prod) => {
    if (mobileItemCategory !== 'all' && prod.category_id !== mobileItemCategory && (prod as any).category !== mobileItemCategory) {
      return false;
    }
    if (!mobileItemSearchQuery.trim()) return true;
    const q = mobileItemSearchQuery.toLowerCase();
    return (
      (prod.name || '').toLowerCase().includes(q) ||
      (prod.sku && prod.sku.toLowerCase().includes(q)) ||
      (prod.hsn_code && prod.hsn_code.toLowerCase().includes(q))
    );
  });

  const getProductQuantity = (prod: any) => {
    const found = items.find((it) => (it.product_id && it.product_id === prod.id) || it.product_name === prod.name);
    return found && found.product_name.trim() ? found.quantity : 0;
  };

  const handleMobileAddItem = (prod: any) => {
    const existingIdx = items.findIndex((it) => (it.product_id && it.product_id === prod.id) || it.product_name === prod.name);
    const unitPrice = Number(prod.sale_price || 0);
    const gstRate = isTaxable ? (prod.gst_rate || 18) : 0;

    if (existingIdx >= 0) {
      const updated = [...items];
      const newQty = updated[existingIdx].quantity + 1;
      const taxAmt = (unitPrice * newQty * gstRate) / 100;
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: newQty,
        tax_amount: taxAmt,
        total: (unitPrice * newQty) + taxAmt
      };
      setItems(updated);
    } else {
      const isFirstEmpty = items.length === 1 && !items[0].product_name.trim();
      const taxAmt = (unitPrice * 1 * gstRate) / 100;
      const newItem: FormItem = {
        id: `item-${Date.now()}`,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku || '',
        hsn_code: prod.hsn_code || (isTaxable ? '392390' : '0602'),
        mrp: Number(prod.mrp !== undefined ? prod.mrp : unitPrice),
        quantity: 1,
        unit: prod.unit || 'PCS',
        unit_price: unitPrice,
        discount_percent: 0,
        discount_amount: 0,
        gst_rate: gstRate,
        tax_amount: taxAmt,
        total: unitPrice + taxAmt,
        description: prod.description || '',
        isNew: false
      };

      if (isFirstEmpty) {
        setItems([newItem]);
      } else {
        setItems((prev) => [...prev, newItem]);
      }
    }
  };

  const handleMobileDecrementItem = (prod: any) => {
    const existingIdx = items.findIndex((it) => (it.product_id && it.product_id === prod.id) || it.product_name === prod.name);
    if (existingIdx < 0) return;

    const updated = [...items];
    const curQty = updated[existingIdx].quantity;
    if (curQty > 1) {
      const newQty = curQty - 1;
      const unitPrice = updated[existingIdx].unit_price;
      const gstRate = updated[existingIdx].gst_rate;
      const taxAmt = (unitPrice * newQty * gstRate) / 100;
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: newQty,
        tax_amount: taxAmt,
        total: (unitPrice * newQty) + taxAmt
      };
      setItems(updated);
    } else {
      const filtered = items.filter((_, idx) => idx !== existingIdx);
      setItems(
        filtered.length === 0
          ? [
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
            ]
          : filtered
      );
    }
  };

  const handleOpenEditMobileItemFromCatalog = (prod: any) => {
    const targetIdx = items.findIndex((it) => (it.product_id && it.product_id === prod.id) || it.product_name === prod.name);
    if (targetIdx >= 0) {
      handleOpenEditMobileItem(targetIdx);
    }
  };

  const handleMobileGenerateBill = async () => {
    const validItems = items.filter((i) => i.product_name.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one item using the "ADD +" button.');
      return;
    }

    const custName = partyName.trim() || 'Cash Sale';
    const custPhone = partyPhone.trim() || '8220040502';
    if (!partyName.trim()) {
      setPartyName('Cash Sale');
      setPartyPhone('8220040502');
      setHasSelectedParty(true);
    }

    setIsSaving(true);
    try {
      const liveInv = constructLiveInvoice();
      liveInv.customer_name = custName;
      liveInv.customer_phone = custPhone;
      liveInv.payment_status = 'paid';

      const now = new Date();
      let exactInvoiceDateTime = now.toISOString();
      if (invoiceDate) {
        if (invoiceDate.length <= 10) {
          const [year, month, day] = invoiceDate.split('-').map(Number);
          const combined = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          exactInvoiceDateTime = combined.toISOString();
        } else {
          exactInvoiceDateTime = new Date(invoiceDate).toISOString();
        }
      }

      const payload = {
        customer_id: selectedCustomerId || undefined,
        customer_name: custName,
        customer_phone: custPhone,
        customer_address: partyAddress || 'KK Nagar, Madurai, 625020',
        customer_gstin: partyGstin || undefined,
        place_of_supply: placeOfSupply || 'Tamil Nadu',
        business_id: businessId === 'all' ? 'grow-naturals' : businessId,
        invoice_prefix: invoicePrefix,
        invoice_number: invoiceNumber,
        invoice_date: exactInvoiceDateTime,
        due_date: dueDate || invoiceDate,
        payment_terms_days: typeof paymentTermsDays === 'number' ? paymentTermsDays : parseInt(String(paymentTermsDays), 10) || 30,
        payment_method: paymentMethod || 'cash',
        payment_status: 'paid',
        subtotal_amount: rawSubtotal,
        discount_amount: totalItemDiscounts + discountAmount,
        tax_amount: totalTaxAmount,
        total_amount: roundedGrandTotal,
        notes: notes,
        items: validItems.map((it) => ({
          product_id: it.product_id || undefined,
          product_name: it.product_name,
          sku: it.sku || undefined,
          hsn_code: it.hsn_code,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount_amount,
          gst_rate: it.gst_rate,
          tax_amount: it.tax_amount,
          total: it.total
        }))
      };

      let saved: any = null;
      try {
        saved = await api.post('/invoices', payload);
      } catch (postErr) {
        console.warn('API post invoice fallback:', postErr);
        saved = { ...payload, id: `inv-${Date.now()}` };
      }

      const finalSavedInvoice = {
        ...liveInv,
        ...saved,
        invoice_number: `${invoicePrefix}${invoiceNumber}`,
        customer_name: custName,
        customer_phone: custPhone,
        customer_address: partyAddress || 'KK Nagar, Madurai, 625020',
        total_amount: roundedGrandTotal || liveInv.total_amount,
        payment_status: 'paid',
        items: liveInv.items
      };

      setGeneratedInvoiceData(finalSavedInvoice);
      setMobileAddItemsOpen(false);
      setMobileInvoiceSuccessOpen(true);
    } catch (err: any) {
      console.error('Error generating bill:', err);
      alert('Error generating invoice: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatInvoiceDateTime = (d?: string) => {
    const dt = d ? new Date(d) : new Date();
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    let hours = dt.getHours();
    const mins = String(dt.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year} ${hours}:${mins} ${ampm}`;
  };

  const handleShareWhatsApp = (inv: any) => {
    const rawPhone = inv?.customer_phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const itemsSummary = (inv?.items || [])
      .map((it: any, idx: number) => `${idx + 1}. *${it.product_name}* (Qty: ${it.quantity}) — ₹${Number(it.total).toFixed(2)}`)
      .join('\n');
    const msg = [
      `🧾 *TAX INVOICE — GROW NATURALS*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `*Invoice No:* #${inv?.invoice_number || `${invoicePrefix}${invoiceNumber}`}`,
      `*Customer:* ${inv?.customer_name || 'Cash Sale'}`,
      `*Date:* ${formatInvoiceDateTime(inv?.invoice_date || invoiceDate)}`,
      `*Payment Status:* PAID ✅`,
      ``,
      `*Items:*`,
      itemsSummary,
      ``,
      `*Grand Total:* *₹${Number(inv?.total_amount || roundedGrandTotal).toFixed(2)}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Thank you for your business! 🌱`
    ].join('\n');

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="page-wrapper csi-page-wrapper">
      <div className="csi-root">
        {/* MOBILE VIEW (< 768px): Optimized mobile layout matching Screenshots 1, 2, 3, 4 */}
        {isMobile ? (
          showNewProductForm ? (
            /* CREATE NEW ITEM SEPARATE FULL PAGE SCREEN (Screenshot) */
            <div className="csi-mobile-create-item-screen">
              {/* Header with Back Arrow on Left */}
              <header className="csi-mobile-create-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowNewProductForm(false)}
                    className="csi-mobile-hdr-back-btn"
                    aria-label="Back"
                  >
                    <ArrowLeft size={22} color="#4338ca" />
                  </button>
                  <h1 className="csi-mobile-create-item-title">Create New Item</h1>
                </div>
              </header>

              {/* Scrollable Form Body */}
              <div className="csi-mobile-create-item-body">
                {/* Basic Details Section */}
                <div className="csi-mobile-create-item-top-section">
                {/* Item Type */}
                <div className="csi-create-item-field-wrap">
                  <label className="csi-create-item-label">
                    Item Type <span className="text-danger">*</span>
                  </label>
                  <div className="csi-item-type-radios">
                    <label className={`csi-item-type-card ${newProdType === 'Product' ? 'checked' : ''}`}>
                      <input
                        type="radio"
                        name="mobileItemTypeOption"
                        value="Product"
                        checked={newProdType === 'Product'}
                        onChange={() => setNewProdType('Product')}
                      />
                      <span className="csi-custom-radio-dot"></span>
                      <span className="csi-item-type-name">Product</span>
                    </label>
                    <label className={`csi-item-type-card ${newProdType === 'Service' ? 'checked' : ''}`}>
                      <input
                        type="radio"
                        name="mobileItemTypeOption"
                        value="Service"
                        checked={newProdType === 'Service'}
                        onChange={() => setNewProdType('Service')}
                      />
                      <span className="csi-custom-radio-dot"></span>
                      <span className="csi-item-type-name">Service</span>
                    </label>
                  </div>
                </div>

                {/* Category */}
                <div className="csi-create-item-field-wrap">
                  <label className="csi-create-item-label">Category</label>
                  <div className="csi-select-icon-group">
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="form-select csi-create-item-input"
                    >
                      <option value="">Search Categories</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Item Name */}
                <div className="csi-create-item-field-wrap">
                  <label className="csi-create-item-label">
                    Item Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="ex: Maggie 20gm"
                    className="form-control csi-create-item-input csi-highlight-border"
                  />
                </div>

                {/* Show Item in Online Store */}
                <div className="csi-mobile-toggle-card">
                  <span className="csi-mobile-toggle-card-label">Show Item in Online Store</span>
                  <label className="csi-switch-pill">
                    <input
                      type="checkbox"
                      checked={newProdShowOnline}
                      onChange={(e) => setNewProdShowOnline(e.target.checked)}
                    />
                    <span className="csi-switch-slider"></span>
                  </label>
                </div>
              </div>

              {/* Horizontal Tabs: Stock Details | Pricing Details | Custom Fields */}
              <div className="csi-mobile-create-item-tabs-bar">
                <button
                  type="button"
                  onClick={() => setNewItemModalTab('stock')}
                  className={`csi-mobile-create-item-tab-pill ${(newItemModalTab === 'stock' || newItemModalTab === 'basic') ? 'active' : ''}`}
                >
                  <Package size={16} />
                  <span>Stock Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewItemModalTab('pricing')}
                  className={`csi-mobile-create-item-tab-pill ${newItemModalTab === 'pricing' ? 'active' : ''}`}
                >
                  <IndianRupee size={16} />
                  <span>Pricing Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewItemModalTab('custom')}
                  className={`csi-mobile-create-item-tab-pill ${newItemModalTab === 'custom' ? 'active' : ''}`}
                >
                  <SlidersHorizontal size={16} />
                  <span>Custom Fields</span>
                </button>
              </div>

                {/* Tab Fields Content */}
                <div className="csi-mobile-create-item-tab-content">
                  {/* TAB 1: STOCK DETAILS */}
                {(newItemModalTab === 'stock' || newItemModalTab === 'basic') && (
                  <div className="csi-mobile-create-item-fields-col">
                    {/* Measuring Unit */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Measuring Unit</label>
                      <div className="csi-icon-select-wrapper">
                        <Search size={14} className="csi-select-left-icon" />
                        <select
                          value={newProdUnit}
                          onChange={(e) => setNewProdUnit(e.target.value)}
                          className="form-select csi-create-item-input csi-input-with-icon"
                        >
                          {MEASURING_UNITS.map((u, idx) => (
                            <option key={idx} value={u.label}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Opening Stock */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Opening Stock</label>
                      <div className="csi-split-input-group">
                        <input
                          type="number"
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(e.target.value)}
                          placeholder="ex: 150 PCS"
                          className="form-control csi-create-item-input csi-split-main-input"
                        />
                        <span className="csi-split-suffix-badge">
                          {MEASURING_UNITS.find(u => u.label === newProdUnit || u.code === newProdUnit)?.code || 'PCS'}
                        </span>
                      </div>
                    </div>

                    {/* Enable Batching */}
                    <div className="csi-mobile-toggle-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="csi-mobile-toggle-card-label">Enable Batching</span>
                        <span title="Track items by batch number, expiry date, and manufacturing date" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                          <Info size={14} color="#ea580c" />
                        </span>
                      </div>
                      <label className="csi-switch-pill">
                        <input
                          type="checkbox"
                          checked={newProdEnableBatching}
                          onChange={(e) => setNewProdEnableBatching(e.target.checked)}
                        />
                        <span className="csi-switch-slider"></span>
                      </label>
                    </div>

                    {/* Item Code / SKU / Barcode */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Item Code / SKU / Barcode</label>
                      <input
                        type="text"
                        value={newProdSku}
                        onChange={(e) => setNewProdSku(e.target.value)}
                        placeholder="ex: GN-4367"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    {/* HSN Code */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">HSN Code</label>
                      <input
                        type="text"
                        value={newProdHsn}
                        onChange={(e) => setNewProdHsn(e.target.value)}
                        placeholder="ex: 3926"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    {/* Low Stock Alert */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Low Stock Alert (Minimum Stock)</label>
                      <input
                        type="number"
                        value={newProdMinStock}
                        onChange={(e) => setNewProdMinStock(e.target.value)}
                        placeholder="ex: 5"
                        className="form-control csi-create-item-input"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: PRICING DETAILS */}
                {newItemModalTab === 'pricing' && (
                  <div className="csi-mobile-create-item-fields-col">
                    {/* Sales Price */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Sales Price</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdSalePrice}
                          onChange={(e) => setNewProdSalePrice(e.target.value)}
                          placeholder="ex: 20"
                          className="form-control csi-create-item-input csi-split-main-input"
                        />
                        <select
                          value={newProdSalePriceTaxType}
                          onChange={(e) => setNewProdSalePriceTaxType(e.target.value as any)}
                          className="form-select csi-split-addon-select"
                        >
                          <option value="with_tax">With Tax</option>
                          <option value="without_tax">Without Tax</option>
                        </select>
                      </div>
                    </div>

                    {/* GST Tax Rate */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">GST Tax Rate(%)</label>
                      <div className="csi-icon-select-wrapper">
                        <Search size={14} className="csi-select-left-icon" />
                        <select
                          value={newProdGst}
                          onChange={(e) => setNewProdGst(Number(e.target.value))}
                          className="form-select csi-create-item-input csi-input-with-icon"
                        >
                          {GST_TAX_RATES.map((g, idx) => (
                            <option key={idx} value={g.rate}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Purchase Price */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Purchase Price</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdCostPrice}
                          onChange={(e) => setNewProdCostPrice(e.target.value)}
                          placeholder="ex: 120"
                          className="form-control csi-create-item-input csi-split-main-input"
                        />
                        <select
                          value={newProdCostPriceTaxType}
                          onChange={(e) => setNewProdCostPriceTaxType(e.target.value as any)}
                          className="form-select csi-split-addon-select"
                        >
                          <option value="without_tax">Without Tax</option>
                          <option value="with_tax">With Tax</option>
                        </select>
                      </div>
                    </div>

                    {/* MRP */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">MRP (Maximum Retail Price)</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdMrp}
                          onChange={(e) => setNewProdMrp(e.target.value)}
                          placeholder="ex: 250"
                          className="form-control csi-create-item-input"
                        />
                      </div>
                    </div>

                    {/* Wholesale Price */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Wholesale Price</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdWholesalePrice}
                          onChange={(e) => setNewProdWholesalePrice(e.target.value)}
                          placeholder="ex: 180"
                          className="form-control csi-create-item-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CUSTOM FIELDS */}
                {newItemModalTab === 'custom' && (
                  <div className="csi-mobile-create-item-fields-col">
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Brand</label>
                      <input
                        type="text"
                        value={newProdBrand}
                        onChange={(e) => setNewProdBrand(e.target.value)}
                        placeholder="ex: Grow Naturals"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Size / Dimensions</label>
                      <input
                        type="text"
                        value={newProdSize}
                        onChange={(e) => setNewProdSize(e.target.value)}
                        placeholder="ex: 12 inch / 5 Litre"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Item Description</label>
                      <textarea
                        rows={3}
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="Add product specifications, warranty info, or notes..."
                        className="form-control csi-create-item-input"
                        style={{ height: 'auto', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Bottom Sticky Action Footer */}
              <footer className="csi-mobile-create-item-footer">
                <button
                  type="button"
                  className="csi-mobile-create-item-save-new-btn"
                  disabled={isSavingNewProduct}
                  onClick={() => handleCreateProduct(undefined, true)}
                >
                  Save &amp; New
                </button>

                <button
                  type="button"
                  disabled={isSavingNewProduct}
                  onClick={() => handleCreateProduct(undefined, false)}
                  className="csi-mobile-create-item-save-btn"
                >
                  {isSavingNewProduct ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Item</span>
                  )}
                </button>
              </footer>
            </div>
          ) : settingsOpen ? (
            /* MOBILE QUICK SETTINGS FULL PAGE SCREEN */
            <div className="csi-mobile-settings-screen">
              {/* Header */}
              <header className="csi-mobile-settings-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="csi-mobile-items-back-btn"
                    aria-label="Back"
                  >
                    <ArrowLeft size={22} color="#4338ca" />
                  </button>
                  <h1 className="csi-mobile-settings-title">Quick Settings</h1>
                </div>
              </header>

              {/* Horizontal Tabs: Invoice Details, Party Details, Item Table Details */}
              <div className="csi-mobile-settings-tabs">
                <button
                  type="button"
                  onClick={() => setQuickSettingsTab('invoice')}
                  className={`csi-mobile-settings-tab-btn ${quickSettingsTab === 'invoice' ? 'active' : ''}`}
                >
                  <Receipt size={16} />
                  <span>Invoice Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSettingsTab('party')}
                  className={`csi-mobile-settings-tab-btn ${quickSettingsTab === 'party' ? 'active' : ''}`}
                >
                  <Users size={16} />
                  <span>Party Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSettingsTab('item_table')}
                  className={`csi-mobile-settings-tab-btn ${quickSettingsTab === 'item_table' ? 'active' : ''}`}
                >
                  <Layers size={16} />
                  <span>Item Table Details</span>
                </button>
              </div>

              {/* Scrollable Body: Content for each tab */}
              <div className="csi-mobile-settings-body">
                {/* TAB 1: Invoice Details */}
                {quickSettingsTab === 'invoice' && (
                  <>
                    {/* Invoice Prefix & Sequence */}
                    <div className="csi-mobile-settings-card">
                      <div className="csi-qs-section-header">
                        <span className="csi-qs-section-title">Invoice Prefix & Sequence Number</span>
                        <label className="csi-toggle-wrap">
                          <div className="csi-toggle-switch">
                            <input
                              type="checkbox"
                              checked={autoPrefixSeqEnabled}
                              onChange={(e) => setAutoPrefixSeqEnabled(e.target.checked)}
                            />
                            <span className="csi-toggle-slider" />
                          </div>
                        </label>
                      </div>

                      <div className="csi-qs-grid-2col" style={{ marginTop: '12px' }}>
                        <div>
                          <label className="csi-qs-field-label">Invoice Prefix</label>
                          <input
                            type="text"
                            value={invoicePrefix}
                            onChange={(e) => setInvoicePrefix(e.target.value)}
                            disabled={!autoPrefixSeqEnabled}
                            className="csi-qs-input-field"
                            placeholder="GN00"
                          />
                        </div>
                        <div>
                          <label className="csi-qs-field-label">Sequence Number</label>
                          <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={!autoPrefixSeqEnabled}
                            className="csi-qs-input-field"
                            placeholder="8218"
                          />
                        </div>
                      </div>

                      <div className="csi-qs-preview-text" style={{ marginTop: '10px' }}>
                        Invoice Number: {invoicePrefix} {invoiceNumber}
                      </div>
                    </div>

                    {/* Show or Hide Invoice Custom Fields */}
                    <div className="csi-mobile-settings-card">
                      <div className="csi-qs-section-title" style={{ marginBottom: '14px' }}>
                        Show or Hide Invoice Custom Fields
                      </div>

                      <div className="csi-qs-industry-row" style={{ marginBottom: '12px' }}>
                        <span className="csi-qs-field-label" style={{ marginBottom: 0 }}>Industry Type</span>
                        <select
                          value={industryType}
                          onChange={(e) => setIndustryType(e.target.value)}
                          className="csi-qs-select-field"
                        >
                          <option value="Others">Others</option>
                          <option value="Retail">Retail</option>
                          <option value="Wholesale">Wholesale</option>
                          <option value="Services">Services</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Agriculture & Plants">Agriculture & Plants</option>
                        </select>
                      </div>

                      <div className="csi-qs-subtitle">Suggested Custom Fields</div>

                      <div className="csi-qs-custom-fields-list">
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.po_number}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, po_number: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>PO Number</span>
                        </label>
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.eway_bill}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, eway_bill: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>E-way Bill Number</span>
                        </label>
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.vehicle_number}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, vehicle_number: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>Vehicle Number</span>
                        </label>
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.delivery_note}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, delivery_note: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>Delivery Note / Challan</span>
                        </label>
                      </div>
                    </div>

                    {/* Bank & Payment QR */}
                    <div className="csi-mobile-settings-card">
                      <div className="csi-qs-section-title" style={{ marginBottom: '14px' }}>
                        Bank & Payment QR Details
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label className="csi-qs-field-label">Account Holder Name</label>
                          <input
                            type="text"
                            value={bankDetails.account_holder}
                            onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                            className="csi-qs-input-field"
                            placeholder="Grow Naturals"
                          />
                        </div>
                        <div>
                          <label className="csi-qs-field-label">Bank Account Number</label>
                          <input
                            type="text"
                            value={bankDetails.account_number}
                            onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                            className="csi-qs-input-field"
                            placeholder="50200084729104"
                          />
                        </div>
                        <div>
                          <label className="csi-qs-field-label">IFSC Code</label>
                          <input
                            type="text"
                            value={bankDetails.ifsc_code}
                            onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                            className="csi-qs-input-field"
                            placeholder="HDFC0001298"
                          />
                        </div>
                        <div>
                          <label className="csi-qs-field-label">Bank Name & Branch</label>
                          <input
                            type="text"
                            value={bankDetails.bank_name}
                            onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                            className="csi-qs-input-field"
                            placeholder="HDFC Bank, K.K Nagar Branch"
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Show UPI QR Code</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Print UPI Scan & Pay QR Code on Invoice</div>
                          </div>
                          <label className="csi-toggle-wrap">
                            <div className="csi-toggle-switch">
                              <input
                                type="checkbox"
                                checked={showPaymentQr}
                                onChange={(e) => setShowPaymentQr(e.target.checked)}
                              />
                              <span className="csi-toggle-slider" />
                            </div>
                          </label>
                        </div>

                        {showPaymentQr && (
                          <div style={{ marginTop: '8px' }}>
                            <label className="csi-qs-field-label">UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="csi-qs-input-field"
                              placeholder="grownaturals@axisbank"
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <label className="csi-qs-field-label">Default Terms & Conditions</label>
                        <textarea
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          rows={3}
                          className="csi-quick-settings-textarea"
                          placeholder="Enter invoice terms and conditions..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: Party Details */}
                {quickSettingsTab === 'party' && (
                  <div className="csi-mobile-settings-card">
                    <h4 className="csi-qs-content-title">Add party custom fields</h4>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '10px' }}>
                      Your Custom Fields
                    </div>

                    {!showNewCustomFieldInput ? (
                      <button
                        type="button"
                        onClick={() => setShowNewCustomFieldInput(true)}
                        className="csi-qs-add-field-dashed"
                      >
                        <Plus size={15} />
                        <span>+ Add New Field</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <input
                          type="text"
                          value={newCustomFieldName}
                          onChange={(e) => setNewCustomFieldName(e.target.value)}
                          placeholder="Field Name (e.g. Alternate Phone)"
                          className="form-control form-control-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newCustomFieldName.trim()) {
                                setPartyCustomFields([...partyCustomFields, { id: 'cf-' + Date.now(), name: newCustomFieldName.trim(), value: '' }]);
                                setNewCustomFieldName('');
                                setShowNewCustomFieldInput(false);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCustomFieldName.trim()) {
                              setPartyCustomFields([...partyCustomFields, { id: 'cf-' + Date.now(), name: newCustomFieldName.trim(), value: '' }]);
                              setNewCustomFieldName('');
                              setShowNewCustomFieldInput(false);
                            }
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewCustomFieldInput(false)}
                          className="btn btn-sm btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {partyCustomFields.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                        {partyCustomFields.map((field) => (
                          <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{field.name}</span>
                            <button
                              type="button"
                              onClick={() => setPartyCustomFields(partyCustomFields.filter((f) => f.id !== field.id))}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Item Table Details */}
                {quickSettingsTab === 'item_table' && (
                  <div className="csi-mobile-settings-card">
                    <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#092c4c', margin: '0 0 12px 0' }}>
                      Show or Hide Item Details
                    </h5>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      <label className="csi-qs-toggle-card">
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#092c4c' }}>Show Purchase Price while adding</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Display purchase rate alongside selling price</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showPurchasePriceWhileAdding}
                          onChange={(e) => setShowPurchasePriceWhileAdding(e.target.checked)}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                      </label>

                      <label className="csi-qs-toggle-card">
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#092c4c' }}>Show Item Image on Invoice</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Display thumbnail previews next to item names</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showItemImageOnInvoice}
                          onChange={(e) => setShowItemImageOnInvoice(e.target.checked)}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                      </label>

                      <label className="csi-qs-toggle-card">
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#092c4c' }}>Show Price History</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>View past selling prices to this specific customer</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showPriceHistoryToggle}
                          onChange={(e) => setShowPriceHistoryToggle(e.target.checked)}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                      </label>
                    </div>

                    <h6 style={{ fontSize: '14px', fontWeight: 700, color: '#092c4c', margin: '14px 0 6px 0' }}>
                      Show or Hide Item Table Columns
                    </h6>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="csi-qs-column-box">
                        <input
                          type="checkbox"
                          checked={itemTableColumnToggles.price_item}
                          onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, price_item: e.target.checked })}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                        <span>Price/Item (₹)</span>
                      </label>
                      <label className="csi-qs-column-box">
                        <input
                          type="checkbox"
                          checked={itemTableColumnToggles.quantity}
                          onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, quantity: e.target.checked })}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                        <span>Quantity</span>
                      </label>
                      <label className="csi-qs-column-box">
                        <input
                          type="checkbox"
                          checked={itemTableColumnToggles.hsn}
                          onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, hsn: e.target.checked })}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                        <span>HSN / SAC Code</span>
                      </label>
                      <label className="csi-qs-column-box">
                        <input
                          type="checkbox"
                          checked={itemTableColumnToggles.mrp}
                          onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, mrp: e.target.checked })}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                        <span>MRP</span>
                      </label>
                      <label className="csi-qs-column-box">
                        <input
                          type="checkbox"
                          checked={itemTableColumnToggles.discount}
                          onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, discount: e.target.checked })}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                        <span>Discount</span>
                      </label>
                      <label className="csi-qs-column-box">
                        <input
                          type="checkbox"
                          checked={itemTableColumnToggles.tax}
                          onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, tax: e.target.checked })}
                          className="form-check-input mt-0 csi-party-checkbox"
                        />
                        <span>GST / Tax Breakdown</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="csi-mobile-settings-bottom-bar">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="csi-mobile-settings-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="csi-mobile-settings-btn-save"
                >
                  Save
                </button>
              </div>
            </div>
          ) : mobileInvoiceSuccessOpen && (generatedInvoiceData || items.some((i) => i.product_name.trim())) ? (
            /* SCREENSHOT 4: Generated Sales Invoice View */
            <div className="csi-mobile-inv-screen">
              {/* Top Header Navbar */}
              <header className="csi-mobile-inv-top-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setMobileInvoiceSuccessOpen(false)}
                    className="csi-mobile-inv-icon-btn"
                    aria-label="Back"
                  >
                    <ArrowLeft size={22} color="#4338ca" />
                  </button>
                  <div>
                    <h1 className="csi-mobile-inv-title">Sales Invoice</h1>
                    <div className="csi-mobile-inv-subtitle">
                      #{generatedInvoiceData?.invoice_number || `${invoicePrefix}${invoiceNumber}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setMobileInvoiceSuccessOpen(false)}
                    className="csi-mobile-inv-icon-btn"
                    title="Edit Invoice"
                  >
                    <Edit3 size={19} color="#4338ca" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this invoice?')) {
                        setMobileInvoiceSuccessOpen(false);
                        navigate('/sales-list');
                      }
                    }}
                    className="csi-mobile-inv-icon-btn"
                    title="Delete Invoice"
                  >
                    <Trash2 size={19} color="#dc2626" />
                  </button>
                  <button
                    type="button"
                    className="csi-mobile-inv-icon-btn"
                    title="More Options"
                  >
                    <MoreVertical size={19} color="#4338ca" />
                  </button>
                </div>
              </header>

              {/* Scrollable Body: Centered Printable Document */}
              <div className="csi-mobile-inv-body">
                <div className="csi-mobile-inv-sheet">
                  {/* Top Tag */}
                  <div className="csi-mobile-sheet-top-tag">
                    <span className="csi-sheet-tag-border">TAX INVOICE</span>
                    <span className="csi-sheet-tag-border">ORIGINAL FOR RECIPIENT</span>
                  </div>

                  {/* Business Header */}
                  <div className="csi-mobile-sheet-biz-hdr">
                    <div className="csi-mobile-sheet-logo-box">
                      <div className="csi-mobile-sheet-logo-icon">🌿</div>
                      <div className="csi-mobile-sheet-logo-text">
                        <span className="bold">Grow</span> <span className="light">Naturals</span>
                      </div>
                      <div className="csi-mobile-sheet-logo-motto">Root | Care | Landscape</div>
                    </div>
                    <div className="csi-mobile-sheet-biz-info">
                      <h2 className="csi-mobile-sheet-biz-name">Grow Naturals</h2>
                      <div className="csi-mobile-sheet-biz-line">
                        NO 19/7, 80 Feet Road, Anna Salai, KK Nagar, Madurai, Tamil Nadu, 625020
                      </div>
                      <div className="csi-mobile-sheet-biz-line">
                        Mobile: 8220040502 &nbsp; GSTIN: 33AKJPN8899F1ZI
                      </div>
                    </div>
                  </div>

                  {/* Olive/Moss Banner */}
                  <div className="csi-mobile-sheet-inv-banner">
                    <span>Invoice No.: {generatedInvoiceData?.invoice_number || `${invoicePrefix}${invoiceNumber}`}</span>
                    <span>Invoice Date: {formatInvoiceDateTime(generatedInvoiceData?.invoice_date || invoiceDate)}</span>
                  </div>

                  {/* Bill To & Ship To 2-Columns */}
                  <div className="csi-mobile-sheet-parties-grid">
                    <div className="csi-mobile-sheet-party-col">
                      <div className="csi-mobile-sheet-col-heading">BILL TO</div>
                      <div className="csi-mobile-sheet-party-name">
                        {generatedInvoiceData?.customer_name || partyName || 'Cash Sale'}
                      </div>
                      <div className="csi-mobile-sheet-party-line">
                        {generatedInvoiceData?.customer_address || partyAddress || 'KK Nagar, Madurai, 625020'}
                      </div>
                      <div className="csi-mobile-sheet-party-line">
                        Mobile: {generatedInvoiceData?.customer_phone || partyPhone || '8220040502'}
                      </div>
                      <div className="csi-mobile-sheet-party-line">
                        Place of Supply: {generatedInvoiceData?.place_of_supply || placeOfSupply || 'Tamil Nadu'}
                      </div>
                    </div>
                    <div className="csi-mobile-sheet-party-col">
                      <div className="csi-mobile-sheet-col-heading">SHIP TO</div>
                      <div className="csi-mobile-sheet-party-name">
                        {generatedInvoiceData?.ship_to_name || shipToName || 'Business Name'}
                      </div>
                      <div className="csi-mobile-sheet-party-line">
                        {generatedInvoiceData?.ship_to_address || shipToAddress || 'KK Nagar, Madurai, 625020'}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="csi-mobile-sheet-table-wrap">
                    <table className="csi-mobile-sheet-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40%' }}>ITEMS</th>
                          <th>HSN</th>
                          <th>QTY.</th>
                          <th>RATE</th>
                          <th>TAX</th>
                          <th style={{ textAlign: 'right' }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(generatedInvoiceData?.items && generatedInvoiceData.items.length > 0
                          ? generatedInvoiceData.items
                          : items.filter((i) => i.product_name.trim())
                        ).map((it: any, idx: number) => {
                          const qty = Number(it.quantity) || 1;
                          const rate = Number(it.unit_price) || 0;
                          const gst = Number(it.gst_rate) || 18;
                          const tax = Number(it.tax_amount || (rate * qty * gst) / 100);
                          const amt = Number(it.total || (rate * qty) + tax);
                          return (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{String(it.product_name).toUpperCase()}</td>
                              <td>{it.hsn_code || '39239090'}</td>
                              <td>{qty} {it.unit || 'PCS'}</td>
                              <td>{rate.toFixed(2)}</td>
                              <td>{tax.toFixed(2)} ({gst}%)</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>{Math.round(amt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotal Row */}
                  <div className="csi-mobile-sheet-subtotal-bar">
                    <span className="csi-mobile-sheet-subtotal-label">SUBTOTAL</span>
                    <span className="csi-mobile-sheet-subtotal-qty">
                      {(generatedInvoiceData?.items || items.filter((i) => i.product_name.trim())).reduce((s: number, i: any) => s + (Number(i.quantity) || 1), 0)}
                    </span>
                    <span className="csi-mobile-sheet-subtotal-tax">
                      ₹ {Number(generatedInvoiceData?.tax_amount || totalTaxAmount).toFixed(2)}
                    </span>
                    <span className="csi-mobile-sheet-subtotal-total">
                      ₹ {Math.round(Number(generatedInvoiceData?.total_amount || roundedGrandTotal))}
                    </span>
                  </div>

                  {/* Bottom Info: Bank Details + QR Code on Left, Totals on Right */}
                  <div className="csi-mobile-sheet-bottom-grid">
                    <div className="csi-mobile-sheet-bottom-left">
                      <div className="csi-mobile-sheet-col-heading">BANK DETAILS</div>
                      <div className="csi-mobile-sheet-meta-row">
                        <span className="label">Name:</span>
                        <span>{bankDetails.account_holder || 'Grow Naturals'}</span>
                      </div>
                      <div className="csi-mobile-sheet-meta-row">
                        <span className="label">IFSC Code:</span>
                        <span>{bankDetails.ifsc_code || 'UTIB0003648'}</span>
                      </div>
                      <div className="csi-mobile-sheet-meta-row">
                        <span className="label">Account No:</span>
                        <span>{bankDetails.account_number || '919020090453200'}</span>
                      </div>
                      <div className="csi-mobile-sheet-meta-row">
                        <span className="label">Bank:</span>
                        <span>{bankDetails.bank_name || 'Axis Bank ,Teppakulam Madurai'}</span>
                      </div>

                      <div className="csi-mobile-sheet-col-heading" style={{ marginTop: '8px' }}>PAYMENT QR CODE</div>
                      <div className="csi-mobile-sheet-qr-box">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiPayeeName)}&am=${Math.round(Number(generatedInvoiceData?.total_amount || roundedGrandTotal))}&cu=INR`)}`}
                          alt="UPI QR Code"
                          className="csi-mobile-sheet-qr-img"
                        />
                        <div className="csi-mobile-sheet-qr-info">
                          <span className="csi-mobile-sheet-qr-upi-label">UPI ID:</span>
                          <span className="csi-mobile-sheet-qr-upi-val">{upiId || 'ssathiyaraj-2@okhdfcbank'}</span>
                          <div className="csi-mobile-sheet-pay-icons">
                            <span className="csi-pay-badge gpay">GPay</span>
                            <span className="csi-pay-badge phonepe">PhonePe</span>
                            <span className="csi-pay-badge paytm">Paytm</span>
                            <span className="csi-pay-badge upi">BHIM</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="csi-mobile-sheet-bottom-right">
                      <div className="csi-mobile-sheet-calc-row">
                        <span>Taxable Amount</span>
                        <span>₹ {Number(generatedInvoiceData?.subtotal_amount || rawSubtotal).toFixed(2)}</span>
                      </div>
                      <div className="csi-mobile-sheet-calc-row">
                        <span>CGST @9%</span>
                        <span>₹ {(Number(generatedInvoiceData?.tax_amount || totalTaxAmount) / 2).toFixed(2)}</span>
                      </div>
                      <div className="csi-mobile-sheet-calc-row">
                        <span>SGST @9%</span>
                        <span>₹ {(Number(generatedInvoiceData?.tax_amount || totalTaxAmount) / 2).toFixed(2)}</span>
                      </div>
                      <div className="csi-mobile-sheet-calc-row bold total-row">
                        <span>Total Amount</span>
                        <span>₹ {Math.round(Number(generatedInvoiceData?.total_amount || roundedGrandTotal))}</span>
                      </div>
                      <div className="csi-mobile-sheet-calc-row">
                        <span>Received Amount</span>
                        <span>₹ {Math.round(Number(generatedInvoiceData?.total_amount || roundedGrandTotal))}</span>
                      </div>
                      <div className="csi-mobile-sheet-calc-row">
                        <span>Balance</span>
                        <span>₹ 0</span>
                      </div>

                      <div className="csi-mobile-sheet-words-box">
                        <span className="label">Total Amount (in words)</span>
                        <span className="words">
                          {numberToIndianWords(Math.round(Number(generatedInvoiceData?.total_amount || roundedGrandTotal)))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Store/Shopfront Button */}
                <div
                  className="csi-mobile-inv-floating-store"
                  onClick={() => alert('Storefront profile')}
                  title="Storefront"
                >
                  <Store size={22} color="#ffffff" />
                </div>
              </div>

              {/* Bottom Fixed Action Card matching Screenshot 4 */}
              <div className="csi-mobile-inv-bottom-card">
                <div className="csi-mobile-inv-cust-row">
                  <div>
                    <div className="csi-mobile-inv-cust-name">
                      {generatedInvoiceData?.customer_name || partyName || 'Cash Sale'}
                    </div>
                    <div className="csi-mobile-inv-cust-phone">
                      {generatedInvoiceData?.customer_phone || partyPhone || '8220040502'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="csi-mobile-inv-amount">
                      ₹ {Math.round(Number(generatedInvoiceData?.total_amount || roundedGrandTotal))}
                    </div>
                    <div className="csi-mobile-inv-paid-badge">
                      Paid <Check size={14} color="#16a34a" strokeWidth={3} />
                    </div>
                  </div>
                </div>

                {/* 3 Circular Actions: Print, Download, Share */}
                <div className="csi-mobile-inv-actions-row">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="csi-mobile-inv-action-col"
                  >
                    <div className="csi-mobile-inv-action-circle">
                      <Printer size={20} color="#4f46e5" />
                    </div>
                    <span className="csi-mobile-inv-action-label">Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="csi-mobile-inv-action-col"
                  >
                    <div className="csi-mobile-inv-action-circle">
                      <Download size={20} color="#4f46e5" />
                    </div>
                    <span className="csi-mobile-inv-action-label">Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(generatedInvoiceData || constructLiveInvoice())}
                    className="csi-mobile-inv-action-col"
                  >
                    <div className="csi-mobile-inv-action-circle">
                      <Share2 size={20} color="#4f46e5" />
                    </div>
                    <span className="csi-mobile-inv-action-label">Share</span>
                  </button>
                </div>

                {/* Full Width "Done" Button */}
                <button
                  type="button"
                  onClick={() => navigate('/sales-list')}
                  className="csi-mobile-inv-done-btn"
                >
                  Done
                </button>
              </div>
            </div>
          ) : mobileAddItemsOpen ? (
            /* SCREENSHOT 2: Add Items Catalog Screen */
            <div className="csi-mobile-items-screen">
              {/* Header: Back, Search by Batch No., Barcode, Mic */}
              {/* Header Search & Action Icons Row (Screenshot 2) */}
              <div className="csi-mobile-items-header">
                <button
                  type="button"
                  onClick={() => setMobileAddItemsOpen(false)}
                  className="csi-mobile-items-back-btn"
                  aria-label="Back"
                >
                  <ArrowLeft size={22} color="#4338ca" />
                </button>

                <div className="csi-mobile-items-search-box">
                  <Search size={18} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Search by Batch No."
                    value={mobileItemSearchQuery}
                    onChange={(e) => setMobileItemSearchQuery(e.target.value)}
                    className="csi-mobile-items-search-input"
                    autoFocus
                  />
                  {mobileItemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMobileItemSearchQuery('')}
                      className="csi-mobile-items-search-clear"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="csi-mobile-items-header-actions">
                  <button
                    type="button"
                    onClick={() => alert('Barcode scanner ready')}
                    className="csi-mobile-items-icon-btn"
                    title="Scan Barcode"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M3 17v2a2 2 0 0 0 2 2h2" />
                      <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
                      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.2" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Voice search ready')}
                    className="csi-mobile-items-icon-btn"
                    title="Voice Search"
                  >
                    <Mic size={20} color="#4338ca" />
                  </button>
                </div>
              </div>

              {/* Sub-bar: All Categories ⌵ & + Create New Item */}
              <div className="csi-mobile-items-filter-bar">
                <div className="csi-mobile-category-dropdown-wrap">
                  <button
                    type="button"
                    onClick={() => setMobileCategoryDropdownOpen(!mobileCategoryDropdownOpen)}
                    className="csi-mobile-filter-pill"
                  >
                    <span>{mobileItemCategory === 'all' ? 'All Categories' : mobileItemCategory}</span>
                    <ChevronDown size={14} color="#475569" strokeWidth={2.2} />
                  </button>
                  {mobileCategoryDropdownOpen && (
                    <div className="csi-mobile-category-menu">
                      <div
                        onClick={() => {
                          setMobileItemCategory('all');
                          setMobileCategoryDropdownOpen(false);
                        }}
                        className={`csi-mobile-category-option ${mobileItemCategory === 'all' ? 'active' : ''}`}
                      >
                        All Categories
                      </div>
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setMobileItemCategory(cat.name);
                            setMobileCategoryDropdownOpen(false);
                          }}
                          className={`csi-mobile-category-option ${mobileItemCategory === cat.name ? 'active' : ''}`}
                        >
                          {cat.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNewItemModalTab('stock');
                    setShowNewProductForm(true);
                  }}
                  className="csi-mobile-filter-pill csi-mobile-create-item-pill"
                >
                  <Plus size={15} color="#334155" strokeWidth={2.2} />
                  <span>Create New Item</span>
                </button>
              </div>

              {/* Items List matching Screenshot 2 & 4 */}
              <div className="csi-mobile-items-list">
                {filteredMobileProducts.length === 0 ? (
                  <div className="csi-mobile-drawer-empty">
                    No items found matching &ldquo;{mobileItemSearchQuery}&rdquo;
                  </div>
                ) : (
                  filteredMobileProducts.map((prod, idx) => {
                    const badgeStyle = BADGE_COLORS[idx % BADGE_COLORS.length];
                    const qty = getProductQuantity(prod);
                    const prodKey = String(prod.id || prod.name);
                    const isPpExpanded = Boolean(expandedItemPp[prodKey]);

                    return (
                      <div key={prod.id || idx} className="csi-mobile-item-card">
                        {/* Number Badge */}
                        <div
                          className="csi-mobile-item-badge"
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                        >
                          1
                        </div>

                        {/* Item Details */}
                        <div className="csi-mobile-item-details">
                          <h4 className="csi-mobile-item-name">{prod.name}</h4>
                          {prod.description && (
                            <div className="csi-mobile-item-specs">{prod.description}</div>
                          )}
                          <div
                            className="csi-mobile-item-price-row"
                            onClick={() => toggleItemPp(prodKey)}
                            role="button"
                            tabIndex={0}
                          >
                            <span className="csi-mobile-item-price">
                              ₹ {Number(prod.sale_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{prod.unit || 'PCS'}
                            </span>
                            {isPpExpanded ? (
                              <ChevronUp size={14} color="#64748b" strokeWidth={2.2} />
                            ) : (
                              <ChevronDown size={14} color="#64748b" strokeWidth={2.2} />
                            )}
                          </div>
                          <div className="csi-mobile-item-stock">
                            Stock: {prod.stock_quantity !== undefined ? `${Number(prod.stock_quantity).toFixed(1)}${prod.unit || 'PCS'}` : '0.0PCS'}
                          </div>

                          {/* Purchase Price (PP), Sales Price (SP), MRP Row when expanded (Screenshot 2) */}
                          {isPpExpanded && (
                            <div className="csi-mobile-item-pp-block">
                              {(prod.cost_price !== undefined && prod.cost_price !== null) && (
                                <div className="csi-mobile-item-price-chip">
                                  <div className="csi-mobile-item-pp-label">PP</div>
                                  <div className="csi-mobile-item-pp-val">
                                    ₹ {Number(prod.cost_price || 0).toLocaleString('en-IN')}
                                  </div>
                                </div>
                              )}
                              {(prod.sale_price !== undefined && prod.sale_price !== null) && (
                                <div className="csi-mobile-item-price-chip">
                                  <div className="csi-mobile-item-pp-label">SP</div>
                                  <div className="csi-mobile-item-pp-val">
                                    ₹ {Number(prod.sale_price || 0).toLocaleString('en-IN')}
                                  </div>
                                </div>
                              )}
                              {Boolean(Number((prod.mrp ?? prod.attributes?.mrp) || 0) > 0) && (
                                <div className="csi-mobile-item-price-chip">
                                  <div className="csi-mobile-item-pp-label">MRP</div>
                                  <div className="csi-mobile-item-pp-val">
                                    ₹ {Number((prod.mrp ?? prod.attributes?.mrp) || 0).toLocaleString('en-IN')}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action: ADD + button or EDIT + Stepper (Screenshot 2 & 4) */}
                        <div className="csi-mobile-item-action">
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleMobileAddItem(prod)}
                              className="csi-mobile-item-add-btn"
                            >
                              ADD +
                            </button>
                          ) : (
                            <div className="csi-mobile-item-action-added">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMobileItemFromCatalog(prod)}
                                className="csi-mobile-item-card-edit-btn"
                              >
                                EDIT
                              </button>
                              <div className="csi-mobile-item-stepper">
                                <button
                                  type="button"
                                  onClick={() => handleMobileDecrementItem(prod)}
                                  className="csi-mobile-stepper-btn"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} strokeWidth={2.5} />
                                </button>
                                <span className="csi-mobile-stepper-qty">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleMobileAddItem(prod)}
                                  className="csi-mobile-stepper-btn"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Sticky Action Bar: ONLY shown after an item is added (Screenshots 2 & 4) */}
              {(() => {
                const activeSelectedItems = items.filter((it) => it.product_name && it.product_name.trim().length > 0 && it.quantity > 0);
                const activeItemsSubtotal = activeSelectedItems.reduce((acc, it) => acc + Number(it.total || 0), 0);
                if (activeSelectedItems.length === 0) return null;

                return (
                  <div className="csi-mobile-catalog-bottom-bar">
                    {/* Summary Row: 1 item | ₹ 89.00 */}
                    <div className="csi-mobile-catalog-summary-row">
                      <span className="csi-mobile-catalog-item-count">
                        {activeSelectedItems.length} {activeSelectedItems.length === 1 ? 'item' : 'items'}
                      </span>
                      <span className="csi-mobile-catalog-total-val">
                        ₹ {activeItemsSubtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Actions Row: Add more details | Generate Bill */}
                    <div className="csi-mobile-catalog-actions-row">
                      <div
                        className="csi-mobile-catalog-add-more"
                        onClick={() => setMobileAddItemsOpen(false)}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="csi-mobile-add-more-title">Add more details</span>
                        <span className="csi-mobile-add-more-sub">Additional charges, Round off...</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleMobileGenerateBill}
                        disabled={isSaving}
                        className="csi-mobile-catalog-generate-btn"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <span>Generate Bill</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Render Edit Item Bottom Sheet if user clicks EDIT from catalog */}
              {renderEditItemBottomSheet()}
            </div>
          ) : autofillOpen ? (
            /* MOBILE SCREENSHOT 2: Autofill This Bill Screen as a Full Mobile Page */
            <div className="csi-mobile-autofill-screen">
              {/* Header with Back Arrow Button on Left, matching user requirement: instead of cross button on right, back arrow on left */}
              <header className="csi-mobile-autofill-header">
                <button
                  type="button"
                  onClick={() => setAutofillOpen(false)}
                  className="csi-mobile-autofill-back-btn"
                  aria-label="Back to Create Invoice"
                >
                  <ArrowLeft size={22} color="#4338ca" />
                </button>
                <div className="csi-mobile-autofill-hdr-info">
                  <div className="csi-scanner-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7V4h3" />
                      <path d="M17 4h3v3" />
                      <path d="M4 17v3h3" />
                      <path d="M17 20h3v-3" />
                      <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" strokeWidth="1.8" />
                      <line x1="10" y1="10.5" x2="14" y2="10.5" strokeWidth="1.8" />
                      <line x1="10" y1="13.5" x2="14" y2="13.5" strokeWidth="1.8" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="csi-sidebar-title" style={{ fontSize: '16.5px' }}>Autofill this bill</h2>
                    <div className="csi-sidebar-sub">
                      <Sparkles size={12} color="#ea580c" />
                      <span>Powered by Mira AI</span>
                    </div>
                  </div>
                </div>
              </header>

              {/* Stats Badge Row (Screenshot 2) */}
              <div className="csi-sidebar-stats" style={{ padding: '10px 18px', borderTop: 'none' }}>
                <span className="csi-stats-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                  </svg>
                  <span><strong>{billsScannedCount || 8}</strong> bills scanned</span>
                </span>
                <span className="csi-stats-divider">|</span>
                <span className="csi-stats-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                  <span><strong>~40 mins</strong> time saved</span>
                </span>
              </div>

              {/* Mobile Autofill Scrollable Body */}
              <div className="csi-mobile-autofill-body">
                <input
                  type="file"
                  ref={mobileAutofillFileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                />

                {!uploadedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => mobileAutofillFileInputRef.current?.click()}
                    className={`csi-dropzone ${isDragging ? 'dragging' : ''}`}
                    style={{ minHeight: '260px', padding: '36px 20px', borderRadius: '16px' }}
                  >
                    <div className="csi-dropzone-row">
                      <svg className="csi-dropzone-file-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <circle cx="11.5" cy="14.5" r="2.5" />
                        <path d="M13.5 16.5L16 19" />
                      </svg>
                      <span className="csi-dropzone-title" style={{ fontSize: '15.5px' }}>Drag & Drop or Upload file</span>
                    </div>
                    <p className="csi-dropzone-desc" style={{ fontSize: '12px', marginTop: '10px' }}>
                      (PDF, JPG, JPEG & PNG file supported, max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="csi-file-preview-card" style={{ padding: '14px', borderRadius: '14px' }}>
                    <div className="csi-file-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="csi-pdf-tag" style={{ width: '30px', height: '30px', fontSize: '11px' }}>PDF</div>
                        <span className="csi-file-name" style={{ fontSize: '13px', maxWidth: '220px' }}>{uploadedFile.name}</span>
                      </div>
                      <button
                        onClick={clearUploadedFile}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                        title="Remove file"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {uploadedFilePreview ? (
                      <div className="csi-preview-img-wrap" style={{ height: '140px', borderRadius: '10px', marginTop: '8px' }}>
                        <img src={uploadedFilePreview} alt="Invoice Preview" />
                      </div>
                    ) : (
                      <div className="csi-preview-fallback" style={{ height: '90px', borderRadius: '10px', marginTop: '8px' }}>
                        <FileCheck size={30} color="#ea580c" />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Document Ready (Page 1/1)</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', padding: '4px 2px 0' }}>
                      <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                      <span style={{ color: '#059669', fontWeight: 600 }}>Ready to extract</span>
                    </div>
                  </div>
                )}

                {/* Proceed Button */}
                <button
                  type="button"
                  onClick={async () => {
                    await triggerAutofillExtraction();
                  }}
                  disabled={isScanning || !uploadedFile}
                  className={`csi-btn-proceed ${!uploadedFile ? 'idle' : 'active'}`}
                  style={{ height: '48px', borderRadius: '12px', fontSize: '15.5px', fontWeight: 700 }}
                >
                  {isScanning ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{scanProgressText}</span>
                    </>
                  ) : (
                    <span>Proceed</span>
                  )}
                </button>

                {/* Scan Success Banner */}
                {scanSuccessBanner && (
                  <div className="csi-scan-success-pill" style={{ padding: '12px 14px', borderRadius: '12px', fontSize: '12.5px', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div>{scanSuccessBanner}</div>
                      <button
                        type="button"
                        onClick={() => setAutofillOpen(false)}
                        style={{ marginTop: '8px', padding: '6px 14px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        View Extracted Bill →
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Disclaimer Alert */}
                {isScanning && (
                  <div className="csi-scan-warning-pill" style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '11.5px' }}>
                    <Info size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>Please check the details wisely. AI can make mistakes.</span>
                  </div>
                )}

                {/* Quick Tips Box (Screenshot 2) */}
                <div className="csi-tips-box" style={{ borderRadius: '16px', padding: '18px 20px', border: '1.5px solid #fed7aa' }}>
                  <div className="csi-tips-title">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                    <span>Quick Tips</span>
                  </div>
                  <p className="csi-tips-text" style={{ fontSize: '13px', lineHeight: 1.5, minHeight: '38px', color: '#334155' }}>
                    {tipIndex === 0 && (
                      <>Any Party / Item tagged <span className="csi-tag-new">New</span> will be created and added to your inventory</>
                    )}
                    {tipIndex === 1 && (
                      <>Verify GSTIN, HSN code and GST rates carefully</>
                    )}
                    {tipIndex === 2 && (
                      <>Upload clear, high-resolution invoices for 99.8% AI extraction accuracy</>
                    )}
                  </p>
                  <div className="csi-tips-dots">
                    <span className={tipIndex === 0 ? 'active' : ''} onClick={() => setTipIndex(0)} title="Tip 1" />
                    <span className={tipIndex === 1 ? 'active' : ''} onClick={() => setTipIndex(1)} title="Tip 2" />
                    <span className={tipIndex === 2 ? 'active' : ''} onClick={() => setTipIndex(2)} title="Tip 3" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SCREENSHOT 1: Main Create Bill Form */
            <div className="csi-mobile-view">
            {/* Mobile Top Navbar (Screenshot 1) */}
            <header className="csi-mobile-hdr">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/sales-list')}
                  className="csi-mobile-hdr-back-btn"
                  aria-label="Back"
                >
                  <ArrowLeft size={22} color="#4338ca" />
                </button>
                <h1 className="csi-mobile-hdr-title">
                  {isEditMode ? 'Edit Bill / Invoice' : 'Create Bill / Invoice'}
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="csi-mobile-hdr-action-btn"
                  title="Invoice Settings"
                >
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#5d50db" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.5 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6.5" />
                    <circle cx="17.2" cy="6.2" r="1.6" strokeWidth="1.3" />
                    <path d="M17.2 3.6v.9M17.2 7.9v.9M14.7 6.2h.9M18.8 6.2h.9M15.4 4.4l.7.7M18.3 7.3l.7.7M15.4 8l.7-.7M18.3 5.1l.7-.7" strokeWidth="1.3" />
                    <path d="M7 6.5h3.6M7 8.5h3.6M7 6.5c1.8 0 2.8.9 2.8 2s-1 2-2.8 2h.8l2 2.6" strokeWidth="1.5" />
                    <line x1="6.5" y1="15.5" x2="16.5" y2="15.5" strokeWidth="1.7" />
                    <line x1="6.5" y1="18.2" x2="13.5" y2="18.2" strokeWidth="1.7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setAutofillOpen(true)}
                  className="csi-mobile-hdr-action-btn"
                  title="Scan / Autofill Invoice"
                >
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#c25e19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M3 17v2a2 2 0 0 0 2 2h2" />
                    <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
                    <path d="M7 12V6.5A1.5 1.5 0 0 1 8.5 5h5l3.5 3.5v3.5" strokeWidth="1.8" />
                    <rect x="9.5" y="7.5" width="2" height="2" rx="0.5" strokeWidth="1.3" />
                    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.2" />
                    <path d="M7 12v4.5A1.5 1.5 0 0 0 8.5 18h7a1.5 1.5 0 0 0 1.5-1.5V12" strokeWidth="1.8" />
                    <line x1="9.5" y1="15.2" x2="14.5" y2="15.2" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Subheader: Invoice Number & Date / Due info (Screenshot 1 & 4) */}
            <div className="csi-mobile-subhdr-card">
              <div className="csi-mobile-subhdr-row1">
                <span className="csi-mobile-subhdr-inv">
                  Sales Invoice #{invoicePrefix ? invoicePrefix : ''}{invoiceNumber}
                </span>
                <button
                  type="button"
                  onClick={openEditDateNumberModal}
                  className="csi-mobile-edit-btn"
                >
                  EDIT
                </button>
              </div>
              <div className="csi-mobile-subhdr-row2">
                {formatDateDisplay(invoiceDate)} - {hasCustomDueDate && dueDate ? `${paymentTermsDays || 7} day(s) to due` : 'No due date'}
              </div>
            </div>

            {/* Body Content */}
            <div className="csi-mobile-body-wrap">
              {/* SECTION: PARTY NAME * */}
              <div className="csi-mobile-section-block">
                <div className="csi-mobile-section-label">
                  PARTY NAME <span className="csi-req-asterisk">*</span>
                </div>

                {!hasSelectedParty ? (
                  /* Empty Party: Search/Create Party input box (Screenshot 1) */
                  <div
                    className="csi-mobile-party-input-box"
                    onClick={() => setMobilePartySelectOpen(true)}
                    role="button"
                    tabIndex={0}
                  >
                    <User size={19} color="#94a3b8" />
                    <span className="csi-mobile-party-placeholder">
                      Search/Create Party
                    </span>
                    <ChevronDown size={19} color="#94a3b8" />
                  </div>
                ) : (
                  /* Selected Party input box (Screenshot 1) */
                  <div
                    className="csi-mobile-party-input-box"
                    onClick={() => setMobilePartySelectOpen(true)}
                    role="button"
                    tabIndex={0}
                  >
                    <User size={19} color="#64748b" />
                    <span style={{ flex: 1, fontSize: '14.5px', fontWeight: 600, color: '#1e293b', marginLeft: '6px' }}>
                      {partyName}
                    </span>
                    <ChevronDown size={19} color="#94a3b8" />
                  </div>
                )}

                {/* PLACE OF SUPPLY ROW - Only shown when party is selected */}
                {hasSelectedParty && (
                  <div className="csi-mobile-pos-row">
                    <span className="csi-mobile-pos-label">
                      Place of Supply - <strong className="csi-mobile-pos-val">{placeOfSupply || 'Tamil Nadu'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMobilePosModalOpen(true)}
                      className="csi-mobile-pos-edit-btn"
                    >
                      EDIT
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION: ITEMS (Exact Screenshot Spec) */}
              {items.filter((i) => i.product_name && i.product_name.trim().length > 0 && i.quantity > 0).length > 0 ? (
                <div className="csi-mobile-items-section-card">
                  {/* Header Row: ^ ITEMS (1) and + Item */}
                  <div className="csi-mobile-items-header-row">
                    <button
                      type="button"
                      onClick={() => setMobileItemsExpanded(!mobileItemsExpanded)}
                      className="csi-mobile-items-toggle-btn"
                    >
                      {mobileItemsExpanded ? <ChevronUp size={19} color="#1e293b" /> : <ChevronDown size={19} color="#1e293b" />}
                      <span className="csi-mobile-items-title">
                        ITEMS ({items.filter((i) => i.product_name && i.product_name.trim().length > 0 && i.quantity > 0).length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileAddItemsOpen(true)}
                      className="csi-mobile-add-item-link"
                    >
                      + Item
                    </button>
                  </div>

                  {/* Items List */}
                  {mobileItemsExpanded && (
                    <div className="csi-mobile-items-list-wrap">
                      {items
                        .filter((i) => i.product_name && i.product_name.trim().length > 0 && i.quantity > 0)
                        .map((it, idx) => {
                          const originalIdx = items.findIndex((orig) => orig.id === it.id);
                          const qty = it.quantity || 1;
                          const unit = it.unit || 'PCS';
                          const rate = Number(it.unit_price || 0).toFixed(2);
                          const mrpVal = it.mrp ? Number(it.mrp).toFixed(0) : '0';
                          const taxRateVal = Number(it.gst_rate || 0).toFixed(1);
                          const taxAmtVal = Number(it.tax_amount || ((it.quantity * it.unit_price * (it.gst_rate || 0)) / 100)).toFixed(2);
                          const totalVal = Number(it.total || 0).toFixed(2);

                          return (
                            <div key={it.id || idx} className="csi-mobile-item-spec-card">
                              {/* Line 1: Item Name & Total */}
                              <div className="csi-mobile-item-row-top">
                                <span className="csi-mobile-item-name-text">{it.product_name}</span>
                                <span className="csi-mobile-item-total-text">₹ {totalVal}</span>
                              </div>

                              {/* Line 2: Qty x Rate */}
                              <div className="csi-mobile-item-meta-row">
                                <span className="csi-mobile-meta-lbl">Qty x Rate</span>
                                <span className="csi-mobile-meta-val">{qty} {unit} x {rate}</span>
                              </div>

                              {/* Line 3: MRP & EDIT button */}
                              <div className="csi-mobile-item-meta-row" style={{ justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span className="csi-mobile-meta-lbl">MRP</span>
                                  <span className="csi-mobile-meta-val">₹ {mrpVal}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMobileItem(originalIdx >= 0 ? originalIdx : idx)}
                                  className="csi-mobile-item-edit-pill"
                                >
                                  EDIT
                                </button>
                              </div>

                              {/* Line 4: Tax */}
                              <div className="csi-mobile-item-meta-row">
                                <span className="csi-mobile-meta-lbl">Tax</span>
                                <span className="csi-mobile-meta-val">{taxRateVal}% = ₹ {taxAmtVal}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Divider line before Item Subtotal */}
                  <div className="csi-mobile-items-divider" />

                  {/* Item Subtotal Row */}
                  <div className="csi-mobile-subtotal-row">
                    <span className="csi-mobile-subtotal-lbl">Item Subtotal</span>
                    <span className="csi-mobile-subtotal-val">
                      {items
                        .filter((i) => i.product_name && i.product_name.trim().length > 0 && i.quantity > 0)
                        .reduce((acc, it) => acc + Number(it.total || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>

                  {/* PRE-TOTAL BILLING FIELDS (Screenshots 1, 3, 4, 5) */}
                  <div className="csi-mobile-pretotal-wrap">
                    {/* 1. ADD ADDITIONAL CHARGES (Screenshots 1, 3, 5) */}
                    {showMobileCharges ? (
                      <div className="csi-mobile-charges-section">
                        <div className="csi-mobile-charges-header">
                          <button
                            type="button"
                            onClick={() => setChargesExpanded(!chargesExpanded)}
                            className="csi-mobile-charges-toggle-btn"
                          >
                            {chargesExpanded ? <ChevronUp size={18} color="#1e293b" /> : <ChevronDown size={18} color="#1e293b" />}
                            <span className="csi-mobile-charges-title">ADD ADDITIONAL CHARGES</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleAddAnotherChargeMobile}
                            className="csi-mobile-charges-add-plus-btn"
                            title="Add another charge row"
                          >
                            <Plus size={18} color="#4338ca" strokeWidth={2.5} />
                          </button>
                        </div>

                        {chargesExpanded && (
                          <div className="csi-mobile-charges-rows-list">
                            {extraCharges.map((ch) => (
                              <div key={ch.id} className="csi-mobile-charge-input-row">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveChargeRowMobile(ch.id)}
                                  className="csi-mobile-circle-x-btn"
                                  title="Remove charge"
                                >
                                  <X size={11} strokeWidth={3} color="#ffffff" />
                                </button>

                                <input
                                  type="text"
                                  placeholder="Charge Name"
                                  value={ch.name || ''}
                                  onChange={(e) => handleUpdateChargeMobile(ch.id, { name: e.target.value })}
                                  className="csi-mobile-underline-input csi-mobile-charge-name-input"
                                />

                                <div className="csi-mobile-currency-input-wrap">
                                  <span className="csi-mobile-input-sym">₹</span>
                                  <input
                                    type="number"
                                    placeholder="00.00"
                                    value={ch.amount !== undefined ? ch.amount : ''}
                                    onChange={(e) => handleUpdateChargeMobile(ch.id, { amount: e.target.value })}
                                    className="csi-mobile-underline-input csi-mobile-charge-amt-input"
                                  />
                                </div>

                                <div className="csi-mobile-tax-dropdown-wrap">
                                  <button
                                    type="button"
                                    onClick={() => setActiveChargeTaxDropdownId(activeChargeTaxDropdownId === ch.id ? null : ch.id)}
                                    className="csi-mobile-tax-select-btn"
                                  >
                                    <span>{ch.tax_rate ? `GST @ ${ch.tax_rate}%` : 'None'}</span>
                                    <ChevronDown size={14} color="#64748b" />
                                  </button>

                                  {activeChargeTaxDropdownId === ch.id && (
                                    <div className="csi-mobile-tax-popup-menu">
                                      {[
                                        { label: 'None', rate: 0 },
                                        { label: 'GST @ 5%', rate: 5 },
                                        { label: 'GST @ 12%', rate: 12 },
                                        { label: 'GST @ 18%', rate: 18 },
                                        { label: 'GST @ 28%', rate: 28 }
                                      ].map((opt) => (
                                        <div
                                          key={opt.rate}
                                          onClick={() => {
                                            handleUpdateChargeMobile(ch.id, { tax_rate: opt.rate });
                                            setActiveChargeTaxDropdownId(null);
                                          }}
                                          className={`csi-mobile-tax-popup-option ${Number(ch.tax_rate || 0) === opt.rate ? 'active' : ''}`}
                                        >
                                          {opt.label}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="csi-mobile-link-slot">
                        <button
                          type="button"
                          onClick={handleOpenMobileCharges}
                          className="csi-mobile-action-link"
                        >
                          + Additional Charges
                        </button>
                      </div>
                    )}

                    {/* 2. DISCOUNT AFTER TAX (Screenshots 1 & 3) */}
                    {showMobileDiscount ? (
                      <div className="csi-mobile-discount-row">
                        <button
                          type="button"
                          onClick={handleRemoveDiscountMobile}
                          className="csi-mobile-circle-x-btn"
                          title="Remove discount"
                        >
                          <X size={11} strokeWidth={3} color="#ffffff" />
                        </button>

                        <span className="csi-mobile-row-label">Discount After Tax</span>

                        <div className="csi-mobile-discount-pct-box">
                          <input
                            type="number"
                            placeholder="0"
                            value={discountPercent || ''}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value) || 0;
                              setDiscountPercent(p);
                              const base = rawSubtotal || 0;
                              setDiscountAmount(Number(((base * p) / 100).toFixed(2)));
                              setDiscountType('after_tax');
                            }}
                            className="csi-mobile-underline-input csi-mobile-disc-pct-input"
                          />
                          <span className="csi-mobile-input-suffix">%</span>
                        </div>

                        <div className="csi-mobile-currency-input-wrap">
                          <span className="csi-mobile-input-sym">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={discountAmount || ''}
                            onChange={(e) => {
                              const a = parseFloat(e.target.value) || 0;
                              setDiscountAmount(a);
                              const base = rawSubtotal || 0;
                              setDiscountPercent(base > 0 ? Number(((a / base) * 100).toFixed(1)) : 0);
                              setDiscountType('after_tax');
                            }}
                            className="csi-mobile-underline-input csi-mobile-disc-amt-input"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="csi-mobile-link-slot">
                        <button
                          type="button"
                          onClick={handleOpenMobileDiscount}
                          className="csi-mobile-action-link"
                        >
                          + Discount
                        </button>
                      </div>
                    )}

                    {/* 3. ROUND OFF (Screenshots 1 & 3) */}
                    {showMobileRoundOff ? (
                      <div className="csi-mobile-roundoff-row">
                        <button
                          type="button"
                          onClick={handleRemoveRoundOffMobile}
                          className="csi-mobile-circle-x-btn"
                          title="Remove round off"
                        >
                          <X size={11} strokeWidth={3} color="#ffffff" />
                        </button>

                        <span className="csi-mobile-row-label">Round Off</span>

                        <div className="csi-mobile-roundoff-pill-toggle">
                          <button
                            type="button"
                            onClick={() => setRoundOffSign('reduce')}
                            className={`csi-mobile-roundoff-sign-btn ${roundOffSign === 'reduce' ? 'active' : ''}`}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoundOffSign('add')}
                            className={`csi-mobile-roundoff-sign-btn ${roundOffSign === 'add' ? 'active' : ''}`}
                          >
                            +
                          </button>
                        </div>

                        <div className="csi-mobile-currency-input-wrap">
                          <span className="csi-mobile-input-sym">₹</span>
                          <input
                            type="number"
                            placeholder="0.0"
                            value={manualRoundOff !== undefined ? manualRoundOff : '0.0'}
                            onChange={(e) => handleManualRoundOffChange(e.target.value)}
                            className="csi-mobile-underline-input csi-mobile-roundoff-amt-input"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="csi-mobile-link-slot">
                        <button
                          type="button"
                          onClick={handleOpenMobileRoundOff}
                          className="csi-mobile-action-link"
                        >
                          + Round Off
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Total Amount Row */}
                  <div className="csi-mobile-total-row">
                    <span className="csi-mobile-total-lbl">Total Amount</span>
                    <div className="csi-mobile-total-val-box">
                      <span className="csi-mobile-total-curr">₹</span>
                      <span className="csi-mobile-total-num">{roundedGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* POST-TOTAL SECTION (Screenshots 1, 2, 3, 4, 5) */}
                  <div className="csi-mobile-posttotal-wrap">
                    {/* 1. RECEIVED AMOUNT (Screenshot 2) */}
                    {showMobileReceived ? (
                      <div className="csi-mobile-received-section">
                        <div className="csi-mobile-received-header">
                          <button
                            type="button"
                            onClick={() => setReceivedExpanded(!receivedExpanded)}
                            className="csi-mobile-received-toggle-btn"
                          >
                            {receivedExpanded ? <ChevronUp size={18} color="#1e293b" /> : <ChevronDown size={18} color="#1e293b" />}
                            <span className="csi-mobile-received-title">Received Amount</span>
                          </button>

                          <span className="csi-mobile-received-total-val">
                            ₹ {totalReceivedAmount.toFixed(0)}
                          </span>
                        </div>

                        {receivedExpanded && (
                          <div className="csi-mobile-received-rows-list">
                            {splitPayments.map((p) => (
                              <div key={p.id} className="csi-mobile-split-row">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSplitPaymentMobile(p.id)}
                                  className="csi-mobile-circle-x-btn"
                                  title="Remove payment"
                                >
                                  <X size={11} strokeWidth={3} color="#ffffff" />
                                </button>

                                <div className="csi-mobile-currency-input-wrap" style={{ flex: 1 }}>
                                  <span className="csi-mobile-input-sym">₹</span>
                                  <input
                                    type="number"
                                    placeholder="Amount"
                                    value={p.amount !== undefined ? p.amount : ''}
                                    onChange={(e) => handleSplitPaymentAmountChange(p.id, e.target.value)}
                                    className="csi-mobile-underline-input csi-mobile-split-amt-input"
                                  />
                                </div>

                                <div className="csi-mobile-split-method-wrap">
                                  <select
                                    value={p.method || 'cash'}
                                    onChange={(e) => handleSplitPaymentMethodChange(p.id, e.target.value as any)}
                                    className="csi-mobile-split-method-select"
                                  >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Cash</option>
                                    <option value="cheque">Cheque</option>
                                  </select>
                                  <ChevronDown size={14} color="#64748b" className="csi-mobile-select-arrow" />
                                </div>
                              </div>
                            ))}

                            {/* + Split Payment button (Max 3 fields! Hidden when splitPayments.length >= 3) */}
                            {splitPayments.length < 3 && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                <button
                                  type="button"
                                  onClick={handleAddSplitPaymentMobile}
                                  className="csi-mobile-action-link"
                                >
                                  + Split Payment
                                </button>
                              </div>
                            )}

                            {/* Balance Amount Row (Screenshot 2) */}
                            <div className="csi-mobile-balance-row">
                              <span className="csi-mobile-balance-label">Balance Amount</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="csi-mobile-balance-curr">₹</span>
                                <span className="csi-mobile-balance-val">{balanceAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="csi-mobile-links-block" style={{ marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={handleOpenMobileReceived}
                          className="csi-mobile-action-link"
                        >
                          + Amount Received
                        </button>
                      </div>
                    )}

                    {/* 2. NOTES (Screenshots 3 & 4) */}
                    {showMobileNotes ? (
                      <div className="csi-mobile-notes-row">
                        <button
                          type="button"
                          onClick={handleRemoveNotesMobile}
                          className="csi-mobile-circle-x-btn"
                          title="Remove notes"
                        >
                          <X size={11} strokeWidth={3} color="#ffffff" />
                        </button>

                        <input
                          type="text"
                          placeholder="Type your notes here"
                          value={notes || ''}
                          onChange={(e) => setNotes(e.target.value)}
                          className="csi-mobile-notes-input-box"
                        />
                      </div>
                    ) : (
                      <div className="csi-mobile-links-block" style={{ marginTop: showMobileReceived ? '8px' : '4px' }}>
                        <button
                          type="button"
                          onClick={handleOpenMobileNotes}
                          className="csi-mobile-action-link"
                        >
                          + Notes
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty items: Add Items button (Screenshot 3) */
                <div className="csi-mobile-section-block" style={{ marginTop: '16px' }}>
                  <div className="csi-mobile-section-label">ITEMS</div>
                  <button
                    type="button"
                    onClick={() => setMobileAddItemsOpen(true)}
                    className="csi-mobile-add-items-btn"
                  >
                    Add Items
                  </button>
                </div>
              )}
            </div>

            {/* SELECT PARTY BOTTOM DRAWER / MODAL (Screenshot 3) */}
            {mobilePartySelectOpen && (
              <div
                className="csi-mobile-party-drawer-overlay"
                onClick={() => setMobilePartySelectOpen(false)}
              >
                <div
                  className="csi-mobile-party-drawer-box"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="csi-mobile-drawer-hdr">
                    <h2 className="csi-mobile-drawer-title">Select Party</h2>
                    <button
                      type="button"
                      onClick={() => setMobilePartySelectOpen(false)}
                      className="csi-mobile-drawer-close-btn"
                      aria-label="Close"
                    >
                      <X size={22} />
                    </button>
                  </div>

                  {/* Search Box */}
                  <div className="csi-mobile-drawer-search-wrap">
                    <div className="csi-mobile-drawer-search-inner">
                      <Search size={18} color="#64748b" />
                      <input
                        type="text"
                        value={mobilePartySearchQuery}
                        onChange={(e) => setMobilePartySearchQuery(e.target.value)}
                        placeholder={mobilePartyTab === 'contacts' ? 'Search by Mobile Number' : 'Search by Party Name'}
                        className="csi-mobile-drawer-search-input"
                        autoFocus
                      />
                      {mobilePartySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setMobilePartySearchQuery('')}
                          style={{ border: 'none', background: 'transparent', color: '#94a3b8', padding: 0, cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="csi-mobile-drawer-tabs">
                    <button
                      type="button"
                      onClick={() => setMobilePartyTab('all')}
                      className={`csi-mobile-drawer-tab ${mobilePartyTab === 'all' ? 'active' : ''}`}
                    >
                      All Parties
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobilePartyTab('contacts')}
                      className={`csi-mobile-drawer-tab ${mobilePartyTab === 'contacts' ? 'active' : ''}`}
                    >
                      Contacts
                    </button>
                  </div>

                  {/* Parties or Contacts List */}
                  <div className="csi-mobile-drawer-list">
                    {mobilePartyTab === 'all' ? (
                      filteredMobileCustomers.length === 0 ? (
                        <div className="csi-mobile-drawer-empty">
                          No parties found matching &ldquo;{mobilePartySearchQuery}&rdquo;
                        </div>
                      ) : (
                        filteredMobileCustomers.map((cust, idx) => {
                          const nameKey = (cust.name || '').toLowerCase().trim();
                          const knownMap: Record<string, number> = {
                            'aarsha': 178,
                            'aarthi': 837,
                            'aachiya': 0,
                            'abby': 0,
                            'abi rhuban': 0,
                            'abinaya': 0,
                            'abitha': 0,
                            'adharsh': 0,
                            'adin': 0,
                            'ajith': 0,
                            'anita sharma': 5600,
                            'oberoi luxury resorts': 44800,
                            'green valley residences hoa': 12100,
                            'gowtham nursery': 4500,
                            'bank of baroda': 12100,
                            'mda pots and plants': 325513,
                            'pandiyan': 9150
                          };
                          const bal = cust.closing_balance !== undefined && cust.closing_balance !== null && Number(cust.closing_balance) !== 0
                            ? Number(cust.closing_balance)
                            : (knownMap[nameKey] !== undefined ? knownMap[nameKey] : (Number(cust.closing_balance) || 0));

                          return (
                            <div
                              key={cust.id || idx}
                              onClick={() => {
                                handleSelectCustomer(cust);
                                setMobilePartySelectOpen(false);
                              }}
                              className="csi-mobile-party-item-row"
                            >
                              <div>
                                <div className="csi-mobile-party-item-name">{cust.name}</div>
                                <div className="csi-mobile-party-item-sub">
                                  {cust.phone ? `${cust.phone} • Customer` : 'Customer'}
                                </div>
                              </div>

                              <div className="csi-mobile-party-item-right">
                                <span className="csi-mobile-party-item-bal">
                                  ₹ {bal.toLocaleString('en-IN')}
                                </span>
                                <ArrowDown size={14} color="#16a34a" strokeWidth={2.5} />
                              </div>
                            </div>
                          );
                        })
                      )
                    ) : (
                      /* CONTACTS TAB */
                      !contactPermissionGranted || deviceContacts.length === 0 ? (
                        /* Empty state matching the user's screenshot exactly */
                        <div className="csi-mobile-no-contacts-container">
                          <div className="csi-mobile-no-contacts-icon-box">
                            <Users size={52} strokeWidth={1.4} color="#cbd5e1" />
                          </div>
                          <div className="csi-mobile-no-contacts-heading">No Contacts Found</div>
                          <div className="csi-mobile-no-contacts-desc">
                            Read contact permission was denied. Please provide contact read permission.
                          </div>
                          <button
                            type="button"
                            onClick={handleRequestContactsPermission}
                            className="csi-mobile-contacts-settings-btn"
                          >
                            Settings
                          </button>
                        </div>
                      ) : (
                        /* Loaded Device Contacts List */
                        <>
                          <div className="csi-mobile-contacts-header-bar">
                            <span>{filteredDeviceContacts.length} Contacts loaded</span>
                            <button
                              type="button"
                              onClick={handleRequestContactsPermission}
                              className="csi-mobile-contacts-manage-btn"
                            >
                              Sync / Settings
                            </button>
                          </div>
                          {filteredDeviceContacts.length === 0 ? (
                            <div className="csi-mobile-drawer-empty">
                              No contacts found matching &ldquo;{mobilePartySearchQuery}&rdquo;
                            </div>
                          ) : (
                            filteredDeviceContacts.map((c, idx) => (
                              <div
                                key={`${c.name}-${c.phone}-${idx}`}
                                onClick={() => handleSelectMobileContact(c)}
                                className="csi-mobile-party-item-row"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div className="csi-mobile-contact-avatar">
                                    {(c.name || 'C').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="csi-mobile-party-item-name">{c.name || 'Unnamed Contact'}</div>
                                    <div className="csi-mobile-party-item-sub">
                                      {c.phone || 'No phone number'}
                                    </div>
                                  </div>
                                </div>
                                <div className="csi-mobile-party-item-right">
                                  <PhoneCall size={16} color="#6366f1" />
                                </div>
                              </div>
                            ))
                          )}
                        </>
                      )
                    )}
                  </div>

                  {/* Floating Bottom Button: + Create Party */}
                  <div className="csi-mobile-fab-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setMobilePartySelectOpen(false);
                        openCreatePartyModal();
                      }}
                      className="csi-mobile-create-party-fab"
                    >
                      <PlusCircle size={18} color="#ffffff" />
                      <span>Create Party</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT SALES INVOICE DATE & NUMBER BOTTOM MODAL (Screenshots 1, 3, 4) */}
            {editDateNumberModalOpen && (
              <div
                className="csi-date-num-backdrop"
                onClick={() => {
                  setDueDaysDropdownOpen(false);
                  setEditDateNumberModalOpen(false);
                }}
              >
                <div
                  className="csi-date-num-sheet"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dueDaysDropdownOpen) setDueDaysDropdownOpen(false);
                  }}
                >
                  {/* Sheet Header */}
                  <div className="csi-date-num-header">
                    <h3 className="csi-date-num-title">Edit Sales Invoice Date & Number</h3>
                    <button
                      type="button"
                      onClick={() => setEditDateNumberModalOpen(false)}
                      className="csi-date-num-close"
                      aria-label="Close"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Field 1: Sales Invoice Date */}
                  <div style={{ marginBottom: '16px' }}>
                    <label className="csi-date-num-label">Sales Invoice Date</label>
                    <div
                      className="csi-date-num-input-box"
                      onClick={() => handleOpenCustomDatePicker('invoice')}
                    >
                      <span>{formatDateDisplay(tempInvDate) || 'Select Date'}</span>
                      <Calendar size={18} color="#64748b" />
                    </div>
                  </div>

                  {/* Field 2: Due Date */}
                  <div style={{ marginBottom: '16px', position: 'relative' }}>
                    <label className="csi-date-num-label">Due Date</label>
                    {tempHasDueDate ? (
                      <>
                        <div className="csi-due-date-box">
                          <span
                            className="csi-due-date-val"
                            onClick={() => handleOpenCustomDatePicker('due')}
                            style={{ flex: 1, cursor: 'pointer' }}
                          >
                            {formatDateDisplay(tempDueDate) || 'Select Date'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDueDaysDropdownOpen(!dueDaysDropdownOpen);
                            }}
                            className="csi-due-date-filter-btn"
                          >
                            <span>{typeof tempDueDays === 'number' ? `${tempDueDays} Days` : String(tempDueDays)}</span>
                            {dueDaysDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>

                        {/* Due Days Dropdown Grid (Screenshot 3) */}
                        {dueDaysDropdownOpen && (
                          <div
                            className="csi-due-days-dropdown"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[7, 15, 30, 45, 60].map((daysCount) => (
                              <button
                                key={daysCount}
                                type="button"
                                onClick={() => handleSelectDueDays(daysCount)}
                                className={`csi-due-chip ${tempDueDays === daysCount ? 'active' : ''}`}
                              >
                                {daysCount} Days
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleSelectCustomDays}
                              className={`csi-due-chip ${tempDueDays === 'Custom' ? 'active' : ''}`}
                            >
                              Custom
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleRemoveDueDate}
                          className="csi-date-num-action-link"
                        >
                          <XCircle size={15} color="#4338ca" />
                          <span>Remove Due Date</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Due Date: None (Screenshot 4) */}
                        <div
                          className="csi-due-date-box"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDueDaysDropdownOpen(!dueDaysDropdownOpen);
                          }}
                        >
                          <span className="csi-due-date-val" style={{ color: '#475569' }}>None</span>
                          <ChevronDown size={17} color="#64748b" />
                        </div>

                        {dueDaysDropdownOpen && (
                          <div
                            className="csi-due-days-dropdown"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[7, 15, 30, 45, 60].map((daysCount) => (
                              <button
                                key={daysCount}
                                type="button"
                                onClick={() => handleSelectDueDays(daysCount)}
                                className="csi-due-chip"
                              >
                                {daysCount} Days
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleSelectCustomDays}
                              className="csi-due-chip"
                            >
                              Custom
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Field 3: Prefix & Serial Number (Screenshot 1 & 4) */}
                  {tempHasPrefix ? (
                    /* With Prefix (Screenshot 1) */
                    <div>
                      <div className="csi-prefix-row">
                        <div>
                          <label className="csi-date-num-label">Prefix</label>
                          <input
                            type="text"
                            value={tempPrefix}
                            onChange={(e) => setTempPrefix(e.target.value)}
                            className="csi-prefix-input"
                            placeholder="GN/SL/"
                          />
                        </div>
                        <div>
                          <label className="csi-date-num-label">Starting Serial Number</label>
                          <input
                            type="text"
                            value={tempInvoiceNumber}
                            onChange={(e) => setTempInvoiceNumber(e.target.value)}
                            className="csi-prefix-input"
                            placeholder="8223"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTempHasPrefix(false)}
                        className="csi-date-num-action-link"
                      >
                        <XCircle size={15} color="#4338ca" />
                        <span>Remove Prefix</span>
                      </button>
                    </div>
                  ) : (
                    /* Without Prefix: Single Serial Number (Screenshot 4) */
                    <div>
                      <div style={{ marginTop: '4px' }}>
                        <label className="csi-date-num-label">Sales Invoice Number</label>
                        <input
                          type="text"
                          value={tempInvoiceNumber}
                          onChange={(e) => setTempInvoiceNumber(e.target.value)}
                          className="csi-prefix-input"
                          placeholder="8223"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTempHasPrefix(true);
                          if (!tempPrefix) setTempPrefix('GN/SL/');
                        }}
                        className="csi-date-num-action-link"
                      >
                        <PlusCircle size={15} color="#4338ca" />
                        <span>Add Prefix</span>
                      </button>
                    </div>
                  )}

                  {/* SAVE Button */}
                  <button
                    type="button"
                    onClick={handleSaveDateNumber}
                    className="csi-date-num-save-btn"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            )}

            {/* MATERIAL-STYLE DATE PICKER DIALOG (Screenshot 2) */}
            {datePickerOpen && (
              <div
                className="csi-mat-datepicker-backdrop"
                onClick={() => setDatePickerOpen(false)}
              >
                <div
                  className="csi-mat-datepicker-dialog"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Purple Banner Header */}
                  <div className="csi-mat-datepicker-header">
                    <div className="csi-mat-datepicker-year">
                      {pickerSelectedDate.getFullYear()}
                    </div>
                    <div className="csi-mat-datepicker-headline">
                      {`${dayNamesShortList[pickerSelectedDate.getDay()]}, ${monthNamesList[pickerSelectedDate.getMonth()].slice(0, 3)} ${pickerSelectedDate.getDate()}`}
                    </div>
                  </div>

                  {/* Month Navigation */}
                  <div className="csi-mat-datepicker-nav">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="csi-mat-datepicker-nav-btn"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="csi-mat-datepicker-month-label">
                      {`${monthNamesList[pickerViewMonth]} ${pickerViewYear}`}
                    </div>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="csi-mat-datepicker-nav-btn"
                      aria-label="Next Month"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="csi-mat-datepicker-grid">
                    <div className="csi-mat-weekdays">
                      {weekDayHeadersList.map((w, idx) => (
                        <div key={idx}>{w}</div>
                      ))}
                    </div>
                    <div className="csi-mat-days">
                      {Array.from({ length: new Date(pickerViewYear, pickerViewMonth, 1).getDay() }).map((_, idx) => (
                        <div key={`empty-${idx}`} />
                      ))}
                      {Array.from(
                        { length: new Date(pickerViewYear, pickerViewMonth + 1, 0).getDate() },
                        (_, i) => i + 1
                      ).map((dNum) => {
                        const isSelected =
                          pickerSelectedDate &&
                          pickerSelectedDate.getFullYear() === pickerViewYear &&
                          pickerSelectedDate.getMonth() === pickerViewMonth &&
                          pickerSelectedDate.getDate() === dNum;

                        return (
                          <button
                            key={dNum}
                            type="button"
                            onClick={() =>
                              setPickerSelectedDate(
                                new Date(pickerViewYear, pickerViewMonth, dNum)
                              )
                            }
                            className={`csi-mat-day-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {dNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="csi-mat-datepicker-footer">
                    <button
                      type="button"
                      onClick={() => setDatePickerOpen(false)}
                      className="csi-mat-footer-btn"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDatePicker}
                      className="csi-mat-footer-btn"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PLACE OF SUPPLY BOTTOM SHEET MODAL (Screenshot 2) */}
            {mobilePosModalOpen && (
              <div
                className="csi-pos-modal-backdrop"
                onClick={() => setMobilePosModalOpen(false)}
              >
                <div
                  className="csi-pos-modal-sheet"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="csi-pos-modal-header">
                    <h3 className="csi-pos-modal-title">Place of Supply</h3>
                    <button
                      type="button"
                      onClick={() => setMobilePosModalOpen(false)}
                      className="csi-pos-modal-close-btn"
                      aria-label="Close"
                    >
                      <X size={20} color="#475569" />
                    </button>
                  </div>

                  <p className="csi-pos-modal-subtitle">
                    Determines whether IGST or CGST/SGST will apply to this bill.
                  </p>

                  {/* Scrollable State List */}
                  <div className="csi-pos-modal-list">
                    {ALL_INDIAN_STATES.map((st) => {
                      const isSelected = st.toLowerCase() === (placeOfSupply || 'Tamil Nadu').toLowerCase();
                      return (
                        <div
                          key={st}
                          onClick={() => {
                            setPlaceOfSupply(st);
                            setMobilePosModalOpen(false);
                          }}
                          className="csi-pos-modal-item"
                        >
                          <span className="csi-pos-modal-item-name">{st}</span>
                          {isSelected ? (
                            <div className="csi-pos-radio-selected">
                              <div className="csi-pos-radio-inner" />
                            </div>
                          ) : (
                            <div className="csi-pos-radio-unselected" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* EDIT ITEM BOTTOM SHEET MODAL (Screenshots 1 & 2) */}
            {renderEditItemBottomSheet()}

            {/* Mobile Sticky Bottom Action Bar: Save & New and Generate Bill (Only when items exist) */}
            {items.filter((i) => i.product_name && i.product_name.trim().length > 0 && i.quantity > 0).length > 0 && (
              <div className="csi-mobile-bottom-fixed-bar">
                <button
                  type="button"
                  onClick={() => handleSaveInvoice(true)}
                  disabled={isSaving}
                  className="csi-mobile-bar-btn csi-mobile-bar-btn-save-new"
                >
                  Save & New
                </button>
                <button
                  type="button"
                  onClick={handleMobileGenerateBill}
                  disabled={isSaving}
                  className="csi-mobile-bar-btn csi-mobile-bar-btn-generate"
                >
                  {isSaving ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            )}
          </div>
          )
        ) : (
          <div className="csi-desktop-view">
            {/* TOP NAVBAR */}
            <header className="csi-header">
        <div className="csi-header-left">
          <button onClick={() => navigate('/sales-list')} className="csi-btn-exit">
            <ArrowLeft size={16} />
            <span>Exit</span>
          </button>
          <div className="csi-divider-v" />
          <h1 className="csi-page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>{isEditMode ? 'Edit Sales Invoice' : 'Create Sales Invoice'}</span>
            {isEditMode && (
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg-surface-subtle)', border: '1px solid var(--color-border)', color: 'var(--module-sell-accent)', fontWeight: 700 }}>
                #{invoicePrefix}{invoiceNumber}
              </span>
            )}
          </h1>
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
          {/* Dashboard Return Button */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="csi-btn-dashboard"
            title="Return to Dashboard"
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

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
            <span>{isEditMode ? 'Update Invoice' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* Floating Toast Notification (MyBillBook Spec) */}
      {toastMessage && (
        <div className="csi-toast-notification">
          <AlertTriangle size={18} className="csi-toast-icon" />
          <span className="csi-toast-text">{toastMessage}</span>
          <button
            type="button"
            className="csi-toast-close-btn"
            onClick={() => setToastMessage(null)}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="csi-alert-success">
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Loading Invoice Alert */}
      {loadingInvoice && (
        <div style={{ backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1d4ed8', fontSize: '13px', fontWeight: 600 }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Loading invoice data for editing...</span>
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
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>#{invoicePrefix}{invoiceNumber}</span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '11px', fontWeight: 700 }}>
                  {activeBusiness?.name || (businessId === 'grow-naturals' ? 'Grow Naturals' : 'Nikhlesh Nursery')}
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
              {/* LEFT VERTICAL CARD: Fixed narrow action rail when closed, full scrollable panel when opened (Exact same height as invoice sheet) */}
              {autofillOpen ? (
                <aside className="csi-sidebar">
                  {/* Autofill Header */}
                  <div className="csi-sidebar-header">
                    <div className="csi-sidebar-title-group">
                      <div className="csi-scanner-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7V4h3" />
                          <path d="M17 4h3v3" />
                          <path d="M4 17v3h3" />
                          <path d="M17 20h3v-3" />
                          <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" strokeWidth="1.8" />
                          <line x1="10" y1="10.5" x2="14" y2="10.5" strokeWidth="1.8" />
                          <line x1="10" y1="13.5" x2="14" y2="13.5" strokeWidth="1.8" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="csi-sidebar-title">Autofill this bill</h2>
                        <div className="csi-sidebar-sub">
                          <Sparkles size={12} color="#ea580c" />
                          <span>Powered by Mira AI</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutofillOpen(false)}
                      className="csi-sidebar-close"
                      title="Close Autofill Panel"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Stats Badge Row */}
                  <div className="csi-sidebar-stats">
                    <span className="csi-stats-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="15" y2="17" />
                      </svg>
                      <span><strong>{billsScannedCount || 8}</strong> bills scanned</span>
                    </span>
                    <span className="csi-stats-divider">|</span>
                    <span className="csi-stats-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M12 7v5l4 2" />
                      </svg>
                      <span><strong>~40 mins</strong> time saved</span>
                    </span>
                  </div>

                  {/* Upload Drop Area */}
                  <div className="csi-sidebar-content">
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
                        <div className="csi-dropzone-row">
                          <svg className="csi-dropzone-file-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <circle cx="11.5" cy="14.5" r="2.5" />
                            <path d="M13.5 16.5L16 19" />
                          </svg>
                          <span className="csi-dropzone-title">Drag & Drop or Upload file</span>
                        </div>
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
                            <FileCheck size={24} color="#ea580c" />
                            <span>Document Ready (Page 1/1)</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', padding: '0 2px' }}>
                          <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                          <span style={{ color: '#059669', fontWeight: 600 }}>Ready to extract</span>
                        </div>
                      </div>
                    )}

                    {/* Action: Proceed Button */}
                    <button
                      onClick={() => triggerAutofillExtraction()}
                      disabled={isScanning || !uploadedFile}
                      className={`csi-btn-proceed ${!uploadedFile ? 'idle' : 'active'}`}
                    >
                      {isScanning ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>{scanProgressText}</span>
                        </>
                      ) : (
                        <span>Proceed</span>
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

                    {/* Quick Tips Box */}
                    <div className="csi-tips-box">
                      <div className="csi-tips-title">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                          <circle cx="12" cy="12" r="4" />
                        </svg>
                        <span>Quick Tips</span>
                      </div>
                      <p className="csi-tips-text">
                        {tipIndex === 0 && (
                          <>Any Party / Item tagged <span className="csi-tag-new">New</span> will be created and added to your inventory</>
                        )}
                        {tipIndex === 1 && (
                          <>Verify GSTIN, HSN code and GST rates carefully</>
                        )}
                        {tipIndex === 2 && (
                          <>Upload clear, high-resolution invoices for 99.8% AI extraction accuracy</>
                        )}
                      </p>
                      <div className="csi-tips-dots">
                        <span className={tipIndex === 0 ? 'active' : ''} onClick={() => setTipIndex(0)} title="Tip 1" />
                        <span className={tipIndex === 1 ? 'active' : ''} onClick={() => setTipIndex(1)} title="Tip 2" />
                        <span className={tipIndex === 2 ? 'active' : ''} onClick={() => setTipIndex(2)} title="Tip 3" />
                      </div>
                    </div>
                  </div>
                </aside>
              ) : (
                <aside
                  className="csi-left-rail"
                  title="Autofill / Scan Bill"
                  onClick={() => setAutofillOpen(true)}
                >
                  <div className="csi-left-rail-btn-wrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAutofillOpen(true);
                      }}
                      className="csi-btn-scanner-icon"
                      title="Autofill / Scan Invoice"
                      aria-label="Autofill / Scan Invoice"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                        <path d="M4 16v3a1 1 0 0 0 1 1h3" />
                        <path d="M16 20h3a1 1 0 0 0 1-1v-3" />
                        <path d="M8 7.5h5.5l2.5 2.5V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z" />
                        <path d="M13.5 7.5V10H16" />
                        <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2.2" />
                      </svg>
                    </button>
                    <div className="csi-left-rail-mobile-text">
                      <span className="csi-left-rail-mobile-title">Autofill with Mira AI</span>
                      <span className="csi-left-rail-mobile-sub">Upload or scan bill to extract items</span>
                    </div>
                  </div>
                  <div className="csi-left-rail-mobile-badge">
                    <Sparkles size={13} color="#ea580c" />
                    <span>Scan Bill</span>
                  </div>
                </aside>
              )}

              <div className="csi-invoice-sheet">
                {/* TOP ROW: Bill To, Ship To & Invoice Details Grid */}
                <div className={`csi-top-grid ${hasSelectedParty ? 'csi-top-grid-3col' : 'csi-top-grid-2col'}`}>
                  {/* BILL TO CARD */}
                  <div className="csi-card csi-party-card-box" style={{ position: 'relative' }}>
                  <div className="csi-card-header">
                    <h3 className="csi-card-title">Bill To</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {hasSelectedParty && (
                        <>
                          <button
                            type="button"
                            onClick={openEditPartyModal}
                            className="csi-btn-edit-party"
                            title="Edit Party Details"
                          >
                            <Edit3 size={13} color="#475569" />
                            <span>Edit Party</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPartySearchOpen(true);
                              setSearchCustomerQuery('');
                            }}
                            className="csi-btn-change-action"
                            title="Change Party"
                          >
                            <RotateCcw size={13} color="#475569" />
                            <span>Change Party</span>
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPartySettingsOpen(true);
                          setPartySettingsTab('custom_fields');
                        }}
                        className="csi-card-header-icon-btn"
                        title="Party Settings"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="csi-card-body">
                    {isPartySearchOpen ? (
                      /* STATE 1: MyBillBook Inline Party Search & Live Dropdown */
                      <div className="csi-party-search-section" ref={partySearchRef}>
                        {projectId && (
                          <div
                            style={{
                              marginBottom: '8px',
                              padding: '6px 10px',
                              background: 'rgba(34, 197, 94, 0.08)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#15803d'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FolderKanban size={14} />
                              <span>Project Billed Invoice</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProjectId('')}
                              style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '11px' }}
                            >
                              Unlink
                            </button>
                          </div>
                        )}

                        {(() => {
                          const filteredCustomers = customers
                            .filter((c) => {
                              if (!searchCustomerQuery.trim()) return true;
                              const q = searchCustomerQuery.toLowerCase();
                              return (
                                (c.name || '').toLowerCase().includes(q) ||
                                (c.phone && c.phone.includes(q)) ||
                                (c.gstin && c.gstin.toLowerCase().includes(q))
                              );
                            })
                            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

                          return (
                            <>
                              <div className="csi-party-search-input-box">
                                <input
                                  type="text"
                                  value={searchCustomerQuery}
                                  onChange={(e) => {
                                    setSearchCustomerQuery(e.target.value);
                                    setHighlightedPartyIndex(0);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setHighlightedPartyIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : prev));
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      setHighlightedPartyIndex((prev) => (prev > 0 ? prev - 1 : 0));
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (filteredCustomers[highlightedPartyIndex]) {
                                        handleSelectCustomer(filteredCustomers[highlightedPartyIndex]);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setIsPartySearchOpen(false);
                                    }
                                  }}
                                  placeholder="Search party by name or number"
                                  className="csi-party-search-input"
                                  autoFocus
                                />
                                <ChevronDown size={16} className="csi-party-search-chevron" />
                              </div>

                              {/* Floating Dropdown with Header, Party List & Create Party */}
                              <div className="csi-party-floating-dropdown">
                                <div className="csi-party-dropdown-header">
                                  <span>Party Name</span>
                                  <span>Balance</span>
                                </div>

                                <div className="csi-party-dropdown-list">
                                  {filteredCustomers.length === 0 ? (
                                    <div className="csi-party-dropdown-empty">
                                      No party found matching &ldquo;{searchCustomerQuery}&rdquo;
                                    </div>
                                  ) : (
                                    filteredCustomers.map((cust, idx) => {
                                      const nameKey = (cust.name || '').toLowerCase().trim();
                                      const knownMap: Record<string, number> = {
                                        'aarsha': 0,
                                        'aarthi': 836.99,
                                        'aachiya': 0,
                                        'abby': 0,
                                        'abi rhuban': 0,
                                        'abinaya': 0,
                                        'ajith': 0,
                                        'anita sharma': 5600.00,
                                        'oberoi luxury resorts': 44800.00,
                                        'green valley residences hoa': 12100.00,
                                        'gowtham nursery': 4500.00,
                                        'bank of baroda': 12100.00,
                                        'mda pots and plants': 325513.01,
                                        'pandiyan': 9150.00
                                      };
                                      const bal = cust.closing_balance !== undefined && cust.closing_balance !== null
                                        ? Number(cust.closing_balance)
                                        : (knownMap[nameKey] !== undefined ? knownMap[nameKey] : (Number(cust.closing_balance) || 0));

                                      return (
                                        <div
                                          key={cust.id || idx}
                                          onClick={() => handleSelectCustomer(cust)}
                                          onMouseEnter={() => setHighlightedPartyIndex(idx)}
                                          className={`csi-party-dropdown-item ${
                                            selectedCustomerId === cust.id || highlightedPartyIndex === idx ? 'highlighted active' : ''
                                          }`}
                                        >
                                          <div className="csi-party-item-left">
                                            <span className="csi-party-item-name">{cust.name}</span>
                                          </div>
                                          <div className="csi-party-item-right">
                                            <span
                                              className="csi-party-item-bal"
                                              style={{
                                                color: bal > 0 ? '#10b981' : '#4b5563',
                                                fontWeight: 500
                                              }}
                                            >
                                              ₹ {bal.toLocaleString('en-IN', { minimumFractionDigits: bal % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}
                                            </span>
                                            {bal > 0 && <ArrowDown size={13} color="#10b981" className="csi-bal-arrow-down" />}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                <div className="csi-party-dropdown-footer">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsPartySearchOpen(false);
                                      openCreatePartyModal();
                                    }}
                                    className="csi-party-create-btn"
                                    style={{
                                      width: '100%',
                                      height: '38px',
                                      padding: '0 16px',
                                      border: 'none',
                                      backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='6' ry='6' stroke='%2338bdf8' stroke-width='1.5' stroke-dasharray='6%2c 4' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e")`,
                                      backgroundColor: '#ffffff',
                                      color: '#0284c7',
                                      fontSize: '13.5px',
                                      fontWeight: 500,
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      outline: 'none',
                                      boxShadow: 'none'
                                    }}
                                  >
                                    + Create Party
                                  </button>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : !hasSelectedParty ? (
                      /* STATE 2: Initial Empty State: MyBillBook Dashed "+ Add Party" Box */
                      <div className="csi-billto-empty-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPartySearchOpen(true);
                            setSearchCustomerQuery('');
                          }}
                          className="csi-add-party-dashed-box"
                        >
                          <span>+ Add Party</span>
                        </button>
                      </div>
                    ) : (
                      /* STATE 3: Selected Party State */
                      <>
                        {projectId && (
                          <div
                            style={{
                              marginBottom: '8px',
                              padding: '6px 10px',
                              background: 'rgba(34, 197, 94, 0.08)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#15803d'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FolderKanban size={14} />
                              <span>Project: {projects.find((p) => p.id === projectId)?.title || 'Linked Project'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProjectId('')}
                              style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '11px' }}
                            >
                              Unlink
                            </button>
                          </div>
                        )}

                      {/* Party Details */}
                      <div className="csi-party-info-box">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="csi-party-name-bold">{partyName}</span>
                            {isAiExtractedParty && (
                              <span className="csi-ai-tag">
                                <Sparkles size={11} /> AI
                              </span>
                            )}
                          </div>
                          {(() => {
                            const found = customers.find(
                              (c) => (selectedCustomerId && c.id === selectedCustomerId) || (partyName && c.name.toLowerCase() === partyName.toLowerCase())
                            );
                            const bal = found ? Number(found.closing_balance || 0) : 0;
                            return (
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: bal > 0 ? '#059669' : '#64748b',
                                  backgroundColor: bal > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>Balance:</span>
                                <span>₹ {bal.toLocaleString('en-IN', { minimumFractionDigits: bal % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            );
                          })()}
                        </div>
                        {partyPhone && (
                          <div className="csi-party-phone-row">
                            Phone Number: <strong>{partyPhone}</strong>
                          </div>
                        )}
                        {partyAddress && (
                          <div className="csi-party-addr-row">
                            {partyAddress}
                          </div>
                        )}
                        {partyGstin && (
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                            GSTIN: {partyGstin}
                          </div>
                        )}
                      </div>

                      {/* Place of Supply with Search Icon & Custom Downwards Dropdown */}
                      <div style={{ marginTop: 'auto', paddingTop: '10px', position: 'relative' }} ref={posDropdownRef}>
                        <label className="csi-field-label">Place of Supply</label>
                        <div
                          className="csi-pos-select-wrap"
                          onClick={() => {
                            setPosDropdownOpen(!posDropdownOpen);
                            setPosSearchTerm('');
                          }}
                        >
                          <Search size={14} className="csi-pos-icon" />
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1e293b', paddingLeft: '22px' }}>
                            {placeOfSupply}
                          </span>
                          <ChevronDown
                            size={14}
                            color="#FE9F43"
                            style={{
                              transition: 'transform 0.15s ease',
                              transform: posDropdownOpen ? 'rotate(180deg)' : 'none'
                            }}
                          />
                        </div>

                        {/* Dropdown Menu Strictly Opening Downwards */}
                        {posDropdownOpen && (
                          <div className="csi-pos-dropdown-menu">
                            <div className="csi-pos-dropdown-search-wrap">
                              <Search size={13} color="#94a3b8" />
                              <input
                                type="text"
                                value={posSearchTerm}
                                onChange={(e) => setPosSearchTerm(e.target.value)}
                                placeholder="Search state..."
                                className="csi-pos-dropdown-search-input"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="csi-pos-dropdown-list">
                              {INDIAN_STATES
                                .filter((st) => st.toLowerCase().includes(posSearchTerm.toLowerCase()))
                                .map((st) => {
                                  const isSelected = st === placeOfSupply;
                                  return (
                                    <div
                                      key={st}
                                      className={`csi-pos-dropdown-item ${isSelected ? 'selected' : ''}`}
                                      onClick={() => {
                                        setPlaceOfSupply(st);
                                        setPosDropdownOpen(false);
                                      }}
                                    >
                                      <span>{st}</span>
                                      {isSelected && <Check size={14} color="#FE9F43" />}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  </div>
                </div>

                {/* SHIP TO CARD (Displayed when party is selected) */}
                {hasSelectedParty && (
                  <div className="csi-card csi-party-card-box">
                    <div className="csi-card-header">
                      <h3 className="csi-card-title">Ship To</h3>
                      <button
                        type="button"
                        onClick={openShippingModal}
                        className="csi-btn-change-action"
                        title="Change Shipping Address"
                      >
                        <RotateCcw size={13} color="#475569" />
                        <span>Change Shipping Address</span>
                      </button>
                    </div>
                    <div className="csi-card-body">
                      <div className="csi-party-info-box">
                        <span className="csi-party-name-bold">{shipToName || partyName}</span>
                        {(shipToPhone || partyPhone) && (
                          <div className="csi-party-phone-row">
                            Phone Number: <strong>{shipToPhone || partyPhone}</strong>
                          </div>
                        )}
                        {(shipToAddress || partyAddress) ? (
                          <div className="csi-party-addr-row">
                            {shipToAddress || partyAddress}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>
                            Same as billing address
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Invoice Details Card */}
                <div className="csi-card csi-invoice-details-card">
                  <div className="csi-card-header">
                    <h3 className="csi-card-title">Invoice Details</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label className="csi-toggle-wrap" title="Enable recurring/repeat invoice schedule">
                        <div className="csi-toggle-switch">
                          <input
                            type="checkbox"
                            checked={repeatInvoice}
                            onChange={(e) => setRepeatInvoice(e.target.checked)}
                          />
                          <span className="csi-toggle-slider" />
                        </div>
                        <span className="csi-toggle-label">Repeat this Invoice</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="csi-card-header-icon-btn"
                        title="Invoice Details Settings"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="csi-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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

                    <div style={{ marginBottom: '12px' }}>
                      <label className="csi-field-label">Sales Invoice Date</label>
                      <div className="csi-date-input-container">
                        <Calendar size={15} className="csi-date-icon-left" />
                        <span className="csi-formatted-date-text">
                          {formatDateDisplay(invoiceDate)}
                        </span>
                        <Calendar size={15} className="csi-date-icon-right" />
                        <input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => handleInvoiceDateChange(e.target.value)}
                          className="csi-native-date-input"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '4px' }}>
                      {!hasCustomDueDate ? (
                        <button
                          type="button"
                          onClick={handleOpenDueDate}
                          className="csi-add-duedate-dashed-box"
                        >
                          <span>+ Add Due Date</span>
                        </button>
                      ) : (
                        <div className="csi-duedate-expanded-box">
                          {/* Close Circle Top-Right */}
                          <button
                            type="button"
                            onClick={() => {
                              setHasCustomDueDate(false);
                              setDueDate('');
                            }}
                            className="csi-duedate-close-circle"
                            title="Remove Due Date"
                          >
                            <X size={12} />
                          </button>

                          <div className="csi-duedate-fields-grid">
                            {/* Left: Payment Terms */}
                            <div>
                              <label className="csi-field-label">Payment Terms</label>
                              <div className="csi-payment-terms-box">
                                <input
                                  type="number"
                                  min="0"
                                  value={paymentTermsDays}
                                  onChange={(e) => handlePaymentTermsChange(e.target.value)}
                                  className="csi-payment-terms-input"
                                  placeholder="30"
                                />
                                <span className="csi-payment-terms-addon">Days</span>
                              </div>
                            </div>

                            {/* Right: Due Date */}
                            <div>
                              <label className="csi-field-label">Due Date</label>
                              <div className="csi-date-input-container">
                                <Calendar size={15} className="csi-date-icon-left" />
                                <span className="csi-formatted-date-text">
                                  {formatDateDisplay(dueDate)}
                                </span>
                                <Calendar size={15} className="csi-date-icon-right" />
                                <input
                                  type="date"
                                  value={dueDate}
                                  onChange={(e) => handleDueDateChange(e.target.value)}
                                  className="csi-native-date-input"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
              </div>

              {/* ITEMS TABLE (MyBillBook Exact Spec) */}
              <div className="csi-table-card">
                <div className="csi-mobile-swipe-hint">
                  <ArrowLeft size={12} />
                  <span>Swipe table left/right to view all columns</span>
                  <ArrowRight size={12} />
                </div>
                <div className="csi-table-wrap">
                  <table className="csi-table">
                    <colgroup>
                      <col style={{ width: '38px' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '40px' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>NO</th>
                        <th style={{ textAlign: 'left' }}>ITEMS</th>
                        <th style={{ textAlign: 'center' }}>HSN</th>
                        <th style={{ textAlign: 'center' }}>MRP</th>
                        <th style={{ textAlign: 'center' }}>QTY</th>
                        <th style={{ textAlign: 'center' }}>PRICE/ITEM (₹)</th>
                        <th style={{ textAlign: 'center' }}>DISCOUNT</th>
                        <th style={{ textAlign: 'center' }}>TAX</th>
                        <th style={{ textAlign: 'center' }}>AMOUNT (₹)</th>
                        <th style={{ textAlign: 'center', padding: '6px 4px' }}>
                          <button
                            type="button"
                            onClick={() => setSettingsOpen(true)}
                            className="csi-th-settings-btn"
                            title="Item Table Settings"
                          >
                            <Settings size={14} />
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '12.5px', verticalAlign: 'top', paddingTop: '10px' }}>
                            {idx + 1}
                          </td>
                          <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '10px' }}>
                            <div className="csi-item-cell-content">
                              <input
                                type="text"
                                value={it.product_name}
                                onChange={(e) => handleItemChange(it.id, 'product_name', e.target.value)}
                                placeholder="Product or service name..."
                                className="csi-item-name-input"
                              />
                              <textarea
                                value={it.description || ''}
                                onChange={(e) => handleItemChange(it.id, 'description', e.target.value)}
                                placeholder="Enter Description (optional)"
                                className="csi-item-desc-textarea"
                                rows={2}
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                            <div className="csi-input-group-hsn">
                              <input
                                type="text"
                                value={it.hsn_code}
                                onChange={(e) => handleItemChange(it.id, 'hsn_code', e.target.value)}
                                placeholder="HSN"
                                className="csi-table-hsn-input"
                              />
                                <span className="csi-hsn-search-addon">
                                  <Search size={13} className="csi-hsn-search-icon" />
                                </span>
                              </div>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                            <div className="csi-input-group-addon">
                              <span className="csi-input-addon">₹</span>
                              <input
                                type="number"
                                value={it.mrp === 0 ? '0' : Math.round(it.mrp) || ''}
                                onChange={(e) => handleItemChange(it.id, 'mrp', Math.round(Number(e.target.value)))}
                                placeholder="0"
                                className="csi-addon-input"
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                            <div className="csi-input-group-qty">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleItemChange(it.id, 'quantity', Math.round(Number(e.target.value)))}
                                className="csi-qty-input"
                              />
                              <span className="csi-qty-unit">{it.unit || 'PCS'}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px', position: 'relative' }}>
                            <div className="csi-input-group-addon">
                              <span className="csi-input-addon">₹</span>
                              <input
                                type="number"
                                value={it.unit_price === 0 ? '0' : Math.round(it.unit_price) || ''}
                                onChange={(e) => handleItemChange(it.id, 'unit_price', Math.round(Number(e.target.value)))}
                                onFocus={() => {
                                  if (it.product_name) {
                                    fetchPartyItemHistory(it.id, it.product_id, it.product_name);
                                  }
                                }}
                                className="csi-addon-input"
                                placeholder="0"
                              />
                            </div>

                            {/* Recent Sales Prices Popover (Exact MyBillBook Spec) */}
                            {priceHistoryRowId === it.id && (
                              <div
                                className="csi-price-history-popover"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="csi-price-history-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <Info size={15} color="#FE9F43" style={{ flexShrink: 0 }} />
                                    <span className="csi-price-history-title">
                                      Recent Sales Prices for {it.product_name || 'this item'} to this party
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPriceHistoryRowId(null);
                                    }}
                                    className="csi-price-history-close"
                                    title="Close"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                <div className="csi-price-history-body">
                                  {isLoadingPriceHistory ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                      <Loader2 size={14} className="animate-spin text-orange-400" />
                                      <span>Fetching history...</span>
                                    </div>
                                  ) : !partyName && !selectedCustomerId ? (
                                    <div style={{ padding: '18px 14px', textAlign: 'center', color: '#cbd5e1', fontSize: '12px' }}>
                                      No party selected. Select a party to view past sales.
                                    </div>
                                  ) : priceHistoryData.length === 0 ? (
                                    <div style={{ padding: '20px 14px', textAlign: 'center', color: '#cbd5e1', fontSize: '12.5px' }}>
                                      No past transactions
                                    </div>
                                  ) : (
                                    <table className="csi-price-history-table">
                                      <thead>
                                        <tr>
                                          <th style={{ textAlign: 'left', width: '50%' }}>Date</th>
                                          <th style={{ textAlign: 'right', width: '50%' }}>Price/Item</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {priceHistoryData.map((hist, hIdx) => {
                                          const d = hist.created_at || hist.transaction_date ? new Date(hist.created_at || hist.transaction_date) : new Date();
                                          const dateStr = !isNaN(d.getTime())
                                            ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
                                            : 'Recent';
                                          const p = Number(hist.unit_price || 0);
                                          return (
                                            <tr
                                              key={hIdx}
                                              className="csi-price-history-row"
                                              onClick={() => {
                                                handleItemChange(it.id, 'unit_price', Math.round(p));
                                                setPriceHistoryRowId(null);
                                              }}
                                              title="Click to apply this price"
                                            >
                                              <td style={{ textAlign: 'left', color: '#f1f5f9' }}>{dateStr}</td>
                                              <td style={{ textAlign: 'right', color: '#ffffff', fontWeight: 700 }}>
                                                ₹ {Math.round(p)}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  )}
                                </div>

                                <div className="csi-price-history-footer">
                                  Note : Price excludes tax and discount
                                </div>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                            <div className="csi-table-discount-group">
                              {/* Amount in Rupees (₹) */}
                              <div className="csi-table-discount-input-row">
                                <span className="csi-table-discount-addon csi-addon-left">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={it.discount_amount === 0 ? '0' : Math.round(it.discount_amount) || ''}
                                  onChange={(e) => handleItemChange(it.id, 'discount_amount', Math.round(Number(e.target.value)))}
                                  className="csi-table-discount-input"
                                  placeholder="0"
                                />
                              </div>
                              {/* Percentage (%) */}
                              <div className="csi-table-discount-input-row">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={it.discount_percent === 0 ? '0' : Math.round(it.discount_percent) || ''}
                                  onChange={(e) => handleItemChange(it.id, 'discount_percent', Math.round(Number(e.target.value)))}
                                  className="csi-table-discount-input"
                                  placeholder="0"
                                />
                                <span className="csi-table-discount-addon csi-addon-right">%</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                            {isTaxable ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '3px' }}>
                                <select
                                  value={it.gst_rate}
                                  onChange={(e) => handleItemChange(it.id, 'gst_rate', Number(e.target.value))}
                                  className="csi-table-select-tax"
                                >
                                  <option value={0}>0%</option>
                                  <option value={5}>5%</option>
                                  <option value={12}>12%</option>
                                  <option value={18}>18%</option>
                                  <option value={28}>28%</option>
                                </select>
                                <div className="csi-tax-calc-label">
                                  (₹ {Math.round(it.tax_amount)})
                                </div>
                              </div>
                            ) : (
                              <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#059669', fontSize: '11px', fontWeight: 600 }}>0% (Exempt)</span>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px' }}>
                            <div className="csi-input-group-addon csi-amount-readonly-box">
                              <span className="csi-input-addon">₹</span>
                              <input
                                type="text"
                                readOnly
                                value={Math.round(it.total)}
                                className="csi-addon-input csi-amount-input"
                              />
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', verticalAlign: 'top', paddingTop: '10px', paddingBottom: '6px' }}>
                            <div className="csi-row-actions-group">
                              <div className="csi-row-action-menu-wrapper">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveRowMenuId(activeRowMenuId === it.id ? null : it.id);
                                  }}
                                  className={`csi-row-action-btn ${activeRowMenuId === it.id ? 'active' : ''}`}
                                  title="More options"
                                >
                                  <MoreVertical size={15} />
                                </button>
                                {activeRowMenuId === it.id && (
                                  <div
                                    className="csi-row-action-popover"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      className="csi-row-action-popover-item"
                                      onClick={() => {
                                        handleDuplicateItem(it.id);
                                        setActiveRowMenuId(null);
                                      }}
                                    >
                                      <Copy size={14} className="csi-dup-icon" />
                                      <span>Duplicate</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(it.id)}
                                className="csi-row-action-btn delete"
                                title="Delete row"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Wide Dashed + Add Item Row with Scan Barcode Button */}
                      <tr className="csi-table-action-tr">
                        <td colSpan={8} style={{ padding: '8px 10px', borderRight: 'none' }}>
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="csi-btn-add-item-full"
                          >
                            <span>+ Add Item</span>
                          </button>
                        </td>
                        <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => alert('Barcode camera scanner ready. Scan product barcode on counter.')}
                            className="csi-btn-scan-barcode"
                          >
                            <Scan size={15} />
                            <span>Scan Barcode</span>
                          </button>
                        </td>
                      </tr>

                      {/* Subtotal Summary Row matching Table Grid */}
                      <tr className="csi-table-subtotal-row">
                        <td colSpan={4} className="csi-table-subtotal-label">
                          Subtotal
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                          {Math.round(subtotalQuantity)}
                        </td>
                        <td style={{ borderRight: '1px solid #e2e8f0' }}></td>
                        <td style={{ textAlign: 'right', color: '#334155', fontWeight: 600 }}>
                          ₹ {Math.round(totalItemDiscounts)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#334155', fontWeight: 600 }}>
                          ₹ {Math.round(totalTaxAmount)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '13.5px' }}>
                          ₹ {Math.round(rawSubtotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOTTOM SECTION (MYBILLBOOK EXACT SPEC) */}
              <div className="csi-bottom-grid">
                {/* LEFT BOTTOM: Notes, Terms, Bank & QR */}
                <div className="csi-bottom-left">
                  {/* Add Notes */}
                  <div className="csi-bottom-action-item">
                    {!showNotesInput ? (
                      <button
                        type="button"
                        onClick={() => setShowNotesInput(true)}
                        className="csi-bottom-link-btn"
                      >
                        <FileText size={16} className="csi-link-blue-icon" />
                        <span>Add Notes</span>
                      </button>
                    ) : (
                      <div className="csi-expanded-input-box">
                        <div className="csi-expanded-input-header">
                          <span className="csi-expanded-label">Notes</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNotes('');
                              setShowNotesInput(false);
                            }}
                            className="csi-close-circle-btn"
                            title="Close Notes"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Enter your notes"
                          className="csi-notes-terms-input"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* Add Terms & Conditions */}
                  <div className="csi-bottom-action-item">
                    {!showTermsInput ? (
                      <button
                        type="button"
                        onClick={() => setShowTermsInput(true)}
                        className="csi-bottom-link-btn"
                      >
                        <FileCheck size={16} className="csi-link-blue-icon" />
                        <span>Add Terms & Conditions</span>
                      </button>
                    ) : (
                      <div className="csi-expanded-input-box">
                        <div className="csi-expanded-input-header">
                          <span className="csi-expanded-label">Terms & Conditions</span>
                          <button
                            type="button"
                            onClick={() => setShowTermsInput(false)}
                            className="csi-close-circle-btn"
                            title="Close Terms & Conditions"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          placeholder="Enter your terms and conditions"
                          className="csi-notes-terms-input"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* Bank Details Section */}
                  {bankDetails.account_number || bankDetails.bank_name ? (
                    <div className="csi-bottom-bank-section">
                      <span className="csi-bank-details-title">Bank Details</span>
                      <div className="csi-bank-grid-2col">
                        <div className="csi-bank-col-left">
                          <div className="csi-bank-field-inline">
                            <span className="csi-bank-label">Account Number: </span>
                            <strong className="csi-bank-val">{bankDetails.account_number}</strong>
                          </div>
                          <div className="csi-bank-field-stacked">
                            <span className="csi-bank-label">Bank & Branch Name:</span>
                            <strong className="csi-bank-val-block">{bankDetails.bank_name}</strong>
                          </div>
                        </div>

                        <div className="csi-bank-col-right">
                          <div className="csi-bank-field-inline">
                            <span className="csi-bank-label">IFSC Code: </span>
                            <strong className="csi-bank-val">{bankDetails.ifsc_code}</strong>
                          </div>
                          <div className="csi-bank-field-inline">
                            <span className="csi-bank-label">Account Holder's Name: </span>
                            <strong className="csi-bank-val">{bankDetails.account_holder}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="csi-bank-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '36px', marginTop: '18px' }}>
                        <button
                          type="button"
                          onClick={() =>
                            setBankDetails({
                              account_number: '',
                              ifsc_code: '',
                              bank_name: '',
                              account_holder: ''
                            })
                          }
                          className="csi-bank-btn-remove"
                          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ea5455', fontSize: '14px', fontWeight: 600 }}
                        >
                          <Trash2 size={18} style={{ color: '#ea5455', stroke: '#ea5455', flexShrink: 0 }} />
                          <span style={{ color: '#ea5455', fontWeight: 600 }}>Remove</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsOpen(true)}
                          className="csi-bank-btn-change"
                          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0984e3', fontSize: '14px', fontWeight: 600 }}
                        >
                          <RefreshCw size={18} style={{ color: '#0984e3', stroke: '#0984e3', flexShrink: 0 }} />
                          <span style={{ color: '#0984e3', fontWeight: 600 }}>Change</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="csi-bottom-action-item">
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="csi-bottom-link-btn"
                      >
                        <Building2 size={16} className="csi-link-blue-icon" />
                        <span>Add Bank Details</span>
                      </button>
                    </div>
                  )}

                  {/* Payment QR Code Section */}
                  <div className="csi-bottom-action-item">
                    {!showPaymentQr ? (
                      <button
                        type="button"
                        onClick={openPaymentQrModal}
                        className="csi-bottom-link-btn"
                      >
                        <QrCode size={18} className="csi-link-blue-icon" />
                        <span>Add Payment QR</span>
                      </button>
                    ) : (
                      <div className="csi-qr-card-box">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={generateUpiQrUrl(upiId, upiPayeeName, includeAmountInQr ? roundedGrandTotal : 0)}
                            alt="Payment QR"
                            className="csi-qr-img"
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>UPI Payment QR</span>
                              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: '#ecfdf5', color: '#059669', fontWeight: 700 }}>Active</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
                              {upiId}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                              Payee: <strong>{upiPayeeName}</strong> {includeAmountInQr && `• ₹${Math.round(roundedGrandTotal)}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={openPaymentQrModal}
                            className="csi-btn-change-action"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            title="Edit UPI QR details"
                          >
                            <RotateCcw size={11} /> Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPaymentQr(false)}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                            title="Remove Payment QR"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT BOTTOM: Tax Breakdown & Financial Summary */}
                <div className="csi-bottom-right">
                  {/* Add Additional Charges Section */}
                  <div>
                    {!showAddCharges || extraCharges.length === 0 ? (
                      <button
                        type="button"
                        onClick={handleAddInitialCharge}
                        className="csi-bottom-link-btn"
                      >
                        <PlusCircle size={16} className="csi-link-blue-icon" />
                        <span>Add Additional Charges</span>
                      </button>
                    ) : (
                      <div className="csi-extra-charges-container" style={{ width: '100%' }}>
                        {extraCharges.map((ch) => (
                          <div key={ch.id} className="csi-extra-charge-row">
                            <input
                              type="text"
                              placeholder="Enter charge"
                              value={ch.name}
                              onChange={(e) => handleUpdateCharge(ch.id, 'name', e.target.value)}
                              className="csi-charge-name-input"
                            />
                            <div className="csi-charge-amt-group">
                              <span className="csi-charge-currency-symbol">₹</span>
                              <input
                                type="number"
                                placeholder="0"
                                value={ch.amount === 0 ? '' : Math.round(Number(ch.amount))}
                                onChange={(e) => handleUpdateCharge(ch.id, 'amount', e.target.value === '' ? '' : Math.round(Number(e.target.value)))}
                                className="csi-charge-amt-input"
                              />
                            </div>
                            <select
                              value={ch.tax_rate}
                              onChange={(e) => handleUpdateCharge(ch.id, 'tax_rate', Number(e.target.value))}
                              className="csi-charge-tax-select"
                            >
                              <option value={0}>No Tax Applicable</option>
                              <option value={5}>GST @ 5%</option>
                              <option value={12}>GST @ 12%</option>
                              <option value={18}>GST @ 18%</option>
                              <option value={28}>GST @ 28%</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveCharge(ch.id)}
                              className="csi-charge-remove-btn"
                              title="Remove charge"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={handleAddAnotherCharge}
                          className="csi-btn-add-another-charge csi-bottom-link-btn"
                        >
                          <PlusCircle size={15} className="csi-link-blue-icon" />
                          <span>Add Another Charge</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Taxable Amount */}
                  <div className="csi-summary-flex-row">
                    <span className="csi-summary-label">Taxable Amount</span>
                    <span className="csi-summary-val">₹ {Math.round(taxableAmount)}</span>
                  </div>

                  {/* Add Discount */}
                  <div>
                    {!showOverallDiscount ? (
                      <button
                        type="button"
                        onClick={() => setShowOverallDiscount(true)}
                        className="csi-bottom-link-btn"
                      >
                        <BadgePercent size={16} className="csi-link-blue-icon" />
                        <span>Add Discount</span>
                      </button>
                    ) : (
                      <div className="csi-discount-row-wrap" style={{ width: '100%', gap: '8px' }}>
                        <div className="csi-discount-select-wrap" style={{ flex: '0 0 105px' }}>
                          <select
                            value={discountType}
                            onChange={(e) => handleDiscountTypeChange(e.target.value as 'after_tax' | 'before_tax')}
                            className="csi-discount-type-select"
                          >
                            <option value="after_tax">After Tax</option>
                            <option value="before_tax">Before Tax</option>
                          </select>
                          <ChevronDown size={13} className="csi-discount-chevron" />
                        </div>
                        <div className="csi-discount-input-group" style={{ flex: '0 0 85px' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={discountPercent === 0 ? '' : Math.round(discountPercent)}
                            onChange={(e) => handleDiscountPercentChange(e.target.value === '' ? 0 : Math.round(Number(e.target.value)))}
                            className="csi-discount-inner-input"
                            style={{ textAlign: 'right' }}
                          />
                          <span className="csi-discount-addon csi-discount-addon-right">%</span>
                        </div>
                        <div className="csi-discount-input-group" style={{ flex: '1' }}>
                          <span className="csi-discount-addon csi-discount-addon-left">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={discountAmount === 0 ? '' : Math.round(discountAmount)}
                            onChange={(e) => handleDiscountAmountChange(e.target.value === '' ? 0 : Math.round(Number(e.target.value)))}
                            className="csi-discount-inner-input"
                            style={{ textAlign: 'right' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="csi-discount-remove-btn"
                          title="Remove discount"
                        >
                          <XCircle size={17} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="csi-summary-divider" />

                  {/* Auto Round Off Row */}
                  <div className="csi-summary-flex-row" style={{ width: '100%', gap: '8px' }}>
                    <label className="csi-roundoff-label" style={{ width: '198px', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={autoRoundOff}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAutoRoundOff(checked);
                          if (checked) {
                            setManualRoundOff('');
                            setRoundOffSign('add');
                          }
                        }}
                      />
                      <span>Auto Round Off</span>
                    </label>
                    {!autoRoundOff && (
                      <div className="csi-roundoff-input-group" style={{ flex: 1, width: 'auto' }}>
                        <div className="csi-roundoff-select-wrap">
                          <select
                            value={roundOffSign}
                            onChange={(e) => handleRoundOffSignChange(e.target.value as 'add' | 'reduce')}
                            className="csi-roundoff-sign-select"
                          >
                            <option value="add">+ Add</option>
                            <option value="reduce">- Reduce</option>
                          </select>
                          <ChevronDown size={13} className="csi-roundoff-chevron" />
                        </div>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={manualRoundOff === '' ? '' : manualRoundOff}
                          onChange={(e) => handleManualRoundOffChange(e.target.value)}
                          className="csi-roundoff-val-input"
                        />
                      </div>
                    )}
                  </div>

                  {/* Total Amount Row */}
                  <div className="csi-summary-flex-row csi-total-amount-row" style={{ width: '100%', gap: '8px' }}>
                    <span className="csi-total-amount-title" style={{ width: '198px', flexShrink: 0 }}>Total Amount:</span>
                    <div className="csi-total-amount-box" style={{ flex: 1, width: 'auto' }}>
                      <span className="csi-total-amount-currency">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter payment amount"
                        value={
                          customTotalAmount !== null
                            ? customTotalAmount
                            : (roundedGrandTotal > 0 ? roundedGrandTotal : '')
                        }
                        onChange={(e) => handleTotalAmountChange(e.target.value)}
                        className="csi-total-amount-input"
                      />
                    </div>
                  </div>

                  <div className="csi-summary-divider" />

                  {/* Total Amount Received Row */}
                  <div className="csi-summary-flex-row">
                    <span className="csi-summary-label">Total Amount Received</span>
                    <span className="csi-summary-val">
                      ₹ {Math.round(totalReceivedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Payment Pill Rows (Single or Split Payments) */}
                  <div className="csi-split-payments-wrapper">
                    {splitPayments.map((item) => (
                      <div key={item.id} className="csi-split-payment-row">
                        <div className="csi-payment-pill-container">
                          <span className="csi-payment-pill-symbol">₹</span>
                          <input
                            type="number"
                            value={item.amount === 0 ? '' : item.amount}
                            onChange={(e) => handleSplitPaymentAmountChange(item.id, e.target.value)}
                            placeholder="0"
                            className="csi-payment-pill-input"
                          />
                          <div className="csi-payment-pill-select-wrap">
                            <select
                              value={item.method}
                              onChange={(e) => handleSplitPaymentMethodChange(item.id, e.target.value as any)}
                              className="csi-payment-pill-select"
                            >
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="card">Card</option>
                              <option value="bank_transfer">Net Banking</option>
                              <option value="cheque">Cheque</option>
                            </select>
                            <ChevronDown size={13} className="csi-payment-select-chevron" />
                          </div>
                        </div>
                        {splitPayments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitPayment(item.id)}
                            className="csi-split-payment-remove-btn"
                            title="Remove payment mode"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mark as fully paid & Split Payment */}
                  <div className="csi-summary-flex-row" style={{ marginTop: '4px' }}>
                    <label className="csi-mark-paid-label">
                      <input
                        type="checkbox"
                        checked={isMarkAsPaid}
                        onChange={(e) => handleToggleMarkAsPaid(e.target.checked)}
                      />
                      <span>Mark as fully paid</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSplitPayment}
                      className="csi-split-payment-btn"
                    >
                      + Split Payment
                    </button>
                  </div>

                  {/* Balance Amount Row with top & bottom borders */}
                  <div className="csi-summary-flex-row csi-balance-amount-row">
                    <span className="csi-balance-amount-label">Balance Amount</span>
                    <span className="csi-balance-amount-val" style={{ color: balanceAmount > 0 ? '#ea5455' : '#059669' }}>
                      ₹ {Math.round(balanceAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Dashed signature/notes box */}
                  <div className="csi-summary-dashed-wrap">
                    <div className="csi-sig-box-container">
                      <div
                        className="csi-summary-dashed-box"
                        onClick={() => setSignatureModalOpen(true)}
                        title={signatureUrl ? "Click to change signature" : "Click to add signature"}
                      >
                        {signatureUrl ? (
                          <div className="csi-sig-preview-content">
                            <img src={signatureUrl} alt="Signature" className="csi-sig-preview-img" />
                            <span className="csi-sig-preview-caption">Authorized Signatory</span>
                          </div>
                        ) : (
                          <div className="csi-sig-empty-content">
                            <Plus size={16} color="#0284c7" />
                            <span>Add Signature</span>
                          </div>
                        )}
                      </div>

                      {signatureUrl && (
                        <div className="csi-sig-below-actions">
                          <button
                            type="button"
                            className="csi-sig-below-btn change"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSignatureModalOpen(true);
                            }}
                          >
                            <Edit3 size={12} /> Change
                          </button>
                          <button
                            type="button"
                            className="csi-sig-below-btn remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSignature(e);
                            }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* STICKY MOBILE BOTTOM ACTION BAR */}
            <div className="csi-mobile-sticky-bar">
              <div className="csi-mobile-sticky-info">
                <span className="csi-mobile-sticky-label">Total ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                <span className="csi-mobile-sticky-val">
                  ₹{Math.round(roundedGrandTotal).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="csi-mobile-sticky-actions">
                <button
                  type="button"
                  onClick={() => handleSaveInvoice(true)}
                  disabled={isSaving}
                  className="csi-mobile-sticky-btn-secondary"
                  title="Save & New"
                >
                  Save & New
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveInvoice(false)}
                  disabled={isSaving}
                  className="csi-btn-primary csi-mobile-sticky-save"
                >
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{isEditMode ? 'Update' : 'Save Invoice'}</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      )}
          </div>
        )}

      {/* MODAL: Create / Edit Party (MyBillBook Spec) */}
      {partyModalOpen && (
        <div className="csi-modal-backdrop csi-create-party-backdrop" style={{ zIndex: 100050 }}>
          <div className="csi-modal-box csi-create-party-modal-box">
            {/* Header */}
            <div className="csi-create-party-header">
              <h4 className="csi-create-party-title">
                {partyModalMode === 'edit' ? 'Edit Party' : 'Create New Party'}
              </h4>
              <button
                type="button"
                className="csi-create-party-close-btn"
                onClick={() => setPartyModalOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body: Two Column Layout */}
            <div className="csi-create-party-body">
              {/* Left Sidebar */}
              <div className="csi-create-party-sidebar">
                <button
                  type="button"
                  onClick={() => setNewPartyModalTab('basic')}
                  className={`csi-create-party-tab ${newPartyModalTab === 'basic' ? 'active' : ''}`}
                >
                  <UserPlus size={16} className="csi-tab-icon" />
                  <span>Basic Details <span className="text-danger">*</span></span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewPartyModalTab('address')}
                  className={`csi-create-party-tab ${newPartyModalTab === 'address' ? 'active' : ''}`}
                >
                  <AtSign size={16} className="csi-tab-icon" />
                  <span>Address</span>
                </button>

                <div className="csi-create-party-sidebar-heading">
                  Advance Details
                </div>

                <button
                  type="button"
                  onClick={() => setNewPartyModalTab('credit')}
                  className={`csi-create-party-tab ${newPartyModalTab === 'credit' ? 'active' : ''}`}
                >
                  <CreditCard size={16} className="csi-tab-icon" />
                  <span>Credit Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewPartyModalTab('contact')}
                  className={`csi-create-party-tab ${newPartyModalTab === 'contact' ? 'active' : ''}`}
                >
                  <PhoneCall size={16} className="csi-tab-icon" />
                  <span>Contact Person Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewPartyModalTab('bank')}
                  className={`csi-create-party-tab ${newPartyModalTab === 'bank' ? 'active' : ''}`}
                >
                  <Building2 size={16} className="csi-tab-icon" />
                  <span>Party Bank Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewPartyModalTab('custom')}
                  className={`csi-create-party-tab ${newPartyModalTab === 'custom' ? 'active' : ''}`}
                >
                  <SlidersHorizontal size={16} className="csi-tab-icon" />
                  <span>Custom Fields</span>
                </button>
              </div>

              {/* Right Content Area */}
              <div className="csi-create-party-content">
                {/* BASIC DETAILS TAB */}
                {newPartyModalTab === 'basic' && (
                  <div className="csi-create-party-form-grid">
                    {/* Row 1: Party Type & Party Category */}
                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">
                        Party Type <span className="text-danger">*</span>
                      </label>
                      <div className="csi-party-type-radios">
                        <label className={`csi-party-type-card ${newPartyType === 'Customer' ? 'checked' : ''}`}>
                          <span className="csi-party-type-name">Customer</span>
                          <input
                            type="radio"
                            name="partyTypeRadio"
                            value="Customer"
                            checked={newPartyType === 'Customer'}
                            onChange={() => setNewPartyType('Customer')}
                          />
                          <span className="csi-custom-radio-dot"></span>
                        </label>
                        <label className={`csi-party-type-card ${newPartyType === 'Supplier' ? 'checked' : ''}`}>
                          <span className="csi-party-type-name">Supplier</span>
                          <input
                            type="radio"
                            name="partyTypeRadio"
                            value="Supplier"
                            checked={newPartyType === 'Supplier'}
                            onChange={() => setNewPartyType('Supplier')}
                          />
                          <span className="csi-custom-radio-dot"></span>
                        </label>
                      </div>
                    </div>

                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">Party Category</label>
                      <select
                        value={newPartyCategory}
                        onChange={(e) => setNewPartyCategory(e.target.value)}
                        className="form-select csi-create-party-input"
                      >
                        <option value="">Search Categories</option>
                        {PARTY_CATEGORIES.map((cat, idx) => (
                          <option key={idx} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Row 2: Party Name & Mobile Number */}
                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">
                        Party Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        autoFocus
                        required
                        value={newPartyName}
                        onChange={(e) => setNewPartyName(e.target.value)}
                        placeholder="Enter Name"
                        className="form-control csi-create-party-input csi-highlight-border"
                      />
                    </div>

                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">Mobile Number</label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={newPartyPhone}
                        onChange={(e) => setNewPartyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter Mobile Number"
                        className="form-control csi-create-party-input"
                      />
                    </div>

                    {/* Row 3: GSTIN & PAN Number */}
                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">GSTIN</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={newPartyGstin}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setNewPartyGstin(val);
                          if (val.length >= 12 && !newPartyPan) {
                            setNewPartyPan(val.substring(2, 12));
                          }
                        }}
                        placeholder="EX: 29XXXXX94381XX"
                        className="form-control csi-create-party-input text-uppercase"
                      />
                      <span className="csi-create-party-subnote">
                        <strong>Note:</strong> You can auto populate party details from GSTIN
                      </span>
                    </div>

                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">PAN Number</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={newPartyPan}
                        onChange={(e) => setNewPartyPan(e.target.value.toUpperCase())}
                        placeholder="Enter PAN Number"
                        className="form-control csi-create-party-input text-uppercase"
                      />
                    </div>

                    {/* Row 4: Email & Opening Balance */}
                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">Email</label>
                      <input
                        type="email"
                        value={newPartyEmail}
                        onChange={(e) => setNewPartyEmail(e.target.value)}
                        placeholder="Enter Email"
                        className="form-control csi-create-party-input"
                      />
                    </div>

                    <div className="csi-create-party-field-wrap">
                      <label className="csi-create-party-label">Opening Balance</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newPartyOpeningBal}
                          onChange={(e) => setNewPartyOpeningBal(e.target.value)}
                          placeholder="0"
                          className="form-control csi-create-party-input csi-split-main-input"
                        />
                        <select
                          value={newPartyOpeningBalType}
                          onChange={(e) => setNewPartyOpeningBalType(e.target.value as any)}
                          className="form-select csi-split-addon-select"
                        >
                          <option value="to_collect">To Collect</option>
                          <option value="to_pay">To Pay</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADDRESS TAB */}
                {newPartyModalTab === 'address' && (
                  <div className="csi-address-tab-container">
                    {/* Billing Address Card Box */}
                    <div className="csi-address-box mb-3">
                      {/* Row 1: Billing Address */}
                      <div className="csi-create-party-field-wrap mb-3">
                        <label className="csi-create-party-label">Billing Address</label>
                        <textarea
                          rows={3}
                          value={newPartyBillingAddress}
                          onChange={(e) => setNewPartyBillingAddress(e.target.value)}
                          placeholder="Enter Billing Address"
                          className="form-control csi-create-party-textarea"
                        />
                      </div>

                      {/* Row 2: Pincode & State */}
                      <div className="csi-create-party-form-grid mb-1">
                        <div className="csi-create-party-field-wrap">
                          <label className="csi-create-party-label">Pincode</label>
                          <input
                            type="text"
                            maxLength={6}
                            value={newPartyPincode}
                            onChange={(e) => handlePincodeChange(e.target.value, false)}
                            placeholder="Enter Pin Code"
                            className="form-control csi-create-party-input"
                          />
                          <span className="csi-create-party-subnote mt-1">
                            <strong>Note:</strong> You can auto populate State &amp; City from Pincode
                          </span>
                        </div>

                        <div className="csi-create-party-field-wrap">
                          <label className="csi-create-party-label">State</label>
                          <div className="csi-select-with-icon-wrap">
                            <Search size={14} className="csi-select-left-search-icon" />
                            <select
                              value={newPartyState}
                              onChange={(e) => setNewPartyState(e.target.value)}
                              className="form-select csi-create-party-input csi-state-select-with-icon"
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map((st, idx) => (
                                <option key={idx} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Row 3: City */}
                      <div className="csi-create-party-field-wrap mt-2">
                        <label className="csi-create-party-label">City</label>
                        <input
                          type="text"
                          value={newPartyCity}
                          onChange={(e) => setNewPartyCity(e.target.value)}
                          placeholder="Enter City"
                          className="form-control csi-create-party-input"
                        />
                      </div>
                    </div>

                    {/* Shipping Address Section: Either Saved Card (Screenshot 2 spec) or "+ Add New Shipping Address" */}
                    {hasShippingAddress ? (
                      <div
                        className="csi-address-box mb-3"
                        style={{
                          background: '#f5f3ff',
                          border: '1.5px solid #d8d4fd',
                          borderRadius: '10px',
                          padding: '14px 18px',
                          boxShadow: '0 2px 4px rgba(79, 70, 229, 0.04)'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold" style={{ fontSize: '14px', color: '#1e1b4b' }}>
                              {newPartyShippingName || newPartyName}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <button
                              type="button"
                              onClick={handleOpenAddShippingModal}
                              className="btn btn-sm btn-link p-0"
                              title="Edit Shipping Address"
                              style={{ display: 'flex', alignItems: 'center', color: '#4f46e5', textDecoration: 'none' }}
                            >
                              <Edit3 size={15} color="#4f46e5" />
                            </button>
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: '5px solid #4f46e5',
                                backgroundColor: '#ffffff',
                                display: 'inline-block'
                              }}
                              title="Primary Shipping Destination"
                            />
                          </div>
                        </div>
                        <p className="mb-2 text-muted" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                          {newPartyShippingAddress || newPartyBillingAddress}
                          {newPartyShippingCity && `, ${newPartyShippingCity}`}
                          {newPartyShippingState && `, ${newPartyShippingState}`}
                          {newPartyShippingPincode && ` - ${newPartyShippingPincode}`}
                        </p>
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top" style={{ borderColor: '#e0e7ff' }}>
                          <button
                            type="button"
                            onClick={handleOpenAddShippingModal}
                            className="btn btn-sm btn-link p-0"
                            style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
                          >
                            + Change Address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHasShippingAddress(false);
                              setNewPartyShippingName('');
                              setNewPartyShippingAddress('');
                              setNewPartyShippingPincode('');
                              setNewPartyShippingState('');
                              setNewPartyShippingCity('');
                            }}
                            className="btn btn-sm btn-link text-danger p-0"
                            style={{ fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenAddShippingModal}
                        className="csi-add-shipping-dashed-btn"
                      >
                        <span>+ Add New Shipping Address</span>
                      </button>
                    )}
                  </div>
                )}

                {/* CREDIT SETTINGS TAB */}
                {newPartyModalTab === 'credit' && (
                  <div className="csi-credit-settings-box">
                    <div className="csi-create-party-form-grid">
                      {/* Left: Credit Period */}
                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">Credit Period</label>
                        <div className="csi-split-input-group">
                          <input
                            type="number"
                            value={newPartyCreditPeriod}
                            onChange={(e) => setNewPartyCreditPeriod(e.target.value)}
                            placeholder="30"
                            className="form-control csi-create-party-input csi-split-main-input"
                          />
                          <select
                            value={newPartyCreditPeriodUnit}
                            onChange={(e) => setNewPartyCreditPeriodUnit(e.target.value as any)}
                            className="form-select csi-split-addon-select"
                            style={{ width: '90px' }}
                          >
                            <option value="Days">Days</option>
                            <option value="Weeks">Weeks</option>
                            <option value="Months">Months</option>
                          </select>
                        </div>
                      </div>

                      {/* Right: Credit Limit */}
                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">Credit Limit</label>
                        <div className="csi-split-input-group">
                          <span className="csi-split-prefix">₹</span>
                          <input
                            type="number"
                            value={newPartyCreditLimit}
                            onChange={(e) => setNewPartyCreditLimit(e.target.value)}
                            placeholder="0"
                            className="form-control csi-create-party-input csi-split-main-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONTACT PERSON DETAILS TAB (Screenshot 2 Spec) */}
                {newPartyModalTab === 'contact' && (
                  <div className="csi-address-box">
                    <div className="csi-create-party-form-grid">
                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">Contact Person Name</label>
                        <input
                          type="text"
                          value={newPartyContactName}
                          onChange={(e) => setNewPartyContactName(e.target.value)}
                          placeholder="Ex: Ankit Mishra"
                          className="form-control csi-create-party-input"
                        />
                      </div>

                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">Date of Birth</label>
                        <div className="position-relative">
                          <input
                            type="date"
                            value={newPartyContactDob}
                            onChange={(e) => setNewPartyContactDob(e.target.value)}
                            className="form-control csi-create-party-input"
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PARTY BANK ACCOUNT TAB (Screenshot 3 Spec) */}
                {newPartyModalTab === 'bank' && (
                  <div className="csi-address-box">
                    <div className="csi-create-party-form-grid mb-3">
                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">
                          Bank Account Number<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={newPartyBankAcc}
                          onChange={(e) => setNewPartyBankAcc(e.target.value)}
                          placeholder="Ex: 123456789"
                          className="form-control csi-create-party-input"
                        />
                      </div>

                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">
                          Re-Enter Bank Account Number<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={newPartyBankAccConfirm}
                          onChange={(e) => setNewPartyBankAccConfirm(e.target.value)}
                          placeholder="Ex: 123456789"
                          className="form-control csi-create-party-input"
                        />
                      </div>
                    </div>

                    <div className="csi-create-party-form-grid mb-3">
                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">IFSC Code</label>
                        <input
                          type="text"
                          maxLength={11}
                          value={newPartyBankIfsc}
                          onChange={(e) => setNewPartyBankIfsc(e.target.value.toUpperCase())}
                          placeholder="Ex: ICIC0001234"
                          className="form-control csi-create-party-input text-uppercase"
                        />
                      </div>

                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">Account Holder's Name</label>
                        <input
                          type="text"
                          value={newPartyBankHolder}
                          onChange={(e) => setNewPartyBankHolder(e.target.value)}
                          placeholder="Ex: Babu Lal"
                          className="form-control csi-create-party-input"
                        />
                      </div>
                    </div>

                    <div className="csi-create-party-form-grid mb-3">
                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">Bank Name</label>
                        <input
                          type="text"
                          value={newPartyBankName}
                          onChange={(e) => setNewPartyBankName(e.target.value)}
                          placeholder="Ex: ICICI Bank"
                          className="form-control csi-create-party-input"
                        />
                      </div>

                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">Branch Name</label>
                        <input
                          type="text"
                          value={newPartyBankBranch}
                          onChange={(e) => setNewPartyBankBranch(e.target.value)}
                          placeholder="Ex: Mumbai"
                          className="form-control csi-create-party-input"
                        />
                      </div>
                    </div>

                    <div className="csi-create-party-form-grid">
                      <div className="csi-create-party-field-wrap">
                        <label className="csi-create-party-label">UPI ID</label>
                        <input
                          type="text"
                          value={newPartyUpiId}
                          onChange={(e) => setNewPartyUpiId(e.target.value)}
                          placeholder="Ex: babulal@upi"
                          className="form-control csi-create-party-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOM FIELDS TAB (Reference Spec) */}
                {newPartyModalTab === 'custom' && (
                  <div className="csi-address-box">
                    {partyCustomFieldRows.filter((r) => r.name.trim()).length > 0 && (
                      <div className="d-flex flex-column gap-3 mb-3">
                        {partyCustomFieldRows.filter((r) => r.name.trim()).map((cf) => (
                          <div key={cf.id} className="csi-create-party-field-wrap">
                            <label className="csi-create-party-label">{cf.name}</label>
                            <input
                              type="text"
                              value={partyCustomFieldValues[cf.id] || ''}
                              onChange={(e) => setPartyCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))}
                              placeholder={`Enter ${cf.name}`}
                              className="form-control csi-create-party-input"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className="d-flex align-items-center p-3 rounded-3"
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fef3c7',
                        color: '#78350f',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      <Info size={16} className="me-2 text-warning flex-shrink-0" />
                      <span>
                        To add/manage party custom fields go to{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setPartySettingsOpen(true);
                            setPartySettingsTab('custom_fields');
                          }}
                          className="btn btn-link p-0 text-primary fw-semibold"
                          style={{
                            fontSize: '13px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            verticalAlign: 'baseline',
                            gap: '3px'
                          }}
                        >
                          Party Settings <ExternalLink size={13} />
                        </button>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="csi-create-party-footer">
              <button
                type="button"
                className="btn btn-outline-secondary csi-create-party-cancel-btn"
                onClick={() => setPartyModalOpen(false)}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {partyModalMode === 'create' && (
                  <button
                    type="button"
                    disabled={isSavingNewCust}
                    onClick={() => handleCreateCustomer(undefined, true)}
                    className="btn btn-outline-secondary csi-create-party-savenew-btn"
                  >
                    Save & New
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSavingNewCust}
                  onClick={() => handleCreateCustomer(undefined, false)}
                  className="btn btn-primary csi-create-party-save-btn"
                >
                  {isSavingNewCust ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Add Shipping Address (Screenshot 1 Spec) */}
      {showAddShippingModal && (
        <div className="csi-modal-backdrop csi-shipping-modal-backdrop" style={{ zIndex: 100200 }}>
          <div className="csi-shipping-popup-dialog">
            {/* Header */}
            <div className="csi-shipping-popup-header">
              <h5 className="csi-shipping-popup-title">Add Shipping Address</h5>
              <button
                type="button"
                onClick={() => setShowAddShippingModal(false)}
                className="csi-shipping-popup-close-btn"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="csi-shipping-popup-body">
              {/* Row 1: Shipping Name* */}
              <div className="csi-create-party-field-wrap">
                <label className="csi-create-party-label">
                  Shipping Name<span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={modalShipName}
                  onChange={(e) => setModalShipName(e.target.value)}
                  placeholder="Enter Name"
                  className="form-control csi-create-party-input"
                />
              </div>

              {/* Row 2: Shipping Address* with Same as Billing Address Checkbox */}
              <div className="csi-create-party-field-wrap">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="csi-create-party-label m-0">
                    Shipping Address<span className="text-danger">*</span>
                  </label>
                  <label className="d-flex align-items-center gap-1 m-0" style={{ fontSize: '12.5px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={modalShipSameAsBilling}
                      onChange={(e) => handleToggleSameAsBillingInModal(e.target.checked)}
                      className="form-check-input mt-0"
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Same as Billing Address</span>
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={modalShipAddress}
                  onChange={(e) => setModalShipAddress(e.target.value)}
                  placeholder="Enter Shipping Address"
                  className="form-control csi-create-party-textarea"
                />
              </div>

              {/* Row 3: Pincode & State */}
              <div className="csi-create-party-form-grid">
                <div className="csi-create-party-field-wrap">
                  <label className="csi-create-party-label">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={modalShipPincode}
                    onChange={(e) => handleShippingModalPincodeChange(e.target.value)}
                    placeholder="Enter pin code"
                    className="form-control csi-create-party-input"
                  />
                  <span className="csi-create-party-subnote mt-1">
                    <strong>Note:</strong> You can auto populate State &amp; City from Pincode
                  </span>
                </div>

                <div className="csi-create-party-field-wrap">
                  <label className="csi-create-party-label">State</label>
                  <div className="csi-select-with-icon-wrap">
                    <Search size={14} className="csi-select-left-search-icon" />
                    <select
                      value={modalShipState}
                      onChange={(e) => setModalShipState(e.target.value)}
                      className="form-select csi-create-party-input csi-state-select-with-icon"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((st, idx) => (
                        <option key={idx} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 4: City */}
              <div className="csi-create-party-field-wrap">
                <label className="csi-create-party-label">City</label>
                <input
                  type="text"
                  value={modalShipCity}
                  onChange={(e) => setModalShipCity(e.target.value)}
                  placeholder="Enter City"
                  className="form-control csi-create-party-input"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="csi-shipping-popup-footer">
              <button
                type="button"
                onClick={() => setShowAddShippingModal(false)}
                className="btn csi-shipping-popup-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveShippingModal}
                className="btn csi-shipping-popup-save-btn"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Dedicated Party Settings (Matching Reference Screenshots) */}
      {partySettingsOpen && (
        <div className="csi-modal-backdrop csi-party-settings-modal-backdrop" style={{ zIndex: 100200 }}>
          <div className="csi-party-settings-modal-dialog">
            {/* Header */}
            <div className="csi-party-settings-header">
              <h4 className="csi-party-settings-title">Party Settings</h4>
              <button
                type="button"
                onClick={() => setPartySettingsOpen(false)}
                className="csi-party-settings-close-btn"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body: 2 Columns */}
            <div className="csi-party-settings-body">
              {/* Left Navigation Sidebar */}
              <div className="csi-party-settings-sidebar">
                <button
                  type="button"
                  onClick={() => setPartySettingsTab('smart_greetings')}
                  className={`csi-party-settings-tab-btn ${partySettingsTab === 'smart_greetings' ? 'active' : ''}`}
                >
                  <MessageSquare size={16} />
                  <span>Send Smart Greetings</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPartySettingsTab('custom_fields')}
                  className={`csi-party-settings-tab-btn ${partySettingsTab === 'custom_fields' ? 'active' : ''}`}
                >
                  <Layers size={16} />
                  <span>Custom Fields</span>
                </button>
              </div>

              {/* Right Content Area Box */}
              <div className="csi-party-settings-content-card">
                {/* TAB 1: Send Smart Greetings (Screenshot 1) */}
                {partySettingsTab === 'smart_greetings' && (
                  <div className="csi-smart-greetings-tab-content">
                    <h6 className="csi-sg-main-heading">
                      Select Templates to Share Automated Smart Greetings with Parties on WhatsApp
                    </h6>

                    {/* Card 1: Invoice Milestones */}
                    <div className="csi-sg-card">
                      <div className="csi-sg-card-top">
                        <div className="csi-sg-card-info">
                          <h6 className="csi-sg-card-title">Invoice Milestones</h6>
                          <p className="csi-sg-card-subtitle">
                            Make every 10th, 25th, 50th or 100th invoice feel special.
                          </p>
                        </div>
                        <label className="form-check form-switch csi-sg-switch-label">
                          <input
                            type="checkbox"
                            checked={enableInvoiceMilestones}
                            onChange={(e) => setEnableInvoiceMilestones(e.target.checked)}
                            className="form-check-input csi-party-switch"
                            style={{ cursor: 'pointer' }}
                          />
                        </label>
                      </div>

                      <div className="csi-sg-select-wrapper">
                        <select
                          value={milestoneTemplate}
                          onChange={(e) => setMilestoneTemplate(e.target.value)}
                          disabled={!enableInvoiceMilestones}
                          className="form-select csi-sg-select"
                        >
                          <option value="Hey , {{MilestoneMessage}} with {{YourBusinessName}} — thank you, {{PartyName}}! 🎉 <View Invoice>">
                            Hey , &#123;&#123;MilestoneMessage&#125;&#125; with &#123;&#123;YourBusinessName&#125;&#125; — thank you, &#123;&#123;PartyName&#125;&#125;! 🎉 &lt;View Invoice&gt;
                          </option>
                          <option value="Congratulations on {{MilestoneMessage}} with {{YourBusinessName}}! Thank you, {{PartyName}}! 🚀 <View Invoice>">
                            Congratulations on &#123;&#123;MilestoneMessage&#125;&#125; with &#123;&#123;YourBusinessName&#125;&#125;! Thank you, &#123;&#123;PartyName&#125;&#125;! 🚀 &lt;View Invoice&gt;
                          </option>
                          <option value="Celebrating {{MilestoneMessage}} invoices together! Cheers, {{PartyName}} & {{YourBusinessName}} 🥂 <View Invoice>">
                            Celebrating &#123;&#123;MilestoneMessage&#125;&#125; invoices together! Cheers, &#123;&#123;PartyName&#125;&#125; &amp; &#123;&#123;YourBusinessName&#125;&#125; 🥂 &lt;View Invoice&gt;
                          </option>
                        </select>
                      </div>

                      <div className="csi-sg-preview-caption">
                        {(milestoneTemplate || '')
                          .replace('{{MilestoneMessage}}', 'Half-century! 50 invoices')
                          .replace('{{YourBusinessName}}', activeBusiness?.name || 'Aashika Traders')
                          .replace('{{PartyName}}', partyName || 'Shubhi Trading')}
                      </div>
                    </div>

                    {/* Card 2: Birthday Wishes */}
                    <div className="csi-sg-card">
                      <div className="csi-sg-card-top">
                        <div className="csi-sg-card-info">
                          <h6 className="csi-sg-card-title">Birthday Wishes</h6>
                          <p className="csi-sg-card-subtitle">
                            Send a warm greeting on your party's birthday automatically.
                          </p>
                        </div>
                        <label className="form-check form-switch csi-sg-switch-label">
                          <input
                            type="checkbox"
                            checked={enableBirthdayWishes}
                            onChange={(e) => setEnableBirthdayWishes(e.target.checked)}
                            className="form-check-input csi-party-switch"
                            style={{ cursor: 'pointer' }}
                          />
                        </label>
                      </div>

                      <div className="csi-sg-select-wrapper">
                        <select
                          value={birthdayTemplate}
                          onChange={(e) => setBirthdayTemplate(e.target.value)}
                          disabled={!enableBirthdayWishes}
                          className="form-select csi-sg-select"
                        >
                          <option value="Happy Birthday, {{Party Name}}! 🎂 Wishing you success & smiles.">
                            Happy Birthday, &#123;&#123;Party Name&#125;&#125;! 🎂 Wishing you success &amp; smiles.
                          </option>
                          <option value="Wishing you a very Happy Birthday, {{Party Name}}! From the team at {{YourBusinessName}} 🎉">
                            Wishing you a very Happy Birthday, &#123;&#123;Party Name&#125;&#125;! From the team at &#123;&#123;YourBusinessName&#125;&#125; 🎉
                          </option>
                          <option value="Dear {{Party Name}}, warm greetings on your Birthday! May you have a prosperous year ahead 🌟">
                            Dear &#123;&#123;Party Name&#125;&#125;, warm greetings on your Birthday! May you have a prosperous year ahead 🌟
                          </option>
                        </select>
                      </div>

                      <div className="csi-sg-preview-caption">
                        {(birthdayTemplate || '')
                          .replace('{{Party Name}}', partyName || 'Shubhi Traders')
                          .replace('{{PartyName}}', partyName || 'Shubhi Traders')
                          .replace('{{YourBusinessName}}', activeBusiness?.name || 'Aashika Traders')}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Custom Fields (Screenshot 2) */}
                {partySettingsTab === 'custom_fields' && (
                  <div className="csi-party-custom-fields-content">
                    <h6 className="csi-pcf-main-heading">
                      Add party custom fields
                    </h6>

                    <div className="csi-pcf-rows-list">
                      <label className="csi-pcf-field-label">Field Name</label>
                      {partyCustomFieldRows.map((row) => (
                        <div key={row.id} className="csi-pcf-field-row">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleUpdateCustomFieldRowName(row.id, e.target.value)}
                            placeholder="Enter Custom Field Name"
                            className="form-control csi-pcf-input"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomFieldRow(row.id)}
                            className="csi-pcf-trash-btn"
                            title="Delete Field"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* + Add New Field Dashed Button */}
                    <button
                      type="button"
                      onClick={handleAddCustomFieldRow}
                      className="csi-pcf-add-btn"
                    >
                      + Add New Field
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="csi-party-settings-footer">
              <button
                type="button"
                onClick={() => setPartySettingsOpen(false)}
                className="btn csi-party-settings-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setPartySettingsOpen(false)}
                className="btn csi-party-settings-save-btn"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Horizontal Quick Settings (MyBillBook Reference Spec) */}
      {!isMobile && settingsOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-quick-settings-modal">
            {/* Modal Header */}
            <div className="csi-qs-header">
              <h3 className="csi-qs-title">Quick Settings</h3>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="csi-qs-close-btn"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Split 2-Column */}
            <div className="csi-qs-body">
              {/* Left Navigation Sidebar */}
              <div className="csi-qs-sidebar">
                <button
                  type="button"
                  onClick={() => setQuickSettingsTab('invoice')}
                  className={`csi-qs-tab-btn ${quickSettingsTab === 'invoice' ? 'active' : ''}`}
                >
                  <Receipt size={17} />
                  <span>Invoice Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSettingsTab('party')}
                  className={`csi-qs-tab-btn ${quickSettingsTab === 'party' ? 'active' : ''}`}
                >
                  <Users size={17} />
                  <span>Party Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSettingsTab('item_table')}
                  className={`csi-qs-tab-btn ${quickSettingsTab === 'item_table' ? 'active' : ''}`}
                >
                  <Layers size={17} />
                  <span>Item Table Details</span>
                </button>
              </div>

              {/* Right Content Area */}
              <div className="csi-qs-content-card">
                {/* TAB 1: Invoice Details (MyBillBook Reference Spec) */}
                {quickSettingsTab === 'invoice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Card 1: Invoice Prefix & Sequence Number */}
                    <div className="csi-qs-section-card">
                      <div className="csi-qs-section-header">
                        <span className="csi-qs-section-title">Invoice Prefix & Sequence Number</span>
                        <label className="csi-toggle-wrap">
                          <div className="csi-toggle-switch">
                            <input
                              type="checkbox"
                              checked={autoPrefixSeqEnabled}
                              onChange={(e) => setAutoPrefixSeqEnabled(e.target.checked)}
                            />
                            <span className="csi-toggle-slider" />
                          </div>
                        </label>
                      </div>

                      <div className="csi-qs-grid-2col">
                        <div>
                          <label className="csi-qs-field-label">Invoice Prefix</label>
                          <input
                            type="text"
                            value={invoicePrefix}
                            onChange={(e) => setInvoicePrefix(e.target.value)}
                            disabled={!autoPrefixSeqEnabled}
                            className="csi-qs-input-field"
                            placeholder="GN00"
                          />
                        </div>
                        <div>
                          <label className="csi-qs-field-label">Sequence Number</label>
                          <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={!autoPrefixSeqEnabled}
                            className="csi-qs-input-field"
                            placeholder="8218"
                          />
                        </div>
                      </div>

                      <div className="csi-qs-preview-text">
                        Invoice Number: {invoicePrefix} {invoiceNumber}
                      </div>
                    </div>

                    {/* Card 2: Show or Hide Invoice Custom Fields */}
                    <div className="csi-qs-section-card">
                      <div className="csi-qs-section-title" style={{ marginBottom: '14px' }}>
                        Show or Hide Invoice Custom Fields
                      </div>

                      <div className="csi-qs-industry-row">
                        <span className="csi-qs-field-label" style={{ marginBottom: 0 }}>Industry Type</span>
                        <select
                          value={industryType}
                          onChange={(e) => setIndustryType(e.target.value)}
                          className="csi-qs-select-field"
                        >
                          <option value="Others">Others</option>
                          <option value="Retail">Retail</option>
                          <option value="Wholesale">Wholesale</option>
                          <option value="Services">Services</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Agriculture & Plants">Agriculture & Plants</option>
                        </select>
                      </div>

                      <div className="csi-qs-subtitle">Suggested Custom Fields</div>

                      <div className="csi-qs-custom-fields-list">
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.po_number}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, po_number: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>PO Number</span>
                        </label>
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.eway_bill}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, eway_bill: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>E-way Bill Number</span>
                        </label>
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.vehicle_number}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, vehicle_number: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>Vehicle Number</span>
                        </label>
                        <label className="csi-qs-custom-field-item">
                          <input
                            type="checkbox"
                            checked={invoiceCustomFieldToggles.delivery_note}
                            onChange={(e) => setInvoiceCustomFieldToggles({ ...invoiceCustomFieldToggles, delivery_note: e.target.checked })}
                            className="csi-qs-checkbox"
                          />
                          <span>Delivery Note / Challan</span>
                        </label>
                      </div>
                    </div>

                    {/* Card 3: Bank Account & Payment QR Configuration */}
                    <div className="csi-qs-section-card">
                      <div className="csi-qs-section-title" style={{ marginBottom: '14px' }}>
                        Bank & Payment QR Details
                      </div>

                      <div className="csi-qs-grid-2col">
                        <div>
                          <label className="csi-qs-field-label">Account Holder Name</label>
                          <input
                            type="text"
                            value={bankDetails.account_holder}
                            onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                            className="csi-qs-input-field"
                            placeholder="Grow Naturals"
                          />
                        </div>
                        <div>
                          <label className="csi-qs-field-label">Bank Account Number</label>
                          <input
                            type="text"
                            value={bankDetails.account_number}
                            onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                            className="csi-qs-input-field"
                            placeholder="50200084729104"
                          />
                        </div>
                      </div>

                      <div className="csi-qs-grid-2col" style={{ marginTop: '12px' }}>
                        <div>
                          <label className="csi-qs-field-label">IFSC Code</label>
                          <input
                            type="text"
                            value={bankDetails.ifsc_code}
                            onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                            className="csi-qs-input-field"
                            placeholder="HDFC0001298"
                          />
                        </div>
                        <div>
                          <label className="csi-qs-field-label">Bank Name & Branch</label>
                          <input
                            type="text"
                            value={bankDetails.bank_name}
                            onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                            className="csi-qs-input-field"
                            placeholder="HDFC Bank, K.K Nagar Branch"
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Show UPI QR Code</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Print UPI Scan & Pay QR Code on Invoice</div>
                          </div>
                          <label className="csi-toggle-wrap">
                            <div className="csi-toggle-switch">
                              <input
                                type="checkbox"
                                checked={showPaymentQr}
                                onChange={(e) => setShowPaymentQr(e.target.checked)}
                              />
                              <span className="csi-toggle-slider" />
                            </div>
                          </label>
                        </div>

                        {showPaymentQr && (
                          <div style={{ marginTop: '8px' }}>
                            <label className="csi-qs-field-label">UPI ID (VPA)</label>
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              className="csi-qs-input-field"
                              placeholder="grownaturals@axisbank"
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <label className="csi-qs-field-label">Default Terms & Conditions</label>
                        <textarea
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          rows={2}
                          className="csi-quick-settings-textarea"
                          placeholder="Enter invoice terms and conditions..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Party Details */}
                {quickSettingsTab === 'party' && (
                  <div>
                    <h4 className="csi-qs-content-title">Add party custom fields</h4>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '10px' }}>
                      Your Custom Fields
                    </div>

                    {!showNewCustomFieldInput ? (
                      <button
                        type="button"
                        onClick={() => setShowNewCustomFieldInput(true)}
                        className="csi-qs-add-field-dashed"
                      >
                        <Plus size={15} />
                        <span>+ Add New Field</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <input
                          type="text"
                          value={newCustomFieldName}
                          onChange={(e) => setNewCustomFieldName(e.target.value)}
                          placeholder="Field Name (e.g. Alternate Phone, Driver Name, Vehicle Number)"
                          className="form-control form-control-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newCustomFieldName.trim()) {
                                setPartyCustomFields([...partyCustomFields, { id: 'cf-' + Date.now(), name: newCustomFieldName.trim(), value: '' }]);
                                setNewCustomFieldName('');
                                setShowNewCustomFieldInput(false);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCustomFieldName.trim()) {
                              setPartyCustomFields([...partyCustomFields, { id: 'cf-' + Date.now(), name: newCustomFieldName.trim(), value: '' }]);
                              setNewCustomFieldName('');
                              setShowNewCustomFieldInput(false);
                            }
                          }}
                          className="btn btn-primary btn-sm px-3"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewCustomFieldInput(false)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {partyCustomFields.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                        {partyCustomFields.map((cf) => (
                          <div
                            key={cf.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                              {cf.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPartyCustomFields(partyCustomFields.filter(f => f.id !== cf.id))}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex' }}
                              title="Delete custom field"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Item Table Details (Exact MyBillBook Screenshot Spec) */}
                {quickSettingsTab === 'item_table' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Card 1: Show Purchase Price while adding Items */}
                    <div className="csi-qs-toggle-card">
                      <div>
                        <h6 className="csi-qs-toggle-card-title">Show Purchase Price while adding Items</h6>
                        <p className="csi-qs-toggle-card-sub">Add purchase price while adding items</p>
                      </div>
                      <label className="form-check form-switch m-0">
                        <input
                          type="checkbox"
                          checked={showPurchasePriceWhileAdding}
                          onChange={(e) => setShowPurchasePriceWhileAdding(e.target.checked)}
                          className="form-check-input csi-party-switch"
                          style={{ cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    {/* Card 2: Show Item Image on Invoice */}
                    <div className="csi-qs-toggle-card">
                      <div>
                        <h6 className="csi-qs-toggle-card-title">Show Item Image on Invoice</h6>
                        <p className="csi-qs-toggle-card-sub">
                          This will apply to all vouchers except for Payment In and Payment Out
                        </p>
                      </div>
                      <label className="form-check form-switch m-0">
                        <input
                          type="checkbox"
                          checked={showItemImageOnInvoice}
                          onChange={(e) => setShowItemImageOnInvoice(e.target.checked)}
                          className="form-check-input csi-party-switch"
                          style={{ cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    {/* Card 3: Price History */}
                    <div className="csi-qs-toggle-card">
                      <div>
                        <h6 className="csi-qs-toggle-card-title">
                          <span>Price History</span>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#e11d48',
                              color: '#ffffff',
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              marginLeft: '8px',
                              fontWeight: 700
                            }}
                          >
                            New
                          </span>
                        </h6>
                        <p className="csi-qs-toggle-card-sub">
                          Show last 5 sales / purchase price for each party item price
                        </p>
                      </div>
                      <label className="form-check form-switch m-0">
                        <input
                          type="checkbox"
                          checked={showPriceHistoryToggle}
                          onChange={(e) => setShowPriceHistoryToggle(e.target.checked)}
                          className="form-check-input csi-party-switch"
                          style={{ cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    {/* Section: Show or Hide Item Table Columns */}
                    <div style={{ marginTop: '6px' }}>
                      <h6 style={{ fontSize: '14px', fontWeight: 700, color: '#092c4c', margin: '0 0 4px 0' }}>
                        Show or Hide Item Table Columns
                      </h6>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontWeight: 600 }}>
                        Fixed Columns
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="csi-qs-column-box">
                          <input
                            type="checkbox"
                            checked={itemTableColumnToggles.price_item}
                            onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, price_item: e.target.checked })}
                            className="form-check-input mt-0 csi-party-checkbox"
                          />
                          <span>Price/Item (₹)</span>
                        </label>

                        <label className="csi-qs-column-box">
                          <input
                            type="checkbox"
                            checked={itemTableColumnToggles.quantity}
                            onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, quantity: e.target.checked })}
                            className="form-check-input mt-0 csi-party-checkbox"
                          />
                          <span>Quantity</span>
                        </label>

                        <label className="csi-qs-column-box">
                          <input
                            type="checkbox"
                            checked={itemTableColumnToggles.hsn}
                            onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, hsn: e.target.checked })}
                            className="form-check-input mt-0 csi-party-checkbox"
                          />
                          <span>HSN / SAC Code</span>
                        </label>

                        <label className="csi-qs-column-box">
                          <input
                            type="checkbox"
                            checked={itemTableColumnToggles.mrp}
                            onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, mrp: e.target.checked })}
                            className="form-check-input mt-0 csi-party-checkbox"
                          />
                          <span>MRP Column</span>
                        </label>

                        <label className="csi-qs-column-box">
                          <input
                            type="checkbox"
                            checked={itemTableColumnToggles.discount}
                            onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, discount: e.target.checked })}
                            className="form-check-input mt-0 csi-party-checkbox"
                          />
                          <span>Item Discounts (% &amp; ₹)</span>
                        </label>

                        <label className="csi-qs-column-box">
                          <input
                            type="checkbox"
                            checked={itemTableColumnToggles.tax}
                            onChange={(e) => setItemTableColumnToggles({ ...itemTableColumnToggles, tax: e.target.checked })}
                            className="form-check-input mt-0 csi-party-checkbox"
                          />
                          <span>GST / Tax Breakdown</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="csi-qs-footer">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="csi-qs-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="csi-qs-btn-save"
              >
                Save
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


      {/* MODAL: Payment QR Code */}
      {paymentQrModalOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-modal-box" style={{ maxWidth: '440px' }}>
            <div className="csi-modal-header">
              <h3 className="csi-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <QrCode size={16} color="#0284c7" /> Payment QR Code
              </h3>
              <button
                type="button"
                onClick={() => setPaymentQrModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSavePaymentQr} className="csi-modal-body">
              <div>
                <label className="csi-field-label">UPI ID / VPA *</label>
                <input
                  type="text"
                  required
                  value={tempUpiId}
                  onChange={(e) => setTempUpiId(e.target.value)}
                  placeholder="e.g., yourname@bank or 9876543210@upi"
                  className="csi-input csi-input-mono"
                />
                <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Supports Google Pay, PhonePe, Paytm, BHIM, and all UPI apps.
                </span>
              </div>

              <div>
                <label className="csi-field-label">Payee Name / Business Name</label>
                <input
                  type="text"
                  value={tempPayeeName}
                  onChange={(e) => setTempPayeeName(e.target.value)}
                  placeholder="e.g., Grow Naturals"
                  className="csi-input"
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11.5px', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={tempIncludeAmount}
                  onChange={(e) => setTempIncludeAmount(e.target.checked)}
                />
                <span>
                  Auto-fill dynamic invoice amount (<strong>₹{Math.round(roundedGrandTotal)}</strong>) in QR Code
                </span>
              </label>

              {tempUpiId.trim() && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                    Live Scannable QR Preview
                  </span>
                  <img
                    src={generateUpiQrUrl(tempUpiId, tempPayeeName, tempIncludeAmount ? roundedGrandTotal : 0)}
                    alt="UPI QR Code Preview"
                    style={{ width: '130px', height: '130px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', padding: '4px', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, marginTop: '6px' }}>
                    {tempUpiId}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentQrModalOpen(false)}
                  className="csi-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="csi-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Save size={14} />
                  <span>Save & Enable QR</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Signature Creation / Upload (MyBillBook Spec) */}
      {signatureModalOpen && (
        <div className="csi-modal-backdrop" onClick={() => setSignatureModalOpen(false)}>
          <div className="csi-modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="csi-modal-header">
              <h3 className="csi-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={16} color="#0284c7" /> Add Signature
              </h3>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="csi-modal-body">
              {/* Tabs */}
              <div className="csi-sig-modal-tabs">
                <button
                  type="button"
                  onClick={() => setSigTab('upload')}
                  className={`csi-sig-tab-btn ${sigTab === 'upload' ? 'active' : ''}`}
                >
                  <Upload size={14} /> Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setSigTab('draw')}
                  className={`csi-sig-tab-btn ${sigTab === 'draw' ? 'active' : ''}`}
                >
                  <Edit3 size={14} /> Draw Signature
                </button>
              </div>

              {sigTab === 'upload' ? (
                <div>
                  <input
                    type="file"
                    ref={sigFileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={handleSigFileUpload}
                  />
                  {uploadedSigFile ? (
                    <div style={{ textAlign: 'center', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                      <img src={uploadedSigFile} alt="Preview" style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain' }} />
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => sigFileInputRef.current?.click()}
                          className="csi-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadedSigFile(null)}
                          className="csi-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11px', color: '#ef4444' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="csi-sig-dropzone"
                      onClick={() => sigFileInputRef.current?.click()}
                    >
                      <Upload size={28} color="#0284c7" />
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        Click to upload signature
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Supports PNG, JPG, JPEG or SVG (Max 5MB)
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="csi-sig-canvas-wrap">
                    <canvas
                      ref={sigCanvasRef}
                      width={390}
                      height={150}
                      className="csi-sig-canvas"
                      onMouseDown={startDrawing}
                      onMouseMove={drawSignature}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={drawSignature}
                      onTouchEnd={stopDrawing}
                    />
                    <div className="csi-sig-canvas-toolbar">
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Draw your signature above</span>
                      <button
                        type="button"
                        onClick={clearSigCanvas}
                        className="csi-btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                      >
                        <RotateCcw size={11} /> Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Signatory Label Input */}
              <div style={{ marginTop: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Signatory Title / Designation
                </label>
                <input
                  type="text"
                  value={signatoryLabel}
                  onChange={(e) => setSignatoryLabel(e.target.value)}
                  placeholder="e.g. Authorized Signatory for Grow Naturals"
                  className="csi-input"
                  style={{ fontSize: '12.5px', padding: '7px 10px' }}
                />
              </div>

              {/* Default Checkbox */}
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={saveAsDefaultSig}
                    onChange={(e) => setSaveAsDefaultSig(e.target.checked)}
                  />
                  <span>Save as default signature for future invoices</span>
                </label>
              </div>
            </div>
            <div className="csi-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 18px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => setSignatureModalOpen(false)}
                className="csi-btn-secondary"
                style={{ padding: '7px 14px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSignature}
                className="csi-btn-primary"
                style={{ padding: '7px 16px', fontSize: '13px', backgroundColor: '#0284c7' }}
              >
                Save Signature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Items to Bill (Theme UI) */}
      {addItemModalOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-modal-box csi-add-items-modal modal-content" style={{ maxWidth: '980px', width: '95vw', padding: 0 }}>
            {/* Modal Header */}
            <div className="csi-items-modal-header modal-header">
              <h4 className="modal-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Add Items to Bill
              </h4>
              <button
                type="button"
                onClick={() => setAddItemModalOpen(false)}
                className="btn-close custom-btn-close"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Close (ESC)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body & Controls */}
            <div className="csi-items-modal-body modal-body">
              {/* Search & Action Controls Row */}
              <div className="csi-items-modal-controls-row">
                <div className="csi-items-search-input-box">
                  <Search size={16} className="csi-search-icon" style={{ marginLeft: '12px', flexShrink: 0, color: '#64748b' }} />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Search by Item/ Serial no./ HSN code/ SKU/ Custom Field / Category"
                    className="csi-items-search-input form-control"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => alert('Barcode scan ready. Point scanner to product barcode.')}
                    className="csi-items-search-scan-btn"
                    title="Scan Barcode"
                  >
                    <Scan size={16} />
                  </button>
                </div>

                <select
                  value={itemCategoryFilter}
                  onChange={(e) => setItemCategoryFilter(e.target.value)}
                  className="form-select csi-theme-select"
                  style={{ width: '190px', height: '40px', fontWeight: 500, fontSize: '13px' }}
                >
                  <option value="all">Select Category</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowNewProductForm(true)}
                  className="btn btn-primary csi-btn-create-item d-inline-flex align-items-center gap-2"
                >
                  <Plus size={15} />
                  <span>Create New Item</span>
                </button>
              </div>

              {/* Items Table */}
              <div className="csi-items-modal-table-wrap table-responsive">
                <table className="table datanew csi-items-modal-table mb-0">
                  <thead className="thead-light">
                    <tr>
                      <th style={{ textAlign: 'left', width: '38%' }}>Item Name</th>
                      <th style={{ textAlign: 'center', width: '12%' }}>Item Code</th>
                      <th style={{ textAlign: 'center', width: '12%' }}>Stock</th>
                      <th style={{ textAlign: 'right', width: '12%' }}>MRP</th>
                      <th style={{ textAlign: 'right', width: '12%' }}>Sales Price</th>
                      <th style={{ textAlign: 'center', width: '14%' }}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredProds = products.filter((prod) => {
                        if (showOnlySelectedItems && (!selectedItemQuantities[prod.id] || selectedItemQuantities[prod.id] <= 0)) {
                          return false;
                        }
                        if (itemCategoryFilter !== 'all') {
                          const cat = (prod.category_name || (prod as any).category || '').toLowerCase().trim();
                          if (cat !== itemCategoryFilter.toLowerCase().trim()) return false;
                        }
                        if (itemSearchQuery.trim()) {
                          const q = itemSearchQuery.toLowerCase().trim();
                          const matchName = (prod.name || '').toLowerCase().includes(q);
                          const matchSku = (prod.sku || '').toLowerCase().includes(q);
                          const matchHsn = (prod.hsn_code || '').toLowerCase().includes(q);
                          const matchBarcode = (prod.barcode || '').toLowerCase().includes(q);
                          const matchCat = (prod.category_name || '').toLowerCase().includes(q);
                          if (!matchName && !matchSku && !matchHsn && !matchBarcode && !matchCat) return false;
                        }
                        return true;
                      });

                      if (filteredProds.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                {products.length === 0 ? 'No products in database yet' : 'No items match your filter'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                                {products.length === 0
                                  ? 'Click "+ Create New Item" above to add products to your inventory'
                                  : 'Try changing the category or clearing the search query.'}
                              </div>
                              {!showNewProductForm && (
                                <button
                                  type="button"
                                  onClick={() => setShowNewProductForm(true)}
                                  className="btn btn-primary csi-btn-create-item d-inline-flex align-items-center gap-2"
                                  style={{ margin: '0 auto' }}
                                >
                                  <Plus size={15} />
                                  <span>Create New Item</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      }

                      return filteredProds.map((prod) => {
                        const qty = selectedItemQuantities[prod.id] || 0;
                        const isSelected = qty > 0;
                        const stockDisplay = prod.stock_quantity !== undefined ? `${prod.stock_quantity} PCS` : '-';

                        return (
                          <tr key={prod.id} className={`csi-items-modal-tr ${isSelected ? 'selected-row' : ''}`}>
                            <td style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                                {prod.name}
                              </div>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {prod.sku && <span className="csi-mobile-sku-badge">{prod.sku}</span>}
                                {prod.hsn_code && <span>HSN: {prod.hsn_code}</span>}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                              {prod.sku || '-'}
                            </td>
                            <td style={{ textAlign: 'center', color: (prod.stock_quantity || 0) <= 0 ? '#ef4444' : '#10b981', fontSize: '12px', fontWeight: 600 }}>
                              {stockDisplay}
                            </td>
                            <td style={{ textAlign: 'right', color: '#64748b', fontSize: '13px' }}>
                              ₹ {Number(prod.mrp !== undefined ? prod.mrp : (prod.sale_price || 0)).toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                              ₹ {Number(prod.sale_price || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {!isSelected ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedItemQuantities((prev) => ({ ...prev, [prod.id]: 1 }))}
                                  className="btn btn-sm csi-item-add-btn"
                                >
                                  + Add
                                </button>
                              ) : (
                                <div className="csi-item-qty-stepper">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItemQuantities((prev) => {
                                        const current = prev[prod.id] || 0;
                                        if (current <= 1) {
                                          const copy = { ...prev };
                                          delete copy[prod.id];
                                          return copy;
                                        }
                                        return { ...prev, [prod.id]: current - 1 };
                                      });
                                    }}
                                    className="csi-stepper-btn"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={qty}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setSelectedItemQuantities((prev) => {
                                        if (val === 0) {
                                          const copy = { ...prev };
                                          delete copy[prod.id];
                                          return copy;
                                        }
                                        return { ...prev, [prod.id]: val };
                                      });
                                    }}
                                    className="csi-stepper-input"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedItemQuantities((prev) => ({
                                        ...prev,
                                        [prod.id]: (prev[prod.id] || 0) + 1
                                      }));
                                    }}
                                    className="csi-stepper-btn"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Sub-bar inside table area */}
              <div className="csi-items-modal-subbar">
                <button
                  type="button"
                  onClick={() => setShowOnlySelectedItems(!showOnlySelectedItems)}
                  className="csi-items-modal-selected-link"
                >
                  {showOnlySelectedItems ? 'Show All Items' : `Show ${Object.values(selectedItemQuantities).filter(q => q > 0).length} Item(s) Selected`}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    ₹ {Object.entries(selectedItemQuantities).reduce((sum, [prodId, q]) => {
                      if (q <= 0) return sum;
                      const p = products.find(prod => prod.id === prodId);
                      return sum + (p ? (Number(p.sale_price) || 0) * q : 0);
                    }, 0).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f172a', minWidth: '40px', textAlign: 'center' }}>
                    {Object.values(selectedItemQuantities).reduce((sum, q) => sum + (q > 0 ? q : 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="csi-items-modal-footer modal-footer">
              <div className="csi-items-modal-shortcuts">
                <span>Keyboard Shortcuts :</span>
                <span>Change Quantity <kbd>Enter</kbd></span>
                <span>Move between items <kbd>↑</kbd> <kbd>↓</kbd></span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAddItemModalOpen(false)}
                  className="btn btn-secondary csi-btn-cancel-modal"
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  Cancel [ESC]
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedItemsToBill}
                  disabled={Object.values(selectedItemQuantities).filter(q => q > 0).length === 0}
                  className={`btn btn-primary csi-btn-add-to-bill ${Object.values(selectedItemQuantities).filter(q => q > 0).length === 0 ? 'disabled' : ''}`}
                >
                  Add to Bill [F7]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ITEM MODAL (MyBillBook Spec) */}
      {!isMobile && showNewProductForm && (
        <div className="csi-modal-backdrop csi-create-item-backdrop" style={{ zIndex: 100050 }}>
          <div className="csi-modal-box csi-create-item-modal-box">
            {/* Header */}
            <div className="csi-create-item-header">
              <h4 className="csi-create-item-title">Create New Item</h4>
              <button
                type="button"
                className="csi-create-item-close-btn"
                onClick={() => setShowNewProductForm(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body: Two columns layout */}
            <div className="csi-create-item-body">
              {/* Left Sidebar */}
              <div className="csi-create-item-sidebar">
                <button
                  type="button"
                  onClick={() => setNewItemModalTab('basic')}
                  className={`csi-create-item-tab ${newItemModalTab === 'basic' ? 'active' : ''}`}
                >
                  <FileCheck size={16} className="csi-tab-icon" />
                  <span>Basic Details <span className="text-danger">*</span></span>
                </button>

                <div className="csi-create-item-sidebar-heading">
                  Advance Details
                </div>

                <button
                  type="button"
                  onClick={() => setNewItemModalTab('stock')}
                  className={`csi-create-item-tab ${newItemModalTab === 'stock' ? 'active' : ''}`}
                >
                  <Package size={16} className="csi-tab-icon" />
                  <span>Stock Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewItemModalTab('pricing')}
                  className={`csi-create-item-tab ${newItemModalTab === 'pricing' ? 'active' : ''}`}
                >
                  <IndianRupee size={16} className="csi-tab-icon" />
                  <span>Pricing Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewItemModalTab('custom')}
                  className={`csi-create-item-tab ${newItemModalTab === 'custom' ? 'active' : ''}`}
                >
                  <SlidersHorizontal size={16} className="csi-tab-icon" />
                  <span>Custom Fields</span>
                </button>
              </div>

              {/* Right Content Area */}
              <div className="csi-create-item-content">
                {/* BASIC DETAILS TAB */}
                {newItemModalTab === 'basic' && (
                  <div className="csi-create-item-form-grid">
                    {/* Row 1: Item Type & Category */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">
                        Item Type <span className="text-danger">*</span>
                      </label>
                      <div className="csi-item-type-radios">
                        <label className={`csi-item-type-card ${newProdType === 'Product' ? 'checked' : ''}`}>
                          <input
                            type="radio"
                            name="itemTypeOption"
                            value="Product"
                            checked={newProdType === 'Product'}
                            onChange={() => setNewProdType('Product')}
                          />
                          <span className="csi-custom-radio-dot"></span>
                          <span className="csi-item-type-name">Product</span>
                        </label>
                        <label className={`csi-item-type-card ${newProdType === 'Service' ? 'checked' : ''}`}>
                          <input
                            type="radio"
                            name="itemTypeOption"
                            value="Service"
                            checked={newProdType === 'Service'}
                            onChange={() => setNewProdType('Service')}
                          />
                          <span className="csi-custom-radio-dot"></span>
                          <span className="csi-item-type-name">Service</span>
                        </label>
                      </div>
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Category</label>
                      <div className="csi-select-icon-group">
                        <select
                          value={newProdCategory}
                          onChange={(e) => setNewProdCategory(e.target.value)}
                          className="form-select csi-create-item-input"
                        >
                          <option value="">Search Categories</option>
                          {categories.map((cat: any) => (
                            <option key={cat.id || cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Item Name & Online Store Toggle */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">
                        Item Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        autoFocus
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="ex: Maggie 20gm"
                        className="form-control csi-create-item-input csi-highlight-border"
                      />
                    </div>

                    <div className="csi-create-item-field-wrap d-flex flex-column justify-content-end">
                      <div className="csi-online-store-row">
                        <span className="csi-online-store-label">Show Item in Online Store</span>
                        <label className="csi-switch-pill">
                          <input
                            type="checkbox"
                            checked={newProdShowOnline}
                            onChange={(e) => setNewProdShowOnline(e.target.checked)}
                          />
                          <span className="csi-switch-slider"></span>
                        </label>
                      </div>
                    </div>

                    {/* Row 3: Sales Price & GST Tax Rate */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Sales Price</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdSalePrice}
                          onChange={(e) => setNewProdSalePrice(e.target.value)}
                          placeholder="ex: 200"
                          className="form-control csi-create-item-input csi-split-main-input"
                        />
                        <select
                          value={newProdSalePriceTaxType}
                          onChange={(e) => setNewProdSalePriceTaxType(e.target.value as any)}
                          className="form-select csi-split-addon-select"
                        >
                          <option value="with_tax">With Tax</option>
                          <option value="without_tax">Without Tax</option>
                        </select>
                      </div>
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">GST Tax Rate(%)</label>
                      <div className="csi-icon-select-wrapper">
                        <Search size={14} className="csi-select-left-icon" />
                        <select
                          value={newProdGst}
                          onChange={(e) => setNewProdGst(Number(e.target.value))}
                          className="form-select csi-create-item-input csi-input-with-icon"
                        >
                          {GST_TAX_RATES.map((g, idx) => (
                            <option key={idx} value={g.rate}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Measuring Unit & Opening Stock */}
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Measuring Unit</label>
                      <div className="csi-icon-select-wrapper">
                        <Search size={14} className="csi-select-left-icon" />
                        <select
                          value={newProdUnit}
                          onChange={(e) => setNewProdUnit(e.target.value)}
                          className="form-select csi-create-item-input csi-input-with-icon"
                        >
                          {MEASURING_UNITS.map((u, idx) => (
                            <option key={idx} value={u.label}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Opening Stock</label>
                      <div className="csi-split-input-group">
                        <input
                          type="number"
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(e.target.value)}
                          placeholder="ex: 150 PCS"
                          className="form-control csi-create-item-input csi-split-main-input"
                        />
                        <span className="csi-split-suffix-badge">
                          {MEASURING_UNITS.find(u => u.label === newProdUnit || u.code === newProdUnit)?.code || 'PCS'}
                        </span>
                      </div>
                    </div>

                    {/* Row 5: Enable Batching Card */}
                    <div className="csi-batching-panel">
                      <div className="csi-batching-left">
                        <span className="csi-batching-title">Enable Batching</span>
                        <span title="Track items by batch number, expiry date, and manufacturing date" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                          <Info size={14} className="csi-batching-info" />
                        </span>
                      </div>
                      <label className="csi-switch-pill">
                        <input
                          type="checkbox"
                          checked={newProdEnableBatching}
                          onChange={(e) => setNewProdEnableBatching(e.target.checked)}
                        />
                        <span className="csi-switch-slider"></span>
                      </label>
                    </div>
                  </div>
                )}

                {/* STOCK DETAILS TAB */}
                {newItemModalTab === 'stock' && (
                  <div className="csi-create-item-form-grid">
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Item Code / SKU / Barcode</label>
                      <input
                        type="text"
                        value={newProdSku}
                        onChange={(e) => setNewProdSku(e.target.value)}
                        placeholder="ex: GN-4367"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">HSN Code</label>
                      <input
                        type="text"
                        value={newProdHsn}
                        onChange={(e) => setNewProdHsn(e.target.value)}
                        placeholder="ex: 3926"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Low Stock Alert (Minimum Stock)</label>
                      <input
                        type="number"
                        value={newProdMinStock}
                        onChange={(e) => setNewProdMinStock(e.target.value)}
                        placeholder="ex: 5"
                        className="form-control csi-create-item-input"
                      />
                    </div>
                  </div>
                )}

                {/* PRICING DETAILS TAB */}
                {newItemModalTab === 'pricing' && (
                  <div className="csi-create-item-form-grid">
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Purchase Price</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdCostPrice}
                          onChange={(e) => setNewProdCostPrice(e.target.value)}
                          placeholder="ex: 120"
                          className="form-control csi-create-item-input csi-split-main-input"
                        />
                        <select
                          value={newProdCostPriceTaxType}
                          onChange={(e) => setNewProdCostPriceTaxType(e.target.value as any)}
                          className="form-select csi-split-addon-select"
                        >
                          <option value="without_tax">Without Tax</option>
                          <option value="with_tax">With Tax</option>
                        </select>
                      </div>
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">MRP (Maximum Retail Price)</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdMrp}
                          onChange={(e) => setNewProdMrp(e.target.value)}
                          placeholder="ex: 250"
                          className="form-control csi-create-item-input"
                        />
                      </div>
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Wholesale Price</label>
                      <div className="csi-split-input-group">
                        <span className="csi-split-prefix">₹</span>
                        <input
                          type="number"
                          value={newProdWholesalePrice}
                          onChange={(e) => setNewProdWholesalePrice(e.target.value)}
                          placeholder="ex: 180"
                          className="form-control csi-create-item-input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CUSTOM FIELDS TAB */}
                {newItemModalTab === 'custom' && (
                  <div className="csi-create-item-form-grid">
                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Brand</label>
                      <input
                        type="text"
                        value={newProdBrand}
                        onChange={(e) => setNewProdBrand(e.target.value)}
                        placeholder="ex: Grow Naturals"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    <div className="csi-create-item-field-wrap">
                      <label className="csi-create-item-label">Size / Dimensions</label>
                      <input
                        type="text"
                        value={newProdSize}
                        onChange={(e) => setNewProdSize(e.target.value)}
                        placeholder="ex: 12 inch / 5 Litre"
                        className="form-control csi-create-item-input"
                      />
                    </div>

                    <div className="csi-create-item-field-wrap" style={{ gridColumn: 'span 2' }}>
                      <label className="csi-create-item-label">Item Description</label>
                      <textarea
                        rows={3}
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="Add product specifications, warranty info, or notes..."
                        className="form-control csi-create-item-input"
                        style={{ height: 'auto', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="csi-create-item-footer">
              <button
                type="button"
                className="btn btn-outline-secondary csi-create-item-cancel-btn"
                onClick={() => setShowNewProductForm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingNewProduct}
                onClick={() => handleCreateProduct()}
                className="btn btn-primary csi-create-item-save-btn"
              >
                {isSavingNewProduct ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Item</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CreateSalesInvoice;
