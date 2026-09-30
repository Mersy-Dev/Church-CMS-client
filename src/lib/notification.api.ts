/**
 * ChurchOS — src/lib/notification.api.ts
 * All API calls for the notification module.
 * Uses the same `api` axios instance as every other module.
 */

import api from './api';
import type {
  INotification,
  NotificationListResponse,
  UnreadCountResponse,
  NotificationType,
} from '../types/notification.types';

const BASE = '/notifications';

export const notificationsApi = {
  // ── Feed ───────────────────────────────────────────────────────────────────
  getAll: (params?: {
    page?:   number;
    limit?:  number;
    unread?: boolean;
    type?:   NotificationType;
  }) =>
    api.get<NotificationListResponse>(BASE, { params }),

  // ── Unread badge count ─────────────────────────────────────────────────────
  getUnreadCount: () =>
    api.get<UnreadCountResponse>(`${BASE}/unread-count`),

  // ── Mark one as read ───────────────────────────────────────────────────────
  markAsRead: (id: string) =>
    api.patch<{ success: boolean }>(`${BASE}/${id}/read`),

  // ── Mark all as read ───────────────────────────────────────────────────────
  markAllAsRead: () =>
    api.patch<{ success: boolean; data: { updatedCount: number } }>(
      `${BASE}/read-all`,
    ),

  // ── Delete one ────────────────────────────────────────────────────────────
  deleteOne: (id: string) =>
    api.delete<{ success: boolean }>(`${BASE}/${id}`),

  // ── Admin broadcast ────────────────────────────────────────────────────────
  broadcast: (payload: { title: string; body: string; targetRole?: string }) =>
    api.post<{ success: boolean }>(`${BASE}/broadcast`, payload),
};