import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from './button';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function ErrorState({
  title = "Something went wrong",
  message,
  actionLabel = "Try again",
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  variant = 'destructive'
}: ErrorStateProps) {
  return (
    <Alert variant={variant} className={cn("my-4", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{message}</p>
        <div className="flex flex-wrap gap-2">
          {onAction && (
            <Button 
              variant={variant === 'destructive' ? 'outline' : 'default'}
              size="sm"
              onClick={onAction}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {actionLabel}
            </Button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={onSecondaryAction}
              className="gap-2"
            >
              {secondaryActionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Specific error states for common scenarios
export function VerificationErrorState({ 
  error, 
  onRetry, 
  onTryDifferentClaim 
}: { 
  error: string;
  onRetry?: () => void;
  onTryDifferentClaim?: () => void;
}) {
  // Parse common error types and provide specific guidance
  const getErrorDetails = () => {
    if (error.includes('license') || error.includes('limit')) {
      return {
        title: "Verification limit reached",
        message: "You've used all your free verifications for this month. Upgrade to continue verifying claims.",
        actionLabel: "View plans",
        secondaryActionLabel: undefined
      };
    }
    
    if (error.includes('network') || error.includes('timeout')) {
      return {
        title: "Connection issue",
        message: "Unable to reach verification servers. Check your internet connection and try again.",
        actionLabel: "Retry verification",
        secondaryActionLabel: "Try different claim"
      };
    }
    
    if (error.includes('content') || error.includes('empty')) {
      return {
        title: "Invalid content",
        message: "Please provide valid content to verify. Claims should be clear statements or questions.",
        actionLabel: undefined,
        secondaryActionLabel: "Learn more"
      };
    }
    
    return {
      title: "Verification failed",
      message: error || "An unexpected error occurred. Please try again or verify a different claim.",
      actionLabel: "Retry",
      secondaryActionLabel: "Try different claim"
    };
  };

  const details = getErrorDetails();

  return (
    <ErrorState
      title={details.title}
      message={details.message}
      actionLabel={details.actionLabel}
      onAction={details.actionLabel === "View plans" ? () => window.location.href = '/billing' : onRetry}
      secondaryActionLabel={details.secondaryActionLabel}
      onSecondaryAction={onTryDifferentClaim}
    />
  );
}
