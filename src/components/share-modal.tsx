import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, Share2, Eye, X, QrCode, Facebook, Twitter, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCodeLib from 'qrcode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { createShareableURL, trackShare } from '@/lib/public-analytics';

interface ShareModalProps {
  verificationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ verificationId, isOpen, onClose }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareToken, setShareToken] = useState<string>('');
  const [viewCount, setViewCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && verificationId) {
      createShare();
    }
  }, [isOpen, verificationId]);

  useEffect(() => {
    if (shareUrl) {
      generateQRCode();
    }
  }, [shareUrl]);

  const createShare = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to share verifications',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-public-share', {
        body: { verificationId },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to create share link');
      }

      if (!data?.shareUrl) {
        console.error('No share URL in response:', data);
        throw new Error('Invalid response from server');
      }

      setShareUrl(data.shareUrl);
      setShareToken(data.shareToken);
      setViewCount(data.viewCount || 0);

      toast({
        title: 'Share link created!',
        description: 'Your verification is now publicly accessible',
      });
    } catch (error) {
      console.error('Error creating share:', error);
      const errorMessage = error?.message || error?.error || 'Please try again';
      toast({
        title: 'Failed to create share link',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
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

  const shareOnSocial = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const text = encodeURIComponent('Check out this AI-verified content on VeriedIT AI');
    const url = encodeURIComponent(shareUrl);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const revokeShare = async () => {
    try {
      const { error } = await supabase
        .from('public_verifications')
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
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Verification Report
          </DialogTitle>
          <DialogDescription>
            Share this verification publicly with a unique link
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="embed">Embed</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4">
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

              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {viewCount} {viewCount === 1 ? 'view' : 'views'}
                </span>
              </div>

              <div className="space-y-2">
                <Label>Share on Social Media</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => shareOnSocial('twitter')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('facebook')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    onClick={() => shareOnSocial('linkedin')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={revokeShare}
                  variant="destructive"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Revoke Access
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Revoking will make the share link inaccessible
                </p>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Label>QR Code for Mobile Sharing</Label>
                {qrCodeUrl && (
                  <div className="p-4 bg-white rounded-lg">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your mobile device to access the verification
                </p>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = 'verification-qr-code.png';
                    link.href = qrCodeUrl;
                    link.click();
                  }}
                  variant="outline"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4">
              <div className="space-y-2">
                <Label>Embed Code</Label>
                <div className="relative">
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
                    <code>{embedCode}</code>
                  </pre>
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(embedCode);
                      toast({
                        title: 'Copied!',
                        description: 'Embed code copied to clipboard',
                      });
                    }}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy and paste this code into your website to embed the verification report
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Preview</h4>
                <div className="aspect-video bg-muted rounded overflow-hidden">
                  <iframe
                    src={shareUrl}
                    className="w-full h-full"
                    title="Verification Preview"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
