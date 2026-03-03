import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { OfflineBanner } from './offline-banner';

export function AppLayout() {
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
