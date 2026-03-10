import { Award } from 'lucide-react';
import type { Tables } from '@/lib/supabase/types';

interface ProfileBadgesProps {
  rewards: Tables<'rewards'>[];
  unlockedRewardIds: Set<string>;
  onSelectReward: (reward: Tables<'rewards'>) => void;
}

export function ProfileBadges({ rewards, unlockedRewardIds, onSelectReward }: ProfileBadgesProps) {
  if (!rewards.length) return null;

  return (
    <div className="mx-4 mt-4">
      <h3 className="text-base font-bold text-foreground mb-3">🏆 獲得バッジ</h3>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {rewards.map(reward => {
          const isUnlocked = unlockedRewardIds.has(reward.id);
          return (
            <button
              type="button"
              key={reward.id}
              onClick={() => onSelectReward(reward)}
              className={`rounded-2xl border p-3 text-center transition-all ${
                isUnlocked
                  ? 'bg-card border-stamp-gold/40 shadow-sm'
                  : 'bg-muted/50 border-border opacity-60'
              }`}
            >
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center overflow-hidden ${
                isUnlocked ? 'ring-2 ring-stamp-gold/50' : 'grayscale'
              }`}>
                {reward.badge_image_url ? (
                  <img
                    src={reward.badge_image_url}
                    alt={reward.name}
                    className={`w-full h-full object-cover ${!isUnlocked ? 'grayscale' : ''}`}
                  />
                ) : (
                  <Award className={`w-7 h-7 ${isUnlocked ? 'text-stamp-gold' : 'text-muted-foreground'}`} />
                )}
              </div>
              <p className="text-xs font-medium text-foreground mt-2 line-clamp-1">{reward.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {isUnlocked ? '獲得済み ✓' : `${reward.required_count}スタンプ`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
