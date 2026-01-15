// VeriEdit AI Legal Verifier Component for VeriLex
// Copy this file to your VeriLex project: src/components/legal/LegalVerifier.tsx

import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Gavel,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  verifyLegalContent, 
  LegalVerificationType, 
  LegalVerificationResult,
  legalTemplates,
  jurisdictions,
  getRiskColor,
  getRiskBgColor,
  getComplianceColor,
  getTrustColor,
  getTrustBgColor
} from '@/lib/legal-verification-api';

interface LegalVerifierProps {
  userId?: string;
  defaultType?: LegalVerificationType;
  defaultJurisdiction?: string;
  showContractAnalysis?: boolean;
  showComplianceCheck?: boolean;
}

export function LegalVerifier({
  userId,
  defaultType = 'contract',
  defaultJurisdiction = 'US-FED',
  showContractAnalysis = true,
  showComplianceCheck = true
}: LegalVerifierProps) {
  const [content, setContent] = useState('');
  const [legalType, setLegalType] = useState<LegalVerificationType>(defaultType);
  const [jurisdiction, setJurisdiction] = useState(defaultJurisdiction);
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LegalVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    clauses: true,
    compliance: true,
    citations: false,
    recommendations: true
  });

  const handleVerify = async () => {
    if (!content.trim()) {
      setError('Please enter legal content to verify');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const verificationResult = await verifyLegalContent(
        content,
        legalType,
        jurisdiction,
        selectedRegulations,
        userId
      );
      setResult(verificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleRegulation = (reg: string) => {
    setSelectedRegulations(prev => 
      prev.includes(reg) 
        ? prev.filter(r => r !== reg)
        : [...prev, reg]
    );
  };

  const regulations = legalTemplates.compliance_check.regulations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <Scale className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Legal Document Verifier</h2>
          <p className="text-muted-foreground">
            AI-powered contract analysis and compliance checking
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={legalType} onValueChange={(v) => setLegalType(v as LegalVerificationType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract / Agreement</SelectItem>
                  <SelectItem value="compliance">Compliance Document</SelectItem>
                  <SelectItem value="court_filing">Court Filing</SelectItem>
                  <SelectItem value="legal_opinion">Legal Opinion</SelectItem>
                  <SelectItem value="statute">Statute / Regulation</SelectItem>
                  <SelectItem value="policy">Policy Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jurisdiction */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Jurisdiction</label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {jurisdictions.map(j => (
                    <SelectItem key={j.code} value={j.code}>{j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Regulations Selection */}
          {showComplianceCheck && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Compliance Regulations (Optional)</label>
              <div className="flex flex-wrap gap-3 p-3 border rounded-lg bg-muted/30">
                {regulations.map(reg => (
                  <label 
                    key={reg.code}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors"
                  >
                    <Checkbox 
                      checked={selectedRegulations.includes(reg.code)}
                      onCheckedChange={() => toggleRegulation(reg.code)}
                    />
                    <span className="text-sm">{reg.code}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Input */}
      <Card>
        <CardHeader>
          <CardTitle>Legal Content</CardTitle>
          <CardDescription>
            Paste your contract, legal document, or compliance text for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your legal document, contract clauses, compliance text, or any legal content here for AI-powered verification and analysis..."
            className="min-h-[200px] font-mono text-sm"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {content.length.toLocaleString()} characters
            </span>
            <Button 
              onClick={handleVerify} 
              disabled={isLoading || !content.trim()}
              size="lg"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Verify Document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Trust Score Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trust Score */}
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getTrustColor(result.trustScore)}`}>
                    {result.trustScore}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Trust Score</div>
                  <Progress 
                    value={result.trustScore} 
                    className="h-2 mt-2"
                  />
                </div>

                {/* Overall Risk */}
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getRiskColor(result.legalAnalysis.overallRisk)}`}>
                    {result.legalAnalysis.overallRisk.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Risk Level</div>
                  <Progress 
                    value={result.legalAnalysis.riskScore} 
                    className="h-2 mt-2"
                  />
                </div>

                {/* Status */}
                <div className="text-center">
                  <Badge 
                    variant={result.status === 'verified' ? 'default' : 'secondary'}
                    className="text-lg px-4 py-1"
                  >
                    {result.status.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-2">Verification Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          {/* Clause Analysis */}
          {showContractAnalysis && result.legalAnalysis.clauses.length > 0 && (
            <Collapsible open={expandedSections.clauses}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection('clauses')}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" />
                        Contract Clause Analysis ({result.legalAnalysis.clauses.length})
                      </div>
                      {expandedSections.clauses ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-3">
                    {result.legalAnalysis.clauses.map((clause, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-lg border ${getRiskBgColor(clause.riskLevel)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{clause.clauseType}</span>
                            <Badge variant="outline" className={getRiskColor(clause.riskLevel)}>
                              {clause.riskLevel.toUpperCase()} ({clause.riskScore}%)
                            </Badge>
                          </div>
                        </div>
                        
                        {clause.issues.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-destructive mb-1">Issues:</div>
                            <ul className="text-sm space-y-1">
                              {clause.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {clause.suggestions.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm font-medium text-primary mb-1">Suggestions:</div>
                            <ul className="text-sm space-y-1">
                              {clause.suggestions.map((suggestion, i) => (
                                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Compliance Results */}
          {showComplianceCheck && result.complianceResults.length > 0 && (
            <Collapsible open={expandedSections.compliance}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection('compliance')}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Compliance Check ({result.complianceResults.length})
                      </div>
                      {expandedSections.compliance ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-2">
                      {result.complianceResults.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{item.regulation}</Badge>
                              <span className="font-medium">{item.requirement}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                          </div>
                          <Badge className={getComplianceColor(item.status)}>
                            {item.status === 'compliant' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {item.status === 'non_compliant' && <XCircle className="h-3 w-3 mr-1" />}
                            {item.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Citations */}
          {result.citations.length > 0 && (
            <Collapsible open={expandedSections.citations}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection('citations')}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Legal Citations ({result.citations.length})
                      </div>
                      {expandedSections.citations ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-2">
                      {result.citations.map((citation, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-mono text-sm">{citation.reference}</span>
                            <Badge variant="secondary" className="ml-2">{citation.source}</Badge>
                          </div>
                          {citation.valid ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Collapsible open={expandedSections.recommendations}>
              <Card className="border-primary/50">
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection('recommendations')}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Recommendations
                      </div>
                      {expandedSections.recommendations ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-primary/5 rounded">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Fraud Alerts */}
          {result.fraudAlerts.length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Fraud / Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.fraudAlerts.map((alert, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-destructive">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{alert}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sources */}
          {result.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Verification Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {result.sources.map((source, idx) => (
                    <a 
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{source.title}</div>
                        <div className="text-sm text-muted-foreground">{source.type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{source.reliability}% reliable</Badge>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Powered By */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        Powered by <span className="font-semibold text-primary">VeriEdit AI</span> • Advanced Legal Document Verification
      </div>
    </div>
  );
}

export default LegalVerifier;
