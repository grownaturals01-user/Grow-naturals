import React, { useState, useMemo } from 'react';
import { LandscapingProject, SiteVisitAppointment } from '../../types/landscaping';
import { useProjects } from '../../context/ProjectContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Phone,
  CloudSun,
  Filter,
  Layers,
  Edit3,
  Trash2,
  X,
  Compass,
  Check,
  CalendarDays,
  List,
} from 'lucide-react';

interface SiteVisitsCalendarViewProps {
  project: LandscapingProject;
}

const APPOINTMENT_TYPES: Array<SiteVisitAppointment['type']> = [
  'Initial Site Survey',
  'Soil & Slope Assessment',
  'Client Design Walkthrough',
  'Civil / Drainage Inspection',
  'Plant Material Inspection',
  'Final Handover Assessment',
];

export const SiteVisitsCalendarView: React.FC<SiteVisitsCalendarViewProps> = ({ project }) => {
  const { addSiteVisitAppointment, updateSiteVisitAppointment, deleteSiteVisitAppointment } = useProjects();

  // Current view calendar state - defaulting to October 2026 based on project timeline
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 20)); // Oct 20, 2026
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<SiteVisitAppointment | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<SiteVisitAppointment>>({
    title: '',
    date: '2026-10-21',
    time: '10:00 AM',
    type: 'Initial Site Survey',
    assignedTo: project.step4Planning.supervisorName || 'Dinesh Verma',
    assignedRole: 'Site Operations Lead',
    status: 'Scheduled',
    location: project.step1Enquiry.siteAddress || `${project.step1Enquiry.city || 'Bengaluru'}`,
    contactPerson: project.step1Enquiry.clientName,
    contactPhone: project.step1Enquiry.phone,
    notes: '',
    weatherForecast: 'Sunny & Clear · 28°C',
  });

  const appointments = useMemo(() => {
    return project.siteVisitAppointments || [];
  }, [project.siteVisitAppointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      if (typeFilter !== 'all' && appt.type !== typeFilter) return false;
      if (statusFilter !== 'all' && appt.status !== statusFilter) return false;
      return true;
    });
  }, [appointments, typeFilter, statusFilter]);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const daysArray = useMemo(() => {
    const days: Array<{ dayNum: number; dateString: string; isCurrentMonth: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      days.push({
        dayNum: d,
        dateString: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        dayNum: d,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill complete grid of 35 or 42
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      days.push({
        dayNum: d,
        dateString: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayIndex]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 20));
  };

  const handleOpenScheduleModal = (dateStr?: string) => {
    setFormData({
      title: '',
      date: dateStr || '2026-10-21',
      time: '10:00 AM',
      type: 'Initial Site Survey',
      assignedTo: project.step4Planning.supervisorName || 'Dinesh Verma',
      assignedRole: 'Field Surveyor & Assessor',
      status: 'Scheduled',
      location: project.step1Enquiry.siteAddress || 'Project Site',
      contactPerson: project.step1Enquiry.clientName,
      contactPhone: project.step1Enquiry.phone,
      notes: '',
      weatherForecast: 'Sunny & Clear · 28°C',
    });
    setSelectedAppointment(null);
    setIsScheduleModalOpen(true);
  };

  const handleEditAppointment = (appt: SiteVisitAppointment) => {
    setFormData(appt);
    setSelectedAppointment(appt);
    setIsScheduleModalOpen(true);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.type) return;

    if (selectedAppointment) {
      updateSiteVisitAppointment(project.id, selectedAppointment.id, formData);
    } else {
      addSiteVisitAppointment(project.id, {
        title: formData.title,
        date: formData.date || '2026-10-21',
        time: formData.time || '10:00 AM',
        type: (formData.type as any) || 'Initial Site Survey',
        assignedTo: formData.assignedTo || 'Lead Assessor',
        assignedRole: formData.assignedRole || 'Field Inspector',
        status: (formData.status as any) || 'Scheduled',
        location: formData.location || project.step1Enquiry.siteAddress || 'Site Location',
        contactPerson: formData.contactPerson || project.step1Enquiry.clientName,
        contactPhone: formData.contactPhone || project.step1Enquiry.phone,
        notes: formData.notes || '',
        weatherForecast: formData.weatherForecast || 'Sunny · 28°C',
      });
    }

    setIsScheduleModalOpen(false);
    setSelectedAppointment(null);
  };

  const getTypeColor = (type: SiteVisitAppointment['type']) => {
    switch (type) {
      case 'Initial Site Survey':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Soil & Slope Assessment':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Client Design Walkthrough':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Civil / Drainage Inspection':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Plant Material Inspection':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Final Handover Assessment':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getStatusBadge = (status: SiteVisitAppointment['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Scheduled':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Completed':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200 line-through-none';
      case 'Rescheduled':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const upcomingAppointmentsCount = appointments.filter(a => a.status !== 'Completed').length;

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-neutral-900 tracking-tight">
              Site Visits & Assessment Calendar
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {upcomingAppointmentsCount} Upcoming
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Schedule initial land surveys, soil tests, client walkthroughs, and quality inspections for {project.title}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'month' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'agenda' ? 'bg-white font-bold text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda List</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenScheduleModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* 2. Month Controls & Filter Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Month Selector Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-neutral-900 tracking-tight">
            {monthNames[month]} {year}
          </h3>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-xl text-xs text-neutral-600">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs text-neutral-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Appointment Types</option>
              {APPOINTMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-xl text-xs text-neutral-600">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-neutral-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Calendar View: Month Grid or Agenda List */}
      {viewMode === 'month' ? (
        <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-neutral-200/90 bg-neutral-50 text-center text-xs font-bold text-neutral-600 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100">
            {daysArray.map((day, idx) => {
              const dayAppointments = filteredAppointments.filter(a => a.date === day.dateString);
              const isToday = day.dateString === '2026-10-20';

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenScheduleModal(day.dateString)}
                  className={`min-h-[110px] p-1.5 sm:p-2 transition-colors cursor-pointer flex flex-col justify-between group ${
                    day.isCurrentMonth ? 'bg-white hover:bg-neutral-50/70' : 'bg-neutral-50/50 text-neutral-400'
                  } ${isToday ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isToday
                          ? 'bg-emerald-800 text-white font-bold'
                          : day.isCurrentMonth
                          ? 'text-neutral-800'
                          : 'text-neutral-400'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  {/* Appointments in this day cell */}
                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[80px] no-scrollbar">
                    {dayAppointments.map(appt => (
                      <div
                        key={appt.id}
                        onClick={e => {
                          e.stopPropagation();
                          handleEditAppointment(appt);
                        }}
                        className={`p-1.5 rounded-lg border text-[10px] leading-tight transition-transform hover:scale-[1.02] shadow-2xs ${getTypeColor(
                          appt.type
                        )}`}
                        title={`${appt.time} - ${appt.title} (${appt.assignedTo})`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold truncate">{appt.time}</span>
                          <span className="text-[9px] font-semibold opacity-80 uppercase">{appt.status}</span>
                        </div>
                        <div className="font-medium truncate mt-0.5">{appt.title}</div>
                      </div>
                    ))}
                  </div>

                  {/* Hover "+" cue */}
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 transition-opacity pt-1">
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Add</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* AGENDA LIST VIEW */
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-700">No appointments scheduled</p>
              <p className="text-xs text-neutral-400 mt-1">Click "+ Schedule Visit" to book a site assessment.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredAppointments
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map(appt => (
                  <div
                    key={appt.id}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-neutral-50/70 p-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Date Badge */}
                      <div className="w-14 h-14 rounded-xl bg-neutral-100 text-neutral-800 flex flex-col items-center justify-center shrink-0 border border-neutral-200">
                        <span className="text-[10px] font-bold uppercase text-neutral-500">
                          {new Date(appt.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-base font-extrabold text-neutral-900 font-mono">
                          {new Date(appt.date).getDate()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getTypeColor(appt.type)}`}>
                            {appt.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(appt.status)}`}>
                            {appt.status}
                          </span>
                          <span className="text-xs font-mono font-bold text-neutral-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{appt.time}</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900">{appt.title}</h4>

                        <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                          <span className="flex items-center gap-1 text-neutral-700 font-medium">
                            <User className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Lead: {appt.assignedTo} ({appt.assignedRole})</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{appt.location}</span>
                          </span>
                          {appt.weatherForecast && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-amber-700">
                                <CloudSun className="w-3.5 h-3.5" />
                                <span>{appt.weatherForecast}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {appt.notes && (
                          <p className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg border border-neutral-100 max-w-xl">
                            {appt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-auto">
                      {appt.contactPhone && (
                        <a
                          href={`tel:${appt.contactPhone}`}
                          className="p-2 text-neutral-500 hover:text-emerald-800 hover:bg-neutral-100 rounded-lg transition-colors"
                          title={`Call Client (${appt.contactPhone})`}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        onClick={() => handleEditAppointment(appt)}
                        className="px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
                      >
                        Edit
                      </button>

                      {appt.status !== 'Completed' && (
                        <button
                          onClick={() => updateSiteVisitAppointment(project.id, appt.id, { status: 'Completed' })}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Schedule / Edit Appointment Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl p-5 sm:p-6 my-8 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
                <CalendarIcon className="w-5 h-5 text-emerald-700" />
                <span>{selectedAppointment ? 'Edit Site Visit Appointment' : 'Schedule New Site Assessment'}</span>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Appointment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boundary Laser Level Survey & Soil Core Test"
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:30 AM"
                    value={formData.time || ''}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Assessment Type
                  </label>
                  <select
                    value={formData.type || 'Initial Site Survey'}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                  >
                    {APPOINTMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || 'Scheduled'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Assigned Surveyor / Inspector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.assignedTo || ''}
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Weather Expected
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sunny & Clear · 28°C"
                    value={formData.weatherForecast || ''}
                    onChange={e => setFormData({ ...formData, weatherForecast: e.target.value })}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Site Location
                </label>
                <input
                  type="text"
                  placeholder="Plot Address"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Survey Objectives & Tool Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Carry optical level, soil pH test kit, and laser distance meter."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                {selectedAppointment ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this site appointment?')) {
                        deleteSiteVisitAppointment(project.id, selectedAppointment.id);
                        setIsScheduleModalOpen(false);
                      }
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-all shadow-xs"
                  >
                    {selectedAppointment ? 'Save Changes' : 'Confirm Appointment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
