import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { format, subDays } from "date-fns";

export function ApiUsageDashboard() {
  const { user } = useAuth();

  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: usageStats } = useQuery({
    queryKey: ['api-usage-stats', user?.id],
    queryFn: async () => {
      if (!user?.id || !apiKeys?.length) return null;
      
      const keyHashes = apiKeys.map(k => k.key_hash);
      const last7Days = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .in('api_key_hash', keyHashes)
        .gte('created_at', last7Days);
      
      if (error) throw error;
      
      const totalRequests = data?.length || 0;
      const successfulRequests = data?.filter(log => log.status_code < 400).length || 0;
      const errorRequests = data?.filter(log => log.status_code >= 400).length || 0;
      
      // Group by endpoint
      const endpointStats = data?.reduce((acc, log) => {
        const endpoint = log.endpoint || 'unknown';
        if (!acc[endpoint]) {
          acc[endpoint] = { count: 0, errors: 0 };
        }
        acc[endpoint].count++;
        if (log.status_code >= 400) {
          acc[endpoint].errors++;
        }
        return acc;
      }, {} as Record<string, { count: number; errors: number }>);
      
      return {
        totalRequests,
        successfulRequests,
        errorRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        endpointStats,
        last7Days: data || [],
      };
    },
    enabled: !!user?.id && !!apiKeys?.length,
  });

  // Rate limit (example: 100/day for free tier)
  const dailyLimit = 100;
  const todayUsage = usageStats?.last7Days?.filter(log => {
    const logDate = new Date(log.created_at);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length || 0;
  
  const usagePercent = (todayUsage / dailyLimit) * 100;

  if (!apiKeys?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No API Keys Found</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Generate an API key to start tracking your usage
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Requests (7d)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.totalRequests || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Success Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats?.successRate.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Errors (7d)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{usageStats?.errorRequests || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active Keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Rate Limit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Today's Usage</CardTitle>
            <Badge variant={usagePercent > 80 ? "destructive" : "outline"}>
              {todayUsage} / {dailyLimit}
            </Badge>
          </div>
          <CardDescription>
            Daily API request quota ({format(new Date(), 'MMM d, yyyy')})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={usagePercent} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {dailyLimit - todayUsage} requests remaining today
          </p>
        </CardContent>
      </Card>

      {/* Endpoint Usage */}
      {usageStats?.endpointStats && Object.keys(usageStats.endpointStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endpoint Usage (Last 7 Days)</CardTitle>
            <CardDescription>Breakdown by API endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(usageStats.endpointStats)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([endpoint, stats]) => (
                  <div key={endpoint} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <code className="text-sm font-mono">{endpoint}</code>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {stats.count} requests
                        </span>
                        {stats.errors > 0 && (
                          <span className="text-xs text-destructive">
                            {stats.errors} errors
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{stats.count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active API Keys</CardTitle>
          <CardDescription>Manage your keys in the API Keys tab</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <code className="text-sm font-mono">{key.key_preview}</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    {key.name || 'Unnamed key'} • Created {format(new Date(key.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
