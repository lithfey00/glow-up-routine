import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WellnessTrackersProps {
  userId: string;
}

interface TrackerData {
  water_glasses: number;
  sleep_hours: number;
  exercise_min: number;
  meditation_min: number;
  reading_min: number;
  skincare_done: boolean;
}

const DEFAULT: TrackerData = {
  water_glasses: 0,
  sleep_hours: 0,
  exercise_min: 0,
  meditation_min: 0,
  reading_min: 0,
  skincare_done: false,
};

const TARGETS = {
  water_glasses: 8,
  sleep_hours: 8,
  exercise_min: 30,
  meditation_min: 15,
  reading_min: 20,
};

export function WellnessTrackers({ userId }: WellnessTrackersProps) {
  const [data, setData] = useState<TrackerData>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadToday();
  }, [userId]);

  async function loadToday() {
    const today = new Date().toISOString().split('T')[0];
    const { data: row } = await supabase
      .from('wellness_trackers')
      .select('water_glasses, sleep_hours, exercise_min, meditation_min, reading_min, skincare_done')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    if (row) setData(row as TrackerData);
    setLoading(false);
  }

  async function update(patch: Partial<TrackerData>) {
    const today = new Date().toISOString().split('T')[0];
    const next = { ...data, ...patch };
    setData(next);
    await supabase.from('wellness_trackers').upsert({
      user_id: userId,
      date: today,
      ...next,
      updated_at: new Date().toISOString(),
    });
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-cyan-100 dark:border-cyan-900/40 p-6 flex items-center justify-center h-48">
        <Icons.Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-cyan-100 dark:border-cyan-900/40 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
          <Icons.Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Wellness Trackers</h3>
          <p className="text-sm text-gray-500 dark:text-purple-300/70">Daily habits for a healthier you</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TrackerRow
          icon={<Icons.Droplet className="w-5 h-5 text-cyan-500" />}
          label="Water"
          value={data.water_glasses}
          unit="glasses"
          target={TARGETS.water_glasses}
          color="from-cyan-400 to-blue-400"
          onInc={() => update({ water_glasses: Math.min(20, data.water_glasses + 1) })}
          onDec={() => update({ water_glasses: Math.max(0, data.water_glasses - 1) })}
        />
        <TrackerRow
          icon={<Icons.Moon className="w-5 h-5 text-indigo-500" />}
          label="Sleep"
          value={data.sleep_hours}
          unit="hours"
          target={TARGETS.sleep_hours}
          color="from-indigo-400 to-violet-400"
          onInc={() => update({ sleep_hours: Math.min(24, +(data.sleep_hours + 0.5).toFixed(1)) })}
          onDec={() => update({ sleep_hours: Math.max(0, +(data.sleep_hours - 0.5).toFixed(1)) })}
        />
        <TrackerRow
          icon={<Icons.Dumbbell className="w-5 h-5 text-emerald-500" />}
          label="Exercise"
          value={data.exercise_min}
          unit="min"
          target={TARGETS.exercise_min}
          color="from-emerald-400 to-green-400"
          onInc={() => update({ exercise_min: Math.min(300, data.exercise_min + 5) })}
          onDec={() => update({ exercise_min: Math.max(0, data.exercise_min - 5) })}
        />
        <TrackerRow
          icon={<Icons.Brain className="w-5 h-5 text-violet-500" />}
          label="Meditation"
          value={data.meditation_min}
          unit="min"
          target={TARGETS.meditation_min}
          color="from-violet-400 to-purple-400"
          onInc={() => update({ meditation_min: Math.min(180, data.meditation_min + 5) })}
          onDec={() => update({ meditation_min: Math.max(0, data.meditation_min - 5) })}
        />
        <TrackerRow
          icon={<Icons.BookOpen className="w-5 h-5 text-amber-500" />}
          label="Reading"
          value={data.reading_min}
          unit="min"
          target={TARGETS.reading_min}
          color="from-amber-400 to-orange-400"
          onInc={() => update({ reading_min: Math.min(240, data.reading_min + 5) })}
          onDec={() => update({ reading_min: Math.max(0, data.reading_min - 5) })}
        />
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-purple-100">Skincare</p>
              <p className="text-xs text-gray-400 dark:text-purple-300/50">{data.skincare_done ? 'Done!' : 'Not yet'}</p>
            </div>
          </div>
          <button
            onClick={() => update({ skincare_done: !data.skincare_done })}
            className={`w-12 h-7 rounded-full transition-all relative ${
              data.skincare_done ? 'bg-gradient-to-r from-rose-400 to-pink-400' : 'bg-gray-200 dark:bg-slate-600'
            }`}
          >
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${data.skincare_done ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrackerRow({
  icon, label, value, unit, target, color, onInc, onDec,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  target: number;
  color: string;
  onInc: () => void;
  onDec: () => void;
}) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/40 border-2 border-gray-100 dark:border-slate-600/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-gray-700 dark:text-purple-100">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onDec} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center text-gray-500 hover:scale-110 transition-transform">
            <Icons.Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-bold text-gray-800 dark:text-purple-100 w-16 text-center">
            {value} <span className="text-xs text-gray-400">{unit}</span>
          </span>
          <button onClick={onInc} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center text-gray-500 hover:scale-110 transition-transform">
            <Icons.Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-slate-600 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">Goal: {target} {unit}</p>
    </div>
  );
}
