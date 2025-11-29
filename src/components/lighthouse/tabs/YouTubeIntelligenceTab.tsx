import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Search, AlertCircle, Lightbulb, Shield, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
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

interface ContentRecommendation {
  title: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

interface FlaggedComment {
  comment: string;
  type: 'conspiracy_theory' | 'unverified_claim' | 'medical_misinfo' | 'political_misinfo' | 'scam' | 'fake_news';
  severity: 'low' | 'medium' | 'high';
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
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flaggedComments: FlaggedComment[];
  commonThemes: MisinfoTheme[];
  suggestedFactChecks: FactCheckSuggestion[];
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

export function YouTubeIntelligenceTab() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<YouTubeReport | null>(null);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);

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

          {/* Truth Health Score */}
          {report.analysis.misinformationAnalysis && (
            <Card className="mt-6 border-border/50 bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Truth Health Score</CardTitle>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.analysis.misinformationAnalysis.riskLevel === 'low' ? 'bg-green-500/10 text-green-500' :
                    report.analysis.misinformationAnalysis.riskLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                    report.analysis.misinformationAnalysis.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {report.analysis.misinformationAnalysis.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`relative w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${
                      report.analysis.misinformationAnalysis.truthHealthScore >= 75 ? 'bg-green-500/20 text-green-500' :
                      report.analysis.misinformationAnalysis.truthHealthScore >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                      report.analysis.misinformationAnalysis.truthHealthScore >= 25 ? 'bg-orange-500/20 text-orange-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {report.analysis.misinformationAnalysis.truthHealthScore}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            report.analysis.misinformationAnalysis.truthHealthScore >= 75 ? 'bg-green-500' :
                            report.analysis.misinformationAnalysis.truthHealthScore >= 50 ? 'bg-yellow-500' :
                            report.analysis.misinformationAnalysis.truthHealthScore >= 25 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${report.analysis.misinformationAnalysis.truthHealthScore}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {report.analysis.misinformationAnalysis.truthHealthScore >= 75 ? 'Healthy discourse with minimal misinformation' :
                         report.analysis.misinformationAnalysis.truthHealthScore >= 50 ? 'Moderate concerns, some misinformation present' :
                         report.analysis.misinformationAnalysis.truthHealthScore >= 25 ? 'Significant misinformation detected' :
                         'Critical misinformation levels detected'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

          {report.analysis.contentRecommendations && report.analysis.contentRecommendations.length > 0 && (
            <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Content Ideas</CardTitle>
                <CardDescription>Video topics that would resonate with this audience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.analysis.contentRecommendations.map((rec, idx) => (
                    <div key={idx} className="space-y-2 p-3 rounded-lg border border-border/50 bg-background/40">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm flex-1">{rec.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                          rec.priority === 'high' ? 'bg-primary/10 text-primary' :
                          rec.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flagged Comments & Misinformation Themes */}
          {report.analysis.misinformationAnalysis && report.analysis.misinformationAnalysis.flaggedComments.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-border/50 bg-background/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-sm font-medium">Flagged Comments ({report.analysis.misinformationAnalysis.flaggedComments.length})</CardTitle>
                  </div>
                  <CardDescription>Comments containing potential misinformation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.analysis.misinformationAnalysis.flaggedComments.map((flagged, idx) => {
                      const isExpanded = expandedComments.includes(idx);
                      const commentPreview = flagged.comment.length > 120 ? flagged.comment.slice(0, 120) + '...' : flagged.comment;
                      
                      return (
                        <div key={idx} className="p-3 rounded-lg border border-border/50 bg-background/40 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${
                              flagged.type === 'conspiracy_theory' ? 'bg-purple-500/10 text-purple-400' :
                              flagged.type === 'medical_misinfo' ? 'bg-red-500/10 text-red-400' :
                              flagged.type === 'political_misinfo' ? 'bg-blue-500/10 text-blue-400' :
                              flagged.type === 'scam' ? 'bg-orange-500/10 text-orange-400' :
                              flagged.type === 'fake_news' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {flagged.type.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              flagged.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                              flagged.severity === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                              'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {flagged.severity}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80">"{isExpanded ? flagged.comment : commentPreview}"</p>
                          {flagged.comment.length > 120 && (
                            <button
                              onClick={() => setExpandedComments(prev => 
                                isExpanded ? prev.filter(i => i !== idx) : [...prev, idx]
                              )}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                          <p className="text-xs text-muted-foreground">{flagged.reasoning}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Misinfo Themes</CardTitle>
                  <CardDescription>Common misinformation patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.analysis.misinformationAnalysis.commonThemes.map((theme, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-background/40">
                        <span className="text-sm">{theme.theme}</span>
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {theme.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Fact-Check Resources */}
          {report.analysis.misinformationAnalysis && report.analysis.misinformationAnalysis.suggestedFactChecks.length > 0 && (
            <Card className="border-border/50 bg-background/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-cyan-400" />
                  <CardTitle className="text-sm font-medium">Suggested Fact-Checks</CardTitle>
                </div>
                <CardDescription>Recommended fact-checking resources for detected claims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.analysis.misinformationAnalysis.suggestedFactChecks.map((factCheck, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border/50 bg-background/40">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm flex-1">{factCheck.topic}</h4>
                        <a
                          href={factCheck.factCheckUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground">{factCheck.relevance}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
