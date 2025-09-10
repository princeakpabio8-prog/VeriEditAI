import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrustScoreExplanationProps {
  type?: 'tooltip' | 'dialog' | 'inline';
  trigger?: React.ReactNode;
}

const TrustScoreExplanation = ({ type = 'tooltip', trigger }: TrustScoreExplanationProps) => {
  const explanationContent = (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-green-800 dark:text-green-200">High Trust (80-100%)</span>
              <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-300">
                Verified
              </Badge>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Content is highly credible with strong supporting evidence from multiple reliable sources. 
              Claims are well-documented and factually accurate.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-yellow-800 dark:text-yellow-200">Medium Trust (60-79%)</span>
              <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 dark:text-yellow-300">
                Partially Verified
              </Badge>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Content has some supporting evidence but may contain mixed information. 
              Some claims verified, others need additional confirmation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <ShieldAlert className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-orange-800 dark:text-orange-200">Low Trust (40-59%)</span>
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-300">
                Questionable
              </Badge>
            </div>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Content has limited supporting evidence or contains conflicting information. 
              Claims should be independently verified before trusting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <ShieldX className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-red-800 dark:text-red-200">Very Low Trust (0-39%)</span>
              <Badge variant="outline" className="text-xs border-red-300 text-red-700 dark:text-red-300">
                Unreliable
              </Badge>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              Content likely contains misinformation or lacks credible evidence. 
              Multiple sources contradict the claims or no supporting evidence found.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <h4 className="font-semibold mb-2 text-sm">How We Calculate Trust Scores</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Cross-reference claims with multiple authoritative sources</li>
          <li>• Evaluate source credibility and reliability</li>
          <li>• Check for supporting evidence and documentation</li>
          <li>• Analyze consistency across different information sources</li>
          <li>• Factor in recent updates and temporal relevance</li>
        </ul>
      </div>
    </div>
  );

  if (type === 'inline') {
    return <div className="w-full">{explanationContent}</div>;
  }

  if (type === 'dialog') {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm" className="gap-2">
              <Info className="h-4 w-4" />
              What do trust scores mean?
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Understanding Trust Scores</DialogTitle>
          </DialogHeader>
          {explanationContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Default: tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="sm" className="p-1">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="bottom">
          <div className="space-y-2">
            <p className="font-semibold text-sm">Trust Score Guide:</p>
            <div className="space-y-1 text-xs">
              <div>• <span className="text-green-600">80-100%:</span> Highly credible & verified</div>
              <div>• <span className="text-yellow-600">60-79%:</span> Partially verified, mixed evidence</div>
              <div>• <span className="text-orange-600">40-59%:</span> Limited evidence, questionable</div>
              <div>• <span className="text-red-600">0-39%:</span> Unreliable or contradicted</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { TrustScoreExplanation };