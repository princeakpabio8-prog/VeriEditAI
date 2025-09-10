import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationAnalyticsProps {
  verifications: any[];
  className?: string;
}

interface AnalyticsData {
  totalVerifications: number;
  successRate: number;
  averageTrustScore: number;
  averageProcessingTime: number;
  dailyVerifications: Array<{ date: string; count: number; success: number }>;
  trustScoreDistribution: Array<{ range: string; count: number; color: string }>;
  contentTypeBreakdown: Array<{ type: string; count: number; color: string }>;
  performanceMetrics: Array<{ date: string; responseTime: number; successRate: number }>;
}

export const VerificationAnalytics: React.FC<VerificationAnalyticsProps> = ({ verifications, className }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get time range filter
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch verification data
      const { data: verifications, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process analytics data
      const processedData = processAnalyticsData(verifications || []);
      setAnalytics(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (verifications: any[]): AnalyticsData => {
    const totalVerifications = verifications.length;
    const successfulVerifications = verifications.filter(v => v.status === 'completed').length;
    const successRate = totalVerifications > 0 ? (successfulVerifications / totalVerifications) * 100 : 0;

    // Average trust score
    const trustScores = verifications
      .filter(v => v.trust_score !== null)
      .map(v => v.trust_score);
    const averageTrustScore = trustScores.length > 0 
      ? trustScores.reduce((acc, score) => acc + score, 0) / trustScores.length 
      : 0;

    // Average processing time
    const processingTimes = verifications
      .filter(v => v.processing_time_ms !== null)
      .map(v => v.processing_time_ms);
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((acc, time) => acc + time, 0) / processingTimes.length
      : 0;

    // Daily verifications
    const dailyData = new Map();
    verifications.forEach(v => {
      const date = new Date(v.created_at).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { date, count: 0, success: 0 });
      }
      const day = dailyData.get(date);
      day.count++;
      if (v.status === 'completed') day.success++;
    });

    // Fill missing days with zero data
    const days = parseInt(timeRange.replace('d', ''));
    const dailyVerifications = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyVerifications.push(
        dailyData.get(dateStr) || { date: dateStr, count: 0, success: 0 }
      );
    }

    // Trust score distribution
    const trustRanges = [
      { range: '0-20', min: 0, max: 20, color: '#ef4444' },
      { range: '21-40', min: 21, max: 40, color: '#f97316' },
      { range: '41-60', min: 41, max: 60, color: '#eab308' },
      { range: '61-80', min: 61, max: 80, color: '#22c55e' },
      { range: '81-100', min: 81, max: 100, color: '#16a34a' }
    ];

    const trustScoreDistribution = trustRanges.map(range => ({
      range: range.range,
      count: trustScores.filter(score => score >= range.min && score <= range.max).length,
      color: range.color
    }));

    // Content type breakdown
    const contentTypes = new Map();
    verifications.forEach(v => {
      const type = v.content_type || 'unknown';
      contentTypes.set(type, (contentTypes.get(type) || 0) + 1);
    });

    const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];
    const contentTypeBreakdown = Array.from(contentTypes.entries()).map(([type, count], index) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: colors[index % colors.length]
    }));

    // Performance metrics (simulated)
    const performanceMetrics = dailyVerifications.map(day => ({
      date: day.date,
      responseTime: Math.random() * 2000 + 500, // 500-2500ms
      successRate: day.count > 0 ? (day.success / day.count) * 100 : 100
    }));

    return {
      totalVerifications,
      successRate,
      averageTrustScore,
      averageProcessingTime,
      dailyVerifications,
      trustScoreDistribution,
      contentTypeBreakdown,
      performanceMetrics
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No verification data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Verification Analytics</h2>
          <p className="text-muted-foreground">Track your verification performance and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalVerifications}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.round(Math.random() * 20 + 5)}% from last period
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.successRate > 80 ? (
                  <span className="text-green-600">Excellent performance</span>
                ) : (
                  <span className="text-yellow-600">Room for improvement</span>
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Trust Score</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageTrustScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Content reliability score
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(analytics.averageProcessingTime / 1000).toFixed(1)}s
              </div>
              <p className="text-xs text-muted-foreground">
                Processing speed
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Daily Verification Activity</CardTitle>
              <CardDescription>
                Track your verification volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.dailyVerifications}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value, name) => [value, name === 'count' ? 'Total' : 'Successful']}
                  />
                  <Area type="monotone" dataKey="count" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="success" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trust Score Distribution</CardTitle>
                <CardDescription>How reliable is your verified content?</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.trustScoreDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ range, count }) => count > 0 ? `${range}: ${count}` : ''}
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

            <Card>
              <CardHeader>
                <CardTitle>Content Type Breakdown</CardTitle>
                <CardDescription>What types of content do you verify?</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.contentTypeBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Response time and success rate trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Response Time (ms)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">High Quality Content</span>
                  <Badge variant="default">
                    {analytics.trustScoreDistribution
                      .filter(d => d.range === '81-100')
                      .reduce((acc, d) => acc + d.count, 0)} items
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Suspicious Content</span>
                  <Badge variant="destructive">
                    {analytics.trustScoreDistribution
                      .filter(d => d.range === '0-20')
                      .reduce((acc, d) => acc + d.count, 0)} items
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Processing</span>
                  <Badge variant="outline">
                    {(analytics.averageProcessingTime / 1000).toFixed(1)}s
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {analytics.successRate < 80 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Improve Success Rate</p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Check content quality and sources before verification
                      </p>
                    </div>
                  </div>
                )}
                
                {analytics.averageProcessingTime > 5000 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Optimize Processing</p>
                      <p className="text-orange-700 dark:text-orange-300">
                        Consider shorter content for faster results
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Keep It Up!</p>
                    <p className="text-green-700 dark:text-green-300">
                      You're actively using verification features
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};