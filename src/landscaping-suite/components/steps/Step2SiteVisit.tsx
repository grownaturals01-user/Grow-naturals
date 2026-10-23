import React, { useState } from 'react';
import { LandscapingProject, SiteVisitAssessment, SitePhoto } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import { formatCurrency } from '../../utils/calculations';
import { MapPin, Ruler, Compass, Droplets, Truck, Camera, Plus, Trash2, Save, ArrowRight, CheckCircle, Calendar, Clock, Sparkles, CalendarDays } from 'lucide-react';
import { AiQuickQuoteModal } from '../modals/AiQuickQuoteModal';

interface Step2SiteVisitProps {
  project: LandscapingProject;
}

export const Step2SiteVisit: React.FC<Step2SiteVisitProps> = ({ project }) => {
  const { updateProjectStep, setSelectedStep, currency } = useProjects();
  const [data, setData] = useState<SiteVisitAssessment>(project.step2SiteVisit);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showAiQuoteModal, setShowAiQuoteModal] = useState(false);

  // New photo state
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCat, setNewPhotoCat] = useState<SitePhoto['category']>('Site Boundary');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  // New machinery state
  const [machName, setMachName] = useState('');
  const [machHours, setMachHours] = useState(4);
  const [machRate, setMachRate] = useState(1000);

  const calculatedDistanceCharge = data.isFreeVisit ? 0 : data.distanceFromHubKm * data.ratePerKm;

  const handleDistanceChange = (km: number, rate: number, free: boolean) => {
    const total = free ? 0 : km * rate;
    setData({
      ...data,
      distanceFromHubKm: km,
      ratePerKm: rate,
      isFreeVisit: free,
      distanceChargeTotal: total,
    });
  };

  const handleSave = () => {
    const updated = {
      ...data,
      distanceChargeTotal: calculatedDistanceCharge,
    };
    updateProjectStep(project.id, 'step2SiteVisit', updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleNextStep = () => {
    handleSave();
    setSelectedStep('quotation');
  };

  const addPhoto = () => {
    if (!newPhotoTitle.trim()) return;
    const colors = ['#166534', '#15803d', '#14532d', '#047857', '#0f766e', '#854d0e'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const photo: SitePhoto = {
      id: `photo-${Date.now()}`,
      title: newPhotoTitle.trim(),
      category: newPhotoCat,
      dateTaken: new Date().toISOString().split('T')[0],
      caption: newPhotoCaption.trim() || 'Visual site assessment capture',
      aspectColor: randomColor,
    };

    setData({
      ...data,
      photos: [...data.photos, photo],
    });

    setNewPhotoTitle('');
    setNewPhotoCaption('');
  };

  const removePhoto = (id: string) => {
    setData({
      ...data,
      photos: data.photos.filter(p => p.id !== id),
    });
  };

  const addMachinery = () => {
    if (!machName.trim()) return;
    setData({
      ...data,
      requiredMachinery: [
        ...data.requiredMachinery,
        {
          name: machName.trim(),
          estimatedHours: Number(machHours) || 0,
          hourlyRate: Number(machRate) || 0,
        },
      ],
    });
    setMachName('');
  };

  const removeMachinery = (index: number) => {
    setData({
      ...data,
      requiredMachinery: data.requiredMachinery.filter((_, i) => i !== index),
    });
  };

  const totalMachineryCost = data.requiredMachinery.reduce(
    (sum, m) => sum + m.estimatedHours * m.hourlyRate,
    0
  );

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Step 2 of 7 · Physical Survey
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mt-1">Site Visit, Measurements & Condition Assessment</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Log site visit distance & fees, exact plot dimensions, soil and sunlight profile, and site condition photos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAiQuoteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 rounded-lg transition-all shadow-xs hover:scale-[1.02]"
            title="Instant Quick Quote from Site Measurements"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>AI Quick Quote</span>
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
            <Save className="w-3.5 h-3.5" />
            <span>Save Assessment</span>
          </button>
          <button
            onClick={handleNextStep}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
          >
            <span>Proceed to Quotation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upcoming Site Visits & Assessment Appointments Widget */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-neutral-900">
              Upcoming Site Visits & Assessment Appointments
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {(project.siteVisitAppointments || []).length} Scheduled
            </span>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Project: <strong className="text-neutral-800">{project.code}</strong>
          </div>
        </div>

        {(project.siteVisitAppointments && project.siteVisitAppointments.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {project.siteVisitAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-3 rounded-xl border border-neutral-200/90 bg-neutral-50/70 hover:bg-neutral-50 transition-colors flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-700">
                      {appt.type}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      appt.status === 'Completed'
                        ? 'bg-neutral-200 text-neutral-700'
                        : appt.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {appt.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{appt.title}</h4>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-600 mt-1">
                    <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-mono font-medium">{appt.date}</span>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-mono">{appt.time}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="truncate">Lead: {appt.assignedTo}</span>
                  {appt.weatherForecast && (
                    <span className="text-amber-800 font-medium shrink-0">{appt.weatherForecast.split('·')[0]}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-neutral-200 text-center text-xs text-neutral-500">
            No upcoming assessment visits booked yet for this project.
          </div>
        )}
      </div>

      {/* Row 1: Distance & Logistics Charges */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Travel & Site Distance Charges</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Account for surveyor travel expenses and fuel from base nursery hub.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
            <input
              type="checkbox"
              checked={data.isFreeVisit}
              onChange={e => handleDistanceChange(data.distanceFromHubKm, data.ratePerKm, e.target.checked)}
              className="rounded text-emerald-700 focus:ring-emerald-600"
            />
            <span className={data.isFreeVisit ? 'text-emerald-700 font-bold' : 'text-neutral-700'}>
              Free / Complimentary Visit (Waive travel fee)
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Assessed By (Surveyor)</label>
            <input
              type="text"
              value={data.assessedBy}
              onChange={e => setData({ ...data, assessedBy: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              placeholder="e.g. Karthik Raja (Senior Architect)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Distance from Hub (Km)</label>
            <input
              type="number"
              value={data.distanceFromHubKm}
              onChange={e => handleDistanceChange(Number(e.target.value), data.ratePerKm, data.isFreeVisit)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums"
              placeholder="25"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Standard Rate per Km ({currency})</label>
            <input
              type="number"
              value={data.ratePerKm}
              onChange={e => handleDistanceChange(data.distanceFromHubKm, Number(e.target.value), data.isFreeVisit)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums"
              placeholder="25"
            />
          </div>

          <div className="bg-neutral-50 rounded-lg p-3 flex flex-col justify-center border border-neutral-200">
            <span className="text-[11px] font-medium text-neutral-500">Effective Distance Charge</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-neutral-900 tabular-nums">
                {formatCurrency(calculatedDistanceCharge, currency)}
              </span>
              {data.isFreeVisit && (
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Free
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Measurements & Plot Area Breakdown */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="border-b border-neutral-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-emerald-700" />
            <span>Site Area Measurements (Sq.Ft)</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Physical on-site tape measurements used to calculate lawn turf sod, pavers, and plant counts.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Total Plot Area</label>
            <div className="relative">
              <input
                type="number"
                value={data.measurements.totalPlotAreaSqFt}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, totalPlotAreaSqFt: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums font-semibold"
              />
              <span className="absolute right-3 top-2 text-[11px] text-neutral-400">sq.ft</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Target Lawn Area</label>
            <div className="relative">
              <input
                type="number"
                value={data.measurements.lawnAreaSqFt}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, lawnAreaSqFt: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums font-semibold text-emerald-800"
              />
              <span className="absolute right-3 top-2 text-[11px] text-neutral-400">sq.ft</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Hardscape / Paver Area</label>
            <div className="relative">
              <input
                type="number"
                value={data.measurements.hardscapeAreaSqFt}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, hardscapeAreaSqFt: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums font-semibold"
              />
              <span className="absolute right-3 top-2 text-[11px] text-neutral-400">sq.ft</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Planting Bed Area</label>
            <div className="relative">
              <input
                type="number"
                value={data.measurements.plantingBedAreaSqFt}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, plantingBedAreaSqFt: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums font-semibold"
              />
              <span className="absolute right-3 top-2 text-[11px] text-neutral-400">sq.ft</span>
            </div>
          </div>
        </div>

        {/* Visual area proportion bar */}
        {data.measurements.totalPlotAreaSqFt > 0 && (
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
              <span>Zoning Allocation:</span>
              <span className="tabular-nums">
                Lawn: {Math.round((data.measurements.lawnAreaSqFt / data.measurements.totalPlotAreaSqFt) * 100)}% · 
                Hardscape: {Math.round((data.measurements.hardscapeAreaSqFt / data.measurements.totalPlotAreaSqFt) * 100)}% · 
                Beds: {Math.round((data.measurements.plantingBedAreaSqFt / data.measurements.totalPlotAreaSqFt) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, (data.measurements.lawnAreaSqFt / data.measurements.totalPlotAreaSqFt) * 100)}%` }}
                className="bg-emerald-600 h-full"
                title="Lawn"
              />
              <div
                style={{ width: `${Math.min(100, (data.measurements.hardscapeAreaSqFt / data.measurements.totalPlotAreaSqFt) * 100)}%` }}
                className="bg-neutral-600 h-full"
                title="Hardscape"
              />
              <div
                style={{ width: `${Math.min(100, (data.measurements.plantingBedAreaSqFt / data.measurements.totalPlotAreaSqFt) * 100)}%` }}
                className="bg-amber-600 h-full"
                title="Planting Beds"
              />
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Environmental, Soil & Water Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>Topography, Soil & Sunlight Profile</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Critical ecological inputs determining botanical survival.</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Slope & Grading Profile</label>
              <select
                value={data.measurements.slopeGrading}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, slopeGrading: e.target.value as any },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
              >
                <option value="Flat">Flat Level Ground</option>
                <option value="Gentle Slope">Gentle Slope (1-3% natural grade)</option>
                <option value="Moderate Slope">Moderate Slope (requires terrace or retaining ledge)</option>
                <option value="Steep Hillside">Steep Hillside (needs geo-textile erosion control)</option>
                <option value="Multi-tiered Terraces">Multi-tiered Architectural Terraces</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Native Soil Type</label>
              <select
                value={data.measurements.soilType}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, soilType: e.target.value as any },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
              >
                <option value="Red Loam Soil">Red Loam Soil (Ideal drainage & nutrient balance)</option>
                <option value="Clayey Loam">Clayey Loam (High moisture hold; requires river sand aeration)</option>
                <option value="Sandy Loam">Sandy Loam (Fast drainage; needs extra organic compost)</option>
                <option value="Rocky / Gravelly">Rocky / Gravelly (Requires excavation & topsoil import)</option>
                <option value="Black Cotton Soil">Black Cotton Soil (Expansive; requires sub-base protection)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Sunlight Exposure</label>
              <select
                value={data.measurements.sunlightExposure}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, sunlightExposure: e.target.value as any },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
              >
                <option value="Full Direct Sun (6+ hrs)">Full Direct Sun (6+ hrs - Perfect for Bermuda / Zoysia)</option>
                <option value="Partial Shade / Dappled">Partial Shade / Dappled (Suitable for St. Augustine / Korean)</option>
                <option value="Dense Shade">Dense Shade (&lt; 2 hrs sun - Shade groundcovers recommended)</option>
                <option value="Morning Sun Only">Morning Sun Only (Gentle East exposure)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Site Logistics & Machine Access</label>
              <select
                value={data.measurements.siteAccessibility}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, siteAccessibility: e.target.value as any },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
              >
                <option value="Direct Truck Access">Direct Truck Access (Tipper truck unloads at lawn edge)</option>
                <option value="Narrow Alley (< 8ft)">Narrow Alley (&lt; 8ft - Mini-tempo / wheelbarrow transfer)</option>
                <option value="Stairs & Freight Lift">Stairs & Freight Lift (Rooftop / penthouse transport)</option>
                <option value="Manual Carry Only">Manual Carry Only (High labour haulage requirement)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Water & Required Machinery */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-emerald-700" />
              <span>Water Infrastructure & Heavy Machinery</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">Irrigation water viability and equipment logistics.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Water Supply Source</label>
              <select
                value={data.measurements.waterSource}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, waterSource: e.target.value as any },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
              >
                <option value="Deep Borewell">Deep Borewell</option>
                <option value="Municipal Supply">Municipal Supply</option>
                <option value="Water Tanker">Water Tanker Delivery</option>
                <option value="Rainwater Harvesting Pit">Rainwater Harvesting Pit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Water TDS (ppm)</label>
              <input
                type="number"
                value={data.measurements.waterTdsPpm}
                onChange={e =>
                  setData({
                    ...data,
                    measurements: { ...data.measurements, waterTdsPpm: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 tabular-nums"
                placeholder="350"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                {data.measurements.waterTdsPpm < 500 ? 'Good for turf & shrubs' : 'High salinity - needs salt-hardy turf'}
              </span>
            </div>
          </div>

          {/* Heavy Machinery table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-800 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-neutral-500" />
                <span>Heavy Machinery Estimated</span>
              </span>
              <span className="text-xs font-semibold text-neutral-900 tabular-nums">
                Est: {formatCurrency(totalMachineryCost, currency)}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
              {data.requiredMachinery.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg text-xs border border-neutral-100">
                  <div className="font-medium text-neutral-800">{m.name}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500 tabular-nums">
                      {m.estimatedHours} hrs × {formatCurrency(m.hourlyRate, currency)}/hr = {formatCurrency(m.estimatedHours * m.hourlyRate, currency)}
                    </span>
                    <button
                      onClick={() => removeMachinery(idx)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
              <input
                type="text"
                placeholder="Machine name (e.g. Mini Excavator)"
                value={machName}
                onChange={e => setMachName(e.target.value)}
                className="flex-2 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Hrs"
                value={machHours}
                onChange={e => setMachHours(Number(e.target.value))}
                className="w-16 px-2 py-1.5 text-xs border border-neutral-300 rounded-lg tabular-nums"
              />
              <input
                type="number"
                placeholder="Rate"
                value={machRate}
                onChange={e => setMachRate(Number(e.target.value))}
                className="w-20 px-2 py-1.5 text-xs border border-neutral-300 rounded-lg tabular-nums"
              />
              <button
                type="button"
                onClick={addMachinery}
                className="px-2.5 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Initial Required Materials Assessment</label>
            <textarea
              rows={2}
              value={data.initialMaterialNotes}
              onChange={e => setData({ ...data, initialMaterialNotes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
              placeholder="e.g. 2 tipper trucks red soil, 1 tipper river sand, 40 bags vermicompost, 120m drainage pipe..."
            />
          </div>
        </div>
      </div>

      {/* Row 4: Site Assessment Photos & Visual Evidence */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>Site Assessment Photos & Visual Logs</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Visual records of ground conditions, slope, existing utilities, and boundaries prior to work start.
            </p>
          </div>

          <span className="text-xs text-neutral-500">
            {data.photos.length} photos logged
          </span>
        </div>

        {/* Photos grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {data.photos.map(photo => (
            <div key={photo.id} className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex flex-col">
              {/* Photo representation box */}
              <div
                style={{ backgroundColor: photo.aspectColor || '#166534' }}
                className="h-32 flex items-center justify-center text-white/90 p-4 relative"
              >
                <div className="text-center">
                  <Camera className="w-6 h-6 mx-auto mb-1 opacity-80" />
                  <span className="text-xs font-bold tracking-tight">{photo.title}</span>
                </div>
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1 bg-black/40 hover:bg-black/70 text-white rounded transition-colors"
                  title="Delete photo record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                    <span className="font-semibold text-neutral-700">{photo.category}</span>
                    <span>{photo.dateTaken}</span>
                  </div>
                  <p className="text-neutral-600 line-clamp-3">{photo.caption}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Add photo card */}
          <div className="border border-dashed border-neutral-300 rounded-lg p-4 bg-neutral-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 mb-2">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Log New Site Photo</span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Photo subject (e.g. Lawn Slope Area)"
                  value={newPhotoTitle}
                  onChange={e => setNewPhotoTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                />

                <select
                  value={newPhotoCat}
                  onChange={e => setNewPhotoCat(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="Site Boundary">Site Boundary</option>
                  <option value="Slope & Topography">Slope & Topography</option>
                  <option value="Soil Condition">Soil Condition</option>
                  <option value="Water Connection">Water Connection</option>
                  <option value="Obstacles">Obstacles & Debris</option>
                </select>

                <textarea
                  rows={2}
                  placeholder="Observation notes & dimensions..."
                  value={newPhotoCaption}
                  onChange={e => setNewPhotoCaption(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg bg-white resize-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addPhoto}
              className="w-full py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              Add Photo Observation
            </button>
          </div>
        </div>
      </div>

      {showAiQuoteModal && (
        <AiQuickQuoteModal
          project={project}
          isOpen={showAiQuoteModal}
          onClose={() => setShowAiQuoteModal(false)}
          onApplySuccess={() => {
            setSelectedStep('quotation');
          }}
        />
      )}
    </div>
  );
};
