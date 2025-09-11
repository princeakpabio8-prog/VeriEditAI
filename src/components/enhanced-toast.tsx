import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  persistent?: boolean;
}

// Enhanced toast utilities with different variants and animations
export const useEnhancedToast = () => {
  const { toast } = useToast();

  const showSuccess = (title: string, description?: string, options?: Partial<ToastNotification>) => {
    toast({
      title,
      description,
      duration: options?.duration || 4000,
      action: options?.action ? (
        <Button variant="outline" size="sm" onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
      className: "border-green-200 bg-green-50 text-green-900",
    });
  };

  const showError = (title: string, description?: string, options?: Partial<ToastNotification>) => {
    toast({
      title,
      description,
      duration: options?.duration || 6000,
      variant: "destructive",
      action: options?.action ? (
        <Button variant="outline" size="sm" onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
    });
  };

  const showWarning = (title: string, description?: string, options?: Partial<ToastNotification>) => {
    toast({
      title,
      description,
      duration: options?.duration || 5000,
      action: options?.action ? (
        <Button variant="outline" size="sm" onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900",
    });
  };

  const showInfo = (title: string, description?: string, options?: Partial<ToastNotification>) => {
    toast({
      title,
      description,
      duration: options?.duration || 4000,
      action: options?.action ? (
        <Button variant="outline" size="sm" onClick={options.action.onClick}>
          {options.action.label}
        </Button>
      ) : undefined,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    });
  };

  const showLoading = (title: string, description?: string) => {
    return toast({
      title,
      description,
      duration: Infinity, // Keep open until dismissed
      action: (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ),
    });
  };

  const showProgress = (title: string, progress: number, description?: string) => {
    return toast({
      title,
      description,
      duration: Infinity,
      action: (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs">{progress}%</span>
        </div>
      ),
    });
  };

  const showVerificationSuccess = (trustScore: number, processingTime?: number) => {
    showSuccess(
      "Verification Complete! ✅",
      `Trust score: ${trustScore}%${processingTime ? ` • Processed in ${processingTime}ms` : ''}`,
      {
        action: {
          label: "View Details",
          onClick: () => {
            // Scroll to results or navigate
            const resultElement = document.getElementById('verification-result');
            if (resultElement) {
              resultElement.scrollIntoView({ behavior: 'smooth' });
            }
          }
        },
        duration: 6000
      }
    );
  };

  const showVerificationError = (error: string, canRetry = true) => {
    showError(
      "Verification Failed",
      error,
      {
        action: canRetry ? {
          label: "Retry",
          onClick: () => {
            // Trigger retry logic
            window.location.reload();
          }
        } : undefined,
        duration: 8000
      }
    );
  };

  const showFeatureUpgrade = (feature: string, plan: string) => {
    showWarning(
      `${feature} Requires Upgrade`,
      `This feature is available with the ${plan} plan.`,
      {
        action: {
          label: "Upgrade Now",
          onClick: () => {
            window.location.href = '/billing';
          }
        },
        duration: 10000
      }
    );
  };

  const showCacheHit = (contentType: string) => {
    showInfo(
      "Using Cached Result ⚡",
      `Found previous verification for this ${contentType}`,
      {
        duration: 3000
      }
    );
  };

  const showOfflineMode = () => {
    showWarning(
      "You're Offline",
      "Some features may not be available. Results will sync when you're back online.",
      {
        persistent: true,
        action: {
          label: "Dismiss",
          onClick: () => {} // Will be handled by toast dismiss
        }
      }
    );
  };

  const showUpdateAvailable = () => {
    showInfo(
      "App Update Available",
      "A new version is ready to install.",
      {
        action: {
          label: "Update Now",
          onClick: () => {
            window.location.reload();
          }
        },
        persistent: true
      }
    );
  };

  const showExportSuccess = (format: string, filename: string) => {
    showSuccess(
      "Export Complete! 📄",
      `${format.toUpperCase()} file "${filename}" has been downloaded.`,
      {
        duration: 5000
      }
    );
  };

  const showBulkProgress = (completed: number, total: number) => {
    return showProgress(
      "Processing Bulk Verification",
      Math.round((completed / total) * 100),
      `${completed} of ${total} items completed`
    );
  };

  return {
    toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showProgress,
    // Specialized toast methods
    showVerificationSuccess,
    showVerificationError,
    showFeatureUpgrade,
    showCacheHit,
    showOfflineMode,
    showUpdateAvailable,
    showExportSuccess,
    showBulkProgress
  };
};

// Predefined toast templates for common scenarios
export const ToastTemplates = {
  // Authentication
  loginSuccess: () => ({
    title: "Welcome back! 👋",
    description: "You're successfully signed in.",
    variant: "success" as const
  }),

  logoutSuccess: () => ({
    title: "Signed out",
    description: "You've been safely signed out.",
    variant: "default" as const
  }),

  // Verification
  verificationQueued: (position: number) => ({
    title: "Added to Queue",
    description: `Your verification is #${position} in line.`,
    variant: "info" as const
  }),

  verificationStarted: () => ({
    title: "Analysis Started 🔍",
    description: "AI is analyzing your content...",
    variant: "info" as const
  }),

  // Errors
  networkError: () => ({
    title: "Connection Error",
    description: "Please check your internet connection and try again.",
    variant: "destructive" as const,
    action: {
      label: "Retry",
      onClick: () => window.location.reload()
    }
  }),

  rateLimitError: () => ({
    title: "Rate Limit Exceeded",
    description: "Too many requests. Please wait a moment before trying again.",
    variant: "warning" as const
  }),

  // License
  trialExpired: () => ({
    title: "Trial Expired",
    description: "Your trial period has ended. Upgrade to continue using all features.",
    variant: "warning" as const,
    action: {
      label: "Upgrade",
      onClick: () => window.location.href = '/billing'
    }
  }),

  usageLimitReached: (limit: number) => ({
    title: "Usage Limit Reached",
    description: `You've used all ${limit} verifications this month.`,
    variant: "warning" as const,
    action: {
      label: "Upgrade Plan",
      onClick: () => window.location.href = '/billing'
    }
  })
};