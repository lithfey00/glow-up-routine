import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import type { MascotState } from '../lib/supabase';

interface StarDragonProps {
  mascot: MascotState | null;
  completedToday: number;
  levelName: string;
  level: number;
  glowPoints: number;
  hasNewAchievement: boolean;
  onSecretFound: () => void;
}

const stageNames: Record<MascotState['evolution_stage'], string> = {
  egg: 'Sterren-Ei',
  baby: 'Babydraak',
  glowing: 'Glowing Draak',
  cosmic: 'Cosmic Draak',
  legendary: 'Legendary Glow Dragon',
};

const stageThresholds: Record<MascotState['evolution_stage'], { level: number; next: number }> = {
  egg: { level: 1, next: 5 },
  baby: { level: 5, next: 15 },
  glowing: { level: 15, next: 30 },
  cosmic: { level: 30, next: 50 },
  legendary: { level: 50, next: 50 },
};

const moodMessages: Record<MascotState['mood'], string> = {
  happy: 'Hoi! Ik ben je Glow buddy. Latwe samen groeien!',
  sleeping: 'Zzz... Ik rust even uit. Kom later terug!',
  excited: 'Wauw! Je hebt iets nieuws vrijgespeeld!',
  proud: 'Goed bezig! Ik ben supertrots op je!',
  encouraging: 'Je kunt het! Elke stap telt. Ga door!',
};

