import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';
import { EnquiryStatus } from '../../types/landscaping';
import { calculateQuotationSummary, formatCurrency } from '../../utils/calculations';
import { Plus, Search, User, MapPin, Calculator, RefreshCw, CheckCircle2, ArrowRight, Clock, AlertCircle, LayoutGrid, List } from 'lucide-react';

interface EnquiriesPipelineViewProps {
  onOpenNewEnquiry: () => void;
}

export const EnquiriesPipelineView: React.FC<EnquiriesPipelineViewProps> = ({ onOpenNewEnquiry }) => {
  const {
    projects,
    selectProject,
    approveAndConvertToProject,
    currency,
  } = useProjects();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Enquiries: all projects where isConvertedToProject is false (or show all in pipeline)
  const enquiries = projects.filter(p => !p.isConvertedToProject);

  const filteredEnquiries = enquiries.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.step1Enquiry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.step1Enquiry.city.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return p.step1Enquiry.enquiryStatus === statusFilter;
  });

  // Pipeline metrics
  let totalPipelineBudget = 0;
  let totalQuotedValue = 0;
  let materialsRevisedCount = 0;
  let awaitingApprovalCount = 0;

  enquiries.forEach(p => {
    totalPipelineBudget += Number(p.step1Enquiry.estimatedBudget) || 0;
    const summary = calculateQuotationSummary(
      p.step3Quotation.items,
      p.step3Quotation.taxPercent,
      p.step3Quotation.discountAmount
    );
    totalQuotedValue += summary.totalQuotation;
    if (p.step1Enquiry.enquiryStatus === 'Materials Revised') {
      materialsRevisedCount++;
    }
    if (p.step3Quotation.status === 'Sent' || p.step3Quotation.status === 'In Review') {
      awaitingApprovalCount++;
    }
  });

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case 'New Enquiry':
        return <span className="bg-neutral-100 text-neutral-800 font-semibold px-2.5 py-0.5 rounded text-[11px]">New Enquiry</span>;
      case 'Site Visit Scheduled':
        return <span className="bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded text-[11px]">Site Visit Scheduled</span>;
      case 'Site Visit Completed':
        return <span className="bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-0.5 rounded text-[11px]">Site Visit Completed</span>;
      case 'Quotation Drafted':
        return <span className="bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded text-[11px]">Quotation Drafted</span>;
      case 'Materials Revised':
        return <span className="bg-purple-100 text-purple-900 font-semibold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Materials Revised
        </span>;
      case 'Quotation Approved':
        return <span className="bg-emerald-100 text-emerald-900 font-semibold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Quotation Approved
        </span>;
      case 'Enquiry Lost':
        return <span className="bg-rose-100 text-rose-800 font-semibold px-2.5 py-0.5 rounded text-[11px]">Enquiry Dropped</span>;
      default:
        return <span className="bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Customer Enquiries & Quotations Pipeline
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage incoming enquiries, update client material specifications, track quotation revisions, and approve quotations to move them into Active Projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewEnquiry}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer Enquiry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <span className="text-xs font-medium text-neutral-500">Open Enquiries</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {enquiries.length}
            </span>
            <span className="text-xs text-neutral-500">pre-project stage</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Undergoing site visits & material estimates
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <span className="text-xs font-medium text-neutral-500">Total Quoted Proposals</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-neutral-900 tabular-nums">
              {formatCurrency(totalQuotedValue, currency)}
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Sum of current active quotation revisions
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
            <span>Material Scope Revisions</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-purple-900 tabular-nums">
              {materialsRevisedCount}
            </span>
            <span className="text-xs text-purple-800 font-medium">materials modified</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Client changed grass, plants or pavers
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Approval</span>
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-amber-900 tabular-nums">
              {awaitingApprovalCount}
            </span>
            <span className="text-xs text-amber-800 font-medium">ready to convert</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Once approved, moves to Active Projects
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      {/* Filter & Search */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'All Enquiries' },
              { key: 'New Enquiry', label: 'New' },
              { key: 'Site Visit Completed', label: 'Survey Done' },
              { key: 'Materials Revised', label: 'Materials Revised' },
              { key: 'Quotation Drafted', label: 'Quote Sent' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === f.key
                    ? 'bg-neutral-900 text-white shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-neutral-200 mx-1" />

          {/* Grid vs Table Toggle */}
          <div className="bg-neutral-100 p-0.5 rounded-lg flex items-center border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search enquiries by client, site or code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Enquiries Grid or Table View */}
      {filteredEnquiries.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900">No Pending Enquiries in Pipeline</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            All customer quotations have either been approved and moved to the Active Projects menu, or no matching enquiries were found.
          </p>
          <button
            onClick={onOpenNewEnquiry}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-theme-primary rounded-lg"
          >
            Create New Enquiry
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-3.5 text-left">Code</th>
                  <th className="py-3 px-3.5 text-left">Client & Enquiry Details</th>
                  <th className="py-3 px-3.5 text-left">Location / City</th>
                  <th className="py-3 px-3 text-center">Enquiry Status</th>
                  <th className="py-3 px-3 text-right">Est. Budget</th>
                  <th className="py-3 px-3 text-right">Quoted Total</th>
                  <th className="py-3 px-3 text-center">Revisions</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredEnquiries.map(enquiry => {
                  const quoteSummary = calculateQuotationSummary(
                    enquiry.step3Quotation.items,
                    enquiry.step3Quotation.taxPercent,
                    enquiry.step3Quotation.discountAmount
                  );
                  return (
                    <tr
                      key={enquiry.id}
                      onClick={() => selectProject(enquiry.id, 'enquiry')}
                      className="hover:bg-neutral-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3.5 text-left">
                        <span className="font-mono text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                          {enquiry.code}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-left">
                        <div className="font-bold text-neutral-900 hover:text-primary transition-colors">
                          {enquiry.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {enquiry.step1Enquiry.clientName} · {enquiry.step1Enquiry.clientType}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-left text-neutral-700">
                        {enquiry.step1Enquiry.city || 'Bangalore'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(enquiry.step1Enquiry.enquiryStatus)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-neutral-900 tabular-nums">
                        {formatCurrency(Number(enquiry.step1Enquiry.estimatedBudget) || 0, currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-800 tabular-nums">
                        {formatCurrency(quoteSummary.totalQuotation, currency)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-neutral-700">
                        #{enquiry.step1Enquiry.revisionCount || 1}
                      </td>
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => selectProject(enquiry.id, 'enquiry')}
                            className="btn btn-sm btn-outline-primary py-1 px-2.5 fs-11 fw-semibold shadow-none"
                          >
                            Open Quote
                          </button>
                          <button
                            type="button"
                            onClick={() => approveAndConvertToProject(enquiry.id, enquiry.step1Enquiry.clientName)}
                            className="btn btn-sm btn-outline-success py-1 px-2.5 fs-11 fw-semibold shadow-none"
                            title="Approve & convert to active project"
                          >
                            Convert
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEnquiries.map(enquiry => {
            const quoteSummary = calculateQuotationSummary(
              enquiry.step3Quotation.items,
              enquiry.step3Quotation.taxPercent,
              enquiry.step3Quotation.discountAmount
            );
            const latestChange = enquiry.step1Enquiry.materialChangeHistory?.[0];

            return (
              <div
                key={enquiry.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-emerald-600 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      {enquiry.code}
                    </span>
                    {getStatusBadge(enquiry.step1Enquiry.enquiryStatus)}
                  </div>

                  {/* Title & Customer */}
                  <h3
                    onClick={() => selectProject(enquiry.id, 'enquiry')}
                    className="text-base font-bold text-neutral-900 cursor-pointer hover:text-emerald-800 transition-colors line-clamp-1"
                  >
                    {enquiry.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium text-neutral-700">{enquiry.step1Enquiry.clientName}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{enquiry.step1Enquiry.city || 'Bangalore'}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{enquiry.step1Enquiry.clientType}</span>
                  </div>

                  {/* Material change revision callout banner */}
                  {latestChange && (
                    <div className="mt-3 p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 text-xs text-purple-950 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1 text-purple-900">
                          <RefreshCw className="w-3 h-3" />
                          <span>Material Change Revision #{enquiry.step1Enquiry.revisionCount || 1}</span>
                        </span>
                        <span className="text-[10px] text-purple-700">{latestChange.date}</span>
                      </div>
                      <p className="text-[11px] text-purple-900 leading-snug">{latestChange.description}</p>
                      <div className="text-[10px] text-purple-800 flex items-center gap-1">
                        <span>Quotation automatically updated:</span>
                        <strong className="font-bold tabular-nums">
                          {formatCurrency(latestChange.previousQuotationTotal, currency)} → {formatCurrency(latestChange.newQuotationTotal, currency)}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Scope tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {enquiry.step1Enquiry.projectRequirements.slice(0, 4).map((req, i) => (
                      <span key={i} className="text-[11px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Commercial & Actions */}
                <div className="pt-3 border-t border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-neutral-500 block">Indicative Budget</span>
                      <span className="font-semibold text-neutral-700 tabular-nums">
                        {formatCurrency(enquiry.step1Enquiry.estimatedBudget, currency)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-neutral-500 block">Current Quotation Total</span>
                      <span className="text-base font-bold text-emerald-900 tabular-nums">
                        {formatCurrency(quoteSummary.totalQuotation, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => selectProject(enquiry.id, 'enquiry')}
                      className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Edit Materials & Requirements
                    </button>

                    <button
                      onClick={() => approveAndConvertToProject(enquiry.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
                      title="Approve Quotation and Move to Active Projects menu"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Move to Project</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
