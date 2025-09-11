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
import { Plus, Clock, CheckCircle, AlertTriangle, FileText, BarChart3, Download, Package, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LicenseStatus } from '@/components/license-status';
import { FeatureGuard } from '@/components/feature-guard';
import { useLicense } from '@/contexts/LicenseContext';
import { VerificationAnalytics } from '@/components/verification-analytics';
import { BulkVerification } from '@/components/bulk-verification';
import { VerificationExport } from '@/components/verification-export';
import { useVerificationQueue } from '@/hooks/use-verification-queue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { incrementUsage, checkFeatureAccess } = useLicense();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [processingVerification, setProcessingVerification] = useState(false);
  const { addToQueue, queue, startQueue, getStats } = useVerificationQueue();

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
      // Add to queue instead of processing immediately
      const queueItems = addToQueue([{
        content: data.content,
        type: data.type || 'text',
        priority: 'normal'
      }]);

      if (queueItems.length > 0) {
        toast({
          title: "Added to Queue",
          description: "Your verification has been queued for processing.",
        });
        
        // Start queue processing if not already running
        await startQueue();
      }

      setShowVerificationModal(false);
      setProcessingVerification(false);

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

  const handleBulkVerification = async (items: any[]) => {
    try {
      const queueItems = addToQueue(items.map(item => ({
        content: item.content,
        type: item.type,
        priority: item.priority || 'normal'
      })));

      toast({
        title: "Bulk Verification Started",
        description: `${queueItems.length} items added to processing queue.`,
      });

      await startQueue();
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error starting bulk verification:', error);
      toast({
        title: "Error",
        description: "Failed to start bulk verification",
        variant: "destructive",
      });
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('clear_user_verifications', {
        user_uuid: user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Cleared ${(data as any)?.deleted_count || 0} verification records`,
      });

      // Refresh the verifications list
      fetchVerifications();
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "Failed to clear verification history",
        variant: "destructive",
      });
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

        {/* License Status */}
        <div className="mb-8">
          <LicenseStatus variant="card" />
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <CardTitle className="text-lg">Queue Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-trust-high">
                    {getStats().pending + getStats().processing}
                  </div>
                  <p className="text-sm text-muted-foreground">Items in queue</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-trust-medium">
                    {Math.round(getStats().successRate)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap">
              <FeatureGuard 
                feature="verification"
                fallback={
                  <Card className="border-amber-500/50 bg-amber-500/5 p-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">Verification Unavailable</h3>
                      <p className="text-muted-foreground mb-4">
                        A valid license is required to use verification features.
                      </p>
                      <Button onClick={() => window.location.href = '/billing'}>
                        Upgrade to Pro with Flutterwave
                      </Button>
                    </div>
                  </Card>
                }
              >
                <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      New Verification
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

                <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2">
                      <Package className="h-5 w-5" />
                      Bulk Verification
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Bulk Verification</DialogTitle>
                      <DialogDescription>
                        Upload multiple items for batch processing
                      </DialogDescription>
                    </DialogHeader>
                    <BulkVerification onBulkStart={handleBulkVerification} />
                  </DialogContent>
                </Dialog>
              </FeatureGuard>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <VerificationAnalytics verifications={verifications} />
          </TabsContent>

          <TabsContent value="bulk">
            <BulkVerification onBulkStart={handleBulkVerification} />
          </TabsContent>

          <TabsContent value="export">
            <VerificationExport verifications={verifications} />
          </TabsContent>
        </Tabs>

        {/* Recent Verifications */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Verifications</CardTitle>
              <CardDescription>
                Your latest content analysis results
              </CardDescription>
            </div>
            {verifications.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearHistory}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            )}
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