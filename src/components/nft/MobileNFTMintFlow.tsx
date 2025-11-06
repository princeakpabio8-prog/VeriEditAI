import { useState, useEffect } from "react";
import { useAccount, useEstimateGas, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Loader2, AlertTriangle, ExternalLink, Sparkles, Wallet as WalletIcon, Fuel, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { polygonMainnet } from "@/lib/web3-config";
import { haptics } from "@/lib/haptics";

interface MobileNFTMintFlowProps {
  isOpen: boolean;
  onClose: () => void;
  badgeType: "common" | "uncommon" | "rare" | "epic" | "legendary";
  verificationId?: string;
}

type MintStep = "review" | "approve" | "minting" | "confirming" | "complete";

const STEP_INFO = {
  review: {
    title: "Review Mint Details",
    description: "Check your badge and gas fees",
    icon: Sparkles,
  },
  approve: {
    title: "Approve Transaction",
    description: "Confirm in your wallet",
    icon: WalletIcon,
  },
  minting: {
    title: "Minting Badge",
    description: "Creating your NFT on-chain",
    icon: Fuel,
  },
  confirming: {
    title: "Confirming",
    description: "Waiting for blockchain confirmation",
    icon: Shield,
  },
  complete: {
    title: "Mint Complete!",
    description: "Your badge is ready",
    icon: CheckCircle,
  },
};

export const MobileNFTMintFlow = ({
  isOpen,
  onClose,
  badgeType,
  verificationId,
}: MobileNFTMintFlowProps) => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<MintStep>("review");
  const [txHash, setTxHash] = useState<string | undefined>();

  const { data: balance } = useBalance({
    address: address,
  });

  // Mock contract write - replace with actual contract address and ABI
  const { writeContract, isPending: isWriting } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Estimated gas fee (mock - in production, use actual estimation)
  const estimatedGasFee = "0.0001"; // MATIC
  const estimatedGasFeeUSD = "$0.02";

  const badgeDetails = {
    common: { name: "Common Truth Badge", color: "from-gray-400 to-gray-600", rarity: "Common" },
    uncommon: { name: "Uncommon Truth Badge", color: "from-green-400 to-green-600", rarity: "Uncommon" },
    rare: { name: "Rare Truth Badge", color: "from-blue-400 to-blue-600", rarity: "Rare" },
    epic: { name: "Epic Truth Badge", color: "from-purple-400 to-purple-600", rarity: "Epic" },
    legendary: { name: "Legendary Truth Badge", color: "from-orange-400 to-orange-600", rarity: "Legendary" },
  };

  const badge = badgeDetails[badgeType];
  const progressPercentage = {
    review: 0,
    approve: 25,
    minting: 50,
    confirming: 75,
    complete: 100,
  }[currentStep];

  // Trigger haptic feedback when step changes
  useEffect(() => {
    if (currentStep === "approve") {
      haptics.medium();
    } else if (currentStep === "minting") {
      haptics.progress();
    } else if (currentStep === "confirming") {
      haptics.progress();
    } else if (currentStep === "complete") {
      haptics.success();
    }
  }, [currentStep]);

  const handleMint = async () => {
    if (!isConnected || !address) {
      haptics.error();
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    haptics.light(); // Light tap on mint button press
    setCurrentStep("approve");

    try {
      // Replace with actual contract interaction
      // const hash = await writeContract({
      //   address: 'YOUR_CONTRACT_ADDRESS',
      //   abi: YOUR_CONTRACT_ABI,
      //   functionName: 'mint',
      //   args: [badgeType, verificationId],
      // });

      // Mock transaction for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep("minting");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      setTxHash(mockHash);
      setCurrentStep("confirming");
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      setCurrentStep("complete");

    } catch (error) {
      console.error("Minting error:", error);
      haptics.error(); // Error vibration pattern
      toast({
        title: "Minting Failed",
        description: "There was an error minting your badge",
        variant: "destructive",
      });
      setCurrentStep("review");
    }
  };

  const handleClose = () => {
    haptics.light();
    setCurrentStep("review");
    setTxHash(undefined);
    onClose();
  };

  const steps: MintStep[] = ["review", "approve", "minting", "confirming", "complete"];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Mint NFT Badge
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{STEP_INFO[currentStep].title}</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {steps.slice(0, -1).map((step, index) => {
            const StepIcon = STEP_INFO[step].icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            
            return (
              <div key={step} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isActive && "border-primary bg-primary/10 scale-110",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted bg-muted"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <StepIcon className={cn("h-5 w-5", isActive && "text-primary")} />
                  )}
                </div>
                <p className={cn(
                  "text-[10px] text-center font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Content based on current step */}
        {currentStep === "review" && (
          <div className="space-y-4">
            {/* Badge Preview */}
            <div className={cn(
              "relative rounded-lg p-6 bg-gradient-to-br",
              badge.color,
              "overflow-hidden"
            )}>
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative text-center text-white">
                <Sparkles className="h-12 w-12 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {badge.rarity}
                </Badge>
              </div>
            </div>

            {/* Gas Fee Estimate */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Fuel className="h-4 w-4 text-primary" />
                Gas Fee Estimate
              </h4>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network Fee</span>
                <div className="text-right">
                  <p className="text-sm font-semibold">{estimatedGasFee} MATIC</p>
                  <p className="text-xs text-muted-foreground">{estimatedGasFeeUSD}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-medium">Your Balance</span>
                <p className="text-sm font-semibold">
                  {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : "0.0000"} MATIC
                </p>
              </div>
            </div>

            {/* Verification Details */}
            {verificationId && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Verification ID</p>
                <p className="text-xs font-mono font-medium truncate">{verificationId}</p>
              </div>
            )}

            <Button
              onClick={() => {
                haptics.medium();
                handleMint();
              }}
              className="w-full h-12 text-base font-semibold"
              disabled={!isConnected}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start Minting
            </Button>
          </div>
        )}

        {currentStep === "approve" && (
          <div className="space-y-4 text-center py-8">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <WalletIcon className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Approve in Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Check your wallet extension or app to approve this transaction
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Waiting for approval...</span>
            </div>
          </div>
        )}

        {currentStep === "minting" && (
          <div className="space-y-4 text-center py-8">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Fuel className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-20 w-20 animate-spin text-primary opacity-20" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Minting Your Badge</h3>
              <p className="text-sm text-muted-foreground">
                Creating your NFT on the Polygon blockchain
              </p>
            </div>
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">This usually takes 10-30 seconds</p>
            </div>
          </div>
        )}

        {currentStep === "confirming" && (
          <div className="space-y-4 text-center py-8">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Confirming Transaction</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Waiting for blockchain confirmation
              </p>
              {txHash && (
                <a
                  href={`https://polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View on PolygonScan
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Confirming...</span>
            </div>
          </div>
        )}

        {currentStep === "complete" && (
          <div className="space-y-6 text-center py-8">
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-ping" />
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-2">🎉 Mint Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your {badge.name} has been minted
              </p>
            </div>

            <div className={cn(
              "relative rounded-lg p-6 bg-gradient-to-br",
              badge.color,
              "overflow-hidden mx-4"
            )}>
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative text-center text-white">
                <Sparkles className="h-10 w-10 mx-auto mb-2" />
                <h3 className="font-bold text-base">{badge.name}</h3>
              </div>
            </div>

            {txHash && (
              <div className="space-y-2">
                <a
                  href={`https://polygonscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View Transaction
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                haptics.light();
                handleClose();
              }} className="flex-1">
                Close
              </Button>
              <Button
                onClick={() => {
                  haptics.medium();
                  // Navigate to marketplace or collection
                  window.location.href = "/nft-marketplace";
                }}
                className="flex-1"
              >
                View Collection
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
