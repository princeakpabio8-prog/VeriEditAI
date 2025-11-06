import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./button";
import { Badge } from "./badge";
import { CheckCircle, Zap, Shield, Globe, TrendingDown } from "lucide-react";

interface NetworkInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchNetwork: () => void;
  currentNetwork?: string;
}

export const NetworkInfoModal = ({
  isOpen,
  onClose,
  onSwitchNetwork,
  currentNetwork,
}: NetworkInfoModalProps) => {
  const benefits = [
    {
      icon: TrendingDown,
      title: "Ultra-Low Gas Fees",
      description: "Pay pennies instead of dollars - typical transaction costs under $0.01",
      color: "text-emerald-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Transactions confirm in seconds, not minutes",
      color: "text-amber-500",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Built on Ethereum's security with Layer 2 scaling",
      color: "text-blue-500",
    },
    {
      icon: Globe,
      title: "Eco-Friendly",
      description: "99% less energy consumption than traditional blockchains",
      color: "text-green-500",
    },
  ];

  const handleSwitch = () => {
    onSwitchNetwork();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            Why Polygon Network?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Our platform uses Polygon for the best user experience
          </DialogDescription>
        </DialogHeader>

        {/* Current Network Status */}
        {currentNetwork && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
              <p className="text-sm font-medium">
                Currently on: <span className="font-bold">{currentNetwork}</span>
              </p>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="space-y-3 mb-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/20 transition-colors"
              >
                <div className={`flex-shrink-0 mt-0.5 ${benefit.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    {benefit.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost Comparison */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 mb-6 border border-primary/20">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            Cost Comparison
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Ethereum</p>
              <Badge variant="destructive" className="font-mono">
                ~$20-50
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Polygon</p>
              <Badge variant="default" className="font-mono bg-primary">
                &lt;$0.01
              </Badge>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Average cost per NFT mint transaction
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleSwitch}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Switch to Polygon
          </Button>
        </div>

        {/* Additional Info */}
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          Switching networks is free and takes just a few seconds
        </p>
      </DialogContent>
    </Dialog>
  );
};
