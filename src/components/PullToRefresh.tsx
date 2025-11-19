import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canPull, setCanPull] = useState(false);

  const opacity = useTransform(y, [0, threshold], [0, 1]);
  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const scale = useTransform(y, [0, threshold], [0.5, 1]);

  useEffect(() => {
    const checkScrollPosition = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        setCanPull(scrollTop === 0);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !canPull) {
      y.set(0);
      return;
    }

    if (info.offset.y >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        y.set(0);
      }
    } else {
      y.set(0);
    }
  };

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
        style={{
          opacity,
          height: useTransform(y, [0, threshold], [0, threshold]),
        }}
      >
        <motion.div
          style={{ rotate, scale }}
          className="flex items-center gap-2 text-primary"
        >
          <RefreshCw className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="font-medium text-sm">
            {isRefreshing ? 'Refreshing...' : 'Release to refresh'}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className={disabled || !canPull ? 'pointer-events-none' : ''}
      >
        {children}
      </motion.div>
    </div>
  );
};
