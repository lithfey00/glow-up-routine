import * as Icons from 'lucide-react';
import type { Achievement } from '../lib/statsUtils';

interface AchievementModalProps {
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  onClose: () => void;
}

const rarityConfig: Record<string, { label: string; gradient: string; border: string; bg: string; textColor: string }> = {
  common: { label: 'Gewoon', gradient: 'from-gray-400 to-gray-500', border: 'border-gray-200', bg: 'from-gray-50 to-gray-100', textColor: 'text-gray-600' },
  rare: { label: 'Zeldzaam', gradient: 'from-blue-500 to-cyan-500', border: 'border-blue-200', bg: 'from-blue-50 to-cyan-50', textColor: 'text-blue-600' },
  epic: { label: 'Epic', gradient: 'from-violet-500 to-purple-500', border: 'border-violet-200', bg: 'from-violet-50 to-purple-50', textColor: 'text-violet-600' },
  legendary: { label: 'Legendary', gradient: 'from-amber-500 to-orange-500', border: 'border-amber-200', bg: 'from-amber-50 to-orange-50', textColor: 'text-amber-600' },
  secret: { label: 'Geheim', gradient: 'from-pink-500 to-rose-500', border: 'border-pink-200', bg: 'from-pink-50 to-rose-50', textColor: 'text-pink-600' },
};

const tierIcons: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

export function AchievementModal({ achievements, unlockedAchievements, onClose }: AchievementModalProps) {
  const sorted = [...achievements].sort((a, b) => {
    const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, secret: 4 };
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Icons.Award className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Badges</h2>
              <p className="text-sm text-gray-500">
                {unlockedAchievements.size} van {achievements.length} vrijgespeeld
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Icons.X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 grid gap-4">
          {sorted.map((achievement) => {
            const isUnlocked = unlockedAchievements.has(achievement.id);
            const IconComponent = (Icons[achievement.icon as keyof typeof Icons] as typeof Icons.Award) || Icons.Award;
            const rarity = rarityConfig[achievement.rarity] || rarityConfig.common;
            const tierIcon = tierIcons[achievement.tier] || '';

            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isUnlocked
                    ? `bg-gradient-to-br ${rarity.bg} ${rarity.border}`
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 relative ${
                      isUnlocked
                        ? `bg-gradient-to-br ${rarity.gradient} shadow-lg`
                        : 'bg-gray-300'
                    } ${isUnlocked ? 'animate-glow-pulse' : ''}`}
                  >
                    <IconComponent className="w-7 h-7 text-white" strokeWidth={2.5} />
                    {isUnlocked && achievement.tier !== 'bronze' && (
                      <span className="absolute -top-1 -right-1 text-xs">{tierIcon}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800">{achievement.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${rarity.textColor} bg-white/60`}>
                        {rarity.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    {isUnlocked ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-semibold text-green-600">
                        <Icons.CheckCircle className="w-3.5 h-3.5" />
                        Vrijgespeeld
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-400">
                        <Icons.Lock className="w-3.5 h-3.5" />
                        Vergrendeld
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
