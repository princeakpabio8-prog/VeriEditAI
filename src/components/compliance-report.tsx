import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Download, FileText, Shield, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface ComplianceMetrics {
  totalVerifications: number;
  highRiskDetected: number;
  fraudAlertsTriggered: number;
  complianceRate: number;
  averageConfidence: number;
  topRiskCategories: { category: string; count: number }[];
}

interface ComplianceReportProps {
  metrics: ComplianceMetrics;
  industry: 'bank' | 'ngo';
  dateRange: { start: Date; end: Date };
}

export const ComplianceReport: React.FC<ComplianceReportProps> = ({ 
  metrics, 
  industry,
  dateRange 
}) => {
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.text(`${industry === 'bank' ? 'Banking' : 'NGO'} Compliance Report`, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Period: ${format(dateRange.start, 'PP')} - ${format(dateRange.end, 'PP')}`, pageWidth / 2, 34, { align: 'center' });
    
    // Metrics
    doc.setFontSize(14);
    doc.text('Executive Summary', 14, 50);
    
    doc.setFontSize(10);
    let yPos = 60;
    
    const reportData = [
      ['Total Verifications Processed', metrics.totalVerifications.toString()],
      ['High Risk Items Detected', metrics.highRiskDetected.toString()],
      ['Fraud Alerts Triggered', metrics.fraudAlertsTriggered.toString()],
      ['Compliance Rate', `${metrics.complianceRate.toFixed(1)}%`],
      ['Average Confidence Score', `${metrics.averageConfidence.toFixed(1)}%`]
    ];
    
    reportData.forEach(([label, value]) => {
      doc.text(`${label}:`, 14, yPos);
      doc.text(value, 120, yPos);
      yPos += 8;
    });
    
    // Risk Categories
    if (metrics.topRiskCategories.length > 0) {
      yPos += 10;
      doc.setFontSize(14);
      doc.text('Top Risk Categories', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      metrics.topRiskCategories.slice(0, 5).forEach((cat, idx) => {
        doc.text(`${idx + 1}. ${cat.category}: ${cat.count} incidents`, 14, yPos);
        yPos += 8;
      });
    }
    
    // Recommendations
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Recommendations', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    const recommendations = industry === 'bank' 
      ? [
          'Continue monitoring high-risk transaction patterns',
          'Enhance KYC verification processes for flagged accounts',
          'Review fraud detection thresholds quarterly',
          'Provide additional training on emerging fraud patterns'
        ]
      : [
          'Verify data sources in grant applications more rigorously',
          'Implement citation checking for impact claims',
          'Cross-reference program statistics with third-party data',
          'Establish fact-checking protocols for public communications'
        ];
    
    recommendations.forEach((rec, idx) => {
      const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, pageWidth - 28);
      doc.text(lines, 14, yPos);
      yPos += lines.length * 6;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.text('This report is confidential and intended for internal compliance use only.', pageWidth / 2, 280, { align: 'center' });
    
    doc.save(`compliance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Dashboard
              </CardTitle>
              <CardDescription>
                {industry === 'bank' ? 'Banking Regulatory' : 'NGO Accountability'} Metrics
              </CardDescription>
            </div>
            <Button onClick={generatePDFReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Verifications</p>
              <p className="text-2xl font-bold">{metrics.totalVerifications}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">High Risk Detected</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-destructive">{metrics.highRiskDetected}</p>
                {metrics.highRiskDetected > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fraud Alerts</p>
              <p className="text-2xl font-bold text-destructive">{metrics.fraudAlertsTriggered}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Compliance Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-green-600">{metrics.complianceRate.toFixed(1)}%</p>
                {metrics.complianceRate >= 90 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </div>

          {/* Risk Categories */}
          {metrics.topRiskCategories.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Risk Categories
              </h4>
              <div className="space-y-2">
                {metrics.topRiskCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{cat.category}</span>
                    <Badge variant={cat.count > 5 ? 'destructive' : 'secondary'}>
                      {cat.count} incidents
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Industry-Specific Guidance */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {industry === 'bank' ? 'Regulatory Compliance' : 'Accountability Standards'}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {industry === 'bank' ? (
                <>
                  <li>KYC verification rate: {metrics.complianceRate >= 95 ? '✓ Excellent' : '⚠ Needs improvement'}</li>
                  <li>Fraud detection response: {metrics.fraudAlertsTriggered === 0 ? '✓ No alerts' : `⚠ ${metrics.fraudAlertsTriggered} alerts require review`}</li>
                  <li>Average verification confidence: {metrics.averageConfidence >= 80 ? '✓ High' : '⚠ Consider manual review'}</li>
                </>
              ) : (
                <>
                  <li>Grant verification thoroughness: {metrics.complianceRate >= 90 ? '✓ Excellent' : '⚠ Needs improvement'}</li>
                  <li>Source credibility check: {metrics.averageConfidence >= 75 ? '✓ Strong' : '⚠ Strengthen verification'}</li>
                  <li>Misinformation detection: {metrics.highRiskDetected === 0 ? '✓ Clean' : `⚠ ${metrics.highRiskDetected} items flagged`}</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
