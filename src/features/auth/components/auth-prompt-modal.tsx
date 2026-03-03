import { useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { useAuth } from '@/utils/hooks/use-auth';
import { toast } from 'sonner';

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthPromptModal({ open, onClose }: AuthPromptModalProps) {
  const { linkGoogle, signInWithGoogle, isGuest } = useAuth();

  useEffect(() => {
    if (open) {
      history.pushState({}, '', window.location.href);
      const handler = () => onClose();
      window.addEventListener('popstate', handler);
      return () => window.removeEventListener('popstate', handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  const handleLogin = async () => {
    try {
      if (isGuest) {
        await linkGoogle();
      } else {
        await signInWithGoogle();
      }
    } catch (e) {
      console.error('Login error:', e);
      toast.error('ログインに失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-sm animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center">
          <Camera className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-bold text-foreground">ログインして楽しもう！</h2>
          <p className="text-muted-foreground text-sm mt-2">
            写真を投稿してスタンプを集めるにはログインが必要です
          </p>
          <button
            onClick={handleLogin}
            className="mt-6 w-full rounded-full bg-primary hover:bg-primary-light text-primary-foreground py-3 font-medium transition-colors"
          >
            Googleでログイン
          </button>
          <button onClick={onClose} className="mt-4 text-muted-foreground text-sm">
            あとで
          </button>
        </div>
      </div>
    </div>
  );
}
