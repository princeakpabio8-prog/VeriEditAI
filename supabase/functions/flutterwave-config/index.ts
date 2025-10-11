import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get("FLUTTERWAVE_PUBLIC_KEY") || "";
    const mode = publicKey.includes("_TEST-") ? "test" : "live";

    console.log("📤 Returning Flutterwave config:", {
      hasKey: !!publicKey,
      keyPreview: publicKey ? `${publicKey.substring(0, 15)}...` : "none",
      mode
    });

    return new Response(
      JSON.stringify({
        success: true,
        public_key: publicKey,
        mode
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching Flutterwave config:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
