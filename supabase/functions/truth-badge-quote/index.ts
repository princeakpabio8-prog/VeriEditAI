// Returns the current MATIC amount equal to $4.99 USD + treasury wallet
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_USD = 4.99;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const treasury = Deno.env.get("TRUTH_BADGE_TREASURY_WALLET");
    if (!treasury) throw new Error("Treasury wallet not configured");

    // Fetch MATIC/USD price (CoinGecko, no key needed)
    let maticUsd = 0.5; // safe fallback
    try {
      const r = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd"
      );
      const j = await r.json();
      if (j?.["matic-network"]?.usd) maticUsd = Number(j["matic-network"].usd);
    } catch (_) { /* keep fallback */ }

    // Add 3% buffer for slippage + price drift during checkout
    const maticAmount = +(PRICE_USD / maticUsd * 1.03).toFixed(4);

    return new Response(
      JSON.stringify({
        treasury,
        chainId: 137,
        priceUsd: PRICE_USD,
        maticUsd,
        maticAmount,
        expiresAt: Date.now() + 5 * 60 * 1000,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
