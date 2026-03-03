import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { OfflineBanner } from './offline-banner';
import { useDebugGps } from '@/features/debug/hooks/use-debug-gps';
import { DebugGpsPanel } from '@/features/debug/components/debug-gps-panel';

export function AppLayout() {
  const { isDebugMode } = useDebugGps();

  return (
    <div className="app-container bg-background">
      {isDebugMode && <DebugGpsPanel />}
      <OfflineBanner />
      <div className="h-[calc(100dvh-64px)] overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
