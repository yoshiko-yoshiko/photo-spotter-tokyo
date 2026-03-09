import { useState } from 'react';
import { useSpots } from '@/features/spots/hooks/use-spots';
import { useSpotIdMap } from '@/features/spots/hooks/use-spot-id-map';
import { useUserStamps } from '@/features/spots/hooks/use-user-stamps';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRewards, useUserRewards } from '@/features/rewards/hooks/use-rewards';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { RewardDetailModal } from '@/features/rewards/components/reward-detail-modal';
import { StampsGrid } from '@/features/rewards/components/stamps-grid';
import { RewardsList } from '@/features/rewards/components/rewards-list';
import { Camera, Gift, Lock } from 'lucide-react';
import type { Tables } from '@/lib/supabase/types';

export default function CollectionPage() {
  const { isGuest } = useAuth();
  const { data: spots = [], isLoading: spotsLoading } = useSpots();
  const { data: idMap } = useSpotIdMap();
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
        <button type="button" onClick={() => setShowAuthModal(true)} className="mt-4 rounded-full bg-primary text-primary-foreground px-6 py-2.5 font-medium">
          Googleでログイン
        </button>
        <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-full pb-4">
      {/* Header */}
      <div className="bg-card px-4 md:px-8 pt-6 pb-4 border-b border-border max-w-4xl mx-auto">
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
      <div className="flex border-b border-border bg-card max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setTab('stamps')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            tab === 'stamps' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-1" /> スタンプ帳
        </button>
        <button
          type="button"
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

      {/* Tab content */}
      {tab === 'stamps' && (
        <StampsGrid
          spots={spots}
          stampedSpotIds={stampedSpotIds}
          idMap={idMap}
          isLoading={isLoading}
        />
      )}
      {tab === 'rewards' && (
        <div className="px-4 md:px-8 pt-4 space-y-3 max-w-4xl mx-auto">
          <RewardsList
            rewards={rewards}
            unlockedRewardIds={unlockedRewardIds}
            stampCount={stampCount}
            onSelectReward={setSelectedReward}
          />
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
