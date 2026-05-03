import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TruthBadge {
  id: string;
  badge_number: number;
  status: string;
  wallet_address: string | null;
  discord_username: string | null;
  discord_verified_at: string | null;
  payment_tx_hash: string;
  active_since: string;
}

export type TruthBadgeState = "loading" | "not_minted" | "minted" | "verified";

export function useTruthBadge() {
  const { user } = useAuth();
  const [badge, setBadge] = useState<TruthBadge | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setBadge(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("truth_badges")
      .select("id,badge_number,status,wallet_address,discord_username,discord_verified_at,payment_tx_hash,active_since")
      .eq("user_id", user.id)
      .maybeSingle();
    setBadge(data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const state: TruthBadgeState = loading
    ? "loading"
    : !badge
      ? "not_minted"
      : badge.discord_verified_at
        ? "verified"
        : "minted";

  return { badge, state, loading, refresh };
}
