import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, TrendingUp, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostVerificationSuggestionsProps {
  verificationId: string;
  trustScore: number;
  onShareClick?: () => void;
  onVerifyAnother?: () => void;
}

export const PostVerificationSuggestions: React.FC<PostVerificationSuggestionsProps> = ({
  verificationId,
  trustScore,
  onShareClick,
  onVerifyAnother,
}) => {
  const navigate = useNavigate();

  const suggestions = [
    {
      title: 'Share Your Verification',
      description: 'Help others see the truth',
      icon: <Share2 className="h-5 w-5" />,
      action: onShareClick || (() => navigate(`/share/${verificationId}`)),
      variant: 'default' as const,
      show: true,
    },
    {
      title: 'Check Hot Claims',
      description: 'Verify trending news',
      icon: <TrendingUp className="h-5 w-5" />,
      action: () => navigate('/viral-claims'),
      variant: 'secondary' as const,
      show: true,
    },
    {
      title: 'View Your Dashboard',
      description: `Trust score: ${trustScore.toFixed(1)}`,
      icon: <ArrowRight className="h-5 w-5" />,
      action: () => navigate('/dashboard'),
      variant: 'outline' as const,
      show: true,
    },
    {
      title: 'Verify Another',
      description: 'Keep the momentum going',
      icon: <Repeat className="h-5 w-5" />,
      action: onVerifyAnother || (() => window.scrollTo({ top: 0, behavior: 'smooth' })),
      variant: 'outline' as const,
      show: !!onVerifyAnother,
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">What's Next?</h3>
            <p className="text-sm text-muted-foreground">
              Continue your truth-seeking journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions
              .filter((s) => s.show)
              .map((suggestion, index) => (
                <Button
                  key={index}
                  variant={suggestion.variant}
                  onClick={suggestion.action}
                  className="h-auto py-3 px-4 justify-start text-left"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-0.5">{suggestion.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{suggestion.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {suggestion.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
