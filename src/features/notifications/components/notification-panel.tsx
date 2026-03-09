import { Heart, X, Info, Star, Gift, CheckCheck, ChevronDown, MessageCircle, Bell } from 'lucide-react';
import type { NotificationIconConfig } from '@/features/notifications/types';
import { formatRelativeDate } from '@/lib/utils/format-date';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  photo_id: string | null;
  spot_slug: string | null;
}

interface NotificationPanelProps {
  notifications: Notification[];
  visibleCount: number;
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onLoadMore: () => void;
  onNotificationClick: (n: Notification) => void;
  onMarkOneRead: (id: string) => void;
}

const ICON_MAP: Record<string, NotificationIconConfig> = {
  like: { icon: Heart, bg: 'bg-destructive/10', color: 'text-destructive' },
  comment: { icon: MessageCircle, bg: 'bg-blue-500/10', color: 'text-blue-500' },
  system: { icon: Info, bg: 'bg-primary/10', color: 'text-primary' },
  reward: { icon: Gift, bg: 'bg-amber-500/10', color: 'text-amber-500' },
  stamp: { icon: Star, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
};

export function NotificationPanel({
  notifications,
  visibleCount,
  unreadCount,
  onClose,
  onMarkAllRead,
  onLoadMore,
  onNotificationClick,
  onMarkOneRead,
}: NotificationPanelProps) {
  const visibleNotifications = notifications.slice(0, visibleCount);
  const hasMore = visibleCount < notifications.length;

  return (
    <div className="absolute right-0 top-12 w-[320px] max-h-[400px] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl z-50 animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">通知</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              title="すべて既読にする"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>既読</span>
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="通知パネルを閉じる" className="text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center">
          <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">通知はまだありません</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {visibleNotifications.map(n => {
            const { icon: Icon, bg, color } = ICON_MAP[n.type] ?? ICON_MAP.system;
            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => onNotificationClick(n)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNotificationClick(n); } }}
                className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                  !n.is_read ? 'bg-primary/5' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium line-clamp-2">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">📷 {n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatRelativeDate(n.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkOneRead(n.id);
                  }}
                  className="flex-shrink-0 mt-1.5 p-0.5 rounded-full hover:bg-muted transition-colors"
                  title={n.is_read ? '既読' : '未読にする'}
                >
                  <div className={`w-2.5 h-2.5 rounded-full border ${!n.is_read ? 'bg-primary border-primary' : 'border-muted-foreground/50'}`} />
                </button>
              </div>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              className="w-full flex items-center justify-center gap-1 py-3 text-xs text-primary hover:bg-muted/50 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              もっと見る（残り{notifications.length - visibleCount}件）
            </button>
          )}
        </div>
      )}
    </div>
  );
}
