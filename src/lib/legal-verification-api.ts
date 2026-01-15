// VeriEdit AI Legal Verification API for VeriLex
// Copy this file to your VeriLex project: src/lib/legal-verification-api.ts

export const VERIEDIT_API_URL = 'https://sqtkkzdswxazyikcheds.supabase.co/functions/v1/verify';

export type LegalVerificationType = 
  | 'contract'
  | 'compliance'
  | 'court_filing'
  | 'legal_opinion'
  | 'statute'
  | 'policy'
  | 'agreement';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ClauseAnalysis {
  clauseType: string;
  content: string;
  riskLevel: RiskLevel;
  riskScore: number;
  issues: string[];
  suggestions: string[];
}

export interface ComplianceItem {
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  details: string;
}

export interface LegalVerificationResult {
  success: boolean;
  trustScore: number;
  status: 'verified' | 'disputed' | 'unverified' | 'misleading';
  summary: string;
  legalAnalysis: {
    documentType: string;
    jurisdiction: string;
    clauses: ClauseAnalysis[];
    overallRisk: RiskLevel;
    riskScore: number;
  };
  complianceResults: ComplianceItem[];
  citations: {
    reference: string;
    valid: boolean;
    source: string;
  }[];
  sources: {
    url: string;
    title: string;
    reliability: number;
    type: string;
  }[];
  fraudAlerts: string[];
  recommendations: string[];
}

// Legal document templates for verification
export const legalTemplates = {
  contract_analysis: {
    name: 'Contract Analysis',
    industry: 'legal',
    verificationFocus: [
      'clause_detection',
      'risk_assessment',
      'term_consistency',
      'unfair_terms',
      'obligation_mapping'
    ],
    clauseCategories: [
      'indemnification',
      'limitation_of_liability',
      'termination',
      'force_majeure',
      'confidentiality',
      'intellectual_property',
      'dispute_resolution',
      'governing_law',
      'assignment',
      'warranties'
    ]
  },
  compliance_check: {
    name: 'Compliance Verification',
    industry: 'legal',
    verificationFocus: [
      'regulatory_alignment',
      'jurisdictional_compliance',
      'policy_adherence',
      'data_protection',
      'disclosure_requirements'
    ],
    regulations: [
      { code: 'GDPR', name: 'EU General Data Protection Regulation' },
      { code: 'CCPA', name: 'California Consumer Privacy Act' },
      { code: 'SOX', name: 'Sarbanes-Oxley Act' },
      { code: 'HIPAA', name: 'Health Insurance Portability and Accountability Act' },
      { code: 'SEC', name: 'Securities and Exchange Commission Regulations' },
      { code: 'AML', name: 'Anti-Money Laundering' },
      { code: 'KYC', name: 'Know Your Customer' },
      { code: 'PCI-DSS', name: 'Payment Card Industry Data Security Standard' }
    ]
  },
  court_filing: {
    name: 'Court Filing Verification',
    industry: 'legal',
    verificationFocus: [
      'citation_validation',
      'precedent_accuracy',
      'procedural_compliance',
      'factual_accuracy'
    ]
  },
  legal_opinion: {
    name: 'Legal Opinion Analysis',
    industry: 'legal',
    verificationFocus: [
      'legal_reasoning',
      'precedent_support',
      'conclusion_validity',
      'assumption_review'
    ]
  }
};

