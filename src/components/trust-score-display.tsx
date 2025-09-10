import React, { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    <motion.div 
      className={cn("relative inline-flex items-center justify-center", className)}
      initial={showAnimation ? { scale: 0.8, opacity: 0 } : {}}
      animate={showAnimation ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
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
            strokeWidth="4"
            fill="none"
            className="text-muted opacity-20"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={strokeDasharray}
            className={cn(getTrustColor(level))}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: showAnimation ? strokeDashoffset : circumference }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>

        {/* Content */}
        <motion.div 
          className="relative z-10 text-center"
          initial={showAnimation ? { opacity: 0, y: 10 } : {}}
          animate={showAnimation ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.div
            initial={showAnimation ? { scale: 0 } : {}}
            animate={showAnimation ? { scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, delay: 0.7 }}
          >
            <Icon className={cn("mx-auto mb-1", getTrustColor(level), 
              size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : size === "xl" ? "h-12 w-12" : "h-6 w-6"
            )} />
          </motion.div>
          <motion.div 
            className={cn(
              "font-bold tabular-nums",
              getTrustColor(level),
              size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : size === "xl" ? "text-3xl" : "text-sm"
            )}
            initial={showAnimation ? { scale: 0.5, opacity: 0 } : {}}
            animate={showAnimation ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            {showAnimation ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 0.9 }}
              >
                <Counter target={score} />
              </motion.span>
            ) : (
              `${score}%`
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Trust Level Label */}
      {showLabel && (
        <motion.div 
          className={cn(
            "absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center",
            size === "sm" ? "text-xs" : "text-sm"
          )}
          initial={showAnimation ? { opacity: 0, y: 10 } : {}}
          animate={showAnimation ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <div className={cn("font-medium capitalize", getTrustColor(level))}>
            {level === "unknown" ? "Uncertain" : `${level} Trust`}
          </div>
        </motion.div>
      )}
    </motion.div>
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