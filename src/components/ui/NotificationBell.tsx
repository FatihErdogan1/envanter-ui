import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationType } from '../../types';

const TYPE_DOT: Record<NotificationType, string> = {
  STOCK_REQUEST: '#f59e0b',
  ORDER:         '#3b82f6',
  LOW_STOCK:     '#ef4444',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isSupplier } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n: Notification) => {
    if (!n.read) await markAsRead(n.id);
    setOpen(false);
    if (n.type === 'STOCK_REQUEST') navigate('/stock-requests');
    else if (n.type === 'ORDER') navigate(isSupplier ? '/supplier/siparisler' : '/orders');
    else if (n.type === 'LOW_STOCK') navigate('/products');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', padding: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'none', border: 'none' }}
        title="Bildirimler"
      >
        <Bell size={16} className="text-muted hover:text-text-primary transition-colors" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            background: '#ef4444', color: '#fff',
            borderRadius: '9999px', fontSize: '9px', fontWeight: 700,
            minWidth: '14px', height: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 2px', lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 0, top: 'calc(100% + 8px)',
          width: '300px', zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
          className="bg-bg-surface border border-border rounded"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-pixel text-xs text-text-primary">BİLDİRİMLER</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="font-pixel text-xs text-accent hover:text-text-primary transition-colors">
                TÜMÜNÜ OKU ✓
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p className="font-pixel text-xs text-muted text-center py-6">Bildirim bulunmuyor.</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: n.read ? 'transparent' : 'rgba(255,255,255,0.03)',
                  }}
                  className="border-b border-border hover:bg-bg-panel transition-colors"
                >
                  <div className="flex gap-2 items-start">
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: TYPE_DOT[n.type], flexShrink: 0, marginTop: '3px',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex justify-between gap-2">
                        <span className="font-pixel text-xs text-text-primary" style={{ fontWeight: n.read ? 400 : 700 }}>
                          {n.title}
                        </span>
                        <span className="font-pixel text-xs text-muted" style={{ flexShrink: 0 }}>
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p className="font-pixel text-xs text-muted mt-0.5 truncate">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
