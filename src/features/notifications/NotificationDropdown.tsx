/**
 * ChurchOS — src/features/notifications/NotificationDropdown.tsx
 * Bell icon + dropdown panel.
 * Used in both TopBar and Sidebar.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';
import { useNotificationBell, useMarkAsRead, useDeleteNotification } from '../../hooks/useNotifications';
import type { RootState } from '../../store';
import type { INotification } from '../../types/notification.types';
import { NOTIFICATION_TYPE_META, NOTIFICATION_ROUTE_MAP } from '../../types/notification.types';

// ── Single notification row ───────────────────────────────────────────────────
function NotificationRow({
  notif,
  onRead,
  onDelete,
  onNavigate,
}: {
  notif:      INotification;
  onRead:     (id: string) => void;
  onDelete:   (id: string) => void;
  onNavigate: (notif: INotification) => void;
}) {
  const meta = NOTIFICATION_TYPE_META[notif.type] ?? {
    icon: '🔔', color: '#C41E3A', bg: 'rgba(196,30,58,0.1)',
  };

  const timeAgo = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true });

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
        !notif.isRead ? 'bg-[rgba(196,30,58,0.03)]' : ''
      } hover:bg-[rgba(196,30,58,0.05)]`}
      onClick={() => {
        if (!notif.isRead) onRead(notif._id);
        onNavigate(notif);
      }}
    >
      {/* Icon pill */}
      <div
        className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
        style={{ background: meta.bg }}
      >
        {meta.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug truncate"
          style={{ color: !notif.isRead ? 'var(--color-text-primary, #111)' : 'var(--color-text-secondary, #555)' }}
        >
          {notif.title}
        </p>
        <p className="text-xs text-[var(--color-text-muted,#888)] mt-0.5 line-clamp-2">
          {notif.body}
        </p>
        <p className="text-[10px] mt-1" style={{ color: meta.color }}>
          {timeAgo}
        </p>
      </div>

      {/* Unread dot + actions */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {!notif.isRead && (
          <span
            className="w-2 h-2 rounded-full mt-1"
            style={{ background: '#C41E3A' }}
          />
        )}
        <div className="hidden group-hover:flex items-center gap-1">
          {!notif.isRead && (
            <button
              onClick={(e) => { e.stopPropagation(); onRead(notif._id); }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[rgba(26,86,160,0.1)] transition-colors"
              title="Mark as read"
            >
              <Check size={12} color="#1A56A0" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-[rgba(239,68,68,0.1)] transition-colors"
            title="Delete"
          >
            <Trash2 size={12} color="#ef4444" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main dropdown ─────────────────────────────────────────────────────────────
interface NotificationDropdownProps {
  /** Pass 'topbar' for floating dropdown, 'sidebar' for inline trigger */
  variant?: 'topbar' | 'sidebar';
}

export default function NotificationDropdown({
  variant = 'topbar',
}: NotificationDropdownProps) {
  const navigate    = useNavigate();
  const [open, setOpen] = useState(false);
  const ref         = useRef<HTMLDivElement>(null);

  // Read unread count from Redux (kept in sync by useUnreadCount hook)
  const unreadCount = useSelector((s: RootState) => s.notifications.unreadCount);

  const { notifications, isLoading, markAll, refetch } = useNotificationBell();
  const markRead   = useMarkAsRead();
  const deleteNotif = useDeleteNotification();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Refetch when dropdown opens
  useEffect(() => {
    if (open) refetch();
  }, [open]);

  const handleNavigate = (notif: INotification) => {
    setOpen(false);
    if (notif.entityType && notif.entityId) {
      const base = NOTIFICATION_ROUTE_MAP[notif.entityType];
      if (base) {
        navigate(`${base}/${notif.entityId}`);
        return;
      }
    }
    navigate('/notifications');
  };

  const isSidebar = variant === 'sidebar';

  return (
    <div className="relative" ref={ref}>
      {/* ── Bell button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center justify-center rounded-lg transition-all ${
          isSidebar
            ? 'w-10 h-10 hover:bg-[rgba(196,30,58,0.08)]'
            : 'w-9 h-9 hover:bg-[rgba(196,30,58,0.08)]'
        } ${open ? 'bg-[rgba(196,30,58,0.1)]' : ''}`}
        title="Notifications"
      >
        <Bell
          size={isSidebar ? 20 : 18}
          style={{ color: open ? '#C41E3A' : 'var(--color-text-secondary, #555)' }}
        />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold leading-none"
            style={{
              background:  '#C41E3A',
              fontSize:    '10px',
              paddingLeft: unreadCount > 9 ? '4px' : '0',
              paddingRight: unreadCount > 9 ? '4px' : '0',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ────────────────────────────────────────────────── */}
      {open && (
        <div
          className={`absolute z-50 bg-[var(--color-bg-primary,#fff)] border border-[var(--color-bg-border)] rounded-xl shadow-2xl overflow-hidden ${
            isSidebar
              ? 'left-12 top-0 w-[360px]'
              : 'right-0 top-11 w-[360px]'
          }`}
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-bg-border)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--color-text-primary)] text-sm">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                  style={{ background: '#C41E3A' }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: '#1A56A0' }}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[380px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div
                  className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#C41E3A', borderTopColor: 'transparent' }}
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Bell size={32} className="mb-3 opacity-20" />
                <p className="text-sm text-[var(--color-text-muted)] font-medium">
                  You're all caught up!
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  No notifications right now
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-bg-border)]">
                {notifications.map((n) => (
                  <NotificationRow
                    key={n._id}
                    notif={n}
                    onRead={(id) => markRead.mutate(id)}
                    onDelete={(id) => deleteNotif.mutate(id)}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--color-bg-border)]">
            <button
              onClick={() => { setOpen(false); navigate('/notifications'); }}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors hover:bg-[rgba(196,30,58,0.04)]"
              style={{ color: '#C41E3A' }}
            >
              View all notifications
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}