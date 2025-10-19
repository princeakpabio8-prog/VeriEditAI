import { useState } from 'react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeaderboard, LeaderboardPeriod } from '@/hooks/useLeaderboard';

export function LeaderboardCard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const { leaderboard, isLoading } = useLeaderboard(period);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          Top verifiers earning points and recognition
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value={period} className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No entries yet. Be the first!</p>
              </div>
            ) : (
              leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                    entry.rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-primary/0' : ''
                  }`}
                >
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.profiles?.avatar_url} />
                    <AvatarFallback>
                      {entry.profiles?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.profiles?.full_name || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{entry.verification_count} verifications</span>
                      {entry.trust_score_avg && (
                        <span>• {entry.trust_score_avg.toFixed(0)}% avg trust</span>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="font-bold">
                    {entry.points} pts
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
