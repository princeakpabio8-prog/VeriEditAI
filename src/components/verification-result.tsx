import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustScoreDisplay } from './trust-score-display';
import { ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Source {
  id: string;
  url: string;
  title: string;
  content_snippet: string;
  reliability_score: number;
}

interface VerificationResultProps {
  verificationId: string;
  trustScore: number;
  status: string;
  summary: string;
  sources: Source[];
  processingTime?: number;
  onNewVerification?: () => void;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  verificationId,
  trustScore,
  status,
  summary,
  sources,
  processingTime,
  onNewVerification,
}) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      verified: "default",
      flagged: "secondary", 
      failed: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatProcessingTime = (ms?: number) => {
    if (!ms) return null;
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Result Card */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 mb-4">
            Verification Complete
            {getStatusBadge(status)}
          </CardTitle>
          <div className="flex justify-center">
            <TrustScoreDisplay 
              score={trustScore} 
              size="xl" 
              showAnimation={true}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{summary}</p>
            {processingTime && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Processed in {formatProcessingTime(processingTime)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sources Card */}
      {sources && sources.length > 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Supporting Evidence</CardTitle>
            <CardDescription>
              Sources found during verification analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sources.map((source, index) => (
              <div 
                key={source.id || index}
                className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/30"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{source.title}</h4>
                    {source.reliability_score && (
                      <Badge variant="outline" className="text-xs">
                        {source.reliability_score}% reliable
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {source.content_snippet}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-8 px-2"
                    onClick={() => window.open(source.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Source
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center">
        <Button 
          onClick={onNewVerification}
          size="lg"
          className="gap-2"
        >
          Verify More Content
        </Button>
      </div>
    </div>
  );
};