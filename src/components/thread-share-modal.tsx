import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Eye, X, Twitter, Facebook, Linkedin, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThreadShareModalProps {
  threadId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ThreadShareModal({ threadId, isOpen, onClose }: ThreadShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareToken, setShareToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && threadId) {
      createShare();
    }
  }, [isOpen, threadId]);

  const createShare = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to share threads',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-thread-share', {
        body: { threadId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create share link');
      }

      if (!data?.shareUrl) {
        throw new Error('Invalid response from server');
      }

      setShareUrl(data.shareUrl);
      setShareToken(data.shareToken);

      toast({
        title: 'Share link created!',
        description: 'Your thread is now publicly accessible',
      });
    } catch (error: any) {
      console.error('Error creating share:', error);
      toast({
        title: 'Failed to create share link',
        description: error?.message || 'Please try again',
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
      
      if (shareToken) {
        await supabase.functions.invoke('track-share', {
          body: { shareToken, contentType: 'thread', platform: 'copy', contentId: threadId },
        }).catch(console.error);
      }
      
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
    const text = encodeURIComponent('Check out this verified thread on VeriedIT AI 🌟');
    const url = encodeURIComponent(shareUrl);

    if (shareToken) {
      await supabase.functions.invoke('track-share', {
        body: { shareToken, contentType: 'thread', platform, contentId: threadId },
      }).catch(console.error);
    }

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const revokeShare = async () => {
    try {
      const { error } = await supabase
        .from('public_threads')
        .update({ is_active: false })
        .eq('share_token', shareToken);

      if (error) throw error;

      toast({
        title: 'Share revoked',
        description: 'The share link is no longer accessible',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to revoke share',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Thread</DialogTitle>
          <DialogDescription>
            Share this thread with anyone via a public link
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-url">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyToClipboard} size="icon" variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Share on Social Media</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => shareOnSocial('twitter')}
                  variant="outline"
                  size="sm"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  onClick={() => shareOnSocial('facebook')}
                  variant="outline"
                  size="sm"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  onClick={() => shareOnSocial('linkedin')}
                  variant="outline"
                  size="sm"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  onClick={() => shareOnSocial('whatsapp')}
                  variant="outline"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={revokeShare}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Revoke Access
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
