import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { X, FolderKanban, Plus } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose }) => {
  const { createNewProject, currency } = useProjects();

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [clientType, setClientType] = useState<'Residential Villa' | 'Commercial Plaza' | 'Corporate Campus' | 'Rooftop Terrace' | 'Farmhouse' | 'Resort'>('Residential Villa');
  const [siteAddress, setSiteAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [estimatedBudget, setEstimatedBudget] = useState(400000);
  const [lawnReq, setLawnReq] = useState(true);
  const [irrigationReq, setIrrigationReq] = useState(true);
  const [hardscapeReq, setHardscapeReq] = useState(false);
  const [lightingReq, setLightingReq] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    const reqs: string[] = [];
    if (lawnReq) reqs.push('Lawn Turf Laying (Carpet / Bermuda)');
    if (irrigationReq) reqs.push('Automated Drip & Sprinkler Irrigation');
    if (hardscapeReq) reqs.push('Natural Flagstone Walkway & Steppers');
    if (lightingReq) reqs.push('Outdoor Landscape LED Lighting');

    createNewProject({
      title: title.trim(),
      step1Enquiry: {
        clientName: clientName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        clientType,
        siteAddress: siteAddress.trim(),
        city: city.trim(),
        landmark: '',
        pincode: '',
        enquiryDate: new Date().toISOString().split('T')[0],
        targetStartDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        estimatedBudget: Number(estimatedBudget) || 300000,
        enquiryStatus: 'New Enquiry',
        revisionCount: 0,
        materialChangeHistory: [],
        projectRequirements: reqs,
        notes: notes.trim(),
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-neutral-200 my-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">New Project Intake</h2>
              <p className="text-xs text-neutral-500">Initiate Step 1 — Customer Enquiry &amp; Site Requirements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-neutral-700 mb-1">Project Name / Site Title *</label>
            <input
              type="text"
              placeholder="e.g. Whispering Palms Villa Courtyard & Lawn"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Client Full Name *</label>
              <input
                type="text"
                placeholder="Dr. S. Nair"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Property Type</label>
              <select
                value={clientType}
                onChange={e => setClientType(e.target.value as any)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs bg-white"
              >
                <option value="Residential Villa">Residential Villa</option>
                <option value="Commercial Plaza">Commercial Plaza</option>
                <option value="Corporate Campus">Corporate Campus</option>
                <option value="Rooftop Terrace">Rooftop Terrace</option>
                <option value="Farmhouse">Farmhouse Estate</option>
                <option value="Resort">Resort / Hotel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98401 23456"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="client@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-neutral-700 mb-1">Site Address</label>
              <input
                type="text"
                placeholder="Street address, community name..."
                value={siteAddress}
                onChange={e => setSiteAddress(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1">Indicative Target Budget ({currency})</label>
            <input
              type="number"
              value={estimatedBudget}
              onChange={e => setEstimatedBudget(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs tabular-nums"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1">Key Initial Scope Checklist</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lawnReq}
                  onChange={e => setLawnReq(e.target.checked)}
                  className="rounded text-emerald-700"
                />
                <span>Lawn Turf Sod Laying</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={irrigationReq}
                  onChange={e => setIrrigationReq(e.target.checked)}
                  className="rounded text-emerald-700"
                />
                <span>Drip / Pop-up Irrigation</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hardscapeReq}
                  onChange={e => setHardscapeReq(e.target.checked)}
                  className="rounded text-emerald-700"
                />
                <span>Flagstone Hardscaping</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lightingReq}
                  onChange={e => setLightingReq(e.target.checked)}
                  className="rounded text-emerald-700"
                />
                <span>Garden LED Lighting</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project & Open Step 1</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
