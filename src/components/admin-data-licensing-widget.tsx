import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Activity, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AdminDataLicensingWidget() {
  const [revenueStats, setRevenueStats] = useState<any[]>([]);
  const [apiStats, setApiStats] = useState<any[]>([]);
  const [popularEndpoints, setPopularEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminStats() {
      try {
        const [revenueRes, apiRes, endpointsRes] = await Promise.all([
          supabase.from('admin_revenue_stats').select('*').limit(6),
          supabase.from('admin_api_usage_stats').select('*').order('total_requests', { ascending: false }).limit(10),
          supabase.from('admin_popular_analytics').select('*').limit(5)
        ]);

        if (!revenueRes.error) setRevenueStats(revenueRes.data || []);
        if (!apiRes.error) setApiStats(apiRes.data || []);
        if (!endpointsRes.error) setPopularEndpoints(endpointsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminStats();
  }, []);

  const totalRevenue = revenueStats.reduce((sum, stat) => sum + (parseFloat(stat.total_revenue) || 0), 0);
  const totalApiRequests = apiStats.reduce((sum, stat) => sum + (stat.total_requests || 0), 0);
  const activeApiKeys = apiStats.filter(stat => stat.total_requests > 0).length;

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-32 bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApiRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total across all keys</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApiKeys}</div>
            <p className="text-xs text-muted-foreground">With at least 1 request</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Revenue/Customer</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activeApiKeys > 0 ? (totalRevenue / activeApiKeys).toFixed(0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per active customer</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top API Customers</CardTitle>
            <CardDescription>By total requests (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apiStats.slice(0, 5).map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{stat.api_key_name || 'Unnamed Key'}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.successful_requests} successful • {stat.failed_requests} failed
                    </p>
                  </div>
                  <Badge variant="outline">{stat.total_requests.toLocaleString()}</Badge>
                </div>
              ))}
              {apiStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No API usage yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Requested Endpoints</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularEndpoints.map((endpoint, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.endpoint}
                    </code>
                    <Badge variant="outline">{endpoint.request_count.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Avg: {endpoint.avg_response_time_ms?.toFixed(0) || 0}ms</span>
                    <span className="text-green-600">{endpoint.success_count} ✓</span>
                    <span className="text-red-600">{endpoint.error_count} ✗</span>
                  </div>
                </div>
              ))}
              {popularEndpoints.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No endpoint data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Breakdown</CardTitle>
          <CardDescription>By plan type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {revenueStats.map((stat, idx) => {
              const month = new Date(stat.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{month}</span>
                    <Badge variant="outline">{stat.plan}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${parseFloat(stat.total_revenue).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stat.payment_count} payments</p>
                  </div>
                </div>
              );
            })}
            {revenueStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No revenue data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}