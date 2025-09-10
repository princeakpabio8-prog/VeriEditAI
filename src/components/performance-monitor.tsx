import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceMetrics {
  responseTime: number;
  uptime: number;
  verificationsToday: number;
  successRate: number;
  activeUsers: number;
  errorRate: number;
}

interface PerformanceMonitorProps {
  metrics?: PerformanceMetrics;
  loading?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  metrics,
  loading = false 
}) => {
  const defaultMetrics: PerformanceMetrics = {
    responseTime: 850,
    uptime: 99.9,
    verificationsToday: 1247,
    successRate: 98.5,
    activeUsers: 156,
    errorRate: 1.2
  };

  const data = metrics || defaultMetrics;

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUptimeStatus = () => {
    if (data.uptime >= 99.9) return 'operational';
    if (data.uptime >= 99.0) return 'degraded';
    return 'down';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                System Performance
              </CardTitle>
              <CardDescription>Real-time monitoring dashboard</CardDescription>
            </div>
            <Badge 
              variant={getUptimeStatus() === 'operational' ? 'default' : 'destructive'}
              className="gap-1"
            >
              {getUptimeStatus() === 'operational' ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {getUptimeStatus() === 'operational' ? 'Operational' : 'Issues Detected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Response Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time</span>
                <span className={`text-sm font-mono ${getStatusColor(2000 - data.responseTime, { good: 1500, warning: 500 })}`}>
                  {data.responseTime}ms
                </span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (data.responseTime / 20))} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Average API response time
              </p>
            </div>

            {/* Uptime */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className={`text-sm font-mono ${getStatusColor(data.uptime, { good: 99.5, warning: 99.0 })}`}>
                  {data.uptime.toFixed(1)}%
                </span>
              </div>
              <Progress value={data.uptime} className="h-2" />
              <p className="text-xs text-muted-foreground">
                30-day availability
              </p>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className={`text-sm font-mono ${getStatusColor(data.successRate, { good: 95, warning: 90 })}`}>
                  {data.successRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={data.successRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Successful verifications
              </p>
            </div>

            {/* Active Users */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Users</span>
                <span className="text-sm font-mono text-blue-600">
                  {data.activeUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Online now
                </span>
              </div>
            </div>

            {/* Verifications Today */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verifications</span>
                <span className="text-sm font-mono text-green-600">
                  {data.verificationsToday.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Today
                </span>
              </div>
            </div>

            {/* Error Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className={`text-sm font-mono ${getStatusColor(10 - data.errorRate, { good: 8, warning: 5 })}`}>
                  {data.errorRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.max(0, 100 - (data.errorRate * 10))} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="justify-start gap-2">
          <TrendingUp className="h-4 w-4" />
          View Detailed Analytics
        </Button>
        <Button variant="outline" className="justify-start gap-2">
          <AlertTriangle className="h-4 w-4" />
          Check System Status
        </Button>
        <Button variant="outline" className="justify-start gap-2">
          <CheckCircle className="h-4 w-4" />
          Run Health Check
        </Button>
      </div>
    </div>
  );
};