import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, TrendingUp, Zap, Database, Gauge, RefreshCw } from 'lucide-react';
import { verificationCache } from '@/lib/verification-cache';
import { enhancedVerificationCache } from '@/lib/enhanced-verification-cache';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';

interface PerformanceMetrics {
  avgResponseTime: number;
  successRate: number;
  totalVerifications: number;
  cacheHitRate: number;
  systemHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  lastUpdate: Date;
}

interface CacheMetrics {
  size: number;
  hitRate: number;
  health: string;
  oldestEntry: Date | null;
}

export function PerformanceDashboard() {
  const { metrics: realTimeMetrics, refreshMetrics: refreshRealTimeMetrics } = usePerformanceMetrics();
  
  const [cacheMetrics, setCacheMetrics] = useState<{
    basic: CacheMetrics;
    enhanced: CacheMetrics;
  }>({
    basic: { size: 0, hitRate: 0, health: 'Good', oldestEntry: null },
    enhanced: { size: 0, hitRate: 0, health: 'Good', oldestEntry: null }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    try {
      // Get cache statistics
      const basicStats = verificationCache.getStats();
      const enhancedStats = enhancedVerificationCache.getStats();

      setCacheMetrics({
        basic: {
          size: basicStats.size,
          hitRate: basicStats.hitRate,
          health: basicStats.cacheHealth,
          oldestEntry: basicStats.oldestTimestamp ? new Date(basicStats.oldestTimestamp) : null
        },
        enhanced: {
          size: enhancedStats.totalEntries,
          hitRate: Math.round(enhancedStats.averageConfidence),
          health: 'Good',
          oldestEntry: null
        }
      });

      // Refresh real-time metrics
      refreshRealTimeMetrics();

    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshRealTimeMetrics]);

  const getSystemHealth = (responseTime: number, successRate: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' => {
    if (responseTime < 1000 && successRate > 95) return 'Excellent';
    if (responseTime < 1500 && successRate > 90) return 'Good';
    if (responseTime < 2000 && successRate > 80) return 'Fair';
    return 'Poor';
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Fair': return 'text-yellow-600';
      case 'Poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'Excellent': return 'default';
      case 'Good': return 'secondary';
      case 'Fair': return 'outline';
      case 'Poor': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of verification system performance
          </p>
        </div>
        <Button 
          onClick={refreshMetrics} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={getHealthBadgeVariant(realTimeMetrics.systemHealth)}>
                {realTimeMetrics.systemHealth}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time system monitoring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(realTimeMetrics.responseTime)}ms</div>
            <Progress 
              value={Math.max(0, 100 - (realTimeMetrics.responseTime / 30))} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tavily API response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(realTimeMetrics.successRate)}%</div>
            <Progress value={realTimeMetrics.successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Real verification success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics.totalVerifications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time count
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="cache" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="system">System Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Basic Cache
                </CardTitle>
                <CardDescription>
                  Standard verification cache (24-hour TTL)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cache Size</span>
                  <span className="font-medium">{cacheMetrics.basic.size} entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hit Rate</span>
                  <span className="font-medium">{cacheMetrics.basic.hitRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Health</span>
                  <Badge variant="secondary">{cacheMetrics.basic.health}</Badge>
                </div>
                {cacheMetrics.basic.oldestEntry && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Oldest Entry</span>
                    <span className="text-sm">{cacheMetrics.basic.oldestEntry.toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Enhanced Cache
                </CardTitle>
                <CardDescription>
                  Advanced verification cache with similarity matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cache Size</span>
                  <span className="font-medium">{cacheMetrics.enhanced.size} entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Confidence</span>
                  <span className="font-medium">{cacheMetrics.enhanced.hitRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Health</span>
                  <Badge variant="secondary">{cacheMetrics.enhanced.health}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Current system status and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Performance</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Response Time</span>
                      <span>{Math.round(realTimeMetrics.responseTime)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span>{Math.round(realTimeMetrics.successRate)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cache Hit Rate</span>
                      <span>{Math.round(realTimeMetrics.cacheHitRate)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">System Status</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Health Status</span>
                      <span className={getHealthColor(realTimeMetrics.systemHealth)}>
                        {realTimeMetrics.systemHealth}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span>{new Date(realTimeMetrics.lastUpdated).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Integration</span>
                      <Badge variant={realTimeMetrics.tavilyApiHealth === 'Healthy' ? 'secondary' : 'destructive'}>
                        Tavily API ({realTimeMetrics.tavilyApiHealth})
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}