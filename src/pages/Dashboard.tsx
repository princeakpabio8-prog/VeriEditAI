import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Navigation } from '@/components/ui/navigation';
import { VerificationUpload } from '@/components/verification-upload';
import { TrustScoreDisplay } from '@/components/trust-score-display';
import { Plus, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Verification {
  id: string;
  content: string;
  content_type: string;
  status: string;
  trust_score: number | null;
  created_at: string;
  result_summary: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [processingVerification, setProcessingVerification] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVerifications();
      
      // Check for pending verification after login
      const pendingVerification = sessionStorage.getItem('pendingVerification');
      if (pendingVerification) {
        try {
          const data = JSON.parse(pendingVerification);
          sessionStorage.removeItem('pendingVerification');
          
          // Auto-start verification
          setTimeout(() => {
            handleVerificationStart(data);
          }, 500); // Small delay to ensure UI is ready
        } catch (error) {
          console.error('Error parsing pending verification:', error);
          sessionStorage.removeItem('pendingVerification');
        }
      }
    }
  }, [user]);

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast({
        title: "Error",
        description: "Failed to load verifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationStart = async (data: any) => {
    setProcessingVerification(true);
    
    try {
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

      // Check if it's a usage limit error
      if (result?.limit_reached) {
        toast({
          title: "Verification Limit Reached",
          description: result.error || "You've reached your monthly limit. Upgrade to Pro for unlimited verifications.",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/billing'}
            >
              Upgrade
            </Button>
          ),
        });
        setProcessingVerification(false);
        return;
      }

      await fetchVerifications();
      setShowVerificationModal(false);
      setProcessingVerification(false);

      toast({
        title: "Verification Complete",
        description: `Analysis complete with ${result.trust_score}% confidence.`,
      });

    } catch (error) {
      console.error('Error starting verification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      });
      setProcessingVerification(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-trust-medium" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-trust-high" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-trust-low" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : undefined} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Verify content authenticity with AI-powered analysis
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Total Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {verifications.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-trust-high">
                {verifications.filter(v => 
                  new Date(v.created_at).getMonth() === new Date().getMonth()
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-trust-medium">
                {verifications.length > 0 
                  ? Math.round(
                      verifications
                        .filter(v => v.trust_score !== null)
                        .reduce((acc, v) => acc + (v.trust_score || 0), 0) / 
                      verifications.filter(v => v.trust_score !== null).length
                    )
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Verification Button */}
        <div className="mb-8">
          <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Submit Content for Verification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Verification</DialogTitle>
                <DialogDescription>
                  Submit content for AI-powered fact-checking and trust analysis
                </DialogDescription>
              </DialogHeader>
              <VerificationUpload 
                onVerificationStart={handleVerificationStart}
                isLoading={processingVerification}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Recent Verifications */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Verifications</CardTitle>
            <CardDescription>
              Your latest content analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verifications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No verifications yet</p>
                <p className="text-sm text-muted-foreground">
                  Start by submitting your first piece of content
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={verification.content}>
                          {verification.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {verification.content_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(verification.status)}
                          {getStatusBadge(verification.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {verification.trust_score !== null ? (
                          <TrustScoreDisplay 
                            score={verification.trust_score} 
                            size="sm"
                            showLabel={false}
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(verification.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;