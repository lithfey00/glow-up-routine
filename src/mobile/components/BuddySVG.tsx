import { getBuddyStage, type BuddyStage } from '../../lib/types';

export function BuddySVG({ stage, sleepy, size = 120 }: { stage: BuddyStage; sleepy?: boolean; size?: number }) {
  const colors: Record<BuddyStage, { body: string; accent: string; glow: string }> = {
    seed: { body: '#86efac', accent: '#4ade80', glow: '#bbf7d0' },
    sprout: { body: '#4ade80', accent: '#22c55e', glow: '#86efac' },
    plant: { body: '#22c55e', accent: '#16a34a', glow: '#4ade80' },
    flower: { body: '#16a34a', accent: '#ec4899', glow: '#f9a8d4' },
    tree: { body: '#15803d', accent: '#a16207', glow: '#65a30d' },
  };
  const c = colors[stage];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-[0_8px_16px_rgba(236,72,153,0.2)]">
      <defs>
        <radialGradient id={`glow-${stage}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={c.glow} stopOpacity="0.4" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="45" r="42" fill={`url(#glow-${stage})`} />
      <path d="M 30 78 L 35 95 L 65 95 L 70 78 Z" fill="#d97706" />
      <ellipse cx="50" cy="78" rx="20" ry="4" fill="#b45309" />
      {stage === 'seed' && <ellipse cx="50" cy="72" rx="8" ry="6" fill={c.body} />}
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
            <ellipse key={deg} cx="50" cy="32" rx="5" ry="8" fill={c.accent} transform={`rotate(${deg} 50 32)`} opacity="0.9" />
          ))}
          <circle cx="50" cy="32" r="4" fill="#fbbf24" />
        </>
      )}
      {stage === 'tree' && (
        <>
          <ellipse cx="42" cy="55" rx="6" ry="3" fill={c.body} transform="rotate(-25 42 55)" />
          <ellipse cx="58" cy="55" rx="6" ry="3" fill={c.body} transform="rotate(25 58 55)" />
          <circle cx="50" cy="30" r="18" fill={c.body} />
          <circle cx="38" cy="35" r="10" fill={c.body} opacity="0.9" />
          <circle cx="62" cy="35" r="10" fill={c.body} opacity="0.9" />
          <circle cx="50" cy="22" r="8" fill={c.glow} opacity="0.6" />
          <circle cx="44" cy="28" r="2" fill={c.accent} />
          <circle cx="56" cy="32" r="2" fill={c.accent} />
          <circle cx="50" cy="38" r="2" fill={c.accent} />
        </>
      )}
      {sleepy ? (
        <>
          <path d="M 45 50 Q 47 52 49 50" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 51 50 Q 53 52 55 50" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="47" cy="50" r="1.8" fill="#1e293b" />
          <circle cx="53" cy="50" r="1.8" fill="#1e293b" />
          <circle cx="47.5" cy="49.5" r="0.6" fill="white" />
          <circle cx="53.5" cy="49.5" r="0.6" fill="white" />
        </>
      )}
      <path d="M 47 55 Q 50 57 53 55" stroke="#1e293b" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="43" cy="54" r="2" fill="#f9a8d4" opacity="0.5" />
      <circle cx="57" cy="54" r="2" fill="#f9a8d4" opacity="0.5" />
    </svg>
  );
}

export function getStageFromXp(xp: number): { stage: BuddyStage; name: string; nextXp: number | null; progress: number } {
  const info = getBuddyStage(xp);
  return info;
}
