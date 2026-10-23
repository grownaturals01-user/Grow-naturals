import React, { useState } from 'react';
import { LandscapingProject, CustomerEnquiry, EnquiryStatus, QuotationLineItem } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { calculateQuotationSummary, formatCurrency } from '../../utils/calculations';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  CheckCircle,
  ArrowRight,
  Save,
  RefreshCw,
  Plus,
  CheckCircle2,
  FolderCheck,
  History,
  Layers,
} from 'lucide-react';

interface Step1EnquiryProps {
  project: LandscapingProject;
}

const COMMON_REQUIREMENTS = [
  'Lawn Turf (Carpet / Bermuda / Zoysia)',
  'Natural Stone Flagstone Stepping Pathways',
  'Automated Sprinkler & Drip Irrigation',
  'Ornamental Palms & Specimen Trees',
  'Fragrant Flowering Shrub Borders',
  'Architectural Water Fountain / Cascade',
  'Low-voltage Outdoor LED Garden Lights',
  'Designer FRP / Ceramic Planters',
  'Pergola / Timber Gazebo Shading',
  'Vertical Living Green Wall',
  'Soil Enrichment & Agricultural Grading',
  'Regular AMC Garden Maintenance',
];

const TURF_SPECIES = [
  { name: 'Bermuda Tifdwarf Turf Sod', spec: 'Standard high-traffic sports & villa lawn', price: 28 },
  { name: 'Korean Velvet Grass Carpet Sod', spec: 'Dense luxury velvet soft lawn (Barefoot feel)', price: 32 },
  { name: 'Zoysia Japonica Coastal Turf Sod', spec: 'Salt-tolerant fine blade luxury turf', price: 34 },
  { name: 'Centipede Farm Hybrid Lawn', spec: 'Hardy drought-tolerant farm turf', price: 24 },
];

