import { Flame, Trophy, Snowflake } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useStreaks } from '@/hooks/useStreaks';
import { Skeleton } from '@/components/ui/skeleton';

export function StreakDisplay() {
  const { streak, isLoading } = useStreaks();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!streak) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Start Your Streak
          </CardTitle>
          <CardDescription>
            Verify a claim today to start your verification streak!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentStreak = streak.current_streak;
  const longestStreak = streak.longest_streak;
  const freezeCount = streak.streak_freeze_count;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Flame className="h-6 w-6 text-orange-500 animate-pulse" />
            {currentStreak} Day Streak
          </CardTitle>
          <CardDescription>
            Keep verifying daily to maintain your streak
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Personal Best</p>
                <p className="text-2xl font-bold">{longestStreak} days</p>
              </div>
            </div>
            
            {freezeCount > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Snowflake className="h-3 w-3" />
                {freezeCount} Freezes Left
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Streak Progress</span>
              <span className="text-muted-foreground">
                Next milestone: {Math.ceil(currentStreak / 7) * 7} days
              </span>
            </div>
            <Progress 
              value={(currentStreak % 7) * (100 / 7)} 
              className="h-2"
            />
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const isCompleted = i < (currentStreak % 7);
              return (
                <div
                  key={i}
                  className={`h-8 rounded ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                      : 'bg-muted'
                  }`}
                />
              );
            })}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
