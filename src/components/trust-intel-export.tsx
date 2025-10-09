import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { TrustAnalytic, TrustSnapshot } from '@/hooks/useTrustIntelligence';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TrustIntelExportProps {
  analytics: TrustAnalytic[];
  snapshots: TrustSnapshot[];
  hasProAccess: boolean;
  hasEnterpriseAccess: boolean;
}

export const TrustIntelExport = ({
  analytics,
  snapshots,
  hasProAccess,
  hasEnterpriseAccess,
}: TrustIntelExportProps) => {
  
  const exportToCSV = () => {
    if (!hasProAccess) {
      toast.error('CSV export requires Pro or Enterprise license');
      return;
    }

    const headers = ['Date', 'Region', 'Topic', 'Source', 'Trust Score', 'Verifications', 'Trend', 'Change %'];
    const rows = analytics.map(item => [
      new Date(item.created_at).toISOString().split('T')[0],
      item.region,
      item.topic,
      item.domain || item.source,
      item.average_trust_score,
      item.verification_count,
      item.trending_direction || 'stable',
      item.week_over_week_change || 0
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `veriedit-trust-intelligence-${Date.now()}.csv`;
    link.click();
    
    toast.success('CSV exported successfully');
  };

  const exportToPDF = async () => {
    if (!hasEnterpriseAccess) {
      toast.error('PDF export requires Enterprise license');
      return;
    }

    try {
      const reportElement = document.getElementById('trust-intel-dashboard');
      if (!reportElement) {
        toast.error('Report content not found');
        return;
      }

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`VeriEdit-Trust-Intelligence-Report-${Date.now()}.pdf`);
      toast.success('PDF report generated successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  return (
    <div className="flex gap-3">
      <Button 
        variant="outline" 
        onClick={exportToCSV}
        disabled={!hasProAccess}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV {!hasProAccess && '(Pro)'}
      </Button>
      
      <Button 
        variant="outline" 
        onClick={exportToPDF}
        disabled={!hasEnterpriseAccess}
      >
        <FileText className="h-4 w-4 mr-2" />
        Generate PDF Report {!hasEnterpriseAccess && '(Enterprise)'}
      </Button>
    </div>
  );
};