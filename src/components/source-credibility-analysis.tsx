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
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Source Credibility Analysis
          </CardTitle>
          <CardDescription>
            Enhanced verification with AI reasoning models and credible sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getCredibilityColor(confidence)}`}>
                {confidence}%
              </div>
              <p className="text-sm text-muted-foreground">Verification Confidence</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getCredibilityColor(averageCredibility)}`}>
                {averageCredibility}%
              </div>
              <p className="text-sm text-muted-foreground">Average Source Credibility</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sources.length}
              </div>
              <p className="text-sm text-muted-foreground">Verified Sources</p>
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
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Individual Source Credibility</CardTitle>
          <CardDescription>
            Detailed analysis of each verification source
          </CardDescription>
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
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(source.source_type)}
                      <h5 className="font-medium text-sm line-clamp-2">
                        {source.title}
                      </h5>
                    </div>
                    <Badge 
                      variant={source.reliability_score >= 80 ? "default" : 
                              source.reliability_score >= 60 ? "secondary" : "destructive"}
                      className="ml-2"
                    >
                      {getCredibilityLevel(source.reliability_score)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Credibility Score</span>
                      <span className={getCredibilityColor(source.reliability_score)}>
                        {source.reliability_score}%
                      </span>
                    </div>
                    <Progress value={source.reliability_score} className="h-2" />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {source.content_snippet}
                  </p>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs capitalize">
                      {source.source_type.replace('_', ' ')}
                    </Badge>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Source →
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