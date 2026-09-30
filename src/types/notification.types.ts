/**
 * ChurchOS — src/types/notification.types.ts
 */

export const NOTIFICATION_TYPES = {
  MEMBER_CREATED:        'member_created',
  MEMBER_UPDATED:        'member_updated',
  MEMBER_DELETED:        'member_deleted',
  MEMBER_TRANSFERRED:    'member_transferred',
  MEMBER_BIRTHDAY:       'member_birthday',
  MEMBER_ANNIVERSARY:    'member_anniversary',
  MILESTONE_ADDED:       'milestone_added',
  PASTORAL_NOTE_ADDED:   'pastoral_note_added',
  ATTENDANCE_CHECKED_IN: 'attendance_checked_in',
  ATTENDANCE_BULK:       'attendance_bulk',
  EVENT_CREATED:         'event_created',
  EVENT_UPDATED:         'event_updated',
  EVENT_CANCELLED:       'event_cancelled',
  EVENT_REMINDER_24H:    'event_reminder_24h',
  EVENT_REMINDER_1H:     'event_reminder_1h',
  GIVING_RECORDED:       'giving_recorded',
  GIVING_RECEIPT:        'giving_receipt',
  BUDGET_THRESHOLD:      'budget_threshold',
  PLEDGE_DUE:            'pledge_due',
  VISITOR_REGISTERED:    'visitor_registered',
  VISITOR_FOLLOWUP_DUE:  'visitor_followup_due',
  VISITOR_CONVERTED:     'visitor_converted',
  WELFARE_REQUEST:       'welfare_request',
  WELFARE_APPROVED:      'welfare_approved',
  WELFARE_DISBURSED:     'welfare_disbursed',
  DEPARTMENT_ASSIGNED:   'department_assigned',
  BROADCAST:             'broadcast',
  TRAINING_ENROLLED:     'training_enrolled',
  TRAINING_COMPLETED:    'training_completed',
  DOCUMENT_UPLOADED:     'document_uploaded',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface INotification {
  _id:               string;
  recipientUserId?:  string | null;
  recipientRole?:    string | null;
  recipientKind:     'user' | 'member' | 'role' | 'all';
  type:              NotificationType;
  title:             string;
  body:              string;
  imageUrl?:         string;
  entityType?:       string;
  entityId?:         string;
  meta?:             Record<string, any>;
  channels: {
    inApp:    boolean;
    email:    boolean;
    sms:      boolean;
    whatsapp: boolean;
    push:     boolean;
  };
  isRead:    boolean;
  readAt?:   string | null;
  sentBy?:   string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success:    boolean;
  message:    string;
  data:       INotification[];
  pagination: {
    page:        number;
    limit:       number;
    total:       number;
    totalPages:  number;
    unreadCount: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data:    { count: number };
}

// Map each type to a route the frontend can navigate to
export const NOTIFICATION_ROUTE_MAP: Partial<Record<string, string>> = {
  member:        '/members',
  event:         '/events',
  giving_record: '/finance',
  visitor:       '/visitors',
  welfare:       '/welfare',
  department:    '/departments',
  training:      '/training',
  document:      '/documents',
  pledge:        '/finance',
};

// Map each notification type to an icon and color
export interface NotificationMeta {
  icon:  string;
  color: string;
  bg:    string;
}

export const NOTIFICATION_TYPE_META: Partial<Record<NotificationType, NotificationMeta>> = {
  member_created:        { icon: '👤', color: '#1A56A0', bg: 'rgba(26,86,160,0.1)'  },
  member_updated:        { icon: '✏️', color: '#1A56A0', bg: 'rgba(26,86,160,0.1)'  },
  member_deleted:        { icon: '🗑️', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  member_transferred:    { icon: '↔️', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  member_birthday:       { icon: '🎂', color: '#C41E3A', bg: 'rgba(196,30,58,0.1)'  },
  member_anniversary:    { icon: '💍', color: '#C41E3A', bg: 'rgba(196,30,58,0.1)'  },
  milestone_added:       { icon: '🏆', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  pastoral_note_added:   { icon: '📝', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  attendance_checked_in: { icon: '✅', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  attendance_bulk:       { icon: '📋', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  event_created:         { icon: '📅', color: '#1A56A0', bg: 'rgba(26,86,160,0.1)'  },
  event_updated:         { icon: '📅', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  event_cancelled:       { icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  event_reminder_24h:    { icon: '⏰', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  event_reminder_1h:     { icon: '⏰', color: '#C41E3A', bg: 'rgba(196,30,58,0.1)'  },
  giving_recorded:       { icon: '💰', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  giving_receipt:        { icon: '🧾', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  budget_threshold:      { icon: '⚠️', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  pledge_due:            { icon: '📌', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  visitor_registered:    { icon: '🙋', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  visitor_followup_due:  { icon: '📞', color: '#C41E3A', bg: 'rgba(196,30,58,0.1)'  },
  visitor_converted:     { icon: '🎉', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  welfare_request:       { icon: '🤝', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  welfare_approved:      { icon: '✔️', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  welfare_disbursed:     { icon: '💸', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  department_assigned:   { icon: '🏛️', color: '#1A56A0', bg: 'rgba(26,86,160,0.1)'  },
  broadcast:             { icon: '📢', color: '#C41E3A', bg: 'rgba(196,30,58,0.1)'  },
  training_enrolled:     { icon: '📚', color: '#1A56A0', bg: 'rgba(26,86,160,0.1)'  },
  training_completed:    { icon: '🎓', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
  document_uploaded:     { icon: '📄', color: '#1A56A0', bg: 'rgba(26,86,160,0.1)'  },
};