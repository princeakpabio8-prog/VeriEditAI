// Real-time Analytics and Performance Monitoring
export interface VerificationMetrics {
  totalVerifications: number;
  successRate: number;
  averageProcessingTime: number;
  categoryBreakdown: Record<string, number>;
  confidenceDistribution: Record<string, number>;
  errorTypes: Record<string, number>;
  peakUsageHours: number[];
  userEngagement: {
    dailyActiveUsers: number;
    averageVerificationsPerUser: number;
    retentionRate: number;
  };
}

class VerificationAnalytics {
  private metrics: VerificationMetrics = {
    totalVerifications: 0,
    successRate: 0,
    averageProcessingTime: 0,
    categoryBreakdown: {},
    confidenceDistribution: {},
    errorTypes: {},
    peakUsageHours: [],
    userEngagement: {
      dailyActiveUsers: 0,
      averageVerificationsPerUser: 0,
      retentionRate: 0
    }
  };

  async trackVerification(data: {
    success: boolean;
    processingTime: number;
    category: string;
    confidence: number;
    userId: string;
    error?: string;
  }) {
    // Update metrics
    this.metrics.totalVerifications++;
    
    if (data.success) {
      this.updateSuccessMetrics(data);
    } else {
      this.updateErrorMetrics(data.error || 'unknown');
    }

    // Store for trending analysis
    this.storeDataPoint(data);
    
    // Send to analytics service (if needed)
    this.sendToAnalytics(data);
  }

  private updateSuccessMetrics(data: any) {
    // Category tracking
    this.metrics.categoryBreakdown[data.category] = 
      (this.metrics.categoryBreakdown[data.category] || 0) + 1;

    // Confidence distribution
    const confidenceRange = this.getConfidenceRange(data.confidence);
    this.metrics.confidenceDistribution[confidenceRange] = 
      (this.metrics.confidenceDistribution[confidenceRange] || 0) + 1;

    // Processing time
    const total = this.metrics.averageProcessingTime * (this.metrics.totalVerifications - 1);
    this.metrics.averageProcessingTime = (total + data.processingTime) / this.metrics.totalVerifications;
  }

  private updateErrorMetrics(error: string) {
    this.metrics.errorTypes[error] = (this.metrics.errorTypes[error] || 0) + 1;
  }

  private getConfidenceRange(confidence: number): string {
    if (confidence >= 90) return '90-100%';
    if (confidence >= 80) return '80-89%';
    if (confidence >= 70) return '70-79%';
    if (confidence >= 60) return '60-69%';
    return 'Below 60%';
  }

  private storeDataPoint(data: any) {
    const dataPoint = {
      ...data,
      timestamp: Date.now(),
      hour: new Date().getHours()
    };

    try {
      const stored = localStorage.getItem('verification-analytics');
      const history = stored ? JSON.parse(stored) : [];
      
      history.push(dataPoint);
      
      // Keep only last 1000 data points
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
      
      localStorage.setItem('verification-analytics', JSON.stringify(history));
      
      // Update peak usage hours
      this.updatePeakUsageHours(history);
    } catch (error) {
      console.warn('Failed to store analytics data:', error);
    }
  }

