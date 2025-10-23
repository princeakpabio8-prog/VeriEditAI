import { Badge } from '@/components/ui/badge';
import { Smile, Meh, Frown } from 'lucide-react';

interface SentimentBadgeProps {
  label: string;
  score?: number;
}

export const SentimentBadge = ({ label, score }: SentimentBadgeProps) => {
  const getSentimentConfig = (sentiment: string) => {
    const lower = sentiment.toLowerCase();
    
    if (lower.includes('positive')) {
      return {
        icon: Smile,
        variant: 'default' as const,
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
        emoji: '😊'
      };
    } else if (lower.includes('negative')) {
      return {
        icon: Frown,
        variant: 'destructive' as const,
        className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        emoji: '😞'
      };
    } else {
      return {
        icon: Meh,
        variant: 'secondary' as const,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
        emoji: '😐'
      };
    }
  };

  const config = getSentimentConfig(label);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`gap-1.5 ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{label}</span>
      {score !== undefined && (
        <span className="text-xs opacity-75">({Math.round(score * 100)}%)</span>
      )}
    </Badge>
  );
};
