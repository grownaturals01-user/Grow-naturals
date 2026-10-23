import React, { useState, useEffect } from 'react';
import { LandscapingProject, QuotationData, QuotationLineItem } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { calculateQuotationSummary, formatCurrency } from '../../utils/calculations';
import { PdfQuotationService } from '../../services/pdfQuotationService';
import { AiQuickQuoteModal } from '../modals/AiQuickQuoteModal';
import { Calculator, Plus, Trash2, CheckCircle, ArrowRight, Printer, Check, Clock, XCircle, FileText, Download, Loader2, Sparkles } from 'lucide-react';

interface Step3QuotationProps {
  project: LandscapingProject;
  onOpenPrintModal: () => void;
}

const PRESET_ITEMS: Array<Omit<QuotationLineItem, 'id' | 'total'>> = [
  { category: 'materials', name: 'Premium Red Topsoil', spec: 'Screened agricultural red soil', quantity: 2, unit: 'Truck', unitPrice: 18500 },
  { category: 'materials', name: 'Washed River Sand', spec: 'Cushion & aeration sand', quantity: 1, unit: 'Truck', unitPrice: 14000 },
  { category: 'materials', name: 'Organic Vermicompost', spec: 'Enriched cow dung compost (50kg bag)', quantity: 30, unit: 'Bags', unitPrice: 420 },
  { category: 'materials', name: 'Kadappa Stone Steppers', spec: '2ft x 1ft natural black stepping slabs', quantity: 50, unit: 'Pcs', unitPrice: 380 },
  { category: 'plants', name: 'Bermuda Tifdwarf Turf Sod', spec: 'Farm fresh carpet grass rolls', quantity: 1500, unit: 'Sq.Ft', unitPrice: 28 },
  { category: 'plants', name: 'Korean Velvet Grass Turf', spec: 'Dense carpet lawn sod for ornamental beds', quantity: 500, unit: 'Sq.Ft', unitPrice: 32 },
  { category: 'plants', name: 'Specimen Plumeria Alba Tree', spec: '7ft height, branched flowering frangipani', quantity: 2, unit: 'Nos', unitPrice: 6500 },
  { category: 'plants', name: 'Areca Palm Screening Clumps', spec: '6ft bushy multi-stem palms', quantity: 20, unit: 'Nos', unitPrice: 950 },
  { category: 'pots', name: 'FRP Contemporary Planters', spec: '24 inch tall cylindrical matte charcoal', quantity: 4, unit: 'Nos', unitPrice: 3800 },
  { category: 'labour', name: 'Site Earthwork & Soil Grading', spec: 'Levelling, rotavating & grading crew', quantity: 12, unit: 'Man-days', unitPrice: 900 },
  { category: 'labour', name: 'Turf Laying & Stone Masonry Team', spec: 'Specialist lawn turf installation', quantity: 15, unit: 'Man-days', unitPrice: 1050 },
  { category: 'transport', name: 'Nursery Stock Transport', spec: 'Mini-truck freight from farm to site', quantity: 2, unit: 'Trips', unitPrice: 3200 },
];

