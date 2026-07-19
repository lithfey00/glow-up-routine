import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { BUDDY_STAGES, getBuddyStage, type BuddyStage } from '../lib/types';

interface GlowBuddyProps {
  buddyXp: number;
  completedToday: number;
  glowPoints: number;
  lastInteraction: string | null;
}

export function GlowBuddy({ buddyXp, completedToday, glowPoints, lastInteraction }: GlowBuddyProps) {
  const [bounce, setBounce] = useState(false);
  const [showMessage, setShowMessage] = useState(true);
  const [xp, setXp] = useState(buddyXp);

  useEffect(() => { setXp(buddyXp); }, [buddyXp]);

  const stageInfo = getBuddyStage(xp);
  const daysInactive = lastInteraction
    ? Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const isSleepy = daysInactive >= 3 && completedToday === 0;

  useEffect(() => {
    setShowMessage(true);
    const t = setTimeout(() => setShowMessage(false), 5000);
    return () => clearTimeout(t);
  }, [stageInfo.stage, isSleepy]);

  const buddyMessage = isSleepy
    ? 'Your buddy missed you! Take a gentle step today — no pressure, just a hello.'
    : completedToday === 0
    ? 'Ready when you are! Even one tiny challenge helps us grow.'
    : completedToday >= 4
    ? 'You’re glowing! I’m so proud of you today!'
    : 'Lovely start! Every small step makes me stronger.';

  const handleBuddyClick = () => {
    setBounce(true);
    setShowMessage(true);
    setTimeout(() => setBounce(false), 600);
    setTimeout(() => setShowMessage(false), 4000);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-slate-800/60 dark:to-emerald-900/20 rounded-3xl shadow-xl border-2 border-emerald-100 dark:border-emerald-900/40 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icons.Sprout className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Glow Buddy</h2>
              <p className="text-white/80 text-xs">{stageInfo.name} • Level {BUDDY_STAGES.findIndex((s) => s.stage === stageInfo.stage) + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
            <Icons.Star className="w-4 h-4 text-yellow-200" fill="currentColor" />
            <span className="text-white font-bold text-sm">{xp}</span>
            <span className="text-white/70 text-xs">Buddy XP</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div
          className={`relative cursor-pointer transition-transform ${bounce ? 'animate-bounce' : 'hover:scale-105'}`}
          onClick={handleBuddyClick}
        >
          <BuddySVG stage={stageInfo.stage} sleepy={isSleepy} />
          {isSleepy && (
            <>
              <div className="absolute top-0 right-2 text-2xl animate-float">💤</div>
              <div className="absolute top-4 left-0 text-xl animate-float" style={{ animationDelay: '0.5s' }}>💤</div>
            </>
          )}
        </div>

        {showMessage && (
          <div className="mt-4 bg-white dark:bg-slate-700/60 rounded-2xl px-5 py-3 shadow-lg border border-emerald-100 dark:border-emerald-900/40 max-w-xs text-center animate-fade-in">
            <p className="text-gray-700 dark:text-purple-100 text-sm font-medium leading-relaxed">{buddyMessage}</p>
          </div>
        )}

        <div className="mt-4 w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-purple-300/70 mb-1.5">
            <span>Evolution</span>
            <span className="font-semibold">
              {stageInfo.nextXp ? `${stageInfo.nextXp - xp} XP to next` : 'Max stage!'}
            </span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-full transition-all duration-700"
              style={{ width: `${stageInfo.progress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-purple-300/60">
            <Icons.Heart className="w-3 h-3 text-pink-400" fill="currentColor" />
            <span>{completedToday} challenges today</span>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <Icons.Zap className="w-3 h-3 text-amber-400" fill="currentColor" />
            <span>{glowPoints} Glow Points</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {BUDDY_STAGES.map((s, i) => {
            const reached = BUDDY_STAGES.findIndex((b) => b.stage === stageInfo.stage) >= i;
            return (
              <div
                key={s.stage}
                className={`w-2.5 h-2.5 rounded-full transition-all ${reached ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-slate-600'}`}
                title={s.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BuddySVG({ stage, sleepy }: { stage: BuddyStage; sleepy: boolean }) {
  const size = 140;
  const colors: Record<BuddyStage, { body: string; accent: string; glow: string }> = {
    seed: { body: '#86efac', accent: '#4ade80', glow: '#bbf7d0' },
    sprout: { body: '#4ade80', accent: '#22c55e', glow: '#86efac' },
    plant: { body: '#22c55e', accent: '#16a34a', glow: '#4ade80' },
    flower: { body: '#16a34a', accent: '#ec4899', glow: '#f9a8d4' },
    tree: { body: '#15803d', accent: '#a16207', glow: '#65a30d' },
  };
  const c = colors[stage];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
      {/* Pot */}
      <path d="M 30 78 L 35 95 L 65 95 L 70 78 Z" fill="#d97706" />
      <ellipse cx="50" cy="78" rx="20" ry="4" fill="#b45309" />

      {stage === 'seed' && (
        <>
          <ellipse cx="50" cy="72" rx="8" ry="6" fill={c.body} />
          <circle cx="47" cy="70" r="2" fill="#16a34a" opacity="0.5" />
        </>
      )}

      {stage !== 'seed' && (
        <path d="M 50 78 Q 48 60 50 45" stroke={c.body} strokeWidth="4" fill="none" strokeLinecap="round" />
      )}

      {stage === 'sprout' && (
        <>
          <ellipse cx="44" cy="58" rx="6" ry="3" fill={c.body} transform="rotate(-30 44 58)" />
          <ellipse cx="56" cy="58" rx="6" ry="3" fill={c.body} transform="rotate(30 56 58)" />
        </>
      )}

      {stage === 'plant' && (
        <>
          <ellipse cx="42" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(-25 42 55)" />
          <ellipse cx="58" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(25 58 55)" />
          <ellipse cx="44" cy="42" rx="6" ry="3.5" fill={c.body} transform="rotate(-20 44 42)" />
          <ellipse cx="56" cy="42" rx="6" ry="3.5" fill={c.body} transform="rotate(20 56 42)" />
        </>
      )}

      {stage === 'flower' && (
        <>
          <ellipse cx="42" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(-25 42 55)" />
          <ellipse cx="58" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(25 58 55)" />
          {/* Flower */}
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} cx="50" cy="32" rx="5" ry="8" fill={c.accent} transform={`rotate(${deg} 50 32)`} opacity="0.9" />
          ))}
          <circle cx="50" cy="32" r="4" fill="#fbbf24" />
        </>
      )}

      {stage === 'tree' && (
        <>
          <ellipse cx="42" cy="55" rx="6" ry="3" fill={c.body} transform="rotate(-25 42 55)" />
          <ellipse cx="58" cy="55" rx="6" ry="3" fill={c.body} transform="rotate(25 58 55)" />
          {/* Canopy */}
          <circle cx="50" cy="30" r="18" fill={c.body} />
          <circle cx="38" cy="35" r="10" fill={c.body} opacity="0.9" />
          <circle cx="62" cy="35" r="10" fill={c.body} opacity="0.9" />
          <circle cx="50" cy="22" r="8" fill={c.glow} opacity="0.6" />
          {/* Fruit */}
          <circle cx="44" cy="28" r="2" fill={c.accent} />
          <circle cx="56" cy="32" r="2" fill={c.accent} />
          <circle cx="50" cy="38" r="2" fill={c.accent} />
        </>
      )}

      {/* Face */}
      {sleepy ? (
        <>
          <path d="M 45 50 Q 47 52 49 50" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 51 50 Q 53 52 55 50" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="47" cy="50" r="1.8" fill="#1e293b" />
          <circle cx="53" cy="50" r="1.8" fill="#1e293b" />
          <circle cx="47.5" cy="49.5" r="0.6" fill="white" />
          <circle cx="53.5" cy="49.5" r="0.6" fill="white" />
        </>
      )}
      <path d="M 47 55 Q 50 57 53 55" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Cheeks */}
      <circle cx="43" cy="54" r="2" fill="#f9a8d4" opacity="0.5" />
      <circle cx="57" cy="54" r="2" fill="#f9a8d4" opacity="0.5" />
    </svg>
  );
}
