import { Wallet, CheckCircle, XCircle, Network } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Badge } from "./badge";

export const MobileWalletStatus = () => {
  const isMobile = useIsMobile();
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  if (!isMobile) return null;

  return (
    <Card className="mx-4 mb-4 p-3 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={cn(
            "p-2 rounded-full",
            isConnected ? "bg-primary/10" : "bg-muted"
          )}>
            <Wallet className={cn(
              "h-4 w-4",
              isConnected ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <p className="text-xs font-medium text-foreground truncate">
                {isConnected ? "Connected" : "Not Connected"}
              </p>
            </div>
            
            {isConnected && address && (
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Network & Balance */}
        {isConnected && (
          <div className="flex flex-col items-end gap-1">
            {/* Network Badge */}
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 h-5"
            >
              <Network className="h-3 w-3" />
              {chain?.name || "Unknown"}
            </Badge>
            
            {/* Balance */}
            {balance && (
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">
                  {parseFloat(balance.formatted).toFixed(4)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {balance.symbol}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status indicator dot */}
      <div className="absolute -top-1 -right-1">
        <div className={cn(
          "h-2.5 w-2.5 rounded-full border-2 border-card",
          isConnected ? "bg-primary animate-pulse" : "bg-muted-foreground"
        )} />
      </div>
    </Card>
  );
};
