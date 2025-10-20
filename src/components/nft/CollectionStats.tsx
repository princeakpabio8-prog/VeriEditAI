import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Users, ShoppingCart } from 'lucide-react';

interface Stats {
  totalVolume: number;
  floorPrice: number;
  avgPrice: number;
  totalSales: number;
  totalListings: number;
  owners: number;
}

export function CollectionStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [maticPrice, setMaticPrice] = useState(0.55); // Default MATIC price in USD

  useEffect(() => {
    fetchStats();
    fetchMaticPrice();
    
    // Refresh stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMaticPrice = async () => {
    try {
      // Fetch current MATIC price from CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd'
      );
      const data = await response.json();
      if (data['matic-network']?.usd) {
        setMaticPrice(data['matic-network'].usd);
      }
    } catch (error) {
      console.error('Error fetching MATIC price:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Get active listings
      const { data: listings, error: listingsError } = await supabase
        .from('nft_marketplace_listings')
        .select('listing_price')
        .eq('is_active', true);

      if (listingsError) throw listingsError;

      // Get all badges for owner count
      const { data: badges, error: badgesError } = await supabase
        .from('nft_badges')
        .select('user_id, wallet_address');

      if (badgesError) throw badgesError;

      // Calculate stats
      const totalListings = listings?.length || 0;
      const prices = listings?.map(l => l.listing_price) || [];
      const floorPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const avgPrice = prices.length > 0 
        ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
        : 0;

      // Unique owners
      const uniqueOwners = new Set(badges?.map(b => b.wallet_address).filter(Boolean));

      // For total volume and sales, we'd need a sales history table
      // For now, showing collection stats from nft_collection_stats table
      const { data: collectionData } = await supabase
        .from('nft_collection_stats')
        .select('*')
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({
        totalVolume: collectionData?.total_volume || 0,
        floorPrice,
        avgPrice,
        totalSales: collectionData?.total_sales || 0,
        totalListings,
        owners: uniqueOwners.size
      });
    } catch (error) {
      console.error('Error fetching collection stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-1" />
              <div className="h-3 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Volume',
      value: `${stats.totalVolume.toFixed(2)} MATIC`,
      subValue: `$${(stats.totalVolume * maticPrice).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: 'Floor Price',
      value: `${stats.floorPrice.toFixed(2)} MATIC`,
      subValue: `$${(stats.floorPrice * maticPrice).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-500'
    },
    {
      title: 'Avg. Price',
      value: `${stats.avgPrice.toFixed(2)} MATIC`,
      subValue: `$${(stats.avgPrice * maticPrice).toFixed(2)}`,
      icon: ShoppingCart,
      color: 'text-purple-500'
    },
    {
      title: 'Owners / Sales',
      value: `${stats.owners}`,
      subValue: `${stats.totalSales} sales`,
      icon: Users,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}