const QUOTES = [
  'You are allowed to be both a masterpiece and a work in progress.',
  'Small steps every day create big change.',
  'Your only competition is who you were yesterday.',
  'Rest is not a reward — it is a necessity.',
  'You glow differently when you take care of yourself.',
  'Be gentle with yourself. You are doing the best you can.',
  'A little self-care goes a long way.',
  'You are worthy of the time you spend on yourself.',
  'Bloom at your own pace.',
  'Today is a new chance to glow.',
  'Your body deserves love, not criticism.',
  'Progress, not perfection.',
  'You are not behind. You are exactly where you need to be.',
  'Drink water. Be kind. Glow on.',
  'The way you speak to yourself matters.',
];

export function dailyQuote(date = new Date()): string {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}
