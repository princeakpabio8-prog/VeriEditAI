import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VerificationStatusBadgeProps {
  status: 'verified' | 'verifying' | 'failed' | 'debunked' | 'false';
  confidence?: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function VerificationStatusBadge({ 
  status, 
  confidence, 
  size = 'medium',
  className 
}: VerificationStatusBadgeProps) {
  const sizes = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24
  };

  const configs = {
    verified: {
      icon: CheckCircle2,
      label: 'VERIFIED',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-green-500',
      textClass: 'text-white',
      shadowClass: 'shadow-lg shadow-emerald-500/30'
    },
    verifying: {
      icon: Clock,
      label: 'VERIFYING...',
      bgClass: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      textClass: 'text-white',
      shadowClass: 'shadow-lg shadow-blue-500/30'
    },
    failed: {
      icon: AlertCircle,
      label: 'FAILED',
      bgClass: 'bg-gradient-to-r from-red-500 to-rose-500',
      textClass: 'text-white',
      shadowClass: 'shadow-lg shadow-red-500/30'
    },
    debunked: {
      icon: AlertCircle,
      label: 'DEBUNKED',
      bgClass: 'bg-gradient-to-r from-red-500 to-rose-500',
      textClass: 'text-white',
      shadowClass: 'shadow-lg shadow-red-500/30'
    },
    false: {
      icon: AlertCircle,
      label: 'FALSE',
      bgClass: 'bg-gradient-to-r from-red-500 to-rose-500',
      textClass: 'text-white',
      shadowClass: 'shadow-lg shadow-red-500/30'
    }
  };

  const config = configs[status as keyof typeof configs] || configs.failed;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold',
        sizes[size],
        config.bgClass,
        config.textClass,
        config.shadowClass,
        status === 'verified' && 'animate-pulse',
        className
      )}
    >
      <Icon size={iconSizes[size]} className="flex-shrink-0" />
      <span>{config.label}</span>
      {(status === 'verified' || status === 'debunked' || status === 'false') && confidence !== undefined && (
        <span className="ml-1 opacity-90">• {confidence}%</span>
      )}
    </motion.div>
  );
}
