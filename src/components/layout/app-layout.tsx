import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { DebugGpsPanel } from '@/features/debug/components/debug-gps-panel';

export function AppLayout() {
  return (
    <div className="app-container bg-background">
      <DebugGpsPanel />
      <div className="h-[calc(100dvh-64px)] overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
