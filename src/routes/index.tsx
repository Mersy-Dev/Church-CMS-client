import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/auth/LoginPage";
import DashboardPage from "../features/dashboard/DashboardPage";
import MembersPage from "../features/members/MembersPage";
import MemberDetailPage from "../features/members/MemberDetailsPage";
import VisitorsPage from "../features/visitors/VisitorsPage";
import EventsPage from "../features/events/EventsPage";
import AttendancePage from "../features/attendance/AttendancePage";
import DepartmentsPage from "../features/departments/DepartmentsPage";
import FamiliesPage from "../features/families/FamiliesPage";
import FamilyDetailPage from "../features/families/FamilyDetailPage";
import ProtectedRoute from "./ProtectedRoute";
import ProgramDetailPage from "@/features/training/ProgramDetailPage";
import MentorshipDetailPage from "@/features/training/MentorshipDetailPage";
import WelfarePage from "../features/welfare/Welfarepage";
import WelfareDetailPage from "../features/welfare/WelfareDetailPage";
import DocumentsPage from "../features/documents/DocumentsPage";
import DocumentDetailPage from "../features/documents/DocumentDetailPage";
import TrainingPage from "../features/training/TrainingPage";
import CohortDetailPage from "../features/training/CohortDetailPage";

// ── Module 07 — Online Ministry ───────────────────────────────────────────────
import OnlineMinistryPage  from "../features/onlineministry/OnlineMinistryPage";
import StreamsPage         from "../features/onlineministry/streams/StreamPage";
import SermonsPage         from "../features/onlineministry/sermons/SermonPage";
import ConvertsPage        from "../features/onlineministry/converts/ConvertsPage";
import PrayerRequestsPage  from "../features/onlineministry/prayerrequest/PrayerRequestPage";
import CounsellingPage     from "../features/onlineministry/counselling/CounsellingPage";
import OnlineVisitorsPage  from "../features/onlineministry/visitors/VisitorsPage";
import NewsletterPage      from "../features/onlineministry/newsletters/NewsletterPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,                              element: <DashboardPage /> },

      // ── Members ─────────────────────────────────────────────────────────────
      { path: "members",                          element: <MembersPage /> },
      { path: "members/:id",                      element: <MemberDetailPage /> },

      // ── Visitors ─────────────────────────────────────────────────────────────
      { path: "visitors",                         element: <VisitorsPage /> },

      // ── Events ───────────────────────────────────────────────────────────────
      { path: "events",                           element: <EventsPage /> },

      // ── Attendance ───────────────────────────────────────────────────────────
      { path: "attendance",                       element: <AttendancePage /> },

      // ── Departments ──────────────────────────────────────────────────────────
      { path: "departments",                      element: <DepartmentsPage /> },

      // ── Families ─────────────────────────────────────────────────────────────
      { path: "families",                         element: <FamiliesPage /> },
      { path: "families/:id",                     element: <FamilyDetailPage /> },

      // ── Training & Discipleship ──────────────────────────────────────────────
      { path: "training",                         element: <TrainingPage /> },
      { path: "training/programs/:id",            element: <ProgramDetailPage /> },
      { path: "training/cohorts/:id",             element: <CohortDetailPage /> },
      { path: "training/mentorships/:id",         element: <MentorshipDetailPage /> },

      // ── Welfare ──────────────────────────────────────────────────────────────
      { path: "welfare",                          element: <WelfarePage /> },
      { path: "welfare/:id",                      element: <WelfareDetailPage /> },

      // ── Documents ────────────────────────────────────────────────────────────
      { path: "documents",                        element: <DocumentsPage /> },
      { path: "documents/:id",                    element: <DocumentDetailPage /> },

      // ── Module 07: Online Ministry ───────────────────────────────────────────
      { path: "online-ministry",                  element: <OnlineMinistryPage /> },
      { path: "online-ministry/streams",          element: <StreamsPage /> },
      { path: "online-ministry/sermons",          element: <SermonsPage /> },
      { path: "online-ministry/converts",         element: <ConvertsPage /> },
      { path: "online-ministry/prayer-requests",  element: <PrayerRequestsPage /> },
      { path: "online-ministry/counselling",      element: <CounsellingPage /> },
      { path: "online-ministry/visitors",         element: <OnlineVisitorsPage /> },
      { path: "online-ministry/newsletter",       element: <NewsletterPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);