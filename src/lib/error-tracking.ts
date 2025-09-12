interface ErrorContext {
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  timestamp: string;
  buildVersion?: string;
  feature?: string;
  additionalData?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: 'javascript' | 'network' | 'validation' | 'api' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  tags?: string[];
  fingerprint?: string;
}

class ErrorTracker {
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 50;
  private flushInterval = 30000; // 30 seconds
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
    this.setupNetworkMonitoring();
    this.startPeriodicFlush();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        type: 'javascript',
        severity: 'high',
        context: this.getContext({
          feature: 'global-error-handler',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        })
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        type: 'javascript',
        severity: 'high',
        context: this.getContext({
          feature: 'promise-rejection',
          additionalData: {
            reason: event.reason
          }
        }),
        tags: ['unhandled-promise']
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window && event.target instanceof HTMLElement) {
        this.captureError({
          message: `Failed to load resource: ${event.target.tagName}`,
          type: 'network',
          severity: 'medium',
          context: this.getContext({
            feature: 'resource-loading',
            additionalData: {
              tagName: event.target.tagName,
              src: (event.target as any).src || (event.target as any).href
            }
          }),
          tags: ['resource-error']
        });
      }
    }, true);
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrors();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.captureError({
        message: 'User went offline',
        type: 'network',
        severity: 'low',
        context: this.getContext({
          feature: 'network-monitoring'
        }),
        tags: ['connectivity']
      });
    });
  }

  private getContext(overrides: Partial<ErrorContext> = {}): ErrorContext {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      buildVersion: (window as any).__BUILD_VERSION__ ?? 'unknown',
      ...overrides
    };
  }

  private generateFingerprint(error: Partial<ErrorReport>): string {
    const key = `${error.message}-${error.type}-${error.context?.feature}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  captureError(error: Partial<ErrorReport>): void {
    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      type: error.type || 'javascript',
      severity: error.severity || 'medium',
      context: error.context || this.getContext(),
      tags: error.tags || [],
      fingerprint: error.fingerprint || this.generateFingerprint(error)
    };

    this.errorQueue.push(errorReport);

    // Trim queue if it gets too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Immediate flush for critical errors
    if (errorReport.severity === 'critical') {
      this.flushErrors();
    }

    console.error('Error captured:', errorReport);
  }

  captureException(exception: Error, context?: Partial<ErrorContext>): void {
    this.captureError({
      message: exception.message,
      stack: exception.stack,
      type: 'javascript',
      severity: 'high',
      context: this.getContext(context),
      tags: ['exception']
    });
  }

  captureMessage(message: string, severity: ErrorReport['severity'] = 'low', context?: Partial<ErrorContext>): void {
    this.captureError({
      message,
      type: 'javascript',
      severity,
      context: this.getContext(context),
      tags: ['message']
    });
  }

  capturePerformanceIssue(metric: string, value: number, threshold: number): void {
    if (value > threshold) {
      this.captureError({
        message: `Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`,
        type: 'performance',
        severity: value > threshold * 2 ? 'high' : 'medium',
        context: this.getContext({
          feature: 'performance-monitoring',
          additionalData: {
            metric,
            value,
            threshold
          }
        }),
        tags: ['performance']
      });
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Store in localStorage as backup
      const stored = localStorage.getItem('error_reports') || '[]';
      const storedErrors = JSON.parse(stored);
      localStorage.setItem('error_reports', JSON.stringify([...storedErrors, ...errors].slice(-100)));

      // Send to error tracking service (implement your preferred service)
      await this.sendErrorsToService(errors);
      
      // Clear from localStorage on successful send
      localStorage.removeItem('error_reports');
    } catch (error) {
      // Add errors back to queue if sending failed
      this.errorQueue = [...errors, ...this.errorQueue];
      console.error('Failed to flush errors:', error);
    }
  }

  private async sendErrorsToService(errors: ErrorReport[]): Promise<void> {
    // Implement your error tracking service integration here
    // Examples: Sentry, LogRocket, Bugsnag, or custom endpoint
    
    // For now, we'll use console and localStorage
    console.group('Error Reports');
    errors.forEach(error => {
      console.error(`[${error.severity.toUpperCase()}] ${error.type}:`, error);
    });
    console.groupEnd();

    // Optional: Send to your own analytics endpoint
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors })
      });
    } catch (error) {
      // Silently fail - don't create error loops
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushErrors();
    }, this.flushInterval);
  }

  // Verification-specific error tracking
  captureVerificationError(verificationId: string, step: string, error: Error): void {
    this.captureError({
      message: `Verification failed at step: ${step}`,
      stack: error.stack,
      type: 'api',
      severity: 'high',
      context: this.getContext({
        feature: 'verification',
        additionalData: {
          verificationId,
          step,
          originalError: error.message
        }
      }),
      tags: ['verification', step]
    });
  }

  captureAuthError(action: string, error: Error): void {
    this.captureError({
      message: `Authentication error during: ${action}`,
      stack: error.stack,
      type: 'api',
      severity: 'medium',
      context: this.getContext({
        feature: 'authentication',
        additionalData: {
          action,
          originalError: error.message
        }
      }),
      tags: ['auth', action]
    });
  }

  capturePaymentError(action: string, error: Error): void {
    this.captureError({
      message: `Payment error during: ${action}`,
      stack: error.stack,
      type: 'api',
      severity: 'critical',
      context: this.getContext({
        feature: 'payments',
        additionalData: {
          action,
          originalError: error.message
        }
      }),
      tags: ['payment', action]
    });
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// React error boundary hook
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    errorTracker.captureException(error, {
      feature: 'react-component',
      additionalData: errorInfo
    });
  };

  return { handleError };
};

// Performance monitoring
export const performanceMonitor = {
  startTiming: (name: string) => {
    try {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${name}-start`);
      }
    } catch (error) {
      // Silently fail if performance API is not available
    }
  },

  endTiming: (name: string, threshold: number = 3000) => {
    try {
      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        performance.mark(`${name}-end`);
        const measure = performance.measure(name, `${name}-start`, `${name}-end`);
        errorTracker.capturePerformanceIssue(name, measure.duration, threshold);
        return measure.duration;
      }
    } catch (error) {
      // Silently fail if performance API fails
    }
    return 0;
  },

  measureAsync: async <T>(name: string, fn: () => Promise<T>, threshold: number = 5000): Promise<T> => {
    performanceMonitor.startTiming(name);
    try {
      const result = await fn();
      performanceMonitor.endTiming(name, threshold);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(name, threshold);
      errorTracker.captureException(error as Error, {
        feature: 'async-operation',
        additionalData: { operation: name }
      });
      throw error;
    }
  }
};