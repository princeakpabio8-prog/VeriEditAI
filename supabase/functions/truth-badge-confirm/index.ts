// Verifies an on-chain MATIC payment to the treasury wallet, then whitelists the user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POLYGON_RPC = "https://polygon-rpc.com/";
const PRICE_USD = 4.99;

async function rpc(method: string, params: unknown[]) {
  const r = await fetch(POLYGON_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const treasury = Deno.env.get("TRUTH_BADGE_TREASURY_WALLET")?.toLowerCase();
    if (!treasury) throw new Error("Treasury wallet not configured");

    const { txHash, walletAddress } = await req.json();
    if (!txHash || typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return new Response(JSON.stringify({ error: "invalid_tx_hash" }), { status: 400, headers: corsHeaders });
    }

    // Already confirmed for someone? prevent reuse
    const { data: existing } = await admin
      .from("truth_badges")
      .select("user_id")
      .eq("payment_tx_hash", txHash)
      .maybeSingle();
    if (existing && existing.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "tx_already_used" }), { status: 409, headers: corsHeaders });
    }

    // Log attempt
    await admin.from("truth_badge_payment_attempts").upsert(
      { user_id: user.id, tx_hash: txHash, currency: "MATIC", chain_id: 137, status: "pending" },
      { onConflict: "tx_hash" }
    );

    // Poll receipt up to ~25s
    let receipt: any = null;
    for (let i = 0; i < 12; i++) {
      receipt = await rpc("eth_getTransactionReceipt", [txHash]);
      if (receipt) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (!receipt) {
      return new Response(JSON.stringify({ error: "tx_not_found_yet", retry: true }), { status: 202, headers: corsHeaders });
    }
    if (receipt.status !== "0x1") {
      await admin.from("truth_badge_payment_attempts").update({ status: "rejected", error_message: "tx_failed" }).eq("tx_hash", txHash);
      return new Response(JSON.stringify({ error: "tx_failed" }), { status: 400, headers: corsHeaders });
    }

    const tx = await rpc("eth_getTransactionByHash", [txHash]);
    if (!tx) throw new Error("Tx not found");

    const to = String(tx.to || "").toLowerCase();
    const from = String(tx.from || "").toLowerCase();
    if (to !== treasury) {
      await admin.from("truth_badge_payment_attempts").update({ status: "rejected", error_message: "wrong_recipient" }).eq("tx_hash", txHash);
      return new Response(JSON.stringify({ error: "wrong_recipient" }), { status: 400, headers: corsHeaders });
    }

    const valueWei = BigInt(tx.value || "0x0");
    const valueMatic = Number(valueWei) / 1e18;

    // Check value covers $4.99 minus a small tolerance
    const cgRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd");
    const cg = await cgRes.json();
    const maticUsd = cg?.["matic-network"]?.usd ?? 0.5;
    const usdPaid = valueMatic * maticUsd;
    if (usdPaid < PRICE_USD * 0.95) {
      await admin.from("truth_badge_payment_attempts").update({ status: "rejected", error_message: "underpaid" }).eq("tx_hash", txHash);
      return new Response(JSON.stringify({ error: "underpaid", usdPaid }), { status: 400, headers: corsHeaders });
    }

    // Whitelist user (idempotent)
    const { data: badge, error: bErr } = await admin
      .from("truth_badges")
      .upsert(
        {
          user_id: user.id,
          status: "whitelisted",
          wallet_address: walletAddress?.toLowerCase() ?? from,
          payment_tx_hash: txHash,
          payment_amount_usd: PRICE_USD,
          payment_currency: "MATIC",
          payment_chain_id: 137,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    if (bErr) throw bErr;

    await admin.from("truth_badge_payment_attempts").update({ status: "confirmed" }).eq("tx_hash", txHash);

    return new Response(JSON.stringify({ success: true, badge }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
