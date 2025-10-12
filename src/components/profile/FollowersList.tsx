import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface User {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface FollowersListProps {
  userId: string;
  followersCount: number;
  followingCount: number;
}

export const FollowersList = ({ userId, followersCount, followingCount }: FollowersListProps) => {
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollows = async () => {
      setLoading(true);

      // Fetch followers
      const { data: followersData } = await supabase
        .from('user_follows')
        .select('follower_id, profiles!user_follows_follower_id_fkey(user_id, full_name, avatar_url)')
        .eq('following_id', userId);

      // Fetch following
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id, profiles!user_follows_following_id_fkey(user_id, full_name, avatar_url)')
        .eq('follower_id', userId);

      if (followersData) {
        setFollowers(
          followersData
            .map((f: any) => f.profiles)
            .filter((p: any) => p !== null)
        );
      }

      if (followingData) {
        setFollowing(
          followingData
            .map((f: any) => f.profiles)
            .filter((p: any) => p !== null)
        );
      }

      setLoading(false);
    };

    fetchFollows();
  }, [userId]);

  const renderUserList = (users: User[]) => (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3 pr-4">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No users to show</p>
        ) : (
          users.map((user) => (
            <Link
              key={user.user_id}
              to={`/profile/${user.user_id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <UserAvatar
                avatarUrl={user.avatar_url}
                fullName={user.full_name}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.full_name || 'Anonymous User'}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </ScrollArea>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social</CardTitle>
        <CardDescription>Followers and following</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="followers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="followers">
                Followers ({followersCount})
              </TabsTrigger>
              <TabsTrigger value="following">
                Following ({followingCount})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="followers" className="mt-4">
              {renderUserList(followers)}
            </TabsContent>
            <TabsContent value="following" className="mt-4">
              {renderUserList(following)}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
