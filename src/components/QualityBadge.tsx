import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QualityBadgeProps {
  qualityStatus: {
    has_flags: boolean;
    flag_count: number;
    critical_count: number;
    high_count: number;
    flags: Array<{
      type: string;
      severity: string;
      details: any;
      reviewed: boolean;
    }>;
  } | null;
}

const getFlagLabel = (type: string): string => {
  const labels: Record<string, string> = {
    low_confidence: "Low Confidence",
    insufficient_sources: "Insufficient Sources",
    low_source_quality: "Low Quality Sources",
    duplicate: "Duplicate Content",
    contradiction: "Contradiction Detected"
  };
  return labels[type] || type;
};

const getFlagDescription = (flag: any): string => {
  const { type, details } = flag;
  
  switch (type) {
    case 'low_confidence':
      return `Trust score of ${details.trust_score}% is below quality threshold (50%)`;
    case 'insufficient_sources':
      return `Only ${details.source_count} source(s) found. Minimum ${details.minimum_required} required`;
    case 'low_source_quality':
      return `${details.low_quality_count} of ${details.total_sources} sources have reliability below ${details.threshold}%`;
    case 'duplicate':
      return `This content appears to be a duplicate (${details.duplicate_count} similar verification(s) found)`;
    default:
      return details.reason || "Quality issue detected";
  }
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        variant: "destructive" as const,
        badgeClass: "bg-destructive text-destructive-foreground"
      };
    case 'high':
      return {
        icon: AlertTriangle,
        variant: "destructive" as const,
        badgeClass: "bg-orange-500 text-white"
      };
    case 'medium':
      return {
        icon: AlertTriangle,
        variant: "default" as const,
        badgeClass: "bg-yellow-500 text-black"
      };
    default:
      return {
        icon: Info,
        variant: "default" as const,
        badgeClass: "bg-blue-500 text-white"
      };
  }
};

export const QualityBadge = ({ qualityStatus }: QualityBadgeProps) => {
  if (!qualityStatus || !qualityStatus.has_flags) {
    return (
      <Alert className="border-success/50 bg-success/10">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Quality Verified</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          This verification meets all quality standards
        </AlertDescription>
      </Alert>
    );
  }

  const highestSeverityFlag = qualityStatus.flags.reduce((highest, flag) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const currentLevel = severityOrder[flag.severity as keyof typeof severityOrder] || 0;
    const highestLevel = severityOrder[highest.severity as keyof typeof severityOrder] || 0;
    return currentLevel > highestLevel ? flag : highest;
  }, qualityStatus.flags[0]);

  const { icon: Icon, variant } = getSeverityConfig(highestSeverityFlag.severity);

  return (
    <div className="space-y-2">
      <Alert variant={variant}>
        <Icon className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          Quality Issues Detected
          <Badge className={getSeverityConfig(highestSeverityFlag.severity).badgeClass}>
            {qualityStatus.flag_count} issue{qualityStatus.flag_count > 1 ? 's' : ''}
          </Badge>
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          {qualityStatus.flags.map((flag, index) => (
            <div key={index} className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0">
                {getFlagLabel(flag.type)}
              </Badge>
              <span className="text-sm">{getFlagDescription(flag)}</span>
            </div>
          ))}
        </AlertDescription>
      </Alert>
    </div>
  );
};
