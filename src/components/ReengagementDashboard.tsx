import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Mail, Bell, TrendingUp, Users } from 'lucide-react';

export function ReengagementDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get tracking data
      const { data: tracking } = await supabase
        .from('reengagement_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Calculate metrics
      const campaigns = tracking?.reduce((acc: any, t: any) => {
        if (!acc[t.campaign_type]) {
          acc[t.campaign_type] = {
            sent: 0,
            opened: 0,
            clicked: 0,
            converted: 0,
          };
        }
        acc[t.campaign_type].sent++;
        if (t.opened_at) acc[t.campaign_type].opened++;
        if (t.clicked_at) acc[t.campaign_type].clicked++;
        if (t.converted_at) acc[t.campaign_type].converted++;
        return acc;
      }, {});

      const campaignStats = Object.entries(campaigns || {}).map(([name, data]: any) => ({
        name,
        openRate: ((data.opened / data.sent) * 100).toFixed(1),
        clickRate: ((data.clicked / data.sent) * 100).toFixed(1),
        conversionRate: ((data.converted / data.sent) * 100).toFixed(1),
        sent: data.sent,
      }));

      // Get dormant vs active users
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      const { data: activeUsers } = await supabase
        .from('verifications')
        .select('user_id')
        .not('user_id', 'is', null);

      const activeUserIds = new Set(activeUsers?.map((v: any) => v.user_id) || []);
      const dormantCount = allUsers?.users.filter((u: any) => !activeUserIds.has(u.id)).length || 0;

      setStats({
        campaigns: campaignStats,
        dormantUsers: dormantCount,
        activeUsers: activeUserIds.size,
        totalTracking: tracking?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Re-engagement Analytics</h2>
        <p className="text-muted-foreground">
          Track campaign performance and user reactivation metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dormant Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dormantUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTracking || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.campaigns?.length || 0} campaign types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.campaigns?.length > 0
                ? (
                    stats.campaigns.reduce((sum: number, c: any) => sum + parseFloat(c.openRate), 0) /
                    stats.campaigns.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.campaigns?.length > 0
                ? (
                    stats.campaigns.reduce((sum: number, c: any) => sum + parseFloat(c.conversionRate), 0) /
                    stats.campaigns.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Users who verified</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Email open rates, click-through rates, and conversion rates by campaign type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.campaigns || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="openRate" fill="hsl(var(--primary))" name="Open Rate %" />
              <Bar dataKey="clickRate" fill="hsl(var(--secondary))" name="Click Rate %" />
              <Bar dataKey="conversionRate" fill="hsl(var(--accent))" name="Conversion Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
