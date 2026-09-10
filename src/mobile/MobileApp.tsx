import { useState } from 'react';
import { BottomNav, type TabId } from './components/BottomNav';
import { MobileAppProvider, useMobileApp } from './context/MobileAppContext';
import { HomeScreen } from './screens/HomeScreen';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import * as Icons from 'lucide-react';

function Toast() {
  const { toast } = useMobileApp();
  if (!toast) return null;
  const Icon = toast.type === 'achievement' ? Icons.Award
    : toast.type === 'reward' ? Icons.Gift
    : toast.type === 'level' ? Icons.Star
    : Icons.Zap;
  const bg = toast.type === 'achievement' ? 'from-amber-500 to-orange-500'
    : toast.type === 'reward' ? 'from-violet-500 to-pink-500'
    : toast.type === 'level' ? 'from-blue-500 to-cyan-500'
    : 'from-emerald-500 to-teal-500';
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-[90%] max-w-sm">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-gradient-to-r ${bg}`}>
        <Icon className="w-5 h-5 text-white flex-shrink-0" fill={toast.type === 'level' ? 'currentColor' : 'none'} />
        <p className="text-white font-semibold text-sm">{toast.message}</p>
      </div>
    </div>
  );
}

function MobileShell() {
  const [tab, setTab] = useState<TabId>('home');
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 transition-colors duration-500">
      {/* Phone-frame max width for desktop preview */}
      <div className="mx-auto max-w-md min-h-screen relative">
        <div className="pt-[max(0.5rem,env(safe-area-inset-top))]">
          {tab === 'home' && <HomeScreen />}
          {tab === 'challenges' && <ChallengesScreen />}
          {tab === 'progress' && <ProgressScreen />}
          {tab === 'rewards' && <RewardsScreen />}
          {tab === 'profile' && <ProfileScreen />}
        </div>
        <Toast />
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}

export function MobileApp() {
  return (
    <MobileAppProvider>
      <MobileShell />
    </MobileAppProvider>
  );
}
