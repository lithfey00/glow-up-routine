import { useState } from 'react';
import { getBuddyStage, type BuddyStage } from '../../lib/types';

export interface BuddyMood {
  type: 'happy' | 'excited' | 'sleepy' | 'neutral' | 'celebrate';
  blurb: string;
}

const MOOD_BLURB: Record<BuddyMood['type'], string> = {
  happy: "I'm so proud of you today!",
  excited: "Let's keep this glow going!",
  sleepy: 'Rest is part of growth too...',
  neutral: 'Every step counts, lovely.',
  celebrate: 'You did it! Amazing work!',
};

export function getMoodForDay(completedToday: number, streak: number): BuddyMood {
  if (completedToday >= 5) return { type: 'celebrate', blurb: MOOD_BLURB.celebrate };
  if (completedToday >= 1) return { type: 'happy', blurb: MOOD_BLURB.happy };
  if (streak >= 3) return { type: 'excited', blurb: MOOD_BLURB.excited };
  if (new Date().getHours() >= 21) return { type: 'sleepy', blurb: MOOD_BLURB.sleepy };
  return { type: 'neutral', blurb: MOOD_BLURB.neutral };
}

const COLORS: Record<BuddyStage, { body: string; accent: string; glow: string; pot: string }> = {
  seed: { body: '#86efac', accent: '#4ade80', glow: '#bbf7d0', pot: '#d97706' },
  sprout: { body: '#4ade80', accent: '#22c55e', glow: '#86efac', pot: '#d97706' },
  plant: { body: '#22c55e', accent: '#16a34a', glow: '#4ade80', pot: '#b45309' },
  flower: { body: '#16a34a', accent: '#ec4899', glow: '#f9a8d4', pot: '#b45309' },
  tree: { body: '#15803d', accent: '#a16207', glow: '#65a30d', pot: '#92400e' },
};

