import { useLicense } from '@/contexts/LicenseContext';
import { Badge } from './badge';
import { Shield, Zap, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LicenseStatusWidget() {
  const { license, loading } = useLicense();

  if (loading || !license.valid) return null;

  const usage = license.current_usage || 0;
  const maxUsage = license.max_usage || 10;
  const percentage = (usage / maxUsage) * 100;

  // Color coding based on usage
  const getStatusColor = () => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 60) return 'text-warning';
    return 'text-success';
  };

  const getStatusVariant = () => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 60) return 'default';
    return 'secondary';
  };

  const remaining = maxUsage - usage;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to="/billing" className="flex items-center">
            <Badge 
              variant={getStatusVariant()}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 cursor-pointer hover:opacity-80 transition-opacity",
                getStatusColor()
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {usage}/{maxUsage}
              </span>
              {remaining <= 2 && remaining > 0 && (
                <Zap className="h-3 w-3 animate-pulse" />
              )}
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {remaining} verification{remaining !== 1 ? 's' : ''} remaining
            </p>
            <p className="text-xs text-muted-foreground">
              {license.license_type === 'trial' 
                ? 'Free plan resets monthly' 
                : `${license.license_type} plan`}
            </p>
            {remaining <= 2 && (
              <p className="text-xs text-warning font-medium">
                Running low! Click to upgrade
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
