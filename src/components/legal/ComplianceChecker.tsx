// VeriEdit AI Compliance Checker Component for VeriLex
// Copy this file to your VeriLex project: src/components/legal/ComplianceChecker.tsx

import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Building2,
  Globe,
  FileCheck,
  Download,
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  verifyLegalContent,
  LegalVerificationResult,
  ComplianceItem,
  legalTemplates,
  jurisdictions,
  getComplianceColor
} from '@/lib/legal-verification-api';

interface ComplianceCheckerProps {
  userId?: string;
  defaultRegulations?: string[];
  onCheckComplete?: (result: LegalVerificationResult) => void;
}

// Detailed regulation information
const regulationDetails: { [key: string]: { description: string; requirements: string[]; penalties: string } } = {
  'GDPR': {
    description: 'EU General Data Protection Regulation - Comprehensive data protection law for EU residents',
    requirements: [
      'Data processing agreements with processors',
      'Lawful basis for processing personal data',
      'Data subject rights (access, erasure, portability)',
      'Data breach notification within 72 hours',
      'Privacy by design and default',
      'Data Protection Impact Assessments',
      'Records of processing activities'
    ],
    penalties: 'Up to €20M or 4% of global annual turnover'
  },
  'CCPA': {
    description: 'California Consumer Privacy Act - Privacy rights for California residents',
    requirements: [
      'Right to know what data is collected',
      'Right to delete personal information',
      'Right to opt-out of data sale',
      'Non-discrimination for exercising rights',
      'Privacy policy disclosure requirements',
      'Service provider contract requirements'
    ],
    penalties: 'Up to $7,500 per intentional violation'
  },
  'SOX': {
    description: 'Sarbanes-Oxley Act - Financial reporting and corporate governance for public companies',
    requirements: [
      'Internal control over financial reporting',
      'CEO/CFO certification of reports',
      'Audit committee independence',
      'Whistleblower protections',
      'Document retention policies',
      'Prohibition of personal loans to executives'
    ],
    penalties: 'Up to $5M fine and 20 years imprisonment'
  },
  'HIPAA': {
    description: 'Health Insurance Portability and Accountability Act - Protected health information security',
    requirements: [
      'Administrative safeguards',
      'Physical safeguards',
      'Technical safeguards',
      'Business Associate Agreements',
      'Breach notification requirements',
      'Minimum necessary standard',
      'Patient rights to access records'
    ],
    penalties: 'Up to $1.5M per violation category per year'
  },
  'SEC': {
    description: 'Securities and Exchange Commission Regulations - Securities trading and disclosure',
    requirements: [
      'Registration of securities',
      'Periodic reporting (10-K, 10-Q, 8-K)',
      'Insider trading prohibitions',
      'Proxy statement requirements',
      'Material disclosure obligations',
      'Fair disclosure (Reg FD)'
    ],
    penalties: 'Civil penalties up to $25M for companies'
  },
  'AML': {
    description: 'Anti-Money Laundering - Prevention of money laundering and terrorist financing',
    requirements: [
      'Customer Due Diligence (CDD)',
      'Enhanced Due Diligence for high-risk',
      'Suspicious Activity Reports (SARs)',
      'Currency Transaction Reports',
      'AML compliance program',
      'Employee training'
    ],
    penalties: 'Up to $1M per day of violation'
  },
  'KYC': {
    description: 'Know Your Customer - Identity verification and customer risk assessment',
    requirements: [
      'Customer identification program',
      'Identity verification',
      'Risk-based approach',
      'Ongoing monitoring',
      'Record keeping',
      'PEP screening'
    ],
    penalties: 'Varies by jurisdiction and regulatory body'
  },
  'PCI-DSS': {
    description: 'Payment Card Industry Data Security Standard - Cardholder data protection',
    requirements: [
      'Firewall configuration',
      'Encryption of cardholder data',
      'Access control measures',
      'Network monitoring and testing',
      'Information security policy',
      'Vulnerability management'
    ],
    penalties: 'Fines up to $100,000 per month'
  }
};

