import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Download, FileText, Shield, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import QRCode from 'qrcode';

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
  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const appName = "VeriEdit";
    const reportId = `RPT-${Date.now()}`;
    const verificationUrl = `https://verieditai.com/compliance/${reportId}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1
    });

    // Add header badge
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(pageWidth - 70, 10, 60, 25, 3, 3, 'F');
    
    doc.setFillColor(255, 255, 255);
    doc.circle(pageWidth - 55, 18, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("✓ CERTIFIED", pageWidth - 65, 22);
    doc.text(appName.toUpperCase(), pageWidth - 65, 28);
    
    // Add QR Code
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 35, 10, 25, 25);
    
    doc.setTextColor(0, 0, 0);

    // Compliance Badge
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(20, 45, pageWidth - 40, 30, 5, 5, 'F');
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    const badgeText = industry === 'bank' ? 'BANKING COMPLIANCE CERTIFIED' : 'NGO ACCOUNTABILITY CERTIFIED';
    doc.text(badgeText, pageWidth / 2, 58, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Report ID: ${reportId} | Generated: ${format(new Date(), 'PPP')}`, pageWidth / 2, 68, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    
    // Header
    doc.setFontSize(20);
    doc.text(`${industry === 'bank' ? 'Banking' : 'NGO'} Compliance Report`, pageWidth / 2, 90, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Period: ${format(dateRange.start, 'PP')} - ${format(dateRange.end, 'PP')}`, pageWidth / 2, 98, { align: 'center' });
    
    // Metrics
    doc.setFontSize(14);
    doc.text('Executive Summary', 14, 110);
    
    doc.setFontSize(10);
    let yPos = 120;
    
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
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Certified by ${appName} | Report ID: ${reportId}`, 14, footerY);
    doc.text(`Verify online: ${verificationUrl}`, 14, footerY + 5);
    doc.text('This report is confidential and intended for internal compliance use only.', pageWidth / 2, footerY + 10, { align: 'center' });
    
    doc.save(`${appName.toLowerCase()}-compliance-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
