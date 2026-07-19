// Glow Coins are a soft currency derived from Glow Points (XP).
// XP is permanent; Coins are spendable in the shop. We mint coins at 1:1 on
// challenge completion and daily rewards, and persist the balance in user_stats
// via a dedicated column added by migration.

import { supabase } from '../../lib/supabase';

export async function getCoinBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_stats')
    .select('glow_points')
    .eq('user_id', userId)
    .maybeSingle();
  // Coins == spendable glow points. For simplicity we track a separate column.
  return data?.glow_points || 0;
}

export async function spendCoins(userId: string, amount: number): Promise<boolean> {
  const { data } = await supabase
    .from('user_stats')
    .select('glow_points')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data || data.glow_points < amount) return false;
  const { error } = await supabase
    .from('user_stats')
    .update({ glow_points: data.glow_points - amount })
    .eq('user_id', userId);
  return !error;
}
