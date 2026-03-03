import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpots } from '@/features/spots/hooks/use-spots';
import { useUserStamps } from '@/features/spots/hooks/use-user-stamps';
import { useAuth } from '@/utils/hooks/use-auth';
import { useRewards, useUserRewards } from '@/features/rewards/hooks/use-rewards';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { RewardDetailModal } from '@/features/rewards/components/reward-detail-modal';
import { CATEGORY_COLORS } from '@/features/map/lib/map-utils';
import { Camera, Gift, Lock, Check, Trophy, Ticket } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

export default function CollectionPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { data: spots = [], isLoading: spotsLoading } = useSpots();
  const { data: stamps = [], isLoading: stampsLoading } = useUserStamps();
  const { data: rewards = [], isLoading: rewardsLoading } = useRewards();
  const { data: userRewards = [], isLoading: userRewardsLoading } = useUserRewards();
  const isLoading = spotsLoading || stampsLoading || rewardsLoading || userRewardsLoading;
  const [tab, setTab] = useState<'stamps' | 'rewards'>('stamps');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Tables<'rewards'> | null>(null);

  const stampedSpotIds = new Set(stamps.map(s => s.spot_id));
  const unlockedRewardIds = new Set(userRewards.map(ur => ur.reward_id));
  const stampCount = stamps.length;
  const totalSpots = spots.length;
  const progress = totalSpots > 0 ? Math.round((stampCount / totalSpots) * 100) : 0;

  const selectedUserReward = userRewards.find(ur => ur.reward_id === selectedReward?.id);

  if (isGuest) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-surface px-4 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground">ログインが必要です</h2>
        <p className="text-muted-foreground text-sm mt-2">スタンプ帳を見るにはログインしてください</p>
        <button onClick={() => setShowAuthModal(true)} className="mt-4 rounded-full bg-primary text-primary-foreground px-6 py-2.5 font-medium">
          Googleでログイン
        </button>
        <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-full pb-4">
      {/* Header */}
      <div className="bg-card px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">📒 コレクション</h1>
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">コンプリート率</span>
            <span className="text-lg font-bold text-primary">{stampCount} / {totalSpots}</span>
          </div>
          <div className="bg-muted rounded-full h-3 overflow-hidden">
            <div className="bg-primary rounded-full h-3 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => setTab('stamps')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            tab === 'stamps' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-1" /> スタンプ帳
        </button>
        <button
          onClick={() => setTab('rewards')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
            tab === 'rewards' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
          }`}
        >
          <Gift className="w-4 h-4 inline mr-1" /> 報酬
          {userRewards.length > 0 && (
            <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Stamps Grid */}
      {tab === 'stamps' && isLoading && (
        <div className="px-3 pt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <Skeleton className="aspect-square w-full" />
              <div className="p-1.5 bg-card">
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'stamps' && !isLoading && (
        <div className="px-3 pt-4 grid grid-cols-3 gap-2">
          {spots.map(spot => {
            const isCollected = stampedSpotIds.has(spot.id);
            const color = CATEGORY_COLORS[spot.category] || '#0D9488';
            return (
              <button
                key={spot.id}
                onClick={() => navigate(`/spots/${spot.id}`)}
                className={`rounded-xl overflow-hidden border transition-all ${
                  isCollected ? 'border-primary shadow-sm' : 'border-border opacity-50 grayscale'
                }`}
              >
                <div className="relative aspect-square bg-muted">
                  {spot.image_url ? (
                    <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                  {isCollected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-stamp-gold flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  {!isCollected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="p-1.5 bg-card">
                  <p className="text-[10px] font-medium text-foreground truncate">{spot.name}</p>
                  <div className="w-full h-0.5 rounded-full mt-0.5" style={{ background: color }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Rewards */}
      {tab === 'rewards' && (
        <div className="px-4 pt-4 space-y-3">
          {rewards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">報酬はまだありません</div>
          ) : (
            rewards.map(reward => {
              const isUnlocked = unlockedRewardIds.has(reward.id);
              const canUnlock = stampCount >= reward.required_count;
              const isBadge = reward.type === 'badge';
              return (
                <button
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
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
                        <img src={reward.badge_image_url} alt="" className="w-8 h-8 object-contain" />
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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                          isBadge ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        }`}>
                          {isBadge ? <Trophy className="w-2.5 h-2.5" /> : <Ticket className="w-2.5 h-2.5" />}
                          {isBadge ? 'バッジ' : 'クーポン'}
                        </span>
                        {reward.description && (
                          <p className="text-xs text-muted-foreground truncate">{reward.description}</p>
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
            })
          )}
        </div>
      )}

      {/* Reward Detail Modal */}
      <RewardDetailModal
        open={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        reward={selectedReward}
        isUnlocked={selectedReward ? unlockedRewardIds.has(selectedReward.id) : false}
        stampCount={stampCount}
        usedAt={selectedUserReward?.used_at}
      />
    </div>
  );
}
