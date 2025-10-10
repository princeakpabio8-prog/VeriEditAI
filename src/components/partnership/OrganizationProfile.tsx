import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, TrendingUp, Shield, ExternalLink, Sparkles, ArrowLeft } from "lucide-react";
import { useEffect } from 'react';
import { DynamicMeta } from '@/components/DynamicMeta';
import { generateOrganizationSchema, injectStructuredData, removeStructuredData } from '@/lib/structured-data';
import { trackPageView } from '@/lib/public-analytics';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { PartnershipRequestDialog } from "./PartnershipRequestDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const OrganizationProfile = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [showPartnerDialog, setShowPartnerDialog] = useState(false);

  // Track page view
  useEffect(() => {
    if (orgId) {
      trackPageView('organization', orgId);
    }
  }, [orgId]);

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: claims } = useQuery({
    queryKey: ['organization-claims', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_claims')
        .select('*, verifications(*)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
  
  // Inject structured data for SEO
  useEffect(() => {
    if (organization && orgId) {
      const structuredData = generateOrganizationSchema({
        name: organization.name,
        description: organization.description || undefined,
        url: organization.website || undefined,
        logo: organization.logo_url || undefined,
        trustScore: organization.avg_trust_score || undefined,
        verifiedPartner: organization.verified_partner || false,
      });
      injectStructuredData(structuredData, `org-${orgId}-structured-data`);
    }
    
    return () => {
      if (orgId) {
        removeStructuredData(`org-${orgId}-structured-data`);
      }
    };
  }, [organization, orgId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse">
            <Sparkles className="h-12 w-12 mx-auto text-primary" />
          </div>
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  // Prepare meta description
  const metaDescription = organization?.description?.slice(0, 155) || `${organization?.name} - Trust Score: ${organization?.avg_trust_score || 'N/A'}/100 | Verified by VeriEdit AI`;
  const metaTitle = organization?.name || 'Organization Profile';

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  const getTrustColor = (score: number) => {
    if (score >= 81) return "text-green-500";
    if (score >= 61) return "text-yellow-500";
    if (score >= 41) return "text-orange-500";
    return "text-red-500";
  };

  const getTrustBgColor = (score: number) => {
    if (score >= 81) return "bg-green-500/20";
    if (score >= 61) return "bg-yellow-500/20";
    if (score >= 41) return "bg-orange-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DynamicMeta
        title={metaTitle}
        description={metaDescription}
        url={window.location.href}
        type="website"
        trustScore={organization.avg_trust_score || undefined}
        image={organization.logo_url || undefined}
      />
      {/* Hero Section with Lighthouse Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="container mx-auto px-4 py-8 relative">
          {/* Navigation */}
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/lighthouse?tab=organizations&browse=true')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Organizations
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/lighthouse?browse=true">Lighthouse Hub</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/lighthouse?tab=organizations&browse=true">Organizations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{organization.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16 relative">
          <div className="flex items-start gap-8">
            <div className={`w-24 h-24 rounded-2xl ${getTrustBgColor(organization.avg_trust_score)} flex items-center justify-center border border-border`}>
              {organization.logo_url ? (
                <img src={organization.logo_url} alt={organization.name} className="w-20 h-20 object-contain" />
              ) : (
                <Building2 className="h-12 w-12 text-primary" />
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{organization.name}</h1>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm">
                      {organization.industry}
                    </Badge>
                    {organization.verified_partner && (
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified Partner
                      </Badge>
                    )}
                    {organization.domain && (
                      <a 
                        href={`https://${organization.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        {organization.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              {organization.description && (
                <p className="text-muted-foreground max-w-2xl">{organization.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Dashboard */}
      <div className="container mx-auto px-4 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Trust Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={`text-5xl font-bold ${getTrustColor(organization.avg_trust_score)}`}>
                  {organization.avg_trust_score}
                </div>
                <Progress value={organization.avg_trust_score} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {organization.avg_trust_score >= 81 ? 'Highly Credible' :
                   organization.avg_trust_score >= 61 ? 'Credible' :
                   organization.avg_trust_score >= 41 ? 'Questionable' :
                   'Low Credibility'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-primary">
                {organization.total_verifications}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Claims verified through VeriEdit
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Credibility Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold text-green-500">Stable</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                7-day performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Partnership CTA */}
        {!organization.verified_partner && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-pulse" />
            <CardContent className="p-8 relative">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Join VeriEdit's Trust Network
                  </h3>
                  <p className="text-muted-foreground max-w-2xl">
                    Collaborate with us to verify your data in real time and build trust with your audience
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowPartnerDialog(true)}
                >
                  Request Partnership
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Verifications */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Verifications</h2>
          <div className="space-y-4">
            {claims && claims.length > 0 ? (
              claims.map((claim) => (
                <Card key={claim.id} className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <p className="text-sm leading-relaxed">{claim.claim_text}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="outline" className="capitalize">
                            {claim.source_type.replace('_', ' ')}
                          </Badge>
                          <span>{new Date(claim.discovered_at).toLocaleDateString()}</span>
                          {claim.source_url && (
                            <a 
                              href={claim.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary flex items-center gap-1"
                            >
                              Source
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className={`text-3xl font-bold ${getTrustColor(claim.trust_score || 0)}`}>
                          {claim.trust_score || '—'}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${
                            claim.verification_status === 'verified' ? 'border-green-500/50 text-green-500' :
                            claim.verification_status === 'refuted' ? 'border-red-500/50 text-red-500' :
                            'border-muted-foreground/50'
                          }`}
                        >
                          {claim.confidence_level || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No verifications yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Browse More Organizations CTA */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Discover More Organizations</h3>
            <p className="text-muted-foreground mb-4">
              Explore other verified organizations in the VeriEdit trust network
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/lighthouse?tab=organizations&browse=true')}
              className="gap-2"
            >
              Browse Organizations
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <PartnershipRequestDialog
        open={showPartnerDialog}
        onOpenChange={setShowPartnerDialog}
        organization={organization}
      />
    </div>
  );
};
