import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OpenSeaIntegration } from '@/components/nft/OpenSeaIntegration';
import { CollectionStats } from '@/components/nft/CollectionStats';
import { ExternalLink, TrendingUp, Award, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useNFTImage } from '@/hooks/useNFTImage';
import badgeImage from '@/assets/truth-badge.png';

interface NFTBadge {
  id: string;
  token_id: string;
  trust_score: number;
  claim_text: string;
  minted_at: string;
  wallet_address: string;
  opensea_listed: boolean;
  opensea_url?: string;
  current_listing_price?: number;
  last_sale_price?: number;
  metadata_uri: string;
}

interface Listing {
  id: string;
  token_id: string;
  listing_price: number;
  seller_address: string;
  listing_url?: string;
  created_at: string;
}

export default function NFTMarketplace() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<NFTBadge[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      // Fetch all minted badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('nft_badges')
        .select('*')
        .order('minted_at', { ascending: false });

      if (badgesError) throw badgesError;

      // Fetch active listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('nft_marketplace_listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      setBadges(badgesData || []);
      setListings(listingsData || []);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast.error('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const getTrustScoreTier = (score: number): string => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const getTrustScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.claim_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         badge.token_id.includes(searchQuery);
    const matchesTier = filterTier === 'all' || getTrustScoreTier(badge.trust_score) === filterTier;
    return matchesSearch && matchesTier;
  });

  const getOpenSeaUrl = (tokenId: string) => {
    const CONTRACT_ADDRESS = '0xYourContractAddress'; // Replace with actual contract address
    return `https://opensea.io/assets/matic/${CONTRACT_ADDRESS}/${tokenId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">NFT Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and trade VeriEdit Truth Badges on OpenSea
          </p>
        </div>

        {/* Collection Stats */}
        <div className="mb-8 space-y-6">
          <CollectionStats />
          <OpenSeaIntegration />
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by claim text or token ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterTier === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTier('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterTier === 'high' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTier('high')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  High Trust
                </Button>
                <Button
                  variant={filterTier === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTier('medium')}
                >
                  Medium
                </Button>
                <Button
                  variant={filterTier === 'low' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTier('low')}
                >
                  Low
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Badges ({filteredBadges.length})</TabsTrigger>
            <TabsTrigger value="listed">
              Listed ({badges.filter(b => b.opensea_listed).length})
            </TabsTrigger>
            <TabsTrigger value="recent">Recent Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredBadges.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Award className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No badges found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBadges.map((badge) => <BadgeMarketCard key={badge.id} badge={badge} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="listed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.filter(b => b.opensea_listed).map((badge) => <BadgeMarketCard key={badge.id} badge={badge} showPrice />)}
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Latest badge transactions on OpenSea</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  No recent sales data available yet
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function BadgeMarketCard({ badge, showPrice }: { badge: NFTBadge; showPrice?: boolean }) {
  const { imageUrl, loading } = useNFTImage(badge.metadata_uri, badge.id);
  const displayImage = imageUrl || badgeImage;
  
  const getTrustScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getOpenSeaUrl = (tokenId: string) => {
    return `https://opensea.io/assets/matic/0x66911176b4eC70086C50b3155b04dEe433652673/${tokenId}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gradient-to-br from-primary/10 to-purple-600/10 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 blur-xl" />
            <img 
              src={displayImage} 
              alt={`Badge #${badge.token_id}`}
              className="relative w-full h-full object-contain p-6"
            />
          </>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Token #{badge.token_id}</CardTitle>
              {badge.opensea_listed && (
                <Badge variant="secondary" className="text-xs">Listed</Badge>
              )}
            </div>
            <Badge className={getTrustScoreColor(badge.trust_score)}>
              {badge.trust_score}% Trust Score
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {badge.claim_text}
        </p>

        <div className="space-y-2 text-sm">
          {showPrice && badge.opensea_listed && badge.current_listing_price && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Listed Price</span>
              <span className="font-bold text-green-600">
                {badge.current_listing_price} MATIC
              </span>
            </div>
          )}
          {badge.last_sale_price && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Sale</span>
              <span className="font-medium">
                {badge.last_sale_price} MATIC
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Minted</span>
            <span className="font-medium">
              {new Date(badge.minted_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" asChild>
            <a 
              href={badge.opensea_url || getOpenSeaUrl(badge.token_id)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on OpenSea
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