export function StarDragon({ mascot, completedToday, levelName, level, glowPoints, hasNewAchievement, onSecretFound }: StarDragonProps) {
  const [showMessage, setShowMessage] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [, setSecretClicks] = useState(0);
  const [secretFound, setSecretFound] = useState(false);

  const stage = mascot?.evolution_stage || 'egg';
  const mood = mascot?.mood || 'happy';
  const glowEnergy = mascot?.glow_energy || 0;

  useEffect(() => {
    if (hasNewAchievement) {
      setBounce(true);
      setShowMessage(true);
      const timer = setTimeout(() => {
        setBounce(false);
        setShowMessage(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hasNewAchievement]);

  useEffect(() => {
    setShowMessage(true);
    const timer = setTimeout(() => setShowMessage(false), 5000);
    return () => clearTimeout(timer);
  }, [mood]);

  const handleDragonClick = () => {
    setBounce(true);
    setShowMessage(true);
    setTimeout(() => setBounce(false), 600);
    setTimeout(() => setShowMessage(false), 4000);
  };

  const handleSecretClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (secretFound) return;
    setSecretClicks((prev) => {
      const next = prev + 1;
      if (next >= 7) {
        setSecretFound(true);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 5000);
        onSecretFound();
      }
      return next;
    });
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50 rounded-3xl shadow-xl border-2 border-pink-100 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Jouw Glow Buddy</h2>
              <p className="text-white/80 text-xs">{stageNames[stage]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
            <Icons.Zap className="w-4 h-4 text-yellow-300" fill="currentColor" />
            <span className="text-white font-bold text-sm">{glowEnergy}</span>
            <span className="text-white/70 text-xs">Glow Energy</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center">
        <div
          className={`relative cursor-pointer transition-transform ${bounce ? 'animate-bounce' : 'hover:scale-105'}`}
          onClick={handleDragonClick}
        >
          <DragonSVG stage={stage} mood={mood} />
          {mood === 'excited' && (
            <>
              <SparkleParticle className="top-0 left-2" delay="0s" />
              <SparkleParticle className="top-4 right-0" delay="0.3s" />
              <SparkleParticle className="bottom-8 left-0" delay="0.6s" />
              <SparkleParticle className="bottom-0 right-4" delay="0.9s" />
            </>
          )}
          <button
            onClick={handleSecretClick}
            className="absolute top-0 right-0 w-6 h-6 opacity-0 cursor-pointer"
            aria-label="secret"
            title="?"
          />
        </div>

        {showMessage && (
          <div className="mt-4 bg-white rounded-2xl px-5 py-3 shadow-lg border border-pink-100 max-w-xs text-center animate-fade-in">
            <p className="text-gray-700 text-sm font-medium leading-relaxed">
              {secretFound ? 'Je hebt een geheim ontdekt!' : moodMessages[mood]}
            </p>
          </div>
        )}

        <div className="mt-4 w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Evolutie voortgang</span>
            <span className="font-semibold">Level {level} | {levelName}</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${getEvolutionProgress(stage, level)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Icons.Heart className="w-3 h-3 text-pink-400" fill="currentColor" />
            <span>{completedToday} challenges vandaag</span>
            <span className="text-gray-300">|</span>
            <Icons.Star className="w-3 h-3 text-amber-400" fill="currentColor" />
            <span>{glowPoints} Glow Points</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEvolutionProgress(stage: MascotState['evolution_stage'], level: number): number {
  const threshold = stageThresholds[stage];
  if (stage === 'legendary') return 100;
  const range = threshold.next - threshold.level;
  const progress = ((level - threshold.level) / range) * 100;
  return Math.min(100, Math.max(0, progress));
}

function SparkleParticle({ className, delay }: { className: string; delay: string }) {
  return (
    <div
      className={`absolute ${className} pointer-events-none`}
      style={{ animation: `sparkle-float 1.5s ease-in-out infinite`, animationDelay: delay }}
    >
      <Icons.Sparkles className="w-4 h-4 text-yellow-400" fill="currentColor" />
    </div>
  );
}

function DragonSVG({ stage, mood }: { stage: MascotState['evolution_stage']; mood: MascotState['mood'] }) {
  const isSleeping = mood === 'sleeping';
  const isExcited = mood === 'excited';
  const isProud = mood === 'proud';

  const bodyColor = stage === 'egg' ? '#c4b5fd' :
    stage === 'baby' ? '#a78bfa' :
    stage === 'glowing' ? '#8b5cf6' :
    stage === 'cosmic' ? '#6366f1' :
    '#4f46e5';

  const glowColor = stage === 'glowing' ? '#fbbf24' :
    stage === 'cosmic' ? '#818cf8' :
    stage === 'legendary' ? '#fbbf24' :
    '#e9d5ff';

  const size = stage === 'egg' ? 80 : stage === 'baby' ? 100 : stage === 'glowing' ? 120 : 140;

  if (stage === 'egg') {
    return (
      <svg width={size} height={size * 1.2} viewBox="0 0 100 120" className="drop-shadow-lg">
        <defs>
          <radialGradient id="eggGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#ddd6fe" />
            <stop offset="100%" stopColor={bodyColor} />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="65" rx="38" ry="48" fill="url(#eggGrad)" />
        <circle cx="38" cy="50" r="6" fill="white" opacity="0.5" />
        <path d="M 30 40 Q 35 35 40 40" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M 55 30 Q 60 25 65 30" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M 25 70 Q 30 65 35 70" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M 60 80 Q 65 75 70 80" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.4" />
        {isSleeping && <text x="70" y="35" fontSize="14" fill="#7c3aed" opacity="0.6">z</text>}
        {isSleeping && <text x="78" y="25" fontSize="10" fill="#7c3aed" opacity="0.4">z</text>}
      </svg>
    );
  }

  const eyeShape = isSleeping ? (
    <>
      <path d="M 38 55 Q 42 58 46 55" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 58 55 Q 62 58 66 55" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ) : isExcited ? (
    <>
      <circle cx="42" cy="55" r="5" fill="white" />
      <circle cx="42" cy="55" r="3" fill="#1e1b4b" />
      <circle cx="43" cy="54" r="1" fill="white" />
      <circle cx="62" cy="55" r="5" fill="white" />
      <circle cx="62" cy="55" r="3" fill="#1e1b4b" />
      <circle cx="63" cy="54" r="1" fill="white" />
    </>
  ) : (
    <>
      <circle cx="42" cy="55" r="4" fill="white" />
      <circle cx="42" cy="56" r="2.5" fill="#1e1b4b" />
      <circle cx="62" cy="55" r="4" fill="white" />
      <circle cx="62" cy="56" r="2.5" fill="#1e1b4b" />
    </>
  );

  const mouth = isSleeping ? (
    <ellipse cx="52" cy="72" rx="4" ry="2" fill="#1e1b4b" opacity="0.5" />
  ) : isExcited ? (
    <ellipse cx="52" cy="72" rx="6" ry="5" fill="#1e1b4b" />
  ) : isProud ? (
    <path d="M 46 70 Q 52 76 58 70" stroke="#1e1b4b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  ) : (
    <path d="M 48 70 Q 52 74 56 70" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round" />
  );

  const hasWings = stage === 'glowing' || stage === 'cosmic' || stage === 'legendary';
  const hasHorns = stage !== 'baby';
  const hasStars = stage === 'cosmic' || stage === 'legendary';
  const hasCrown = stage === 'legendary';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
      <defs>
        <radialGradient id={`bodyGrad-${stage}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor={bodyColor} />
        </radialGradient>
        {stage !== 'baby' && (
          <filter id={`glow-${stage}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {hasStars && (
        <>
          <circle cx="15" cy="20" r="1.5" fill="white" opacity="0.8" />
          <circle cx="85" cy="15" r="1" fill="white" opacity="0.6" />
          <circle cx="90" cy="40" r="1.5" fill="white" opacity="0.7" />
          <circle cx="10" cy="50" r="1" fill="white" opacity="0.5" />
          <circle cx="80" cy="80" r="1" fill="white" opacity="0.6" />
        </>
      )}

      {hasWings && (
        <>
          <path
            d="M 25 50 Q 5 40 8 60 Q 15 65 25 58 Z"
            fill={glowColor}
            opacity="0.7"
            filter={`url(#glow-${stage})`}
          />
          <path
            d="M 75 50 Q 95 40 92 60 Q 85 65 75 58 Z"
            fill={glowColor}
            opacity="0.7"
            filter={`url(#glow-${stage})`}
          />
        </>
      )}

      <ellipse cx="50" cy="60" rx="28" ry="30" fill={`url(#bodyGrad-${stage})`} />

      {hasHorns && (
        <>
          <path d="M 38 35 L 35 22 L 42 32 Z" fill="#fbbf24" />
          <path d="M 62 35 L 65 22 L 58 32 Z" fill="#fbbf24" />
        </>
      )}

      {hasCrown && (
        <path d="M 40 28 L 44 18 L 50 25 L 56 18 L 60 28 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      )}

      {eyeShape}
      {mouth}

      <circle cx="35" cy="65" r="4" fill="#f9a8d4" opacity="0.5" />
      <circle cx="65" cy="65" r="4" fill="#f9a8d4" opacity="0.5" />

      {stage !== 'baby' && (
        <>
          <ellipse cx="35" cy="88" rx="6" ry="3" fill={bodyColor} opacity="0.8" />
          <ellipse cx="65" cy="88" rx="6" ry="3" fill={bodyColor} opacity="0.8" />
        </>
      )}

      {stage === 'glowing' && (
        <circle cx="50" cy="60" r="32" fill="none" stroke={glowColor} strokeWidth="1" opacity="0.3" filter={`url(#glow-${stage})`} />
      )}
      {stage === 'cosmic' && (
        <>
          <circle cx="50" cy="60" r="34" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.4" filter={`url(#glow-${stage})`} />
          <circle cx="50" cy="60" r="38" fill="none" stroke="#818cf8" strokeWidth="0.5" opacity="0.2" />
        </>
      )}
      {stage === 'legendary' && (
        <>
          <circle cx="50" cy="60" r="36" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.5" filter={`url(#glow-${stage})`} />
          <circle cx="50" cy="60" r="42" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />
        </>
      )}

      {isSleeping && (
        <>
          <text x="75" y="30" fontSize="12" fill="#7c3aed" opacity="0.5">z</text>
          <text x="82" y="22" fontSize="8" fill="#7c3aed" opacity="0.3">z</text>
        </>
      )}
    </svg>
  );
}