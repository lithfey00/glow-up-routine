// Lightweight haptics using the Web Vibration API.
// On native (Capacitor/Expo web view) this maps to native haptics via plugins.

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [40, 20, 40, 20, 40],
  selection: 8,
};

export function haptic(pattern: HapticPattern = 'light') {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(PATTERNS[pattern]);
    }
  } catch {
    // no-op: haptics not supported
  }
}
