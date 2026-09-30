import { Outlet } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <PublicHeader />
      <main className="pt-20">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
