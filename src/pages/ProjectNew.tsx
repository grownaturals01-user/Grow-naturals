import React, { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { User, Customer, Category, ProjectWorkType } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  FolderKanban,
  User as UserIcon,
  UserCheck,
  UserPlus,
  Building2,
  MapPin,
  Phone,
  FileText,
  Tag,
  Briefcase,
  Layers,
  IndianRupee,
  Receipt,
  Calendar,
  Clock,
  Plus,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Share2,
  X,
  Calculator,
  ShieldCheck
} from 'lucide-react';

export const ProjectNew: React.FC = () => {
  const { businessId, business, businesses } = useBusiness();
  const navigate = useNavigate();

  const safeBusinessId = (businessId && businessId !== 'all') ? businessId : (businesses[0]?.id || 'grow-naturals');

  // Master Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workTypes, setWorkTypes] = useState<ProjectWorkType[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form Fields - Step 1: Client & Project Details
  const [clientMode, setClientMode] = useState<'select' | 'new'>('select');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [gstNumber, setGstNumber] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [referredBy, setReferredBy] = useState<string>('');
  const [customProjectTitle, setCustomProjectTitle] = useState<string>('');

  // Form Fields - Step 2: Select Product Category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatType, setNewCatType] = useState<string>('plants');
  const [newCatDesc, setNewCatDesc] = useState<string>('');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  // Form Fields - Step 3: Select Project Work
  const [selectedWorkType, setSelectedWorkType] = useState<string>('');
  const [isWorkTypeModalOpen, setIsWorkTypeModalOpen] = useState<boolean>(false);
  const [newWorkTypeName, setNewWorkTypeName] = useState<string>('');
  const [newWorkTypeDesc, setNewWorkTypeDesc] = useState<string>('');
  const [isSavingWorkType, setIsSavingWorkType] = useState<boolean>(false);

  const [workNature, setWorkNature] = useState<'new' | 'rework'>('new');
  const [reworkSource, setReworkSource] = useState<'our_existing' | 'someone_else' | ''>('');

  // Form Fields - Step 4: Site Visit Payment
  const [siteVisitAmount, setSiteVisitAmount] = useState<string>('0');

  // Form Fields - Step 5: Allowance / Excess Site Visit Expense
  const [actualSiteExpense, setActualSiteExpense] = useState<string>('');
  const [allowanceAmount, setAllowanceAmount] = useState<string>('0');
  const [allowanceNotes, setAllowanceNotes] = useState<string>('');

  // Form Fields - Step 6: Appointment & Supervisor
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [supervisorId, setSupervisorId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [budget, setBudget] = useState<string>('0');
  const [description, setDescription] = useState<string>('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initial Data Fetching
  const fetchMasterData = async () => {
    setLoadingData(true);
    try {
      const [custData, catData, workData, supData] = await Promise.all([
        api.get('/customers').catch(() => []),
        api.get('/categories', { business_id: safeBusinessId }).catch(() => []),
        api.get('/projects/work-types', { business_id: safeBusinessId }).catch(() => []),
        api.get('/supervisors').catch(() => [])
      ]);

      setCustomers(Array.isArray(custData) ? custData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setWorkTypes(Array.isArray(workData) ? workData : []);
      setSupervisors(Array.isArray(supData) ? supData : []);

      if (Array.isArray(workData) && workData.length > 0 && !selectedWorkType) {
        setSelectedWorkType(workData[0].name);
      }
      if (Array.isArray(catData) && catData.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catData[0].id);
        setSelectedCategoryName(catData[0].name);
      }
    } catch (e) {
      console.warn('Failed loading project master data', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, [safeBusinessId]);

  // Handle existing customer selection
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (!customerId) return;

    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setClientName(found.name || '');
      setPhone(found.phone || '');
      setAddress(found.address || '');
      setGstNumber(found.gstin || '');
    }
  };

  // Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsSavingCategory(true);
    try {
      const created = await api.post('/categories', {
        business_id: safeBusinessId,
        name: newCatName.trim(),
        type: newCatType || 'general',
        description: newCatDesc.trim(),
        sort_order: categories.length + 1
      });

      setCategories((prev) => [...prev, created]);
      setSelectedCategoryId(created.id);
      setSelectedCategoryName(created.name);
      setNewCatName('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      alert(`Error creating category: ${err.message}`);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Handle Work Type Creation
  const handleCreateWorkType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkTypeName.trim()) return;

    setIsSavingWorkType(true);
    try {
      const created = await api.post('/projects/work-types', {
        business_id: safeBusinessId,
        name: newWorkTypeName.trim(),
        description: newWorkTypeDesc.trim(),
        sort_order: workTypes.length + 1
      });

      setWorkTypes((prev) => [...prev, created]);
      setSelectedWorkType(created.name);
      setNewWorkTypeName('');
      setNewWorkTypeDesc('');
      setIsWorkTypeModalOpen(false);
    } catch (err: any) {
      alert(`Error creating work type: ${err.message}`);
    } finally {
      setIsSavingWorkType(false);
    }
  };

  // Allowance Calculator helper
  const handleActualExpenseChange = (val: string) => {
    setActualSiteExpense(val);
    const exp = parseFloat(val) || 0;
    const rcv = parseFloat(siteVisitAmount) || 0;
    if (exp > rcv) {
      const excess = exp - rcv;
      setAllowanceAmount(String(excess));
    } else {
      setAllowanceAmount('0');
    }
  };

  // Handle main submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientName.trim()) {
      setFormError('Please enter or select a Client Name in Step 1.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (workNature === 'rework' && !reworkSource) {
      setFormError('Please select whose previous work this is in Step 3 (Our Existing Work vs Someone Else\'s Work).');
      return;
    }

    const generatedTitle = customProjectTitle.trim() || [
      clientName.trim(),
      selectedWorkType || 'Project',
      location.trim()
    ].filter(Boolean).join(' - ');

    setIsSubmitting(true);
    try {
      const payload = {
        business_id: safeBusinessId,
        name: generatedTitle,
        client_name: clientName.trim(),
        client_id: selectedCustomerId || null,
        company: company.trim(),
        address: address.trim(),
        phone: phone.trim(),
        gst_number: gstNumber.trim(),
        location: location.trim(),
        referred_by: referredBy.trim(),
        category_id: selectedCategoryId || '',
        category_name: selectedCategoryName || categories.find((c) => c.id === selectedCategoryId)?.name || '',
        work_type: selectedWorkType || '',
        work_nature: workNature,
        rework_source: workNature === 'rework' ? reworkSource : '',
        site_visit_amount: Number(siteVisitAmount) || 0,
        allowance_amount: Number(allowanceAmount) || 0,
        allowance_notes: allowanceNotes.trim(),
        appointment_date: appointmentDate || null,
        supervisor_id: supervisorId || null,
        start_date: startDate || null,
        budget: Math.round(Number(budget)) || 0,
        description: description.trim(),
        status: 'active'
      };

      const res = await api.post('/projects', payload);
      navigate(`/projects/${res.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', fontFamily: "'Nunito', sans-serif", paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '22px' }}>
        <div className="page-title-group">
          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '8px',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={15} /> Back to Projects List
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(254, 159, 67, 0.12)',
                color: '#FE9F43',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FolderKanban size={24} />
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '22px', fontWeight: 700, color: '#092C4C' }}>
                Create New Project
              </h1>
              <p className="page-description" style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                {business?.name} &bull; 7-Step Client Setup & Site Visit Flow
              </p>
            </div>
          </div>
        </div>
      </div>

      {formError && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif"
          }}
        >
          <AlertCircle size={18} />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {/* ========================================================================= */}
        {/* STEP 1: Enter Client & Project Details */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', width: '100%', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #E2E8F0',
              padding: '14px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#FE9F43',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 2px 6px rgba(254, 159, 67, 0.35)'
                }}
              >
                1
              </span>
              <h3 className="card-title" style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '15px', fontWeight: 700, color: '#092C4C' }}>
                Step 1: Enter Client & Project Details
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${clientMode === 'select' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '12px',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  padding: '6px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setClientMode('select')}
              >
                <UserCheck size={14} /> Select Existing Client
              </button>
              <button
                type="button"
                className={`btn btn-sm ${clientMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '12px',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  padding: '6px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => {
                  setClientMode('new');
                  setSelectedCustomerId('');
                }}
              >
                <UserPlus size={14} /> + New Client
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            {/* Existing client quick selector bar */}
            {clientMode === 'select' && (
              <div
                style={{
                  backgroundColor: '#FFF6EE',
                  border: '1px solid #FFDABA',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: '18px'
                }}
              >
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#c97324', fontSize: '13px' }}>
                  <UserCheck size={16} color="#FE9F43" />
                  <span>Choose from Existing Registered Clients</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                  <select
                    className="form-select"
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                  >
                    <option value="">-- Choose Existing Client from Database --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} {c.address ? `• ${c.address.substring(0, 32)}...` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedCustomerId && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setClientName('');
                        setPhone('');
                        setAddress('');
                        setGstNumber('');
                      }}
                      title="Clear Selection"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      <X size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="form-grid-2" style={{ marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserIcon size={14} color="#FE9F43" />
                  <span>Client Name <span className="required">*</span></span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter or confirm client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} color="#64748b" />
                  <span>Company Name</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Oberoi Realty, Deshpande Estates"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="form-grid-3" style={{ marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} color="#64748b" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#64748b" />
                  <span>GST Details / GSTIN</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#64748b" />
                  <span>Project Location / Place</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Baner Villa, Hinjewadi Phase 1"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                />
              </div>
            </div>

            <div className="form-grid-2" style={{ marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#64748b" />
                  <span>Address</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Site / billing full postal address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={14} color="#64748b" />
                  <span>Referred By (Client / Contact)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select
                    className="form-select"
                    value={customers.some((c) => c.name === referredBy) ? referredBy : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setReferredBy(e.target.value);
                      }
                    }}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '13px' }}
                  >
                    <option value="">-- Pick Client --</option>
                    {customers.map((c) => (
                      <option key={`ref-${c.id}`} value={c.name}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Or custom referrer name"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="#64748b" />
                <span>Custom Project Title (Optional - Auto-generated from Client + Work + Location if blank)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  clientName
                    ? `${clientName} - ${selectedWorkType || 'Landscaping'} - ${location || 'Site'}`
                    : 'e.g. Luxury Rooftop Penthouse Garden'
                }
                value={customProjectTitle}
                onChange={(e) => setCustomProjectTitle(e.target.value)}
                style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 2: Select Product Category */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', width: '100%', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #E2E8F0',
              padding: '14px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#FE9F43',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 2px 6px rgba(254, 159, 67, 0.35)'
                }}
              >
                2
              </span>
              <h3 className="card-title" style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '15px', fontWeight: 700, color: '#092C4C' }}>
                Step 2: Select Product Category
              </h3>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#FE9F43',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                padding: '6px 14px'
              }}
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <PlusCircle size={15} /> + Add New Category
            </button>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} color="#FE9F43" />
                <span>Product Category <span className="required">*</span></span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                <select
                  className="form-select"
                  value={selectedCategoryId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsCategoryModalOpen(true);
                    } else {
                      setSelectedCategoryId(e.target.value);
                      const cat = categories.find((c) => c.id === e.target.value);
                      if (cat) setSelectedCategoryName(cat.name);
                    }
                  }}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.type ? `(${c.type})` : ''}
                    </option>
                  ))}
                  <option value="__add_new__" style={{ fontWeight: 700, color: '#FE9F43' }}>
                    + Add New Category
                  </option>
                </select>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCategoryModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600
                  }}
                >
                  <Plus size={16} /> Add Category
                </button>
              </div>

              {/* Quick Pills for categories with hover animation */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {categories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <button
                      key={`pill-${c.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(c.id);
                        setSelectedCategoryName(c.name);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid #FE9F43' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? 'rgba(254, 159, 67, 0.12)' : '#ffffff',
                        color: isSelected ? '#FE9F43' : '#64748b',
                        boxShadow: isSelected ? '0 2px 6px rgba(254, 159, 67, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                      }}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 3: Select Project Work & Rework Condition */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', width: '100%', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #E2E8F0',
              padding: '14px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#FE9F43',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 2px 6px rgba(254, 159, 67, 0.35)'
                }}
              >
                3
              </span>
              <h3 className="card-title" style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '15px', fontWeight: 700, color: '#092C4C' }}>
                Step 3: Select Project Work & Nature
              </h3>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#FE9F43',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                padding: '6px 14px'
              }}
              onClick={() => setIsWorkTypeModalOpen(true)}
            >
              <PlusCircle size={15} /> + Add New Work
            </button>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} color="#FE9F43" />
                <span>Type of Work Required <span className="required">*</span></span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                <select
                  className="form-select"
                  value={selectedWorkType}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsWorkTypeModalOpen(true);
                    } else {
                      setSelectedWorkType(e.target.value);
                    }
                  }}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                  required
                >
                  <option value="">-- Select Work Type --</option>
                  {workTypes.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} {w.description ? `— ${w.description}` : ''}
                    </option>
                  ))}
                  <option value="__add_new__" style={{ fontWeight: 700, color: '#FE9F43' }}>
                    + Add New Work
                  </option>
                </select>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsWorkTypeModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600
                  }}
                >
                  <Plus size={16} /> Add Work
                </button>
              </div>

              {/* Work types pill selector with hover animation */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {workTypes.map((w) => {
                  const isSelected = selectedWorkType === w.name;
                  return (
                    <button
                      key={`work-pill-${w.id}`}
                      type="button"
                      onClick={() => setSelectedWorkType(w.name)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid #092C4C' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? '#092C4C' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#475569',
                        boxShadow: isSelected ? '0 2px 8px rgba(9, 44, 76, 0.25)' : '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                      }}
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Nature: New Work vs Rework */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <label className="form-label" style={{ marginBottom: '10px', display: 'block', fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                Work Classification / Nature <span className="required">*</span>
              </label>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: workNature === 'new' ? '#ffffff' : 'transparent',
                    border: workNature === 'new' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    boxShadow: workNature === 'new' ? '0 3px 10px rgba(22, 163, 74, 0.15)' : 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '13px',
                    color: workNature === 'new' ? '#16a34a' : '#475569',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="work_nature"
                    value="new"
                    checked={workNature === 'new'}
                    onChange={() => {
                      setWorkNature('new');
                      setReworkSource('');
                    }}
                    style={{ accentColor: '#16a34a' }}
                  />
                  <Sparkles size={16} color="#16a34a" />
                  <span>New Work</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    backgroundColor: workNature === 'rework' ? '#ffffff' : 'transparent',
                    border: workNature === 'rework' ? '2px solid #e11d48' : '1px solid #cbd5e1',
                    boxShadow: workNature === 'rework' ? '0 3px 10px rgba(225, 29, 72, 0.15)' : 'none',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '13px',
                    color: workNature === 'rework' ? '#e11d48' : '#475569',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="work_nature"
                    value="rework"
                    checked={workNature === 'rework'}
                    onChange={() => setWorkNature('rework')}
                    style={{ accentColor: '#e11d48' }}
                  />
                  <RotateCcw size={16} color="#e11d48" />
                  <span>Rework</span>
                </label>
              </div>

              {/* Rework Source Sub-Question */}
              {workNature === 'rework' && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '14px',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px'
                  }}
                >
                  <label className="form-label" style={{ color: '#9f1239', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                    Whose previous work is this? <span className="required">*</span>
                  </label>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: reworkSource === 'our_existing' ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        border: reworkSource === 'our_existing' ? '2px solid #e11d48' : '1px solid #fda4af',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '13px',
                        color: reworkSource === 'our_existing' ? '#9f1239' : '#475569',
                        boxShadow: reworkSource === 'our_existing' ? '0 2px 6px rgba(225, 29, 72, 0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="rework_source"
                        value="our_existing"
                        checked={reworkSource === 'our_existing'}
                        onChange={() => setReworkSource('our_existing')}
                        style={{ accentColor: '#e11d48' }}
                      />
                      <Building2 size={15} color="#e11d48" />
                      <span>Our Existing Work</span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: reworkSource === 'someone_else' ? '#ffffff' : 'rgba(255,255,255,0.6)',
                        border: reworkSource === 'someone_else' ? '2px solid #e11d48' : '1px solid #fda4af',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '13px',
                        color: reworkSource === 'someone_else' ? '#9f1239' : '#475569',
                        boxShadow: reworkSource === 'someone_else' ? '0 2px 6px rgba(225, 29, 72, 0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="rework_source"
                        value="someone_else"
                        checked={reworkSource === 'someone_else'}
                        onChange={() => setReworkSource('someone_else')}
                        style={{ accentColor: '#e11d48' }}
                      />
                      <UserIcon size={15} color="#e11d48" />
                      <span>Someone Else's Work</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 4 & 5: Site Visit Payment & Allowance */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', width: '100%', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #E2E8F0',
              padding: '14px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#FE9F43',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 2px 6px rgba(254, 159, 67, 0.35)'
                }}
              >
                4
              </span>
              <h3 className="card-title" style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '15px', fontWeight: 700, color: '#092C4C' }}>
                Steps 4 & 5: Site Visit Payment & Excess Allowance
              </h3>
            </div>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            {/* Step 4: Site Visit Payment */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IndianRupee size={15} color="#FE9F43" />
                <span>Amount Received from Client for Site Visit (₹)</span>
              </label>
              <div style={{ position: 'relative', maxWidth: '380px' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="form-input tabular"
                  style={{ paddingLeft: '30px', fontSize: '15px', fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#092C4C' }}
                  placeholder="0"
                  value={siteVisitAmount}
                  onChange={(e) => setSiteVisitAmount(e.target.value)}
                />
              </div>
              <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                Record the advance / site consultation fee collected directly from the client.
              </small>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: '20px 0' }} />

            {/* Step 5: Allowance Section */}
            <div
              style={{
                backgroundColor: '#FFF6EE',
                border: '1px solid #FFDABA',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Receipt size={18} color="#FE9F43" />
                <h4 style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '14px', fontWeight: 700, color: '#c97324' }}>
                  Step 5: Allowance / Excess Site Visit Expense
                </h4>
              </div>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#78350f' }}>
                Required when the amount received from the client for the site visit is less than the actual site visit expenses.
              </p>

              {/* Calculator Helper */}
              <div className="form-grid-3" style={{ marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600, color: '#78350f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calculator size={13} color="#FE9F43" />
                    <span>Actual Site Expense (₹) (Helper)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input tabular"
                    placeholder="e.g. 4000"
                    value={actualSiteExpense}
                    onChange={(e) => handleActualExpenseChange(e.target.value)}
                    style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600, color: '#78350f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IndianRupee size={13} color="#FE9F43" />
                    <span>Client Received (Step 4)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input tabular"
                    disabled
                    value={`₹${Number(siteVisitAmount) || 0}`}
                    style={{ backgroundColor: '#FFEDDD', fontWeight: 700, fontFamily: "'Poppins', sans-serif", color: '#092C4C' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600, color: '#78350f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Receipt size={13} color="#FE9F43" />
                    <span>Allowance Amount (₹) <span className="required">*</span></span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#b45309',
                        fontWeight: 700,
                        fontFamily: "'Poppins', sans-serif"
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="form-input tabular"
                      style={{ paddingLeft: '30px', fontWeight: 700, color: '#b45309', fontFamily: "'Poppins', sans-serif", fontSize: '14px' }}
                      placeholder="0"
                      value={allowanceAmount}
                      onChange={(e) => setAllowanceAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '12px', fontWeight: 600, color: '#78350f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={13} color="#FE9F43" />
                  <span>Allowance Notes / Reason for Excess Expense</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Travel to outstation site in Lonavala + soil testing survey & drone mapping..."
                  value={allowanceNotes}
                  onChange={(e) => setAllowanceNotes(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '13px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 6: Appointment & Supervisor */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', width: '100%', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fafbfc',
              borderBottom: '1px solid #E2E8F0',
              padding: '14px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#FE9F43',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  boxShadow: '0 2px 6px rgba(254, 159, 67, 0.35)'
                }}
              >
                6
              </span>
              <h3 className="card-title" style={{ margin: 0, fontFamily: "'Poppins', sans-serif", fontSize: '15px', fontWeight: 700, color: '#092C4C' }}>
                Step 6: Appointment & Supervisor
              </h3>
            </div>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div className="form-grid-2" style={{ marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#FE9F43" />
                  <span>Appointment Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  className="form-input tabular"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                  Scheduled client consultation or site survey timestamp.
                </small>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} color="#FE9F43" />
                    <span>Supervisor</span>
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                    (Optional)
                  </span>
                </label>
                <select
                  className="form-select"
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                >
                  <option value="">Unassigned (Can assign later)</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone || 'Supervisor'})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', fontSize: '12px' }}>
                  The project can be saved without assigning a supervisor.
                </small>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IndianRupee size={14} color="#64748b" />
                  <span>Estimated Contract Budget (₹)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input tabular"
                  placeholder="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  style={{ fontFamily: "'Poppins', sans-serif", fontSize: '14px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#64748b" />
                  <span>Scope / Project Description</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Project specifications, plant quantities, lawn area, irrigation setup notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ fontFamily: "'Nunito', sans-serif", fontSize: '13px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 7: Save Project Summary & Actions */}
        {/* ========================================================================= */}
        <div
          className="card"
          style={{
            border: '2px solid #FE9F43',
            boxShadow: '0 4px 16px rgba(254, 159, 67, 0.16)',
            backgroundColor: '#FFF6EE',
            borderRadius: '10px',
            width: '100%'
          }}
        >
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontFamily: "'Poppins', sans-serif", fontSize: '16px', fontWeight: 700, color: '#092C4C' }}>
                  Step 7: Ready to Create Project?
                </h3>
                <div style={{ fontSize: '13px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '12px', fontFamily: "'Nunito', sans-serif" }}>
                  <span><strong>Client:</strong> {clientName || 'Not specified'}</span>
                  <span>&bull;</span>
                  <span><strong>Work:</strong> {selectedWorkType || 'None'} ({workNature === 'new' ? 'New Work' : 'Rework'})</span>
                  <span>&bull;</span>
                  <span><strong>Site Visit:</strong> ₹{Number(siteVisitAmount) || 0}</span>
                  {Number(allowanceAmount) > 0 && (
                    <>
                      <span>&bull;</span>
                      <span style={{ color: '#b45309' }}><strong>Allowance:</strong> ₹{allowanceAmount}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to="/projects"
                  className="btn btn-secondary"
                  style={{
                    padding: '9px 20px',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={15} /> Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#FE9F43',
                    borderColor: '#FE9F43',
                    color: '#fff',
                    padding: '9px 28px',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: "'Poppins', sans-serif",
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(254, 159, 67, 0.35)'
                  }}
                >
                  <Save size={16} />
                  {isSubmitting ? 'Saving Project...' : 'Save Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* MODAL: + Add New Category */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '480px', margin: '20px', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Poppins', sans-serif", fontSize: '16px', fontWeight: 700, color: '#092C4C' }}>
                <Tag size={18} color="#FE9F43" />
                Add New Product Category
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Category Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Vertical Gardens, Exotic Succulents, Lawn Turf"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Category Type
                  </label>
                  <select
                    className="form-select"
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                  >
                    <option value="plants">Plants & Saplings</option>
                    <option value="pots">Planters & Pots</option>
                    <option value="fertilizers">Fertilizers & Tonics</option>
                    <option value="flowers">Flowers & Cuts</option>
                    <option value="services">Landscaping & Services</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Description (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Brief description of products in this category..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingCategory}
                  style={{ backgroundColor: '#FE9F43', borderColor: '#FE9F43', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                >
                  {isSavingCategory ? 'Saving...' : 'Save & Select Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: + Add New Work */}
      {/* ========================================================================= */}
      {isWorkTypeModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setIsWorkTypeModalOpen(false)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '480px', margin: '20px', borderRadius: '12px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Poppins', sans-serif", fontSize: '16px', fontWeight: 700, color: '#092C4C' }}>
                <Briefcase size={18} color="#FE9F43" />
                Add New Project Work Type
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsWorkTypeModalOpen(false)}
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkType}>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Work Type Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Hydroponics Setup, Pond & Fountain, Rock Garden"
                    value={newWorkTypeName}
                    onChange={(e) => setNewWorkTypeName(e.target.value)}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '14px' }}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Description (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Details about standard tasks or deliverables for this work..."
                    value={newWorkTypeDesc}
                    onChange={(e) => setNewWorkTypeDesc(e.target.value)}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsWorkTypeModalOpen(false)}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingWorkType}
                  style={{ backgroundColor: '#FE9F43', borderColor: '#FE9F43', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
                >
                  {isSavingWorkType ? 'Saving...' : 'Save & Select Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
