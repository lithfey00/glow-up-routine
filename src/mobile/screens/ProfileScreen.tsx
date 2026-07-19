import { useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard } from '../components/ui';
import { useTheme } from '../../lib/theme';
import { getLevelInfo } from '../../lib/statsUtils';
import { haptic } from '../lib/haptics';

export function ProfileScreen() {
  const { userStats, unlockedAchievements, buddyXp } = useMobileApp();
  const { theme, toggle } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('English');

  const levelInfo = getLevelInfo(userStats?.glow_points || 0);

  return (
    <div className="px-4 pt-6 pb-28 space-y-5 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-purple-100">Profile</h1>

      {/* Profile header */}
      <GlassCard className="p-6 bg-gradient-to-br from-pink-100/60 to-violet-100/60 dark:from-purple-900/30 dark:to-pink-900/30">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center shadow-lg">
            <Icons.User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-purple-100">Glow User</h2>
            <p className="text-sm text-gray-500 dark:text-purple-300/70">Level {levelInfo.level} • {levelInfo.name}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Icons.Zap className="w-3.5 h-3.5 text-violet-500" fill="currentColor" />
              <span className="text-sm font-bold text-violet-600 dark:text-purple-200">{userStats?.glow_points || 0}</span>
              <span className="text-xs text-gray-400">Glow Points</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center">
          <Icons.Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" fill="currentColor" />
          <p className="text-xl font-bold text-gray-800 dark:text-purple-100">{userStats?.current_streak || 0}</p>
          <p className="text-[10px] text-gray-400">Day Streak</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Icons.Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-800 dark:text-purple-100">{unlockedAchievements.size}</p>
          <p className="text-[10px] text-gray-400">Badges</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Icons.Sprout className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-800 dark:text-purple-100">{buddyXp}</p>
          <p className="text-[10px] text-gray-400">Buddy XP</p>
        </GlassCard>
      </div>

      {/* Goals */}
      <GlassCard className="p-5">
        <h2 className="text-base font-bold text-gray-800 dark:text-purple-100 mb-3">Your Goals</h2>
        <div className="space-y-3">
          <GoalRow icon={<Icons.Target className="w-4 h-4 text-pink-500" />} label="Complete 3 challenges daily" current={userStats?.total_completed || 0} target={3 * 30} />
          <GoalRow icon={<Icons.Flame className="w-4 h-4 text-orange-500" fill="currentColor" />} label="Reach a 30-day streak" current={userStats?.current_streak || 0} target={30} />
          <GoalRow icon={<Icons.Star className="w-4 h-4 text-violet-500" fill="currentColor" />} label="Reach Level 10" current={levelInfo.level} target={10} />
        </div>
      </GlassCard>

      {/* Settings */}
      <GlassCard className="p-2">
        <h2 className="text-base font-bold text-gray-800 dark:text-purple-100 px-3 pt-3 pb-2">Settings</h2>
        <SettingRow icon={<Icons.Moon className="w-5 h-5 text-indigo-500" />} label="Dark Mode" onClick={() => { haptic('selection'); toggle(); }}>
          <span className={`w-11 h-6 rounded-full transition-all relative ${theme === 'dark' ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
          </span>
        </SettingRow>
        <SettingRow icon={<Icons.Bell className="w-5 h-5 text-teal-500" />} label="Notifications" onClick={() => { haptic('selection'); setNotifications(!notifications); }}>
          <span className={`w-11 h-6 rounded-full transition-all relative ${notifications ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${notifications ? 'left-5' : 'left-0.5'}`} />
          </span>
        </SettingRow>
        <SettingRow icon={<Icons.Globe className="w-5 h-5 text-blue-500" />} label="Language">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-sm text-gray-600 dark:text-purple-200 bg-transparent">
            <option>English</option><option>Español</option><option>Français</option><option>Deutsch</option><option>Nederlands</option>
          </select>
        </SettingRow>
        <SettingRow icon={<Icons.Shield className="w-5 h-5 text-emerald-500" />} label="Privacy" chevron />
        <SettingRow icon={<Icons.Download className="w-5 h-5 text-amber-500" />} label="Export Data" chevron />
        <SettingRow icon={<Icons.Crown className="w-5 h-5 text-amber-500" fill="currentColor" />} label="Glow Premium" chevron />
      </GlassCard>

      <p className="text-center text-xs text-gray-400 dark:text-purple-300/40">Glow Up v2.0 • Made with love</p>
    </div>
  );
}

function GoalRow({ icon, label, current, target }: { icon: React.ReactNode; label: string; current: number; target: number }) {
  const pct = Math.min(100, (current / target) * 100);
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-semibold text-gray-600 dark:text-purple-200 flex-1">{label}</span>
        <span className="text-xs text-gray-400">{current}/{target}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-pink-400 to-violet-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SettingRow({ icon, label, onClick, children, chevron }: { icon: React.ReactNode; label: string; onClick?: () => void; children?: React.ReactNode; chevron?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3.5 border-t border-gray-100 dark:border-purple-900/20 first:border-t-0 hover:bg-pink-50/40 dark:hover:bg-purple-900/10 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-700/40 flex items-center justify-center">{icon}</div>
      <span className="text-sm font-semibold text-gray-700 dark:text-purple-100 flex-1 text-left">{label}</span>
      {children}
      {chevron && <Icons.ChevronRight className="w-4 h-4 text-gray-300" />}
    </button>
  );
}
