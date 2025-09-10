import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Share2, 
  Copy, 
  FileText, 
  Image, 
  Mail,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface VerificationData {
  id: string;
  content: string;
  contentType: string;
  trustScore: number;
  status: string;
  summary: string;
  sources: any[];
  createdAt: string;
  processingTime?: number;
}

interface VerificationExportProps {
  verifications: any[];
  verification?: VerificationData;
  onShare?: () => void;
}

export const VerificationExport: React.FC<VerificationExportProps> = ({
  verifications,
  verification,
  onShare
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const generateReportData = () => {
    const reportData = {
      verification_id: verification.id,
      timestamp: new Date(verification.createdAt).toISOString(),
      content: {
        type: verification.contentType,
        text: verification.content.substring(0, 500) + (verification.content.length > 500 ? '...' : ''),
        full_content: verification.content
      },
      analysis: {
        trust_score: verification.trustScore,
        status: verification.status,
        summary: verification.summary,
        processing_time_ms: verification.processingTime
      },
      sources: verification.sources.map(source => ({
        url: source.url,
        title: source.title,
        reliability_score: source.reliability_score,
        content_snippet: source.content_snippet
      })),
      metadata: {
        generated_at: new Date().toISOString(),
        ai_model: 'Llama-3.1-Sonar-Large-128k',
        verification_method: 'AI-Powered Fact Checking'
      }
    };

    return reportData;
  };

  const exportAsJSON = async () => {
    try {
      setIsExporting(true);
      const reportData = generateReportData();
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `verification-report-${verification.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Verification report downloaded as JSON",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export verification report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    try {
      setIsExporting(true);
      const reportData = generateReportData();
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 10;
      let yPosition = margin;

      // Helper function to add text with wrapping
      const addText = (text: string, fontSize = 12, isBold = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) pdf.setFont(undefined, 'bold');
        else pdf.setFont(undefined, 'normal');
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += 5; // Extra spacing
      };

      // Header
      addText('VERIFICATION REPORT', 20, true);
      addText(`Report ID: ${verification.id}`, 10);
      addText(`Generated: ${new Date().toLocaleString()}`, 10);
      yPosition += 10;

      // Content Analysis
      addText('CONTENT ANALYSIS', 16, true);
      addText(`Content Type: ${verification.contentType.toUpperCase()}`, 12);
      addText(`Trust Score: ${verification.trustScore}%`, 12, true);
      addText(`Status: ${verification.status.toUpperCase()}`, 12);
      yPosition += 5;

      addText('Content:', 12, true);
      addText(verification.content.substring(0, 1000) + (verification.content.length > 1000 ? '...' : ''), 10);
      yPosition += 10;

      // Analysis Summary
      addText('ANALYSIS SUMMARY', 16, true);
      addText(verification.summary, 10);
      yPosition += 10;

      // Sources
      if (verification.sources.length > 0) {
        addText('SUPPORTING SOURCES', 16, true);
        verification.sources.forEach((source, index) => {
          addText(`${index + 1}. ${source.title}`, 12, true);
          addText(`   URL: ${source.url}`, 10);
          addText(`   Reliability: ${source.reliability_score}%`, 10);
          addText(`   ${source.content_snippet}`, 10);
          yPosition += 5;
        });
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'italic');
      pdf.text('Generated by VeriEdit AI - Advanced Content Verification Platform', margin, pdf.internal.pageSize.getHeight() - 10);

      pdf.save(`verification-report-${verification.id}.pdf`);

      toast({
        title: "Export Successful",
        description: "Verification report downloaded as PDF",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export verification report as PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsImage = async () => {
    try {
      setIsExporting(true);
      
      // Create a temporary div with the verification summary
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      
      tempDiv.innerHTML = `
        <div style="border: 2px solid #e5e7eb; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 28px;">VeriEdit AI Verification</h1>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">Content Authenticity Report</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h3 style="color: #374151; margin: 0 0 5px 0;">Trust Score</h3>
              <div style="font-size: 36px; font-weight: bold; color: ${verification.trustScore >= 70 ? '#22c55e' : verification.trustScore >= 40 ? '#eab308' : '#ef4444'};">
                ${verification.trustScore}%
              </div>
            </div>
            <div>
              <h3 style="color: #374151; margin: 0 0 5px 0;">Status</h3>
              <span style="background: ${verification.status === 'completed' ? '#dcfce7' : '#fef3c7'}; color: ${verification.status === 'completed' ? '#166534' : '#92400e'}; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
                ${verification.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 10px 0;">Content</h3>
            <p style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #374151; line-height: 1.5; margin: 0;">
              ${verification.content.substring(0, 200)}${verification.content.length > 200 ? '...' : ''}
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0 0 10px 0;">Analysis Summary</h3>
            <p style="color: #4b5563; line-height: 1.6; margin: 0;">
              ${verification.summary.substring(0, 300)}${verification.summary.length > 300 ? '...' : ''}
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Report ID: ${verification.id} • Generated: ${new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true
      });
      
      document.body.removeChild(tempDiv);
      
      // Download the image
      const link = document.createElement('a');
      link.download = `verification-report-${verification.id}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Export Successful",
        description: "Verification report downloaded as image",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export verification report as image",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const reportText = `VeriEdit AI Verification Report
      
Report ID: ${verification.id}
Content Type: ${verification.contentType}
Trust Score: ${verification.trustScore}%
Status: ${verification.status}

Content: ${verification.content}

Analysis: ${verification.summary}

Generated: ${new Date().toLocaleString()}`;

      await navigator.clipboard.writeText(reportText);
      toast({
        title: "Copied to Clipboard",
        description: "Verification report copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Verification Report - ${verification.id}`);
    const body = encodeURIComponent(`VeriEdit AI Verification Report

Content: ${verification.content.substring(0, 100)}...
Trust Score: ${verification.trustScore}%
Status: ${verification.status}

Full analysis: ${verification.summary}

Generated: ${new Date().toLocaleString()}
Report ID: ${verification.id}`);

    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const getStatusIcon = () => {
    switch (verification.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <CardTitle>Export & Share</CardTitle>
        </div>
        <CardDescription>
          Download or share your verification results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                  onClick={exportAsPDF}
                  disabled={isExporting}
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs">PDF Report</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                  onClick={exportAsImage}
                  disabled={isExporting}
                >
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Image</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2"
                  onClick={exportAsJSON}
                  disabled={isExporting}
                >
                  <Download className="h-6 w-6" />
                  <span className="text-xs">JSON Data</span>
                </Button>
              </motion.div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="font-medium">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Text
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareViaEmail}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="share" className="space-y-4 mt-6">
            {/* Verification Summary for Sharing */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium">Verification Summary</span>
                </div>
                <Badge variant="outline">
                  Trust Score: {verification.trustScore}%
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                Content: {verification.content.substring(0, 100)}...
              </p>
              
              <p className="text-xs text-muted-foreground">
                Report ID: {verification.id} • {new Date(verification.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Share Options</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    const url = `${window.location.origin}/verification/${verification.id}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "Link Copied", description: "Verification link copied to clipboard" });
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Copy Shareable Link
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={shareViaEmail}
                >
                  <Mail className="h-4 w-4" />
                  Share via Email
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground">
              <p>• PDF reports include full analysis and sources</p>
              <p>• Images are perfect for social media sharing</p>
              <p>• JSON format for technical integration</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};