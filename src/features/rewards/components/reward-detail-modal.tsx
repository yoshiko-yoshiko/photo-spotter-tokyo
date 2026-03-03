import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Gift, Lock, Ticket } from 'lucide-react';
import type { RewardDetailModalProps } from '@/features/rewards/types';

export function RewardDetailModal({ open, onClose, reward, isUnlocked, stampCount, usedAt }: RewardDetailModalProps) {
  if (!reward) return null;

  const progress = Math.min(100, (stampCount / reward.required_count) * 100);
  const isBadge = reward.type === 'badge';
  const isCoupon = reward.type === 'coupon';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[340px] rounded-2xl p-0 overflow-hidden border-none">
        {/* Hero */}
        <div className={`relative flex items-center justify-center py-8 ${
          isUnlocked ? 'bg-gradient-to-b from-stamp-gold/20 to-stamp-gold/5' : 'bg-gradient-to-b from-muted to-surface'
        }`}>
          {isUnlocked && isBadge && reward.badge_image_url ? (
            <img src={reward.badge_image_url} alt={reward.name} className="w-24 h-24 object-contain drop-shadow-lg" />
          ) : isUnlocked && isCoupon && reward.coupon_image_url ? (
            <img src={reward.coupon_image_url} alt={reward.name} className="w-full max-w-[280px] h-auto rounded-xl shadow-md" />
          ) : isUnlocked ? (
            <div className="w-20 h-20 rounded-full bg-stamp-gold/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-stamp-gold" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-3 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-center text-base font-bold text-foreground">{reward.name}</DialogTitle>
          </DialogHeader>

          {/* Type badge */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
              isBadge ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
            }`}>
              {isBadge ? <Trophy className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
              {isBadge ? 'バッジ' : 'クーポン'}
            </span>
          </div>

          {reward.description && (
            <p className="text-sm text-muted-foreground text-center">{reward.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">進捗</span>
              <span className={`font-bold ${isUnlocked ? 'text-stamp-gold' : 'text-primary'}`}>
                {Math.min(stampCount, reward.required_count)} / {reward.required_count}
              </span>
            </div>
            <div className="bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`rounded-full h-2 transition-all duration-500 ${isUnlocked ? 'bg-stamp-gold' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status */}
          {isUnlocked && (
            <div className="text-center">
              {usedAt ? (
                <span className="text-xs text-muted-foreground">使用済み</span>
              ) : isCoupon ? (
                <span className="text-xs text-stamp-gold font-medium">🎟 クーポンを利用できます</span>
              ) : (
                <span className="text-xs text-stamp-gold font-medium">🏅 バッジ獲得済み！</span>
              )}
            </div>
          )}

          {!isUnlocked && (
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                あと {reward.required_count - stampCount} スタンプで獲得
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
