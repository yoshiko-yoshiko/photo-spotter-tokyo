import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useAuth } from '@/utils/hooks/use-auth';

export default function SplashPage() {
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => setFadeOut(true), 1200);
    const nav = setTimeout(() => {
      if (session) {
        const onboardingDone = localStorage.getItem('photo_spotter_onboarding_done') === 'true';
        navigate(onboardingDone ? '/map' : '/onboarding', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 1700);
    return () => { clearTimeout(timer); clearTimeout(nav); };
  }, [loading, session, navigate]);

  return (
    <div
      className={`app-container min-h-[100dvh] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(to bottom right, hsl(174, 83%, 32%), hsl(174, 80%, 20%))' }}
    >
      <Camera className="w-20 h-20 text-primary-foreground mb-4" />
      <h1 className="text-primary-foreground text-2xl font-bold">フォトスポッター東京</h1>
      <p className="text-primary-foreground/70 text-sm mt-2">撮って、集めて、シェアしよう</p>
    </div>
  );
}
