import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustScoreDisplayProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showAnimation?: boolean;
  className?: string;
  showLabel?: boolean;
}

export const TrustScoreDisplay = ({ 
  score, 
  size = "md", 
  showAnimation = false,
  className,
  showLabel = true
}: TrustScoreDisplayProps) => {
  const getTrustLevel = (score: number) => {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    if (score >= 40) return "low";
    return "unknown";
  };

  const getTrustColor = (level: string) => {
    switch (level) {
      case "high": return "text-trust-high";
      case "medium": return "text-trust-medium";
      case "low": return "text-trust-low";
      default: return "text-trust-unknown";
    }
  };

  const getTrustIcon = (level: string) => {
    switch (level) {
      case "high": return ShieldCheck;
      case "medium": return Shield;
      case "low": return ShieldAlert;
      default: return ShieldX;
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "sm": return "w-16 h-16 text-xl";
      case "lg": return "w-32 h-32 text-4xl";
      case "xl": return "w-48 h-48 text-5xl";
      default: return "w-24 h-24 text-2xl";
    }
  };

  const level = getTrustLevel(score);
  const Icon = getTrustIcon(level);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-full border-2 border-muted bg-card",
        getSizeClasses(size),
        showAnimation && "trust-score-reveal"
      )}>
        {/* Circular Progress */}
        <svg 
          className="absolute inset-0 w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted opacity-20"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              getTrustColor(level),
              showAnimation && "transition-all duration-1000 ease-out"
            )}
            strokeLinecap="round"
            style={{
              strokeDashoffset: showAnimation ? strokeDashoffset : circumference,
            }}
          />
        </svg>

        {/* Content */}
        <div className="relative z-10 text-center">
          <Icon className={cn("mx-auto mb-1", getTrustColor(level), 
            size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : size === "xl" ? "h-12 w-12" : "h-6 w-6"
          )} />
          <div className={cn(
            "font-bold tabular-nums",
            getTrustColor(level),
            size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : size === "xl" ? "text-3xl" : "text-sm"
          )}>
            {score}%
          </div>
        </div>
      </div>

      {/* Trust Level Label */}
      {showLabel && (
        <div className={cn(
          "absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          <div className={cn("font-medium capitalize", getTrustColor(level))}>
            {level === "unknown" ? "Uncertain" : `${level} Trust`}
          </div>
        </div>
      )}
    </div>
  );
};