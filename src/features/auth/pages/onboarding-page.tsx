import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, Award } from 'lucide-react';

const steps = [
  {
    icon: MapPin,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    title: 'フォトスポットを探そう',
    description: '東京都内の厳選フォトスポットを地図から探せます',
  },
  {
    icon: Camera,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
    title: '撮影ガイド付き！',
    description: '各スポットの撮影ガイドを参考に、ベストショットを撮ろう',
  },
  {
    icon: Award,
    iconColor: 'text-stamp-gold',
    iconBg: 'bg-stamp-gold/10',
    title: 'スタンプを集めよう',
    description: '写真を投稿してスタンプをGET！バッジやクーポンを獲得！',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const finish = () => {
    localStorage.setItem('photo_spotter_onboarding_done', 'true');
    navigate('/map', { replace: true });
  };

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="app-container min-h-[100dvh] flex flex-col bg-background md:max-w-lg md:mx-auto">
      <div className="flex justify-end p-4">
        <button onClick={finish} className="text-muted-foreground text-sm">
          スキップ
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className={`w-24 h-24 rounded-full ${current.iconBg} flex items-center justify-center mb-6 animate-fade-in`}>
          <Icon className={`w-12 h-12 ${current.iconColor}`} />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3 animate-fade-in">{current.title}</h2>
        <p className="text-muted-foreground animate-fade-in">{current.description}</p>
      </div>

      <div className="p-8 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>

        <button
          onClick={step < steps.length - 1 ? () => setStep(step + 1) : finish}
          className="w-full rounded-full bg-primary hover:bg-primary-light text-primary-foreground py-3 font-medium transition-colors"
        >
          {step < steps.length - 1 ? '次へ' : 'はじめる'}
        </button>
      </div>
    </div>
  );
}
