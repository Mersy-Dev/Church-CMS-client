// // ── Training Module Types ──────────────────────────────────────────────────

// export type ProgramStatus = 'active' | 'draft' | 'archived' | 'completed';
// export type CohortStatus = 'upcoming' | 'active' | 'graduated' | 'cancelled';
// export type EnrollmentStatus = 'enrolled' | 'active' | 'graduated' | 'dropped';
// export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';
// export type MentorshipStatus = 'active' | 'completed' | 'paused' | 'cancelled';

// // ── Program ────────────────────────────────────────────────────────────────

// export interface TrainingProgram {
//   _id: string;
//   name: string;
//   description?: string;
//   category?: string;
//   durationWeeks?: number;
//   status: ProgramStatus;
//   modules?: ProgramModule[];
//   createdAt: string;
//   updatedAt: string;
// }

// export interface ProgramModule {
//   _id?: string;
//   title: string;
//   description?: string;
//   weekNumber?: number;
//   resources?: string[];
// }

// // ── Cohort ─────────────────────────────────────────────────────────────────

// export interface TrainingCohort {
//   _id: string;
//   name: string;
//   programId: string | TrainingProgram;
//   status: CohortStatus;
//   startDate?: string;
//   endDate?: string;
//   facilitatorId?: string | any;
//   maxCapacity?: number;
//   enrollments?: CohortEnrollment[];
//   sessions?: CohortSession[];
//   createdAt: string;
//   updatedAt: string;
// }

// export interface CohortEnrollment {
//   _id?: string;
//   memberId: string | any;
//   status: EnrollmentStatus;
//   enrolledAt: string;
//   graduatedAt?: string;
//   notes?: string;
// }

// export interface CohortSession {
//   _id?: string;
//   title: string;
//   date: string;
//   notes?: string;
//   attendance?: SessionAttendance[];
// }

// export interface SessionAttendance {
//   memberId: string | any;
//   status: AttendanceStatus;
//   notes?: string;
// }

// // ── Mentorship ─────────────────────────────────────────────────────────────

// export interface Mentorship {
//   _id: string;
//   mentorId: string | any;
//   menteeId: string | any;
//   programId?: string | TrainingProgram;
//   status: MentorshipStatus;
//   startDate?: string;
//   endDate?: string;
//   focus?: string;
//   meetingLogs?: MeetingLog[];
//   notes?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface MeetingLog {
//   _id?: string;
//   date: string;
//   summary: string;
//   nextSteps?: string;
//   rating?: 1 | 2 | 3 | 4 | 5;
// }

// // ── Form Data ──────────────────────────────────────────────────────────────

// export interface ProgramFormData {
//   name: string;
//   description?: string;
//   category?: string;
//   durationWeeks?: number;
//   status: ProgramStatus;
// }

// export interface CohortFormData {
//   name: string;
//   programId: string;
//   status: CohortStatus;
//   startDate?: string;
//   endDate?: string;
//   facilitatorId?: string;
//   maxCapacity?: number;
// }

// export interface MentorshipFormData {
//   mentorId: string;
//   menteeId: string;
//   programId?: string;
//   focus?: string;
//   startDate?: string;
//   notes?: string;
// }

// export interface MeetingLogFormData {
//   date: string;
//   summary: string;
//   nextSteps?: string;
//   rating?: number;
// }

// export interface TrainingStats {
//   totalPrograms: number;
//   activePrograms: number;
//   totalCohorts: number;
//   activeCohorts: number;
//   totalEnrolled: number;
//   totalGraduated: number;
//   totalMentorships: number;
//   activeMentorships: number;
// }


// ─── Training & Discipleship Types ───────────────────────────────────────────

export type ProgramType =
  | 'integration_class'
  | 'discipleship_track'
  | 'bible_study'
  | 'leadership'
  | 'marriage_prep'
  | 'other';

