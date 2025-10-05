import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustScoreDisplay } from './trust-score-display';
import { TrustScoreExplanation } from './trust-score-explanation';
import { TrustScoreFeedback } from './trust-score-feedback';
import { VerificationExport } from './verification-export';
import { SourceCredibilityAnalysis } from './source-credibility-analysis';
import { ExternalLink, Clock, FileText, Activity, Shield } from 'lucide-react';
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
  industry?: 'bank' | 'ngo';
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
  industry,
}) => {
  const [expandedSources, setExpandedSources] = React.useState<Set<number>>(new Set());
  
  // Normalize status to prevent toLowerCase errors
  const normalizedStatus = safeLower(status);
  const normalizedCategory = safeLower(category || 'general');

  const handleOpenSource = (url: string) => {
    try {
      console.log('Opening source URL:', url);
      
      if (!url || url.trim() === '') {
        console.error('Invalid URL provided');
        return;
      }
      
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        console.warn('Popup blocked, attempting direct navigation');
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to open source:', error);
      // Fallback: try direct navigation
      try {
        window.location.href = url;
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
      }
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
        <Card className="bg-gradient-card border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <motion.div
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Shield className="h-8 w-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl font-bold">Verification Complete</CardTitle>
              </div>
              <div className="flex justify-center">
                {getStatusBadge(normalizedStatus)}
              </div>
            </motion.div>
            <motion.div 
              className="flex justify-center mt-6"
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
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <div className="text-xs font-medium text-muted-foreground">Source Consensus</div>
                </div>
                <div className="text-2xl font-bold text-foreground">{sourceConsensus != null ? `${sourceConsensus}%` : '—'}</div>
              </motion.div>
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="text-xs font-medium text-muted-foreground">Category</div>
                </div>
                <div className="text-2xl font-bold text-foreground capitalize">{normalizedCategory || 'General'}</div>
              </motion.div>
              <motion.div 
                className="p-4 rounded-lg bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <div className="text-xs font-medium text-muted-foreground">AI Methods</div>
                </div>
                <div className="text-2xl font-bold text-foreground">{methods?.length ?? 1}</div>
              </motion.div>
            </motion.div>

            {/* Summary */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.5 }}
            >
              <div className="p-6 rounded-lg bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40">
                <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Executive Summary
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{summary}</p>
              </div>
              {processingTime && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Processed in {formatProcessingTime(processingTime)}</span>
                  <Badge variant="outline" className="ml-2">AI-Powered</Badge>
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
          <Card className="bg-gradient-card border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Detailed Analysis</CardTitle>
                  <CardDescription>
                    In-depth AI-generated verification insights
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border/30">
                  {analysis}
                </div>
              </div>
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
          <Card className="bg-gradient-card border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Supporting Evidence</CardTitle>
                  <CardDescription>
                    {sources.length} verified {sources.length === 1 ? 'source' : 'sources'} analyzed during verification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sources.map((source, index) => {
                const isExpanded = expandedSources.has(index);
                const hasFullContent = source.full_content && source.full_content.length > (source.content_snippet?.length || 0);
                const reliabilityColor = source.reliability_score >= 80 ? 'text-trust-high' : 
                                        source.reliability_score >= 60 ? 'text-trust-medium' : 'text-trust-low';
                
                return (
                  <motion.div 
                    key={source.id || index}
                    className="group relative p-5 rounded-lg bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 2.2 + index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Source number badge */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 space-y-3 pl-4">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-base leading-tight flex-1 group-hover:text-primary transition-colors">
                          {source.title}
                        </h4>
                        {source.reliability_score && (
                          <Badge variant="outline" className={`text-xs font-bold ${reliabilityColor} border-current`}>
                            {source.reliability_score}% reliable
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {isExpanded && hasFullContent 
                            ? source.full_content 
                            : source.content_snippet}
                        </p>
                        
                        {hasFullContent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSourceExpansion(index)}
                            className="h-8 text-xs hover:text-primary"
                          >
                            {isExpanded ? '← Show Less' : 'Read More →'}
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSource(source.url)}
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Original Source
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
          industry={industry}
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