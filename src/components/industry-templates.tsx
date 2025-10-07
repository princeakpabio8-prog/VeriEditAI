import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Heart, FileText, Shield, CheckCircle2, Users,
  Stethoscope, Pill, Activity, GraduationCap, BookOpen, School,
  Gavel, Scale, FileCheck, Umbrella, ClipboardCheck, 
  Newspaper, Camera, Radio, Landmark, Flag
} from 'lucide-react';

interface TemplateConfig {
  id: string;
  name: string;
  industry: 'bank' | 'ngo' | 'healthcare' | 'education' | 'legal' | 'insurance' | 'media' | 'government';
  icon: React.ReactNode;
  description: string;
  verificationFocus: string[];
  suggestedContent: string;
}

const templates: TemplateConfig[] = [
  // Banking Templates
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
  // NGO Templates
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
  },
  // Healthcare Templates
  {
    id: 'healthcare-claims',
    name: 'Medical Claims Verification',
    industry: 'healthcare',
    icon: <Stethoscope className="h-5 w-5" />,
    description: 'Verify medical claims, diagnoses, and treatment records',
    verificationFocus: ['Clinical accuracy', 'Diagnosis validity', 'Treatment verification'],
    suggestedContent: 'Upload medical reports, insurance claims, or treatment summaries'
  },
  {
    id: 'healthcare-research',
    name: 'Clinical Research Validation',
    industry: 'healthcare',
    icon: <Activity className="h-5 w-5" />,
    description: 'Validate clinical trial data and research findings',
    verificationFocus: ['Research integrity', 'Data accuracy', 'Citation checking'],
    suggestedContent: 'Paste research abstracts, clinical trial results, or study protocols'
  },
  {
    id: 'healthcare-patient',
    name: 'Patient Data Integrity Check',
    industry: 'healthcare',
    icon: <Pill className="h-5 w-5" />,
    description: 'Ensure accuracy of patient records and medical histories',
    verificationFocus: ['Record consistency', 'Data completeness', 'Medication accuracy'],
    suggestedContent: 'Upload patient files, medication lists, or health records'
  },
  // Education Templates
  {
    id: 'education-citation',
    name: 'Academic Citation Verification',
    industry: 'education',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Verify citations, references, and academic sources',
    verificationFocus: ['Source validity', 'Citation accuracy', 'Plagiarism detection'],
    suggestedContent: 'Paste academic papers, essays, or research documents'
  },
  {
    id: 'education-credential',
    name: 'Student Credential Validation',
    industry: 'education',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Validate educational credentials and certificates',
    verificationFocus: ['Credential authenticity', 'Institution verification', 'Achievement validation'],
    suggestedContent: 'Upload diplomas, transcripts, or certification documents'
  },
  {
    id: 'education-research',
    name: 'Research Paper Authenticity',
    industry: 'education',
    icon: <School className="h-5 w-5" />,
    description: 'Check research papers for authenticity and academic integrity',
    verificationFocus: ['Original research', 'Methodology validation', 'Data integrity'],
    suggestedContent: 'Upload research papers, theses, or dissertation documents'
  },
  // Legal Templates
  {
    id: 'legal-document',
    name: 'Legal Document Verification',
    industry: 'legal',
    icon: <Gavel className="h-5 w-5" />,
    description: 'Verify authenticity of legal documents and contracts',
    verificationFocus: ['Document validity', 'Signature verification', 'Legal compliance'],
    suggestedContent: 'Upload contracts, agreements, or legal correspondence'
  },
  {
    id: 'legal-filing',
    name: 'Court Filing Validation',
    industry: 'legal',
    icon: <Scale className="h-5 w-5" />,
    description: 'Validate court filings and legal submissions',
    verificationFocus: ['Filing accuracy', 'Procedural compliance', 'Citation validation'],
    suggestedContent: 'Upload court documents, motions, or legal briefs'
  },
  {
    id: 'legal-contract',
    name: 'Contract Clause Analysis',
    industry: 'legal',
    icon: <FileCheck className="h-5 w-5" />,
    description: 'Analyze contract terms and identify inconsistencies',
    verificationFocus: ['Clause verification', 'Term consistency', 'Risk assessment'],
    suggestedContent: 'Paste contract text, terms of service, or licensing agreements'
  },
  // Insurance Templates
  {
    id: 'insurance-claim',
    name: 'Insurance Claim Verification',
    industry: 'insurance',
    icon: <Umbrella className="h-5 w-5" />,
    description: 'Verify insurance claims and detect fraudulent submissions',
    verificationFocus: ['Claim validity', 'Fraud detection', 'Documentation accuracy'],
    suggestedContent: 'Upload claim forms, incident reports, or supporting documents'
  },
  {
    id: 'insurance-policy',
    name: 'Policy Document Validation',
    industry: 'insurance',
    icon: <ClipboardCheck className="h-5 w-5" />,
    description: 'Validate policy documents and coverage statements',
    verificationFocus: ['Policy accuracy', 'Coverage verification', 'Terms validation'],
    suggestedContent: 'Upload insurance policies, coverage summaries, or policy amendments'
  },
  // Media/Journalism Templates
  {
    id: 'media-factcheck',
    name: 'News Article Fact-Check',
    industry: 'media',
    icon: <Newspaper className="h-5 w-5" />,
    description: 'Fact-check news articles and journalistic content',
    verificationFocus: ['Fact accuracy', 'Source credibility', 'Bias detection'],
    suggestedContent: 'Paste news articles, press releases, or media reports'
  },
  {
    id: 'media-source',
    name: 'Source Attribution Verification',
    industry: 'media',
    icon: <Radio className="h-5 w-5" />,
    description: 'Verify source citations and attributions in media content',
    verificationFocus: ['Source validation', 'Attribution accuracy', 'Quote verification'],
    suggestedContent: 'Paste articles with quotes, interviews, or source citations'
  },
  {
    id: 'media-image',
    name: 'Image Authenticity Detection',
    industry: 'media',
    icon: <Camera className="h-5 w-5" />,
    description: 'Detect manipulated images and verify visual content',
    verificationFocus: ['Image manipulation', 'Context verification', 'Deepfake detection'],
    suggestedContent: 'Upload news photos, social media images, or visual evidence'
  },
  // Government Templates
  {
    id: 'government-records',
    name: 'Public Records Verification',
    industry: 'government',
    icon: <Landmark className="h-5 w-5" />,
    description: 'Verify public records and government documents',
    verificationFocus: ['Record authenticity', 'Data accuracy', 'Official validation'],
    suggestedContent: 'Upload public records, certificates, or government forms'
  },
  {
    id: 'government-statement',
    name: 'Government Statement Validation',
    industry: 'government',
    icon: <Flag className="h-5 w-5" />,
    description: 'Validate official government statements and communications',
    verificationFocus: ['Statement accuracy', 'Policy verification', 'Official source check'],
    suggestedContent: 'Paste government announcements, policy documents, or official statements'
  }
];

interface IndustryTemplatesProps {
  onSelectTemplate: (template: TemplateConfig) => void;
  selectedIndustry?: 'bank' | 'ngo' | 'healthcare' | 'education' | 'legal' | 'insurance' | 'media' | 'government' | 'all';
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
                  <Badge variant={
                    template.industry === 'bank' ? 'default' : 
                    template.industry === 'ngo' ? 'secondary' : 
                    'outline'
                  }>
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
