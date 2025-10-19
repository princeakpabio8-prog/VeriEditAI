import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Sparkles } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const tierEmojis: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '💠',
};

export function ProfileAchievements() {
  const { achievements, totalPoints, loading, getTopAchievements } = useAchievements();
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const topAchievements = getTopAchievements();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievements
          </CardTitle>
          <Badge variant="secondary">
            {totalPoints} points
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {achievements.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No achievements yet</p>
            <p className="text-xs">Start verifying to unlock achievements!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {topAchievements.map((ua) => (
                <div
                  key={ua.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="text-2xl">
                    {tierEmojis[ua.achievements?.tier] || '🏆'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {ua.achievements?.name}
                      {['platinum', 'diamond'].includes(ua.achievements?.tier) && (
                        <Sparkles className="w-3 h-3 text-primary" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +{ua.achievements?.points} points
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {ua.achievements?.tier}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{achievements.length} unlocked</span>
              </div>
              <Link to="/achievements">
                <Button variant="outline" size="sm" className="w-full">
                  View All Achievements
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
