import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "default" | "card" | "line" | "circle" | "analysis";
  lines?: number;
}

export function LoadingSkeleton({ 
  className, 
  variant = "default", 
  lines = 3 
}: LoadingSkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md animate-pulse";

  if (variant === "card") {
    return (
      <motion.div 
        className={cn("p-6 border rounded-lg space-y-4", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={cn(baseClasses, "h-6 w-1/3")} />
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseClasses,
                "h-4",
                i === lines - 1 ? "w-2/3" : "w-full"
              )}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === "analysis") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className={cn(baseClasses, "h-8 w-2/3")} />
          <div className={cn(baseClasses, "h-4 w-1/4")} />
        </div>

        {/* Content blocks */}
        {Array.from({ length: 3 }).map((_, blockIndex) => (
          <div key={blockIndex} className="space-y-3">
            <div className={cn(baseClasses, "h-5 w-1/3")} />
            <div className="space-y-2">
              {Array.from({ length: 2 + Math.floor(Math.random() * 2) }).map((_, lineIndex) => (
                <div
                  key={lineIndex}
                  className={cn(
                    baseClasses,
                    "h-4",
                    lineIndex === 2 ? "w-3/4" : "w-full"
                  )}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Sources skeleton */}
        <div className="space-y-2">
          <div className={cn(baseClasses, "h-5 w-1/4")} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(baseClasses, "h-4 w-5/6")}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div className={cn(baseClasses, "h-10 w-10 rounded-full", className)} />
    );
  }

  if (variant === "line") {
    return (
      <div className={cn(baseClasses, "h-4 w-full", className)} />
    );
  }

  return (
    <div className={cn(baseClasses, "h-4 w-full", className)} />
  );
}