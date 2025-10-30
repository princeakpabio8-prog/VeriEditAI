import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Target, TrendingUp, Award, DollarSign, Clock, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Bounty {
  id: string;
  title: string;
  description: string;
  claim_to_verify: string;
  category: string;
  tags: string[];
  reward_amount: number;
  reward_currency: string;
  payment_type: string;
  status: string;
  expires_at: string;
  min_trust_score: number;
  required_sources: number;
  organizations: {
    name: string;
    logo_url: string;
  };
}

const BountyMarketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("reward_desc");

  useEffect(() => {
    fetchBounties();
  }, [categoryFilter, sortBy]);

  const fetchBounties = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('truth_bounties')
        .select('*, organizations(name, logo_url)')
        .eq('status', 'active');

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort bounties
      let sorted = data || [];
      if (sortBy === 'reward_desc') {
        sorted = sorted.sort((a, b) => Number(b.reward_amount) - Number(a.reward_amount));
      } else if (sortBy === 'reward_asc') {
        sorted = sorted.sort((a, b) => Number(a.reward_amount) - Number(b.reward_amount));
      } else if (sortBy === 'expires_soon') {
        sorted = sorted.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
      }

      setBounties(sorted);
    } catch (error: any) {
      console.error('Error fetching bounties:', error);
      toast.error('Failed to load bounties');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBounty = async (bountyId: string) => {
    if (!user) {
      toast.error('Please sign in to claim bounties');
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('claim-bounty', {
        body: { bounty_id: bountyId },
      });

      if (error) throw error;

      toast.success('Bounty claimed successfully! Start your verification now.');
      navigate(`/verify?bounty_id=${bountyId}`);
    } catch (error: any) {
      console.error('Error claiming bounty:', error);
      toast.error(error.message || 'Failed to claim bounty');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      election: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      ai: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      health: 'bg-green-500/10 text-green-500 border-green-500/20',
      policy: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      education: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      climate: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      finance: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      general: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[category] || colors.general;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Expires soon';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Truth Bounty Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Earn Rewards for Verifying Truth
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Browse verification tasks posted by organizations. Earn crypto or fiat rewards, NFT badges, and build your reputation as a trusted verifier.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-12">
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{bounties.length}</div>
                  <p className="text-sm text-muted-foreground">Active Bounties</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${bounties.reduce((sum, b) => sum + Number(b.reward_amount), 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Rewards</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">7.5%</div>
                  <p className="text-sm text-muted-foreground">Service Fee</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">100%</div>
                  <p className="text-sm text-muted-foreground">NFT Minting</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Filters and Bounties */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="election">Election</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="climate">Climate</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reward_desc">Highest Reward</SelectItem>
                    <SelectItem value="reward_asc">Lowest Reward</SelectItem>
                    <SelectItem value="expires_soon">Expires Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bounty Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="h-48 bg-muted" />
                  </Card>
                ))}
              </div>
            ) : bounties.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active bounties found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bounties.map((bounty) => (
                  <Card key={bounty.id} className="group hover:shadow-lg transition-all duration-300 card-hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <Badge variant="outline" className={getCategoryColor(bounty.category)}>
                          {bounty.category}
                        </Badge>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {bounty.reward_currency} {Number(bounty.reward_amount).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {bounty.payment_type}
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{bounty.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{bounty.claim_to_verify}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Organization</span>
                          <span className="font-medium">{bounty.organizations?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Min Trust Score</span>
                          <span className="font-medium">{bounty.min_trust_score}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Required Sources</span>
                          <span className="font-medium">{bounty.required_sources}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-orange-500">
                          <Clock className="h-4 w-4" />
                          {getTimeRemaining(bounty.expires_at)}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => handleClaimBounty(bounty.id)}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Claim Bounty
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BountyMarketplace;