import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';

export function AppLayout() {
  return (
    <div className="app-container bg-background">
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
