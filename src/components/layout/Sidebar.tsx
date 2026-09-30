import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCheck, CalendarDays, ClipboardCheck,
  Building2, ChevronRight, ChevronDown, Home, GraduationCap, Heart,
  FileArchive, Radio, BookOpen, Share2, HeadphonesIcon, Mail, Wifi,
  MessageSquare, Megaphone, FileText, Zap, Bell, Banknote, Receipt,
  Handshake, Target, ClipboardList, BarChart3,
} from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
// ── NEW ───────────────────────────────────────────────────────────────────────
import NotificationDropdown from "../../features/notifications/NotificationDropdown";
import type { RootState } from "../../store";

interface NavChild { to: string; label: string; icon: React.ElementType; }
interface NavItem  { to: string; label: string; icon: React.ElementType; children?: NavChild[]; }
interface NavGroup { group: string; items: NavItem[]; }

const NAV: NavGroup[] = [
  {
    group: "MAIN",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "PEOPLE",
    items: [
      { to: "/admin/members",  label: "Members",  icon: Users     },
      { to: "/admin/visitors", label: "Visitors", icon: UserCheck },
      { to: "/admin/families", label: "Families", icon: Home      },
    ],
  },
  {
    group: "MINISTRY",
    items: [
      { to: "/admin/events",     label: "Events & Calendar", icon: CalendarDays   },
      { to: "/admin/attendance", label: "Attendance",         icon: ClipboardCheck },
      { to: "/admin/training",   label: "Training",           icon: GraduationCap  },
      {
        to: "/admin/online-ministry",
        label: "Online Ministry",
        icon: Wifi,
        children: [
          { to: "/admin/online-ministry",                 label: "Overview",       icon: LayoutDashboard },
          { to: "/admin/online-ministry/streams",         label: "Livestreams",    icon: Radio           },
          { to: "/admin/online-ministry/sermons",         label: "Sermon Library", icon: BookOpen        },
          { to: "/admin/online-ministry/social-posts",    label: "Social Posts",   icon: Share2          },
          { to: "/admin/online-ministry/converts",        label: "Converts",       icon: UserCheck       },
          { to: "/admin/online-ministry/prayer-requests", label: "Prayer Wall",    icon: Heart           },
          { to: "/admin/online-ministry/counselling",     label: "Counselling",    icon: HeadphonesIcon  },
          { to: "/admin/online-ministry/visitors",        label: "Visitors",       icon: Users           },
          { to: "/admin/online-ministry/newsletter",      label: "Newsletter",     icon: Mail            },
        ],
      },
    ],
  },
  {
    group: "PASTORAL",
    items: [{ to: "/admin/welfare", label: "Welfare & Care", icon: Heart }],
  },
  {
    group: "FINANCE",
    items: [
      {
        to: "/admin/finance",
        label: "Finance & Giving",
        icon: Banknote,
        children: [
          { to: "/admin/finance",               label: "Overview",      icon: LayoutDashboard },
          { to: "/admin/finance/contributions", label: "Contributions", icon: Receipt         },
          { to: "/admin/finance/pledges",       label: "Pledges",       icon: Handshake       },
          { to: "/admin/finance/projects",      label: "Projects",      icon: Target          },
          { to: "/admin/finance/expenses",      label: "Expenses",      icon: ClipboardList   },
          { to: "/admin/finance/reports",       label: "Reports",       icon: BarChart3       },
        ],
      },
    ],
  },
  {
    group: "COMMUNICATIONS",
    items: [
      {
        to: "/admin/communications",
        label: "Communications",
        icon: MessageSquare,
        children: [
          { to: "/admin/communications",                label: "Overview",       icon: LayoutDashboard },
          { to: "/admin/communications/broadcasts",     label: "Broadcasts",     icon: Megaphone       },
          { to: "/admin/communications/templates",      label: "Templates",      icon: FileText        },
          { to: "/admin/communications/automations",    label: "Automations",    icon: Zap             },
          { to: "/admin/communications/announcements",  label: "Announcements",  icon: Bell            },
          { to: "/admin/communications/staff-messages", label: "Staff Messages", icon: Users           },
        ],
      },
    ],
  },
  {
    group: "RECORDS",
    items: [{ to: "/admin/documents", label: "Documents", icon: FileArchive }],
  },
  {
    group: "ADMIN",
    items: [{ to: "/admin/departments", label: "Departments", icon: Building2 }],
  },
  {
    group: "ACCOUNT",
    items: [{ to: "/logout", label: "Logout", icon: Share2 }],
  },
];

// ── All sidebar colours in one place, explicit per theme ─────────────────────
function useSidebarColors(isDark: boolean) {
  return {
    surface:       isDark ? '#161b22'                    : '#ffffff',
    border:        isDark ? 'rgba(255,255,255,0.09)'     : 'rgba(26,86,160,0.15)',
    textPrimary:   isDark ? '#f0f6fc'                    : '#0a0f1a',
    textSecondary: isDark ? '#c9d1d9'                    : '#1a2236',
    textMuted:     isDark ? '#8b949e'                    : '#3d4f6b',
    hoverBg:       isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(26,86,160,0.07)',
    activeBg:      'rgba(26,86,160,0.13)',
    activeText:    isDark ? '#4A8FD4'                    : '#1A56A0',
    activeBorder:  '#1A56A0',
    activeChildBg: 'rgba(26,86,160,0.1)',
    subBorder:     isDark ? 'rgba(255,255,255,0.09)'     : 'rgba(26,86,160,0.18)',
    adminBadgeBg:  isDark ? 'rgba(255,255,255,0.07)'     : 'rgba(26,86,160,0.08)',
  };
}

