import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { fetchMe } from '../store/slices/authSlice';
import Spinner from '../components/ui/Spinner';

const ALLOWED_ADMIN_ROLES = new Set([
  'super_admin',
  'pastor',
  'admin',
  'department_head',
  'accountant',
  'media_manager',
  'follow_up_team',
]);

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, accessToken, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (accessToken && !user) {
      dispatch(fetchMe());
    }
  }, [accessToken, user, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!accessToken) return <Navigate to="/login" replace />;

  if (accessToken && !user) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user && !ALLOWED_ADMIN_ROLES.has(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
