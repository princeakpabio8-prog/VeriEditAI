import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Zap, Database, Activity, TrendingUp, Globe, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';

export function TrustOracleDashboard() {
  const [stats, setStats] = useState({
    totalVerified: 0,
    avgTrustScore: 0,
    activeConnections: 0,
    realtimeVerifications: 0,
    nftsMinted: 0,
    globalRegions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOracleStats();
    const interval = setInterval(fetchOracleStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOracleStats = async () => {
    try {
      // Total verifications
      const { count: totalVerified } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true });

      // Average trust score - use a sampled approach to avoid 1000 row limit
      const { data: avgData } = await supabase
        .from('verifications')
        .select('trust_score')
        .order('created_at', { ascending: false })
        .limit(500);
      
      const avgTrustScore = avgData?.length 
        ? Math.round(avgData.reduce((acc, v) => acc + (v.trust_score || 0), 0) / avgData.length)
        : 0;

      // Active API connections (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: activeConnections } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);

      // Verifications in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: realtimeVerifications } = await supabase
        .from('verifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      // NFTs minted
      const { count: nftsMinted } = await supabase
        .from('nft_badges')
        .select('*', { count: 'exact', head: true });

      // Global regions
      const { data: regions } = await supabase
        .from('sources')
        .select('source_region')
        .not('source_region', 'is', null);
      
      const uniqueRegions = new Set(regions?.map(r => r.source_region)).size;

      setStats({
        totalVerified: totalVerified || 0,
        avgTrustScore,
        activeConnections: activeConnections || 0,
        realtimeVerifications: realtimeVerifications || 0,
        nftsMinted: nftsMinted || 0,
        globalRegions: uniqueRegions
      });
    } catch (error) {
      console.error('Error fetching oracle stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Verified Claims',
      value: stats.totalVerified.toLocaleString(),
      icon: Database,
      gradientClass: 'from-secondary to-secondary',
      textClass: 'text-foreground',
      description: 'On-chain verified'
    },
    {
      title: 'Average Trust Score',
      value: `${stats.avgTrustScore}%`,
      icon: Shield,
      gradientClass: 'from-secondary to-secondary',
      textClass: 'text-foreground',
      description: 'Network consensus'
    },
    {
      title: 'Active API Connections',
      value: stats.activeConnections.toLocaleString(),
      icon: Zap,
      gradientClass: 'from-secondary to-secondary',
      textClass: 'text-foreground',
      description: 'Last 24 hours'
    },
    {
      title: 'Real-time Verifications',
      value: stats.realtimeVerifications.toLocaleString(),
      icon: Activity,
      gradientClass: 'from-secondary to-secondary',
      textClass: 'text-foreground',
      description: 'Last hour'
    },
    {
      title: 'Truth Badges Minted',
      value: stats.nftsMinted.toLocaleString(),
      icon: TrendingUp,
      gradientClass: 'from-secondary to-secondary',
      textClass: 'text-foreground',
      description: 'Polygon network'
    },
    {
      title: 'Global Coverage',
      value: `${stats.globalRegions} Regions`,
      icon: Globe,
      gradientClass: 'from-secondary to-secondary',
      textClass: 'text-foreground',
      description: 'Worldwide sources'
    }
  ];

  const apiEndpoints = [
    {
      endpoint: '/get-trust-level',
      method: 'POST',
      description: 'Query trust data by claim, URL, or ID',
      methodClass: 'bg-secondary text-accent border-border'
    },
    {
      endpoint: '/get-verified-feed',
      method: 'GET',
      description: 'Retrieve latest verified claims feed',
      methodClass: 'bg-secondary text-accent border-border'
    },
    {
      endpoint: '/get-source-integrity',
      method: 'GET',
      description: 'Check domain or organization reliability',
      methodClass: 'bg-secondary text-accent border-border'
    },
    {
      endpoint: '/reference-oracle',
      method: 'POST',
      description: 'Generate AI-ready citation data',
      methodClass: 'bg-secondary text-accent border-border'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="border-b border-border bg-background pt-20">
        <div className="container py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <Database className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                AI Trust Oracle
              </h1>
              <p className="text-muted-foreground mt-1">
                The Truth Infrastructure Layer for the AI Ecosystem
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-trust-high" />
            <span className="text-muted-foreground">Live • Polygon Network • API v1.0</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container py-12 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-24 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index}
                  className="group relative overflow-hidden border-border bg-card hover:border-accent transition-all duration-300"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-secondary`}>
                        <Icon className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${stat.textClass}`}>
                          {stat.value}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {stat.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* API Endpoints */}
        <Card className="mt-12 border-border bg-card">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              API Endpoints
            </h2>
            
            <div className="space-y-4">
              {apiEndpoints.map((api, index) => (
                <div 
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:border-accent transition-colors group gap-3"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded text-sm font-mono border ${api.methodClass}`}>
                      {api.method}
                    </span>
                    <div>
                      <code className="text-sm font-mono text-foreground">{api.endpoint}</code>
                      <p className="text-sm text-muted-foreground mt-1">{api.description}</p>
                    </div>
                  </div>
                  <Zap className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Footer Message */}
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">
            Positioning <span className="font-bold text-foreground">VeriEdit AI</span> as the{' '}
            <span className="text-foreground font-bold">
              Trust Infrastructure Layer
            </span>{' '}
            for the AI ecosystem
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
