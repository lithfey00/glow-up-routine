import type { Challenge } from './supabase';
import type { Mood } from './types';
import type { FocusGoal, TimeBudget } from '../mobile/components/Onboarding';

const FOCUS_CATEGORY_MAP: Record<FocusGoal, string[]> = {
  energy: ['health', 'fitness', 'nutrition'],
  confidence: ['mindset', 'beauty', 'self-care'],
  calm: ['self-care', 'mindset', 'sleep'],
  routine: ['self-care', 'health', 'mindset'],
};

const MOOD_CATEGORY_MAP: Record<Mood, string[]> = {
  happy: ['beauty', 'self-care', 'mindset'],
  calm: ['mindset', 'self-care', 'sleep'],
  tired: ['self-care', 'sleep', 'health'],
  stressed: ['self-care', 'mindset', 'sleep'],
  sad: ['mindset', 'self-care', 'beauty'],
  motivated: ['fitness', 'health', 'mindset'],
};

export interface RecommendationPrefs {
  focus: FocusGoal;
  timeBudget: TimeBudget;
  mood?: Mood | null;
}

export function getRecommendedChallenge(
  challenges: Challenge[],
  prefs: RecommendationPrefs | null,
  completedIds: Set<string>
): Challenge | null {
  if (challenges.length === 0) return null;

  const available = challenges.filter((c) => !completedIds.has(c.id));
  const pool = available.length > 0 ? available : challenges;

  if (!prefs) {
    // Default: pick an easy, short challenge
    const easy = pool.filter((c) => c.difficulty === 'easy' && c.duration_minutes <= 10);
    if (easy.length > 0) return easy[Math.floor(Math.random() * easy.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Score each challenge
  const preferredCategories = FOCUS_CATEGORY_MAP[prefs.focus] || [];
  const moodCategories = prefs.mood ? MOOD_CATEGORY_MAP[prefs.mood] || [] : [];

  let best: Challenge | null = null;
  let bestScore = -1;

  for (const c of pool) {
    let score = 0;

    // Category match (focus is most important)
    const focusIdx = preferredCategories.indexOf(c.category);
    if (focusIdx >= 0) score += (3 - focusIdx) * 10;

    // Mood category match
    const moodIdx = moodCategories.indexOf(c.category);
    if (moodIdx >= 0) score += (3 - moodIdx) * 5;

    // Time budget match — prefer challenges at or below the user's time budget
    if (c.duration_minutes <= prefs.timeBudget) {
      score += 8;
      // Bonus for being close to the time budget (uses the time well without exceeding)
      const ratio = c.duration_minutes / prefs.timeBudget;
      if (ratio >= 0.5) score += 4;
    } else if (c.duration_minutes <= prefs.timeBudget + 5) {
      score += 2; // Slightly over is okay
    }

    // Prefer easy for tired/stressed/sad moods
    if (prefs.mood === 'tired' || prefs.mood === 'stressed' || prefs.mood === 'sad') {
      if (c.difficulty === 'easy') score += 5;
      if (c.difficulty === 'hard') score -= 5;
    }

    // For motivated mood, prefer medium/hard
    if (prefs.mood === 'motivated') {
      if (c.difficulty === 'medium') score += 3;
      if (c.difficulty === 'hard') score += 2;
    }

    // Small random factor for variety
    score += Math.random() * 2;

    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return best || pool[0];
}

export function getRecommendedList(
  challenges: Challenge[],
  prefs: RecommendationPrefs | null,
  completedIds: Set<string>,
  limit = 3
): Challenge[] {
  if (challenges.length === 0) return [];

  const available = challenges.filter((c) => !completedIds.has(c.id));
  const pool = available.length > 0 ? available : challenges;

  if (!prefs) {
    // Default: just random pick from different categories
    const cats: Record<string, Challenge> = {};
    pool.forEach((c) => { if (!cats[c.category]) cats[c.category] = c; });
    return Object.values(cats).slice(0, limit);
  }

  const preferredCategories = FOCUS_CATEGORY_MAP[prefs.focus] || [];
  const moodCategories = prefs.mood ? MOOD_CATEGORY_MAP[prefs.mood] || [] : [];

  const scored = pool.map((c) => {
    let score = 0;
    const focusIdx = preferredCategories.indexOf(c.category);
    if (focusIdx >= 0) score += (3 - focusIdx) * 10;
    const moodIdx = moodCategories.indexOf(c.category);
    if (moodIdx >= 0) score += (3 - moodIdx) * 5;
    if (c.duration_minutes <= prefs.timeBudget) score += 8;
    if (c.difficulty === 'easy') score += 2;
    score += Math.random() * 3;
    return { c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const result = scored.slice(0, limit).map((s) => s.c);

  // Deduplicate by category — prefer one per category for variety
  const seen = new Set<string>();
  const deduped: Challenge[] = [];
  for (const c of result) {
    if (!seen.has(c.category)) {
      seen.add(c.category);
      deduped.push(c);
    }
  }
  // If we have too few after dedup, fill from remaining
  if (deduped.length < limit) {
    for (const c of result) {
      if (deduped.length >= limit) break;
      if (!deduped.find((d) => d.id === c.id)) deduped.push(c);
    }
  }

  return deduped.slice(0, limit);
}
