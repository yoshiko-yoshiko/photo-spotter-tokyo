import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { OfflineBanner } from './offline-banner';
import { useTheme } from '@/lib/hooks/use-theme';

export function AppLayout() {
  // Apply theme at root level so dark mode persists across all pages
  useTheme();

  return (
    <div className="app-container bg-background">
      <OfflineBanner />
      <div className="h-[calc(100dvh-64px)] overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
