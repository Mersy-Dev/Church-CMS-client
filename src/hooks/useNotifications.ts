/**
 * ChurchOS — src/hooks/useNotifications.ts
 *
 * Central hook for all notification data fetching and mutations.
 * Uses TanStack Query (matching the rest of the app) + polling for
 * near-real-time updates. SSE/WebSocket can replace polling later
 * by simply invalidating the query keys from a socket listener.
 *
 * Syncs unread count into Redux so the badge is visible in both
 * TopBar and Sidebar without prop drilling.
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { notificationsApi } from '../lib/notification.api';
import {
  setUnreadCount,
  decrementUnread,
  clearUnread,
} from '../store/slices/notificationSlice';
import type { NotificationType } from '../types/notification.types';

// ── Query key constants ───────────────────────────────────────────────────────
export const NOTIF_KEYS = {
  all:     ['notifications'] as const,
  list:    (params?: object) => ['notifications', 'list', params] as const,
  unread:  ['notifications', 'unread-count'] as const,
};

// ── Poll interval: 30 seconds ─────────────────────────────────────────────────
const POLL_MS = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Unread count (badge) — polled every 30s
// ─────────────────────────────────────────────────────────────────────────────
export const useUnreadCount = () => {
  const dispatch = useDispatch();

  const query = useQuery({
    queryKey: NOTIF_KEYS.unread,
    queryFn:  async () => {
      const res = await notificationsApi.getUnreadCount();
      return res.data.data.count;
    },
    refetchInterval:            POLL_MS,
    refetchIntervalInBackground: true,
    staleTime:                  0,
  });

  // Keep Redux in sync whenever count changes
  useEffect(() => {
    if (query.data !== undefined) {
      dispatch(setUnreadCount(query.data));
    }
  }, [query.data, dispatch]);

  return query;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Notification feed (paginated list)
// ─────────────────────────────────────────────────────────────────────────────
export const useNotificationList = (params?: {
  page?:   number;
  limit?:  number;
  unread?: boolean;
  type?:   NotificationType;
}) => {
  return useQuery({
    queryKey: NOTIF_KEYS.list(params),
    queryFn:  async () => {
      const res = await notificationsApi.getAll(params);
      return res.data;
    },
    refetchInterval: POLL_MS,
    staleTime:       10_000,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mark one notification as read
// ─────────────────────────────────────────────────────────────────────────────
export const useMarkAsRead = () => {
  const qc       = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEYS.all });
      dispatch(decrementUnread());
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mark all as read
// ─────────────────────────────────────────────────────────────────────────────
export const useMarkAllAsRead = () => {
  const qc       = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEYS.all });
      dispatch(clearUnread());
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Delete one notification
// ─────────────────────────────────────────────────────────────────────────────
export const useDeleteNotification = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteOne(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: NOTIF_KEYS.all });
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Failed to delete notification'),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Admin broadcast
// ─────────────────────────────────────────────────────────────────────────────
export const useSendBroadcast = () => {
  return useMutation({
    mutationFn: (payload: { title: string; body: string; targetRole?: string }) =>
      notificationsApi.broadcast(payload),
    onSuccess: () => toast.success('Broadcast sent successfully'),
    onError:   () => toast.error('Failed to send broadcast'),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Convenience: combined hook for the bell dropdown
//    Returns everything the dropdown needs in one call
// ─────────────────────────────────────────────────────────────────────────────
export const useNotificationBell = () => {
  const listQuery    = useNotificationList({ limit: 10 });
  const unreadQuery  = useUnreadCount();
  const markRead     = useMarkAsRead();
  const markAll      = useMarkAllAsRead();
  const deleteNotif  = useDeleteNotification();

  return {
    notifications: listQuery.data?.data          ?? [],
    unreadCount:   listQuery.data?.pagination?.unreadCount ?? 0,
    isLoading:     listQuery.isLoading,
    markRead,
    markAll,
    deleteNotif,
    refetch:       listQuery.refetch,
  };
};