export const Step3Quotation: React.FC<Step3QuotationProps> = ({ project, onOpenPrintModal }) => {
  const {
    updateProjectStep,
    updateQuotationStatus,
    approveAndConvertToProject,
    recordMaterialChange,
    setSelectedStep,
    currency,
  } = useProjects();
  const [data, setData] = useState<QuotationData>(project.step3Quotation);
  const [showAiQuoteModal, setShowAiQuoteModal] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    setData(project.step3Quotation);
  }, [project.step3Quotation]);

  // New item state
  const [newItemName, setNewItemName] = useState('');
  const [newItemSpec, setNewItemSpec] = useState('');
  const [newItemCat, setNewItemCat] = useState<QuotationLineItem['category']>('materials');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('Nos');
  const [newItemPrice, setNewItemPrice] = useState(1000);

  // Approval modal / quick approve state
  const [approverName, setApproverName] = useState(project.step1Enquiry.clientName || '');
  const [poReference, setPoReference] = useState(`PO-${new Date().toISOString().split('T')[0]}`);

  const summary = calculateQuotationSummary(data.items, data.taxPercent, data.discountAmount);

  const handleSave = () => {
    updateProjectStep(project.id, 'step3Quotation', data);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const updateItem = (id: string, field: keyof QuotationLineItem, value: any) => {
    const updated = data.items.map(item => {
      if (item.id === id) {
        const next = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          next.total = Number(next.quantity) * Number(next.unitPrice);
        }
        return next;
      }
      return item;
    });
    setData({ ...data, items: updated });
    updateProjectStep(project.id, 'step3Quotation', { ...data, items: updated });
  };

  const removeItem = (id: string) => {
    const updated = data.items.filter(i => i.id !== id);
    setData({ ...data, items: updated });
    updateProjectStep(project.id, 'step3Quotation', { ...data, items: updated });
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const item: QuotationLineItem = {
      id: `item-${Date.now()}`,
      category: newItemCat,
      name: newItemName.trim(),
      spec: newItemSpec.trim() || 'Standard landscape specification',
      quantity: Number(newItemQty) || 1,
      unit: newItemUnit.trim() || 'Nos',
      unitPrice: Number(newItemPrice) || 0,
      total: (Number(newItemQty) || 1) * (Number(newItemPrice) || 0),
    };
    const updated = [...data.items, item];
    setData({ ...data, items: updated });
    recordMaterialChange(project.id, `Added material: ${item.name} (${item.quantity} ${item.unit})`, updated);
    setNewItemName('');
    setNewItemSpec('');
  };

  const quickAddPreset = (preset: typeof PRESET_ITEMS[0]) => {
    const item: QuotationLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: preset.category,
      name: preset.name,
      spec: preset.spec,
      quantity: preset.quantity,
      unit: preset.unit,
      unitPrice: preset.unitPrice,
      total: preset.quantity * preset.unitPrice,
    };
    const updated = [...data.items, item];
    setData({ ...data, items: updated });
    recordMaterialChange(project.id, `Added material preset: ${item.name}`, updated);
  };

  const handleStatusChange = (status: QuotationData['status']) => {
    const isApproved = status === 'Approved';
    if (isApproved && !project.isConvertedToProject) {
      approveAndConvertToProject(project.id, approverName || project.step1Enquiry.clientName, poReference);
      return;
    }

    const updated: QuotationData = {
      ...data,
      status,
      approvedDate: isApproved ? new Date().toISOString().split('T')[0] : data.approvedDate,
      approvedByName: isApproved ? (approverName || project.step1Enquiry.clientName) : data.approvedByName,
      approvalReferencePo: isApproved ? poReference : data.approvalReferencePo,
    };
    setData(updated);
    updateProjectStep(project.id, 'step3Quotation', updated);
    updateQuotationStatus(project.id, status, approverName, poReference);
  };

  const handleNextStep = () => {
    handleSave();
    setSelectedStep('advance_planning');
  };

  const filteredItems = activeCategoryFilter === 'all'
    ? data.items
    : data.items.filter(i => i.category === activeCategoryFilter);

  const getStatusBadge = () => {
    switch (data.status) {
      case 'Approved':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
            <Check className="w-3.5 h-3.5" /> Approved by Customer
          </span>
        );
      case 'Sent':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" /> Sent to Customer
          </span>
        );
      case 'In Review':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" /> In Negotiation / Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-md">
            <XCircle className="w-3.5 h-3.5" /> Rejected / Needs Revision
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-neutral-700 bg-neutral-200 px-2.5 py-1 rounded-md">
            Draft Quotation
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Step 3 of 7 · Commercial Proposal
            </span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500 font-mono">{data.quotationNumber}</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">Itemized Quotation & Customer Approval</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Bill of quantities across materials, plants & lawn sod, pots, labour, and transport with tax and approval sign-off.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {getStatusBadge()}

          <button
            onClick={() => setShowAiQuoteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 rounded-lg shadow-xs transition-all hover:scale-[1.02]"
            title="Generate AI-powered Quick Quote with material and labor costs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>AI Quick Quote</span>
          </button>

          <button
            onClick={async () => {
              try {
                setIsDownloadingPdf(true);
                await PdfQuotationService.downloadQuotationPdf(project);
              } catch (e) {
                console.error(e);
              } finally {
                setIsDownloadingPdf(false);
              }
            }}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            title="Download formatted PDF quotation document with company branding and cost breakdowns"
          >
            {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Formatted PDF'}</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            title="Preview quotation document with company branding and custom options"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Preview & Customize</span>
          </button>

          {isSavedNotice && (
            <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <span>Save Quote</span>
          </button>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
          >
            <span>Advance & Planning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Quick Quote Recommendation Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Smart Estimator: AI Quick Quote
              </h4>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.2 rounded-full font-semibold">
                Powered by Gemini
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5">
              Estimate plant counts, carpet sod rolls, garden pavers, soil volumes, and labor wages tailored to {project.title}&apos;s plot dimensions.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAiQuoteModal(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          <span>Launch AI Quick Quote</span>
        </button>
      </div>

      {/* Customer Approval Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Customer Approval Workflow</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Track client sign-off before collecting advance and mobilizing resources.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusChange('Draft')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                data.status === 'Draft' ? 'bg-neutral-800 text-white font-semibold' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => handleStatusChange('Sent')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                data.status === 'Sent' ? 'bg-blue-700 text-white font-semibold' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Mark Sent
            </button>
            <button
              onClick={() => handleStatusChange('In Review')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                data.status === 'In Review' ? 'bg-amber-600 text-white font-semibold' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              In Review
            </button>
            <button
              onClick={() => handleStatusChange('Approved')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                data.status === 'Approved' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{project.isConvertedToProject ? 'Quotation Approved' : 'Approve & Move to Active Projects'}</span>
            </button>
          </div>
        </div>

        {data.status === 'Approved' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 bg-emerald-50/40 -mx-5 -mb-5 p-5 rounded-b-xl border-t border-emerald-100">
            <div>
              <label className="block text-xs font-medium text-emerald-900 mb-1">Approved By (Customer)</label>
              <input
                type="text"
                value={approverName}
                onChange={e => setApproverName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white"
                placeholder="Dr. Arvind Swaminathan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-900 mb-1">Client PO / Approval Ref</label>
              <input
                type="text"
                value={poReference}
                onChange={e => setPoReference(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white font-mono"
                placeholder="PO-2026-081"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-900 mb-1">Approval Date</label>
              <input
                type="date"
                value={data.approvedDate || new Date().toISOString().split('T')[0]}
                onChange={e => setData({ ...data, approvedDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bill of Quantities Items Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-medium text-neutral-500 mr-1">Filter:</span>
            {['all', 'materials', 'plants', 'pots', 'labour', 'transport'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap ${
                  activeCategoryFilter === cat
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            {filteredItems.length} items listed
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Item Name & Botanical/Material Spec</th>
                <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                <th className="py-2.5 px-3 w-24">Unit</th>
                <th className="py-2.5 px-3 w-28 text-right">Unit Price ({currency})</th>
                <th className="py-2.5 px-4 w-32 text-right">Total ({currency})</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-2.5 px-4">
                    <span className="capitalize font-semibold text-neutral-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-neutral-900">{item.name}</div>
                    <div className="text-[11px] text-neutral-500">{item.spec}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-16 px-1.5 py-1 text-right border border-neutral-300 rounded tabular-nums"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={e => updateItem(item.id, 'unit', e.target.value)}
                      className="w-20 px-1.5 py-1 border border-neutral-300 rounded"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      className="w-24 px-1.5 py-1 text-right border border-neutral-300 rounded tabular-nums"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-neutral-900 tabular-nums">
                    {formatCurrency(item.total, currency)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Add Custom Item Row */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200">
          <div className="text-xs font-bold text-neutral-800 mb-2">Add Item to Quotation:</div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <select
              value={newItemCat}
              onChange={e => setNewItemCat(e.target.value as any)}
              className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
            >
              <option value="materials">Materials</option>
              <option value="plants">Plants & Turf</option>
              <option value="pots">Pots & Planters</option>
              <option value="labour">Labour & Trades</option>
              <option value="transport">Transport & Machinery</option>
            </select>

            <input
              type="text"
              placeholder="Item name (e.g. Red Soil)"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="sm:col-span-3 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
            />

            <input
              type="text"
              placeholder="Specification..."
              value={newItemSpec}
              onChange={e => setNewItemSpec(e.target.value)}
              className="sm:col-span-3 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
            />

            <input
              type="number"
              placeholder="Qty"
              value={newItemQty}
              onChange={e => setNewItemQty(Number(e.target.value))}
              className="sm:col-span-1 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums text-right"
            />

            <input
              type="text"
              placeholder="Unit"
              value={newItemUnit}
              onChange={e => setNewItemUnit(e.target.value)}
              className="sm:col-span-1 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
            />

            <input
              type="number"
              placeholder="Price"
              value={newItemPrice}
              onChange={e => setNewItemPrice(Number(e.target.value))}
              className="sm:col-span-1 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white tabular-nums text-right"
            />

            <button
              type="button"
              onClick={addItem}
              className="sm:col-span-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-neutral-500 font-medium mr-1">Quick Add Presets:</span>
            {PRESET_ITEMS.slice(0, 5).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => quickAddPreset(p)}
                className="text-[11px] bg-white border border-neutral-300 hover:border-emerald-500 hover:text-emerald-800 text-neutral-700 px-2 py-0.5 rounded transition-colors"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary & Tax Calculation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-neutral-900">Quotation Category Breakdown</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Materials & Hardscape</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatCurrency(summary.materialsTotal, currency)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Plants & Lawn Turf</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatCurrency(summary.plantsTotal, currency)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Pots, Planters & Decor</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatCurrency(summary.potsTotal, currency)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Skilled & Unskilled Labour</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatCurrency(summary.labourTotal, currency)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Transport & Machinery Trips</span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {formatCurrency(summary.transportTotal, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Subtotal, Tax, Discount & Total */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-neutral-900">Commercial Total & Tax Configuration</h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600 font-medium">Subtotal (Gross Item Total)</span>
              <span className="font-bold text-neutral-900 tabular-nums text-sm">
                {formatCurrency(summary.subtotal, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Project Discount ({currency})</span>
              <input
                type="number"
                value={data.discountAmount}
                onChange={e => setData({ ...data, discountAmount: Number(e.target.value) })}
                className="w-28 px-2 py-1 text-right text-xs border border-neutral-300 rounded tabular-nums"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-neutral-600">Tax / GST Rate:</span>
                <select
                  value={data.taxPercent}
                  onChange={e => setData({ ...data, taxPercent: Number(e.target.value) })}
                  className="px-2 py-1 text-xs border border-neutral-300 rounded bg-white"
                >
                  <option value={0}>0% (Tax Exempt)</option>
                  <option value={5}>5% (Reduced)</option>
                  <option value={12}>12% (Standard Horticulture)</option>
                  <option value={18}>18% (Commercial / GST)</option>
                </select>
              </div>
              <span className="font-semibold text-neutral-800 tabular-nums">
                +{formatCurrency(summary.taxAmount, currency)}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-2 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  Final Quoted Total
                </span>
                <div className="text-[10px] text-neutral-500">Includes all materials, plants, labour, and taxes</div>
              </div>
              <span className="text-xl font-bold text-emerald-900 tabular-nums">
                {formatCurrency(summary.totalQuotation, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showAiQuoteModal && (
        <AiQuickQuoteModal
          project={project}
          isOpen={showAiQuoteModal}
          onClose={() => setShowAiQuoteModal(false)}
          onApplySuccess={() => {
            setData(project.step3Quotation);
          }}
        />
      )}
    </div>
  );
};
