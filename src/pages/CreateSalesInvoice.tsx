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
  MessageSquare
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
  { id: 'seed-1', name: 'Aachiya', phone: '9876543210', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-2', name: 'Aarsha', phone: '9443210987', email: '', address: 'Bangalore, KA', gstin: '', closing_balance: 0 },
  { id: 'seed-3', name: 'Aarthi', phone: '9842109876', email: '', address: 'Chennai, TN', gstin: '', closing_balance: 836.99 },
  { id: 'seed-4', name: 'Abby', phone: '9123456780', email: '', address: 'Coimbatore, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-5', name: 'Abi Rhuban', phone: '9988776655', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-6', name: 'Abinaya', phone: '9789012345', email: '', address: 'Trichy, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-7', name: 'Ajith', phone: '9654321098', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 0 },
  { id: 'seed-8', name: 'Anita Sharma', phone: '9811223344', email: '', address: 'Indiranagar, Bangalore', gstin: '', closing_balance: 5600 },
  { id: 'seed-9', name: 'Oberoi Luxury Resorts', phone: '9870011223', email: '', address: 'MG Road, Bangalore', gstin: '', closing_balance: 44800 },
  { id: 'seed-10', name: 'Green Valley Residences HOA', phone: '9845012345', email: '', address: 'Whitefield, Bangalore', gstin: '', closing_balance: 12100 },
  { id: 'seed-11', name: 'Gowtham Nursery', phone: '9443012345', email: '', address: 'Madurai, TN', gstin: '', closing_balance: 4500 },
  { id: 'seed-12', name: 'MDA Pots and Plants', phone: '9842012345', email: '', address: 'Salem, TN', gstin: '', closing_balance: 325513.01 },
  { id: 'seed-13', name: 'Pandiyan', phone: '9789098765', email: '', address: 'Dindigul, TN', gstin: '', closing_balance: 9150 }
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
  const [invoicePrefix, setInvoicePrefix] = useState(activeBusiness?.invoice_prefix || (businessId === 'grow-naturals' ? 'GN00' : 'NN00'));
  const [invoiceNumber, setInvoiceNumber] = useState(String(Math.floor(8000 + Math.random() * 1000)));
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number | string>(30);
  const [hasCustomDueDate, setHasCustomDueDate] = useState(false);
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

  // Create New Party Modal State (MyBillBook Spec)
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
        setNotes(cleanNotes);
        if (cleanNotes) setShowNotesInput(true);

        // Payment details
        if (data.payment_method) {
          setPaymentMethod(data.payment_method as any);
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
            const qty = Number(it.quantity) || 1;
            const price = Number(it.unit_price) || 0;
            const discAmount = Number(it.discount !== undefined ? it.discount : (it.discount_amount || 0));
            const rawTotal = qty * price;
            const discPercent = rawTotal > 0 ? Number(((discAmount / rawTotal) * 100).toFixed(2)) : 0;
            const taxRate = Number(it.gst_rate) || 0;
            const taxAmt = Number(it.tax_amount) || 0;
            const total = Number(it.total) || (rawTotal - discAmount + taxAmt);

            return {
              id: it.id || `item-${Date.now()}-${idx}`,
              product_id: it.product_id || null,
              product_name: it.product_name || 'Item',
              sku: it.sku || '',
              hsn_code: it.hsn_code || (isTax ? '3926' : '0602'),
              mrp: Number(it.mrp || price),
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
  const [isMarkAsPaid, setIsMarkAsPaid] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<number | string>('');
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

  // Existing customers, products & categories from database
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [highlightedPartyIndex, setHighlightedPartyIndex] = useState<number>(0);

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
          setCustomers(custRes);
        }

        if (Array.isArray(prodRes)) {
          setProducts(prodRes);
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

  const handleCreateProduct = async (e?: React.FormEvent) => {
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

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        business_id: businessId as any,
        name: newProdName.trim(),
        sku: autoSku,
        barcode: String(Date.now()),
        hsn_code: newProdHsn.trim() || '3926',
        category_id: matchedCat?.id || null,
        category_name: matchedCat?.name || newProdCategory || 'General',
        cost_price: Number(calculatedCostPrice.toFixed(2)),
        sale_price: Number(calculatedSalePrice.toFixed(2)),
        gst_rate: Number(newProdGst) || 0,
        stock_quantity: Number(newProdStock) || 0,
        low_stock_threshold: Number(newProdMinStock) || 5,
        type: (newProdType === 'Service' ? 'service' : 'general') as any,
        attributes: {
          measuring_unit: unitCode,
          show_in_online_store: newProdShowOnline,
          enable_batching: newProdEnableBatching,
          mrp: Number(newProdMrp) || (rawSalePrice > 0 ? rawSalePrice : 0),
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
      setShowNewProductForm(false);

      // Reset form fields
      setNewProdName('');
      setNewProdCategory('');
      setNewProdSalePrice('');
      setNewProdCostPrice('');
      setNewProdStock('');
      setNewProdSku('');
      setNewProdMrp('');
      setNewProdWholesalePrice('');
      setNewProdBrand('');
      setNewProdSize('');
      setNewProdDesc('');
      setNewItemModalTab('basic');
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
    const amtStr = amount > 0 ? `&am=${amount.toFixed(2)}` : '';
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

  const handleRemoveSignature = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSignatureUrl(null);
    localStorage.removeItem('grow_naturals_signature');
  };

  // Financial aggregates & discount calculations (Exact MyBillBook Spec)
  const subtotalQuantity = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const rawSubtotal = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const totalItemDiscounts = items.reduce((sum, it) => sum + it.discount_amount, 0);
  const itemsTaxableBase = Math.max(0, rawSubtotal - totalItemDiscounts);

  // Before-Tax Discount Handling
  const beforeTaxDiscount = discountType === 'before_tax' ? Math.min(itemsTaxableBase, discountAmount) : 0;
  const taxableAmount = Math.max(0, itemsTaxableBase - beforeTaxDiscount);

  // Tax on items (proportional if before-tax discount applied)
  const taxReductionProportion = itemsTaxableBase > 0 && discountType === 'before_tax' ? (taxableAmount / itemsTaxableBase) : 1;
  const rawItemTaxAmount = isTaxable ? items.reduce((sum, it) => sum + it.tax_amount, 0) : 0;
  const itemTaxAmount = Number((rawItemTaxAmount * taxReductionProportion).toFixed(2));

  // Additional Charges & Taxes
  const totalExtraChargesAmount = extraCharges.reduce((sum, ch) => sum + (Number(ch.amount) || 0), 0);
  const extraChargesTaxAmount = isTaxable
    ? extraCharges.reduce((sum, ch) => {
        const amt = Number(ch.amount) || 0;
        const rate = Number(ch.tax_rate) || 0;
        return sum + (amt * rate) / 100;
      }, 0)
    : 0;

  const totalTaxAmount = Number((itemTaxAmount + extraChargesTaxAmount).toFixed(2));

  const isInterState = placeOfSupply.toLowerCase() !== 'tamil nadu';
  const cgstAmount = isTaxable && !isInterState ? Number((totalTaxAmount / 2).toFixed(2)) : 0;
  const sgstAmount = isTaxable && !isInterState ? Number((totalTaxAmount / 2).toFixed(2)) : 0;
  const igstAmount = isTaxable && isInterState ? Number(totalTaxAmount.toFixed(2)) : 0;

  // After-Tax Discount Handling
  const subtotalWithTaxesAndCharges = taxableAmount + totalTaxAmount + totalExtraChargesAmount;
  const effectiveAfterTaxDiscount = discountType === 'after_tax' ? Math.min(subtotalWithTaxesAndCharges, discountAmount) : 0;

  const rawGrandTotal = Math.max(0, subtotalWithTaxesAndCharges - effectiveAfterTaxDiscount);
  const roundedGrandTotal = autoRoundOff ? Math.round(rawGrandTotal) : Number(rawGrandTotal.toFixed(2));
  const roundOffDifference = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  // Discount percentage <-> amount synchronization
  const getDiscountBaseAmount = (type = discountType) => {
    if (type === 'before_tax') {
      return itemsTaxableBase;
    }
    // after_tax discount base is itemsTaxableBase + totalTaxAmount + totalExtraChargesAmount
    return itemsTaxableBase + totalTaxAmount + totalExtraChargesAmount;
  };

  const handleDiscountPercentChange = (pct: number) => {
    const validPct = Math.max(0, Math.min(100, pct));
    const base = getDiscountBaseAmount();
    const calculatedAmt = base > 0 ? Number(((base * validPct) / 100).toFixed(2)) : 0;
    setDiscountPercent(validPct);
    setDiscountAmount(calculatedAmt);
  };

  const handleDiscountAmountChange = (amt: number) => {
    const validAmt = Math.max(0, amt);
    const base = getDiscountBaseAmount();
    const calculatedPct = base > 0 ? Number(((validAmt / base) * 100).toFixed(2)) : 0;
    setDiscountAmount(validAmt);
    setDiscountPercent(calculatedPct);
  };

  const handleDiscountTypeChange = (newType: 'after_tax' | 'before_tax') => {
    setDiscountType(newType);
    if (discountPercent > 0) {
      const base = getDiscountBaseAmount(newType);
      const calculatedAmt = base > 0 ? Number(((base * discountPercent) / 100).toFixed(2)) : 0;
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

  const openEditPartyModal = () => {
    setEditPartyName(partyName);
    setEditPartyPhone(partyPhone);
    setEditPartyAddress(partyAddress);
    setEditPartyGstin(partyGstin);
    setEditPartyPlaceOfSupply(placeOfSupply);
    setUpdateDbCustomer(Boolean(selectedCustomerId));
    setEditPartyModalOpen(true);
  };

  const handleSavePartyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPartyName.trim()) {
      alert('Party name is required');
      return;
    }
    setIsSavingPartyEdit(true);
    try {
      if (selectedCustomerId && updateDbCustomer) {
        await api.put(`/customers/${selectedCustomerId}`, {
          name: editPartyName.trim(),
          phone: editPartyPhone.trim(),
          address: editPartyAddress.trim(),
          gstin: editPartyGstin.trim()
        }).catch((err) => console.warn('Customer update note:', err));

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomerId
              ? {
                  ...c,
                  name: editPartyName.trim(),
                  phone: editPartyPhone.trim(),
                  address: editPartyAddress.trim(),
                  gstin: editPartyGstin.trim()
                }
              : c
          )
        );
      }
      setPartyName(editPartyName.trim());
      setPartyPhone(editPartyPhone.trim());
      setPartyAddress(editPartyAddress.trim());
      setPartyGstin(editPartyGstin.trim());
      setPlaceOfSupply(editPartyPlaceOfSupply);

      if (isSameAsBilling) {
        setShipToName(editPartyName.trim());
        setShipToPhone(editPartyPhone.trim());
        setShipToAddress(editPartyAddress.trim());
      }

      setEditPartyModalOpen(false);
    } catch (err: any) {
      console.error('Save party error:', err);
      setPartyName(editPartyName.trim());
      setPartyPhone(editPartyPhone.trim());
      setPartyAddress(editPartyAddress.trim());
      setPartyGstin(editPartyGstin.trim());
      setPlaceOfSupply(editPartyPlaceOfSupply);
      setEditPartyModalOpen(false);
    } finally {
      setIsSavingPartyEdit(false);
    }
  };

  const openShippingModal = () => {
    setTempShipName(shipToName || partyName);
    setTempShipPhone(shipToPhone || partyPhone);
    setTempShipAddress(shipToAddress || partyAddress);
    setTempSameAsBilling(isSameAsBilling);
    setShippingModalOpen(true);
  };

  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempSameAsBilling) {
      setShipToName(partyName);
      setShipToPhone(partyPhone);
      setShipToAddress(partyAddress);
      setIsSameAsBilling(true);
    } else {
      setShipToName(tempShipName.trim() || partyName);
      setShipToPhone(tempShipPhone.trim());
      setShipToAddress(tempShipAddress.trim());
      setIsSameAsBilling(false);
    }
    setShippingModalOpen(false);
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

      // If shipping details provided, sync them
      if (hasShippingAddress && newPartyShippingAddress.trim()) {
        const fullShippingAddress = [
          newPartyShippingAddress.trim(),
          newPartyShippingCity.trim(),
          newPartyShippingState,
          newPartyShippingPincode.trim()
        ].filter(Boolean).join(', ');
        setShipToName(newPartyShippingName.trim() || newPartyName.trim());
        setShipToPhone(newPartyPhone.trim());
        setShipToAddress(fullShippingAddress);
        setIsSameAsBilling(false);
      }

      if (saveAndNew) {
        // Reset form for next entry
        setNewPartyName('');
        setNewPartyPhone('');
        setNewPartyGstin('');
        setNewPartyPan('');
        setNewPartyEmail('');
        setNewPartyOpeningBal('0');
        setNewPartyBillingAddress('');
        setNewPartyCity('');
        setNewPartyState('');
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
        setNewPartyCustom4('');
        setNewPartyNotes('');
        setNewPartyModalTab('basic');
      } else {
        setPartyModalOpen(false);
        setIsPartySearchOpen(false);
      }
    } catch (err: any) {
      console.error('Failed to create customer:', err);
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
        payment_method: paymentMethod,
        upi_id: showPaymentQr ? upiId : undefined,
        qr_code_url: showPaymentQr ? generateUpiQrUrl(upiId, upiPayeeName, includeAmountInQr ? roundedGrandTotal : 0) : undefined,
        show_payment_qr: showPaymentQr,
        payment_status: isMarkAsPaid ? 'paid' : paymentStatus,
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

  return (
    <div className="page-wrapper csi-page-wrapper">
      <div className="csi-root">
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
                <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>#{invoicePrefix}{invoiceNumber}</span>
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
              {/* LEFT VERTICAL ACTION RAIL (Orange Scan / Autofill Button) */}
              {!autofillOpen && (
                <aside className="csi-left-rail" title="Autofill / Scan Bill">
                  <button
                    type="button"
                    onClick={() => setAutofillOpen(true)}
                    className="csi-btn-scanner-icon"
                    title="Autofill / Scan Invoice"
                    aria-label="Autofill / Scan Invoice"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                      <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                      <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
                      <rect x="7" y="8.5" width="10" height="7" rx="1.8" />
                      <line x1="6.5" y1="12" x2="17.5" y2="12" strokeWidth="2.2" />
                    </svg>
                  </button>
                </aside>
              )}

              <div className="csi-invoice-sheet">
                {/* TOP ROW: Bill To, Ship To & Invoice Details Grid */}
                <div className={`csi-top-grid ${hasSelectedParty ? 'csi-top-grid-3col' : 'csi-top-grid-2col'}`}>
                  {/* BILL TO CARD */}
                  <div className="csi-card csi-party-card-box" style={{ position: 'relative' }}>
                  <div className="csi-card-header">
                    <h3 className="csi-card-title">Bill To</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {hasSelectedParty && (
                        <button
                          type="button"
                          onClick={openEditPartyModal}
                          className="csi-btn-edit-party"
                          title="Edit Party Details"
                        >
                          <Edit3 size={12} color="#0284c7" />
                          <span>Edit Party</span>
                        </button>
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
                                      setSearchCustomerQuery('');
                                      setShowNewCustForm(true);
                                      setPartyModalOpen(true);
                                    }}
                                    className="csi-party-create-btn"
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

                        {/* Action buttons row: Change Party */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPartySearchOpen(true);
                              setSearchCustomerQuery('');
                            }}
                            className="csi-btn-change-action"
                          >
                            <RotateCcw size={12} color="#64748b" />
                            <span>Change Party</span>
                          </button>
                        </div>

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
                          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748b', marginTop: '2px' }}>
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
                        <RotateCcw size={12} color="#64748b" />
                        <span>Change</span>
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
                <div className="csi-table-wrap">
                  <table className="csi-table">
                    <colgroup>
                      <col style={{ width: '40px' }} />
                      <col style={{ minWidth: '180px' }} />
                      <col style={{ width: '70px' }} />
                      <col style={{ width: '85px' }} />
                      <col style={{ width: '100px' }} />
                      <col style={{ width: '130px' }} />
                      <col style={{ width: '100px' }} />
                      <col style={{ width: '110px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '55px' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>NO</th>
                        <th style={{ textAlign: 'left' }}>ITEMS</th>
                        <th style={{ textAlign: 'center' }}>HSN</th>
                        <th style={{ textAlign: 'center' }}>MRP</th>
                        <th style={{ textAlign: 'center' }}>QTY</th>
                        <th style={{ textAlign: 'right' }}>PRICE/ITEM (₹)</th>
                        <th style={{ textAlign: 'right' }}>DISCOUNT</th>
                        <th style={{ textAlign: 'right' }}>TAX</th>
                        <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                        <th style={{ textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '12.5px' }}>
                            {idx + 1}
                          </td>
                          <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
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
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="text"
                              value={it.hsn_code}
                              onChange={(e) => handleItemChange(it.id, 'hsn_code', e.target.value)}
                              placeholder="HSN"
                              className="csi-table-num-input"
                              style={{ width: '60px', height: '32px', textAlign: 'center', fontSize: '12px', margin: '0 auto', display: 'block' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              value={it.mrp === 0 ? '0' : it.mrp || ''}
                              onChange={(e) => handleItemChange(it.id, 'mrp', Number(e.target.value))}
                              placeholder="0"
                              className="csi-table-num-input"
                              style={{ width: '72px', height: '32px', textAlign: 'right', fontSize: '12.5px', fontWeight: 600, padding: '0 6px', margin: '0 auto', display: 'block' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleItemChange(it.id, 'quantity', Number(e.target.value))}
                                className="csi-table-num-input"
                                style={{ width: '48px', height: '32px', textAlign: 'center', fontWeight: 700, fontSize: '13px', padding: '0 4px' }}
                              />
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, minWidth: '22px' }}>{it.unit || 'PCS'}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', position: 'relative' }}>
                            <div className="csi-price-cell-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={it.unit_price}
                                onChange={(e) => handleItemChange(it.id, 'unit_price', Number(e.target.value))}
                                onFocus={() => {
                                  if (it.product_name) {
                                    fetchPartyItemHistory(it.id, it.product_id, it.product_name);
                                  }
                                }}
                                className="csi-table-num-input"
                                style={{ width: '80px', height: '32px', textAlign: 'right', fontWeight: 600, fontSize: '13px', padding: '0 6px' }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (priceHistoryRowId === it.id) {
                                    setPriceHistoryRowId(null);
                                  } else {
                                    fetchPartyItemHistory(it.id, it.product_id, it.product_name);
                                  }
                                }}
                                title="Recent sales prices to this party"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  color: priceHistoryRowId === it.id ? '#6366f1' : '#94a3b8',
                                  padding: '2px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Info size={14} />
                              </button>
                            </div>

                            {/* Recent Sales Prices Popover (Exact MyBillBook Spec) */}
                            {priceHistoryRowId === it.id && (
                              <div
                                className="csi-price-history-popover"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="csi-price-history-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                    <Info size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
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
                                      <Loader2 size={14} className="animate-spin text-sky-400" />
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
                                                handleItemChange(it.id, 'unit_price', p);
                                                setPriceHistoryRowId(null);
                                              }}
                                              title="Click to apply this price"
                                            >
                                              <td style={{ textAlign: 'left', color: '#f1f5f9' }}>{dateStr}</td>
                                              <td style={{ textAlign: 'right', color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
                                                ₹ {p.toFixed(2)}
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
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '3px' }}>
                              <span style={{ fontFamily: 'monospace', color: '#334155', fontWeight: 600, fontSize: '12px', lineHeight: 1.2 }}>
                                ₹{it.discount_amount.toFixed(2)}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={it.discount_percent}
                                  onChange={(e) => handleItemChange(it.id, 'discount_percent', Number(e.target.value))}
                                  className="csi-table-num-input"
                                  style={{ width: '40px', height: '24px', textAlign: 'right', fontSize: '11px', padding: '0 3px' }}
                                />
                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>%</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isTaxable ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '3px' }}>
                                <select
                                  value={it.gst_rate}
                                  onChange={(e) => handleItemChange(it.id, 'gst_rate', Number(e.target.value))}
                                  className="csi-table-select"
                                  style={{ width: '74px', height: '28px', fontSize: '11.5px', fontWeight: 700 }}
                                >
                                  <option value={0}>0%</option>
                                  <option value={5}>5%</option>
                                  <option value={12}>12%</option>
                                  <option value={18}>18%</option>
                                  <option value={28}>28%</option>
                                </select>
                                <span style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace', fontWeight: 500 }}>
                                  (₹{it.tax_amount.toFixed(2)})
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: '#059669', fontSize: '11px', fontWeight: 600 }}>0% (Exempt)</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            ₹{it.total.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '0 4px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(it.id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#64748b',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                  transition: 'all 0.12s ease'
                                }}
                                title="Duplicate Item Row"
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#4f46e5')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(it.id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  borderRadius: '4px',
                                  transition: 'all 0.12s ease'
                                }}
                                title="Delete Item"
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
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
                          {subtotalQuantity}
                        </td>
                        <td style={{ borderRight: '1px solid #e2e8f0' }}></td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#334155' }}>
                          ₹ {totalItemDiscounts.toFixed(0)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#334155' }}>
                          ₹ {totalTaxAmount.toFixed(0)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          ₹ {rawSubtotal.toFixed(2)}
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
                            className="csi-btn-remove-inline"
                          >
                            <X size={13} /> Remove
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add customer-facing note or memo..."
                          className="csi-input"
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
                            className="csi-btn-remove-inline"
                          >
                            <X size={13} /> Collapse
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          className="csi-input"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* Bank Details Section */}
                  <div className="csi-bottom-bank-section">
                    <span className="csi-bank-details-title">Bank Details</span>
                    <div className="csi-bank-grid-2col">
                      <div className="csi-bank-field-row">
                        <span className="csi-bank-label">Account Number:</span>
                        <span className="csi-bank-val">{bankDetails.account_number || '—'}</span>
                      </div>
                      <div className="csi-bank-field-row">
                        <span className="csi-bank-label">IFSC Code:</span>
                        <span className="csi-bank-val">{bankDetails.ifsc_code || '—'}</span>
                      </div>
                      <div className="csi-bank-field-col">
                        <span className="csi-bank-label">Bank & Branch Name:</span>
                        <span className="csi-bank-val">{bankDetails.bank_name || '—'}</span>
                      </div>
                      <div className="csi-bank-field-row">
                        <span className="csi-bank-label">Account Holder's Name:</span>
                        <span className="csi-bank-val">{bankDetails.account_holder || '—'}</span>
                      </div>
                    </div>

                    <div className="csi-bank-actions-row">
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
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="csi-bank-btn-change"
                      >
                        <RotateCcw size={13} />
                        <span>Change</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment QR Code Section */}
                  <div className="csi-bottom-action-item">
                    {!showPaymentQr ? (
                      <button
                        type="button"
                        onClick={openPaymentQrModal}
                        className="csi-bottom-link-btn"
                      >
                        <QrCode size={16} className="csi-link-blue-icon" />
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
                            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#475569', marginTop: '2px' }}>
                              {upiId}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                              Payee: <strong>{upiPayeeName}</strong> {includeAmountInQr && `• ₹${roundedGrandTotal.toFixed(2)}`}
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
                        <span className="csi-rupee-plus-badge">₹+</span>
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
                                value={ch.amount === 0 ? '' : ch.amount}
                                onChange={(e) => handleUpdateCharge(ch.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))}
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
                          className="csi-btn-add-another-charge"
                        >
                          <span className="csi-rupee-plus-badge">₹+</span>
                          <span>Add Another Charge</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Taxable Amount */}
                  <div className="csi-summary-flex-row">
                    <span className="csi-summary-label">Taxable Amount</span>
                    <span className="csi-summary-val">₹ {taxableAmount.toFixed(0)}</span>
                  </div>

                  {/* Add Discount */}
                  <div>
                    {!showOverallDiscount ? (
                      <button
                        type="button"
                        onClick={() => setShowOverallDiscount(true)}
                        className="csi-bottom-link-btn"
                      >
                        <span className="csi-percent-plus-badge">%+</span>
                        <span>Add Discount</span>
                      </button>
                    ) : (
                      <div className="csi-discount-row-wrap" style={{ width: '100%' }}>
                        <div style={{ flex: '0 0 105px' }}>
                          <select
                            value={discountType}
                            onChange={(e) => handleDiscountTypeChange(e.target.value as 'after_tax' | 'before_tax')}
                            className="csi-discount-type-select"
                          >
                            <option value="after_tax">After Tax</option>
                            <option value="before_tax">Before Tax</option>
                          </select>
                        </div>
                        <div className="csi-discount-input-group" style={{ flex: '1' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={discountPercent === 0 ? '' : discountPercent}
                            onChange={(e) => handleDiscountPercentChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            className="csi-discount-inner-input"
                            style={{ textAlign: 'right' }}
                          />
                          <span className="csi-discount-addon">%</span>
                        </div>
                        <div className="csi-discount-input-group" style={{ flex: '1.2' }}>
                          <span className="csi-discount-addon">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={discountAmount === 0 ? '' : discountAmount}
                            onChange={(e) => handleDiscountAmountChange(e.target.value === '' ? 0 : Number(e.target.value))}
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
                  <div className="csi-summary-flex-row">
                    <label className="csi-roundoff-label">
                      <input
                        type="checkbox"
                        checked={autoRoundOff}
                        onChange={(e) => setAutoRoundOff(e.target.checked)}
                      />
                      <span>Auto Round Off</span>
                    </label>
                    <div className="csi-roundoff-input-group">
                      <select
                        value={roundOffDifference >= 0 ? 'add' : 'reduce'}
                        onChange={() => {}}
                        className="csi-roundoff-sign-select"
                      >
                        <option value="add">+ Add</option>
                        <option value="reduce">- Reduce</option>
                      </select>
                      <input
                        type="text"
                        readOnly
                        value={autoRoundOff && Math.abs(roundOffDifference) > 0 ? Math.abs(roundOffDifference).toFixed(2) : '0'}
                        className="csi-roundoff-val-input"
                      />
                    </div>
                  </div>

                  {/* Total Amount Row */}
                  <div className="csi-summary-flex-row csi-total-amount-row">
                    <span className="csi-total-amount-title">Total Amount:</span>
                    <div className="csi-total-amount-box">
                      <span className="csi-total-amount-currency">₹</span>
                      <span className={`csi-total-amount-num ${roundedGrandTotal <= 0 ? 'csi-total-amount-placeholder' : ''}`}>
                        {roundedGrandTotal > 0
                          ? roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                          : 'Enter payment amount'}
                      </span>
                    </div>
                  </div>

                  <div className="csi-summary-divider" />

                  {/* Total Amount Received Row */}
                  <div className="csi-summary-flex-row">
                    <span className="csi-amount-received-label">Total Amount Received</span>
                    <span className="csi-amount-received-val">
                      ₹ {isMarkAsPaid ? (roundedGrandTotal > 0 ? roundedGrandTotal.toLocaleString('en-IN') : '0') : (Number(receivedAmount) || 0)}
                    </span>
                  </div>

                  {/* Payment Pill Row */}
                  <div className="csi-payment-pill-row">
                    <div className="csi-payment-pill-container">
                      <span className="csi-payment-pill-symbol">₹</span>
                      <input
                        type="number"
                        value={isMarkAsPaid ? (roundedGrandTotal > 0 ? roundedGrandTotal : '') : (receivedAmount === 0 ? '' : receivedAmount)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReceivedAmount(val);
                          const numVal = Number(val);
                          if (numVal >= roundedGrandTotal && roundedGrandTotal > 0) {
                            setIsMarkAsPaid(true);
                          } else {
                            setIsMarkAsPaid(false);
                          }
                        }}
                        placeholder="0"
                        className="csi-payment-pill-input"
                      />
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="csi-payment-pill-select"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Net Banking</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {/* Mark as fully paid & Split Payment */}
                  <div className="csi-summary-flex-row" style={{ marginTop: '4px' }}>
                    <label className="csi-mark-paid-label">
                      <input
                        type="checkbox"
                        checked={isMarkAsPaid}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsMarkAsPaid(checked);
                          if (checked) {
                            setReceivedAmount(roundedGrandTotal);
                          } else {
                            setReceivedAmount(0);
                          }
                        }}
                      />
                      <span>Mark as fully paid</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Split payment option active across multiple methods.')}
                      className="csi-split-payment-btn"
                    >
                      + Split Payment
                    </button>
                  </div>

                  <div className="csi-summary-divider" />

                  {/* Balance Amount Row */}
                  <div className="csi-summary-flex-row csi-balance-amount-row">
                    <span className="csi-balance-amount-label">Balance Amount</span>
                    <span className="csi-balance-amount-val">
                      ₹ {isMarkAsPaid || roundedGrandTotal === 0 ? '0.00' : Math.max(0, roundedGrandTotal - (Number(receivedAmount) || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Dashed signature/notes box */}
                  <div className="csi-summary-dashed-wrap">
                    <div
                      className="csi-summary-dashed-box"
                      onClick={() => setSignatureModalOpen(true)}
                      title={signatureUrl ? "Click to change signature" : "Click to add signature"}
                    >
                      {signatureUrl ? (
                        <div className="csi-sig-preview-content">
                          <img src={signatureUrl} alt="Signature" className="csi-sig-preview-img" />
                          <span className="csi-sig-preview-caption">Authorized Signatory</span>
                          <div className="csi-sig-hover-actions">
                            <button
                              type="button"
                              className="csi-sig-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSignatureModalOpen(true);
                              }}
                            >
                              <Edit3 size={11} /> Change
                            </button>
                            <button
                              type="button"
                              className="csi-sig-action-btn delete"
                              onClick={handleRemoveSignature}
                            >
                              <Trash2 size={11} /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="csi-sig-empty-content">
                          <Plus size={16} color="#2563eb" />
                          <span>Add Signature</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </main>
        </div>
      )}

      {/* MODAL: Create New Party (MyBillBook Spec) */}
      {partyModalOpen && (
        <div className="csi-modal-backdrop csi-create-party-backdrop" style={{ zIndex: 100050 }}>
          <div className="csi-modal-box csi-create-party-modal-box">
            {/* Header */}
            <div className="csi-create-party-header">
              <h4 className="csi-create-party-title">Create New Party</h4>
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
                          <input
                            type="radio"
                            name="partyTypeRadio"
                            value="Customer"
                            checked={newPartyType === 'Customer'}
                            onChange={() => setNewPartyType('Customer')}
                          />
                          <span className="csi-custom-radio-dot"></span>
                          <span className="csi-party-type-name">Customer</span>
                        </label>
                        <label className={`csi-party-type-card ${newPartyType === 'Supplier' ? 'checked' : ''}`}>
                          <input
                            type="radio"
                            name="partyTypeRadio"
                            value="Supplier"
                            checked={newPartyType === 'Supplier'}
                            onChange={() => setNewPartyType('Supplier')}
                          />
                          <span className="csi-custom-radio-dot"></span>
                          <span className="csi-party-type-name">Supplier</span>
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
                        className="form-control csi-create-party-input font-monospace text-uppercase"
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
                        className="form-control csi-create-party-input font-monospace text-uppercase"
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
                          className="form-control csi-create-party-input csi-split-main-input font-monospace"
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
                          className="form-control csi-create-party-input"
                          style={{ height: 'auto', padding: '10px 12px', resize: 'vertical' }}
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

                    {/* Shipping Address Section: Either Saved Card or "+ Add New Shipping Address" Button */}
                    {hasShippingAddress ? (
                      <div className="csi-address-box mb-3" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold" style={{ fontSize: '13.5px', color: '#092c4c' }}>
                              Shipping Address: <span style={{ color: '#fe9f43' }}>{newPartyShippingName}</span>
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <button
                              type="button"
                              onClick={handleOpenAddShippingModal}
                              className="btn btn-sm btn-link p-0"
                              style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                            >
                              Edit
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
                        <p className="mb-0 text-muted" style={{ fontSize: '12.5px', lineHeight: '1.5' }}>
                          {newPartyShippingAddress}
                          {newPartyShippingCity && `, ${newPartyShippingCity}`}
                          {newPartyShippingState && `, ${newPartyShippingState}`}
                          {newPartyShippingPincode && ` - ${newPartyShippingPincode}`}
                        </p>
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
                            className="form-control csi-create-party-input csi-split-main-input font-monospace"
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
                            className="form-control csi-create-party-input csi-split-main-input font-monospace"
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
                          className="form-control csi-create-party-input font-monospace"
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
                          className="form-control csi-create-party-input font-monospace"
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
                          className="form-control csi-create-party-input font-monospace text-uppercase"
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
                <button
                  type="button"
                  disabled={isSavingNewCust}
                  onClick={() => handleCreateCustomer(undefined, true)}
                  className="btn btn-outline-secondary csi-create-party-savenew-btn"
                >
                  Save & New
                </button>

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
                  className="form-control csi-create-party-input"
                  style={{ height: 'auto', padding: '10px 12px', resize: 'vertical' }}
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
      {settingsOpen && (
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
                            className="csi-qs-input-field font-monospace"
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
                            className="csi-qs-input-field font-monospace"
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
                              className="csi-qs-input-field font-monospace"
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
      {/* MODAL: Edit Party Details */}
      {editPartyModalOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-modal-box" style={{ maxWidth: '480px' }}>
            <div className="csi-modal-header">
              <h3 className="csi-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={15} color="#0284c7" /> Edit Party Details
              </h3>
              <button
                type="button"
                onClick={() => setEditPartyModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSavePartyEdit} className="csi-modal-body">
              <div>
                <label className="csi-field-label">Party / Business Name *</label>
                <input
                  type="text"
                  required
                  value={editPartyName}
                  onChange={(e) => setEditPartyName(e.target.value)}
                  className="csi-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="csi-field-label">Phone Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editPartyPhone}
                    onChange={(e) => setEditPartyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="csi-input"
                  />
                </div>
                <div>
                  <label className="csi-field-label">GSTIN</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={editPartyGstin}
                    onChange={(e) => setEditPartyGstin(e.target.value.toUpperCase())}
                    className="csi-input csi-input-mono"
                  />
                </div>
              </div>

              <div>
                <label className="csi-field-label">Billing Address</label>
                <textarea
                  rows={2}
                  value={editPartyAddress}
                  onChange={(e) => setEditPartyAddress(e.target.value)}
                  className="csi-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="csi-field-label">Place of Supply</label>
                <select
                  value={editPartyPlaceOfSupply}
                  onChange={(e) => setEditPartyPlaceOfSupply(e.target.value)}
                  className="csi-input"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {selectedCustomerId && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={updateDbCustomer}
                    onChange={(e) => setUpdateDbCustomer(e.target.checked)}
                  />
                  <span>Save changes to customer directory for future bills</span>
                </label>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setEditPartyModalOpen(false)}
                  className="csi-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPartyEdit}
                  className="csi-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isSavingPartyEdit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Change Shipping Address */}
      {shippingModalOpen && (
        <div className="csi-modal-backdrop">
          <div className="csi-modal-box" style={{ maxWidth: '460px' }}>
            <div className="csi-modal-header">
              <h3 className="csi-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={15} color="#0284c7" /> Change Shipping Address
              </h3>
              <button
                type="button"
                onClick={() => setShippingModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveShipping} className="csi-modal-body">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#0369a1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tempSameAsBilling}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTempSameAsBilling(checked);
                    if (checked) {
                      setTempShipName(partyName);
                      setTempShipPhone(partyPhone);
                      setTempShipAddress(partyAddress);
                    }
                  }}
                />
                <span>Same as Billing Address</span>
              </label>

              {!tempSameAsBilling && (
                <>
                  <div>
                    <label className="csi-field-label">Recipient / Ship To Name *</label>
                    <input
                      type="text"
                      required
                      value={tempShipName}
                      onChange={(e) => setTempShipName(e.target.value)}
                      placeholder="Recipient or company name"
                      className="csi-input"
                    />
                  </div>

                  <div>
                    <label className="csi-field-label">Shipping Contact Phone</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={tempShipPhone}
                      onChange={(e) => setTempShipPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="csi-input"
                    />
                  </div>

                  <div>
                    <label className="csi-field-label">Delivery Address / Destination</label>
                    <textarea
                      rows={3}
                      value={tempShipAddress}
                      onChange={(e) => setTempShipAddress(e.target.value)}
                      placeholder="Street, Landmark, City, Pincode"
                      className="csi-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShippingModalOpen(false)}
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
                  <span>Save Shipping Address</span>
                </button>
              </div>
            </form>
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
                  Auto-fill dynamic invoice amount (<strong>₹{roundedGrandTotal.toFixed(2)}</strong>) in QR Code
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
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', fontWeight: 700, marginTop: '6px' }}>
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
                  <Search size={16} className="csi-search-icon" style={{ marginLeft: '12px', flexShrink: 0, color: '#fe9f43' }} />
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
                              {prod.hsn_code && (
                                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
                                  HSN: {prod.hsn_code}
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                              {prod.sku || '-'}
                            </td>
                            <td style={{ textAlign: 'center', color: (prod.stock_quantity || 0) <= 0 ? '#ef4444' : '#10b981', fontSize: '12px', fontWeight: 600 }}>
                              {stockDisplay}
                            </td>
                            <td style={{ textAlign: 'right', color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>
                              ₹ {Number(prod.mrp !== undefined ? prod.mrp : (prod.sale_price || 0)).toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a', fontSize: '13px', fontFamily: 'monospace' }}>
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
      {showNewProductForm && (
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
