import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';

export function AppLayout() {
  return (
    <div className="app-container bg-background">
      <div className="h-[calc(100dvh-64px)] overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
