import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/ui/navigation';
import { VerificationUpload } from '@/components/verification-upload';
import { FeatureGuard } from '@/components/feature-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLicense } from '@/contexts/LicenseContext';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const Verify = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { incrementUsage } = useLicense();
  const navigate = useNavigate();
  const [processing, setProcessing] = React.useState(false);

  const handleVerificationStart = async (data: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setProcessing(true);
    
    try {
      // Check license usage before processing
      const usageResult = await incrementUsage(1);
      if (!usageResult.success) {
        toast({
          title: "Usage Limit Reached",
          description: usageResult.error || "You've reached your verification limit.",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/billing')}
            >
              Upgrade
            </Button>
          ),
        });
        setProcessing(false);
        return;
      }

      toast({
        title: "Verification Started",
        description: "Your content is being processed...",
      });

      // Call the Supabase Edge Function
      const { data: result, error } = await supabase.functions.invoke('verify', {
        body: {
          content: data.content,
          contentType: data.type,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Verification failed');
      }

      toast({
        title: "Verification Complete",
        description: `Analysis complete with ${result.trust_score}% confidence.`,
      });

      // Redirect to dashboard to see results
      navigate('/dashboard');

    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Content Verification
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Submit your content for AI-powered fact-checking and trust analysis
          </p>
        </div>

        {/* How it Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>1. Submit Content</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload text, URLs, or documents for analysis
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>2. AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our AI examines sources, facts, and credibility
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>3. Get Results</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Receive a detailed trust score and analysis
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Verification Form */}
        <div className="max-w-4xl mx-auto">
          <FeatureGuard 
            feature="verification"
            fallback={
              <Card className="border-amber-500/50 bg-amber-500/5 p-8">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">License Required</h3>
                  <p className="text-muted-foreground mb-6">
                    A valid license is required to use verification features.
                  </p>
                  <div className="space-x-4">
                    <Button onClick={() => navigate('/license')}>
                      View License Options
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                  </div>
                </div>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>Submit Content for Verification</CardTitle>
                <CardDescription>
                  Choose your content type and submit for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VerificationUpload 
                  onVerificationStart={handleVerificationStart}
                  isLoading={processing}
                />
              </CardContent>
            </Card>
          </FeatureGuard>
        </div>
      </main>
    </div>
  );
};

export default Verify;