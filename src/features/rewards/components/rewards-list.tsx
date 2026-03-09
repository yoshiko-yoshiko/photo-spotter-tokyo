import { Gift, Lock, Trophy, Ticket } from 'lucide-react';
import type { Tables } from '@/lib/supabase/types';

interface RewardsListProps {
  rewards: Tables<'rewards'>[];
  unlockedRewardIds: Set<string>;
  stampCount: number;
  onSelectReward: (reward: Tables<'rewards'>) => void;
}

export function RewardsList({ rewards, unlockedRewardIds, stampCount, onSelectReward }: RewardsListProps) {
  if (rewards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">報酬はまだありません</div>
    );
  }

  return (
    <>
      {rewards.map(reward => {
        const isUnlocked = unlockedRewardIds.has(reward.id);
        const canUnlock = stampCount >= reward.required_count;
        const isBadge = reward.type === 'badge';
        return (
          <button
            type="button"
            key={reward.id}
            onClick={() => onSelectReward(reward)}
            className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.98] ${
              isUnlocked
                ? 'border-stamp-gold bg-stamp-gold/5'
                : canUnlock
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isUnlocked ? 'bg-stamp-gold/20' : canUnlock ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {isUnlocked && isBadge && reward.badge_image_url ? (
                  <img src={reward.badge_image_url} alt={`${reward.name}のバッジ`} className="w-8 h-8 object-contain" />
                ) : isUnlocked ? (
                  <Trophy className="w-6 h-6 text-stamp-gold" />
                ) : canUnlock ? (
                  <Gift className="w-6 h-6 text-primary" />
                ) : (
                  <Lock className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">{reward.name}</h3>
                  {isUnlocked && (
                    <span className="text-xs bg-stamp-gold/20 text-stamp-gold px-2 py-0.5 rounded-full font-medium shrink-0">
                      獲得済み
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    isBadge ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                  }`}>
                    {isBadge ? <Trophy className="w-2.5 h-2.5 shrink-0" /> : <Ticket className="w-2.5 h-2.5 shrink-0" />}
                    {isBadge ? 'バッジ' : 'クーポン'}
                  </span>
                  {reward.description && (
                    <p className="text-xs text-muted-foreground truncate min-w-0">{reward.description}</p>
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      {Math.min(stampCount, reward.required_count)} / {reward.required_count} スタンプ
                    </span>
                  </div>
                  <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`rounded-full h-1.5 transition-all duration-500 ${
                        isUnlocked ? 'bg-stamp-gold' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, (stampCount / reward.required_count) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </>
  );
}
