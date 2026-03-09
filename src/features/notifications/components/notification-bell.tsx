import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead } from '@/features/notifications/hooks/use-notifications';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { PhotoDetailModal } from '@/features/photos/components/photo-detail-modal';
import { NotificationPanel } from './notification-panel';

const PAGE_SIZE = 10;

interface ModalPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  likes_count: number;
  created_at: string;
  user_id: string;
}

interface ModalUser {
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
}

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [modalPhoto, setModalPhoto] = useState<ModalPhoto | null>(null);
  const [modalUser, setModalUser] = useState<ModalUser | null>(null);

  const handleNotificationClick = async (n: (typeof notifications)[number]) => {
    if (!n.is_read) {
      markAsRead.mutate([n.id]);
    }
    setOpen(false);

    if (n.photo_id && (n.type === 'like' || n.type === 'comment')) {
      const { data: photo } = await supabase
        .from('photos')
        .select('id, image_url, caption, likes_count, created_at, user_id')
        .eq('id', n.photo_id)
        .maybeSingle();

      if (photo) {
        const { data: user } = await supabase
          .from('users')
          .select('nickname, avatar_url, bio')
          .eq('id', photo.user_id)
          .maybeSingle();

        setModalPhoto(photo);
        setModalUser(user);
        return;
      }
    }

    if (n.spot_slug) {
      navigate(`/spots/${n.spot_slug}`);
    } else {
      navigate('/map');
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

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
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
        <NotificationPanel
          notifications={notifications}
          visibleCount={visibleCount}
          unreadCount={unreadCount}
          onClose={() => setOpen(false)}
          onMarkAllRead={() => { if (unreadCount > 0) markAsRead.mutate(undefined); }}
          onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
          onNotificationClick={handleNotificationClick}
          onMarkOneRead={(id) => markAsRead.mutate([id])}
        />
      )}

      {modalPhoto && (
        <PhotoDetailModal
          photo={modalPhoto}
          user={modalUser}
          isOpen
          onClose={() => { setModalPhoto(null); setModalUser(null); }}
        />
      )}
    </div>
  );
}
