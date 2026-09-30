/**
 * ChurchOS — src/components/layout/TopBar.tsx
 * Includes light / dark mode toggle + live notification bell.
 */

import { Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { logoutUser } from '../../store/slices/authSlice';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from '../../features/notifications/NotificationDropdown';
import { useUnreadCount } from '../../hooks/useNotifications';

export default function TopBar() {
  const { user }   = useAppSelector((s) => s.auth);
  const dispatch   = useAppDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();

  // ── Start polling unread count — syncs badge into Redux for
  //    both TopBar bell and Sidebar bell simultaneously ──────────────────────
  useUnreadCount();

  const initials = user?.member
    ? `${user.member.firstName[0]}${user.member.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() ?? 'A';

  const displayName = user?.member
    ? user.member.firstName
    : user?.role?.replace('_', ' ') ?? 'Admin';

  return (
    <header className="fixed top-0 left-[220px] right-0 h-14 bg-bg-surface border-b border-bg-border flex items-center justify-between px-6 z-20">
      {/* Date */}
      <div className="text-text-muted text-sm font-mono">
        {format(new Date(), 'EEE, dd MMM yyyy')}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">

        {/* ── Light / Dark Toggle ────────────────────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: isDark ? 'rgba(74,143,212,0.12)' : 'rgba(26,86,160,0.1)',
            border:     isDark ? '1px solid rgba(74,143,212,0.25)' : '1px solid rgba(26,86,160,0.2)',
          }}
        >
          {isDark
            ? <Sun  size={15} style={{ color: '#4A8FD4' }} />
            : <Moon size={15} style={{ color: '#1A56A0' }} />
          }
        </button>

        {/* ── Live notification bell ─────────────────────────────────────── */}
        <NotificationDropdown variant="topbar" />

        {/* ── Avatar + dropdown ──────────────────────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-bg-base overflow-hidden transition-all"
            style={{ background: '#1A56A0' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#164882'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#1A56A0'; }}
          >
            {user?.member?.photoUrl
              ? <img src={user.member.photoUrl} alt="" className="w-full h-full object-cover rounded-lg" />
              : initials
            }
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-bg-card border border-bg-border rounded-xl shadow-modal py-1 animate-slide-up">
              <div className="px-3 py-2 border-b border-bg-border">
                <p className="text-text-primary text-sm font-medium capitalize">{displayName}</p>
                <p className="text-text-muted text-xs">{user?.email}</p>
              </div>

              {/* Theme toggle (also accessible from menu) */}
              <button
                onClick={() => { toggleTheme(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover transition-colors flex items-center gap-2"
              >
                {isDark
                  ? <><Sun  size={13} style={{ color: '#4A8FD4' }} /> Light mode</>
                  : <><Moon size={13} style={{ color: '#1A56A0' }} /> Dark mode</>
                }
              </button>

              <button
                onClick={() => { setMenuOpen(false); dispatch(logoutUser()); }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-bg-hover transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}