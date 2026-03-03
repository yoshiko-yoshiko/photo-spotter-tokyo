import { useState, useRef, useEffect } from 'react';
import { Bell, Heart, X, Info, Star, Gift, CheckCheck, ChevronDown } from 'lucide-react';
import type { NotificationIconConfig } from '@/features/notifications/types';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/features/notifications/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const visibleNotifications = notifications.slice(0, visibleCount);
  const hasMore = visibleCount < notifications.length;

  const handleNotificationClick = (n: (typeof notifications)[number]) => {
    if (n.spot_id) {
      setOpen(false);
      navigate(`/spots/${n.spot_id}`);
    } else {
      toast.info('該当のスポットが見つかりませんでした');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) {
      setVisibleCount(PAGE_SIZE);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAsRead.mutate(undefined);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        aria-label="通知"
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[320px] max-h-[400px] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl z-50 animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">通知</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  title="すべて既読にする"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>既読</span>
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">通知はまだありません</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visibleNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  {(() => {
                    const iconMap: Record<string, NotificationIconConfig> = {
                      like: { icon: Heart, bg: 'bg-destructive/10', color: 'text-destructive' },
                      system: { icon: Info, bg: 'bg-primary/10', color: 'text-primary' },
                      reward: { icon: Gift, bg: 'bg-amber-500/10', color: 'text-amber-500' },
                      stamp: { icon: Star, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
                    };
                    const { icon: Icon, bg, color } = iconMap[n.type] ?? iconMap.system;
                    return (
                      <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium line-clamp-2">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">📷 {n.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ja })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead.mutate([n.id]);
                    }}
                    className="flex-shrink-0 mt-1.5 p-0.5 rounded-full hover:bg-muted transition-colors"
                    title={n.is_read ? '既読' : '未読にする'}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full border ${!n.is_read ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`} />
                  </button>
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  className="w-full flex items-center justify-center gap-1 py-3 text-xs text-primary hover:bg-muted/50 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  もっと見る（残り{notifications.length - visibleCount}件）
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
