import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BarChart3, TrendingUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SentimentData {
  name: string;
  value: number;
  color: string;
}

interface ClaimTypeData {
  name: string;
  value: number;
  color: string;
}

export const AIAnalyticsDashboard = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [claimTypeData, setClaimTypeData] = useState<ClaimTypeData[]>([]);
  const [topEntities, setTopEntities] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch sentiment distribution
      const { data: verifications } = await supabase
        .from('verifications')
        .select('sentiment_label, claim_type, detected_entities')
        .not('sentiment_label', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);

      if (verifications) {
        // Process sentiment data
        const sentimentCounts: Record<string, number> = {};
        const claimTypeCounts: Record<string, number> = {};
        const entityCounts: Record<string, number> = {};

        verifications.forEach((v) => {
          // Sentiment
          if (v.sentiment_label) {
            const label = v.sentiment_label.toLowerCase().includes('positive') ? 'Positive' :
                         v.sentiment_label.toLowerCase().includes('negative') ? 'Negative' : 'Neutral';
            sentimentCounts[label] = (sentimentCounts[label] || 0) + 1;
          }

          // Claim Type
          if (v.claim_type) {
            claimTypeCounts[v.claim_type] = (claimTypeCounts[v.claim_type] || 0) + 1;
          }

          // Entities
          if (v.detected_entities && typeof v.detected_entities === 'object' && !Array.isArray(v.detected_entities)) {
            const entities = v.detected_entities as any;
            const allEntities = [
              ...(entities.people || []),
              ...(entities.organizations || []),
              ...(entities.locations || []),
            ];
            allEntities.forEach((entity: string) => {
              entityCounts[entity] = (entityCounts[entity] || 0) + 1;
            });
          }
        });

        // Convert to chart data
        setSentimentData([
          { name: 'Positive', value: sentimentCounts['Positive'] || 0, color: '#22c55e' },
          { name: 'Neutral', value: sentimentCounts['Neutral'] || 0, color: '#94a3b8' },
          { name: 'Negative', value: sentimentCounts['Negative'] || 0, color: '#ef4444' },
        ]);

        const claimTypes = Object.entries(claimTypeCounts).map(([name, value]) => ({
          name,
          value,
          color: name.toLowerCase().includes('fact') ? '#22c55e' :
                 name.toLowerCase().includes('opinion') ? '#a855f7' :
                 name.toLowerCase().includes('statistic') ? '#3b82f6' : '#f59e0b'
        }));
        setClaimTypeData(claimTypes);

        // Top 10 entities
        const topEntitiesArray = Object.entries(entityCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }));
        setTopEntities(topEntitiesArray);
      }
    } catch (error) {
      console.error('Error fetching AI analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSentiment = sentimentData.reduce((sum, d) => sum + d.value, 0);
  const totalClaimTypes = claimTypeData.reduce((sum, d) => sum + d.value, 0);

  if (totalSentiment === 0 && totalClaimTypes === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No AI analysis data available yet. Verify some content to see analytics!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Sentiment Distribution */}
      {totalSentiment > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sentiment Analysis
            </CardTitle>
            <CardDescription>Distribution of content sentiment across verifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Claim Type Distribution */}
      {totalClaimTypes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Claim Types
            </CardTitle>
            <CardDescription>Breakdown of claim categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={claimTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {claimTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Entities */}
      {topEntities.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Most Mentioned Entities
            </CardTitle>
            <CardDescription>Top people, organizations, and locations across all verifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {topEntities.map((entity, idx) => (
                <Badge 
                  key={idx} 
                  variant="secondary" 
                  className="text-sm px-3 py-1.5"
                  style={{ 
                    fontSize: `${Math.max(12, Math.min(18, 12 + entity.count))}px`,
                    opacity: Math.max(0.6, Math.min(1, entity.count / Math.max(...topEntities.map(e => e.count))))
                  }}
                >
                  {entity.name} ({entity.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
