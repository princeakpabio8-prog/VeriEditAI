// VeriEdit AI Contract Analyzer Component for VeriLex
// Copy this file to your VeriLex project: src/components/legal/ContractAnalyzer.tsx

import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Shield,
  Scale,
  FileSearch,
  Download,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  verifyLegalContent,
  LegalVerificationResult,
  ClauseAnalysis,
  getRiskColor,
  getRiskBgColor,
  RiskLevel
} from '@/lib/legal-verification-api';

interface ContractAnalyzerProps {
  userId?: string;
  onAnalysisComplete?: (result: LegalVerificationResult) => void;
}

// Standard contract clause templates for comparison
const standardClauses = {
  indemnification: {
    name: 'Indemnification',
    standard: 'Each party shall indemnify, defend, and hold harmless the other party from and against any claims, damages, losses, and expenses arising from its breach of this Agreement or negligent acts.',
    concerns: ['unlimited liability', 'one-sided indemnification', 'broad scope']
  },
  limitation_of_liability: {
    name: 'Limitation of Liability',
    standard: 'Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages. Total liability shall not exceed the fees paid in the twelve months preceding the claim.',
    concerns: ['no cap on liability', 'excludes gross negligence', 'waives consequential damages']
  },
  termination: {
    name: 'Termination',
    standard: 'Either party may terminate this Agreement upon thirty (30) days written notice. Termination for cause requires written notice and a thirty (30) day cure period.',
    concerns: ['immediate termination rights', 'no cure period', 'one-sided termination']
  },
  confidentiality: {
    name: 'Confidentiality',
    standard: 'Each party agrees to maintain the confidentiality of the other party\'s proprietary information for a period of three (3) years following termination of this Agreement.',
    concerns: ['perpetual obligations', 'overly broad definition', 'no exceptions']
  },
  force_majeure: {
    name: 'Force Majeure',
    standard: 'Neither party shall be liable for delays or failures in performance resulting from circumstances beyond the reasonable control of that party, including but not limited to acts of God, pandemic, war, or government action.',
    concerns: ['narrow definition', 'pandemic not included', 'no notice requirement']
  }
};

