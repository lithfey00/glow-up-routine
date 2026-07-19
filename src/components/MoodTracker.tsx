import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MOOD_CONFIG, type Mood, type EnergyLevel } from '../lib/types';

interface MoodTrackerProps {
  userId: string;
  onMoodLogged?: (mood: Mood, energy: EnergyLevel) => void;
}

export function MoodTracker({ userId, onMoodLogged }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel>(3);
  const [todayMood, setTodayMood] = useState<Mood | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTodayMood();
  }, [userId]);

  async function loadTodayMood() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('mood_logs')
      .select('mood, energy, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00`)
      .order('logged_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTodayMood(data.mood as Mood);
      setEnergy(data.energy as EnergyLevel);
      setSelectedMood(data.mood as Mood);
    }
  }

  async function saveMood(mood: Mood) {
    setSelectedMood(mood);
    setSaving(true);
    const { error } = await supabase.from('mood_logs').insert({
      user_id: userId,
      mood,
      energy,
      logged_at: new Date().toISOString(),
    });
    if (!error) {
      setTodayMood(mood);
      onMoodLogged?.(mood, energy);
    }
    setSaving(false);
  }

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-pink-100 dark:border-purple-900/40 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg">
          <Icons.Smile className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">How are you feeling?</h3>
          <p className="text-sm text-gray-500 dark:text-purple-300/70">
            {todayMood ? `Today: ${MOOD_CONFIG[todayMood].label}` : 'Tap your mood to personalize your routine'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {(Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => {
          const cfg = MOOD_CONFIG[mood];
          const active = selectedMood === mood;
          return (
            <button
              key={mood}
              onClick={() => saveMood(mood)}
              disabled={saving}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 ${
                active
                  ? `${cfg.bg} border-transparent ring-2 ${cfg.ring} scale-105 shadow-lg`
                  : 'bg-gray-50 dark:bg-slate-700/40 border-gray-100 dark:border-slate-600/40 hover:scale-105 hover:shadow-md'
              }`}
            >
              <span className="text-2xl">{cfg.emoji}</span>
              <span className={`text-xs font-semibold ${active ? 'text-gray-700 dark:text-purple-100' : 'text-gray-500 dark:text-purple-300/70'}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-500 dark:text-purple-300/70 flex-shrink-0">Energy</span>
        <div className="flex gap-1.5 flex-1">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setEnergy(lvl as EnergyLevel)}
              className={`flex-1 h-9 rounded-lg transition-all duration-200 ${
                energy >= lvl
                  ? 'bg-gradient-to-r from-violet-400 to-pink-400 shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600/50'
              }`}
              aria-label={`Energy level ${lvl}`}
            />
          ))}
        </div>
        <span className="text-sm font-bold text-violet-500 dark:text-purple-300 w-6 text-right">{energy}</span>
      </div>
    </div>
  );
}
