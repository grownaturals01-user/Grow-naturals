import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { api } from '../services/api';
import type { User } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, FolderKanban } from 'lucide-react';

export const ProjectNew: React.FC = () => {
  const { businessId, business } = useBusiness();
  const navigate = useNavigate();

  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [name, setName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [supervisorId, setSupervisorId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [budget, setBudget] = useState<string>('0');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('active');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    api.get('/supervisors').then(setSupervisors).catch(console.warn);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim()) {
      alert('Project name and client name are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/projects', {
        business_id: businessId,
        name: name.trim(),
        client_name: clientName.trim(),
        company: company.trim(),
        supervisor_id: supervisorId || null,
        start_date: startDate || null,
        end_date: endDate || null,
        budget: Number(budget) || 0,
        description: description.trim(),
        status,
      });

      navigate(`/projects/${res.id}`);
    } catch (err: any) {
      alert(`Error creating project: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <Link
            to="/projects"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-text-muted)', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <h1 className="page-title">
            <span>New Landscaping & Client Project ({business?.name})</span>
          </h1>
          <p className="page-description">
            Initialize project accounting, supervisor assignment, and client collection milestones.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Project Name / Title <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Oberoi Rooftop Garden, Baner Luxury Villa Landscaping"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Client / POC Name <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Oberoi Luxury Resorts, Mr. Deshpande"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company / Group</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Oberoi Hotels Group"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Assigned Site Supervisor</label>
              <select
                className="form-select"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone || 'Supervisor'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input tabular"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Completion Date</label>
              <input
                type="date"
                className="form-input tabular"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Estimated Budget / Contract Value (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input tabular"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active Installation</option>
                <option value="planning">Planning & Sourcing</option>
                <option value="completed">Completed & Handed Over</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Scope Description / Client Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Detail site dimensions, plant varieties required, irrigation specs, or milestone delivery notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="card-footer">
          <Link to="/projects" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-proj" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};
