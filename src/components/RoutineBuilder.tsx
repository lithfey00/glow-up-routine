import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Challenge } from '../lib/supabase';
import type { Routine, TimeOfDay } from '../lib/types';

interface RoutineBuilderProps {
  userId: string;
  challenges: Challenge[];
  completedToday: Set<string>;
  onToggle: (challengeId: string) => void;
}

const TOD_CONFIG: Record<TimeOfDay, { label: string; icon: string; gradient: string }> = {
  morning: { label: 'Morning', icon: 'sunrise', gradient: 'from-amber-300 to-orange-400' },
  afternoon: { label: 'Afternoon', icon: 'sun', gradient: 'from-yellow-300 to-amber-400' },
  evening: { label: 'Evening', icon: 'moon', gradient: 'from-indigo-300 to-violet-400' },
};

export function RoutineBuilder({ userId, challenges, completedToday, onToggle }: RoutineBuilderProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTOD, setNewTOD] = useState<TimeOfDay>('morning');
  const [searchCat, setSearchCat] = useState<string>('all');

  useEffect(() => {
    loadRoutines();
  }, [userId]);

  async function loadRoutines() {
    const { data } = await supabase
      .from('routines')
      .select('*, routine_items(*, challenges(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    const r = (data || []) as Routine[];
    setRoutines(r);
    if (r.length > 0 && !selectedRoutine) setSelectedRoutine(r[0].id);
  }

  async function createRoutine() {
    if (!newName.trim()) return;
    const { data } = await supabase
      .from('routines')
      .insert({ user_id: userId, name: newName.trim(), time_of_day: newTOD, is_active: true })
      .select('*')
      .single();
    if (data) {
      const newRoutine = { ...data, routine_items: [] } as Routine;
      setRoutines((prev) => [...prev, newRoutine]);
      setSelectedRoutine(data.id);
      setNewName('');
      setShowCreate(false);
    }
  }

  async function deleteRoutine(id: string) {
    await supabase.from('routines').delete().eq('id', id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (selectedRoutine === id) setSelectedRoutine(routines[0]?.id || null);
  }

  async function addChallenge(routineId: string, challengeId: string) {
    const routine = routines.find((r) => r.id === routineId);
    const sortOrder = routine?.routine_items?.length || 0;
    await supabase.from('routine_items').insert({ routine_id: routineId, challenge_id: challengeId, sort_order: sortOrder });
    await loadRoutines();
  }

  async function removeItem(itemId: string) {
    await supabase.from('routine_items').delete().eq('id', itemId);
    await loadRoutines();
  }

  const active = routines.find((r) => r.id === selectedRoutine);
  const filteredChallenges = searchCat === 'all' ? challenges : challenges.filter((c) => c.category === searchCat);

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border-2 border-amber-100 dark:border-amber-900/40 p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Icons.ListChecks className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-purple-100">Custom Routines</h3>
            <p className="text-sm text-gray-500 dark:text-purple-300/70">Build your own morning, afternoon & evening flows</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-semibold shadow-md hover:scale-105 transition-all flex items-center gap-2"
        >
          <Icons.Plus className="w-4 h-4" /> New Routine
        </button>
      </div>

      {showCreate && (
        <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-100 dark:border-amber-900/40 animate-fade-in">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Routine name (e.g. Morning Glow)"
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border-2 border-gray-100 dark:border-slate-600 text-sm text-gray-700 dark:text-purple-100 mb-3 focus:outline-none focus:border-amber-300"
          />
          <div className="flex gap-2 mb-3">
            {(Object.keys(TOD_CONFIG) as TimeOfDay[]).map((tod) => {
              const cfg = TOD_CONFIG[tod];
              const IconComp = (Icons[cfg.icon as keyof typeof Icons] as typeof Icons.Sun) || Icons.Sun;
              return (
                <button
                  key={tod}
                  onClick={() => setNewTOD(tod)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    newTOD === tod
                      ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-md`
                      : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-purple-300/70'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" /> {cfg.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={createRoutine}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-md"
          >
            Create Routine
          </button>
        </div>
      )}

      {routines.length === 0 ? (
        <div className="text-center py-10">
          <Icons.ListChecks className="w-12 h-12 text-amber-200 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-purple-300/50 text-sm">No routines yet. Create your first one!</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {routines.map((r) => {
              const cfg = TOD_CONFIG[r.time_of_day];
              const IconComp = (Icons[cfg.icon as keyof typeof Icons] as typeof Icons.Sun) || Icons.Sun;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoutine(r.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    selectedRoutine === r.id
                      ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-md`
                      : 'bg-gray-100 dark:bg-slate-700/40 text-gray-500 dark:text-purple-300/70'
                  }`}
                >
                  <IconComp className="w-4 h-4" /> {r.name}
                </button>
              );
            })}
          </div>

          {active && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-600 dark:text-purple-200">
                  {active.routine_items?.length || 0} challenges in this routine
                </p>
                <button
                  onClick={() => deleteRoutine(active.id)}
                  className="text-xs text-rose-400 hover:text-rose-500 flex items-center gap-1"
                >
                  <Icons.Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              {active.routine_items && active.routine_items.length > 0 ? (
                <div className="space-y-2 mb-5">
                  {active.routine_items.sort((a, b) => a.sort_order - b.sort_order).map((item, idx) => {
                    const ch = item.challenges;
                    if (!ch) return null;
                    const done = completedToday.has(ch.id);
                    const IconComp = (Icons[ch.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-600/40">
                        <span className="text-xs font-bold text-gray-300 dark:text-purple-300/40 w-5">{idx + 1}</span>
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                          <IconComp className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-purple-100 truncate">{ch.title}</h4>
                          <p className="text-xs text-gray-400">{ch.duration_minutes} min • +{ch.glow_points} XP</p>
                        </div>
                        <button onClick={() => onToggle(ch.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${done ? 'bg-green-400' : 'bg-white border-2 border-gray-200 dark:border-slate-600'}`}>
                          {done && <Icons.Check className="w-4 h-4 text-white" strokeWidth={3} />}
                        </button>
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-rose-400">
                          <Icons.X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 dark:text-purple-300/50 py-4 mb-4">Add challenges below to build your routine</p>
              )}

              <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Add challenges</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['all', 'beauty', 'self-care', 'mindset', 'health'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSearchCat(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                        searchCat === cat ? 'bg-amber-400 text-white' : 'bg-gray-100 dark:bg-slate-700/40 text-gray-500 dark:text-purple-300/70'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filteredChallenges
                    .filter((c) => !active.routine_items?.some((i) => i.challenge_id === c.id))
                    .slice(0, 12)
                    .map((c) => {
                      const IconComp = (Icons[c.icon as keyof typeof Icons] as typeof Icons.Sparkles) || Icons.Sparkles;
                      return (
                        <button
                          key={c.id}
                          onClick={() => addChallenge(active.id, c.id)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-100 dark:border-slate-600/40 transition-all text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                            <IconComp className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-700 dark:text-purple-100 truncate">{c.title}</p>
                            <p className="text-[10px] text-gray-400">{c.duration_minutes} min</p>
                          </div>
                          <Icons.PlusCircle className="w-4 h-4 text-amber-400" />
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
