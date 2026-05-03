import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, Loader2, Wallet, ExternalLink, Lock, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/ui/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTruthBadge } from "@/hooks/useTruthBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAccount, useConnect, useSendTransaction, useSwitchChain, useChainId } from "wagmi";
import { parseEther } from "viem";

const DISCORD_INVITE = "https://discord.gg/vaCujDNXg";
const POLYGON_CHAIN_ID = 137;

export default function TruthBadge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { badge, state, refresh } = useTruthBadge();
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const chainId = useChainId();

  const [quote, setQuote] = useState<{ treasury: string; maticAmount: number; priceUsd: number } | null>(null);
  const [working, setWorking] = useState<null | "quote" | "pay" | "confirm" | "verify">(null);
  const [discordHandle, setDiscordHandle] = useState("");

  useEffect(() => {
    if (!user) return;
    if (state === "not_minted") loadQuote();
  }, [user, state]);

  const loadQuote = async () => {
    setWorking("quote");
    try {
      const { data, error } = await supabase.functions.invoke("truth-badge-quote");
      if (error) throw error;
      setQuote(data);
    } catch (e: any) {
      toast({ title: "Could not load price", description: e.message, variant: "destructive" });
    } finally {
      setWorking(null);
    }
  };

  const handleMint = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!quote) await loadQuote();
    const q = quote!;
    try {
      // 1. Connect wallet
      if (!isConnected) {
        setWorking("pay");
        const injected = connectors.find((c) => c.id === "injected") ?? connectors[0];
        await connectAsync({ connector: injected });
      }
      // 2. Switch to Polygon
      if (chainId !== POLYGON_CHAIN_ID) {
        await switchChainAsync({ chainId: POLYGON_CHAIN_ID });
      }
      // 3. Send MATIC
      setWorking("pay");
      const txHash = await sendTransactionAsync({
        to: q.treasury as `0x${string}`,
        value: parseEther(String(q.maticAmount)),
        chainId: POLYGON_CHAIN_ID,
      });

      toast({ title: "Payment sent", description: "Waiting for confirmation on Polygon..." });

      // 4. Confirm with backend (poll if not yet on-chain)
      setWorking("confirm");
      let confirmed = false;
      for (let attempt = 0; attempt < 6 && !confirmed; attempt++) {
        const { data, error } = await supabase.functions.invoke("truth-badge-confirm", {
          body: { txHash, walletAddress: address },
        });
        if (error) throw error;
        if (data?.success) { confirmed = true; break; }
        if (data?.retry) await new Promise((r) => setTimeout(r, 4000));
        else throw new Error(data?.error || "Confirmation failed");
      }
      if (!confirmed) throw new Error("Tx not confirmed in time. Refresh in a moment.");

      toast({ title: "Truth Badge minted", description: "Welcome to the whitelist." });
      await refresh();
    } catch (e: any) {
      const msg = String(e?.shortMessage || e?.message || e);
      if (msg.toLowerCase().includes("user reject")) {
        toast({ title: "Payment cancelled", variant: "destructive" });
      } else {
        toast({ title: "Mint failed", description: msg, variant: "destructive" });
      }
    } finally {
      setWorking(null);
    }
  };

  const handleVerifyDiscord = async () => {
    if (!discordHandle.trim()) {
      toast({ title: "Enter your Discord username", variant: "destructive" });
      return;
    }
    setWorking("verify");
    try {
      const { error } = await supabase
        .from("truth_badges")
        .update({
          discord_username: discordHandle.trim(),
          discord_verified_at: new Date().toISOString(),
          status: "discord_verified",
        })
        .eq("user_id", user!.id);
      if (error) throw error;
      toast({ title: "Discord verified", description: "Elite access unlocked." });
      await refresh();
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    } finally {
      setWorking(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-32 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Sign in to claim your Truth Badge</h1>
          <Button className="mt-4" onClick={() => navigate("/auth")}>Sign in</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-32 max-w-3xl">
        {/* Hero copy */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Badge variant="outline" className="mb-3 border-primary/40 text-primary">Whitelist Open</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            VeriEdit Truth Badge
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            This is not just access. It's your position inside the system.
          </p>
        </motion.div>

        {/* State: VERIFIED */}
        {state === "verified" && badge && (
          <Card className="border-primary/40 bg-gradient-to-b from-primary/10 to-transparent">
            <CardContent className="p-8 text-center">
              <Crown className="w-14 h-14 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Elite Access Unlocked</h2>
              <p className="text-muted-foreground mb-1">Badge #{badge.badge_number}</p>
              <p className="text-xs text-muted-foreground mb-6">
                Discord: @{badge.discord_username} · Active since {new Date(badge.active_since).toLocaleDateString()}
              </p>
              <Button asChild>
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                  Open Discord <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <div className="mt-6 text-xs text-muted-foreground">
                Deposit match bonus eligibility unlocks{" "}
                {new Date(new Date(badge.active_since).getTime() + 30 * 86400000).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* State: MINTED → join Discord */}
        {state === "minted" && badge && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">You're whitelisted</h2>
                  <p className="text-sm text-muted-foreground">Badge #{badge.badge_number}</p>
                </div>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground mb-6">
                <li>1. Join the Discord server</li>
                <li>2. Connect your wallet to Collab.Land in #verify</li>
                <li>3. Enter your Discord username below to mark yourself verified</li>
              </ol>
              <Button className="w-full mb-3" asChild>
                <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
                  Join Discord <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <div className="flex gap-2">
                <Input
                  placeholder="your_discord_username"
                  value={discordHandle}
                  onChange={(e) => setDiscordHandle(e.target.value)}
                  disabled={working === "verify"}
                />
                <Button onClick={handleVerifyDiscord} disabled={working === "verify"}>
                  {working === "verify" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* State: NOT MINTED → pay */}
        {state === "not_minted" && (
          <Card className="border-primary/30">
            <CardContent className="p-8">
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <Perk icon={Sparkles} title="Elite Discord access" />
                <Perk icon={Sparkles} title="Early feature access" />
                <Perk icon={Sparkles} title="Deeper system insights" />
                <Perk icon={Sparkles} title="Priority support" />
                <Perk icon={Sparkles} title="Trader upgrade access" />
                <Perk icon={Sparkles} title="Deposit match bonus eligibility (up to $500 after 30 days)" />
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-6 text-center">
                <div className="text-3xl font-bold">$4.99</div>
                <div className="text-sm text-muted-foreground">
                  {quote ? `≈ ${quote.maticAmount} MATIC on Polygon` : "Loading current MATIC price..."}
                </div>
              </div>
              <Button
                className="w-full h-14 text-base"
                onClick={handleMint}
                disabled={working !== null || !quote}
              >
                {working === "pay" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirm in wallet…</>}
                {working === "confirm" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming on Polygon…</>}
                {working === "quote" && <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading…</>}
                {!working && (<><Wallet className="w-4 h-4 mr-2" /> Mint Truth Badge ($4.99)</>)}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Whitelist access is limited. After payment: → Join Discord → Verify your wallet → Unlock your role.
              </p>
            </CardContent>
          </Card>
        )}

        {state === "loading" && (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          This badge represents Access · Positioning · Alignment.
        </p>
      </main>
    </div>
  );
}

function Perk({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <span className="text-sm">{title}</span>
    </div>
  );
}
