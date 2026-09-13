import { useState } from 'react';
import * as Icons from 'lucide-react';

export type FocusGoal = 'energy' | 'confidence' | 'calm' | 'routine';
export type TimeBudget = 5 | 10 | 20;
export type ReminderPref = 'yes' | 'later';

export interface OnboardingPrefs {
  focus: FocusGoal;
  timeBudget: TimeBudget;
  reminders: ReminderPref;
}

const FOCUS_OPTIONS: { id: FocusGoal; label: string; desc: string; icon: keyof typeof Icons; gradient: string }[] = [
  { id: 'energy', label: 'Energy', desc: 'Feel more awake', icon: 'Zap', gradient: 'from-amber-400 to-orange-400' },
  { id: 'confidence', label: 'Confidence', desc: 'Feel good about you', icon: 'Crown', gradient: 'from-pink-400 to-rose-400' },
  { id: 'calm', label: 'Calm', desc: 'Find your peace', icon: 'Wind', gradient: 'from-teal-400 to-cyan-400' },
  { id: 'routine', label: 'Routine', desc: 'Build daily habits', icon: 'Repeat', gradient: 'from-violet-400 to-purple-400' },
];

const TIME_OPTIONS: { id: TimeBudget; label: string }[] = [
  { id: 5, label: '5 min' },
  { id: 10, label: '10 min' },
  { id: 20, label: '20 min' },
];

const ONBOARD_KEY = 'glow-onboarding-done';
const PREFS_KEY = 'glow-onboarding-prefs';

export function hasOnboarded(): boolean {
  return localStorage.getItem(ONBOARD_KEY) === 'true';
}

export function getOnboardingPrefs(): OnboardingPrefs | null {
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingPrefs;
  } catch {
    return null;
  }
}

