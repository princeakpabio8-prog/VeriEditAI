import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry with exponential backoff for network errors
    if (this.isNetworkError(error) && this.shouldAutoRetry()) {
      this.autoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  isNetworkError(error: Error): boolean {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.name === 'NetworkError'
    );
  }

  shouldAutoRetry(): boolean {
    const maxRetries = this.props.maxRetries || 3;
    return this.state.retryCount < maxRetries;
  }

  autoRetry = () => {
    const { retryCount } = this.state;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

    this.setState({ isRetrying: true });
    
    toast.info(`Retrying in ${delay / 1000}s...`, {
      duration: delay,
    });

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
    }));
  };

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isRetrying, retryCount } = this.state;
      const isNetworkError = error && this.isNetworkError(error);
      const maxRetries = this.props.maxRetries || 3;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {isNetworkError ? 'Connection Issue' : 'Something went wrong'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isNetworkError
                      ? 'Unable to connect. Checking your connection...'
                      : 'An unexpected error occurred'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-mono text-muted-foreground">
                    {error.message}
                  </p>
                </div>
              )}

              {isRetrying && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Auto-retrying...</span>
                </div>
              )}

              {isNetworkError && retryCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              )}

              <div className="flex flex-col gap-2">
                {this.props.showRetry !== false && (
                  <Button
                    onClick={this.handleManualRetry}
                    disabled={isRetrying}
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={this.handleGoBack}
                    disabled={isRetrying}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    disabled={isRetrying}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </div>
              </div>

              {!isNetworkError && (
                <p className="text-xs text-center text-muted-foreground">
                  If this problem persists, please contact{' '}
                  <a href="mailto:hello@verieditai.com" className="text-primary hover:underline">
                    hello@verieditai.com
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
