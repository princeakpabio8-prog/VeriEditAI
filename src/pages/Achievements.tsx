import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Users, Gem, Sparkles, Lock, RefreshCw } from 'lucide-react';
import * as Icons from 'lucide-react';
import { toast } from 'sonner';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { LeaderboardCard } from '@/components/gamification/LeaderboardCard';
import { ViralClaimsDashboard } from '@/components/viral/ViralClaimsDashboard';
import { Navigation } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: string;
  achievement_key: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  icon_name: string;
  points: number;
  requirement_value: number;
}

interface UserAchievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  progress_current: number;
  progress_required: number;
  achievements: Achievement;
}

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-700 text-white',
  silver: 'bg-gray-400 text-gray-900',
  gold: 'bg-yellow-500 text-gray-900',
  platinum: 'bg-cyan-400 text-gray-900',
  diamond: 'bg-blue-600 text-white',
};

const tierGradients: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-400 to-blue-500',
  diamond: 'from-blue-500 to-purple-600',
};

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    try {
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch user's earned achievements
      const { data: earned, error: earnedError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', user!.id);

      if (earnedError) throw earnedError;

      setAchievements(allAchievements || []);
      setUserAchievements(earned || []);

      // Calculate total points
      const points = earned?.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0) || 0;
      setTotalPoints(points);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLeaderboards = async () => {
    try {
      toast.loading('Updating leaderboards...', { id: 'refresh-leaderboards' });
      const { error } = await supabase.functions.invoke('update-leaderboards');
      
      if (error) throw error;
      
      toast.success('Leaderboards updated!', { id: 'refresh-leaderboards' });
      
      // Refresh the page to show new data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error updating leaderboards:', error);
      toast.error('Failed to update leaderboards', { id: 'refresh-leaderboards' });
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Trophy;
    return <Icon className="w-8 h-8" />;
  };

  const isEarned = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievementId: string) => {
    const ua = userAchievements.find(ua => ua.achievement_id === achievementId);
    return ua ? (ua.progress_current / ua.progress_required) * 100 : 0;
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const completionRate = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* New Gamification Features */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Leaderboards & Streaks</h2>
          <Button onClick={handleRefreshLeaderboards} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Update Leaderboards
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <StreakDisplay />
          <LeaderboardCard />
        </div>

        <ViralClaimsDashboard />

        {/* Original Achievements */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                Achievements
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Track your progress and unlock rewards
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">{earnedCount}/{totalCount}</div>
              <div className="text-sm text-muted-foreground">Achievements Unlocked</div>
              <Progress value={completionRate} className="mt-2" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {userAchievements.filter(ua => ua.achievements?.tier === 'gold' || ua.achievements?.tier === 'platinum' || ua.achievements?.tier === 'diamond').length}
              </div>
              <div className="text-sm text-muted-foreground">Rare Achievements</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {new Set(userAchievements.map(ua => ua.achievements?.category)).size}
              </div>
              <div className="text-sm text-muted-foreground">Categories Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="nft">NFT</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="contribution">Contribution</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const earned = isEarned(achievement.id);
              const progress = getProgress(achievement.id);

              return (
                <Card
                  key={achievement.id}
                  className={`relative overflow-hidden transition-all hover:scale-105 ${
                    earned ? 'border-primary shadow-lg' : 'opacity-75'
                  }`}
                >
                  {/* Tier gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${tierGradients[achievement.tier]} opacity-10`}
                  />

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-lg ${
                          earned
                            ? `bg-gradient-to-br ${tierGradients[achievement.tier]}`
                            : 'bg-muted'
                        }`}
                      >
                        {earned ? (
                          getAchievementIcon(achievement.icon_name)
                        ) : (
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <Badge className={tierColors[achievement.tier]}>
                        {achievement.tier}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{achievement.name}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {achievement.points} points
                      </span>
                      {earned ? (
                        <Badge variant="outline" className="text-green-600">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : progress > 0 ? (
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      ) : null}
                    </div>
                    {!earned && progress > 0 && (
                      <Progress value={progress} className="mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No achievements in this category yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
