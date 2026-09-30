import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTheme } from '../../context/ThemeContext';

export default function AppLayout() {
  const { isDark } = useTheme();

  return (
    <div
      className="admin-shell min-h-screen"
      style={{
        background: isDark ? '#0d1117' : '#e8ecf2',
        color: isDark ? '#f0f6fc' : '#0a0f1a',
      }}
    >
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