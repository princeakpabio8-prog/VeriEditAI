import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, ComposedChart, RadialBarChart, RadialBar } from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, CheckCircle, AlertTriangle, Download, Calendar, Target, Zap, Shield, Globe2, Award, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { verificationAnalytics } from "@/lib/verification-analytics";

interface ExecutiveMetrics {
  totalUsers: number;
  totalRevenue: number;
  avgRevenuePerUser: number;
  userGrowthRate: number;
  retentionRate: number;
  platformUptime: number;
  verificationAccuracy: number;
  customerSatisfaction: number;
}

interface AdvancedAnalytics {
  executiveMetrics: ExecutiveMetrics;
  userSegmentation: Array<{ segment: string; count: number; revenue: number; color: string }>;
  revenueBreakdown: Array<{ month: string; revenue: number; users: number; arpu: number }>;
  performanceKPIs: Array<{ metric: string; value: number; target: number; trend: 'up' | 'down' | 'stable' }>;
  geographicData: Array<{ region: string; users: number; revenue: number }>;
  conversionFunnel: Array<{ stage: string; users: number; rate: number }>;
}

export function EnhancedAnalyticsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAdvancedAnalytics();
    }
  }, [user, dateRange]);

  const fetchAdvancedAnalytics = async () => {
    setLoading(true);
    try {
      // Get real-time metrics from verification analytics
      const realtimeMetrics = verificationAnalytics.getMetrics();
      const performanceInsights = verificationAnalytics.getPerformanceInsights();

      // Simulate advanced analytics data (in real app, this would come from your analytics service)
      const mockAnalytics: AdvancedAnalytics = {
        executiveMetrics: {
          totalUsers: 2847,
          totalRevenue: 45890,
          avgRevenuePerUser: 16.12,
          userGrowthRate: 23.5,
          retentionRate: 87.3,
          platformUptime: 99.97,
          verificationAccuracy: realtimeMetrics.successRate,
          customerSatisfaction: 4.8
        },
        userSegmentation: [
          { segment: "Free Users", count: 1895, revenue: 0, color: "hsl(var(--muted))" },
          { segment: "Pro Users", count: 752, revenue: 28540, color: "hsl(var(--primary))" },
          { segment: "Enterprise", count: 200, revenue: 17350, color: "hsl(var(--accent))" }
        ],
        revenueBreakdown: [
          { month: "Jan", revenue: 35200, users: 2100, arpu: 16.76 },
          { month: "Feb", revenue: 38400, users: 2350, arpu: 16.34 },
          { month: "Mar", revenue: 42100, users: 2580, arpu: 16.32 },
          { month: "Apr", revenue: 45890, users: 2847, arpu: 16.12 }
        ],
        performanceKPIs: [
          { metric: "API Response Time", value: realtimeMetrics.averageProcessingTime, target: 2000, trend: 'up' },
          { metric: "Success Rate", value: realtimeMetrics.successRate, target: 95, trend: 'up' },
          { metric: "Cache Hit Rate", value: 87.2, target: 85, trend: 'up' },
          { metric: "Error Rate", value: 2.1, target: 5, trend: 'down' }
        ],
        geographicData: [
          { region: "North America", users: 1425, revenue: 22890 },
          { region: "Europe", users: 856, revenue: 14230 },
          { region: "Asia Pacific", users: 456, revenue: 7580 },
          { region: "Others", users: 110, revenue: 1190 }
        ],
        conversionFunnel: [
          { stage: "Visitors", users: 12500, rate: 100 },
          { stage: "Sign Ups", users: 3750, rate: 30 },
          { stage: "Trial Users", users: 3125, rate: 83.3 },
          { stage: "Paid Users", users: 952, rate: 30.5 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error fetching advanced analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAdvancedAnalytics();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Analytics data has been updated",
    });
  };

  const exportExecutiveReport = () => {
    if (!analytics) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: dateRange,
      executiveSummary: analytics.executiveMetrics,
      userSegmentation: analytics.userSegmentation,
      revenueBreakdown: analytics.revenueBreakdown,
      performanceKPIs: analytics.performanceKPIs,
      geographicDistribution: analytics.geographicData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `executive-report-${dateRange}-${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Executive Report Exported",
      description: "Report downloaded successfully",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
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
          <h1 className="text-3xl font-bold bg-gradient-trust bg-clip-text text-transparent">
            Executive Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time business intelligence and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={dateRange} onValueChange={setDateRange}>
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <Activity className="h-4 w-4 mr-2" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={exportExecutiveReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-trust-high" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.executiveMetrics.totalRevenue.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-trust-high/10 text-trust-high">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{analytics.executiveMetrics.userGrowthRate}%
                </Badge>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.executiveMetrics.totalUsers.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={analytics.executiveMetrics.retentionRate} className="flex-1" />
                <span className="text-xs text-muted-foreground">{analytics.executiveMetrics.retentionRate}% retention</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARPU</CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.executiveMetrics.avgRevenuePerUser.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Average Revenue Per User</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
              <Shield className="h-4 w-4 text-trust-high" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.executiveMetrics.platformUptime}%</div>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-3 w-3 text-trust-high" />
                <span className="text-xs text-muted-foreground">Uptime</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance KPIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Real-Time Performance KPIs
          </CardTitle>
          <CardDescription>Key performance indicators with targets and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.performanceKPIs.map((kpi, index) => (
              <motion.div
                key={kpi.metric}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{kpi.metric}</span>
                      {kpi.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-trust-high" />
                      ) : kpi.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-trust-low" />
                      ) : (
                        <div className="h-4 w-4 bg-muted rounded-full" />
                      )}
                    </div>
                    <div className="text-xl font-bold mb-1">
                      {kpi.metric.includes('Time') ? `${kpi.value}ms` : 
                       kpi.metric.includes('Rate') ? `${kpi.value}%` : kpi.value}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={kpi.metric.includes('Error') ? 100 - (kpi.value / kpi.target * 100) : (kpi.value / kpi.target * 100)} 
                        className="flex-1" 
                      />
                      <span className="text-xs text-muted-foreground">
                        Target: {kpi.metric.includes('Time') ? `${kpi.target}ms` : 
                                kpi.metric.includes('Rate') ? `${kpi.target}%` : kpi.target}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="users">User Segmentation</TabsTrigger>
          <TabsTrigger value="geography">Geographic</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="business">Business Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-trust-high" />
                Revenue Growth & ARPU Trends
              </CardTitle>
              <CardDescription>Monthly revenue breakdown with user metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.revenueBreakdown}>
                    <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--border))" opacity={0.2} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
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
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value.toLocaleString()}` : 
                        name === 'users' ? value.toLocaleString() : `$${value}`,
                        name === 'revenue' ? 'Revenue' : 
                        name === 'users' ? 'Users' : 'ARPU'
                      ]}
                    />
                    <Bar 
                      yAxisId="left" 
                      dataKey="revenue" 
                      fill="hsl(var(--primary))" 
                      opacity={0.6}
                      radius={[2, 2, 0, 0]}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="arpu" 
                      stroke="hsl(var(--trust-high))" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'hsl(var(--trust-high))' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Segmentation
                </CardTitle>
                <CardDescription>Distribution by user type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.userSegmentation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ segment, count }) => `${segment}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.userSegmentation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value.toLocaleString(), 'Users']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Segment</CardTitle>
                <CardDescription>Revenue contribution by user type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.userSegmentation.map((segment, index) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium">{segment.segment}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${segment.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {segment.count.toLocaleString()} users
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-accent" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Users and revenue by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.geographicData} layout="horizontal">
                    <CartesianGrid strokeDasharray="1 1" stroke="hsl(var(--border))" opacity={0.2} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis 
                      dataKey="region" 
                      type="category" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={120}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value, name) => [
                        name === 'users' ? value.toLocaleString() : `$${value.toLocaleString()}`,
                        name === 'users' ? 'Users' : 'Revenue'
                      ]}
                    />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-trust-medium" />
                Conversion Funnel Analysis
              </CardTitle>
              <CardDescription>User journey from visitor to paid customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.conversionFunnel.map((stage, index) => (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{stage.stage}</span>
                        <Badge variant="secondary">{stage.rate.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={stage.rate} className="flex-1" />
                        <span className="text-sm text-muted-foreground">
                          {stage.users.toLocaleString()} users
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-trust-high" />
                  Customer Satisfaction
                </CardTitle>
                <CardDescription>Overall satisfaction score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="90%" data={[
                      { name: 'Satisfaction', value: analytics.executiveMetrics.customerSatisfaction * 20, fill: 'hsl(var(--trust-high))' }
                    ]}>
                      <RadialBar
                        label={{ position: 'insideStart', fill: '#fff' }}
                        background
                        dataKey="value"
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                        {analytics.executiveMetrics.customerSatisfaction}/5.0
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Health Score</CardTitle>
                <CardDescription>Overall platform performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue Growth</span>
                    <div className="flex items-center gap-2">
                      <Progress value={analytics.executiveMetrics.userGrowthRate * 4} className="w-20" />
                      <span className="text-sm font-medium">{analytics.executiveMetrics.userGrowthRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Retention</span>
                    <div className="flex items-center gap-2">
                      <Progress value={analytics.executiveMetrics.retentionRate} className="w-20" />
                      <span className="text-sm font-medium">{analytics.executiveMetrics.retentionRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Platform Uptime</span>
                    <div className="flex items-center gap-2">
                      <Progress value={analytics.executiveMetrics.platformUptime} className="w-20" />
                      <span className="text-sm font-medium">{analytics.executiveMetrics.platformUptime}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verification Accuracy</span>
                    <div className="flex items-center gap-2">
                      <Progress value={analytics.executiveMetrics.verificationAccuracy} className="w-20" />
                      <span className="text-sm font-medium">{analytics.executiveMetrics.verificationAccuracy}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}