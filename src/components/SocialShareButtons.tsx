import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Twitter, Facebook, Linkedin, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { haptics } from '@/lib/haptics';
import { useOGImage } from '@/hooks/useOGImage';
import { OGImagePreview } from './OGImagePreview';

interface SocialShareButtonsProps {
  content: string;
  trustScore: number;
  verificationId?: string | null;
  status: string;
}

export function SocialShareButtons({ 
  content, 
  trustScore, 
  verificationId,
  status 
}: SocialShareButtonsProps) {
  const { toast } = useToast();
  
  // Generate OG image for better social media previews
  const { imageUrl: ogImageUrl, generating: generatingImage, regenerate } = useOGImage(
    verificationId ? {
      contentType: 'verification',
      title: content.length > 60 ? content.substring(0, 60) + '...' : content,
      trustScore: trustScore,
      content: content,
      status: status,
    } : null
  );
  
  // Generate share URL
  const shareUrl = verificationId 
    ? `${window.location.origin}/share/${verificationId}`
    : window.location.href;

  // Truncate content for sharing
  const truncatedContent = content.length > 100 
    ? content.substring(0, 97) + '...' 
    : content;

  // Get emoji based on trust score
  const getScoreEmoji = () => {
    if (trustScore >= 90) return '✅';
    if (trustScore >= 75) return '👍';
    if (trustScore >= 50) return '🤔';
    return '⚠️';
  };

  // Get status text
  const getStatusText = () => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('verified') || statusLower.includes('accurate')) return 'VERIFIED';
    if (statusLower.includes('disputed') || statusLower.includes('debunked')) return 'DISPUTED';
    return 'FACT-CHECKED';
  };

  // Base message template
  const baseMessage = `${getScoreEmoji()} Just fact-checked a claim!\n\n"${truncatedContent}"\n\nTrust Score: ${trustScore}% | Status: ${getStatusText()}\n\nVerified with AI-powered analysis`;

  // Platform-specific share functions
  const shareToTwitter = () => {
    haptics.light();
    const twitterText = `${getScoreEmoji()} Just fact-checked a claim using @TrustLighthouse!\n\nTrust Score: ${trustScore}% | Status: ${getStatusText()}\n\n"${truncatedContent}"\n\n🔍 See full verification:`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    
    toast({
      title: "Opening Twitter",
      description: "Share your verification on Twitter/X",
    });
  };

  const shareToFacebook = () => {
    haptics.light();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(baseMessage)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    
    toast({
      title: "Opening Facebook",
      description: "Share your verification on Facebook",
    });
  };

  const shareToLinkedIn = () => {
    haptics.light();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    
    toast({
      title: "Opening LinkedIn",
      description: "Share your verification on LinkedIn",
    });
  };

  const shareToWhatsApp = () => {
    haptics.light();
    const whatsappText = `${baseMessage}\n\n🔍 Full verification: ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Opening WhatsApp",
      description: "Share your verification via WhatsApp",
    });
  };

  const handleNativeShare = async () => {
    haptics.light();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Fact-Check Result - ${trustScore}% Trust Score`,
          text: baseMessage,
          url: shareUrl,
        });
        
        toast({
          title: "✅ Shared Successfully!",
          description: "Your verification has been shared",
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          toast({
            title: "Share Failed",
            description: "Please try a specific platform",
            variant: "destructive",
          });
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${baseMessage}\n\n${shareUrl}`);
        haptics.success();
        toast({
          title: "✅ Copied to Clipboard!",
          description: "Share message copied - paste it anywhere",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not copy to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      {/* OG Image Preview */}
      <OGImagePreview
        imageUrl={ogImageUrl}
        generating={generatingImage}
        title={content}
        trustScore={trustScore}
        onRegenerate={regenerate}
      />

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1 flex items-center justify-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Share Your Verification
              </h3>
              <p className="text-sm text-muted-foreground">
                Help fight misinformation by sharing this fact-check
              </p>
              {generatingImage && (
                <p className="text-xs text-muted-foreground mt-1">
                  🎨 Generating shareable preview image...
                </p>
              )}
            </div>

          {/* Native Share Button (Mobile First) */}
          {navigator.share && (
            <Button 
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              size="lg"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Now
            </Button>
          )}

          {/* Platform-Specific Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={shareToTwitter}
              variant="outline"
              className="flex items-center gap-2 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-400"
            >
              <Twitter className="h-4 w-4" />
              <span className="hidden sm:inline">Twitter</span>
            </Button>

            <Button
              onClick={shareToFacebook}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400"
            >
              <Facebook className="h-4 w-4" />
              <span className="hidden sm:inline">Facebook</span>
            </Button>

            <Button
              onClick={shareToLinkedIn}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400"
            >
              <Linkedin className="h-4 w-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </Button>

            <Button
              onClick={shareToWhatsApp}
              variant="outline"
              className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-950/30 hover:border-green-400"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {getScoreEmoji()} Trust Score: <strong>{trustScore}%</strong> • Status: <strong>{getStatusText()}</strong>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
