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
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto max-w-md rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-purple-900/40 shadow-2xl shadow-pink-200/40 dark:shadow-black/40 px-2 py-2 flex items-center justify-between">
        {TABS.map((tab) => {
          const IconComp = (Icons[tab.icon] as typeof Icons.Home) || Icons.Home;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { haptic('selection'); onChange(tab.id); }}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-2xl transition-all"
            >
              {isActive && (
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/15 to-violet-500/15 dark:from-pink-500/25 dark:to-violet-500/25" />
              )}
              <IconComp
                className={`relative w-5 h-5 transition-all ${isActive ? 'text-pink-500 dark:text-pink-300 scale-110' : 'text-gray-400 dark:text-purple-300/50'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`relative text-[10px] font-semibold transition-all ${isActive ? 'text-pink-600 dark:text-pink-200' : 'text-gray-400 dark:text-purple-300/50'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
