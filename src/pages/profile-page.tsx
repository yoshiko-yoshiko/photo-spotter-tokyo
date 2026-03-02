import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Info, Edit2, Camera, MapPin, Award, Flame } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRewards, useUserRewards } from '@/hooks/use-rewards';
import { supabase } from '@/integrations/supabase/client';
import { AuthPromptModal } from '@/components/auth/auth-prompt-modal';

interface ProfileStats {
  stampCount: number;
  photoCount: number;
  spotCount: number;
  rewardCount: number;
}

export default function ProfilePage() {
  const { user, isGuest, isAuthenticated, signOut, linkGoogle } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ nickname: string; avatar_url: string | null } | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ stampCount: 0, photoCount: 0, spotCount: 0, rewardCount: 0 });
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: allRewards } = useRewards();
  const { data: userRewards } = useUserRewards();

  useEffect(() => {
    if (!user) return;

    supabase.from('users').select('nickname, avatar_url').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setNewName(data.nickname);
        }
      });

    // Fetch all stats in parallel
    Promise.all([
      supabase.from('stamps').select('id, spot_id').eq('user_id', user.id),
      supabase.from('photos').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('deleted_at', null),
      supabase.from('user_rewards').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([stampsRes, photosRes, rewardsRes]) => {
      const stamps = stampsRes.data || [];
      const uniqueSpots = new Set(stamps.map(s => s.spot_id));
      setStats({
        stampCount: stamps.length,
        photoCount: photosRes.count || 0,
        spotCount: uniqueSpots.size,
        rewardCount: rewardsRes.count || 0,
      });
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
    <div className="bg-surface min-h-full pb-24">
      {/* Header */}
      <div className="bg-card px-4 pt-8 pb-6 text-center">
        <div className="mx-auto w-24 h-24 rounded-full border-4 border-primary/20 bg-muted flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground mt-3 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] mx-auto">
          {displayName}
        </h2>
        {!isGuest && user?.email && (
          <p className="text-sm text-muted-foreground">{user.email}</p>
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
      <div className="mx-4 mt-4 grid grid-cols-4 gap-2">
        {statItems.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <Icon className={`w-5 h-5 mx-auto ${color}`} />
            <p className="text-xl font-bold text-foreground mt-1">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Stamp progress */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-foreground">{stats.stampCount} / 10 スタンプ</span>
        </div>
        <div className="bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary rounded-full h-3 transition-all duration-500"
            style={{ width: `${Math.min((stats.stampCount / 10) * 100, 100)}%` }}
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
          <div className="grid grid-cols-3 gap-3">
            {allRewards.map(reward => {
              const isUnlocked = unlockedRewardIds.has(reward.id);
              return (
                <div
                  key={reward.id}
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
                </div>
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
              maxLength={15}
              className="w-full rounded-lg border border-border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{newName.length}/15</p>
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

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