  private updatePeakUsageHours(history: any[]) {
    const hourCounts: Record<number, number> = {};
    
    history.forEach(point => {
      hourCounts[point.hour] = (hourCounts[point.hour] || 0) + 1;
    });

    this.metrics.peakUsageHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private async sendToAnalytics(data: any) {
    // Optional: Send to external analytics service
    // This could be Google Analytics, Mixpanel, etc.
    try {
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'verification_completed', {
          category: data.category,
          success: data.success,
          confidence: data.confidence,
          processing_time: data.processingTime
        });
      }
    } catch (error) {
      // Silent fail for analytics
    }
  }

  async getMetrics(): Promise<VerificationMetrics> {
    // Import supabase here to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // Query actual database for real metrics
      const { data: verifications } = await supabase
        .from('verifications')
        .select('trust_score, status, created_at, processing_time_ms, content_type');

      const totalVerifications = verifications?.length || 0;
      const successfulVerifications = verifications?.filter(v => v.status === 'completed') || [];
      
      const successRate = totalVerifications > 0
        ? (successfulVerifications.length / totalVerifications) * 100
        : 100;

      const avgProcessingTime = successfulVerifications.length > 0
        ? successfulVerifications.reduce((sum, v) => sum + (v.processing_time_ms || 0), 0) / successfulVerifications.length
        : 0;

      // Calculate category breakdown from actual data
      const categoryBreakdown = verifications?.reduce((acc, v) => {
        const category = v.content_type || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate confidence distribution from trust scores
      const confidenceDistribution = verifications?.reduce((acc, v) => {
        const range = this.getConfidenceRange(v.trust_score || 0);
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalVerifications,
        successRate,
        averageProcessingTime: avgProcessingTime,
        categoryBreakdown,
        confidenceDistribution,
        errorTypes: this.metrics.errorTypes, // Keep error tracking from client-side
        peakUsageHours: this.metrics.peakUsageHours,
        userEngagement: {
          dailyActiveUsers: 0, // Would need activity tracking
          averageVerificationsPerUser: 0, // Would need user-level aggregation
          retentionRate: 0
        }
      };
    } catch (error) {
      console.error('Failed to fetch metrics from database:', error);
      // Fallback to in-memory metrics if database query fails
      this.calculateSuccessRate();
      return this.metrics;
    }
  }

  private calculateSuccessRate() {
    const totalErrors = Object.values(this.metrics.errorTypes)
      .reduce((sum, count) => sum + count, 0);
    
    this.metrics.successRate = this.metrics.totalVerifications > 0
      ? ((this.metrics.totalVerifications - totalErrors) / this.metrics.totalVerifications) * 100
      : 100; // Default to 100% when no data instead of 0%
  }

  // Performance optimization insights
  async getPerformanceInsights() {
    const metrics = await this.getMetrics();
    const insights = [];

    if (metrics.averageProcessingTime > 5000) {
      insights.push({
        type: 'warning',
        message: 'Average processing time is high. Consider optimizing API calls.',
        metric: 'processing_time',
        value: metrics.averageProcessingTime
      });
    }

    if (metrics.successRate < 95) {
      insights.push({
        type: 'error',
        message: 'Success rate is below optimal. Check error patterns.',
        metric: 'success_rate',
        value: metrics.successRate
      });
    }

    // Check for category imbalances
    const totalCategoryCount = Object.values(metrics.categoryBreakdown)
      .reduce((sum: number, count: number) => sum + count, 0);
    
    Object.entries(metrics.categoryBreakdown).forEach(([category, count]) => {
      const percentage = (count / totalCategoryCount) * 100;
      if (percentage > 50) {
        insights.push({
          type: 'info',
          message: `${category} dominates verification requests (${percentage.toFixed(1)}%)`,
          metric: 'category_balance',
          value: percentage
        });
      }
    });

    return insights;
  }

  // Real-time monitoring
  startRealTimeMonitoring() {
    // Monitor for anomalies only if we have meaningful data
    setInterval(async () => {
      const metrics = await this.getMetrics();
      if (metrics.totalVerifications > 5) { // Only monitor with sufficient data
        const insights = await this.getPerformanceInsights();
        
        insights.forEach(insight => {
          if (insight.type === 'error') {
            console.warn(`Performance Alert: ${insight.message}`);
            
            // Could trigger alert to admin/monitoring service
            this.triggerAlert(insight);
          }
        });
      }
    }, 300000); // Check every 5 minutes instead of 1 minute
  }

  private triggerAlert(insight: any) {
    // Implementation for alerting system
    // Could send to monitoring service, email, etc.
    try {
      // Log to console only for now - no API endpoint needed
      console.info('Performance Alert triggered:', insight);
      
      // Future: Could implement actual alerting service here
      // For now, we just log the alert without trying to send to non-existent endpoint
    } catch (error) {
      // Silent fail for alerts
    }
  }
}

export const verificationAnalytics = new VerificationAnalytics();

// Start monitoring when module loads
verificationAnalytics.startRealTimeMonitoring();
