import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, ProgressBar } from '../components/ui';
import { NativeScroll } from '../components/NativeScroll';
import { useTheme } from '../../lib/theme';
import { getLevelInfo } from '../../lib/statsUtils';
import { haptic } from '../lib/haptics';
import { supabase } from '../../lib/supabase';

export function ProfileScreen({ userName, onNameChange }: { userName?: string; onNameChange?: (n: string) => void }) {
  const { userStats, unlockedAchievements, buddyXp, refresh, sessionId } = useMobileApp();
  const { theme, toggle } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  const levelInfo = getLevelInfo(userStats?.glow_points || 0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('screen_views')
        .select('screen_name')
        .eq('session_id', sessionId);
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => {
        const name = (r as { screen_name: string }).screen_name;
        counts[name] = (counts[name] || 0) + 1;
      });
      setViewCounts(counts);
    })();
  }, [sessionId, userStats]);

  return (
    <NativeScroll onRefresh={refresh} contentClassName="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28 space-y-5 animate-page-enter">
      <h1 className="text-[28px] font-bold text-gray-800 dark:text-purple-100 font-quicksand tracking-tight">Profile</h1>

      {/* Profile hero */}
      <GlassCard variant="sheen" className="p-6 animate-fade-in bg-gradient-to-br from-pink-50/80 to-violet-50/80 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Icons.User className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-md border-2 border-pink-100 dark:border-purple-900">
              <span className="text-[10px] font-bold text-violet-600 dark:text-purple-300">{levelInfo.level}</span>
            </div>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-gray-800 dark:text-purple-100 font-quicksand">{userName || 'Glow User'}</h2>
            <p className="text-[13px] text-gray-500 dark:text-purple-300/60">{levelInfo.name}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Icons.Zap className="w-3.5 h-3.5 text-violet-500" fill="currentColor" />
              <span className="text-[15px] font-bold text-violet-600 dark:text-purple-200 font-quicksand">{userStats?.glow_points || 0}</span>
              <span className="text-[11px] text-gray-400">Glow Points</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in stagger-1">
        <StatBadge icon={<Icons.Flame className="w-5 h-5 text-orange-500" fill="currentColor" />} value={userStats?.current_streak || 0} label="Streak" gradient="from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20" />
        <StatBadge icon={<Icons.Award className="w-5 h-5 text-amber-500" />} value={unlockedAchievements.size} label="Badges" gradient="from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20" />
        <StatBadge icon={<Icons.Sprout className="w-5 h-5 text-emerald-500" />} value={buddyXp} label="Buddy XP" gradient="from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20" />
      </div>

      {/* Goals */}
      <GlassCard className="p-5 animate-fade-in stagger-2">
        <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand mb-4">Your Goals</h2>
        <div className="space-y-4">
          <GoalRow icon={<Icons.Target className="w-4 h-4 text-pink-500" />} label="Complete 3 challenges daily" current={userStats?.total_completed || 0} target={3 * 30} />
          <GoalRow icon={<Icons.Flame className="w-4 h-4 text-orange-500" fill="currentColor" />} label="Reach a 30-day streak" current={userStats?.current_streak || 0} target={30} />
          <GoalRow icon={<Icons.Star className="w-4 h-4 text-violet-500" fill="currentColor" />} label="Reach Level 10" current={levelInfo.level} target={10} />
        </div>
      </GlassCard>

      {/* Settings */}
      <GlassCard className="p-2 animate-fade-in stagger-3">
        <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand px-3 pt-3 pb-2">Settings</h2>
        <SettingRow icon={<Icons.Moon className="w-5 h-5 text-indigo-500" />} label="Dark Mode" onClick={() => { haptic('selection'); toggle(); }}>
          <ToggleSwitch on={theme === 'dark'} />
        </SettingRow>
        <SettingRow icon={<Icons.User className="w-5 h-5 text-pink-500" />} label="Edit Name" onClick={() => {
          const n = prompt('What should we call you?', userName || '');
          if (n !== null && onNameChange) { onNameChange(n.trim()); localStorage.setItem('glow-user-name', n.trim()); haptic('selection'); }
        }}>
          <span className="text-[13px] text-gray-400 font-medium max-w-[120px] truncate">{userName || 'Set name'}</span>
          <Icons.ChevronRight className="w-4 h-4 text-gray-300 dark:text-purple-300/30" />
        </SettingRow>
        <SettingRow icon={<Icons.Bell className="w-5 h-5 text-teal-500" />} label="Notifications" onClick={() => { haptic('selection'); setNotifications(!notifications); }}>
          <ToggleSwitch on={notifications} />
        </SettingRow>
        <SettingRow icon={<Icons.Globe className="w-5 h-5 text-blue-500" />} label="Language">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-[13px] text-gray-500 dark:text-purple-300/70 bg-transparent font-medium focus:outline-none">
            <option>English</option><option>Español</option><option>Français</option><option>Deutsch</option><option>Nederlands</option>
          </select>
        </SettingRow>
        <SettingRow icon={<Icons.Shield className="w-5 h-5 text-emerald-500" />} label="Privacy" chevron />
        <SettingRow icon={<Icons.Download className="w-5 h-5 text-amber-500" />} label="Export Data" chevron />
        <SettingRow icon={<Icons.Crown className="w-5 h-5 text-amber-500" fill="currentColor" />} label="Glow Premium" chevron premium />
      </GlassCard>

      {/* Analytics */}
      <GlassCard className="p-5 animate-fade-in stagger-4">
        <div className="flex items-center gap-2 mb-4">
          <Icons.BarChart3 className="w-5 h-5 text-violet-500" />
          <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand">Screen Views</h2>
        </div>
        <div className="space-y-2.5">
          {[
            { name: 'Home', icon: Icons.Home },
            { name: 'Challenges', icon: Icons.CheckCircle },
            { name: 'Progress', icon: Icons.TrendingUp },
            { name: 'Rewards', icon: Icons.Gift },
            { name: 'Profile', icon: Icons.User },
          ].map(({ name, icon: Icon }) => {
            const count = viewCounts[name.toLowerCase()] || 0;
            const total = Object.values(viewCounts).reduce((a, b) => a + b, 0) || 1;
            const pct = (count / total) * 100;
            return (
              <div key={name} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-[13px] font-semibold text-gray-600 dark:text-purple-200 w-20 flex-shrink-0">{name}</span>
                <div className="flex-1"><ProgressBar value={pct} gradient="from-pink-400 to-violet-400" /></div>
                <span className="text-[13px] font-bold text-gray-700 dark:text-purple-100 font-quicksand w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 text-center font-medium">Total: {Object.values(viewCounts).reduce((a, b) => a + b, 0)} views</p>
      </GlassCard>

      <p className="text-center text-[11px] text-gray-400 dark:text-purple-300/40 font-medium">Glow Up v2.0 · Made with love</p>
    </NativeScroll>
  );
}

function StatBadge({ icon, value, label, gradient }: { icon: React.ReactNode; value: string | number; label: string; gradient: string }) {
  return (
    <GlassCard className={`p-4 text-center bg-gradient-to-br ${gradient}`}>
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-[22px] font-bold text-gray-800 dark:text-purple-100 font-quicksand leading-none">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wide">{label}</p>
    </GlassCard>
  );
}

function GoalRow({ icon, label, current, target }: { icon: React.ReactNode; label: string; current: number; target: number }) {
  const pct = Math.min(100, (current / target) * 100);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[13px] font-semibold text-gray-600 dark:text-purple-200 flex-1">{label}</span>
        <span className="text-[11px] text-gray-400 font-medium">{current}/{target}</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span className={`w-11 h-6 rounded-full transition-all duration-300 relative ${on ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-gray-200 dark:bg-slate-700'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
  );
}

function SettingRow({ icon, label, onClick, children, chevron, premium }: { icon: React.ReactNode; label: string; onClick?: () => void; children?: React.ReactNode; chevron?: boolean; premium?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3.5 border-t border-gray-100/80 dark:border-purple-900/15 first:border-t-0 hover:bg-pink-50/40 dark:hover:bg-purple-900/10 transition-colors pressable">
      <div className="w-9 h-9 rounded-[14px] bg-gray-50 dark:bg-slate-700/40 flex items-center justify-center">{icon}</div>
      <span className="text-[14px] font-semibold text-gray-700 dark:text-purple-100 flex-1 text-left">{label}</span>
      {premium && <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">PRO</span>}
      {children}
      {chevron && <Icons.ChevronRight className="w-4 h-4 text-gray-300 dark:text-purple-300/30" />}
    </button>
  );
}
