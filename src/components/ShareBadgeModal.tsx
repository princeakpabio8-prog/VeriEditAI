import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Check, Trophy, Star, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShareBadgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string;
  badgeEarned?: string;
}

const BADGE_CONFIG = {
  'truth_spreader': {
    name: 'Truth Spreader',
    icon: Share2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    threshold: 1,
    description: 'Shared your first verification'
  },
  'verification_champion': {
    name: 'Verification Champion',
    icon: Star,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    threshold: 5,
    description: 'Shared 5+ verifications'
  },
  'lighthouse_keeper': {
    name: 'Lighthouse Keeper',
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    threshold: 20,
    description: 'Shared 20+ verifications - True guardian of truth!'
  }
};

export function ShareBadgeModal({ open, onOpenChange, shareUrl, badgeEarned }: ShareBadgeModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      fetchShareCount();
    }
  }, [open, user]);

  const fetchShareCount = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('share_analytics')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);
    
    if (data) setShareCount(data.length);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getNextBadge = () => {
    if (shareCount < 5) return BADGE_CONFIG.verification_champion;
    if (shareCount < 20) return BADGE_CONFIG.lighthouse_keeper;
    return null;
  };

  const nextBadge = getNextBadge();
  const currentBadge = badgeEarned ? BADGE_CONFIG[badgeEarned as keyof typeof BADGE_CONFIG] : BADGE_CONFIG.truth_spreader;
  const BadgeIcon = currentBadge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Badge Unlocked!
          </DialogTitle>
          <DialogDescription>
            You've earned a new achievement
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className={`p-6 rounded-full ${currentBadge.bgColor} mb-4 animate-scale-in`}>
            <BadgeIcon className={`h-16 w-16 ${currentBadge.color}`} />
          </div>
          
          <Badge variant="outline" className="mb-2 text-lg px-4 py-1 border-primary/30">
            {currentBadge.name}
          </Badge>
          
          <p className="text-sm text-muted-foreground text-center mb-4">
            {currentBadge.description}
          </p>

          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-primary">{shareCount}</p>
            <p className="text-xs text-muted-foreground">Total Shares</p>
          </div>

          {nextBadge && (
            <div className="w-full p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <nextBadge.icon className={`h-4 w-4 ${nextBadge.color} opacity-50`} />
                  <span className="text-sm text-muted-foreground">Next: {nextBadge.name}</span>
                </div>
                <span className="text-xs font-medium">
                  {nextBadge.threshold - shareCount} more shares
                </span>
              </div>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(shareCount / nextBadge.threshold) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleCopy} className="w-full">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Share Link
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Share again to unlock the next badge!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
