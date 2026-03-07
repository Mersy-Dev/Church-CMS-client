/**
 * ChurchOS — src/types/onlineMinistry.ts
 * Module 07 — Online Ministry / Digital Outreach
 * All TypeScript interfaces mirroring the backend models exactly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export type StreamPlatform = 'youtube' | 'facebook' | 'zoom' | 'instagram' | 'other';
export type StreamStatus   = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type SocialPlatform = 'facebook' | 'instagram' | 'x' | 'youtube' | 'tiktok';
export type PostStatus     = 'draft' | 'scheduled' | 'published' | 'failed';
export type PrayerStatus   = 'pending' | 'prayed' | 'assigned' | 'closed';
export type CounsellingStatus = 'requested' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type FollowUpStatus = 'pending' | 'contacted' | 'assigned' | 'converted' | 'closed';
export type NewsletterStatus  = 'draft' | 'scheduled' | 'sent';
export type SubscriberStatus  = 'active' | 'unsubscribed' | 'bounced';

// ─────────────────────────────────────────────────────────────────────────────
// 1. LIVESTREAM
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformMetric {
  _id: string;
  platform: StreamPlatform;
  viewerCount: number;
  peakViewers: number;
  recordedAt: string;
}

export interface LiveStream {
  _id: string;
  title: string;
  description?: string;
  serviceDate: string;
  status: StreamStatus;
  youtubeUrl?: string;
  facebookUrl?: string;
  zoomUrl?: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
  otherUrl?: string;
  platformMetrics: PlatformMetric[];
  totalOnlineViewers: number;
  zoomAttendanceImported: boolean;
  zoomAttendanceCount?: number;
  youtubeTotalViews?: number;
  youtubeSubscriberGrowth?: number;
  facebookConcurrentPeak?: number;
  givingLink?: string;
  sermonId?: string | Sermon;
  createdBy: string;
  updatedBy?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiveStreamFormData {
  title: string;
  description?: string;
  serviceDate: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  zoomUrl?: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
  otherUrl?: string;
  givingLink?: string;
  sermonId?: string;
}

export interface StreamMetricInput {
  platform: StreamPlatform;
  viewerCount: number;
}

export interface ZoomImportInput {
  attendanceCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SERMON
// ─────────────────────────────────────────────────────────────────────────────

export interface SermonMedia {
  _id: string;
  platform: StreamPlatform | 'direct';
  url: string;
  embedCode?: string;
  type: 'audio' | 'video';
}

export interface Sermon {
  _id: string;
  title: string;
  speaker: string;
  series?: string;
  scriptureTags: string[];
  description?: string;
  preachedDate: string;
  media: SermonMedia[];
  thumbnailUrl?: string;
  tags: string[];
  viewCount: number;
  isPublished: boolean;
  createdBy: string;
  updatedBy?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SermonFormData {
  title: string;
  speaker: string;
  series?: string;
  scriptureTags: string[];
  description?: string;
  preachedDate: string;
  media: Omit<SermonMedia, '_id'>[];
  thumbnailUrl?: string;
  tags: string[];
  isPublished: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SOCIAL POST
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformTarget {
  _id: string;
  platform: SocialPlatform;
  status: PostStatus;
  publishedAt?: string;
  postId?: string;
  errorMessage?: string;
  reach: number;
  likes: number;
  shares: number;
  comments: number;
}

export interface SocialPost {
  _id: string;
  caption: string;
  mediaUrls: string[];
  platforms: PlatformTarget[];
  scheduledAt?: string;
  relatedSermonId?: string | Sermon;
  relatedStreamId?: string | LiveStream;
  hashtags: string[];
  createdBy: string;
  updatedBy?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostFormData {
  caption: string;
  mediaUrls: string[];
  platforms: { platform: SocialPlatform; status: PostStatus }[];
  scheduledAt?: string;
  relatedSermonId?: string;
  relatedStreamId?: string;
  hashtags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ONLINE CONVERT
// ─────────────────────────────────────────────────────────────────────────────

export interface OnlineConvert {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  platform: StreamPlatform;
  streamId?: string | LiveStream;
  sermonId?: string | Sermon;
  notes?: string;
  followUpStatus: FollowUpStatus;
  assignedTo?: string;
  convertedToMemberId?: string;
  createdBy: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineConvertFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  platform: StreamPlatform;
  streamId?: string;
  sermonId?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PRAYER REQUEST
// ─────────────────────────────────────────────────────────────────────────────

export interface PrayerRequest {
  _id: string;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  request: string;
  isAnonymous: boolean;
  isPublic: boolean;
  status: PrayerStatus;
  assignedTo?: string;
  prayedBy?: string;
  prayedAt?: string;
  adminNotes?: string;
  streamId?: string;
  createdBy?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrayerRequestFormData {
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  request: string;
  isAnonymous: boolean;
  isPublic: boolean;
  streamId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. COUNSELLING SESSION
// ─────────────────────────────────────────────────────────────────────────────

export interface CounsellingSession {
  _id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  topic: string;
  notes?: string;
  status: CounsellingStatus;
  counsellorId?: string;
  scheduledAt?: string;
  completedAt?: string;
  meetingLink?: string;
  sessionDurationMins?: number;
  followUpRequired: boolean;
  followUpNotes?: string;
  createdBy?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CounsellingFormData {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  topic: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ONLINE VISITOR
// ─────────────────────────────────────────────────────────────────────────────

export interface FollowUpAction {
  _id: string;
  action: string;
  note?: string;
  performedBy?: string;
  performedAt: string;
}

export interface OnlineVisitor {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  location?: string;
  howHeard?: string;
  prayerPoint?: string;
  streamId?: string | LiveStream;
  platform: StreamPlatform;
  followUpStatus: FollowUpStatus;
  assignedTo?: string;
  followUpActions: FollowUpAction[];
  emailsSent: number;
  lastEmailSentAt?: string;
  nextFollowUpAt?: string;
  convertedToMemberId?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. NEWSLETTER + SUBSCRIBER
// ─────────────────────────────────────────────────────────────────────────────

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: SubscriberStatus;
  source: 'form' | 'manual' | 'import' | 'online_visitor';
  tags: string[];
  subscribedAt: string;
  unsubscribedAt?: string;
  memberId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Newsletter {
  _id: string;
  subject: string;
  previewText?: string;
  htmlBody: string;
  plainTextBody?: string;
  status: NewsletterStatus;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  tags: string[];
  createdBy: string;
  updatedBy?: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterFormData {
  subject: string;
  previewText?: string;
  htmlBody: string;
  plainTextBody?: string;
  scheduledAt?: string;
  tags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

export interface OnlineMinistryStats {
  totalSermons: number;
  totalStreams: number;
  liveNow: number;
  convertsThisMonth: number;
  pendingPrayers: number;
  pendingCounselling: number;
  pendingVisitorFollowUps: number;
  activeSubscribers: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API PAGINATION WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}