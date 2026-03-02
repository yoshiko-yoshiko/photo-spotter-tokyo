import { useEffect, useState } from 'react';
import { Trophy, Ticket, X } from 'lucide-react';

interface RewardUnlockOverlayProps {
  rewards: Array<{
    id: string;
    name: string;
    type: string;
    badge_image_url: string | null;
    description: string | null;
  }>;
  open: boolean;
  onClose: () => void;
}

export function RewardUnlockOverlay({ rewards, open, onClose }: RewardUnlockOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open || rewards.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-card rounded-3xl shadow-2xl mx-6 max-w-[340px] w-full overflow-hidden transition-all duration-500 ${
          visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-b from-stamp-gold/20 to-transparent pt-8 pb-4 px-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-5xl mb-2 animate-bounce">🎊</div>
          <h2 className="text-lg font-bold text-foreground">
            {rewards.length === 1 ? 'リワード獲得！' : `${rewards.length}件のリワード獲得！`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">おめでとうございます！</p>
        </div>

        {/* Rewards list */}
        <div className="px-5 pb-6 space-y-3 max-h-[50vh] overflow-y-auto">
          {rewards.map((reward) => {
            const isBadge = reward.type === 'badge';
            return (
              <div
                key={reward.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-stamp-gold/5 border border-stamp-gold/20"
              >
                <div className="w-12 h-12 rounded-xl bg-stamp-gold/20 flex items-center justify-center shrink-0">
                  {isBadge && reward.badge_image_url ? (
                    <img src={reward.badge_image_url} alt="" className="w-8 h-8 object-contain" />
                  ) : isBadge ? (
                    <Trophy className="w-6 h-6 text-stamp-gold" />
                  ) : (
                    <Ticket className="w-6 h-6 text-stamp-gold" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{reward.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isBadge ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                    }`}>
                      {isBadge ? 'バッジ' : 'クーポン'}
                    </span>
                    {reward.description && (
                      <span className="text-xs text-muted-foreground truncate">{reward.description}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-stamp-gold text-primary-foreground py-3 font-bold text-sm"
          >
            やったね！ 🎉
          </button>
        </div>
      </div>
    </div>
  );
}
