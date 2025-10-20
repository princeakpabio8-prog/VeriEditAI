import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const OpenSeaVerification = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const { toast } = useToast();

  const checkBadges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nft_badges')
        .select('*')
        .order('minted_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBadges(data || []);
      
      toast({
        title: "Badges loaded",
        description: `Found ${data?.length || 0} NFT badges`,
      });
    } catch (error: any) {
      toast({
        title: "Error loading badges",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncCollection = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-opensea-collection');
      
      if (error) throw error;
      
      toast({
        title: "Sync complete",
        description: `Updated ${data?.stats?.updated || 0} badges`,
      });
      
      // Reload badges
      await checkBadges();
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenSea Integration Status</CardTitle>
        <CardDescription>Verify your NFT badges are properly listed on OpenSea</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkBadges} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Check Badges
          </Button>
          <Button onClick={syncCollection} disabled={syncing} variant="outline">
            {syncing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Sync OpenSea
          </Button>
        </div>

        {badges.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Recent Badges ({badges.length})</h3>
            {badges.map((badge) => (
              <div key={badge.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Token #{badge.token_id}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {badge.claim_text}
                    </p>
                  </div>
                  {badge.opensea_listed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex gap-2 text-sm">
                  <span>Trust Score: {badge.trust_score}</span>
                  {badge.rarity_tier && (
                    <span className="text-primary">• {badge.rarity_tier}</span>
                  )}
                </div>

                {badge.opensea_url && (
                  <a
                    href={badge.opensea_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View on OpenSea <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {badge.metadata_uri && (
                  <p className="text-xs text-muted-foreground">
                    Image: {badge.metadata_uri.includes('nft-badge-images') ? '✅ Custom AI Image' : '⏳ Default'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
