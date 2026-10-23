import React, { useState } from 'react';
import { LandscapingProject, AiQuickQuoteInput, AiQuickQuoteResult } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { formatCurrency } from '../../utils/calculations';
import {
  Sparkles,
  X,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Clock,
  Layers,
  Check,
  RefreshCw,
  TrendingUp,
  Leaf,
  Droplets,
  Sun,
  Hammer,
  Truck,
  Building,
} from 'lucide-react';

interface AiQuickQuoteModalProps {
  project: LandscapingProject;
  isOpen: boolean;
  onClose: () => void;
  onApplySuccess?: () => void;
}

const LANDSCAPING_STYLES = [
  'Modern Minimalist Villa Garden',
  'Tropical Luxury Resort & Palm Oasis',
  'Japanese Zen & Stone Sanctuary',
  'English Countryside & Rose Borders',
  'Rooftop Terrace & Sky Garden',
  'Mediterranean Drought-Tolerant Xeriscape',
  'Farmhouse Estate & Fruit Orchard',
  'Commercial Corporate Courtyard',
];

export const AiQuickQuoteModal: React.FC<AiQuickQuoteModalProps> = ({
  project,
  isOpen,
  onClose,
  onApplySuccess,
}) => {
  const { currency, applyAiQuickQuoteToProject } = useProjects();

  // Auto-seed dimensions from project measurements if available
  const initialPlot = project.step2SiteVisit?.measurements?.totalPlotAreaSqFt || 2400;
  const initialLawn = project.step2SiteVisit?.measurements?.lawnAreaSqFt || Math.round(initialPlot * 0.5);
  const initialHardscape = project.step2SiteVisit?.measurements?.hardscapeAreaSqFt || Math.round(initialPlot * 0.2);
  const initialPlanting = project.step2SiteVisit?.measurements?.plantingBedAreaSqFt || Math.round(initialPlot * 0.2);

  const [input, setInput] = useState<AiQuickQuoteInput>({
    plotAreaSqFt: initialPlot,
    lawnAreaSqFt: initialLawn,
    hardscapeAreaSqFt: initialHardscape,
    plantingBedAreaSqFt: initialPlanting,
    landscapingStyle: 'Modern Minimalist Villa Garden',
    qualityTier: 'Premium Residential',
    includeIrrigation: true,
    includeLighting: true,
    includeWaterFeature: false,
    includePergola: false,
    soilCondition: project.step2SiteVisit?.measurements?.soilType || 'Red Loam Soil',
    cityOrRegion: project.step1Enquiry?.city || 'Bengaluru',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiQuickQuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsApplied(false);

    try {
      const response = await fetch('/api/ai/quick-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error generating quick quote:', err);
      setError('Could not connect to AI estimation service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToProject = () => {
    if (!result || !result.suggestedItems) return;
    applyAiQuickQuoteToProject(project.id, result.suggestedItems);
    setIsApplied(true);
    setTimeout(() => {
      onApplySuccess?.();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:px-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-200 border border-white/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold tracking-tight">AI Quick Quote Estimator</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Powered by Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Instant material quantities, nursery rates, and labor forecasts tailored to {project.title}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Form Inputs */}
          <form onSubmit={handleGenerateQuote} className="space-y-5">
            <div className="bg-neutral-50/80 border border-neutral-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  <span>1. Project Dimensions (Square Feet)</span>
                </span>
                <span className="text-[11px] text-neutral-500 font-medium">
                  Plot: <strong className="text-neutral-900 font-mono">{input.plotAreaSqFt} sq.ft</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Total Plot Area
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={input.plotAreaSqFt}
                    onChange={e => setInput({ ...input, plotAreaSqFt: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    Lawn / Grass Area
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={input.lawnAreaSqFt}
                    onChange={e => setInput({ ...input, lawnAreaSqFt: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Hardscape / Pavers
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={input.hardscapeAreaSqFt}
                    onChange={e => setInput({ ...input, hardscapeAreaSqFt: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                    Planting Beds
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={input.plantingBedAreaSqFt}
                    onChange={e => setInput({ ...input, plantingBedAreaSqFt: Number(e.target.value) || 0 })}
                    className="w-full text-xs font-mono font-bold border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Landscaping Style & Quality Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  2. Architectural Landscaping Style
                </label>
                <select
                  value={input.landscapingStyle}
                  onChange={e => setInput({ ...input, landscapingStyle: e.target.value })}
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 font-medium"
                >
                  {LANDSCAPING_STYLES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  3. Quality & Finish Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Economy / Standard', 'Premium Residential', 'Luxury Architectural'] as const).map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setInput({ ...input, qualityTier: tier })}
                      className={`px-2 py-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                        input.qualityTier === tier
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {tier.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Special Feature Toggles */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-2">
                4. Included Infrastructure & Special Features
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  input.includeIrrigation ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-neutral-200 text-neutral-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={input.includeIrrigation}
                    onChange={e => setInput({ ...input, includeIrrigation: e.target.checked })}
                    className="rounded text-emerald-700"
                  />
                  <span>Drip Irrigation</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  input.includeLighting ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-neutral-200 text-neutral-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={input.includeLighting}
                    onChange={e => setInput({ ...input, includeLighting: e.target.checked })}
                    className="rounded text-emerald-700"
                  />
                  <span>Pathway Lighting</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  input.includeWaterFeature ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-neutral-200 text-neutral-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={input.includeWaterFeature}
                    onChange={e => setInput({ ...input, includeWaterFeature: e.target.checked })}
                    className="rounded text-emerald-700"
                  />
                  <span>Water Fountain</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  input.includePergola ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-neutral-200 text-neutral-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={input.includePergola}
                    onChange={e => setInput({ ...input, includePergola: e.target.checked })}
                    className="rounded text-emerald-700"
                  />
                  <span>Garden Pergola</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing with Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Generate AI Quick Quote</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error notice */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-5 pt-4 border-t border-neutral-200 animate-fade-in">
              {/* Summary Card */}
              <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>AI Landscape Cost Forecast</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Est. Duration: {result.suggestedTimelineDays} Days
                  </span>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  {result.summary}
                </p>

                {/* 4 Financial Highlight Pods */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                    <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Materials Total</span>
                    <span className="text-sm font-extrabold text-neutral-900 font-mono tabular-nums block mt-0.5">
                      {formatCurrency(result.materialCostSubtotal, currency)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                    <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Site Labor Total</span>
                    <span className="text-sm font-extrabold text-neutral-900 font-mono tabular-nums block mt-0.5">
                      {formatCurrency(result.laborCostSubtotal, currency)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-neutral-200">
                    <span className="text-[10px] font-semibold text-neutral-400 block uppercase">Transport / Freight</span>
                    <span className="text-sm font-extrabold text-neutral-900 font-mono tabular-nums block mt-0.5">
                      {formatCurrency(result.transportAllowance, currency)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase">Estimated Quote</span>
                    <span className="text-base font-extrabold text-emerald-900 font-mono tabular-nums block mt-0.5">
                      {formatCurrency(result.estimatedGrandTotal, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Design Tips */}
              {result.keyDesignTips && result.keyDesignTips.length > 0 && (
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Architectural & Agronomic Recommendations</span>
                  </span>
                  <ul className="text-xs text-neutral-600 space-y-1 pl-4 list-disc">
                    {result.keyDesignTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itemized BoQ Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Suggested Itemized Bill of Quantities ({result.suggestedItems.length} items)
                  </h4>
                  <span className="text-xs text-neutral-500">
                    Recommended Profit Margin: <strong className="text-emerald-800">{result.recommendedMarginPercent}%</strong>
                  </span>
                </div>

                <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100/80 text-neutral-600 font-semibold text-[11px] border-b border-neutral-200">
                      <tr>
                        <th className="py-2.5 px-3">Item Name & Spec</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {result.suggestedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/70">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-neutral-900">{item.name}</div>
                            <div className="text-[11px] text-neutral-500">{item.spec}</div>
                            {item.rationale && (
                              <div className="text-[10px] text-emerald-800 italic mt-0.5">{item.rationale}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md uppercase">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-neutral-600">
                            {formatCurrency(item.unitPrice, currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900">
                            {formatCurrency(item.total, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  ← Adjust Dimensions
                </button>

                <button
                  type="button"
                  onClick={handleApplyToProject}
                  disabled={isApplied}
                  className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 ${
                    isApplied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-[0.98]'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Applied to Project Quotation!</span>
                    </>
                  ) : (
                    <>
                      <span>Apply AI Suggestions to Quotation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
