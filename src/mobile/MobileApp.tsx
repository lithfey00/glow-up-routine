import { useState } from 'react';
import { BottomNav, type TabId } from './components/BottomNav';
import { MobileAppProvider, useMobileApp } from './context/MobileAppContext';
import { HomeScreen } from './screens/HomeScreen';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { Onboarding } from './screens/Onboarding';
import * as Icons from 'lucide-react';

const ONBOARDED_KEY = 'glow-onboarded';

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
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-[88%] max-w-sm pointer-events-none">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-[22px] shadow-2xl shadow-black/10 bg-gradient-to-r ${bg}`}>
        <Icon className="w-5 h-5 text-white flex-shrink-0" fill={toast.type === 'level' ? 'currentColor' : 'none'} />
        <p className="text-white font-bold text-[14px]">{toast.message}</p>
      </div>
    </div>
  );
}

function MobileShell() {
  const [tab, setTab] = useState<TabId>('home');
  const [onboarded, setOnboarded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  });

  function completeOnboarding() {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setOnboarded(true);
  }

  if (!onboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 transition-colors duration-700">
      <div className="mx-auto max-w-md min-h-screen relative">
        {/* Animated background orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-pink-200/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-breathe" />
          <div className="absolute top-1/3 -left-20 w-64 h-64 bg-violet-200/20 dark:bg-violet-600/10 rounded-full blur-3xl animate-breathe" style={{ animationDelay: '1s' }} />
        </div>

        <div key={tab} className="relative animate-page-enter">
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
