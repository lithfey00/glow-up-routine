import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Achievement, UserAchievement } from '../lib/statsUtils';

interface AchievementModalProps {
  achievements: Achievement[];
  unlockedAchievements: Set<string>;
  onClose: () => void;
}

export function AchievementModal({ achievements, unlockedAchievements, onClose }: AchievementModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Icons.Award className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Achievements</h2>
              <p className="text-sm text-gray-500">
                {unlockedAchievements.size} of {achievements.length} unlocked
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
          {achievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.has(achievement.id);
            const IconComponent = (Icons[achievement.icon as keyof typeof Icons] as LucideIcon) || Icons.Award;

            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg'
                        : 'bg-gray-300'
                    }`}
                  >
                    <IconComponent className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    {isUnlocked && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-semibold text-amber-600">
                        <Icons.CheckCircle className="w-3.5 h-3.5" />
                        Unlocked
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
