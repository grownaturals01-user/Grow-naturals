import React, { useState } from 'react';
import { LandscapingProject, MaterialComparison, VendorQuoteItem } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { formatCurrency } from '../../utils/calculations';
import {
  Scale,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Star,
  Truck,
  Clock,
  Trash2,
  X,
  Download,
  Building2,
  ChevronDown,
  ChevronUp,
  Tag,
  Phone,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface VendorPriceComparisonProps {
  project: LandscapingProject;
  onClose?: () => void;
  isModal?: boolean;
}

export const VendorPriceComparison: React.FC<VendorPriceComparisonProps> = ({
  project,
  onClose,
  isModal = false,
}) => {
  const { addMaterialComparison, deleteMaterialComparison, addVendorQuote, awardVendorQuote, currency } = useProjects();
  const comparisons = project.vendorComparisons || [];

  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(
    comparisons[0]?.id || null
  );
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddQuoteModalFor, setShowAddQuoteModalFor] = useState<string | null>(null);

  // Form states for New Material
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<MaterialComparison['category']>('Plants & Trees');
  const [newMatQty, setNewMatQty] = useState<number>(100);
  const [newMatUnit, setNewMatUnit] = useState('sq.ft');
  const [newMatBudget, setNewMatBudget] = useState<number>(50);
  const [newMatNotes, setNewMatNotes] = useState('');

  // Form states for New Quote
  const [newVendorName, setNewVendorName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState<number>(40);
  const [newFreight, setNewFreight] = useState<number>(1000);
  const [newLeadTime, setNewLeadTime] = useState<number>(2);
  const [newQualityRating, setNewQualityRating] = useState<number>(5);
  const [newQuoteNotes, setNewQuoteNotes] = useState('');

  // Calculate totals
  let totalBudgetAmount = 0;
  let totalBestLandedAmount = 0;
  let totalAwardedCount = 0;

  comparisons.forEach(mat => {
    const budgetedTotal = mat.requiredQuantity * mat.budgetUnitPrice;
    totalBudgetAmount += budgetedTotal;

    if (mat.selectedQuoteId) {
      totalAwardedCount++;
    }

    if (mat.quotes.length > 0) {
      // Find lowest landed cost
      const lowestQuote = mat.quotes.reduce((min, q) => {
        const landedCost = (q.unitPrice * mat.requiredQuantity) + (q.deliveryFreightCost || 0);
        const minLandedCost = (min.unitPrice * mat.requiredQuantity) + (min.deliveryFreightCost || 0);
        return landedCost < minLandedCost ? q : min;
      }, mat.quotes[0]);

      const bestCost = (lowestQuote.unitPrice * mat.requiredQuantity) + (lowestQuote.deliveryFreightCost || 0);
      totalBestLandedAmount += bestCost;
    } else {
      totalBestLandedAmount += budgetedTotal;
    }
  });

  const totalSavings = Math.max(0, totalBudgetAmount - totalBestLandedAmount);
  const savingsPercent = totalBudgetAmount > 0 ? Math.round((totalSavings / totalBudgetAmount) * 100) : 0;

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    addMaterialComparison(project.id, {
      materialName: newMatName.trim(),
      category: newMatCategory,
      requiredQuantity: Number(newMatQty) || 1,
      unit: newMatUnit.trim() || 'units',
      budgetUnitPrice: Number(newMatBudget) || 0,
      notes: newMatNotes.trim(),
      quotes: [],
    });

    setNewMatName('');
    setShowAddMaterialModal(false);
  };

  const handleCreateQuote = (e: React.FormEvent, materialId: string) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;

    addVendorQuote(project.id, materialId, {
      vendorName: newVendorName.trim(),
      contactPerson: newContactPerson.trim(),
      phone: newVendorPhone.trim(),
      unitPrice: Number(newUnitPrice) || 0,
      deliveryFreightCost: Number(newFreight) || 0,
      leadTimeDays: Number(newLeadTime) || 1,
      qualityRating: Number(newQualityRating) || 5,
      notes: newQuoteNotes.trim(),
    });

    setNewVendorName('');
    setNewContactPerson('');
    setNewVendorPhone('');
    setShowAddQuoteModalFor(null);
  };

  const handleExportCsv = () => {
    const lines: string[] = [];
    lines.push(`"TERRAFLOW VENDOR PRICE COMPARISON MATRIX - ${project.code}"`);
    lines.push(`"Project","${project.title}"`);
    lines.push(`"Date","${new Date().toLocaleDateString()}"`);
    lines.push('');
    lines.push('"Material","Category","Required Qty","Unit","Budget Unit Price","Vendor Name","Contact","Phone","Quoted Unit Price","Freight Cost","Landed Total Cost","Effective Unit Cost","Lead Time (Days)","Quality Rating","Awarded Status"');

    comparisons.forEach(mat => {
      if (mat.quotes.length === 0) {
        lines.push(`"${mat.materialName}","${mat.category}","${mat.requiredQuantity}","${mat.unit}","${mat.budgetUnitPrice}","No quotes logged yet","","","","","","","","",""`);
      } else {
        mat.quotes.forEach(q => {
          const landed = (q.unitPrice * mat.requiredQuantity) + (q.deliveryFreightCost || 0);
          const effectiveUnit = landed / (mat.requiredQuantity || 1);
          const isAwarded = mat.selectedQuoteId === q.id ? 'YES (Awarded)' : 'No';
          lines.push(`"${mat.materialName}","${mat.category}","${mat.requiredQuantity}","${mat.unit}","${mat.budgetUnitPrice}","${q.vendorName}","${q.contactPerson || ''}","${q.phone || ''}","${q.unitPrice}","${q.deliveryFreightCost}","${landed}","${Math.round(effectiveUnit * 100) / 100}","${q.leadTimeDays}","${q.qualityRating}/5","${isAwarded}"`);
        });
      }
    });

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.code}_Vendor_Price_Comparison.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-6 bg-white' : ''}`}>
      {/* Top Banner / Summary */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <Scale className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Vendor Price Comparison & Procurement Analyzer
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Input quotes from multiple nurseries and suppliers to compute true landed costs, freight, and optimal procurement savings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors shadow-2xs"
              title="Download comparison matrix as CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddMaterialModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Material</span>
            </button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-neutral-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-100">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            <span className="text-[11px] font-medium text-neutral-500 block">Budgeted Procurement</span>
            <div className="text-lg font-bold text-neutral-900 tabular-nums mt-0.5">
              {formatCurrency(totalBudgetAmount, currency)}
            </div>
            <span className="text-[10px] text-neutral-400 block mt-0.5">{comparisons.length} materials tracked</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            <span className="text-[11px] font-medium text-neutral-500 block">Best Landed Quotations</span>
            <div className="text-lg font-bold text-emerald-800 tabular-nums mt-0.5">
              {formatCurrency(totalBestLandedAmount, currency)}
            </div>
            <span className="text-[10px] text-neutral-400 block mt-0.5">incl. transport & freight</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-900 block flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-700" />
              Total Identified Savings
            </span>
            <div className="text-lg font-bold text-emerald-950 tabular-nums mt-0.5">
              {formatCurrency(totalSavings, currency)}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {savingsPercent}% below initial budget
            </span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            <span className="text-[11px] font-medium text-neutral-500 block">Awarded Suppliers</span>
            <div className="text-lg font-bold text-neutral-900 tabular-nums mt-0.5">
              {totalAwardedCount} / {comparisons.length}
            </div>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Suppliers locked for procurement</span>
          </div>
        </div>
      </div>

      {/* Material Comparison Cards */}
      {comparisons.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center space-y-3">
          <Scale className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-800">No Material Price Comparisons Yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Compare vendor bids for lawn turf, red earth, natural stone pavers, or nursery trees to identify the most cost-effective procurement options.
          </p>
          <button
            type="button"
            onClick={() => setShowAddMaterialModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Material Quote</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {comparisons.map(mat => {
            const isExpanded = expandedMaterialId === mat.id;
            const budgetedTotal = mat.requiredQuantity * mat.budgetUnitPrice;

            // Find lowest landed cost quote
            let lowestQuote: VendorQuoteItem | null = null;
            if (mat.quotes.length > 0) {
              lowestQuote = mat.quotes.reduce((min, q) => {
                const landed = (q.unitPrice * mat.requiredQuantity) + (q.deliveryFreightCost || 0);
                const minLanded = (min.unitPrice * mat.requiredQuantity) + (min.deliveryFreightCost || 0);
                return landed < minLanded ? q : min;
              }, mat.quotes[0]);
            }

            const bestLanded = lowestQuote
              ? (lowestQuote.unitPrice * mat.requiredQuantity) + (lowestQuote.deliveryFreightCost || 0)
              : budgetedTotal;
            const matSavings = Math.max(0, budgetedTotal - bestLanded);

            return (
              <div
                key={mat.id}
                className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  className="p-4 bg-neutral-50/70 hover:bg-neutral-100/60 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 transition-colors"
                  onClick={() => setExpandedMaterialId(isExpanded ? null : mat.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-neutral-200/80 text-neutral-800">
                      {mat.category}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900">{mat.materialName}</h3>
                        {mat.selectedQuoteId && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Supplier Awarded</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-3">
                        <span>
                          Required: <strong className="text-neutral-700">{mat.requiredQuantity} {mat.unit}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Budget Rate: <strong className="text-neutral-700">{formatCurrency(mat.budgetUnitPrice, currency)}/{mat.unit}</strong> ({formatCurrency(budgetedTotal, currency)} total)
                        </span>
                        {mat.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-neutral-400">{mat.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 block">Best Landed Quote:</span>
                      <span className="text-xs font-bold text-emerald-800 tabular-nums">
                        {lowestQuote ? formatCurrency(bestLanded, currency) : 'No quotes'}
                      </span>
                      {matSavings > 0 && (
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Save {formatCurrency(matSavings, currency)} ({Math.round((matSavings / budgetedTotal) * 100)}%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setShowAddQuoteModalFor(mat.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                      >
                        + Add Quote
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          deleteMaterialComparison(project.id, mat.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                        title="Delete material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Comparison Matrix */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {mat.quotes.length === 0 ? (
                      <div className="p-6 text-center bg-neutral-50 rounded-xl border border-neutral-100">
                        <p className="text-xs text-neutral-500">
                          No supplier quotes entered yet for this material.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddQuoteModalFor(mat.id)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Input First Vendor Quote</span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                            <tr>
                              <th className="py-2.5 px-3">Vendor / Nursery</th>
                              <th className="py-2.5 px-3 text-right">Quoted Unit Price</th>
                              <th className="py-2.5 px-3 text-right">Delivery / Freight</th>
                              <th className="py-2.5 px-3 text-right">Total Landed Cost</th>
                              <th className="py-2.5 px-3 text-right">Effective Rate</th>
                              <th className="py-2.5 px-3 text-center">Lead Time</th>
                              <th className="py-2.5 px-3 text-center">Quality</th>
                              <th className="py-2.5 px-3 text-center">Procurement Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {mat.quotes.map(q => {
                              const landed = (q.unitPrice * mat.requiredQuantity) + (q.deliveryFreightCost || 0);
                              const effectiveUnit = landed / (mat.requiredQuantity || 1);
                              const isLowest = lowestQuote?.id === q.id;
                              const isAwarded = mat.selectedQuoteId === q.id;

                              return (
                                <tr
                                  key={q.id}
                                  className={`transition-colors ${
                                    isAwarded
                                      ? 'bg-emerald-50/70 font-medium'
                                      : isLowest
                                      ? 'bg-amber-50/40'
                                      : 'hover:bg-neutral-50/70'
                                  }`}
                                >
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-neutral-900">{q.vendorName}</span>
                                      {isLowest && (
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                          ⭐ Best Price
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-2">
                                      {q.contactPerson && <span>👤 {q.contactPerson}</span>}
                                      {q.phone && <span>📞 {q.phone}</span>}
                                    </div>
                                    {q.notes && (
                                      <div className="text-[10px] text-neutral-500 italic mt-0.5">{q.notes}</div>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-right tabular-nums text-neutral-800">
                                    {formatCurrency(q.unitPrice, currency)} / {mat.unit}
                                  </td>

                                  <td className="py-3 px-3 text-right tabular-nums text-neutral-600">
                                    {q.deliveryFreightCost ? formatCurrency(q.deliveryFreightCost, currency) : 'Free / Included'}
                                  </td>

                                  <td className="py-3 px-3 text-right font-bold text-neutral-900 tabular-nums text-sm">
                                    {formatCurrency(landed, currency)}
                                  </td>

                                  <td className="py-3 px-3 text-right tabular-nums text-neutral-700">
                                    {formatCurrency(Math.round(effectiveUnit * 10) / 10, currency)}/{mat.unit}
                                  </td>

                                  <td className="py-3 px-3 text-center text-neutral-600">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-neutral-400" />
                                      <span>{q.leadTimeDays}d</span>
                                    </span>
                                  </td>

                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center justify-center gap-0.5 text-amber-500">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < (q.qualityRating || 5) ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 text-center">
                                    {isAwarded ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>Selected</span>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => awardVendorQuote(project.id, mat.id, q.id)}
                                        className="px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-neutral-300 hover:border-emerald-300 rounded-lg transition-colors"
                                      >
                                        Award Quote
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Material */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Add Material for Price Comparison</h3>
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Material Name & Specification</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Natural Slate Stepping Stones, Foxtail Palms"
                  value={newMatName}
                  onChange={e => setNewMatName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Category</label>
                  <select
                    value={newMatCategory}
                    onChange={e => setNewMatCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  >
                    <option value="Plants & Trees">Plants & Trees</option>
                    <option value="Turf & Grass">Turf & Grass</option>
                    <option value="Soil & Manure">Soil & Manure</option>
                    <option value="Hardscape & Stone">Hardscape & Stone</option>
                    <option value="Pipes & Irrigation">Pipes & Irrigation</option>
                    <option value="Pots & Planters">Pots & Planters</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., sq.ft, truck, nos, pcs"
                    value={newMatUnit}
                    onChange={e => setNewMatUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Required Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMatQty}
                    onChange={e => setNewMatQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Budget Unit Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMatBudget}
                    onChange={e => setNewMatBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Notes / Specs (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 6ft height, pest-free certification required"
                  value={newMatNotes}
                  onChange={e => setNewMatNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-3 py-1.5 font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                >
                  Create Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Quote */}
      {showAddQuoteModalFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Add Supplier Quote</h3>
                <p className="text-[11px] text-neutral-500">
                  {comparisons.find(m => m.id === showAddQuoteModalFor)?.materialName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddQuoteModalFor(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={e => handleCreateQuote(e, showAddQuoteModalFor)} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Vendor / Nursery Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sri Lakshmi Nursery & Farms"
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g., Rajesh Sharma"
                    value={newContactPerson}
                    onChange={e => setNewContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g., +91 98450 12345"
                    value={newVendorPhone}
                    onChange={e => setNewVendorPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Quoted Unit Price ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={newUnitPrice}
                    onChange={e => setNewUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Delivery / Freight ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={newFreight}
                    onChange={e => setNewFreight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Delivery Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newLeadTime}
                    onChange={e => setNewLeadTime(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Quality Grade (1-5 Stars)</label>
                  <select
                    value={newQualityRating}
                    onChange={e => setNewQualityRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  >
                    <option value={5}>5 Stars - Premium Quality</option>
                    <option value={4}>4 Stars - Standard High Grade</option>
                    <option value={3}>3 Stars - Average Grade</option>
                    <option value={2}>2 Stars - Economy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">Notes / Terms (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Includes unloading at site, 15 days credit"
                  value={newQuoteNotes}
                  onChange={e => setNewQuoteNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddQuoteModalFor(null)}
                  className="px-3 py-1.5 font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                >
                  Save Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
