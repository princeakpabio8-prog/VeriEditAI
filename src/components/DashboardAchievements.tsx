import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function DashboardAchievements() {
  const { achievements, totalPoints, loading } = useAchievements();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentAchievements = achievements.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Recent Achievements
          </CardTitle>
          <Badge variant="secondary">
            {totalPoints} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-4">No achievements yet</p>
            <Link to="/achievements">
              <Button variant="outline" size="sm">
                View All Achievements
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAchievements.map((ua) => (
              <div
                key={ua.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="text-2xl">
                  {ua.achievements?.tier === 'diamond' ? '💠' :
                   ua.achievements?.tier === 'platinum' ? '💎' :
                   ua.achievements?.tier === 'gold' ? '🥇' :
                   ua.achievements?.tier === 'silver' ? '🥈' :
                   '🥉'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {ua.achievements?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(ua.earned_at).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  +{ua.achievements?.points}
                </Badge>
              </div>
            ))}
            
            <Link to="/achievements" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                View All ({achievements.length})
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
