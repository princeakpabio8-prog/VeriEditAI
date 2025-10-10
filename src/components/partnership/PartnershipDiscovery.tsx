import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, Shield, Sparkles, RefreshCw, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const PartnershipDiscovery = ({ embedded = false }: { embedded?: boolean }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['partnership-stats'],
    queryFn: async () => {
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*');
      
      if (orgsError) throw orgsError;

      const { data: claims, error: claimsError } = await supabase
        .from('organization_claims')
        .select('*')
        .gte('discovered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (claimsError) throw claimsError;

      const { data: requests, error: requestsError } = await supabase
        .from('partnership_requests')
        .select('*')
        .eq('status', 'pending');
      
      if (requestsError) throw requestsError;

      const avgTrustScore = orgs.reduce((sum, org) => sum + (org.avg_trust_score || 0), 0) / (orgs.length || 1);

      return {
        totalOrgs: orgs.length,
        claimsThisWeek: claims.length,
        avgTrustScore: Math.round(avgTrustScore),
        pendingRequests: requests.length,
        industries: Array.from(new Set(orgs.map(o => o.industry))),
      };
    },
  });

  const { data: recentClaims, refetch: refetchClaims } = useQuery({
    queryKey: ['recent-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_claims')
        .select('*, organizations(*)')
        .order('discovered_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const handleScanSources = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('discover-org-claims');
      
      if (error) throw error;

      toast({
        title: "Scan Complete",
        description: `Discovered ${data.discovered_claims} new claims from ${data.organizations_found} organizations`,
      });

      refetchStats();
      refetchClaims();
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-gradient-to-b from-background via-background to-muted/20"}>
      {/* Header with Lighthouse Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 animate-pulse" />
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-4 flex items-center gap-3">
              <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              Partnership Discovery
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Automatically discover and verify organizational claims from trusted sources
            </p>
            <Button 
              size="lg" 
              onClick={handleScanSources}
              disabled={scanning}
              className="bg-primary hover:bg-primary/90"
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Scanning Sources...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Scan New Sources
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Organizations Discovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {stats?.totalOrgs || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Claims Verified (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-500">
                {stats?.claimsThisWeek || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Trust Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-500">
                {stats?.avgTrustScore || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Partnership Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {stats?.pendingRequests || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Industry Filters */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm">All Industries</Badge>
          {stats?.industries.map(industry => (
            <Badge key={industry} variant="outline" className="text-sm">
              {industry}
            </Badge>
          ))}
        </div>

        {/* Real-time Discovery Feed */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Recently Discovered Claims
          </h2>
          
          <div className="space-y-4">
            {recentClaims && recentClaims.length > 0 ? (
              recentClaims.map((claim) => (
                <Card 
                  key={claim.id} 
                  className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/lighthouse/organizations/${claim.organization_id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                              {claim.organizations?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="secondary">{claim.organizations?.industry}</Badge>
                              <span>•</span>
                              <span>{new Date(claim.discovered_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {claim.trust_score !== null && (
                            <div className="text-right">
                              <div className={`text-3xl font-bold ${
                                claim.trust_score >= 81 ? 'text-green-500' :
                                claim.trust_score >= 61 ? 'text-yellow-500' :
                                claim.trust_score >= 41 ? 'text-orange-500' :
                                'text-red-500'
                              }`}>
                                {claim.trust_score}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`mt-1 ${
                                  claim.verification_status === 'verified' ? 'border-green-500/50 text-green-500' :
                                  claim.verification_status === 'refuted' ? 'border-red-500/50 text-red-500' :
                                  'border-muted-foreground/50'
                                }`}
                              >
                                {claim.confidence_level || 'Pending'}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {claim.claim_text}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="outline" className="capitalize">
                            {claim.source_type.replace('_', ' ')}
                          </Badge>
                          {claim.source_url && (
                            <a 
                              href={claim.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Source
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No claims discovered yet. Click "Scan New Sources" to start discovering.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
