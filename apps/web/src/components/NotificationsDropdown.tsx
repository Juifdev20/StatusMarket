import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/authContext';
import type { Notification } from '../types';

const READ_RETENTION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function NotificationsDropdown() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as Notification[]);
  }, [profile]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          setNotifications((prev) => prev.map((n) => n.id === (payload.new as Notification).id ? payload.new as Notification : n));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Filter out read notifications older than 2 hours
  const visibleNotifications = notifications.filter((n) => {
    if (!n.is_read) return true;
    const age = Date.now() - new Date(n.created_at).getTime();
    return age < READ_RETENTION_MS;
  });

  const unread = visibleNotifications.filter((n) => !n.is_read).length;

  const markAsRead = async (n: Notification) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item));
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost p-2 relative" title="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-corail-alerte text-[10px] text-white font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-brume/20 bg-white dark:bg-encre-nuit/90 p-2 shadow-xl">
          <div className="flex items-center justify-between p-2 border-b border-brume/20">
            <span className="text-sm font-semibold">Notifications</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllAsRead} className="btn-ghost p-1 text-xs text-vert-marche flex items-center gap-1" title="Tout marquer comme lu">
                  <CheckCheck size={14} /> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} className="btn-ghost p-1"><X size={14} /></button>
            </div>
          </div>
          {visibleNotifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-brume">Aucune notification pour le moment.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {visibleNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n)}
                  className={`w-full rounded-xl p-3 text-left text-sm transition-colors ${n.is_read ? 'opacity-60' : 'bg-vert-marche/5'}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-corail-alerte" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-brume line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-brume">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