export const Step1Enquiry: React.FC<Step1EnquiryProps> = ({ project }) => {
  const {
    updateProjectStep,
    setSelectedStep,
    approveAndConvertToProject,
    recordMaterialChange,
    currency,
  } = useProjects();

  const [formData, setFormData] = useState<CustomerEnquiry>(project.step1Enquiry);
  const [customReq, setCustomReq] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Material change form state
  const [changeDesc, setChangeDesc] = useState('');
  const [matName, setMatName] = useState('');
  const [matSpec, setMatSpec] = useState('');
  const [matCategory, setMatCategory] = useState<QuotationLineItem['category']>('plants');
  const [matQty, setMatQty] = useState(1);
  const [matUnit, setMatUnit] = useState('Nos');
  const [matPrice, setMatPrice] = useState(2500);

  const quoteSummary = calculateQuotationSummary(
    project.step3Quotation.items,
    project.step3Quotation.taxPercent,
    project.step3Quotation.discountAmount
  );

  const handleSave = () => {
    updateProjectStep(project.id, 'step1Enquiry', formData);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleStatusChange = (status: EnquiryStatus) => {
    const updated = { ...formData, enquiryStatus: status };
    setFormData(updated);
    updateProjectStep(project.id, 'step1Enquiry', updated);
  };

  const toggleRequirement = (req: string) => {
    const exists = formData.projectRequirements.includes(req);
    const updated = exists
      ? formData.projectRequirements.filter(r => r !== req)
      : [...formData.projectRequirements, req];
    setFormData({ ...formData, projectRequirements: updated });
  };

  const addCustomRequirement = () => {
    if (!customReq.trim()) return;
    if (!formData.projectRequirements.includes(customReq.trim())) {
      setFormData({
        ...formData,
        projectRequirements: [...formData.projectRequirements, customReq.trim()],
      });
    }
    setCustomReq('');
  };

  // Swap turf grass species directly from enquiry
  const handleSwapTurf = (turf: typeof TURF_SPECIES[0]) => {
    const items = [...project.step3Quotation.items];
    const existingTurfIndex = items.findIndex(
      i => i.category === 'plants' && (i.name.toLowerCase().includes('turf') || i.name.toLowerCase().includes('grass'))
    );

    let updatedItems: QuotationLineItem[];
    const areaSqFt = project.step2SiteVisit?.measurements?.lawnAreaSqFt || 1000;

    if (existingTurfIndex >= 0) {
      const old = items[existingTurfIndex];
      const updatedItem: QuotationLineItem = {
        ...old,
        name: turf.name,
        spec: turf.spec,
        unitPrice: turf.price,
        total: (Number(old.quantity) || areaSqFt) * turf.price,
      };
      updatedItems = items.map((item, idx) => (idx === existingTurfIndex ? updatedItem : item));
    } else {
      const newItem: QuotationLineItem = {
        id: `turf-${Date.now()}`,
        category: 'plants',
        name: turf.name,
        spec: turf.spec,
        quantity: areaSqFt,
        unit: 'Sq.Ft',
        unitPrice: turf.price,
        total: areaSqFt * turf.price,
      };
      updatedItems = [...items, newItem];
    }

    recordMaterialChange(
      project.id,
      `Client selected ${turf.name} at ${formatCurrency(turf.price, currency)}/sq.ft`,
      updatedItems
    );

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  // Add custom material change
  const handleApplyMaterialChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) return;

    const newItem: QuotationLineItem = {
      id: `item-${Date.now()}`,
      category: matCategory,
      name: matName.trim(),
      spec: matSpec.trim() || 'Client requested specification change',
      quantity: Number(matQty) || 1,
      unit: matUnit.trim() || 'Nos',
      unitPrice: Number(matPrice) || 0,
      total: (Number(matQty) || 1) * (Number(matPrice) || 0),
    };

    const updatedItems = [...project.step3Quotation.items, newItem];
    const desc = changeDesc.trim() || `Added/changed material: ${matName} (${matQty} ${matUnit})`;

    recordMaterialChange(project.id, desc, updatedItems);

    setMatName('');
    setMatSpec('');
    setChangeDesc('');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleNextStep = () => {
    handleSave();
    setSelectedStep('site_visit');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Enquiry Status & Convert CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Step 1 of 7 · Client Intake & Enquiry
            </span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-xs font-mono font-medium text-neutral-500">{project.code}</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">
            Customer Enquiry, Requirements & Material Specifications
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage customer contact, site address, scope requirements, material revisions, and approval conversion.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Enquiry Status Picker */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
            <span className="text-[11px] font-medium text-neutral-600 pl-1.5">Enquiry Status:</span>
            <select
              value={formData.enquiryStatus || 'New Enquiry'}
              onChange={e => handleStatusChange(e.target.value as EnquiryStatus)}
              className="text-xs font-semibold border-none rounded bg-white px-2 py-1 text-neutral-900 shadow-xs"
            >
              <option value="New Enquiry">New Enquiry</option>
              <option value="Site Visit Scheduled">Site Visit Scheduled</option>
              <option value="Site Visit Completed">Site Visit Completed</option>
              <option value="Quotation Drafted">Quotation Drafted</option>
              <option value="Materials Revised">Materials Revised</option>
              <option value="Quotation Approved">Quotation Approved</option>
              <option value="Enquiry Lost">Enquiry Dropped</option>
            </select>
          </div>

          {/* If already converted to project */}
          {project.isConvertedToProject ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-lg">
              <FolderCheck className="w-4 h-4" />
              <span>Active Project (Moved to Project Menu)</span>
            </div>
          ) : (
            <button
              onClick={() => approveAndConvertToProject(project.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
              title="Customer approved quotation -> move to Active Projects menu"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Quotation & Move to Project</span>
            </button>
          )}

          {isSavedNotice && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <span>Site Visit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Material Change & Quotation Auto-Sync Panel */}
      <div className="bg-white border-2 border-purple-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-purple-950">
                <RefreshCw className="w-4 h-4 text-purple-700" />
                <span>Client Material Revision & Quotation Synchronizer</span>
              </span>
              <span className="text-[11px] font-semibold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full">
                Revision #{formData.revisionCount || 0}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              When client requests material changes (e.g. changing grass variety, adding palms or planters), modify them here to automatically recalculate the commercial quotation!
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-neutral-500 block">Current Quotation Total:</span>
            <span className="text-lg font-bold text-emerald-900 tabular-nums">
              {formatCurrency(quoteSummary.totalQuotation, currency)}
            </span>
          </div>
        </div>

        {/* Quick Turf Species Swap Selector */}
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1.5">
            1. Quick Turf Grass Variety Change (Auto-recalculates Lawn Quotation):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TURF_SPECIES.map((turf, idx) => {
              const isSelected = project.step3Quotation.items.some(
                item => item.name.toLowerCase().includes(turf.name.toLowerCase().split(' ')[0])
              );
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSwapTurf(turf)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                      : 'border-neutral-200 hover:border-purple-300 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <span>{turf.name.split(' ')[0]} {turf.name.split(' ')[1]}</span>
                    <span className="text-emerald-800 tabular-nums">{formatCurrency(turf.price, currency)}/sq.ft</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1 line-clamp-1">{turf.spec}</div>
                  {isSelected && (
                    <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">✓ Active in Quote</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add / Modify Custom Material in Quotation Form */}
        <form onSubmit={handleApplyMaterialChange} className="pt-2 border-t border-purple-100 space-y-2">
          <label className="block text-xs font-bold text-neutral-800">
            2. Add / Upgrade Material in Client Scope:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <select
              value={matCategory}
              onChange={e => setMatCategory(e.target.value as any)}
              className="sm:col-span-2 px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white"
            >
              <option value="plants">Plants & Turf</option>
              <option value="materials">Materials & Soil</option>
              <option value="pots">Pots & Planters</option>
              <option value="labour">Special Labour</option>
              <option value="transport">Transport</option>
            </select>

            <input
              type="text"
              placeholder="Material / Plant Name (e.g. 4 Tall FRP Planters)"
              value={matName}
              onChange={e => setMatName(e.target.value)}
              className="sm:col-span-3 px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white"
              required
            />

            <input
              type="text"
              placeholder="Reason / change notes..."
              value={changeDesc}
              onChange={e => setChangeDesc(e.target.value)}
              className="sm:col-span-3 px-2.5 py-1.5 border border-neutral-300 rounded-lg bg-white"
            />

            <input
              type="number"
              placeholder="Qty"
              value={matQty}
              onChange={e => setMatQty(Number(e.target.value))}
              className="sm:col-span-1 px-2 py-1.5 border border-neutral-300 rounded-lg bg-white tabular-nums text-right"
            />

            <input
              type="text"
              placeholder="Unit"
              value={matUnit}
              onChange={e => setMatUnit(e.target.value)}
              className="sm:col-span-1 px-2 py-1.5 border border-neutral-300 rounded-lg bg-white"
            />

            <input
              type="number"
              placeholder="Price"
              value={matPrice}
              onChange={e => setMatPrice(Number(e.target.value))}
              className="sm:col-span-1 px-2 py-1.5 border border-neutral-300 rounded-lg bg-white tabular-nums text-right"
            />

            <button
              type="submit"
              className="sm:col-span-1 px-3 py-1.5 font-bold text-white bg-purple-800 hover:bg-purple-900 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Apply
            </button>
          </div>
        </form>

        {/* Material Change Revision History Log */}
        {formData.materialChangeHistory && formData.materialChangeHistory.length > 0 && (
          <div className="pt-2 border-t border-purple-100 space-y-1.5">
            <span className="text-[11px] font-bold text-purple-950 flex items-center gap-1">
              <History className="w-3 h-3 text-purple-700" />
              <span>Material Revision Audit Log:</span>
            </span>
            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
              {formData.materialChangeHistory.map(rec => (
                <div key={rec.id} className="text-[11px] p-2 rounded bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-purple-900">{rec.description}</span>
                    <span className="text-neutral-500 ml-2">({rec.date} by {rec.changedBy})</span>
                  </div>
                  <span className="font-bold tabular-nums text-purple-950">
                    {formatCurrency(rec.previousQuotationTotal, currency)} → {formatCurrency(rec.newQuotationTotal, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Details */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Customer Identification</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Primary project owner or authorized representative.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="e.g. Dr. Arvind Swaminathan"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    placeholder="+91 98401 23456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    placeholder="client@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Property / Client Classification</label>
              <select
                value={formData.clientType}
                onChange={e => setFormData({ ...formData, clientType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
              >
                <option value="Residential Villa">Residential Villa</option>
                <option value="Commercial Plaza">Commercial Plaza</option>
                <option value="Corporate Campus">Corporate Campus</option>
                <option value="Rooftop Terrace">Rooftop Terrace</option>
                <option value="Farmhouse">Farmhouse Estate</option>
                <option value="Resort">Resort / Hotel</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Enquiry Date</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="date"
                    value={formData.enquiryDate}
                    onChange={e => setFormData({ ...formData, enquiryDate: e.target.value })}
                    className="w-full pl-8 pr-2 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Target Start Date</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="date"
                    value={formData.targetStartDate}
                    onChange={e => setFormData({ ...formData, targetStartDate: e.target.value })}
                    className="w-full pl-8 pr-2 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Client Target Budget ({currency})</label>
              <div className="relative">
                <Wallet className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                <input
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={e => setFormData({ ...formData, estimatedBudget: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums font-medium"
                  placeholder="500000"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Indicative value: {formatCurrency(formData.estimatedBudget, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Center Column: Site Location Details */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Site Location & Address</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Physical destination for site inspection & logistics.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Site Street Address *</label>
              <textarea
                rows={3}
                value={formData.siteAddress}
                onChange={e => setFormData({ ...formData, siteAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
                placeholder="e.g. Villa 42, Palm Meadows Enclave, Phase 2, Sarjapur Road"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">City / Region</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  placeholder="e.g. Bengaluru"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Postal / Pin Code</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  placeholder="560035"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Prominent Landmark</label>
              <input
                type="text"
                value={formData.landmark}
                onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
                placeholder="e.g. Behind Wipro Corporate Office, Gate 3"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Special Client Directives & Notes</label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
                placeholder="Specific aesthetic preferences, pet-friendly plants, fragrance requests, accessibility constraints..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Project Requirements Scope Checklist */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center justify-between">
              <span>Required Scope Elements</span>
              <span className="text-xs font-semibold text-emerald-800">
                {formData.projectRequirements.length} selected
              </span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Check elements requested during initial consultation.</p>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {COMMON_REQUIREMENTS.map((req, i) => {
              const isChecked = formData.projectRequirements.includes(req);
              return (
                <label
                  key={i}
                  className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-medium'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleRequirement(req)}
                    className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>{req}</span>
                </label>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-xs font-medium text-neutral-700 mb-1">Add Custom Requirement</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customReq}
                onChange={e => setCustomReq(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomRequirement())}
                placeholder="e.g. Zen Buddha Statue with pond"
                className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <button
                type="button"
                onClick={addCustomRequirement}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
