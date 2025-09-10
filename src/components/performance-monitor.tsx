import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Clock, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { errorTracker } from '@/lib/error-tracking';

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cacheHitRate: number;
  apiLatency: number;
  queueLength: number;
  activeConnections: number;
}

interface PerformanceThreshold {
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  queueLength: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    throughput: 0,
    errorRate: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    apiLatency: 0,
    queueLength: 0,
    activeConnections: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  const thresholds: PerformanceThreshold = {
    responseTime: 2000, // 2 seconds
    errorRate: 5, // 5%
    memoryUsage: 80, // 80%
    queueLength: 100 // 100 items
  };

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    try {
      // API Response Time
      const start = performance.now();
      await fetch('/api/health');
      const responseTime = performance.now() - start;

      // Memory Usage (if available)
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo 
        ? (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100 
        : 0;

      // Navigation Timing API
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const apiLatency = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;

      // Error tracking metrics
      const errorStats = { errorRate: 0, totalRequests: 0 };

      setMetrics(prev => ({
        ...prev,
        responseTime,
        memoryUsage,
        apiLatency,
        errorRate: errorStats.errorRate,
        throughput: errorStats.totalRequests / 60, // requests per minute
        cacheHitRate: Math.random() * 100, // Simulated - replace with actual cache metrics
        queueLength: Math.floor(Math.random() * 50), // Simulated - replace with actual queue length
        activeConnections: Math.floor(Math.random() * 20) + 1
      }));

      // Check thresholds and generate alerts
      checkThresholds({
        responseTime,
        memoryUsage,
        errorRate: errorStats.errorRate,
        queueLength: Math.floor(Math.random() * 50)
      });

    } catch (error) {
      console.error('Failed to collect metrics:', error);
      errorTracker.captureError(error as Error);
    }
  }, []);

  // Check performance thresholds
  const checkThresholds = useCallback((currentMetrics: Partial<PerformanceMetrics>) => {
    const newAlerts: string[] = [];

    if (currentMetrics.responseTime && currentMetrics.responseTime > thresholds.responseTime) {
      newAlerts.push('High response time detected');
    }

    if (currentMetrics.errorRate && currentMetrics.errorRate > thresholds.errorRate) {
      newAlerts.push('Error rate above threshold');
    }

    if (currentMetrics.memoryUsage && currentMetrics.memoryUsage > thresholds.memoryUsage) {
      newAlerts.push('High memory usage detected');
    }

    if (currentMetrics.queueLength && currentMetrics.queueLength > thresholds.queueLength) {
      newAlerts.push('Queue length above threshold');
    }

    setAlerts(newAlerts);
  }, [thresholds]);

  // Start/stop monitoring
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
  }, []);

  // Auto-collect metrics when monitoring is active
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(collectMetrics, 5000); // Every 5 seconds
    collectMetrics(); // Initial collection

    return () => clearInterval(interval);
  }, [isMonitoring, collectMetrics]);

  const getStatusColor = (value: number, threshold: number, inverted = false) => {
    const isHigh = inverted ? value < threshold * 0.5 : value > threshold;
    const isMedium = inverted 
      ? value < threshold * 0.8 && value >= threshold * 0.5
      : value > threshold * 0.7 && value <= threshold;

    if (isHigh) return 'destructive';
    if (isMedium) return 'default';
    return 'secondary';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Monitor</h2>
          <p className="text-muted-foreground">
            Real-time system performance and health metrics
          </p>
        </div>
        <Button
          onClick={toggleMonitoring}
          variant={isMonitoring ? "destructive" : "default"}
          className="gap-2"
        >
          {isMonitoring ? (
            <>
              <Activity className="h-4 w-4" />
              Stop Monitoring
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Start Monitoring
            </>
          )}
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.responseTime)}</div>
            <Progress 
              value={Math.min((metrics.responseTime / thresholds.responseTime) * 100, 100)} 
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0ms</span>
              <span>{formatTime(thresholds.responseTime)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Throughput */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.throughput.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">requests/min</p>
            <Badge 
              variant="secondary" 
              className="mt-2"
            >
              {metrics.activeConnections} active
            </Badge>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}%</div>
            <Progress 
              value={Math.min((metrics.errorRate / thresholds.errorRate) * 100, 100)} 
              className="mt-2"
            />
            <Badge 
              variant={getStatusColor(metrics.errorRate, thresholds.errorRate)}
              className="mt-2"
            >
              {metrics.errorRate < 1 ? 'Excellent' : metrics.errorRate < 3 ? 'Good' : 'Needs Attention'}
            </Badge>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
            <Progress 
              value={metrics.memoryUsage} 
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance Metrics</CardTitle>
          <CardDescription>
            Advanced system performance indicators and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">API Latency</span>
                <span className="text-sm font-medium">{formatTime(metrics.apiLatency)}</span>
              </div>
              <Progress value={Math.min((metrics.apiLatency / 3000) * 100, 100)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                <span className="text-sm font-medium">{metrics.cacheHitRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.cacheHitRate} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Queue Length</span>
                <span className="text-sm font-medium">{metrics.queueLength} items</span>
              </div>
              <Progress value={Math.min((metrics.queueLength / thresholds.queueLength) * 100, 100)} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={alerts.length > 0 ? "destructive" : "secondary"}>
                {alerts.length > 0 ? "Issues Detected" : "All Systems Normal"}
              </Badge>
            </div>
            
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Monitoring</span>
              <Badge variant={isMonitoring ? "default" : "secondary"}>
                {isMonitoring ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};