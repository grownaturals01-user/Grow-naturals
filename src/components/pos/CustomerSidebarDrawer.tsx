import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Search,
  User,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Building2,
  Check,
  Sparkles,
  Loader2,
  Users,
  ShieldCheck,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { api } from '../../services/api';
import type { Customer } from '../../types';

interface CustomerSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomerId?: string;
  selectedCustomerName?: string;
  onSelectCustomer: (customer: {
    id?: string;
    name: string;
    phone: string;
    gstin?: string;
    credit_limit?: number;
    total_spent?: number;
    customer_type?: string;
  }) => void;
  onCustomerCreated: (newCustomer: Customer) => void;
  initialTab?: 'existing' | 'new';
  initialSearchQuery?: string;
}

// Avatar background color palette generator based on name
const AVATAR_COLORS = [
  { bg: '#fef3c7', text: '#d97706', border: '#fde68a' }, // Amber
  { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' }, // Sky Blue
  { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' }, // Emerald
  { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' }, // Purple
  { bg: '#ffe4e6', text: '#e11d48', border: '#fecdd3' }, // Rose
  { bg: '#ccfbf1', text: '#0d9488', border: '#99f6e4' }, // Teal
  { bg: '#ffedd5', text: '#ea580c', border: '#fed7aa' }, // Orange
  { bg: '#ede9fe', text: '#6366f1', border: '#ddd6fe' }, // Indigo
];

function getAvatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name: string): string {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const CustomerSidebarDrawer: React.FC<CustomerSidebarDrawerProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomerId,
  selectedCustomerName = 'Walk in Customer',
  onSelectCustomer,
  onCustomerCreated,
  initialTab = 'existing',
  initialSearchQuery = '',
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<'customer' | 'wholesaler'>('customer');
  const [newCreditLimit, setNewCreditLimit] = useState<string>('0');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // GST auto-lookup state
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [gstFeedback, setGstFeedback] = useState<{
    status: 'idle' | 'success' | 'warning' | 'error';
    message: string;
    state?: string;
  } | null>(null);

  // Sync initial tab & search when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery(initialSearchQuery);
      setFormError(null);
      setGstFeedback(null);
      if (initialTab === 'existing') {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, initialTab, initialSearchQuery]);

  // Handle GST auto-lookup
  const handleFetchGstDetails = async (gstNumber: string) => {
    if (gstNumber.length !== 15) return;
    setIsFetchingGst(true);
    setGstFeedback(null);
    try {
      const res = await api.get(`/gst/lookup/${gstNumber}`);
      if (res && res.success) {
        if (res.customer_name || res.trade_name || res.legal_name) {
          const fetchedName = res.trade_name || res.legal_name || res.customer_name;
          setNewName(fetchedName);
          if (res.phone && !newPhone) setNewPhone(res.phone.replace(/\D/g, '').slice(0, 10));
          if (res.email && !newEmail) setNewEmail(res.email);
          if (res.address) setNewAddress(res.address);
          setNewCustomerType('wholesaler');
          setGstFeedback({
            status: 'success',
            message: `Verified: ${fetchedName} (${res.state || 'Registered'})`,
            state: res.state,
          });
        } else {
          setGstFeedback({
            status: 'success',
            message: `Valid GSTIN Format • State: ${res.state || 'India'}`,
            state: res.state,
          });
        }
      } else {
        setGstFeedback({
          status: 'error',
          message: res?.error || 'Could not verify GSTIN details.',
        });
      }
    } catch (err: any) {
      setGstFeedback({
        status: 'error',
        message: err.message || 'Error looking up GSTIN.',
      });
    } finally {
      setIsFetchingGst(false);
    }
  };

  const debounceTimerRef = useRef<any>(null);
  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setNewGstin(val);
    setGstFeedback(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.length === 15) {
      debounceTimerRef.current = setTimeout(() => {
        handleFetchGstDetails(val);
      }, 350);
    }
  };

  // Filtered customer list
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Handle creating new customer from inline drawer form
  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setFormError(null);

      const res = await api.post('/customers', {
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        address: newAddress.trim(),
        gstin: newGstin.trim().toUpperCase(),
        customer_type: newCustomerType,
        credit_limit: Number(newCreditLimit) || 0,
      });

      const savedCustomer: Customer = {
        id: res.id || res.customer?.id,
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        address: newAddress.trim(),
        gstin: newGstin.trim().toUpperCase(),
        customer_type: newCustomerType,
        credit_limit: Number(newCreditLimit) || 0,
        total_spent: 0,
        invoice_count: 0,
      };

      onCustomerCreated(savedCustomer);
      onSelectCustomer({
        id: savedCustomer.id,
        name: savedCustomer.name,
        phone: savedCustomer.phone || '',
        gstin: savedCustomer.gstin || '',
        credit_limit: savedCustomer.credit_limit || 0,
        total_spent: 0,
        customer_type: savedCustomer.customer_type || 'customer',
      });

      // Reset form
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setNewGstin('');
      setNewCreditLimit('0');
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const isWalkInActive =
    !selectedCustomerId &&
    (selectedCustomerName === 'Walk in Customer' || selectedCustomerName === 'Walk-in Customer');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1200,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '450px',
          maxWidth: '92vw',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-12px 0 35px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          borderLeft: '1px solid #e2e8f0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Drawer Header */}
        <div
          style={{
            padding: '18px 24px 14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
            }}
          >
            Customers
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#475569';
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. Top Segmented Pills Switcher (Matching Screenshot 3) */}
        <div
          style={{
            padding: '12px 24px 10px 24px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'existing' ? '#0f172a' : '#ffffff',
              color: activeTab === 'existing' ? '#ffffff' : '#0f172a',
              border: activeTab === 'existing' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
              boxShadow: activeTab === 'existing' ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none',
            }}
          >
            <Users size={14} />
            <span>Existing Customer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: activeTab === 'new' ? '#0f172a' : '#ffffff',
              color: activeTab === 'new' ? '#ffffff' : '#0f172a',
              border: activeTab === 'new' ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
              boxShadow: activeTab === 'new' ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none',
            }}
          >
            <UserPlus size={14} />
            <span>+ Add New Customer</span>
          </button>
        </div>

        {/* 3. Existing Customer View */}
        {activeTab === 'existing' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search Input Bar (Matching Screenshot 3) */}
            <div style={{ padding: '6px 24px 14px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by name/Phone Number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 36px 0 40px',
                    borderRadius: '9999px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.875rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    backgroundColor: '#ffffff',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Customer List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Option 1: Walk in Customer */}
              <div
                onClick={() => {
                  onSelectCustomer({ name: 'Walk in Customer', phone: '' });
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: isWalkInActive ? '#f0fdf4' : '#ffffff',
                  border: isWalkInActive ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                }}
                onMouseEnter={(e) => {
                  if (!isWalkInActive) e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isWalkInActive) e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                {/* Radio selection indicator */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {isWalkInActive ? (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid #06b6d4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#06b6d4',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '1.5px solid #cbd5e1',
                      }}
                    />
                  )}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  <ShoppingBag size={18} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      lineHeight: 1.2,
                    }}
                  >
                    Walk in Customer
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: '#64748b',
                      marginTop: '2px',
                    }}
                  >
                    Standard Counter Customer
                  </div>
                </div>

                {/* Badge on Right */}
                <div style={{ flexShrink: 0 }}>
                  <span
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                    }}
                  >
                    Default
                  </span>
                </div>
              </div>

              {/* Mapped Customers List */}
              {filteredList.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                const avatar = getAvatarStyle(c.name);
                const initials = getInitials(c.name);

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer({
                        id: c.id,
                        name: c.name,
                        phone: c.phone || '',
                        gstin: c.gstin || '',
                        credit_limit: c.credit_limit || 0,
                        total_spent: c.total_spent || 0,
                        customer_type: c.customer_type || 'customer',
                      });
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      border: isSelected ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    {/* Radio selection indicator */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      {isSelected ? (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '2px solid #06b6d4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#06b6d4',
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '1.5px solid #cbd5e1',
                          }}
                        />
                      )}
                    </div>

                    {/* Avatar Circle with Name Palette */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: avatar.bg,
                        color: avatar.text,
                        border: `1.5px solid ${avatar.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>

                    {/* Customer Name & Phone */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span>{c.phone ? `+91 ${c.phone.slice(-10)}` : 'No mobile'}</span>
                        {c.gstin && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#0369a1',
                              backgroundColor: '#e0f2fe',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            GST
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge on Right (Available / Status) */}
                    <div style={{ flexShrink: 0 }}>
                      <span
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#059669',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          border: '1px solid #d1fae5',
                        }}
                      >
                        Available
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Empty Search Result */}
              {filteredList.length === 0 && searchQuery && (
                <div
                  style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                    }}
                  >
                    <User size={24} />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                    No customer found matching "{searchQuery}"
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(searchQuery);
                      setActiveTab('new');
                    }}
                    style={{
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '8px 20px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    + Add "{searchQuery}" as New Customer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Add New Customer View (Inline Form in Drawer) */}
        {activeTab === 'new' && (
          <form
            onSubmit={handleCreateNewCustomer}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                flex: 1,
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {formError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  {formError}
                </div>
              )}

              {/* Customer Full Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Customer Name *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar, Oberoi Hotels"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px 0 36px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                </div>
              </div>

              {/* Mobile Phone Number (10 Digits constraint) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Mobile Number (10 Digits)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px 0 36px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                </div>
              </div>

              {/* GSTIN Number */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      textTransform: 'uppercase',
                    }}
                  >
                    GSTIN (Optional)
                  </label>
                  {isFetchingGst && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Loader2 size={12} className="spinner" /> Verifying GST...
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Building2 size={15} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    value={newGstin}
                    onChange={handleGstinChange}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px 0 36px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0f172a')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                </div>
                {gstFeedback && (
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: gstFeedback.status === 'success' ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {gstFeedback.message}
                  </div>
                )}
              </div>

              {/* Email & Type Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="client@mail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#334155',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Type
                  </label>
                  <select
                    value={newCustomerType}
                    onChange={(e) => setNewCustomerType(e.target.value as any)}
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="customer">Retail Customer</option>
                    <option value="wholesaler">B2B / Wholesaler</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Address
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <textarea
                    rows={2}
                    placeholder="Street address, city, pin code..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '10px',
                backgroundColor: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('existing')}
                style={{
                  flex: 1,
                  height: '42px',
                  borderRadius: '9999px',
                  border: '1.5px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Back to List
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 2,
                  height: '42px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                }}
              >
                {isSaving ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                <span>Save & Select Customer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
