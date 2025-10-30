import { Challenge } from '../lib/supabase';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  isCompleted: boolean;
  onToggle: () => void;
}

const categoryColors = {
  beauty: 'from-pink-500 to-rose-500',
  'self-care': 'from-emerald-500 to-teal-500',
  mindset: 'from-amber-500 to-orange-500',
  health: 'from-blue-500 to-cyan-500',
};

const categoryBg = {
  beauty: 'bg-pink-50 border-pink-200',
  'self-care': 'bg-emerald-50 border-emerald-200',
  mindset: 'bg-amber-50 border-amber-200',
  health: 'bg-blue-50 border-blue-200',
};

export function ChallengeCard({ challenge, isCompleted, onToggle }: ChallengeCardProps) {
  const IconComponent = (Icons[challenge.icon as keyof typeof Icons] as LucideIcon) || Icons.Sparkles;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        isCompleted
          ? 'bg-white border-gray-200 shadow-lg scale-[0.98]'
          : `${categoryBg[challenge.category]} shadow-md hover:shadow-xl hover:scale-[1.02]`
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[challenge.category]} flex items-center justify-center shadow-lg`}
          >
            <IconComponent className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <button
            onClick={onToggle}
            className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center ${
              isCompleted
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg'
                : 'bg-white border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            {isCompleted && <Icons.Check className="w-6 h-6 text-white" strokeWidth={3} />}
          </button>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">{challenge.title}</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{challenge.description}</p>

        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isCompleted ? 'bg-gray-100 text-gray-600' : `bg-white/80 text-gray-700`
            }`}
          >
            <Icons.Clock className="w-3.5 h-3.5" />
            {challenge.duration_minutes} min
          </span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {challenge.category}
          </span>
        </div>
      </div>

      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-500/10 pointer-events-none" />
      )}
    </div>
  );
}
