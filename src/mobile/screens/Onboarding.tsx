import { useState } from 'react';
import { haptic } from '../lib/haptics';
import { BuddySVG } from '../components/BuddySVG';

const SLIDES = [
  {
    emoji: '🌸',
    title: 'Welcome to Glow Up',
    subtitle: 'Your gentle companion for daily self-care, habits, and emotional wellness.',
    gradient: 'from-pink-100 via-rose-50 to-violet-100 dark:from-purple-950 dark:via-pink-950 dark:to-slate-950',
    buddy: 'seed' as const,
  },
  {
    emoji: '🌱',
    title: 'Grow Your Glow Buddy',
    subtitle: 'Complete challenges and watch your buddy evolve from a tiny seed into a glowing tree.',
    gradient: 'from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950',
    buddy: 'sprout' as const,
  },
  {
    emoji: '✨',
    title: 'Earn Rewards & Badges',
    subtitle: 'Collect Glow Points, unlock themes, open mystery boxes, and celebrate every win.',
    gradient: 'from-amber-100 via-orange-50 to-pink-100 dark:from-amber-950 dark:via-orange-950 dark:to-pink-950',
    buddy: 'flower' as const,
  },
  {
    emoji: '💜',
    title: 'Be Kind to Yourself',
    subtitle: 'No guilt, no pressure. Just gentle encouragement and small steps forward.',
    gradient: 'from-violet-100 via-purple-50 to-indigo-100 dark:from-violet-950 dark:via-purple-950 dark:to-slate-950',
    buddy: 'tree' as const,
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  function next() {
    haptic('light');
    if (isLast) {
      haptic('success');
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br ${slide.gradient} transition-all duration-700 flex flex-col`}>
      {/* Skip */}
      <div className="flex justify-end px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {!isLast && (
          <button onClick={() => { haptic('light'); onComplete(); }} className="text-sm font-semibold text-gray-400 dark:text-purple-300/50 pressable">
            Skip
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div key={step} className="animate-bounce-in">
          <div className="animate-breathe mb-8">
            <BuddySVG stage={slide.buddy} size={160} />
          </div>
          <span className="text-6xl mb-6 inline-block animate-float">{slide.emoji}</span>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-purple-100 font-quicksand mb-3 tracking-tight animate-fade-in">
            {slide.title}
          </h1>
          <p className="text-base text-gray-500 dark:text-purple-300/70 leading-relaxed max-w-xs animate-fade-in stagger-2">
            {slide.subtitle}
          </p>
        </div>
      </div>

      {/* Dots + CTA */}
      <div className="px-8 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-6">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-400 ${
                i === step ? 'w-8 bg-gradient-to-r from-pink-500 to-violet-500' : 'w-2 bg-gray-300/60 dark:bg-purple-300/30'
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-full py-4 rounded-[22px] bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-[15px] shadow-lg shadow-pink-500/30 pressable active:scale-[0.98] transition-transform"
        >
          {isLast ? 'Start Glowing' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