export function ContractAnalyzer({ userId, onAnalysisComplete }: ContractAnalyzerProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LegalVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please enter contract content to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await verifyLegalContent(
        content,
        'contract',
        'US-FED',
        [],
        userId
      );
      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportAnalysis = () => {
    if (!result) return;
    
    const report = `
CONTRACT ANALYSIS REPORT
========================
Generated: ${new Date().toLocaleString()}

OVERVIEW
--------
Trust Score: ${result.trustScore}%
Overall Risk: ${result.legalAnalysis.overallRisk.toUpperCase()}
Risk Score: ${result.legalAnalysis.riskScore}%
Status: ${result.status.toUpperCase()}

SUMMARY
-------
${result.summary}

CLAUSE ANALYSIS
---------------
${result.legalAnalysis.clauses.map(c => `
${c.clauseType}
- Risk Level: ${c.riskLevel.toUpperCase()} (${c.riskScore}%)
- Issues: ${c.issues.length > 0 ? c.issues.join('; ') : 'None identified'}
- Suggestions: ${c.suggestions.join('; ')}
`).join('\n')}

RECOMMENDATIONS
---------------
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

${result.fraudAlerts.length > 0 ? `
ALERTS
------
${result.fraudAlerts.map((a, i) => `${i + 1}. ${a}`).join('\n')}
` : ''}

---
Powered by VeriEdit AI • Legal Document Verification
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const getMissingClauses = (clauses: ClauseAnalysis[]): string[] => {
    const detectedTypes = clauses.map(c => c.clauseType.toLowerCase());
    const essentialClauses = [
      'Indemnification',
      'Limitation of Liability',
      'Termination',
      'Confidentiality',
      'Force Majeure',
      'Dispute Resolution',
      'Governing Law'
    ];
    
    return essentialClauses.filter(
      ec => !detectedTypes.some(dt => dt.includes(ec.toLowerCase()))
    );
  };

  const getRiskScoreColor = (score: number): string => {
    if (score >= 75) return 'text-red-600';
    if (score >= 50) return 'text-orange-500';
    if (score >= 25) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <FileSearch className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Contract Analyzer</h2>
            <p className="text-muted-foreground">
              Deep clause-by-clause analysis with risk scoring
            </p>
          </div>
        </div>
        {result && (
          <Button onClick={exportAnalysis} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Input Section */}
      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Content</CardTitle>
            <CardDescription>
              Paste your full contract or specific clauses for detailed analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your contract here for comprehensive clause-by-clause analysis...

Example clauses to include:
- Indemnification provisions
- Limitation of liability
- Termination conditions
- Confidentiality obligations
- Force majeure clauses"
              className="min-h-[250px] font-mono text-sm"
            />
            
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {content.length.toLocaleString()} characters
              </span>
              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading || !content.trim()}
                size="lg"
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Contract...
                  </>
                ) : (
                  <>
                    <Scale className="h-4 w-4" />
                    Analyze Contract
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${getRiskScoreColor(100 - result.trustScore)}`}>
                  {result.trustScore}%
                </div>
                <div className="text-sm text-muted-foreground">Trust Score</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className={`text-3xl font-bold ${getRiskColor(result.legalAnalysis.overallRisk)}`}>
                  {result.legalAnalysis.overallRisk.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">Risk Level</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">
                  {result.legalAnalysis.clauses.length}
                </div>
                <div className="text-sm text-muted-foreground">Clauses Found</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-orange-500">
                  {result.legalAnalysis.clauses.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length}
                </div>
                <div className="text-sm text-muted-foreground">High Risk Items</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Results */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="clauses">Clauses</TabsTrigger>
                  <TabsTrigger value="comparison">Compare</TabsTrigger>
                  <TabsTrigger value="missing">Missing</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-muted-foreground">{result.summary}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Risk Distribution</h3>
                    <div className="space-y-2">
                      {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map(level => {
                        const count = result.legalAnalysis.clauses.filter(c => c.riskLevel === level).length;
                        const percentage = result.legalAnalysis.clauses.length > 0 
                          ? (count / result.legalAnalysis.clauses.length) * 100 
                          : 0;
                        return (
                          <div key={level} className="flex items-center gap-3">
                            <Badge className={getRiskBgColor(level)} variant="outline">
                              {level.toUpperCase()}
                            </Badge>
                            <Progress value={percentage} className="flex-1 h-2" />
                            <span className="text-sm text-muted-foreground w-12">{count} items</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {result.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Key Recommendations</h3>
                      <ul className="space-y-2">
                        {result.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 p-2 bg-primary/5 rounded">
                            <Shield className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {/* Clauses Tab */}
                <TabsContent value="clauses" className="space-y-3">
                  {result.legalAnalysis.clauses.map((clause, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg border ${getRiskBgColor(clause.riskLevel)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          <span className="font-semibold">{clause.clauseType}</span>
                        </div>
                        <Badge className={getRiskColor(clause.riskLevel)}>
                          {clause.riskLevel.toUpperCase()} RISK ({clause.riskScore}%)
                        </Badge>
                      </div>
                      
                      {clause.issues.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-destructive mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Issues Detected
                          </div>
                          <ul className="text-sm space-y-1 ml-5">
                            {clause.issues.map((issue, i) => (
                              <li key={i} className="text-muted-foreground">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Suggested Improvements
                        </div>
                        <ul className="text-sm space-y-1 ml-5">
                          {clause.suggestions.map((sug, i) => (
                            <li key={i} className="text-muted-foreground">{sug}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Compare your contract clauses with industry-standard templates
                  </p>
                  {Object.entries(standardClauses).map(([key, standard]) => {
                    const matchingClause = result.legalAnalysis.clauses.find(
                      c => c.clauseType.toLowerCase().includes(key.replace('_', ' '))
                    );
                    return (
                      <Card key={key}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{standard.name}</CardTitle>
                            {matchingClause ? (
                              <Badge className={getRiskColor(matchingClause.riskLevel)}>
                                Found - {matchingClause.riskLevel.toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not Detected</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="p-3 bg-muted/50 rounded text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">Standard Template:</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(standard.standard)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-muted-foreground">{standard.standard}</p>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">Watch for:</span>
                            {standard.concerns.map((concern, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {concern}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                {/* Missing Clauses Tab */}
                <TabsContent value="missing" className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Essential clauses that were not detected in your contract
                  </p>
                  {getMissingClauses(result.legalAnalysis.clauses).length > 0 ? (
                    <div className="space-y-3">
                      {getMissingClauses(result.legalAnalysis.clauses).map((clause, idx) => (
                        <div 
                          key={idx}
                          className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <span className="font-semibold">{clause}</span>
                            <Badge variant="secondary" className="ml-auto">Missing</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            This clause is typically essential in commercial contracts. 
                            Consider adding it to protect both parties' interests.
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-green-50 rounded-lg">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="font-semibold text-green-700">All Essential Clauses Present</h3>
                      <p className="text-sm text-green-600">
                        Your contract contains all commonly expected essential clauses.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          {/* Analyze Another */}
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => {
                setResult(null);
                setContent('');
              }}
              className="gap-2"
            >
              <FileSearch className="h-4 w-4" />
              Analyze Another Contract
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        Powered by <span className="font-semibold text-primary">VeriEdit AI</span> • Contract Intelligence
      </div>
    </div>
  );
}

export default ContractAnalyzer;
