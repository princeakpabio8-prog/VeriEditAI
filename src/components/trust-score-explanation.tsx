import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Info, 
  Shield, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  CheckCircle2,
  Clock,
  FileText,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrustScoreExplanationProps {
  type?: 'tooltip' | 'dialog' | 'inline';
  trigger?: React.ReactNode;
  scoreBreakdown?: {
    contentScore?: number;
    sourceScore?: number;
    consensusScore?: number;
    recencyScore?: number;
    answerQuality?: number;
  };
}

const TrustScoreExplanation = ({ 
  type = 'tooltip', 
  trigger,
  scoreBreakdown 
}: TrustScoreExplanationProps) => {
  const hasBreakdown = scoreBreakdown && Object.keys(scoreBreakdown).length > 0;

  const explanationContent = (
    <div className="space-y-4">
      {hasBreakdown && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Trust Score Breakdown
          </h4>
          <div className="space-y-2">
            {scoreBreakdown.contentScore !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Content Quality (30%)</span>
                  <span className="font-medium">{Math.round(scoreBreakdown.contentScore * 0.3)}/30</span>
                </div>
                <Progress value={scoreBreakdown.contentScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Evidence-based scoring: dates, names, citations, data
                </p>
              </div>
            )}
            
            {scoreBreakdown.sourceScore !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Source Reliability (30%)</span>
                  <span className="font-medium">{Math.round(scoreBreakdown.sourceScore * 0.3)}/30</span>
                </div>
                <Progress value={scoreBreakdown.sourceScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Average credibility of all sources (.gov, fact-checkers, news)
                </p>
              </div>
            )}
            
            {scoreBreakdown.consensusScore !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Source Consensus (20%)</span>
                  <span className="font-medium">{Math.round(scoreBreakdown.consensusScore * 0.2)}/20</span>
                </div>
                <Progress value={scoreBreakdown.consensusScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Agreement between sources, diversity, contradiction detection
                </p>
              </div>
            )}
            
            {scoreBreakdown.recencyScore !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recency (10%)
                  </span>
                  <span className="font-medium">{Math.round(scoreBreakdown.recencyScore * 0.1)}/10</span>
                </div>
                <Progress value={scoreBreakdown.recencyScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  How recent are the sources? Newer = higher score
                </p>
              </div>
            )}
            
            {scoreBreakdown.answerQuality !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Answer Quality (10%)</span>
                  <span className="font-medium">{Math.round(scoreBreakdown.answerQuality * 0.1)}/10</span>
                </div>
                <Progress value={scoreBreakdown.answerQuality} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Completeness and detail of the verification answer
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Trust Score Levels
        </h4>
        <div className="space-y-2">
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-sm">High Trust (80-100%)</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Multiple reliable sources agree. Strong evidence with specific details.
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-sm">Medium Trust (60-79%)</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Some verification possible. Limited sources or mixed signals.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="font-medium text-sm">Low Trust (40-59%)</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Insufficient evidence or conflicting information from sources.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-sm">Very Low Trust (0-39%)</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Disputed claims, unreliable sources, or contradictory evidence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          How We Calculate Trust
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Evidence-based content analysis (not keyword matching)</li>
          <li>Source credibility from .gov, fact-checkers, major news</li>
          <li>Consensus detection and contradiction analysis</li>
          <li>Temporal awareness (recent sources prioritized)</li>
          <li>Answer completeness and detail quality</li>
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
            <DialogDescription>
              Understanding how we calculate verification trust scores
            </DialogDescription>
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