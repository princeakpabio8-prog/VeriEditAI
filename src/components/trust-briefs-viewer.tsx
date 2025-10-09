import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface TrustBrief {
  id: string;
  week_start: string;
  week_end: string;
  brief_content: string;
  metadata: any;
  created_at: string;
}

export function TrustBriefsViewer() {
  const [briefs, setBriefs] = useState<TrustBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<TrustBrief | null>(null);

  useEffect(() => {
    async function fetchBriefs() {
      try {
        const { data, error } = await supabase
          .from('trust_briefs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setBriefs(data || []);
        if (data && data.length > 0) {
          setSelectedBrief(data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch trust briefs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBriefs();
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (briefs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Trust Briefs Generated Yet</CardTitle>
          <CardDescription>
            Weekly trust briefs are automatically generated every Sunday. Check back soon.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Brief List */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Weekly Briefs
          </CardTitle>
          <CardDescription>AI-generated intelligence reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {briefs.map(brief => {
            const weekStart = new Date(brief.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const weekEnd = new Date(brief.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const isSelected = selectedBrief?.id === brief.id;
            
            return (
              <button
                key={brief.id}
                onClick={() => setSelectedBrief(brief)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    {weekStart} - {weekEnd}
                  </div>
                  {isSelected && <Badge variant="default" className="text-xs">Current</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trust Index: {brief.metadata?.global_trust_index || 'N/A'}
                  {brief.metadata?.trust_score_change && (
                    <span className={brief.metadata.trust_score_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {' '}({brief.metadata.trust_score_change >= 0 ? '+' : ''}{brief.metadata.trust_score_change.toFixed(1)}%)
                    </span>
                  )}
                </p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Brief Content */}
      <Card className="md:col-span-2">
        {selectedBrief && (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Weekly Trust Intelligence Brief
                </CardTitle>
                <Badge variant="outline">
                  {new Date(selectedBrief.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                  {new Date(selectedBrief.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Badge>
              </div>
              <CardDescription>
                AI-generated analysis of global trust trends and misinformation patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{selectedBrief.brief_content}</ReactMarkdown>
              </div>
              
              {selectedBrief.metadata?.misinformation_trends && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Key Metrics</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Global Trust Index</p>
                      <p className="text-lg font-bold">{selectedBrief.metadata.global_trust_index}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Week-over-Week Change</p>
                      <p className={`text-lg font-bold ${selectedBrief.metadata.trust_score_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedBrief.metadata.trust_score_change >= 0 ? '+' : ''}{selectedBrief.metadata.trust_score_change.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}