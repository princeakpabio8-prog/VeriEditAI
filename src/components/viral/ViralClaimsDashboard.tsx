import { useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useViralClaims } from '@/hooks/useViralClaims';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ViralClaimsDashboard() {
  const [status, setStatus] = useState<'detected' | 'trending' | undefined>('trending');
  const { viralClaims, isLoading } = useViralClaims(status);
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('calculate-virality');
      if (error) throw error;
      toast.success('Viral claims refreshed successfully!');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh viral claims');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected':
        return <Clock className="h-4 w-4" />;
      case 'trending':
        return <Activity className="h-4 w-4 animate-pulse" />;
      case 'verified':
        return <CheckCircle className="h-4 w-4" />;
      case 'debunked':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'trending':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'verified':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'debunked':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const handleVerifyClaim = (claimText: string) => {
    navigate(`/verify?claim=${encodeURIComponent(claimText)}`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              Viral Claims Detection
            </CardTitle>
            <CardDescription>
              Real-time tracking of trending misinformation
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? undefined : v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="detected">Detected</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
          </TabsList>
          
          <TabsContent value={status || 'all'} className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))
            ) : viralClaims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No viral claims detected yet</p>
              </div>
            ) : (
              viralClaims.map((claim) => (
                <Card key={claim.id} className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {claim.image_url && (
                      <div className="flex-shrink-0">
                        <img 
                          src={claim.image_url} 
                          alt={claim.claim_text}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <p className="font-medium line-clamp-2">{claim.claim_text}</p>
                          <p className="text-sm text-muted-foreground">
                            First seen {formatDistanceToNow(new Date(claim.first_seen_at))} ago
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(claim.status)} flex items-center gap-1 flex-shrink-0`}
                        >
                          {getStatusIcon(claim.status)}
                          {claim.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Engagement Velocity</span>
                          <span className="font-medium">{claim.engagement_velocity.toFixed(1)} /hour</span>
                        </div>
                        <Progress 
                          value={Math.min((Number(claim.engagement_velocity) / 10) * 100, 100)} 
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{claim.engagement_score} engagement</span>
                          <span>•</span>
                          <span>{claim.platform}</span>
                        </div>
                        
                        {!claim.verification_id && (
                          <Button 
                            size="sm" 
                            onClick={() => handleVerifyClaim(claim.claim_text)}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Verify Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
