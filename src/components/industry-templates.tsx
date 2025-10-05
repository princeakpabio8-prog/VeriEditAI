import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Heart, FileText, Shield, CheckCircle2, Users } from 'lucide-react';

interface TemplateConfig {
  id: string;
  name: string;
  industry: 'bank' | 'ngo';
  icon: React.ReactNode;
  description: string;
  verificationFocus: string[];
  suggestedContent: string;
}

const templates: TemplateConfig[] = [
  {
    id: 'bank-kyc',
    name: 'KYC Document Verification',
    industry: 'bank',
    icon: <Shield className="h-5 w-5" />,
    description: 'Verify customer identity documents and detect fraud patterns',
    verificationFocus: ['Document authenticity', 'Identity fraud', 'Data consistency'],
    suggestedContent: 'Upload ID cards, passports, utility bills, or bank statements'
  },
  {
    id: 'bank-transaction',
    name: 'Transaction Fraud Detection',
    industry: 'bank',
    icon: <Building2 className="h-5 w-5" />,
    description: 'Analyze transaction claims for fraud indicators and anomalies',
    verificationFocus: ['Fraud patterns', 'Unusual claims', 'Source verification'],
    suggestedContent: 'Paste transaction descriptions, customer claims, or payment disputes'
  },
  {
    id: 'bank-compliance',
    name: 'Regulatory Compliance Check',
    industry: 'bank',
    icon: <FileText className="h-5 w-5" />,
    description: 'Verify compliance documents and regulatory statements',
    verificationFocus: ['Regulatory accuracy', 'Legal compliance', 'Policy adherence'],
    suggestedContent: 'Upload compliance reports, regulatory filings, or policy documents'
  },
  {
    id: 'ngo-grant',
    name: 'Grant Proposal Verification',
    industry: 'ngo',
    icon: <Heart className="h-5 w-5" />,
    description: 'Verify claims in grant applications and funding proposals',
    verificationFocus: ['Statistical accuracy', 'Citation validity', 'Impact claims'],
    suggestedContent: 'Paste grant proposals, funding applications, or impact reports'
  },
  {
    id: 'ngo-program',
    name: 'Program Report Validation',
    industry: 'ngo',
    icon: <CheckCircle2 className="h-5 w-5" />,
    description: 'Validate program outcomes, statistics, and community claims',
    verificationFocus: ['Outcome verification', 'Data accuracy', 'Source credibility'],
    suggestedContent: 'Upload program reports, impact assessments, or community surveys'
  },
  {
    id: 'ngo-media',
    name: 'Media & Misinformation Check',
    industry: 'ngo',
    icon: <Users className="h-5 w-5" />,
    description: 'Combat misinformation in communications and media content',
    verificationFocus: ['Fact-checking', 'Source validation', 'Misinformation detection'],
    suggestedContent: 'Paste social media posts, news articles, or public statements'
  }
];

interface IndustryTemplatesProps {
  onSelectTemplate: (template: TemplateConfig) => void;
  selectedIndustry?: 'bank' | 'ngo' | 'all';
}

export const IndustryTemplates: React.FC<IndustryTemplatesProps> = ({ 
  onSelectTemplate, 
  selectedIndustry = 'all' 
}) => {
  const filteredTemplates = selectedIndustry === 'all' 
    ? templates 
    : templates.filter(t => t.industry === selectedIndustry);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Industry Templates</h3>
        <p className="text-sm text-muted-foreground">
          Pre-configured verification workflows for banks and NGOs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {template.icon}
                  <Badge variant={template.industry === 'bank' ? 'default' : 'secondary'}>
                    {template.industry.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-base mt-2">{template.name}</CardTitle>
              <CardDescription className="text-xs">{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Verification Focus:</p>
                <div className="flex flex-wrap gap-1">
                  {template.verificationFocus.map((focus, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {focus}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground italic">{template.suggestedContent}</p>
              </div>
              <Button 
                onClick={() => onSelectTemplate(template)} 
                className="w-full"
                size="sm"
              >
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
