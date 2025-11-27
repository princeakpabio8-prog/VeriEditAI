import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface FAQ {
  question: string;
  frequency: number;
}

interface Cluster {
  theme: string;
  count: number;
  samples: string[];
}

interface Sentiment {
  positive: number;
  neutral: number;
  negative: number;
}

interface Analysis {
  faqs: FAQ[];
  clusters: Cluster[];
  sentiment: Sentiment;
  summary: string;
}

interface YouTubeReport {
  videoTitle: string;
  videoId: string;
  commentCount: number;
  totalComments: number;
  analysis: Analysis;
}

interface Props {
  report: YouTubeReport;
}

export function YouTubeReportExport({ report }: Props) {
  const exportToPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let y = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(139, 92, 246); // Purple
      pdf.text('YouTube Intelligence Report', margin, y);
      y += 10;

      // Video Title
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      const titleLines = pdf.splitTextToSize(report.videoTitle, contentWidth);
      pdf.text(titleLines, margin, y);
      y += titleLines.length * 7 + 5;

      // Metadata
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Analyzed: ${report.commentCount.toLocaleString()} of ${report.totalComments.toLocaleString()} comments`, margin, y);
      y += 7;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 12;

      // Sentiment
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Sentiment Analysis', margin, y);
      y += 7;
      pdf.setFontSize(10);
      pdf.text(`Positive: ${report.analysis.sentiment.positive}%`, margin + 5, y);
      y += 5;
      pdf.text(`Neutral: ${report.analysis.sentiment.neutral}%`, margin + 5, y);
      y += 5;
      pdf.text(`Negative: ${report.analysis.sentiment.negative}%`, margin + 5, y);
      y += 12;

      // Top Questions
      pdf.setFontSize(12);
      pdf.text('Top Questions', margin, y);
      y += 7;
      pdf.setFontSize(9);
      report.analysis.faqs.slice(0, 10).forEach((faq, idx) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        const questionLines = pdf.splitTextToSize(`${idx + 1}. ${faq.question} (${faq.frequency}x)`, contentWidth - 5);
        pdf.text(questionLines, margin + 5, y);
        y += questionLines.length * 5 + 3;
      });
      y += 7;

      // Clusters
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(12);
      pdf.text('Comment Clusters', margin, y);
      y += 7;
      pdf.setFontSize(9);
      report.analysis.clusters.forEach((cluster) => {
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFontSize(10);
        pdf.text(`${cluster.theme} (${cluster.count} comments)`, margin + 5, y);
        y += 6;
        pdf.setFontSize(8);
        cluster.samples.forEach((sample) => {
          const sampleLines = pdf.splitTextToSize(`• ${sample}`, contentWidth - 10);
          pdf.text(sampleLines, margin + 10, y);
          y += sampleLines.length * 4 + 2;
        });
        y += 5;
      });

      // Summary
      if (y > 240) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(12);
      pdf.text('Intelligence Brief', margin, y);
      y += 7;
      pdf.setFontSize(9);
      const summaryLines = pdf.splitTextToSize(report.analysis.summary, contentWidth);
      pdf.text(summaryLines, margin + 5, y);

      // Save
      pdf.save(`youtube-intelligence-${report.videoId}.pdf`);
      toast.success('Report exported!', {
        description: 'PDF downloaded successfully'
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Export failed', {
        description: 'Could not generate PDF'
      });
    }
  };

  return (
    <Button onClick={exportToPDF} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
}
