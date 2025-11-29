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

interface FlaggedComment {
  comment: string;
  type: string;
  severity: string;
  reasoning: string;
}

interface MisinfoTheme {
  theme: string;
  count: number;
}

interface FactCheckSuggestion {
  topic: string;
  relevance: string;
  factCheckUrl: string;
}

interface MisinformationAnalysis {
  truthHealthScore: number;
  riskLevel: string;
  flaggedComments: FlaggedComment[];
  commonThemes: MisinfoTheme[];
  suggestedFactChecks: FactCheckSuggestion[];
}

interface ContentRecommendation {
  title: string;
  reasoning: string;
  priority: string;
}

interface Analysis {
  faqs: FAQ[];
  clusters: Cluster[];
  sentiment: Sentiment;
  summary: string;
  contentRecommendations?: ContentRecommendation[];
  misinformationAnalysis?: MisinformationAnalysis;
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
      y += summaryLines.length * 4 + 10;

      // Content Recommendations
      if (report.analysis.contentRecommendations && report.analysis.contentRecommendations.length > 0) {
        if (y > 240) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFontSize(12);
        pdf.text('Content Ideas', margin, y);
        y += 7;
        pdf.setFontSize(9);
        report.analysis.contentRecommendations.forEach((rec) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          const recLines = pdf.splitTextToSize(`• ${rec.title} [${rec.priority}]`, contentWidth - 5);
          pdf.text(recLines, margin + 5, y);
          y += recLines.length * 4 + 2;
          const reasonLines = pdf.splitTextToSize(rec.reasoning, contentWidth - 10);
          pdf.setFontSize(8);
          pdf.text(reasonLines, margin + 10, y);
          pdf.setFontSize(9);
          y += reasonLines.length * 4 + 4;
        });
        y += 5;
      }

      // Misinformation Analysis
      if (report.analysis.misinformationAnalysis) {
        if (y > 220) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFontSize(12);
        pdf.setTextColor(220, 38, 38); // Red
        pdf.text('Misinformation Analysis', margin, y);
        y += 7;
        
        // Truth Health Score
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Truth Health Score: ${report.analysis.misinformationAnalysis.truthHealthScore}/100`, margin + 5, y);
        y += 5;
        pdf.text(`Risk Level: ${report.analysis.misinformationAnalysis.riskLevel.toUpperCase()}`, margin + 5, y);
        y += 10;

        // Flagged Comments
        if (report.analysis.misinformationAnalysis.flaggedComments.length > 0) {
          pdf.setFontSize(10);
          pdf.text('Flagged Comments:', margin + 5, y);
          y += 6;
          pdf.setFontSize(8);
          report.analysis.misinformationAnalysis.flaggedComments.slice(0, 5).forEach((flagged) => {
            if (y > 270) {
              pdf.addPage();
              y = 20;
            }
            const commentLines = pdf.splitTextToSize(`"${flagged.comment}"`, contentWidth - 10);
            pdf.text(commentLines, margin + 10, y);
            y += commentLines.length * 4 + 2;
            pdf.text(`Type: ${flagged.type} | Severity: ${flagged.severity}`, margin + 10, y);
            y += 4;
            const reasonLines = pdf.splitTextToSize(flagged.reasoning, contentWidth - 10);
            pdf.text(reasonLines, margin + 10, y);
            y += reasonLines.length * 4 + 5;
          });
          y += 5;
        }

        // Common Themes
        if (report.analysis.misinformationAnalysis.commonThemes.length > 0) {
          if (y > 250) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFontSize(10);
          pdf.text('Common Misinformation Themes:', margin + 5, y);
          y += 6;
          pdf.setFontSize(8);
          report.analysis.misinformationAnalysis.commonThemes.forEach((theme) => {
            pdf.text(`• ${theme.theme} (${theme.count} instances)`, margin + 10, y);
            y += 5;
          });
          y += 5;
        }

        // Fact-Check Suggestions
        if (report.analysis.misinformationAnalysis.suggestedFactChecks.length > 0) {
          if (y > 240) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFontSize(10);
          pdf.text('Suggested Fact-Checks:', margin + 5, y);
          y += 6;
          pdf.setFontSize(8);
          report.analysis.misinformationAnalysis.suggestedFactChecks.forEach((factCheck) => {
            if (y > 270) {
              pdf.addPage();
              y = 20;
            }
            const topicLines = pdf.splitTextToSize(`• ${factCheck.topic}`, contentWidth - 10);
            pdf.text(topicLines, margin + 10, y);
            y += topicLines.length * 4 + 2;
            pdf.setTextColor(100, 100, 100);
            pdf.text(factCheck.factCheckUrl, margin + 10, y);
            y += 5;
            pdf.setTextColor(0, 0, 0);
          });
        }
      }

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
