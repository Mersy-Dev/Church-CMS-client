/**
 * ChurchOS — src/features/notifications/NotificationsPage.tsx
 * Full notifications page — lists all notifications with
 * filtering (unread / type), mark-all-read, delete, and pagination.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Check,
  Filter, RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  useNotificationList,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import {
  NOTIFICATION_TYPE_META,
  NOTIFICATION_ROUTE_MAP,
  NOTIFICATION_TYPES,
  type INotification,
  type NotificationType,
} from '../../types/notification.types';
import { PageLoader } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

// ── Human-readable labels for filter dropdown ─────────────────────────────────
const TYPE_LABELS: Partial<Record<NotificationType, string>> = {
  member_created:        'New Member',
  member_birthday:       'Birthday',
  member_anniversary:    'Anniversary',
  event_created:         'Event Created',
  event_cancelled:       'Event Cancelled',
  event_reminder_24h:    '24h Reminder',
  event_reminder_1h:     '1h Reminder',
  giving_recorded:       'Giving',
  giving_receipt:        'Receipt',
  visitor_registered:    'Visitor',
  visitor_followup_due:  'Follow-Up Due',
  visitor_converted:     'Conversion',
  welfare_request:       'Welfare Request',
  broadcast:             'Broadcast',
  training_completed:    'Training',
  attendance_checked_in: 'Attendance',
};

// ── Single row ────────────────────────────────────────────────────────────────
function NotifRow({
  notif,
  onRead,
  onDelete,
}: {
  notif:    INotification;
  onRead:   (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const meta = NOTIFICATION_TYPE_META[notif.type] ?? {
    icon: '🔔', color: '#C41E3A', bg: 'rgba(196,30,58,0.1)',
  };

  const handleClick = () => {
    if (!notif.isRead) onRead(notif._id);
    if (notif.entityType && notif.entityId) {
      const base = NOTIFICATION_ROUTE_MAP[notif.entityType];
      if (base) { navigate(`${base}/${notif.entityId}`); return; }
    }
  };

  return (
    <div
      className={`group flex items-start gap-4 px-6 py-4 cursor-pointer border-b border-[var(--color-bg-border)] transition-colors ${
        !notif.isRead
          ? 'bg-[rgba(196,30,58,0.025)]'
          : 'bg-[var(--color-bg-primary,#fff)]'
      } hover:bg-[rgba(196,30,58,0.04)]`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
        style={{ background: meta.bg }}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p
            className={`text-sm leading-snug ${
              !notif.isRead
                ? 'font-semibold text-[var(--color-text-primary)]'
                : 'font-medium text-[var(--color-text-secondary)]'
            }`}
          >
            {notif.title}
          </p>
          <span className="text-[11px] text-[var(--color-text-muted)] flex-shrink-0 mt-0.5">
            {format(new Date(notif.createdAt), 'dd MMM · HH:mm')}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
          {notif.body}
        </p>
        <p className="text-[11px] mt-1.5 font-medium" style={{ color: meta.color }}>
          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 mt-1">
        {!notif.isRead && (
          <span
            className="w-2 h-2 rounded-full mr-1"
            style={{ background: '#C41E3A' }}
          />
        )}
        <div className="hidden group-hover:flex items-center gap-1">
          {!notif.isRead && (
            <button
              onClick={(e) => { e.stopPropagation(); onRead(notif._id); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[rgba(26,86,160,0.1)] transition-colors"
              title="Mark as read"
            >
              <Check size={14} color="#1A56A0" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors"
            title="Delete"
          >
            <Trash2 size={14} color="#ef4444" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [page,         setPage]         = useState(1);
  const [unreadOnly,   setUnreadOnly]   = useState(false);
  const [typeFilter,   setTypeFilter]   = useState<NotificationType | ''>('');

  const { data, isLoading, refetch, isFetching } = useNotificationList({
    page,
    limit:  20,
    unread: unreadOnly || undefined,
    type:   typeFilter || undefined,
  });

  const markRead    = useMarkAsRead();
  const markAll     = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  const notifications  = data?.data       ?? [];
  const pagination     = data?.pagination;
  const unreadCount    = pagination?.unreadCount ?? 0;
  const totalPages     = pagination?.totalPages  ?? 1;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-[var(--color-text-primary)]">
            Notifications
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn-ghost flex items-center gap-2 border border-[var(--color-bg-border)]"
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity"
              style={{ background: '#1A56A0' }}
            >
              <CheckCheck size={15} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="card px-4 py-3 flex items-center gap-4">
        <Filter size={15} className="text-[var(--color-text-muted)]" />

        {/* Unread toggle */}
        <button
          onClick={() => { setUnreadOnly((v) => !v); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            unreadOnly
              ? 'text-white'
              : 'border border-[var(--color-bg-border)] text-[var(--color-text-secondary)] hover:border-[rgba(196,30,58,0.4)]'
          }`}
          style={unreadOnly ? { background: '#C41E3A' } : {}}
        >
          Unread only
        </button>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as NotificationType | ''); setPage(1); }}
          className="input w-auto text-xs"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Active filter tags */}
        {(unreadOnly || typeFilter) && (
          <button
            onClick={() => { setUnreadOnly(false); setTypeFilter(''); setPage(1); }}
            className="text-xs font-medium ml-auto"
            style={{ color: '#C41E3A' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications"
            description={
              unreadOnly
                ? 'No unread notifications. You\'re all caught up!'
                : 'Notifications will appear here as activity happens.'
            }
          />
        ) : (
          <>
            <div className="divide-y divide-[var(--color-bg-border)]">
              {notifications.map((n) => (
                <NotifRow
                  key={n._id}
                  notif={n}
                  onRead={(id) => markRead.mutate(id)}
                  onDelete={(id) => deleteNotif.mutate(id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-bg-border)]">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Page {page} of {totalPages} · {pagination?.total} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}