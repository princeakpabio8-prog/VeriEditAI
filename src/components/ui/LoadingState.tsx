import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  submessage,
  className 
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-primary/20" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">{message}</p>
        {submessage && (
          <p className="text-xs text-muted-foreground">{submessage}</p>
        )}
      </div>
    </div>
  );
}

interface VerificationLoadingProps {
  stage?: 'analyzing' | 'sources' | 'trust' | 'contradictions';
}

export function VerificationLoading({ stage = 'analyzing' }: VerificationLoadingProps) {
  const stages = {
    analyzing: {
      message: "Analyzing claim...",
      submessage: "Extracting key facts and context"
    },
    sources: {
      message: "Checking sources...",
      submessage: "Searching credible databases"
    },
    trust: {
      message: "Calculating trust score...",
      submessage: "Evaluating source reliability"
    },
    contradictions: {
      message: "Detecting contradictions...",
      submessage: "Cross-referencing with known claims"
    }
  };

  return (
    <LoadingState 
      message={stages[stage].message}
      submessage={stages[stage].submessage}
    />
  );
}
