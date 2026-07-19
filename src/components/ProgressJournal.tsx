import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { JournalEntry } from '../lib/types';
import { MOOD_CONFIG, type Mood } from '../lib/types';

interface ProgressJournalProps {
  userId: string;
}

export function ProgressJournal({ userId }: ProgressJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [userId]);

  async function loadEntries() {
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(30);
    setEntries((data || []) as JournalEntry[]);
  }

  async function saveEntry() {
    if (!content.trim() && !title.trim()) return;
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('journal_entries').insert({
      user_id: userId,
      entry_date: today,
      title: title.trim() || null,
      content: content.trim() || null,
      mood: mood,
      photo_url: photoUrl.trim() || null,
    });
    setTitle('');
    setContent('');
    setMood(null);
    setPhotoUrl('');
    setShowForm(false);
    setSaving(false);
    await loadEntries();
  }

  async function deleteEntry(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-pink-100 dark:border-purple-900/40 p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg">
            <Icons.Camera className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Progress Journal</h3>
            <p className="text-sm text-gray-500 dark:text-purple-300/70">Capture your growth day by day</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-semibold shadow-md hover:scale-105 transition-all flex items-center gap-2"
        >
          <Icons.Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border-2 border-rose-100 dark:border-rose-900/40 space-y-3 animate-fade-in">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title (optional)"
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 text-sm text-gray-700 dark:text-purple-100 focus:outline-none focus:border-rose-300"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How did today go? What are you proud of?"
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 text-sm text-gray-700 dark:text-purple-100 focus:outline-none focus:border-rose-300 resize-none"
          />
          <input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="Photo URL (optional)"
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 text-sm text-gray-700 dark:text-purple-100 focus:outline-none focus:border-rose-300"
          />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MOOD_CONFIG) as Mood[]).map((m) => {
              const cfg = MOOD_CONFIG[m];
              return (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mood === m ? `${cfg.bg} ring-2 ${cfg.ring}` : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-purple-300/70'
                  }`}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={saveEntry}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold shadow-md"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-10">
          <Icons.BookOpen className="w-12 h-12 text-rose-200 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-purple-300/50 text-sm">No journal entries yet. Start writing today!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {entries.map((e) => {
            const cfg = e.mood ? MOOD_CONFIG[e.mood as Mood] : null;
            return (
              <div key={e.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-600/40">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-purple-100">{e.title || 'Journal entry'}</h4>
                    <p className="text-xs text-gray-400">
                      {new Date(e.entry_date + 'T12:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cfg && <span className="text-lg">{cfg.emoji}</span>}
                    <button onClick={() => deleteEntry(e.id)} className="text-gray-300 hover:text-rose-400">
                      <Icons.Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {e.photo_url && (
                  <img src={e.photo_url} alt="progress" className="w-full max-h-48 object-cover rounded-xl mb-2" />
                )}
                {e.content && <p className="text-sm text-gray-600 dark:text-purple-200/80 leading-relaxed whitespace-pre-wrap">{e.content}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
