import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustScoreDisplay } from './trust-score-display';
import { TrustScoreExplanation } from './trust-score-explanation';
import { TrustScoreFeedback } from './trust-score-feedback';
import { VerificationExport } from './verification-export';
import { SourceCredibilityAnalysis } from './source-credibility-analysis';
import { ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { safeLower } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';

interface Source {
  id?: string;
  url: string;
  title: string;
  content_snippet: string;
  full_content?: string;
  reliability_score: number;
  source_type?: 'perplexity' | 'fact_check' | 'news' | 'encyclopedia' | 'academic' | 'government';
}

interface VerificationResultProps {
  verificationId: string;
  trustScore: number;
  status: string;
  summary: string;
  analysis?: string;
  sources: Source[];
  sourceConsensus?: number;
  methods?: string[];
  category?: string;
  processingTime?: number;
  onNewVerification?: () => void;
  content?: string;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  verificationId,
  trustScore,
  status,
  summary,
  analysis,
  sources,
  sourceConsensus,
  methods,
  category,
  processingTime,
  onNewVerification,
  content = "",
}) => {
  const [expandedSources, setExpandedSources] = React.useState<Set<number>>(new Set());
  
  // Normalize status to prevent toLowerCase errors
  const normalizedStatus = safeLower(status);
  const normalizedCategory = safeLower(category || 'general');

  const handleOpenSource = (url: string) => {
    try {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to open source:', error);
    }
  };

  const toggleSourceExpansion = (index: number) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getStatusBadge = (statusValue: string) => {
    const safeStatus = safeLower(statusValue);
    if (!safeStatus) return <Badge variant="secondary">Unknown</Badge>;
    
    const variants = {
      verified: "default",
      flagged: "secondary", 
      failed: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[safeStatus as keyof typeof variants] || "secondary"}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </Badge>
    );
  };

  const formatProcessingTime = (ms?: number) => {
    if (!ms) return null;
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Main Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <CardTitle className="flex items-center justify-center gap-2 mb-4">
                Verification Complete
                {getStatusBadge(normalizedStatus)}
              </CardTitle>
            </motion.div>
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <TrustScoreDisplay 
                score={trustScore} 
                size="xl" 
                showAnimation={true}
                showExplanation={true}
              />
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overview Metrics */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.0 }}
            >
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="text-xs text-muted-foreground">Source Consensus</div>
                <div className="text-lg font-semibold">{sourceConsensus != null ? `${sourceConsensus}%` : '—'}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="text-lg font-semibold">{normalizedCategory ? normalizedCategory.charAt(0).toUpperCase() + normalizedCategory.slice(1) : 'General'}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="text-xs text-muted-foreground">Methods Used</div>
                <div className="text-lg font-semibold">{methods?.length ?? 1}</div>
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.5 }}
            >
              <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{summary}</p>
              {processingTime && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Processed in {formatProcessingTime(processingTime)}
                </div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {analysis && analysis !== summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2 }}
        >
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
              <CardDescription>
                AI-generated explanation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sources Card */}
      {sources && sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2 }}
        >
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Supporting Evidence</CardTitle>
              <CardDescription>
                Sources found during verification analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sources.map((source, index) => {
                const isExpanded = expandedSources.has(index);
                const hasFullContent = source.full_content && source.full_content.length > (source.content_snippet?.length || 0);
                
                return (
                  <motion.div 
                    key={source.id || index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 2.2 + index * 0.1 }}
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{source.title}</h4>
                        {source.reliability_score && (
                          <Badge variant="outline" className="text-xs">
                            {source.reliability_score}% reliable
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {isExpanded && hasFullContent 
                            ? source.full_content 
                            : source.content_snippet}
                        </p>
                        
                        {hasFullContent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSourceExpansion(index)}
                            className="h-8 text-xs"
                          >
                            {isExpanded ? 'Show Less' : 'Read More'}
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSource(source.url)}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Read Full Article
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Export Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 2.3 }}
      >
        <VerificationExport
          verificationId={verificationId}
          trustScore={trustScore}
          status={normalizedStatus}
          summary={summary}
          sources={sources.map(s => ({
            title: s.title,
            url: s.url,
            reliability_score: s.reliability_score
          }))}
          content={content}
          processingTime={processingTime}
        />
      </motion.div>

      {/* Enhanced Source Credibility Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 2.2 }}
      >
        <SourceCredibilityAnalysis
          sources={sources.map(source => ({
            ...source,
            source_type: source.source_type || 'perplexity',
            id: source.id || crypto.randomUUID()
          }))}
          verification_method={methods || ['AI Analysis']}
          confidence={trustScore}
        />
      </motion.div>

      {/* User Feedback Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 2.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Help Us Improve</CardTitle>
          </CardHeader>
          <CardContent>
            <TrustScoreFeedback
              verificationId={verificationId}
              userId={useAuth().user?.id}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 2.5 }}
      >
        <Button 
          onClick={onNewVerification}
          size="lg"
          className="gap-2"
        >
          Verify More Content
        </Button>
      </motion.div>
    </motion.div>
  );
};