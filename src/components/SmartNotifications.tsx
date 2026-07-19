import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { NotificationItem } from '../lib/types';

interface SmartNotificationsProps {
  userId: string;
  currentStreak: number;
  completedToday: number;
}

const ENCOURAGEMENTS = [
  'You’re doing beautifully. One small step is enough today.',
  'Your glow grows with every tiny act of care. Keep going!',
  'No pressure, just love. You deserve this moment.',
  'Progress, not perfection. You’re already amazing.',
  'Take a breath. You’ve got this, lovely.',
];

export function SmartNotifications({ userId, currentStreak, completedToday }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    loadNotifications();
    maybeCreateAdaptiveNotification();
  }, [userId]);

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    const items = (data || []) as NotificationItem[];
    setNotifications(items);
    setUnread(items.filter((n) => !n.is_read).length);
  }

  async function maybeCreateAdaptiveNotification() {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);

    if (existing && existing.length > 0) return;

    let title = 'Daily Glow Reminder';
    let message = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

    if (completedToday === 0 && currentStreak === 0) {
      title = 'A Fresh Start';
      message = 'Today is a new chance to glow. Try one tiny challenge — you’ve got this!';
    } else if (currentStreak >= 7) {
      title = 'Streak Star!';
      message = `You’re on a ${currentStreak}-day streak. So proud of your dedication!`;
    } else if (completedToday === 0) {
      title = 'Gentle Nudge';
      message = 'No rush at all — whenever you’re ready, a small challenge is waiting.';
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type: 'reminder',
      scheduled_for: new Date().toISOString(),
    });
    await loadNotifications();
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await Promise.all(
      unreadIds.map((id) =>
        supabase.from('notifications').update({ is_read: true }).eq('id', id)
      )
    );
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-teal-100 dark:border-teal-900/40 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg relative">
            <Icons.Bell className="w-6 h-6 text-white" strokeWidth={2.5} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Smart Reminders</h3>
            <p className="text-sm text-gray-500 dark:text-purple-300/70">Friendly nudges, never guilt</p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs font-semibold text-teal-500 hover:text-teal-600">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <Icons.BellOff className="w-10 h-10 text-teal-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-purple-300/50">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-2xl border transition-all ${
                n.is_read
                  ? 'bg-gray-50 dark:bg-slate-700/30 border-gray-100 dark:border-slate-600/40'
                  : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/40'
              }`}
            >
              <div className="flex items-start gap-2">
                <Icons.Heart className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="currentColor" />
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-purple-100">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-purple-300/70 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-300 dark:text-purple-300/40 mt-1">
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
