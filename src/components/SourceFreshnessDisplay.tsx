import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SourceFreshnessProps {
  verificationId: string | null;
}

interface SourceAgeDistribution {
  recent: number;
  one_to_three_years: number;
  three_to_five_years: number;
  over_five_years: number;
  unknown: number;
  average_age_days: number;
  oldest_source_year: number;
  newest_source_year: number;
}

export const SourceFreshnessDisplay: React.FC<SourceFreshnessProps> = ({ verificationId }) => {
  const [ageDistribution, setAgeDistribution] = useState<SourceAgeDistribution | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!verificationId) return;

    const fetchSourceAges = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_source_age_distribution', {
          verification_uuid: verificationId
        });

        if (error) throw error;
        setAgeDistribution(data as unknown as SourceAgeDistribution);
      } catch (error) {
        console.error('Error fetching source age distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSourceAges();
  }, [verificationId]);

  if (loading || !ageDistribution) return null;

  const totalSources = ageDistribution.recent + ageDistribution.one_to_three_years + 
                      ageDistribution.three_to_five_years + ageDistribution.over_five_years + 
                      ageDistribution.unknown;

  if (totalSources === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Source Freshness Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Average Source Age:</span>
          <Badge variant="outline">
            {Math.round(ageDistribution.average_age_days / 365)} years
          </Badge>
        </div>

        {ageDistribution.oldest_source_year && ageDistribution.newest_source_year && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Source Range:
            </span>
            <Badge variant="outline">
              {ageDistribution.oldest_source_year} - {ageDistribution.newest_source_year}
            </Badge>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Age Distribution:</h4>
          
          {ageDistribution.recent > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recent (last year):</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {ageDistribution.recent} sources
              </Badge>
            </div>
          )}

          {ageDistribution.one_to_three_years > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">1-3 years old:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {ageDistribution.one_to_three_years} sources
              </Badge>
            </div>
          )}

          {ageDistribution.three_to_five_years > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">3-5 years old:</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {ageDistribution.three_to_five_years} sources
              </Badge>
            </div>
          )}

          {ageDistribution.over_five_years > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Over 5 years:</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                {ageDistribution.over_five_years} sources
              </Badge>
            </div>
          )}

          {ageDistribution.unknown > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unknown date:</span>
              <Badge variant="secondary">
                {ageDistribution.unknown} sources
              </Badge>
            </div>
          )}
        </div>

        {ageDistribution.recent > totalSources * 0.7 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800">
              ✓ Majority of sources are recent, increasing reliability
            </p>
          </div>
        )}

        {ageDistribution.over_five_years > totalSources * 0.5 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠ Many sources are dated - consider seeking more recent information
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
