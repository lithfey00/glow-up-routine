import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { BuddySVG } from './BuddySVG';
import { getStageFromXp } from './BuddySVG';
import { triggerConfetti } from '../../lib/confetti';

export interface CelebrationData {
  challengeTitle: string;
  xpEarned: number;
  totalXp: number;
  buddyXp: number;
  buddyStage: string;
  nextStageName: string | null;
  xpUntilNextStage: number | null;
  levelUp: boolean;
  newLevel: number | null;
}

export function CelebrationModal({
  data,
  onChooseAnother,
  onBackToToday,
}: {
  data: CelebrationData;
  onChooseAnother: () => void;
  onBackToToday: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    triggerConfetti(40);
  }, []);

  const stageInfo = getStageFromXp(data.buddyXp);

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-end sm:items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onBackToToday}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md mx-3 mb-3 sm:mb-0 rounded-3xl bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 dark:from-slate-800 dark:via-purple-900/80 dark:to-slate-800 shadow-2xl border border-white/60 dark:border-purple-900/40 transition-all duration-500 ${visible ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}
      >
        {/* Sparkle decorations */}
        <div className="absolute top-4 left-4 animate-sparkle" style={{ animationDelay: '0s' }}>
          <Icons.Sparkle className="w-4 h-4 text-pink-300 dark:text-pink-400/60" />
        </div>
        <div className="absolute top-8 right-6 animate-sparkle" style={{ animationDelay: '0.5s' }}>
          <Icons.Sparkle className="w-3 h-3 text-violet-300 dark:text-violet-400/60" />
        </div>
        <div className="absolute top-16 left-8 animate-sparkle" style={{ animationDelay: '1s' }}>
          <Icons.Sparkle className="w-2.5 h-2.5 text-amber-300 dark:text-amber-400/60" />
        </div>

        <div className="px-6 pt-8 pb-6 text-center">
          {/* Buddy with grow animation */}
          <div className="flex justify-center mb-3">
            <div className="animate-badge-pop">
              <BuddySVG stage={stageInfo.stage} size={88} />
            </div>
          </div>

          {/* Warm message */}
          <h2 className="text-lg font-bold text-gray-800 dark:text-purple-100 mb-1">
            You showed up for yourself today
          </h2>
          <p className="text-sm text-gray-500 dark:text-purple-200/70 mb-5">
            {data.challengeTitle}
          </p>

          {/* XP burst */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-violet-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
              <Icons.Zap className="w-4 h-4 text-violet-500" fill="currentColor" />
              <span className="text-base font-bold text-violet-700 dark:text-violet-200">+{data.xpEarned} XP</span>
            </div>
            {data.levelUp && data.newLevel && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 animate-badge-pop">
                <Icons.Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                <span className="text-base font-bold text-amber-700 dark:text-amber-200">Level {data.newLevel}</span>
              </div>
            )}
          </div>

          {/* Buddy progress */}
          {data.nextStageName && data.xpUntilNextStage !== null && (
            <div className="mb-5 px-4 py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-purple-300/70">Buddy progress</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                  {data.xpUntilNextStage} XP until {data.nextStageName}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
                  style={{ width: `${stageInfo.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Follow-up actions */}
          <div className="flex gap-2.5">
            <button
              onClick={onChooseAnother}
              className="flex-1 py-3 rounded-2xl bg-white/70 dark:bg-slate-700/60 text-gray-600 dark:text-purple-200 text-sm font-bold border border-white/60 dark:border-purple-900/40 transition-all hover:scale-[1.02] active:scale-100"
            >
              Choose another
            </button>
            <button
              onClick={onBackToToday}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-100"
            >
              Back to today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
