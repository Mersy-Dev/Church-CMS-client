// ─── Communication Types ───────────────────────────────────────────────────────
// ChurchOS — Module 08 · Communications

export type CommChannel  = 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
export type CommStatus   = 'queued' | 'sent' | 'delivered' | 'opened' | 'failed' | 'bounced';
export type CommTrigger  =
  | 'manual_broadcast'
  | 'birthday'
  | 'anniversary'
  | 'event_reminder'
  | 'welcome_sequence'
  | 'absentee_followup'
  | 'prayer_chain'
  | 'giving_receipt'
  | 'pledge_reminder'
  | 'staff_message';

export type BroadcastStatus  = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
export type AudienceScope    = 'all' | 'group' | 'department' | 'custom';
export type AutomationStatus = 'active' | 'inactive' | 'paused';

// ─── Communication Log ────────────────────────────────────────────────────────

export interface Communication {
  _id:            string;
  recipientId:    string;
  recipientType:  'member' | 'visitor' | 'staff';
  channel:        CommChannel;
  trigger:        CommTrigger;
  subject?:       string;
  body:           string;
  templateId?:    string | MessageTemplate;
  broadcastId?:   string | Broadcast;
  sequenceId?:    string;
  stepIndex?:     number;
  status:         CommStatus;
  sentAt?:        string;
  deliveredAt?:   string;
  openedAt?:      string;
  failureReason?: string;
  providerMsgId?: string;
  provider?:      string;
  sentBy?:        string | { email: string };
  createdAt:      string;
  updatedAt:      string;
}

// ─── Message Template ─────────────────────────────────────────────────────────

export interface MessageTemplate {
  _id:         string;
  name:        string;
  description?: string;
  channel:     CommChannel;
  trigger?:    CommTrigger;
  subject?:    string;
  body:        string;
  variables:   string[];
  isActive:    boolean;
  isSystem:    boolean;
  usageCount:  number;
  createdBy:   string | { email: string };
  updatedBy?:  string;
  deletedAt?:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface TemplateFormData {
  name:        string;
  description?: string;
  channel:     CommChannel;
  trigger?:    CommTrigger;
  subject?:    string;
  body:        string;
  variables?:  string[];
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export interface AudienceFilter {
  scope:            AudienceScope;
  departmentIds?:   string[];
  memberStatus?:    string[];
  workerStatus?:    string;
  customMemberIds?: string[];
}

export interface BroadcastStats {
  total:     number;
  sent:      number;
  delivered: number;
  opened:    number;
  failed:    number;
}

export interface Broadcast {
  _id:            string;
  title:          string;
  channel:        CommChannel;
  subject?:       string;
  body:           string;
  templateId?:    string | MessageTemplate;
  audience:       AudienceFilter;
  recipientCount: number;
  status:         BroadcastStatus;
  scheduledAt?:   string;
  sentAt?:        string;
  stats:          BroadcastStats;
  createdBy:      string | { email: string };
  updatedBy?:     string;
  deletedAt?:     string | null;
  createdAt:      string;
  updatedAt:      string;
}

export interface BroadcastFormData {
  title:       string;
  channel:     CommChannel;
  subject?:    string;
  body:        string;
  templateId?: string;
  audience:    AudienceFilter;
  scheduledAt?: string;
}

// ─── Automation Rule ──────────────────────────────────────────────────────────

export interface AutomationStep {
  _id?:       string;
  stepIndex:  number;
  delayHours: number;
  channel:    CommChannel;
  templateId?: string | MessageTemplate;
  subject?:   string;
  body:       string;
  isActive:   boolean;
}

export interface AutomationConditions {
  memberStatus?:      string[];
  absenteeThreshold?: number;
  daysBefore?:        number;
  hoursAfter?:        number;
}

export interface AutomationRule {
  _id:         string;
  name:        string;
  description?: string;
  trigger:     CommTrigger;
  status:      AutomationStatus;
  channel?:    CommChannel;
  templateId?: string | MessageTemplate;
  subject?:    string;
  body?:       string;
  isSequence:  boolean;
  steps:       AutomationStep[];
  conditions?: AutomationConditions;
  sentCount:   number;
  lastRunAt?:  string;
  createdBy:   string | { email: string };
  updatedBy?:  string;
  deletedAt?:  string | null;
  createdAt:   string;
  updatedAt:   string;
}

// ─── Announcement ─────────────────────────────────────────────────────────────

export type AnnouncementAudience = 'all' | 'department' | 'workers' | 'custom';

export interface Announcement {
  _id:           string;
  title:         string;
  body:          string;
  imageUrl?:     string;
  audience:      AnnouncementAudience;
  departmentIds?: string[];
  isPinned:      boolean;
  isActive:      boolean;
  publishAt:     string;
  expiresAt?:    string;
  viewCount:     number;
  viewedBy:      string[];
  createdBy:     string | { email: string };
  updatedBy?:    string;
  deletedAt?:    string | null;
  createdAt:     string;
  updatedAt:     string;
}

export interface AnnouncementFormData {
  title:         string;
  body:          string;
  audience:      AnnouncementAudience;
  departmentIds?: string[];
  isPinned?:     boolean;
  publishAt?:    string;
  expiresAt?:    string;
}

// ─── Staff Message ────────────────────────────────────────────────────────────

export type StaffMsgStatus = 'sent' | 'delivered' | 'read';

export interface StaffMessage {
  _id:          string;
  senderId:     string | { _id: string; email: string };
  recipientIds: (string | { _id: string; email: string })[];
  subject?:     string;
  body:         string;
  isUrgent:     boolean;
  status:       StaffMsgStatus;
  readBy:       { userId: string; readAt: string }[];
  threadId?:    string;
  parentId?:    string;
  deletedAt?:   string | null;
  createdAt:    string;
  updatedAt:    string;
}

export interface StaffMessageFormData {
  recipientIds: string[];
  subject?:     string;
  body:         string;
  isUrgent?:    boolean;
  parentId?:    string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface CommStats {
  totalLast30: number;
  byChannel:   Record<CommChannel, number>;
  byStatus:    Record<CommStatus, number>;
  byTrigger:   Record<CommTrigger, number>;
}

export interface BroadcastStatsDetail {
  broadcast:      { id: string; title: string; sentAt?: string };
  recipientCount: number;
  stats:          Record<string, number>;
  openRate:       string;
  deliveryRate:   string;
}