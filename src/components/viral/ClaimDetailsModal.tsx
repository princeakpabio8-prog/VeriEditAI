import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ExternalLink, TrendingUp, Activity, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface HotClaim {
  id: string;
  claim_text: string;
  engagement_score: number;
  engagement_velocity: number;
  first_seen_at: string;
  platform: string;
  status: string;
  rarity_tier: string | null;
  virality_score: number;
  metadata: any;
  verification_id: string | null;
  share_token: string | null;
  updated_at: string;
  image_url: string | null;
}

interface ClaimDetailsModalProps {
  claim: HotClaim;
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
}

export function ClaimDetailsModal({ claim, isOpen, onClose, onVerify }: ClaimDetailsModalProps) {
  const isMobile = useIsMobile();

  const content = (
    <div className="space-y-6">
      {/* Platform and Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="capitalize">
          {claim.platform}
        </Badge>
        <Badge variant={claim.status === 'verified' ? 'default' : 'secondary'} className="capitalize">
          {claim.status}
        </Badge>
        {claim.rarity_tier && (
          <Badge variant="outline" className="capitalize">
            {claim.rarity_tier} Rarity
          </Badge>
        )}
      </div>

      {/* Full Claim Text */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Claim Details</h3>
        <p className="text-base leading-relaxed">{claim.claim_text}</p>
      </div>

      {/* Engagement Metrics */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Engagement Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Engagement Score</span>
            </div>
            <p className="text-2xl font-bold">{claim.engagement_score.toFixed(1)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Velocity</span>
            </div>
            <p className="text-2xl font-bold">{claim.engagement_velocity.toFixed(1)}</p>
          </div>
        </div>
      </Card>

      {/* Source Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Source Information</h3>
        
        {claim.metadata?.author && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Author:</span>
            <span>{claim.metadata.author}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">First Seen:</span>
          <span>{formatDistanceToNow(new Date(claim.first_seen_at), { addSuffix: true })}</span>
        </div>

        {claim.metadata?.source_url && (
          <a
            href={claim.metadata.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Original Source</span>
          </a>
        )}
      </div>

      {/* Additional Metadata */}
      {claim.metadata && Object.keys(claim.metadata).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Additional Context</h3>
          <Card className="p-3">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(claim.metadata, null, 2)}
            </pre>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Close
        </Button>
        {!claim.verification_id && (
          <Button
            onClick={onVerify}
            className="flex-1"
          >
            Verify This Claim
          </Button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Claim Details</DrawerTitle>
            <DrawerDescription>
              Review the full claim information before verifying
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim Details</DialogTitle>
          <DialogDescription>
            Review the full claim information before verifying
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
