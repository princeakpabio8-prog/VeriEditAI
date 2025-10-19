import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Award, ExternalLink, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminData } from '@/hooks/useAdminData';

interface RoyaltyEarning {
  id: string;
  token_id: string;
  sale_price: number;
  royalty_amount: number;
  royalty_percentage: number;
  seller_address: string;
  buyer_address: string;
  transaction_hash: string;
  platform: string;
  earned_at: string;
  claimed: boolean;
}

export default function RoyaltyDashboard() {
  const { user } = useAuth();
  const { isAdmin } = useAdminData();
  const [earnings, setEarnings] = useState<RoyaltyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [unclaimedEarnings, setUnclaimedEarnings] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetchRoyaltyData();
    }
  }, [isAdmin]);

  // Real-time subscription for new royalty earnings
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('royalty-earnings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nft_royalty_earnings',
        },
        (payload) => {
          console.log('🎉 New royalty earning:', payload);
          const newEarning = payload.new as RoyaltyEarning;
          
          setEarnings(prev => [newEarning, ...prev]);
          setTotalEarnings(prev => prev + Number(newEarning.royalty_amount));
          if (!newEarning.claimed) {
            setUnclaimedEarnings(prev => prev + Number(newEarning.royalty_amount));
          }
          
          toast.success(`New sale! Earned ${Number(newEarning.royalty_amount).toFixed(4)} MATIC`, {
            description: `Badge #${newEarning.token_id} sold for ${Number(newEarning.sale_price).toFixed(4)} MATIC`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchRoyaltyData = async () => {
    try {
      const { data, error } = await supabase
        .from('nft_royalty_earnings')
        .select('*')
        .order('earned_at', { ascending: false });

      if (error) throw error;

      setEarnings(data || []);
      
      const total = data?.reduce((sum, e) => sum + Number(e.royalty_amount), 0) || 0;
      const unclaimed = data?.filter(e => !e.claimed).reduce((sum, e) => sum + Number(e.royalty_amount), 0) || 0;
      
      setTotalEarnings(total);
      setUnclaimedEarnings(unclaimed);
    } catch (error) {
      console.error('Error fetching royalty data:', error);
      toast.error('Failed to load royalty data');
    } finally {
      setLoading(false);
    }
  };

  const getPolygonScanUrl = (txHash: string) => {
    return `https://polygonscan.com/tx/${txHash}`;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Admin access required to view royalty dashboard
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">NFT Royalty Dashboard</h1>
          <p className="text-muted-foreground">
            Track earnings from secondary badge sales on OpenSea
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {totalEarnings.toFixed(4)} MATIC
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                All-time royalty revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Unclaimed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {unclaimedEarnings.toFixed(4)} MATIC
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Ready to withdraw
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-primary" />
                Sales Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {earnings.length}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Total secondary sales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Royalty Earnings</CardTitle>
            <CardDescription>
              5% royalty on all secondary badge sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No royalty earnings yet</p>
                <p className="text-sm mt-2">
                  Earnings will appear when badges are sold on OpenSea
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          Token #{earning.token_id}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          via {earning.platform}
                        </span>
                        {earning.claimed && (
                          <Badge variant="secondary" className="text-xs">
                            Claimed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(earning.earned_at).toLocaleDateString()}
                        </div>
                        <div>
                          Sale: {earning.sale_price.toFixed(4)} MATIC
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          +{earning.royalty_amount.toFixed(4)} MATIC
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {earning.royalty_percentage}% royalty
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={getPolygonScanUrl(earning.transaction_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Earning Badges */}
        {earnings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Top Earning Badges</CardTitle>
              <CardDescription>
                Badges that generated the most royalty revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(
                  earnings.reduce((acc, e) => {
                    acc[e.token_id] = (acc[e.token_id] || 0) + Number(e.royalty_amount);
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([tokenId, amount]) => (
                    <div
                      key={tokenId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-primary" />
                        <span className="font-medium">Token #{tokenId}</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {amount.toFixed(4)} MATIC
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
