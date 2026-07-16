import * as Icons from 'lucide-react';
import type { Reward } from '../lib/supabase';

interface RewardsModalProps {
  rewards: Reward[];
  unlockedRewardIds: Set<string>;
  currentLevel: number;
  onClose: () => void;
}

const rewardTypeIcons: Record<string, string> = {
  theme: 'palette',
  avatar: 'user',
  badge_border: 'award',
  challenge_pack: 'package',
  confetti: 'party-popper',
};

const rewardTypeGradients: Record<string, string> = {
  theme: 'from-pink-500 to-rose-500',
  avatar: 'from-violet-500 to-purple-500',
  badge_border: 'from-amber-500 to-orange-500',
  challenge_pack: 'from-blue-500 to-cyan-500',
  confetti: 'from-emerald-500 to-teal-500',
};

export function RewardsModal({ rewards, unlockedRewardIds, currentLevel, onClose }: RewardsModalProps) {
  const sortedRewards = [...rewards].sort((a, b) => a.required_level - b.required_level);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
              <Icons.Gift className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Beloningen</h2>
              <p className="text-sm text-gray-500">
                {unlockedRewardIds.size} van {rewards.length} vrijgespeeld
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
          {sortedRewards.map((reward) => {
            const isUnlocked = unlockedRewardIds.has(reward.id);
            const isLocked = currentLevel < reward.required_level;
            const iconName = rewardTypeIcons[reward.reward_type] || 'gift';
            const IconComponent = (Icons[iconName as keyof typeof Icons] as typeof Icons.Gift) || Icons.Gift;
            const gradient = rewardTypeGradients[reward.reward_type] || 'from-gray-400 to-gray-500';

            return (
              <div
                key={reward.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-pink-50 to-violet-50 border-pink-200'
                    : isLocked
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isUnlocked
                        ? `bg-gradient-to-br ${gradient} shadow-lg`
                        : 'bg-gray-300'
                    }`}
                  >
                    <IconComponent className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{reward.name}</h3>
                      {isUnlocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded-full text-xs font-semibold text-green-600">
                          <Icons.CheckCircle className="w-3 h-3" />
                          Vrijgespeeld
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                    <div className="flex items-center gap-2">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-500">
                          <Icons.Lock className="w-3 h-3" />
                          Level {reward.required_level} vereist
                        </span>
                      ) : !isUnlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 rounded-full text-xs font-semibold text-amber-600">
                          <Icons.Sparkles className="w-3 h-3" />
                          Klaar om vrij te spelen!
                        </span>
                      ) : null}
                    </div>
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
