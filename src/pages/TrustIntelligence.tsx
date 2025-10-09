import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Globe2, TrendingUp, TrendingDown, BarChart3, Map, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTrustIntelligence } from '@/hooks/useTrustIntelligence';
import { useLicense } from '@/contexts/LicenseContext';
import { TrustIntelExport } from '@/components/trust-intel-export';
import { LoadingState } from '@/components/loading-state';
import { format } from 'date-fns';

const TrustIntelligence = () => {
  const { analytics, snapshots, brief, isLoading, currentTrustIndex } = useTrustIntelligence(30);
  const { checkFeatureAccess } = useLicense();

  const hasProAccess = checkFeatureAccess('advanced_analytics');
  const hasEnterpriseAccess = checkFeatureAccess('api_access');

  if (isLoading) {
    return <LoadingState message="Loading Trust Intelligence data..." />;
  }

  // Aggregate data by region for map visualization
  const regionData = analytics.reduce((acc: any[], item) => {
    const existing = acc.find(r => r.region === item.region);
    if (existing) {
      existing.totalScore += item.average_trust_score;
      existing.count += 1;
      existing.avgScore = Math.round(existing.totalScore / existing.count);
    } else {
      acc.push({
        region: item.region,
        totalScore: item.average_trust_score,
        count: 1,
        avgScore: item.average_trust_score
      });
    }
    return acc;
  }, []);

  // Topic credibility data
  const topicData = analytics.reduce((acc: any[], item) => {
    const existing = acc.find(t => t.topic === item.topic);
    if (existing) {
      existing.totalScore += item.average_trust_score;
      existing.count += item.verification_count;
      existing.avgScore = Math.round(existing.totalScore / existing.count);
    } else {
      acc.push({
        topic: item.topic,
        totalScore: item.average_trust_score,
        count: item.verification_count,
        avgScore: item.average_trust_score
      });
    }
    return acc;
  }, []).sort((a, b) => a.avgScore - b.avgScore).slice(0, 10);

  // Top sources
  const sourceData = analytics.reduce((acc: any[], item) => {
    const domain = item.domain || item.source;
    const existing = acc.find(s => s.domain === domain);
    if (existing) {
      existing.totalScore += item.average_trust_score;
      existing.count += item.verification_count;
      existing.avgScore = Math.round(existing.totalScore / existing.count);
    } else {
      acc.push({
        domain,
        totalScore: item.average_trust_score,
        count: item.verification_count,
        avgScore: item.average_trust_score,
        trending: item.trending_direction,
        change: item.week_over_week_change
      });
    }
    return acc;
  }, []).sort((a, b) => b.avgScore - a.avgScore).slice(0, 10);

  const getTrustColor = (score: number) => {
    if (score >= 75) return 'text-trust-high';
    if (score >= 50) return 'text-trust-medium';
    return 'text-trust-low';
  };

  const getTrustBgColor = (score: number) => {
    if (score >= 75) return 'bg-trust-high/10 text-trust-high';
    if (score >= 50) return 'bg-trust-medium/10 text-trust-medium';
    return 'bg-trust-low/10 text-trust-low';
  };

  return (
    <div id="trust-intel-dashboard" className="container mx-auto p-6 space-y-6">
      {/* Hero Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Trust Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time insights into global information credibility and verification trends
          </p>
        </div>
        
        <TrustIntelExport
          analytics={analytics}
          snapshots={snapshots}
          hasProAccess={hasProAccess}
          hasEnterpriseAccess={hasEnterpriseAccess}
        />
      </div>

      {/* Global Trust Index Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Global Trust Index
          </CardTitle>
          <CardDescription>Current worldwide information credibility score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className={`text-6xl font-bold ${getTrustColor(currentTrustIndex)}`}>
                {currentTrustIndex.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Out of 100 • Updated {snapshots[0] ? format(new Date(snapshots[0].snapshot_date), 'MMM d, yyyy') : 'today'}
              </p>
            </div>

            {snapshots[0] && (
              <div className="flex-1 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">High Credibility</span>
                  <span className="font-semibold">{snapshots[0].high_credibility_percentage?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Verifications</span>
                  <span className="font-semibold">{snapshots[0].total_verifications.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Brief */}
          {brief && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Weekly Trust Brief
              </h4>
              <p className="text-sm text-muted-foreground">{brief.brief_content}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Trust Index Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Trust Index Timeline</CardTitle>
              <CardDescription>Historical global trust score over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={snapshots.slice().reverse()}>
                  <defs>
                    <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis 
                    dataKey="snapshot_date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="global_trust_index" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#trustGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Misinformation Alerts */}
          {snapshots[0]?.misinformation_spike_regions && snapshots[0].misinformation_spike_regions.length > 0 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Misinformation Spike Alerts
                </CardTitle>
                <CardDescription>Regions experiencing below-average trust scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {snapshots[0].misinformation_spike_regions.map((region) => (
                    <Badge key={region} variant="destructive">
                      {region}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Trust Scores by Region
              </CardTitle>
              <CardDescription>Geographic distribution of information credibility</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Topics with Declining Credibility</CardTitle>
              <CardDescription>Content categories trending low on trust scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topicData.map((topic, index) => (
                  <div key={topic.topic} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{topic.topic}</p>
                        <p className="text-sm text-muted-foreground">{topic.count.toLocaleString()} verifications</p>
                      </div>
                    </div>
                    <Badge className={getTrustBgColor(topic.avgScore)}>
                      {topic.avgScore}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5" />
                Source Credibility Ranking
              </CardTitle>
              <CardDescription>Top domains by verification trust scores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Verifications</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourceData.map((source, index) => (
                    <TableRow key={source.domain}>
                      <TableCell className="font-bold">#{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 text-muted-foreground" />
                          {source.domain}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTrustBgColor(source.avgScore)}>
                          {source.avgScore}
                        </Badge>
                      </TableCell>
                      <TableCell>{source.count.toLocaleString()}</TableCell>
                      <TableCell>
                        {source.trending === 'up' ? (
                          <Badge className="bg-trust-high/10 text-trust-high border-trust-high/20">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{source.change?.toFixed(1)}%
                          </Badge>
                        ) : source.trending === 'down' ? (
                          <Badge className="bg-trust-low/10 text-trust-low border-trust-low/20">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {source.change?.toFixed(1)}%
                          </Badge>
                        ) : (
                          <Badge variant="outline">Stable</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Access Tier Notice */}
      {!hasProAccess && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Unlock Full Trust Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro for advanced filtering, CSV exports, and 90-day historical data
                </p>
              </div>
              <Button>Upgrade to Pro</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrustIntelligence;