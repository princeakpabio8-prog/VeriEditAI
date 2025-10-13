import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Download, FileText, Shield, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { lower } from '@/lib/string';

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

    // Professional Header with gradient effect
    doc.setFillColor(15, 23, 42); // Dark blue-gray
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Brand accent line
    doc.setFillColor(0, 186, 242); // Primary cyan
    doc.rect(0, 0, pageWidth, 3, 'F');
    
    // Company branding
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 186, 242);
    doc.text(appName, 20, 20);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("AI-Powered Content Verification & Compliance", 20, 28);
    
    // Certified Badge
    doc.setFillColor(34, 197, 94); // Green
    doc.roundedRect(pageWidth - 70, 8, 50, 28, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("✓ CERTIFIED", pageWidth - 65, 18);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Compliance Report", pageWidth - 65, 24);
    doc.text(format(new Date(), 'PP'), pageWidth - 65, 30);
    
    doc.setTextColor(0, 0, 0);

    // Professional Certificate Badge
    doc.setFillColor(240, 249, 255); // Light blue
    doc.roundedRect(20, 55, pageWidth - 40, 50, 8, 8, 'F');
    
    // Border accent
    doc.setDrawColor(0, 186, 242);
    doc.setLineWidth(1.5);
    doc.roundedRect(20, 55, pageWidth - 40, 50, 8, 8, 'S');
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 186, 242);
    const badgeText = industry === 'bank' ? 'BANKING COMPLIANCE CERTIFIED' : 'NGO ACCOUNTABILITY CERTIFIED';
    doc.text(badgeText, pageWidth / 2, 72, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Report ID: ${reportId}`, pageWidth / 2, 84, { align: 'center' });
    doc.text(`Period: ${format(dateRange.start, 'PP')} - ${format(dateRange.end, 'PP')}`, pageWidth / 2, 92, { align: 'center' });
    
    // QR Code
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - 35, 60, 25, 25);
    
    doc.setTextColor(0, 0, 0);
    
    // Section divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 115, pageWidth - 20, 115);
    
    // Report Title
    let yPos = 125;
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`${industry === 'bank' ? 'Banking' : 'NGO'} Compliance Report`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 20;
    
    // Executive Summary Section
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, yPos, pageWidth - 40, 70, 5, 5, 'F');
    yPos += 10;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text('Executive Summary', 25, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    
    // Two-column layout for metrics
    const col1X = 25;
    const col2X = pageWidth / 2 + 5;
    
    const metricsData = [
      ['Total Verifications', metrics.totalVerifications.toString(), 'High Risk Detected', metrics.highRiskDetected.toString()],
      ['Fraud Alerts', metrics.fraudAlertsTriggered.toString(), 'Compliance Rate', `${metrics.complianceRate.toFixed(1)}%`],
      ['Avg Confidence', `${metrics.averageConfidence.toFixed(1)}%`, 'Period', `${format(dateRange.start, 'PP')} - ${format(dateRange.end, 'PP')}`]
    ];
    
    metricsData.forEach(([label1, value1, label2, value2]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label1}:`, col1X, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(value1, col1X + 45, yPos);
      
      doc.setFont("helvetica", "bold");
      doc.text(`${label2}:`, col2X, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(value2, col2X + 40, yPos);
      yPos += 8;
    });
    
    yPos += 15;
    
    // Risk Categories Section
    if (metrics.topRiskCategories.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text('Top Risk Categories', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      
      metrics.topRiskCategories.slice(0, 5).forEach((cat, idx) => {
        // Risk bar visualization
        const barWidth = (cat.count / Math.max(...metrics.topRiskCategories.map(c => c.count))) * 100;
        const barColor = cat.count > 5 ? [239, 68, 68] : [234, 179, 8];
        
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(20, yPos - 5, pageWidth - 40, 12, 2, 2, 'F');
        
        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.roundedRect(20, yPos - 5, Math.max(barWidth, 10), 12, 2, 2, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(`${idx + 1}. ${cat.category}`, 25, yPos + 2);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`${cat.count} incidents`, pageWidth - 45, yPos + 2);
        
        yPos += 16;
      });
      yPos += 10;
    }
    
    // Recommendations Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(51, 65, 85);
    doc.text('Recommendations & Action Items', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    
    const recommendations = industry === 'bank' 
      ? [
          '✓ Continue monitoring high-risk transaction patterns and implement automated alerts',
          '✓ Enhance KYC verification processes with multi-factor authentication',
          '✓ Review and update fraud detection thresholds on a quarterly basis',
          '✓ Provide comprehensive training on emerging fraud patterns and AML compliance',
          '✓ Conduct regular compliance audits and maintain detailed documentation'
        ]
      : [
          '✓ Implement rigorous source verification for all grant applications and claims',
          '✓ Establish citation checking protocols for impact reports and public statements',
          '✓ Cross-reference program statistics with independent third-party data sources',
          '✓ Develop standardized fact-checking procedures for donor communications',
          '✓ Maintain transparent reporting and regular stakeholder updates'
        ];
    
    recommendations.forEach((rec, idx) => {
      const lines = doc.splitTextToSize(rec, pageWidth - 45);
      
      // Checkbox/bullet
      doc.setFillColor(34, 197, 94);
      doc.circle(25, yPos - 2, 2, 'F');
      
      doc.text(lines, 30, yPos);
      yPos += lines.length * 6 + 4;
    });
    
    // Footer
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Certified by ${appName} | Report ID: ${reportId}`, 14, footerY);
    doc.text(`Verify online: ${verificationUrl}`, 14, footerY + 5);
    doc.text('This report is confidential and intended for internal compliance use only.', pageWidth / 2, footerY + 10, { align: 'center' });
    
    doc.save(`${lower(appName)}-compliance-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Compliance Dashboard</CardTitle>
                <CardDescription>
                  {industry === 'bank' ? 'Banking Regulatory' : 'NGO Accountability'} Performance Metrics
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={generatePDFReport} 
              variant="outline" 
              size="sm"
              className="hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-muted/60 to-muted/30 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                Total Verifications
              </p>
              <p className="text-3xl font-bold text-foreground">{metrics.totalVerifications}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:shadow-md">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" />
                High Risk Detected
              </p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-destructive">{metrics.highRiskDetected}</p>
                {metrics.highRiskDetected > 0 && <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-all duration-300 hover:shadow-md">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Fraud Alerts
              </p>
              <p className="text-3xl font-bold text-destructive">{metrics.fraudAlertsTriggered}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-md">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Compliance Rate
              </p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-green-600">{metrics.complianceRate.toFixed(1)}%</p>
                {metrics.complianceRate >= 90 && <CheckCircle2 className="h-5 w-5 text-green-600" />}
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
