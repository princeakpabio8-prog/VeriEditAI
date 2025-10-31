import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Share2, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClaimShareModalProps {
  viralClaimId: string;
  claimText: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimShareModal({ viralClaimId, claimText, isOpen, onClose }: ClaimShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [ogImageUrl, setOgImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && viralClaimId) {
      createShare();
    }
  }, [isOpen, viralClaimId]);

  const createShare = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-claim-share', {
        body: { viralClaimId },
      });

      if (error) throw error;

      setShareUrl(data.shareUrl);
      setOgImageUrl(data.ogImageUrl || '');

      toast({
        title: 'Share link created!',
        description: 'This claim can now be shared with anyone',
      });
    } catch (error: any) {
      console.error('Error creating share:', error);
      toast({
        title: 'Failed to create share link',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const shareOnSocial = async (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp') => {
    // Try Web Share API first
    if (navigator.share && navigator.canShare) {
      const shareData = {
        title: 'Viral Claim on VeriedIT AI',
        text: `🔥 Hot Claim: ${claimText.substring(0, 100)}... - Race to verify first!`,
        url: shareUrl
      };
      
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          toast({ title: 'Shared successfully! 🎉' });
          return;
        } catch (error: any) {
          if (error.name === 'AbortError') return;
        }
      }
    }
    
    // Desktop fallback
    const text = encodeURIComponent(`🔥 Hot Claim on VeriedIT AI: ${claimText.substring(0, 100)}...`);
    const url = encodeURIComponent(shareUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Viral Claim
          </DialogTitle>
          <DialogDescription>
            Share this trending claim with others
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {ogImageUrl && (
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <Label className="mb-2 block">Share Preview</Label>
                <div className="bg-background border rounded-lg overflow-hidden">
                  <img src={ogImageUrl} alt="Share preview" className="w-full" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is how your claim will appear when shared on LinkedIn, Facebook, and Twitter
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-sm" />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Share on Social Media</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => shareOnSocial('twitter')} variant="outline">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button onClick={() => shareOnSocial('facebook')} variant="outline">
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button onClick={() => shareOnSocial('linkedin')} variant="outline">
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button onClick={() => shareOnSocial('whatsapp')} variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
