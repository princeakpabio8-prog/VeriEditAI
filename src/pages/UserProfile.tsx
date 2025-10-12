import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { FollowButton } from '@/components/profile/FollowButton';
import { FollowersList } from '@/components/profile/FollowersList';
import { Loader2, Building2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  company: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If viewing own profile, redirect to /profile
    if (currentUser && userId === currentUser.id) {
      navigate('/profile');
      return;
    }

    const fetchProfile = async () => {
      if (!userId) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, company, avatar_url, followers_count, following_count')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>This user profile does not exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <UserAvatar
                avatarUrl={profile.avatar_url}
                fullName={profile.full_name}
                size="xl"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {profile.full_name || 'Anonymous User'}
                  </h1>
                  {profile.company && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{profile.followers_count}</strong> Followers
                    </span>
                  </div>
                  <div className="text-sm">
                    <strong>{profile.following_count}</strong> Following
                  </div>
                </div>

                <FollowButton targetUserId={profile.user_id} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Followers/Following Lists */}
        <FollowersList
          userId={profile.user_id}
          followersCount={profile.followers_count}
          followingCount={profile.following_count}
        />
      </div>
    </div>
  );
};

export default UserProfile;
