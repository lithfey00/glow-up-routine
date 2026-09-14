import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { useMobileApp } from '../context/MobileAppContext';
import { GlassCard, Skeleton } from '../components/ui';
import { BuddySVG, getStageFromXp } from '../components/BuddySVG';
import { dailyQuote } from '../lib/quotes';
import { haptic } from '../lib/haptics';
import { supabase, type Challenge } from '../../lib/supabase';
import { getLevelInfo, updateUserStats } from '../../lib/statsUtils';
import { MOOD_CONFIG, type Mood, BUDDY_STAGES } from '../../lib/types';
import { getRecommendedChallenge } from '../../lib/recommend';

export function HomeScreen() {
  const {
    challenges, completedToday, userStats, buddyXp, mascot,
    toggleChallenge, completeChallenge, loading, sessionId, showToast, prefs,
  } = useMobileApp();
  const [mood, setMood] = useState<Mood | null>(null);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [quote] = useState(() => dailyQuote());

  const levelInfo = getLevelInfo(userStats?.glow_points || 0);
  const stageInfo = getStageFromXp(buddyXp);
  const daysInactive = mascot?.last_interaction
    ? Math.floor((Date.now() - new Date(mascot.last_interaction).getTime()) / 86400000)
    : 0;
  const isSleepy = daysInactive >= 3 && completedToday.size === 0;

  // Next buddy stage info
  const nextStage = useMemo(() => {
    for (let i = 0; i < BUDDY_STAGES.length; i++) {
      if (BUDDY_STAGES[i].stage === stageInfo.stage) {
        return BUDDY_STAGES[i + 1] || null;
      }
    }
    return null;
  }, [stageInfo.stage]);
  const xpUntilNext = nextStage ? nextStage.minXp - buddyXp : null;

  // Personalized glow moment pick
  const glowMoment = useMemo(() => {
    return getRecommendedChallenge(challenges, prefs ? { focus: prefs.focus, timeBudget: prefs.timeBudget, mood } : null, completedToday);
  }, [challenges, prefs, mood, completedToday]);

  const glowMomentDone = glowMoment ? completedToday.has(glowMoment.id) : false;

  const dailyPicks = useMemo(() => {
    const cats: Record<string, Challenge[]> = {};
    challenges.forEach((c) => { (cats[c.category] ||= []).push(c); });
    return Object.values(cats).map((arr) => arr[Math.floor(Math.random() * arr.length)]).filter(Boolean).slice(0, 4);
  }, [challenges]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_reward_claims')
        .select('id')
        .eq('user_id', sessionId)
        .eq('claim_date', today)
        .eq('reward_type', 'daily')
        .maybeSingle();
      setDailyClaimed(!!data);

      const { data: todayMood } = await supabase
        .from('mood_logs')
        .select('mood')
        .eq('user_id', sessionId)
        .gte('logged_at', `${today}T00:00:00`)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (todayMood) setMood(todayMood.mood as Mood);
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
      showToast(`+${reward} Glow Points claimed!`, 'coins');
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
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-32 space-y-5 animate-fade-in">
      <div>
        <p className="text-sm text-gray-400 dark:text-purple-300/60">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-violet-600 dark:from-pink-300 dark:to-purple-300 bg-clip-text text-transparent">
          Welcome back, lovely
        </h1>
      </div>

      <GlassCard className="p-5 bg-gradient-to-br from-pink-100/60 to-violet-100/60 dark:from-purple-900/30 dark:to-pink-900/30">
        <div className="flex items-start gap-3">
          <Icons.Quote className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 dark:text-purple-100/90 italic leading-relaxed">{quote}</p>
        </div>
      </GlassCard>

      {/* Glow Moment — the one daily action */}
      {glowMoment && (
        <GlassCard className="p-5 bg-gradient-to-br from-pink-100/80 via-violet-100/60 to-purple-100/80 dark:from-purple-900/40 dark:via-pink-900/30 dark:to-violet-900/40 border-pink-200/50 dark:border-purple-700/40">
          <div className="flex items-center gap-2 mb-3">
            <Icons.Sparkles className="w-4 h-4 text-pink-500" />
            <span className="text-xs font-bold text-pink-600 dark:text-pink-300 uppercase tracking-wider">Your glow moment for today</span>
          </div>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center flex-shrink-0 shadow-lg">
              {(() => {
                const C = (Icons[glowMoment.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
                return <C className="w-6 h-6 text-white" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800 dark:text-purple-100">{glowMoment.title}</h3>
              <p className="text-xs text-gray-500 dark:text-purple-200/70 mt-0.5 leading-relaxed line-clamp-2">{glowMoment.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-purple-300/70 bg-white/50 dark:bg-slate-700/40 px-2 py-0.5 rounded-full">
                  <Icons.Clock className="w-3 h-3" /> {glowMoment.duration_minutes} min
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 dark:text-purple-300 bg-violet-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                  <Icons.Zap className="w-3 h-3" fill="currentColor" /> +{glowMoment.glow_points} XP
                </span>
              </div>
            </div>
          </div>
          {glowMomentDone ? (
            <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-green-100 to-emerald-100 dark:from-emerald-900/30 dark:to-green-900/30">
              <Icons.Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" strokeWidth={3} />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-200">Completed today</span>
            </div>
          ) : (
            <button
              onClick={() => completeChallenge(glowMoment.id)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-bold shadow-lg hover:scale-[1.02] active:scale-100 transition-all"
            >
              Start your {glowMoment.duration_minutes}-minute glow
            </button>
          )}
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Zap className="w-4 h-4 text-violet-500" fill="currentColor" />
            <span className="text-xs font-semibold text-gray-500 dark:text-purple-300/70">Glow Points</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-purple-100">{userStats?.glow_points || 0}</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Level {levelInfo.level} • {levelInfo.name}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
            <span className="text-xs font-semibold text-gray-500 dark:text-purple-300/70">Day Streak</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-purple-100">{userStats?.current_streak || 0}</p>
          <p className="text-[10px] text-gray-400 mt-1">Best: {userStats?.longest_streak || 0} days</p>
        </GlassCard>
      </div>

      <GlassCard className="p-4 flex items-center justify-between" onClick={dailyClaimed ? undefined : claimDaily}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Icons.Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-purple-100">Daily Reward</p>
            <p className="text-xs text-gray-400">{dailyClaimed ? 'Claimed today' : '+25 Glow Points ready!'}</p>
          </div>
        </div>
        {!dailyClaimed && (
          <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-md">
            Claim
          </span>
        )}
      </GlassCard>

      {/* Glow Buddy with improved XP and next stage preview */}
      <GlassCard className="p-5 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 dark:text-purple-100">Glow Buddy</h2>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">{stageInfo.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="animate-float"><BuddySVG stage={stageInfo.stage} sleepy={isSleepy} size={100} /></div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-purple-100/80 leading-relaxed">
              {isSleepy ? 'Your buddy missed you! A tiny step today means the world.' : completedToday.size === 0 ? 'Ready when you are! One challenge helps us grow.' : "You're glowing! So proud of you today!"}
            </p>
            <div className="mt-3 h-2 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700" style={{ width: `${stageInfo.progress}%` }} />
            </div>
            {nextStage && xpUntilNext !== null ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-300/80 mt-1.5 font-semibold">
                {Math.max(0, xpUntilNext)} XP until {nextStage.name}
              </p>
            ) : (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-300/80 mt-1.5 font-semibold">
                Max stage reached
              </p>
            )}
          </div>
        </div>
        {/* Next stage preview */}
        {nextStage && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-emerald-100 dark:border-emerald-800/40">
            <div className="w-8 h-8 rounded-xl bg-white/60 dark:bg-slate-700/60 flex items-center justify-center opacity-60">
              <BuddySVG stage={nextStage.stage} size={32} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-purple-300/60">Next stage</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">{nextStage.name}</p>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="text-base font-bold text-gray-800 dark:text-purple-100 mb-3">Mood Check-in</h2>
        <div className="grid grid-cols-6 gap-2">
          {(Object.keys(MOOD_CONFIG) as Mood[]).map((m) => {
            const cfg = MOOD_CONFIG[m];
            return (
              <button key={m} onClick={() => saveMood(m)} className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${mood === m ? `${cfg.bg} border-transparent ring-2 ${cfg.ring} scale-105` : 'bg-gray-50 dark:bg-slate-700/40 border-transparent hover:scale-105'}`}>
                <span className="text-xl">{cfg.emoji}</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      <div>
        <h2 className="text-base font-bold text-gray-800 dark:text-purple-100 mb-3 px-1">Today's Challenges</h2>
        <div className="space-y-2.5">
          {dailyPicks.map((c) => {
            const done = completedToday.has(c.id);
            const IconComp = (Icons[c.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
            return (
              <GlassCard key={c.id} className="p-4 flex items-center gap-3" onClick={() => toggleChallenge(c.id)}>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                  <IconComp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-purple-100 truncate">{c.title}</h3>
                  <p className="text-xs text-gray-400">{c.duration_minutes} min • +{c.glow_points} XP</p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-md' : 'bg-white border-2 border-gray-200 dark:border-slate-600'}`}>
                  {done && <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
