import * as Icons from 'lucide-react';
import { Challenge } from '../lib/supabase';
import { LucideIcon } from 'lucide-react';

interface DailyPickerProps {
  dailyChallenges: Challenge[];
  completedToday: Set<string>;
  onToggle: (challengeId: string) => void;
  onRefresh: () => void;
}

const categoryColors = {
  beauty: 'from-pink-500 to-rose-500',
  'self-care': 'from-emerald-500 to-teal-500',
  mindset: 'from-amber-500 to-orange-500',
  health: 'from-blue-500 to-cyan-500',
};

export function DailyPicker({ dailyChallenges, completedToday, onToggle, onRefresh }: DailyPickerProps) {
  const totalMinutes = dailyChallenges.reduce((sum, c) => sum + c.duration_minutes, 0);
  const completedCount = dailyChallenges.filter((c) => completedToday.has(c.id)).length;

  return (
    <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icons.Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Today's Picks</h2>
              <p className="text-white/90 text-sm">Your personalized daily challenges</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors group"
            title="Pick new challenges"
          >
            <Icons.RefreshCw className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-6 text-white/90 text-sm">
          <div className="flex items-center gap-2">
            <Icons.Target className="w-4 h-4" />
            <span>
              {completedCount}/{dailyChallenges.length} completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.Clock className="w-4 h-4" />
            <span>{totalMinutes} minutes total</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {dailyChallenges.map((challenge) => {
          const isCompleted = completedToday.has(challenge.id);
          const IconComponent = (Icons[challenge.icon as keyof typeof Icons] as LucideIcon) || Icons.Sparkles;

          return (
            <div
              key={challenge.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                    categoryColors[challenge.category]
                  } flex items-center justify-center flex-shrink-0 shadow-md`}
                >
                  <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 mb-1">{challenge.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Icons.Clock className="w-3 h-3" />
                      {challenge.duration_minutes} min
                    </span>
                    <span className="uppercase tracking-wider">{challenge.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => onToggle(challenge.id)}
                  className={`w-10 h-10 rounded-full transition-all flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg'
                      : 'bg-white border-2 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {isCompleted && <Icons.Check className="w-5 h-5 text-white" strokeWidth={3} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