export function ComplianceChecker({ userId, defaultRegulations = [], onCheckComplete }: ComplianceCheckerProps) {
  const [content, setContent] = useState('');
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>(defaultRegulations);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('US-FED');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LegalVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedReg, setExpandedReg] = useState<string | null>(null);

  const regulations = legalTemplates.compliance_check.regulations;

  const toggleRegulation = (reg: string) => {
    setSelectedRegulations(prev => 
      prev.includes(reg) 
        ? prev.filter(r => r !== reg)
        : [...prev, reg]
    );
  };

  const handleCheck = async () => {
    if (!content.trim()) {
      setError('Please enter content to check for compliance');
      return;
    }

    if (selectedRegulations.length === 0) {
      setError('Please select at least one regulation to check');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const checkResult = await verifyLegalContent(
        content,
        'compliance',
        selectedJurisdiction,
        selectedRegulations,
        userId
      );
      setResult(checkResult);
      onCheckComplete?.(checkResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compliance check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getComplianceStats = () => {
    if (!result) return { compliant: 0, nonCompliant: 0, partial: 0, total: 0, score: 0 };
    
    const compliant = result.complianceResults.filter(c => c.status === 'compliant').length;
    const nonCompliant = result.complianceResults.filter(c => c.status === 'non_compliant').length;
    const partial = result.complianceResults.filter(c => c.status === 'partial').length;
    const total = result.complianceResults.length;
    const score = total > 0 ? Math.round((compliant / total) * 100) : 0;
    
    return { compliant, nonCompliant, partial, total, score };
  };

  const exportReport = () => {
    if (!result) return;
    
    const stats = getComplianceStats();
    const report = `
COMPLIANCE CHECK REPORT
=======================
Generated: ${new Date().toLocaleString()}
Jurisdiction: ${jurisdictions.find(j => j.code === selectedJurisdiction)?.name || selectedJurisdiction}

SUMMARY
-------
Overall Compliance Score: ${stats.score}%
Compliant Items: ${stats.compliant}/${stats.total}
Non-Compliant Items: ${stats.nonCompliant}/${stats.total}
Partial Compliance: ${stats.partial}/${stats.total}

REGULATIONS CHECKED
-------------------
${selectedRegulations.join(', ')}

DETAILED FINDINGS
-----------------
${result.complianceResults.map(item => `
${item.regulation} - ${item.requirement}
Status: ${item.status.replace('_', ' ').toUpperCase()}
Details: ${item.details}
`).join('\n')}

RECOMMENDATIONS
---------------
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
Powered by VeriEdit AI • Regulatory Compliance Intelligence
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Compliance report exported');
  };

  const stats = getComplianceStats();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Compliance Checker</h2>
              <p className="text-muted-foreground">
                Multi-regulation compliance verification
              </p>
            </div>
          </div>
          {result && (
            <Button onClick={exportReport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>

        {!result ? (
          <>
            {/* Regulation Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Select Regulations
                </CardTitle>
                <CardDescription>
                  Choose the regulatory frameworks to check your content against
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {regulations.map(reg => {
                    const details = regulationDetails[reg.code];
                    return (
                      <div
                        key={reg.code}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedRegulations.includes(reg.code)
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => toggleRegulation(reg.code)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={selectedRegulations.includes(reg.code)}
                            onCheckedChange={() => toggleRegulation(reg.code)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{reg.code}</span>
                              {details && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p className="font-medium mb-1">{reg.name}</p>
                                    <p className="text-xs">{details.description}</p>
                                    <p className="text-xs mt-1 text-orange-400">
                                      Penalties: {details.penalties}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{reg.name}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Jurisdiction Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Jurisdiction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {jurisdictions.map(j => (
                    <Badge
                      key={j.code}
                      variant={selectedJurisdiction === j.code ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedJurisdiction(j.code)}
                    >
                      {j.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle>Document Content</CardTitle>
                <CardDescription>
                  Paste your policy, agreement, or compliance document for verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your privacy policy, terms of service, data processing agreement, or any compliance-related document here...

The AI will analyze it against the selected regulations and identify gaps in compliance."
                  className="min-h-[200px] font-mono text-sm"
                />
                
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedRegulations.length} regulation(s) selected • {content.length.toLocaleString()} characters
                  </div>
                  <Button 
                    onClick={handleCheck} 
                    disabled={isLoading || !content.trim() || selectedRegulations.length === 0}
                    size="lg"
                    className="gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking Compliance...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Check Compliance
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Results Section */
          <div className="space-y-4">
            {/* Compliance Score Overview */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${
                      stats.score >= 80 ? 'text-green-600' :
                      stats.score >= 60 ? 'text-yellow-600' :
                      stats.score >= 40 ? 'text-orange-500' : 'text-red-600'
                    }`}>
                      {stats.score}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Compliance Score</div>
                    <Progress value={stats.score} className="h-2 mt-2" />
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{stats.compliant}</div>
                    <div className="text-sm text-muted-foreground mt-1">Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">{stats.nonCompliant}</div>
                    <div className="text-sm text-muted-foreground mt-1">Non-Compliant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600">{stats.partial}</div>
                    <div className="text-sm text-muted-foreground mt-1">Partial</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results by Regulation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Compliance Details by Regulation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRegulations.map(regCode => {
                  const regItems = result.complianceResults.filter(c => c.regulation === regCode);
                  const regCompliant = regItems.filter(c => c.status === 'compliant').length;
                  const regScore = regItems.length > 0 ? Math.round((regCompliant / regItems.length) * 100) : 0;
                  const details = regulationDetails[regCode];
                  
                  return (
                    <div key={regCode} className="mb-4 last:mb-0">
                      <div 
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setExpandedReg(expandedReg === regCode ? null : regCode)}
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight className={`h-5 w-5 transition-transform ${expandedReg === regCode ? 'rotate-90' : ''}`} />
                          <div>
                            <div className="font-semibold">{regCode}</div>
                            <div className="text-sm text-muted-foreground">
                              {regulations.find(r => r.code === regCode)?.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={regScore} className="w-24 h-2" />
                          <Badge className={
                            regScore >= 80 ? 'bg-green-100 text-green-700' :
                            regScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {regScore}%
                          </Badge>
                        </div>
                      </div>
                      
                      {expandedReg === regCode && (
                        <div className="mt-2 pl-8 space-y-2">
                          {regItems.map((item, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                {item.status === 'compliant' ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                ) : item.status === 'non_compliant' ? (
                                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                )}
                                <div>
                                  <div className="font-medium">{item.requirement}</div>
                                  <div className="text-sm text-muted-foreground">{item.details}</div>
                                </div>
                              </div>
                              <Badge className={getComplianceColor(item.status)}>
                                {item.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          ))}
                          
                          {details && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2">
                              <div className="text-sm font-medium text-blue-800 mb-1">
                                Key Requirements for {regCode}:
                              </div>
                              <ul className="text-xs text-blue-700 space-y-1">
                                {details.requirements.slice(0, 4).map((req, i) => (
                                  <li key={i}>• {req}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Compliance Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Check Another */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setResult(null);
                  setContent('');
                }}
                className="gap-2"
              >
                <FileCheck className="h-4 w-4" />
                Check Another Document
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          Powered by <span className="font-semibold text-primary">VeriEdit AI</span> • Regulatory Compliance Intelligence
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ComplianceChecker;
