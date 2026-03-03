import { useState } from 'react';
import { useAuth } from '@/utils/hooks/use-auth';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, isGuest, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || isGuest) {
    return (
      <>
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 text-center">
          <p className="text-muted-foreground mb-4">この機能を使うにはログインが必要です</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-full bg-primary text-primary-foreground px-6 py-2 text-sm font-medium"
          >
            ログインする
          </button>
        </div>
        <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return <>{children}</>;
}
