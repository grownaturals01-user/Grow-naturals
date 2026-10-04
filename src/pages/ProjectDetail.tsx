import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import type { Project, ProjectDailyTask, Expense, Quotation, Invoice, DeliveryChallan, ExpenseCategory } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ExpenseReceiptModal } from '../components/common/ExpenseReceiptModal';
import {
  ArrowLeft,
  IndianRupee,
  Receipt,
  TrendingUp,
  User,
  Users,
  Phone,
  Mail,
  Calendar,
  Clock,
  Plus,
  Send,
  Building,
  Truck,
  Eye,
  EyeOff,
  Lock,
  Link2,
  Unlink,
  Edit2,
  CheckCircle,
  AlertCircle,
  FileText,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  Check,
  X,
  ChevronRight,
  Trash2,
  ExternalLink,
  Briefcase,
  MapPin,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Coins,
  Filter,
  RotateCcw
} from 'lucide-react';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { businessId, business } = useBusiness();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'work_labour' | 'billing' | 'expenses' | 'daily_progress'>('overview');

  // Profit privacy reveal state (hidden by default)
  const [showProfit, setShowProfit] = useState<boolean>(false);

  // Modals & Popups
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState<boolean>(false);
  const [isWorkLabourModalOpen, setIsWorkLabourModalOpen] = useState<boolean>(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [isDailyTaskModalOpen, setIsDailyTaskModalOpen] = useState<boolean>(false);
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<Expense | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<ProjectDailyTask | null>(null);

  // Link Quotes & Invoices Modals State
  const [isLinkQuoteModalOpen, setIsLinkQuoteModalOpen] = useState<boolean>(false);
  const [isLinkInvoiceModalOpen, setIsLinkInvoiceModalOpen] = useState<boolean>(false);
  const [availableQuotes, setAvailableQuotes] = useState<Quotation[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([]);
  const [selectedQuoteIdToLink, setSelectedQuoteIdToLink] = useState<string>('');
  const [selectedInvoiceIdToLink, setSelectedInvoiceIdToLink] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);

  // Date Filter for Daily Tasks
  const [taskDateFilter, setTaskDateFilter] = useState<string>('all');
  const [taskSpecificDate, setTaskSpecificDate] = useState<string>('');

  // Advance edit state
  const [advanceInput, setAdvanceInput] = useState<number | string>('');
  const [isSavingAdvance, setIsSavingAdvance] = useState<boolean>(false);

  // Work & Labour assignment state
  const [workScopeInput, setWorkScopeInput] = useState<string>('');
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [expectedDateInput, setExpectedDateInput] = useState<string>('');
  const [labourCountInput, setLabourCountInput] = useState<number | string>('');
  const [assignedLabourInput, setAssignedLabourInput] = useState<string>('');
  const [statusInput, setStatusInput] = useState<string>('planning');
  const [isSavingWorkLabour, setIsSavingWorkLabour] = useState<boolean>(false);

  // Add Expense form state
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    category_name: '',
    amount: '',
    recipient: '',
    notes: '',
    payment_method: 'cash',
    image_url: ''
  });
  const [isSavingExpense, setIsSavingExpense] = useState<boolean>(false);

  // Daily Task form state
  const [dailyTaskForm, setDailyTaskForm] = useState({
    task_date: new Date().toISOString().split('T')[0],
    task_title: '',
    description: '',
    images: [] as string[]
  });
  const [isSavingDailyTask, setIsSavingDailyTask] = useState<boolean>(false);

  // Remarks state per task
  const [activeRemarksTaskId, setActiveRemarksTaskId] = useState<string | null>(null);
  const [remarksText, setRemarksText] = useState<string>('');
  const [isSavingRemarks, setIsSavingRemarks] = useState<boolean>(false);

  // Quick Supervisor Update form
  const [supervisorNotes, setSupervisorNotes] = useState<string>('');
  const [supervisorStatusChange, setSupervisorStatusChange] = useState<string>('');
  const [isPostingUpdate, setIsPostingUpdate] = useState<boolean>(false);

  const fetchAvailableLinks = async () => {
    if (!id) return;
    try {
      const data: any = await api.get(`/projects/${id}/available-links`);
      if (data) {
        setAvailableQuotes(data.quotations || []);
        setAvailableInvoices(data.invoices || []);
      }
    } catch (err) {
      console.warn('Failed to load available links:', err);
    }
  };

  const handleLinkQuotation = async () => {
    if (!id || !selectedQuoteIdToLink) return;
    setIsLinking(true);
    try {
      await api.post(`/projects/${id}/link-quotation`, { quotation_id: selectedQuoteIdToLink });
      setIsLinkQuoteModalOpen(false);
      setSelectedQuoteIdToLink('');
      fetchProject();
    } catch (err: any) {
      alert(`Error linking quotation: ${err.message}`);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkQuotation = async (quoteId: string) => {
    if (!id || !quoteId) return;
    if (!window.confirm('Unlink this quotation from the project?')) return;
    try {
      await api.post(`/projects/${id}/unlink-quotation`, { quotation_id: quoteId });
      fetchProject();
    } catch (err: any) {
      alert(`Error unlinking quotation: ${err.message}`);
    }
  };

  const handleLinkInvoice = async () => {
    if (!id || !selectedInvoiceIdToLink) return;
    setIsLinking(true);
    try {
      await api.post(`/projects/${id}/link-invoice`, { invoice_id: selectedInvoiceIdToLink });
      setIsLinkInvoiceModalOpen(false);
      setSelectedInvoiceIdToLink('');
      fetchProject();
    } catch (err: any) {
      alert(`Error linking invoice: ${err.message}`);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkInvoice = async (invId: string) => {
    if (!id || !invId) return;
    if (!window.confirm('Unlink this invoice from the project?')) return;
    try {
      await api.post(`/projects/${id}/unlink-invoice`, { invoice_id: invId });
      fetchProject();
    } catch (err: any) {
      alert(`Error unlinking invoice: ${err.message}`);
    }
  };

  const fetchProject = () => {
    setIsLoading(true);
    setFetchError(null);
    api
      .get(`/projects/${id}`)
      .then((data: Project) => {
        setProject(data);
        setAdvanceInput(data.advance_amount || 0);
        setWorkScopeInput(data.assigned_work || '');
        setStartDateInput(data.start_date ? data.start_date.split('T')[0] : '');
        setExpectedDateInput(data.expected_completion_date ? data.expected_completion_date.split('T')[0] : '');
        setLabourCountInput(data.labour_count || 0);
        setAssignedLabourInput(data.assigned_labour || '');
        setStatusInput(data.status || 'planning');
      })
      .catch((err: any) => {
        console.error('Error fetching project:', err);
        setFetchError(err.message || 'Failed to load project details.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProject();
    api.get('/expenses/categories')
      .then((cats) => setCategories(cats || []))
      .catch(() => {});
  }, [id]);

  // Keep selectedDetailTask updated if project tasks change
  useEffect(() => {
    if (selectedDetailTask && project?.daily_tasks) {
      const updated = project.daily_tasks.find(t => t.id === selectedDetailTask.id);
      if (updated) setSelectedDetailTask(updated);
    }
  }, [project]);

  // Step 9: Save Advance Amount
  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdvance(true);
    try {
      await api.put(`/projects/${id}`, {
        advance_amount: Number(advanceInput) || 0
      });
      setIsAdvanceModalOpen(false);
      fetchProject();
    } catch (err: any) {
      alert(`Error updating advance amount: ${err.message}`);
    } finally {
      setIsSavingAdvance(false);
    }
  };

  // Step 10 & 12: Save Work & Labour Assignment + Status
  const handleSaveWorkLabour = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWorkLabour(true);
    try {
      await api.put(`/projects/${id}`, {
        assigned_work: workScopeInput,
        start_date: startDateInput || null,
        expected_completion_date: expectedDateInput || null,
        labour_count: Number(labourCountInput) || 0,
        assigned_labour: assignedLabourInput,
        status: statusInput
      });
      setIsWorkLabourModalOpen(false);
      fetchProject();
    } catch (err: any) {
      alert(`Error updating work assignment: ${err.message}`);
    } finally {
      setIsSavingWorkLabour(false);
    }
  };

  // Step 11: Add Project Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    setIsSavingExpense(true);
    try {
      const selectedCat = categories.find(c => c.id === expenseForm.category_id);
      await api.post(`/projects/${id}/expenses`, {
        date: expenseForm.date,
        category_id: expenseForm.category_id || null,
        category_name: selectedCat ? selectedCat.name : 'Project Expense',
        amount: Number(expenseForm.amount),
        recipient: expenseForm.recipient,
        notes: expenseForm.notes,
        payment_method: expenseForm.payment_method,
        image_url: expenseForm.image_url
      });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        category_name: '',
        amount: '',
        recipient: '',
        notes: '',
        payment_method: 'cash',
        image_url: ''
      });
      fetchProject();
    } catch (err: any) {
      alert(`Error recording expense: ${err.message}`);
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Step 13: Daily Task Completion Image Upload Handler
  const handleTaskImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDailyTaskForm(prev => ({
            ...prev,
            images: [...prev.images, event.target!.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveTaskImage = (index: number) => {
    setDailyTaskForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Step 13: Save Daily Task
  const handleSaveDailyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyTaskForm.task_title.trim()) {
      alert('Please enter a task title / summary.');
      return;
    }

    setIsSavingDailyTask(true);
    try {
      await api.post(`/projects/${id}/daily-tasks`, {
        task_date: dailyTaskForm.task_date,
        task_title: dailyTaskForm.task_title.trim(),
        description: dailyTaskForm.description.trim(),
        images: dailyTaskForm.images,
        created_by: user?.id,
        created_by_name: user?.name || 'Site Supervisor'
      });
      setIsDailyTaskModalOpen(false);
      setDailyTaskForm({
        task_date: new Date().toISOString().split('T')[0],
        task_title: '',
        description: '',
        images: []
      });
      fetchProject();
    } catch (err: any) {
      alert(`Error recording daily task: ${err.message}`);
    } finally {
      setIsSavingDailyTask(false);
    }
  };

  // Step 14: Save Remarks on Daily Task
  const handleSaveRemarks = async (taskId: string) => {
    if (!remarksText.trim()) return;
    setIsSavingRemarks(true);
    try {
      await api.put(`/projects/${id}/daily-tasks/${taskId}/remarks`, {
        remarks: remarksText.trim(),
        remarks_by: user?.id,
        remarks_by_name: user?.name || 'Project Manager / Admin'
      });
      setActiveRemarksTaskId(null);
      setRemarksText('');
      fetchProject();
    } catch (err: any) {
      alert(`Error saving remarks: ${err.message}`);
    } finally {
      setIsSavingRemarks(false);
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/projects/${id}`, { status: newStatus });
      fetchProject();
    } catch (err: any) {
      alert(`Error changing status: ${err.message}`);
    }
  };

  // Quick Supervisor Note Update
  const handlePostSupervisorUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorNotes.trim()) return;

    setIsPostingUpdate(true);
    try {
      await api.post(`/projects/${id}/updates`, {
        supervisor_id: user?.id,
        notes: supervisorNotes.trim(),
        status_change: supervisorStatusChange || undefined,
      });

      setSupervisorNotes('');
      setSupervisorStatusChange('');
      fetchProject();
    } catch (err: any) {
      alert(`Error logging update: ${err.message}`);
    } finally {
      setIsPostingUpdate(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--color-text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
        <p style={{ fontWeight: 600 }}>Loading project workspace...</p>
      </div>
    );
  }

  if (fetchError || !project) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '480px', margin: '40px auto' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          Unable to Load Project
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '20px' }}>
          {fetchError || 'Project not found or failed to load data.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/projects" className="btn btn-secondary">
            <ArrowLeft size={15} /> Back to Projects
          </Link>
          <button type="button" onClick={fetchProject} className="btn btn-proj">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalAdvance = Number(project.advance_amount || 0);
  const totalBilled = (project.invoices && project.invoices.length > 0)
    ? project.invoices.reduce((acc, inv) => acc + Number(inv.total_amount || 0), 0)
    : Number(project.collection_value || 0);
  const totalExpenses = (project.expenses && project.expenses.length > 0)
    ? project.expenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0)
    : Number(project.total_expenses || 0);
  const netProfit = Number((totalBilled - totalExpenses).toFixed(2));
  const isProfitable = netProfit >= 0;
  const contractBudget = Number(project.budget || 0);
  const quotesTotal = (project.quotations || []).reduce((acc, q) => acc + Number(q.total_amount || 0), 0);

  // Filtered daily tasks based on Date Filter
  const filteredDailyTasks = (project.daily_tasks || []).filter(task => {
    if (taskSpecificDate) {
      return task.task_date.startsWith(taskSpecificDate);
    }
    if (taskDateFilter !== 'all') {
      return task.task_date === taskDateFilter;
    }
    return true;
  });

  const uniqueTaskDates = Array.from(new Set((project.daily_tasks || []).map(t => t.task_date)));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'warning';
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'on_hold':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ width: '100%', paddingBottom: '60px' }}>
      {/* Top Header & Breadcrumbs (Responsive) */}
      <div className="project-header-container">
        <div className="project-title-area">
          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={15} /> Back to Projects Directory
          </Link>

          <div className="project-title-row">
            <h1 className="page-title" style={{ margin: 0, fontSize: '22px' }}>
              {project.name}
            </h1>
            
            {/* Status Selector Pill & Dropdown */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {project.status === 'in_progress' ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(254, 159, 67, 0.16)',
                  color: '#e67e22',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: '1px solid rgba(254, 159, 67, 0.4)',
                  letterSpacing: '0.3px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e67e22', display: 'inline-block' }} />
                  ⚡ IN PROGRESS
                </span>
              ) : (
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status.toUpperCase()}
                </Badge>
              )}

              {/* Status Switcher Selector */}
              <select
                className="project-status-selector"
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                title="Change Project Status"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">⚡ In Progress</option>
                <option value="active">Active Execution</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          <p className="page-description" style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <strong>Client:</strong> {project.client_name} {project.company && `(${project.company})`}
            {project.location && ` • 📍 ${project.location}`}
            {project.work_type && ` • 🌿 ${project.work_type}`}
          </p>
        </div>

        {/* Global Action Bar (Responsive) */}
        <div className="project-actions-group">
          <button
            type="button"
            className="btn btn-proj btn-sm"
            onClick={() => setIsDailyTaskModalOpen(true)}
            style={{ fontWeight: 600, gap: '6px' }}
          >
            <Camera size={15} /> Record Daily Task
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsExpenseModalOpen(true)}
            style={{ fontWeight: 600, gap: '6px' }}
          >
            <Plus size={15} /> Add Expense
          </button>
          <Link
            to={`/quotations/new?customer_name=${encodeURIComponent(project.client_name)}&phone=${encodeURIComponent(project.phone || '')}&project_id=${project.id}`}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600, gap: '6px' }}
          >
            <FileText size={15} /> Create Quote
          </Link>
          <Link
            to={`/delivery-challans/new?project_id=${project.id}&customer_name=${encodeURIComponent(project.client_name)}`}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600, gap: '6px' }}
          >
            <Truck size={15} /> Dispatch DC
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards (Step 8 & 9) */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        {/* Advance Received Card (Step 9) */}
        <div className="stat-card stat-proj">
          <span className="stat-card-accent-bar" />
          <div className="stat-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span className="stat-label">Advance Received</span>
              <button
                type="button"
                onClick={() => {
                  setAdvanceInput(project.advance_amount || 0);
                  setIsAdvanceModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(254, 159, 67, 0.12)',
                  border: '1px solid rgba(254, 159, 67, 0.3)',
                  color: '#e67e22',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Edit Advance Received Amount"
              >
                <Edit2 size={11} /> Edit
              </button>
            </div>
            <span className="stat-value tabular">
              ₹{totalAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="stat-sub">
              Site visit fee: ₹{Number(project.site_visit_amount || 0).toLocaleString('en-IN')}
              {Number(project.allowance_amount || 0) > 0 && ` • Allow: ₹${Number(project.allowance_amount).toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <Coins size={22} />
          </div>
        </div>

        {/* Collection Value (Billed Invoices) */}
        <StatCard
          label="Collection Value (Invoices)"
          value={`₹${totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subValue={`${project.invoices?.length || 0} invoice(s) • Quoted: ₹${quotesTotal.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          variant="stat-sell"
        />

        {/* Project Expenses */}
        <StatCard
          label="Project Expenses Log"
          value={`₹${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subValue={`${project.expenses?.length || 0} day-wise expense entries`}
          icon={Receipt}
          variant="stat-ops"
        />

        {/* Net Project Profit (Confidential by default, revealed on button click) */}
        <div className={`stat-card ${showProfit ? (isProfitable ? 'stat-inv' : 'stat-ops') : 'stat-proj'}`}>
          <span className="stat-card-accent-bar" />
          <div className="stat-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span className="stat-label">Net Project Profit</span>
              <button
                type="button"
                onClick={() => setShowProfit(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: showProfit ? 'rgba(100, 116, 139, 0.12)' : 'rgba(16, 185, 129, 0.14)',
                  border: showProfit ? '1px solid rgba(100, 116, 139, 0.3)' : '1px solid rgba(16, 185, 129, 0.35)',
                  color: showProfit ? 'var(--color-text-secondary)' : '#047857',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title={showProfit ? 'Hide Net Profit' : 'See Project Profit'}
              >
                {showProfit ? (
                  <>
                    <EyeOff size={11} /> Hide Profit
                  </>
                ) : (
                  <>
                    <Eye size={11} /> See Profit
                  </>
                )}
              </button>
            </div>
            <span
              className="stat-value tabular"
              style={{
                letterSpacing: showProfit ? 'normal' : '3px',
                color: showProfit ? (isProfitable ? '#059669' : '#e11d48') : 'var(--color-text-muted)'
              }}
            >
              {showProfit ? (
                `₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              ) : (
                '••••••••'
              )}
            </span>
            <span className="stat-sub">
              {showProfit ? (
                totalBilled > 0
                  ? `${totalBilled > 0 ? ((netProfit / totalBilled) * 100).toFixed(1) : 0}% profit margin`
                  : contractBudget > 0
                  ? `Budget: ₹${contractBudget.toLocaleString('en-IN')}`
                  : 'Pending invoice billing'
              ) : (
                'Confidential • Click "See Profit" to view'
              )}
            </span>
          </div>
          <div className="stat-icon-wrapper">
            {showProfit ? <TrendingUp size={22} /> : <Lock size={22} />}
          </div>
        </div>
      </div>

      {/* Responsive Tabs Navigation Bar */}
      <div className="project-tabs-nav">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`project-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <Layers size={16} /> Overview & Financials
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('daily_progress')}
          className={`project-tab-btn ${activeTab === 'daily_progress' ? 'active' : ''}`}
        >
          <Camera size={16} /> Daily Task Updates & Remarks
          <span className="project-tab-badge">
            {project.daily_tasks?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('work_labour')}
          className={`project-tab-btn ${activeTab === 'work_labour' ? 'active' : ''}`}
        >
          <Users size={16} /> Work & Labour Assignment
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`project-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
        >
          <Receipt size={16} /> Day-Wise Expenses
          <span className="project-tab-badge">
            {project.expenses?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`project-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
        >
          <FileSpreadsheet size={16} /> Quotations & Invoices
          <span className="project-tab-badge">
            {(project.quotations?.length || 0) + (project.invoices?.length || 0)}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & FINANCIALS */}
      {activeTab === 'overview' && (
        <div className="project-grid-layout">
          {/* Left Column: Work & Labour Snapshot + Recent Daily Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Work & Labour Summary Card */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 className="card-title">
                  <Briefcase size={18} color="var(--color-primary)" />
                  Work Scope & Labour Deployment
                </h3>
                <button
                  type="button"
                  onClick={() => setIsWorkLabourModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', gap: '5px' }}
                >
                  <Edit2 size={13} /> Update Assignment
                </button>
              </div>
              <div className="card-body">
                <div className="project-work-metric-grid">
                  <div style={{ backgroundColor: 'var(--color-bg-surface-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                      Work Start Date
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Not specified'}
                    </strong>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-bg-surface-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                      Expected / Planned Date
                    </span>
                    <strong style={{ fontSize: '14px', color: '#e67e22' }}>
                      {project.expected_completion_date ? new Date(project.expected_completion_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Pending plan'}
                    </strong>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-bg-surface-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                      Labour Count Deployed
                    </span>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      👥 {project.labour_count || 0} Workers Assigned
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Assigned Work Scope
                  </span>
                  <div style={{
                    backgroundColor: 'var(--color-bg-surface-subtle)',
                    border: '1px solid var(--color-border)',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: project.assigned_work ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    whiteSpace: 'pre-wrap',
                    minHeight: '40px'
                  }}>
                    {project.assigned_work || 'No specific work scope detailed yet. Click "Update Assignment" to define work tasks.'}
                  </div>
                </div>

                {project.assigned_labour && (
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Assigned Team / Labour Names
                    </span>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-surface-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
                      {project.assigned_labour}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Latest Daily Progress Snapshot */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 className="card-title">
                  <Camera size={18} color="#e67e22" />
                  Latest Daily Work Updates ({project.daily_tasks?.length || 0})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDailyTaskModalOpen(true)}
                  className="btn btn-proj btn-sm"
                  style={{ fontSize: '12px', gap: '5px' }}
                >
                  <Plus size={13} /> Record Today's Task
                </button>
              </div>
              <div className="card-body">
                {(project.daily_tasks || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '13px' }}>No daily task updates recorded yet for this project.</p>
                    <button
                      type="button"
                      onClick={() => setIsDailyTaskModalOpen(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '12px' }}
                    >
                      <Camera size={14} /> Record First Day's Progress
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {project.daily_tasks!.slice(0, 3).map((task) => {
                      const taskImages = Array.isArray(task.images) ? task.images : [];
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedDetailTask(task)}
                          style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            backgroundColor: 'var(--color-bg-surface)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ fontSize: '11px', color: '#e67e22', fontWeight: 700 }}>
                                📅 {new Date(task.task_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>• By {task.created_by_name || 'Site Lead'}</span>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {task.task_title}
                            </h4>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {taskImages.length > 0 && (
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(254, 159, 67, 0.15)', color: '#e67e22', fontWeight: 700 }}>
                                📷 {taskImages.length}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailTask(task);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <Eye size={12} /> View
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {project.daily_tasks!.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('daily_progress')}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        View all {project.daily_tasks!.length} Daily Progress Updates <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Project & Client Info + Supervisor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Project & Client Specifications Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Project & Client Info</h3>
              </div>
              <div className="card-body" style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Client Name & Company
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    {project.client_name}
                  </span>
                  {project.company && (
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      {project.company}
                    </div>
                  )}
                </div>

                {project.phone && (
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                      Phone / Contact
                    </span>
                    <span style={{ fontWeight: 600 }}>{project.phone}</span>
                  </div>
                )}

                {project.gst_number && (
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                      GST Number
                    </span>
                    <span style={{ fontWeight: 600 }}>{project.gst_number}</span>
                  </div>
                )}

                {project.location && (
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                      Project Location / Site
                    </span>
                    <span style={{ fontWeight: 600 }}>📍 {project.location}</span>
                  </div>
                )}

                {project.referred_by && (
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                      Referred By
                    </span>
                    <span style={{ fontWeight: 600, color: '#6366f1' }}>🤝 {project.referred_by}</span>
                  </div>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Work Classification & Category
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {project.work_type && <strong style={{ color: '#092C4C' }}>{project.work_type}</strong>}
                    {project.work_nature === 'rework' ? (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ffe4e6', color: '#e11d48', fontWeight: 700 }}>
                        🔄 Rework ({project.rework_source === 'our_existing' ? 'Our Work' : 'Someone Else'})
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>
                        🌱 New Work
                      </span>
                    )}
                    {project.category_name && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(254, 159, 67, 0.12)', color: '#FE9F43', fontWeight: 600 }}>
                        {project.category_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Supervisor Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Site Supervisor</h3>
              </div>
              <div className="card-body">
                {project.supervisor_name ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                        {project.supervisor_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'var(--font-md)' }}>{project.supervisor_name}</div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-muted)' }}>Field Supervisor</div>
                      </div>
                    </div>

                    {project.supervisor_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                        <Phone size={14} /> {project.supervisor_phone}
                      </div>
                    )}

                    {project.supervisor_email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
                        <Mail size={14} /> {project.supervisor_email}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)', margin: 0 }}>
                    No supervisor assigned to this project yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY PROGRESS & REMARKS (Step 13 & 14) WITH DATE FILTER & SCROLLBAR */}
      {activeTab === 'daily_progress' && (
        <div className="project-grid-layout">
          {/* Main Feed Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Daily Task Completion & Progress Log
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Click on any task or the eye icon to view full descriptions, site photo gallery, and review feedback.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDailyTaskModalOpen(true)}
                className="btn btn-proj"
                style={{ fontWeight: 600, gap: '6px' }}
              >
                <Camera size={16} /> + Record Daily Task
              </button>
            </div>

            {/* Date Filter Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              backgroundColor: 'var(--color-bg-surface)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Filter size={13} /> Filter by Date:
                </span>
                
                <select
                  className="form-select"
                  style={{ width: '160px', height: '32px', fontSize: '12px', fontWeight: 600 }}
                  value={taskDateFilter}
                  onChange={(e) => {
                    setTaskDateFilter(e.target.value);
                    setTaskSpecificDate('');
                  }}
                >
                  <option value="all">All Dates ({project.daily_tasks?.length || 0})</option>
                  {uniqueTaskDates.map(dateStr => (
                    <option key={dateStr} value={dateStr}>
                      {new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  className="form-input"
                  style={{ width: '150px', height: '32px', fontSize: '12px' }}
                  value={taskSpecificDate}
                  onChange={(e) => {
                    setTaskSpecificDate(e.target.value);
                    setTaskDateFilter('all');
                  }}
                />

                {(taskDateFilter !== 'all' || taskSpecificDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTaskDateFilter('all');
                      setTaskSpecificDate('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <RotateCcw size={11} /> Reset Filter
                  </button>
                )}
              </div>

              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Showing {filteredDailyTasks.length} of {project.daily_tasks?.length || 0} task(s)
              </span>
            </div>

            {/* Scrollable Compact Tasks List */}
            {filteredDailyTasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-text-muted)' }}>
                <Camera size={42} style={{ margin: '0 auto 10px auto', opacity: 0.35, color: '#e67e22' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px 0' }}>
                  No Daily Tasks Match This Date
                </h4>
                <p style={{ fontSize: '13px', margin: 0, color: 'var(--color-text-secondary)' }}>
                  Try picking another date or clear the date filter above.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '560px',
                  overflowY: 'auto',
                  paddingRight: '6px'
                }}
              >
                {filteredDailyTasks.map((task) => {
                  const taskImages = Array.isArray(task.images) ? task.images : [];
                  const authorName = task.created_by_name || 'Site Lead';

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedDetailTask(task)}
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                        borderLeft: '4px solid #e67e22',
                        borderRadius: 'var(--radius-xl)',
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.15s ease'
                      }}
                      title="Click to view task details and photos"
                    >
                      {/* Left: Date, Author & Heading */}
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(254, 159, 67, 0.14)',
                            color: '#e67e22',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            📅 {new Date(task.task_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            by <strong>{authorName}</strong>
                          </span>
                        </div>

                        <h3 style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <CheckCircle size={16} color="#16a34a" /> {task.task_title}
                        </h3>

                        {/* Badges strip: photo count + remarks tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {taskImages.length > 0 ? (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#f0f9ff',
                              color: '#0284c7',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #bae6fd'
                            }}>
                              📷 {taskImages.length} Photo{taskImages.length > 1 ? 's' : ''} Attached
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>No photos</span>
                          )}

                          {task.remarks ? (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              color: '#4338ca',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #c7d2fe'
                            }}>
                              💬 Remarks Reviewed
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-bg-surface-subtle)',
                              color: 'var(--color-text-muted)',
                              fontWeight: 500
                            }}>
                              Pending remarks
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Prominent Eye Action Button */}
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetailTask(task);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderRadius: '6px',
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                            borderColor: '#bbf7d0'
                          }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar Column: Progress Summary & Project Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Metrics Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <Sparkles size={17} color="#e67e22" /> Progress Summary
                </h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: 'var(--color-bg-surface-subtle)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                      Days Logged
                    </span>
                    <strong style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                      {project.daily_tasks?.length || 0}
                    </strong>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-bg-surface-subtle)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                      Site Photos
                    </span>
                    <strong style={{ fontSize: '18px', color: '#e67e22' }}>
                      {(project.daily_tasks || []).reduce((acc, t) => acc + (Array.isArray(t.images) ? t.images.length : 0), 0)}
                    </strong>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-bg-surface-subtle)', padding: '12px 14px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Work Status
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {project.status === 'in_progress' ? '⚡ IN PROGRESS' : project.status.toUpperCase()}
                    </span>
                    <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDailyTaskModalOpen(true)}
                  className="btn btn-proj"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                >
                  <Camera size={15} /> + Record Today's Task
                </button>
              </div>
            </div>

            {/* Supervisor Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Site Lead & Assignment</h3>
              </div>
              <div className="card-body" style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Lead Supervisor
                  </span>
                  <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                    {project.supervisor_name || 'Unassigned'}
                  </strong>
                  {project.supervisor_phone && (
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                      📞 {project.supervisor_phone}
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Work Schedule
                  </span>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Start: <strong>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Pending'}</strong>
                    <br />
                    Target: <strong>{project.expected_completion_date ? new Date(project.expected_completion_date).toLocaleDateString() : 'Pending'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORK & LABOUR ASSIGNMENT (Step 10) */}
      {activeTab === 'work_labour' && (
        <div className="project-grid-layout">
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="card-title">
                <Briefcase size={18} color="var(--color-primary)" />
                Work Scope & Detailed Tasks
              </h3>
              <button
                type="button"
                onClick={() => setIsWorkLabourModalOpen(true)}
                className="btn btn-secondary btn-sm"
              >
                <Edit2 size={13} /> Edit Work Details
              </button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Assigned Work Scope / Plan
                </span>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  minHeight: '100px'
                }}>
                  {project.assigned_work || 'No specific work scope detailed. Click "Edit Work Details" to assign tasks.'}
                </div>
              </div>

              <div className="project-work-metric-grid">
                <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Work Start Date
                  </span>
                  <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}>
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN', { dateStyle: 'full' }) : 'Not set'}
                  </strong>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#e67e22', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Expected / Planned Date
                  </span>
                  <strong style={{ fontSize: '15px', color: '#e67e22' }}>
                    {project.expected_completion_date ? new Date(project.expected_completion_date).toLocaleDateString('en-IN', { dateStyle: 'full' }) : 'Not set'}
                  </strong>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Assigned Labour & Team Members ({project.labour_count || 0} Total Deployed)
                </span>
                <div style={{
                  padding: '14px',
                  backgroundColor: 'var(--color-bg-surface-subtle)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '13px'
                }}>
                  {project.assigned_labour || 'No labour names specified yet.'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Supervisor Quick Dispatch</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handlePostSupervisorUpdate}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Progress / Dispatch Note</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: '80px', fontSize: '13px' }}
                      placeholder="Add supervisor notes or site instructions..."
                      value={supervisorNotes}
                      onChange={(e) => setSupervisorNotes(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Update Status to</label>
                    <select
                      className="form-select"
                      style={{ fontSize: '12px' }}
                      value={supervisorStatusChange}
                      onChange={(e) => setSupervisorStatusChange(e.target.value)}
                    >
                      <option value="">Keep Status</option>
                      <option value="in_progress">⚡ In Progress</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-proj" style={{ width: '100%', justifyContent: 'center' }} disabled={isPostingUpdate}>
                    <Send size={14} /> {isPostingUpdate ? 'Posting...' : 'Post Supervisor Note'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DAY-WISE EXPENSES (Step 11) */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Day-Wise Project Expense Tracking
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Total Expenses: <strong style={{ color: '#e11d48' }}>₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> across {project.expenses?.length || 0} entries.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="btn btn-proj"
              style={{ fontWeight: 600, gap: '6px' }}
            >
              <Plus size={16} /> + Add Project Expense
            </button>
          </div>

          <div className="card">
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category / Type</th>
                    <th>Recipient / Paid To</th>
                    <th>Notes / Description</th>
                    <th>Receipt Proof</th>
                    <th>Payment Mode</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.expenses || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                        No day-wise expenses logged for this project yet.
                      </td>
                    </tr>
                  ) : (
                    project.expenses!.map((exp) => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: 600, fontSize: '13px' }}>
                          {new Date(exp.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </td>
                        <td>
                          <Badge variant="neutral">{exp.category_name || 'General'}</Badge>
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          {exp.recipient || '—'}
                          {exp.reference_no && (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>
                              Ref: {exp.reference_no}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px', maxWidth: '280px' }}>
                          {exp.notes || '—'}
                        </td>
                        <td>
                          {exp.image_url ? (
                            <button
                              type="button"
                              onClick={() => setViewingReceiptExpense(exp)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                color: '#0284c7',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="View Expense Proof"
                            >
                              <Eye size={12} /> View Proof
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>
                            {exp.payment_method}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#e11d48' }} className="tabular">
                          ₹{Number(exp.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: QUOTATIONS & INVOICES */}
      {activeTab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Linked Quotations */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="card-title">
                <FileText size={18} color="var(--color-primary)" />
                Mapped Quotations ({project.quotations?.length || 0})
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    fetchAvailableLinks();
                    setIsLinkQuoteModalOpen(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '5px' }}
                >
                  <Link2 size={13} /> Link Existing Quote
                </button>
                <Link
                  to={`/quotations/new?customer_name=${encodeURIComponent(project.client_name)}&phone=${encodeURIComponent(project.phone || '')}&project_id=${project.id}`}
                  className="btn btn-proj btn-sm"
                  style={{ gap: '5px' }}
                >
                  <Plus size={13} /> Create Quotation
                </Link>
              </div>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Date</th>
                    <th>Valid Until</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.quotations || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)' }}>
                        No quotations mapped to this project yet.
                      </td>
                    </tr>
                  ) : (
                    project.quotations!.map((q) => (
                      <tr key={q.id}>
                        <td>
                          <Link to={`/quotations/${q.id}`} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                            {q.quotation_number}
                          </Link>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(q.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}
                        </td>
                        <td>{q.item_count || 1} item(s)</td>
                        <td>
                          <Badge variant={q.status === 'converted_to_invoice' ? 'success' : q.status === 'sent' ? 'info' : 'neutral'}>
                            {q.status}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                          ₹{Number(q.total_amount).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link to={`/quotations/${q.id}`} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              View Quote
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleUnlinkQuotation(q.id)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 6px', fontSize: '11px', color: '#94a3b8' }}
                              title="Unlink quotation from project"
                            >
                              <Unlink size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Linked Invoices */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className="card-title">
                <IndianRupee size={18} color="var(--module-sell-accent)" />
                Billed Client Invoices ({project.invoices?.length || 0})
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    fetchAvailableLinks();
                    setIsLinkInvoiceModalOpen(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '5px' }}
                >
                  <Link2 size={13} /> Link Existing Invoice
                </button>
                <Link
                  to={`/invoices/create?customer_name=${encodeURIComponent(project.client_name)}&phone=${encodeURIComponent(project.phone || '')}&project_id=${project.id}`}
                  className="btn btn-proj btn-sm"
                  style={{ gap: '5px' }}
                >
                  <Plus size={13} /> Bill New Invoice
                </Link>
              </div>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.invoices || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)' }}>
                        No invoices billed for this project yet.
                      </td>
                    </tr>
                  ) : (
                    project.invoices!.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <Link to={`/invoices/${inv.id}`} style={{ fontWeight: 700, color: 'var(--module-sell-accent)' }}>
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge variant={inv.payment_status === 'paid' ? 'success' : 'warning'}>
                            {inv.payment_status}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular">
                          ₹{Number(inv.total_amount).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link to={`/invoices/${inv.id}`} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }}>
                              View Invoice
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleUnlinkInvoice(inv.id)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '2px 6px', fontSize: '11px', color: '#94a3b8' }}
                              title="Unlink invoice from project"
                            >
                              <Unlink size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULL TASK DETAILS (Opened by clicking eye icon) */}
      {selectedDetailTask && (
        <div className="project-modal-backdrop" onClick={() => setSelectedDetailTask(null)}>
          <div className="project-modal-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
              <div>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(254, 159, 67, 0.16)',
                  color: '#e67e22',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '6px'
                }}>
                  📅 {new Date(selectedDetailTask.task_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {selectedDetailTask.task_title}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                  Posted by <strong>{selectedDetailTask.created_by_name || 'Site Member'}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailTask(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Full Work Update Narrative */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Work Update & Details
              </span>
              <div style={{
                backgroundColor: 'var(--color-bg-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'var(--color-text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedDetailTask.description || 'No detailed written description was added for this task update.'}
              </div>
            </div>

            {/* Site Photos Gallery */}
            {Array.isArray(selectedDetailTask.images) && selectedDetailTask.images.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Site Photo Evidence ({selectedDetailTask.images.length} Photos - Click to Zoom)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                  {selectedDetailTask.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setViewingImage(imgUrl)}
                      style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      title="Click to view full image"
                    >
                      <img src={imgUrl} alt={`Site evidence ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '2px 4px',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        fontSize: '10px',
                        textAlign: 'center',
                        fontWeight: 600
                      }}>
                        <Eye size={10} style={{ display: 'inline', marginRight: '3px' }} /> Zoom
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviewer Remarks & Feedback Section */}
            <div style={{
              backgroundColor: 'var(--color-bg-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MessageSquare size={14} /> Manager / Admin Remarks:
                </span>
                {selectedDetailTask.remarks_by_name && (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {selectedDetailTask.remarks_by_name} {selectedDetailTask.remarks_at && `• ${new Date(selectedDetailTask.remarks_at).toLocaleDateString('en-IN')}`}
                  </span>
                )}
              </div>

              {selectedDetailTask.remarks ? (
                <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                  {selectedDetailTask.remarks}
                </p>
              ) : (
                <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No reviewer remarks recorded yet.
                </p>
              )}

              {/* Add / Edit Remarks Box */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px', fontSize: '13px', marginBottom: '8px', width: '100%', backgroundColor: '#ffffff' }}
                  placeholder="Add or update feedback, quality instructions, or milestone sign-off..."
                  value={remarksText || selectedDetailTask.remarks || ''}
                  onChange={(e) => setRemarksText(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-proj btn-sm"
                    onClick={() => handleSaveRemarks(selectedDetailTask.id)}
                    disabled={isSavingRemarks || !(remarksText.trim() || selectedDetailTask.remarks)}
                  >
                    <Check size={13} /> {isSavingRemarks ? 'Saving...' : 'Save Remarks'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedDetailTask(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT ADVANCE AMOUNT (Step 9) */}
      {isAdvanceModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsAdvanceModalOpen(false)}>
          <div className="project-modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#092C4C' }}>
                💰 Update Advance Received
              </h3>
              <button
                type="button"
                onClick={() => setIsAdvanceModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Advance Amount Received (₹)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    style={{ paddingLeft: '28px', fontSize: '16px', fontWeight: 700 }}
                    value={advanceInput}
                    onChange={(e) => setAdvanceInput(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                  Manually update the advance received from the client for this project.
                </small>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg-surface-subtle)', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Site Visit Fee:</span>
                  <strong>₹{Number(project.site_visit_amount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Received (Adv + Site Fee):</span>
                  <strong style={{ color: '#16a34a' }}>
                    ₹{(Number(advanceInput || 0) + Number(project.site_visit_amount || 0)).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAdvanceModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-proj"
                  disabled={isSavingAdvance}
                >
                  <Check size={14} /> {isSavingAdvance ? 'Saving...' : 'Save Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT WORK & LABOUR ASSIGNMENT (Step 10) */}
      {isWorkLabourModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsWorkLabourModalOpen(false)}>
          <div className="project-modal-box" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                👥 Work & Labour Assignment
              </h3>
              <button
                type="button"
                onClick={() => setIsWorkLabourModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWorkLabour}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Assigned Work / Scope Description</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px', fontSize: '13px' }}
                  placeholder="Detail the work tasks assigned for this project..."
                  value={workScopeInput}
                  onChange={(e) => setWorkScopeInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Work Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expected / Planned Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={expectedDateInput}
                    onChange={(e) => setExpectedDateInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Labour Count Deployed</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="e.g. 5"
                  value={labourCountInput}
                  onChange={(e) => setLabourCountInput(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Assign Labour / Team Members (Names & Roles)</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px', fontSize: '13px' }}
                  placeholder="e.g. Ramesh (Lead Gardner), Suresh (Excavation), Rajesh (Planting)"
                  value={assignedLabourInput}
                  onChange={(e) => setAssignedLabourInput(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Project Status</label>
                <select
                  className="form-select"
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">⚡ IN PROGRESS</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsWorkLabourModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-proj"
                  disabled={isSavingWorkLabour}
                >
                  <Check size={14} /> {isSavingWorkLabour ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD DAY-WISE PROJECT EXPENSE (Step 11) */}
      {isExpenseModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="project-modal-box" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#e11d48' }}>
                🧾 Record Project Expense
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Expense Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Expense Category / Type</label>
                <select
                  className="form-select"
                  value={expenseForm.category_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
                >
                  <option value="">General Project Expense</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Paid To / Recipient</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Nursery vendor, Transport"
                    value={expenseForm.recipient}
                    onChange={(e) => setExpenseForm({ ...expenseForm, recipient: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Description / Notes</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px', fontSize: '13px' }}
                  placeholder="Notes about this project expense..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Receipt Proof / Image Attachment</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setExpenseForm({ ...expenseForm, image_url: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {expenseForm.image_url && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={expenseForm.image_url} alt="Receipt preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>✓ Receipt attached</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsExpenseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-proj"
                  disabled={isSavingExpense}
                >
                  <Check size={14} /> {isSavingExpense ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD DAILY TASK COMPLETION (Step 13) */}
      {isDailyTaskModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsDailyTaskModalOpen(false)}>
          <div className="project-modal-box" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(254, 159, 67, 0.15)', color: '#e67e22' }}>
                  <Camera size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                    Record Daily Task Completion
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Saves progress & sets project status to <strong>IN PROGRESS</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDailyTaskModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDailyTask}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Task Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dailyTaskForm.task_date}
                  onChange={(e) => setDailyTaskForm({ ...dailyTaskForm, task_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Task Completed / Summary Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Finished land leveling & installed 120m drip line"
                  value={dailyTaskForm.task_title}
                  onChange={(e) => setDailyTaskForm({ ...dailyTaskForm, task_title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Description / Work Update</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '90px', fontSize: '13px' }}
                  placeholder="Detail the work accomplished today, labour present, materials used, etc."
                  value={dailyTaskForm.description}
                  onChange={(e) => setDailyTaskForm({ ...dailyTaskForm, description: e.target.value })}
                />
              </div>

              {/* Multiple Image Upload */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Upload Work Photos / Proofs</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Multiple photos supported</span>
                </label>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-input"
                  onChange={handleTaskImageUpload}
                  style={{ marginBottom: '10px' }}
                />

                {dailyTaskForm.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {dailyTaskForm.images.map((imgUrl, i) => (
                      <div key={i} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                        <img src={imgUrl} alt={`Upload ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveTaskImage(i)}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: 'rgba(220, 38, 38, 0.85)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsDailyTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-proj"
                  disabled={isSavingDailyTask}
                >
                  <Check size={14} /> {isSavingDailyTask ? 'Saving Progress...' : 'Save Daily Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX MODAL */}
      {viewingImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setViewingImage(null)}
        >
          <button
            type="button"
            onClick={() => setViewingImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
          <img
            src={viewingImage}
            alt="Full size site evidence"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* MODAL: LINK EXISTING QUOTATION */}
      {isLinkQuoteModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsLinkQuoteModalOpen(false)}>
          <div className="project-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={18} color="var(--color-primary)" /> Link Quotation to Project
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkQuoteModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
              Select an existing quotation to map to <strong>{project.name}</strong> ({project.client_name}).
            </p>

            {availableQuotes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No unlinked quotations found. You can create a new quotation directly for this project.
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">Select Quotation</label>
                <select
                  className="form-input"
                  value={selectedQuoteIdToLink}
                  onChange={(e) => setSelectedQuoteIdToLink(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="">-- Choose a quotation to link --</option>
                  {availableQuotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quotation_number} — {q.customer_name} (₹{Number(q.total_amount).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsLinkQuoteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-proj"
                disabled={!selectedQuoteIdToLink || isLinking}
                onClick={handleLinkQuotation}
              >
                <Check size={14} /> {isLinking ? 'Linking...' : 'Map to Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LINK EXISTING INVOICE */}
      {isLinkInvoiceModalOpen && (
        <div className="project-modal-backdrop" onClick={() => setIsLinkInvoiceModalOpen(false)}>
          <div className="project-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={18} color="var(--module-sell-accent)" /> Link Invoice to Project
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkInvoiceModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
              Select a billed client invoice to map to <strong>{project.name}</strong>. Its revenue will be added to the project's collection value and profit calculations.
            </p>

            {availableInvoices.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-bg-surface-subtle)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No unlinked invoices found. You can bill a new invoice directly for this project.
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">Select Invoice</label>
                <select
                  className="form-input"
                  value={selectedInvoiceIdToLink}
                  onChange={(e) => setSelectedInvoiceIdToLink(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="">-- Choose an invoice to link --</option>
                  {availableInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.customer_name} (₹{Number(inv.total_amount).toLocaleString('en-IN')}) • {inv.payment_status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsLinkInvoiceModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-proj"
                disabled={!selectedInvoiceIdToLink || isLinking}
                onClick={handleLinkInvoice}
              >
                <Check size={14} /> {isLinking ? 'Linking...' : 'Map to Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Receipt Modal */}
      <ExpenseReceiptModal
        expense={viewingReceiptExpense}
        onClose={() => setViewingReceiptExpense(null)}
      />
    </div>
  );
};