function savePrefs(prefs: OnboardingPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  localStorage.setItem(ONBOARD_KEY, 'true');
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<FocusGoal | null>(null);
  const [timeBudget, setTimeBudget] = useState<TimeBudget | null>(null);
  const [reminders, setReminders] = useState<ReminderPref | null>(null);

  function finish() {
    const prefs: OnboardingPrefs = {
      focus: focus || 'calm',
      timeBudget: timeBudget || 5,
      reminders: reminders || 'later',
    };
    savePrefs(prefs);
    onComplete();
  }

  function skip() {
    savePrefs({ focus: 'calm', timeBudget: 5, reminders: 'later' });
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 animate-fade-in">
      <div className="mx-auto max-w-md min-h-screen flex flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-end">
          {step < 2 && (
            <button onClick={skip} className="text-xs font-semibold text-gray-400 dark:text-purple-300/50 px-3 py-1.5">
              Skip for now
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {step === 0 && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-200 to-violet-200 dark:from-purple-800/50 dark:to-pink-800/50 flex items-center justify-center shadow-lg">
                  <Icons.Sparkles className="w-9 h-9 text-pink-500 dark:text-pink-300" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-violet-600 dark:from-pink-300 dark:to-purple-300 bg-clip-text text-transparent">
                  Let's personalize your glow
                </h1>
                <p className="text-sm text-gray-500 dark:text-purple-200/70 max-w-xs leading-relaxed">
                  Three quick questions to tailor your daily recommendations. You can always change these later.
                </p>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold text-gray-400 dark:text-purple-300/60 uppercase tracking-wider px-1">
                  What would you like to focus on?
                </p>
                {FOCUS_OPTIONS.map((opt) => {
                  const IconComp = Icons[opt.icon];
                  const active = focus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setFocus(opt.id); }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${active ? 'border-transparent bg-gradient-to-r from-pink-100/80 to-violet-100/80 dark:from-purple-900/40 dark:to-pink-900/40 ring-2 ring-pink-300 dark:ring-pink-500/40 scale-[1.02]' : 'border-transparent bg-white/60 dark:bg-slate-800/60 hover:scale-[1.01]'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center flex-shrink-0`}>
                        <IconComp className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 dark:text-purple-100">{opt.label}</p>
                        <p className="text-xs text-gray-400 dark:text-purple-300/60">{opt.desc}</p>
                      </div>
                      {active && <Icons.Check className="w-5 h-5 text-pink-500" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!focus}
                onClick={() => setStep(1)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold shadow-lg disabled:opacity-40 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-100"
              >
                Continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-200 to-cyan-200 dark:from-teal-800/50 dark:to-cyan-800/50 flex items-center justify-center shadow-lg">
                  <Icons.Clock className="w-7 h-7 text-teal-600 dark:text-teal-300" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-purple-100">How much time do you usually have?</h1>
                <p className="text-sm text-gray-500 dark:text-purple-200/70 max-w-xs">
                  We'll pick challenges that fit your day.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                {TIME_OPTIONS.map((opt) => {
                  const active = timeBudget === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTimeBudget(opt.id)}
                      className={`flex flex-col items-center gap-1 px-6 py-5 rounded-2xl border-2 transition-all ${active ? 'border-transparent bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 ring-2 ring-teal-300 dark:ring-teal-500/40 scale-105' : 'border-transparent bg-white/60 dark:bg-slate-800/60 hover:scale-105'}`}
                    >
                      <Icons.Clock className={`w-6 h-6 ${active ? 'text-teal-500' : 'text-gray-300 dark:text-slate-500'}`} />
                      <span className={`text-sm font-bold ${active ? 'text-teal-700 dark:text-teal-200' : 'text-gray-500 dark:text-purple-300/70'}`}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 text-gray-500 dark:text-purple-300/70 text-sm font-bold transition-all hover:scale-[1.02]"
                >
                  Back
                </button>
                <button
                  disabled={!timeBudget}
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold shadow-lg disabled:opacity-40 transition-all hover:scale-[1.02]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-200 to-purple-200 dark:from-violet-800/50 dark:to-purple-800/50 flex items-center justify-center shadow-lg">
                  <Icons.Bell className="w-7 h-7 text-violet-600 dark:text-violet-300" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-purple-100">Gentle reminders?</h1>
                <p className="text-sm text-gray-500 dark:text-purple-200/70 max-w-xs">
                  A soft nudge when it's time for your glow moment. Never pushy.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => setReminders('yes')}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${reminders === 'yes' ? 'border-transparent bg-gradient-to-r from-violet-100/80 to-purple-100/80 dark:from-purple-900/40 dark:to-pink-900/40 ring-2 ring-violet-300 dark:ring-violet-500/40 scale-[1.02]' : 'border-transparent bg-white/60 dark:bg-slate-800/60 hover:scale-[1.01]'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center flex-shrink-0">
                    <Icons.BellRing className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-purple-100">Yes, please</p>
                    <p className="text-xs text-gray-400 dark:text-purple-300/60">Remind me gently each day</p>
                  </div>
                  {reminders === 'yes' && <Icons.Check className="w-5 h-5 text-violet-500" strokeWidth={3} />}
                </button>
                <button
                  onClick={() => setReminders('later')}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${reminders === 'later' ? 'border-transparent bg-white/80 dark:bg-slate-800/80 ring-2 ring-gray-300 dark:ring-slate-600 scale-[1.02]' : 'border-transparent bg-white/60 dark:bg-slate-800/60 hover:scale-[1.01]'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center flex-shrink-0">
                    <Icons.Clock3 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-purple-100">Not now</p>
                    <p className="text-xs text-gray-400 dark:text-purple-300/60">I'll come back on my own</p>
                  </div>
                  {reminders === 'later' && <Icons.Check className="w-5 h-5 text-gray-400" strokeWidth={3} />}
                </button>
              </div>

              <button
                disabled={!reminders}
                onClick={finish}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold shadow-lg disabled:opacity-40 transition-all hover:scale-[1.02]"
              >
                Start glowing
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-1.5 pt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-gradient-to-r from-pink-400 to-violet-400' : 'w-1.5 bg-gray-200 dark:bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
