import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ClipboardCheck, TrendingUp, Users, UserCheck } from 'lucide-react';
import api from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';
import type { ChurchEvent } from '../../types';

export default function AttendancePage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const { data: events } = useQuery({
    queryKey: ['events-completed'],
    queryFn: async () => {
      const res = await api.get('/events?status=completed&limit=20&sortBy=startDatetime&sortOrder=desc');
      return res.data.data as ChurchEvent[];
    },
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['attendance-summary', selectedEventId],
    queryFn: async () => {
      const res = await api.get(`/attendance/event/${selectedEventId}/summary`);
      return res.data.data;
    },
    enabled: !!selectedEventId,
  });

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ['attendance-records', selectedEventId],
    queryFn: async () => {
      const res = await api.get(`/attendance/event/${selectedEventId}?limit=100`);
      return res.data.data;
    },
    enabled: !!selectedEventId,
  });

  const { data: trend } = useQuery({
    queryKey: ['attendance-trend'],
    queryFn: async () => {
      const res = await api.get('/attendance/trend?weeks=8&eventType=sunday_service');
      return res.data.data.trend;
    },
  });

  const selectedEvent = events?.find((e) => e._id === selectedEventId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-3xl text-text-primary">Attendance</h1>
        <p className="text-text-muted text-sm mt-0.5">Track and manage church attendance records</p>
      </div>

      {/* Trend cards */}
      {trend && trend.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Last Sunday', value: trend[trend.length - 1]?.total ?? 0, icon: Users, color: 'border-t-blue-500' },
            { label: 'Members', value: trend[trend.length - 1]?.members ?? 0, icon: Users, color: 'border-t-purple-500' },
            { label: 'Visitors', value: trend[trend.length - 1]?.visitors ?? 0, icon: UserCheck, color: 'border-t-green-500' },
            { label: 'First Timers', value: trend[trend.length - 1]?.firstTimers ?? 0, icon: TrendingUp, color: 'border-t-gold' },
          ].map((stat) => (
            <div key={stat.label} className={`card p-4 border-t-2 ${stat.color}`}>
              <stat.icon size={18} className="text-text-muted mb-2" />
              <p className="text-3xl font-display font-bold text-text-primary">{stat.value}</p>
              <p className="text-text-secondary text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Event selector */}
      <div className="card p-5">
        <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-3">
          View Attendance by Event
        </h3>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="input max-w-md"
        >
          <option value="">Select an event...</option>
          {events?.map((e) => (
            <option key={e._id} value={e._id}>
              {e.title} — {format(parseISO(e.startDatetime), 'dd MMM yyyy')}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance details */}
      {selectedEventId && (
        <>
          {loadingSummary ? <PageLoader /> : summary && (
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Total', value: summary.live?.total ?? 0, color: 'text-text-primary' },
                { label: 'Members', value: summary.live?.members ?? 0, color: 'text-blue-400' },
                { label: 'Visitors', value: summary.live?.visitors ?? 0, color: 'text-green-400' },
                { label: 'First Timers', value: summary.live?.firstTimers ?? 0, color: 'text-gold' },
                { label: 'Online', value: summary.live?.online ?? 0, color: 'text-purple-400' },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-text-muted text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Attendance records table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-bg-border">
              <h3 className="font-semibold text-text-primary">
                {selectedEvent?.title} — Attendance List
              </h3>
            </div>
            {loadingRecords ? <PageLoader /> : (
              <table className="w-full">
                <thead className="bg-bg-hover/50 border-b border-bg-border">
                  <tr>
                    {['Member', 'Type', 'Method', 'Service', 'Checked In'].map((h) => (
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records?.length > 0 ? records.map((r: any) => (
                    <tr key={r._id} className="table-row">
                      <td className="table-cell font-medium text-text-primary">
                        {r.memberId ? `${r.memberId.firstName} ${r.memberId.lastName}` : r.visitorName || 'Unknown'}
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${r.isVisitor ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                          {r.isVisitor ? 'Visitor' : 'Member'}
                        </span>
                      </td>
                      <td className="table-cell text-text-muted text-xs capitalize">{r.method?.replace(/_/g, ' ')}</td>
                      <td className="table-cell text-text-muted">Service {r.serviceNumber}</td>
                      <td className="table-cell text-text-muted text-xs">
                        {format(parseISO(r.checkedInAt), 'HH:mm')}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-text-muted">No attendance records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