export type CohortStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'enrolled' | 'active' | 'completed' | 'dropped' | 'graduated';
export type MentorshipStatus = 'active' | 'completed' | 'paused' | 'cancelled';

// ── Program ───────────────────────────────────────────────────────────────────
export interface CurriculumItem {
  week: number;
  topic: string;
  description?: string;
  resourceUrl?: string;
}

export interface TrainingProgram {
  _id: string;
  name: string;
  type: ProgramType;
  description?: string;
  category?: string;
  modules?: Array<{
    _id?: string;
    title: string;
    description?: string;
    weekNumber?: number;
  }>;
  status: 'active' | 'draft' | 'archived' | 'completed';
  durationWeeks?: number;
  sessionsPerWeek?: number;
  totalSessions?: number;
  promoteOnCompletion: boolean;
  promoteToStatus?: string;
  curriculum: CurriculumItem[];
  isActive: boolean;
  createdBy?: string;
  cohortCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  _id?: string;
  title: string;
  date: string;
  notes?: string;
  attendance?: Array<{
    memberId: string | MemberRef;
    status: 'present' | 'absent' | 'excused' | 'late';
    notes?: string;
  }>;
}

// ── Cohort ────────────────────────────────────────────────────────────────────
export interface MemberRef {
  _id: string;
  firstName: string;
  lastName: string;
  membershipId: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface TrainingCohort {
  _id: string;
  programId: TrainingProgram | string;
  name: string;
  facilitatorId?: MemberRef;
  coFacilitatorId?: MemberRef;
    sessions?: TrainingSession[]; // add the correct type here

  startDate: string;
  endDate?: string;
  status: CohortStatus;
  venue?: string;
  meetingDays?: string[];
  meetingTime?: string;
  maxEnrollment?: number;
  notes?: string;
  enrolledCount?: number;
  graduatedCount?: number;
  enrollments?: TrainingEnrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface CohortEnrollment {
  _id: string;
  memberId: MemberRef;
  enrolledAt: string;
  enrolledBy?: string;
  status: EnrollmentStatus;
  sessionsAttended: number;
  sessionsTotal: number;
  attendanceRecords: AttendanceRecord[];
  completedAt?: string;
  graduatedAt?: string;
  promotedToMember: boolean;
  notes?: string;
  certificateIssued: boolean;
  certificateIssuedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Enrollment ────────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  _id: string;
  sessionNumber: number;
  sessionDate: string;
  topic?: string;
  present: boolean;
  notes?: string;
  markedBy?: string;
  markedAt: string;
}

export interface TrainingEnrollment {
  _id: string;
  cohortId: TrainingCohort | string;
  memberId: MemberRef;
  enrolledAt: string;
  enrolledBy?: string;
  status: EnrollmentStatus;
  sessionsAttended: number;
  sessionsTotal: number;
  attendanceRecords: AttendanceRecord[];
  completedAt?: string;
  graduatedAt?: string;
  promotedToMember: boolean;
  notes?: string;
  certificateIssued: boolean;
  certificateIssuedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Mentorship ────────────────────────────────────────────────────────────────
export interface MeetingLog {
  _id: string;
  date: string;
  summary?: string;
  nextSteps?: string;
  rating?: number;        // ← add
  loggedBy?: string;
  createdAt: string;
}


export interface Mentorship {
  _id: string;
  mentorId: MemberRef;
  menteeId: MemberRef;
  programId?: string | { name: string; _id: string };  // ← add
  focus?: string;
  status: MentorshipStatus;
  startDate: string;
  endDate?: string;
  goalNotes?: string;
  notes?: string;         // ← add
  meetingLogs: MeetingLog[];
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingLogFormData {
  date: string;
  summary: string;
  nextSteps?: string;
  rating?: number;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface TrainingStats {
  totalPrograms: number;
  activeCohorts: number;
  currentlyEnrolled: number;
  totalGraduated: number;
  activeMentorships: number;
  integrationClass: {
    active: number;
    enrolled: number;
    graduated: number;
    dropped: number;
  };
}