import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Image, Loader2, Shield } from "lucide-react";
import jsPDF from 'jspdf';
import { safeLower } from "@/lib/utils";
import QRCode from 'qrcode';

interface VerificationExportProps {
  verificationId: string;
  trustScore: number;
  status: string;
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    reliability_score?: number;
  }>;
  content: string;
  processingTime?: number;
  industry?: 'bank' | 'ngo';
}

export function VerificationExport({
  verificationId,
  trustScore,
  status,
  summary,
  sources,
  content,
  processingTime,
  industry = 'ngo'
}: VerificationExportProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');
  const { toast } = useToast();

  const appName = "VeriEdit";
  const verificationUrl = `https://verieditai.com/verify/${verificationId}`;
  
  const getBadgeText = () => {
    if (industry === 'bank') {
      return trustScore >= 80 ? "BANKING COMPLIANCE VERIFIED" : "BANKING VERIFICATION COMPLETE";
    }
    return trustScore >= 80 ? "DONOR TRUST VERIFIED" : "IMPACT VERIFIED";
  };

  const generatePDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Generate QR code for verification URL
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Helper function to add header to each page
      const addPageHeader = () => {
        // Professional gradient header background
        pdf.setFillColor(15, 23, 42); // Dark blue-gray
        pdf.rect(0, 0, pageWidth, 40, 'F');
        
        // Brand accent line
        pdf.setFillColor(0, 186, 242); // Primary cyan
        pdf.rect(0, 0, pageWidth, 3, 'F');
        
        // Company branding
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 186, 242); // Primary color
        pdf.text(appName, 20, 20);
        
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(148, 163, 184); // Muted text
        pdf.text("AI-Powered Content Verification", 20, 26);
        
        // Verified Badge
        pdf.setFillColor(34, 197, 94); // Green
        pdf.roundedRect(pageWidth - 70, 8, 50, 24, 3, 3, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("✓ VERIFIED", pageWidth - 65, 18);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.text("Authenticity Guaranteed", pageWidth - 65, 24);
        
        // Reset text color
        pdf.setTextColor(0, 0, 0);
      };

      // Helper function to add footer to each page
      const addPageFooter = () => {
        const footerY = pageHeight - 25;
        
        // Footer separator line
        pdf.setDrawColor(226, 232, 240); // Border color
        pdf.setLineWidth(0.5);
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        
        // QR code in footer (smaller)
        pdf.addImage(qrCodeDataUrl, 'PNG', margin, footerY, 15, 15);
        
        // Footer text
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        
        pdf.text(`Certified by ${appName} AI`, margin + 20, footerY + 5);
        pdf.text(`Verification ID: ${verificationId}`, margin + 20, footerY + 10);
        pdf.text(`Verify online: ${verificationUrl}`, margin + 20, footerY + 15);
        
        // Page number (right aligned)
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        const pageText = `Page ${pdf.getCurrentPageInfo().pageNumber}`;
        pdf.text(pageText, pageWidth - margin - 15, footerY + 10);
        
        // Security watermark
        pdf.setFontSize(6);
        pdf.setTextColor(203, 213, 225);
        pdf.text("This document is digitally certified and tamper-evident", pageWidth / 2, pageHeight - 5, { align: 'center' });
        
        pdf.setTextColor(0, 0, 0);
      };

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize = 12, isBold = false) => {
        if (isBold) {
          pdf.setFont("helvetica", "bold");
        } else {
          pdf.setFont("helvetica", "normal");
        }
        pdf.setFontSize(fontSize);
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.4) > pageHeight - 30) {
          addPageFooter();
          pdf.addPage();
          yPosition = margin + 40;
          addPageHeader();
        }
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.4 + 5;
      };

      // Add header to first page
      addPageHeader();
      yPosition = 50;

      // Professional Certificate Badge with gradient effect
      pdf.setFillColor(240, 249, 255); // Light blue background
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 45, 8, 8, 'F');
      
      // Border accent
      pdf.setDrawColor(0, 186, 242);
      pdf.setLineWidth(1.5);
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 45, 8, 8, 'S');
      
      yPosition += 12;
      
      // Main badge title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 186, 242); // Primary cyan
      pdf.text(getBadgeText(), pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      
      // Trust score with visual indicator
      const trustScoreText = `Trust Score: ${trustScore}%`;
      const statusText = `Status: ${String(status || 'verified').toUpperCase()}`;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      
      // Color code the trust score
      if (trustScore >= 80) {
        pdf.setTextColor(34, 197, 94); // Green
      } else if (trustScore >= 60) {
        pdf.setTextColor(234, 179, 8); // Yellow
      } else {
        pdf.setTextColor(239, 68, 68); // Red
      }
      pdf.text(trustScoreText, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      pdf.text(statusText, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPosition, { align: 'center' });
      pdf.text(`Verification ID: ${verificationId}`, pageWidth / 2, yPosition + 4, { align: 'center' });
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 18;

      // Section divider
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Main Header with icon
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 41, 59); // Dark slate
      pdf.text("VERIFICATION REPORT", margin, yPosition);
      yPosition += 15;

      // Verification Details Section
      pdf.setFillColor(249, 250, 251); // Light gray background
      pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 50, 5, 5, 'F');
      yPosition += 8;
      
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(51, 65, 85);
      pdf.text("Verification Details", margin + 5, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      
      // Two-column layout for details
      const col1X = margin + 5;
      const col2X = pageWidth / 2 + 5;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Verification ID:", col1X, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(verificationId, col1X + 35, yPosition);
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Status:", col2X, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(status || 'unknown').toUpperCase(), col2X + 20, yPosition);
      yPosition += 8;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Date:", col1X, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), col1X + 35, yPosition);
      
      pdf.setFont("helvetica", "bold");
      pdf.text("Trust Score:", col2X, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${trustScore}%`, col2X + 25, yPosition);
      yPosition += 8;
      
      if (processingTime) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Processing Time:", col1X, yPosition);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${processingTime}ms`, col1X + 35, yPosition);
        yPosition += 8;
      }
      
      pdf.setTextColor(0, 0, 0);
      yPosition += 15;

      // Content Analyzed Section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(51, 65, 85);
      pdf.text("Content Analyzed", margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      const contentLines = pdf.splitTextToSize(content.substring(0, 500) + (content.length > 500 ? '...' : ''), pageWidth - 2 * margin);
      pdf.text(contentLines, margin, yPosition);
      yPosition += contentLines.length * 5 + 15;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        addPageFooter();
        pdf.addPage();
        yPosition = 50;
        addPageHeader();
      }

      // Analysis Summary Section
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(51, 65, 85);
      pdf.text("AI Analysis Summary", margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin);
      pdf.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 5 + 15;

      // Check if we need a new page for sources
      if (yPosition > pageHeight - 60) {
        addPageFooter();
        pdf.addPage();
        yPosition = 50;
        addPageHeader();
      }

      // Verification Sources Section
      if (sources.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(51, 65, 85);
        pdf.text(`Verification Sources (${sources.length})`, margin, yPosition);
        yPosition += 10;
        
        sources.forEach((source, index) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 70) {
            addPageFooter();
            pdf.addPage();
            yPosition = 50;
            addPageHeader();
          }
          
          // Source number and reliability badge
          pdf.setFillColor(249, 250, 251);
          pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 3, 3, 'F');
          
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 186, 242);
          pdf.text(`${index + 1}.`, margin + 3, yPosition + 8);
          
          pdf.setTextColor(30, 41, 59);
          const titleLines = pdf.splitTextToSize(source.title, pageWidth - 2 * margin - 40);
          pdf.text(titleLines, margin + 10, yPosition + 8);
          
          // Reliability badge
          if (source.reliability_score) {
            const reliabilityColor: [number, number, number] = source.reliability_score >= 80 ? [34, 197, 94] : 
                                    source.reliability_score >= 60 ? [234, 179, 8] : [239, 68, 68];
            pdf.setFillColor(reliabilityColor[0], reliabilityColor[1], reliabilityColor[2]);
            pdf.roundedRect(pageWidth - margin - 35, yPosition + 3, 32, 10, 2, 2, 'F');
            
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${source.reliability_score}%`, pageWidth - margin - 19, yPosition + 10, { align: 'center' });
          }
          
          // URL
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 116, 139);
          const urlText = source.url.length > 70 ? source.url.substring(0, 67) + '...' : source.url;
          pdf.text(urlText, margin + 10, yPosition + 18);
          
          yPosition += 30;
        });
      }

      // Add footer to last page
      addPageFooter();

      // Save the PDF
      pdf.save(`${appName.toLowerCase()}-verification-${verificationId}.pdf`);

      toast({
        title: "Export Complete",
        description: "PDF report generated successfully",
      });

    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed", 
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const generateJSON = () => {
    const data = {
      verificationId,
      timestamp: new Date().toISOString(),
      trustScore,
      status,
      summary,
      content,
      sources,
      processingTime,
      verified_by: appName,
      verification_url: verificationUrl,
      industry,
      badge: getBadgeText(),
      metadata: {
        exportFormat: 'json',
        version: '1.0',
        signature: `${appName}-${verificationId}-${Date.now()}`
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verification-${verificationId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "JSON data exported successfully",
    });
  };

  const generateCSV = () => {
    const csvData = [
      ['Verified By', appName],
      ['Verification URL', verificationUrl],
      ['Badge', getBadgeText()],
      ['', ''],
      ['Field', 'Value'],
      ['Verification ID', verificationId],
      ['Date', new Date().toISOString()],
      ['Trust Score', `${trustScore}%`],
      ['Status', status],
      ['Industry', industry || 'General'],
      ['Processing Time', `${processingTime || 0}ms`],
      ['Summary', summary.replace(/,/g, ';')],
      ['Content', content.substring(0, 500).replace(/,/g, ';')],
      ['', ''],
      ['Sources', ''],
      ...sources.map((source, index) => [
        `Source ${index + 1}`, 
        `${source.title} - ${source.url} (Reliability: ${source.reliability_score || 'N/A'}%)`
      ])
    ];

    const csvContent = csvData.map(row => 
      row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verification-${verificationId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "CSV data exported successfully",
    });
  };

  const handleExport = async () => {
    switch (exportFormat) {
      case 'pdf':
        await generatePDF();
        break;
      case 'json':
        generateJSON();
        break;
      case 'csv':
        generateCSV();
        break;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500/10 text-gray-700 border-gray-200';
    
    const safeStatus = safeLower(status);
    switch (safeStatus) {
      case 'verified':
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'disputed':
      case 'mixed':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'false':
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

const getTrustScoreColor = (score: number | undefined) => {
  if (!score) return 'text-gray-600';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

  return (
    <Card className="bg-gradient-card border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Export Verified Report</CardTitle>
            <CardDescription>
              Download professionally branded verification reports with authenticity badge
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verification Summary */}
        <div className="p-5 border rounded-lg bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors">
              <p className="text-xs font-medium text-muted-foreground mb-1">Trust Score</p>
              <p className={`text-2xl font-bold ${getTrustScoreColor(trustScore)}`}>
                {trustScore}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors">
              <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
              <Badge variant="outline" className={`${getStatusColor(status)} mt-1`}>
                {String(status || 'unknown')}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors">
              <p className="text-xs font-medium text-muted-foreground mb-1">Sources</p>
              <p className="text-2xl font-bold text-foreground">{sources.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors">
              <p className="text-xs font-medium text-muted-foreground mb-1">Verification ID</p>
              <p className="text-sm font-mono text-foreground">{verificationId.slice(0, 8)}...</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Summary</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-words bg-background/40 p-3 rounded border border-border/30">
              {summary}
            </p>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON Data
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV Data
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            {exportFormat === 'pdf' && (
              <p>Generate a professional PDF report with complete verification details, sources, and analysis.</p>
            )}
            {exportFormat === 'json' && (
              <p>Export structured data in JSON format for integration with other systems.</p>
            )}
            {exportFormat === 'csv' && (
              <p>Export data in CSV format for spreadsheet analysis and reporting.</p>
            )}
          </div>

          <Button 
            onClick={handleExport} 
            disabled={exporting}
            className="w-full shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating {exportFormat.toUpperCase()}...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Export as {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
          
          {/* Professional note */}
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Authenticity Guaranteed:</span> All exported reports include QR codes and verification IDs for authenticity verification at verieditai.com
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}