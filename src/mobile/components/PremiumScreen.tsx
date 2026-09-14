import { useState } from 'react';
import * as Icons from 'lucide-react';
import { GlassCard } from './ui';
import { haptic } from '../lib/haptics';

const FEATURES = [
  { icon: 'Sparkles', title: 'Personalized weekly glow plans', desc: 'A curated plan each week, tailored to your mood and goals.', gradient: 'from-pink-400 to-rose-400' },
  { icon: 'Repeat', title: 'Unlimited routines', desc: 'Build as many routines as you like — morning, evening, anytime.', gradient: 'from-violet-400 to-purple-400' },
  { icon: 'TrendingUp', title: 'Deeper progress history', desc: 'See trends, insights, and patterns over weeks and months.', gradient: 'from-blue-400 to-cyan-400' },
  { icon: 'Sprout', title: 'Exclusive Glow Buddy stages', desc: 'Unlock rare and legendary buddy forms only available with Premium.', gradient: 'from-emerald-400 to-teal-400' },
  { icon: 'Palette', title: 'Premium themes', desc: 'A collection of beautiful color themes to make Glow Up yours.', gradient: 'from-amber-400 to-orange-400' },
  { icon: 'Bell', title: 'Gentle reminders', desc: 'Soft, customizable nudges that never feel pushy.', gradient: 'from-indigo-400 to-blue-400' },
] as const;

export function PremiumScreen({ onBack }: { onBack: () => void }) {
  const [joined, setJoined] = useState(false);

  function joinWaitlist() {
    haptic('success');
    setJoined(true);
  }

  return (
    <div className="px-4 pt-6 pb-32 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => { haptic('selection'); onBack(); }}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 dark:text-purple-300/60 mb-4"
      >
        <Icons.ChevronLeft className="w-4 h-4" /> Profile
      </button>

      {/* Hero card */}
      <GlassCard className="p-6 mb-5 bg-gradient-to-br from-pink-100/70 via-violet-100/50 to-purple-100/70 dark:from-purple-900/40 dark:via-pink-900/30 dark:to-violet-900/40 border-pink-200/50 dark:border-purple-700/40 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center shadow-lg">
            <Icons.Crown className="w-8 h-8 text-white" fill="currentColor" />
          </div>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-violet-600 dark:from-pink-300 dark:to-purple-300 bg-clip-text text-transparent">
          Glow Up Premium
        </h1>
        <p className="text-sm text-gray-500 dark:text-purple-200/70 mt-1.5 leading-relaxed">
          Elevate your self-care journey with deeper personalization and exclusive features.
        </p>
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Icons.Clock className="w-3 h-3 text-amber-600 dark:text-amber-300" />
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-300">Coming soon</span>
        </div>
      </GlassCard>

      {/* Feature list */}
      <div className="space-y-2.5 mb-6">
        {FEATURES.map((f) => {
          const IC = (Icons[f.icon as keyof typeof Icons] as typeof Icons.Sparkles | undefined) ?? Icons.Sparkles;
          return (
            <GlassCard key={f.title} className="p-4 flex items-start gap-3">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                <IC className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-800 dark:text-purple-100">{f.title}</h3>
                <p className="text-xs text-gray-400 dark:text-purple-300/60 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <GlassCard className="p-4 text-center border-2 border-transparent">
          <p className="text-xs font-semibold text-gray-400 dark:text-purple-300/60 uppercase tracking-wider">Monthly</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-purple-100 mt-1">
            €4.99<span className="text-sm font-normal text-gray-400">/mo</span>
          </p>
          <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20">
            <Icons.Clock className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300">Coming soon</span>
          </div>
        </GlassCard>
        <GlassCard className="p-4 text-center bg-gradient-to-br from-violet-100/60 to-pink-100/60 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-violet-300/40 dark:border-purple-600/40">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <p className="text-xs font-semibold text-violet-600 dark:text-purple-300 uppercase tracking-wider">Yearly</p>
            <span className="text-[9px] font-bold text-white bg-gradient-to-r from-pink-500 to-violet-500 px-1.5 py-0.5 rounded-full">Save 34%</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-purple-100">
            €39<span className="text-sm font-normal text-gray-400">/yr</span>
          </p>
          <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20">
            <Icons.Clock className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-300">Coming soon</span>
          </div>
        </GlassCard>
      </div>

      {/* Waitlist button or confirmation */}
      {joined ? (
        <GlassCard className="p-5 text-center bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
              <Icons.Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-purple-100">You're on the list!</h3>
          <p className="text-xs text-gray-500 dark:text-purple-200/70 mt-1 leading-relaxed">
            We'll send you a gentle nudge the moment Premium is ready. Thank you for being part of the glow.
          </p>
        </GlassCard>
      ) : (
        <button
          onClick={joinWaitlist}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-100 transition-all"
        >
          Join the waitlist
        </button>
      )}

      <p className="text-center text-[11px] text-gray-400 dark:text-purple-300/40 mt-4 leading-relaxed">
        Premium features are not yet available. No payment will be processed.
      </p>
    </div>
  );
}
