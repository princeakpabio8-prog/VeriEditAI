import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { verificationCache } from "@/lib/verification-cache";
import { Database, Clock, Zap } from "lucide-react";

export function CacheStatus() {
  const [cacheStats, setCacheStats] = useState({ size: 0, oldestTimestamp: null });

  useEffect(() => {
    const updateStats = () => {
      setCacheStats(verificationCache.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return 'No cache';
    
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getCacheStatusColor = () => {
    if (cacheStats.size === 0) return 'bg-gray-500/10 text-gray-700 border-gray-200';
    if (cacheStats.size < 20) return 'bg-green-500/10 text-green-700 border-green-200';
    if (cacheStats.size < 50) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-red-500/10 text-red-700 border-red-200';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Badge 
              variant="outline" 
              className={`${getCacheStatusColor()} cursor-help flex items-center gap-1 px-2 py-1`}
            >
              {cacheStats.size > 0 ? (
                <>
                  <Zap className="h-3 w-3" />
                  <span className="text-xs font-medium">{cacheStats.size} cached</span>
                </>
              ) : (
                <>
                  <Database className="h-3 w-3" />
                  <span className="text-xs font-medium">No cache</span>
                </>
              )}
            </Badge>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="font-medium">Verification Cache</div>
            <div>Cached verifications: {cacheStats.size}/100</div>
            <div>Oldest cache: {formatTimeAgo(cacheStats.oldestTimestamp)}</div>
            <div className="text-muted-foreground">
              Cached results load instantly and save API calls
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}