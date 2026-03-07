import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useAppSelector } from '../../hooks/useRedux';
import { useAppDispatch } from '../../hooks/useRedux';
import { logoutUser } from '../../store/slices/authSlice';
import { useState } from 'react';

export default function TopBar() {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center hover:bg-bg-border transition-colors">
          <Bell size={15} className="text-text-secondary" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-bg-base font-bold text-sm hover:bg-gold-light transition-colors"
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
