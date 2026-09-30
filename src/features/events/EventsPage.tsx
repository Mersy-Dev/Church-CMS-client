import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight, List, Calendar as CalIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import type { ChurchEvent } from '../../types';
import AddEventForm from './AddEventForm';

// ── Event colors: navy/crimson anchored palette ───────────────────────────────
const EVENT_COLORS: Record<string, string> = {
  sunday_service:     'bg-blue-700/80',      // navy tone
  midweek_service:    'bg-blue-600/80',      // lighter navy
  conference:         'bg-orange-500/80',
  crusade:            'bg-red-700/80',       // crimson tone
  vigil:              'bg-indigo-700/80',
  retreat:            'bg-teal-600/80',
  cell_group:         'bg-green-600/80',
  department_meeting: 'bg-sky-600/80',
  outreach:           'bg-pink-600/80',
  other:              'bg-gray-600/80',
};

export default function EventsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ChurchEvent | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events-calendar', month, year],
    queryFn: async () => {
      const res = await api.get(`/events/calendar?month=${month}&year=${year}`);
      return res.data.data.events as ChurchEvent[];
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);
  const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const eventsOnDay = (day: Date) =>
    events?.filter((e) => isSameDay(parseISO(e.startDatetime), day)) ?? [];

  const prevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));

  return (
    <div className="space-y-5">
      <style>{`
        /* ── Word House Brand Colors ──────────────────────────────────────
           Dominant : #1A56A0  (Word House Navy Blue)
           Accent   : #C41E3A  (Word House Crimson)
        ────────────────────────────────────────────────────────────────── */

        /* New Event button: navy */
        .btn-navy {
          background: #1A56A0;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .btn-navy:hover { background: #164882; box-shadow: 0 4px 16px rgba(26,86,160,0.35); }

        /* Active tab underline: navy (was gold) */
        .tab-active {
          border-bottom: 2px solid #1A56A0 !important;
          color: #4A8FD4 !important;
        }
        .tab-inactive {
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
        }
        .tab-inactive:hover { color: var(--text-primary); }

        /* Calendar nav hover: navy (was gold) */
        .cal-nav:hover { color: #4A8FD4 !important; }

        /* Today dot: navy (was gold bg) */
        .today-dot {
          background: #1A56A0 !important;
          color: #fff !important;
          font-weight: 700;
        }

        /* List view "View" link: navy (was gold) */
        .view-link { color: #4A8FD4; }
        .view-link:hover { color: #1A56A0; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary">Events & Calendar</h1>
          <p className="text-text-muted text-sm mt-0.5">Schedule and manage all church activities</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-navy">
          <Plus size={15} /> New Event
        </button>
      </div>

      {/* View toggle: navy active state */}
      <div className="flex items-center gap-1 border-b border-bg-border pb-0">
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
            view === 'calendar' ? 'tab-active' : 'tab-inactive'
          }`}
        >
          <CalIcon size={14} /> Calendar
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
            view === 'list' ? 'tab-active' : 'tab-inactive'
          }`}
        >
          <List size={14} /> List View
        </button>
      </div>

      {isLoading ? <PageLoader /> : view === 'calendar' ? (
        <div className="card overflow-hidden">
          {/* Calendar nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
            <button onClick={prevMonth} className="cal-nav flex items-center gap-1 text-text-secondary transition-colors text-sm">
              <ChevronLeft size={16} /> Prev
            </button>
            <h2 className="font-display font-bold text-text-primary text-lg">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={nextMonth} className="cal-nav flex items-center gap-1 text-text-secondary transition-colors text-sm">
              Next <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-bg-border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center py-3 text-[11px] font-semibold text-text-muted tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="border-b border-r border-bg-border/50 min-h-[80px] bg-bg-base/30" />
            ))}

            {days.map((day) => {
              const dayEvents = eventsOnDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`border-b border-r border-bg-border/50 min-h-[80px] p-2 transition-colors hover:bg-bg-hover/30
                    ${isSameMonth(day, currentDate) ? '' : 'opacity-40'}`}
                >
                  {/* Today: navy circle (was gold) */}
                  <span className={`text-sm font-medium inline-flex w-6 h-6 items-center justify-center rounded-full
                    ${isToday ? 'today-dot' : 'text-text-secondary'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <button
                        key={event._id}
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate text-white font-medium
                          ${EVENT_COLORS[event.type] ?? 'bg-gray-600/80'}`}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] text-text-muted pl-1">+{dayEvents.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-hover/50 border-b border-bg-border">
              <tr>
                {['Event', 'Type', 'Date & Time', 'Location', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events && events.length > 0 ? events.map((event) => (
                <tr key={event._id} className="table-row">
                  <td className="table-cell">
                    <p className="font-medium text-text-primary">{event.title}</p>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs bg-bg-hover px-2 py-1 rounded-lg text-text-secondary">
                      {event.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="table-cell text-text-secondary text-xs">
                    {format(parseISO(event.startDatetime), 'EEE, dd MMM yyyy • HH:mm')}
                  </td>
                  <td className="table-cell text-text-muted text-sm">{event.location || '—'}</td>
                  <td className="table-cell"><StatusBadge status={event.status} size="sm" /></td>
                  <td className="table-cell">
                    {/* View link: navy (was gold) */}
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="view-link text-xs transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted">No events this month</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Event Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Event" size="lg">
        <AddEventForm
          onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['events-calendar'] }); }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent.title} size="md">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="label">Type</p>
                <p className="text-text-primary capitalize">{selectedEvent.type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="label">Status</p>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <div>
                <p className="label">Start</p>
                <p className="text-text-primary">{format(parseISO(selectedEvent.startDatetime), 'EEE, dd MMM yyyy • HH:mm')}</p>
              </div>
              {selectedEvent.endDatetime && (
                <div>
                  <p className="label">End</p>
                  <p className="text-text-primary">{format(parseISO(selectedEvent.endDatetime), 'HH:mm')}</p>
                </div>
              )}
              {selectedEvent.location && (
                <div className="col-span-2">
                  <p className="label">Location</p>
                  <p className="text-text-primary">{selectedEvent.location}</p>
                </div>
              )}
            </div>
            {selectedEvent.description && (
              <div>
                <p className="label">Description</p>
                <p className="text-text-secondary">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}