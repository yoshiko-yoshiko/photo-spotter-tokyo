import { useState } from 'react';
import { MoreVertical, Flag, Ban, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useReportPhoto, useBlockUser } from '@/features/photos/hooks/use-photos';
import { toast } from 'sonner';

const REPORT_REASONS = [
  '不適切なコンテンツ',
  'スパム・宣伝',
  '著作権侵害',
  'スポットと無関係',
  'その他',
];

interface PhotoActionsMenuProps {
  photoId: string;
  photoUserId: string;
}

export function PhotoActionsMenu({ photoId, photoUserId }: PhotoActionsMenuProps) {
  const { user } = useAuth();
  const reportPhoto = useReportPhoto();
  const blockUser = useBlockUser();

  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const handleReport = async () => {
    if (!user || !reportReason) return;
    try {
      await reportPhoto.mutateAsync({
        photoId,
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
      await blockUser.mutateAsync(photoUserId);
      toast.success('ユーザーをブロックしました');
      setShowBlockConfirm(false);
      setShowMenu(false);
    } catch {
      toast.error('ブロックに失敗しました');
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          aria-label="メニュー"
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
    </>
  );
}
