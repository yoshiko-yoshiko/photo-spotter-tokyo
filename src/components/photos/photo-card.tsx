import { useState, useRef } from 'react';
import { Heart, MoreVertical, Flag, Ban, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePhotoLikes, useToggleLike, useReportPhoto, useBlockUser } from '@/hooks/use-photos';
import { AuthPromptModal } from '@/components/auth/auth-prompt-modal';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type Photo = Tables<'photos'>;

interface PhotoCardProps {
  photo: Photo;
}

const REPORT_REASONS = [
  '不適切なコンテンツ',
  'スパム・宣伝',
  '著作権侵害',
  'スポットと無関係',
  'その他',
];

export function PhotoCard({ photo }: PhotoCardProps) {
  const { user, isGuest, isAuthenticated } = useAuth();
  const isLiked = usePhotoLikes(photo.id);
  const toggleLike = useToggleLike();
  const reportPhoto = useReportPhoto();
  const blockUser = useBlockUser();

  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const lastTapRef = useRef(0);

  const isOwnPhoto = user?.id === photo.user_id;

  const handleLike = () => {
    if (isGuest || !isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!isLiked) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 600);
    }
    toggleLike.mutate({ photoId: photo.id, isLiked });
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked) handleLike();
    }
    lastTapRef.current = now;
  };

  const optimisticCount = photo.likes_count + (isLiked ? 0 : 0);

  const handleReport = async () => {
    if (!user || !reportReason) return;
    try {
      await reportPhoto.mutateAsync({
        photoId: photo.id,
        reporterId: user.id,
        reason: reportReason,
        detail: reportDetail,
      });
      toast.success('通報を受け付けました');
      setShowReport(false);
      setReportReason('');
      setReportDetail('');
    } catch {
      toast.error('通報に失敗しました');
    }
  };

  const handleBlock = async () => {
    if (!user) return;
    try {
      await blockUser.mutateAsync(photo.user_id);
      toast.success('ユーザーをブロックしました');
      setShowBlockConfirm(false);
      setShowMenu(false);
    } catch {
      toast.error('ブロックに失敗しました');
    }
  };

  return (
    <>
      <div className="rounded-xl overflow-hidden border border-border bg-card">
        <div className="relative aspect-square bg-muted" onClick={handleDoubleTap}>
          <img
            src={photo.image_url}
            alt={photo.caption || 'Photo'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Heart burst animation on double-tap */}
          {heartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart className="w-16 h-16 fill-white text-white drop-shadow-lg animate-like-burst" />
            </div>
          )}
        </div>
        <div className="p-2.5">
          {photo.caption && (
            <p className="text-xs text-foreground line-clamp-2 mb-1.5">{photo.caption}</p>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className="flex items-center gap-1 text-xs transition-all active:scale-125"
            >
              <Heart
                className={`w-4 h-4 transition-all duration-200 ${
                  isLiked ? 'fill-destructive text-destructive scale-110' : 'text-muted-foreground'
                }`}
              />
              <span className={isLiked ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {photo.likes_count}
              </span>
            </button>

            {isAuthenticated && !isOwnPhoto && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-muted-foreground rounded-full hover:bg-muted"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 bottom-8 z-50 bg-card rounded-xl shadow-lg border border-border py-1 min-w-[140px]">
                      <button
                        onClick={() => { setShowReport(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Flag className="w-4 h-4 text-muted-foreground" /> 通報する
                      </button>
                      <button
                        onClick={() => { setShowBlockConfirm(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                      >
                        <Ban className="w-4 h-4" /> ブロック
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-xl p-5 w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">📢 通報する</h3>
              <button onClick={() => setShowReport(false)} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 text-sm border transition-colors ${
                    reportReason === reason
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-foreground'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            {reportReason === 'その他' && (
              <textarea
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="詳細を入力..."
                maxLength={200}
                className="w-full mt-3 rounded-lg border border-border px-3 py-2 text-sm bg-card focus:ring-2 focus:ring-primary focus:outline-none resize-none h-20"
              />
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowReport(false)} className="flex-1 rounded-full border-2 border-primary text-primary py-2 font-medium text-sm">
                キャンセル
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || reportPhoto.isPending}
                className="flex-1 rounded-full bg-destructive text-destructive-foreground py-2 font-medium text-sm disabled:opacity-50"
              >
                通報する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-xl p-5 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-bold text-foreground mb-2">⚠️ ユーザーをブロック</h3>
            <p className="text-sm text-muted-foreground mb-4">
              このユーザーの写真が表示されなくなります。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBlockConfirm(false)} className="flex-1 rounded-full border-2 border-primary text-primary py-2 font-medium text-sm">
                キャンセル
              </button>
              <button
                onClick={handleBlock}
                disabled={blockUser.isPending}
                className="flex-1 rounded-full bg-destructive text-destructive-foreground py-2 font-medium text-sm disabled:opacity-50"
              >
                ブロックする
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthPromptModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
