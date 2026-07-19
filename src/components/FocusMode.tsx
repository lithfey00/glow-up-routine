import { useEffect, useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FOCUS_SOUNDS, type FocusSound } from '../lib/types';

interface FocusModeProps {
  userId: string;
}

export function FocusMode({ userId }: FocusModeProps) {
  const [active, setActive] = useState<FocusSound | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(15);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= selectedDuration * 60) {
            stopSession();
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, selectedDuration]);

  async function startSession(sound: FocusSound) {
    setActive(sound);
    setSeconds(0);
    await supabase.from('focus_sessions').insert({
      user_id: userId,
      sound,
      duration_min: selectedDuration,
      started_at: new Date().toISOString(),
    });
  }

  function stopSession() {
    setActive(null);
    setSeconds(0);
  }

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  const progress = active ? (seconds / (selectedDuration * 60)) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-blue-100 dark:border-blue-900/40 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
          <Icons.Headphones className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Focus Mode</h3>
          <p className="text-sm text-gray-500 dark:text-purple-300/70">Relaxing sounds for calm focus</p>
        </div>
      </div>

      {active ? (
        <div className="flex flex-col items-center py-6">
          <div className="relative w-40 h-40 mb-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-slate-700" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="url(#focusGrad)" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-800 dark:text-purple-100">{mm}:{ss}</span>
              <span className="text-xs text-gray-400 capitalize">{active}</span>
            </div>
          </div>
          <button
            onClick={stopSession}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold text-sm shadow-lg hover:scale-105 transition-all"
          >
            End Session
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-sm font-medium text-gray-500 dark:text-purple-300/70">Duration:</span>
            {[5, 15, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDuration === d
                    ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-slate-700/40 text-gray-500 dark:text-purple-300/70'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {FOCUS_SOUNDS.map((s) => {
              const IconComp = (Icons[s.icon as keyof typeof Icons] as typeof Icons.CloudRain) || Icons.CloudRain;
              return (
                <button
                  key={s.sound}
                  onClick={() => startSession(s.sound)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg bg-gradient-to-br ${s.gradient}`}
                >
                  <IconComp className="w-7 h-7 text-white" strokeWidth={2} />
                  <span className="text-xs font-bold text-white">{s.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
