import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarDays,
  ClipboardCheck,
  Building2,
  ChevronRight,
  ChevronDown,
  Home,
  GraduationCap,
  Heart,
  FileArchive,
  Radio,
  BookOpen,
  Share2,
  HeadphonesIcon,
  Mail,
  Wifi,
} from "lucide-react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavChild {
  to: string;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  children?: NavChild[];
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV: NavGroup[] = [
  {
    group: "MAIN",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "PEOPLE",
    items: [
      { to: "/members",  label: "Members",  icon: Users      },
      { to: "/visitors", label: "Visitors", icon: UserCheck  },
      { to: "/families", label: "Families", icon: Home       },
    ],
  },
  {
    group: "MINISTRY",
    items: [
      { to: "/events",     label: "Events & Calendar", icon: CalendarDays    },
      { to: "/attendance", label: "Attendance",         icon: ClipboardCheck  },
      { to: "/training",   label: "Training",           icon: GraduationCap   },
      {
        to: "/online-ministry",
        label: "Online Ministry",
        icon: Wifi,
        children: [
          { to: "/online-ministry",                 label: "Overview",       icon: LayoutDashboard },
          { to: "/online-ministry/streams",         label: "Livestreams",    icon: Radio           },
          { to: "/online-ministry/sermons",         label: "Sermon Library", icon: BookOpen        },
          { to: "/online-ministry/social-posts",    label: "Social Posts",   icon: Share2          },
          { to: "/online-ministry/converts",        label: "Converts",       icon: UserCheck       },
          { to: "/online-ministry/prayer-requests", label: "Prayer Wall",    icon: Heart           },
          { to: "/online-ministry/counselling",     label: "Counselling",    icon: HeadphonesIcon  },
          { to: "/online-ministry/visitors",        label: "Visitors",       icon: Users           },
          { to: "/online-ministry/newsletter",      label: "Newsletter",     icon: Mail            },
        ],
      },
    ],
  },
  {
    group: "PASTORAL",
    items: [{ to: "/welfare", label: "Welfare & Care", icon: Heart }],
  },
  {
    group: "RECORDS",
    items: [{ to: "/documents", label: "Documents", icon: FileArchive }],
  },
  {
    group: "ADMIN",
    items: [{ to: "/departments", label: "Departments", icon: Building2 }],
  },
];

// ─── Expandable Nav Item ──────────────────────────────────────────────────────

function ExpandableItem({ item }: { item: NavItem }) {
  const location = useLocation();

  // Auto-open if any child route is currently active
  const isChildActive = item.children?.some((c) =>
    c.to === "/online-ministry"
      ? location.pathname === "/online-ministry"
      : location.pathname.startsWith(c.to)
  );

  const [open, setOpen] = useState<boolean>(!!isChildActive);

  const isParentActive = location.pathname.startsWith(item.to);

  return (
    <li>
      {/* Parent button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer
          ${
            isParentActive
              ? "bg-gold/10 text-gold border-l-2 border-gold pl-[10px]"
              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          }`}
      >
        <item.icon size={16} strokeWidth={isParentActive ? 2.5 : 2} />
        <span className="font-medium flex-1 text-left">{item.label}</span>
        <ChevronDown
          size={13}
          className="opacity-60 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Children */}
      {open && (
        <ul className="mt-0.5 ml-3 pl-3 space-y-0.5" style={{ borderLeft: "1px solid var(--bg-border)" }}>
          {item.children!.map(({ to, label, icon: Icon }) => {
            const isActive =
              to === "/online-ministry"
                ? location.pathname === "/online-ministry"
                : location.pathname.startsWith(to);

            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-150
                    ${
                      isActive
                        ? "bg-gold/10 text-gold font-semibold"
                        : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`}
                >
                  <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="font-medium">{label}</span>
                  {isActive && (
                    <ChevronRight size={10} className="ml-auto opacity-60" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-bg-surface border-r border-bg-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-bg-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-bg-base font-display font-bold text-sm">
            C
          </div>
          <div>
            <span className="font-display font-bold text-text-primary text-base tracking-tight">
              ChurchOS
            </span>
            <span className="ml-1.5 text-xs text-text-muted bg-bg-hover px-1.5 py-0.5 rounded font-mono">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-semibold text-text-muted tracking-widest uppercase px-3 mb-1.5">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                // Render expandable item if it has children
                if (item.children?.length) {
                  return <ExpandableItem key={item.to} item={item} />;
                }

                // Regular nav item
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.to);

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer
                        ${
                          isActive
                            ? "bg-gold/10 text-gold border-l-2 border-gold pl-[10px]"
                            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                        }`}
                    >
                      <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <ChevronRight size={12} className="ml-auto opacity-60" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-bg-border">
        <p className="text-[10px] text-text-muted font-mono text-center">
          ChurchOS v1.0
        </p>
      </div>
    </aside>
  );
}