type SidebarColors = ReturnType<typeof useSidebarColors>;

// ── ExpandableItem ────────────────────────────────────────────────────────────
function ExpandableItem({ item, C }: { item: NavItem; C: SidebarColors }) {
  const location      = useLocation();
  const isChildActive = item.children?.some((c) =>
    c.to === item.to ? location.pathname === item.to : location.pathname.startsWith(c.to)
  );
  const [open, setOpen] = useState<boolean>(!!isChildActive);
  const isParentActive  = location.pathname.startsWith(item.to);

  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer"
        style={
          isParentActive
            ? { background: C.activeBg, color: C.activeText, borderLeft: `2.5px solid ${C.activeBorder}`, paddingLeft: '10px' }
            : { color: C.textSecondary }
        }
        onMouseEnter={(e) => { if (!isParentActive) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
        onMouseLeave={(e) => { if (!isParentActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <item.icon size={16} strokeWidth={isParentActive ? 2.5 : 2} />
        <span className="font-medium flex-1 text-left">{item.label}</span>
        <ChevronDown
          size={13}
          className="opacity-60"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        />
      </button>

      {open && (
        <ul className="mt-0.5 ml-3 pl-3 space-y-0.5" style={{ borderLeft: `1px solid ${C.subBorder}` }}>
          {item.children!.map(({ to, label, icon: Icon }) => {
            const isActive = to === item.to ? location.pathname === item.to : location.pathname.startsWith(to);
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs"
                  style={
                    isActive
                      ? { background: C.activeChildBg, color: C.activeText, fontWeight: 600 }
                      : { color: C.textSecondary }
                  }
                  onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
                  onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="font-medium">{label}</span>
                  {isActive && <ChevronRight size={10} className="ml-auto opacity-60" />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const location    = useLocation();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const C           = useSidebarColors(isDark);

  // Read unread count from Redux (kept fresh by useUnreadCount in TopBar)
  const unreadCount = useSelector((s: RootState) => s.notifications.unreadCount);

const isNotifActive = location.pathname === '/admin/notifications';

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-30"
      style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm"
            style={{ background: '#1A56A0', color: '#ffffff' }}
          >
            W
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight" style={{ color: C.textPrimary }}>
              Word House
            </span>
            <span
              className="ml-1.5 text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ color: C.textMuted, background: C.adminBadgeBg }}
            >
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => (
          <div key={group.group}>
            <p
              className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-1.5"
              style={{ color: C.textMuted }}
            >
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                if (item.children?.length) {
                  return <ExpandableItem key={item.to} item={item} C={C} />;
                }

                const isActive =
                  item.to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.to);

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer"
                      style={
                        isActive
                          ? { background: C.activeBg, color: C.activeText, borderLeft: `2.5px solid ${C.activeBorder}`, paddingLeft: '10px' }
                          : { color: C.textSecondary }
                      }
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && <ChevronRight size={12} className="ml-auto opacity-60" />}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="px-3 pb-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>

        {/* Notifications nav row — matches existing nav item style exactly */}
        <button
          onClick={() => navigate('/admin/notifications')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 transition-colors"
          style={
            isNotifActive
              ? {
                  background:  C.activeBg,
                  color:       C.activeText,
                  borderLeft:  `2.5px solid ${C.activeBorder}`,
                  paddingLeft: '10px',
                }
              : { color: C.textSecondary }
          }
          onMouseEnter={(e) => {
            if (!isNotifActive)
              (e.currentTarget as HTMLElement).style.background = C.hoverBg;
          }}
          onMouseLeave={(e) => {
            if (!isNotifActive)
              (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          {/* Bell with inline unread badge */}
          <span className="relative flex-shrink-0">
            <Bell size={16} strokeWidth={isNotifActive ? 2.5 : 2} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] rounded-full flex items-center justify-center text-bg-base font-bold leading-none"
                style={{
                  background:   '#C41E3A',
                  fontSize:     '9px',
                  paddingLeft:  unreadCount > 9 ? '3px' : '0',
                  paddingRight: unreadCount > 9 ? '3px' : '0',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>

          <span className="font-medium flex-1 text-left">Notifications</span>

          {/* Unread count pill (shown when there are unreads and page is not active) */}
          {unreadCount > 0 && !isNotifActive && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-bg-base leading-none"
              style={{ background: '#C41E3A' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {isNotifActive && <ChevronRight size={12} className="ml-auto opacity-60" />}
        </button>

        {/* Quick-access bell dropdown — same row, sits below the nav item */}
        <div className="flex items-center justify-between px-1 mt-0.5">
          <p className="text-[10px] font-mono" style={{ color: C.textMuted }}>
            Word House v1.0
          </p>
          {/* Floating bell for quick preview without leaving current page */}
          <NotificationDropdown variant="sidebar" />
        </div>

      </div>
    </aside>
  );
}