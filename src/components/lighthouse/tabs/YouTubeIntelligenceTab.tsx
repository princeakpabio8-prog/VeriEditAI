import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Search, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { YouTubeReportExport } from "@/components/youtube/YouTubeReportExport";

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

export function YouTubeIntelligenceTab() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<YouTubeReport | null>(null);

  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-analyze-comments', {
        body: { youtubeUrl }
      });

      if (error) throw error;
      
      setReport(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to analyze comments");
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = report ? [
    { name: 'Positive', value: report.analysis.sentiment.positive, color: '#10b981' },
    { name: 'Neutral', value: report.analysis.sentiment.neutral, color: '#6b7280' },
    { name: 'Negative', value: report.analysis.sentiment.negative, color: '#ef4444' }
  ] : [];

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-primary" />
            <CardTitle>YouTube Comment Intelligence</CardTitle>
          </div>
          <CardDescription>
            Analyze YouTube video comments to extract audience insights, FAQs, sentiment, and trending topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Paste YouTube video URL..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <>Analyzing...</>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{report.videoTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Analyzed {report.commentCount.toLocaleString()} of {report.totalComments.toLocaleString()} comments
              </p>
            </div>
            <YouTubeReportExport report={report} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.analysis.faqs.slice(0, 10).map((faq, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <p className="text-sm flex-1">{faq.question}</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full shrink-0">
                        {faq.frequency}×
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Sentiment Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
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
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Comment Clusters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.analysis.clusters.map((cluster, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{cluster.theme}</h4>
                      <span className="text-xs text-muted-foreground">{cluster.count} comments</span>
                    </div>
                    <div className="space-y-1">
                      {cluster.samples.map((sample, sIdx) => (
                        <p key={sIdx} className="text-sm text-muted-foreground pl-4 border-l-2 border-border">
                          "{sample}"
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">Intelligence Brief</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{report.analysis.summary}</p>
            </CardContent>
          </Card>
        </>
      )}

      {!report && !loading && (
        <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Youtube className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a YouTube video URL above to analyze its comments and extract valuable audience insights
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
