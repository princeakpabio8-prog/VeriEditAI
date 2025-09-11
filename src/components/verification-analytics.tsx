import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ComposedChart } from "recharts";
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertTriangle, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface AnalyticsData {
  totalVerifications: number;
  avgTrustScore: number;
  verificationTrend: Array<{ date: string; count: number; avgScore: number }>;
  trustScoreDistribution: Array<{ range: string; count: number; color: string }>;
  statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  processingTimeStats: { avg: number; min: number; max: number };
}

const COLORS = {
  high: '#22c55e',
  medium: '#f59e0b', 
  low: '#ef4444',
  pending: '#6b7280'
};

export function VerificationAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate date filter
      const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch verifications
      const { data: verifications, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process analytics data
      const processedData = processAnalyticsData(verifications || []);
      setAnalytics(processedData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (verifications: any[]): AnalyticsData => {
    const totalVerifications = verifications.length;
    const completedVerifications = verifications.filter(v => v.status === 'completed');
    
    // Average trust score
    const avgTrustScore = completedVerifications.length > 0
      ? Math.round(completedVerifications.reduce((sum, v) => sum + (v.trust_score || 0), 0) / completedVerifications.length)
      : 0;

    // Verification trend (daily)
    const trendMap = new Map();
    verifications.forEach(v => {
      const date = new Date(v.created_at).toISOString().split('T')[0];
      if (!trendMap.has(date)) {
        trendMap.set(date, { verifications: [], count: 0 });
      }
      const day = trendMap.get(date);
      day.verifications.push(v);
      day.count++;
    });

    const verificationTrend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgScore: data.verifications.filter(v => v.trust_score).length > 0
          ? Math.round(data.verifications.reduce((sum: number, v: any) => sum + (v.trust_score || 0), 0) / data.verifications.filter(v => v.trust_score).length)
          : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Trust score distribution
    const scoreRanges = [
      { range: '80-100%', min: 80, max: 100, color: COLORS.high },
      { range: '60-79%', min: 60, max: 79, color: COLORS.medium },
      { range: '40-59%', min: 40, max: 59, color: '#f97316' },
      { range: '0-39%', min: 0, max: 39, color: COLORS.low }
    ];

    const trustScoreDistribution = scoreRanges.map(range => ({
      range: range.range,
      count: completedVerifications.filter(v => 
        v.trust_score >= range.min && v.trust_score <= range.max
      ).length,
      color: range.color
    }));

    // Status breakdown
    const statusCounts = verifications.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: count as number,
      percentage: Math.round(((count as number) / totalVerifications) * 100)
    }));

    // Processing time stats
    const processingTimes = completedVerifications
      .filter(v => v.processing_time_ms)
      .map(v => v.processing_time_ms);
    
    const processingTimeStats = processingTimes.length > 0 ? {
      avg: Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length),
      min: Math.min(...processingTimes),
      max: Math.max(...processingTimes)
    } : { avg: 0, min: 0, max: 0 };

    return {
      totalVerifications,
      avgTrustScore,
      verificationTrend,
      trustScoreDistribution,
      statusBreakdown,
      processingTimeStats
    };
  };

  const exportAnalytics = () => {
    if (!analytics) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Verifications', analytics.totalVerifications],
      ['Average Trust Score', `${analytics.avgTrustScore}%`],
      ['Average Processing Time', `${analytics.processingTimeStats.avg}ms`],
      ['', ''],
      ['Trust Score Distribution', ''],
      ...analytics.trustScoreDistribution.map(item => [item.range, item.count]),
      ['', ''],
      ['Status Breakdown', ''],
      ...analytics.statusBreakdown.map(item => [item.status, `${item.count} (${item.percentage}%)`])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `verification-analytics-${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Analytics data exported successfully",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Verification Analytics</h2>
          <p className="text-muted-foreground">Insights and trends from your verification history</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalVerifications}</div>
              <p className="text-xs text-muted-foreground">Last {dateRange}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Trust Score</CardTitle>
              {analytics.avgTrustScore >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgTrustScore}%</div>
              <Progress value={analytics.avgTrustScore} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.processingTimeStats.avg}ms</div>
              <p className="text-xs text-muted-foreground">
                Range: {analytics.processingTimeStats.min}-{analytics.processingTimeStats.max}ms
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((analytics.statusBreakdown.find(s => s.status === 'Completed')?.percentage || 0))}%
              </div>
              <p className="text-xs text-muted-foreground">Completed verifications</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">Verification Trend</TabsTrigger>
          <TabsTrigger value="distribution">Trust Score Distribution</TabsTrigger>
          <TabsTrigger value="status">Status Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-trust-high" />
                Verification Trend
              </CardTitle>
              <CardDescription>Daily verification count and average trust scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.verificationTrend} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--border))" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value, name) => [
                        name === 'count' ? `${value}` : `${value}%`,
                        name === 'count' ? 'Verifications' : 'Trust Score'
                      ]}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      opacity={0.6}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="avgScore" 
                      stroke="hsl(var(--trust-high))" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ 
                        r: 4, 
                        fill: 'hsl(var(--trust-high))',
                        stroke: 'hsl(var(--background))',
                        strokeWidth: 2
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Trust Score Distribution</CardTitle>
              <CardDescription>How your verifications score across different trust ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.trustScoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, count }) => `${range}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.trustScoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>Distribution of verification statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.statusBreakdown.map((status, index) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {status.status === 'Completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {status.status === 'Pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {status.status === 'Failed' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      <span className="text-sm font-medium">{status.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{status.count}</Badge>
                      <span className="text-sm text-muted-foreground">{status.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}