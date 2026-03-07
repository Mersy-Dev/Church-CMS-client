import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar />
      <TopBar />
      <main className="ml-[220px] pt-14 min-h-screen">
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
