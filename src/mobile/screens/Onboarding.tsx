import { useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import { haptic } from '../lib/haptics';
import { BuddySVG } from '../components/BuddySVG';

interface Slide {
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
  buddy: 'seed' | 'sprout' | 'plant' | 'flower' | 'tree';
  accent: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🌸',
    title: 'Welcome to Glow Up',
    subtitle: 'Your gentle companion for daily self-care, habits, and emotional wellness.',
    gradient: 'from-pink-100 via-rose-50 to-violet-100 dark:from-purple-950 dark:via-pink-950 dark:to-slate-950',
    buddy: 'seed',
    accent: 'from-pink-400 to-rose-400',
  },
  {
    emoji: '🌱',
    title: 'Grow Your Glow Buddy',
    subtitle: 'Complete challenges and watch your buddy evolve from a tiny seed into a glowing tree.',
    gradient: 'from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950',
    buddy: 'sprout',
    accent: 'from-emerald-400 to-teal-400',
  },
  {
    emoji: '✨',
    title: 'Earn Rewards & Badges',
    subtitle: 'Collect Glow Points, unlock themes, open mystery boxes, and celebrate every win.',
    gradient: 'from-amber-100 via-orange-50 to-pink-100 dark:from-amber-950 dark:via-orange-950 dark:to-pink-950',
    buddy: 'flower',
    accent: 'from-amber-400 to-orange-400',
  },
  {
    emoji: '💜',
    title: 'Be Kind to Yourself',
    subtitle: 'No guilt, no pressure. Just gentle encouragement and small steps forward.',
    gradient: 'from-violet-100 via-purple-50 to-indigo-100 dark:from-violet-950 dark:via-purple-950 dark:to-slate-950',
    buddy: 'tree',
    accent: 'from-violet-400 to-purple-400',
  },
];

export function Onboarding({ onComplete }: { onComplete: (name?: string) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [direction, setDirection] = useState<1 | -1>(1);
  const startXRef = useRef<number | null>(null);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const progress = ((step + 1) / SLIDES.length) * 100;

  function goTo(next: number) {
    if (next < 0 || next >= SLIDES.length) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
    haptic('selection');
  }

  function next() {
    if (isLast) {
      haptic('success');
      onComplete(name.trim() || undefined);
    } else {
      goTo(step + 1);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (startXRef.current === null) return;
    const delta = e.changedTouches[0].clientX - startXRef.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else goTo(step - 1);
    }
    startXRef.current = null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br ${slide.gradient} transition-all duration-700 flex flex-col overflow-hidden`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Skip */}
      <div className="flex justify-end px-6 pt-3">
        {!isLast && (
          <button onClick={() => { haptic('light'); onComplete(); }} className="text-sm font-semibold text-gray-400 dark:text-purple-300/50 pressable">
            Skip
          </button>
        )}
      </div>

      {/* Content with parallax */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div key={step} className="animate-bounce-in" style={{ ['--dir' as string]: direction }}>
          {/* Parallax buddy — floats with subtle drift */}
          <div className="relative mb-2">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-48 h-48 rounded-full bg-gradient-to-br ${slide.accent} opacity-20 blur-3xl animate-breathe`} />
            </div>
            <div className="animate-float relative">
              <BuddySVG stage={slide.buddy} size={150} />
            </div>
          </div>

          <span className="text-5xl mb-5 inline-block animate-float" style={{ animationDelay: '0.3s' }}>{slide.emoji}</span>

          <h1 className="text-3xl font-bold text-gray-800 dark:text-purple-100 font-quicksand mb-3 tracking-tight animate-fade-in">
            {slide.title}
          </h1>
          <p className="text-base text-gray-500 dark:text-purple-300/70 leading-relaxed max-w-xs animate-fade-in stagger-2">
            {slide.subtitle}
          </p>

          {/* Name input on last slide */}
          {isLast && (
            <div className="mt-8 w-full max-w-xs animate-fade-in stagger-3">
              <div className="relative">
                <Icons.User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  maxLength={20}
                  className="w-full pl-12 pr-4 py-3.5 rounded-[22px] bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl text-[15px] text-gray-700 dark:text-purple-100 font-semibold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300/60 transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">Optional — we'll use this to greet you</p>
            </div>
          )}
        </div>
      </div>

      {/* Dots + CTA */}
      <div className="px-8 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-6">
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-400 pressable ${
                i === step ? 'w-8 bg-gradient-to-r from-pink-500 to-violet-500' : 'w-2 bg-gray-300/60 dark:bg-purple-300/30'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => goTo(step - 1)}
              className="w-14 h-14 rounded-[22px] glass flex items-center justify-center pressable active:scale-95"
              aria-label="Previous"
            >
              <Icons.ChevronLeft className="w-5 h-5 text-gray-600 dark:text-purple-200" />
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 py-4 rounded-[22px] bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-[15px] shadow-lg shadow-pink-500/30 pressable active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {isLast ? (
              <>
                Start Glowing
                <Icons.Sparkles className="w-4 h-4" fill="currentColor" />
              </>
            ) : (
              <>
                Continue
                <Icons.ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
