import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Info, Edit2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { AuthPromptModal } from '@/components/auth/auth-prompt-modal';

export default function ProfilePage() {
  const { user, isGuest, isAuthenticated, signOut, linkGoogle } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ nickname: string; avatar_url: string | null } | null>(null);
  const [stampCount, setStampCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('users').select('nickname, avatar_url').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setNewName(data.nickname);
        }
      });
    supabase.from('stamps').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setStampCount(count || 0));
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

  return (
    <div className="h-[calc(100dvh-64px)] overflow-y-auto bg-surface">
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

      {/* Stamp progress */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-card border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-foreground">{stampCount} / 10 スタンプ</span>
        </div>
        <div className="bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary rounded-full h-3 transition-all duration-500"
            style={{ width: `${(stampCount / 10) * 100}%` }}
          />
        </div>
        <button
          onClick={() => navigate('/collection')}
          className="text-primary text-sm mt-2 inline-block"
        >
          スタンプ帳を見る →
        </button>
      </div>

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