export function BuddySVG({
  stage,
  size = 120,
  mood = 'happy',
  interactive = false,
}: {
  stage: BuddyStage;
  size?: number;
  mood?: BuddyMood['type'];
  interactive?: boolean;
}) {
  const [tapped, setTapped] = useState(false);
  const c = COLORS[stage];
  const bounceClass = interactive ? (tapped ? 'animate-wiggle' : 'animate-float') : '';

  function handleTap() {
    if (!interactive) return;
    setTapped(true);
    setTimeout(() => setTapped(false), 500);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      onClick={handleTap}
      className={`drop-shadow-[0_8px_16px_rgba(236,72,153,0.2)] ${interactive ? 'cursor-pointer' : ''} ${bounceClass}`}
      role="img"
      aria-label={`Glow Buddy at ${stage} stage`}
    >
      <defs>
        <radialGradient id={`glow-${stage}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={c.glow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`pot-${stage}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.pot} />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>

      {/* Ambient glow */}
      <circle cx="50" cy="45" r="42" fill={`url(#glow-${stage})`} className="animate-breathe" />

      {/* Pot */}
      <path d="M 30 78 L 35 95 L 65 95 L 70 78 Z" fill={`url(#pot-${stage})`} />
      <ellipse cx="50" cy="78" rx="20" ry="4" fill="#92400e" />
      <ellipse cx="50" cy="78" rx="18" ry="2.5" fill="#78350f" opacity="0.5" />

      {/* Plant body by stage */}
      {stage === 'seed' && <ellipse cx="50" cy="72" rx="8" ry="6" fill={c.body} className="animate-breathe" />}
      {stage !== 'seed' && <path d="M 50 78 Q 48 60 50 45" stroke={c.body} strokeWidth="4" fill="none" strokeLinecap="round" />}
      {stage === 'sprout' && (
        <>
          <ellipse cx="44" cy="58" rx="6" ry="3" fill={c.body} transform="rotate(-30 44 58)" />
          <ellipse cx="56" cy="58" rx="6" ry="3" fill={c.body} transform="rotate(30 56 58)" />
        </>
      )}
      {stage === 'plant' && (
        <>
          <ellipse cx="42" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(-25 42 55)" />
          <ellipse cx="58" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(25 58 55)" />
          <ellipse cx="44" cy="42" rx="6" ry="3.5" fill={c.body} transform="rotate(-20 44 42)" />
          <ellipse cx="56" cy="42" rx="6" ry="3.5" fill={c.body} transform="rotate(20 56 42)" />
        </>
      )}
      {stage === 'flower' && (
        <>
          <ellipse cx="42" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(-25 42 55)" />
          <ellipse cx="58" cy="55" rx="7" ry="4" fill={c.body} transform="rotate(25 58 55)" />
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse key={deg} cx="50" cy="32" rx="5" ry="8" fill={c.accent} transform={`rotate(${deg} 50 32)`} opacity="0.9" className="animate-breathe" style={{ transformOrigin: '50px 32px' }} />
          ))}
          <circle cx="50" cy="32" r="4" fill="#fbbf24" />
        </>
      )}
      {stage === 'tree' && (
        <>
          <ellipse cx="42" cy="55" rx="6" ry="3" fill={c.body} transform="rotate(-25 42 55)" />
          <ellipse cx="58" cy="55" rx="6" ry="3" fill={c.body} transform="rotate(25 58 55)" />
          <circle cx="50" cy="30" r="18" fill={c.body} className="animate-breathe" style={{ transformOrigin: '50px 30px' }} />
          <circle cx="38" cy="35" r="10" fill={c.body} opacity="0.9" />
          <circle cx="62" cy="35" r="10" fill={c.body} opacity="0.9" />
          <circle cx="50" cy="22" r="8" fill={c.glow} opacity="0.6" />
          <circle cx="44" cy="28" r="2" fill={c.accent} />
          <circle cx="56" cy="32" r="2" fill={c.accent} />
          <circle cx="50" cy="38" r="2" fill={c.accent} />
        </>
      )}

      {/* Face — mood-based */}
      {mood === 'sleepy' ? (
        <>
          <path d="M 45 50 Q 47 52 49 50" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 51 50 Q 53 52 55 50" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <text x="58" y="48" fontSize="6" fill="#1e293b" opacity="0.6">z</text>
          <text x="62" y="44" fontSize="4" fill="#1e293b" opacity="0.4">z</text>
        </>
      ) : mood === 'excited' || mood === 'celebrate' ? (
        <>
          <path d="M 44 49 L 46 47 M 46 49 L 44 47" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 54 49 L 56 47 M 56 49 L 54 47" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
          {mood === 'celebrate' && (
            <>
              <circle cx="30" cy="20" r="1.5" fill="#fbbf24" className="animate-sparkle" />
              <circle cx="70" cy="22" r="1.5" fill="#fbbf24" className="animate-sparkle" style={{ animationDelay: '0.3s' }} />
              <circle cx="20" cy="40" r="1" fill="#f9a8d4" className="animate-sparkle" style={{ animationDelay: '0.6s' }} />
              <circle cx="80" cy="42" r="1" fill="#f9a8d4" className="animate-sparkle" style={{ animationDelay: '0.9s' }} />
            </>
          )}
        </>
      ) : (
        <>
          <circle cx="47" cy="50" r="1.8" fill="#1e293b" />
          <circle cx="53" cy="50" r="1.8" fill="#1e293b" />
          <circle cx="47.5" cy="49.5" r="0.6" fill="white" />
          <circle cx="53.5" cy="49.5" r="0.6" fill="white" />
        </>
      )}

      {/* Mouth */}
      {mood === 'happy' || mood === 'excited' || mood === 'celebrate' ? (
        <path d="M 45 54 Q 50 58 55 54" stroke="#1e293b" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      ) : mood === 'sleepy' ? (
        <path d="M 48 55 L 52 55" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />
      ) : (
        <path d="M 47 55 Q 50 56 53 55" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      )}

      {/* Blush */}
      <circle cx="43" cy="54" r="2" fill="#f9a8d4" opacity="0.5" />
      <circle cx="57" cy="54" r="2" fill="#f9a8d4" opacity="0.5" />
    </svg>
  );
}

export function getStageFromXp(xp: number): { stage: BuddyStage; name: string; nextXp: number | null; progress: number } {
  return getBuddyStage(xp);
}
