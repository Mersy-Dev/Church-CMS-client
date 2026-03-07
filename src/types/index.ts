// ── Auth ──────────────────────────────────────────────────────────────────────
export type Role =
  | 'super_admin' | 'pastor' | 'admin' | 'department_head'
  | 'accountant' | 'media_manager' | 'follow_up_team' | 'member';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  memberId?: string | null;
  twoFaEnabled: boolean;
  member?: {
    firstName: string;
    lastName: string;
    membershipId: string;
    photoUrl?: string;
  } | null;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ── Member ────────────────────────────────────────────────────────────────────
export type MemberStatus =
  | 'first_timer' | 'visitor' | 'new_convert' | 'member'
  | 'worker' | 'leader' | 'transferred_out' | 'archived' | 'deceased';

export type Gender = 'male' | 'female' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
export type BaptismStatus = 'not_baptised' | 'water_baptised' | 'holy_ghost_baptised' | 'both';

/**
 * Main Member interface
 * Matches backend IMember response format
 */
export interface Member {
  _id: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  gender?: Gender;
  dateOfBirth?: string;
  maritalStatus?: MaritalStatus;
  occupation?: string;
  address?: string;
  status: MemberStatus;
  dateJoined?: string;
  
  // ── Department fields - Backend returns departmentIds as array of ObjectIds
  departmentIds?: string[]; // Array of department IDs from database
  departmentId?: string; // Single ID for convenience (virtual from backend)
  departments?: Department[];  // instead of (string | Department)[]
  
  familyId?: string;
  workerStatus?: string; // 'active' | 'inactive' | 'on_leave'
  createdAt: string;
  updatedAt: string;
  
  // Virtual/computed fields
  fullName?: string;
  age?: number;
  isBirthdayToday?: boolean;
}

/**
 * Form data for creating/updating members
 * What we send TO the backend
 */
export interface MemberFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  maritalStatus?: MaritalStatus;
  occupation?: string;
  address?: string;
  status: MemberStatus;
  dateJoined?: string;
  departmentIds: string[] // Send array of IDs to backend
}

export interface MemberStats {
  total: number;
  byStatus: Record<string, number>;
  newThisMonth: number;
  activeWorkers: number;
}

// ── Department ────────────────────────────────────────────────────────────────
export interface Department {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  headId?: string;
  head?: Pick<Member, '_id' | 'firstName' | 'lastName' | 'membershipId'>;
  memberCount?: number;
  isActive: boolean;
  createdAt: string;
}

// ── Visitor ───────────────────────────────────────────────────────────────────
export type FollowUpStatus =
  | 'pending' | 'in_progress' | 'contacted' | 'visited'
  | 'converted' | 'unreachable' | 'closed' | 'not_interested';

export type VisitorSource =
  | 'invited_by_member' | 'online' | 'outreach'
  | 'walk_in' | 'social_media' | 'flyer' | 'other';

export interface Visitor {
  _id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  gender?: Gender;
  ageGroup?: string;
  visitDate: string;
  source: VisitorSource;
  isOnlineVisitor: boolean;
  followUpStatus: FollowUpStatus;
  followUpPriority?: 'low' | 'normal' | 'high';
  followUpDueDate?: string;
  assignedTo?: Partial<Member> | null;
  convertedToMember: boolean;
  memberId?: string | null;
  eventId?: string | null;
  daysSinceVisit?: number;
  actionCount?: number;
  createdAt: string;
}

// ── Event ─────────────────────────────────────────────────────────────────────
export type EventType =
  | 'sunday_service' | 'midweek_service' | 'conference' | 'crusade'
  | 'wedding' | 'naming_ceremony' | 'vigil' | 'retreat' | 'cell_group'
  | 'department_meeting' | 'outreach' | 'special_program' | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface ChurchEvent {
  _id: string;
  title: string;
  type: EventType;
  description?: string;
  startDatetime: string;
  endDatetime?: string;
  location?: string;
  campus?: string;
  isOnline: boolean;
  streamUrl?: string;
  status: EventStatus;
  departmentId?: string;
  department?: Pick<Department, '_id' | 'name' | 'color'>;
  capacity?: number;
  rsvpEnabled: boolean;
  tags?: string[];
  stats?: {
    totalAttendance: number;
    onlineViewers: number;
    totalOffering: number;
    firstTimers: number;
  };
  isUpcoming?: boolean;
  isPast?: boolean;
  createdAt: string;
}

// ── Attendance ────────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  _id: string;
  eventId: string;
  memberId?: Partial<Member> | null;
  visitorName?: string;
  isVisitor: boolean;
  isOnline: boolean;
  isFirstTimer: boolean;
  checkedInAt: string;
  method: 'manual' | 'qr_scan' | 'self_checkin' | 'kiosk' | 'import';
  serviceNumber: number;
}

export interface AttendanceSummary {
  total: number;
  members: number;
  visitors: number;
  firstTimers: number;
  online: number;
}

// ── API ───────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── UI ────────────────────────────────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}