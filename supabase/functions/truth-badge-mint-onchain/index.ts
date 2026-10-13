// Mints the paid Truth Badge (membership) on the existing TruthBadge contract on Polygon.
// Only runs for users whose payment was already confirmed (truth_badges row exists).
// Idempotent: returns the existing token if already minted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ABI = [
  "function mintBadge(address to, string verificationId, uint256 trustScore, string metadataURI) returns (uint256)",
  "function verificationMinted(string verificationId) view returns (bool)",
  "function verificationToToken(string verificationId) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress ?? "");
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return json({ error: "invalid_wallet" }, 400);

    const { data: badge } = await admin.from("truth_badges").select("*").eq("user_id", user.id).maybeSingle();
    if (!badge) return json({ error: "not_paid" }, 403);
    if (badge.nft_token_id && badge.nft_tx_hash) return json({ success: true, badge, alreadyMinted: true });

    const contractAddress = Deno.env.get("TRUTH_BADGE_CONTRACT_ADDRESS");
    const pk = Deno.env.get("MINTING_WALLET_PRIVATE_KEY");
    if (!contractAddress || !pk) return json({ error: "minting_not_configured" }, 500);

    const { ethers } = await import("https://esm.sh/ethers@6.9.0");
    const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com/");
    const wallet = new ethers.Wallet(pk, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);

    const mintKey = `membership-${badge.id}`;
    const origin = req.headers.get("origin") ?? "https://trust-lighthouse.lovable.app";
    const metadata = {
      name: `VeriEdit Truth Badge #${badge.badge_number}`,
      description: "VeriEdit Truth Badge membership. Access, positioning, alignment.",
      image: `${origin}/og-image.png`,
      external_url: `${origin}/truth-badge`,
      attributes: [
        { trait_type: "Type", value: "Membership" },
        { trait_type: "Badge Number", value: badge.badge_number },
      ],
    };
    const metadataURI = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;

    let tokenId = "0";
    let txHash = badge.nft_tx_hash as string | null;

    if (await contract.verificationMinted(mintKey)) {
      tokenId = (await contract.verificationToToken(mintKey)).toString();
    } else {
      const tx = await contract.mintBadge(walletAddress, mintKey, 100, metadataURI);
      const receipt = await tx.wait();
      txHash = receipt.hash;
      for (const log of receipt.logs) {
        try {
          const p = contract.interface.parseLog({ topics: log.topics, data: log.data });
          if (p?.name === "Transfer") { tokenId = p.args.tokenId.toString(); break; }
        } catch (_) { /* ignore */ }
      }
      if (tokenId === "0") tokenId = (await contract.verificationToToken(mintKey)).toString();
    }

    const { data: updated, error } = await admin
      .from("truth_badges")
      .update({ nft_token_id: tokenId, nft_tx_hash: txHash, wallet_address: walletAddress.toLowerCase() })
      .eq("id", badge.id)
      .select()
      .single();
    if (error) throw error;

    return json({
      success: true,
      badge: updated,
      contractAddress,
      polygonscanUrl: txHash ? `https://polygonscan.com/tx/${txHash}` : null,
      openseaUrl: `https://opensea.io/assets/matic/${contractAddress}/${tokenId}`,
    });
  } catch (e) {
    console.error("truth-badge-mint-onchain error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
