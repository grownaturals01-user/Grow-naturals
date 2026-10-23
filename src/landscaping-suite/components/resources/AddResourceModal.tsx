import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { X, HardHat, Plus, CheckCircle2, User } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addCompanyResource } = useProjects();

  const [name, setName] = useState('');
  const [roleOrModel, setRoleOrModel] = useState('');
  const [category, setCategory] = useState('Site Supervision');
  const [phoneOrPlate, setPhoneOrPlate] = useState('');
  const [dailyRate, setDailyRate] = useState<number>(1500);
  const [specs, setSpecs] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCompanyResource({
      type: 'team_member',
      name: name.trim(),
      roleOrModel: roleOrModel.trim() || 'Landscaping Specialist',
      category: category.trim() || 'Site Supervision',
      phoneOrPlate: phoneOrPlate.trim(),
      dailyRate: Number(dailyRate) || 1500,
      status: 'active',
      specsOrSkills: specs
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      operatorRequired: false,
      avatarOrColor: '#047857',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl my-auto text-neutral-900 border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-neutral-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                Add Team Member to Roster
              </h3>
              <p className="text-[11px] text-neutral-400">
                Register personnel available for project site deployment & scheduling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Shinde or Suresh Gowda"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Designation / Specialist Role
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Site Supervisor, Irrigation Engineer"
                value={roleOrModel}
                onChange={e => setRoleOrModel(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">Department / Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                <option value="Supervision & Logistics">Supervision & Logistics</option>
                <option value="Architecture & Design">Architecture & Design</option>
                <option value="Hydraulics & Civil">Hydraulics & Civil</option>
                <option value="Hardscaping & Masonry">Hardscaping & Masonry</option>
                <option value="Agronomy & Flora">Agronomy & Flora</option>
                <option value="Grading & Earthworks">Grading & Earthworks</option>
                <option value="Lawn & Turf">Lawn & Turf</option>
                <option value="Low Voltage & Pumps">Low Voltage & Pumps</option>
                <option value="Terrace Gardens">Terrace Gardens</option>
                <option value="Water Features & Masonry">Water Features & Masonry</option>
                <option value="Softscape & Planting">Softscape & Planting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98451 00000"
                value={phoneOrPlate}
                onChange={e => setPhoneOrPlate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 block mb-1">
                Daily Wage Rate (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={dailyRate}
                onChange={e => setDailyRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">
              Skills & Specializations (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Bermuda Turf Laying, Drip Automation, Kadappa Flagstones"
              value={specs}
              onChange={e => setSpecs(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
