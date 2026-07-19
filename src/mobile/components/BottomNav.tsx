import * as Icons from 'lucide-react';
import { haptic } from '../lib/haptics';

export type TabId = 'home' | 'challenges' | 'progress' | 'rewards' | 'profile';

const TABS: { id: TabId; label: string; icon: keyof typeof Icons }[] = [
  { id: 'home', label: 'Home', icon: 'Home' },
  { id: 'challenges', label: 'Challenges', icon: 'CheckCircle' },
  { id: 'progress', label: 'Progress', icon: 'TrendingUp' },
  { id: 'rewards', label: 'Rewards', icon: 'Gift' },
  { id: 'profile', label: 'Profile', icon: 'User' },
];

export function BottomNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const activeIndex = TABS.findIndex((t) => t.id === active);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5">
      <div className="mx-auto max-w-md glass-nav rounded-[28px] shadow-[0_-8px_32px_-8px_rgba(236,72,153,0.15)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.5)] border border-white/50 dark:border-purple-900/30 px-1.5 py-1.5 flex items-center justify-between relative">
        {/* Sliding pill indicator */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-[22px] bg-gradient-to-br from-pink-500/10 to-violet-500/10 dark:from-pink-500/20 dark:to-violet-500/20 transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: `calc(${(activeIndex / TABS.length) * 100}% + 6px)`,
            width: `calc(${100 / TABS.length}% - 12px)`,
          }}
        />
        {TABS.map((tab) => {
          const IconComp = (Icons[tab.icon] as typeof Icons.Home) || Icons.Home;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { haptic('selection'); onChange(tab.id); }}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2.5 rounded-[22px] pressable z-10"
            >
              <IconComp
                className={`w-[22px] h-[22px] transition-all duration-300 ${
                  isActive
                    ? 'text-pink-500 dark:text-pink-300 scale-110'
                    : 'text-gray-400 dark:text-purple-300/40'
                }`}
                strokeWidth={isActive ? 2.6 : 2}
              />
              <span className={`text-[10px] font-semibold transition-all duration-300 ${
                isActive ? 'text-pink-600 dark:text-pink-200' : 'text-gray-400 dark:text-purple-300/40'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
