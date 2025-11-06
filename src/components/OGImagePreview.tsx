import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OGImagePreviewProps {
  imageUrl?: string | null;
  generating?: boolean;
  title: string;
  trustScore: number;
  onRegenerate?: () => void;
}

export function OGImagePreview({ 
  imageUrl, 
  generating, 
  title,
  trustScore,
  onRegenerate 
}: OGImagePreviewProps) {
  if (generating) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">
              Generating shareable preview image...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Badge variant="secondary" className="mb-1">
              Social Media Preview
            </Badge>
            <p className="text-xs text-muted-foreground">
              This is how your verification will appear when shared
            </p>
          </div>
          {onRegenerate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRegenerate}
            >
              Regenerate
            </Button>
          )}
        </div>
        
        {/* Preview Image */}
        <div className="relative rounded-lg overflow-hidden border-2 border-border shadow-lg hover:shadow-xl transition-shadow">
          <img 
            src={imageUrl} 
            alt="Social media preview"
            className="w-full h-auto"
            loading="lazy"
          />
          
          {/* Overlay with info */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/60 text-white backdrop-blur-sm">
              1200 × 630
            </Badge>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Optimized for:</span>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs py-0.5">Twitter</Badge>
            <Badge variant="outline" className="text-xs py-0.5">Facebook</Badge>
            <Badge variant="outline" className="text-xs py-0.5">LinkedIn</Badge>
            <Badge variant="outline" className="text-xs py-0.5">WhatsApp</Badge>
          </div>
        </div>

        {/* Test Link */}
        <div className="mt-3 pt-3 border-t border-border">
          <a 
            href={`https://www.opengraph.xyz/url/${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Test how this looks on social platforms
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
