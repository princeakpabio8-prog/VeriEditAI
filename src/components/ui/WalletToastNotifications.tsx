import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Wallet, CheckCircle, XCircle, Network } from "lucide-react";

export const WalletToastNotifications = () => {
  const { address, isConnected, chain } = useAccount();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Use refs to track previous values
  const prevConnected = useRef<boolean | undefined>(undefined);
  const prevChainId = useRef<number | undefined>(undefined);
  const prevAddress = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only show notifications on mobile
    if (!isMobile) return;

    // Skip initial render - only show toasts on changes
    if (prevConnected.current === undefined) {
      prevConnected.current = isConnected;
      prevChainId.current = chain?.id;
      prevAddress.current = address;
      return;
    }

    // Wallet Connected
    if (isConnected && !prevConnected.current) {
      toast({
        title: "✅ Wallet Connected",
        description: address ? (
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
            {chain && (
              <p className="text-xs text-muted-foreground">
                Network: {chain.name}
              </p>
            )}
          </div>
        ) : undefined,
        className: "border-primary/50 bg-primary/10",
      });
    }

    // Wallet Disconnected
    if (!isConnected && prevConnected.current) {
      toast({
        title: "❌ Wallet Disconnected",
        description: "Your wallet has been disconnected",
        variant: "destructive",
      });
    }

    // Network Changed (only if wallet is connected)
    if (
      isConnected &&
      prevConnected.current &&
      chain?.id !== prevChainId.current &&
      prevChainId.current !== undefined
    ) {
      const isCorrectNetwork = chain?.id === 137; // Polygon mainnet
      
      toast({
        title: `🔄 Network Changed`,
        description: (
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              Switched to {chain?.name || "Unknown Network"}
            </p>
            {!isCorrectNetwork && (
              <p className="text-xs text-amber-500">
                ⚠️ Please switch to Polygon network for full functionality
              </p>
            )}
          </div>
        ),
        className: isCorrectNetwork ? "border-primary/50 bg-primary/10" : "border-amber-500/50 bg-amber-500/10",
      });
    }

    // Account Changed (different address on same connection)
    if (
      isConnected &&
      prevConnected.current &&
      address !== prevAddress.current &&
      prevAddress.current !== undefined &&
      address !== undefined
    ) {
      toast({
        title: "🔄 Account Changed",
        description: (
          <p className="font-mono text-xs">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        ),
        className: "border-primary/50 bg-primary/10",
      });
    }

    // Update refs
    prevConnected.current = isConnected;
    prevChainId.current = chain?.id;
    prevAddress.current = address;
  }, [isConnected, address, chain, toast, isMobile]);

  // This component doesn't render anything
  return null;
};
