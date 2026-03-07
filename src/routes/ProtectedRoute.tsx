import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { fetchMe } from '../store/slices/authSlice';
import Spinner from '../components/ui/Spinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, accessToken } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (accessToken && !isAuthenticated) {
      dispatch(fetchMe());
    }
  }, [accessToken, isAuthenticated, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!accessToken) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
