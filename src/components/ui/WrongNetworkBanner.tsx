import { useState, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { useIsMobile } from "@/hooks/use-mobile";
import { polygonMainnet } from "@/lib/web3-config";
import { AlertTriangle, X, Info } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { NetworkInfoModal } from "./NetworkInfoModal";

const DISMISSED_KEY = "wrong-network-banner-dismissed";

export const WrongNetworkBanner = () => {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const isMobile = useIsMobile();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isWrongNetwork = isConnected && chain?.id !== polygonMainnet.id;

  useEffect(() => {
    // Check if user previously dismissed the banner
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  useEffect(() => {
    // Reset dismiss state when network changes to correct one or wallet disconnects
    if (!isWrongNetwork) {
      setIsDismissed(false);
      localStorage.removeItem(DISMISSED_KEY);
      setIsVisible(false);
    } else if (!isDismissed) {
      // Small delay for smooth appearance
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isWrongNetwork, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsDismissed(true);
      localStorage.setItem(DISMISSED_KEY, "true");
    }, 300);
  };

  const handleSwitchNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: polygonMainnet.id });
    }
  };

  // Don't render if not mobile, wrong network, or dismissed
  if (!isMobile || !isWrongNetwork || isDismissed) return (
    <>
      <NetworkInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onSwitchNetwork={handleSwitchNetwork}
        currentNetwork={chain?.name}
      />
    </>
  );

  return (
    <>
      <NetworkInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onSwitchNetwork={handleSwitchNetwork}
        currentNetwork={chain?.name}
      />
      
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transition-all duration-300 ease-in-out",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Icon and Message - Clickable for Info */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex-shrink-0 relative">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <Info className="h-3 w-3 absolute -bottom-1 -right-1 bg-white text-amber-500 rounded-full p-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Wrong Network</p>
            <p className="text-xs opacity-90 truncate">
              Tap for info • {chain?.name || "Unknown"} → Polygon
            </p>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSwitchNetwork}
            className="h-8 px-3 text-xs font-semibold bg-white text-amber-900 hover:bg-white/90 border-0"
          >
            Switch
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