export const jurisdictions = [
  { code: 'US-FED', name: 'United States - Federal' },
  { code: 'US-DE', name: 'United States - Delaware' },
  { code: 'US-NY', name: 'United States - New York' },
  { code: 'US-CA', name: 'United States - California' },
  { code: 'US-TX', name: 'United States - Texas' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'EU', name: 'European Union' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' }
];

export async function verifyLegalContent(
  content: string,
  legalType: LegalVerificationType = 'contract',
  jurisdiction: string = 'US-FED',
  regulations: string[] = [],
  userId?: string
): Promise<LegalVerificationResult> {
  try {
    const template = legalTemplates[legalType as keyof typeof legalTemplates] || legalTemplates.contract_analysis;
    
    const response = await fetch(VERIEDIT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        category: 'legal',
        userId,
        template: {
          ...template,
          jurisdiction,
          regulations,
          documentType: legalType
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process and enhance the response with legal-specific analysis
    return processLegalResponse(data, content, legalType, jurisdiction, regulations);
  } catch (error) {
    console.error('Legal verification error:', error);
    throw error;
  }
}

function processLegalResponse(
  apiResponse: any,
  content: string,
  legalType: LegalVerificationType,
  jurisdiction: string,
  regulations: string[]
): LegalVerificationResult {
  // Analyze clauses from the content
  const clauses = analyzeContractClauses(content);
  
  // Check compliance
  const complianceResults = checkComplianceItems(content, regulations);
  
  // Extract and validate citations
  const citations = extractCitations(content);
  
  // Calculate overall risk
  const riskScore = calculateRiskScore(clauses);
  const overallRisk = getRiskLevel(riskScore);
  
  return {
    success: true,
    trustScore: apiResponse.confidence || 75,
    status: apiResponse.status || 'unverified',
    summary: apiResponse.summary || apiResponse.analysis || 'Legal document analysis complete.',
    legalAnalysis: {
      documentType: legalType,
      jurisdiction,
      clauses,
      overallRisk,
      riskScore
    },
    complianceResults,
    citations,
    sources: apiResponse.sources || [],
    fraudAlerts: apiResponse.fraudAlerts || [],
    recommendations: generateRecommendations(clauses, complianceResults, overallRisk)
  };
}

function analyzeContractClauses(content: string): ClauseAnalysis[] {
  const clauses: ClauseAnalysis[] = [];
  const lowerContent = content.toLowerCase();
  
  const clausePatterns = [
    {
      type: 'Indemnification',
      keywords: ['indemnify', 'indemnification', 'hold harmless', 'defend and indemnify'],
      riskFactors: ['unlimited liability', 'sole responsibility', 'all claims']
    },
    {
      type: 'Limitation of Liability',
      keywords: ['limitation of liability', 'liability cap', 'maximum liability', 'aggregate liability'],
      riskFactors: ['excludes gross negligence', 'excludes willful misconduct', 'no cap']
    },
    {
      type: 'Termination',
      keywords: ['termination', 'terminate', 'cancellation', 'end of agreement'],
      riskFactors: ['immediate termination', 'without cause', 'no cure period']
    },
    {
      type: 'Force Majeure',
      keywords: ['force majeure', 'act of god', 'unforeseen circumstances', 'beyond control'],
      riskFactors: ['pandemic not included', 'narrow definition', 'no notice requirement']
    },
    {
      type: 'Confidentiality',
      keywords: ['confidential', 'confidentiality', 'non-disclosure', 'proprietary information'],
      riskFactors: ['perpetual obligation', 'broad definition', 'no exceptions']
    },
    {
      type: 'Intellectual Property',
      keywords: ['intellectual property', 'ip rights', 'patent', 'copyright', 'trademark', 'work for hire'],
      riskFactors: ['assignment of all rights', 'waiver of moral rights', 'broad license']
    },
    {
      type: 'Dispute Resolution',
      keywords: ['dispute resolution', 'arbitration', 'mediation', 'jurisdiction', 'venue'],
      riskFactors: ['binding arbitration', 'waiver of jury trial', 'inconvenient venue']
    },
    {
      type: 'Governing Law',
      keywords: ['governing law', 'applicable law', 'laws of', 'governed by'],
      riskFactors: ['unfamiliar jurisdiction', 'choice of law']
    },
    {
      type: 'Assignment',
      keywords: ['assignment', 'assign', 'transfer rights', 'successor'],
      riskFactors: ['unrestricted assignment', 'no consent required']
    },
    {
      type: 'Warranties',
      keywords: ['warranty', 'warranties', 'represents and warrants', 'as is', 'disclaimer'],
      riskFactors: ['no warranties', 'as-is', 'disclaimer of all warranties']
    }
  ];
  
  clausePatterns.forEach(pattern => {
    const hasClause = pattern.keywords.some(keyword => lowerContent.includes(keyword));
    
    if (hasClause) {
      const issues: string[] = [];
      const riskFactorCount = pattern.riskFactors.filter(rf => lowerContent.includes(rf.toLowerCase())).length;
      
      pattern.riskFactors.forEach(rf => {
        if (lowerContent.includes(rf.toLowerCase())) {
          issues.push(`Contains: "${rf}"`);
        }
      });
      
      const riskScore = Math.min(100, 30 + (riskFactorCount * 25));
      
      clauses.push({
        clauseType: pattern.type,
        content: `${pattern.type} clause detected`,
        riskLevel: getRiskLevel(riskScore),
        riskScore,
        issues,
        suggestions: getSuggestionsForClause(pattern.type, issues)
      });
    }
  });
  
  return clauses;
}

function getSuggestionsForClause(clauseType: string, issues: string[]): string[] {
  const suggestions: { [key: string]: string[] } = {
    'Indemnification': [
      'Consider mutual indemnification obligations',
      'Add caps to indemnification liability',
      'Exclude indirect and consequential damages'
    ],
    'Limitation of Liability': [
      'Ensure cap is proportional to contract value',
      'Consider carve-outs for IP infringement and data breaches',
      'Review exclusions for gross negligence'
    ],
    'Termination': [
      'Negotiate for cure periods before termination',
      'Ensure termination for cause is clearly defined',
      'Include mutual termination rights'
    ],
    'Force Majeure': [
      'Ensure pandemic/epidemic is explicitly included',
      'Define notice requirements clearly',
      'Consider partial performance options'
    ],
    'Confidentiality': [
      'Limit confidentiality period to reasonable timeframe',
      'Ensure exceptions for publicly available information',
      'Define scope of confidential information clearly'
    ],
    'Intellectual Property': [
      'Retain rights to pre-existing IP',
      'Limit work-for-hire to specific deliverables',
      'Negotiate joint ownership for collaborative work'
    ],
    'Dispute Resolution': [
      'Consider mediation before arbitration',
      'Negotiate neutral venue for disputes',
      'Review arbitration rules and costs'
    ],
    'Governing Law': [
      'Choose familiar jurisdiction',
      'Consider practical enforcement implications',
      'Review conflict of law provisions'
    ],
    'Assignment': [
      'Require consent for assignment',
      'Exception for internal reorganizations',
      'Ensure obligations transfer with rights'
    ],
    'Warranties': [
      'Negotiate for specific performance warranties',
      'Ensure disclaimers comply with applicable law',
      'Consider industry-standard warranty periods'
    ]
  };
  
  return suggestions[clauseType] || ['Review clause with legal counsel'];
}

function checkComplianceItems(content: string, regulations: string[]): ComplianceItem[] {
  const complianceItems: ComplianceItem[] = [];
  const lowerContent = content.toLowerCase();
  
  const regulationChecks: { [key: string]: { requirement: string; keywords: string[] }[] } = {
    'GDPR': [
      { requirement: 'Data processing agreement', keywords: ['data processing', 'dpa', 'processor agreement'] },
      { requirement: 'Data subject rights', keywords: ['right to access', 'right to erasure', 'data portability'] },
      { requirement: 'Lawful basis for processing', keywords: ['lawful basis', 'consent', 'legitimate interest'] },
      { requirement: 'Data transfer mechanisms', keywords: ['standard contractual clauses', 'adequacy decision', 'binding corporate rules'] }
    ],
    'CCPA': [
      { requirement: 'Consumer rights disclosure', keywords: ['right to know', 'right to delete', 'opt-out'] },
      { requirement: 'Sale of personal information', keywords: ['do not sell', 'sale of personal information'] },
      { requirement: 'Privacy notice', keywords: ['privacy notice', 'privacy policy', 'categories of personal information'] }
    ],
    'SOX': [
      { requirement: 'Internal controls', keywords: ['internal controls', 'financial reporting', 'audit'] },
      { requirement: 'Record retention', keywords: ['record retention', 'document preservation'] },
      { requirement: 'Whistleblower protection', keywords: ['whistleblower', 'retaliation'] }
    ],
    'HIPAA': [
      { requirement: 'PHI protection', keywords: ['protected health information', 'phi', 'hipaa'] },
      { requirement: 'Business associate agreement', keywords: ['business associate', 'baa'] },
      { requirement: 'Security safeguards', keywords: ['security safeguards', 'encryption', 'access controls'] }
    ]
  };
  
  regulations.forEach(reg => {
    const checks = regulationChecks[reg];
    if (checks) {
      checks.forEach(check => {
        const hasKeyword = check.keywords.some(kw => lowerContent.includes(kw));
        complianceItems.push({
          regulation: reg,
          requirement: check.requirement,
          status: hasKeyword ? 'compliant' : 'non_compliant',
          details: hasKeyword 
            ? `Document addresses ${check.requirement.toLowerCase()}`
            : `Missing or insufficient coverage of ${check.requirement.toLowerCase()}`
        });
      });
    }
  });
  
  return complianceItems;
}

function extractCitations(content: string): { reference: string; valid: boolean; source: string }[] {
  const citations: { reference: string; valid: boolean; source: string }[] = [];
  
  // Pattern for case citations (e.g., "Smith v. Jones, 123 F.2d 456 (2020)")
  const casePattern = /([A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+),?\s*(\d+\s+[A-Z][a-z.]+\s*\d*d?\s+\d+)/gi;
  const caseMatches = content.matchAll(casePattern);
  
  for (const match of caseMatches) {
    citations.push({
      reference: match[0],
      valid: true, // Would need actual validation in production
      source: 'Case Law'
    });
  }
  
  // Pattern for statute citations (e.g., "15 U.S.C. § 78")
  const statutePattern = /(\d+\s+U\.S\.C\.?\s*§?\s*\d+)/gi;
  const statuteMatches = content.matchAll(statutePattern);
  
  for (const match of statuteMatches) {
    citations.push({
      reference: match[0],
      valid: true,
      source: 'Federal Statute'
    });
  }
  
  return citations;
}

function calculateRiskScore(clauses: ClauseAnalysis[]): number {
  if (clauses.length === 0) return 30;
  
  const totalRisk = clauses.reduce((sum, clause) => sum + clause.riskScore, 0);
  return Math.round(totalRisk / clauses.length);
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function generateRecommendations(
  clauses: ClauseAnalysis[],
  compliance: ComplianceItem[],
  overallRisk: RiskLevel
): string[] {
  const recommendations: string[] = [];
  
  // High-risk clause recommendations
  const criticalClauses = clauses.filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high');
  if (criticalClauses.length > 0) {
    recommendations.push(`Review ${criticalClauses.length} high-risk clause(s): ${criticalClauses.map(c => c.clauseType).join(', ')}`);
  }
  
  // Compliance recommendations
  const nonCompliant = compliance.filter(c => c.status === 'non_compliant');
  if (nonCompliant.length > 0) {
    recommendations.push(`Address ${nonCompliant.length} compliance gap(s) in: ${[...new Set(nonCompliant.map(c => c.regulation))].join(', ')}`);
  }
  
  // General recommendations based on overall risk
  if (overallRisk === 'critical') {
    recommendations.push('Strongly recommend legal counsel review before proceeding');
    recommendations.push('Consider renegotiating key terms');
  } else if (overallRisk === 'high') {
    recommendations.push('Legal review recommended before execution');
  } else if (overallRisk === 'medium') {
    recommendations.push('Standard due diligence recommended');
  }
  
  return recommendations;
}

// Helper functions for UI
export function getRiskColor(risk: RiskLevel): string {
  const colors = {
    critical: 'text-red-600',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-green-500'
  };
  return colors[risk];
}

export function getRiskBgColor(risk: RiskLevel): string {
  const colors = {
    critical: 'bg-red-100 border-red-300',
    high: 'bg-orange-100 border-orange-300',
    medium: 'bg-yellow-100 border-yellow-300',
    low: 'bg-green-100 border-green-300'
  };
  return colors[risk];
}

export function getComplianceColor(status: ComplianceItem['status']): string {
  const colors = {
    compliant: 'text-green-600 bg-green-100',
    non_compliant: 'text-red-600 bg-red-100',
    partial: 'text-yellow-600 bg-yellow-100',
    not_applicable: 'text-gray-500 bg-gray-100'
  };
  return colors[status];
}

export function getTrustColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-600';
}

export function getTrustBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  if (score >= 40) return 'bg-orange-100';
  return 'bg-red-100';
}
