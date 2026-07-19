import type { Challenge } from './supabase';
import type { Mood, TimeBudget, EnergyLevel } from './types';

export interface CoachInput {
  mood: Mood;
  timeBudget: TimeBudget;
  energy: EnergyLevel;
  completedChallengeIds: string[];
  challenges: Challenge[];
}

export interface CoachRoutine {
  challenges: Challenge[];
  totalMinutes: number;
  totalXp: number;
  message: string;
  focus: string;
}

const MORNING_MESSAGES = [
  'Good morning, lovely! A fresh start awaits — let’s make today glow.',
  'Rise and shine! Small steps today, big glow tomorrow.',
  'Morning light, new intentions. You’ve got this.',
];

const MOOD_MESSAGES: Record<Mood, string> = {
  happy: 'You’re radiating joy today! Let’s keep that momentum going with something uplifting.',
  calm: 'A peaceful start. Let’s nurture that calm with gentle, grounding practices.',
  tired: 'Low energy is okay. We’ll keep things light and restorative — no pressure.',
  stressed: 'Let’s breathe through the stress together. Calming challenges first, always.',
  sad: 'Be gentle with yourself today. Tiny acts of care can lift the heart.',
  motivated: 'You’re on fire! Let’s channel that drive into a fulfilling routine.',
};

const MOOD_CATEGORY_PREF: Record<Mood, ('beauty' | 'self-care' | 'mindset' | 'health')[]> = {
  happy: ['health', 'beauty', 'mindset', 'self-care'],
  calm: ['self-care', 'mindset', 'beauty', 'health'],
  tired: ['self-care', 'beauty', 'mindset', 'health'],
  stressed: ['mindset', 'self-care', 'health', 'beauty'],
  sad: ['self-care', 'mindset', 'beauty', 'health'],
  motivated: ['health', 'mindset', 'beauty', 'self-care'],
};

function pickOne<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateCoachRoutine(input: CoachInput): CoachRoutine {
  const { mood, timeBudget, energy, completedChallengeIds, challenges } = input;

  const available = challenges.filter((c) => !completedChallengeIds.includes(c.id));

  // Prefer challenges that fit the time budget; allow slight overflow for short budgets
  const fitsTime = (mins: number) => {
    if (timeBudget <= 5) return mins <= 5;
    if (timeBudget <= 15) return mins <= 15;
    if (timeBudget <= 30) return mins <= 30;
    return mins <= 60;
  };

  const pool = available.length > 0 ? available : challenges;
  const fitting = pool.filter((c) => fitsTime(c.duration_minutes));
  const source = fitting.length >= 2 ? fitting : pool;

  // Sort by mood-preferred category, then by energy-appropriate difficulty
  const pref = MOOD_CATEGORY_PREF[mood];
  const energyFactor = energy <= 2 ? ['easy', 'medium', 'hard'] : energy <= 4 ? ['medium', 'easy', 'hard'] : ['hard', 'medium', 'easy'];

  const sorted = [...source].sort((a, b) => {
    const ai = pref.indexOf(a.category);
    const bi = pref.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    const ad = energyFactor.indexOf(a.difficulty);
    const bd = energyFactor.indexOf(b.difficulty);
    return ad - bd;
  });

  // Pick a spread across categories within the time budget
  const chosen: Challenge[] = [];
  let usedMinutes = 0;
  const usedCategories = new Set<string>();

  for (const c of sorted) {
    if (chosen.length >= 6) break;
    if (usedMinutes + c.duration_minutes > timeBudget && chosen.length >= 2) continue;
    if (usedCategories.has(c.category) && chosen.length < pref.length) continue;
    chosen.push(c);
    usedCategories.add(c.category);
    usedMinutes += c.duration_minutes;
  }

  // Ensure at least 2 picks
  if (chosen.length < 2) {
    for (const c of sorted) {
      if (!chosen.includes(c)) {
        chosen.push(c);
        usedMinutes += c.duration_minutes;
        if (chosen.length >= 3) break;
      }
    }
  }

  const totalMinutes = chosen.reduce((s, c) => s + c.duration_minutes, 0);
  const totalXp = chosen.reduce((s, c) => s + c.glow_points, 0);

  const message = pickOne(MORNING_MESSAGES) || MORNING_MESSAGES[0];
  const moodMsg = MOOD_MESSAGES[mood];

  return {
    challenges: chosen,
    totalMinutes,
    totalXp,
    message: `${message} ${moodMsg}`,
    focus: focusLabel(mood, energy),
  };
}

function focusLabel(mood: Mood, energy: EnergyLevel): string {
  if (mood === 'stressed') return 'Calm & Center';
  if (mood === 'tired' || energy <= 2) return 'Gentle Restoration';
  if (mood === 'motivated' || energy >= 4) return 'Energize & Grow';
  if (mood === 'happy') return 'Joyful Momentum';
  if (mood === 'calm') return 'Mindful Balance';
  return 'Tender Self-Care';
}
