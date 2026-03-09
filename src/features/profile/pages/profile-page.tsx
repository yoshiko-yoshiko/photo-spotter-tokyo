import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Info, Edit2, FileText, Camera, MapPin, Award, Flame, Moon, Sun } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTheme } from '@/lib/hooks/use-theme';
import { useRewards, useUserRewards } from '@/features/rewards/hooks/use-rewards';
import { useSpots } from '@/features/spots/hooks/use-spots';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { RewardDetailModal } from '@/features/rewards/components/reward-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/lib/supabase/types';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { useUserProfile } from '../hooks/use-user-profile';
import { useProfileStats } from '../hooks/use-profile-stats';
import { useUpdateNickname, useUpdateBio } from '../hooks/use-update-profile';
import { EditNameModal } from '../components/edit-name-modal';
import { EditBioModal } from '../components/edit-bio-modal';
import { ProfileBadges } from '../components/profile-badges';

export default function ProfilePage() {
  const { user, isGuest, isAuthenticated, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const updateNickname = useUpdateNickname();
  const updateBio = useUpdateBio();

  const { data: profile } = useUserProfile(user?.id);
  const { data: stats, isLoading: loading } = useProfileStats(user?.id);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Tables<'rewards'> | null>(null);

  const { data: allRewards } = useRewards();
  const { data: userRewards } = useUserRewards();
  const { data: allSpots } = useSpots();

  const totalSpots = allSpots?.length ?? 0;

  useEffect(() => {
    if (profile) {
      setNewName(profile.nickname);
      setNewBio(profile.bio || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleSaveName = () => {
    if (!newName.trim()) return;
    updateNickname.mutate(newName.trim());
    setEditingName(false);
  };

  const handleSaveBio = () => {
    updateBio.mutate(newBio);
    setEditingBio(false);
  };

  const displayName = isGuest ? 'ゲスト' : (profile?.nickname || 'ユーザー');
  const avatarUrl = profile?.avatar_url;

  const unlockedRewardIds = new Set((userRewards || []).map(ur => ur.reward_id));

  const currentStats = stats ?? { stampCount: 0, photoCount: 0, spotCount: 0, rewardCount: 0 };

  const statItems = [
    { icon: Flame, label: 'スタンプ', value: currentStats.stampCount, color: 'text-primary' },
    { icon: Camera, label: '写真', value: currentStats.photoCount, color: 'text-accent' },
    { icon: MapPin, label: 'スポット', value: currentStats.spotCount, color: 'text-primary-light' },
    { icon: Award, label: 'リワード', value: currentStats.rewardCount, color: 'text-stamp-gold' },
  ];

  return (
    <div className="bg-surface min-h-full pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-card px-4 md:px-8 pt-8 pb-6 text-center relative">
        {isAuthenticated && (
          <div className="absolute top-4 right-4">
            <NotificationBell />
          </div>
        )}
        <div className="w-[104px] h-[104px] mx-auto rounded-full border-4 border-primary/20 overflow-hidden">
          <AvatarImage src={avatarUrl} fallback={displayName} className="w-full h-full" iconSize="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-foreground mt-3 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] mx-auto">
          {displayName}
        </h2>
        {!isGuest && user?.email && (
          <p className="text-sm text-muted-foreground">{user.email}</p>
        )}
        {profile?.bio && (
          <p className="text-sm text-muted-foreground mt-1 px-6 line-clamp-2">{profile.bio}</p>
        )}
      </div>

      {/* Guest banner */}
      {isGuest && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-foreground font-medium mb-3">ログインしてスタンプを集めよう！</p>
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="rounded-full bg-primary text-primary-foreground px-6 py-2 text-sm font-medium"
          >
            Googleでログイン
          </button>
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="mx-4 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-3 text-center">
              <Skeleton className="w-5 h-5 mx-auto rounded-full" />
              <Skeleton className="h-6 w-10 mx-auto mt-1" />
              <Skeleton className="h-3 w-12 mx-auto mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-4 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {statItems.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <Icon className={`w-5 h-5 mx-auto ${color}`} />
              <p className="text-xl font-bold text-foreground mt-1">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stamp progress */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-foreground">{currentStats.stampCount} / {totalSpots} スタンプ</span>
        </div>
        <div className="bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary rounded-full h-3 transition-all duration-500"
            style={{ width: `${totalSpots > 0 ? Math.min((currentStats.stampCount / totalSpots) * 100, 100) : 0}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/collection')}
          className="text-primary text-sm mt-2 inline-block"
        >
          スタンプ帳を見る →
        </button>
      </div>

      {/* Badges section */}
      {allRewards && (
        <ProfileBadges
          rewards={allRewards}
          unlockedRewardIds={unlockedRewardIds}
          onSelectReward={setSelectedReward}
        />
      )}

      {/* Settings */}
      {isAuthenticated && (
        <div className="mx-4 mt-4 rounded-2xl bg-card border border-border divide-y divide-border">
          <button type="button" onClick={() => setEditingName(true)} className="w-full flex items-center gap-3 p-4 text-left">
            <Edit2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">表示名の変更</span>
          </button>
          <button type="button" onClick={() => setEditingBio(true)} className="w-full flex items-center gap-3 p-4 text-left">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">自己紹介の編集</span>
          </button>
          <button type="button" onClick={toggleTheme} className="w-full flex items-center gap-3 p-4 text-left">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
            <span className="text-foreground">{theme === 'dark' ? 'ライトモード' : 'ダークモード'}</span>
          </button>
          <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 p-4 text-left">
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">ログアウト</span>
          </button>
          <div className="flex items-center gap-3 p-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">バージョン 1.0.0</span>
          </div>
        </div>
      )}

      {/* Edit modals */}
      {editingName && (
        <EditNameModal
          name={newName}
          onNameChange={setNewName}
          onSave={handleSaveName}
          onCancel={() => setEditingName(false)}
        />
      )}
      {editingBio && (
        <EditBioModal
          bio={newBio}
          onBioChange={setNewBio}
          onSave={handleSaveBio}
          onCancel={() => setEditingBio(false)}
        />
      )}

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <RewardDetailModal
        open={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        reward={selectedReward}
        isUnlocked={selectedReward ? unlockedRewardIds.has(selectedReward.id) : false}
        stampCount={currentStats.stampCount}
        usedAt={(userRewards || []).find(ur => ur.reward_id === selectedReward?.id)?.used_at}
      />
    </div>
  );
}
