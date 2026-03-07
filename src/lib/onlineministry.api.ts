/**
 * ChurchOS — src/lib/onlineMinistry.api.ts
 * Module 07 — All API calls for Online Ministry
 * Uses the same `api` axios instance as other modules.
 */

import api from './api';
import type {
  LiveStream, LiveStreamFormData, StreamMetricInput, ZoomImportInput,
  Sermon, SermonFormData,
  SocialPost, SocialPostFormData,
  OnlineConvert, OnlineConvertFormData,
  PrayerRequest, PrayerRequestFormData,
  CounsellingSession, CounsellingFormData,
  OnlineVisitor,
  Newsletter, NewsletterFormData,
  NewsletterSubscriber,
  OnlineMinistryStats,
  PaginatedResponse,
} from '../types/onlineministry.types';

const BASE = '/online-ministry';

// ─────────────────────────────────────────────────────────────────────────────
// STREAMS
// ─────────────────────────────────────────────────────────────────────────────

export const streamsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ data: LiveStream[]; pagination: any }>(`${BASE}/streams`, { params }),

  getUpcoming: () =>
    api.get<{ data: LiveStream[] }>(`${BASE}/streams/upcoming`),

  getLive: () =>
    api.get<{ data: LiveStream[] }>(`${BASE}/streams/live`),

  getStats: () =>
    api.get<{ data: any }>(`${BASE}/streams/stats`),

  getOne: (id: string) =>
    api.get<{ data: LiveStream }>(`${BASE}/streams/${id}`),

  create: (data: LiveStreamFormData) =>
    api.post<{ data: LiveStream }>(`${BASE}/streams`, data),

  update: (id: string, data: Partial<LiveStreamFormData> & { status?: string }) =>
    api.patch<{ data: LiveStream }>(`${BASE}/streams/${id}`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/streams/${id}`),

  recordMetric: (id: string, data: StreamMetricInput) =>
    api.post(`${BASE}/streams/${id}/metrics`, data),

  importZoom: (id: string, data: ZoomImportInput) =>
    api.post(`${BASE}/streams/${id}/zoom-import`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// SERMONS
// ─────────────────────────────────────────────────────────────────────────────

export const sermonsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ data: Sermon[]; pagination: any }>(`${BASE}/sermons`, { params }),

  getOne: (id: string) =>
    api.get<{ data: Sermon }>(`${BASE}/sermons/${id}`),

  create: (data: SermonFormData) =>
    api.post<{ data: Sermon }>(`${BASE}/sermons`, data),

  update: (id: string, data: Partial<SermonFormData>) =>
    api.patch<{ data: Sermon }>(`${BASE}/sermons/${id}`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/sermons/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL POSTS
// ─────────────────────────────────────────────────────────────────────────────

export const socialPostsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ data: SocialPost[]; pagination: any }>(`${BASE}/social-posts`, { params }),

  create: (data: SocialPostFormData) =>
    api.post<{ data: SocialPost }>(`${BASE}/social-posts`, data),

  update: (id: string, data: Partial<SocialPostFormData>) =>
    api.patch<{ data: SocialPost }>(`${BASE}/social-posts/${id}`, data),

  updateMetrics: (id: string, data: { platform: string; reach?: number; likes?: number; shares?: number; comments?: number }) =>
    api.patch(`${BASE}/social-posts/${id}/metrics`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/social-posts/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// CONVERTS
// ─────────────────────────────────────────────────────────────────────────────

export const convertsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ data: OnlineConvert[]; pagination: any }>(`${BASE}/converts`, { params }),

  create: (data: OnlineConvertFormData) =>
    api.post<{ data: OnlineConvert }>(`${BASE}/converts`, data),

  assign: (id: string, assignedTo: string) =>
    api.patch(`${BASE}/converts/${id}/assign`, { assignedTo }),

  updateStatus: (id: string, data: { followUpStatus?: string; convertedToMemberId?: string }) =>
    api.patch(`${BASE}/converts/${id}/status`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// PRAYER REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export const prayerRequestsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ data: PrayerRequest[]; pagination: any }>(`${BASE}/prayer-requests`, { params }),

  submit: (data: PrayerRequestFormData) =>
    api.post(`${BASE}/prayer-requests`, data),

  update: (id: string, data: { status?: string; assignedTo?: string; adminNotes?: string }) =>
    api.patch(`${BASE}/prayer-requests/${id}`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/prayer-requests/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNSELLING
// ─────────────────────────────────────────────────────────────────────────────

export const counsellingApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ data: CounsellingSession[]; pagination: any }>(`${BASE}/counselling`, { params }),

  request: (data: CounsellingFormData) =>
    api.post(`${BASE}/counselling`, data),

  update: (id: string, data: Partial<CounsellingSession>) =>
    api.patch(`${BASE}/counselling/${id}`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/counselling/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE VISITORS
// ─────────────────────────────────────────────────────────────────────────────

export const onlineVisitorsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<{ data: OnlineVisitor[]; pagination: any }>(`${BASE}/visitors`, { params }),

  getPendingFollowUp: () =>
    api.get<{ data: OnlineVisitor[] }>(`${BASE}/visitors/pending-followup`),

  capture: (data: Partial<OnlineVisitor>) =>
    api.post(`${BASE}/visitors/capture`, data),

  assign: (id: string, data: { assignedTo: string; sendEmail?: boolean }) =>
    api.patch(`${BASE}/visitors/${id}/assign`, data),

  logAction: (id: string, data: { action: string; note?: string }) =>
    api.post(`${BASE}/visitors/${id}/actions`, data),

  convert: (id: string, memberId: string) =>
    api.patch(`${BASE}/visitors/${id}/convert`, { memberId }),
};

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────────────────────────────────────────

export const newsletterApi = {
  // Campaigns
  getCampaigns: (params?: Record<string, any>) =>
    api.get<{ data: Newsletter[]; pagination: any }>(`${BASE}/newsletter/campaigns`, { params }),

  createCampaign: (data: NewsletterFormData) =>
    api.post<{ data: Newsletter }>(`${BASE}/newsletter/campaigns`, data),

  updateCampaign: (id: string, data: Partial<NewsletterFormData> & { status?: string }) =>
    api.patch<{ data: Newsletter }>(`${BASE}/newsletter/campaigns/${id}`, data),

  sendCampaign: (id: string) =>
    api.post(`${BASE}/newsletter/campaigns/${id}/send`),

  deleteCampaign: (id: string) =>
    api.delete(`${BASE}/newsletter/campaigns/${id}`),

  // Subscribers
  getSubscribers: (params?: Record<string, any>) =>
    api.get<{ data: NewsletterSubscriber[]; pagination: any }>(`${BASE}/newsletter/subscribers`, { params }),

  subscribe: (data: { email: string; firstName?: string; lastName?: string }) =>
    api.post(`${BASE}/newsletter/subscribe`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

export const onlineMinistryStatsApi = {
  get: () => api.get<{ data: OnlineMinistryStats }>(`${BASE}/stats`),
};