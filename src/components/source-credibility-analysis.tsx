// Enhanced Source Credibility Scoring System
// This component adds source credibility analysis to verification results

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Clock, Shield, Brain, Globe, BookOpen, FileText } from 'lucide-react';

interface SourceWithCredibility {
  id: string;
  title: string;
  url: string;
  content_snippet: string;
  reliability_score: number;
  source_type: 'perplexity' | 'fact_check' | 'news' | 'encyclopedia' | 'academic' | 'government';
  credibility_factors?: {
    domain_reputation: number;
    author_credibility: number;
    publication_date: number;
    citation_count?: number;
    peer_reviewed?: boolean;
  };
}

interface SourceCredibilityAnalysisProps {
  sources: SourceWithCredibility[];
  verification_method: string[];
  confidence: number;
}

const getSourceIcon = (sourceType: string) => {
  switch (sourceType) {
    case 'perplexity':
      return <Brain className="h-4 w-4 text-blue-500" />;
    case 'fact_check':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'news':
      return <Globe className="h-4 w-4 text-orange-500" />;
    case 'encyclopedia':
      return <BookOpen className="h-4 w-4 text-purple-500" />;
    case 'academic':
      return <Shield className="h-4 w-4 text-indigo-500" />;
    case 'government':
      return <FileText className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getCredibilityColor = (score: number) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getCredibilityLevel = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'High';
  if (score >= 60) return 'Moderate';
  return 'Low';
};

export const SourceCredibilityAnalysis: React.FC<SourceCredibilityAnalysisProps> = ({
  sources,
  verification_method,
  confidence
}) => {
  const averageCredibility = sources.length > 0 
    ? Math.round(sources.reduce((sum, source) => sum + source.reliability_score, 0) / sources.length)
    : 0;

  const sourceCategoryCount = sources.reduce((acc, source) => {
    acc[source.source_type] = (acc[source.source_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const aiModelCount = verification_method.filter(method => 
    method.includes('Claude') || method.includes('GPT') || method.includes('AI')
  ).length;

  return (
    <div className="space-y-6">
      {/* Credibility Overview */}
      <Card className="bg-gradient-card border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Source Credibility Analysis</CardTitle>
              <CardDescription>
                Enhanced verification with AI reasoning models and credible sources
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300">
              <div className="text-center space-y-2">
                <div className={`text-4xl font-bold ${getCredibilityColor(confidence)}`}>
                  {confidence}%
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getCredibilityColor(confidence).replace('text-', 'bg-')} transition-all duration-1000`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Verification Confidence</p>
              </div>
            </div>
            <div className="p-5 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all duration-300">
              <div className="text-center space-y-2">
                <div className={`text-4xl font-bold ${getCredibilityColor(averageCredibility)}`}>
                  {averageCredibility}%
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getCredibilityColor(averageCredibility).replace('text-', 'bg-')} transition-all duration-1000`}
                    style={{ width: `${averageCredibility}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Avg. Source Credibility</p>
              </div>
            </div>
            <div className="p-5 rounded-lg bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40 hover:border-primary/30 transition-all duration-300">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">
                  {sources.length}
                </div>
                <div className="flex justify-center gap-1">
                  {[...Array(Math.min(5, sources.length))].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary" />
                  ))}
                  {sources.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{sources.length - 5}</span>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Verified Sources</p>
              </div>
            </div>
          </div>

          {/* AI Models Used */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">AI Models & Methods ({verification_method.length})</h4>
            <div className="flex flex-wrap gap-2">
              {verification_method.map((method, index) => {
                let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
                if (method.includes('Claude')) variant = "default";
                else if (method.includes('GPT')) variant = "secondary";
                else if (method.includes('Fact Check')) variant = "destructive";
                
                return (
                  <Badge key={index} variant={variant} className="text-xs">
                    {method}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Source Type Distribution */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Source Distribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(sourceCategoryCount).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  {getSourceIcon(type)}
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="outline" className="ml-auto">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Source Analysis */}
      <Card className="bg-gradient-card border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-xl">Individual Source Credibility</CardTitle>
              <CardDescription>
                Detailed credibility analysis of each verification source
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sources.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No external sources found</p>
              <p className="text-sm text-muted-foreground">
                Verification based on AI analysis only
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div 
                  key={index} 
                  className="group border border-border/50 hover:border-primary/40 rounded-lg p-5 space-y-4 bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/30 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-background/80 group-hover:bg-primary/10 transition-colors">
                        {getSourceIcon(source.source_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                          {source.title}
                        </h5>
                        <p className="text-xs text-muted-foreground capitalize">
                          {source.source_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={source.reliability_score >= 80 ? "default" : 
                              source.reliability_score >= 60 ? "secondary" : "destructive"}
                      className="shrink-0 font-bold"
                    >
                      {getCredibilityLevel(source.reliability_score)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Credibility Score</span>
                      <span className={`font-bold ${getCredibilityColor(source.reliability_score)}`}>
                        {source.reliability_score}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={source.reliability_score} className="h-3" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground/80 mix-blend-difference">
                          {source.reliability_score}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 bg-background/40 p-3 rounded border border-border/30">
                    {source.content_snippet}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <Badge variant="outline" className="text-xs capitalize">
                      <Globe className="h-3 w-3 mr-1" />
                      {source.source_type.replace('_', ' ')}
                    </Badge>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 group/link"
                    >
                      View Source 
                      <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Quality Assessment */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Verification Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Strengths</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                {aiModelCount >= 2 && (
                  <li>• Multiple AI reasoning models (Claude 4 + GPT o3)</li>
                )}
                {sources.length >= 3 && (
                  <li>• Multiple independent sources verified</li>
                )}
                {sources.some(s => s.source_type === 'fact_check') && (
                  <li>• Professional fact-checker validation</li>
                )}
                {sources.some(s => s.source_type === 'academic') && (
                  <li>• Academic/scholarly sources included</li>
                )}
                {averageCredibility >= 80 && (
                  <li>• High average source credibility</li>
                )}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Limitations</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                {sources.length < 2 && (
                  <li>• Limited source diversity</li>
                )}
                {!sources.some(s => s.source_type === 'fact_check') && (
                  <li>• Verified by AI reasoning models and credible sources</li>
                )}
                {averageCredibility < 70 && (
                  <li>• Moderate source credibility scores</li>
                )}
                {confidence < 70 && (
                  <li>• Lower confidence due to conflicting evidence</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};