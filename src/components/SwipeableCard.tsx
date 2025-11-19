import { ReactNode, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  className?: string;
}

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  className = '',
}: SwipeableCardProps) => {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (Math.abs(velocity) >= 500 || Math.abs(offset) >= swipeThreshold) {
      if (offset > 0 && onSwipeRight) {
        setExitX(500);
        setTimeout(() => {
          onSwipeRight();
          setExitX(0);
          x.set(0);
        }, 200);
      } else if (offset < 0 && onSwipeLeft) {
        setExitX(-500);
        setTimeout(() => {
          onSwipeLeft();
          setExitX(0);
          x.set(0);
        }, 200);
      } else {
        x.set(0);
      }
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative">
      {/* Swipe indicators */}
      <motion.div
        className="absolute inset-0 flex items-center justify-start pl-8 pointer-events-none z-10"
        style={{
          opacity: useTransform(x, [0, 100], [0, 1]),
        }}
      >
        <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-8 w-8 text-white" />
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none z-10"
        style={{
          opacity: useTransform(x, [-100, 0], [1, 0]),
        }}
      >
        <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center">
          <X className="h-8 w-8 text-white" />
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        className={`cursor-grab active:cursor-grabbing ${className}`}
        style={{
          x,
          rotate,
          opacity,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ x: exitX }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};
