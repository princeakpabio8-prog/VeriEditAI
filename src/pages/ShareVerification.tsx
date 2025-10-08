import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrustScoreDisplay } from '@/components/trust-score-display';
import { SourceCredibilityAnalysis } from '@/components/source-credibility-analysis';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Eye, Calendar, Shield, ExternalLink } from 'lucide-react';


interface VerificationData {
  verification: {
    id: string;
    content: string;
    content_type: string;
    trust_score: number;
    status: string;
    result_summary: string;
    score_breakdown: any;
    processing_time_ms: number;
    created_at: string;
  };
  sources: any[];
  share: {
    view_count: number;
    created_at: string;
    og_title: string;
    og_description: string;
  };
}

export default function ShareVerification() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareToken) {
      fetchVerification();
    }
  }, [shareToken]);

  const fetchVerification = async () => {
    try {
      setLoading(true);
      const { data: response, error } = await supabase.functions.invoke(
        `get-public-verification?shareToken=${shareToken}`
      );

      if (error) throw error;

      setData(response);
    } catch (err: any) {
      console.error('Error fetching verification:', err);
      setError(err.message || 'Failed to load verification');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Verification Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || 'This verification link is invalid or has been revoked.'}
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { verification, sources, share } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">VeriedIT AI</span>
              </div>
              <Button onClick={() => navigate('/auth')} variant="default">
                Create Your Own Verification
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Badge */}
          <div className="mb-6 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm py-2 px-4">
              <Shield className="h-4 w-4 mr-2" />
              Verified by VeriedIT AI
            </Badge>
          </div>

          {/* Trust Score */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Verification Results</CardTitle>
            </CardHeader>
            <CardContent>
              <TrustScoreDisplay
                score={verification.trust_score}
                size="lg"
                showLabel
              />
              {verification.result_summary && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground">{verification.result_summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verified Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Verified Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="whitespace-pre-wrap">{verification.content}</p>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(verification.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {share.view_count} {share.view_count === 1 ? 'view' : 'views'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources */}
          {sources && sources.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Sources & Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <SourceCredibilityAnalysis 
                  sources={sources}
                  verification_method={['AI Analysis', 'Multi-Source Verification']}
                  confidence={verification.trust_score}
                />
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />

          {/* CTA */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Want to verify your own content?</h2>
                <p className="text-muted-foreground">
                  Join VeriedIT AI and get instant AI-powered fact-checking for any content
                </p>
                <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
                  Get Started for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Powered by{' '}
              <button
                onClick={() => navigate('/')}
                className="text-primary hover:underline"
              >
                VeriedIT AI
              </button>{' '}
              - AI-Powered Truth Verification
            </p>
          </div>
        </main>
      </div>
  );
}
