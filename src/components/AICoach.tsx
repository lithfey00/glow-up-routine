import { useState } from 'react';
import * as Icons from 'lucide-react';
import type { Challenge } from '../lib/supabase';
import { generateCoachRoutine } from '../lib/coach';
import { MOOD_CONFIG, type Mood, type EnergyLevel, type TimeBudget } from '../lib/types';
import { triggerConfetti } from '../lib/confetti';

interface AICoachProps {
  challenges: Challenge[];
  completedToday: Set<string>;
  onToggle: (challengeId: string) => void;
}

export function AICoach({ challenges, completedToday, onToggle }: AICoachProps) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel>(3);
  const [timeBudget, setTimeBudget] = useState<TimeBudget>(15);
  const [routine, setRoutine] = useState<ReturnType<typeof generateCoachRoutine> | null>(null);
  const [generating, setGenerating] = useState(false);

  function generate() {
    if (!mood || generating) return;
    setGenerating(true);
    const completed = [...completedToday];
    const result = generateCoachRoutine({
      mood,
      timeBudget,
      energy,
      completedChallengeIds: completed,
      challenges,
    });
    setRoutine(result);
    setGenerating(false);
    triggerConfetti(20);
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50 dark:from-slate-800/60 dark:via-purple-900/20 dark:to-blue-900/20 rounded-3xl shadow-xl border-2 border-violet-100 dark:border-purple-900/40 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg animate-float">
          <Icons.Bot className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Daily AI Glow Coach</h3>
          <p className="text-sm text-gray-500 dark:text-purple-300/70">Your personalized routine, crafted with care</p>
        </div>
      </div>

      {!routine && (
        <>
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-600 dark:text-purple-200 mb-2">How do you feel today?</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(MOOD_CONFIG) as Mood[]).map((m) => {
                const cfg = MOOD_CONFIG[m];
                return (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                      mood === m
                        ? `${cfg.bg} border-transparent ring-2 ${cfg.ring} scale-105`
                        : 'bg-white/60 dark:bg-slate-700/40 border-gray-100 dark:border-slate-600/40 hover:scale-105'
                    }`}
                  >
                    <span className="text-xl">{cfg.emoji}</span>
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-purple-300/70">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-purple-200 mb-2">Energy level: {energy}/5</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setEnergy(lvl as EnergyLevel)}
                    className={`flex-1 h-8 rounded-lg transition-all ${
                      energy >= lvl ? 'bg-gradient-to-r from-violet-400 to-pink-400' : 'bg-gray-100 dark:bg-slate-700/50'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-purple-200 mb-2">Available time</p>
              <div className="flex gap-2">
                {([5, 15, 30, 60] as TimeBudget[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeBudget(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      timeBudget === t
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                        : 'bg-white/60 dark:bg-slate-700/40 text-gray-500 dark:text-purple-300/70'
                    }`}
                  >
                    {t}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!mood || generating}
            className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all ${
              mood && !generating
                ? 'bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500 text-white shadow-lg hover:scale-105'
                : 'bg-gray-100 dark:bg-slate-700/40 text-gray-400 dark:text-purple-300/40 cursor-not-allowed'
            }`}
          >
            {generating ? 'Crafting your routine...' : 'Generate My Glow Routine'}
          </button>
        </>
      )}

      {routine && (
        <div className="animate-fade-in">
          <div className="mb-4 p-4 bg-white/70 dark:bg-slate-700/40 rounded-2xl border border-violet-100 dark:border-purple-900/40">
            <p className="text-sm text-gray-700 dark:text-purple-100 leading-relaxed italic">{routine.message}</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-violet-100 dark:bg-purple-900/40 rounded-full font-semibold text-violet-600 dark:text-purple-200">
                {routine.focus}
              </span>
              <span className="flex items-center gap-1 text-gray-500 dark:text-purple-300/70">
                <Icons.Clock className="w-3 h-3" /> {routine.totalMinutes} min
              </span>
              <span className="flex items-center gap-1 text-gray-500 dark:text-purple-300/70">
                <Icons.Zap className="w-3 h-3" fill="currentColor" /> +{routine.totalXp} XP
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {routine.challenges.map((c, idx) => {
              const done = completedToday.has(c.id);
              const IconComp = (Icons[c.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    done
                      ? 'bg-green-50 dark:bg-emerald-900/20 border-green-200 dark:border-emerald-800/40'
                      : 'bg-white/60 dark:bg-slate-700/40 border-gray-100 dark:border-slate-600/40 hover:shadow-md'
                  }`}
                >
                  <span className="text-xs font-bold text-gray-300 dark:text-purple-300/40 w-5">{idx + 1}</span>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-purple-100 truncate">{c.title}</h4>
                    <p className="text-xs text-gray-400 dark:text-purple-300/50">{c.duration_minutes} min • +{c.glow_points} XP</p>
                  </div>
                  <button
                    onClick={() => onToggle(c.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      done
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-md'
                        : 'bg-white border-2 border-gray-200 dark:border-slate-600 hover:border-gray-300'
                    }`}
                  >
                    {done && <Icons.Check className="w-5 h-5 text-white" strokeWidth={3} />}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setRoutine(null)}
            className="w-full py-2.5 rounded-2xl bg-white/60 dark:bg-slate-700/40 text-gray-600 dark:text-purple-200 font-semibold text-sm hover:bg-white dark:hover:bg-slate-600/40 transition-all"
          >
            Create a new routine
          </button>
        </div>
      )}
    </div>
  );
}
