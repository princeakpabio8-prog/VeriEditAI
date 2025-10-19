import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const OPENSEA_COLLECTION_URL = 'https://opensea.io/collection/veriedit-truth-badge';
const POLYGON_CHAIN_ID = 137;

interface CollectionStats {
  total_volume: number;
  floor_price: number;
  owners_count: number;
  listed_count: number;
  total_sales: number;
  average_price: number;
}

export function OpenSeaIntegration() {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollectionStats();
  }, []);

  const fetchCollectionStats = async () => {
    try {
      const { data, error } = await supabase
        .from('nft_collection_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching collection stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OpenSea Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://opensea.io/static/images/logos/opensea.svg" 
                alt="OpenSea"
                className="w-6 h-6"
              />
              OpenSea Collection
            </CardTitle>
            <CardDescription>VeriEdit Truth Badge on Polygon</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={OPENSEA_COLLECTION_URL} target="_blank" rel="noopener noreferrer">
              View Collection
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Total Volume</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.total_volume ? `${stats.total_volume.toFixed(2)} MATIC` : '0 MATIC'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>Floor Price</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.floor_price ? `${stats.floor_price.toFixed(2)} MATIC` : '-'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Owners</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.owners_count || 0}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Sales</Badge>
            </div>
            <div className="text-2xl font-bold">
              {stats?.total_sales || 0}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Listed</span>
            <Badge variant="secondary">{stats?.listed_count || 0} badges</Badge>
          </div>
          {stats?.average_price && stats.average_price > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Average Price</span>
              <span className="font-medium">{stats.average_price.toFixed(2)} MATIC</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
