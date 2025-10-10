import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Search, Shield, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export const OrganizationsList = ({ embedded = false }: { embedded?: boolean }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('avg_trust_score', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const industries = Array.from(new Set(organizations?.map(org => org.industry) || []));

  const filteredOrganizations = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         org.domain?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = !selectedIndustry || org.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const getTrustColor = (score: number) => {
    if (score >= 81) return "text-green-500";
    if (score >= 61) return "text-yellow-500";
    if (score >= 41) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      <div className="container mx-auto px-4 py-12 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Verified Organizations</h1>
          <p className="text-muted-foreground">
            Browse organizations and their trust scores verified through VeriEdit's engine
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedIndustry === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedIndustry(null)}
            >
              All
            </Badge>
            {industries.map(industry => (
              <Badge
                key={industry}
                variant={selectedIndustry === industry ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedIndustry(industry)}
              >
                {industry}
              </Badge>
            ))}
          </div>
        </div>

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : filteredOrganizations && filteredOrganizations.length > 0 ? (
            filteredOrganizations.map((org) => (
              <Card
                key={org.id}
                className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/lighthouse/organizations/${org.id}`)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="w-10 h-10 object-contain" />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      {org.verified_partner && (
                        <Badge variant="outline" className="border-primary/50 text-primary">
                          <Shield className="h-3 w-3 mr-1" />
                          Partner
                        </Badge>
                      )}
                    </div>
                    <div className={`text-2xl font-bold ${getTrustColor(org.avg_trust_score)}`}>
                      {org.avg_trust_score}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {org.domain}
                    </p>
                  </div>

                  <Progress value={org.avg_trust_score} className="h-1" />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="secondary">{org.industry}</Badge>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {org.total_verifications} verifications
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No organizations found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
