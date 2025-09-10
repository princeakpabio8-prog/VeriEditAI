import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrustScoreDisplay } from './trust-score-display';
import { ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Source {
  id: string;
  url: string;
  title: string;
  content_snippet: string;
  reliability_score: number;
}

interface VerificationResultProps {
  verificationId: string;
  trustScore: number;
  status: string;
  summary: string;
  sources: Source[];
  processingTime?: number;
  onNewVerification?: () => void;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  verificationId,
  trustScore,
  status,
  summary,
  sources,
  processingTime,
  onNewVerification,
}) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      verified: "default",
      flagged: "secondary", 
      failed: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
                {getStatusBadge(status)}
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
              />
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.5 }}
            >
              <p className="text-muted-foreground mb-4">{summary}</p>
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
              {sources.map((source, index) => (
                <motion.div 
                  key={source.id || index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 2.2 + index * 0.1 }}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{source.title}</h4>
                      {source.reliability_score && (
                        <Badge variant="outline" className="text-xs">
                          {source.reliability_score}% reliable
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {source.content_snippet}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 h-8 px-2"
                      onClick={() => window.open(source.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Source
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

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