/**
 * ChurchOS — src/features/welfare/welfare.types.ts
 * Module 12 — Welfare & Care (Pastoral)
 * Type definitions mirroring the backend Welfare model exactly.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export type WelfareCategory =
  | 'sick_hospital'
  | 'financial_assistance'
  | 'disbursement'
  | 'prayer_request'
  | 'counselling'
  | 'bereavement'
  | 'visit'
  | 'general';

export type WelfareStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'cancelled';

export type FinancialRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disbursed';

export type PrayerVisibility = 'private' | 'public';

export type PrayerResponseStatus =
  | 'pending'
  | 'assigned'
  | 'responded'
  | 'closed';

export type VisitType = 'home' | 'hospital' | 'other';

export type VisitStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type CounsellingStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'follow_up';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-types
// ─────────────────────────────────────────────────────────────────────────────

export interface WelfareNote {
  _id: string;
  content: string;
  isConfidential: boolean;
  createdBy: { _id: string; email: string } | string;
  createdAt: string;
}

export interface FinancialRequest {
  amount: number;
  currency: string;
  reason: string;
  status: FinancialRequestStatus;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  disbursedAt?: string;
  disbursedBy?: string;
  disbursementRef?: string;
  receiptUrl?: string;
}

export interface PrayerRequest {
  title: string;
  details: string;
  visibility: PrayerVisibility;
  submittedBy?: string;
  assignedTeam?: Array<{ _id: string; email: string } | string>;
  responseStatus: PrayerResponseStatus;
  responseNotes?: string;
  respondedAt?: string;
  respondedBy?: string;
  isConfidential: boolean;
}

export interface CounsellingSession {
  sessionDate: string;
  counsellor: { _id: string; email: string } | string;
  durationMinutes?: number;
  notes?: string;
  isConfidential: boolean;
  status: CounsellingStatus;
  nextSessionDate?: string;
}

export interface BereavementRecord {
  deceasedName: string;
  relationshipToMember: string;
  dateOfDeath: string;
  funeralDate?: string;
  funeralLocation?: string;
  supportCoordinator?: { _id: string; email: string } | string;
  supportActions: string[];
  isConfidential: boolean;
}

export interface VisitSchedule {
  visitType: VisitType;
  scheduledDate: string;
  completedDate?: string;
  location?: string;
  visitedBy: Array<{ _id: string; email: string } | string>;
  notes?: string;
  status: VisitStatus;
  isConfidential: boolean;
}

export interface DisbursementRecord {
  amount: number;
  currency: string;
  purpose: string;
  disbursedAt: string;
  disbursedBy: string;
  approvedBy?: string;
  disbursementRef?: string;
  receiptUrl?: string;
  isConfidential: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Welfare Record
// ─────────────────────────────────────────────────────────────────────────────

export interface WelfareMemberRef {
  _id: string;
  firstName: string;
  lastName: string;
  membershipId: string;
  photoUrl?: string | null;
  phone?: string;
  email?: string;
}

export interface WelfareRecord {
  _id: string;
  memberId: WelfareMemberRef | string;
  category: WelfareCategory;
  title: string;
  description?: string;
  status: WelfareStatus;
  isConfidential: boolean;

  // Category-specific
  financialRequest?: FinancialRequest;
  disbursementRecord?: DisbursementRecord;
  prayerRequest?: PrayerRequest;
  counsellingSession?: CounsellingSession;
  bereavementRecord?: BereavementRecord;
  visitSchedule?: VisitSchedule;

  // Sick / hospital
  hospitalName?: string;
  admissionDate?: string;
  dischargeDate?: string;
  diagnosis?: string;
  treatingDoctor?: string;

  // Notes
  notes: WelfareNote[];

  // Assignment
  assignedTo?: { _id: string; email: string } | string;

  // Fund ref
  welfareFundId?: string;

  // Audit
  createdBy: { _id: string; email: string } | string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Welfare Fund
// ─────────────────────────────────────────────────────────────────────────────

export interface WelfareFund {
  _id: string;
  year: number;
  month?: number;
  totalBudget: number;
  currency: string;
  totalDisbursed: number;
  balance: number;
  notes?: string;
  isConfidential: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

export interface WelfareStats {
  totalRecords: number;
  openRecords: number;
  newThisMonth: number;
  pendingFinancialRequests: number;
  upcomingVisits: number;
  unansweredPrayerRequests: number;
  byCategory: Partial<Record<WelfareCategory, number>>;
  latestFund: {
    id: string;
    period: string;
    totalBudget: number;
    totalDisbursed: number;
    balance: number;
    currency: string;
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Data
// ─────────────────────────────────────────────────────────────────────────────

export interface WelfareFormData {
  memberId: string;
  category: WelfareCategory;
  title: string;
  description?: string;
  isConfidential?: boolean;
  assignedTo?: string;

  // Sick/Hospital
  hospitalName?: string;
  admissionDate?: string;
  dischargeDate?: string;
  diagnosis?: string;
  treatingDoctor?: string;

  // Financial
  financialRequest?: {
    amount: number;
    currency: string;
    reason: string;
  };

  // Prayer
  prayerRequest?: {
    title: string;
    details: string;
    visibility: PrayerVisibility;
    isConfidential: boolean;
  };

  // Counselling
  counsellingSession?: {
    sessionDate: string;
    counsellor: string;
    durationMinutes?: number;
    notes?: string;
    isConfidential: boolean;
    status: CounsellingStatus;
  };

  // Bereavement
  bereavementRecord?: {
    deceasedName: string;
    relationshipToMember: string;
    dateOfDeath: string;
    funeralDate?: string;
    funeralLocation?: string;
    supportCoordinator?: string;
    isConfidential: boolean;
  };

  // Visit
  visitSchedule?: {
    visitType: VisitType;
    scheduledDate: string;
    location?: string;
    isConfidential: boolean;
  };

  // Disbursement
  disbursementRecord?: {
    amount: number;
    currency: string;
    purpose: string;
    disbursedAt: string;
    disbursementRef?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// API Pagination wrapper (matches your existing ApiResponse.paginated shape)
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedWelfareResponse {
  data: WelfareRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────────────────

export const WELFARE_CATEGORY_LABELS: Record<WelfareCategory, string> = {
  sick_hospital:        'Sick / Hospital',
  financial_assistance: 'Financial Assistance',
  disbursement:         'Disbursement',
  prayer_request:       'Prayer Request',
  counselling:          'Counselling',
  bereavement:          'Bereavement',
  visit:                'Visit',
  general:              'General',
};

export const WELFARE_CATEGORY_ICONS: Record<WelfareCategory, string> = {
  sick_hospital:        '🏥',
  financial_assistance: '💰',
  disbursement:         '💸',
  prayer_request:       '🙏',
  counselling:          '🧠',
  bereavement:          '🕊️',
  visit:                '🏠',
  general:              '📋',
};

export const WELFARE_STATUS_COLORS: Record<WelfareStatus, string> = {
  open:        '#f59e0b',
  in_progress: '#3b82f6',
  resolved:    '#10b981',
  closed:      '#6b7280',
  cancelled:   '#ef4444',
};

export const FINANCIAL_STATUS_COLORS: Record<FinancialRequestStatus, string> = {
  pending:   '#f59e0b',
  approved:  '#3b82f6',
  rejected:  '#ef4444',
  disbursed: '#10b981',
};