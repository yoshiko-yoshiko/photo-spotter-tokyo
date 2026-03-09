import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Newspaper, Camera, Grid3X3, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';

const tabs = [
  { path: '/map', icon: MapPin, label: '探す' },
  { path: '/timeline', icon: Newspaper, label: 'タイムライン' },
  { path: '/camera', icon: Camera, label: '撮る', isFab: true },
  { path: '/collection', icon: Grid3X3, label: 'コレクション' },
  { path: '/profile', icon: User, label: 'マイページ' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleTab = (path: string, isFab?: boolean) => {
    if (isFab && isGuest) {
      setShowAuthModal(true);
      return;
    }
    navigate(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg h-16 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-full">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            if (tab.isFab) {
              return (
                <button
                  type="button"
                  key={tab.path}
                  onClick={() => handleTab(tab.path, true)}
                  aria-label={tab.label}
                  className="flex flex-col items-center -mt-4"
                >
                  <div className="bg-accent rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <span className="text-accent text-xs mt-1 font-medium">{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                type="button"
                key={tab.path}
                onClick={() => handleTab(tab.path)}
                aria-label={tab.label}
                className="flex flex-col items-center gap-0.5"
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
