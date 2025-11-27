import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Youtube, Download, AlertCircle, Loader2, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { YouTubeReportExport } from '@/components/youtube/YouTubeReportExport';

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

export default function YouTubeIntelligence() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<YouTubeReport | null>(null);

  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setReport(null);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-analyze-comments', {
        body: { youtubeUrl }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setReport(data);
      toast.success('Analysis complete!', {
        description: `Analyzed ${data.commentCount} comments`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = report?.analysis.sentiment ? [
    { name: 'Positive', value: report.analysis.sentiment.positive, color: '#10b981' },
    { name: 'Neutral', value: report.analysis.sentiment.neutral, color: '#6b7280' },
    { name: 'Negative', value: report.analysis.sentiment.negative, color: '#ef4444' }
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Youtube className="h-8 w-8 text-red-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">
              YouTube Intelligence
            </h1>
          </div>
          <p className="text-muted-foreground">
            Analyze YouTube comments with AI-powered insights and sentiment analysis
          </p>
        </div>

        {/* Input Section */}
        <Card className="p-6 mb-8 bg-card/50 backdrop-blur border-border/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="url"
              placeholder="Paste YouTube video URL..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1"
              disabled={loading}
            />
            <Button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze Comments
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Report Section */}
        {report && (
          <div className="space-y-6">
            {/* Video Info & Export */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{report.videoTitle}</h2>
                <p className="text-muted-foreground">
                  Analyzed {report.commentCount.toLocaleString()} of {report.totalComments.toLocaleString()} comments
                </p>
              </div>
              <YouTubeReportExport report={report} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Questions (FAQs) */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <h3 className="text-xl font-bold">Top Questions</h3>
                </div>
                <div className="space-y-3">
                  {report.analysis.faqs.slice(0, 10).map((faq, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{faq.question}</p>
                        <span className="text-xs text-muted-foreground">
                          Asked {faq.frequency} {faq.frequency === 1 ? 'time' : 'times'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Sentiment Analysis */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-xl font-bold">Sentiment Snapshot</h3>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Comment Clusters */}
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-xl font-bold">Comment Clusters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.analysis.clusters.map((cluster, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-background/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">{cluster.theme}</h4>
                        <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold">
                          {cluster.count} comments
                        </span>
                      </div>
                      <div className="space-y-2">
                        {cluster.samples.map((sample, sIdx) => (
                          <div key={sIdx} className="text-sm text-muted-foreground pl-3 border-l-2 border-border">
                            "{sample}"
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Insight Summary */}
              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur border-border/50 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-purple-400" />
                  <h3 className="text-xl font-bold">Intelligence Brief</h3>
                </div>
                <p className="text-foreground/90 leading-relaxed">
                  {report.analysis.summary}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!report && !loading && (
          <div className="text-center py-16">
            <Youtube className="h-24 w-24 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
            <p className="text-muted-foreground">
              Enter a YouTube URL above to get started with comment intelligence
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
