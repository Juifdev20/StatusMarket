import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (data) setNotifications(data as Notification[]);
    })();
  }, [open]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
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
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-brume/20 bg-white dark:bg-encre-nuit/90 p-2 shadow-xl">
          <div className="flex items-center justify-between p-2 border-b border-brume/20">
            <span className="text-sm font-semibold">Notifications</span>
            <button onClick={() => setOpen(false)} className="btn-ghost p-1"><X size={14} /></button>
          </div>
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-brume">Aucune notification.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`w-full rounded-xl p-3 text-left text-sm transition-colors ${n.is_read ? 'opacity-70' : 'bg-vert-marche/5'}`}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-brume line-clamp-2">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-brume">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
