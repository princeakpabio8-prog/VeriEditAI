import React, { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrustScoreExplanation } from "./trust-score-explanation";

// Hook to detect mobile and reduced motion preference
const useAccessibility = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const checkMotion = () => setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    
    checkMobile();
    checkMotion();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, prefersReducedMotion };
};

interface TrustScoreDisplayProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showAnimation?: boolean;
  className?: string;
  showLabel?: boolean;
  showExplanation?: boolean;
}

export const TrustScoreDisplay = ({ 
  score, 
  size = "md", 
  showAnimation = false,
  className,
  showLabel = true,
  showExplanation = false
}: TrustScoreDisplayProps) => {
  const { isMobile, prefersReducedMotion } = useAccessibility();
  const shouldAnimate = showAnimation && !prefersReducedMotion;
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
    const baseClasses = isMobile ? {
      "sm": "w-12 h-12 text-lg",
      "lg": "w-28 h-28 text-3xl", 
      "xl": "w-40 h-40 text-4xl",
      "md": "w-20 h-20 text-xl"
    } : {
      "sm": "w-16 h-16 text-xl",
      "lg": "w-32 h-32 text-4xl",
      "xl": "w-48 h-48 text-5xl", 
      "md": "w-24 h-24 text-2xl"
    };
    
    return baseClasses[size as keyof typeof baseClasses] || baseClasses.md;
  };

  const level = getTrustLevel(score);
  const Icon = getTrustIcon(level);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <motion.div 
        className="relative inline-flex items-center justify-center"
        initial={shouldAnimate ? { scale: 0.8, opacity: 0 } : {}}
        animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
        transition={shouldAnimate ? { duration: 0.5, ease: "easeOut" } : { duration: 0 }}
      >
      <div className={cn(
        "relative flex items-center justify-center rounded-full border-2 border-muted bg-card",
        getSizeClasses(size)
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
            strokeWidth={isMobile ? "6" : "4"}
            fill="none"
            className="text-muted opacity-20"
          />
          {shouldAnimate ? (
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth={isMobile ? "6" : "4"}
              fill="none"
              strokeDasharray={strokeDasharray}
              className={cn(getTrustColor(level))}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          ) : (
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth={isMobile ? "6" : "4"}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={cn(getTrustColor(level))}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Content */}
        <div className="relative z-10 text-center">
          {shouldAnimate ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
              >
                <Icon className={cn("mx-auto mb-1", getTrustColor(level), 
                  isMobile ? (
                    size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : size === "xl" ? "h-10 w-10" : "h-5 w-5"
                  ) : (
                    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : size === "xl" ? "h-12 w-12" : "h-6 w-6"
                  )
                )} />
              </motion.div>
              <motion.div 
                className={cn(
                  "font-bold tabular-nums",
                  getTrustColor(level),
                  isMobile ? (
                    size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : size === "xl" ? "text-2xl" : "text-sm"
                  ) : (
                    size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : size === "xl" ? "text-3xl" : "text-sm"
                  )
                )}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2, delay: 0.9 }}
                >
                  <Counter target={score} />
                </motion.span>
              </motion.div>
            </>
          ) : (
            <>
              <Icon className={cn("mx-auto mb-1", getTrustColor(level), 
                isMobile ? (
                  size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : size === "xl" ? "h-10 w-10" : "h-5 w-5"
                ) : (
                  size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : size === "xl" ? "h-12 w-12" : "h-6 w-6"
                )
              )} />
              <div className={cn(
                "font-bold tabular-nums",
                getTrustColor(level),
                isMobile ? (
                  size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : size === "xl" ? "text-2xl" : "text-sm"
                ) : (
                  size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : size === "xl" ? "text-3xl" : "text-sm"
                )
              )}>
                {`${score}%`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trust Level Label */}
      {showLabel && (
        <div 
          className={cn(
            "absolute left-1/2 transform -translate-x-1/2 text-center",
            isMobile ? "-bottom-6" : "-bottom-8",
            isMobile ? (size === "sm" ? "text-xs" : "text-sm") : (size === "sm" ? "text-xs" : "text-sm")
          )}
        >
          {shouldAnimate ? (
            <motion.div
              className={cn("font-medium capitalize", getTrustColor(level))}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              {level === "unknown" ? "Uncertain" : `${level} Trust`}
            </motion.div>
          ) : (
            <div className={cn("font-medium capitalize", getTrustColor(level))}>
              {level === "unknown" ? "Uncertain" : `${level} Trust`}
            </div>
          )}
        </div>
      )}
      </motion.div>

      {/* Trust Score Explanation */}
      {showExplanation && (
        <div className={cn("mt-4", isMobile && "mt-2")}>
          {shouldAnimate ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.4 }}
            >
              <TrustScoreExplanation type="dialog" />
            </motion.div>
          ) : (
            <TrustScoreExplanation type="dialog" />
          )}
        </div>
      )}
    </div>
  );
};

// Counter component for animated score counting
const Counter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (count < target) {
        setCount(prev => Math.min(prev + Math.ceil((target - prev) / 10), target));
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [count, target]);

  return <>{count}%</>;
};