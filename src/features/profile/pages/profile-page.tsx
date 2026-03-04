import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Info, Edit2, FileText, Camera, MapPin, Award, Flame } from 'lucide-react';
import { AvatarImage } from '@/components/ui/avatar-image';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRewards, useUserRewards } from '@/features/rewards/hooks/use-rewards';
import { supabase } from '@/lib/supabase/client';
import { AuthPromptModal } from '@/features/auth/components/auth-prompt-modal';
import { RewardDetailModal } from '@/features/rewards/components/reward-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/lib/supabase/types';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import type { ProfileStats, UserProfile } from '../types';
import { LIMITS } from '@/lib/constants';

export default function ProfilePage() {
  const { user, isGuest, isAuthenticated, signOut, linkGoogle } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ stampCount: 0, photoCount: 0, spotCount: 0, rewardCount: 0 });
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Tables<'rewards'> | null>(null);
  const [totalSpots, setTotalSpots] = useState(10);
  const [loading, setLoading] = useState(true);

  const { data: allRewards } = useRewards();
  const { data: userRewards } = useUserRewards();

  useEffect(() => {
    if (!user) return;

    supabase.from('users').select('nickname, avatar_url, bio').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setNewName(data.nickname);
          setNewBio(data.bio || '');
        }
      });

    // Fetch all stats in parallel
    Promise.all([
      supabase.from('stamps').select('id, spot_id').eq('user_id', user.id),
      supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
      supabase.from('user_rewards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('spots').select('id', { count: 'exact', head: true }),
    ]).then(([stampsRes, photosRes, rewardsRes, spotsRes]) => {
      const stamps = stampsRes.data || [];
      const uniqueSpots = new Set(stamps.map(s => s.spot_id));
      setStats({
        stampCount: stamps.length,
        photoCount: photosRes.count || 0,
        spotCount: uniqueSpots.size,
        rewardCount: rewardsRes.count || 0,
      });
      if (spotsRes.count != null) setTotalSpots(spotsRes.count);
      setLoading(false);
    });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    await supabase.from('users').update({ nickname: newName.trim() }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, nickname: newName.trim() } : prev);
    setEditingName(false);
  };

  const handleSaveBio = async () => {
    if (!user) return;
    const bio = newBio.trim() || null;
    await supabase.from('users').update({ bio }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, bio } : prev);
    setEditingBio(false);
  };

  const displayName = isGuest ? 'ゲスト' : (profile?.nickname || 'ユーザー');
  const avatarUrl = profile?.avatar_url;

  const unlockedRewardIds = new Set((userRewards || []).map(ur => ur.reward_id));

  const statItems = [
    { icon: Flame, label: 'スタンプ', value: stats.stampCount, color: 'text-primary' },
    { icon: Camera, label: '写真', value: stats.photoCount, color: 'text-accent' },
    { icon: MapPin, label: 'スポット', value: stats.spotCount, color: 'text-primary-light' },
    { icon: Award, label: 'リワード', value: stats.rewardCount, color: 'text-stamp-gold' },
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
        <div className="mx-auto border-4 border-primary/20 rounded-full">
          <AvatarImage src={avatarUrl} fallback={displayName} className="w-24 h-24" iconSize="w-10 h-10" />
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
          <span className="text-lg font-bold text-foreground">{stats.stampCount} / {totalSpots} スタンプ</span>
        </div>
        <div className="bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary rounded-full h-3 transition-all duration-500"
            style={{ width: `${totalSpots > 0 ? Math.min((stats.stampCount / totalSpots) * 100, 100) : 0}%` }}
          />
        </div>
        <button
          onClick={() => navigate('/collection')}
          className="text-primary text-sm mt-2 inline-block"
        >
          スタンプ帳を見る →
        </button>
      </div>

      {/* Badges section */}
      {allRewards && allRewards.length > 0 && (
        <div className="mx-4 mt-4">
          <h3 className="text-base font-bold text-foreground mb-3">🏆 獲得バッジ</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {allRewards.map(reward => {
              const isUnlocked = unlockedRewardIds.has(reward.id);
              return (
                <button
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className={`rounded-2xl border p-3 text-center transition-all ${
                    isUnlocked
                      ? 'bg-card border-stamp-gold/40 shadow-sm'
                      : 'bg-muted/50 border-border opacity-50'
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
      )}

      {/* Settings */}
      {isAuthenticated && (
        <div className="mx-4 mt-4 rounded-2xl bg-card border border-border divide-y divide-border">
          <button
            onClick={() => setEditingName(true)}
            className="w-full flex items-center gap-3 p-4 text-left"
          >
            <Edit2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">表示名の変更</span>
          </button>
          <button
            onClick={() => setEditingBio(true)}
            className="w-full flex items-center gap-3 p-4 text-left"
          >
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">自己紹介の編集</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 text-left">
            <LogOut className="w-5 h-5 text-muted-foreground" />
            <span className="text-foreground">ログアウト</span>
          </button>
          <div className="flex items-center gap-3 p-4">
            <Info className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">バージョン 1.0.0</span>
          </div>
        </div>
      )}

      {/* Edit name modal */}
      {editingName && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-foreground mb-4">表示名の変更</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={LIMITS.NICKNAME_DISPLAY_MAX}
              className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{newName.length}/{LIMITS.NICKNAME_DISPLAY_MAX}</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditingName(false)} className="flex-1 rounded-full border-2 border-primary text-primary py-2 font-medium">
                キャンセル
              </button>
              <button onClick={handleSaveName} className="flex-1 rounded-full bg-primary text-primary-foreground py-2 font-medium">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit bio modal */}
      {editingBio && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-foreground mb-4">自己紹介の編集</h3>
            <textarea
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              maxLength={LIMITS.BIO_MAX}
              rows={3}
              placeholder="自己紹介を入力..."
              className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{newBio.length}/{LIMITS.BIO_MAX}</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditingBio(false)} className="flex-1 rounded-full border-2 border-primary text-primary py-2 font-medium">
                キャンセル
              </button>
              <button onClick={handleSaveBio} className="flex-1 rounded-full bg-primary text-primary-foreground py-2 font-medium">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <RewardDetailModal
        open={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        reward={selectedReward}
        isUnlocked={selectedReward ? unlockedRewardIds.has(selectedReward.id) : false}
        stampCount={stats.stampCount}
        usedAt={(userRewards || []).find(ur => ur.reward_id === selectedReward?.id)?.used_at}
      />
    </div>
  );
}
