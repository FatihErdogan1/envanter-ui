import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '../api';
import type { Notification } from '../types';
import { useAuth } from './useAuth';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCountRef = useRef<number>(0);

  const fetchAll = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch { /* silent */ }
  }, []);

  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getUnreadCount();
      const count = res.data.count;
      setUnreadCount(count);
      if (count !== prevCountRef.current) {
        prevCountRef.current = count;
        await fetchAll();
      }
    } catch { /* silent */ }
  }, [user, fetchAll]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      prevCountRef.current = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
    poll();
    intervalRef.current = setInterval(poll, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchAll, poll]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => {
        const next = Math.max(0, prev - 1);
        prevCountRef.current = next;
        return next;
      });
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch { /* silent */ }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllRead };
}
