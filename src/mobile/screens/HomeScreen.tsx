import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, Skeleton, SectionHeader, ProgressBar, Pressable } from '../components/ui';
import { BuddySVG, getStageFromXp } from '../components/BuddySVG';
import { NativeScroll } from '../components/NativeScroll';
import { dailyQuote } from '../lib/quotes';
import { haptic } from '../lib/haptics';
import { supabase, type Challenge } from '../../lib/supabase';
import { getLevelInfo, updateUserStats } from '../../lib/statsUtils';
import { MOOD_CONFIG, type Mood } from '../../lib/types';

export function HomeScreen() {
  const { challenges, completedToday, userStats, buddyXp, mascot, toggleChallenge, loading, sessionId, showToast, refresh } = useMobileApp();
  const [mood, setMood] = useState<Mood | null>(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [quote] = useState(() => dailyQuote());

  const levelInfo = getLevelInfo(userStats?.glow_points || 0);
  const stageInfo = getStageFromXp(buddyXp);
  const daysInactive = mascot?.last_interaction
    ? Math.floor((Date.now() - new Date(mascot.last_interaction).getTime()) / 86400000)
    : 0;
  const isSleepy = daysInactive >= 3 && completedToday.size === 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const dailyPicks = useMemo(() => {
    const cats: Record<string, Challenge[]> = {};
    challenges.forEach((c) => { (cats[c.category] ||= []).push(c); });
    return Object.values(cats).map((arr) => arr[Math.floor(Math.random() * arr.length)]).filter(Boolean).slice(0, 4);
  }, [challenges]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const [daily, moodLog] = await Promise.all([
        supabase.from('daily_reward_claims').select('id').eq('user_id', sessionId).eq('claim_date', today).eq('reward_type', 'daily').maybeSingle(),
        supabase.from('mood_logs').select('mood').eq('user_id', sessionId).gte('logged_at', `${today}T00:00:00`).order('logged_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      setDailyClaimed(!!daily.data);
      if (moodLog.data) setMood(moodLog.data.mood as Mood);
    })();
  }, [sessionId]);

  async function claimDaily() {
    if (dailyClaimed) return;
    const reward = 25;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_reward_claims').insert({
      user_id: sessionId, claim_date: today, reward_type: 'daily', glow_points_awarded: reward,
    });
    if (!error) {
      setDailyClaimed(true);
      haptic('success');
      await updateUserStats(sessionId, completedToday.size, userStats?.total_completed || 0, reward, false);
      showToast(`+${reward} Glow Points!`, 'coins');
    }
  }

  async function saveMood(m: Mood) {
    setMood(m);
    haptic('light');
    await supabase.from('mood_logs').insert({
      user_id: sessionId, mood: m, energy: 3, logged_at: new Date().toISOString(),
    });
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <NativeScroll onRefresh={refresh} contentClassName="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28 space-y-5" >
      {/* Hero greeting */}
      <div className="animate-fade-in">
        <p className="text-[13px] text-gray-400 dark:text-purple-300/50 font-medium">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-[28px] font-bold text-gradient font-quicksand tracking-tight leading-tight">
          {greeting}, lovely
        </h1>
      </div>

      {/* Quote card */}
      <GlassCard variant="sheen" className="p-5 animate-fade-in stagger-1 bg-gradient-to-br from-pink-50/80 to-violet-50/80 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-400/20 to-violet-400/20 flex items-center justify-center flex-shrink-0">
            <Icons.Quote className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-[14px] text-gray-600 dark:text-purple-100/85 italic leading-relaxed font-medium">{quote}</p>
        </div>
      </GlassCard>

      {/* XP + Streak */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in stagger-2">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Icons.Zap className="w-3.5 h-3.5 text-violet-500" fill="currentColor" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-purple-300/60 uppercase tracking-wide">Glow Points</span>
          </div>
          <p className="text-[26px] font-bold text-gray-800 dark:text-purple-100 font-quicksand leading-none">{userStats?.glow_points || 0}</p>
          <div className="mt-2.5">
            <ProgressBar value={levelInfo.progress} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Level {levelInfo.level} · {levelInfo.name}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Icons.Flame className="w-3.5 h-3.5 text-orange-500" fill="currentColor" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-purple-300/60 uppercase tracking-wide">Streak</span>
          </div>
          <p className="text-[26px] font-bold text-gray-800 dark:text-purple-100 font-quicksand leading-none">{userStats?.current_streak || 0}<span className="text-[14px] text-gray-400 ml-1">days</span></p>
          <div className="mt-2.5 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`flex-1 h-2.5 rounded-full transition-all ${i < Math.min(7, userStats?.current_streak || 0) ? 'bg-gradient-to-r from-orange-400 to-pink-400' : 'bg-gray-100 dark:bg-slate-700/50'}`} />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Best: {userStats?.longest_streak || 0} days</p>
        </GlassCard>
      </div>

      {/* Daily reward */}
      <Pressable onClick={dailyClaimed ? undefined : claimDaily} className="w-full">
        <GlassCard variant="sheen" className="p-4 flex items-center justify-between animate-fade-in stagger-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shadow-lg transition-all ${dailyClaimed ? 'bg-gray-100 dark:bg-slate-700/50' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30 animate-glow-pulse'}`}>
              <Icons.Gift className={`w-6 h-6 ${dailyClaimed ? 'text-gray-400' : 'text-white'}`} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-800 dark:text-purple-100">Daily Reward</p>
              <p className="text-[12px] text-gray-400 dark:text-purple-300/50">{dailyClaimed ? 'Claimed today — see you tomorrow!' : '+25 Glow Points ready to claim'}</p>
            </div>
          </div>
          {!dailyClaimed && (
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[12px] font-bold shadow-md">
              Claim
            </span>
          )}
        </GlassCard>
      </Pressable>

      {/* Glow Buddy */}
      <GlassCard className="p-5 animate-fade-in stagger-4 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 dark:from-emerald-900/15 dark:to-teal-900/15">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-gray-800 dark:text-purple-100 font-quicksand">Glow Buddy</h2>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">{stageInfo.name}</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="animate-float flex-shrink-0"><BuddySVG stage={stageInfo.stage} sleepy={isSleepy} size={104} /></div>
          <div className="flex-1">
            <p className="text-[14px] text-gray-600 dark:text-purple-100/80 leading-relaxed font-medium">
              {isSleepy ? 'Your buddy missed you! A tiny step today means the world.' : completedToday.size === 0 ? 'Ready when you are! One challenge helps us grow.' : 'You\'re glowing! So proud of you today!'}
            </p>
            <div className="mt-3">
              <ProgressBar value={stageInfo.progress} gradient="from-emerald-400 to-teal-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{buddyXp} Buddy XP</p>
          </div>
        </div>
      </GlassCard>

      {/* Mood check-in */}
      <div className="animate-fade-in stagger-5">
        <SectionHeader title="Mood Check-in" />
        <GlassCard className="p-5">
          <div className="grid grid-cols-6 gap-2">
            {(Object.keys(MOOD_CONFIG) as Mood[]).map((m, i) => {
              const cfg = MOOD_CONFIG[m];
              const selected = mood === m;
              return (
                <button
                  key={m}
                  onClick={() => saveMood(m)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all duration-300 pressable ${selected ? `${cfg.bg} border-transparent ring-2 ${cfg.ring} scale-110` : 'bg-gray-50/50 dark:bg-slate-700/30 border-transparent hover:scale-105'}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className={`text-[22px] transition-transform ${selected ? 'animate-bounce-in' : ''}`}>{cfg.emoji}</span>
                </button>
              );
            })}
          </div>
          {mood && <p className="text-[12px] text-gray-400 mt-3 text-center font-medium">Feeling {mood} — logged for today</p>}
        </GlassCard>
      </div>

      {/* Today's challenges */}
      <div className="animate-fade-in stagger-6">
        <SectionHeader title="Today's Challenges" action="See all" />
        <div className="space-y-2.5">
          {dailyPicks.map((c) => {
            const done = completedToday.has(c.id);
            const IconComp = (Icons[c.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
            return (
              <Pressable key={c.id} onClick={() => toggleChallenge(c.id)}>
                <GlassCard className={`p-3.5 flex items-center gap-3 ${done ? 'opacity-70' : ''}`} >
                  <div className={`w-11 h-11 rounded-[18px] flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-violet-400 to-pink-400'}`}>
                    {done ? <Icons.Check className="w-5 h-5 text-white" strokeWidth={3} /> : <IconComp className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-[14px] font-bold text-gray-800 dark:text-purple-100 truncate ${done ? 'line-through text-gray-400' : ''}`}>{c.title}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{c.duration_minutes} min · +{c.glow_points} XP</p>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${done ? 'bg-green-500' : 'bg-gray-100 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600'}`}>
                    {done && <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </GlassCard>
              </Pressable>
            );
          })}
        </div>
      </div>
    </NativeScroll>
  );
}
