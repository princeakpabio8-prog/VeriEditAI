import { Badge } from '@/components/ui/badge';
import { BarChart3, MessageSquare, CheckCircle, Sparkles, HelpCircle } from 'lucide-react';

interface ClaimTypeBadgeProps {
  type: string;
}

export const ClaimTypeBadge = ({ type }: ClaimTypeBadgeProps) => {
  const getClaimTypeConfig = (claimType: string) => {
    const lower = claimType.toLowerCase();
    
    if (lower.includes('statistical') || lower.includes('statistic')) {
      return {
        icon: BarChart3,
        label: 'Statistical Claim',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
        emoji: '📊'
      };
    } else if (lower.includes('opinion')) {
      return {
        icon: MessageSquare,
        label: 'Opinion',
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
        emoji: '💭'
      };
    } else if (lower.includes('factual') || lower.includes('fact')) {
      return {
        icon: CheckCircle,
        label: 'Factual Claim',
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
        emoji: '✓'
      };
    } else if (lower.includes('prediction')) {
      return {
        icon: Sparkles,
        label: 'Prediction',
        className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        emoji: '🔮'
      };
    } else if (lower.includes('question')) {
      return {
        icon: HelpCircle,
        label: 'Question',
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
        emoji: '❓'
      };
    } else {
      return {
        icon: MessageSquare,
        label: type,
        className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
        emoji: '📝'
      };
    }
  };

  const config = getClaimTypeConfig(type);
  const Icon = config.icon;

  return (
    <Badge className={`gap-1.5 ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{config.label}</span>
    </Badge>
  );
};
