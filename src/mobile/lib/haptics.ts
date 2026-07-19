type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' | 'impact' | 'soft';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 18,
  heavy: 35,
  success: [10, 25, 10, 25, 10],
  warning: [18, 40, 18],
  error: [40, 20, 40, 20, 40],
  selection: 5,
  impact: [0, 12, 0],
  soft: 4,
};

let lastFire = 0;
const MIN_INTERVAL = 40;

export function haptic(pattern: HapticPattern = 'light') {
  try {
    const now = Date.now();
    if (now - lastFire < MIN_INTERVAL) return;
    lastFire = now;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    // no-op
  }
}

export function hapticImpact(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
  haptic(intensity);
}

export function hapticNotify(type: 'success' | 'warning' | 'error' = 'success') {
  haptic(type);
}
